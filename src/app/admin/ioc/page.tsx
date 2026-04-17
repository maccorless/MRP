import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { applications, organizations, nocQuotas, nocEoiWindows } from "@/db/schema";
import { categoryDisplayLabel } from "@/lib/category";
import {
  detectConcentrationRisk,
  detectInactiveNocs,
  detectCrossNocDuplicates,
} from "@/lib/anomaly-detect";

const STATUS_BADGE: Record<string, string> = {
  pending:     "bg-yellow-100 text-yellow-800",
  resubmitted: "bg-blue-100 text-blue-800",
  approved:    "bg-green-100 text-green-800",
  returned:    "bg-orange-100 text-orange-800",
  rejected:    "bg-red-100 text-red-800",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending", resubmitted: "Resubmitted", approved: "Candidate",
  returned: "Returned", rejected: "Rejected",
};

export default async function IocDashboard() {
  // Three parallel aggregate queries replace one unbounded full-fetch
  const [statusCounts, nocBreakdown, recentApps, anomalyApps, quotas, openWindows] =
    await Promise.all([
      // 1. Status count totals — for stat cards
      db
        .select({
          status: applications.status,
          count: sql<number>`cast(count(*) as int)`,
        })
        .from(applications)
        .where(eq(applications.eventId, "LA28"))
        .groupBy(applications.status),

      // 2. Per-NOC status breakdown — for NOC breakdown table
      db
        .select({
          nocCode: applications.nocCode,
          status: applications.status,
          count: sql<number>`cast(count(*) as int)`,
        })
        .from(applications)
        .where(eq(applications.eventId, "LA28"))
        .groupBy(applications.nocCode, applications.status),

      // 3. 15 most recent applications — for the Recent Applications widget
      db
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
        .where(eq(applications.eventId, "LA28"))
        .orderBy(desc(applications.submittedAt))
        .limit(15),

      // 4. Anomaly data — approved apps with slot requests + org flags (all NOCs)
      //    Used for: concentration risk (slots), inactivity (reviewedAt), duplicates (isMultiTerritoryFlag)
      db
        .select({
          nocCode: applications.nocCode,
          organizationId: applications.organizationId,
          orgName: organizations.name,
          status: applications.status,
          reviewedAt: applications.reviewedAt,
          requestedE:   applications.requestedE,
          requestedEs:  applications.requestedEs,
          requestedEp:  applications.requestedEp,
          requestedEps: applications.requestedEps,
          requestedEt:  applications.requestedEt,
          requestedEc:  applications.requestedEc,
          isMultiTerritoryFlag: organizations.isMultiTerritoryFlag,
        })
        .from(applications)
        .innerJoin(organizations, eq(applications.organizationId, organizations.id))
        .where(eq(applications.eventId, "LA28")),

      // 5. NOC quota totals — for concentration risk denominator
      db
        .select({
          nocCode: nocQuotas.nocCode,
          totalQuota: sql<number>`cast(
            ${nocQuotas.eTotal} + ${nocQuotas.esTotal} + ${nocQuotas.epTotal} +
            ${nocQuotas.epsTotal} + ${nocQuotas.etTotal} + ${nocQuotas.ecTotal}
            as int)`,
        })
        .from(nocQuotas)
        .where(eq(nocQuotas.eventId, "LA28")),

      // 6. Active EoI windows — for NOC inactivity detection
      db
        .select({
          nocCode: nocEoiWindows.nocCode,
          openedAt: nocEoiWindows.openedAt,
        })
        .from(nocEoiWindows)
        .where(
          eq(nocEoiWindows.isOpen, true),
          // Note: eventId filter — safe default, openedAt may be null for legacy rows
        ),
    ]);

  // ── Derive stat card counts ──────────────────────────────────────────────────
  const counts = Object.fromEntries(statusCounts.map((r) => [r.status, r.count]));
  const totalApplications = statusCounts.reduce((s, r) => s + r.count, 0);

  // ── Derive NOC breakdown map ──────────────────────────────────────────────────
  const nocMap: Record<string, Record<string, number>> = {};
  for (const r of nocBreakdown) {
    if (!nocMap[r.nocCode]) nocMap[r.nocCode] = {};
    nocMap[r.nocCode][r.status] = r.count;
  }
  const nocs = Object.entries(nocMap).sort(([a], [b]) => a.localeCompare(b));

  // ── Anomaly detection ────────────────────────────────────────────────────────
  const quotaMap = Object.fromEntries(quotas.map((q) => [q.nocCode, q.totalQuota]));
  const activeWindows = new Map(
    openWindows
      .filter((w) => w.openedAt != null)
      .map((w) => [w.nocCode, w.openedAt as Date]),
  );

  const concentrationFlags = detectConcentrationRisk(anomalyApps, quotaMap);
  const inactiveNocs = detectInactiveNocs(anomalyApps, activeWindows);
  const duplicateOrgs = detectCrossNocDuplicates(anomalyApps);

  // ── Stat cards ───────────────────────────────────────────────────────────────
  const statCards = [
    { label: "Pending",     value: counts.pending     ?? 0, color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
    { label: "Resubmitted", value: counts.resubmitted ?? 0, color: "text-blue-700 bg-blue-50 border-blue-200" },
    { label: "Candidate",   value: counts.approved    ?? 0, color: "text-green-700 bg-green-50 border-green-200" },
    { label: "Returned",    value: counts.returned    ?? 0, color: "text-orange-700 bg-orange-50 border-orange-200" },
    { label: "Rejected",    value: counts.rejected    ?? 0, color: "text-red-700 bg-red-50 border-red-200" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">IOC Overview</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            All {totalApplications} applications across all NOCs
          </p>
        </div>
        <a
          href="/api/export/eoi"
          className="px-3 py-1.5 bg-white border border-gray-200 rounded text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
        >
          Export all EoI CSV ↓
        </a>
      </div>

      {/* Anomaly banners */}
      {concentrationFlags.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-900">
          <span className="shrink-0 mt-0.5">⚠</span>
          <span>
            <strong>Concentration risk ({concentrationFlags.length} {concentrationFlags.length === 1 ? "org" : "orgs"})</strong>
            {" "}—{" "}
            {concentrationFlags
              .map((f) => `${f.orgName} (${Math.round(f.pct * 100)}% of ${f.nocCode})`)
              .join(", ")}
          </span>
        </div>
      )}

      {inactiveNocs.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-900">
          <span className="shrink-0 mt-0.5">⚠</span>
          <span>
            <strong>Inactive NOCs ({inactiveNocs.length})</strong>
            {" "}—{" "}
            {inactiveNocs.map((n) => `${n.nocCode} (${n.daysSince}d)`).join(", ")}
          </span>
        </div>
      )}

      {duplicateOrgs.length > 0 && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-sm text-purple-800">
          <strong>Cross-NOC orgs ({duplicateOrgs.length})</strong>
          {" "}—{" "}
          {duplicateOrgs.join(", ")}
          {" · "}
          <a href="/admin/ioc/orgs?filter=multi" className="underline">
            Review
          </a>
        </div>
      )}

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
              <th className="text-right px-5 py-2 text-xs font-medium text-green-600 uppercase tracking-wide">Candidate</th>
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
            {recentApps.map((row) => (
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
