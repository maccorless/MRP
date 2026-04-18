import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, and, asc, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { enrRequests, organizations } from "@/db/schema";
import { requireIocAdminSession } from "@/lib/session";
import { saveEnrDecisions, reviseEnrDecision } from "../actions";

const ORG_TYPE_LABEL: Record<string, string> = {
  media_print_online: "Print / Online",
  media_broadcast:    "Broadcast",
  news_agency:        "News Agency",
  freelancer:         "Freelancer",
  enr:                "ENR",
  ino:                "INO (Intl Non-Gov Org)",
  if_staff:           "IF Staff",
  other:              "Other",
};

export default async function IocEnrNocPage({
  params,
  searchParams,
}: {
  params: Promise<{ nocCode: string }>;
  searchParams: Promise<{ success?: string }>;
}) {
  await requireIocAdminSession();
  const { nocCode } = await params;
  const { success } = await searchParams;

  const rows = await db
    .select({
      req: enrRequests,
      orgName: organizations.name,
      orgType: organizations.orgType,
    })
    .from(enrRequests)
    .innerJoin(organizations, eq(enrRequests.organizationId, organizations.id))
    .where(
      and(
        eq(enrRequests.nocCode, nocCode),
        eq(enrRequests.eventId, "LA28"),
        isNotNull(enrRequests.submittedAt)
      )
    )
    .orderBy(asc(enrRequests.priorityRank));

  if (rows.length === 0) notFound();

  const totalRequested = rows.reduce((s, r) => s + r.req.slotsRequested, 0);
  const totalGranted   = rows.reduce((s, r) => s + (r.req.slotsGranted ?? 0), 0);
  const isFullyDecided = rows.every((r) => r.req.decision !== null);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/admin/ioc/enr"
          className="text-xs text-gray-500 hover:text-gray-700 mb-3 inline-block"
        >
          ← Back to ENR list
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 font-mono">{nocCode}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {rows.length} org{rows.length !== 1 ? "s" : ""} · {totalRequested} slots requested
              {isFullyDecided && ` · ${totalGranted} granted`}
            </p>
          </div>
          <span className={`shrink-0 inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
            isFullyDecided ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
          }`}>
            {isFullyDecided ? "Decided" : "Awaiting decision"}
          </span>
        </div>
      </div>

      {success === "saved" && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
          Decisions saved.
        </div>
      )}

      <form action={saveEnrDecisions} className="space-y-4">
        <input type="hidden" name="noc_code" value={nocCode} />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide w-12">#</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Organisation</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Requested</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Decision</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Slots granted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(({ req, orgName, orgType }) => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border-2 ${
                      req.priorityRank <= 3
                        ? "bg-yellow-50 text-yellow-800 border-yellow-300"
                        : "bg-blue-50 text-[#0057A8] border-blue-200"
                    }`}>
                      {req.priorityRank}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="font-medium text-gray-900">{orgName}</div>
                    <div className="text-xs text-gray-400">{ORG_TYPE_LABEL[orgType] ?? orgType}</div>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-900">{req.slotsRequested}</td>
                  <td className="px-5 py-3">
                    <select
                      name={`decision_${req.id}`}
                      defaultValue={req.decision ?? ""}
                      className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="">— Select —</option>
                      <option value="granted">Granted</option>
                      <option value="partial">Partial</option>
                      <option value="denied">Denied</option>
                    </select>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <input
                      type="number"
                      name={`slots_${req.id}`}
                      defaultValue={req.slotsGranted ?? req.slotsRequested}
                      min={0}
                      className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t border-gray-200">
              <tr>
                <td colSpan={2} className="px-5 py-2.5 text-xs font-semibold text-gray-600 uppercase">Total</td>
                <td className="px-5 py-2.5 text-right font-semibold text-gray-900">{totalRequested}</td>
                <td />
                <td className="px-5 py-2.5 text-right font-semibold text-gray-900">
                  {isFullyDecided ? totalGranted : "—"}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="px-4 py-2 bg-[#0057A8] text-white text-sm font-semibold rounded hover:bg-blue-800 transition-colors cursor-pointer"
          >
            Save Decisions
          </button>
          <span className="text-xs text-gray-400">Decisions are saved immediately and visible to the NOC.</span>
        </div>
      </form>

      {rows.some(({ req }) => req.decision) && (
        <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Revise Individual Decisions</h2>
          <div className="space-y-2">
            {rows
              .filter(({ req }) => req.decision)
              .map(({ req, orgName }) => (
                <form key={req.id} action={reviseEnrDecision} className="flex items-center gap-4">
                  <input type="hidden" name="request_id" value={req.id} />
                  <span className="text-sm text-gray-900 flex-1">
                    {orgName}
                    <span className="ml-2 text-xs text-gray-400 capitalize">{req.decision} · {req.slotsGranted ?? 0} slots</span>
                  </span>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-yellow-500 text-white text-xs font-semibold rounded hover:bg-yellow-600 transition-colors cursor-pointer"
                  >
                    Revise
                  </button>
                </form>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
