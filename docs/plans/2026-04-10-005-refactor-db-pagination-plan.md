---
title: "refactor: DB-level pagination for NOC queue and IOC dashboard"
type: refactor
status: active
date: 2026-04-10
---
**Last updated: 10-Apr-2026 15:38**


# refactor: DB-Level Pagination for NOC Queue and IOC Dashboard (TODO-026 / SCALE-1/2)

## Overview

Two pages currently fetch all rows in-memory and filter/aggregate in JavaScript. At prototype scale this is fine; at production scale (hundreds of NOCs × tens of orgs each) the IOC dashboard fetches the entire applications table on every page load. This replaces in-memory fetch-all with SQL-side `LIMIT`/`OFFSET`, parallel `COUNT` queries, and `WHERE` clause filtering.

## Problem Statement

**IOC dashboard (`/admin/ioc/page.tsx`)**: No `WHERE` clause — fetches every application globally, orders by `submittedAt DESC`, then:
- Slices the first 15 for "Recent Applications" (only 15 rows rendered from potentially thousands fetched)
- Aggregates status counts and NOC breakdown in-memory via `rows.reduce`

**NOC queue (`/admin/noc/queue/page.tsx`)**: Fetches all applications for this NOC, then filters in-memory by `status === activeFilter`. Tab bar counts are derived from the same full result set. Scale per NOC is lower (50–200 apps max) but the pattern should be consistent.

## Proposed Solution

Follow the existing `ioc/audit/page.tsx` pattern exactly — it already implements parallel COUNT + paginated data query using Drizzle's `$dynamic()`.

### IOC Dashboard Changes

The IOC dashboard has three distinct data consumers that need different treatment:

1. **Stat cards** (5 status counts) → Replace with a single `GROUP BY status COUNT(*)` query
2. **NOC breakdown table** → Replace with a `GROUP BY noc_code, status COUNT(*)` query  
3. **Recent Applications** → Change from `rows.slice(0, 15)` to `SELECT ... LIMIT 15` (no pagination UI needed — this is a dashboard widget, not a full list)

```typescript
// Three parallel queries replace one full-fetch
const [statusCounts, nocBreakdown, recentApps] = await Promise.all([
  db.select({
    status: applications.status,
    count: sql<number>`cast(count(*) as int)`,
  }).from(applications).where(eq(applications.eventId, 'LA28')).groupBy(applications.status),

  db.select({
    nocCode: applications.nocCode,
    status: applications.status,
    count: sql<number>`cast(count(*) as int)`,
  }).from(applications)
    .where(eq(applications.eventId, 'LA28'))
    .groupBy(applications.nocCode, applications.status),

  db.select({ id: applications.id, /* ... */ })
    .from(applications)
    .innerJoin(organizations, eq(applications.organizationId, organizations.id))
    .where(eq(applications.eventId, 'LA28'))
    .orderBy(desc(applications.submittedAt))
    .limit(15),
]);
```

This drops the page's DB load from O(N_total_applications) to O(1) for stat cards, O(N_nocs) for the breakdown, and a fixed 15-row scan for recent apps.

### NOC Queue Changes

The NOC queue needs paginated rows with a parallel count-by-status for the tab bar.

```typescript
const PAGE_SIZE = 50;
const page = Math.max(1, parseInt(searchParams.page ?? '1', 10));
const offset = (page - 1) * PAGE_SIZE;
const activeFilter = searchParams.status ?? 'pending';

// Parallel: counts for all statuses (tab bar) + paginated rows for active tab
const [allCounts, rows, [{ total }]] = await Promise.all([
  db.select({
    status: applications.status,
    count: sql<number>`cast(count(*) as int)`,
  }).from(applications)
    .where(and(
      eq(applications.nocCode, session.nocCode),
      eq(applications.eventId, 'LA28'),
    ))
    .groupBy(applications.status),

  db.select({ ... })
    .from(applications)
    .innerJoin(organizations, eq(applications.organizationId, organizations.id))
    .where(and(
      eq(applications.nocCode, session.nocCode),
      eq(applications.status, activeFilter as ApplicationStatus),
      eq(applications.eventId, 'LA28'),
    ))
    .orderBy(desc(applications.submittedAt))
    .limit(PAGE_SIZE)
    .offset(offset),

  db.select({ total: sql<number>`cast(count(*) as int)` })
    .from(applications)
    .where(and(
      eq(applications.nocCode, session.nocCode),
      eq(applications.status, activeFilter as ApplicationStatus),
    )),
]);
```

Tab counts are derived from `allCounts` — same as before, no change to the tab bar UI.

### Pagination UI

Reuse `AuditTrailView.tsx`'s paginator (lines 133–157) — it's a standalone Previous/Next + "Page X of Y" component that takes `page`, `totalPages`, and a `pageHref()` function. Extract the paginator to a shared `src/components/Paginator.tsx` (or import from `AuditTrailView` directly if that's cleaner) and add it below both tables.

### DB Indexes

Add to a new migration:

```sql
-- Speed up NOC queue status filter
CREATE INDEX IF NOT EXISTS idx_applications_noc_status 
  ON applications (noc_code, status, submitted_at DESC);

-- Speed up IOC GROUP BY queries
CREATE INDEX IF NOT EXISTS idx_applications_event_status 
  ON applications (event_id, status);

CREATE INDEX IF NOT EXISTS idx_applications_event_noc_status 
  ON applications (event_id, noc_code, status);
```

These are additive — no data change, no downtime.

## Acceptance Criteria

- [ ] IOC dashboard page makes three small aggregate queries instead of one unbounded full-fetch
- [ ] "Recent Applications" on the IOC dashboard shows the 15 most recent (unchanged UX, fixed DB limit)
- [ ] NOC queue filters by `status` at the DB level, not in JavaScript
- [ ] Tab bar counts are correct for all statuses (derived from parallel GROUP BY query)
- [ ] NOC queue shows `PAGE_SIZE = 50` rows per page with Previous/Next pagination controls
- [ ] Pagination controls preserve the active `status` filter in the URL
- [ ] All three DB index migrations applied via `bun db:generate` + `bun db:migrate`
- [ ] No visible change to the UI beyond the addition of pagination controls on the NOC queue

## Files to Modify

| File | Change |
|---|---|
| `src/app/admin/ioc/page.tsx` | Replace single full-fetch with three parallel aggregate/limited queries |
| `src/app/admin/noc/queue/page.tsx` | Replace full-fetch + in-memory filter with parallel COUNT + paginated status query |
| `src/components/Paginator.tsx` | New — extracted pagination UI from AuditTrailView (or import directly) |
| `src/db/migrations/0015_pagination_indexes.sql` | New — three `CREATE INDEX IF NOT EXISTS` statements |

## Sources & References

- Canonical pagination pattern: `src/app/admin/ioc/audit/page.tsx:7` (LIMIT/OFFSET with parallel COUNT)
- Pagination UI: `src/components/AuditTrailView.tsx:133`
- `$dynamic()` + `and()` pattern: `src/app/api/export/eoi/route.ts:21`
- NOC queue target: `src/app/admin/noc/queue/page.tsx:20`
- IOC dashboard target: `src/app/admin/ioc/page.tsx:21`
- TODO-026: `TODOS.md:277`
