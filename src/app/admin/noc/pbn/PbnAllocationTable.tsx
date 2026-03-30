"use client";

import { useState, useMemo } from "react";
import { saveSlotAllocations, submitPbnToOcog } from "./actions";

type PbnRow = {
  orgId: string;
  orgName: string;
  categoryPress: boolean;
  categoryPhoto: boolean;
  requestedPress: number | null;
  requestedPhoto: number | null;
  pressSlots: number;
  photoSlots: number;
};

type Props = {
  rows: PbnRow[];
  quota: { pressTotal: number; photoTotal: number } | null;
  isEditable: boolean;
};

export function PbnAllocationTable({ rows, quota, isEditable }: Props) {
  // Track current input values for live totals
  const [values, setValues] = useState<Record<string, { press: number; photo: number }>>(
    () => Object.fromEntries(rows.map((r) => [r.orgId, { press: r.pressSlots, photo: r.photoSlots }]))
  );

  // Search + sort state
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);

  // Live totals
  const totalPress = Object.values(values).reduce((s, v) => s + v.press, 0);
  const totalPhoto = Object.values(values).reduce((s, v) => s + v.photo, 0);

  // Filtered + sorted rows
  const displayRows = useMemo(() => {
    let filtered = rows;
    if (search) {
      const q = search.toLowerCase();
      filtered = rows.filter((r) => r.orgName.toLowerCase().includes(q));
    }
    return [...filtered].sort((a, b) =>
      sortAsc ? a.orgName.localeCompare(b.orgName) : b.orgName.localeCompare(a.orgName)
    );
  }, [rows, search, sortAsc]);

  function handleChange(orgId: string, field: "press" | "photo", raw: string) {
    const val = parseInt(raw, 10) || 0;
    setValues((prev) => ({
      ...prev,
      [orgId]: { ...prev[orgId], [field]: Math.max(0, val) },
    }));
  }

  function handleSubmitToOcog(e: React.FormEvent<HTMLFormElement>) {
    if (!quota) return;
    const unusedPress = quota.pressTotal - totalPress;
    const unusedPhoto = quota.photoTotal - totalPhoto;
    if (unusedPress > 0 || unusedPhoto > 0) {
      const parts = [];
      if (unusedPress > 0) parts.push(`${unusedPress} unused press slots`);
      if (unusedPhoto > 0) parts.push(`${unusedPhoto} unused photo slots`);
      if (!window.confirm(`You have ${parts.join(" and ")}. Submit anyway?`)) {
        e.preventDefault();
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Quota progress bars (live) */}
      {quota && (
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Press slots", used: totalPress, total: quota.pressTotal, color: "bg-[#0057A8]" },
            { label: "Photo slots", used: totalPhoto, total: quota.photoTotal, color: "bg-purple-600" },
          ].map(({ label, used, total, color }) => {
            const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
            const over = used > total;
            return (
              <div key={label} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700">{label}</span>
                  <span className={`font-semibold ${over ? "text-red-600" : "text-gray-900"}`}>
                    {used} / {total}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${over ? "bg-red-500" : color}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {over && <p className="text-xs text-red-600 mt-1">Over quota — reduce before submitting</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* Search */}
      <div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search organisations..."
          className="w-full max-w-xs border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
        />
      </div>

      {/* Table */}
      <form
        action={isEditable ? saveSlotAllocations : undefined}
        onSubmit={undefined}
        className="space-y-4"
      >
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="max-h-[60vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  <th
                    className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700"
                    onClick={() => setSortAsc((v) => !v)}
                  >
                    Organisation {sortAsc ? "↑" : "↓"}
                  </th>
                  <th className="text-right px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Req.</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Press</th>
                  <th className="text-right px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Req.</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Photo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayRows.map((row) => {
                  const v = values[row.orgId] ?? { press: 0, photo: 0 };
                  return (
                    <tr key={row.orgId} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <div className="font-medium text-gray-900">{row.orgName}</div>
                      </td>
                      {/* Requested press */}
                      <td className="px-3 py-3 text-right text-xs text-gray-400">
                        {row.categoryPress ? (row.requestedPress ?? "—") : "—"}
                      </td>
                      {/* Press allocation */}
                      <td className="px-5 py-3 text-right">
                        {isEditable ? (
                          row.categoryPress ? (
                            <input
                              type="number"
                              name={`press_${row.orgId}`}
                              value={v.press}
                              onChange={(e) => handleChange(row.orgId, "press", e.target.value)}
                              onFocus={(e) => e.target.select()}
                              min={0}
                              className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                          ) : (
                            <>
                              <input type="hidden" name={`press_${row.orgId}`} value={0} />
                              <span className="text-gray-300">—</span>
                            </>
                          )
                        ) : (
                          <span className="font-semibold text-gray-900">{v.press}</span>
                        )}
                      </td>
                      {/* Requested photo */}
                      <td className="px-3 py-3 text-right text-xs text-gray-400">
                        {row.categoryPhoto ? (row.requestedPhoto ?? "—") : "—"}
                      </td>
                      {/* Photo allocation */}
                      <td className="px-5 py-3 text-right">
                        {isEditable ? (
                          row.categoryPhoto ? (
                            <input
                              type="number"
                              name={`photo_${row.orgId}`}
                              value={v.photo}
                              onChange={(e) => handleChange(row.orgId, "photo", e.target.value)}
                              onFocus={(e) => e.target.select()}
                              min={0}
                              className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                          ) : (
                            <>
                              <input type="hidden" name={`photo_${row.orgId}`} value={0} />
                              <span className="text-gray-300">—</span>
                            </>
                          )
                        ) : (
                          <span className="font-semibold text-gray-900">{v.photo}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200 sticky bottom-0">
                <tr>
                  <td colSpan={2} className="px-5 py-2.5 text-xs font-semibold text-gray-600 uppercase">Total</td>
                  <td className="px-5 py-2.5 text-right font-semibold text-gray-900">{totalPress}</td>
                  <td />
                  <td className="px-5 py-2.5 text-right font-semibold text-gray-900">{totalPhoto}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {isEditable && (
          <div className="flex items-center gap-3">
            <button
              type="submit"
              formAction={saveSlotAllocations}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Save Draft
            </button>
            <button
              type="submit"
              formAction={submitPbnToOcog}
              onClick={(e) => {
                const form = (e.target as HTMLButtonElement).closest("form");
                if (form) {
                  const fakeEvent = { preventDefault: () => e.preventDefault() } as React.FormEvent<HTMLFormElement>;
                  handleSubmitToOcog(fakeEvent);
                }
              }}
              className="px-4 py-2 bg-[#0057A8] text-white text-sm font-semibold rounded hover:bg-blue-800 transition-colors cursor-pointer"
            >
              Submit to OCOG
            </button>
            <span className="text-xs text-gray-400">Submission locks allocations — OCOG may adjust before final approval.</span>
          </div>
        )}
      </form>
    </div>
  );
}
