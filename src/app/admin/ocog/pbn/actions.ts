"use server";

import { redirect } from "next/navigation";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/db";
import { orgSlotAllocations, organizations, applications, auditLog, enrRequests } from "@/db/schema";
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

  function getVal(alloc: typeof allocs[number], key: string, fallback: number): number {
    const raw = formData.get(`${key}_${alloc.organizationId}`);
    return raw !== null ? (parseInt(raw as string, 10) || 0) : fallback;
  }

  await db.transaction(async (tx) => {
    for (const alloc of allocs) {
      const eSlots   = getVal(alloc, "e",   alloc.eSlots   ?? 0);
      const esSlots  = getVal(alloc, "es",  alloc.esSlots  ?? 0);
      const epSlots  = getVal(alloc, "ep",  alloc.epSlots  ?? 0);
      const epsSlots = getVal(alloc, "eps", alloc.epsSlots ?? 0);
      const etSlots  = getVal(alloc, "et",  alloc.etSlots  ?? 0);
      const ecSlots  = getVal(alloc, "ec",  alloc.ecSlots  ?? 0);
      const press    = eSlots + esSlots + etSlots + ecSlots;
      const photo    = epSlots + epsSlots;

      totalPress += press;
      totalPhoto += photo;
      grandTotal += press + photo;

      await tx
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

    await tx.insert(auditLog).values({
      actorType: "ocog_admin",
      actorId: session.userId,
      actorLabel: session.displayName,
      action: "pbn_approved",
      detail: `${nocCode} · ${allocs.length} orgs · ${grandTotal} total (${catSummaryParts.join(", ")})`,
    });
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

  // PbN org records
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
    nocESlots: alloc.nocESlots ?? 0,
    enrSlotsGranted: null,
    commonCodesId: org.commonCodesId,
    eventId: "LA28",
  }));

  // Append approved ENR records for this NOC
  const enrRows = await db
    .select({ org: organizations, enr: enrRequests })
    .from(enrRequests)
    .innerJoin(organizations, eq(enrRequests.organizationId, organizations.id))
    .where(
      and(
        eq(enrRequests.nocCode, nocCode),
        eq(enrRequests.eventId, "LA28"),
        inArray(enrRequests.decision, ["granted", "partial"])
      )
    );

  for (const { org, enr } of enrRows) {
    if (!enr.slotsGranted) continue;
    records.push({
      nocCode,
      organizationId: org.id,
      orgName: org.name,
      country: org.country,
      orgType: org.orgType,
      emailDomain: org.emailDomain,
      contactName: "",
      contactEmail: "",
      categoryE: false, categoryEs: false, categoryEp: false,
      categoryEps: false, categoryEt: false, categoryEc: false,
      eSlots: 0, esSlots: 0, epSlots: 0, epsSlots: 0, etSlots: 0, ecSlots: 0,
      nocESlots: 0,
      enrSlotsGranted: enr.slotsGranted,
      commonCodesId: org.commonCodesId,
      eventId: "LA28",
    });
  }

  const { pushed } = await acrClient.pushOrgData(records);

  // Mark all sent allocations as sent_to_acr
  const sentIds = rows.map(({ alloc }) => alloc.id);
  await db.transaction(async (tx) => {
    await tx
      .update(orgSlotAllocations)
      .set({ pbnState: "sent_to_acr" })
      .where(inArray(orgSlotAllocations.id, sentIds));

    await tx.insert(auditLog).values({
      actorType: "ocog_admin",
      actorId: session.userId,
      actorLabel: session.displayName,
      action: "pbn_sent_to_acr",
      detail: `${nocCode} · ${pushed} orgs sent to ACR`,
    });
  });

  redirect(`/admin/ocog/pbn?success=sent_to_acr&noc=${nocCode}&count=${pushed}`);
}

export async function reversePbnApproval(formData: FormData) {
  await requireWritable();
  const session = await requireOcogSession();
  const nocCode = formData.get("noc_code") as string;
  if (!nocCode) redirect("/admin/ocog/pbn");

  const [existing] = await db
    .select({ id: orgSlotAllocations.id })
    .from(orgSlotAllocations)
    .where(
      and(
        eq(orgSlotAllocations.nocCode, nocCode),
        eq(orgSlotAllocations.eventId, "LA28"),
        eq(orgSlotAllocations.pbnState, "ocog_approved")
      )
    );

  if (!existing) redirect(`/admin/ocog/pbn/${nocCode}?error=not_approved`);

  await db.transaction(async (tx) => {
    await tx
      .update(orgSlotAllocations)
      .set({ pbnState: "noc_submitted", ocogReviewedBy: null, ocogReviewedAt: null })
      .where(
        and(
          eq(orgSlotAllocations.nocCode, nocCode),
          eq(orgSlotAllocations.eventId, "LA28"),
          eq(orgSlotAllocations.pbnState, "ocog_approved")
        )
      );

    await tx.insert(auditLog).values({
      actorType: "ocog_admin",
      actorId: session.userId,
      actorLabel: session.displayName,
      action: "pbn_unapproved",
      detail: `${nocCode} · approval reversed by ${session.displayName}`,
    });
  });

  redirect(`/admin/ocog/pbn/${nocCode}?success=unapproved`);
}
