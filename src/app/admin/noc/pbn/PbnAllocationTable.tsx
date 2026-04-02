"use client";

import { useState, useMemo } from "react";
import { saveSlotAllocations, submitPbnToOcog } from "./actions";
import { ACCRED_CATEGORIES, type AccredCategory } from "@/lib/category";

type PbnRow = {
  orgId: string;
  orgName: string;
  categoryE:   boolean;
  categoryEs:  boolean;
  categoryEp:  boolean;
  categoryEps: boolean;
  categoryEt:  boolean;
  categoryEc:  boolean;
  requestedE:   number | null;
  requestedEs:  number | null;
  requestedEp:  number | null;
  requestedEps: number | null;
  requestedEt:  number | null;
  requestedEc:  number | null;
  eSlots:   number;
  esSlots:  number;
  epSlots:  number;
  epsSlots: number;
  etSlots:  number;
  ecSlots:  number;
};

type Quota = {
  eTotal:   number;
  esTotal:  number;
  epTotal:  number;
  epsTotal: number;
  etTotal:  number;
  ecTotal:  number;
};

type Props = {
  rows: PbnRow[];
  quota: Quota | null;
  activeCategories: AccredCategory[];
  isEditable: boolean;
};

// Stable map from category value to row field names
const CAT_FIELDS: Record<AccredCategory, { requested: keyof PbnRow; slots: keyof PbnRow; quotaKey: keyof Quota }> = {
  E:   { requested: "requestedE",   slots: "eSlots",   quotaKey: "eTotal" },
  Es:  { requested: "requestedEs",  slots: "esSlots",  quotaKey: "esTotal" },
  EP:  { requested: "requestedEp",  slots: "epSlots",  quotaKey: "epTotal" },
  EPs: { requested: "requestedEps", slots: "epsSlots", quotaKey: "epsTotal" },
  ET:  { requested: "requestedEt",  slots: "etSlots",  quotaKey: "etTotal" },
  EC:  { requested: "requestedEc",  slots: "ecSlots",  quotaKey: "ecTotal" },
};

const CAT_ENABLED_FIELD: Record<AccredCategory, keyof PbnRow> = {
  E:   "categoryE",
  Es:  "categoryEs",
  EP:  "categoryEp",
  EPs: "categoryEps",
  ET:  "categoryEt",
  EC:  "categoryEc",
};

type SlotValues = Record<AccredCategory, number>;

export function PbnAllocationTable({ rows, quota, activeCategories, isEditable }: Props) {
  const [values, setValues] = useState<Record<string, SlotValues>>(
    () => Object.fromEntries(
      rows.map((r) => [
        r.orgId,
        {
          E:   r.eSlots,
          Es:  r.esSlots,
          EP:  r.epSlots,
          EPs: r.epsSlots,
          ET:  r.etSlots,
          EC:  r.ecSlots,
        } as SlotValues,
      ])
    )
  );

  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);

  // Live totals per category
  const totals = useMemo<SlotValues>(() => {
    const t = { E: 0, Es: 0, EP: 0, EPs: 0, ET: 0, EC: 0 } as SlotValues;
    for (const v of Object.values(values)) {
      for (const cat of ACCRED_CATEGORIES) t[cat.value] += v[cat.value];
    }
    return t;
  }, [values]);

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

  function handleChange(orgId: string, cat: AccredCategory, raw: string) {
    const val = parseInt(raw, 10);
    setValues((prev) => ({
      ...prev,
      [orgId]: { ...prev[orgId], [cat]: isNaN(val) ? 0 : Math.max(0, val) },
    }));
  }

  function handleSubmitToOcog(e: React.FormEvent<HTMLFormElement>) {
    if (!quota) return;
    const over: string[] = [];
    for (const cat of ACCRED_CATEGORIES) {
      const catQuota = quota[CAT_FIELDS[cat.value].quotaKey];
      if (catQuota > 0 && totals[cat.value] > catQuota) {
        over.push(`${cat.value} (${totals[cat.value]}/${catQuota})`);
      }
    }
    if (over.length > 0) {
      e.preventDefault();
      alert(`Over quota for: ${over.join(", ")}. Reduce before submitting.`);
      return;
    }
    const unused = activeCategories
      .filter((cat) => {
        const catQuota = quota[CAT_FIELDS[cat].quotaKey];
        return catQuota > 0 && totals[cat] < catQuota;
      });
    if (unused.length > 0) {
      const parts = unused.map((cat) => {
        const catQuota = quota[CAT_FIELDS[cat].quotaKey];
        return `${cat}: ${totals[cat]}/${catQuota}`;
      });
      if (!window.confirm(`Unused quota in: ${parts.join(", ")}. Submit anyway?`)) {
        e.preventDefault();
      }
    }
  }

  // Bar colours per category
  const CAT_COLOR: Record<AccredCategory, string> = {
    E:   "bg-[#0057A8]",
    Es:  "bg-blue-400",
    EP:  "bg-purple-600",
    EPs: "bg-purple-400",
    ET:  "bg-amber-500",
    EC:  "bg-gray-500",
  };

  return (
    <div className="space-y-4">
      {/* Per-category quota progress bars */}
      {quota && (
        <div className="grid grid-cols-3 gap-3">
          {activeCategories.map((cat) => {
            const catMeta = ACCRED_CATEGORIES.find((c) => c.value === cat)!;
            const used  = totals[cat];
            const total = quota[CAT_FIELDS[cat].quotaKey];
            if (total === 0) return null;
            const pct  = Math.min(100, Math.round((used / total) * 100));
            const over = used > total;
            return (
              <div key={cat} className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-gray-700">{catMeta.shortLabel} — {catMeta.description}</span>
                  <span className={`font-semibold ${over ? "text-red-600" : "text-gray-900"}`}>
                    {used} / {total}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${over ? "bg-red-500" : CAT_COLOR[cat]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {over && <p className="text-xs text-red-600 mt-1">Over quota</p>}
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
          aria-label="Search organisations"
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
          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  <th
                    scope="col"
                    aria-sort={sortAsc ? "ascending" : "descending"}
                    tabIndex={0}
                    className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700 whitespace-nowrap"
                    onClick={() => setSortAsc((v) => !v)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSortAsc((v) => !v); } }}
                  >
                    Organisation {sortAsc ? "↑" : "↓"}
                  </th>
                  {activeCategories.map((cat) => (
                    <th
                      key={cat}
                      scope="col"
                      colSpan={2}
                      className="text-center px-2 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap border-l border-gray-200"
                    >
                      {cat}
                    </th>
                  ))}
                </tr>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th />
                  {activeCategories.map((cat) => (
                    <>
                      <th key={`${cat}-req`} className="text-right px-2 py-1 text-xs font-normal text-gray-400 border-l border-gray-200">Req.</th>
                      <th key={`${cat}-alloc`} className="text-right px-3 py-1 text-xs font-normal text-gray-500">Alloc.</th>
                    </>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayRows.map((row) => {
                  const v = values[row.orgId];
                  return (
                    <tr key={row.orgId} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-900 whitespace-nowrap">{row.orgName}</td>
                      {activeCategories.map((cat) => {
                        const fields = CAT_FIELDS[cat];
                        const enabled = row[CAT_ENABLED_FIELD[cat]] as boolean;
                        const requested = row[fields.requested] as number | null;
                        const currentVal = v[cat];
                        return (
                          <>
                            {/* Requested */}
                            <td key={`${row.orgId}-${cat}-req`} className="px-2 py-3 text-right text-xs text-gray-400 border-l border-gray-100">
                              {enabled ? (requested ?? "—") : "—"}
                            </td>
                            {/* Allocated */}
                            <td key={`${row.orgId}-${cat}-alloc`} className="px-3 py-3 text-right">
                              {isEditable ? (
                                enabled ? (
                                  <input
                                    type="number"
                                    name={`${cat.toLowerCase()}_${row.orgId}`}
                                    value={currentVal}
                                    onChange={(e) => handleChange(row.orgId, cat, e.target.value)}
                                    onFocus={(e) => e.target.select()}
                                    min={0}
                                    aria-label={`${cat} slots for ${row.orgName}`}
                                    className="w-16 border border-gray-300 rounded px-1.5 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-400"
                                  />
                                ) : (
                                  <>
                                    <input type="hidden" name={`${cat.toLowerCase()}_${row.orgId}`} value={0} />
                                    <span className="text-gray-300">—</span>
                                  </>
                                )
                              ) : (
                                <span className={`font-semibold ${currentVal > 0 ? "text-gray-900" : "text-gray-300"}`}>
                                  {enabled ? currentVal : "—"}
                                </span>
                              )}
                            </td>
                          </>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200 sticky bottom-0">
                <tr>
                  <td className="px-5 py-2.5 text-xs font-semibold text-gray-600 uppercase">Total</td>
                  {activeCategories.map((cat) => (
                    <>
                      <td key={`total-${cat}-req`} className="border-l border-gray-200" />
                      <td key={`total-${cat}-alloc`} className="px-3 py-2.5 text-right font-semibold text-gray-900">
                        {totals[cat]}
                        {quota && quota[CAT_FIELDS[cat].quotaKey] > 0 && (
                          <span className="text-xs font-normal text-gray-400 ml-1">
                            /{quota[CAT_FIELDS[cat].quotaKey]}
                          </span>
                        )}
                      </td>
                    </>
                  ))}
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
