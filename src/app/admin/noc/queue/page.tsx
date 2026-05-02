import Link from "next/link";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { Icon } from "@/components/Icon";
import { db } from "@/db";
import { applications, organizations } from "@/db/schema";
import { requireNocSession } from "@/lib/session";
import { getAdminLang } from "@/lib/admin-lang";
import { t } from "@/lib/i18n/admin";
import { Paginator } from "@/components/Paginator";
import { QueueClient } from "./QueueClient";
import { detectWithinNocDuplicates, detectWithinNocDuplicatePairs, type DuplicatePairInfo } from "@/lib/anomaly-detect";
import { ORG_TYPE_PRIORITY } from "@/lib/labels";

type StatusFilter = "all" | "pending" | "resubmitted" | "approved" | "returned" | "rejected";
type ApplicationStatus = "pending" | "resubmitted" | "approved" | "returned" | "rejected";
type SortKey = "submitted" | "priority";

const PAGE_SIZE = 50;

// Build a SQL CASE expression that maps organizations.org_type to a numeric
// priority for the IOC suggested allocation hierarchy (Strategic Plan §1.6).
// Lower number = higher priority. Unknown types fall through to 99.
function orgTypePriorityCase() {
  const entries = Object.entries(ORG_TYPE_PRIORITY);
  const cases = entries
    .map(([t, p]) => sql`when ${organizations.orgType} = ${t} then ${p}`);
  return sql<number>`case ${sql.join(cases, sql` `)} else 99 end`;
}

export default async function NocQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; success?: string; sort?: string }>;
}) {
  const session = await requireNocSession();
  const lang = await getAdminLang();
  const s = t(lang);
  const { status: statusParam, page: pageParam, success, sort: sortParam } = await searchParams;
  const activeFilter = (statusParam ?? "all") as StatusFilter;
  const activeSort: SortKey = sortParam === "priority" ? "priority" : "submitted";
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  // Parallel queries:
  // 1. Status counts for all statuses (tab bar)
  // 2. Paginated rows for the active filter
  // 3. Total count for the active filter (pagination controls)
  const [allCounts, rows, countResult] = await Promise.all([
    // Tab bar counts — one GROUP BY query, no full fetch
    db
      .select({
        status: applications.status,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(applications)
      .where(
        and(
          eq(applications.nocCode, session.nocCode),
          eq(applications.eventId, "LA28"),
        ),
      )
      .groupBy(applications.status),

    // Paginated rows for the active tab
    db
      .select({
        id: applications.id,
        organizationId: applications.organizationId,
        referenceNumber: applications.referenceNumber,
        status: applications.status,
        entrySource: applications.entrySource,
        categoryE:   applications.categoryE,
        categoryEs:  applications.categoryEs,
        categoryEp:  applications.categoryEp,
        categoryEps: applications.categoryEps,
        categoryEt:  applications.categoryEt,
        categoryEc:  applications.categoryEc,
        contactName: applications.contactName,
        submittedAt: applications.submittedAt,
        orgName: organizations.name,
        orgType: organizations.orgType,
      })
      .from(applications)
      .innerJoin(organizations, eq(applications.organizationId, organizations.id))
      .where(
        activeFilter === "all"
          ? and(
              eq(applications.nocCode, session.nocCode),
              eq(applications.eventId, "LA28"),
            )
          : and(
              eq(applications.nocCode, session.nocCode),
              eq(applications.eventId, "LA28"),
              eq(applications.status, activeFilter as ApplicationStatus),
            ),
      )
      .orderBy(
        ...(activeSort === "priority"
          ? [asc(orgTypePriorityCase()), desc(applications.submittedAt)]
          : [desc(applications.submittedAt)])
      )
      .limit(PAGE_SIZE)
      .offset(offset),

    // Total count for pagination — matches the active filter's WHERE clause
    db
      .select({ total: sql<number>`cast(count(*) as int)` })
      .from(applications)
      .where(
        activeFilter === "all"
          ? and(
              eq(applications.nocCode, session.nocCode),
              eq(applications.eventId, "LA28"),
            )
          : and(
              eq(applications.nocCode, session.nocCode),
              eq(applications.eventId, "LA28"),
              eq(applications.status, activeFilter as ApplicationStatus),
            ),
      ),
  ]);

  const [duplicateOrgIdsSet, duplicatePairsMap] = await Promise.all([
    detectWithinNocDuplicates(session.nocCode),
    detectWithinNocDuplicatePairs(session.nocCode),
  ]);
  const duplicateOrgIds = Array.from(duplicateOrgIdsSet);
  const duplicatePairs: Record<string, DuplicatePairInfo[]> = Object.fromEntries(duplicatePairsMap);
  const orgIdToAppId: Record<string, string> = Object.fromEntries(
    rows.map((r) => [r.organizationId, r.id]),
  );

  const counts = Object.fromEntries(allCounts.map((r) => [r.status, r.count]));
  const totalAll = allCounts.reduce((s, r) => s + r.count, 0);
  const total = countResult[0]?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const actionableCount = (counts.pending ?? 0) + (counts.resubmitted ?? 0);

  const filters: { key: StatusFilter; label: string }[] = [
    { key: "all",         label: `${s.queue.all_statuses} (${totalAll})` },
    { key: "pending",     label: `${s.status.pending} (${counts.pending ?? 0})` },
    { key: "resubmitted", label: `Resubmitted (${counts.resubmitted ?? 0})` },
    { key: "approved",    label: `Candidate (${counts.approved ?? 0})` },
    { key: "returned",    label: `${s.status.returned} (${counts.returned ?? 0})` },
    { key: "rejected",    label: `${s.status.rejected} (${counts.rejected ?? 0})` },
  ];

  function pageHref(p: number): string {
    const params = new URLSearchParams();
    if (activeFilter !== "all") params.set("status", activeFilter);
    if (activeSort !== "submitted") params.set("sort", activeSort);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/admin/noc/queue?${qs}` : "/admin/noc/queue";
  }

  function sortHref(key: SortKey): string {
    const params = new URLSearchParams();
    if (activeFilter !== "all") params.set("status", activeFilter);
    if (key !== "submitted") params.set("sort", key);
    const qs = params.toString();
    return qs ? `/admin/noc/queue?${qs}` : "/admin/noc/queue";
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          {s.queue.title} — {session.nocCode}
        </h1>
        <p className="text-sm text-gray-600 mt-0.5">
          {actionableCount > 0
            ? `${actionableCount} application${actionableCount !== 1 ? "s" : ""} awaiting review`
            : "No applications awaiting review"}
        </p>
      </div>

      {/* Success banner */}
      {success === "approved" && (
        <div role="alert" className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          Application approved.
        </div>
      )}
      {success === "returned" && (
        <div role="alert" className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-800 text-sm">
          Application returned for corrections.
        </div>
      )}
      {success === "rejected" && (
        <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          Application rejected.
        </div>
      )}
      {success === "direct_entry_submitted" && (
        <div role="alert" className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          Direct entry application submitted and approved.
        </div>
      )}

      {/* Toolbar: filter tabs + export */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 flex-wrap">
          {filters.map(({ key, label }) => {
            const baseHref = key === "all" ? "/admin/noc/queue" : `/admin/noc/queue?status=${key}`;
            const href = activeSort !== "submitted"
              ? `${baseHref}${baseHref.includes("?") ? "&" : "?"}sort=${activeSort}`
              : baseHref;
            return (
              <Link
                key={key}
                href={href}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  activeFilter === key
                    ? "bg-brand-blue text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
        <a
          href={activeFilter === "all" ? "/api/export/eoi" : `/api/export/eoi?status=${activeFilter}`}
          className="px-3 py-1.5 bg-white border border-gray-200 rounded text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
        >
          Export CSV <Icon name="download" className="inline w-3.5 h-3.5 ml-0.5 -mt-0.5" />
        </a>
      </div>

      {/* Sort selector — IOC suggested priority is per Strategic Plan §1.6.
          The plan says "should consider", not "must enforce" — sort is
          a soft signal; NOCs retain allocation discretion. */}
      <div className="flex items-center gap-3 mb-4 text-xs">
        <span className="text-gray-500">Sort by:</span>
        <Link
          href={sortHref("submitted")}
          className={`px-2.5 py-1 rounded font-medium transition-colors ${
            activeSort === "submitted"
              ? "bg-gray-700 text-white"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          Most recent submission
        </Link>
        <Link
          href={sortHref("priority")}
          title="National news agencies first, then sports agencies, daily newspapers, sports dailies, specialist outlets, general magazines (per IOC Strategic Plan §1.6 — guidance only, NOC retains discretion)."
          className={`px-2.5 py-1 rounded font-medium transition-colors ${
            activeSort === "priority"
              ? "bg-gray-700 text-white"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          IOC suggested priority
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No applications in this category.
          </div>
        ) : (
          <QueueClient
            rows={rows}
            allIds={rows.map((r) => r.id)}
            duplicateOrgIds={duplicateOrgIds}
            duplicatePairs={duplicatePairs}
            orgIdToAppId={orgIdToAppId}
            strings={{
              search_placeholder: s.queue.search_placeholder,
              col_org:    s.queue.col_org,
              col_status: s.queue.col_status,
              col_submitted: s.queue.col_submitted,
              col_actions: s.queue.col_actions,
              empty_queue: s.queue.empty_queue,
            }}
          />
        )}
      </div>

      {/* Pagination controls */}
      <Paginator
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={PAGE_SIZE}
        pageHref={pageHref}
      />
    </div>
  );
}
