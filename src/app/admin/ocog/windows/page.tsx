import { eq } from "drizzle-orm";
import { db } from "@/db";
import { nocEoiWindows, applications } from "@/db/schema";
import { requireOcogSession } from "@/lib/session";
import { toggleNocWindow, toggleAllWindows } from "./actions";

export default async function OcogWindowsPage() {
  await requireOcogSession();

  const windowRows = await db
    .select()
    .from(nocEoiWindows)
    .where(eq(nocEoiWindows.eventId, "LA28"))
    .orderBy(nocEoiWindows.nocCode);

  const distinctNocs = await db
    .selectDistinct({ nocCode: applications.nocCode })
    .from(applications)
    .where(eq(applications.eventId, "LA28"))
    .orderBy(applications.nocCode);

  const windowMap = new Map(windowRows.map((r) => [r.nocCode, r]));

  const allNocCodes = Array.from(
    new Set([
      ...windowRows.map((r) => r.nocCode),
      ...distinctNocs.map((r) => r.nocCode),
    ]),
  ).sort();

  type Row = {
    nocCode: string;
    isOpen: boolean;
    toggledAt: Date | null;
    hasRow: boolean;
  };

  const rows: Row[] = allNocCodes.map((nocCode) => {
    const w = windowMap.get(nocCode);
    return {
      nocCode,
      isOpen: w ? w.isOpen : true,
      toggledAt: w?.toggledAt ?? null,
      hasRow: !!w,
    };
  });

  const openCount = rows.filter((r) => r.isOpen).length;
  const closedCount = rows.length - openCount;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">EoI Windows</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage EoI acceptance windows per NOC — LA 2028
          </p>
        </div>
        <div className="flex items-center gap-2">
          <form action={toggleAllWindows}>
            <input type="hidden" name="set_open" value="true" />
            <button
              type="submit"
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              Open All
            </button>
          </form>
          <form action={toggleAllWindows}>
            <input type="hidden" name="set_open" value="false" />
            <button
              type="submit"
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              Close All
            </button>
          </form>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
        <span>
          <span className="font-semibold text-green-700">{openCount}</span> open
        </span>
        <span>
          <span className="font-semibold text-red-700">{closedCount}</span> closed
        </span>
        <span>{rows.length} total NOCs</span>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            No NOC data found.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  NOC
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Last Changed
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => (
                <tr key={row.nocCode} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-mono font-semibold text-gray-900">
                    {row.nocCode}
                  </td>
                  <td className="px-5 py-3">
                    {row.isOpen ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        Open
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        Closed
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {row.toggledAt
                      ? new Date(row.toggledAt).toLocaleString("en-AU", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <form action={toggleNocWindow}>
                      <input type="hidden" name="nocCode" value={row.nocCode} />
                      <input
                        type="hidden"
                        name="set_open"
                        value={row.isOpen ? "false" : "true"}
                      />
                      <button
                        type="submit"
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                          row.isOpen
                            ? "bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700"
                            : "bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-700"
                        }`}
                      >
                        {row.isOpen ? "Close" : "Open"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="mt-3 text-xs text-gray-400">
        NOCs without an explicit window row default to Open. Closing a window blocks new public
        applications from that territory.
      </p>
    </div>
  );
}
