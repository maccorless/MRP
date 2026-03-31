import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, organizations } from "@/db/schema";
import { categoryDisplayLabel } from "@/lib/category";

const STATUS_BADGE: Record<string, string> = {
  pending:     "bg-yellow-100 text-yellow-800",
  resubmitted: "bg-blue-100 text-blue-800",
  approved:    "bg-green-100 text-green-800",
  returned:    "bg-orange-100 text-orange-800",
  rejected:    "bg-red-100 text-red-800",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending", resubmitted: "Resubmitted", approved: "Approved",
  returned: "Returned", rejected: "Rejected",
};

export default async function IocDashboard() {
  const rows = await db
    .select({
      id: applications.id,
      referenceNumber: applications.referenceNumber,
      nocCode: applications.nocCode,
      status: applications.status,
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
    .orderBy(desc(applications.submittedAt));

  // Status counts
  const counts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  // NOC breakdown
  const nocMap = rows.reduce<Record<string, Record<string, number>>>((acc, r) => {
    if (!acc[r.nocCode]) acc[r.nocCode] = {};
    acc[r.nocCode][r.status] = (acc[r.nocCode][r.status] ?? 0) + 1;
    return acc;
  }, {});
  const nocs = Object.entries(nocMap).sort(([a], [b]) => a.localeCompare(b));

  const statCards = [
    { label: "Pending",     value: counts.pending     ?? 0, color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
    { label: "Resubmitted", value: counts.resubmitted ?? 0, color: "text-blue-700 bg-blue-50 border-blue-200" },
    { label: "Approved",    value: counts.approved    ?? 0, color: "text-green-700 bg-green-50 border-green-200" },
    { label: "Returned",    value: counts.returned    ?? 0, color: "text-orange-700 bg-orange-50 border-orange-200" },
    { label: "Rejected",    value: counts.rejected    ?? 0, color: "text-red-700 bg-red-50 border-red-200" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">IOC Overview</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            All {rows.length} applications across all NOCs
          </p>
        </div>
        <a
          href="/api/export/eoi"
          className="px-3 py-1.5 bg-white border border-gray-200 rounded text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
        >
          Export all EoI CSV ↓
        </a>
      </div>

      {/* Status stat cards */}
      <div className="grid grid-cols-5 gap-3">
        {statCards.map(({ label, value, color }) => (
          <div key={label} className={`rounded-lg border p-4 ${color}`}>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs font-medium mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* NOC breakdown */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">By NOC</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-5 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">NOC</th>
              <th className="text-right px-5 py-2 text-xs font-medium text-yellow-600 uppercase tracking-wide">Pending</th>
              <th className="text-right px-5 py-2 text-xs font-medium text-blue-600 uppercase tracking-wide">Resubmitted</th>
              <th className="text-right px-5 py-2 text-xs font-medium text-green-600 uppercase tracking-wide">Approved</th>
              <th className="text-right px-5 py-2 text-xs font-medium text-orange-600 uppercase tracking-wide">Returned</th>
              <th className="text-right px-5 py-2 text-xs font-medium text-red-600 uppercase tracking-wide">Rejected</th>
              <th className="text-right px-5 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {nocs.map(([noc, statusMap]) => {
              const total = Object.values(statusMap).reduce((s, n) => s + n, 0);
              return (
                <tr key={noc} className="hover:bg-gray-50">
                  <td className="px-5 py-2.5 font-mono font-semibold text-gray-900">{noc}</td>
                  <td className="px-5 py-2.5 text-right text-gray-700">{statusMap.pending ?? 0}</td>
                  <td className="px-5 py-2.5 text-right text-gray-700">{statusMap.resubmitted ?? 0}</td>
                  <td className="px-5 py-2.5 text-right text-gray-700">{statusMap.approved ?? 0}</td>
                  <td className="px-5 py-2.5 text-right text-gray-700">{statusMap.returned ?? 0}</td>
                  <td className="px-5 py-2.5 text-right text-gray-700">{statusMap.rejected ?? 0}</td>
                  <td className="px-5 py-2.5 text-right font-semibold text-gray-900">{total}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Recent applications */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Recent Applications</h2>
          <span className="text-xs text-gray-400">Showing latest 15</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-5 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Reference</th>
              <th className="text-left px-5 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Organization</th>
              <th className="text-left px-5 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">NOC</th>
              <th className="text-left px-5 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Category</th>
              <th className="text-left px-5 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-5 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Submitted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.slice(0, 15).map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-5 py-2.5 font-mono text-xs text-gray-700">{row.referenceNumber}</td>
                <td className="px-5 py-2.5">
                  <div className="font-medium text-gray-900">{row.orgName}</div>
                  <div className="text-xs text-gray-400">{row.contactName}</div>
                </td>
                <td className="px-5 py-2.5 font-mono text-xs text-gray-600">{row.nocCode}</td>
                <td className="px-5 py-2.5 text-gray-600">{categoryDisplayLabel(row.categoryE, row.categoryEs, row.categoryEp, row.categoryEps, row.categoryEt, row.categoryEc)}</td>
                <td className="px-5 py-2.5">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[row.status]}`}>
                    {STATUS_LABEL[row.status]}
                  </span>
                </td>
                <td className="px-5 py-2.5 text-xs text-gray-500">
                  {new Date(row.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
