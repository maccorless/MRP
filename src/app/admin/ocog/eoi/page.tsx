import { eq, count } from "drizzle-orm";
import { db } from "@/db";
import { applications, nocQuotas } from "@/db/schema";
import { requireOcogSession } from "@/lib/session";
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

export default async function OcogEoiPage() {
  await requireOcogSession();

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
        <h1 className="text-xl font-bold text-gray-900">EoI Application Summary</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Application counts per NOC by status — LA 2028
        </p>
      </div>

      <OcogEoiClient rows={rows} totals={totals} />

      <p className="mt-3 text-xs text-gray-400">
        "Pending" includes resubmitted applications awaiting re-review. "Candidate" = NOC-approved,
        awaiting OCOG/IOC stages.
      </p>
    </div>
  );
}
