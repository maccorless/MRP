import Link from "next/link";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { nocQuotas, orgSlotAllocations } from "@/db/schema";
import { requireOcogSession } from "@/lib/session";
import { getAdminLang } from "@/lib/admin-lang";
import { t } from "@/lib/i18n/admin";

type PbnStatus = "not_started" | "draft" | "submitted" | "approved";

const STATUS_BADGE: Record<PbnStatus, string> = {
  not_started: "bg-gray-100 text-gray-500",
  draft:       "bg-gray-100 text-gray-600",
  submitted:   "bg-yellow-100 text-yellow-800",
  approved:    "bg-green-100 text-green-800",
};
type StatusFilter = "all" | PbnStatus;

export default async function OcogPbnPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; success?: string; noc?: string; count?: string }>;
}) {
  await requireOcogSession();
  const lang = await getAdminLang();
  const s = t(lang);

  const STATUS_LABEL: Record<PbnStatus, string> = {
    not_started: s.home.not_started,
    draft:       s.status.draft,
    submitted:   s.status.submitted,
    approved:    s.status.approved,
  };
  const { status: statusParam, success, noc, count } = await searchParams;
  const activeFilter = (statusParam ?? "all") as StatusFilter;

  const quotas = await db.select().from(nocQuotas).orderBy(asc(nocQuotas.nocCode));
  const allAllocs = await db.select({
    nocCode: orgSlotAllocations.nocCode,
    pbnState: orgSlotAllocations.pbnState,
    pressSlots: orgSlotAllocations.pressSlots,
    photoSlots: orgSlotAllocations.photoSlots,
  }).from(orgSlotAllocations).where(eq(orgSlotAllocations.eventId, "LA28"));

  // Build NOC summary rows
  type NocRow = {
    nocCode: string;
    pressQuota: number;
    photoQuota: number;
    pressAllocated: number;
    photoAllocated: number;
    orgCount: number;
    status: PbnStatus;
  };

  const nocRows: NocRow[] = quotas.map((q) => {
    const nAllocs = allAllocs.filter((a) => a.nocCode === q.nocCode);
    const pressAllocated = nAllocs.reduce((s, a) => s + a.pressSlots, 0);
    const photoAllocated = nAllocs.reduce((s, a) => s + a.photoSlots, 0);

    let status: PbnStatus = "not_started";
    if (nAllocs.length > 0) {
      const states = new Set(nAllocs.map((a) => a.pbnState));
      if (states.has("ocog_approved")) {
        status = "approved";
      } else if (states.has("noc_submitted")) {
        status = "submitted";
      } else {
        status = "draft";
      }
    }

    return {
      nocCode: q.nocCode,
      pressQuota: q.pressTotal,
      photoQuota: q.photoTotal,
      pressAllocated,
      photoAllocated,
      orgCount: nAllocs.length,
      status,
    };
  });

  const counts = nocRows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  const filtered =
    activeFilter === "all" ? nocRows : nocRows.filter((r) => r.status === activeFilter);

  const filters: { key: StatusFilter; label: string }[] = [
    { key: "all",         label: `All (${nocRows.length})` },
    { key: "submitted",   label: `Submitted (${counts.submitted ?? 0})` },
    { key: "approved",    label: `Approved (${counts.approved ?? 0})` },
    { key: "draft",       label: `Draft (${counts.draft ?? 0})` },
    { key: "not_started", label: `Not started (${counts.not_started ?? 0})` },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">{s.ocog.pbn_title}</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {counts.submitted ?? 0} NOC{(counts.submitted ?? 0) !== 1 ? "s" : ""} awaiting approval
        </p>
      </div>

      {/* Banners */}
      {success === "approved" && noc && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          {noc} allocation approved.
        </div>
      )}
      {success === "sent_to_acr" && noc && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-800 text-sm">
          {count} org{count !== "1" ? "s" : ""} from {noc} sent to ACR.
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 flex-wrap">
        {filters.map(({ key, label }) => (
          <Link
            key={key}
            href={key === "all" ? "/admin/ocog/pbn" : `/admin/ocog/pbn?status=${key}`}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              activeFilter === key
                ? "bg-brand-blue text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-600">
            No NOCs in this category.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{s.ocog.col_noc}</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Press (alloc / quota)</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Photo (alloc / quota)</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{s.ocog.col_status}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((row) => (
                <tr key={row.nocCode} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-mono font-semibold text-gray-900">{row.nocCode}</td>
                  <td className="px-5 py-3 text-right text-gray-700">
                    {row.pressAllocated} / {row.pressQuota}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-700">
                    {row.photoAllocated} / {row.photoQuota}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[row.status]}`}>
                      {STATUS_LABEL[row.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {(row.status === "submitted" || row.status === "approved") && (
                      <Link
                        href={`/admin/ocog/pbn/${row.nocCode}`}
                        className="text-brand-blue text-xs font-medium hover:underline"
                      >
                        Review →
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
