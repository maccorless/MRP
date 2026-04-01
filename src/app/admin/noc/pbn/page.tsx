import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { applications, organizations, orgSlotAllocations, nocQuotas } from "@/db/schema";
import { requireNocSession } from "@/lib/session";
import { ACCRED_CATEGORIES } from "@/lib/category";
import { PbnAllocationTable } from "./PbnAllocationTable";

const ERROR_MSG: Record<string, string> = {
  no_quota:       "No quota has been assigned to your NOC yet. Contact IOC to set quotas.",
  no_allocations: "No slot allocations found. Save your allocations before submitting.",
  over_e_quota:   "E (Journalist) slot total exceeds your quota. Reduce before submitting.",
  over_es_quota:  "Es (Sport-Specific Journalist) slot total exceeds your quota.",
  over_ep_quota:  "EP (Photographer) slot total exceeds your quota.",
  over_eps_quota: "EPs (Sport-Specific Photographer) slot total exceeds your quota.",
  over_et_quota:  "ET (Technician) slot total exceeds your quota.",
  over_ec_quota:  "EC (Support Staff) slot total exceeds your quota.",
};

export default async function NocPbnPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const session = await requireNocSession();
  const nocCode = session.nocCode;
  const { success, error } = await searchParams;

  const [quota] = await db
    .select()
    .from(nocQuotas)
    .where(and(eq(nocQuotas.nocCode, nocCode), eq(nocQuotas.eventId, "LA28")));

  const rows = await db
    .select({
      app: {
        id: applications.id,
        categoryE:   applications.categoryE,
        categoryEs:  applications.categoryEs,
        categoryEp:  applications.categoryEp,
        categoryEps: applications.categoryEps,
        categoryEt:  applications.categoryEt,
        categoryEc:  applications.categoryEc,
        requestedE:   applications.requestedE,
        requestedEs:  applications.requestedEs,
        requestedEp:  applications.requestedEp,
        requestedEps: applications.requestedEps,
        requestedEt:  applications.requestedEt,
        requestedEc:  applications.requestedEc,
      },
      org: {
        id: organizations.id,
        name: organizations.name,
      },
      alloc: {
        id: orgSlotAllocations.id,
        eSlots:   orgSlotAllocations.eSlots,
        esSlots:  orgSlotAllocations.esSlots,
        epSlots:  orgSlotAllocations.epSlots,
        epsSlots: orgSlotAllocations.epsSlots,
        etSlots:  orgSlotAllocations.etSlots,
        ecSlots:  orgSlotAllocations.ecSlots,
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

  const tableRows = rows.map(({ org, app, alloc }) => ({
    orgId:   org.id,
    orgName: org.name,
    categoryE:   app.categoryE,
    categoryEs:  app.categoryEs,
    categoryEp:  app.categoryEp,
    categoryEps: app.categoryEps,
    categoryEt:  app.categoryEt,
    categoryEc:  app.categoryEc,
    requestedE:   app.requestedE,
    requestedEs:  app.requestedEs,
    requestedEp:  app.requestedEp,
    requestedEps: app.requestedEps,
    requestedEt:  app.requestedEt,
    requestedEc:  app.requestedEc,
    eSlots:   alloc?.eSlots   ?? 0,
    esSlots:  alloc?.esSlots  ?? 0,
    epSlots:  alloc?.epSlots  ?? 0,
    epsSlots: alloc?.epsSlots ?? 0,
    etSlots:  alloc?.etSlots  ?? 0,
    ecSlots:  alloc?.ecSlots  ?? 0,
  }));

  const quotaProps = quota
    ? {
        eTotal:   quota.eTotal   ?? 0,
        esTotal:  quota.esTotal  ?? 0,
        epTotal:  quota.epTotal  ?? 0,
        epsTotal: quota.epsTotal ?? 0,
        etTotal:  quota.etTotal  ?? 0,
        ecTotal:  quota.ecTotal  ?? 0,
      }
    : null;

  // Determine which categories any org in this NOC actually requested
  const activeCategories = ACCRED_CATEGORIES.filter((cat) =>
    rows.some((r) => {
      const key = `category${cat.value}` as keyof typeof r.app;
      return r.app[key] === true;
    })
  ).map((c) => c.value);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Press by Number — {nocCode}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Assign accreditation slots per category to your approved organisations</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${stateBadgeClass}`}>
            {overallState}
          </span>
          {rows.length > 0 && (
            <a
              href="/api/export/pbn-allocations"
              className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Export CSV ↓
            </a>
          )}
        </div>
      </div>

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

      {/* B5 — Quota dashboard: server-rendered committed allocations vs IOC quota */}
      {quota ? (
        <div className="mb-6 grid grid-cols-3 gap-3">
          {[
            { label: "E", desc: "Journalist",     total: quota.eTotal,   allocated: rows.reduce((s, r) => s + (r.alloc?.eSlots   ?? 0), 0) },
            { label: "Es", desc: "Sport Journal",  total: quota.esTotal,  allocated: rows.reduce((s, r) => s + (r.alloc?.esSlots  ?? 0), 0) },
            { label: "EP", desc: "Photographer",   total: quota.epTotal,  allocated: rows.reduce((s, r) => s + (r.alloc?.epSlots  ?? 0), 0) },
            { label: "EPs", desc: "Sport Photo",   total: quota.epsTotal, allocated: rows.reduce((s, r) => s + (r.alloc?.epsSlots ?? 0), 0) },
            { label: "ET", desc: "Technician",     total: quota.etTotal,  allocated: rows.reduce((s, r) => s + (r.alloc?.etSlots  ?? 0), 0) },
            { label: "EC", desc: "Support Staff",  total: quota.ecTotal,  allocated: rows.reduce((s, r) => s + (r.alloc?.ecSlots  ?? 0), 0) },
          ]
            .filter(({ total }) => total > 0)
            .map(({ label, desc, total, allocated }) => {
              const pct = Math.min(100, Math.round((allocated / total) * 100));
              const over = allocated > total;
              return (
                <div key={label} className="bg-white rounded-lg border border-gray-200 p-3">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium text-gray-700">{label} — {desc}</span>
                    <span className={`font-semibold ${over ? "text-red-600" : "text-gray-900"}`}>
                      {allocated} / {total}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${over ? "bg-red-500" : "bg-[#0057A8]"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{total - allocated} remaining</div>
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

      {rows.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-400">
          No approved applications for {nocCode} yet. Approve applications in the EoI Queue first.
        </div>
      ) : (
        <>
          <PbnAllocationTable
            rows={tableRows}
            quota={quotaProps}
            activeCategories={activeCategories}
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
