"use server";

import { redirect } from "next/navigation";
import { eq, and, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { enrRequests, organizations, auditLog, eventSettings } from "@/db/schema";
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

/**
 * Add an IOC-Direct ENR organisation.
 * Per Strategic Plan re-review item 7 + Emma feedback #226: the IOC also grants
 * ENR accreditations directly to international-focus non-MRH organisations
 * (CNN, Al Jazeera, BBC World, etc.) that don't fall under any NOC's
 * jurisdiction. These are recorded under the `IOC_DIRECT` pseudo-NOC code so
 * they sit in the same ENR review surface as NOC-nominated requests.
 *
 * Fields per Emma #226: ENR org, first name, last name, email, address, tel.
 */
export async function addIocDirectEnrOrg(formData: FormData) {
  await requireWritable();
  const session = await requireIocAdminSession();

  const orgName        = ((formData.get("org_name") as string | null) ?? "").trim();
  const firstName      = ((formData.get("first_name") as string | null) ?? "").trim();
  const lastName       = ((formData.get("last_name") as string | null) ?? "").trim();
  const email          = ((formData.get("email") as string | null) ?? "").trim();
  const address        = ((formData.get("address") as string | null) ?? "").trim();
  const phone          = ((formData.get("phone") as string | null) ?? "").trim();
  const slotsRequested = Math.max(1, parseInt((formData.get("slots_requested") as string | null) ?? "3", 10) || 3);
  const justification  = ((formData.get("justification") as string | null) ?? "").trim() || null;

  if (!orgName || !email) {
    redirect("/admin/ioc/enr/direct?error=missing_fields");
  }

  // Compute the next priority rank within the IOC_DIRECT bucket so the new
  // entry lands at the bottom of the IOC-Direct ENR list.
  const [{ maxRank }] = await db
    .select({ maxRank: sql<number>`coalesce(max(${enrRequests.priorityRank}), 0)` })
    .from(enrRequests)
    .where(and(eq(enrRequests.nocCode, "IOC_DIRECT"), eq(enrRequests.eventId, "LA28")));
  const nextRank = (maxRank ?? 0) + 1;

  const contactName = [firstName, lastName].filter(Boolean).join(" ") || null;
  const emailDomain = email.includes("@") ? email.split("@")[1].toLowerCase() : null;
  // Bundle Emma's #226 contact fields into the enrJustification so they
  // surface in the IOC ENR review screen and flow into ACR via the existing
  // ENR export path. (Organisations table doesn't carry per-contact name /
  // phone / address; those normally live on the application record. For
  // IOC-Direct there is no application step, so we stash them here.)
  const contactBlock = [
    contactName ? `Contact: ${contactName}` : null,
    email ? `Email: ${email}` : null,
    phone ? `Phone: ${phone}` : null,
    address ? `Address: ${address}` : null,
  ].filter(Boolean).join("\n");
  const justificationFull = [justification, contactBlock].filter(Boolean).join("\n\n") || null;

  await db.transaction(async (tx) => {
    const [org] = await tx
      .insert(organizations)
      .values({
        name: orgName,
        nocCode: "IOC_DIRECT",
        orgType: "enr",
        country: null,
        emailDomain,
        orgEmail: email,
        address: address || null,
        status: "active",
      })
      .returning({ id: organizations.id });

    await tx.insert(enrRequests).values({
      nocCode: "IOC_DIRECT",
      organizationId: org.id,
      priorityRank: nextRank,
      slotsRequested,
      mustHaveSlots: slotsRequested,
      niceToHaveSlots: 0,
      enrJustification: justificationFull,
      // Mark as already-submitted: there is no NOC step in the IOC-Direct path.
      submittedAt: new Date(),
    });

    await tx.insert(auditLog).values({
      actorType: "ioc_admin",
      actorId: session.userId,
      actorLabel: session.displayName,
      action: "enr_submitted",
      organizationId: org.id,
      detail: `IOC-Direct ENR added: ${orgName}${contactName ? ` (${contactName})` : ""}`,
    });
  });

  redirect("/admin/ioc/enr/direct?success=added");
}
