import Link from "next/link";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { applications, organizations } from "@/db/schema";
import { categoryDisplayLabel } from "@/lib/category";

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

export default async function ExportPage() {
  const rows = await db
    .select({
      referenceNumber: applications.referenceNumber,
      nocCode: applications.nocCode,
      orgName: organizations.name,
      country: organizations.country,
      orgType: organizations.orgType,
      contactName: applications.contactName,
      contactEmail: applications.contactEmail,
      categoryE:   applications.categoryE,
      categoryEs:  applications.categoryEs,
      categoryEp:  applications.categoryEp,
      categoryEps: applications.categoryEps,
      categoryEt:  applications.categoryEt,
      categoryEc:  applications.categoryEc,
      reviewedAt: applications.reviewedAt,
    })
    .from(applications)
    .innerJoin(organizations, eq(applications.organizationId, organizations.id))
    .where(eq(applications.status, "approved"))
    .orderBy(asc(applications.nocCode), asc(applications.referenceNumber));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">PBN Export</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {rows.length} approved application{rows.length !== 1 ? "s" : ""} ready for Common Codes handoff
          </p>
        </div>
        {rows.length > 0 && (
          <Link
            href="/api/export/pbn"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0057A8] text-white text-sm font-semibold rounded hover:bg-blue-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download CSV
          </Link>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-sm text-gray-400">
          No approved applications to export yet.
        </div>
      ) : (
        <>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
            This export contains all NOC-approved applications. The CSV is formatted for Common Codes ingestion.
            Each download is logged in the audit trail.
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Reference</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">NOC</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Organization</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Contact</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Candidate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row.referenceNumber} className="hover:bg-gray-50">
                    <td className="px-5 py-2.5 font-mono text-xs text-gray-700">{row.referenceNumber}</td>
                    <td className="px-5 py-2.5 font-mono text-xs font-semibold text-gray-700">{row.nocCode}</td>
                    <td className="px-5 py-2.5">
                      <div className="font-medium text-gray-900">{row.orgName}</div>
                      <div className="text-xs text-gray-400">{ORG_TYPE_LABEL[row.orgType] ?? row.orgType} · {row.country}</div>
                    </td>
                    <td className="px-5 py-2.5 text-gray-600">{categoryDisplayLabel(row.categoryE, row.categoryEs, row.categoryEp, row.categoryEps, row.categoryEt, row.categoryEc)}</td>
                    <td className="px-5 py-2.5">
                      <div className="text-gray-900">{row.contactName}</div>
                      <div className="text-xs text-gray-400">{row.contactEmail}</div>
                    </td>
                    <td className="px-5 py-2.5 text-xs text-gray-500">
                      {row.reviewedAt
                        ? new Date(row.reviewedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
