"use server";

import { redirect } from "next/navigation";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/db";
import { applications, auditLog, orgSlotAllocations } from "@/db/schema";
import { requireNocSession, requireWritable } from "@/lib/session";

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
