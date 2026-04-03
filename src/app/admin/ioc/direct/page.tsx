import { eq, and, asc } from "drizzle-orm";
import { db } from "@/db";
import { organizations, orgSlotAllocations, nocQuotas } from "@/db/schema";
import { requireIocSession } from "@/lib/session";
import { ACCRED_CATEGORIES } from "@/lib/category";
import { PbnAllocationTable } from "@/app/admin/noc/pbn/PbnAllocationTable";
import { IocDirectAddPanel } from "./IocDirectAddPanel";
import { saveIocDirectAllocations, submitIocDirectToOcog } from "./actions";

const IOC_DIRECT = "IOC_DIRECT";
const EVENT_ID   = "LA28";

const ERROR_MSG: Record<string, string> = {
  missing_fields:   "Organisation name and type are required.",
  over_e_quota:     "E (Journalist) total exceeds quota.",
  over_es_quota:    "Es (Sport-Specific Journalist) total exceeds quota.",
  over_ep_quota:    "EP (Photographer) total exceeds quota.",
  over_eps_quota:   "EPs (Sport-Specific Photographer) total exceeds quota.",
  over_et_quota:    "ET (Technician) total exceeds quota.",
  over_ec_quota:    "EC (Support Staff) total exceeds quota.",
};

export default async function IocDirectPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  await requireIocSession();
  const { success, error } = await searchParams;

  const orgs = await db
    .select({ id: organizations.id, name: organizations.name })
    .from(organizations)
    .where(and(eq(organizations.nocCode, IOC_DIRECT), eq(organizations.eventId, EVENT_ID)))
    .orderBy(asc(organizations.name));

  const allocs = await db
    .select()
    .from(orgSlotAllocations)
    .where(and(eq(orgSlotAllocations.nocCode, IOC_DIRECT), eq(orgSlotAllocations.eventId, EVENT_ID)));

  const allocMap = new Map(allocs.map((a) => [a.organizationId, a]));

  const [quota] = await db
    .select()
    .from(nocQuotas)
    .where(and(eq(nocQuotas.nocCode, IOC_DIRECT), eq(nocQuotas.eventId, EVENT_ID)));

  const hasSubmitted = allocs.some((a) => a.pbnState === "noc_submitted");
  const hasApproved  = allocs.some((a) => a.pbnState === "ocog_approved");
  const isEditable   = !hasSubmitted && !hasApproved;

  const overallState = hasApproved
    ? "OCOG Approved"
    : hasSubmitted
    ? "Submitted to OCOG"
    : orgs.length > 0 ? "Draft" : "Not Started";

  const stateBadgeClass = hasApproved
    ? "bg-green-100 text-green-800"
    : hasSubmitted
    ? "bg-yellow-100 text-yellow-800"
    : "bg-gray-100 text-gray-600";

  const tableRows = orgs.map((org) => {
    const alloc = allocMap.get(org.id);
    return {
      orgId:    org.id,
      orgName:  org.name,
      // All categories available — IOC decides what to allocate
      categoryE: true, categoryEs: true, categoryEp: true,
      categoryEps: true, categoryEt: true, categoryEc: true,
      requestedE: null, requestedEs: null, requestedEp: null,
      requestedEps: null, requestedEt: null, requestedEc: null,
      eSlots:   alloc?.eSlots   ?? 0,
      esSlots:  alloc?.esSlots  ?? 0,
      epSlots:  alloc?.epSlots  ?? 0,
      epsSlots: alloc?.epsSlots ?? 0,
      etSlots:  alloc?.etSlots  ?? 0,
      ecSlots:  alloc?.ecSlots  ?? 0,
    };
  });

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

  const activeCategories = ACCRED_CATEGORIES.map((c) => c.value);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">IOC-Direct Organisations</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Major international wire services and agencies accredited directly by the IOC —
            bypassing the NOC quota process.
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${stateBadgeClass}`}>
          {overallState}
        </span>
      </div>

      {/* Info callout */}
      <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
        <p className="font-semibold mb-1">How IOC-Direct works</p>
        <p>
          Organisations listed here (e.g. AFP, AP, Reuters, Xinhua) bypass the standard NOC EoI
          process. The IOC acts as the Responsible Organisation and allocates press slots directly.
          Allocations are submitted to OCOG for approval through the same PbN state machine as
          NOC submissions. Adding an org here also adds it to the reserved list — NOCs will be
          blocked from submitting a duplicate EoI for any org in this list.
        </p>
      </div>

      {/* Banners */}
      {success === "org_added"  && <Banner color="green">Organisation added and reserved.</Banner>}
      {success === "saved"      && <Banner color="blue">Draft allocations saved.</Banner>}
      {success === "submitted"  && <Banner color="green">Allocation submitted to OCOG for approval.</Banner>}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          {ERROR_MSG[error] ?? "An error occurred."}
        </div>
      )}

      {/* Quota bars — server-side committed totals */}
      {quota && (
        <div className="mb-6 grid grid-cols-3 gap-3">
          {[
            { label: "E",   desc: "Journalist",   total: quota.eTotal   ?? 0, allocated: allocs.reduce((s, a) => s + a.eSlots,   0) },
            { label: "Es",  desc: "Sport Journal", total: quota.esTotal  ?? 0, allocated: allocs.reduce((s, a) => s + a.esSlots,  0) },
            { label: "EP",  desc: "Photographer",  total: quota.epTotal  ?? 0, allocated: allocs.reduce((s, a) => s + a.epSlots,  0) },
            { label: "EPs", desc: "Sport Photo",   total: quota.epsTotal ?? 0, allocated: allocs.reduce((s, a) => s + a.epsSlots, 0) },
            { label: "ET",  desc: "Technician",    total: quota.etTotal  ?? 0, allocated: allocs.reduce((s, a) => s + a.etSlots,  0) },
            { label: "EC",  desc: "Support Staff", total: quota.ecTotal  ?? 0, allocated: allocs.reduce((s, a) => s + a.ecSlots,  0) },
          ]
            .filter(({ total }) => total > 0)
            .map(({ label, desc, total, allocated }) => {
              const pct  = Math.min(100, Math.round((allocated / total) * 100));
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
                    <div className={`h-full rounded-full ${over ? "bg-red-500" : "bg-[#0057A8]"}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{total - allocated} remaining</div>
                </div>
              );
            })}
        </div>
      )}

      {!quota && (
        <div className="mb-5 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
          No IOC-Direct quota set. Go to <a href="/admin/ioc/quotas" className="underline">Quotas</a> to set per-category totals for IOC_DIRECT, or save draft allocations without a quota.
        </div>
      )}

      {/* Allocation table */}
      {tableRows.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-400">
          No IOC-Direct organisations yet. Add the first one below.
        </div>
      ) : (
        <>
          <PbnAllocationTable
            rows={tableRows}
            quota={quotaProps}
            activeCategories={activeCategories}
            isEditable={isEditable}
            saveAction={saveIocDirectAllocations}
            submitAction={submitIocDirectToOcog}
            submitLabel="Submit to OCOG"
          />
          {hasSubmitted && !hasApproved && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              Allocation submitted to OCOG. Awaiting approval.
            </div>
          )}
          {hasApproved && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded text-sm text-green-800">
              Allocation approved by OCOG.
            </div>
          )}
        </>
      )}

      {/* Add org panel */}
      {isEditable && (
        <div className="mt-6">
          <IocDirectAddPanel />
        </div>
      )}
    </div>
  );
}

function Banner({ color, children }: { color: "green" | "blue"; children: React.ReactNode }) {
  const cls = color === "green"
    ? "bg-green-50 border-green-200 text-green-800"
    : "bg-blue-50 border-blue-200 text-blue-800";
  return (
    <div className={`mb-4 p-3 border rounded text-sm ${cls}`} role="alert">
      {children}
    </div>
  );
}
