import Link from "next/link";
import { eq, and, asc, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { enrRequests, organizations } from "@/db/schema";
import { requireIocAdminSession } from "@/lib/session";
import { addIocDirectEnrOrg } from "../actions";

// IOC-Direct ENR organisations.
// Per IOC Strategic Plan §Non-MRH allocation reminders + Emma 2026-04-24
// (Word comments #226, #225): the IOC grants ENR accreditations directly to
// a few international-focus non-MRH organisations (CNN, Al Jazeera, BBC
// World, ESPN…) that don't fall under any NOC's jurisdiction. These are
// recorded under the `IOC_DIRECT` pseudo-NOC code and sit alongside
// NOC-nominated requests in the cross-NOC ENR review surface.
export default async function IocDirectEnrPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  await requireIocAdminSession();
  const { success, error } = await searchParams;

  const rows = await db
    .select({
      req: enrRequests,
      orgName: organizations.name,
      orgEmail: organizations.orgEmail,
      orgAddress: organizations.address,
    })
    .from(enrRequests)
    .innerJoin(organizations, eq(enrRequests.organizationId, organizations.id))
    .where(
      and(
        eq(enrRequests.nocCode, "IOC_DIRECT"),
        eq(enrRequests.eventId, "LA28"),
        isNotNull(enrRequests.submittedAt),
      ),
    )
    .orderBy(asc(enrRequests.priorityRank));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">IOC-Direct ENR organisations</h1>
          <p className="text-sm text-gray-500 mt-0.5 max-w-2xl">
            Non-MRH organisations with international focus that the IOC accredits directly,
            without NOC mediation (CNN, Al Jazeera, BBC World, ESPN, etc.). Records here flow
            into the cross-NOC ENR review screen alongside NOC-nominated requests.
          </p>
        </div>
        <Link
          href="/admin/ioc/enr"
          className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors shrink-0"
        >
          ← Back to ENR review
        </Link>
      </div>

      {success === "added" && (
        <div role="alert" className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          IOC-Direct ENR organisation added.
        </div>
      )}
      {error === "missing_fields" && (
        <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          Organisation name and email are required.
        </div>
      )}

      {/* Add form */}
      <details className="bg-white rounded-lg shadow-sm border border-gray-200">
        <summary className="cursor-pointer px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          + Add IOC-Direct ENR organisation
        </summary>
        <div className="px-5 py-4 border-t border-gray-100">
          <form action={addIocDirectEnrOrg} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-xs font-medium text-gray-600 mb-1">Organisation name <span className="text-red-500">*</span></span>
                <input name="org_name" required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" placeholder="e.g. CNN International" />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-gray-600 mb-1">Slots requested</span>
                <input name="slots_requested" type="number" min={1} defaultValue={3} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-gray-600 mb-1">Primary contact — first name</span>
                <input name="first_name" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-gray-600 mb-1">Primary contact — last name</span>
                <input name="last_name" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
              </label>
              <label className="block col-span-2">
                <span className="block text-xs font-medium text-gray-600 mb-1">Primary contact — email <span className="text-red-500">*</span></span>
                <input name="email" type="email" required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
              </label>
              <label className="block col-span-2">
                <span className="block text-xs font-medium text-gray-600 mb-1">Address</span>
                <input name="address" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-gray-600 mb-1">Phone</span>
                <input name="phone" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
              </label>
            </div>
            <label className="block">
              <span className="block text-xs font-medium text-gray-600 mb-1">Justification (optional)</span>
              <textarea name="justification" rows={2} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none" placeholder="Why this organisation should be granted IOC-Direct ENR" />
            </label>
            <div className="flex items-center gap-2 pt-2">
              <button type="submit" className="px-4 py-2 bg-brand-blue text-white text-sm font-semibold rounded hover:bg-blue-800 transition-colors cursor-pointer">
                Add organisation
              </button>
              <span className="text-xs text-gray-400">Recorded under nocCode <code className="font-mono">IOC_DIRECT</code> with priority rank appended at the end of the IOC-Direct list.</span>
            </div>
          </form>
        </div>
      </details>

      {/* Existing IOC-Direct ENR list */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">IOC-Direct ENR records ({rows.length})</h2>
          <Link
            href="/admin/ioc/enr"
            className="text-xs text-brand-blue hover:underline"
          >
            Make grant decisions on the cross-NOC ENR screen →
          </Link>
        </div>
        {rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No IOC-Direct ENR organisations yet. Add the first one using the form above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">#</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Organisation</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Contact email</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Requested</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Granted</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map(({ req, orgName, orgEmail }) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-500 font-mono">{req.priorityRank}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-900">{orgName}</td>
                    <td className="px-4 py-2.5 text-gray-600">{orgEmail ?? "—"}</td>
                    <td className="px-4 py-2.5 text-right text-gray-700">{req.slotsRequested}</td>
                    <td className="px-4 py-2.5 text-right text-gray-700">{req.slotsGranted ?? "—"}</td>
                    <td className="px-4 py-2.5">
                      {req.decision ? (
                        <span className="text-xs font-medium text-gray-700">{req.decision}</span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
