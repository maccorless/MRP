import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { nocQuotas, orgSlotAllocations, organizations, applications } from "@/db/schema";
import { requireOcogSession } from "@/lib/session";
import { ACCRED_CATEGORIES, categoryDisplayLabel } from "@/lib/category";
import { approvePbn, sendToAcr } from "../actions";

export default async function OcogPbnNocPage({
  params,
  searchParams,
}: {
  params: Promise<{ nocCode: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireOcogSession();
  const { nocCode } = await params;
  const { error } = await searchParams;

  const [quota] = await db
    .select()
    .from(nocQuotas)
    .where(and(eq(nocQuotas.nocCode, nocCode), eq(nocQuotas.eventId, "LA28")));

  if (!quota) notFound();

  const rows = await db
    .select({
      alloc: orgSlotAllocations,
      orgName:     organizations.name,
      orgType:     organizations.orgType,
      categoryE:   applications.categoryE,
      categoryEs:  applications.categoryEs,
      categoryEp:  applications.categoryEp,
      categoryEps: applications.categoryEps,
      categoryEt:  applications.categoryEt,
      categoryEc:  applications.categoryEc,
    })
    .from(orgSlotAllocations)
    .innerJoin(organizations, eq(orgSlotAllocations.organizationId, organizations.id))
    .innerJoin(
      applications,
      and(
        eq(applications.organizationId, organizations.id),
        eq(applications.nocCode, nocCode),
        eq(applications.status, "approved")
      )
    )
    .where(
      and(
        eq(orgSlotAllocations.nocCode, nocCode),
        eq(orgSlotAllocations.eventId, "LA28")
      )
    );

  const isSubmitted = rows.some((r) => r.alloc.pbnState === "noc_submitted");
  const isApproved  = rows.some((r) => r.alloc.pbnState === "ocog_approved");

  // Determine which categories are active for this NOC
  const activeCategories = ACCRED_CATEGORIES.filter((cat) =>
    rows.some((r) => {
      const key = `category${cat.value}` as keyof typeof rows[0];
      return r[key] === true;
    })
  );

  // Per-category totals from allocations
  const catTotals = Object.fromEntries(
    ACCRED_CATEGORIES.map((cat) => {
      const slotKey = `${cat.value.toLowerCase()}Slots` as keyof typeof rows[0]["alloc"];
      const total = rows.reduce((s, r) => s + ((r.alloc[slotKey] as number) ?? 0), 0);
      return [cat.value, total];
    })
  ) as Record<string, number>;

  const grandTotal = Object.values(catTotals).reduce((s, v) => s + v, 0);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link
          href="/admin/ocog/pbn"
          className="text-xs text-gray-500 hover:text-gray-700 mb-3 inline-block"
        >
          ← Back to PbN list
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 font-mono">{nocCode}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {rows.length} org{rows.length !== 1 ? "s" : ""} · {grandTotal} total slots across {activeCategories.length} categor{activeCategories.length !== 1 ? "ies" : "y"}
            </p>
          </div>
          <span className={`shrink-0 inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
            isApproved  ? "bg-green-100 text-green-800" :
            isSubmitted ? "bg-yellow-100 text-yellow-800" :
            "bg-gray-100 text-gray-600"
          }`}>
            {isApproved ? "Approved" : isSubmitted ? "Submitted" : "Draft"}
          </span>
        </div>
      </div>

      {/* Quota summary */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        {activeCategories.map((cat) => {
          const slotKey = `${cat.value.toLowerCase()}Slots` as keyof typeof rows[0]["alloc"];
          const quotaKey = `${cat.value.toLowerCase()}Total` as keyof typeof quota;
          const used  = rows.reduce((s, r) => s + ((r.alloc[slotKey] as number) ?? 0), 0);
          const total = (quota[quotaKey] as number) ?? 0;
          const over  = total > 0 && used > total;
          return (
            <div key={cat.value} className={`rounded-lg border p-3 text-xs ${over ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"}`}>
              <div className="flex justify-between mb-1">
                <span className="font-medium text-gray-700">{cat.value} — {cat.shortLabel}</span>
                <span className={`font-semibold ${over ? "text-red-600" : "text-gray-900"}`}>
                  {used}{total > 0 ? ` / ${total}` : ""}
                </span>
              </div>
              {total > 0 && (
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${over ? "bg-red-500" : "bg-[#0057A8]"}`}
                    style={{ width: `${Math.min(100, Math.round((used / total) * 100))}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error === "not_submitted" && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          This NOC has not submitted their allocation yet.
        </div>
      )}
      {error === "not_approved" && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          This NOC's allocation must be approved before sending to ACR.
        </div>
      )}

      {rows.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-400">
          No allocations found for {nocCode}.
        </div>
      ) : (
        <form action={approvePbn} className="space-y-4">
          <input type="hidden" name="noc_code" value={nocCode} />

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {isSubmitted && (
              <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 text-xs text-blue-800 font-medium">
                Edit mode — adjust slot counts if needed, then approve
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">Organisation</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Categories</th>
                    {activeCategories.map((cat) => (
                      <th
                        key={cat.value}
                        className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap"
                      >
                        {cat.value}
                      </th>
                    ))}
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map(({ alloc, orgName, categoryE, categoryEs, categoryEp, categoryEps, categoryEt, categoryEc }) => {
                    const rowTotal = (alloc.eSlots ?? 0) + (alloc.esSlots ?? 0) + (alloc.epSlots ?? 0) +
                      (alloc.epsSlots ?? 0) + (alloc.etSlots ?? 0) + (alloc.ecSlots ?? 0);
                    return (
                      <tr key={alloc.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 font-medium text-gray-900 whitespace-nowrap">{orgName}</td>
                        <td className="px-5 py-3 text-xs text-gray-600">
                          {categoryDisplayLabel(categoryE, categoryEs, categoryEp, categoryEps, categoryEt, categoryEc)}
                        </td>
                        {activeCategories.map((cat) => {
                          const slotKey = `${cat.value.toLowerCase()}Slots` as keyof typeof alloc;
                          const catSlots = (alloc[slotKey] as number) ?? 0;
                          const catEnabled = (({ E: categoryE, Es: categoryEs, EP: categoryEp, EPs: categoryEps, ET: categoryEt, EC: categoryEc } as Record<string, boolean>)[cat.value]);
                          return (
                            <td key={cat.value} className="px-4 py-3 text-right">
                              {isSubmitted && catEnabled ? (
                                <input
                                  type="number"
                                  name={`${cat.value.toLowerCase()}_${alloc.organizationId}`}
                                  defaultValue={catSlots}
                                  min={0}
                                  className="w-16 border border-gray-300 rounded px-1.5 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                              ) : (
                                <span className={`font-semibold ${catSlots > 0 ? "text-gray-900" : "text-gray-300"}`}>
                                  {catEnabled ? catSlots : "—"}
                                </span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-5 py-3 text-right font-semibold text-gray-900">{rowTotal}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td colSpan={2} className="px-5 py-2.5 text-xs font-semibold text-gray-600 uppercase">Total</td>
                    {activeCategories.map((cat) => (
                      <td key={cat.value} className="px-4 py-2.5 text-right font-semibold text-gray-900">
                        {catTotals[cat.value]}
                      </td>
                    ))}
                    <td className="px-5 py-2.5 text-right font-semibold text-gray-900">{grandTotal}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {isSubmitted && (
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded hover:bg-green-700 transition-colors cursor-pointer"
              >
                Approve Allocation
              </button>
              <span className="text-xs text-gray-400">Any adjusted values above will be saved on approval.</span>
            </div>
          )}
        </form>
      )}

      {isApproved && (
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Send to ACR</h2>
          <p className="text-xs text-gray-500 mb-4">
            Push the approved allocation for {nocCode} to the Accreditation system.
            {rows.length} org{rows.length !== 1 ? "s" : ""} · {grandTotal} total slots.
          </p>
          <form action={sendToAcr}>
            <input type="hidden" name="noc_code" value={nocCode} />
            <button
              type="submit"
              className="px-4 py-2 bg-[#0057A8] text-white text-sm font-semibold rounded hover:bg-blue-800 transition-colors cursor-pointer"
            >
              Send to ACR
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
