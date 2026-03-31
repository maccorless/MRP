"use server";

import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { orgSlotAllocations, organizations, applications, auditLog } from "@/db/schema";
import { requireOcogSession, requireWritable } from "@/lib/session";
import { acrClient } from "@/lib/acr/stub-client";
import type { OrgExportRecord } from "@/lib/acr/adapter";

/**
 * Approve a NOC's PbN allocation, optionally with adjusted slot values.
 * Form fields: noc_code, and optionally press_{orgId} / photo_{orgId} for each org.
 */
export async function approvePbn(formData: FormData) {
  await requireWritable();
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

  let grandTotal = 0;
  const catSummaryParts: string[] = [];

  for (const alloc of allocs) {
    function getVal(key: string, fallback: number): number {
      const raw = formData.get(`${key}_${alloc.organizationId}`);
      return raw !== null ? (parseInt(raw as string, 10) || 0) : fallback;
    }

    const eSlots   = getVal("e",   alloc.eSlots   ?? 0);
    const esSlots  = getVal("es",  alloc.esSlots  ?? 0);
    const epSlots  = getVal("ep",  alloc.epSlots  ?? 0);
    const epsSlots = getVal("eps", alloc.epsSlots ?? 0);
    const etSlots  = getVal("et",  alloc.etSlots  ?? 0);
    const ecSlots  = getVal("ec",  alloc.ecSlots  ?? 0);
    const press    = eSlots + esSlots + etSlots + ecSlots;
    const photo    = epSlots + epsSlots;

    totalPress += press;
    totalPhoto += photo;
    grandTotal += press + photo;

    await db
      .update(orgSlotAllocations)
      .set({
        eSlots, esSlots, epSlots, epsSlots, etSlots, ecSlots,
        pressSlots: press,
        photoSlots: photo,
        pbnState: "ocog_approved",
        ocogReviewedBy: session.userId,
        ocogReviewedAt: new Date(),
      })
      .where(eq(orgSlotAllocations.id, alloc.id));
  }

  if (totalPress > 0) catSummaryParts.push(`${totalPress} press`);
  if (totalPhoto > 0) catSummaryParts.push(`${totalPhoto} photo`);

  await db.insert(auditLog).values({
    actorType: "ocog_admin",
    actorId: session.userId,
    actorLabel: session.displayName,
    action: "pbn_approved",
    detail: `${nocCode} · ${allocs.length} orgs · ${grandTotal} total (${catSummaryParts.join(", ")})`,
  });

  redirect(`/admin/ocog/pbn?success=approved&noc=${nocCode}`);
}

/**
 * Send a NOC's approved allocations to ACR via the adapter.
 */
export async function sendToAcr(formData: FormData) {
  await requireWritable();
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
    categoryE:   app.categoryE   ?? false,
    categoryEs:  app.categoryEs  ?? false,
    categoryEp:  app.categoryEp  ?? false,
    categoryEps: app.categoryEps ?? false,
    categoryEt:  app.categoryEt  ?? false,
    categoryEc:  app.categoryEc  ?? false,
    eSlots:   alloc.eSlots   ?? 0,
    esSlots:  alloc.esSlots  ?? 0,
    epSlots:  alloc.epSlots  ?? 0,
    epsSlots: alloc.epsSlots ?? 0,
    etSlots:  alloc.etSlots  ?? 0,
    ecSlots:  alloc.ecSlots  ?? 0,
    commonCodesId: org.commonCodesId,
    eventId: "LA28",
  }));

  const { pushed } = await acrClient.pushOrgData(records);

  // Mark all sent allocations as sent_to_acr
  for (const { alloc } of rows) {
    await db
      .update(orgSlotAllocations)
      .set({ pbnState: "sent_to_acr" })
      .where(eq(orgSlotAllocations.id, alloc.id));
  }

  await db.insert(auditLog).values({
    actorType: "ocog_admin",
    actorId: session.userId,
    actorLabel: session.displayName,
    action: "pbn_sent_to_acr",
    detail: `${nocCode} · ${pushed} orgs sent to ACR`,
  });

  redirect(`/admin/ocog/pbn?success=sent_to_acr&noc=${nocCode}&count=${pushed}`);
}
