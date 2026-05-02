import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { nocQuotas, quotaChanges, eventSettings } from "@/db/schema";
import { requireIocAdminSession } from "@/lib/session";
import { importQuotas, saveQuotaEdits, saveEventSettings } from "./actions";
import { getAdminLang } from "@/lib/admin-lang";
import { t } from "@/lib/i18n/admin";

export default async function QuotasPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; success?: string; error?: string; count?: string }>;
}) {
  await requireIocAdminSession();
  const lang = await getAdminLang();
  const s = t(lang);
  const { edit, success, error, count } = await searchParams;
  const isEditing = edit === "1";

  const [quotas, recentChanges, settingsRows] = await Promise.all([
    db.select().from(nocQuotas).orderBy(asc(nocQuotas.nocCode)),
    db.select().from(quotaChanges).orderBy(desc(quotaChanges.changedAt)).limit(50),
    db.select().from(eventSettings).where(eq(eventSettings.eventId, "LA28")),
  ]);

  const settings = settingsRows[0] ?? { capacity: 6000, iocHoldback: 0 };

  // Aggregate stats
  const totalPress = quotas.reduce((s, q) => s + q.pressTotal, 0);
  const totalPhoto = quotas.reduce((s, q) => s + q.photoTotal, 0);
  const totalNocE  = quotas.reduce((s, q) => s + q.nocETotal,  0);
  const totalNocEs = quotas.reduce((s, q) => s + q.nocEsTotal, 0);
  const totalE     = quotas.reduce((s, q) => s + q.eTotal,     0);
  const totalEs    = quotas.reduce((s, q) => s + q.esTotal,    0);
  const totalEp    = quotas.reduce((s, q) => s + q.epTotal,    0);
  const totalEps   = quotas.reduce((s, q) => s + q.epsTotal,   0);
  const totalEt    = quotas.reduce((s, q) => s + q.etTotal,    0);
  const totalEc    = quotas.reduce((s, q) => s + q.ecTotal,    0);
  const manualEditCount = recentChanges.filter((c) => c.changeSource === "manual_edit").length;
  const lastImport = recentChanges.find((c) => c.changeSource === "import");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{s.ioc.quotas_title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {quotas.length} NOCs · {totalPress} press slots · {totalPhoto} photo slots
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <Link
              href="/admin/ioc/quotas"
              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              {s.common.cancel}
            </Link>
          ) : (
            <Link
              href="/admin/ioc/quotas?edit=1"
              className="px-3 py-1.5 text-xs font-medium text-white bg-brand-blue rounded hover:bg-blue-800 transition-colors"
            >
              ✎ {s.ioc.edit_quotas}
            </Link>
          )}
        </div>
      </div>

      {/* Banners */}
      {success === "imported" && (
        <div role="alert" className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          Imported {count} NOC quota{count !== "1" ? "s" : ""} successfully.
        </div>
      )}
      {success === "saved" && (
        <div role="alert" className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          Quota edits saved.
        </div>
      )}
      {success === "settings_saved" && (
        <div role="alert" className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          Event settings saved.
        </div>
      )}
      {error === "empty" && (
        <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          CSV was empty — nothing imported.
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{quotas.length}</div>
          <div className="text-xs text-gray-500 mt-0.5 font-medium">{s.ioc.nocs_with_quotas}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{totalPress + totalPhoto + totalNocE}</div>
          <div className="text-xs text-gray-500 mt-0.5 font-medium">{s.ioc.total_slots} ({totalPress}P + {totalPhoto}Ph + {totalNocE}NocE)</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{manualEditCount}</div>
          <div className="text-xs text-gray-500 mt-0.5 font-medium">
            {s.ioc.manual_edits_label}
            {lastImport && (
              <span className="block text-gray-400 font-normal">
                {s.ioc.last_import} {lastImport.changedAt ? new Date(lastImport.changedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Event Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-blue-200">
        <div className="px-5 py-3 border-b border-blue-100 bg-blue-50">
          <h2 className="text-sm font-semibold text-blue-900">{s.ioc.event_settings_title}</h2>
          <p className="text-xs text-blue-700 mt-0.5">
            Set the total accreditation capacity target and IOC holdback pool. The master dashboard tracks distributed quotas against this capacity.
          </p>
        </div>
        <form action={saveEventSettings} className="px-5 py-4 flex flex-wrap items-end gap-6">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {s.ioc.event_capacity_label}
            </label>
            <input
              type="number"
              name="capacity"
              min={0}
              defaultValue={settings.capacity}
              className="w-28 border border-gray-300 rounded px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {s.ioc.ioc_holdback_label}
            </label>
            <input
              type="number"
              name="ioc_holdback"
              min={0}
              defaultValue={settings.iocHoldback}
              className="w-28 border border-gray-300 rounded px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-1.5 bg-brand-blue text-white text-sm font-semibold rounded hover:bg-blue-800 transition-colors"
          >
            {s.ioc.save_settings}
          </button>
        </form>
      </div>

      {/* Import section (always visible, not gated on edit mode) */}
      <details className="bg-white rounded-lg shadow-sm border border-gray-200">
        <summary className="px-5 py-3 text-sm font-semibold text-gray-700 cursor-pointer select-none">
          {s.ioc.import_csv_title}
        </summary>
        <div className="px-5 pb-5 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-3">
            Paste CSV rows in the format <code className="bg-gray-100 px-1 rounded font-mono">NOC,E,Es,EP,EPs,ET,EC,NocE</code> — one row per line.
            Columns: E = journalist, Es = sport-specific journalist, EP = photographer, EPs = sport-specific photographer, ET = technician, EC = support, NocE = press attaché.
            Existing quotas are updated; new NOCs are inserted. All changes are logged.
          </p>
          <form action={importQuotas} className="space-y-3">
            <textarea
              name="csv"
              rows={6}
              placeholder={"USA,10,2,6,2,2,1,3\nGBR,8,2,5,1,2,1,2\nAUS,7,1,4,1,2,1,2"}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-y"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-brand-blue text-white text-sm font-semibold rounded hover:bg-blue-800 transition-colors cursor-pointer"
            >
              {s.ioc.import_quotas_btn}
            </button>
          </form>
        </div>
      </details>

      {/* Quota table */}
      {quotas.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-sm text-gray-600">
          {s.ioc.no_quotas}
        </div>
      ) : isEditing ? (
        <form action={saveQuotaEdits}>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-blue-50 flex items-center gap-2">
              <span className="text-xs font-semibold text-blue-800">Edit mode — modify values then save</span>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide sticky left-0 bg-gray-50">NOC</th>
                  {(["E","Es","EP","EPs","ET","EC","NocE","NocEs"] as const).map((h) => (
                    <th key={h} className="text-right px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Total</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{s.ioc.col_when}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {quotas.map((q) => {
                  const cats = [
                    { key: "e",      val: q.eTotal    },
                    { key: "es",     val: q.esTotal   },
                    { key: "ep",     val: q.epTotal   },
                    { key: "eps",    val: q.epsTotal  },
                    { key: "et",     val: q.etTotal   },
                    { key: "ec",     val: q.ecTotal   },
                    { key: "noc_e",  val: q.nocETotal },
                    { key: "noc_es", val: q.nocEsTotal },
                  ];
                  return (
                  <tr key={q.id}>
                    <td className="px-4 py-2 font-mono font-semibold text-gray-900 sticky left-0 bg-white">{q.nocCode}</td>
                    {cats.map(({ key, val }) => (
                      <td key={key} className="px-3 py-2 text-right">
                        <input
                          type="number"
                          name={`${key}_${q.nocCode}`}
                          defaultValue={val}
                          min={0}
                          className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-brand-blue"
                        />
                      </td>
                    ))}
                    <td className="px-4 py-2 text-right text-gray-500">{q.pressTotal + q.photoTotal + q.nocETotal + q.nocEsTotal}</td>
                    <td className="px-4 py-2 text-xs text-gray-400">
                      {q.setAt
                        ? new Date(q.setAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : "—"}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 flex items-center gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded hover:bg-green-700 transition-colors cursor-pointer"
              >
                {s.common.save}
              </button>
              <Link
                href="/admin/ioc/quotas"
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                {s.common.cancel}
              </Link>
              <span className="text-xs text-gray-400 ml-2">All changes are logged in the audit trail.</span>
            </div>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide sticky left-0 bg-gray-50">NOC</th>
                {(["E","Es","EP","EPs","ET","EC","NocE","NocEs"] as const).map((h) => (
                  <th key={h} className="text-right px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Total</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{s.ioc.last_import}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quotas.map((q) => (
                <tr key={q.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-mono font-semibold text-gray-900 sticky left-0 bg-white">{q.nocCode}</td>
                  <td className="px-3 py-2.5 text-right text-gray-700">{q.eTotal}</td>
                  <td className="px-3 py-2.5 text-right text-gray-700">{q.esTotal}</td>
                  <td className="px-3 py-2.5 text-right text-gray-700">{q.epTotal}</td>
                  <td className="px-3 py-2.5 text-right text-gray-700">{q.epsTotal}</td>
                  <td className="px-3 py-2.5 text-right text-gray-700">{q.etTotal}</td>
                  <td className="px-3 py-2.5 text-right text-gray-700">{q.ecTotal}</td>
                  <td className="px-3 py-2.5 text-right text-gray-700">{q.nocETotal}</td>
                  <td className="px-3 py-2.5 text-right text-gray-700">{q.nocEsTotal}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-gray-900">{q.eTotal + q.esTotal + q.epTotal + q.epsTotal + q.etTotal + q.ecTotal + q.nocETotal + q.nocEsTotal}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-400">
                    {q.setAt
                      ? new Date(q.setAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t border-gray-200">
              <tr>
                <td className="px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase sticky left-0 bg-gray-50">Total</td>
                <td className="px-3 py-2.5 text-right font-semibold text-gray-900">{totalE}</td>
                <td className="px-3 py-2.5 text-right font-semibold text-gray-900">{totalEs}</td>
                <td className="px-3 py-2.5 text-right font-semibold text-gray-900">{totalEp}</td>
                <td className="px-3 py-2.5 text-right font-semibold text-gray-900">{totalEps}</td>
                <td className="px-3 py-2.5 text-right font-semibold text-gray-900">{totalEt}</td>
                <td className="px-3 py-2.5 text-right font-semibold text-gray-900">{totalEc}</td>
                <td className="px-3 py-2.5 text-right font-semibold text-gray-900">{totalNocE}</td>
                <td className="px-3 py-2.5 text-right font-semibold text-gray-900">{totalNocEs}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-gray-900">{totalPress + totalPhoto + totalNocE + totalNocEs}</td>
                <td />
              </tr>
            </tfoot>
          </table>
          </div>
        </div>
      )}

      {/* Recent change log */}
      {recentChanges.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">{s.ioc.recent_changes}</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">{s.ioc.col_noc}</th>
                <th className="text-left px-5 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">{s.ioc.col_type}</th>
                <th className="text-right px-5 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">{s.ioc.col_old}</th>
                <th className="text-right px-5 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">{s.ioc.col_new}</th>
                <th className="text-left px-5 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">{s.ioc.col_source}</th>
                <th className="text-left px-5 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">{s.ioc.col_when}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentChanges.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-5 py-2 font-mono text-xs font-semibold text-gray-700">{c.nocCode}</td>
                  <td className="px-5 py-2 text-gray-600 capitalize">{c.quotaType}</td>
                  <td className="px-5 py-2 text-right text-gray-400">{c.oldValue}</td>
                  <td className="px-5 py-2 text-right font-semibold text-gray-900">{c.newValue}</td>
                  <td className="px-5 py-2">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      c.changeSource === "import"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-orange-100 text-orange-700"
                    }`}>
                      {c.changeSource === "import" ? s.ioc.source_import : s.ioc.source_manual_edit}
                    </span>
                  </td>
                  <td className="px-5 py-2 text-xs text-gray-400">
                    {c.changedAt
                      ? new Date(c.changedAt).toLocaleString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                          hour: "numeric", minute: "2-digit",
                        })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
