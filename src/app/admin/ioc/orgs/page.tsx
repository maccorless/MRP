import { asc } from "drizzle-orm";
import { db } from "@/db";
import { organizations } from "@/db/schema";

const ORG_TYPE_LABEL: Record<string, string> = {
  media_print_online: "Print / Online",
  media_broadcast:    "Broadcast",
  news_agency:        "News Agency",
  freelancer:         "Freelancer",
  enr:                "ENR",
  ino:                "INO (Intl Non-Gov Org)",
  if_staff:           "IF Staff",
  other:              "Other",
};

export default async function OrgDirectoryPage() {
  const orgs = await db
    .select()
    .from(organizations)
    .orderBy(asc(organizations.nocCode), asc(organizations.name));

  const multiTerritory = orgs.filter((o) => o.isMultiTerritoryFlag);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Organization Directory</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {orgs.length} organizations registered
            {multiTerritory.length > 0 && ` · ${multiTerritory.length} multi-territory`}
          </p>
        </div>
      </div>

      {multiTerritory.length > 0 && (
        <div className="p-3 bg-purple-50 border border-purple-200 rounded text-sm text-purple-800">
          <span className="font-semibold">{multiTerritory.length} multi-territory org{multiTerritory.length !== 1 ? "s" : ""}:</span>{" "}
          {multiTerritory.map((o) => o.name).join(", ")} — same email domain registered under multiple NOCs.
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Organization</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">NOC</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Country</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Type</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Email domain</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Flags</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Common Codes ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orgs.map((org) => (
              <tr key={org.id} className="hover:bg-gray-50">
                <td className="px-5 py-3">
                  <div className="font-medium text-gray-900">{org.name}</div>
                  {org.website && (
                    <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-xs text-[#0057A8] hover:underline">
                      {org.website}
                    </a>
                  )}
                </td>
                <td className="px-5 py-3 font-mono text-xs font-semibold text-gray-700">{org.nocCode}</td>
                <td className="px-5 py-3 text-gray-600">{org.country}</td>
                <td className="px-5 py-3 text-gray-600">{ORG_TYPE_LABEL[org.orgType] ?? org.orgType}</td>
                <td className="px-5 py-3 font-mono text-xs text-gray-600">{org.emailDomain}</td>
                <td className="px-5 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {org.isMultiTerritoryFlag && (
                      <span className="inline-flex px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                        Multi-territory
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3 font-mono text-xs text-gray-400">
                  {org.commonCodesId ?? <span className="italic">Not assigned</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
