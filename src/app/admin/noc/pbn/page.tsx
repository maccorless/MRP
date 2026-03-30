import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { applications, organizations, orgSlotAllocations, nocQuotas } from "@/db/schema";
import { requireNocSession } from "@/lib/session";
import { categoryDisplayLabel } from "@/lib/category";
import { saveSlotAllocations, submitPbnToOcog } from "./actions";

const PBN_STATE_BADGE: Record<string, string> = {
  draft:         "bg-gray-100 text-gray-600",
  noc_submitted: "bg-yellow-100 text-yellow-800",
  ocog_approved: "bg-green-100 text-green-800",
};
const PBN_STATE_LABEL: Record<string, string> = {
  draft:         "Draft",
  noc_submitted: "Submitted",
  ocog_approved: "Approved",
};

const ERROR_MSG: Record<string, string> = {
  no_quota:          "No quota has been assigned to your NOC yet. Contact IOC to set quotas.",
  no_allocations:    "No slot allocations found. Save your allocations before submitting.",
  over_press_quota:  "Press slot total exceeds your quota. Reduce before submitting.",
  over_photo_quota:  "Photo slot total exceeds your quota. Reduce before submitting.",
};

export default async function NocPbnPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const session = await requireNocSession();
  const nocCode = session.nocCode;
  const { success, error } = await searchParams;

  // Quota for this NOC
  const [quota] = await db
    .select()
    .from(nocQuotas)
    .where(and(eq(nocQuotas.nocCode, nocCode), eq(nocQuotas.eventId, "LA28")));

  // Approved orgs with existing allocations
  const rows = await db
    .select({
      app: {
        id: applications.id,
        categoryPress: applications.categoryPress,
        categoryPhoto: applications.categoryPhoto,
      },
      org: {
        id: organizations.id,
        name: organizations.name,
        orgType: organizations.orgType,
      },
      alloc: {
        id: orgSlotAllocations.id,
        pressSlots: orgSlotAllocations.pressSlots,
        photoSlots: orgSlotAllocations.photoSlots,
        pbnState: orgSlotAllocations.pbnState,
      },
    })
    .from(applications)
    .innerJoin(organizations, eq(applications.organizationId, organizations.id))
    .leftJoin(
      orgSlotAllocations,
      and(
        eq(orgSlotAllocations.organizationId, organizations.id),
        eq(orgSlotAllocations.nocCode, nocCode),
        eq(orgSlotAllocations.eventId, "LA28")
      )
    )
    .where(and(eq(applications.nocCode, nocCode), eq(applications.status, "approved")));

  // Determine overall PbN state
  const hasSubmitted = rows.some((r) => r.alloc?.pbnState === "noc_submitted");
  const hasApproved  = rows.some((r) => r.alloc?.pbnState === "ocog_approved");
  const isEditable   = !hasSubmitted && !hasApproved;

  // Totals
  const allocatedPress = rows.reduce((s, r) => s + (r.alloc?.pressSlots ?? 0), 0);
  const allocatedPhoto = rows.reduce((s, r) => s + (r.alloc?.photoSlots ?? 0), 0);

  const overallState = hasApproved
    ? "OCOG Approved"
    : hasSubmitted
    ? "Submitted to OCOG"
    : rows.some((r) => r.alloc)
    ? "Draft"
    : "Not Started";

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Press by Number — {nocCode}</h1>
        <p className="text-sm text-gray-500 mt-0.5">Assign press and photo slots to your approved organizations</p>
      </div>

      {/* Status banner */}
      {success === "submitted" && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
          Allocation submitted to OCOG for review.
        </div>
      )}
      {success === "saved" && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-800 text-sm">
          Draft allocations saved.
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          {ERROR_MSG[error] ?? "An error occurred. Please try again."}
        </div>
      )}

      {/* State bar */}
      <div className="mb-5 flex items-center gap-3 text-sm">
        <span className="text-gray-500">Status:</span>
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
          hasApproved ? "bg-green-100 text-green-800" :
          hasSubmitted ? "bg-yellow-100 text-yellow-800" :
          "bg-gray-100 text-gray-600"
        }`}>
          {overallState}
        </span>
      </div>

      {/* Quota progress */}
      {quota ? (
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            { label: "Press slots", used: allocatedPress, total: quota.pressTotal, color: "bg-[#0057A8]" },
            { label: "Photo slots", used: allocatedPhoto, total: quota.photoTotal, color: "bg-purple-600" },
          ].map(({ label, used, total, color }) => {
            const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
            const over = used > total;
            return (
              <div key={label} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700">{label}</span>
                  <span className={`font-semibold ${over ? "text-red-600" : "text-gray-900"}`}>
                    {used} / {total}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${over ? "bg-red-500" : color}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {over && <p className="text-xs text-red-600 mt-1">Over quota — reduce before submitting</p>}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
          No quota has been assigned to {nocCode} yet. IOC must set quotas before you can submit.
          You can save draft allocations in the meantime.
        </div>
      )}

      {/* Allocation table */}
      {rows.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-400">
          No approved applications for {nocCode} yet. Approve applications in the EoI Queue first.
        </div>
      ) : (
        <form action={isEditable ? saveSlotAllocations : undefined} className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Organization</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Category</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Press Slots</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Photo Slots</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map(({ org, app, alloc }) => (
                  <tr key={org.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">{org.name}</div>
                    </td>
                    <td className="px-5 py-3 text-gray-600 text-xs">
                      {categoryDisplayLabel(app.categoryPress, app.categoryPhoto)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {isEditable ? (
                        <input
                          type="number"
                          name={`press_${org.id}`}
                          defaultValue={alloc?.pressSlots ?? 0}
                          min={0}
                          className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      ) : (
                        <span className="font-semibold text-gray-900">{alloc?.pressSlots ?? 0}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {isEditable ? (
                        <input
                          type="number"
                          name={`photo_${org.id}`}
                          defaultValue={alloc?.photoSlots ?? 0}
                          min={0}
                          className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      ) : (
                        <span className="font-semibold text-gray-900">{alloc?.photoSlots ?? 0}</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${PBN_STATE_BADGE[alloc?.pbnState ?? "draft"]}`}>
                        {PBN_STATE_LABEL[alloc?.pbnState ?? "draft"]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td colSpan={2} className="px-5 py-2.5 text-xs font-semibold text-gray-600 uppercase">Total</td>
                  <td className="px-5 py-2.5 text-right font-semibold text-gray-900">{allocatedPress}</td>
                  <td className="px-5 py-2.5 text-right font-semibold text-gray-900">{allocatedPhoto}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          {isEditable && (
            <div className="flex items-center gap-3">
              <button
                type="submit"
                formAction={saveSlotAllocations}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Save Draft
              </button>
              <button
                type="submit"
                formAction={submitPbnToOcog}
                className="px-4 py-2 bg-[#0057A8] text-white text-sm font-semibold rounded hover:bg-blue-800 transition-colors cursor-pointer"
              >
                Submit to OCOG
              </button>
              <span className="text-xs text-gray-400">Submission locks allocations — OCOG may adjust before final approval.</span>
            </div>
          )}

          {hasSubmitted && !hasApproved && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              Allocation submitted to OCOG. Awaiting approval — you cannot edit until OCOG acts.
            </div>
          )}

          {hasApproved && (
            <div className="p-4 bg-green-50 border border-green-200 rounded text-sm text-green-800">
              Allocation approved by OCOG. This is your final approved slot count.
            </div>
          )}
        </form>
      )}
    </div>
  );
}
