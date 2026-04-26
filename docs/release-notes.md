Created: 21-Apr-2026 10:45 CDT
**Last updated: 26-Apr-2026 19:00 CEST**

# PRP Release Notes

The single source of truth for what has shipped to the LA 2028 Press Registration Portal. Business-facing changes come first; **technical changes are bundled at the bottom and can be skipped by business readers.**

## How this document is organised

- **§0a — 2026-04-26** — most recent release (Strategic Plan alignment + Emma feedback).
- **§0 — 2026-04-21** — Emma's walkthrough fixes to the public EoI form.
- **§1–§12** — capability snapshot since the 17-April baseline release, grouped by area (rename, EoI form, status page, NOC / OCOG / IOC admin, PbN, ENR, Help, etc.).
- **§T1–§T7** — technical changelog (security, migrations, accessibility, CI, refactoring, docs).

Older standalone release-note files for 17-April and 19-April have been archived under `docs/archive/`; everything in them is reflected here.

---

## 0a. 2026-04-26 — Strategic Plan alignment + Emma feedback

Combined release covering two reviews: a cross-check of the IOC Press Accreditation Strategic Plan (Feb 2026 FINAL) against the current PRP, and the changes from Emma Morris's 46 inline comments on the 21-April stakeholder-questions document. Shipped as commit `824faee`.

### Public EoI form (`/apply` + `/applyb`)
- **ENR slot soft warning.** The 3-slot ENR cap is now informational, not a hard error. Values >3 surface an amber message ("The IOC only approves more than 3 ENR slots for certain press organisations") instead of blocking. Hard cap stays at 100.
- **OIAC visa note** added to `/apply/how-it-works`: caveated paragraph describing the OIAC card's intended ≥1-month-before / ≥1-month-after entry and work-permit privilege, with an explicit "subject to LA28 + US authority confirmation closer to the Games" qualifier. EN copy only; FR/ES will follow.

### NOC admin
- **EoI queue priority sort.** New "IOC suggested priority" sort option alongside "Most recent submission". Orders applications by `org_type` priority per Strategic Plan §1.6 (national news agency → national sports agency → general daily → sports daily → specialist outlet → general magazine). Guidance, not enforcement — NOC retains discretion.
- **Government `.gov` soft-warn flag.** Applications whose contact, secondary, or organisation email lands on a `.gov` / `.gov.*` domain now display an amber "Eligibility flag" banner in the review drawer. Accept-as-Candidate requires the NOC to tick an "I confirm this isn't a government ministry" checkbox; server enforces the same gate. Per Strategic Plan §1.3.
- **Direct Entry category access scopes.** Each accreditation category in the Direct Entry form now shows its access scope inline (E = ALL competition venues, Es = own sport only, EP = ALL venues, EPs = own sport only, ET = ALL venues no seating, Ec = MPC only). Footer note clarifies that NOC E and NOC Es are allocated to the NOC's own communications-staff record on the PbN screen.
- **Cancel PbN entry.** New "Danger zone — Cancel PbN entry" section in the PbN org detail modal. Available only while the allocation is editable (`draft` or `noc_submitted`); the action removes the allocation row, marks the underlying application `cancelled` for Direct-Entry-sourced orgs, and is audit-logged as `noc_pbn_cancel`.
- **Help page additions:** new "IOC suggested allocation hierarchy" section explains the priority order; new "Ineligible organisations" section enumerates the §1.3 ineligibility list (publishers, marketing, athlete management, advertising/PR/promotion agencies, commercial partners, government ministries).

### IOC admin
- **NOC Es category in IOC Quotas.** New `NocEs` column on the read-only and edit views of `/admin/ioc/quotas`. CSV import supports both 7-column (legacy) and 8-column (with NOC Es) formats. All NOC Es edits are logged.
- **IOC-Direct ENR path.** New page at `/admin/ioc/enr/direct` lets the IOC add ENR organisations directly without NOC mediation — for international-focus non-MRH orgs like CNN, Al Jazeera, BBC World, ESPN. Form collects org name, contact first/last name, email, address, phone, and slot count. Records use `nocCode = IOC_DIRECT` and surface in the existing cross-NOC ENR review screen alongside NOC-nominated requests.

### Cross-cutting
- **INO terminology fix.** Throughout docs, schema descriptions, and the org-type label, the abbreviation INO now expands to "International News Organisation" (corrected from the misreading "International Non-Governmental Organisation"). The `ino` schema enum value is unchanged.
- **Date sweep.** The EoI window opening date is now stated as 31 August 2026 (not 24 August 2026) across all documents and UI copy.

### Schema
- Migration **`0027_noc_es_category.sql`** — adds `noc_es_total` to `noc_quotas` and `noc_es_slots` to `org_slot_allocations`. Both default to 0 for back-compat.
- Migration **`0028_audit_action_noc_pbn_cancel.sql`** — adds `noc_pbn_cancel` to the `audit_action` enum.
- ACR adapter type extended with `nocEsSlots`.

### Coming next (deferred)
- LA28 cross-RO change feed at `/admin/ocog/changes` (depends on §4.3 master-status decision).
- IOC review + flag surface (parity with OCOG) and the OCOG/IOC → NOC return-flow mechanic (depends on §2 reframe).
- Removing the publish/unpublish gate from the actual `/admin/noc/queue` and `/admin/ocog/eoi` flows (same dependency).
- Multi-select sport picker on EoI for Es / EPs (depends on §1.2 sub-question).
- Spanish v0.9 i18n bundle (`/apply` + applicant emails) — depends on UI copy finalisation and transactional email infrastructure.
- IOC-Direct ENR continuous-update feed to LA28 (depends on §4.3).
- PbN mandatory field set enforcement at `noc_submitted` transition (depends on Martyn's confirmation of the official LA28 PbN field set).

### Awaiting external input
- IOC-rewritten introduction / how-it-works copy (interim banner shipped 2026-04-21).
- IOC-Legal-blessed privacy notice wording.
- Martyn's official LA28 Press by Number form (interim spec is Emma's MiCo26 reference: first name, last name, company, email, website, address, phone).
- IOC rewrite of the NOC E nomination tip text on §1.5.
- IOC review of the post-submit confirmation message.
- Emma's Discus list of EoI fields needed for IOC ENR allocation decisions.

---

## 0. EoI Form — Emma 2026-04-21 walkthrough fixes

Applied the full set of copy, validation, and UX fixes Emma Morris (IOC Media Ops) flagged during her 2026-04-21 walkthrough of the public `/apply` flow. Changes land on both `/apply` (legacy 5-tab) and `/applyb` (new 3-step wizard) unless noted.

**Terminology (site-wide):**
- "Media Accreditation" → "Press Accreditation" in page titles, landing headings, footer, and the `/invite/[token]` landing.
- "Media outlet" helper on the email gate → "press organisation outlet".

**Entry page:**
- "Already have a reference number? Contact your NOC directly." → "Already submitted? [Check your application status](/apply/status)" — links directly into the status lookup instead of punting to the NOC.

**Per-tab validation:**
- Clicking **Continue** now validates required fields for the current tab/step. Missing fields surface in the existing validation modal and inline error styling. Final-submit validation unchanged (kept as belt-and-braces).

**How-it-works page:**
- Fixed the "Ready to apply" CTA so it routes into `/apply/form` (session-aware) instead of bouncing users back to the email gate.
- Added an amber "subject to IOC review" banner until Emma delivers the approved intro copy.

**Organisation step:**
- Replaced the Non-MRH conditional info box with Emma's verbatim wording (olympics.com reference, IOC consultation requirement, no automatic NOC quota).
- "Type of media" → "Type of Non-MRH — either Radio, TV or Other".
- Removed the "documentary production company" example from the "Other org type" field (IOC does not accredit).
- NOC help text updated to Emma's verbatim guidance on choosing the correct NOC.
- **Country dropdown now filters to countries with a mapped NOC** (`COUNTRY_CODES_WITH_NOC` in `src/lib/codes.ts`). Removes ~55 non-NOC territories that previously appeared but had no NOC selectable next to them.

**Contacts step:**
- Added helper paragraph under Primary Contact explaining this will be the accreditation contact person.

**Accreditation step:**
- Category descriptions for Es, EP, EPs, Ec, ET, and ENR rewritten to match Emma's IOC-approved wording.
- Removed the "max 3" badge next to the ENR card (the body text already states it).
- **ENR category gated to Non-MRH organisations only.** UI disables the ENR request input for any other org type; server rejects a submitted ENR request > 0 unless `org_type = non_mrh` (new `enr_non_mrh_only` error code).

**Publication step:**
- Removed the duplicated intro line on the `/apply` wrapper (the shared fields component already renders it).
- Added a red-highlighted "If applying for ENR accreditation, please select the type of programming." prompt above the ENR programming field.
- Social-media-accounts label rephrased to "Please list the social media accounts of the organisation".

**Submit confirmation modal:**
- Redesigned the Organisation / Categories / Contact summary block with clear vertical spacing and uppercase stacked labels.
- "Categories" → "Press Accreditation Categories".
- Each category is now shown with its requested slot count (e.g. "E (3), Es (1), ENR (2)"), not just the code letter.

**Confirmation email (preview):**
- Subject: "Expression of Interest received – LA 2028 Press Accreditation".
- Body opens with Emma's verbatim thank-you and the key clarification that all further communication will come from the NOC, not the IOC or LA28 OCOG.

**Post-submit UX:**
- Refreshing `/apply/submitted` (which drops the `ref`/`email` query params) previously redirected to `/apply`, appearing to Emma as "redirected to applying again". It now redirects to `/apply/status` so the user lands on a page that acknowledges they have an application. Same fix for `/applyb/submitted`.

---

## 1. Product Rename — MRP → PRP

The system has been renamed from "Media Registration Portal" to **Press Registration Portal (PRP)** throughout. Visible changes:

- All user-facing page titles and headings
- Documentation (CLAUDE.md, DESIGN.md, PRP-rq, PRP-design-confirmation)
- Public URL moves from `mrp.dgpbeta.com` to `prp.dgpbeta.com`

---

## 2. Expression of Interest (EoI) — Public Form

### 2a. Field set aligned to Emma's April 2026 Excel spec

Both the existing 5-tab `/apply` form and a new parallel 3-step wizard at `/applyb` now collect the same field set, matching the IOC's source-of-truth spreadsheet.

**New required fields** (both flows): website, address, city, postal code, organisation phone, organisation email, contact title, contact cell.

**New optional fields:** Editor-in-Chief block (first name, last name, email — optional for freelance org types), Non-MRH media type sub-dropdown (TV / Radio / Other), organisation phone, GDPR consent checkbox, ENR added as a 7th accreditation category (max 3 slots).

**Expanded organisation types:** print media, press agency, photo agency, editorial website, sport specialist (website / print / photographer), photographer, freelance journalist, freelance photographer, non-MRH. Legacy values remain valid on existing applications.

**Removed fields:** publication types list, sports-to-cover, sport-specific sport picker, accessibility needs, prior Paralympic questions, separate secondary-contact group, contact phone.

**Moved:** Press Card question moves from the Organisation tab to an "Additional Questions" tab.

### 2b. Organisation tab

- Organisation email address — optional field
- "Other (please specify)" organisation type with a required free-text field
- Freelancer / independent as its own type with a required Press Card question and issuing-organisation field when "Yes"
- Sport-specific journalism (Es / EPs) requires selecting the specific Olympic sport from the full LA28 sports list
- Resubmission / edit prefill restores all new fields

### 2c. Contacts tab

- Secondary contact section renamed to "Editor-in-Chief / Media Organisation Manager (Optional)"
- Toggle reads "Add Editor-in-Chief / Media Manager"
- Helper copy: "The Editor-in-Chief or Media Manager who oversees the accredited team at your organisation"

### 2d. Publication tab

- Online unique visitors per month — optional text field
- Geographical coverage — dropdown (International / National / Local / Regional)
- Social media accounts — optional textarea
- **At least one publication type must be selected** (red asterisk, green completion dot, validation-modal routing)

### 2e. Accreditation tab

- Coverage description renamed to "Brief description of your coverage plans for Los Angeles 2028" with a 500-character limit and live counter
- All E / Es / EP / EPs / ET / EC quantity inputs enforce `max = 100`; ENR organisations limited to `max = 3`
- ENR programming-type conditional textarea (required when organisation type is ENR)

### 2f. Form behaviour fixes

- Continue on the Publication tab no longer triggers the submit modal. Two defences (distinct React keys on Continue vs Submit, plus a `data-eoi-submit="final"` marker read by the submit handler) mean only the final tab's Submit can fire a real submission.
- Form detached from the server action. `submitApplication` runs imperatively on confirm, so Enter-key, autofill-triggered, and extension-synthesised submits can no longer reach the server.
- History tab receives a green completion dot as soon as it is visited.
- Accreditation-tab completion dot appears immediately when required fields are filled (previously only after leaving and returning).
- Confirm Submission modal lists the actual requested categories.
- URL / website inputs show `https://` pre-populated; a bare `https://` is treated as empty.

### 2g. Parallel 3-step wizard at `/applyb`

Added for stakeholder review alongside the existing 5-tab form at `/apply`. Same field set, same validation, same persistence — the two flows differ only in presentation (stepper with live save indicator vs tabbed). Cross-link banners let a reviewer jump between them.

### 2h. French localisation

The public EoI form is available in French via an EN | FR toggle in the form header. All labels, placeholders, validation errors, buttons, and informational panels are translated; the selected language persists for the session. Admin portal remains English only.

### 2i. 90-day applicant status token

Applicants now receive a 90-day status token instead of a short-lived one. They can return to `/apply/status` without re-authenticating through October. Admin sessions remain at 8 hours.

---

## 3. Applicant Status Page

- Status is masked as "pending" until the OCOG publishes PbN results, so communications are batch-released consistently.
- Applications returned for corrections continue to show their actual status regardless of the publish flag.
- Read-only application view added: an applicant with a pending application can view (but not re-edit) their submission via their access link.
- `/apply/submitted` now requires **both** reference number and email — landing there with a reference alone redirects to `/apply`, closing a reference-number-enumeration surface.

---

## 4. NOC Admin

### 4a. Direct Entry (formerly Fast Track)

- Renamed throughout from "Fast Track" to "Direct Entry"
- URL moved to `/admin/noc/direct-entry`
- Sport picker surfaces when Es or EPs is selected
- Editor-in-Chief / Media Manager section available in Direct Entry
- Website field pre-populated with `https://`
- No limit on Direct Entry records per NOC; no secondary approval required; audit log is the governance mechanism

### 4b. Review queue — drawer and duplicate detection

Applications open in a slide-over drawer rather than requiring full-page navigation:

- All sections inline: Organisation, Contacts, Accreditation, Publication, History, Audit trail
- Prev / Next navigation within the queue (keyboard: ← →, Escape to close)
- All approve / return / reject / un-approve / reverse-rejection actions available inline
- "Open full page ↗" link for the detail view
- New EoI fields surfaced in both drawer and full review page

The **Possible Duplicate** badge in the queue is now a clickable button; clicking it opens a side-by-side comparison modal. Queue rows are no longer fully clickable — only the org name and Possible Duplicate badge trigger actions (fewer accidental navigations).

**Multi-signal duplicate detection** — a pair is flagged when any of four signals fires:

| Signal | Rule |
|---|---|
| Email domain | Same email domain within the NOC |
| Contact email | Same contact email address within the NOC |
| Website domain | Same website hostname (www. stripped) within the NOC |
| Org name + country | Normalised organisation name and country both match within the NOC |

**Comparison modal improvements:**

- Plain-English signal banner ("Flagged: same email domain · same website")
- Matched fields highlighted in green (evidence of match), divergent fields in yellow
- Website row added to the comparison table
- Inline Reject and Return for correction — actionable from the modal with a required note; status updates immediately; modal stays open so both sides of the pair can be handled in one session

Rejected applications are **excluded** from duplicate detection. An org that is rejected and then re-applies is not flagged as a duplicate of its own rejection.

### 4c. Other NOC admin changes

- Invite Org — country field defaults to the NOC admin's own country (changeable)
- Application status "Approved" renamed to "Candidate" — reflects that approval at EoI stage is candidacy, not final accreditation
- Un-reject action — NOC admins can reverse a rejection, moving the application back to pending (required note, audit-logged, blocked once ACR export has occurred)
- 10-application-per-email submission limit enforced
- Settings tab removed — replaced by OCOG-controlled EoI Windows (see 5a)
- NOC admins can no longer set their own EoI window open / close dates; read-only banner describes the current window status
- NOC / OCOG window copy clarified to make it explicit that only the OCOG sets the EoI window

### 4d. Invite flow — email preview

The invite detail page renders a full draft email preview directly below the copyable invite link, plus a `mailto:` button. Admins see exactly what the invitee will receive (subject, body, organisation, contact name, expiry, access code) before sending. No transactional mail is sent server-side; the admin remains the authoritative sender.

---

## 5. OCOG Admin

### 5a. EoI Windows tab

New **EoI Windows** tab at `/admin/ocog/windows`:

- Per-NOC Open / Close toggle with last-changed timestamp
- Bulk Open All / Close All actions
- Open-vs-closed summary count
- All changes logged to the audit trail
- Copy clarifies that only the OCOG sets the EoI window; NOC admins see a read-only banner

### 5b. EoI summary and drill-down

- **EoI Summary** view at `/admin/ocog/eoi` shows application counts by NOC and status (pending, candidate, returned, rejected) as a pivot table. All 206 registered NOCs are listed.
- NOC code search / filter box.
- NOC rows are clickable and drill into a read-only list of that NOC's applications.
- CSV export covers all 57 form fields (previously missed address, contact details, secondary contact, and several others).

### 5c. Potential duplicates panel

New **Potential Duplicates** panel at `/admin/ocog/duplicates`:

- **Cross-NOC duplicates** — organisations with the same email domain accredited under 2+ different NOCs
- **Within-NOC duplicates** — NOCs with 2+ organisations sharing the same email domain

### 5d. PbN results publishing toggle

OCOG can publish / unpublish Press by Number results from the OCOG dashboard. When unpublished, applicants see a neutral "pending" status rather than their actual outcome.

---

## 6. IOC Admin

### 6a. Master Allocation Dashboard redesign

The Master Allocation Dashboard (`/admin/ioc/master` and `/admin/ocog/master`) has been restructured. IOC and OCOG admins share the same live view.

- **Table layout:** quota (Q) and allocated (A) columns are now adjacent per category across all seven categories (NocE, E, Es, EP, EPs, ET, EC), followed by Total Q, Total A, and Δ Remaining. Δ turns red when a NOC is over-quota. "Allocated" is the sum of slot allocations in any state (draft / submitted / approved); the allocation state is surfaced separately via the row's Status badge.
- **Continent column** (Africa / Americas / Asia / Europe / Oceania) shown by default, hidden via toggle.
- **Grand totals banner** now shows each category individually (quota and allocated), replacing the previous grouped Press / Photo totals.
- **Capacity tracker** progress bar shows distributed (NOC + IF + IOC Direct quotas), IOC holdback, total committed, and capacity target (default 6,000). Colour-coded: green < 95 %, amber 95–100 %, red over capacity.
- **Event settings** on the IOC Quotas page let IOC admins configure event capacity (default 6,000) and IOC holdback (default 0).
- **IF section** replaces the previous placeholder; IF entities appear below NOC rows.
- **Expandable org-level rows** (▶) show the individual organisations each entity has allocated slots to, per-category counts and allocation state.

### 6b. ENR IOC review — cross-NOC combined view

The IOC ENR screen is now a **cross-NOC combined view**:

- Sortable table showing all ENR applications across all NOCs in a single list
- Configurable pool size banner with a progress bar against the configured pool
- Inline slot grant editing — IOC admins adjust slot counts directly in the table

### 6c. Feature-flag admin UI deferred

IOC admins no longer see the feature-flag management capability. Three layers are closed off:

- The "Flags" tab is removed from the IOC nav
- Both page handlers (list + detail) return `notFound()` for any direct URL navigation
- All six feature-flag server actions reject with `notFound()`

The original implementation is preserved in git history for restoration when re-enabling behind a dedicated DTEC.SYSADMIN role.

---

## 7. Press by Number (PbN)

- **NocE (Press Attaché)** quota visible in the OCOG PbN review page with an editable slot count and a teal-highlighted row
- **Totals column** added to the allocation table
- **All six category quota bars always shown** (no longer hidden when quota = 0)
- Category labels use correct mixed case: E, Es, EP, EPs, ET, EC
- **Org-detail view** available within the PbN allocation table
- **Offline workflow**: export a pre-populated CSV (current quota + org list), complete offline, reimport via file upload or clipboard paste. Reimport is full-overlay; partial updates are not supported. Import is rejected if it would exceed the NOC's quota.

---

## 8. ENR (Extended Non-Rights Broadcasters)

- **Self-application** via the public EoI form — ENR is a selectable org type on `/apply`
- **NOC priority ranking panel** (rank 1–99) replaces the standard Accept-as-Candidate action for ENR applications in the NOC queue
- **IOC cross-NOC combined view** with a configurable pool size banner and inline slot grant editing (see 6b)

---

## 9. Help & Guide

Each admin role now has a dedicated Help & Guide page, linked from a `? Help` link in the top-right of every admin page:

- **NOC** (`/admin/noc/help`) — Overview, workflow timeline, key screens, Direct Entry explained, FAQ
- **OCOG** (`/admin/ocog/help`) — EoI summary, PbN approvals, EoI windows, duplicates, master allocations, audit
- **IOC** (`/admin/ioc/help`) — Master allocations, quotas, IOC Direct, ENR review, audit

Each page has a sticky table-of-contents sidebar; the Help link opens at the section corresponding to the currently active tab.

---

## 10. New Organisation Types

- **INO** (`ino`) — International News Organisation
- **IF Staff** (`if_staff`) — International Federation Staff

Selectable in IOC Direct Entry and surfaced in relevant admin views.

---

## 11. Additional Information Field

The free-text field on the History tab previously labelled "Additional comments" has been relabelled to **"Additional information requested by your NOC"** to better reflect its purpose. The field accepts unstructured text and is visible to NOC admins in the review drawer.

---

## 12. CSV Export (EoI)

The EoI CSV export now includes eight additional columns: Org Email, Org Type Other, Online Unique Visitors, Geographical Coverage, Social Media Accounts, Press Card, Press Card Issuer, ENR Programming Type.

---

# Technical Changes

*Note for business readers: the sections below cover internal engineering changes that do not affect how you use the system. You can stop reading here.*

## T1. Security hardening

- **CSP nonces** — middleware generates a unique nonce per request and injects it into `script-src`, replacing the previous `'unsafe-inline'` allowance.
- **CSP `style-src` tightened** — no longer ships with `'unsafe-inline'`; all inline styles now flow through the nonce-based CSP.
- **HTTP Strict Transport Security** — `max-age=63072000; includeSubDomains; preload` added to all responses.
- **Cookies default to `Secure: true`** — session and CSRF cookies ship as Secure. Local HTTP development opts out by setting `ALLOW_INSECURE_COOKIES=true`; any other value (empty, `false`, `0`, whitespace) fails secure.
- **`NEXTAUTH_URL` fails secure in production** — the base-URL helper now throws if unset rather than silently falling back to a dev default.
- **Token generation bias-free** — `generateToken` previously used `byte % CHARSET.length` (CWE-327); it now uses rejection sampling so every character of the 31-character charset is equally likely.
- **Export API status param** — the `status` query parameter on `/api/export/eoi` is validated against an explicit allowlist; unrecognised values return 400.
- **Website URL validation** — submitted URLs are validated against a `https?://…` pattern before storage; malformed URLs are treated as empty.
- **Invite NOC mismatch guard** — if an invitation's NOC code does not match the applicant's selected NOC, submission is rejected.
- **Invite ID trust** — `invite_id` is now looked up server-side by the applicant's email; client-supplied invite IDs are no longer trusted.
- **`/apply/submitted` email + reference match** — DB query matches on both columns; mismatched or missing email redirects to `/apply`.

## T2. Database migrations

- **Migration 0020** — new `event_settings` table storing `capacity` and `ioc_holdback` per event.
- **Migration 0022** — `noc_quotas.entity_type` column distinguishes `'noc'` from `'if'` rows.
- **Migration 0026** — `org_type` enum adds `print_media`, `press_agency`, `photo_agency`, `editorial_website`, `sport_specialist_website`, `sport_specialist_print`, `sport_specialist_photographer`, `photographer`, `freelance_journalist`, `freelance_photographer`, `non_mrh`. Legacy enum values retained for existing rows. `applications` table gains `editor_in_chief_{first_name,last_name,email}`, `org_phone`, `non_mrh_media_type`, `non_mrh_media_type_other`, `category_enr`, `requested_enr`, `gdpr_accepted_at`.
- All eight new EoI form fields are persisted.

## T3. Accessibility

- WCAG AA contrast failures cleared on admin pages
- Disabled paginator arrows raised from `text-gray-300` (1.33:1) to `text-gray-600` (~7.5:1)
- `sr-only` span added to Actions column header to satisfy axe empty-table-header rule
- Skip-to-main-content link, associated labels, and focus rings standardised to brand blue

## T4. Test infrastructure

- Vitest config migrated to ESM to unblock test runs on Next.js 16's stricter module resolution
- `lib-env` tests now use `vi.stubEnv` / `vi.unstubAllEnvs` to satisfy strict typecheck without reaching into `process.env` directly
- Structural invariant tests extended to cover the Continue / Submit React-key race and the `data-eoi-submit` handler check
- E2E (Playwright) coverage broadened across public, NOC, OCOG, IOC flows plus accessibility audits

## T5. CI / deployment

- **Railway post-deploy E2E workflow** added (`e2e-deployed.yml`) — triggers on push to main, waits for Railway to deploy the new commit (`/api/health` SHA check), then runs the Playwright suite against production.
- **`RAILWAY_GIT_COMMIT_SHA`** baked into the Next.js bundle at build time and written to a JSON file for the health endpoint.
- **Railway health check is version-aware** so the E2E workflow can confirm the deployed SHA before testing.
- Empty `RAILWAY_PRODUCTION_URL` is guarded; curl URL is quoted.
- CSP middleware restored for Edge runtime compatibility (`btoa` used instead of Node `Buffer`).

## T6. Refactoring / internal cleanup

- Shared address and form-style helpers centralised (`formatAddress`, form-style tokens)
- Org / publication / geographical / audit label maps centralised under `src/lib/` (`ORG_TYPE_LABEL`, `PUB_TYPE_LABEL`, `GEO_COVERAGE_LABEL`, `ACTION_LABEL`, `ACTION_BADGE`)
- `brand-blue` token centralised; Inter font loaded consistently
- Lucide icons adopted; banner radius standardised
- Loading skeletons for 30 routes (23 admin, 7 applicant)
- Public application flow made mobile-responsive
- `"use client"` removed from i18n index so `makeT` works in server components

## T7. Documentation

- Release notes (this document) consolidated into a single file; the prior dated files (`release-notes-2026-04-17.md`, `release-notes-2026-04-19.md`) are preserved under `docs/archive/`
- PRP-rq (requirements) reflects current state of the solution; open questions moved to `docs/input and feedback/stakeholder-questions-21-April-2026.md`
- PRP-design-confirmation regenerated with April 17 decisions
- Role-permissions documented (`docs/role-permissions.md`)
- Stakeholder materials reorganised

---

# Deployment

Every change above is on `main` and has rolled (or will roll) through Railway production via the automatic deploy on push. Verification is gated by the `e2e-deployed.yml` workflow.
