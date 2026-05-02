import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, organizations } from "@/db/schema";
import { requireOcogSession } from "@/lib/session";
import { getAdminLang } from "@/lib/admin-lang";
import { t } from "@/lib/i18n/admin";
import { StatusBadge } from "@/components/StatusBadge";
import { categoryDisplayLabel } from "@/lib/category";

export default async function OcogNocEoiPage({
  params,
}: {
  params: Promise<{ nocCode: string }>;
}) {
  await requireOcogSession();
  const lang = await getAdminLang();
  const s = t(lang);
  const { nocCode } = await params;

  const rows = await db
    .select({
      id: applications.id,
      referenceNumber: applications.referenceNumber,
      status: applications.status,
      orgName: organizations.name,
      orgType: organizations.orgType,
      country: organizations.country,
      countryFlagged: organizations.countryFlagged,
      submittedAt: applications.submittedAt,
      categoryE: applications.categoryE,
      categoryEs: applications.categoryEs,
      categoryEp: applications.categoryEp,
      categoryEps: applications.categoryEps,
      categoryEt: applications.categoryEt,
      categoryEc: applications.categoryEc,
    })
    .from(applications)
    .innerJoin(organizations, eq(applications.organizationId, organizations.id))
    .where(
      and(
        eq(applications.nocCode, nocCode),
        eq(applications.eventId, "LA28"),
      ),
    )
    .orderBy(asc(applications.submittedAt));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link
          href="/admin/ocog/eoi"
          className="text-xs text-brand-blue hover:underline mb-2 inline-block"
        >
          ← {s.nav.eoi_summary}
        </Link>
        <h1 className="text-xl font-bold text-gray-900">
          {s.ocog.eoi_summary_title} — {nocCode}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Read-only view of applications submitted under this NOC — LA 2028
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-600">
            No applications found for {nocCode}.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Reference
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {s.eoi.org_name}
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {s.eoi.org_type}
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {s.eoi.section_accreditation}
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {s.queue.col_status}
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {s.queue.col_submitted}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">
                    {row.referenceNumber}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{row.orgName}</span>
                    {row.country && (
                      <span className="ml-1.5 text-xs text-gray-400">{row.country}</span>
                    )}
                    {row.countryFlagged && (
                      <span className="ml-2 px-1.5 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 rounded">
                        Country Flag
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {row.orgType.replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {categoryDisplayLabel(
                      row.categoryE,
                      row.categoryEs,
                      row.categoryEp,
                      row.categoryEps,
                      row.categoryEt,
                      row.categoryEc,
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(row.submittedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="mt-3 text-xs text-gray-400">
        {rows.length} application{rows.length !== 1 ? "s" : ""} — OCOG read-only view.
      </p>
    </div>
  );
}
