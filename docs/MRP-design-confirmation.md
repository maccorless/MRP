# LA28 Media Registration Portal — Design Confirmation

**Status:** ACTIVE
**Last updated:** 2026-04-02 (full doc/code audit — 5 stale items corrected, Critical Risks #9/#10 resolved, session timeout updated to 8h, 24 audit actions documented, Stakeholder Confirmation Register added with 24 items)
**Covers:** v0.1 prototype through v1 launch (August 2026) and v1.1 (October 2026)

---

## Glossary

| Term | Definition |
|------|------------|
| **EoI** | Expression of Interest — public-facing form where media orgs apply to their NOC for press accreditation consideration |
| **ENR** | Extended Non-Rights Broadcaster — broadcasters without Olympic media rights. ENR requests are submitted by the NOC to the IOC (not by media orgs directly) |
| **PbN** | Press by Number — the phase where NOCs formally allocate their IOC-assigned per-category quotas (E, Es, EP, EPs, ET, EC, NOC E) to specific media organisations, subject to OCOG approval |
| **ACR** | Accreditation system (LA28's system, built on ACR system platform) |
| **Common Codes** | Shared organisation registry within the ACR system; used across all accreditation categories |
| **NOC** | National Olympic Committee (206 worldwide); primary owner of the EoI process and PbN allocation |
| **IF** | International Federation; has the same role as NOC for their sport's media quota management |
| **OCOG** | Organising Committee (LA28); formally approves PbN quota allocations submitted by NOCs. Has cross-NOC visibility on EoI. |
| **IOC** | International Olympic Committee; sets total per-category quota allocations per NOC (E, Es, EP, EPs, ET, EC, NOC E). Has visibility only on EoI and PbN. Owns the ENR process (reviews NOC requests, grants from holdback pool). Also acts as the "NOC" for IOC-Direct organisations (see IOC-Direct Organizations section). |
| **IOC-Direct** | A reserved list of media organisations (e.g. AFP, AP, Reuters, Xinhua) for which the IOC acts as the sponsoring body, bypassing the normal NOC quota process. Managed under a special pseudo-NOC code `IOC_DIRECT`. |
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
│               (E / Es / EP / EPs / ET / EC categories)          │
│                                     │                           │
│  BACK-END:  NOC/IF reviews queue ───┘                          │
│             approves / returns / rejects each application       │
│                                                                 │
│  Primary owner: NOC/IF                                         │
│  OCOG: read-only visibility     IOC: read-only visibility      │
│  Output: approved org list per NOC, tagged by E-category       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ approved org list feeds into
┌─────────────────────────────────────────────────────────────────┐
│  PROCESS 2: Press by Number (PbN)                              │
│  Oct – Dec 2026                                                 │
│                                                                 │
│  NOC takes its EoI-approved org list and assigns quotas:       │
│  NOC ──allocates per-category slots──► OCOG ──approves──►     │
│                                                                 │
│  Primary owner: OCOG (formal approval), NOC (allocation)       │
│  IOC: read-only visibility                                      │
│  Output: org × per-category slots → ACR                        │
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
│  Quota pool: completely separate from E-category totals        │
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
- The EoI form has six applicant-selectable category options: **E, Es, EP, EPs, ET, EC**. Applicants may select one or more. ENR is not a category. NOC E (press attaché) is not self-applied — it is NOC-nominated separately.
- Quotas are tracked per E-category throughout PbN. IOC assigns E_total, Es_total, EP_total, EPs_total, ET_total, EC_total, and NOC_E_total per NOC independently.
- ENR quota is a completely separate pool held back by the IOC, not derived from E-category totals.
- The NOC is the primary user of EoI screens. The OCOG is the primary user of PbN approval screens. The IOC manages ENR from its own dedicated screens. These are largely different people using different parts of the portal.

---

## Target Users

| Role | Primary process | Permissions |
|------|----------------|-------------|
| **NOC admin** | EoI (primary owner) + PbN allocation + ENR request submission | See own territory only. Approve/return/reject EoI applications. Invite known orgs. Allocate per-category slots per org in PbN. Submit prioritised ENR request list. Nominate own communications staff (NOC E press attachés) via Fast-Track Entry — create a single 'NOC Communications Staff' org using fast-track, then allocate NOC E slots to that org during PbN. |
| **IF admin** | PbN allocation + ENR request submission (NO EoI queue) | Same screens as NOC admin. No public EoI queue — IFs bring orgs in via the invited-org flow only. Allocate per-category slots per org in PbN. Submit ENR list. |
| **OCOG admin** | PbN (formal approval + adjustment) | Cross-NOC access. Same PbN screens as NOC but across all territories. Formally approve or adjust NOC PbN submissions. Visibility only on EoI. |
| **IOC admin** | ENR (grants from holdback) + visibility + IOC-Direct org management + sudo | Visibility only on EoI and PbN for all NOC territories. Reviews NOC ENR request lists; grants or denies ENR allocations from holdback pool. Sets total per-category quota per NOC via Excel import. **Additionally acts as the NOC-equivalent for IOC-Direct organisations**: manages the reserved org list, reviews EoI applications from IOC-Direct orgs, and submits PbN allocations for those orgs (subject to OCOG approval, same state machine as any NOC). Can use sudo mode to open a read-only session as any non-IOC admin user (see IOC Sudo Feature section). |
| **IOC readonly** (`ioc_readonly`) | Visibility only | Same read-only visibility as IOC admin but cannot write any data. Cannot use sudo mode. |
| **Applicant** | EoI submission | Submits their own application. Views own status. No other access. |

**IF vs. NOC distinction:** IFs use the same admin screens and role as NOC admins. The key difference: IFs have no public EoI application queue. All IF-territory orgs come in via the NOC invited-org flow. Once in the system, IF admin allocates PbN slots and submits ENR lists identically to NOC admins. For schema purposes, `noc_code` / `body_code` covers both NOC and IF codes.

Note: IOC and OCOG are **distinct roles** — different logins, different permission sets, different primary workflows. The IOC admin's NOC-equivalent workflow for IOC-Direct orgs is scoped to `noc_code = 'IOC_DIRECT'` and uses the same screens as a NOC admin for that territory.

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
- **Tests:** Vitest (integration tests against real DB, run in `pool: "forks"` isolation). Playwright — not yet added.

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

### Build status summary (as of 2026-04-03)

The following features are built and working in the v0.1 codebase. Items marked "not yet built" are in scope but not yet implemented.

| Feature | Status |
|---------|--------|
| EoI 5-tab form (Organisation, Contacts, Accreditation, Publication, History) | Built |
| EoI localStorage auto-save + country→NOC auto-suggest + URL validation | Built |
| EoI E-category multi-select with per-category requested quantities | Built |
| EoI publication types checkboxes (13 types + Other reveal) | Built |
| EoI history tab with Olympic edition checkboxes | Built |
| NOC EoI review queue (approve / return / reject) | Built |
| NOC application detail page with QuotaBar impact panel | Built |
| NOC PbN per-category slot allocation + quota enforcement | Built |
| NOC ENR request submission | Built |
| OCOG PbN approval (per-category overrides) + `sendToAcr` | Built |
| IOC ENR decision (granted / partial / denied per org) | Built |
| IOC quota import (CSV) + in-app edit | Built — full 7-category import/edit (E, Es, EP, EPs, ET, EC, NocE) |
| IOC sudo (impersonation, read-only, amber banner, audit log) | Built |
| `sudoTokens` DB table + `mrp_sudo_session` cookie | Built |
| `ioc_readonly` role | Built (in session.ts + layout role labels) |
| ACR adapter stub (`pushOrgData`) | Built |
| ACR adapter `fetchQuota` / `getOrgCodes` methods | Not yet built |
| `OrgExportRecord` noc_e_slots + enr_slots fields | Built — `nocESlots` and `enrSlotsGranted` in adapter + stub |
| Per-category quota import/edit (7 categories) | Built |
| Playwright end-to-end tests | Not yet built |
| IOC anomaly detection / concentration risk | Not yet built |
| Games-to-Games org persistence UI | Schema ready; UI not yet built |
| Public org directory | Not yet built |
| NOC fast-track application form (`/admin/noc/fast-track`) — NOC submits on behalf of org without public EoI form | Built |
| NOC direct PbN entry (add org to PbN without EoI) | Built — inline form on PbN page |
| IOC-Direct org management (add/manage reserved orgs + PbN allocation) | Built — full management UI at /admin/ioc/direct |
| NOC EoI window toggle — NOC can open/close their own EoI acceptance window (`/admin/noc/settings`) | Built |
| NOC quota dashboard — live per-category quota summary visible to NOC admin | Built |
| Applicant status tracking — applicant can check status of their submitted application | Built |
| Application reversals — NOC can reverse an approve/reject decision within an allowed window | Built |
| NOC/IF invited-org flow | Not yet built |
| CAPTCHA on public EoI form | Not yet built |
| Cross-NOC dedup (provisionally eliminated) | Not in scope for v1 |
| ENR undertaking digital signature | Planned v1.1 |
| ACR real-time sync | Planned v1.1 |
| D.TEC/DGP SSO | Planned v1.0 |

### V0.1 (prototype) and V1 — ships August 24, 2026

PbN is in v0.1 scope alongside EoI. All of PbN ships August 24 except ACR real-time sync (which is v1.1). The v1.1 column contains only ACR integration and ENR undertaking in-system.

**EoI process:**
1. Public media organisation EoI form — E-category multi-select (E, Es, EP, EPs, ET, EC)
2. NOC ability to invite known organisations to express interest (in addition to open signup)
3. NOC management dashboard — territory-scoped EoI review (approve/return/reject)
4. OCOG and IOC visibility-only views across all NOCs during EoI phase

**PbN process (in v0.1 / v1 — all except ACR real-time sync):**
5. NOC PbN allocation screen — assign per-category slots (E, Es, EP, EPs, ET, EC, NOC E) per approved org
6. OCOG PbN approval screen — cross-NOC view, formally approve or adjust NOC submissions
7. Quota state tracking: NOC submitted → OCOG approved → NOC notified → sent to ACR → NOC notified
8. IOC visibility of PbN allocations

**ENR track (separate screens — v1):**
9. NOC ENR request screen — submit prioritised NOC-nominated ENR list to IOC (no self-nomination)
10. IOC ENR review screen — separate screen; grant or deny ENR allocations from holdback pool

**Platform:**
11. Quota import from Excel (IOC sets per-category totals per NOC; import + editable table)
12. ACR system adapter (stubbed in dev, real API in prod)
13. Structured data export for ACR handoff (per-category slots + ENR per org)
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

*Confirmed 2026-03-31 (Decision #27). Replaces the earlier Press / Photo / Both model.*

At EoI stage, a media organisation selects **one or more** accreditation categories from the E-category set. Each category has inline help text explaining eligibility criteria.

| Category | Label | Who it covers |
|----------|-------|---------------|
| **E** | Journalist | General media: news agency, newspaper, magazine, internet/social media, freelance journalist |
| **Es** | Sport-specific journalist | Journalist who specialises in one sport (must declare the sport) |
| **EP** | Photographer | Still photographer; same eligibility basis as E |
| **EPs** | Sport-specific photographer | Photographer specialising in one sport (must declare the sport) |
| **ET** | Technician | Technical support staff at MPC; limited to major news and photo agencies |
| **EC** | Support staff | Office assistant, secretary, interpreter, driver; MPC access only |

**NOC E (Press Attaché) is not on the public EoI form.** NOC E covers NOC communications staff / press attachés. These are nominated directly by the NOC — they do not self-apply. NOC E slots are allocated during PbN via a separate NOC-nominated list, not via the public EoI queue.

**Multi-category = one application.** An org may select multiple categories in a single application (e.g. E + EP for a news agency with both reporters and photographers). This creates one application record with multiple category flags. During PbN, the NOC assigns slots per category independently. An org can receive slots in some categories and zero in others.

**ENR is not a category in the EoI form.** ENR organisations do not self-apply.

### EoI form structure (built — 5 tabs)

The EoI form is a 5-tab client component (`EoiFormTabs.tsx`) with localStorage auto-save (500 ms debounce, keyed by email, skipped for resubmissions) and per-tab completion status indicators.

| Tab | Fields |
|-----|--------|
| **1 — Organisation** | Org name, type, country (datalist), NOC code (datalist with auto-suggest from country — see below), website (URL validation), freelancer flag |
| **2 — Contacts** | Primary contact: first name, last name, title/position, email, phone, cell. Secondary contact (all optional): first name, last name, title, email, phone, cell |
| **3 — Accreditation** | E-category multi-select (E, Es, EP, EPs, ET, EC) with requested quantity per selected category. About/coverage free-text (required). |
| **4 — Publication** | Publication type checkboxes (multi-select, see list below) + "Other" text reveal. Circulation/visitors, frequency, sports to cover. |
| **5 — History** | Prior Olympic accreditation (Yes/No). If Yes: edition checkboxes (Sydney 2000 … Paris 2024) + past coverage examples. Prior Paralympic accreditation (Yes/No). If Yes: edition checkboxes. If both No: open sports-coverage prompt. Additional comments. |

**Country → NOC auto-suggest:** when the applicant selects a country, the NOC code field is automatically populated with the matching NOC code (via `COUNTRY_TO_NOC` map). Auto-suggest is overridable; if the user had already typed a NOC code manually it is not overwritten unless the previous value was itself auto-suggested.

**URL validation:** `https?://` pattern enforced client-side on all `type="url"` inputs before form submission.

**Process intro:** a collapsible "How does this work?" disclosure (`<details>`) at the top of the form explains the EoI → PbN → accreditation process to applicants.

**Publication types (actual list):**
- App
- Editorial Website / Blog
- Email Newsletter
- Magazine / Newspaper
- Official NGB Publication
- Photo Journal / Online Gallery
- Podcast
- Print Newsletter
- Social Media
- Television / Broadcast
- Online Video / Streaming
- Freelancer with confirmed assignment
- Other *(reveals free-text input when checked)*

Values are stored as `snake_case` slugs in a JSONB array (`publication_types` column).

**Olympic/Paralympic edition checkboxes:** rather than free-text year entry, the History tab shows individual checkboxes for each Summer Games edition (Sydney 2000, Athens 2004, Beijing 2008, London 2012, Rio 2016, Tokyo 2020, Paris 2024). Selected editions are stored comma-joined in `prior_olympic_years` / `prior_paralympic_years`.

**Accessibility needs:** a boolean field (`accessibility_needs`) is captured in the Accreditation tab and shown to the NOC reviewer.

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

Completely separate from E-category totals. Managed entirely by the IOC from the holdback pool. NOC per-category quotas are unaffected by ENR grants.

### ENR undertaking

The ENR undertaking (currently an Adobe Acrobat external process) is targeted for in-system delivery in v1.1. Two paths under legal review (see Resolved Decisions).

---

## IOC-Direct Organizations

*Confirmed 2026-03-31 (Decision #26).*

### Concept

A small reserved list of major international media organisations — such as AFP, AP, Reuters, Xinhua, plus potentially the host-country national agency and organisations with no NOC territory — bypass the normal NOC quota process. The **IOC acts as their sponsoring body**, filling the same role a NOC would play for a national organisation.

This list does not change significantly Games-to-Games. It is a system configuration managed by the IOC admin at the start of each cycle, before EoI opens.

### Implementation: `IOC_DIRECT` pseudo-NOC

The IOC-Direct organisations are assigned to a special pseudo-NOC code: `IOC_DIRECT`. This slots them naturally into the existing data model with no schema exceptions:

- `noc_quotas` has a row for `noc_code = 'IOC_DIRECT'`, with per-category totals set by the IOC.
- `org_slot_allocations` has rows with `noc_code = 'IOC_DIRECT'` for each reserved org.
- The IOC admin has a **NOC-equivalent workflow** scoped to `IOC_DIRECT`: an EoI review queue, a PbN slot allocation screen, and a PbN submission that goes through the same OCOG approval state machine as any NOC.

### Reserved org list management

Before EoI opens, the IOC admin populates the reserved org list (organisation name, country, category eligibility) via the IOC admin panel. This is a configuration step, not a public-facing action. The list is editable (add/remove) before EoI opens; changes after EoI opens require IOC + OCOG sign-off (audit-logged).

### Deduplication: reserved-list block

When a regular NOC attempts to submit an EoI for an organisation that matches a reserved-list entry (by domain or by name + country), the form surfaces a **dedup warning/block**:

> "This organisation is registered as an IOC-Direct organisation and cannot be accredited via the NOC pathway. Contact IOC Media Operations if you believe this is an error."

The NOC cannot proceed with that application. This prevents double-accreditation of, for example, a Reuters bureau via both the IOC-Direct track and a national NOC.

### IOC-Direct workflow summary

| Step | Who acts | What happens |
|------|----------|--------------|
| Reserved list setup | IOC admin | Populates list before EoI opens |
| EoI application | IOC admin (acting as NOC) | Reviews/approves applications from reserved orgs in their `IOC_DIRECT` EoI queue |
| PbN allocation | IOC admin | Allocates per-category slots to each reserved org from the `IOC_DIRECT` quota pool |
| PbN approval | OCOG admin | Approves `IOC_DIRECT` PbN submission — same state machine as any NOC |
| ACR export | Automated | `OrgExportRecord` rows with `noc_code = 'IOC_DIRECT'` included in the standard export |

### Scope note

The IOC-Direct reserved list does not change the ENR track. ENR for IOC-Direct orgs follows the same ENR rules as any other org.

---

## Quota Management Model

*Confirmed 2026-03-30. Category model updated 2026-03-31 (Decision #27).*

### Quota types

| Type | Scope | Set by | Approved by | Allocated by |
|------|-------|--------|-------------|--------------|
| E quota | Per NOC | IOC | n/a (IOC sets directly) | NOC (per org) |
| Es quota | Per NOC | IOC | n/a (IOC sets directly) | NOC (per org) |
| EP quota | Per NOC | IOC | n/a (IOC sets directly) | NOC (per org) |
| EPs quota | Per NOC | IOC | n/a (IOC sets directly) | NOC (per org) |
| ET quota | Per NOC | IOC | n/a (IOC sets directly) | NOC (per org) |
| EC quota | Per NOC | IOC | n/a (IOC sets directly) | NOC (per org) |
| NOC E quota | Per NOC (separate formula-based pool) | IOC | n/a (IOC sets directly) | NOC (nominated list) |
| ENR quota | Separate holdback pool | IOC | IOC grants to NOC | IOC |

All seven E-category quotas (E, Es, EP, EPs, ET, EC, NOC E) are tracked independently per NOC throughout PbN. An org approved in multiple categories at EoI can receive independent slot allocations per category. NOC E is allocated via NOC-nominated list rather than from the public EoI queue.

### The two-step model

**Step 1 — Eligibility (NOC EoI approval)**
When a NOC approves an EoI application, that approval is the eligibility decision. Approved = eligible. No slot numbers are assigned at this point. EoI approvals happen before PbN begins; the NOC can approve applications even before the IOC has set quota totals.

**Step 2 — Slot assignment (PbN)**
The IOC assigns per-category quota totals per NOC (E_total, Es_total, EP_total, EPs_total, ET_total, EC_total, NOC_E_total — each independently). The NOC allocates slots from each category total to each approved org. The OCOG formally reviews and approves (or adjusts) these allocations before they flow to ACR.

**Confirmed:** The two steps are always separate. Slot numbers are never set at EoI approval time.

**Open question (TODO-019):** Is the two-step separation enforced for all NOC sizes, or can a small NOC combine approval and slot assignment in practice?

### Quota import

The IOC sets quota totals in July 2026. Quotas are imported from a CSV payload (not Excel directly — the UI accepts CSV text). The import produces a viewable table in the IOC dashboard.

**IOC can edit quota totals after import.** For v0.1, the quota table is both importable and editable in-app. The IOC can toggle an edit mode to adjust individual NOC totals directly, in addition to re-importing the full CSV. All changes (import or manual edit) are logged in the `quota_changes` audit table (previous value → new value, actor, timestamp).

**CSV format:** `NOC,E,Es,EP,EPs,ET,EC,NocE` — one row per line, eight columns. Columns: E = journalist, Es = sport-specific journalist, EP = photographer, EPs = sport-specific photographer, ET = technician, EC = support, NocE = press attaché. The `importQuotas` action parses all seven per-category columns, derives `pressTotal = E+Es+ET+EC` and `photoTotal = EP+EPs` as rollup aggregates, and upserts all fields atomically. The `quota_changes` audit records use per-category `quotaType` values (`e`, `es`, `ep`, `eps`, `et`, `ec`, `noc_e`). The in-app edit mode exposes all seven categories as individual number inputs. The quota view table shows one column per category plus a Total column.

**Prior Games comparison:** The quota table shows a comparison column for the prior edition of the same Games type (summer↔summer, winter↔winter). For development and UAT, Paris 2024 / Tokyo 2020 per-category quota totals per NOC are seeded as test data. Real historical data will be loaded from IOC OIS source exports before the July 2026 quota-setting window.

### NOC dashboard quota header

The NOC PbN screen always shows quota state per category:
- Before IOC sets totals: each category shows "not yet assigned"
- After IOC sets totals: each category shows "X of Y allocated" (e.g. "E: 12 of 50 · EP: 8 of 20 · Es: 0 of 5 …")

### QuotaBar component (built — NOC EoI review detail page)

The application detail page (`/admin/noc/[id]`) includes a **quota impact panel** that shows what approving this application would do to the NOC's per-category quota. Built as `<QuotaBar>` within the page component:

- Shown only when: quota data exists for this NOC, and application is in an actionable state (pending or resubmitted)
- For each category the application requested: renders a horizontal bar split into three segments — already-allocated (blue), this-request (amber or red), remaining headroom (gray)
- Over-quota state turns the request segment red and shows "over quota" text
- Format: `{allocated}+{requested}/{total}` per category
- The panel is labeled "Quota impact if approved" and scoped to categories the applicant actually selected

### OCOG approval states

PbN submissions track four states (the `pbn_state` enum):
- **`draft`** — NOC is still editing their allocation
- **`noc_submitted`** — NOC has finalised their allocation for OCOG review
- **`ocog_approved`** — OCOG has formally accepted the allocation (with or without adjustments)
- **`sent_to_acr`** — OCOG has pushed the approved allocation to ACR via `sendToAcr()`

IOC can see all states but takes no action on them.

The `approvePbn()` OCOG action accepts per-org per-category slot overrides from the approval form, writes them to `orgSlotAllocations`, and transitions state to `ocog_approved`. The `sendToAcr()` action pushes `ocog_approved` allocations through the ACR adapter and transitions state to `sent_to_acr`.

**NOC notifications:**
- When OCOG approves (or adjusts and approves) the NOC's PbN submission → NOC receives an in-app notification and email. If OCOG adjusted any allocation, the notification shows which orgs were changed and by how much.
- When the OCOG-approved data flows to ACR → NOC receives a confirmation notification with a summary of what was sent.

The NOC PbN screen shows the current state prominently (Draft → Submitted → OCOG Approved → Sent to ACR). OCOG adjustments are highlighted in the NOC's view.

### Data model

The tables below reflect the built schema (`src/db/schema.ts`).

```sql
organizations
  id                uuid          -- stable across Games
  event_id          text          -- default 'LA28'
  name              text
  country           text          -- ISO 3166-1 alpha-2
  noc_code          text          -- e.g. USA, FRA; 'IOC_DIRECT' for reserved orgs
  org_type          enum          -- media_print_online | media_broadcast | news_agency | enr
  website           text
  email_domain      text          -- extracted for dedup
  common_codes_id   text          -- null until coded
  status            enum          -- active | inactive | banned | pending_review
  is_multi_territory_flag boolean
  is_freelancer     boolean
  -- v2 address fields (captured in EoI form, optional)
  address, address2, city, state_province, postal_code  text

applications
  id                uuid
  event_id          text          -- default 'LA28'
  reference_number  text          -- unique; e.g. APP-2028-USA-00051
  organization_id   uuid
  noc_code          text
  -- Primary contact
  contact_name      text          -- backward compat: first + " " + last
  contact_email, contact_first_name, contact_last_name, contact_title, contact_phone, contact_cell  text
  -- Secondary contact (all optional)
  secondary_first_name, secondary_last_name, secondary_title, secondary_email, secondary_phone, secondary_cell  text
  -- Legacy category flags (backward compat)
  category_press, category_photo  boolean
  -- Per-category EoI flags
  category_e, category_es, category_ep, category_eps, category_et, category_ec  boolean
  -- Requested quantities per category (from EoI form)
  requested_e, requested_es, requested_ep, requested_eps, requested_et, requested_ec  integer
  about             text          -- required coverage description
  -- Publication details
  publication_types jsonb         -- string[] of slugs e.g. ["magazine___newspaper","podcast"]
  circulation, publication_frequency  text
  -- Accreditation history
  prior_olympic, prior_paralympic  boolean
  prior_olympic_years, prior_paralympic_years  text  -- comma-joined edition slugs
  past_coverage_examples, sports_to_cover, additional_comments  text
  accessibility_needs  boolean
  -- Status / review
  status            enum          -- pending | approved | returned | resubmitted | rejected
  resubmission_count  integer
  review_note       text          -- return/rejection reason (shown to applicant)
  internal_note     text          -- NOC-only, never shown to applicant
  reviewed_at       timestamp
  reviewed_by       text

noc_quotas
  noc_code          text          -- 'IOC_DIRECT' is a valid noc_code
  event_id          text
  -- Legacy totals (kept for backward compat with import actions — see quota import gap note)
  press_total       integer
  photo_total       integer
  -- Per-category quota totals (IOC-assigned)
  e_total           integer       -- Journalist
  es_total          integer       -- Sport-specific journalist
  ep_total          integer       -- Photographer
  eps_total         integer       -- Sport-specific photographer
  et_total          integer       -- Technician
  ec_total          integer       -- Support staff
  noc_e_total       integer       -- Press Attaché (formula-based pool)
  set_by, notes     text
  set_at            timestamp

enr_quotas
  noc_code          text
  event_id          text
  enr_total         integer       -- granted by IOC from holdback
  granted_by        text
  granted_at        timestamp

org_slot_allocations
  id                uuid
  organization_id   uuid
  noc_code          text          -- 'IOC_DIRECT' for IOC-Direct org allocations
  event_id          text
  -- Legacy slot counts (kept for compat; kept in sync by NOC PbN save logic)
  press_slots       integer
  photo_slots       integer
  -- Per-category slot allocations (NOC-assigned in PbN)
  e_slots, es_slots, ep_slots, eps_slots, et_slots, ec_slots  integer
  noc_e_slots       integer       -- set by NOC via nominated-list (not public EoI)
  allocated_by      text
  allocated_at      timestamp
  pbn_state         text          -- 'draft' | 'noc_submitted' | 'ocog_approved' | 'sent_to_acr'
  ocog_reviewed_by  text
  ocog_reviewed_at  timestamp

quota_changes                   -- append-only audit (covers both imports and in-app edits)
  noc_code, event_id
  quota_type        text        -- per-category values: 'e' | 'es' | 'ep' | 'eps' | 'et' | 'ec' | 'noc_e' (fully implemented in import/edit actions as of 2026-04-01)
  old_value, new_value,
  changed_by, changed_at, change_source  -- 'import' | 'manual_edit'

enr_requests
  id                uuid
  noc_code          text
  event_id          text
  organization_id   uuid        -- nullable; may be null for direct NOC nominations
  priority_rank     integer     -- NOC-assigned priority
  slots_requested   integer     -- = mustHaveSlots + niceToHaveSlots (backward compat)
  must_have_slots   integer     -- v2 field
  nice_to_have_slots integer    -- v2 field
  enr_org_name      text        -- v2: org name for direct nominations (org may not exist in organizations table)
  enr_website       text        -- v2
  enr_description   text        -- v2
  enr_justification text        -- v2
  slots_granted     integer     -- set by IOC (null until decision)
  decision          text        -- 'granted' | 'partial' | 'denied' | null (pending)
  decision_notes    text        -- nullable, IOC explanation
  reviewed_by       text        -- IOC admin user id
  reviewed_at       timestamp

sudo_tokens                     -- one-time IOC sudo activation tokens
  id                uuid
  token_hash        text        -- SHA-256 of raw token (unique)
  actor_id          text        -- IOC admin userId who initiated
  actor_label       text        -- IOC admin display name
  target_email      text        -- target admin email
  expires_at        timestamp   -- 10 minutes after creation
  used_at           timestamp   -- set on activation; null = not yet used
  created_at        timestamp

reserved_organizations           -- IOC-Direct reserved list
  id                uuid
  event_id          text
  name              text        -- canonical org name
  email_domain      text        -- primary domain for dedup (nullable)
  alternate_names   jsonb       -- string[] of known name variants
  website           text
  country           text
  notes             text
  added_by, updated_at, added_at  text/timestamp
```

**Enums built in schema:**
- `org_type`: `media_print_online | media_broadcast | news_agency | enr`
- `application_status`: `pending | approved | returned | resubmitted | rejected`
- `actor_type`: `applicant | noc_admin | ioc_admin | ocog_admin | if_admin | system`
- `audit_action`: `application_submitted | application_resubmitted | application_approved | application_returned | application_rejected | email_verified | admin_login | duplicate_flag_raised | export_generated | pbn_submitted | pbn_approved | pbn_sent_to_acr | quota_changed | enr_submitted | enr_decision_made | sudo_initiated | noc_direct_entry | eoi_window_toggled | application_unapproved | application_unreturned | pbn_unapproved | enr_decision_revised` (24 total)
- `pbn_state`: `draft | noc_submitted | ocog_approved | sent_to_acr`
- `enr_decision`: `granted | partial | denied`
- `org_status`: `active | inactive | banned | pending_review`

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
| 12 | EoI category options | ~~Press / Photo / Both.~~ **Superseded by Decision #27 (2026-03-31).** See Decision #27 for full E-category set. ENR is not an EoI category. | 2026-03-30 / superseded 2026-03-31 |
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
| 26 | IOC-Direct organisations | The IOC acts as the NOC-equivalent for a reserved list of major international media orgs (AFP, AP, Reuters, Xinhua, etc.) via a special pseudo-NOC code `IOC_DIRECT`. The reserved list is managed by IOC admin before EoI opens. Real NOCs get a dedup block if they attempt to submit an EoI for a reserved org. The IOC admin has a NOC-equivalent workflow (EoI queue, PbN allocation) scoped to `IOC_DIRECT`, with OCOG approval on the same state machine. | 2026-03-31 |
| 27 | EoI/PbN accreditation categories | Replace Press / Photo / Both with the full E-category set: E (Journalist), Es (Sport-specific journalist), EP (Photographer), EPs (Sport-specific photographer), ET (Technician), EC (Support staff). NOC E (Press Attaché) is NOT on the public EoI form — NOC-nominated only. Categories flow from EoI through to PbN slot allocation and the ACR export. IOC quotas and `org_slot_allocations` are structured per category. `OrgExportRecord` includes per-category slot counts. | 2026-03-31 |

---

## Deduplication Rules

**Current status: Cross-NOC dedup provisionally eliminated for v1.**

The original design included cross-NOC duplicate detection (same org applying through multiple NOCs surfacing flags to IOC). This has been provisionally removed pending clarity on what, if anything, should be flagged and to whom. See Open Questions #16.

**What remains for v1:**
- Within-territory duplicate detection only (same org applying twice to the same NOC). These surface as "Duplicate submission" to the NOC — they can see their own territory's duplicates, not other NOCs'.
- Games-to-Games org matching (same org from prior Games, different application) — informational "Known org" flag for NOC context.
- **IOC-Direct reserved-list block** (Decision #26): when any NOC attempts an EoI submission for an org matching the `IOC_DIRECT` reserved list (by domain or name + country), the form surfaces a hard block. This is not a review-flag but a submit-prevention. See IOC-Direct Organizations section.

**Removed from v1:**
- Cross-NOC duplicate detection (Reuters UK + France scenario)
- AUTO_DUPLICATE blocking across NOC boundaries
- IOC dedup review queue for cross-NOC flags

**Open question (see Open Questions #16):** What cross-NOC visibility, if any, should surface to IOC or OCOG during EoI phase? Does IOC need to see the same org appearing in multiple NOC queues? What is the action if they do?

---

## Authentication & Access Control

### Session implementation (built)

Admin sessions use HMAC-SHA256 signed cookies (Web Crypto, works in Node and edge runtime). Two cookies:

| Cookie | Purpose | Max-age |
|--------|---------|---------|
| `mrp_session` | Normal admin session | 8 hours |
| `mrp_sudo_session` | IOC sudo impersonation session | 1 hour |

`getSession()` always prefers `mrp_sudo_session` when present. `getBaseSession()` bypasses sudo and reads the real `mrp_session` (used when generating a new sudo token to verify the initiating admin).

`SessionPayload` fields: `userId`, `email`, `role`, `nocCode` (null except noc_admin), `ifCode` (null except if_admin), `displayName`, `isSudo?` (true only in sudo session), `sudoActorLabel?` (IOC admin display name, only in sudo session).

Role helpers: `requireSession()`, `requireNocSession()`, `requireIfSession()`, `requireNocOrIfSession()`, `requireOcogSession()`, `requireIocSession()` (accepts both ioc_admin and ioc_readonly), `requireIocAdminSession()` (ioc_admin only — blocks ioc_readonly and sudo sessions from write paths). `requireWritable()` blocks any server action call made from a sudo session.

**v1.0:** D.TEC/DGP SSO replaces email+password. Cookie mechanics above carry forward with SSO as the identity source.

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
- Visibility only on EoI and PbN (for all NOC territories)
- Actions: set per-category quota totals (via Excel import or in-app edit — all changes audit-logged); review and grant/deny ENR requests from holdback pool; dedup resolution; anomaly review; manage IOC-Direct reserved org list
- Cannot approve/return/reject regular NOC EoI applications; cannot approve regular NOC PbN allocations
- **Exception — IOC-Direct orgs:** the IOC admin acts as the NOC-equivalent for `IOC_DIRECT` organisations. Within that scope, they can approve/return/reject EoI applications and submit PbN allocations (subject to OCOG approval)
- **Sudo mode:** the IOC admin can open a read-only impersonation session as any non-IOC admin user. See IOC Sudo Feature section.

---

## IOC Sudo Feature

*Built — see `src/app/admin/ioc/sudo/`, `src/app/admin/sudo/`, `src/lib/session.ts`.*

IOC admins can impersonate any non-IOC admin user in a read-only session. This allows IOC Operations to see exactly what a NOC or OCOG admin sees without needing to share credentials.

### Flow

1. IOC admin clicks **"Act as user"** button in the admin header (visible only to `ioc_admin` role, hidden during active sudo).
2. A modal prompts for the target admin's email address.
3. `initiateSudo()` server action:
   - Verifies the caller is `ioc_admin` (via `requireIocAdminSession()`).
   - Looks up the target in `adminUsers`. Blocks if target is an IOC account.
   - Creates a row in `sudoTokens` (one-time token, expires in **10 minutes** if unused).
   - Logs `sudo_initiated` to `auditLog` (actor, target name, role, NOC code).
   - Returns a one-time activation URL: `/admin/sudo/activate?token=<raw_token>`.
4. The modal opens the URL in a **new browser tab** (`window.open(..., "_blank")`).
5. `GET /admin/sudo/activate` route handler:
   - Hashes the token, looks up the `sudoTokens` row.
   - Validates: exists, not already used, not expired.
   - Marks token `usedAt` (consumed — cannot be replayed).
   - Looks up the target `adminUser` and builds a `SessionPayload` with `isSudo: true` and `sudoActorLabel: <IOC admin display name>`.
   - Sets the `mrp_sudo_session` cookie (1-hour max-age, httpOnly, secure in production).
   - Redirects to `/admin`.
6. In the sudo tab, `getSession()` always prefers `mrp_sudo_session` over the normal `mrp_session` cookie, so all pages load as the target user.
7. An **amber "SUDO MODE" banner** is shown at the top of every admin page when `session.isSudo === true`. Banner shows: target display name, role, NOC code (if any), and initiating IOC admin's name.
8. **"Exit sudo" button** in the banner calls `exitSudo()` → clears `mrp_sudo_session` cookie → redirects to `/admin/sudo/exited` (a confirmation page instructing the user to close the tab).

### Read-only enforcement

All server actions that write data call `requireWritable()` at the top:

```ts
export async function requireWritable(): Promise<void> {
  const session = await getSession();
  if (session?.isSudo) {
    throw new Error("SUDO_READ_ONLY");
  }
}
```

This is a server-side hard block — no UI trick can bypass it. The error surfaces as an unhandled server action error (not a silent failure).

### DB table: `sudoTokens`

```sql
sudo_tokens
  id           uuid
  token_hash   text (unique)     -- SHA-256 of the raw 24-byte random token
  actor_id     text              -- IOC admin userId who initiated
  actor_label  text              -- IOC admin display name
  target_email text              -- target admin email
  expires_at   timestamp         -- 10 minutes after creation
  used_at      timestamp         -- set on first use (one-time)
  created_at   timestamp
```

### Constraints

- IOC admins **cannot** sudo into another IOC account (`ioc_admin` or `ioc_readonly`).
- Tokens expire after 10 minutes if not activated.
- Once activated, the token is consumed and cannot be reused.
- The sudo session cookie expires after **1 hour**.
- The `sudo_initiated` audit action is always written at token creation time, even if the token is never used.

---

## PII & Data Policy

**Data collected at EoI stage (org-level — not individual PII):**
- Organisation name, type, country, primary contact name + email
- Categories requested (one or more of E, Es, EP, EPs, ET, EC), free-text "About your coverage"
- Sport declaration for Es/EPs applicants
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
- NOC/OCOG/IOC: IOC-provisioned credentials; MFA required (v1.0 via D.TEC SSO)
- Session timeout: 8-hour max-age (no idle timeout in v0.1; easily adjustable — see `SESSION_MAX_AGE` in `src/lib/session.ts`)

---

## ACR Integration & Fallback Plan

**Decision gate: June 1, 2026** — go/no-go on live ACR API integration.

If ACR is not ready: fallback to structured CSV export (per-category slots + ENR per org per NOC, including IOC-Direct orgs), one-cycle deferral.

**Failure modes:**
- `fetchQuota()` unavailable → cache last-known quota in MRP DB, surface staleness warning
- `pushOrgData()` fails → retry queue (exponential backoff, max 5 attempts, 24h window)

**Final PbN output to ACR — actual `OrgExportRecord` interface (built):**
```ts
OrgExportRecord {
  nocCode:        string;          -- 'IOC_DIRECT' for IOC-Direct orgs
  organizationId: string;
  orgName:        string;
  country:        string;
  orgType:        string;
  emailDomain:    string;
  contactName:    string;
  contactEmail:   string;
  // Per-category EoI flags (what was requested)
  categoryE:   boolean;
  categoryEs:  boolean;
  categoryEp:  boolean;
  categoryEps: boolean;
  categoryEt:  boolean;
  categoryEc:  boolean;
  // Per-category allocated slot counts (from PbN)
  eSlots:   number;
  esSlots:  number;
  epSlots:  number;
  epsSlots: number;
  etSlots:  number;
  ecSlots:  number;
  nocESlots: number;               -- NOC press attaché slots (separate quota pool)
  enrSlotsGranted: number | null;  -- null for regular EoI orgs; set for ENR orgs
  commonCodesId: string | null;
  eventId:  string;                -- 'LA28'
}
```

**Note:** `nocESlots` and `enrSlotsGranted` are fully implemented in `src/lib/acr/adapter.ts`. `sendToAcr()` also appends approved ENR orgs (decision = 'granted' or 'partial') as separate records with `enrSlotsGranted` set and all slot counts at 0. The `AcrAdapter` interface has one method: `pushOrgData(orgs: OrgExportRecord[]): Promise<{ pushed: number }>`. The `fetchQuota()` and `getOrgCodes()` methods referenced in earlier design discussions have not been added to the interface.

**Adapter methods built:**
- `pushOrgData()` — push org slot data to ACR (stubbed in dev)

**Adapter methods NOT yet built:**
- `fetchQuota()` — pull quota data from ACR
- `getOrgCodes()` — fetch Common Codes from ACR

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
GATE 0 (deadline: April 30, 2026)
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
- Zero quota overruns — NOC cannot allocate more slots in any category than their IOC-assigned totals for that category
- PbN output to ACR: per-category slots (E/Es/EP/EPs/ET/EC/NOC E) + ENR per org, OCOG-approved, zero manual cleanup; IOC-Direct orgs included
- All PII handling compliant with GDPR
- System tested and signed off by April 2026

---

## Open Questions

| # | Question | Owner | Deadline | Status |
|---|----------|-------|----------|--------|
| 1 | April 2026 milestone — UAT with stub data or production-ready? | IOC + D.TEC | April 30, 2026 | OPEN |
| 2 | ENR undertaking legal mechanism — Path A or Path B? | IOC Legal | April 30, 2026 | NOT STARTED |
| 3 | Infrastructure owner + hosting platform | IOC / D.TEC | April 15, 2026 | UNASSIGNED |
| 4 | ACR integration go/no-go | IOC + LA28 + ACR system | June 1, 2026 | UNASSIGNED |
| 5 | Data handoff contract (field-level spec) | D.TEC | May 1, 2026 | UNASSIGNED |
| 6 | RACI: IOC / LA28 / D.TEC ownership | IOC | April 30, 2026 | OPEN — No RACI exists. Critical gap for sprint ownership decisions. |
| 7 | GDPR / EU data residency confirmation | IOC Legal | May 1, 2026 | RESOLVED — v0.1 US/Railway with no PII. v1 on D.TEC/DGP EU infra. Formal legal sign-off still needed before v1 launch. |
| 8 | IOC SSO integration feasibility + timeline | IOC IT + D.TEC | April 15, 2026 | UNASSIGNED |
| 9 | Quota: two-step separation enforced for all NOC sizes? | IOC OIS | TBD | OPEN |
| 10 | Quota assignees beyond NOCs — IFs, INOs, others? | IOC OIS | TBD | PARTIALLY RESOLVED — IFs resolved (Decision #19). IOC-Direct resolved (Decision #26). INOs and other edge cases still open. |
| 11 | Quota amendment workflow — can IOC adjust NOC totals after import? | IOC OIS | TBD | RESOLVED — Yes, for v0.1. Both import and in-app edit supported. See Decision #20. |
| 12 | Prior Games quota data import — IOC OIS to provide Paris 2024 / Tokyo 2020 source data | IOC OIS | June 2026 | RESOLVED — Generate test fixture data for dev/UAT now. Load real IOC OIS data before July 2026 quota-setting window. |
| 13 | Common Codes lookup API at submission time | D.TEC Common Codes team | May 1, 2026 | OPEN |
| 14 | ENR prioritised list — does IOC grant partial allocations or all-or-nothing per org? | IOC OIS | TBD | RESOLVED — Per-org partial allocation. IOC approves a percentage of each NOC's request. Outcomes: Granted / Partial grant / Denied. See Decision #21. |
| 15 | IFs — same role as NOCs for their sport's quota/PbN workflow? | IOC OIS | TBD | RESOLVED — Yes. Same screens as NOC. No public EoI queue — invited-org flow only. See Decision #19. |
| 16 | Cross-NOC dedup for EoI — provisionally eliminated. What (if anything) should be flagged to IOC or OCOG when the same org appears in multiple NOC queues? | IOC OIS | TBD | OPEN |
| 17 | IOC-Direct reserved list change-management: what approval gate applies if the IOC wants to add or remove an org from the reserved list after EoI has opened? | IOC OIS + OCOG | TBD | OPEN |
| 18 | NOC E (Press Attaché) slot request mechanism: does the NOC nominate press attachés via a dedicated screen, or as part of the PbN allocation table with a separate category column? | IOC OIS | TBD | PROVISIONAL DECISION — see SCR-05 below. NOC creates a self-entered "NOC communication staff" org and allocates nocESlots during PbN. No dedicated screen needed. |
| 19 | Es / EPs sport declaration: when an applicant selects sport-specific category, do they enter the sport name as free text or pick from an IOC sport taxonomy list? | IOC OIS | TBD | PROVISIONAL DECISION — free text. See SCR-06 below. |
| 20 | Fast-track flow: the NOC fast-track route (`/admin/noc/fast-track`) is built but not documented in the design. What is the intended governance? Can any NOC admin submit a fast-track application for any org, without EoI form validation or CAPTCHA? Is there an audit requirement distinguishing fast-track from public-form submissions? | IOC OIS + D.TEC | TBD | PROVISIONAL DECISION — any NOC admin can fast-track; audit-logged with `noc_direct_entry`. See SCR-07 below. |
| 21 | EoI window per NOC: the NOC settings page allows each NOC to independently open/close their EoI acceptance window. Who controls this? Can the IOC override a NOC's window state? What happens to public applicants who submit while the NOC's window is closed — are they queued, blocked, or told to wait? | IOC OIS | TBD | OPEN — see SCR-08 below. |
| 22 | Application reversals: the reversals test file (`uc-reversals.test.ts`) implies NOC admins can reverse approve/reject decisions. What is the reversal window? Can OCOG or IOC see that a reversal occurred? Does a reversal re-open the PbN eligibility for the org? | IOC OIS | TBD | PROVISIONAL DECISION — no time limit; reversals are audit-logged; PbN allocations reset to draft on unapprove. See SCR-09 below. |

---

## Critical Risks

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| 1 | April 2026 deadline — D.TEC alignment not confirmed | Critical | **OVERDUE as of 2026-04-02. Escalate immediately.** |
| 2 | ACR API contract not defined | Critical | Pre-build stub from best-guess schema |
| 3 | ENR undertaking legal mechanism unclear | High | Legal review by end of April |
| 4 | No RACI (IOC/LA28/D.TEC) | High | RACI call required this week |
| 5 | PbN → ACR integration blocked by ACR readiness | High | Fallback: CSV export (June 1 gate) |
| 6 | GDPR / data residency for EU applicants | Medium | Confirm by May |
| 7 | AI translations for Olympic Charter language (FR) | Medium | Human review step before go-live |
| 8 | Historical quota data unavailable for July import | Low | Graceful empty state; IOC OIS to confirm by June |
| 9 | ~~Quota import actions still write legacy `press`/`photo` columns only~~ | ~~Critical~~ | **RESOLVED 2026-04-01.** `importQuotas()` and `saveQuotaEdits()` now write all 7 per-category values (`e`, `es`, `ep`, `eps`, `et`, `ec`, `noc_e`) and derive `pressTotal`/`photoTotal` as rollup aggregates. `quota_changes` audit records use per-category `quotaType` values. |
| 10 | ~~`OrgExportRecord` missing `noc_e_slots` and `enr_slots`~~ | ~~High~~ | **RESOLVED 2026-04-01.** `OrgExportRecord` includes `nocESlots` and `enrSlotsGranted`. `sendToAcr()` populates both: PbN orgs get `nocESlots` from allocations; ENR orgs get `enrSlotsGranted` from granted/partial decisions. |

---

## Test Plan

### Routes / screens

| Screen | Primary user | What to test |
|--------|-------------|-------------|
| `/apply` | Applicant | Email verification, form validation, E-category multi-select (E/Es/EP/EPs/ET/EC), submission, dedup, IOC-Direct block |
| `/apply/form` | Applicant | Token validation, resubmission pre-fill, country/NOC datalist |
| `/invite/[token]` | Applicant (invited) | Pre-filled org details, link expiry |
| `/admin/noc` | NOC admin | EoI queue, approve/return/reject, filter, CSV export |
| `/admin/noc/[id]` | NOC admin | Application detail, audit history, action forms |
| `/admin/noc/enr` | NOC admin | ENR request list, priority ordering, submit to IOC |
| `/admin/noc/fast-track` | NOC admin | NOC-submitted fast-track application (bypasses public EoI form; same queue and review flow as public submissions) |
| `/admin/noc/settings` | NOC admin | EoI window toggle — open/close territory's EoI acceptance window |
| `/admin/noc/pbn` | NOC admin | Per-category slot allocation per org (E/Es/EP/EPs/ET/EC/NOC E), quota header, submit to OCOG |
| `/admin/ocog/pbn` | OCOG admin | Cross-NOC PbN review, approve/adjust, state transitions |
| `/admin/ioc` | IOC admin | Visibility dashboard, anomaly cards, NOC summary |
| `/admin/ioc/enr` | IOC admin | ENR request review — separate screen; grant/deny per NOC from holdback pool |
| `/admin/ioc/quotas` | IOC admin | Excel import + editable quota table (per-category totals per NOC, including IOC_DIRECT); edit mode with audit trail; separate from EoI/PbN views |
| `/admin/ioc/audit` | IOC admin | Audit trail, action filters |
| `/admin/ioc/export` | IOC admin | PbN CSV export for ACR (per-category slots per org, including IOC_DIRECT rows) |
| `/admin/ioc/orgs` | IOC admin | IOC-Direct reserved org list management (add/remove orgs, set category eligibility) — **Note: route is `/ioc/orgs`, not `/ioc/direct`** |

### Key interactions to verify

- EoI: multi-category selection creates one application with multiple category flags
- EoI: NOC can only see own territory; OCOG/IOC see all (read-only)
- EoI: IOC-Direct dedup block fires when a NOC submits for a reserved-list org
- ENR: NOC submits prioritised list; IOC can grant/deny per org from holdback
- PbN: NOC sets slots independently per category per org
- PbN: NOC cannot exceed any category total
- PbN: OCOG can adjust allocations; state transitions to OCOG approved
- PbN: IOC admin `IOC_DIRECT` workflow follows the same state machine as a NOC
- Quota import: Excel upload produces editable per-category table; IOC can adjust individual NOC category totals in-app; all changes (import or manual edit) audit-logged with actor + timestamp + category
- ACR export: output includes per-category slots + enr_slots per org (including IOC_DIRECT rows), OCOG-approved only

### Edge cases

- Org selected E + EP; receives E slots only (EP stays 0) — valid
- NOC at exact category quota capacity attempts one more allocation in that category
- ENR org granted partial slots vs. full request
- OCOG adjusts NOC allocation downward — NOC notified
- Quota import with missing NOCs — graceful handling
- Expired verification token
- Concurrent org creation race condition
- NOC attempts EoI for an org on the IOC-Direct reserved list — dedup block fires
- IOC admin attempts to modify reserved list after EoI has opened — requires sign-off gate

### Critical paths

1. Full EoI: email verify → form (multi-category select) → submit → NOC sees it → approves → IOC/OCOG see it read-only
2. ENR: NOC submits prioritised list → IOC reviews → grants from holdback
3. PbN: IOC imports quotas → NOC allocates per-category slots per org → submits → OCOG approves → export to ACR
3a. IOC-Direct PbN: IOC admin allocates per-category slots for reserved orgs → submits as `IOC_DIRECT` → OCOG approves → included in ACR export
4. Auth boundary: NOC cannot see other NOC data; OCOG can; IOC can (read-only)
5. Audit: every write action logged with actor, action, timestamp

### Built test files (Vitest — integration tests against real DB)

| File | Coverage |
|------|----------|
| `src/test/uc-applicant.test.ts` | Full applicant flow: email verify, form submission, resubmission |
| `src/test/uc-applicant-status.test.ts` | Applicant status check flow |
| `src/test/uc-noc-evaluate.test.ts` | NOC EoI review: approve, return, reject, queue filtering |
| `src/test/uc-noc-fast-track.test.ts` | NOC fast-track submission flow |
| `src/test/uc-noc-eoi-window.test.ts` | NOC EoI window open/close toggle |
| `src/test/uc-noc-quota-dashboard.test.ts` | NOC per-category quota dashboard display |
| `src/test/uc-noc-pbn-enr.test.ts` | NOC PbN slot allocation, quota enforcement, ENR request submission |
| `src/test/uc-reversals.test.ts` | NOC decision reversal flow |
| `src/test/uc-ocog-ioc.test.ts` | OCOG PbN approval, send to ACR, IOC quota import/edit, IOC ENR decisions |
| `src/test/category-flags.test.ts` | E-category flag helper functions |
| `src/test/helpers.ts` | Shared test fixtures and DB setup helpers |
| `src/test/setup.ts` | Vitest setup: loads `.env.local`, runs in `pool: "forks"` isolation |

Playwright end-to-end tests are **not yet added** (referenced in original design but not built).

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
| Codebase accuracy audit | 2026-03-31 | COMPLETE | Design doc updated to match built code: sudo feature added, ioc_readonly role added, EoI 5-tab form documented, QuotaBar documented, pbn_state sent_to_acr added, OrgExportRecord corrected, quota import legacy gap flagged, full schema documented, build status summary table added, test files documented |
| Design confirmation review | 2026-04-02 | COMPLETE | 5 undocumented built features added (fast-track, EoI window toggle, quota dashboard, applicant status tracking, reversals); test inventory corrected (6→12 files); IOC-Direct route corrected (`/ioc/direct` → `/ioc/orgs`); quota import gap and OrgExportRecord gap escalated to Critical Risks table; overdue open questions (#1, #6) flagged; 3 new open questions added (#20–22) for undocumented features |
| Full doc/code audit | 2026-04-02 | COMPLETE | 5 stale items corrected (Critical Risks #9/#10 resolved, quota_changes quotaType updated, audit_action enum completed). 13 discrepancies identified between design and code. Session timeout updated from 30min to 8h. Stakeholder Confirmation Register added (24 items across 6 stakeholder groups). IOC-Direct provisional decision: direct setup + PbN, no EoI flow. NOC E provisional decision: NOC self-enters as org. Email/notifications confirmed deferred to v1.0. Security and WCAG accessibility audits initiated. |

**Critical gaps remaining:**
- F-01: Email verification bounce = silent failure (no retry UX designed)
- F-04: Audit middleware must fail-closed (block writes that can't be audited)
- Common Codes integration architecture (TODO-013)
- Open Question #16: cross-NOC dedup visibility (provisionally eliminated — needs IOC OIS input)
- ~~Critical Risk #9: Quota import~~ — **RESOLVED 2026-04-01** (per-category import fully wired)
- ~~Critical Risk #10: OrgExportRecord~~ — **RESOLVED 2026-04-01** (nocESlots + enrSlotsGranted wired)
- Open Questions #20–22: Fast-track, EoI window, and reversals are built with provisional defaults — see Stakeholder Confirmation Register below
- IOC-Direct workflow: dedup block built; management UI and PbN workflow not yet built (provisional decision: direct setup screen, no EoI flow — see SCR-04)
- NOC E (Press Attaché): provisional model decided but not yet built (NOC self-enters as org in PbN — see SCR-05)
- Email/notification system: deferred to v1.0; no email infrastructure exists

---

## Stakeholder Confirmation Register

*Added 2026-04-02. This section lists every provisional decision, open design question, and governance confirmation needed from stakeholders. Each item describes the current provisional decision (what is built or will be built), the rationale, and what we need confirmed or changed.*

*Recommended approach: circulate this section as a standalone document to each stakeholder group. Items are tagged with the recommended reviewer(s).*

### SCR-01: RACI — Who owns what between IOC, LA28, and D.TEC

**Status:** OPEN — no RACI exists (maps to Open Question #6, TODO-001)
**Provisional decision:** D.TEC is building and operating the portal. IOC OIS owns the business rules and form field list. LA28/OCOG owns PbN formal approval.
**What we need:** A one-page RACI covering: (a) EoI form field ownership, (b) PbN approval authority, (c) ENR grant authority, (d) infrastructure/hosting, (e) security review sign-off, (f) NOC onboarding/account provisioning, (g) production incident response.
**Deadline:** April 30, 2026 — **OVERDUE relative to original plan. Escalate.**
**Confirm with:** IOC Media Operations, LA28 OCOG, D.TEC leadership
**Implementation status:** Not applicable (governance document, not code)

---

### SCR-02: April milestone scope — UAT with stub data or production-ready?

**Status:** OPEN (maps to Open Question #1, Critical Risk #1)
**Provisional decision:** April deliverable is a **functional prototype** with stub ACR integration and synthetic test data. Not production-ready — production requires EU hosting, SSO, CAPTCHA, and rate limiting which are planned for v1 (August).
**What we need:** Explicit agreement on what "systems ready and tested" means for April 2026. Is the April demo for internal D.TEC/IOC review only, or will NOCs see it?
**Deadline:** Immediate — we are past April 1
**Confirm with:** IOC Media Operations, D.TEC leadership

---

### SCR-03: EoI form field list — final fields from IOC

**Status:** OPEN (maps to TODO-003)
**Provisional decision:** Form is built with 5 tabs (Organisation, Contacts, Accreditation, Publication, History) based on USOPC EoI forms and IOC stakeholder interview. We have ~35 fields implemented. The IOC may want additional fields (e.g., media accreditation number from prior Games, ISSN, specific affiliation details).
**What we need:** IOC Media Ops to review the current form fields and confirm or add. The form is easily extensible — new fields are low effort.
**Deadline:** Before any NOC-facing demo
**Confirm with:** IOC Media Operations (Emma / IOC OIS)
**Implementation status:** Built; extensible

---

### SCR-04: IOC-Direct organisations — setup screen, no EoI flow

**Status:** PROVISIONAL DECISION (maps to Decision #26, Open Question #17)
**Provisional decision:** IOC-Direct organisations (AFP, AP, Reuters, Xinhua, ~5-10 total) do **not** go through the public EoI form. Instead:
1. IOC admin manages a reserved org list via a dedicated management screen (`/admin/ioc/orgs`) — add, edit, remove orgs with name, domain, country, category eligibility
2. Reserved orgs are automatically blocked from NOC EoI queues (dedup block by domain + name/country match)
3. IOC admin acts as the "NOC" for `IOC_DIRECT` orgs during PbN — allocates per-category slots from a separate `IOC_DIRECT` quota pool
4. `IOC_DIRECT` PbN submissions go through the same OCOG approval state machine as any NOC
5. No self-nomination form for IOC-Direct orgs — IOC enters their details directly

**Rationale:** These are a small, stable set of organisations that the IOC already manages directly. A full EoI flow adds unnecessary process. The IOC just needs to (a) register them, (b) allocate their credentials, and (c) get OCOG sign-off.

**What we need confirmed:**
- Is this list truly ~5-10 orgs, or could it grow significantly?
- After EoI opens, can the IOC add new orgs to the reserved list without OCOG sign-off, or is a joint approval gate needed?
- Does the OCOG need any additional visibility or approval authority over IOC-Direct orgs beyond the standard PbN approval?

**Confirm with:** IOC Media Operations, OCOG (LA28)
**Implementation status:** Dedup block built; reserved org management actions and IOC-Direct PbN workflow not yet built
**Effort to complete:** M (~2-3 days)

---

### SCR-05: NOC E (Press Attaché) — NOC self-enters as org in PbN

**Status:** PROVISIONAL DECISION (maps to Open Question #18)
**Provisional decision:** NOC E (press attaché) credentials cover NOC communications staff, not external media organisations. The NOC does **not** need a dedicated nomination screen. Instead:
1. The NOC creates a single organisation record representing their own communications team (e.g., "USA NOC Communications Staff") — this can be done via the fast-track entry route
2. During PbN, the NOC allocates `nocESlots` to this org like any other allocation
3. The IOC sets `nocETotal` per NOC as part of the quota import (already built — the 7th column in the CSV)
4. Individual press attaché names are not collected in MRP — that's Press by Name (ACR system, 2027)

**Rationale:** Press attachés are NOC internal staff, not independent applicants. Treating "NOC comms staff" as an org-of-N is consistent with the existing data model and avoids building a separate nomination UI.

**What we need confirmed:**
- Is the NOC E quota formula-based (e.g., based on delegation size), or does the IOC set it manually per NOC like other categories?
- Are there cases where multiple distinct NOC entities (e.g., NOC comms team + NOC broadcast team) need separate org records?
- Does the IOC or OCOG need to see the individual names of press attachés at any stage, or is a slot count sufficient for MRP?

**Confirm with:** IOC OIS
**Also consider getting input from:** 2-3 large NOCs (USA, GBR, FRA) to validate the workflow makes sense from their perspective
**Implementation status:** Schema supports it (`nocETotal` in quotas, `nocESlots` in allocations); UX for creating the NOC-self org not yet specifically designed

---

### SCR-06: Sport-specific categories (Es/EPs) — free text sport declaration

**Status:** PROVISIONAL DECISION (maps to Open Question #19)
**Provisional decision:** When an applicant selects Es (sport-specific journalist) or EPs (sport-specific photographer), they enter the sport name as **free text** in the existing `sportsToCover` field. No dropdown from an IOC sport taxonomy list.
**Rationale:** Free text is simpler to build and flexible. The IOC sport taxonomy is well-defined (LA28 programme has ~32 sports), but the form already captures `sportsToCover` as free text, which serves double duty.
**What we need confirmed:** Is free text sufficient, or does the IOC need a structured sport dropdown for filtering/reporting? A dropdown would be low effort to add if needed.
**Confirm with:** IOC OIS
**Implementation status:** Built (free text `sportsToCover` field in History tab)

---

### SCR-07: Fast-track NOC entry — governance model

**Status:** PROVISIONAL DECISION (maps to Open Question #20)
**Provisional decision:** The NOC fast-track route (`/admin/noc/fast-track`) allows any NOC admin to submit an application on behalf of an organisation without going through the public EoI form. Current behaviour:
1. NOC admin fills in org details + category selection directly
2. Application is created with `status = 'approved'` and `entrySource = 'noc_direct'`
3. The `noc_direct_entry` audit action is logged with the NOC admin as actor
4. No CAPTCHA, no email verification (the NOC admin is already authenticated)
5. The org appears in the NOC's approved list and is eligible for PbN slot allocation immediately

**Rationale:** NOCs have legitimate organisations they already know (e.g., their national wire service, long-standing press partners). Requiring these known orgs to self-apply via the public form creates unnecessary friction. The audit trail distinguishes fast-track from public submissions.

**What we need confirmed:**
- Is there a limit on how many orgs a NOC can fast-track?
- Should the IOC or OCOG be notified when a NOC uses fast-track, or is the audit log sufficient?
- Should fast-tracked orgs skip OCOG visibility during EoI phase, or should they appear in OCOG's cross-NOC view alongside public applicants?

**Confirm with:** IOC OIS, OCOG (LA28)
**Also consider getting input from:** NOC administrators (does this match their expected workflow?)
**Implementation status:** Built and tested

---

### SCR-08: EoI window per NOC — control and applicant experience

**Status:** OPEN (maps to Open Question #21)
**Current behaviour (built):**
1. Each NOC has an independent EoI window toggle at `/admin/noc/settings`
2. Default state: window **open** (no row in `nocEoiWindows` = open)
3. When a NOC closes their window, public applicants who attempt to submit see a "submissions are not currently being accepted" message and are **blocked** (not queued)
4. The toggle is audit-logged (`eoi_window_toggled`)
5. Only the NOC admin for that territory can toggle their own window

**What we need decided:**
- Can the IOC override a NOC's window state? (e.g., force-open a NOC that has prematurely closed, or force-close all NOCs at the global deadline)
- When the global EoI deadline passes (October 23, 2026), should all windows close automatically, or does each NOC close manually?
- Should blocked applicants see a "try again later" message, or "contact your NOC at [email]"?
- Should the IOC have visibility into which NOCs have their windows open/closed?

**Confirm with:** IOC OIS (governance), OCOG (process coordination)
**Also consider getting input from:** NOC administrators
**Implementation status:** Built and tested; IOC override and global deadline auto-close not yet built

---

### SCR-09: Application reversals — no time limit, audit-logged

**Status:** PROVISIONAL DECISION (maps to Open Question #22)
**Provisional decision:** NOC admins can reverse approve and return decisions with **no time limit**. Current behaviour:
1. **Unapprove** (`approved → pending`): resets all PbN allocations for that org to `draft` state. Audit-logged as `application_unapproved`.
2. **Unreturn** (`returned → pending`): allows NOC to re-evaluate without waiting for applicant resubmission. Audit-logged as `application_unreturned`.
3. **Rejections cannot be reversed** — `rejected` is a terminal state.
4. **OCOG PbN approval can be reversed** (`ocog_approved → noc_submitted`). Audit-logged as `pbn_unapproved`.
5. All reversals are visible in the audit log to IOC admins.

**Rationale:** Reversals are an administrative necessity — NOC reviewers make mistakes. A time limit adds complexity without clear benefit given the audit trail provides full visibility.

**What we need confirmed:**
- Is it acceptable that rejection is permanent? Or should there be a path to reverse a rejection (e.g., with IOC approval)?
- Should OCOG/IOC see a visual indicator on reversed applications (beyond the audit log)?
- As the ACR system becomes the master record: at what point should reversals be blocked because the data has already been pushed to ACR? Currently, `sent_to_acr` is a terminal PbN state with no reversal path.

**Confirm with:** IOC OIS (policy), OCOG (operational impact)
**Implementation status:** Built and tested

---

### SCR-10: Cross-NOC duplicate detection — provisionally eliminated

**Status:** OPEN (maps to Open Question #16, TODO-014, TODO-015)
**Provisional decision:** Cross-NOC dedup is **not in v1 scope**. Only within-territory dedup (same org, same NOC = block) and the IOC-Direct reserved-list block remain.
**What was removed:** Detection of the same org applying through multiple NOCs (e.g., Reuters UK + Reuters France). The `isMultiTerritoryFlag` column exists in the schema but is not surfaced in any UI.
**Rationale:** The flat org identity model (Decision #6) treats AP-UK and AP-France as independent records. Cross-NOC flagging requires a policy decision about what, if anything, the IOC should do when the same domain appears in multiple NOC queues.

**What we need decided:**
- Should the IOC or OCOG see a report of organisations that appear in multiple NOC territories?
- If so, what action can they take? (Informational only? Flag to NOCs? Block one submission?)
- Is the `isMultiTerritoryFlag` useful for any downstream process?

**Confirm with:** IOC OIS (policy), OCOG (operational impact)
**Implementation status:** Schema column exists; UI surfacing removed; within-NOC dedup not yet built as separate feature

---

### SCR-11: Dedup "fail open" policy — need explicit sign-off

**Status:** OPEN (maps to TODO-005)
**Provisional decision:** If the dedup check times out at submission time, the application is **accepted** (fail open). An async catch-up job would flag potential duplicates after the fact.
**Alternative:** Fail closed — reject submission on timeout, ask user to retry.

**What we need:** Named decision-maker to sign off on fail-open policy. This has accreditation integrity implications — a duplicate org could flow into ACR if the dedup check fails.
**Confirm with:** IOC Media Operations (policy owner)
**Implementation status:** Dedup timeout handling not yet built; reserved-org block is synchronous and does not fail open

---

### SCR-12: ACR integration scope boundary — where does MRP end?

**Status:** OPEN (maps to TODO-016)
**Provisional decision:** MRP handles EoI + PbN + ENR. Approved org list + per-category slot allocations flow to ACR via structured export. Press by Name (individual journalist accreditation) is entirely in ACR (2027). MRP never handles individual PII (passports, photos).
**What we need confirmed:** When the NOC finishes PbN in MRP and data is sent to ACR, does the NOC then log into ACR to do Press by Name? Or does MRP collect any person-level data for ACR?
**Confirm with:** IOC OIS, OCOG ACR team, D.TEC
**Implementation status:** Export built; ACR adapter stubbed

---

### SCR-13: Common Codes integration — lookup and coding trigger

**Status:** OPEN (maps to Open Question #13, TODO-017)
**Provisional decision:** MRP does not assign Common Codes. When an org is approved in MRP, a downstream process (manual or API-triggered) initiates the Common Codes coding workflow. MRP stores `commonCodesId` once assigned.
**What we need decided:**
- Should MRP look up existing Common Codes at EoI submission time (to pre-fill org data)?
- Should MRP trigger the coding workflow via API on approval, or does OCOG ACR staff initiate it manually?
- What is the lookup API? (Field: org name? Domain? Country?)

**Confirm with:** D.TEC Common Codes team (internal), OCOG ACR staff
**Implementation status:** `commonCodesId` column exists; no lookup or trigger implemented

---

### SCR-14: Freelancer data model — individual vs. collective

**Status:** OPEN (maps to TODO-022)
**Provisional decision:** Freelancers are treated as "org of 1" — each freelancer creates their own org record. The `isFreelancer` boolean flag is captured in the form.
**What we need decided:**
- Are freelancer collectives (multiple freelancers under a shared umbrella) a real use case, or an edge case?
- If collectives exist, should individual freelancers be associated with the collective, or each create their own org record?
- Dedup for freelancers: currently planned as name + country (not domain). Is this sufficient?

**Confirm with:** IOC OIS (policy), OCOG (operational experience from prior Games)
**Also consider getting input from:** NOC administrators who deal with freelancer applications
**Implementation status:** `isFreelancer` flag built; collective model not built

---

### SCR-15: ENR process — remaining open questions

**Status:** MOSTLY RESOLVED; 4 sub-questions open (maps to TODO-023)
**Provisional decision:** Core ENR model is built and confirmed: NOC submits prioritised list → IOC grants from holdback pool → per-org decisions (granted/partial/denied).
**What we need confirmed:**
- (a) Is there a separate deadline for NOC ENR submissions, distinct from the EoI deadline?
- (b) Can a NOC amend their ENR priority list after initial submission to IOC?
- (c) Does the ENR undertaking apply at the org-level request stage, or only when individual names are submitted later?
- (d) Notifications to NOC of IOC grant/denial decisions — in-app, email, or both? (Note: all notification is deferred to v1.0; this is a design question, not a build question)

**Confirm with:** IOC OIS
**Implementation status:** Built and tested

---

### SCR-16: ENR undertaking — legal mechanism

**Status:** NOT STARTED (maps to Open Question #2, TODO-007)
**Provisional decision:** Two paths prepared: Path A (typed name + checkbox + timestamp, build first); Path B (DocuSign-grade e-signature, additive if legal requires it).
**What we need:** Legal review determining which path is legally sufficient. Path A is ~1 day of work; Path B is ~3-4 weeks.
**Deadline:** April 30, 2026 (to inform v1.1 design)
**Confirm with:** IOC Legal
**Implementation status:** Neither path built yet; external Adobe Acrobat process continues for v1

---

### SCR-17: Infrastructure and hosting — EU data residency for v1

**Status:** RESOLVED for v0.1; v1 needs formal sign-off (maps to Open Question #3, #7)
**Provisional decision:** v0.1 = US/Railway/synthetic data. v1 = D.TEC/DGP EU infrastructure.
**What we need:** (a) Formal legal sign-off on D.TEC/DGP EU hosting for v1. (b) Named infrastructure owner. (c) Deployment timeline from D.TEC infra team.
**Confirm with:** IOC Legal (data residency), D.TEC infrastructure team (hosting)

---

### SCR-18: SSO integration — feasibility and timeline

**Status:** UNASSIGNED (maps to Open Question #8)
**Provisional decision:** v0.1 uses email + password (prototype auth). v1.0 replaces with D.TEC/DGP SSO.
**What we need:** (a) Is D.TEC/DGP SSO the confirmed identity provider? (b) What protocol (SAML, OIDC)? (c) Can integration be completed by August 2026? (d) Who provisions admin accounts — IOC, D.TEC, or self-registration?
**Confirm with:** IOC IT, D.TEC
**Implementation status:** Cookie-based HMAC session built; SSO adapter not started

---

### SCR-19: Dashboard filtering and candidate quality signals

**Status:** OPEN (maps to TODO-020)
**Provisional decision:** Basic status filtering is built. Advanced quality signals (org type, category, quota impact, prior Games history, completion rate) are not yet implemented.
**What we need:** IOC OIS to define what signals help NOC and IOC reviewers prioritise applications. This is especially important for large NOCs (USA, GBR) that may receive thousands of applications against a limited quota.
**Confirm with:** IOC OIS (what quality signals matter?), OCOG (what filtering do they need across NOCs?)
**Also consider getting input from:** Large-territory NOC administrators (USA, GBR, GER, FRA, JPN)
**Implementation status:** Basic table with status filter built; advanced filtering not built

---

### SCR-20: NOC/IF setup — ENRS ranking and high-demand event lead

**Status:** OPEN (maps to TODO-021)
**Provisional decision:** These fields are not yet in the system. The NOC/IF setup/profile screen does not exist.
**What we need:** (a) Exact field definitions for ENRS ranking (scale? per-org or per-NOC?) and high-demand event lead (named contact or role?). (b) Where these fields surface in the PbN workflow.
**Confirm with:** IOC OIS
**Implementation status:** Not built

---

### SCR-21: Quota model — two-step separation for all NOC sizes

**Status:** OPEN (maps to Open Question #9)
**Provisional decision:** The two-step separation (EoI approval → PbN slot assignment) is always enforced, regardless of NOC size. A small NOC with 5 applicants and 3 quota slots still goes through the same process as USA with 500 applicants.
**What we need confirmed:** Is this acceptable for small NOCs, or can they combine approval and slot assignment into one step?
**Confirm with:** IOC OIS
**Also consider getting input from:** Small-territory NOC representatives
**Implementation status:** Two-step separation is enforced in code (no slot assignment at EoI approval time)

---

### SCR-22: Quota assignees — INOs and edge cases beyond NOCs and IFs

**Status:** PARTIALLY RESOLVED (maps to Open Question #10)
**Provisional decision:** NOCs and IFs are resolved (IFs use same screens as NOCs, Decision #19). IOC-Direct is resolved (Decision #26). INOs (International Non-Governmental Organisations) and other edge-case assignees are not yet addressed.
**What we need:** Are there quota assignees beyond NOCs, IFs, and IOC-Direct? If so, do they follow the NOC workflow or need their own?
**Confirm with:** IOC OIS

---

### SCR-23: Email notification and communication system

**Status:** DEFERRED TO v1.0
**Provisional decision:** No email infrastructure is built in v0.1. All notifications are currently in-app only (URL query parameter success/error messages). The design specifies email notifications at several points:
- Applicant: magic link for form access, confirmation of submission, return-for-correction notice
- NOC: notification of OCOG PbN approval/adjustment, notification of ACR send
- IOC: anomaly detection digest (P2)

**What we need decided:**
- What email provider will v1.0 use? (SendGrid, SES, D.TEC internal?)
- Which emails are mandatory for August launch vs. nice-to-have?
- Does the IOC or D.TEC provide email sending infrastructure, or does MRP self-host?

**Confirm with:** D.TEC infrastructure team, IOC IT
**Implementation status:** Not built; deferred to v1.0

---

### SCR-24: v1.1 scope and October 5 deadline

**Status:** OPEN (maps to TODO-008)
**Provisional decision:** v1.1 ships late September 2026, before October 5 PbN process launch. Planned scope: ACR real-time sync, ENR undertaking in-system, French/Spanish localisation, self-service NOC account registration.
**What we need:** Reality check — can all of this ship in 4 weeks (September 1-25) given unresolved legal reviews (ENR undertaking) and unassigned procurement (translators)? May need to split into v1.1 (ACR sync only, hard October 5 requirement) and v1.2 (everything else).
**Confirm with:** IOC Media Operations, D.TEC leadership

---

### Summary by stakeholder

**IOC Media Operations / OIS (primary contact: Emma):**
SCR-01, SCR-02, SCR-03, SCR-04, SCR-05, SCR-06, SCR-07, SCR-08, SCR-09, SCR-10, SCR-11, SCR-12, SCR-14, SCR-15, SCR-19, SCR-20, SCR-21, SCR-22, SCR-24

**OCOG / LA28:**
SCR-01, SCR-02, SCR-04, SCR-08, SCR-09, SCR-10, SCR-12, SCR-19

**IOC Legal:**
SCR-16, SCR-17

**IOC IT / D.TEC:**
SCR-01, SCR-02, SCR-13, SCR-17, SCR-18, SCR-23, SCR-24

**NOC Administrators (recommend consulting 2-3 large + 2-3 small NOCs):**
SCR-05, SCR-07, SCR-08, SCR-14, SCR-19, SCR-21

---

## Key Dates

| Date | Milestone |
|------|-----------|
| April 2026 | Systems ready and tested |
| July 2026 | IOC imports per-category quota totals per NOC |
| August 24, 2026 | Portal goes live — EoI window opens |
| October 5, 2026 | Press by Number process launches for NOCs |
| October 23, 2026 | Portal closes for new EoI applications |
| December 18, 2026 | Press by Number closes |
| October 14, 2027 | Press by Name launches (via ACR system) |
| February 14, 2028 | Press by Name closes |
| Summer 2028 | LA28 Olympic Games |
