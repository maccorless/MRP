import { eq, count, and } from "drizzle-orm";
import { db } from "@/db";
import { applications, nocQuotas, organizations, orgSlotAllocations } from "@/db/schema";
import { requireOcogSession } from "@/lib/session";
import { getAdminLang } from "@/lib/admin-lang";
import { t } from "@/lib/i18n/admin";
import { OcogEoiClient } from "./OcogEoiClient";

type ApplicationStatus = "pending" | "approved" | "returned" | "resubmitted" | "rejected";

interface NocRow {
  nocCode: string;
  pending: number;
  candidate: number; // "approved" status, shown as "Candidate"
  returned: number;
  rejected: number;
  total: number;
}

const IOC_DIRECT = "IOC_DIRECT";

export default async function OcogEoiPage() {
  await requireOcogSession();
  const lang = await getAdminLang();
  const s = t(lang);

  // IOC-Direct summary for read-only display
  const iocDirectOrgs = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(and(eq(organizations.nocCode, IOC_DIRECT), eq(organizations.eventId, "LA28")));

  const iocDirectAllocs = await db
    .select({ pbnState: orgSlotAllocations.pbnState })
    .from(orgSlotAllocations)
    .where(and(eq(orgSlotAllocations.nocCode, IOC_DIRECT), eq(orgSlotAllocations.eventId, "LA28")));

  const iocDirectApproved = iocDirectAllocs.some((a) => a.pbnState === "ocog_approved");
  const iocDirectCount = iocDirectOrgs.length;

  // All registered NOCs (so NOCs with zero applications still appear)
  const allNocs = await db
    .select({ nocCode: nocQuotas.nocCode })
    .from(nocQuotas)
    .where(eq(nocQuotas.eventId, "LA28"))
    .orderBy(nocQuotas.nocCode);

  const statusCounts = await db
    .select({
      nocCode: applications.nocCode,
      status: applications.status,
      count: count(),
    })
    .from(applications)
    .where(eq(applications.eventId, "LA28"))
    .groupBy(applications.nocCode, applications.status);

  // Index status counts by NOC code for O(1) lookup
  const nocMap = new Map<string, NocRow>();

  for (const row of statusCounts) {
    if (!nocMap.has(row.nocCode)) {
      nocMap.set(row.nocCode, {
        nocCode: row.nocCode,
        pending: 0,
        candidate: 0,
        returned: 0,
        rejected: 0,
        total: 0,
      });
    }
    const noc = nocMap.get(row.nocCode)!;
    const n = Number(row.count);
    noc.total += n;

    const s = row.status as ApplicationStatus;
    if (s === "pending" || s === "resubmitted") {
      noc.pending += n;
    } else if (s === "approved") {
      noc.candidate += n;
    } else if (s === "returned") {
      noc.returned += n;
    } else if (s === "rejected") {
      noc.rejected += n;
    }
  }

  // Pivot: start from allNocs so every registered NOC gets a row (even with 0 applications)
  // allNocs is already ordered by nocCode — no need to sort
  const rows: NocRow[] = allNocs.map(({ nocCode }) =>
    nocMap.get(nocCode) ?? {
      nocCode,
      pending: 0,
      candidate: 0,
      returned: 0,
      rejected: 0,
      total: 0,
    },
  );

  // Totals row
  const totals = rows.reduce(
    (acc, r) => {
      acc.pending += r.pending;
      acc.candidate += r.candidate;
      acc.returned += r.returned;
      acc.rejected += r.rejected;
      acc.total += r.total;
      return acc;
    },
    { pending: 0, candidate: 0, returned: 0, rejected: 0, total: 0 },
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">{s.ocog.eoi_summary_title}</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Application counts per NOC by status — LA 2028
        </p>
      </div>

      {/* IOC-Direct summary — read-only for OCOG */}
      {iocDirectCount > 0 && (
        <div className="mb-5 flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg">
          <span className="px-2 py-0.5 text-xs font-semibold bg-purple-100 text-purple-800 rounded-full whitespace-nowrap">
            {s.ocog.ioc_direct_label}
          </span>
          <p className="text-sm text-gray-700 flex-1">
            {iocDirectCount} organisation{iocDirectCount !== 1 ? "s" : ""} accredited directly by the IOC.
          </p>
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap ${
            iocDirectApproved
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-600"
          }`}>
            {iocDirectApproved ? s.status.submitted : s.status.draft}
          </span>
        </div>
      )}

      <OcogEoiClient
        rows={rows}
        totals={totals}
        strings={{
          col_noc:       s.ocog.col_noc,
          col_pending:   s.ocog.col_pending,
          col_candidate: s.ocog.col_candidate,
          col_returned:  s.ocog.col_returned,
          col_rejected:  s.ocog.col_rejected,
          col_total:     s.ocog.col_total,
          totals_row:    s.ocog.totals_row,
        }}
      />

      <p className="mt-3 text-xs text-gray-400">
        "Pending" includes resubmitted applications awaiting re-review. "Candidate" = NOC-approved,
        awaiting OCOG/IOC stages.
      </p>
    </div>
  );
}
