# LA28 Media Registration Portal — Design Confirmation

**Status:** ACTIVE
**Last updated:** 2026-03-30
**Covers:** v0.1 prototype through v1 launch (August 2026) and v1.1 (October 2026)

---

## Glossary

| Term | Definition |
|------|------------|
| **EoI** | Expression of Interest — public-facing form where media orgs apply to their NOC for press accreditation consideration |
| **ENR** | Extended Non-Rights Broadcaster — broadcasters without Olympic media rights. ENR requests are submitted by the NOC to the IOC (not by media orgs directly) |
| **PbN** | Press by Number — the phase where NOCs formally allocate their IOC-assigned press/photo quotas to specific media organisations, subject to OCOG approval |
| **ACR** | Accreditation system (LA28's system, built on ACR system platform) |
| **Common Codes** | Shared organisation registry within the ACR system; used across all accreditation categories |
| **NOC** | National Olympic Committee (206 worldwide); primary owner of the EoI process and PbN allocation |
| **IF** | International Federation; has the same role as NOC for their sport's media quota management |
| **OCOG** | Organising Committee (LA28); formally approves PbN quota allocations submitted by NOCs. Has cross-NOC visibility on EoI. |
| **IOC** | International Olympic Committee; sets total press/photo quota allocations per NOC. Has visibility only on EoI and PbN. Owns the ENR process (reviews NOC requests, grants from holdback pool). |
| **D.TEC** | Deloitte Olympic Technology; builds and operates the portal. Common Codes is also maintained by D.TEC (Ken's team). |
| **MRP** | Media Registration Portal — this system |

---

## Vision

### 10x Check
The 10x version of this isn't just a press registration form — it's an **IOC-owned media credentialing platform** that persists across every Olympic and Paralympic Games edition. By 2032 Brisbane, an accredited New York Times photographer from LA28 doesn't re-apply from scratch. Their organisation profile carries forward. The IOC has a global directory of legitimate press organisations with track records, and rogue applications from non-journalists are caught by pattern matching against historical data. The platform becomes the single source of truth for Olympic press identity worldwide.

### Dream State (August 2026)
A journalist in any of 206 countries opens olympics.com, finds a press accreditation link, submits their organisation's details in under 10 minutes. Their NOC gets a clean dashboard of applicants from their territory, can approve or return applications, and submits their Press by Number allocation digitally without touching Excel. The OCOG reviews and formally approves those allocations. The IOC sees everything. Zero Excel spreadsheets. Zero email attachments containing PII. Full audit trail for every Games from LA28 forward.

---

## Problem Statement

The IOC's press accreditation process for the Olympic Games is managed through Excel spreadsheets emailed between the IOC, NOCs, and the OCOG. Three parties suffer:

1. **IOC Media Operations** — they allocate quotas to 206 NOCs but have zero visibility into what NOCs do with those quotas. When a media organisation disputes their accreditation decision, the IOC cannot see what happened. This is a transparency and reputational risk.

2. **NOC press accreditation managers** — they receive Excel templates by email, fill them in, send them back. Quota changes trigger re-sends of the entire file. Multiple file versions, no audit trail, no deduplication across NOCs.

3. **OCOG ACR staff (LA28)** — they receive submissions from 206 NOCs, manually reconcile them, check for duplicates, coordinate corrections. Entirely manual, no tooling.

For LA28 2028, the IOC has committed to launching a dedicated Media Registration Portal. This has been announced to all NOCs. There is no backup plan. The portal must be live by August 24, 2026.

---

## Two Processes + One Separate Track

**This is the structural backbone of the MRP.** The portal serves two sequential processes (EoI then PbN) plus one completely separate track (ENR). These are distinct workflows with different users, different screens, and different data flows.

```
┌─────────────────────────────────────────────────────────────────┐
│  PROCESS 1: Expression of Interest (EoI)                       │
│  Aug – Oct 2026                                                 │
│                                                                 │
│  FRONT-END: Media org self-nominates via public form           │
│               (Press / Photo / Both)                            │
│                                     │                           │
│  BACK-END:  NOC/IF reviews queue ───┘                          │
│             approves / returns / rejects each application       │
│                                                                 │
│  Primary owner: NOC/IF                                         │
│  OCOG: read-only visibility     IOC: read-only visibility      │
│  Output: approved org list per NOC, tagged Press/Photo/Both    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ approved org list feeds into
┌─────────────────────────────────────────────────────────────────┐
│  PROCESS 2: Press by Number (PbN)                              │
│  Oct – Dec 2026                                                 │
│                                                                 │
│  NOC takes its EoI-approved org list and assigns quotas:       │
│  NOC ──allocates press + photo slots──► OCOG ──approves──►    │
│                                                                 │
│  Primary owner: OCOG (formal approval), NOC (allocation)       │
│  IOC: read-only visibility                                      │
│  Output: org × press slots + photo slots → ACR                 │
│                                                                 │
│  NOC is notified when OCOG approves their allocation           │
│  NOC is notified again when data flows to ACR                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  SEPARATE TRACK: ENR (Extended Non-Rights Broadcasters)        │
│  Parallel to EoI/PbN window — completely separate screens      │
│                                                                 │
│  *** NO SELF-NOMINATION. NOC nomination only. ***              │
│  Media orgs do NOT apply for ENR. The NOC nominates them.      │
│                                                                 │
│  NOC ──submits prioritised list──► IOC ──grants/denies──►      │
│                                                                 │
│  Primary owner: IOC (grants from holdback pool)               │
│  NOC: submits and receives decisions                           │
│  OCOG: read-only visibility                                    │
│  Quota pool: completely separate from press/photo totals       │
│  Output: ENR slot allocations per NOC → ACR                   │
│                                                                 │
│  IOC ENR review screen is SEPARATE from IOC EoI/PbN views.   │
│  It mirrors the OCOG PbN approval UX: IOC reviews NOC lists,  │
│  grants from holdback pool, tracks state per NOC.              │
└─────────────────────────────────────────────────────────────────┘
```

### Process Separation — Critical Rules

**EoI ≠ PbN.** These are sequential but independent processes. EoI produces an eligibility list (approved orgs). PbN assigns slot numbers to that list. Slot numbers are NEVER set during EoI.

**ENR ≠ EoI.** ENR is a completely separate track. ENR orgs do NOT appear in the EoI application queue, the NOC EoI review screen, or the PbN slot assignment table. ENR organisations have their own separate screen (NOC ENR Request Submission) and their own separate IOC review screen.

**Key rules:**
- The EoI form has three category options: **Press**, **Photo**, **Both** (one application with two flags — not two separate applications). ENR is not a category.
- Press and photo quotas are tracked separately throughout PbN. IOC assigns a press total and a photo total per NOC independently.
- ENR quota is a completely separate pool held back by the IOC, not derived from press/photo totals.
- The NOC is the primary user of EoI screens. The OCOG is the primary user of PbN approval screens. The IOC manages ENR from its own dedicated screens. These are largely different people using different parts of the portal.

---

## Target Users

| Role | Primary process | Permissions |
|------|----------------|-------------|
| **NOC admin** | EoI (primary owner) + PbN allocation + ENR request submission | See own territory only. Approve/return/reject EoI applications. Invite known orgs. Allocate press/photo slots per org in PbN. Submit prioritised ENR request list. |
| **IF admin** | PbN allocation + ENR request submission (NO EoI queue) | Same screens as NOC admin. No public EoI queue — IFs bring orgs in via the invited-org flow only. Allocate press/photo slots per org in PbN. Submit ENR list. |
| **OCOG admin** | PbN (formal approval + adjustment) | Cross-NOC access. Same PbN screens as NOC but across all territories. Formally approve or adjust NOC PbN submissions. Visibility only on EoI. |
| **IOC admin** | ENR (grants from holdback) + visibility | Visibility only on EoI and PbN. Reviews NOC ENR request lists; grants or denies ENR allocations from holdback pool. Sets total press/photo quota per NOC via Excel import. |
| **Applicant** | EoI submission | Submits their own application. Views own status. No other access. |

**IF vs. NOC distinction:** IFs use the same admin screens and role as NOC admins. The key difference: IFs have no public EoI application queue. All IF-territory orgs come in via the NOC invited-org flow. Once in the system, IF admin allocates PbN slots and submits ENR lists identically to NOC admins. For schema purposes, `noc_code` / `body_code` covers both NOC and IF codes.

Note: IOC and OCOG are **distinct roles** — different logins, different permission sets, different primary workflows.

---

## System Architecture

### Two-System Boundary

```
SYSTEM 1: Media Registration Portal (MRP — this system)
  - Public EoI form (media orgs apply to NOC)
  - NOC dashboards (EoI review + PbN allocation + ENR request)
  - OCOG dashboard (PbN approval, cross-NOC)
  - IOC dashboard (visibility + ENR grant + quota-setting)
  ↓ DATA HANDOFF (structured export or API — see ACR Integration section)
SYSTEM 2: ACR / ACR system (LA28's existing accreditation platform)
  - Common Codes (org registry)
  - Press by Name (individual accreditation — Phase 2, 2027)
```

### Technology Stack (confirmed)

- **Framework:** Next.js App Router (server components, server actions)
- **ORM:** Drizzle + PostgreSQL
- **UI:** Tailwind CSS + shadcn/ui
- **Auth:** Magic link (applicants); email + password (all admin roles, prototype); D.TEC/DGP SSO at v1.0
- **Deploy:** Railway (prototype); D.TEC-managed infrastructure (production)
- **Tests:** Vitest + Playwright

### Adapter Pattern

```
MRP App
  └── AcrAdapter (interface)
        ├── AcrStubClient (dev/test — returns realistic fixture data)
        └── AcrApiClient (prod — real ACR API, swapped in when ready)
```

Key adapter methods: `fetchQuota(noc_id, event_id)`, `pushOrgData(org[], event_id)`, `getOrgCodes(event_id)`.

---

## Scope

### V0.1 (prototype) and V1 — ships August 24, 2026

PbN is in v0.1 scope alongside EoI. All of PbN ships August 24 except ACR real-time sync (which is v1.1). The v1.1 column contains only ACR integration and ENR undertaking in-system.

**EoI process:**
1. Public media organisation EoI form — Press / Photo / Both category selection
2. NOC ability to invite known organisations to express interest (in addition to open signup)
3. NOC management dashboard — territory-scoped EoI review (approve/return/reject)
4. OCOG and IOC visibility-only views across all NOCs during EoI phase

**PbN process (in v0.1 / v1 — all except ACR real-time sync):**
5. NOC PbN allocation screen — assign press slots + photo slots per approved org
6. OCOG PbN approval screen — cross-NOC view, formally approve or adjust NOC submissions
7. Quota state tracking: NOC submitted → OCOG approved → NOC notified → sent to ACR → NOC notified
8. IOC visibility of PbN allocations

**ENR track (separate screens — v1):**
9. NOC ENR request screen — submit prioritised NOC-nominated ENR list to IOC (no self-nomination)
10. IOC ENR review screen — separate screen; grant or deny ENR allocations from holdback pool

**Platform:**
11. Quota import from Excel (IOC sets press/photo totals per NOC; import + editable table)
12. ACR system adapter (stubbed in dev, real API in prod)
13. Structured data export for ACR handoff (press slots + photo slots + ENR per org)
14. IOC Anomaly Detection — concentration risk, cross-NOC duplication, NOC inactivity
15. Deduplication with IOC action flow
16. Games-to-Games org persistence (data model in v1)
17. Public Org Directory (opt-in, post-event)
18. Audit log — all admin actions across all three processes

### V1.1 — ships late September 2026 (before October 5 PbN process launch)

Note: The PbN **software** ships August 24 in v1. The PbN **process** (NOCs allocating quotas) launches October 5. V1.1 ships in between to add ACR real-time sync before the process starts.

- ACR real-time quota sync (v1 uses batch export)
- ENR undertaking digital signature (pending legal review — see ENR Undertaking section)
- French/Spanish localisation (v1 English-only)
- Self-service NOC account registration

### Explicitly NOT in scope (LA28 v1)

- REST API for large NOC integration — build with real usage data after v1
- Language packs beyond EN/FR/ES
- Paralympic Games cross-linking (2028 priority)
- Individual journalist accreditation (Press by Name — ACR system, 2027)
- Document uploads — form collects metadata only

---

## EoI Application Form

### Category selection

At EoI stage, a media organisation selects one of:
- **Press** — journalists, writers, reporters
- **Photo** — still photographers
- **Both** — organisations with both press and photography staff

**Both = one application, two flags.** The org is not asked to submit two applications. During PbN, the NOC assigns press slots and photo slots to this org independently. An org that applied for Both can receive press slots only, photo slots only, or both.

ENR is not a category in the EoI form. ENR organisations do not self-apply.

### NOC-invited applications

In addition to open signup, NOCs can invite known organisations directly. The invited org receives a pre-addressed link that pre-fills their organisation details. The invited and open-signup paths converge at the same EoI form and feed the same NOC review queue.

---

## ENR Track

### Structure — completely separate from EoI/PbN

ENR is a distinct, parallel track. It does NOT connect to EoI or PbN. ENR orgs never appear in EoI queues or PbN allocation tables.

| | EoI | ENR |
|-|-----|-----|
| Who initiates | **Media org** (self-nominates via public form) | **NOC** (nominates orgs — no self-nomination) |
| Who reviews | NOC | IOC |
| Screens | Public EoI form → NOC review queue | NOC ENR Request screen → IOC ENR Review screen |
| Output | Approved org list (eligible for PbN) | ENR slot allocations (direct to ACR) |
| Quota pool | Press/photo totals (per NOC, IOC-assigned) | Separate ENR holdback (IOC-managed) |

**No self-nomination.** Media organisations do not apply for ENR accreditation. The NOC nominates them on their behalf. The IOC then grants or denies from the holdback pool. This is fundamentally different from EoI where the media org initiates.

### NOC ENR request screen

The NOC submits a prioritised list of ENR organisations they wish to accredit. The list is ordered (rank 1 = highest priority). The IOC works down the list when allocating from the holdback pool. The NOC cannot see other NOCs' ENR lists.

### IOC ENR grant mechanism — partial allocation confirmed

The IOC approves **some percentage** of each NOC's ENR request. Per-org grant amounts are set by the IOC. Three outcomes per org:
- **Granted** — IOC approves the requested slot count in full
- **Partial grant** — IOC approves fewer slots than requested (NOC requested 22, IOC grants 15)
- **Denied** — IOC grants 0 slots

The IOC works down the prioritised list. Grant decisions reduce the holdback pool. The NOC sees IOC decisions per org after the IOC submits.

### IOC ENR review screen (separate from IOC EoI/PbN views)

The IOC ENR review screen is a dedicated screen, separate from the IOC EoI visibility dashboard. It mirrors the OCOG PbN approval UX: the IOC sees a list of all NOC ENR submissions, drills into each NOC's prioritised list, and sets grant amounts per org from the holdback pool. The holdback pool balance is always visible.

This screen is NOT the IOC's EoI visibility view. They are different pages with different purposes.

### ENR quota pool

Completely separate from press/photo totals. Managed entirely by the IOC from the holdback pool. NOC press/photo quotas are unaffected by ENR grants.

### ENR undertaking

The ENR undertaking (currently an Adobe Acrobat external process) is targeted for in-system delivery in v1.1. Two paths under legal review (see Resolved Decisions).

---

## Quota Management Model

*Confirmed 2026-03-30.*

### Quota types

| Type | Scope | Set by | Approved by | Allocated by |
|------|-------|--------|-------------|--------------|
| Press quota | Per NOC | IOC | n/a (IOC sets directly) | NOC (per org) |
| Photo quota | Per NOC | IOC | n/a (IOC sets directly) | NOC (per org) |
| ENR quota | Separate holdback pool | IOC | IOC grants to NOC | IOC |

Press and photo are tracked independently throughout. An org approved for Both in EoI can receive independent press and photo slot allocations.

### The two-step model

**Step 1 — Eligibility (NOC EoI approval)**
When a NOC approves an EoI application, that approval is the eligibility decision. Approved = eligible. No slot numbers are assigned at this point. EoI approvals happen before PbN begins; the NOC can approve applications even before the IOC has set quota totals.

**Step 2 — Slot assignment (PbN)**
The IOC assigns press and photo quota totals per NOC (separately). The NOC allocates press slots and photo slots from their totals to each approved org. The OCOG formally reviews and approves (or adjusts) these allocations before they flow to ACR.

**Confirmed:** The two steps are always separate. Slot numbers are never set at EoI approval time.

**Open question (TODO-019):** Is the two-step separation enforced for all NOC sizes, or can a small NOC combine approval and slot assignment in practice?

### Quota import

The IOC sets quota totals in July 2026. Quotas are imported from an Excel spreadsheet (not entered through a setup screen). The import produces a viewable table in the IOC dashboard.

**IOC can edit quota totals after import.** For v0.1, the quota table is both importable and editable in-app. The IOC can toggle an edit mode to adjust individual NOC press/photo totals directly, in addition to re-importing the full Excel file. All changes (import or manual edit) are logged in the `quota_changes` audit table (previous value → new value, actor, timestamp). The IOC Quota screen shows the current totals with a "Re-import from Excel" button and an "Edit Quotas" toggle.

**Prior Games comparison:** The quota table shows a comparison column for the prior edition of the same Games type (summer↔summer, winter↔winter). For development and UAT, Paris 2024 / Tokyo 2020 press and photo quota totals per NOC are seeded as test data. Real historical data will be loaded from IOC OIS source exports before the July 2026 quota-setting window.

### NOC dashboard quota header

The NOC PbN screen always shows quota state:
- Before IOC sets totals: "Press: not yet assigned — Photo: not yet assigned"
- After IOC sets totals: "Press: 12 of 50 allocated · Photo: 8 of 20 allocated"

### OCOG approval states

PbN submissions track two states:
- **NOC submitted** — NOC has finalised their allocation for review
- **OCOG approved** — OCOG has formally accepted the allocation (with or without adjustments)

IOC can see both states but takes no action on them.

**NOC notifications:**
- When OCOG approves (or adjusts and approves) the NOC's PbN submission → NOC receives an in-app notification and email. If OCOG adjusted any allocation, the notification shows which orgs were changed and by how much.
- When the OCOG-approved data flows to ACR → NOC receives a confirmation notification with a summary of what was sent.

The NOC PbN screen shows the current state prominently (Draft → Submitted → OCOG Approved → Sent to ACR). OCOG adjustments are highlighted in the NOC's view.

### Data model

```sql
noc_quotas
  noc_code          text
  event_id          text
  press_total       integer     -- set by IOC
  photo_total       integer     -- set by IOC
  set_by            text        -- IOC admin user id
  set_at            timestamp
  notes             text

enr_quotas
  noc_code          text
  event_id          text
  enr_total         integer     -- granted by IOC from holdback
  granted_by        text        -- IOC admin user id
  granted_at        timestamp

org_slot_allocations
  id                uuid
  organization_id   uuid
  noc_code          text
  event_id          text
  press_slots       integer     -- set by NOC
  photo_slots       integer     -- set by NOC
  allocated_by      text        -- NOC admin user id
  allocated_at      timestamp
  pbn_state         text        -- 'draft' | 'noc_submitted' | 'ocog_approved'
  ocog_reviewed_by  text        -- nullable
  ocog_reviewed_at  timestamp   -- nullable

quota_changes                   -- append-only audit (covers both imports and in-app edits)
  noc_code, event_id, quota_type, old_value, new_value,
  changed_by, changed_at, change_source  -- 'import' | 'manual_edit'

enr_requests
  id                uuid
  noc_code          text
  event_id          text
  organization_id   uuid
  priority_rank     integer     -- NOC-assigned priority
  slots_requested   integer     -- set by NOC at submission
  slots_granted     integer     -- set by IOC (null until decision)
  decision          text        -- 'granted' | 'partial' | 'denied' | null (pending)
  decision_notes    text        -- nullable, IOC explanation
  reviewed_by       text        -- IOC admin user id
  reviewed_at       timestamp
```

### Prior Games comparison

When setting quotas in July 2026, the IOC should be able to compare against prior editions of the **same Games type** (summer↔summer, winter↔winter — not sequential). This is tracked as TODO-024.

---

## Resolved Design Decisions

| # | Decision | Resolution | Date |
|---|----------|------------|------|
| 1 | ACR API contract | Define `AcrAdapter` interface with ACR team before writing any stub. Required: `fetchQuota()`, `pushOrgData()`, `getOrgCodes()`. ACR must provide sandbox before integration testing. | 2026-03-28 |
| 2 | Auth for NOC/OCOG/IOC admins | Admin-provisioned accounts only (v1). Three distinct roles: NOC, OCOG, IOC — different logins, different permission sets. v1.0: D.TEC/DGP SSO. | 2026-03-28 / updated 2026-03-30 |
| 3 | Public form spam/abuse | Email verification + CAPTCHA (hCaptcha) + rate limiting (max 10 submissions/IP/day, 3/email/day). | 2026-03-28 |
| 4 | Document uploads | Deferred to v1.1. v1 form collects org name, contact details, category, free-text "About" field only. | 2026-03-28 |
| 5 | Localisation | English-only for v1. French in v1.1. | 2026-03-28 |
| 6 | Org identity model | Flat model. Same domain + same NOC = true duplicate (block). Same domain + different NOC = multi-territory flag (allow, IOC informed). Parent-child model deferred. | 2026-03-29 |
| 7 | PbN IOC approval | IOC does not approve PbN. OCOG owns formal PbN approval and adjustment. IOC has visibility only. | 2026-03-30 |
| 8 | ENR undertaking signature | External process (Adobe Acrobat) continues for v1. In-system in v1.1 pending legal review. | 2026-03-28 |
| 9 | Deduplication algorithm | Name + domain matching with IOC review queue. Over-flag preferred. Cross-Games matching enabled. Freelancers: name + country only. | 2026-03-28 |
| 10 | Quota model — structure | Press quota and photo quota tracked separately per NOC. ENR quota is a completely separate holdback pool managed by IOC. Not a single integer per NOC. | 2026-03-30 |
| 11 | Quota import | IOC imports quota totals from Excel. Produces an editable table in the IOC dashboard. Both import and in-app edit are supported for v0.1. All changes audit-logged. | 2026-03-30 / updated 2026-03-30 |
| 12 | EoI category options | Press / Photo / Both. Both = one application with two flags, not two applications. ENR is not an EoI category. | 2026-03-30 |
| 13 | ENR process model | ENR is EoI inverted: NOC submits a prioritised ENR request list to IOC. IOC reviews and grants from a separate holdback pool. Media orgs do not self-apply as ENR. | 2026-03-30 |
| 14 | EoI ownership | EoI is owned and driven by the NOC. OCOG and IOC have visibility only during EoI phase — no approve/return/reject actions. | 2026-03-30 |
| 15 | PbN approval states | NOC submitted → OCOG approved. OCOG can adjust allocations. IOC visibility only. | 2026-03-30 |
| 16 | PBN system boundary | PbN module lives in MRP (System 1). Data handoff to ACR via adapter. June 1, 2026 gate determines live API vs. CSV fallback. | 2026-03-28 |
| 17 | Common Codes ownership | Common Codes is D.TEC (Ken's team). Both MRP and ACR are peer consumers. MRP exports org data; Common Codes assigns codes through a separate workflow. | 2026-03-29 |
| 18 | Anomaly detection thresholds | NOC inactivity: 7-day default (configurable). Concentration risk: >30% of quota to one org (configurable). | 2026-03-28 |
| 19 | IF role vs. NOC role | IFs use the same admin role and screens as NOC admins. Key difference: IFs have no public EoI queue. IF orgs enter via invited-org flow only. Otherwise PbN allocation and ENR submission are identical. | 2026-03-30 |
| 20 | IOC quota editing post-import | IOC can edit quota totals after import (v0.1). The quota table supports both import and in-app edit mode. All changes audit-logged in `quota_changes` table. | 2026-03-30 / updated 2026-03-30 |
| 21 | ENR partial allocation | IOC approves a percentage of each NOC's ENR request. Per-org outcomes: Granted (full), Partial grant (fewer slots than requested), Denied (0 slots). IOC sets granted slot count per org explicitly. | 2026-03-30 |
| 22 | Games-to-games event_id scope | `event_id` scoping is v1 / v0.1 scope (not deferred). Must be in schema before any production data is entered. Default 'LA28'. | 2026-03-30 |
| 23 | Prior Games quota data | Seed Paris 2024 / Tokyo 2020 quota data as test fixtures for dev and UAT. Real IOC OIS data loaded before July 2026 quota-setting window. | 2026-03-30 |
| 24 | ACR stub | Build AcrStubClient in Sprint 1 from the design-doc-defined OrgExportRecord interface. Do not wait for ACR API contract. Adjust stub when real contract arrives. | 2026-03-30 |
| 25 | Data residency | v0.1 prototype: US hosting (Railway), synthetic data only, no real PII. v1 production: EU hosting on D.TEC/DGP infrastructure. | 2026-03-30 |

---

## Deduplication Rules

**Current status: Cross-NOC dedup provisionally eliminated for v1.**

The original design included cross-NOC duplicate detection (same org applying through multiple NOCs surfacing flags to IOC). This has been provisionally removed pending clarity on what, if anything, should be flagged and to whom. See Open Questions #16.

**What remains for v1:**
- Within-territory duplicate detection only (same org applying twice to the same NOC). These surface as "Duplicate submission" to the NOC — they can see their own territory's duplicates, not other NOCs'.
- Games-to-Games org matching (same org from prior Games, different application) — informational "Known org" flag for NOC context.

**Removed from v1:**
- Cross-NOC duplicate detection (Reuters UK + France scenario)
- AUTO_DUPLICATE blocking across NOC boundaries
- IOC dedup review queue for cross-NOC flags

**Open question (see Open Questions #16):** What cross-NOC visibility, if any, should surface to IOC or OCOG during EoI phase? Does IOC need to see the same org appearing in multiple NOC queues? What is the action if they do?

---

## Authentication & Access Control

**Applicants:**
- Public EoI form — no account required
- Magic link (token) for session during application flow
- Optional account to track status and receive NOC communications

**NOC admin:**
- Admin-provisioned accounts (not self-registration)
- Sees own territory only
- Actions: approve/return/reject EoI; invite known orgs; PbN slot allocation; ENR request submission

**OCOG admin:**
- Separate role from IOC — different login, different screens
- Cross-NOC access
- Actions: PbN review and formal approval/adjustment; visibility on EoI
- Uses same PbN allocation screens as NOC but with cross-NOC purview and richer search/filtering

**IOC admin:**
- Visibility only on EoI and PbN
- Actions: set press/photo quota totals (via Excel import or in-app edit — all changes audit-logged); review and grant/deny ENR requests from holdback pool; dedup resolution; anomaly review
- Cannot approve/return/reject EoI applications; cannot approve PbN allocations

---

## PII & Data Policy

**Data collected at EoI stage (org-level — not individual PII):**
- Organisation name, type, country, primary contact name + email
- Category requested (Press/Photo/Both), free-text "About your coverage"
- No individual journalist data at this stage

**PII handling:**
- Data controller: IOC. Data processor: OCOG/D.TEC.
- Retention: archive until December 31, 2030; then purge
- Backup retention: 90 days rolling
- Encryption at rest and in transit (TLS 1.3 minimum)
- Data residency: **v0.1 prototype — US hosting (Railway), synthetic/test data only, no real PII.** **v1 production — EU hosting on D.TEC/DGP infrastructure** (same infra as rest of D.TEC systems).
- Right-to-be-forgotten: restricted under GDPR Article 17(3)(b)

---

## Security

**Fake/fraudulent applications:**
- Rate limiting: max 3 submissions/IP/hour, 10/day
- Email domain blocklist: known disposable email providers blocked
- CAPTCHA on public form
- Manual IOC flag: any org can be flagged "under review" — visible to NOC before PbN

**PII protection:**
- No individual journalist PII at EoI stage
- NOCs see only their own applicants — zero cross-NOC leakage at data layer

**Authentication:**
- NOC/OCOG/IOC: IOC-provisioned credentials; MFA required
- Session timeout: 30 minutes idle

---

## ACR Integration & Fallback Plan

**Decision gate: June 1, 2026** — go/no-go on live ACR API integration.

If ACR is not ready: fallback to structured CSV export (press slots + photo slots + ENR per org per NOC), one-cycle deferral.

**Failure modes:**
- `fetchQuota()` unavailable → cache last-known quota in MRP DB, surface staleness warning
- `pushOrgData()` fails → retry queue (exponential backoff, max 5 attempts, 24h window)

**Final PbN output to ACR:**
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

---

## ENR Undertaking Design

Two parallel paths until legal review completes (target: April 30, 2026):

**Path A (typed name — build first):** Checkbox + typed full legal name + date. Timestamp + IP logged. PDF receipt emailed to signatory.

**Path B (DocuSign-grade — additive):** Required only if IOC legal determines typed-name is insufficient. ~3–4 weeks additional build time. Path A work is not discarded.

---

## Games-to-Games Org Persistence

**In v0.1 / v1 scope.** `event_id` scoping is required in the schema before any production data is entered.

Organisations are first-class entities that outlive a single Games edition. All tables scoped to `event_id`. Adding future events is a data operation, not a code change.

```
Organization
  id: uuid (stable across Games)
  name, country_code, primary_domain, org_type
  event_id: text (default 'LA28')
  games_editions: [edition_id]
  common_code: string | null
  status: enum (active | inactive | banned | pending_review)
```

`event_id` must be added to `organizations`, `applications`, `org_slot_allocations`, `enr_requests`, `noc_quotas`, and `enr_quotas` tables. The Sprint 1 schema migration must include this before any test data is seeded.

---

## Development Timeline

```
GATE 0 (deadline: April 1, 2026)
  [ ] ACR API contract signed off
  [ ] Form field list received from IOC Media Ops
  If either gate is not cleared → timeline shifts 1:1

Apr 1–25      Sprint 1: EoI form + NOC dashboard + OCOG/IOC visibility,
              PbN allocation + OCOG approval + ENR screens (all in v0.1),
              auth (3 roles), DB schema, AcrStubClient, quota model.

Apr 25–Jun 30 Hardening, capacity testing, security review, OCOG UAT.

Jun 1         ACR integration go/no-go gate.

Jul 1–Aug 10  Production deployment, final QA, NOC onboarding.
              IOC imports quota totals from Excel.

Aug 24        Portal goes live — EoI window opens.
              PbN + ENR software live; PbN process launches Oct 5.

Sep 1–25      v1.1: ACR real-time sync + ENR undertaking in-system.
              (PbN software already shipped in v1; v1.1 adds ACR
              integration before the PbN allocation process opens)

Oct 5         Press by Number process launches (v1.1 must be live).

Oct 23        Portal closes for new EoI applications.

Dec 18, 2026  Press by Number closes.

Oct 14, 2027  Press by Name launches (via ACR system).

Feb 14, 2028  Press by Name closes.

Summer 2028   LA28 Olympic Games.
```

---

## Success Criteria

- Portal live at www.olympics.com by August 24, 2026
- 206 NOCs can log in, review EoI applications, and manage their PbN allocations
- OCOG can formally approve PbN allocations across all NOCs
- IOC has real-time read-only visibility on EoI and PbN; manages ENR from holdback pool
- Zero quota overruns — NOC cannot allocate more press or photo slots than their IOC-assigned totals
- PbN output to ACR: press slots + photo slots + ENR per org, OCOG-approved, zero manual cleanup
- All PII handling compliant with GDPR
- System tested and signed off by April 2026

---

## Open Questions

| # | Question | Owner | Deadline | Status |
|---|----------|-------|----------|--------|
| 1 | April 2026 milestone — UAT with stub data or production-ready? | IOC + D.TEC | April 1, 2026 | UNCONFIRMED |
| 2 | ENR undertaking legal mechanism — Path A or Path B? | IOC Legal | April 30, 2026 | NOT STARTED |
| 3 | Infrastructure owner + hosting platform | IOC / D.TEC | April 15, 2026 | UNASSIGNED |
| 4 | ACR integration go/no-go | IOC + LA28 + ACR system | June 1, 2026 | UNASSIGNED |
| 5 | Data handoff contract (field-level spec) | D.TEC | May 1, 2026 | UNASSIGNED |
| 6 | RACI: IOC / LA28 / D.TEC ownership | IOC | April 1, 2026 | MISSING |
| 7 | GDPR / EU data residency confirmation | IOC Legal | May 1, 2026 | RESOLVED — v0.1 US/Railway with no PII. v1 on D.TEC/DGP EU infra. Formal legal sign-off still needed before v1 launch. |
| 8 | IOC SSO integration feasibility + timeline | IOC IT + D.TEC | April 15, 2026 | UNASSIGNED |
| 9 | Quota: two-step separation enforced for all NOC sizes? | IOC OIS | TBD | OPEN |
| 10 | Quota assignees beyond NOCs — IFs, INOs, others? | IOC OIS | TBD | OPEN |
| 11 | Quota amendment workflow — can IOC adjust NOC totals after import? | IOC OIS | TBD | RESOLVED — Yes, for v0.1. Both import and in-app edit supported. See Decision #20. |
| 12 | Prior Games quota data import — IOC OIS to provide Paris 2024 / Tokyo 2020 source data | IOC OIS | June 2026 | RESOLVED — Generate test fixture data for dev/UAT now. Load real IOC OIS data before July 2026 quota-setting window. |
| 13 | Common Codes lookup API at submission time | D.TEC Common Codes team | May 1, 2026 | OPEN |
| 14 | ENR prioritised list — does IOC grant partial allocations or all-or-nothing per org? | IOC OIS | TBD | RESOLVED — Per-org partial allocation. IOC approves a percentage of each NOC's request. Outcomes: Granted / Partial grant / Denied. See Decision #21. |
| 15 | IFs — same role as NOCs for their sport's quota/PbN workflow? | IOC OIS | TBD | RESOLVED — Yes. Same screens as NOC. No public EoI queue — invited-org flow only. See Decision #19. |
| 16 | Cross-NOC dedup for EoI — provisionally eliminated. What (if anything) should be flagged to IOC or OCOG when the same org appears in multiple NOC queues? | IOC OIS | TBD | OPEN |

---

## Critical Risks

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| 1 | April 2026 deadline — D.TEC alignment not confirmed | Critical | Triage this week |
| 2 | ACR API contract not defined | Critical | Pre-build stub from best-guess schema |
| 3 | ENR undertaking legal mechanism unclear | High | Legal review by end of April |
| 4 | No RACI (IOC/LA28/D.TEC) | High | RACI call required this week |
| 5 | PbN → ACR integration blocked by ACR readiness | High | Fallback: CSV export (June 1 gate) |
| 6 | GDPR / data residency for EU applicants | Medium | Confirm by May |
| 7 | AI translations for Olympic Charter language (FR) | Medium | Human review step before go-live |
| 8 | Historical quota data unavailable for July import | Low | Graceful empty state; IOC OIS to confirm by June |

---

## Test Plan

### Routes / screens

| Screen | Primary user | What to test |
|--------|-------------|-------------|
| `/apply` | Applicant | Email verification, form validation, Press/Photo/Both category, submission, dedup |
| `/apply/form` | Applicant | Token validation, resubmission pre-fill, country/NOC datalist |
| `/invite/[token]` | Applicant (invited) | Pre-filled org details, link expiry |
| `/admin/noc` | NOC admin | EoI queue, approve/return/reject, filter, CSV export |
| `/admin/noc/[id]` | NOC admin | Application detail, audit history, action forms |
| `/admin/noc/enr` | NOC admin | ENR request list, priority ordering, submit to IOC |
| `/admin/noc/pbn` | NOC admin | Press + photo slot allocation per org, quota header, submit to OCOG |
| `/admin/ocog/pbn` | OCOG admin | Cross-NOC PbN review, approve/adjust, state transitions |
| `/admin/ioc` | IOC admin | Visibility dashboard, anomaly cards, NOC summary |
| `/admin/ioc/enr` | IOC admin | ENR request review — separate screen; grant/deny per NOC from holdback pool |
| `/admin/ioc/quotas` | IOC admin | Excel import + editable quota table (press + photo per NOC); edit mode with audit trail; separate from EoI/PbN views |
| `/admin/ioc/audit` | IOC admin | Audit trail, action filters |
| `/admin/ioc/export` | IOC admin | PbN CSV export for ACR |

### Key interactions to verify

- EoI: Both category creates one application with press + photo flags
- EoI: NOC can only see own territory; OCOG/IOC see all (read-only)
- ENR: NOC submits prioritised list; IOC can grant/deny per org from holdback
- PbN: NOC sets press slots and photo slots independently per org
- PbN: NOC cannot exceed press total or photo total
- PbN: OCOG can adjust allocations; state transitions to OCOG approved
- Quota import: Excel upload produces editable table; IOC can adjust individual NOC totals in-app; all changes (import or manual edit) audit-logged with actor + timestamp
- ACR export: output includes press_slots + photo_slots + enr_slots per org, OCOG-approved only

### Edge cases

- Org applied for Both receives press slots only (photo stays 0) — valid
- NOC at exact quota capacity (50/50 press) attempts one more press allocation
- ENR org granted partial slots vs. full request
- OCOG adjusts NOC allocation downward — NOC notified
- Quota import with missing NOCs — graceful handling
- Expired verification token
- Concurrent org creation race condition

### Critical paths

1. Full EoI: email verify → form (Both) → submit → NOC sees it → approves → IOC/OCOG see it read-only
2. ENR: NOC submits prioritised list → IOC reviews → grants from holdback
3. PbN: IOC imports quotas → NOC allocates press + photo per org → submits → OCOG approves → export to ACR
4. Auth boundary: NOC cannot see other NOC data; OCOG can; IOC can (read-only)
5. Audit: every write action logged with actor, action, timestamp

---

## Review Status

| Review | Date | Outcome | Key Findings |
|--------|------|---------|--------------|
| CEO Plan | 2026-03-27 | DONE_WITH_CONCERNS | 3 critical gaps (dedup policy, OrgRecord schema, EU data residency); 5 scope expansions accepted |
| Eng Review | 2026-03-28 | CLEAR | 10 issues, 2 critical gaps (email bounce silent failure, audit fail-closed); 42 test paths |
| Outside Voice | 2026-03-28 | COMPLETE | 13 findings; 4 cross-model tensions |
| Design Review | 2026-03-28 | DONE | 6 wireframes produced |
| IOC Stakeholder Interview | 2026-03-30 | COMPLETE | Major structural clarifications — see Two Processes section and Resolved Decisions 10–15 |
| Design Doc + Wireframe Review | 2026-03-30 | COMPLETE | ENR process separation clarified; cross-NOC dedup provisionally eliminated; PbN scope in v0.1 confirmed; NOC notifications added; IOC ENR and Quota screens created |

**Critical gaps remaining:**
- F-01: Email verification bounce = silent failure (no retry UX designed)
- F-04: Audit middleware must fail-closed (block writes that can't be audited)
- Common Codes integration architecture (TODO-013)
- Open Question #16: cross-NOC dedup visibility (provisionally eliminated — needs IOC OIS input)

---

## Key Dates

| Date | Milestone |
|------|-----------|
| April 2026 | Systems ready and tested |
| July 2026 | IOC imports press/photo quota totals per NOC |
| August 24, 2026 | Portal goes live — EoI window opens |
| October 5, 2026 | Press by Number process launches for NOCs |
| October 23, 2026 | Portal closes for new EoI applications |
| December 18, 2026 | Press by Number closes |
| October 14, 2027 | Press by Name launches (via ACR system) |
| February 14, 2028 | Press by Name closes |
| Summer 2028 | LA28 Olympic Games |
