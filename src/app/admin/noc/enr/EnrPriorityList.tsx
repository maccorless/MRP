"use client";

import { useState, useRef } from "react";
import { removeEnrOrg, updateEnrRanks } from "./actions";

type EnrRow = {
  id: string;
  priorityRank: number;
  orgName: string;
  enrDescription: string | null;
  mustHaveSlots: number | null;
  niceToHaveSlots: number | null;
  slotsRequested: number;
  slotsGranted: number | null;
  decision: string | null;
  submittedAt: string | null; // serialized Date
};

const DECISION_BADGE: Record<string, string> = {
  granted: "bg-green-100 text-green-800",
  partial: "bg-yellow-100 text-yellow-800",
  denied:  "bg-red-100 text-red-800",
};
const DECISION_LABEL: Record<string, string> = {
  granted: "Granted",
  partial: "Partial",
  denied:  "Denied",
};

export function EnrPriorityList({
  initialRows,
  isSubmitted,
}: {
  initialRows: EnrRow[];
  isSubmitted: boolean;
}) {
  const [rows, setRows] = useState(initialRows);
  const [dirty, setDirty] = useState(false);
  const dragRef = useRef<number | null>(null);

  function moveRow(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    const updated = [...rows];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    // Reassign ranks
    const ranked = updated.map((r, i) => ({ ...r, priorityRank: i + 1 }));
    setRows(ranked);
    setDirty(true);
  }

  function handleRankChange(id: string, newRank: number) {
    const currentIndex = rows.findIndex((r) => r.id === id);
    if (currentIndex === -1) return;
    const targetIndex = Math.max(0, Math.min(rows.length - 1, newRank - 1));
    moveRow(currentIndex, targetIndex);
  }

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">ENR Nomination List</h2>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            rows.some((r) => r.decision) ? "bg-green-100 text-green-700" :
            isSubmitted ? "bg-yellow-100 text-yellow-700" :
            "bg-gray-100 text-gray-600"
          }`}>
            {rows.some((r) => r.decision) ? "Decided" : isSubmitted ? "Submitted to IOC" : "Draft"}
          </span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th scope="col" className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide w-16">#</th>
              <th scope="col" className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Organisation</th>
              <th scope="col" className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Must-have</th>
              <th scope="col" className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Nice-to-have</th>
              <th scope="col" className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Granted</th>
              <th scope="col" className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Decision</th>
              {!isSubmitted && <th scope="col" className="px-5 py-3 w-16"><span className="sr-only">Actions</span></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, index) => (
              <tr
                key={row.id}
                className="hover:bg-gray-50"
                draggable={!isSubmitted}
                tabIndex={!isSubmitted ? 0 : undefined}
                role={!isSubmitted ? "row" : undefined}
                aria-label={!isSubmitted ? `${row.orgName}, rank ${row.priorityRank}. Use arrow keys to reorder.` : undefined}
                onDragStart={() => { dragRef.current = index; }}
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={() => {
                  if (dragRef.current !== null) {
                    moveRow(dragRef.current, index);
                    dragRef.current = null;
                  }
                }}
                onKeyDown={(e) => {
                  if (isSubmitted) return;
                  if (e.key === "ArrowUp" && index > 0) {
                    e.preventDefault();
                    moveRow(index, index - 1);
                    // Focus the moved row after render
                    requestAnimationFrame(() => {
                      const prev = (e.target as HTMLElement).previousElementSibling as HTMLElement | null;
                      prev?.focus();
                    });
                  } else if (e.key === "ArrowDown" && index < rows.length - 1) {
                    e.preventDefault();
                    moveRow(index, index + 1);
                    requestAnimationFrame(() => {
                      const next = (e.target as HTMLElement).nextElementSibling as HTMLElement | null;
                      next?.focus();
                    });
                  }
                }}
                style={!isSubmitted ? { cursor: "grab" } : undefined}
              >
                <td className="px-5 py-3">
                  {!isSubmitted ? (
                    <input
                      type="number"
                      value={row.priorityRank}
                      onChange={(e) => handleRankChange(row.id, parseInt(e.target.value, 10) || 1)}
                      onFocus={(e) => e.target.select()}
                      min={1}
                      max={rows.length}
                      className="w-12 border border-gray-300 rounded px-2 py-1 text-xs text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  ) : (
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border-2 ${
                      row.priorityRank <= 3
                        ? "bg-yellow-50 text-yellow-800 border-yellow-300"
                        : "bg-blue-50 text-brand-blue border-blue-200"
                    }`}>
                      {row.priorityRank}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <div className="font-medium text-gray-900">{row.orgName}</div>
                  {row.enrDescription && (
                    <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{row.enrDescription}</div>
                  )}
                </td>
                <td className="px-5 py-3 text-right font-semibold text-gray-900">
                  {row.mustHaveSlots ?? row.slotsRequested}
                </td>
                <td className="px-5 py-3 text-right text-gray-500">
                  {row.niceToHaveSlots ?? 0}
                </td>
                <td className="px-5 py-3 text-right font-semibold text-gray-900">
                  {row.slotsGranted ?? "—"}
                </td>
                <td className="px-5 py-3">
                  {row.decision ? (
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${DECISION_BADGE[row.decision]}`}>
                      {DECISION_LABEL[row.decision]}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">
                      {row.submittedAt ? "Awaiting IOC" : "Draft"}
                    </span>
                  )}
                </td>
                {!isSubmitted && (
                  <td className="px-5 py-3">
                    {!row.submittedAt && (
                      <form action={removeEnrOrg}>
                        <input type="hidden" name="request_id" value={row.id} />
                        <button
                          type="submit"
                          className="text-xs text-red-500 hover:text-red-700 cursor-pointer"
                        >
                          Remove
                        </button>
                      </form>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Save reorder button */}
      {!isSubmitted && dirty && (
        <form action={updateEnrRanks}>
          <input
            type="hidden"
            name="ranks"
            value={JSON.stringify(rows.map((r) => ({ id: r.id, rank: r.priorityRank })))}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Save new order
          </button>
        </form>
      )}
    </div>
  );
}
