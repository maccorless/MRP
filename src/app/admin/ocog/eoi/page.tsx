import { eq, count } from "drizzle-orm";
import { db } from "@/db";
import { applications, nocQuotas } from "@/db/schema";
import { requireOcogSession } from "@/lib/session";

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

  const noData = rows.length === 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">EoI Application Summary</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Application counts per NOC by status — LA 2028
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {noData ? (
          <div className="p-8 text-center text-sm text-gray-400">
            No applications have been submitted yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  NOC
                </th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Pending
                </th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Candidate
                </th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Returned
                </th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Rejected
                </th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => (
                <tr
                  key={row.nocCode}
                  className={`transition-colors ${
                    row.candidate === 0
                      ? "bg-amber-50 hover:bg-amber-100"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <td className="px-5 py-3 font-mono font-semibold text-gray-900">
                    {row.nocCode}
                    {row.candidate === 0 && row.total > 0 && (
                      <span className="ml-2 text-xs font-sans font-normal text-amber-600">
                        no candidates
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-700">
                    {row.pending > 0 ? (
                      <span className="font-medium text-yellow-700">{row.pending}</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {row.candidate > 0 ? (
                      <span className="font-medium text-green-700">{row.candidate}</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-700">
                    {row.returned > 0 ? row.returned : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-700">
                    {row.rejected > 0 ? row.rejected : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-900">
                    {row.total}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-gray-200 bg-gray-50">
              <tr>
                <td className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Total ({rows.length} NOCs)
                </td>
                <td className="px-5 py-3 text-right font-bold text-yellow-700">
                  {totals.pending || <span className="text-gray-400">0</span>}
                </td>
                <td className="px-5 py-3 text-right font-bold text-green-700">
                  {totals.candidate || <span className="text-gray-400">0</span>}
                </td>
                <td className="px-5 py-3 text-right font-bold text-gray-700">
                  {totals.returned || <span className="text-gray-400">0</span>}
                </td>
                <td className="px-5 py-3 text-right font-bold text-gray-700">
                  {totals.rejected || <span className="text-gray-400">0</span>}
                </td>
                <td className="px-5 py-3 text-right font-bold text-gray-900">
                  {totals.total}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      <p className="mt-3 text-xs text-gray-400">
        "Pending" includes resubmitted applications awaiting re-review. "Candidate" = NOC-approved,
        awaiting OCOG/IOC stages.
      </p>
    </div>
  );
}
