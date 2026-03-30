import { eq, and, asc, isNull, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { enrRequests, organizations, applications } from "@/db/schema";
import { requireNocSession } from "@/lib/session";
import { addEnrOrg, removeEnrOrg, submitEnrToIoc } from "./actions";

const DECISION_BADGE: Record<string, string> = {
  granted: "bg-green-100 text-green-800",
  partial: "bg-yellow-100 text-yellow-800",
  denied:  "bg-red-100 text-red-800",
};
const DECISION_LABEL: Record<string, string> = {
  granted: "Granted",
  partial: "Partial",
  denied:  "Denied",
};
const ORG_TYPE_LABEL: Record<string, string> = {
  media_print_online: "Print / Online",
  media_broadcast:    "Broadcast",
  news_agency:        "News Agency",
  enr:                "ENR",
};
const ERROR_MSG: Record<string, string> = {
  no_org:              "Please select an organization.",
  already_added:       "That organization is already on your ENR list.",
  nothing_to_submit:   "No draft entries to submit. Add organizations first.",
};

export default async function NocEnrPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const session = await requireNocSession();
  const nocCode = session.nocCode;
  const { success, error } = await searchParams;

  // Existing ENR requests for this NOC
  const requests = await db
    .select({
      req: enrRequests,
      orgName: organizations.name,
      orgType: organizations.orgType,
    })
    .from(enrRequests)
    .innerJoin(organizations, eq(enrRequests.organizationId, organizations.id))
    .where(and(eq(enrRequests.nocCode, nocCode), eq(enrRequests.eventId, "LA28")))
    .orderBy(asc(enrRequests.priorityRank));

  // Has the NOC submitted? (any record with submittedAt set)
  const isSubmitted = requests.some((r) => r.req.submittedAt !== null);
  const isDecided   = requests.some((r) => r.req.decision !== null);
  const draftCount  = requests.filter((r) => r.req.submittedAt === null).length;

  // Approved orgs for this NOC that aren't already on the ENR list
  const onListIds = new Set(requests.map((r) => r.req.organizationId));
  const approvedOrgs = await db
    .select({ org: organizations })
    .from(applications)
    .innerJoin(organizations, eq(applications.organizationId, organizations.id))
    .where(and(eq(applications.nocCode, nocCode), eq(applications.status, "approved")));

  const availableOrgs = approvedOrgs
    .map((r) => r.org)
    .filter((o) => !onListIds.has(o.id));

  const totalRequested = requests.reduce((s, r) => s + r.req.slotsRequested, 0);
  const totalGranted   = requests.reduce((s, r) => s + (r.req.slotsGranted ?? 0), 0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">ENR Requests — {nocCode}</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Submit a prioritised list of ENR organisations to IOC for accreditation
        </p>
      </div>

      {/* Banners */}
      {success === "submitted" && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
          ENR list submitted to IOC.
        </div>
      )}
      {success === "added" && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-800 text-sm">
          Organization added to ENR list.
        </div>
      )}
      {success === "removed" && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded text-gray-700 text-sm">
          Organization removed from ENR list.
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          {ERROR_MSG[error] ?? "An error occurred."}
        </div>
      )}

      {/* Info banner */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded text-sm text-blue-800">
        <strong>ENR (Equipment & Non-Rights broadcaster)</strong> organisations are nominated by your NOC and approved individually by IOC.
        Add the organisations in priority order — IOC decides how many slots to grant per org.
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{requests.length}</div>
          <div className="text-xs text-gray-500 mt-0.5 font-medium">Orgs on list</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{totalRequested}</div>
          <div className="text-xs text-gray-500 mt-0.5 font-medium">Slots requested</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className={`text-2xl font-bold ${isDecided ? "text-green-700" : "text-gray-400"}`}>
            {isDecided ? totalGranted : "—"}
          </div>
          <div className="text-xs text-gray-500 mt-0.5 font-medium">Slots granted</div>
        </div>
      </div>

      {/* ENR list */}
      {requests.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-400 mb-6">
          No ENR organisations added yet. Use the form below to add organisations.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">ENR Organisation List</h2>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              isDecided   ? "bg-green-100 text-green-700" :
              isSubmitted ? "bg-yellow-100 text-yellow-700" :
              "bg-gray-100 text-gray-600"
            }`}>
              {isDecided ? "Decided" : isSubmitted ? "Submitted to IOC" : "Draft"}
            </span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide w-12">#</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Organisation</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Requested</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Granted</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Decision</th>
                {!isSubmitted && <th className="px-5 py-3 w-16" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map(({ req, orgName, orgType }) => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border-2 ${
                      req.priorityRank <= 3
                        ? "bg-yellow-50 text-yellow-800 border-yellow-300"
                        : "bg-blue-50 text-[#0057A8] border-blue-200"
                    }`}>
                      {req.priorityRank}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="font-medium text-gray-900">{orgName}</div>
                    <div className="text-xs text-gray-400">{ORG_TYPE_LABEL[orgType] ?? orgType}</div>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-900">{req.slotsRequested}</td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-900">
                    {req.slotsGranted ?? "—"}
                  </td>
                  <td className="px-5 py-3">
                    {req.decision ? (
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${DECISION_BADGE[req.decision]}`}>
                        {DECISION_LABEL[req.decision]}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">
                        {req.submittedAt ? "Awaiting IOC" : "Draft"}
                      </span>
                    )}
                  </td>
                  {!isSubmitted && (
                    <td className="px-5 py-3">
                      {req.submittedAt === null && (
                        <form action={removeEnrOrg}>
                          <input type="hidden" name="request_id" value={req.id} />
                          <button
                            type="submit"
                            className="text-xs text-red-500 hover:text-red-700 transition-colors cursor-pointer bg-transparent border-0"
                          >
                            Remove
                          </button>
                        </form>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Submit button */}
      {!isSubmitted && draftCount > 0 && (
        <form action={submitEnrToIoc} className="mb-6">
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="px-4 py-2 bg-[#0057A8] text-white text-sm font-semibold rounded hover:bg-blue-800 transition-colors cursor-pointer"
            >
              Submit to IOC ({draftCount} org{draftCount !== 1 ? "s" : ""})
            </button>
            <span className="text-xs text-gray-400">Submission locks the list — contact IOC to make changes after submission.</span>
          </div>
        </form>
      )}

      {isSubmitted && !isDecided && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
          ENR list submitted. Awaiting IOC decision — you cannot modify the list at this stage.
        </div>
      )}

      {/* Add org form (only when not submitted) */}
      {!isSubmitted && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Add Organisation</h2>
          <p className="text-xs text-gray-500 mb-4">
            Only organisations with approved EoI applications can be added to the ENR list.
          </p>
          {availableOrgs.length === 0 ? (
            <p className="text-sm text-gray-400">
              {approvedOrgs.length === 0
                ? "No approved EoI applications found. Approve applications in the EoI Queue first."
                : "All approved organisations are already on your ENR list."}
            </p>
          ) : (
            <form action={addEnrOrg} className="flex items-end gap-3 flex-wrap">
              <div className="flex-1 min-w-48">
                <label className="block text-xs text-gray-500 mb-1">Organisation</label>
                <select
                  name="org_id"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Select organisation…</option>
                  {availableOrgs.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({ORG_TYPE_LABEL[org.orgType] ?? org.orgType})
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-32">
                <label className="block text-xs text-gray-500 mb-1">Slots requested</label>
                <input
                  type="number"
                  name="slots_requested"
                  defaultValue={1}
                  min={1}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Add to list
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
