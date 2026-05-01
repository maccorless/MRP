/**
 * Pure NOC write operations — no session coupling, no cookies, no redirects.
 * Called by web server actions (after session checks) and agent commands (after API key auth).
 */

import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { applications, auditLog, organizations } from "@/db/schema";
import { ineligibilityFlags } from "@/lib/eligibility";

type ActorType = "noc_admin" | "api_key";

type Actor = {
  userId: string;
  displayName: string;
  actorType: ActorType;
};

export async function approveEoiDb(
  nocCode: string,
  appId: string,
  actor: Actor,
  opts?: { internalNote?: string | null; overrideFlags?: boolean },
): Promise<{ error?: string }> {
  const [app] = await db
    .select({
      id: applications.id,
      status: applications.status,
      organizationId: applications.organizationId,
      contactEmail: applications.contactEmail,
      secondaryEmail: applications.secondaryEmail,
    })
    .from(applications)
    .where(and(eq(applications.id, appId), eq(applications.nocCode, nocCode)));

  if (!app || (app.status !== "pending" && app.status !== "resubmitted")) {
    return { error: "not_found_or_invalid_status" };
  }

  const [org] = await db
    .select({ orgEmail: organizations.orgEmail })
    .from(organizations)
    .where(eq(organizations.id, app.organizationId));

  const flags = ineligibilityFlags({
    contactEmail: app.contactEmail,
    orgEmail: org?.orgEmail ?? null,
    secondaryContactEmail: app.secondaryEmail,
  });

  if (flags.length > 0 && !opts?.overrideFlags) {
    return { error: `eligibility_ack_required:${flags.map((f) => f.code).join(",")}` };
  }

  const now = new Date();
  const [updated] = await db.transaction(async (tx) => {
    const rows = await tx
      .update(applications)
      .set({
        status: "approved",
        internalNote: opts?.internalNote ?? null,
        reviewedAt: now,
        reviewedBy: actor.userId,
        updatedAt: now,
      })
      .where(and(eq(applications.id, appId), eq(applications.status, app.status)))
      .returning({ id: applications.id });

    if (rows[0]) {
      await tx.insert(auditLog).values({
        actorType: actor.actorType,
        actorId: actor.userId,
        actorLabel: actor.displayName,
        action: "application_approved",
        applicationId: appId,
        organizationId: app.organizationId,
      });
    }
    return rows;
  });

  if (!updated) return { error: "stale" };
  return {};
}

export async function returnEoiDb(
  nocCode: string,
  appId: string,
  note: string,
  actor: Actor,
): Promise<{ error?: string }> {
  if (!note.trim()) return { error: "A note is required to return an application." };

  const [app] = await db
    .select({
      id: applications.id,
      status: applications.status,
      organizationId: applications.organizationId,
    })
    .from(applications)
    .where(and(eq(applications.id, appId), eq(applications.nocCode, nocCode)));

  if (!app) return { error: "Application not found." };
  if (app.status !== "pending" && app.status !== "resubmitted") {
    return { error: `Cannot return an application with status: ${app.status}.` };
  }

  const now = new Date();
  const [updated] = await db.transaction(async (tx) => {
    const rows = await tx
      .update(applications)
      .set({
        status: "returned",
        reviewNote: note.trim(),
        reviewedAt: now,
        reviewedBy: actor.userId,
        updatedAt: now,
      })
      .where(and(eq(applications.id, appId), eq(applications.status, app.status)))
      .returning({ id: applications.id });

    if (rows[0]) {
      await tx.insert(auditLog).values({
        actorType: actor.actorType,
        actorId: actor.userId,
        actorLabel: actor.displayName,
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

export async function rejectEoiDb(
  nocCode: string,
  appId: string,
  note: string,
  actor: Actor,
): Promise<{ error?: string }> {
  if (!note.trim()) return { error: "A note is required to reject an application." };

  const [app] = await db
    .select({
      id: applications.id,
      status: applications.status,
      organizationId: applications.organizationId,
    })
    .from(applications)
    .where(and(eq(applications.id, appId), eq(applications.nocCode, nocCode)));

  if (!app) return { error: "Application not found." };
  if (app.status !== "pending" && app.status !== "resubmitted") {
    return { error: `Cannot reject an application with status: ${app.status}.` };
  }

  const now = new Date();
  const [updated] = await db.transaction(async (tx) => {
    const rows = await tx
      .update(applications)
      .set({
        status: "rejected",
        reviewNote: note.trim(),
        reviewedAt: now,
        reviewedBy: actor.userId,
        updatedAt: now,
      })
      .where(and(eq(applications.id, appId), eq(applications.status, app.status)))
      .returning({ id: applications.id });

    if (rows[0]) {
      await tx.insert(auditLog).values({
        actorType: actor.actorType,
        actorId: actor.userId,
        actorLabel: actor.displayName,
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
