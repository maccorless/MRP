import { NextResponse } from "next/server";
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/db";
import { enrRequests, organizations, auditLog } from "@/db/schema";
import { getSession } from "@/lib/session";
import { buildCsv } from "@/lib/csv";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isNoc = session.role === "noc_admin" && session.nocCode;
  const nocFilter = isNoc ? session.nocCode : null;

  let query = db
    .select({ req: enrRequests, orgName: organizations.name, orgWebsite: organizations.website })
    .from(enrRequests)
    .innerJoin(organizations, eq(enrRequests.organizationId, organizations.id))
    .orderBy(asc(enrRequests.nocCode), asc(enrRequests.priorityRank))
    .$dynamic();

  if (nocFilter) {
    query = query.where(eq(enrRequests.nocCode, nocFilter));
  }

  const rows = await query;

  const header = [
    "NOC", "Priority", "Organisation", "Website",
    "Description", "Justification",
    "Must-have Slots", "Nice-to-have Slots", "Total Requested",
    "Slots Granted", "Decision", "Decision Notes",
    "Submitted", "Reviewed",
  ];

  const csvRows = rows.map(({ req: r, orgName, orgWebsite }) => [
    r.nocCode, r.priorityRank, orgName,
    orgWebsite, r.enrDescription, r.enrJustification,
    r.mustHaveSlots, r.niceToHaveSlots, r.slotsRequested,
    r.slotsGranted, r.decision, r.decisionNotes,
    r.submittedAt?.toISOString() ?? "",
    r.reviewedAt?.toISOString() ?? "",
  ]);

  const csv = buildCsv(header, csvRows);
  const date = new Date().toISOString().slice(0, 10);
  const prefix = nocFilter ? `enr-${nocFilter}` : "enr-all";

  await db.insert(auditLog).values({
    actorType: session.role.startsWith("ioc_") ? "ioc_admin" : "noc_admin",
    actorId: session.userId,
    actorLabel: session.displayName,
    action: "export_generated",
    detail: `ENR export — ${rows.length} nominations`,
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="prp-${prefix}-${date}.csv"`,
    },
  });
}
