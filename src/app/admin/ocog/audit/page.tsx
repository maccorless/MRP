import { desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { parseAuditQuery, buildAuditConditions, describeAuditQuery } from "@/lib/audit-query";
import { AuditTrailView } from "@/components/AuditTrailView";

const PAGE_SIZE = 200;

export default async function OcogAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q: rawQ, page: rawPage } = await searchParams;

  const q = rawQ ?? "";
  const page = Math.max(1, parseInt(rawPage ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  const parsed = parseAuditQuery(q);
  const filterWhere = buildAuditConditions(parsed);

  let countQ = db
    .select({ total: sql<number>`cast(count(*) as int)` })
    .from(auditLog)
    .$dynamic();
  let dataQ = db
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

  if (filterWhere) {
    countQ = countQ.where(filterWhere);
    dataQ  = dataQ.where(filterWhere);
  }

  const [countResult, logs] = await Promise.all([
    countQ,
    dataQ.orderBy(desc(auditLog.createdAt)).limit(PAGE_SIZE).offset(offset),
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
        basePath="/admin/ocog/audit"
        exportHref={exportHref}
      />
    </div>
  );
}
