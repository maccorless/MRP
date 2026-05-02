import { eq, and, asc } from "drizzle-orm";
import { Icon } from "@/components/Icon";
import { db } from "@/db";
import { enrRequests, organizations } from "@/db/schema";
import { requireNocSession } from "@/lib/session";
import { getAdminLang } from "@/lib/admin-lang";
import { t } from "@/lib/i18n/admin";
import { addEnrNomination, submitEnrToIoc } from "./actions";
import { EnrPriorityList } from "./EnrPriorityList";

const ERROR_MSG: Record<string, string> = {
  missing_fields:    "Please fill in all required fields.",
  already_added:     "An organisation with that name is already on your list.",
  nothing_to_submit: "No draft entries to submit. Add organisations first.",
  invalid_rank:      "Could not update ranks. Please refresh and try again.",
};

export default async function NocEnrPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const session = await requireNocSession();
  const nocCode = session.nocCode;
  const lang = await getAdminLang();
  const s = t(lang);
  const { success, error } = await searchParams;

  const requests = await db
    .select({ req: enrRequests, orgName: organizations.name })
    .from(enrRequests)
    .innerJoin(organizations, eq(enrRequests.organizationId, organizations.id))
    .where(and(eq(enrRequests.nocCode, nocCode), eq(enrRequests.eventId, "LA28")))
    .orderBy(asc(enrRequests.priorityRank));

  const isSubmitted = requests.some((r) => r.req.submittedAt !== null);
  const isDecided   = requests.some((r) => r.req.decision !== null);
  const draftCount  = requests.filter((r) => r.req.submittedAt === null).length;

  const totalMustHave   = requests.reduce((s, r) => s + (r.req.mustHaveSlots ?? r.req.slotsRequested), 0);
  const totalNiceToHave = requests.reduce((s, r) => s + (r.req.niceToHaveSlots ?? 0), 0);
  const totalGranted    = requests.reduce((s, r) => s + (r.req.slotsGranted ?? 0), 0);

  // Serialize for client component
  const listRows = requests.map(({ req, orgName }) => ({
    id: req.id,
    priorityRank: req.priorityRank,
    orgName,
    enrDescription: req.enrDescription,
    mustHaveSlots: req.mustHaveSlots,
    niceToHaveSlots: req.niceToHaveSlots,
    slotsRequested: req.slotsRequested,
    slotsGranted: req.slotsGranted,
    decision: req.decision,
    submittedAt: req.submittedAt?.toISOString() ?? null,
  }));

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{s.enr.title} — {nocCode}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Nominate Non-Media Rights-Holder organisations for IOC accreditation
          </p>
        </div>
        {requests.length > 0 && (
          <a
            href="/api/export/enr"
            className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
          >
            Export CSV <Icon name="download" className="inline w-3.5 h-3.5 ml-0.5 -mt-0.5" />
          </a>
        )}
      </div>

      {/* Banners */}
      {success === "submitted" && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          ENR nominations submitted to IOC.
        </div>
      )}
      {success === "added" && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-800 text-sm">
          Organisation added to nominations list.
        </div>
      )}
      {success === "removed" && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded text-gray-700 text-sm">
          Organisation removed from list.
        </div>
      )}
      {success === "reordered" && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-800 text-sm">
          Priority order updated.
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {ERROR_MSG[error] ?? "An error occurred."}
        </div>
      )}

      {/* Info banner */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded text-sm text-blue-800">
        <strong>ENR (Non-Media Rights-Holder)</strong> nominations are independent of the EoI process.
        Add any broadcaster organisation your NOC wants to nominate, in priority order. IOC decides how many slots to grant per organisation.
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{requests.length}</div>
          <div className="text-xs text-gray-500 mt-0.5 font-medium">Nominations</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{totalMustHave}</div>
          <div className="text-xs text-gray-500 mt-0.5 font-medium">Must-have slots</div>
          {totalNiceToHave > 0 && (
            <div className="text-xs text-gray-400 mt-0.5">+ {totalNiceToHave} nice-to-have</div>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className={`text-2xl font-bold ${isDecided ? "text-green-700" : "text-gray-400"}`}>
            {isDecided ? totalGranted : "—"}
          </div>
          <div className="text-xs text-gray-500 mt-0.5 font-medium">Slots granted</div>
        </div>
      </div>

      {/* Soft limit warning */}
      {requests.length >= 3 && !isSubmitted && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
          {s.enr.soft_limit_reached}
        </div>
      )}

      {/* Priority list */}
      {requests.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-600 mb-6">
          {s.enr.no_records}
        </div>
      ) : (
        <div className="mb-6">
          <EnrPriorityList
            initialRows={listRows}
            isSubmitted={isSubmitted}
            strings={{
              col_org:                s.enr.col_org,
              col_rank:               s.enr.col_rank,
              col_status:             s.enr.col_status,
              col_actions:            s.common.actions,
              nomination_list_title:  s.enr.title,
              decided_label:          s.home.decided,
              submitted_to_ioc_label: s.home.awaiting_ioc,
              draft_label:            s.status.draft,
              awaiting_ioc_label:     s.home.awaiting_ioc,
              granted_label:          s.ioc.decision_granted,
              partial_label:          s.ioc.decision_partial,
              denied_label:           s.ioc.decision_denied,
              remove_label:           s.common.delete,
              save_order_label:       s.common.save,
            }}
          />
        </div>
      )}

      {/* Submit button */}
      {!isSubmitted && draftCount > 0 && (
        <form action={submitEnrToIoc} className="mb-6">
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="px-4 py-2 bg-brand-blue text-white text-sm font-semibold rounded hover:bg-blue-800 transition-colors cursor-pointer"
            >
              Submit to IOC ({draftCount} nomination{draftCount !== 1 ? "s" : ""})
            </button>
            <span className="text-xs text-gray-400">Submission locks the list — contact IOC to make changes after.</span>
          </div>
        </form>
      )}

      {isSubmitted && !isDecided && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
          Nominations submitted. Awaiting IOC decision — you cannot modify the list at this stage.
        </div>
      )}

      {/* Add nomination form */}
      {!isSubmitted && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Add Nomination</h2>
          <p className="text-xs text-gray-500 mb-4">
            Enter the broadcaster organisation details. These do not need an existing EoI application.
          </p>
          <form action={addEnrNomination} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="enr_org_name" className="block text-xs text-gray-500 mb-1">
                  Organisation name <span className="text-red-500">*</span>
                </label>
                <input
                  id="enr_org_name"
                  name="enr_org_name"
                  type="text"
                  required
                  placeholder="e.g. ESPN"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="enr_website" className="block text-xs text-gray-500 mb-1">
                  Website <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  id="enr_website"
                  name="enr_website"
                  type="url"
                  placeholder="https://"
                  defaultValue="https://"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="enr_description" className="block text-xs text-gray-500 mb-1">
                What does this organisation do? <span className="text-red-500">*</span>
              </label>
              <textarea
                id="enr_description"
                name="enr_description"
                required
                rows={2}
                placeholder="e.g. Major US sports broadcaster covering all Olympic sports"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label htmlFor="enr_justification" className="block text-xs text-gray-500 mb-1">
                Why should they receive ENR accreditation? <span className="text-red-500">*</span>
              </label>
              <textarea
                id="enr_justification"
                name="enr_justification"
                required
                rows={2}
                placeholder="e.g. Largest sports broadcaster in our territory, significant audience reach"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="must_have_slots" className="block text-xs text-gray-500 mb-1">
                  Must-have slots <span className="text-red-500">*</span>
                </label>
                <input
                  id="must_have_slots"
                  name="must_have_slots"
                  type="number"
                  required
                  min={1}
                  defaultValue={1}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="nice_to_have_slots" className="block text-xs text-gray-500 mb-1">
                  Nice-to-have slots <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  id="nice_to_have_slots"
                  name="nice_to_have_slots"
                  type="number"
                  min={0}
                  defaultValue={0}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Add to nominations
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
