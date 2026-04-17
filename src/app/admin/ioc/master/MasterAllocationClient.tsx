"use client";

import { useMemo, useState } from "react";

export type CategorySlots = {
  e: number;
  es: number;
  ep: number;
  eps: number;
  et: number;
  ec: number;
  nocE: number;
};

export type PbnStatus = "not_started" | "draft" | "noc_submitted" | "ocog_approved" | "sent_to_acr";

export type NocRow = {
  nocCode: string;
  quota: CategorySlots;
  submitted: CategorySlots;
  approved: CategorySlots;
  pbnStatus: string;
};

export type IocDirectRow = {
  label: string;
  quota: CategorySlots;
  submitted: CategorySlots;
  approved: CategorySlots;
  pbnStatus: string;
};

export type EnrSummary = {
  totalRequests: number;
  pending: number;
  decided: number;
  slotsRequested: number;
  slotsGranted: number;
};

export type GrandTotals = {
  quota: CategorySlots;
  submitted: CategorySlots;
  approved: CategorySlots;
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function pressTotal(s: CategorySlots) { return s.e + s.es + s.et + s.ec; }
function photoTotal(s: CategorySlots) { return s.ep + s.eps; }
function grandTotal(s: CategorySlots) { return pressTotal(s) + photoTotal(s) + s.nocE; }

const STATUS_BADGE: Record<string, { bg: string; label: string }> = {
  not_started:   { bg: "bg-gray-100 text-gray-600",   label: "Not Started" },
  draft:         { bg: "bg-gray-100 text-gray-700",   label: "Draft" },
  noc_submitted: { bg: "bg-yellow-100 text-yellow-800", label: "Submitted" },
  ocog_approved: { bg: "bg-green-100 text-green-800",   label: "Approved" },
  sent_to_acr:   { bg: "bg-blue-100 text-blue-800",     label: "Sent to ACR" },
};

function StatusBadge({ status }: { status: string }) {
  const spec = STATUS_BADGE[status] ?? STATUS_BADGE.not_started;
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${spec.bg}`}>
      {spec.label}
    </span>
  );
}

/** Render submitted/approved: dash when zero; quota always shows numeric. */
function renderSubmittedOrApproved(n: number): string {
  return n === 0 ? "—" : String(n);
}

// ── Component ───────────────────────────────────────────────────────────────

type StatusFilter = "all" | "not_started" | "draft" | "noc_submitted" | "ocog_approved" | "sent_to_acr";

export function MasterAllocationClient({
  rows,
  iocDirectRow,
  enrSummary,
  grandTotals,
}: {
  rows: NocRow[];
  iocDirectRow: IocDirectRow;
  enrSummary: EnrSummary;
  grandTotals: GrandTotals;
}) {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandCategories, setExpandCategories] = useState(false);

  const filteredRows = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return rows.filter((r) => {
      if (q && !r.nocCode.toLowerCase().includes(q)) return false;
      if (statusFilter !== "all" && r.pbnStatus !== statusFilter) return false;
      return true;
    });
  }, [rows, searchText, statusFilter]);

  const compressedColCount = 12;
  const expandedColCount = 2 + 6 * 3 + 2 + 2; // NOC + Status + (6 cats × Q/S/A) + NocE Q/A + Total Q/A

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Master Allocation Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Live quota vs allocation across all NOCs, IOC Direct, and ENR. Replaces the Paris 2024 master spreadsheet.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={expandCategories}
              onChange={(e) => setExpandCategories(e.target.checked)}
              className="rounded border-gray-300"
            />
            Expand categories
          </label>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search NOC code…"
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0057A8]/30 focus:border-[#0057A8]"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#0057A8]/30 focus:border-[#0057A8]"
        >
          <option value="all">All statuses</option>
          <option value="not_started">Not Started</option>
          <option value="draft">Draft</option>
          <option value="noc_submitted">Submitted</option>
          <option value="ocog_approved">Approved</option>
          <option value="sent_to_acr">Sent to ACR</option>
        </select>
        <span className="text-xs text-gray-500">
          {filteredRows.length} of {rows.length} NOCs
        </span>
      </div>

      {/* Grand totals banner */}
      <div className="rounded-lg border border-[#0057A8]/20 bg-[#0057A8]/5 p-4">
        <div className="text-xs uppercase tracking-wide font-semibold text-[#0057A8] mb-2">
          System-wide Grand Totals
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <TotalBlock label="Quota (Press + Photo + NocE)" value={grandTotal(grandTotals.quota)} />
          <TotalBlock label="Submitted" value={grandTotal(grandTotals.submitted)} />
          <TotalBlock label="Approved" value={grandTotal(grandTotals.approved)} />
          <TotalBlock label="Remaining vs Quota" value={grandTotal(grandTotals.quota) - grandTotal(grandTotals.approved)} />
        </div>
      </div>

      {/* Main allocation table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <TableHead expandCategories={expandCategories} />
          <tbody className="divide-y divide-gray-100">
            {/* Grand total row pinned at top */}
            <GrandTotalRow totals={grandTotals} expandCategories={expandCategories} />

            {/* NOC rows */}
            {filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan={expandCategories ? expandedColCount : compressedColCount}
                  className="px-5 py-6 text-center text-sm text-gray-400"
                >
                  No NOCs match the current filters.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <AllocationRow
                  key={row.nocCode}
                  label={row.nocCode}
                  labelClass="font-mono font-semibold text-gray-900"
                  quota={row.quota}
                  submitted={row.submitted}
                  approved={row.approved}
                  status={row.pbnStatus}
                  expandCategories={expandCategories}
                />
              ))
            )}

            {/* IOC Direct section */}
            <SectionHeader
              title="IOC Direct"
              colSpan={expandCategories ? expandedColCount : compressedColCount}
            />
            <AllocationRow
              label={iocDirectRow.label}
              labelClass="font-semibold text-gray-900"
              quota={iocDirectRow.quota}
              submitted={iocDirectRow.submitted}
              approved={iocDirectRow.approved}
              status={iocDirectRow.pbnStatus}
              expandCategories={expandCategories}
            />

            {/* ENR section */}
            <SectionHeader
              title="Extra-Non-Rights (ENR)"
              colSpan={expandCategories ? expandedColCount : compressedColCount}
            />
            <tr className="hover:bg-gray-50">
              <td
                colSpan={expandCategories ? expandedColCount : compressedColCount}
                className="px-5 py-3 text-sm text-gray-700"
              >
                <div className="flex flex-wrap gap-x-8 gap-y-1">
                  <span><strong className="text-gray-900">{enrSummary.totalRequests}</strong> total requests</span>
                  <span><strong className="text-yellow-700">{enrSummary.pending}</strong> pending IOC decision</span>
                  <span><strong className="text-green-700">{enrSummary.decided}</strong> decided</span>
                  <span>Slots requested: <strong className="text-gray-900">{enrSummary.slotsRequested}</strong></span>
                  <span>Slots granted: <strong className="text-gray-900">{enrSummary.slotsGranted}</strong></span>
                </div>
              </td>
            </tr>

            {/* IF section (placeholder) */}
            <SectionHeader
              title="International Federations (IF)"
              colSpan={expandCategories ? expandedColCount : compressedColCount}
            />
            <tr>
              <td
                colSpan={expandCategories ? expandedColCount : compressedColCount}
                className="px-5 py-3 text-sm text-gray-500 italic"
              >
                Pending stakeholder sign-off — IF allocation flow is not yet wired into the master view.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Subcomponents ───────────────────────────────────────────────────────────

function TotalBlock({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-xs text-gray-600">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

function SectionHeader({ title, colSpan }: { title: string; colSpan: number }) {
  return (
    <tr className="bg-gray-50">
      <td colSpan={colSpan} className="px-5 py-2 text-xs uppercase tracking-wide font-semibold text-gray-600">
        {title}
      </td>
    </tr>
  );
}

function TableHead({ expandCategories }: { expandCategories: boolean }) {
  if (expandCategories) {
    return (
      <thead className="bg-gray-50 sticky top-0 z-10">
        <tr>
          <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">NOC</th>
          <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
          {(["E", "Es", "EP", "EPs", "ET", "EC"] as const).map((c) => (
            <ColTripleHead key={c} label={c} />
          ))}
          <th className="text-right px-2 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">NocE Q</th>
          <th className="text-right px-2 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">NocE A</th>
          <th className="text-right px-2 py-2 text-xs font-medium text-gray-700 uppercase tracking-wide border-l border-gray-200">Total Q</th>
          <th className="text-right px-2 py-2 text-xs font-medium text-gray-700 uppercase tracking-wide">Total A</th>
        </tr>
      </thead>
    );
  }
  return (
    <thead className="bg-gray-50 sticky top-0 z-10">
      <tr>
        <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">NOC</th>
        <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
        <th className="text-right px-2 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Press Q</th>
        <th className="text-right px-2 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Press S</th>
        <th className="text-right px-2 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Press A</th>
        <th className="text-right px-2 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-l border-gray-200">Photo Q</th>
        <th className="text-right px-2 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Photo S</th>
        <th className="text-right px-2 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Photo A</th>
        <th className="text-right px-2 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-l border-gray-200">NocE Q</th>
        <th className="text-right px-2 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">NocE A</th>
        <th className="text-right px-2 py-2 text-xs font-medium text-gray-700 uppercase tracking-wide border-l border-gray-200">Total Q</th>
        <th className="text-right px-2 py-2 text-xs font-medium text-gray-700 uppercase tracking-wide">Total A</th>
      </tr>
    </thead>
  );
}

function ColTripleHead({ label }: { label: string }) {
  return (
    <>
      <th className="text-right px-2 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-l border-gray-200">{label} Q</th>
      <th className="text-right px-2 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">{label} S</th>
      <th className="text-right px-2 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">{label} A</th>
    </>
  );
}

function GrandTotalRow({
  totals,
  expandCategories,
}: {
  totals: GrandTotals;
  expandCategories: boolean;
}) {
  return (
    <tr className="bg-[#0057A8]/5 border-y-2 border-[#0057A8]/30 font-semibold">
      <td className="px-4 py-2.5 text-[#0057A8]">GRAND TOTAL</td>
      <td className="px-3 py-2.5 text-xs text-gray-500">—</td>
      {expandCategories ? (
        <>
          <CatTriple q={totals.quota.e}   s={totals.submitted.e}   a={totals.approved.e}   showDashes={false} />
          <CatTriple q={totals.quota.es}  s={totals.submitted.es}  a={totals.approved.es}  showDashes={false} />
          <CatTriple q={totals.quota.ep}  s={totals.submitted.ep}  a={totals.approved.ep}  showDashes={false} />
          <CatTriple q={totals.quota.eps} s={totals.submitted.eps} a={totals.approved.eps} showDashes={false} />
          <CatTriple q={totals.quota.et}  s={totals.submitted.et}  a={totals.approved.et}  showDashes={false} />
          <CatTriple q={totals.quota.ec}  s={totals.submitted.ec}  a={totals.approved.ec}  showDashes={false} />
          <td className="px-2 py-2.5 text-right">{totals.quota.nocE}</td>
          <td className="px-2 py-2.5 text-right">{totals.approved.nocE}</td>
        </>
      ) : (
        <>
          <td className="px-2 py-2.5 text-right">{pressTotal(totals.quota)}</td>
          <td className="px-2 py-2.5 text-right">{pressTotal(totals.submitted)}</td>
          <td className="px-2 py-2.5 text-right">{pressTotal(totals.approved)}</td>
          <td className="px-2 py-2.5 text-right border-l border-gray-200">{photoTotal(totals.quota)}</td>
          <td className="px-2 py-2.5 text-right">{photoTotal(totals.submitted)}</td>
          <td className="px-2 py-2.5 text-right">{photoTotal(totals.approved)}</td>
          <td className="px-2 py-2.5 text-right border-l border-gray-200">{totals.quota.nocE}</td>
          <td className="px-2 py-2.5 text-right">{totals.approved.nocE}</td>
        </>
      )}
      <td className="px-2 py-2.5 text-right text-[#0057A8] border-l border-gray-200">{grandTotal(totals.quota)}</td>
      <td className="px-2 py-2.5 text-right text-[#0057A8]">{grandTotal(totals.approved)}</td>
    </tr>
  );
}

function CatTriple({
  q,
  s,
  a,
  showDashes,
}: {
  q: number;
  s: number;
  a: number;
  showDashes: boolean;
}) {
  return (
    <>
      <td className="px-2 py-2.5 text-right border-l border-gray-200 text-gray-700">
        {q}
      </td>
      <td className="px-2 py-2.5 text-right text-gray-700">
        {showDashes ? renderSubmittedOrApproved(s) : s}
      </td>
      <td className="px-2 py-2.5 text-right text-gray-700">
        {showDashes ? renderSubmittedOrApproved(a) : a}
      </td>
    </>
  );
}

function AllocationRow({
  label,
  labelClass,
  quota,
  submitted,
  approved,
  status,
  expandCategories,
}: {
  label: string;
  labelClass: string;
  quota: CategorySlots;
  submitted: CategorySlots;
  approved: CategorySlots;
  status: string;
  expandCategories: boolean;
}) {
  return (
    <tr className="hover:bg-gray-50">
      <td className={`px-4 py-2.5 ${labelClass}`}>{label}</td>
      <td className="px-3 py-2.5"><StatusBadge status={status} /></td>
      {expandCategories ? (
        <>
          <CatTriple q={quota.e}   s={submitted.e}   a={approved.e}   showDashes />
          <CatTriple q={quota.es}  s={submitted.es}  a={approved.es}  showDashes />
          <CatTriple q={quota.ep}  s={submitted.ep}  a={approved.ep}  showDashes />
          <CatTriple q={quota.eps} s={submitted.eps} a={approved.eps} showDashes />
          <CatTriple q={quota.et}  s={submitted.et}  a={approved.et}  showDashes />
          <CatTriple q={quota.ec}  s={submitted.ec}  a={approved.ec}  showDashes />
          <td className="px-2 py-2.5 text-right text-gray-700">{quota.nocE}</td>
          <td className="px-2 py-2.5 text-right text-gray-700">{renderSubmittedOrApproved(approved.nocE)}</td>
        </>
      ) : (
        <>
          <td className="px-2 py-2.5 text-right text-gray-700">{pressTotal(quota)}</td>
          <td className="px-2 py-2.5 text-right text-gray-700">{renderSubmittedOrApproved(pressTotal(submitted))}</td>
          <td className="px-2 py-2.5 text-right text-gray-700">{renderSubmittedOrApproved(pressTotal(approved))}</td>
          <td className="px-2 py-2.5 text-right text-gray-700 border-l border-gray-200">{photoTotal(quota)}</td>
          <td className="px-2 py-2.5 text-right text-gray-700">{renderSubmittedOrApproved(photoTotal(submitted))}</td>
          <td className="px-2 py-2.5 text-right text-gray-700">{renderSubmittedOrApproved(photoTotal(approved))}</td>
          <td className="px-2 py-2.5 text-right text-gray-700 border-l border-gray-200">{quota.nocE}</td>
          <td className="px-2 py-2.5 text-right text-gray-700">{renderSubmittedOrApproved(approved.nocE)}</td>
        </>
      )}
      <td className="px-2 py-2.5 text-right font-semibold text-gray-900 border-l border-gray-200">{grandTotal(quota)}</td>
      <td className="px-2 py-2.5 text-right font-semibold text-gray-900">{renderSubmittedOrApproved(grandTotal(approved))}</td>
    </tr>
  );
}
