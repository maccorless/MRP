import { NextResponse } from "next/server";
import { desc, eq, or, and, sql } from "drizzle-orm";
import { db } from "@/db";
import { auditLog, organizations, adminUsers } from "@/db/schema";
import { getSession } from "@/lib/session";
import { buildCsv } from "@/lib/csv";
import {
  parseAuditQuery,
  buildAuditConditions,
  ACTION_LABEL,
} from "@/lib/audit-query";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only IOC, OCOG, and NOC admins may export the audit trail
  const allowedRoles = ["ioc_admin", "ioc_readonly", "ocog_admin", "noc_admin"];
  if (!allowedRoles.includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = parseAuditQuery(searchParams.get("q") ?? "");
  const filterWhere = buildAuditConditions(parsed);

  const isNoc = session.role === "noc_admin" && session.nocCode;

  let query;

  if (isNoc) {
    // NOC scope: entries for this NOC's orgs OR this NOC's admin users
    const nocScope = or(
      eq(organizations.nocCode, session.nocCode!),
      eq(adminUsers.nocCode, session.nocCode!),
    )!;
    const whereClause = filterWhere ? and(nocScope, filterWhere) : nocScope;

    query = db
      .select({
        id:             auditLog.id,
        actorType:      auditLog.actorType,
        actorId:        auditLog.actorId,
        actorLabel:     auditLog.actorLabel,
        action:         auditLog.action,
        applicationId:  auditLog.applicationId,
        organizationId: auditLog.organizationId,
        detail:         auditLog.detail,
        createdAt:      auditLog.createdAt,
      })
      .from(auditLog)
      .leftJoin(organizations, eq(auditLog.organizationId, organizations.id))
      .leftJoin(adminUsers, sql`${adminUsers.id}::text = ${auditLog.actorId}`)
      .where(whereClause)
      .orderBy(desc(auditLog.createdAt));
  } else {
    // IOC/OCOG: all entries
    let q = db
      .select({
        id:             auditLog.id,
        actorType:      auditLog.actorType,
        actorId:        auditLog.actorId,
        actorLabel:     auditLog.actorLabel,
        action:         auditLog.action,
        applicationId:  auditLog.applicationId,
        organizationId: auditLog.organizationId,
        detail:         auditLog.detail,
        createdAt:      auditLog.createdAt,
      })
      .from(auditLog)
      .$dynamic();

    if (filterWhere) q = q.where(filterWhere);
    query = q.orderBy(desc(auditLog.createdAt));
  }

  const rows = await query;

  const header = [
    "Timestamp", "Action", "Actor", "Actor Type",
    "Application ID", "Organisation ID", "Detail",
  ];

  const csvRows = rows.map((r) => [
    r.createdAt.toISOString(),
    ACTION_LABEL[r.action] ?? r.action,
    r.actorLabel ?? r.actorId ?? "",
    r.actorType,
    r.applicationId ?? "",
    r.organizationId ?? "",
    r.detail ?? "",
  ]);

  const csv = buildCsv(header, csvRows);
  const date = new Date().toISOString().slice(0, 10);
  const scope = isNoc ? `-${session.nocCode}` : "";

  await db.insert(auditLog).values({
    actorType: session.role.startsWith("ioc_") ? "ioc_admin" : (session.role as "noc_admin" | "ocog_admin"),
    actorId: session.userId,
    actorLabel: session.displayName,
    action: "export_generated",
    detail: `Audit export${scope} — ${rows.length} entries${parsed.action || parsed.actor || parsed.freeText ? " (filtered)" : ""}`,
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mrp-audit${scope}-${date}.csv"`,
    },
  });
}
