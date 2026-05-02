import { eq, and } from "drizzle-orm";
import { Icon } from "@/components/Icon";
import { db } from "@/db";
import { applications, organizations, orgSlotAllocations, nocQuotas } from "@/db/schema";
import { requireNocSession } from "@/lib/session";
import { getAdminLang } from "@/lib/admin-lang";
import { t } from "@/lib/i18n/admin";
import { ACCRED_CATEGORIES } from "@/lib/category";
import { formatAddress } from "@/lib/format";
import { PbnAllocationTable } from "./PbnAllocationTable";
import { AddOrgToPbnPanel } from "./AddOrgToPbnPanel";
import { PbnImportPanel } from "./PbnImportPanel";

const ERROR_MSG: Record<string, string> = {
  no_quota:       "No quota has been assigned to your NOC yet. Contact IOC to set quotas.",
  no_allocations: "No slot allocations found. Save your allocations before submitting.",
  over_e_quota:   "E (Journalist) slot total exceeds your quota. Reduce before submitting.",
  over_es_quota:  "Es (Sport-Specific Journalist) slot total exceeds your quota.",
  over_ep_quota:  "EP (Photographer) slot total exceeds your quota.",
  over_eps_quota: "EPs (Sport-Specific Photographer) slot total exceeds your quota.",
  over_et_quota:  "ET (Technician) slot total exceeds your quota.",
  over_ec_quota:  "EC (Support Staff) slot total exceeds your quota.",
  invalid_org:    "Organisation name and type are required.",
  missing_org:    "Could not identify the organisation to cancel. Please refresh and try again.",
  alloc_not_found: "Allocation row not found. It may have already been cancelled or removed.",
  cancel_not_allowed: "Cancellation is only available before OCOG approval. Contact OCOG to reverse the approval first.",
};

export default async function NocPbnPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const session = await requireNocSession();
  const nocCode = session.nocCode;
  const lang = await getAdminLang();
  const s = t(lang);
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
        contactFirstName:    applications.contactFirstName,
        contactLastName:     applications.contactLastName,
        contactEmail:        applications.contactEmail,
        contactTitle:        applications.contactTitle,
        contactPhone:        applications.contactPhone,
        about:               applications.about,
        publicationTypes:    applications.publicationTypes,
        circulation:         applications.circulation,
        publicationFrequency: applications.publicationFrequency,
        sportsToCover:       applications.sportsToCover,
      },
      org: {
        id:           organizations.id,
        name:         organizations.name,
        orgType:      organizations.orgType,
        website:      organizations.website,
        country:      organizations.country,
        address:      organizations.address,
        city:         organizations.city,
        stateProvince: organizations.stateProvince,
        postalCode:   organizations.postalCode,
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
    ? `${s.status.submitted} to OCOG`
    : rows.some((r) => r.alloc)
    ? s.status.draft
    : "Not Started";

  const stateBadgeClass = hasApproved
    ? "bg-green-100 text-green-800"
    : hasSubmitted
    ? "bg-yellow-100 text-yellow-800"
    : "bg-gray-100 text-gray-600";

  const tableRows = rows.map(({ org, app, alloc }) => ({
    orgId:   org.id,
    orgName: org.name,
    orgType:   org.orgType ?? null,
    orgWebsite: org.website ?? null,
    orgCountry: org.country ?? null,
    orgAddress: formatAddress(org) || null,
    contactName: [app.contactFirstName, app.contactLastName].filter(Boolean).join(" ") || null,
    contactEmail: app.contactEmail ?? null,
    contactTitle: app.contactTitle ?? null,
    contactPhone: app.contactPhone ?? null,
    about:  app.about ?? null,
    publicationTypes: Array.isArray(app.publicationTypes) ? (app.publicationTypes as string[]) : null,
    circulation: app.circulation ?? null,
    publicationFrequency: app.publicationFrequency ?? null,
    sportsToCover: app.sportsToCover ?? null,
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

  // Also include orgs added directly to PbN (no EoI application)
  const approvedOrgIdSet = new Set(tableRows.map((r) => r.orgId));
  const allNocAllocs = await db
    .select({
      orgId:    organizations.id,
      orgName:  organizations.name,
      eSlots:   orgSlotAllocations.eSlots,
      esSlots:  orgSlotAllocations.esSlots,
      epSlots:  orgSlotAllocations.epSlots,
      epsSlots: orgSlotAllocations.epsSlots,
      etSlots:  orgSlotAllocations.etSlots,
      ecSlots:  orgSlotAllocations.ecSlots,
    })
    .from(orgSlotAllocations)
    .innerJoin(organizations, eq(orgSlotAllocations.organizationId, organizations.id))
    .where(and(eq(orgSlotAllocations.nocCode, nocCode), eq(orgSlotAllocations.eventId, "LA28")));

  const directTableRows = allNocAllocs
    .filter((a) => !approvedOrgIdSet.has(a.orgId))
    .map((a) => ({
      orgId:    a.orgId,
      orgName:  a.orgName,
      orgType: null, orgWebsite: null, orgCountry: null, orgAddress: null,
      contactName: null, contactEmail: null, contactTitle: null, contactPhone: null,
      about: null, publicationTypes: null, circulation: null,
      publicationFrequency: null, sportsToCover: null,
      // Direct entries are eligible for all categories — NOC decides what to allocate
      categoryE: true, categoryEs: true, categoryEp: true,
      categoryEps: true, categoryEt: true, categoryEc: true,
      requestedE: null, requestedEs: null, requestedEp: null,
      requestedEps: null, requestedEt: null, requestedEc: null,
      eSlots:   a.eSlots,
      esSlots:  a.esSlots,
      epSlots:  a.epSlots,
      epsSlots: a.epsSlots,
      etSlots:  a.etSlots,
      ecSlots:  a.ecSlots,
    }));

  const allTableRows = [...tableRows, ...directTableRows];

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

  // Active categories: any category requested via EoI, or all if direct-entry orgs exist
  const activeCategories = ACCRED_CATEGORIES.filter((cat) => {
    if (directTableRows.length > 0) return true; // direct entries are eligible for all cats
    return rows.some((r) => {
      const key = `category${cat.value}` as keyof typeof r.app;
      return r.app[key] === true;
    });
  }).map((c) => c.value);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{s.pbn.title} — {nocCode}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Assign accreditation slots per category to your approved organisations</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${stateBadgeClass}`}>
            {overallState}
          </span>
          {allTableRows.length > 0 && (
            <a
              href="/api/export/pbn-offline"
              className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Export CSV <Icon name="download" className="inline w-3.5 h-3.5 ml-0.5 -mt-0.5" />
            </a>
          )}
        </div>
      </div>

      {success === "org_added" && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          Organisation added to PbN.
        </div>
      )}
      {success === "submitted" && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          Allocation submitted to OCOG for review.
        </div>
      )}
      {success === "saved" && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-800 text-sm">
          {s.pbn.allocations_saved}
        </div>
      )}
      {success === "entry_cancelled" && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded text-orange-800 text-sm">
          PbN entry cancelled.
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {ERROR_MSG[error] ?? "An error occurred. Please try again."}
        </div>
      )}

      {!quota && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
          No quota has been assigned to {nocCode} yet. IOC must set quotas before you can submit.
          You can save draft allocations in the meantime.
        </div>
      )}

      {allTableRows.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-600">
          {s.pbn.no_records} Approve applications in the EoI Queue, or add an organisation directly below.
        </div>
      ) : (
        <>
          <PbnAllocationTable
            rows={allTableRows}
            quota={quotaProps}
            activeCategories={activeCategories}
            isEditable={isEditable}
            nocCode={nocCode}
            nocEQuota={quota?.nocETotal ?? 0}
            nocERequested={quota?.nocERequested ?? quota?.nocETotal ?? 0}
            strings={{
              col_org:            s.pbn.col_org,
              col_total:          s.common.results,
              req_header:         "Req.",
              alloc_header:       "Alloc.",
              no_quota_set:       s.ioc.no_quotas,
              remaining_label:    s.ioc.slots_remaining,
              search_placeholder: s.pbn.search_placeholder,
              save_draft:         s.common.save,
              submit_to_ocog:     `${s.common.submit} to OCOG`,
              no_slots_yet:       s.pbn.no_records,
            }}
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

      {isEditable && (
        <div className="mt-6 space-y-4">
          <PbnImportPanel
            strings={{
              import_csv_label:       s.action.import_excel,
              paste_from_spreadsheet: "Paste from spreadsheet",
              import_button:          s.common.upload,
              cancel_button:          s.common.cancel,
              importing_label:        s.common.loading,
              row_singular:           s.pbn.import_row,
              row_plural:             s.pbn.import_rows,
              imported_label:         s.pbn.import_imported,
              skipped_label:          s.pbn.import_skipped,
              allocations_updated:    s.pbn.allocations_saved,
              network_error:          s.error.generic,
            }}
          />
          <AddOrgToPbnPanel />
          <a
            href="/admin/noc/direct-entry"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-800 transition-colors"
          >
            <span className="text-lg leading-none">+</span>
            Add organisation via Direct Entry (full EoI application)
          </a>
        </div>
      )}
    </div>
  );
}
