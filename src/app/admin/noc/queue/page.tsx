import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, organizations } from "@/db/schema";
import { requireNocSession } from "@/lib/session";
import { categoryDisplayLabel } from "@/lib/category";

const STATUS_BADGE: Record<string, string> = {
  pending:     "bg-yellow-100 text-yellow-800",
  resubmitted: "bg-blue-100 text-blue-800",
  approved:    "bg-green-100 text-green-800",
  returned:    "bg-orange-100 text-orange-800",
  rejected:    "bg-red-100 text-red-800",
};

const STATUS_LABEL: Record<string, string> = {
  pending:     "Pending",
  resubmitted: "Resubmitted",
  approved:    "Approved",
  returned:    "Returned",
  rejected:    "Rejected",
};

type StatusFilter = "all" | "pending" | "resubmitted" | "approved" | "returned" | "rejected";

export default async function NocQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; success?: string }>;
}) {
  const session = await requireNocSession();
  const { status: statusParam, success } = await searchParams;
  const activeFilter = (statusParam ?? "all") as StatusFilter;

  const rows = await db
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
    .where(eq(applications.nocCode, session.nocCode))
    .orderBy(desc(applications.submittedAt));

  // Counts per status
  const counts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});
  const actionableCount = (counts.pending ?? 0) + (counts.resubmitted ?? 0);

  const filtered =
    activeFilter === "all" ? rows : rows.filter((r) => r.status === activeFilter);

  const filters: { key: StatusFilter; label: string }[] = [
    { key: "all", label: `All (${rows.length})` },
    { key: "pending", label: `Pending (${counts.pending ?? 0})` },
    { key: "resubmitted", label: `Resubmitted (${counts.resubmitted ?? 0})` },
    { key: "approved", label: `Approved (${counts.approved ?? 0})` },
    { key: "returned", label: `Returned (${counts.returned ?? 0})` },
    { key: "rejected", label: `Rejected (${counts.rejected ?? 0})` },
  ];

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
      {success === "fast_track_submitted" && (
        <div role="alert" className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
          Fast-track application submitted and approved.
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
        {filtered.length === 0 ? (
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
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">
                    {row.referenceNumber}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{row.orgName}</span>
                      {row.entrySource === "noc_direct" && (
                        <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">NOC Direct</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">{row.contactName}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {categoryDisplayLabel(row.categoryE, row.categoryEs, row.categoryEp, row.categoryEps, row.categoryEt, row.categoryEc)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[row.status]}`}>
                      {STATUS_LABEL[row.status] ?? row.status}
                    </span>
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
    </div>
  );
}
