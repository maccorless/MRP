---
title: "feat: IOC dashboard anomaly detection banners (MISS-07)"
type: feat
status: active
date: 2026-04-10
---

# feat: IOC Dashboard Anomaly Detection Banners (MISS-07)

## Overview

Add three anomaly detection banners to the IOC dashboard at `/admin/ioc` — concentration risk, NOC inactivity, and cross-NOC duplicates. All thresholds are confirmed. Logic runs server-side on every page load; no background jobs required.

## Anomaly Types

| Anomaly | Trigger | Confirmed threshold |
|---------|---------|-------------------|
| **Concentration risk** | Single org requests >30% of its NOC's total quota | 30% — Decision #18 |
| **NOC inactivity** | NOC with an open window hasn't approved any application in 7+ days | 7 days — Decision #18 |
| **Cross-NOC duplicates** | Same email domain registered under multiple NOCs | `isMultiTerritoryFlag` already populated; Open Question #16 for policy |

Note on cross-NOC: the `organizations.isMultiTerritoryFlag` boolean is already set by the dedup logic at submission time. The anomaly banner simply queries the count and lists the flagged orgs. Open Question #16 (whether to act on duplicates) does not block showing the banner — it affects what action the IOC takes, not whether to surface it.

## Technical Approach

### Data gaps in current IOC dashboard query

`src/app/admin/ioc/page.tsx` (lines 21–39) currently selects only a subset of columns. Three additions are needed:

1. `applications.requestedE`, `requestedEs`, `requestedEp`, `requestedEps`, `requestedEt`, `requestedEc` — for concentration risk numerator
2. `applications.organizationId` — for grouping requests per org
3. `applications.reviewedAt` — for NOC inactivity detection

Two additional parallel queries:

4. `SELECT nocCode, eTotal + esTotal + epTotal + epsTotal + etTotal + ecTotal as totalQuota FROM noc_quotas` — concentration risk denominator
5. `SELECT nocCode, openedAt FROM noc_eoi_windows WHERE isOpen = true AND eventId = 'LA28'` — which NOCs are in an active window

### In-memory anomaly computation

All three anomaly arrays are computed in the Server Component after the queries resolve, before the return statement. Keeping this in-memory (rather than SQL subqueries) is intentional: the full applications dataset is already loaded for stat cards and the NOC breakdown table.

```typescript
// Concentration risk
const nocQuotaMap = Object.fromEntries(quotas.map(q => [q.nocCode, q.totalQuota]));
const orgRequests = rows.reduce((acc, r) => {
  const key = `${r.nocCode}:${r.organizationId}`;
  acc[key] = (acc[key] ?? 0) + r.requestedE + r.requestedEs + /* ... */;
  return acc;
}, {} as Record<string, number>);
const concentrationFlags = Object.entries(orgRequests)
  .filter(([key, slots]) => {
    const [nocCode] = key.split(':');
    const quota = nocQuotaMap[nocCode] ?? 0;
    return quota > 0 && slots / quota > 0.30;
  });

// NOC inactivity
const activeWindows = new Map(openWindows.map(w => [w.nocCode, w.openedAt]));
const lastApprovalByNoc = rows
  .filter(r => r.status === 'approved' && r.reviewedAt)
  .reduce((acc, r) => {
    if (!acc[r.nocCode] || r.reviewedAt! > acc[r.nocCode]) acc[r.nocCode] = r.reviewedAt!;
    return acc;
  }, {} as Record<string, Date>);
const inactiveNocs = [...activeWindows.entries()].filter(([noc, openedAt]) => {
  const lastApproval = lastApprovalByNoc[noc];
  const threshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const windowStart = openedAt ?? new Date(0);
  // Inactive if: no approvals at all since window opened, or last approval > 7 days ago
  if (!lastApproval && new Date() - windowStart > 7 * 24 * 60 * 60 * 1000) return true;
  return lastApproval < threshold;
});

// Cross-NOC duplicates (data already in rows via isMultiTerritoryFlag on organizations)
const duplicateOrgs = [...new Set(
  rows.filter(r => r.isMultiTerritoryFlag).map(r => r.organizationName)
)];
```

### Anomaly logic module

Extract to `src/lib/anomaly-detect.ts` to keep the page component lean and enable unit testing.

```typescript
// src/lib/anomaly-detect.ts
export interface ConcentrationFlag { nocCode: string; orgName: string; slots: number; quota: number; pct: number; }
export interface InactiveNoc { nocCode: string; lastApprovalAt: Date | null; windowOpenedAt: Date; daysSince: number; }

export function detectConcentrationRisk(rows, quotaMap, threshold = 0.30): ConcentrationFlag[]
export function detectInactiveNocs(rows, activeWindows, thresholdDays = 7): InactiveNoc[]
export function detectCrossNocDuplicates(rows): string[]
```

### Banner UI

Insert after the header block (line 78 in `ioc/page.tsx`) and before the stat cards. One banner per anomaly type, each conditionally rendered.

Follow the established patterns:

```tsx
{/* Concentration risk — yellow */}
{concentrationFlags.length > 0 && (
  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-900">
    <strong>⚠ Concentration risk ({concentrationFlags.length} {concentrationFlags.length === 1 ? 'org' : 'orgs'})</strong>
    {' '}— {concentrationFlags.map(f => `${f.orgName} (${Math.round(f.pct * 100)}% of ${f.nocCode})`).join(', ')}
  </div>
)}

{/* NOC inactivity — yellow */}
{inactiveNocs.length > 0 && (
  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-900">
    <strong>⚠ Inactive NOCs ({inactiveNocs.length})</strong>
    {' '}— {inactiveNocs.map(n => `${n.nocCode} (${n.daysSince}d)`).join(', ')}
  </div>
)}

{/* Cross-NOC duplicates — purple (consistent with IOC orgs page) */}
{duplicateOrgs.length > 0 && (
  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm text-purple-800">
    <strong>Cross-NOC orgs ({duplicateOrgs.length})</strong>
    {' '}— {duplicateOrgs.join(', ')} · <a href="/admin/ioc/orgs?filter=multi" className="underline">Review</a>
  </div>
)}
```

## Acceptance Criteria

- [ ] Concentration risk banner appears when any active org requests >30% of its NOC's quota; shows org name, NOC, and percentage
- [ ] NOC inactivity banner appears when any NOC with an open EoI window has had no approved applications for 7+ days; shows NOC code and days since last approval
- [ ] Cross-NOC duplicates banner appears when any `isMultiTerritoryFlag = true` orgs exist; links to `/admin/ioc/orgs?filter=multi` for resolution
- [ ] No banner shown when no anomalies are present (zero-state is clean)
- [ ] Anomaly detection logic is unit-testable via `src/lib/anomaly-detect.ts`
- [ ] No additional page load time beyond the two new DB queries (parallel with existing query)
- [ ] Vitest unit tests for all three anomaly functions with edge cases (zero quota, no active windows, empty orgs list)

## Implementation Sequence

1. Extend the IOC dashboard query to include missing columns (`requestedE`..`requestedEc`, `organizationId`, `reviewedAt`)
2. Add the two new parallel queries (`noc_quotas`, `noc_eoi_windows`)
3. Write `src/lib/anomaly-detect.ts` with the three pure functions
4. Write Vitest tests for all three functions
5. Integrate computation into `ioc/page.tsx` before the return statement
6. Add the three banner JSX blocks to the page

## Files to Create / Modify

| File | Change |
|---|---|
| `src/app/admin/ioc/page.tsx` | Extend query columns; add 2 parallel queries; compute anomalies; add banner JSX |
| `src/lib/anomaly-detect.ts` | New — three anomaly detection functions |
| `src/test/anomaly-detect.test.ts` | New — Vitest unit tests |

## Sources & References

- IOC dashboard: `src/app/admin/ioc/page.tsx:21` (current query)
- noc_quotas schema: `src/db/schema.ts:238` (eTotal, esTotal, etc.)
- nocEoiWindows schema: `src/db/schema.ts:353` (isOpen, openedAt)
- applications schema: `src/db/schema.ts:127` (reviewedAt, requestedE...)
- organizations schema: `src/db/schema.ts:100` (isMultiTerritoryFlag)
- Yellow banner pattern: `src/app/admin/noc/home/page.tsx:75`
- Purple banner pattern: `src/app/admin/ioc/orgs/page.tsx:32`
- quota-calc.ts for anomaly logic placement: `src/lib/quota-calc.ts`
- Decision #18 (thresholds): `docs/MRP-design-confirmation.md`
