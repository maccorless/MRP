"use server";

import { redirect } from "next/navigation";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/db";
import { applications, auditLog, magicLinkTokens, orgSlotAllocations, dismissedDuplicatePairs, organizations } from "@/db/schema";
import { requireNocSession, requireWritable } from "@/lib/session";
import { ineligibilityFlags } from "@/lib/eligibility";
import { generateToken, hashToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/email";

async function getApplicationForNoc(id: string, nocCode: string) {
  const [app] = await db
    .select()
    .from(applications)
    .where(and(eq(applications.id, id), eq(applications.nocCode, nocCode)));
  return app;
}

export async function approveApplication(formData: FormData) {
  await requireWritable();
  const session = await requireNocSession();
  const id = formData.get("id") as string;

  const app = await getApplicationForNoc(id, session.nocCode);
  if (!app || (app.status !== "pending" && app.status !== "resubmitted")) {
    redirect("/admin/noc/queue");
  }

  // Server-side eligibility-flag enforcement: if the application has any
  // soft-warn flag (currently: government .gov email domain), the NOC must
  // tick the acknowledgement checkbox in the drawer before we accept the
  // approval. The drawer's `required` attribute handles the happy path; this
  // is the defence-in-depth check.
  const [org] = await db
    .select({ orgEmail: organizations.orgEmail })
    .from(organizations)
    .where(eq(organizations.id, app.organizationId));
  const flags = ineligibilityFlags({
    contactEmail: app.contactEmail,
    orgEmail: org?.orgEmail ?? null,
    secondaryContactEmail: app.secondaryEmail,
  });
  if (flags.length > 0) {
    const ack = formData.get("ack_eligibility_flag");
    if (ack !== "1") redirect(`/admin/noc/${id}?error=eligibility_ack_required`);
  }

  const internalNote = (formData.get("internal_note") as string)?.trim() || null;
  const now = new Date();

  await db.transaction(async (tx) => {
    // Optimistic lock: only update if status hasn't changed since we read it
    const [updated] = await tx
      .update(applications)
      .set({
        status: "approved",
        internalNote,
        reviewedAt: now,
        reviewedBy: session.userId,
        updatedAt: now,
      })
      .where(and(eq(applications.id, id), eq(applications.status, app.status)))
      .returning({ id: applications.id });

    if (!updated) redirect(`/admin/noc/${id}?error=stale`);

    await tx.insert(auditLog).values({
      actorType: "noc_admin",
      actorId: session.userId,
      actorLabel: session.displayName,
      action: "application_approved",
      applicationId: id,
      organizationId: app.organizationId,
    });
  });

  redirect("/admin/noc/queue?success=approved");
}

export async function returnApplication(formData: FormData) {
  await requireWritable();
  const session = await requireNocSession();
  const id = formData.get("id") as string;
  const note = (formData.get("note") as string)?.trim();

  if (!note) redirect(`/admin/noc/${id}?error=note_required`);

  const app = await getApplicationForNoc(id, session.nocCode);
  if (!app || (app.status !== "pending" && app.status !== "resubmitted")) {
    redirect("/admin/noc/queue");
  }

  const now = new Date();

  await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(applications)
      .set({
        status: "returned",
        reviewNote: note,
        reviewedAt: now,
        reviewedBy: session.userId,
        updatedAt: now,
      })
      .where(and(eq(applications.id, id), eq(applications.status, app.status)))
      .returning({ id: applications.id });

    if (!updated) redirect(`/admin/noc/${id}?error=stale`);

    await tx.insert(auditLog).values({
      actorType: "noc_admin",
      actorId: session.userId,
      actorLabel: session.displayName,
      action: "application_returned",
      applicationId: id,
      organizationId: app.organizationId,
      detail: note,
    });
  });

  redirect("/admin/noc/queue?success=returned");
}

export async function rejectApplication(formData: FormData) {
  await requireWritable();
  const session = await requireNocSession();
  const id = formData.get("id") as string;
  const note = (formData.get("note") as string)?.trim();

  if (!note) redirect(`/admin/noc/${id}?error=note_required`);

  const app = await getApplicationForNoc(id, session.nocCode);
  if (!app || (app.status !== "pending" && app.status !== "resubmitted")) {
    redirect("/admin/noc/queue");
  }

  const now = new Date();

  await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(applications)
      .set({
        status: "rejected",
        reviewNote: note,
        reviewedAt: now,
        reviewedBy: session.userId,
        updatedAt: now,
      })
      .where(and(eq(applications.id, id), eq(applications.status, app.status)))
      .returning({ id: applications.id });

    if (!updated) redirect(`/admin/noc/${id}?error=stale`);

    await tx.insert(auditLog).values({
      actorType: "noc_admin",
      actorId: session.userId,
      actorLabel: session.displayName,
      action: "application_rejected",
      applicationId: id,
      organizationId: app.organizationId,
      detail: note,
    });
  });

  redirect("/admin/noc/queue?success=rejected");
}

export async function unApproveApplication(formData: FormData) {
  await requireWritable();
  const session = await requireNocSession();
  const id = formData.get("id") as string;
  const reason = (formData.get("reason") as string)?.trim() || null;

  const app = await getApplicationForNoc(id, session.nocCode);
  if (!app || app.status !== "approved") redirect("/admin/noc/queue");

  const now = new Date();

  await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(applications)
      .set({ status: "pending", reviewNote: null, updatedAt: now })
      .where(and(eq(applications.id, id), eq(applications.status, "approved")))
      .returning({ id: applications.id });

    if (!updated) redirect(`/admin/noc/${id}?error=stale`);

    // Revert any draft/submitted allocation for this org back to draft so the
    // NOC can edit and resubmit without losing their slot data.
    await tx
      .update(orgSlotAllocations)
      .set({ pbnState: "draft" })
      .where(
        and(
          eq(orgSlotAllocations.organizationId, app.organizationId),
          eq(orgSlotAllocations.eventId, "LA28"),
          inArray(orgSlotAllocations.pbnState, ["draft", "noc_submitted"])
        )
      );

    await tx.insert(auditLog).values({
      actorType: "noc_admin",
      actorId: session.userId,
      actorLabel: session.displayName,
      action: "application_unapproved",
      applicationId: id,
      organizationId: app.organizationId,
      detail: reason,
    });
  });

  redirect(`/admin/noc/${id}?success=unapproved`);
}

export async function unReturnApplication(formData: FormData) {
  await requireWritable();
  const session = await requireNocSession();
  const id = formData.get("id") as string;

  const app = await getApplicationForNoc(id, session.nocCode);
  if (!app || app.status !== "returned") redirect("/admin/noc/queue");

  const now = new Date();

  await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(applications)
      .set({ status: "pending", reviewNote: null, updatedAt: now })
      .where(and(eq(applications.id, id), eq(applications.status, "returned")))
      .returning({ id: applications.id });

    if (!updated) redirect(`/admin/noc/${id}?error=stale`);

    await tx.insert(auditLog).values({
      actorType: "noc_admin",
      actorId: session.userId,
      actorLabel: session.displayName,
      action: "application_unreturned",
      applicationId: id,
      organizationId: app.organizationId,
    });
  });

  redirect(`/admin/noc/${id}?success=unreturned`);
}

export async function reverseRejection(formData: FormData) {
  await requireWritable();
  const session = await requireNocSession();
  const id = formData.get("id") as string;

  const app = await getApplicationForNoc(id, session.nocCode);
  if (!app || app.status !== "rejected") redirect("/admin/noc/queue");

  const now = new Date();

  await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(applications)
      .set({ status: "pending", reviewNote: null, reviewedAt: null, reviewedBy: null, updatedAt: now })
      .where(and(eq(applications.id, id), eq(applications.status, "rejected")))
      .returning({ id: applications.id });

    if (!updated) redirect(`/admin/noc/${id}?error=stale`);

    await tx.insert(auditLog).values({
      actorType: "noc_admin",
      actorId: session.userId,
      actorLabel: session.displayName,
      action: "rejection_reversed",
      applicationId: id,
      organizationId: app.organizationId,
    });
  });

  redirect(`/admin/noc/${id}?success=rejection_reversed`);
}

export async function unRejectApplication(formData: FormData) {
  await requireWritable();
  const session = await requireNocSession();
  const id = formData.get("id") as string;
  const note = (formData.get("note") as string)?.trim();

  if (!note) redirect(`/admin/noc/${id}?error=note_required`);

  const app = await getApplicationForNoc(id, session.nocCode);
  if (!app || app.status !== "rejected") redirect("/admin/noc/queue");

  const now = new Date();

  await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(applications)
      .set({ status: "pending", reviewNote: null, reviewedAt: null, reviewedBy: null, updatedAt: now })
      .where(and(eq(applications.id, id), eq(applications.status, "rejected")))
      .returning({ id: applications.id });

    if (!updated) redirect(`/admin/noc/${id}?error=stale`);

    await tx.insert(auditLog).values({
      actorType: "noc_admin",
      actorId: session.userId,
      actorLabel: session.displayName,
      action: "unreject",
      applicationId: id,
      organizationId: app.organizationId,
      detail: note,
    });
  });

  redirect("/admin/noc/queue?success=unrejected");
}

export async function rejectApplicationInline(
  appId: string,
  note: string,
): Promise<{ error?: string }> {
  await requireWritable();
  const session = await requireNocSession();
  if (!note.trim()) return { error: "A note is required to reject an application." };

  const app = await getApplicationForNoc(appId, session.nocCode);
  if (!app) return { error: "Application not found." };
  if (app.status !== "pending" && app.status !== "resubmitted") {
    return { error: `Cannot reject an application with status: ${app.status}.` };
  }

  const now = new Date();
  const [updated] = await db.transaction(async (tx) => {
    const rows = await tx
      .update(applications)
      .set({ status: "rejected", reviewNote: note.trim(), reviewedAt: now, reviewedBy: session.userId, updatedAt: now })
      .where(and(eq(applications.id, appId), eq(applications.status, app.status)))
      .returning({ id: applications.id });

    if (rows[0]) {
      await tx.insert(auditLog).values({
        actorType: "noc_admin",
        actorId: session.userId,
        actorLabel: session.displayName,
        action: "application_rejected",
        applicationId: appId,
        organizationId: app.organizationId,
        detail: note.trim(),
      });
    }
    return rows;
  });

  if (!updated) return { error: "Application status changed before your action could be applied." };
  return {};
}

export async function returnApplicationInline(
  appId: string,
  note: string,
): Promise<{ error?: string }> {
  await requireWritable();
  const session = await requireNocSession();
  if (!note.trim()) return { error: "A note is required to return an application." };

  const app = await getApplicationForNoc(appId, session.nocCode);
  if (!app) return { error: "Application not found." };
  if (app.status !== "pending" && app.status !== "resubmitted") {
    return { error: `Cannot return an application with status: ${app.status}.` };
  }

  const now = new Date();
  const [updated] = await db.transaction(async (tx) => {
    const rows = await tx
      .update(applications)
      .set({ status: "returned", reviewNote: note.trim(), reviewedAt: now, reviewedBy: session.userId, updatedAt: now })
      .where(and(eq(applications.id, appId), eq(applications.status, app.status)))
      .returning({ id: applications.id });

    if (rows[0]) {
      await tx.insert(auditLog).values({
        actorType: "noc_admin",
        actorId: session.userId,
        actorLabel: session.displayName,
        action: "application_returned",
        applicationId: appId,
        organizationId: app.organizationId,
        detail: note.trim(),
      });
    }
    return rows;
  });

  if (!updated) return { error: "Application status changed before your action could be applied." };
  return {};
}

export async function dismissDuplicatePair(orgId1: string, orgId2: string) {
  await requireWritable();
  const session = await requireNocSession();

  // Canonical order: smaller UUID string first (ensures uniqueness regardless of call order)
  const [orgIdA, orgIdB] = orgId1 < orgId2 ? [orgId1, orgId2] : [orgId2, orgId1];

  await db.transaction(async (tx) => {
    // Upsert: if already dismissed, this is a no-op
    await tx
      .insert(dismissedDuplicatePairs)
      .values({
        nocCode: session.nocCode,
        eventId: "LA28",
        orgIdA,
        orgIdB,
        dismissedBy: session.userId,
      })
      .onConflictDoNothing();

    await tx.insert(auditLog).values({
      actorType: "noc_admin",
      actorId: session.userId,
      actorLabel: session.displayName,
      action: "duplicate_resolved",
      detail: `Dismissed duplicate flag for orgs ${orgIdA} / ${orgIdB}`,
    });
  });
}

export async function setEnrRank(
  appId: string,
  rank: number | null,
): Promise<{ error?: string }> {
  await requireWritable();
  const session = await requireNocSession();

  if (rank !== null && (rank < 1 || rank > 99 || !Number.isInteger(rank))) {
    return { error: "Rank must be an integer between 1 and 99." };
  }

  const app = await getApplicationForNoc(appId, session.nocCode);
  if (!app) return { error: "Application not found." };

  const [org] = await db
    .select({ orgType: organizations.orgType })
    .from(organizations)
    .where(eq(organizations.id, app.organizationId));

  if (!org || org.orgType !== "enr") {
    return { error: "Priority ranking is only available for ENR applications." };
  }

  const now = new Date();
  await db
    .update(applications)
    .set({ enrRank: rank, updatedAt: now })
    .where(and(eq(applications.id, appId), eq(applications.nocCode, session.nocCode)));

  return {};
}

export async function updateContactInfo(
  applicationId: string,
  data: { contactName: string; contactEmail: string; contactPhone: string },
): Promise<{ error?: string }> {
  await requireWritable();
  const session = await requireNocSession();

  const app = await getApplicationForNoc(applicationId, session.nocCode);
  if (!app) return { error: "Application not found." };

  const emailChanged = app.contactEmail.toLowerCase() !== data.contactEmail.toLowerCase();

  await db
    .update(applications)
    .set({
      contactName: data.contactName,
      contactEmail: data.contactEmail.toLowerCase(),
      contactPhone: data.contactPhone,
      updatedAt: new Date(),
      ...(emailChanged && { previousContactEmail: app.contactEmail }),
    })
    .where(eq(applications.id, applicationId));

  await db
    .update(organizations)
    .set({ contactInfoUpdatedAt: new Date() })
    .where(eq(organizations.id, app.organizationId));

  await db.insert(auditLog).values({
    actorType: "noc_admin",
    actorId: session.userId,
    actorLabel: session.displayName,
    action: "contact_info_updated",
    applicationId,
    organizationId: app.organizationId,
    detail: emailChanged
      ? `Contact email changed from ${app.contactEmail} to ${data.contactEmail}`
      : "Contact info updated (no email change)",
  });

  if (emailChanged) {
    const rawToken = generateToken(12);
    const tokenHash = hashToken(rawToken);
    await db.insert(magicLinkTokens).values({
      email: data.contactEmail.toLowerCase(),
      tokenHash,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    });
    await sendEmail("magic_link", { to: data.contactEmail, token: rawToken });
  }

  return {};
}
