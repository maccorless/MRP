import Link from "next/link";
import { eq, asc, isNotNull } from "drizzle-orm";
import { Icon } from "@/components/Icon";
import { db } from "@/db";
import { enrRequests, organizations, eventSettings } from "@/db/schema";
import { requireIocAdminSession } from "@/lib/session";
import { saveAllEnrDecisions, saveEnrPoolSize } from "./actions";
import { ORG_TYPE_LABEL } from "@/lib/labels";
import { progressWidthClass } from "@/lib/progress";
import { getAdminLang } from "@/lib/admin-lang";
import { t } from "@/lib/i18n/admin";

type SortKey = "noc" | "priority" | "granted" | "requested";

export default async function IocEnrPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; success?: string }>;
}) {
  await requireIocAdminSession();
  const lang = await getAdminLang();
  const s = t(lang);
  const { sort: sortParam, success } = await searchParams;
  const sortKey = (sortParam ?? "noc") as SortKey;

  const allRows = await db
    .select({
      req: enrRequests,
      orgName: organizations.name,
      orgType: organizations.orgType,
      orgCountry: organizations.country,
    })
    .from(enrRequests)
    .innerJoin(organizations, eq(enrRequests.organizationId, organizations.id))
    .where(isNotNull(enrRequests.submittedAt))
    .orderBy(asc(enrRequests.nocCode), asc(enrRequests.priorityRank));

  const [settings] = await db
    .select({ enrPoolSize: eventSettings.enrPoolSize })
    .from(eventSettings)
    .where(eq(eventSettings.eventId, "LA28"));
  const enrPoolSize = settings?.enrPoolSize ?? 350;

  const totalGranted = allRows.reduce((s, r) => s + (r.req.slotsGranted ?? 0), 0);
  const totalRequested = allRows.reduce((s, r) => s + r.req.slotsRequested, 0);
  const poolPct = enrPoolSize > 0 ? Math.min(100, Math.round((totalGranted / enrPoolSize) * 100)) : 0;
  const overPool = totalGranted > enrPoolSize;

  const sorted = [...allRows].sort((a, b) => {
    if (sortKey === "priority") return (a.req.priorityRank ?? 99) - (b.req.priorityRank ?? 99);
    if (sortKey === "granted") return (b.req.slotsGranted ?? -1) - (a.req.slotsGranted ?? -1);
    if (sortKey === "requested") return b.req.slotsRequested - a.req.slotsRequested;
    const nocCmp = a.req.nocCode.localeCompare(b.req.nocCode);
    return nocCmp !== 0 ? nocCmp : (a.req.priorityRank ?? 99) - (b.req.priorityRank ?? 99);
  });

  function sortHref(key: SortKey) {
    return key === "noc" ? "/admin/ioc/enr" : `/admin/ioc/enr?sort=${key}`;
  }
  function SortTh({ label, k }: { label: string; k: SortKey }) {
    const active = sortKey === k;
    return (
      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
        <Link
          href={sortHref(k)}
          className={`hover:text-brand-blue transition-colors ${active ? "text-brand-blue font-semibold" : ""}`}
        >
          <span className="inline-flex items-center gap-1">{label}{active && <Icon name="chevron-up" className="w-3 h-3" />}</span>
        </Link>
      </th>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{s.ioc.enr_combined_title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {allRows.length} organisation{allRows.length !== 1 ? "s" : ""} across all NOCs
          </p>
        </div>
      </div>

      {success === "saved" && (
        <div role="alert" className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          {s.ioc.save_grants} — saved.
        </div>
      )}
      {success === "pool_saved" && (
        <div role="alert" className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          {s.ioc.enr_pool} — updated.
        </div>
      )}

      {/* Pool size banner */}
      <div className="bg-brand-enr-hero rounded-xl p-5 text-white">
        <div className="flex items-start justify-between gap-8 flex-wrap">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide opacity-80">{s.ioc.enr_pool}</div>
            <div className={`text-4xl font-extrabold mt-1 ${overPool ? "text-red-300" : ""}`}>
              {totalGranted} <span className="text-2xl font-bold opacity-70">/ {enrPoolSize}</span>
            </div>
            <div className="text-sm opacity-75 mt-1">
              {overPool
                ? `${s.ioc.over_pool_by} ${totalGranted - enrPoolSize} slot${totalGranted - enrPoolSize !== 1 ? "s" : ""}`
                : `${enrPoolSize - totalGranted} ${s.ioc.slots_remaining}`}
            </div>
          </div>
          <div className="flex-1 min-w-[180px] max-w-xs">
            <div className="flex justify-between text-xs opacity-80 mb-2">
              <span>Granted: {totalGranted}</span>
              <span>Requested: {totalRequested}</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${overPool ? "bg-red-400" : "bg-white/80"} ${progressWidthClass(poolPct)}`}
              />
            </div>
          </div>
          <div className="shrink-0">
            <form action={saveEnrPoolSize} className="flex items-end gap-2">
              <div>
                <label htmlFor="enr_pool_size" className="block text-xs opacity-80 mb-1 font-medium">{s.ioc.pool_size_label}</label>
                <input
                  id="enr_pool_size"
                  name="enr_pool_size"
                  type="number"
                  min={0}
                  defaultValue={enrPoolSize}
                  className="w-24 border border-white/30 bg-white/20 text-white placeholder-white/50 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded border border-white/30 transition-colors cursor-pointer"
              >
                {s.ioc.update}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Combined cross-NOC table */}
      <form action={saveAllEnrDecisions}>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {allRows.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-600">
              {s.ioc.no_enr_submissions}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <SortTh label={s.ioc.col_noc} k="noc" />
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{s.ioc.col_organisation}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{s.ioc.col_country}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{s.ioc.col_type}</th>
                  <SortTh label={s.ioc.col_priority} k="priority" />
                  <SortTh label={s.ioc.col_requested} k="requested" />
                  <SortTh label={s.ioc.col_granted} k="granted" />
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{s.ioc.col_status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.map(({ req, orgName, orgType, orgCountry }) => {
                  const decided = req.decision !== null;
                  return (
                    <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/ioc/enr/${req.nocCode}`}
                          className="font-mono font-semibold text-brand-blue hover:underline text-xs"
                        >
                          {req.nocCode}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{orgName}</div>
                        {req.enrDescription && (
                          <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{req.enrDescription}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{orgCountry ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{ORG_TYPE_LABEL[orgType] ?? orgType}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border-2 ${
                          req.priorityRank <= 3
                            ? "bg-yellow-50 text-yellow-800 border-yellow-300"
                            : "bg-blue-50 text-brand-blue border-blue-200"
                        }`}>
                          {req.priorityRank}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 tabular-nums">
                        {req.slotsRequested}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          name={`slots_${req.id}`}
                          defaultValue={req.slotsGranted ?? req.slotsRequested}
                          min={0}
                          className={`w-20 border rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                            decided ? "border-green-300 bg-green-50" : "border-gray-300"
                          }`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        {decided ? (
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            req.decision === "granted" ? "bg-green-100 text-green-800" :
                            req.decision === "partial"  ? "bg-yellow-100 text-yellow-800" :
                                                         "bg-red-100 text-red-700"
                          }`}>
                            {req.decision === "granted" ? s.ioc.decision_granted : req.decision === "partial" ? s.ioc.decision_partial : s.ioc.decision_denied}
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                            {s.ioc.decision_pending}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td colSpan={5} className="px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase">Total</td>{/* common.total not in dict; kept as literal */}
                  <td className="px-4 py-2.5 text-right font-semibold text-gray-900 tabular-nums">{totalRequested}</td>
                  <td className="px-4 py-2.5 text-right font-semibold tabular-nums">
                    <span className={overPool ? "text-red-600" : "text-gray-900"}>{totalGranted}</span>
                    <span className="text-xs font-normal text-gray-400 ml-1">/ {enrPoolSize}</span>
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {allRows.length > 0 && (
          <div className="flex items-center gap-3 mt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-brand-blue text-white text-sm font-semibold rounded hover:bg-blue-800 transition-colors cursor-pointer"
            >
              {s.ioc.save_grants}
            </button>
            <span className="text-xs text-gray-400">
              Saving updates granted slots and auto-sets decision status (granted / partial / denied based on slot count).
            </span>
          </div>
        )}
      </form>
    </div>
  );
}
