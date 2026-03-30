import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { nocQuotas, orgSlotAllocations, organizations, applications } from "@/db/schema";
import { requireOcogSession } from "@/lib/session";
import { categoryDisplayLabel } from "@/lib/category";
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
      orgName: organizations.name,
      orgType: organizations.orgType,
      categoryPress: applications.categoryPress,
      categoryPhoto: applications.categoryPhoto,
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

  const totalPress = rows.reduce((s, r) => s + r.alloc.pressSlots, 0);
  const totalPhoto = rows.reduce((s, r) => s + r.alloc.photoSlots, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
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
              {rows.length} org{rows.length !== 1 ? "s" : ""} · Quota: {quota.pressTotal} press / {quota.photoTotal} photo
            </p>
          </div>
          <span className={`shrink-0 inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
            isApproved ? "bg-green-100 text-green-800" :
            isSubmitted ? "bg-yellow-100 text-yellow-800" :
            "bg-gray-100 text-gray-600"
          }`}>
            {isApproved ? "Approved" : isSubmitted ? "Submitted" : "Draft"}
          </span>
        </div>
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
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Organization</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Category</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Press</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Photo</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map(({ alloc, orgName, categoryPress, categoryPhoto }) => (
                  <tr key={alloc.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{orgName}</td>
                    <td className="px-5 py-3 text-xs text-gray-600">
                      {categoryDisplayLabel(categoryPress, categoryPhoto)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {isSubmitted ? (
                        <input
                          type="number"
                          name={`press_${alloc.organizationId}`}
                          defaultValue={alloc.pressSlots}
                          min={0}
                          className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      ) : (
                        <span className="font-semibold text-gray-900">{alloc.pressSlots}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {isSubmitted ? (
                        <input
                          type="number"
                          name={`photo_${alloc.organizationId}`}
                          defaultValue={alloc.photoSlots}
                          min={0}
                          className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      ) : (
                        <span className="font-semibold text-gray-900">{alloc.photoSlots}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">
                      {alloc.pressSlots + alloc.photoSlots}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td colSpan={2} className="px-5 py-2.5 text-xs font-semibold text-gray-600 uppercase">Total</td>
                  <td className="px-5 py-2.5 text-right font-semibold text-gray-900">{totalPress}</td>
                  <td className="px-5 py-2.5 text-right font-semibold text-gray-900">{totalPhoto}</td>
                  <td className="px-5 py-2.5 text-right font-semibold text-gray-900">{totalPress + totalPhoto}</td>
                </tr>
              </tfoot>
            </table>
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

      {/* Send to ACR — only after approval */}
      {isApproved && (
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Send to ACR</h2>
          <p className="text-xs text-gray-500 mb-4">
            Push the approved allocation for {nocCode} to the Accreditation system.
            This sends {rows.length} org{rows.length !== 1 ? "s" : ""} with a total of {totalPress} press + {totalPhoto} photo slots.
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
