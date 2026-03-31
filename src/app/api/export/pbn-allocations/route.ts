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
      nocCode: applications.nocCode,
      orgName: organizations.name,
      referenceNumber: applications.referenceNumber,
      categoryPress: applications.categoryPress,
      categoryPhoto: applications.categoryPhoto,
      requestedPress: applications.requestedPress,
      requestedPhoto: applications.requestedPhoto,
      pressSlots: orgSlotAllocations.pressSlots,
      photoSlots: orgSlotAllocations.photoSlots,
      pbnState: orgSlotAllocations.pbnState,
      allocatedAt: orgSlotAllocations.allocatedAt,
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
    "NOC", "Organisation", "Reference", "Category",
    "Press Requested", "Photo Requested",
    "Press Allocated", "Photo Allocated",
    "PbN State", "Allocated At",
  ];

  const csvRows = rows.map((r) => [
    r.nocCode, r.orgName, r.referenceNumber,
    categoryDisplayLabel(r.categoryPress, r.categoryPhoto),
    r.requestedPress, r.requestedPhoto,
    r.pressSlots, r.photoSlots,
    r.pbnState, r.allocatedAt?.toISOString() ?? "",
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
      "Content-Disposition": `attachment; filename="mrp-${prefix}-${date}.csv"`,
    },
  });
}
