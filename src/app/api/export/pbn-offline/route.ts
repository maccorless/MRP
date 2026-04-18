/**
 * GET /api/export/pbn-offline
 *
 * Exports the NOC's current PbN allocation as a round-trip-ready CSV.
 * Format is designed for offline editing in Excel/Sheets and re-importing
 * via POST /api/import/pbn.
 *
 * NOC-authenticated only — each NOC sees only their own data.
 */

import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { applications, organizations, orgSlotAllocations, nocQuotas, auditLog } from "@/db/schema";
import { getSession } from "@/lib/session";
import { buildCsv } from "@/lib/csv";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "noc_admin" || !session.nocCode) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const nocCode = session.nocCode;

  // Load quota for metadata row
  const [quota] = await db
    .select()
    .from(nocQuotas)
    .where(and(eq(nocQuotas.nocCode, nocCode), eq(nocQuotas.eventId, "LA28")));

  // Load all orgs with allocations (EoI-approved + direct PbN entries)
  const eioRows = await db
    .select({
      orgId:   organizations.id,
      orgName: organizations.name,
      orgType: organizations.orgType,
      country: organizations.country,
      eSlots:   orgSlotAllocations.eSlots,
      esSlots:  orgSlotAllocations.esSlots,
      epSlots:  orgSlotAllocations.epSlots,
      epsSlots: orgSlotAllocations.epsSlots,
      etSlots:  orgSlotAllocations.etSlots,
      ecSlots:  orgSlotAllocations.ecSlots,
      pbnState: orgSlotAllocations.pbnState,
    })
    .from(applications)
    .innerJoin(organizations, eq(applications.organizationId, organizations.id))
    .leftJoin(
      orgSlotAllocations,
      and(
        eq(orgSlotAllocations.organizationId, organizations.id),
        eq(orgSlotAllocations.nocCode, nocCode),
        eq(orgSlotAllocations.eventId, "LA28")
      )
    )
    .where(and(eq(applications.nocCode, nocCode), eq(applications.status, "approved")));

  const approvedOrgIds = new Set(eioRows.map((r) => r.orgId));

  // Direct-entry orgs (no EoI application)
  const directRows = await db
    .select({
      orgId:   organizations.id,
      orgName: organizations.name,
      orgType: organizations.orgType,
      country: organizations.country,
      eSlots:   orgSlotAllocations.eSlots,
      esSlots:  orgSlotAllocations.esSlots,
      epSlots:  orgSlotAllocations.epSlots,
      epsSlots: orgSlotAllocations.epsSlots,
      etSlots:  orgSlotAllocations.etSlots,
      ecSlots:  orgSlotAllocations.ecSlots,
      pbnState: orgSlotAllocations.pbnState,
    })
    .from(orgSlotAllocations)
    .innerJoin(organizations, eq(orgSlotAllocations.organizationId, organizations.id))
    .where(and(eq(orgSlotAllocations.nocCode, nocCode), eq(orgSlotAllocations.eventId, "LA28")));

  const allRows = [
    ...eioRows,
    ...directRows.filter((r) => !approvedOrgIds.has(r.orgId)),
  ];

  const header = [
    "org_name",
    "org_type",
    "country",
    "e_slots",
    "es_slots",
    "ep_slots",
    "eps_slots",
    "et_slots",
    "ec_slots",
    "entry_source",
    "notes",
  ];

  // Determine entry_source per org
  const csvRows = allRows.map((r) => {
    const entrySource = approvedOrgIds.has(r.orgId) ? "eoi" : "pbn_direct";
    return [
      r.orgName,
      r.orgType ?? "",
      r.country ?? "",
      r.eSlots   ?? 0,
      r.esSlots  ?? 0,
      r.epSlots  ?? 0,
      r.epsSlots ?? 0,
      r.etSlots  ?? 0,
      r.ecSlots  ?? 0,
      entrySource,
      "", // notes — free-form column for offline use
    ];
  });

  // Build CSV with a metadata comment row at the top (before the header)
  // The metadata row starts with # so importers can skip it.
  const quotaLine = quota
    ? `# NOC: ${nocCode} | Quota: E=${quota.eTotal ?? 0} Es=${quota.esTotal ?? 0} EP=${quota.epTotal ?? 0} EPs=${quota.epsTotal ?? 0} ET=${quota.etTotal ?? 0} EC=${quota.ecTotal ?? 0} | Exported: ${new Date().toISOString().slice(0, 10)}`
    : `# NOC: ${nocCode} | Quota: not set | Exported: ${new Date().toISOString().slice(0, 10)}`;

  const dataCsv = buildCsv(header, csvRows);
  const csv = `${quotaLine}\n${dataCsv}`;

  const date = new Date().toISOString().slice(0, 10);

  await db.insert(auditLog).values({
    actorType: "noc_admin",
    actorId: session.userId,
    actorLabel: session.displayName,
    action: "export_generated",
    detail: `PbN offline export — ${allRows.length} rows — ${nocCode}`,
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pbn-${nocCode}-${date}.csv"`,
    },
  });
}
