import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations, applications } from "@/db/schema";
import { requireOcogSession } from "@/lib/session";

export const metadata = { title: "Potential Duplicates — OCOG" };

export default async function OcogDuplicatesPage() {
  await requireOcogSession();

  // ── Type 1: Cross-NOC duplicates ──────────────────────────────────────────
  // Orgs with isMultiTerritoryFlag = true joined to their applications
  const crossNocRows = await db
    .select({
      orgId: organizations.id,
      orgName: organizations.name,
      emailDomain: organizations.emailDomain,
      nocCode: applications.nocCode,
      status: applications.status,
    })
    .from(organizations)
    .innerJoin(applications, eq(applications.organizationId, organizations.id))
    .where(
      and(
        eq(organizations.isMultiTerritoryFlag, true),
        eq(applications.eventId, "LA28"),
      ),
    )
    .orderBy(organizations.emailDomain, organizations.name);

  // Group cross-NOC rows by email domain
  type CrossNocGroup = {
    emailDomain: string;
    orgs: { orgId: string; orgName: string; nocCode: string; status: string }[];
  };
  const crossNocByDomain = new Map<string, CrossNocGroup>();
  for (const row of crossNocRows) {
    const domain = row.emailDomain ?? "(no domain)";
    let group = crossNocByDomain.get(domain);
    if (!group) {
      group = { emailDomain: domain, orgs: [] };
      crossNocByDomain.set(domain, group);
    }
    group.orgs.push({
      orgId: row.orgId,
      orgName: row.orgName,
      nocCode: row.nocCode,
      status: row.status,
    });
  }
  const crossNocGroups = [...crossNocByDomain.values()];

  // ── Type 2: Within-NOC duplicates ─────────────────────────────────────────
  // Same email domain used by 2+ orgs in the same NOC
  const withinNocRows = await db
    .select({
      emailDomain: organizations.emailDomain,
      nocCode: applications.nocCode,
      orgName: organizations.name,
      orgId: organizations.id,
      status: applications.status,
    })
    .from(applications)
    .innerJoin(organizations, eq(applications.organizationId, organizations.id))
    .where(eq(applications.eventId, "LA28"))
    .orderBy(applications.nocCode, organizations.emailDomain);

  // Group by (nocCode, emailDomain) — keep only groups with 2+ entries
  type WithinNocGroup = {
    nocCode: string;
    emailDomain: string;
    orgs: { orgId: string; orgName: string; status: string }[];
  };
  const withinNocMap = new Map<string, WithinNocGroup>();
  for (const row of withinNocRows) {
    if (!row.emailDomain) continue; // skip orgs without a domain
    const key = `${row.nocCode}::${row.emailDomain}`;
    let group = withinNocMap.get(key);
    if (!group) {
      group = { nocCode: row.nocCode, emailDomain: row.emailDomain, orgs: [] };
      withinNocMap.set(key, group);
    }
    group.orgs.push({ orgId: row.orgId, orgName: row.orgName, status: row.status });
  }
  const withinNocGroups = [...withinNocMap.values()].filter((g) => g.orgs.length >= 2);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Potential Duplicates</h1>
        <p className="text-sm text-gray-500 mt-1">
          Organisations that appear under multiple NOCs or share an email domain within a single NOC.
        </p>
      </div>

      {/* ── Cross-NOC Duplicates ─────────────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
          Cross-NOC Duplicates
          {crossNocGroups.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
              {crossNocGroups.length} domain{crossNocGroups.length !== 1 ? "s" : ""}
            </span>
          )}
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Organisations flagged as multi-territory — the same email domain has been used across
          two or more NOCs.
        </p>

        {crossNocGroups.length === 0 ? (
          <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
            <span className="text-green-500 font-bold">✓</span>
            No cross-NOC duplicates found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Email Domain
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Organisation
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    NOC
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Application Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {crossNocGroups.map((group) =>
                  group.orgs.map((org, idx) => (
                    <tr key={`${group.emailDomain}-${org.orgId}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-700 align-top">
                        {idx === 0 ? group.emailDomain : ""}
                      </td>
                      <td className="px-4 py-3 text-gray-900 font-medium">{org.orgName}</td>
                      <td className="px-4 py-3 text-gray-600">{org.nocCode}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={org.status} />
                      </td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Within-NOC Duplicates ────────────────────────────────────────── */}
      <section>
        <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
          Within-NOC Duplicates
          {withinNocGroups.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
              {withinNocGroups.length} group{withinNocGroups.length !== 1 ? "s" : ""}
            </span>
          )}
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Organisations sharing the same email domain within a single NOC — may indicate the
          same outlet applying multiple times.
        </p>

        {withinNocGroups.length === 0 ? (
          <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
            <span className="text-green-500 font-bold">✓</span>
            No within-NOC duplicates found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    NOC
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Email Domain
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Organisation
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Application Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {withinNocGroups.map((group) =>
                  group.orgs.map((org, idx) => (
                    <tr key={`${group.nocCode}-${group.emailDomain}-${org.orgId}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs align-top">
                        {idx === 0 ? group.nocCode : ""}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-700 align-top">
                        {idx === 0 ? group.emailDomain : ""}
                      </td>
                      <td className="px-4 py-3 text-gray-900 font-medium">{org.orgName}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={org.status} />
                      </td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending:      "bg-yellow-100 text-yellow-800",
    approved:     "bg-green-100 text-green-800",
    returned:     "bg-orange-100 text-orange-800",
    resubmitted:  "bg-blue-100 text-blue-800",
    rejected:     "bg-red-100 text-red-800",
  };
  const label: Record<string, string> = {
    pending:     "Pending",
    approved:    "Approved",
    returned:    "Returned",
    resubmitted: "Resubmitted",
    rejected:    "Rejected",
  };
  const cls = styles[status] ?? "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label[status] ?? status}
    </span>
  );
}
