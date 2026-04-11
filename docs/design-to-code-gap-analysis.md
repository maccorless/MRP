# MRP Design-to-Code Gap Analysis
**Date:** 2026-03-30 — **Updated:** 2026-04-10 (post Sprint 1)
**Scope:** All updated design docs vs. codebase as of commit de0b950

---

## Sprint 1 Status (as of 2026-04-10)

**All CRITICAL items resolved. All in-scope MISSING items built.**

| Item | Status |
|------|--------|
| CRIT-01: ENR removed from EoI | ✓ Resolved |
| CRIT-02: Press/Photo/Both category flags | ✓ Resolved |
| CRIT-03: OCOG + IF roles | ✓ Resolved |
| CRIT-04: Multi-territory flag hidden from UI | ✓ Resolved |
| MISS-01: PbN workflow | ✓ Built |
| MISS-02: ENR workflow | ✓ Built |
| MISS-03: IOC Quota management screen | ✓ Built |
| MISS-04: event_id + org status in schema | ✓ Built |
| MISS-05: Invited-org flow | Deferred → v1.1 |
| MISS-06: Applicant status page | ✓ Built (`/apply/status`) |
| MISS-07: Anomaly detection | Deferred → v1.1 |

Additional features shipped beyond original plan: IOC-Direct org management, application reversals (unapprove/unreturn/OCOG reversal), EoI window toggle, security + WCAG hardening, audit trail upgrade.

Feature flags admin UI (`/admin/ioc/flags`) is documented in `docs/feature-flags.md` but not yet built — deferred to v1.1.

---

## Summary (original — 2026-03-30)

The codebase at commit de0b950 was a complete and correct v0.1 EoI prototype. The gaps below were not bugs in what was built — they were places where the design evolved (especially from the IOC stakeholder interview 2026-03-30) and the code predated those decisions, plus the full v1 build (PbN, ENR, OCOG, quota management) that hadn't started yet.

Three categories:
- **CRITICAL** — Code does something the design explicitly prohibits. Needs a fix before building on top.
- **MISSING** — Feature in v1 scope that doesn't exist yet. Expected; needs a sprint.
- **CONFIRM** — Open question that needs a decision before coding can start.

---

## CRITICAL — All resolved in Sprint 1

### CRIT-01: ENR is an EoI application category in the code ✓ RESOLVED

**Where:** `src/db/schema.ts` lines 20–23, `src/app/apply/form/page.tsx` lines 230 and 269

**What the code does:**
- `accreditationCategoryEnum` includes `"enr"` as a valid value
- The EoI form shows "ENR (Non-Rights Broadcaster)" as a radio option for applicants

**What the design says (as of 2026-03-30):**
> "ENR is NOT a category in the EoI application form. Media orgs do not self-apply as ENR. The NOC submits a prioritised ENR list on their behalf."

**Impact:** If this ships as-is, the EoI form allows ENR self-nomination — directly contradicting the process model. Everything downstream (NOC queue, exports, PbN allocation) will receive ENR applications that shouldn't exist.

**Required fix:**
1. Remove `"enr"` from `accreditationCategoryEnum` in schema
2. Remove ENR radio option from `/apply/form/page.tsx`
3. Write migration to change any existing ENR applications to a clean state (likely: convert to `pending` with a flag for manual review, or reject with a note)
4. Verify no UI filter/display code hardcodes the ENR category for applicants

---

### CRIT-02: No "Both" category — schema only supports press OR photographer ✓ RESOLVED

**Where:** `src/db/schema.ts` lines 20–23

**What the code does:**
- `accreditationCategoryEnum` has three values: `press | photographer | enr`
- One application = one category (the enum is a single column)

**What the design says:**
> "The EoI form has three category options: Press / Photo / Both. Both = one application with two flags — not two separate applications."

**Impact:** An org that covers both press and photography cannot express that in one application. They'd need to submit twice (which triggers the dedup logic as a duplicate). The NOC dashboard and PbN allocation screen both need to know which orgs applied for both.

**Required fix:**
1. Change schema: either (a) replace enum with two boolean columns `category_press: boolean`, `category_photo: boolean`, or (b) add `"both"` as an enum value and treat it as equivalent to press+photo flags
   - Option (a) is cleaner for PbN — NOC can allocate press slots and photo slots independently with one org record
   - Recommend option (a): `category_press boolean NOT NULL default false`, `category_photo boolean NOT NULL default false`, constraint that at least one must be true
2. Update `/apply/form/page.tsx` UI to show three chips: Press / Photo / Both (Both sets both flags)
3. Update NOC dashboard and application detail views to show "Press", "Photo", or "Press + Photo"
4. Rename `photographer` → `photo` for consistency with design doc language throughout

**Side note on naming:** The code uses `photographer` but the design doc consistently says `photo` (matching IOC usage — the category is for the organization, not a job title). Rename throughout.

---

### CRIT-03: OCOG role is completely absent ✓ RESOLVED

**Where:** `src/lib/session.ts` line 13, `src/db/schema.ts` (adminUsers table), all admin routes

**What the code does:**
- Three roles: `noc_admin`, `ioc_admin`, `ioc_readonly`
- No OCOG concept anywhere

**What the design says:**
> "IOC and OCOG are distinct roles — different logins, different permission sets, different primary workflows."
> OCOG owns formal PbN approval. OCOG has cross-NOC access. OCOG's primary screen is `/admin/ocog/pbn`.

**Impact:** When PbN is built, there's no way to implement "OCOG approves NOC submissions" without first adding the OCOG role. Starting PbN work without this role in place means building on a broken foundation.

**Required fix:**
1. Add `"ocog_admin"` to the role enum / comment in `session.ts`
2. Add `"ocog_admin"` as a valid role in the `adminUsers` table (or at minimum in the seed data and session type)
3. Add `requireOcogSession()` helper in `session.ts` (mirrors the existing `requireNocSession` / `requireIocSession` pattern)
4. Add OCOG to the prototype seed data so the role can be tested

---

### CRIT-04: Cross-NOC dedup (multi-territory flag) conflicts with updated design decision ✓ RESOLVED

**Where:** `src/app/apply/actions.ts` line 163 — `isMultiTerritoryFlag: isMultiTerritory`

**What the code does:**
- When an org's email domain appears under multiple NOC codes, sets `isMultiTerritoryFlag = true` on the organization record
- This flag surfaces in the IOC org directory

**What the design now says (2026-03-30):**
> "Cross-NOC dedup provisionally eliminated for v1. Open question #16: What (if anything) should be flagged to IOC or OCOG?"

**Impact:** The code is doing something the design has provisionally removed, and the flag raises a question we don't have an answer to yet. The logic itself won't break anything, but we're building UI/reporting on a concept that may be removed entirely.

**Required fix (provisional — hold until Open Question #16 resolved):**
1. Keep the flag column in schema (cheap to keep, expensive to add back if we want it)
2. Remove any UI surfaces that display the multi-territory flag to admins (prevents building workflows on something unconfirmed)
3. Log a note in the audit trail when the flag fires (invisible to UI, useful for the Open Question analysis)
4. Revisit when IOC OIS answers Open Question #16

---

## MISSING — Sprint 1 results

Items marked ✓ were built during Sprint 1 (Apr 1–25, 2026). Items marked Deferred remain in backlog.

### MISS-01: No PbN workflow ✓ BUILT

**Missing components:**
- `/admin/noc/pbn` route + NOC PbN allocation screen (wireframe: `pbn-assignment.html`)
- `/admin/ocog/pbn` route + OCOG approval screen (wireframe: `ocog-quota-approval.html`)
- Schema tables: `noc_quotas`, `org_slot_allocations`, `quota_changes` (defined in design doc data model section)
- Server actions: `allocatePressPhotoSlots`, `submitPbnToOcog`, `ocogApprovePbn`, `ocogAdjustPbn`
- State machine: Draft → NOC Submitted → OCOG Approved → Sent to ACR
- NOC notification on OCOG approval (in-app + email)
- NOC notification on ACR send
- Quota header on NOC PbN screen: "Before IOC sets totals: not yet assigned" / "After: X of Y allocated"
- IOC read-only PbN visibility (NOC PbN state visible from IOC dashboard)

**Sequencing note:** Requires CRIT-03 (OCOG role) first, and CRIT-02 (category flags) to correctly show which orgs are press-eligible vs. photo-eligible.

---

### MISS-02: No ENR workflow ✓ BUILT

**Missing components:**
- `/admin/noc/enr` route + NOC ENR Request Submission screen (wireframe: `enr-request.html`)
- `/admin/ioc/enr` route + IOC ENR Review screen (wireframe: `ioc-enr-review.html`)
- Schema tables: `enr_quotas`, `enr_requests` (defined in design doc data model section)
- Server actions: `addEnrOrgToList`, `reorderEnrList`, `submitEnrListToIoc`, `grantEnrAllocation`, `denyEnrAllocation`
- ENR holdback pool tracking (IOC-managed)
- NOC prioritised-list drag-to-reorder UI
- IOC grant/partial/deny per org decision

**Sequencing note:** Does NOT depend on PbN. Can be built in parallel to PbN. Does depend on CRIT-01 (removing ENR from EoI category) being done first so ENR orgs are only ever created via the ENR workflow.

---

### MISS-03: No quota management screen (IOC) ✓ BUILT

**Missing components:**
- `/admin/ioc/quotas` route + IOC Quota Import/Edit screen (wireframe: `ioc-quotas.html`)
- Excel import handler (parse xlsx, write to `noc_quotas` table, validate NOC codes)
- Editable quota table (press + photo per NOC)
- Audit trail for quota changes (`quota_changes` table)
- Prior Games comparison column (requires CONFIRM-01 for source data)

**Sequencing note:** Must be built before PbN can be tested end-to-end. IOC must set quotas before NOC can allocate.

---

### MISS-04: Games-to-Games org persistence not in schema ✓ BUILT

**What the design doc specifies:**
```
Organization
  id: uuid (stable across Games)
  games_editions: [edition_id]
  event_id scoping on all tables
```

**What the code has:**
- `organizations` table has no `event_id` scope
- No `games_editions` concept
- No `status` enum (active | inactive | banned | pending_review)

**Impact:** When LA30 is built, there's no clean way to carry org records forward. The design doc says "adding future events is a data operation, not a code change" — but the current schema doesn't support that.

**Required fix (Sprint 1 Week 1 — CONFIRM-03 resolved, this is v1/v0.1 scope):**
1. Add `event_id text NOT NULL default 'LA28'` to `organizations`, `applications`, and all new tables (quotas, ENR, allocations)
2. Add `status` enum to `organizations` (active | inactive | banned | pending_review)
3. Must be added before PbN/ENR schemas are built — migration after is painful

---

### MISS-05: No invited-org flow — DEFERRED to v1.1

**What the design says:** NOCs can invite known organisations. Invited orgs get a pre-addressed link that pre-fills their details. Wireframe: `invited-org-landing.html`.

**What's missing:**
- No `invitations` table (token, noc_code, pre-fill data, expiry)
- No `/invite/[token]` route
- No "Invite Org" action from the NOC dashboard

**Sequencing note:** Lower priority than PbN/ENR. Can be v1.1.

---

### MISS-06: No applicant status check page ✓ BUILT

Applicants can't look up their application status by reference number + email. Tracked in TODOS.md as P2. Wireframe: `applicant-resubmit.html` shows the resubmission flow but not a standalone status lookup.

---

### MISS-07: Anomaly detection not implemented — DEFERRED to v1.1

The IOC dashboard wireframe shows anomaly banners (concentration risk, cross-NOC duplicates). No detection logic exists. Related design doc section: "IOC Anomaly Detection — concentration risk, cross-NOC duplication, NOC inactivity."

Thresholds confirmed (Decision #18): 7-day NOC inactivity, >30% quota concentration. But cross-NOC detection is pending Open Question #16.

---

## CONFIRM — All resolved 2026-03-30

### CONFIRM-01: Prior Games quota comparison data ✓ RESOLVED

**Decision:** Real data (Paris 2024 / Tokyo 2020) will be loaded when IOC OIS provides source files. For Sprint 1, generate realistic test fixture data per NOC using a tier model (USA/UK/GER/FRA = 80-150 press / 25-50 photo; mid-tier = 30-80 / 10-25; small = 5-30 / 2-10). Real data import replaces fixture data when available (June 2026).

**Impact on coding:** Build quota screen and `noc_quotas` table with a `prior_press` / `prior_photo` column. Seed fixture data in Sprint 2. Real import path is the same as the regular quota import, filtered by edition type.

---

### CONFIRM-02: IFs — same model as NOCs? ✓ RESOLVED

**Decision:** IFs use the same role and workflow as NOC admins. Key distinction: IFs have no public EoI queue — they bring orgs in via invited-org flow only.

**Impact on coding:** No separate IF table needed. Add `if_admin` to the role enum. The NOC dashboard route is reused for IFs (same component, role check gates which queue is shown). `adminUsers` needs an `if_code` field (analogous to `noc_code`) to scope IF access to their federation's orgs.

---

### CONFIRM-03: Games-to-Games persistence — v1 or v1.1? ✓ RESOLVED

**Decision:** `event_id` is v1 scope — meaning it's in scope now (v0.1 and v1 are the same build sprint). Add `event_id text NOT NULL default 'LA28'` to all tables before any real data is entered. The `organizations.status` enum is also v1 scope. Both go in Sprint 1 Week 1.

**Impact on coding:** MISS-04 moves from "deferred" to Sprint 1 Week 1 — must be added before PbN/ENR schemas are built (adding it later is a painful migration). See updated sequencing below.

---

### CONFIRM-04: Can IOC adjust NOC quota totals after initial import? ✓ RESOLVED

**Decision:** Yes, for v0.1. The quota table is both importable and editable in-app. IOC can toggle edit mode to adjust individual NOC press/photo totals directly, and can re-import the full Excel file. Both mechanisms write to the same `quota_changes` audit table.

**Impact on coding:** Keep the "Edit Quotas" toggle and edit mode in `ioc-quotas.html`. Keep `quota_changes` audit table — add `change_source` column to distinguish 'import' vs 'manual_edit' rows. The quota screen has both a "Re-import from Excel" button and an "Edit Quotas" toggle.

---

### CONFIRM-05: ENR partial allocation — all-or-nothing or per-org? ✓ RESOLVED

**Decision:** Per-org partial allocation. NOC submits a prioritised list; IOC approves some percentage of the requested orgs. Each org gets: Granted / Partial grant / Denied — with an explicit slot count for Granted and Partial grant decisions.

**Impact on coding:** `enr_requests` table needs `slots_requested integer`, `slots_granted integer`, `decision enum(granted|partial|denied)`, `decision_notes text`. The IOC ENR Review wireframe (`ioc-enr-review.html`) correctly reflects this model — keep the per-org grant inputs as built.

---

### CONFIRM-06: ACR integration gate and schema ✓ RESOLVED

**Decision:** Build `AcrStubClient` now against the design-doc-defined `OrgExportRecord` interface. Don't wait for ACR API contract. Stub is built from our spec and adjusted when the real contract arrives. Gate 0 formal sign-off still required before v1.1 live integration, but Sprint 1 can proceed.

**The final PbN output format:**
```
OrgExportRecord {
  org_id, org_name, org_country, org_type,
  noc_code,
  press_slots_allocated: integer,
  photo_slots_allocated: integer,
  enr_slots_allocated: integer,
  pbn_state: 'ocog_approved',
  common_code: string | null,
  games_edition: 'LA28'
}
```

**Sprint 1 action:** Build `src/lib/acr/adapter.ts` (interface) + `src/lib/acr/stub-client.ts` (stub) in Week 2.

---

### CONFIRM-07: GDPR / EU data residency ✓ RESOLVED

**Decision:** v0.1 runs on US Railway infrastructure with test data only — no personal data of EU-based individuals. v1 production will be on D.TEC/DGP EU infrastructure (same as rest of D.TEC stack). No v0.1 blocker; formal legal sign-off on D.TEC/DGP EU infrastructure needed before v1 production launch.

**Impact on coding:** No immediate change needed. `DATABASE_URL` stays Railway for now. v1 deployment config will point to EU DGP.

---

## Implementation Sequencing

Given the above, the recommended order for the v1 build sprint (April 1–25):

```
WEEK 1 (Apr 1–7): Fix criticals + foundation
  ├── CRIT-01: Remove ENR from EoI category enum + form
  ├── CRIT-02: Add Both support (press + photo boolean flags; rename photographer→photo)
  ├── CRIT-03: Add OCOG + IF roles to auth (ocog_admin, if_admin)
  ├── CRIT-04: Remove multi-territory UI surfaces (keep flag column, hide from all views)
  └── MISS-04: Add event_id + org status to schema [moved up — CONFIRM-03 resolved]
              event_id goes on organizations, applications, and all new tables

WEEK 2 (Apr 8–14): Core schemas + adapters
  ├── Add PbN schema tables (noc_quotas, org_slot_allocations, quota_changes)
  │     quota_changes covers both import events and manual edits;
  │     add change_source: 'import' | 'manual_edit' to distinguish
  ├── Add ENR schema tables (enr_quotas, enr_requests with slots_requested/granted/decision)
  ├── Build AcrAdapter interface + AcrStubClient [CONFIRM-06 resolved]
  ├── Build IOC Quota screen (MISS-03) — import + edit mode, audit trail [CONFIRM-04]
  └── Seed fixture quota data with Paris 2024 comparison values [CONFIRM-01]

WEEK 3 (Apr 15–21): PbN workflow
  ├── NOC PbN allocation screen (MISS-01)
  ├── OCOG PbN approval screen (MISS-01)
  └── State machine + NOC notifications (approval + ACR send)

WEEK 4 (Apr 22–25): ENR workflow + integration
  ├── NOC ENR request screen (MISS-02)
  ├── IOC ENR review screen (MISS-02) — per-org grant/partial/deny [CONFIRM-05]
  └── Hardening + UAT prep

DEFERRED to v1.1:
  └── MISS-05: Invited-org flow
  └── MISS-06: Applicant status page
  └── MISS-07: Anomaly detection
  └── ACR real-time sync (pending Gate 0 contract, Jun 1 go/no-go)
  └── EU data residency migration Railway → D.TEC/DGP [CONFIRM-07]
```

---

## TODOS.md Updates Needed

The following TODOS.md items can be marked resolved based on the 2026-03-30 stakeholder interview and design decisions:

| TODO | Old status | New status | Reason |
|------|-----------|-----------|--------|
| TODO-012 | P3 (Resolved) | ✓ Already resolved | Flat org model confirmed |
| TODO-019 | P2 Open | → RESOLVED | Press/photo separate tracking confirmed; OCOG owns PbN approval confirmed |
| TODO-023 | P2 Open | → MOSTLY RESOLVED | ENR process model confirmed (NOC nominates, IOC grants from holdback, no self-nomination); partial allocation (CONFIRM-05) still open |

The following TODOS.md items were previously unclear but now have clearer status:

| TODO | Note |
|------|------|
| TODO-014 (dedup business rules) | Cross-NOC dedup provisionally eliminated (CRIT-04) — update TODO to reflect |
| TODO-015 (dedup flag resolution) | Deferred pending Open Question #16 resolution |
| TODO-016 (MRP vs. ACR PbN boundary) | Resolved: PbN lives in MRP; ACR integration via adapter |
| TODO-017 (Common Codes trigger) | Still open — no decision on API call vs. manual vs. queue |
