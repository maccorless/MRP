import { NextResponse } from "next/server";
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/db";
import { applications, organizations, orgSlotAllocations, auditLog } from "@/db/schema";
import { getSession } from "@/lib/session";
import { categoryDisplayLabel } from "@/lib/category";
import { buildCsv } from "@/lib/csv";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isNoc = session.role === "noc_admin" && session.nocCode;
  const nocFilter = isNoc ? session.nocCode : null;

  let query = db
    .select({
      nocCode:       applications.nocCode,
      orgName:       organizations.name,
      referenceNumber: applications.referenceNumber,
      categoryE:     applications.categoryE,
      categoryEs:    applications.categoryEs,
      categoryEp:    applications.categoryEp,
      categoryEps:   applications.categoryEps,
      categoryEt:    applications.categoryEt,
      categoryEc:    applications.categoryEc,
      requestedE:    applications.requestedE,
      requestedEs:   applications.requestedEs,
      requestedEp:   applications.requestedEp,
      requestedEps:  applications.requestedEps,
      requestedEt:   applications.requestedEt,
      requestedEc:   applications.requestedEc,
      eSlots:        orgSlotAllocations.eSlots,
      esSlots:       orgSlotAllocations.esSlots,
      epSlots:       orgSlotAllocations.epSlots,
      epsSlots:      orgSlotAllocations.epsSlots,
      etSlots:       orgSlotAllocations.etSlots,
      ecSlots:       orgSlotAllocations.ecSlots,
      pbnState:      orgSlotAllocations.pbnState,
      allocatedAt:   orgSlotAllocations.allocatedAt,
    })
    .from(orgSlotAllocations)
    .innerJoin(organizations, eq(orgSlotAllocations.organizationId, organizations.id))
    .innerJoin(
      applications,
      and(
        eq(applications.organizationId, organizations.id),
        eq(applications.status, "approved")
      )
    )
    .orderBy(asc(orgSlotAllocations.nocCode), asc(organizations.name))
    .$dynamic();

  if (nocFilter) {
    query = query.where(eq(orgSlotAllocations.nocCode, nocFilter));
  }

  const rows = await query;

  const header = [
    "NOC", "Organisation", "Reference", "Categories",
    "E Req", "Es Req", "EP Req", "EPs Req", "ET Req", "EC Req",
    "E Slots", "Es Slots", "EP Slots", "EPs Slots", "ET Slots", "EC Slots",
    "PbN State", "Allocated At",
  ];

  const csvRows = rows.map((r) => [
    r.nocCode,
    r.orgName,
    r.referenceNumber,
    categoryDisplayLabel(r.categoryE, r.categoryEs, r.categoryEp, r.categoryEps, r.categoryEt, r.categoryEc),
    r.requestedE  ?? 0, r.requestedEs  ?? 0, r.requestedEp  ?? 0,
    r.requestedEps ?? 0, r.requestedEt ?? 0, r.requestedEc ?? 0,
    r.eSlots   ?? 0, r.esSlots  ?? 0, r.epSlots  ?? 0,
    r.epsSlots ?? 0, r.etSlots  ?? 0, r.ecSlots  ?? 0,
    r.pbnState,
    r.allocatedAt?.toISOString() ?? "",
  ]);

  const csv = buildCsv(header, csvRows);
  const date = new Date().toISOString().slice(0, 10);
  const prefix = nocFilter ? `pbn-${nocFilter}` : "pbn-all";

  await db.insert(auditLog).values({
    actorType: session.role.startsWith("ioc_") ? "ioc_admin" : "noc_admin",
    actorId: session.userId,
    actorLabel: session.displayName,
    action: "export_generated",
    detail: `PbN allocations export — ${rows.length} rows`,
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="prp-${prefix}-${date}.csv"`,
    },
  });
}
