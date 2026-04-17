import Link from "next/link";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { applications, organizations } from "@/db/schema";
import { requireNocSession } from "@/lib/session";
import { categoryDisplayLabel } from "@/lib/category";
import { StatusBadge, STATUS_LABEL } from "@/components/StatusBadge";
import { Paginator } from "@/components/Paginator";

type StatusFilter = "all" | "pending" | "resubmitted" | "approved" | "returned" | "rejected";
type ApplicationStatus = "pending" | "resubmitted" | "approved" | "returned" | "rejected";

const PAGE_SIZE = 50;

export default async function NocQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; success?: string }>;
}) {
  const session = await requireNocSession();
  const { status: statusParam, page: pageParam, success } = await searchParams;
  const activeFilter = (statusParam ?? "all") as StatusFilter;
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
      .orderBy(desc(applications.submittedAt))
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

  const counts = Object.fromEntries(allCounts.map((r) => [r.status, r.count]));
  const totalAll = allCounts.reduce((s, r) => s + r.count, 0);
  const total = countResult[0]?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const actionableCount = (counts.pending ?? 0) + (counts.resubmitted ?? 0);

  const filters: { key: StatusFilter; label: string }[] = [
    { key: "all",         label: `All (${totalAll})` },
    { key: "pending",     label: `Pending (${counts.pending ?? 0})` },
    { key: "resubmitted", label: `Resubmitted (${counts.resubmitted ?? 0})` },
    { key: "approved",    label: `Approved (${counts.approved ?? 0})` },
    { key: "returned",    label: `Returned (${counts.returned ?? 0})` },
    { key: "rejected",    label: `Rejected (${counts.rejected ?? 0})` },
  ];

  function pageHref(p: number): string {
    const params = new URLSearchParams();
    if (activeFilter !== "all") params.set("status", activeFilter);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/admin/noc/queue?${qs}` : "/admin/noc/queue";
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          NOC Review Queue — {session.nocCode}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {actionableCount > 0
            ? `${actionableCount} application${actionableCount !== 1 ? "s" : ""} awaiting review`
            : "No applications awaiting review"}
        </p>
      </div>

      {/* Success banner */}
      {success === "approved" && (
        <div role="alert" className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
          Application approved.
        </div>
      )}
      {success === "returned" && (
        <div role="alert" className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded text-orange-800 text-sm">
          Application returned for corrections.
        </div>
      )}
      {success === "rejected" && (
        <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          Application rejected.
        </div>
      )}
      {success === "direct_entry_submitted" && (
        <div role="alert" className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
          Direct entry application submitted and approved.
        </div>
      )}

      {/* Toolbar: filter tabs + export */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 flex-wrap">
          {filters.map(({ key, label }) => (
            <Link
              key={key}
              href={key === "all" ? "/admin/noc/queue" : `/admin/noc/queue?status=${key}`}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                activeFilter === key
                  ? "bg-[#0057A8] text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
        <a
          href={activeFilter === "all" ? "/api/export/eoi" : `/api/export/eoi?status=${activeFilter}`}
          className="px-3 py-1.5 bg-white border border-gray-200 rounded text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
        >
          Export CSV ↓
        </a>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            No applications in this category.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Reference</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Organization</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Category</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Submitted</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">
                    {row.referenceNumber}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{row.orgName}</span>
                      {row.entrySource === "noc_direct" && (
                        <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">Direct Entry</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">{row.contactName}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {categoryDisplayLabel(row.categoryE, row.categoryEs, row.categoryEp, row.categoryEps, row.categoryEt, row.categoryEc)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(row.submittedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/noc/${row.id}`}
                      className="text-[#0057A8] text-xs font-medium hover:underline"
                    >
                      Review →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
