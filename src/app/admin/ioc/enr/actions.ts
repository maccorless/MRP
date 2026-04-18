"use server";

import { redirect } from "next/navigation";
import { eq, and, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { enrRequests, auditLog, eventSettings } from "@/db/schema";
import { requireIocAdminSession, requireWritable } from "@/lib/session";

/**
 * Save IOC decisions for all orgs in a NOC's ENR list.
 * Form fields: decision_{requestId} and slots_{requestId} for each org.
 */
export async function saveEnrDecisions(formData: FormData) {
  await requireWritable();
  const session = await requireIocAdminSession();
  const nocCode = formData.get("noc_code") as string;
  if (!nocCode) redirect("/admin/ioc/enr");

  // Get all submitted requests for this NOC
  const requests = await db
    .select()
    .from(enrRequests)
    .where(
      and(
        eq(enrRequests.nocCode, nocCode),
        eq(enrRequests.eventId, "LA28"),
        isNotNull(enrRequests.submittedAt)
      )
    );

  const now = new Date();
  let decidedCount = 0;

  await db.transaction(async (tx) => {
    for (const req of requests) {
      const decisionVal = formData.get(`decision_${req.id}`) as string | null;
      if (!decisionVal || !["granted", "partial", "denied"].includes(decisionVal)) continue;

      const decision = decisionVal as "granted" | "partial" | "denied";
      const slotsRaw = parseInt(formData.get(`slots_${req.id}`) as string ?? "0", 10);
      const slotsGranted = decision === "denied" ? 0 : (isNaN(slotsRaw) ? 0 : slotsRaw);

      await tx
        .update(enrRequests)
        .set({
          decision,
          slotsGranted,
          reviewedBy: session.userId,
          reviewedAt: now,
        })
        .where(eq(enrRequests.id, req.id));

      decidedCount++;
    }

    if (decidedCount > 0) {
      await tx.insert(auditLog).values({
        actorType: "ioc_admin",
        actorId: session.userId,
        actorLabel: session.displayName,
        action: "enr_decision_made",
        detail: `${nocCode} · ${decidedCount} org${decidedCount !== 1 ? "s" : ""} decided`,
      });
    }
  });

  redirect(`/admin/ioc/enr/${nocCode}?success=saved`);
}

export async function saveEnrPoolSize(formData: FormData) {
  await requireWritable();
  const session = await requireIocAdminSession();

  const raw = parseInt(formData.get("enr_pool_size") as string ?? "350", 10);
  const enrPoolSize = isNaN(raw) || raw < 0 ? 350 : raw;
  const now = new Date();

  const [existing] = await db
    .select()
    .from(eventSettings)
    .where(eq(eventSettings.eventId, "LA28"));

  if (existing) {
    await db
      .update(eventSettings)
      .set({ enrPoolSize, updatedBy: session.userId, updatedAt: now })
      .where(eq(eventSettings.eventId, "LA28"));
  } else {
    await db.insert(eventSettings).values({
      eventId: "LA28",
      enrPoolSize,
      updatedBy: session.userId,
      updatedAt: now,
    });
  }

  redirect("/admin/ioc/enr?success=pool_saved");
}

export async function saveAllEnrDecisions(formData: FormData) {
  await requireWritable();
  const session = await requireIocAdminSession();

  const requests = await db
    .select()
    .from(enrRequests)
    .where(isNotNull(enrRequests.submittedAt));

  const now = new Date();
  let decidedCount = 0;
  const nocCodesAffected = new Set<string>();

  await db.transaction(async (tx) => {
    for (const req of requests) {
      const slotsRaw = parseInt(formData.get(`slots_${req.id}`) as string ?? "", 10);
      if (isNaN(slotsRaw)) continue;

      const slotsGranted = Math.max(0, slotsRaw);
      const decision = slotsGranted > 0 ? (slotsGranted >= req.slotsRequested ? "granted" : "partial") : "denied";

      await tx
        .update(enrRequests)
        .set({ decision: decision as "granted" | "partial" | "denied", slotsGranted, reviewedBy: session.userId, reviewedAt: now })
        .where(eq(enrRequests.id, req.id));

      decidedCount++;
      nocCodesAffected.add(req.nocCode);
    }

    if (decidedCount > 0) {
      await tx.insert(auditLog).values({
        actorType: "ioc_admin",
        actorId: session.userId,
        actorLabel: session.displayName,
        action: "enr_decision_made",
        detail: `Combined view: ${decidedCount} org${decidedCount !== 1 ? "s" : ""} decided across ${nocCodesAffected.size} NOC${nocCodesAffected.size !== 1 ? "s" : ""}`,
      });
    }
  });

  redirect("/admin/ioc/enr?success=saved");
}

export async function reviseEnrDecision(formData: FormData) {
  await requireWritable();
  const session = await requireIocAdminSession();
  const requestId = formData.get("request_id") as string;
  if (!requestId) redirect("/admin/ioc/enr");

  const [req] = await db
    .select()
    .from(enrRequests)
    .where(eq(enrRequests.id, requestId));

  if (!req || !req.decision) redirect(`/admin/ioc/enr/${req?.nocCode ?? ""}`);

  // IOC admins may only revise decisions — no NOC-scoping needed since
  // requireIocAdminSession already guarantees IOC role. Validate request exists.

  await db.transaction(async (tx) => {
    await tx
      .update(enrRequests)
      .set({ decision: null, slotsGranted: null, reviewedBy: null, reviewedAt: null })
      .where(eq(enrRequests.id, requestId));

    await tx.insert(auditLog).values({
      actorType: "ioc_admin",
      actorId: session.userId,
      actorLabel: session.displayName,
      action: "enr_decision_revised",
      detail: `ENR decision for org ${req.organizationId} (${req.nocCode}) revised by ${session.displayName}`,
    });
  });

  redirect(`/admin/ioc/enr/${req.nocCode}?success=revised`);
}
