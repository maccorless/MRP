**Last updated: 10-Apr-2026 10:24**

# PRP v1 Implementation Plan — Sprint 1 (Apr 1–25, 2026)

**Status:** COMPLETE
**Last updated:** 2026-04-10
**Basis:** Design-to-code gap analysis + all resolved CONFIRM items as of 2026-03-30
**Source of truth:** `docs/PRP-design-confirmation.md`

> **Sprint 1 complete as of 2026-04-10.** All four critical fixes (CRIT-01–04) and all in-scope missing features (MISS-01–04, MISS-06) are shipped. See `docs/design-to-code-gap-analysis.md` for the full resolved-item list.
>
> Additional features shipped during Sprint 1 (beyond the original plan):
> - **IOC-Direct org management** (`/admin/ioc/direct`) — IOC adds major wire services that bypass the NOC EoI process; PbN allocations managed via same state machine as NOC submissions
> - **Applicant status page** (`/apply/status`) — applicants look up their application status by email; magic link delivered with 1-hour expiry (resolves TODO-018)
> - **EoI window toggle** (`/admin/noc/settings`) — NOC opens/closes their territory's application window
> - **Application reversals** — NOC can unapprove or unreturn; OCOG can reverse a PbN approval
> - **Security + WCAG hardening** — DB transactions, optimistic locking, atomic tokens, middleware guards, error boundaries, 17 WCAG accessibility fixes
> - **Audit trail upgrade** — full action log at `/admin/ioc/audit`
>
> Still deferred to v1.1: invited-org flow (MISS-05), anomaly detection (MISS-07), feature flags admin UI, EU data residency migration, ACR live integration (Gate 0 Jun 1).

---

## Starting State

Codebase at commit `de0b950` is a complete and correct EoI prototype. It handles the full applicant flow (email → verify → form → confirm), resubmission, and admin auth (HMAC session cookie). It does NOT yet have the correct category model, OCOG/IF roles, PbN, ENR, or quota management.

Four things in the existing code directly contradict the design and must be fixed before anything else is built on top.

---

## Week 1 — Fix Criticals + Foundation Schema (Apr 1–7)

### CRIT-01: Remove ENR from EoI applicant flow

**Files:** `src/db/schema.ts`, `src/app/apply/form/page.tsx`, `src/app/apply/actions.ts`

**Schema change:**
```sql
-- Remove 'enr' from accreditationCategoryEnum
-- Before: press | photographer | enr
-- After: handled by boolean flags (see CRIT-02)
```

**Form change:**
- Remove the ENR radio option from `/apply/form/page.tsx` (lines 230, 269)
- Remove any ENR filter/display in NOC dashboard that treats it as an EoI category

**Migration:**
- Any existing `enr` category applications → set `category_press = false`, `category_photo = false`, add note `"converted from legacy ENR category"` in `internal_notes`. These are invalid submissions; NOC can reject them.

---

### CRIT-02: Replace category enum with press + photo boolean flags

**Why:** One application can cover Press, Photo, or Both. The current single-enum model breaks this. The boolean flag model also makes PbN slot allocation cleaner — NOC assigns press slots and photo slots independently per org.

**Schema change:**
```sql
ALTER TABLE applications
  DROP COLUMN accreditation_category,
  ADD COLUMN category_press  boolean NOT NULL DEFAULT false,
  ADD COLUMN category_photo  boolean NOT NULL DEFAULT false;

-- Constraint: at least one must be true
ALTER TABLE applications
  ADD CONSTRAINT category_at_least_one
  CHECK (category_press = true OR category_photo = true);
```

**Migration of existing data:**
```sql
UPDATE applications SET category_press = true  WHERE accreditation_category = 'press';
UPDATE applications SET category_photo = true  WHERE accreditation_category = 'photographer';
-- (ENR rows handled by CRIT-01 migration above)
```

**Form change (`/apply/form/page.tsx`):**
- Replace single radio group with three chips: `Press` / `Photo` / `Both`
- `Both` chip sets both flags to true on submit
- Display in NOC dashboard: show `Press`, `Photo`, or `Press + Photo`

**Naming:** Rename `photographer` → `photo` throughout all display strings (not a schema rename — the column becomes `category_photo`, so naming is already clean).

---

### CRIT-03: Add OCOG and IF roles

**Files:** `src/lib/session.ts`, `src/db/schema.ts` (adminUsers table), `src/lib/admin-auth.ts`

**Session type change:**
```typescript
// src/lib/session.ts
type AdminRole = 'noc_admin' | 'ioc_admin' | 'ioc_readonly' | 'ocog_admin' | 'if_admin';
```

**Schema change:**
```sql
ALTER TABLE admin_users
  DROP CONSTRAINT admin_users_role_check,  -- or equivalent enum constraint
  ADD CONSTRAINT admin_users_role_check
    CHECK (role IN ('noc_admin', 'ioc_admin', 'ioc_readonly', 'ocog_admin', 'if_admin'));

-- IF admins need a body code (analogous to noc_code for NOC admins)
ALTER TABLE admin_users
  ADD COLUMN if_code text;  -- null for noc/ioc/ocog admins
-- noc_code already exists; if_code added for IF admins
```

**Auth helpers to add (`src/lib/session.ts`):**
```typescript
export async function requireOcogSession(): Promise<AdminSession>
export async function requireIfSession(): Promise<AdminSession>
```

**Seed data:** Add one test account per new role in `src/db/seed.ts`:
- `ocog@test.la28.org` / role: `ocog_admin`
- `if@test.la28.org` / role: `if_admin`, if_code: `ATH` (Athletics)

---

### CRIT-04: Hide multi-territory flag from all UI surfaces

**Files:** `src/app/apply/actions.ts` (line 163), any admin dashboard rendering

**Change:** The `isMultiTerritoryFlag` column stays in schema (cheap to keep, expensive to add back). Remove it from:
1. Any NOC dashboard table/filter that displays it
2. Any IOC dashboard that shows it as a dedup signal
3. Log it to `audit_log` when it fires (invisible to UI, useful for future Open Question #16 analysis)

---

### MISS-04: Add event_id and org status to schema

**Why:** Must be in before any new tables are created. Adding after the fact requires migrating every table. Default `'LA28'` means zero code changes needed for current queries.

**Migration:**
```sql
-- Organizations
ALTER TABLE organizations
  ADD COLUMN event_id text NOT NULL DEFAULT 'LA28',
  ADD COLUMN status   text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'banned', 'pending_review'));

-- Applications
ALTER TABLE applications
  ADD COLUMN event_id text NOT NULL DEFAULT 'LA28';

-- All new tables created in Week 2 include event_id from creation
```

**Drizzle schema (`src/db/schema.ts`):** Add `eventId: text('event_id').notNull().default('LA28')` to `organizations` and `applications` tables.

---

## Week 2 — Core Schemas + Adapters + IOC Quota Screen (Apr 8–14)

### New schema tables

Add to `src/db/schema.ts`:

```typescript
// NOC quota totals (set by IOC via import or in-app edit)
export const nocQuotas = pgTable('noc_quotas', {
  id:          uuid('id').defaultRandom().primaryKey(),
  nocCode:     text('noc_code').notNull(),
  eventId:     text('event_id').notNull().default('LA28'),
  pressTotal:  integer('press_total').notNull().default(0),
  photoTotal:  integer('photo_total').notNull().default(0),
  setBy:       text('set_by'),          // IOC admin user id
  setAt:       timestamp('set_at').defaultNow(),
  notes:       text('notes'),
});

// Per-org slot allocations (set by NOC, approved by OCOG)
export const orgSlotAllocations = pgTable('org_slot_allocations', {
  id:             uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull(),
  nocCode:        text('noc_code').notNull(),
  eventId:        text('event_id').notNull().default('LA28'),
  pressSlots:     integer('press_slots').notNull().default(0),
  photoSlots:     integer('photo_slots').notNull().default(0),
  allocatedBy:    text('allocated_by'),
  allocatedAt:    timestamp('allocated_at').defaultNow(),
  pbnState:       text('pbn_state').notNull().default('draft')
                  // 'draft' | 'noc_submitted' | 'ocog_approved'
                  // CHECK constraint on these values
  ocogReviewedBy: text('ocog_reviewed_by'),
  ocogReviewedAt: timestamp('ocog_reviewed_at'),
});

// Quota change audit log (covers both imports and manual edits)
export const quotaChanges = pgTable('quota_changes', {
  id:           uuid('id').defaultRandom().primaryKey(),
  nocCode:      text('noc_code').notNull(),
  eventId:      text('event_id').notNull().default('LA28'),
  quotaType:    text('quota_type').notNull(), // 'press' | 'photo'
  oldValue:     integer('old_value').notNull(),
  newValue:     integer('new_value').notNull(),
  changedBy:    text('changed_by').notNull(),
  changedAt:    timestamp('changed_at').defaultNow(),
  changeSource: text('change_source').notNull(), // 'import' | 'manual_edit'
});

// ENR holdback pool per NOC (set by IOC as grants accumulate)
export const enrQuotas = pgTable('enr_quotas', {
  id:          uuid('id').defaultRandom().primaryKey(),
  nocCode:     text('noc_code').notNull(),
  eventId:     text('event_id').notNull().default('LA28'),
  enrTotal:    integer('enr_total').notNull().default(0),
  grantedBy:   text('granted_by'),
  grantedAt:   timestamp('granted_at').defaultNow(),
});

// ENR request list (NOC submits, IOC decides per org)
export const enrRequests = pgTable('enr_requests', {
  id:             uuid('id').defaultRandom().primaryKey(),
  nocCode:        text('noc_code').notNull(),
  eventId:        text('event_id').notNull().default('LA28'),
  organizationId: uuid('organization_id').notNull(),
  priorityRank:   integer('priority_rank').notNull(),
  slotsRequested: integer('slots_requested').notNull(),
  slotsGranted:   integer('slots_granted'),   // null until IOC decides
  decision:       text('decision'),           // 'granted' | 'partial' | 'denied' | null
  decisionNotes:  text('decision_notes'),
  reviewedBy:     text('reviewed_by'),
  reviewedAt:     timestamp('reviewed_at'),
  submittedAt:    timestamp('submitted_at').defaultNow(),
});
```

**Generate and run migration:** `bun drizzle-kit generate && bun drizzle-kit migrate`

---

### ACR Adapter (CONFIRM-06)

**New files:**

`src/lib/acr/adapter.ts`:
```typescript
export interface OrgExportRecord {
  org_id:                  string;
  org_name:                string;
  org_country:             string;
  org_type:                string;
  noc_code:                string;
  press_slots_allocated:   number;
  photo_slots_allocated:   number;
  enr_slots_allocated:     number;
  pbn_state:               'ocog_approved';
  common_code:             string | null;
  games_edition:           string;  // 'LA28'
}

export interface AcrAdapter {
  fetchQuota(nocId: string, eventId: string): Promise<{ press: number; photo: number }>;
  pushOrgData(orgs: OrgExportRecord[], eventId: string): Promise<{ success: boolean; errors: string[] }>;
  getOrgCodes(eventId: string): Promise<Record<string, string>>;  // orgId → commonCode
}
```

`src/lib/acr/stub-client.ts`:
```typescript
export class AcrStubClient implements AcrAdapter {
  // Returns realistic fixture data. Adjust when real contract arrives.
  async fetchQuota(nocId, eventId) { ... }
  async pushOrgData(orgs, eventId) { console.log('[ACR STUB] pushOrgData', orgs.length, 'orgs'); return { success: true, errors: [] }; }
  async getOrgCodes(eventId) { return {}; }
}
```

`src/lib/acr/index.ts` — exports the active adapter (stub in dev, real in prod when env var set).

---

### IOC Quota Screen (MISS-03)

**Route:** `src/app/admin/ioc/quotas/page.tsx`

**Features:**
1. Import card — "Re-import from Excel" button triggers xlsx parse → upsert `noc_quotas` → write `quota_changes` rows with `change_source: 'import'`
2. Stats row — Total Press, Total Photo, NOCs Set, Missing, Manual Edits
3. Edit mode toggle — "✎ Edit Quotas" button activates inline inputs; Save writes individual `quota_changes` rows with `change_source: 'manual_edit'`
4. Table — NOC name, press quota (editable), Paris 2024 press (from fixture data), photo quota (editable), Paris 2024 photo, status badge (Set/Missing/Press only), last modified
5. Filter tabs — All / Missing Quota / Edited Since Import
6. Export CSV button

**Server actions needed:**
```typescript
// src/app/admin/ioc/quotas/actions.ts
async function importQuotasFromExcel(formData: FormData): Promise<void>
async function updateNocQuota(nocCode: string, pressTotal: number, photoTotal: number): Promise<void>
```

**Fixture data (`src/db/seed.ts`):** Seed `noc_quotas` with Paris 2024 comparison values using a tier model:
- Tier 1 (USA/GBR/GER/FRA/JPN/AUS/CAN/ITA): press 80–150, photo 25–50
- Tier 2 (30–80 NOCs): press 30–80, photo 10–25
- Tier 3 (remaining ~100 NOCs): press 5–30, photo 2–10

---

## Week 3 — PbN Workflow (Apr 15–21)

### NOC PbN Screen (MISS-01)

**Route:** `src/app/admin/noc/pbn/page.tsx`

**Features:**
1. Quota header — "Press: 12 of 50 allocated · Photo: 8 of 20 allocated" (or "not yet assigned" if no quota set)
2. Table of EoI-approved orgs for this NOC — org name, category (Press/Photo/Both), press slots input, photo slots input, current state
3. Save allocation per org (draft state)
4. "Submit to OCOG" button — moves all draft allocations to `noc_submitted`
5. State bar at top showing current PbN state (Draft / Submitted / OCOG Approved / Sent to ACR)
6. After OCOG approves: show OCOG-approved state with any adjustments highlighted

**Guard:** NOC cannot allocate more press slots than `noc_quotas.press_total` across all orgs. Same for photo. Over-quota attempt is a client-side validation + server-side check.

**Server actions:**
```typescript
async function saveSlotAllocation(orgId: string, pressSlots: number, photoSlots: number): Promise<void>
async function submitPbnToOcog(nocCode: string, eventId: string): Promise<void>
```

---

### OCOG PbN Approval Screen (MISS-01)

**Route:** `src/app/admin/ocog/pbn/page.tsx`

**Features:**
1. NOC list — all NOCs, filterable by state (All / Submitted / Approved / Not Started)
2. Drill into a NOC → see their full allocation table
3. Approve as-is or adjust individual org allocations
4. "Approve" action → all allocations move to `ocog_approved`, NOC notified
5. ACR export button → calls `acrAdapter.pushOrgData()` with all `ocog_approved` orgs → NOC notified

**Server actions:**
```typescript
async function ocogApprovePbn(nocCode: string, eventId: string, adjustments?: Record<string, { press: number; photo: number }>): Promise<void>
async function sendToAcr(nocCode: string, eventId: string): Promise<void>
```

**NOC notifications (both in-app + email):**
- On OCOG approval: "Your PbN allocation has been approved [+ any adjustments listed]"
- On ACR send: "Your allocation has been sent to ACR — [N] orgs, [X] press slots, [Y] photo slots"

---

### IOC PbN Visibility

**Route:** `src/app/admin/ioc/page.tsx` (existing IOC dashboard)

Add a PbN summary tab/section: NOC-level summary showing each NOC's PbN state. Read-only — no IOC actions. Visible after quota is set and any NOC has submitted.

---

## Week 4 — ENR Workflow (Apr 22–25)

### NOC ENR Request Screen (MISS-02)

**Route:** `src/app/admin/noc/enr/page.tsx`

**Features:**
1. Add ENR org to list — search/add from existing org records or create new
2. Priority rank input (drag-to-reorder or manual rank number)
3. Slots requested per org
4. Submit list to IOC action (locks the list)
5. After IOC decision: show per-org grant/partial/deny with slot count

**Server actions:**
```typescript
async function addEnrOrg(nocCode: string, orgId: string, slotsRequested: number): Promise<void>
async function reorderEnrList(nocCode: string, orderedOrgIds: string[]): Promise<void>
async function submitEnrToIoc(nocCode: string, eventId: string): Promise<void>
```

---

### IOC ENR Review Screen (MISS-02)

**Route:** `src/app/admin/ioc/enr/page.tsx`

**Features:**
1. Holdback pool banner — total holdback, granted so far, remaining, NOCs awaiting decision
2. NOC list table — All / Awaiting Decision / Decided / Not Submitted
3. Drill into a NOC → see their prioritised ENR list
4. Per-org decision: Granted / Partial grant / Denied + slot count input for granted/partial
5. Save decisions per NOC

**Server actions:**
```typescript
async function grantEnrAllocation(nocCode: string, orgId: string, decision: 'granted' | 'partial' | 'denied', slotsGranted: number): Promise<void>
async function submitEnrDecisions(nocCode: string, eventId: string): Promise<void>
```

---

## Hardening Checklist (Apr 22–25, parallel to ENR)

- [ ] All new routes behind correct role guards (`requireOcogSession`, `requireIocSession`, etc.)
- [ ] Quota over-allocation check is enforced server-side (not just client-side)
- [ ] `pbn_state` transitions are enforced — can't go backward, can't skip states
- [ ] `enr_requests.decision` transitions enforced similarly
- [ ] All server actions write to `audit_log` (actor, action, target, timestamp)
- [ ] NOC can only see own `noc_code` data (zero cross-NOC leakage at data layer)
- [ ] OCOG can see all NOCs but cannot see IOC-only data (quota raw import files)
- [ ] Vitest unit tests for: quota over-allocation guard, state machine transitions, AcrStubClient
- [ ] Playwright E2E tests for: PbN full flow (NOC allocates → OCOG approves → ACR send), ENR full flow (NOC submits → IOC grants)

---

## File Map — New Files to Create

```
src/
  db/
    schema.ts                    -- UPDATE (CRIT-01, CRIT-02, CRIT-03, MISS-04, Week 2 tables)
    seed.ts                      -- UPDATE (new roles, quota fixture data)
    migrations/
      YYYYMMDD_v1_foundation.sql -- Week 1 migration (event_id, flags, roles)
      YYYYMMDD_v1_pbn_enr.sql    -- Week 2 migration (noc_quotas, allocations, enr tables)

  lib/
    session.ts                   -- UPDATE (add ocog_admin, if_admin roles)
    acr/
      adapter.ts                 -- NEW (AcrAdapter interface + OrgExportRecord type)
      stub-client.ts             -- NEW (AcrStubClient)
      index.ts                   -- NEW (exports active adapter based on env)

  app/
    apply/
      form/
        page.tsx                 -- UPDATE (CRIT-01: remove ENR, CRIT-02: Press/Photo/Both chips)
      actions.ts                 -- UPDATE (CRIT-02: write boolean flags, CRIT-04: hide multi-territory)

    admin/
      noc/
        page.tsx                 -- UPDATE (CRIT-02: show Press/Photo/Both in table)
        pbn/
          page.tsx               -- NEW (NOC PbN allocation screen)
          actions.ts             -- NEW (saveSlotAllocation, submitPbnToOcog)
        enr/
          page.tsx               -- NEW (NOC ENR request screen)
          actions.ts             -- NEW (addEnrOrg, reorderEnrList, submitEnrToIoc)

      ocog/
        pbn/
          page.tsx               -- NEW (OCOG PbN approval screen)
          actions.ts             -- NEW (ocogApprovePbn, sendToAcr)

      ioc/
        page.tsx                 -- UPDATE (add PbN summary tab)
        quotas/
          page.tsx               -- NEW (IOC Quota import + edit screen)
          actions.ts             -- NEW (importQuotasFromExcel, updateNocQuota)
        enr/
          page.tsx               -- NEW (IOC ENR review screen)
          actions.ts             -- NEW (grantEnrAllocation, submitEnrDecisions)
```

---

## Wireframe Reference

| Screen | Wireframe file |
|--------|---------------|
| NOC PbN allocation | `docs/designs/pbn-assignment.html` |
| OCOG PbN approval | `docs/designs/ocog-quota-approval.html` |
| NOC ENR request | `docs/designs/enr-request.html` |
| IOC ENR review | `docs/designs/ioc-enr-review.html` |
| IOC Quota management | `docs/designs/ioc-quotas.html` |
| NOC dashboard (EoI) | `docs/designs/noc-dashboard.html` |

---

## Dependencies and Blockers

| Item | Status | Blocks |
|------|--------|--------|
| Drizzle migrations for Week 1 | Unblocked — do first | Everything else |
| Drizzle migrations for Week 2 | Depends on Week 1 | PbN, ENR, quota screens |
| OCOG role in auth (CRIT-03) | Unblocked | OCOG PbN screen |
| Quota fixture seed data | Unblocked | IOC quota screen, PbN quota header |
| ACR stub client | Unblocked | OCOG "Send to ACR" action |
| IOC form field list (TODO-003) | Pending IOC OIS | Final EoI form fields only |
| ACR API contract (TODO-002) | Pending — Gate 0 Jun 1 | Real ACR integration (v1.1 only) |

---

## Out of Scope for This Sprint

These are in the backlog but not Sprint 1:

- **MISS-05** Invited-org flow (`/invite/[token]`) — v1.1
- **MISS-06** Applicant status check page — P2
- **MISS-07** Anomaly detection (concentration risk, NOC inactivity) — P2
- **TODO-018** Applicant status page — P2
- **TODO-021** ENRS ranking + high-demand event lead fields — needs IOC OIS field confirmation
- EU infrastructure migration — v1 production deploy, not Sprint 1
