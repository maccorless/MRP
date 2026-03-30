import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { applications, organizations, orgSlotAllocations, nocQuotas } from "@/db/schema";
import { requireNocSession } from "@/lib/session";
import { PbnAllocationTable } from "./PbnAllocationTable";

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
        requestedPress: applications.requestedPress,
        requestedPhoto: applications.requestedPhoto,
      },
      org: {
        id: organizations.id,
        name: organizations.name,
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

  const overallState = hasApproved
    ? "OCOG Approved"
    : hasSubmitted
    ? "Submitted to OCOG"
    : rows.some((r) => r.alloc)
    ? "Draft"
    : "Not Started";

  const stateBadgeClass = hasApproved
    ? "bg-green-100 text-green-800"
    : hasSubmitted
    ? "bg-yellow-100 text-yellow-800"
    : "bg-gray-100 text-gray-600";

  // Serialize for client component
  const tableRows = rows.map(({ org, app, alloc }) => ({
    orgId: org.id,
    orgName: org.name,
    categoryPress: app.categoryPress,
    categoryPhoto: app.categoryPhoto,
    requestedPress: app.requestedPress,
    requestedPhoto: app.requestedPhoto,
    pressSlots: alloc?.pressSlots ?? 0,
    photoSlots: alloc?.photoSlots ?? 0,
  }));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header with state badge */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Press by Number — {nocCode}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Assign press and photo slots to your approved organisations</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${stateBadgeClass}`}>
          {overallState}
        </span>
      </div>

      {/* Status banners */}
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

      {/* No quota warning */}
      {!quota && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
          No quota has been assigned to {nocCode} yet. IOC must set quotas before you can submit.
          You can save draft allocations in the meantime.
        </div>
      )}

      {rows.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-400">
          No approved applications for {nocCode} yet. Approve applications in the EoI Queue first.
        </div>
      ) : (
        <>
          <PbnAllocationTable
            rows={tableRows}
            quota={quota ? { pressTotal: quota.pressTotal, photoTotal: quota.photoTotal } : null}
            isEditable={isEditable}
          />

          {hasSubmitted && !hasApproved && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              Allocation submitted to OCOG. Awaiting approval — you cannot edit until OCOG acts.
            </div>
          )}

          {hasApproved && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded text-sm text-green-800">
              Allocation approved by OCOG. This is your final approved slot count.
            </div>
          )}
        </>
      )}
    </div>
  );
}
