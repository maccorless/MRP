"use server";

import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { applications, auditLog } from "@/db/schema";
import { requireNocSession } from "@/lib/session";

async function getApplicationForNoc(id: string, nocCode: string) {
  const [app] = await db
    .select()
    .from(applications)
    .where(and(eq(applications.id, id), eq(applications.nocCode, nocCode)));
  return app;
}

export async function approveApplication(formData: FormData) {
  const session = await requireNocSession();
  const id = formData.get("id") as string;

  const app = await getApplicationForNoc(id, session.nocCode);
  if (!app || (app.status !== "pending" && app.status !== "resubmitted")) {
    redirect("/admin/noc/queue");
  }

  await db
    .update(applications)
    .set({
      status: "approved",
      reviewedAt: new Date(),
      reviewedBy: session.userId,
      updatedAt: new Date(),
    })
    .where(eq(applications.id, id));

  await db.insert(auditLog).values({
    actorType: "noc_admin",
    actorId: session.userId,
    actorLabel: session.displayName,
    action: "application_approved",
    applicationId: id,
    organizationId: app.organizationId,
  });

  redirect("/admin/noc/queue?success=approved");
}

export async function returnApplication(formData: FormData) {
  const session = await requireNocSession();
  const id = formData.get("id") as string;
  const note = (formData.get("note") as string)?.trim();

  if (!note) redirect(`/admin/noc/${id}?error=note_required`);

  const app = await getApplicationForNoc(id, session.nocCode);
  if (!app || (app.status !== "pending" && app.status !== "resubmitted")) {
    redirect("/admin/noc/queue");
  }

  await db
    .update(applications)
    .set({
      status: "returned",
      reviewNote: note,
      reviewedAt: new Date(),
      reviewedBy: session.userId,
      updatedAt: new Date(),
    })
    .where(eq(applications.id, id));

  await db.insert(auditLog).values({
    actorType: "noc_admin",
    actorId: session.userId,
    actorLabel: session.displayName,
    action: "application_returned",
    applicationId: id,
    organizationId: app.organizationId,
    detail: note,
  });

  redirect("/admin/noc/queue?success=returned");
}

export async function rejectApplication(formData: FormData) {
  const session = await requireNocSession();
  const id = formData.get("id") as string;
  const note = (formData.get("note") as string)?.trim();

  if (!note) redirect(`/admin/noc/${id}?error=note_required`);

  const app = await getApplicationForNoc(id, session.nocCode);
  if (!app || (app.status !== "pending" && app.status !== "resubmitted")) {
    redirect("/admin/noc/queue");
  }

  await db
    .update(applications)
    .set({
      status: "rejected",
      reviewNote: note,
      reviewedAt: new Date(),
      reviewedBy: session.userId,
      updatedAt: new Date(),
    })
    .where(eq(applications.id, id));

  await db.insert(auditLog).values({
    actorType: "noc_admin",
    actorId: session.userId,
    actorLabel: session.displayName,
    action: "application_rejected",
    applicationId: id,
    organizationId: app.organizationId,
    detail: note,
  });

  redirect("/admin/noc/queue?success=rejected");
}
