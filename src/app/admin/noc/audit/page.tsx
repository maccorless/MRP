import { desc, eq, or, and, sql } from "drizzle-orm";
import { db } from "@/db";
import { auditLog, organizations, adminUsers } from "@/db/schema";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getAdminLang } from "@/lib/admin-lang";
import { t } from "@/lib/i18n/admin";
import { parseAuditQuery, buildAuditConditions, describeAuditQuery } from "@/lib/audit-query";
import { AuditTrailView } from "@/components/AuditTrailView";

const PAGE_SIZE = 200;

export default async function NocAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "noc_admin" || !session.nocCode) {
    redirect("/admin/login");
  }
  const lang = await getAdminLang();
  const s = t(lang);

  const { q: rawQ, page: rawPage } = await searchParams;

  const q = rawQ ?? "";
  const page = Math.max(1, parseInt(rawPage ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  const parsed = parseAuditQuery(q);
  const filterWhere = buildAuditConditions(parsed);

  // NOC scope: entries linked to this NOC's orgs OR performed by this NOC's admin users.
  // adminUsers.id is uuid; auditLog.actorId is text — cast for the join.
  const nocScope = or(
    eq(organizations.nocCode, session.nocCode),
    eq(adminUsers.nocCode, session.nocCode),
  )!;

  const whereClause = filterWhere ? and(nocScope, filterWhere) : nocScope;

  const [countResult, logs] = await Promise.all([
    db
      .select({ total: sql<number>`cast(count(*) as int)` })
      .from(auditLog)
      .leftJoin(organizations, eq(auditLog.organizationId, organizations.id))
      .leftJoin(adminUsers, sql`${adminUsers.id}::text = ${auditLog.actorId}`)
      .where(whereClause),
    db
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
      .orderBy(desc(auditLog.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset),
  ]);

  const total = countResult[0]?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const exportParams = new URLSearchParams();
  if (q) exportParams.set("q", q);
  const exportHref = `/api/export/audit${exportParams.size > 0 ? "?" + exportParams.toString() : ""}`;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <AuditTrailView
        logs={logs}
        total={total}
        page={page}
        totalPages={totalPages}
        q={q}
        filterDescription={describeAuditQuery(parsed)}
        basePath="/admin/noc/audit"
        exportHref={exportHref}
        title={s.audit.title}
        exportLabel={s.audit.export}
      />
    </div>
  );
}
