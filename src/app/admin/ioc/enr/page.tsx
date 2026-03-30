import Link from "next/link";
import { eq, asc, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/db";
import { enrRequests, enrQuotas, organizations } from "@/db/schema";
import { requireIocAdminSession } from "@/lib/session";

type EnrStatus = "not_submitted" | "awaiting" | "decided";

const STATUS_BADGE: Record<EnrStatus, string> = {
  not_submitted: "bg-gray-100 text-gray-500",
  awaiting:      "bg-yellow-100 text-yellow-800",
  decided:       "bg-green-100 text-green-800",
};
const STATUS_LABEL: Record<EnrStatus, string> = {
  not_submitted: "Not submitted",
  awaiting:      "Awaiting decision",
  decided:       "Decided",
};

type StatusFilter = "all" | EnrStatus;

export default async function IocEnrPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireIocAdminSession();
  const { status: statusParam } = await searchParams;
  const activeFilter = (statusParam ?? "all") as StatusFilter;

  // All submitted ENR requests
  const allRequests = await db
    .select({
      req: enrRequests,
      orgName: organizations.name,
    })
    .from(enrRequests)
    .innerJoin(organizations, eq(enrRequests.organizationId, organizations.id))
    .where(isNotNull(enrRequests.submittedAt));

  // Holdback pool totals (sum across all enrQuotas)
  const quotas = await db.select().from(enrQuotas);
  const totalPool = quotas.reduce((s, q) => s + q.enrTotal, 0);
  const totalGranted = allRequests.reduce((s, r) => s + (r.req.slotsGranted ?? 0), 0);
  const totalRequested = allRequests.reduce((s, r) => s + r.req.slotsRequested, 0);

  // Build per-NOC summary
  const nocMap = allRequests.reduce<Record<string, { total: number; decided: number; requested: number; granted: number }>>((acc, { req }) => {
    if (!acc[req.nocCode]) acc[req.nocCode] = { total: 0, decided: 0, requested: 0, granted: 0 };
    acc[req.nocCode].total++;
    acc[req.nocCode].requested += req.slotsRequested;
    if (req.decision !== null) {
      acc[req.nocCode].decided++;
      acc[req.nocCode].granted += req.slotsGranted ?? 0;
    }
    return acc;
  }, {});

  type NocRow = {
    nocCode: string;
    total: number;
    decided: number;
    requested: number;
    granted: number;
    status: EnrStatus;
  };

  const nocRows: NocRow[] = Object.entries(nocMap)
    .map(([nocCode, data]) => ({
      nocCode,
      ...data,
      status: (data.decided === data.total ? "decided" : "awaiting") as EnrStatus,
    }))
    .sort((a, b) => a.nocCode.localeCompare(b.nocCode));

  const counts = nocRows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  const filtered = activeFilter === "all" ? nocRows : nocRows.filter((r) => r.status === activeFilter);

  const filters: { key: StatusFilter; label: string }[] = [
    { key: "all",           label: `All (${nocRows.length})` },
    { key: "awaiting",      label: `Awaiting decision (${counts.awaiting ?? 0})` },
    { key: "decided",       label: `Decided (${counts.decided ?? 0})` },
    { key: "not_submitted", label: `Not submitted (${counts.not_submitted ?? 0})` },
  ];

  const poolPct = totalPool > 0 ? Math.min(100, Math.round((totalGranted / totalPool) * 100)) : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">ENR Review</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {counts.awaiting ?? 0} NOC{(counts.awaiting ?? 0) !== 1 ? "s" : ""} awaiting decision
        </p>
      </div>

      {/* Holdback pool banner */}
      <div className="rounded-xl p-5 text-white" style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #0057A8 100%)" }}>
        <div className="flex items-start justify-between gap-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide opacity-80">Holdback Pool</div>
            <div className="text-4xl font-extrabold mt-1">{totalPool > 0 ? totalPool : "—"}</div>
            <div className="text-sm opacity-75 mt-1">total ENR slots across all NOCs</div>
          </div>
          <div className="flex-1 max-w-xs">
            <div className="flex justify-between text-xs opacity-80 mb-2">
              <span>Granted: {totalGranted}</span>
              <span>Remaining: {totalPool > 0 ? totalPool - totalGranted : "—"}</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white/80 rounded-full" style={{ width: `${poolPct}%` }} />
            </div>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <div className="text-xl font-bold">{totalRequested}</div>
              <div className="text-xs opacity-70 uppercase tracking-wide">Requested</div>
            </div>
            <div>
              <div className="text-xl font-bold">{nocRows.length}</div>
              <div className="text-xs opacity-70 uppercase tracking-wide">NOCs</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {filters.map(({ key, label }) => (
          <Link
            key={key}
            href={key === "all" ? "/admin/ioc/enr" : `/admin/ioc/enr?status=${key}`}
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

      {/* NOC list table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            {nocRows.length === 0 ? "No ENR submissions received yet." : "No NOCs in this category."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">NOC</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Orgs</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Requested</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Granted</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((row) => (
                <tr key={row.nocCode} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-mono font-semibold text-gray-900">{row.nocCode}</td>
                  <td className="px-5 py-3 text-right text-gray-700">{row.total}</td>
                  <td className="px-5 py-3 text-right text-gray-700">{row.requested}</td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-900">
                    {row.decided > 0 ? row.granted : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[row.status]}`}>
                      {STATUS_LABEL[row.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/admin/ioc/enr/${row.nocCode}`}
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
