"use server";

import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { orgSlotAllocations, organizations, applications, auditLog } from "@/db/schema";
import { requireOcogSession } from "@/lib/session";
import { acrClient } from "@/lib/acr/stub-client";
import type { OrgExportRecord } from "@/lib/acr/adapter";

/**
 * Approve a NOC's PbN allocation, optionally with adjusted slot values.
 * Form fields: noc_code, and optionally press_{orgId} / photo_{orgId} for each org.
 */
export async function approvePbn(formData: FormData) {
  const session = await requireOcogSession();
  const nocCode = formData.get("noc_code") as string;
  if (!nocCode) redirect("/admin/ocog/pbn");

  const allocs = await db
    .select()
    .from(orgSlotAllocations)
    .where(
      and(
        eq(orgSlotAllocations.nocCode, nocCode),
        eq(orgSlotAllocations.eventId, "LA28"),
        eq(orgSlotAllocations.pbnState, "noc_submitted")
      )
    );

  if (allocs.length === 0) redirect(`/admin/ocog/pbn/${nocCode}?error=not_submitted`);

  let totalPress = 0;
  let totalPhoto = 0;

  for (const alloc of allocs) {
    // Check if OCOG adjusted the value for this org
    const pressKey = `press_${alloc.organizationId}`;
    const photoKey = `photo_${alloc.organizationId}`;
    const pressRaw = formData.get(pressKey);
    const photoRaw = formData.get(photoKey);

    const press = pressRaw !== null ? (parseInt(pressRaw as string, 10) || 0) : alloc.pressSlots;
    const photo = photoRaw !== null ? (parseInt(photoRaw as string, 10) || 0) : alloc.photoSlots;

    totalPress += press;
    totalPhoto += photo;

    await db
      .update(orgSlotAllocations)
      .set({
        pressSlots: press,
        photoSlots: photo,
        pbnState: "ocog_approved",
        ocogReviewedBy: session.userId,
        ocogReviewedAt: new Date(),
      })
      .where(eq(orgSlotAllocations.id, alloc.id));
  }

  await db.insert(auditLog).values({
    actorType: "ocog_admin",
    actorId: session.userId,
    actorLabel: session.displayName,
    action: "pbn_approved",
    detail: `${nocCode} · ${allocs.length} orgs · ${totalPress} press · ${totalPhoto} photo`,
  });

  redirect(`/admin/ocog/pbn?success=approved&noc=${nocCode}`);
}

/**
 * Send a NOC's approved allocations to ACR via the adapter.
 */
export async function sendToAcr(formData: FormData) {
  const session = await requireOcogSession();
  const nocCode = formData.get("noc_code") as string;
  if (!nocCode) redirect("/admin/ocog/pbn");

  const rows = await db
    .select({
      alloc: orgSlotAllocations,
      org: organizations,
      app: applications,
    })
    .from(orgSlotAllocations)
    .innerJoin(organizations, eq(orgSlotAllocations.organizationId, organizations.id))
    .innerJoin(
      applications,
      and(
        eq(applications.organizationId, organizations.id),
        eq(applications.nocCode, nocCode),
        eq(applications.status, "approved")
      )
    )
    .where(
      and(
        eq(orgSlotAllocations.nocCode, nocCode),
        eq(orgSlotAllocations.eventId, "LA28"),
        eq(orgSlotAllocations.pbnState, "ocog_approved")
      )
    );

  if (rows.length === 0) redirect(`/admin/ocog/pbn/${nocCode}?error=not_approved`);

  const records: OrgExportRecord[] = rows.map(({ alloc, org, app }) => ({
    nocCode,
    organizationId: org.id,
    orgName: org.name,
    country: org.country,
    orgType: org.orgType,
    emailDomain: org.emailDomain,
    contactName: app.contactName,
    contactEmail: app.contactEmail,
    categoryPress: app.categoryPress,
    categoryPhoto: app.categoryPhoto,
    pressSlots: alloc.pressSlots,
    photoSlots: alloc.photoSlots,
    commonCodesId: org.commonCodesId,
    eventId: "LA28",
  }));

  const { pushed } = await acrClient.pushOrgData(records);

  await db.insert(auditLog).values({
    actorType: "ocog_admin",
    actorId: session.userId,
    actorLabel: session.displayName,
    action: "pbn_sent_to_acr",
    detail: `${nocCode} · ${pushed} orgs sent to ACR`,
  });

  redirect(`/admin/ocog/pbn?success=sent_to_acr&noc=${nocCode}&count=${pushed}`);
}
