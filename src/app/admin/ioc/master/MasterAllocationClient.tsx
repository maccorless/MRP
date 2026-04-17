"use client";

import { useMemo, useState } from "react";
import { NOC_CONTINENT } from "@/lib/noc-continent";

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
  entityType: "noc" | "if";
  quota: CategorySlots;
  allocated: CategorySlots; // sum of all orgSlotAllocations regardless of state
  pbnStatus: string;
};

export type IocDirectRow = {
  label: string;
  quota: CategorySlots;
  allocated: CategorySlots;
  pbnStatus: string;
};

export type OrgAllocRow = {
  orgId: string;
  orgName: string;
  nocCode: string;
  pbnState: string;
  slots: CategorySlots;
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
  allocated: CategorySlots;
};

export type EventCapacity = {
  capacity: number;
  iocHoldback: number;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

export const ZERO_SLOTS: CategorySlots = { e: 0, es: 0, ep: 0, eps: 0, et: 0, ec: 0, nocE: 0 };

export function addSlots(a: CategorySlots, b: CategorySlots): CategorySlots {
  return {
    e:    a.e    + b.e,
    es:   a.es   + b.es,
    ep:   a.ep   + b.ep,
    eps:  a.eps  + b.eps,
    et:   a.et   + b.et,
    ec:   a.ec   + b.ec,
    nocE: a.nocE + b.nocE,
  };
}

function grandTotal(s: CategorySlots) {
  return s.e + s.es + s.ep + s.eps + s.et + s.ec + s.nocE;
}

const CATS = [
  { key: "nocE" as const, label: "NocE" },
  { key: "e"    as const, label: "E"    },
  { key: "es"   as const, label: "Es"   },
  { key: "ep"   as const, label: "EP"   },
  { key: "eps"  as const, label: "EPs"  },
  { key: "et"   as const, label: "ET"   },
  { key: "ec"   as const, label: "EC"   },
] as const;

const STATUS_BADGE: Record<string, { bg: string; label: string }> = {
  not_started:   { bg: "bg-gray-100 text-gray-500",     label: "Not started" },
  draft:         { bg: "bg-gray-100 text-gray-700",     label: "Draft"       },
  noc_submitted: { bg: "bg-yellow-100 text-yellow-800", label: "Submitted"   },
  ocog_approved: { bg: "bg-green-100 text-green-800",   label: "Approved"    },
  sent_to_acr:   { bg: "bg-blue-100 text-blue-800",     label: "Sent to ACR" },
};

const ORG_STATE_BADGE: Record<string, { bg: string; label: string }> = {
  draft:         { bg: "bg-gray-100 text-gray-600",     label: "Draft"       },
  noc_submitted: { bg: "bg-yellow-100 text-yellow-800", label: "Submitted"   },
  ocog_approved: { bg: "bg-green-100 text-green-800",   label: "Approved"    },
  sent_to_acr:   { bg: "bg-blue-100 text-blue-800",     label: "Sent to ACR" },
};

function StatusBadge({ status }: { status: string }) {
  const spec = STATUS_BADGE[status] ?? STATUS_BADGE.not_started;
  return (
    <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap ${spec.bg}`}>
      {spec.label}
    </span>
  );
}

function OrgStateBadge({ state }: { state: string }) {
  const spec = ORG_STATE_BADGE[state] ?? ORG_STATE_BADGE.draft;
  return (
    <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${spec.bg}`}>
      {spec.label}
    </span>
  );
}

function n(v: number) { return v === 0 ? <span className="text-gray-300">—</span> : <>{v}</>; }

// ── Cap Tracker ───────────────────────────────────────────────────────────────

function CapTracker({ grandTotals, eventCapacity }: { grandTotals: GrandTotals; eventCapacity: EventCapacity }) {
  const distributed = grandTotal(grandTotals.quota);
  const total = distributed + eventCapacity.iocHoldback;
  const pct = eventCapacity.capacity > 0 ? Math.min(100, Math.round((total / eventCapacity.capacity) * 100)) : 0;
  const gap = eventCapacity.capacity - total;
  const barColor = total > eventCapacity.capacity ? "bg-red-500" : total >= eventCapacity.capacity * 0.95 ? "bg-amber-400" : "bg-green-500";

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Capacity Tracker</span>
        <span className="text-xs text-gray-500">
          {total.toLocaleString()} / {eventCapacity.capacity.toLocaleString()} ({pct}%)
          {gap >= 0
            ? <span className="text-green-700 ml-2">↓ {gap.toLocaleString()} remaining</span>
            : <span className="text-red-700 ml-2">↑ {Math.abs(gap).toLocaleString()} over capacity</span>}
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div className={`h-2.5 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex gap-6 mt-2 text-xs text-gray-500">
        <span>Distributed: <strong className="text-gray-900">{distributed.toLocaleString()}</strong></span>
        <span>IOC Holdback: <strong className="text-gray-900">{eventCapacity.iocHoldback.toLocaleString()}</strong></span>
        <span>Total committed: <strong className="text-gray-900">{total.toLocaleString()}</strong></span>
        <span>Capacity target: <strong className="text-gray-900">{eventCapacity.capacity.toLocaleString()}</strong></span>
      </div>
    </div>
  );
}

// ── Grand Totals Banner ───────────────────────────────────────────────────────

function GrandTotalsBanner({ totals }: { totals: GrandTotals }) {
  return (
    <div className="rounded-lg border border-[#0057A8]/20 bg-[#0057A8]/5 p-4">
      <div className="text-xs uppercase tracking-wide font-semibold text-[#0057A8] mb-3">
        System-wide Grand Totals — Quota vs Allocated
      </div>
      <div className="grid grid-cols-4 md:grid-cols-8 gap-2 text-sm">
        {CATS.map(({ key, label }) => (
          <div key={key} className="bg-white/70 rounded p-2 text-center">
            <div className="text-xs font-semibold text-gray-500 mb-1">{label}</div>
            <div className="text-base font-bold text-gray-900">{totals.quota[key]}</div>
            <div className="text-xs text-gray-500">alloc: {totals.allocated[key]}</div>
          </div>
        ))}
        <div className="bg-[#0057A8]/10 rounded p-2 text-center">
          <div className="text-xs font-semibold text-[#0057A8] mb-1">Total</div>
          <div className="text-base font-bold text-[#0057A8]">{grandTotal(totals.quota)}</div>
          <div className="text-xs text-[#0057A8]/80">alloc: {grandTotal(totals.allocated)}</div>
        </div>
      </div>
    </div>
  );
}

// ── Table components ──────────────────────────────────────────────────────────

function TableHead({ showContinent }: { showContinent: boolean }) {
  return (
    <thead className="bg-gray-50 sticky top-0 z-10">
      <tr className="border-b border-gray-200">
        <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide sticky left-0 bg-gray-50 z-20 min-w-[120px]">
          Entity
        </th>
        {showContinent && (
          <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide min-w-[90px]">
            Continent
          </th>
        )}
        <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide min-w-[90px]">
          Status
        </th>
        {CATS.map(({ label }) => (
          <th key={label} colSpan={2} className="text-center px-1 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-l border-gray-200 min-w-[80px]">
            {label}
          </th>
        ))}
        <th className="text-right px-2 py-2 text-xs font-medium text-gray-700 uppercase tracking-wide border-l border-gray-200">
          Total Q
        </th>
        <th className="text-right px-2 py-2 text-xs font-medium text-gray-700 uppercase tracking-wide">
          Total A
        </th>
        <th className="text-right px-3 py-2 text-xs font-medium text-gray-700 uppercase tracking-wide">
          Δ Rem
        </th>
      </tr>
      {/* sub-header: Q / A labels per category */}
      <tr className="border-b border-gray-200 bg-gray-50">
        <th className="sticky left-0 bg-gray-50 z-20" />
        {showContinent && <th />}
        <th />
        {CATS.map(({ label }) => (
          <>
            <th key={`${label}-q`} className="text-center px-1 py-1 text-[10px] font-medium text-gray-400 border-l border-gray-200">Q</th>
            <th key={`${label}-a`} className="text-center px-1 py-1 text-[10px] font-medium text-gray-400">A</th>
          </>
        ))}
        <th className="border-l border-gray-200" />
        <th />
        <th />
      </tr>
    </thead>
  );
}

function AllocationRow({
  label,
  labelClass,
  continent,
  showContinent,
  quota,
  allocated,
  status,
  expandable,
  expanded,
  onToggle,
}: {
  label: string;
  labelClass?: string;
  continent?: string;
  showContinent: boolean;
  quota: CategorySlots;
  allocated: CategorySlots;
  status: string;
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const tq = grandTotal(quota);
  const ta = grandTotal(allocated);
  const delta = tq - ta;

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className={`px-3 py-2.5 sticky left-0 bg-white z-10 ${labelClass ?? "text-sm text-gray-900"}`}>
        <div className="flex items-center gap-1.5">
          {expandable && (
            <button
              onClick={onToggle}
              className="text-gray-400 hover:text-gray-700 w-4 h-4 flex items-center justify-center text-xs leading-none"
              title={expanded ? "Collapse" : "Expand orgs"}
            >
              {expanded ? "▼" : "▶"}
            </button>
          )}
          <span className="font-mono font-semibold">{label}</span>
        </div>
      </td>
      {showContinent && (
        <td className="px-3 py-2.5 text-xs text-gray-500">{continent ?? "—"}</td>
      )}
      <td className="px-3 py-2.5">
        <StatusBadge status={status} />
      </td>
      {CATS.map(({ key }) => (
        <>
          <td key={`${key}-q`} className="px-1 py-2.5 text-right text-xs text-gray-600 border-l border-gray-100">
            {quota[key] === 0 ? <span className="text-gray-200">0</span> : quota[key]}
          </td>
          <td key={`${key}-a`} className={`px-1 py-2.5 text-right text-xs font-medium ${allocated[key] > quota[key] ? "text-red-600" : allocated[key] > 0 ? "text-gray-900" : "text-gray-300"}`}>
            {n(allocated[key])}
          </td>
        </>
      ))}
      <td className="px-2 py-2.5 text-right text-sm font-semibold text-gray-900 border-l border-gray-200">{tq}</td>
      <td className="px-2 py-2.5 text-right text-sm font-semibold text-gray-900">{n(ta)}</td>
      <td className={`px-3 py-2.5 text-right text-sm font-semibold ${delta < 0 ? "text-red-600" : delta === 0 && tq > 0 ? "text-amber-600" : "text-gray-600"}`}>
        {tq > 0 ? delta : "—"}
      </td>
    </tr>
  );
}

function OrgSubRows({
  nocCode,
  orgRows,
  showContinent,
  colCount,
}: {
  nocCode: string;
  orgRows: OrgAllocRow[];
  showContinent: boolean;
  colCount: number;
}) {
  const rows = orgRows.filter((r) => r.nocCode === nocCode);
  if (rows.length === 0) {
    return (
      <tr className="bg-blue-50/30">
        <td colSpan={colCount} className="px-8 py-2 text-xs text-gray-400 italic">
          No org allocations yet.
        </td>
      </tr>
    );
  }
  return (
    <>
      {rows.map((row) => {
        const total = grandTotal(row.slots);
        return (
          <tr key={row.orgId} className="bg-blue-50/30 hover:bg-blue-50/60">
            <td className={`px-3 py-2 sticky left-0 bg-blue-50/30 z-10 ${showContinent ? "pl-10" : "pl-10"}`}>
              <span className="text-xs text-gray-700 truncate block max-w-[180px]" title={row.orgName}>
                {row.orgName}
              </span>
            </td>
            {showContinent && <td />}
            <td className="px-3 py-2">
              <OrgStateBadge state={row.pbnState} />
            </td>
            {CATS.map(({ key }) => (
              <>
                <td key={`${key}-q`} className="border-l border-gray-100" />
                <td key={`${key}-a`} className={`px-1 py-2 text-right text-xs ${row.slots[key] > 0 ? "font-medium text-gray-900" : "text-gray-200"}`}>
                  {n(row.slots[key])}
                </td>
              </>
            ))}
            <td className="border-l border-gray-200" />
            <td className="px-2 py-2 text-right text-xs font-semibold text-gray-900">{n(total)}</td>
            <td />
          </tr>
        );
      })}
    </>
  );
}

function GrandTotalRow({ totals, showContinent }: { totals: GrandTotals; showContinent: boolean }) {
  const tq = grandTotal(totals.quota);
  const ta = grandTotal(totals.allocated);
  return (
    <tr className="bg-[#0057A8]/5 border-y-2 border-[#0057A8]/20 font-semibold">
      <td className="px-3 py-2.5 text-[#0057A8] text-sm sticky left-0 bg-[#0057A8]/5 z-10">GRAND TOTAL</td>
      {showContinent && <td />}
      <td />
      {CATS.map(({ key }) => (
        <>
          <td key={`${key}-q`} className="px-1 py-2.5 text-right text-xs text-gray-700 border-l border-gray-100">{totals.quota[key]}</td>
          <td key={`${key}-a`} className="px-1 py-2.5 text-right text-xs font-bold text-gray-900">{totals.allocated[key]}</td>
        </>
      ))}
      <td className="px-2 py-2.5 text-right text-sm text-[#0057A8] border-l border-gray-200">{tq}</td>
      <td className="px-2 py-2.5 text-right text-sm text-[#0057A8]">{ta}</td>
      <td className={`px-3 py-2.5 text-right text-sm ${tq - ta < 0 ? "text-red-600" : "text-gray-600"}`}>{tq - ta}</td>
    </tr>
  );
}

function SectionHeader({ title, colSpan }: { title: string; colSpan: number }) {
  return (
    <tr className="bg-gray-100">
      <td colSpan={colSpan} className="px-3 py-1.5 text-xs uppercase tracking-wide font-semibold text-gray-600 sticky left-0">
        {title}
      </td>
    </tr>
  );
}

// Wrapper that keeps the row + its expanded sub-rows together with a stable fragment key
function AllocationRowGroup({
  row,
  continent,
  showContinent,
  expanded,
  onToggle,
  orgAllocRows,
  colCount,
}: {
  row: NocRow;
  continent?: string;
  showContinent: boolean;
  expanded: boolean;
  onToggle: () => void;
  orgAllocRows: OrgAllocRow[];
  colCount: number;
}) {
  return (
    <>
      <AllocationRow
        label={row.nocCode}
        continent={continent}
        showContinent={showContinent}
        quota={row.quota}
        allocated={row.allocated}
        status={row.pbnStatus}
        expandable
        expanded={expanded}
        onToggle={onToggle}
      />
      {expanded && (
        <OrgSubRows
          nocCode={row.nocCode}
          orgRows={orgAllocRows}
          showContinent={showContinent}
          colCount={colCount}
        />
      )}
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type StatusFilter = "all" | "not_started" | "draft" | "noc_submitted" | "ocog_approved" | "sent_to_acr";

export function MasterAllocationClient({
  rows,
  iocDirectRow,
  enrSummary,
  grandTotals,
  eventCapacity,
  orgAllocRows,
}: {
  rows: NocRow[];
  iocDirectRow: IocDirectRow;
  enrSummary: EnrSummary;
  grandTotals: GrandTotals;
  eventCapacity: EventCapacity;
  orgAllocRows: OrgAllocRow[];
}) {
  const [searchText, setSearchText]       = useState("");
  const [statusFilter, setStatusFilter]   = useState<StatusFilter>("all");
  const [showContinent, setShowContinent] = useState(true);
  const [expandedNocs, setExpandedNocs]   = useState<Set<string>>(new Set());

  const nocRows    = rows.filter((r) => r.entityType === "noc");
  const ifRows     = rows.filter((r) => r.entityType === "if");

  const filteredNocRows = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return nocRows.filter((r) => {
      if (q && !r.nocCode.toLowerCase().includes(q) && !(NOC_CONTINENT[r.nocCode] ?? "").toLowerCase().includes(q)) return false;
      if (statusFilter !== "all" && r.pbnStatus !== statusFilter) return false;
      return true;
    });
  }, [nocRows, searchText, statusFilter]);

  const filteredIfRows = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return ifRows.filter((r) => {
      if (q && !r.nocCode.toLowerCase().includes(q)) return false;
      if (statusFilter !== "all" && r.pbnStatus !== statusFilter) return false;
      return true;
    });
  }, [ifRows, searchText, statusFilter]);

  const toggleExpand = (code: string) =>
    setExpandedNocs((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });

  // column count for colspan: entity + [continent] + status + 7*2 + totalQ + totalA + delta
  const colCount = 3 + (showContinent ? 1 : 0) + CATS.length * 2 + 3;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Master Allocation Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Live quota vs allocation across all NOCs, IFs, IOC Direct, and ENR — LA 2028
        </p>
      </div>

      {/* Cap Tracker */}
      <CapTracker grandTotals={grandTotals} eventCapacity={eventCapacity} />

      {/* Grand Totals Banner */}
      <GrandTotalsBanner totals={grandTotals} />

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search NOC / IF code or continent…"
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0057A8]/30 focus:border-[#0057A8] w-60"
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
        <label className="inline-flex items-center gap-2 text-xs text-gray-600 ml-1">
          <input
            type="checkbox"
            checked={showContinent}
            onChange={(e) => setShowContinent(e.target.checked)}
            className="rounded border-gray-300"
          />
          Show continent
        </label>
        <span className="text-xs text-gray-400 ml-1">
          {filteredNocRows.length}/{nocRows.length} NOCs · {filteredIfRows.length}/{ifRows.length} IFs
        </span>
      </div>

      {/* Main table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <TableHead showContinent={showContinent} />
          <tbody className="divide-y divide-gray-100">

            {/* Grand total pinned row */}
            <GrandTotalRow totals={grandTotals} showContinent={showContinent} />

            {/* NOC rows */}
            <SectionHeader title={`NOCs (${filteredNocRows.length})`} colSpan={colCount} />
            {filteredNocRows.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="px-5 py-6 text-center text-sm text-gray-400">
                  No NOCs match the current filters.
                </td>
              </tr>
            ) : (
              filteredNocRows.map((row) => (
                <AllocationRowGroup
                  key={row.nocCode}
                  row={row}
                  continent={NOC_CONTINENT[row.nocCode]}
                  showContinent={showContinent}
                  expanded={expandedNocs.has(row.nocCode)}
                  onToggle={() => toggleExpand(row.nocCode)}
                  orgAllocRows={orgAllocRows}
                  colCount={colCount}
                />
              ))
            )}

            {/* IF rows */}
            <SectionHeader title="International Federations (IF)" colSpan={colCount} />
            {filteredIfRows.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="px-5 py-3 text-sm text-gray-400 italic">
                  No IF quotas loaded yet.
                </td>
              </tr>
            ) : (
              filteredIfRows.map((row) => (
                <AllocationRowGroup
                  key={row.nocCode}
                  row={row}
                  showContinent={showContinent}
                  expanded={expandedNocs.has(row.nocCode)}
                  onToggle={() => toggleExpand(row.nocCode)}
                  orgAllocRows={orgAllocRows}
                  colCount={colCount}
                />
              ))
            )}

            {/* IOC Direct */}
            <SectionHeader title="IOC Direct" colSpan={colCount} />
            <AllocationRow
              label={iocDirectRow.label}
              labelClass="text-sm font-semibold text-gray-900"
              showContinent={showContinent}
              quota={iocDirectRow.quota}
              allocated={iocDirectRow.allocated}
              status={iocDirectRow.pbnStatus}
              expandable
              expanded={expandedNocs.has("IOC_DIRECT")}
              onToggle={() => toggleExpand("IOC_DIRECT")}
            />
            {expandedNocs.has("IOC_DIRECT") && (
              <OrgSubRows
                nocCode="IOC_DIRECT"
                orgRows={orgAllocRows}
                showContinent={showContinent}
                colCount={colCount}
              />
            )}

            {/* IOC Holdback (read-only) */}
            {eventCapacity.iocHoldback > 0 && (
              <>
                <SectionHeader title="IOC Holdback" colSpan={colCount} />
                <tr className="hover:bg-gray-50">
                  <td className="px-3 py-2.5 sticky left-0 bg-white z-10 font-mono font-semibold text-gray-700 text-sm">
                    <span className="ml-5">Holdback Pool</span>
                  </td>
                  {showContinent && <td />}
                  <td className="px-3 py-2.5">
                    <span className="text-xs text-gray-400 italic">IOC reserved</span>
                  </td>
                  {CATS.map(({ key }) => (
                    <>
                      <td key={`${key}-q`} className="border-l border-gray-100" />
                      <td key={`${key}-a`} />
                    </>
                  ))}
                  <td className="px-2 py-2.5 text-right text-sm font-semibold text-gray-700 border-l border-gray-200">
                    {eventCapacity.iocHoldback}
                  </td>
                  <td />
                  <td />
                </tr>
              </>
            )}

            {/* ENR */}
            <SectionHeader title="Extended Non-Rights (ENR)" colSpan={colCount} />
            <tr className="hover:bg-gray-50">
              <td colSpan={colCount} className="px-3 py-3 text-sm text-gray-700">
                <div className="flex flex-wrap gap-x-8 gap-y-1 ml-5">
                  <span><strong className="text-gray-900">{enrSummary.totalRequests}</strong> requests</span>
                  <span><strong className="text-yellow-700">{enrSummary.pending}</strong> pending IOC decision</span>
                  <span><strong className="text-green-700">{enrSummary.decided}</strong> decided</span>
                  <span>Requested: <strong className="text-gray-900">{enrSummary.slotsRequested}</strong></span>
                  <span>Granted: <strong className="text-gray-900">{enrSummary.slotsGranted}</strong></span>
                </div>
              </td>
            </tr>

          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">
        Q = quota assigned by IOC · A = total allocated by NOC/IF (all states) · Δ = quota remaining · Expand rows (▶) to see org-level breakdown.
      </p>
    </div>
  );
}
