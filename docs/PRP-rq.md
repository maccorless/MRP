**Last updated: 21-Apr-2026**

**Version:** 0.9 (draft) \| **Date:** 2026-04-21 \| **Status:** DRAFT — reflects the current state of the solution through the April 17–21 decisions. Open items are tracked in the separate stakeholder-questions document, not in this file.

# Document Introduction

## Purpose

This document describes the committed functional, non-functional, and operational requirements for the LA28 Press Registration Portal (PRP). The PRP is the digital platform through which media organisations express interest in press accreditation for the LA28 Olympic Games, National Olympic Committees (NOCs) and International Federations (IFs) manage and allocate their assigned quotas, and the Organising Committee (OCOG) formally approves those allocations for transfer to the ACR accreditation system.

This document describes the solution's committed end state for LA28 — the capabilities that must be in place to support the business needs on the timelines agreed to. Delivery is iterative and the working design record (PRP-design-confirmation.md) tracks interim sprint outcomes; this document is the structured, signable requirements baseline.

## Document Ownership

| Role | Name / Organisation |
|---|---|
| KPD Owner | Ken Moore, Deloitte Olympic Technology (D.TEC) |
| IOC Reviewer | Emma Morris, IOC Media Operations |
| OCOG Reviewer | Martyn (LA28 Accreditation Lead) |
| Approvers | IOC Media Operations, LA28 / OCOG |
| Target Audience | IOC Media Operations, LA28/OCOG, D.TEC development team, NOC/IF representatives |

## Open Items

This document describes the **current state of the solution**. Open stakeholder questions are no longer tracked here — they live in:

> **`docs/input and feedback/stakeholder-questions-21-April-2026.md`** (and the corresponding `.docx` in `docs/archive/`)

That document has two parts:

- **Part 1** — open questions that need a decision at the next stakeholder meeting (notably 4.4b NOC Direct Entry / Inline PbN Entry alignment, 2.5 EoI close and ACR push mechanics, 6.1 RACI confirmation, 6.4c French admin scope, 5.2 ENR undertaking location, 2.3b EoI queue filter sufficiency).
- **Part 2** — resolved items awaiting a walkthrough confirmation meeting.

Where an open question affects a requirement in this document, the requirement text carries a cross-reference (e.g. "see 4.4b in stakeholder-questions-21-April-2026") so the read-across is explicit.

Two architectural disputes resolved at the April 15/16/17 meetings — and reframed on 2026-04-26 — are built into the body of this document rather than flagged in this preamble:

- **Three-role review model (reframed 2026-04-26 per Emma #2, #23, #73, #77, #78).** IOC enters per-category quota totals directly. **NOC = arbiter** of per-org slot allocations within its assigned quota. **OCOG = coordinator + safety-net reviewer** (ingests NOC submissions, coordinates downstream services, flags issues back to the NOC). **IOC = compliance reviewer** (focused on which orgs are accredited, not per-category counts). Neither OCOG nor IOC approves individual orgs unless an issue is found. The previous OCOG publish/unpublish gate on applicant outcomes has been removed. See FR-009, FR-013, FR-019.
- **ENR front door:** ENR organisations self-apply via the public EoI form; NOCs prioritise; IOC grants from a configurable holdback pool. The NOC remains the Responsible Organisation for ENR orgs through Press by Name and downstream services. See FR-022 to FR-025.

## Target Audience

Three primary reader groups:

- IOC Media Operations — to confirm the portal accurately reflects the press accreditation process and to identify any gaps.
- LA28 / OCOG — to confirm the OCOG approval workflow, cross-NOC visibility, EoI window control, and PbN state machine.
- D.TEC Development Team — as the authoritative requirements baseline for sprint planning and delivery.

NOC and IF representatives should review Sections 3–5 to validate that the NOC/IF dashboard workflows match how they operate in practice.

# Application Introduction

## Overview

The LA28 Press Registration Portal (PRP) is a dedicated web application built by Deloitte Olympic Technology (D.TEC). It manages the end-to-end process of media press accreditation requests for the 2028 Olympic Games in Los Angeles, replacing the current Excel-based workflow.

The PRP is the single point of entry for all media accreditation expressions of interest. It serves three workflows, all running through the same portal:

- **Expression of Interest (EoI)** — public-facing form for media organisations to apply for press accreditation through their NOC or IF (August–October 2026).
- **Press by Number (PbN)** — NOC/IF quota allocation and OCOG formal approval workflow (October–December 2026).
- **Extended Non-Rights Broadcasters (ENR)** — self-application via the EoI form followed by NOC prioritisation and IOC grant from a configurable holdback pool, running in parallel with EoI/PbN.

## Problem Statement

The current press accreditation process is managed through Excel spreadsheets emailed between the IOC, NOCs, and OCOG. Three parties suffer:

- **IOC Media Operations**: they allocate quotas to 206 NOCs but have zero visibility into what NOCs do with those quotas. Disputes cannot be investigated without audit trails.
- **NOC press accreditation managers**: Excel templates emailed back and forth. Multiple file versions, no deduplication, no audit trail.
- **OCOG ACR staff (LA28)**: submissions from 206 NOCs reconciled manually. Entirely manual, no tooling.

For LA28 2028, the IOC has committed to launching a dedicated Press Registration Portal. This has been announced to all NOCs. The portal must be live by 31 August 2026.

## Vision

The PRP is designed to persist as an IOC-owned media credentialing platform across every Olympic and Paralympic Games edition. An accredited organisation from LA28 carries its record forward to subsequent Games. Over time the platform becomes the IOC's global directory of legitimate press organisations — the single source of truth for Olympic press identity worldwide.

## Process Overview

### Process 1 — Expression of Interest (EoI)

August – October 2026. A media organisation submits a structured application listing the accreditation categories it is seeking. The NOC (or IF, for its sport) reviews each application and makes an eligibility decision: Accept as Candidate / Return (with note) / Reject. Output: a candidate list of media organisations per NOC, tagged by E-category. Primary owner: NOC/IF. OCOG and IOC have read-only visibility; OCOG additionally controls the global window open/close date.

### Process 2 — Press by Number (PbN)

October – December 2026. The NOC takes its candidate org list and assigns per-category quota slots to each org, within its IOC-assigned per-category totals. **The NOC is the arbiter** of per-org slot allocations (revised 2026-04-26 per §2 reframe). The OCOG ingests the NOC submission, coordinates downstream services (accommodation, rate card, SEAT, ACR enrolment), and flags issues back to the NOC if anomalies are found. The IOC reviews submissions for compliance with eligibility rules (which orgs are accredited). Neither OCOG nor IOC approves individual orgs. Approved allocations are exported to ACR once the OCOG marks them "received and clean". Primary owner: NOC. OCOG: coordinator + safety-net reviewer. IOC: compliance reviewer.

### ENR Track — Extended Non-Rights Broadcasters

Parallel to the EoI/PbN window, entirely within the PRP. An ENR organisation self-applies via the public EoI form by selecting ENR as its organisation type. Its application appears in the NOC's ENR prioritisation view (priority rank 1–99), not the standard candidate queue. The NOC submits a ranked list to the IOC. The IOC grants slots from a configurable holdback pool (default 350). Per-category E-quotas are unaffected by ENR grants.

## System Architecture

Two-system boundary:

- **System 1 — PRP (this system):** public EoI form, NOC/IF/OCOG/IOC dashboards, PbN allocation and approval, ENR prioritisation and grant, quota management, audit trail.
- **System 2 — ACR (LA28 accreditation platform):** Common Codes org registry, Press by Name individual accreditation (Phase 2, 2027).

Technology stack: Next.js App Router (server components, server actions), Drizzle ORM, PostgreSQL, Tailwind CSS, shadcn/ui. Auth: magic link plus 90-day status token (applicants); D.TEC/DGP SSO with MFA (admin roles). Deployed on D.TEC/DGP infrastructure. Adapter pattern for ACR integration.

# User Roles and Personas

| Role | Primary Process | Permissions and Actions |
|---|---|---|
| Applicant (media organisation) | EoI submission | Submits own application via public form. Views own application status. No account required — email verification via magic link; 90-day status token after submission. |
| NOC Admin | EoI review + PbN allocation + ENR prioritisation | Sees own territory only. Accepts (as Candidate) / returns / rejects EoI applications. Invites known organisations. Adds known organisations via Direct Entry. Allocates per-category slots in PbN. Prioritises and submits ranked ENR list. Nominates NOC communications staff (NOC E). |
| IF Admin | PbN allocation + ENR prioritisation | Uses the same screens as NOC admin. No public EoI queue — IFs bring organisations in via the invited-org flow or Direct Entry only. Allocates per-category slots. Submits ranked ENR list. |
| OCOG Admin (LA28) | PbN coordination + EoI window and dedup oversight | Cross-NOC access. Ingests NOC/IF PbN submissions and marks them "received and clean" (or returns to NOC with flagged issues); does not approve individual orgs (revised 2026-04-26 per §2 reframe). Coordinates downstream services (accommodation, rate card, SEAT, ACR enrolment). Controls the global EoI window open/close date with per-NOC overrides. Reviews cross-NOC duplicates. Read-only visibility on EoI content. |
| IOC Admin | ENR grant + quota-setting + IOC-Direct + sudo + compliance review | Read-only visibility on EoI and PbN for all NOCs/IFs. Sets per-category quota totals per NOC/IF (including NOC Es). Reviews PbN submissions for compliance with eligibility rules and flags concerns to NOC; does not approve individual orgs (revised 2026-04-26 per §2 reframe). Reviews and grants ENR requests from the holdback pool, including via the IOC-Direct ENR path. Manages IOC-Direct reserved org list and acts as Responsible Organisation for those orgs (NOC-equivalent workflow under the `IOC_DIRECT` code). Configures event capacity and holdback. Sudo impersonation mode (read-only). |
| IOC Readonly | Visibility only | Same read-only visibility as IOC Admin. Cannot write data. Cannot use sudo. |

# Functional Requirements — Expression of Interest (EoI)

### PRP-FR-001 — Public EoI form for media organisation self-nomination

**Description.** The PRP provides a public-facing, multi-tab application form allowing media organisations worldwide to express interest in press accreditation for LA28. No account is required. Email verification via magic link is required before submission. The form auto-saves via browser local storage to prevent data loss. The public form is available in English and French via an EN|FR toggle.

**Acceptance criteria.**
- Form accessible at a public URL (`/apply`) without login.
- Applicant receives email verification link before submission.
- Form auto-saves locally (500ms debounce, keyed by email).
- Per-tab completion indicators displayed; green dot appears immediately on field completion.
- Completed submission assigned a unique reference number (e.g. `APP-2028-USA-00051`), managed via per-NOC sequence counters.
- Maximum 10 submitted applications per email address, enforced at submission.
- EN|FR language toggle available on all form pages.

### PRP-FR-002 — EoI form fields (5-tab structure)

**Description.** The EoI form captures data across five tabs: (1) Organisation — org name, organisation type (including INO, IF Staff, ENR), country, NOC code, website, address, freelancer press-card flag, organisation email, "other" org type free-text reveal; (2) Contacts — primary contact and optional secondary contact (Editor-in-Chief / Media Manager) with full name, title, email, phone, cell; (3) Accreditation — E-category multi-select with requested quantity per category, coverage description (500-character limit with live counter), geographical coverage, accessibility needs flag, Es/EPs sport picker when those categories are selected; (4) Publication — publication type checkboxes (13 types plus Other), circulation, online unique visitors, social media accounts, frequency, sports to cover, ENR programming type when ENR is the org type; (5) History — prior Olympic/Paralympic accreditation by edition (Sydney 2000 through Paris 2024), past coverage examples, additional information requested by the NOC (free text).

**Acceptance criteria.**
- All required fields validated before submission.
- Country field auto-suggests matching NOC code; override supported.
- URL fields pre-populated with `https://`; bare `https://` treated as empty.
- Publication type multi-select includes 13 types plus "Other" free-text reveal.
- Olympic edition checkboxes cover Sydney 2000 through Paris 2024.
- Secondary contact fields are fully optional.
- Accessibility needs flag captured and visible to NOC reviewer.
- Enter key does not submit the form from non-last tabs.
- Publication tab requires at least one publication type for green completion dot.
- Confirm Submission modal lists the actual requested categories.

### PRP-FR-003 — E-category accreditation selection

**Description.** Applicants select one or more of six accreditation categories: E (Journalist), Es (Sport-specific journalist), EP (Photographer), EPs (Sport-specific photographer), ET (Technician), EC (Support staff). Each category includes inline eligibility help. Es and EPs applicants must declare the sport they cover via a sport picker. Applicants enter a requested quantity per selected category, capped at 100 per E-category. For ENR organisations the public form shows a soft amber warning when the requested ENR slot count exceeds 3 ("The IOC only approves more than 3 ENR slots for certain press organisations") but does not block submission (revised 2026-04-26 — soft warn replaces former hard cap). ENR and NOC E are not selectable E-categories on the public form — ENR is an organisation type; NOC E is NOC-nominated in PbN.

**Acceptance criteria.**
- At least one category required to submit.
- Requested quantity captured per selected category with per-category maximum enforced.
- Es and EPs require a sport declaration via the sport picker.
- Multi-category selection creates one application record with multiple category flags.
- NOC E is not a selectable category on the public form.
- ENR organisations select ENR as org type; their E-category selection is constrained to ENR-relevant values.

### PRP-FR-004 — Email verification and security controls

**Description.** Email verification (magic link) is required before application submission. Rate limiting: max 5 token requests per email per hour; max 15 per IP per hour. CAPTCHA on the public form. Email domain blocklist for known disposable providers. Atomic token consumption prevents concurrent double-submission.

**Acceptance criteria.**
- Applicant cannot submit without email verification.
- Rate limit exceeded shows appropriate error.
- Magic link tokens expire after 24 hours (configurable).
- Tokens are one-time-use; replay attacks blocked at DB level.
- CAPTCHA displayed on all public form submission points.
- After submission, applicant receives a 90-day status token to check status without re-verifying email.

### PRP-FR-005 — OCOG-controlled global EoI window

**Description.** The OCOG sets the global EoI window open and close dates. All NOC/IF windows follow the global schedule by default and auto-close at the global deadline. The OCOG can apply per-NOC overrides (open earlier, close later, or keep closed) to support pilot NOCs or exceptional circumstances. NOC and IF admins cannot set their own window dates.

**Acceptance criteria.**
- OCOG sets one global open date and one global close date for the EoI window.
- Per-NOC override panel at `/admin/ocog/windows` allows bulk Open All / Close All and per-NOC toggles.
- Closed window blocks new submissions with a clear message to applicants.
- Window state changes (global and per-NOC) logged in audit trail.
- NOC/IF admin screens show current window state but expose no controls to change it.
- Invited-organisation links remain valid after the global EoI deadline until the PbN submission deadline.

### PRP-FR-006 — NOC EoI review queue

**Description.** NOC admins have a dashboard showing all EoI applications from their territory. Per application the NOC can: Accept as Candidate (mark eligible for PbN — does not set slot quantities); Return with a review note (applicant may resubmit); Reject with a reason. Applications open in a slide-over drawer with Prev/Next navigation (keyboard `←` / `→`) and inline actions; a full-page view is also available. A QuotaBar shows the per-category impact of accepting the application. Applications flagged as possible duplicates display a badge; clicking the badge opens a side-by-side comparison modal with Reject/Return/status-update shortcuts. The queue supports an "IOC suggested priority" sort alongside "Most recent submission" — applications are ordered by `org_type` priority per Strategic Plan §1.6 (national news agency → national sports agency → general daily → sports daily → specialist outlet → general magazine). Guidance only; NOC retains discretion. Government (`.gov` / `.gov.*`) email domains surface an amber "Eligibility flag" in the drawer per Strategic Plan §1.3 (government ministries are ineligible); Accept-as-Candidate requires the NOC to confirm the org is not a government ministry.

**Acceptance criteria.**
- NOC sees only its own territory's applications.
- Accept as Candidate, Return (with note), Reject actions available.
- Application drawer supports Prev/Next navigation, keyboard shortcuts, and a link to the full-page view.
- QuotaBar shows allocated + this-request / total per selected category.
- Over-quota state highlighted in red with "over quota" label.
- Accept action labelled "Accept as Candidate" with eligibility tooltip.
- Possible-duplicate badge opens comparison modal with matched-field highlighting and inline actions.
- "IOC suggested priority" sort option available alongside recency; ordering follows Strategic Plan §1.6 org-type hierarchy.
- `.gov` / `.gov.*` email-domain matches show an amber Eligibility flag; Accept-as-Candidate gated on a NOC-confirmed "not a government ministry" attestation, enforced server-side.

### PRP-FR-007 — NOC Direct Entry

**Description.** NOC admins can add a known organisation directly to the candidate list without the org submitting a public form. Direct Entry (formerly Fast-Track) is accessed from the NOC admin panel at `/admin/noc/direct-entry` and collects: org name, type, country, category selection, Es/EPs sport picker when applicable, primary contact, and optional secondary contact (Editor-in-Chief / Media Manager). Direct Entry records are logged as `noc_direct_entry` in the audit trail and are immediately eligible for PbN allocation.

**Acceptance criteria.**
- Direct Entry form accessible from the NOC admin panel at `/admin/noc/direct-entry`.
- Resulting record appears in the candidate list alongside EoI-approved orgs.
- Audit log records `noc_direct_entry` with NOC admin actor.
- No CAPTCHA or email verification required.
- Sport picker required when Es or EPs is selected.
- No limit on number of Direct Entry records per NOC; no secondary approval required; audit log is the governance mechanism.

> **Pending refinement:** See 4.4b in `stakeholder-questions-21-April-2026.md`. D.TEC has recommended reducing Direct Entry's required fields to the Inline PbN Entry minimum (name, type, country, category) so both paths share one validation surface. If adopted, contact info and category counts become optional at entry time, collectable later in the EoI / PbN workflow.

### PRP-FR-008 — Application resubmission

**Description.** When a NOC returns an application with a review note, the applicant can resubmit using a new magic link. The resubmission updates the application record and transitions status to `resubmitted`. Resubmission count is tracked. The NOC review note is cleared on resubmission; the NOC internal note is preserved.

**Acceptance criteria.**
- Applicant can initiate resubmission from the status-check page.
- New magic link required per resubmission.
- Status transitions from `returned` to `resubmitted`.
- Resubmission count incremented and visible to NOC.

### PRP-FR-009 — Applicant status tracking (revised 2026-04-26)

**Description.** After submitting, applicants can check their application status using their reference number and email address, without an account. Status is accessible at `/apply/status`. Applicants also have a read-only view of their submitted application. Internal NOC notes are never shown to the applicant.

**Status visibility model — REVISED 2026-04-26 per Emma feedback (#23, #78).** The previous model held status decisions ("Candidate" / "Returned" / "Rejected") behind an OCOG publish/unpublish gate, with applicants seeing "pending" until OCOG triggered a batch release. **That gate is removed.** Per Emma's framing, the NOC controls when each applicant sees status — per-org or batch, the NOC's choice — via the §6.7 hybrid comms model (PRP renders the message, NOC sends via `mailto:` template from their own mail). The applicant-facing status flips to the NOC's decision the moment the NOC chooses to communicate it. There is no system-enforced batch-release pause. See stakeholder-questions §2.5 Part A and §6.7.

**Acceptance criteria.**
- Status accessible at `/apply/status` with reference number and email.
- NOC review note displayed when status is `returned`.
- Candidate, returned, and rejected statuses clearly communicated as soon as the NOC marks the decision and chooses to communicate it.
- Internal NOC notes never exposed.
- Applicants have a read-only view of their submitted application.
- No OCOG publish/unpublish gate. NOC owns the timing of applicant communication.

### PRP-FR-010 — OCOG and IOC read-only EoI visibility and summary

**Description.** During EoI, the OCOG has cross-NOC visibility of all applications, a pivot summary at `/admin/ocog/eoi` showing per-NOC status counts (pending, candidate, returned, rejected) with search and drill-down, and a cross-NOC duplicate detection view at `/admin/ocog/duplicates`. The IOC has equivalent read-only visibility across all NOCs and IFs. Neither OCOG nor IOC can Accept / Return / Reject applications — those actions are reserved for the NOC / IF.

**Acceptance criteria.**
- OCOG EoI summary shows per-NOC status counts with drill-down to applications.
- OCOG duplicate detection panel shows cross-NOC and within-NOC duplicate candidates.
- IOC dashboard shows the same data in read-only mode.
- No Accept / Return / Reject controls visible to OCOG or IOC on EoI screens.

### PRP-FR-011 — Decision reversals (revised 2026-04-26)

**Description.** NOC admins can reverse their own EoI decisions. Unapprove (Candidate → pending): org removed from PbN candidate pool; draft PbN allocations for the org reset. Unreturn (returned → pending): NOC can re-evaluate without waiting for resubmission. Unreject (rejected → pending): requires a note. **Risk framing revised 2026-04-26 per FR-009 update:** since the OCOG publish gate is removed, the NOC may have already communicated a decision to the applicant before reversing. The reversal is the NOC's call to handle the follow-up communication (no system-enforced batch holdback). All reversal actions are blocked after ACR export (subject to §4.3 master-status re-open).

**Acceptance criteria.**
- Unapprove, Unreturn, and Unreject actions available from the application detail/drawer.
- Unapprove resets draft PbN allocations for the org.
- Unreject requires a note and is recorded in the audit trail.
- All reversals blocked once the application has been exported to ACR.
- All reversals logged in the audit trail.

### PRP-FR-012 — Duplicate detection and reserved-list block

**Description.** The PRP flags possible duplicate applications using four independent signals: shared email domain, identical contact email, identical website hostname, and normalised organisation name plus country match. Within a NOC territory, any one of these signals raises a duplicate flag; flagged pairs can be dismissed by the NOC after review (stored in `dismissed_duplicate_pairs`). Cross-NOC duplicates raise a multi-territory flag visible to OCOG and IOC. The IOC-Direct reserved-list check blocks any NOC submission for a reserved organisation (by email domain or name + country). Duplicate flags are soft warnings (fail-open) — they do not block submission.

**Acceptance criteria.**
- Four-signal duplicate detection runs at submission and on NOC review.
- NOC sees duplicate badge and comparison modal with matched-field highlighting.
- Reserved-list match = blocked with "IOC-Direct organisation" message.
- Cross-NOC multi-territory flag displayed in OCOG duplicates panel and IOC dashboard.
- Dismissed pairs persisted and not re-raised.
- Dedup flag failure (system error) accepts application; duplicates surfaced pre-ACR export.

# Functional Requirements — Press by Number (PbN)

### PRP-FR-013 — IOC quota import and in-app editing

**Description.** The IOC imports per-category quota totals for each of the 206 NOCs and active IFs from a CSV file. Format: NOC/IF code, E, Es, EP, EPs, ET, EC, NocE, NocEs (nine columns, one row per body). CSV import accepts both the legacy 7-category format and the new 8-category format including NOC Es (added 2026-04-26). The IOC can also edit individual quota totals directly in the portal after import. All quota changes (import and manual edit) are logged in an append-only audit table (`quota_changes`) with prior value, new value, actor, timestamp, and change source.

**Acceptance criteria.**
- CSV import produces a viewable, editable quota table in the IOC dashboard at `/admin/ioc/quotas`.
- Eight per-category totals per body: E, Es, EP, EPs, ET, EC, NocE, NocEs.
- In-app edit mode allows per-cell editing.
- All changes logged in `quota_changes` with `change_source` (`import` / `manual_edit`).
- `entity_type` ('noc' vs 'if') distinguishes NOC rows from IF rows.
- Prior Games comparison column (Paris 2024 / Tokyo 2020) shown for reference.
- CSV import supports both 7-column (legacy) and 8-column (with NOC Es) formats.

### PRP-FR-014 — IOC event settings

**Description.** The IOC configures event-level parameters: total event capacity and IOC holdback. Together these determine how many accreditation slots are allocated to media organisations via NOCs/IFs and how many are held back for IOC discretionary use (including the ENR pool). Settings are managed via the IOC Quotas admin UI and audit-logged.

**Acceptance criteria.**
- IOC admin can set event capacity and IOC holdback values via the admin UI.
- Settings surfaced on the Master Allocation Dashboard alongside quotas.
- Capacity tracker shows allocated-vs-capacity progress.
- Changes logged to the audit trail.

### PRP-FR-015 — NOC / IF PbN slot allocation

**Description.** NOC and IF admins assign per-category slot quantities to each candidate organisation in their territory, constrained by their IOC-assigned per-category totals. All eight categories (E, Es, EP, EPs, ET, EC, NOC E, NOC Es) are tracked independently. The system enforces a hard quota cap server-side: the body cannot allocate more slots in any category than its IOC-assigned total for that category.

**Acceptance criteria.**
- PbN screen shows per-category quota state: X of Y allocated. All six E-category bars plus the NOC E and NOC Es bars are always visible.
- Hard cap enforced server-side; over-quota allocation blocked.
- Org list includes EoI-candidate orgs, Direct Entry orgs, and direct-PbN-entry orgs.
- NOC/IF can save as draft and return to edit.
- NOC E and NOC Es allocated via a nominated NOC Communications Staff org (created via Direct Entry).

### PRP-FR-016 — PbN offline workflow (CSV export and reimport)

**Description.** To support large NOCs and offline collaboration, NOC/IF admins can export a pre-populated CSV template (containing current quotas and the candidate org list), edit it offline, and reimport via file upload or clipboard paste. Reimport is full-overlay (replaces current allocations). The PRP remains the system of record. Quota caps are validated on reimport; over-cap rows are rejected.

**Acceptance criteria.**
- CSV export pre-populated with quotas and candidate org list.
- Reimport via file upload or clipboard paste, full-overlay semantics.
- Over-cap rows rejected with clear per-row errors.
- Successful reimport logged in audit trail.

### PRP-FR-017 — Direct PbN entry without EoI record

**Description.** NOC/IF admins can add an organisation directly to the PbN allocation table without a prior EoI record. A simple inline form captures: org name, type, country, category. The OCOG sees which PbN entries had a prior EoI record and which were added directly. The hard quota cap applies equally to direct-entry orgs.

**Acceptance criteria.**
- Inline add form available on the PbN screen.
- Direct-entry orgs appear alongside EoI-candidate orgs in PbN.
- OCOG view distinguishes direct-entry orgs from EoI-candidate orgs.
- Direct-entry blocked if it would exceed per-category quota.
- Audit logged as `noc_direct_entry`.

> **Pending refinement:** See 4.4b in `stakeholder-questions-21-April-2026.md`. If D.TEC's recommendation is adopted, the required-field minimum (name, type, country, category) becomes identical to FR-007 Direct Entry, with `country` becoming required (currently optional). Behaviour otherwise unchanged.

### PRP-FR-018 — PbN state machine

**Description.** PbN allocations track four states: `draft` (NOC/IF editing), `noc_submitted` (ready for OCOG review), `ocog_approved` (OCOG accepted), `sent_to_acr` (data pushed to ACR). The NOC/IF submits when the allocation is ready. State is visible to the NOC/IF at all times. `sent_to_acr` is terminal in the PRP; post-handoff edits occur in ACR.

**Acceptance criteria.**
- State displayed prominently on the NOC/IF PbN screen.
- NOC/IF receives in-app notification and email when OCOG approves or adjusts.
- NOC/IF receives a second notification when data flows to ACR.
- OCOG adjustments highlighted in the NOC/IF view.
- Post-`sent_to_acr` edits disabled in the PRP (Model A: ACR is source of truth after handoff).

### PRP-FR-019 — OCOG and IOC PbN review (revised 2026-04-26)

**Description.** The OCOG and IOC both review NOC/IF PbN submissions, but **neither approves individual orgs**. Per Emma's 2026-04-24 framing (#2, #23, #73, #77, #78), reflected in stakeholder-questions §2 reframe:

- **NOC = arbiter**: NOC decides per-org slot allocations within their assigned quota; informs their orgs (via §6.7 hybrid comms); submits PbN to LA28 with all decisions made.
- **OCOG = coordinator + safety-net reviewer**: ingests NOC submissions, coordinates downstream services (accommodation, rate card, SEAT, ACR enrolment), flags issues back to the NOC if anomalies are found (gov ministry org, mixed-up quotas).
- **IOC = compliance reviewer**: also reviews submissions for compliance with eligibility rules — focused on **the organisations the NOC has accredited**, not the per-category slot counts.

The OCOG can mark a submission as "received and clean" (`noc_submitted` → `ocog_approved`) to signal readiness for ACR push; it can also reverse this (`ocog_approved` → `noc_submitted`) if issues surface. The IOC has a parallel review surface at `/admin/ioc/pbn-review` with a "raise issue" / "flag concern" action that posts a comment back to the NOC. **The OCOG publish/unpublish gate on applicant outcomes is REMOVED** — see FR-009 revision.

**Acceptance criteria (revised).**
- OCOG dashboard shows all NOC/IF PbN submissions with status filtering and a "received and clean" / "needs revision" state toggle.
- OCOG can flag issues back to the NOC (return-flow mechanic — see §6.7 + the "Return-flow" v0.9 TODO).
- IOC PbN review surface at `/admin/ioc/pbn-review` with the same data + a separate "flag concern" action.
- NOC E and NOC Es rows visible in OCOG and IOC views.
- No publish/unpublish toggle (removed). NOC controls applicant communication directly per FR-009.
- All OCOG and IOC actions audit-logged. OCOG-marks-received and OCOG-reversal log distinct action types from IOC-flags-concern.

### PRP-FR-020 — ACR data export

**Description.** Once the OCOG marks a PbN submission "received and clean" (`ocog_approved` per FR-019 revision), the OCOG pushes the approved allocation to ACR. Output per organisation includes: NOC/IF code, org name, country, org type, full contact details (first name, last name, company, email, website, address, phone — per Emma 2026-04-24 #8 PbN field set; replace with Martyn's official LA28 form when delivered), per-category EoI flags, per-category allocated slot counts (E, Es, EP, EPs, ET, EC, NOC E, **NOC Es** — added per Emma #197), ENR slots granted, and Common Codes ID. IOC-Direct orgs are included in the standard export. ENR-granted organisations are included so LA28 can pre-populate the accreditation database with the corresponding NOC↔ENR mappings (per Emma 2026-04-24 #4). A structured CSV fallback export is available if the ACR API is unavailable.

**Acceptance criteria.**
- `sendToAcr()` triggers only from `ocog_approved` state.
- All eight per-category slot counts included per record (E, Es, EP, EPs, ET, EC, NOC E, NOC Es).
- IOC-Direct orgs included in the standard export.
- ENR orgs included as separate records with `enrSlotsGranted` set; supports LA28 pre-populating accommodation / rate-card downstream services.
- State transitions to `sent_to_acr` after successful push (subject to §4.3 master-status re-open — see stakeholder-questions).
- CSV fallback available if ACR API unavailable.

### PRP-FR-021 — NOC/IF quota dashboard and Master Allocation view

**Description.** The NOC/IF has a real-time per-category quota summary on its dashboard. Before IOC sets totals, each category shows "not yet assigned". After IOC sets totals, each category shows X allocated / Y total. The application detail page and drawer show a QuotaBar with per-category impact. The OCOG and IOC have access to a Master Allocation Dashboard at `/admin/ocog/master` and `/admin/ioc/master` showing per-NOC Q (quota) and A (allocated) columns adjacent, a continent column (hideable), capacity tracker, separate IF section, IOC Holdback row, grand totals banner, and expandable per-org rows.

**Acceptance criteria.**
- Dashboard header shows per-category quota state at all times.
- QuotaBar visible on application detail and drawer views when quota data exists.
- Master Allocation Dashboard shows adjacent Q and A columns per category.
- Continent column hideable; IF section shown separately; Holdback row visible.
- Expandable rows show per-org allocations.
- Over-quota state highlighted in red.

# Functional Requirements — Extended Non-Rights Broadcasters (ENR)

### PRP-FR-022 — ENR self-application via the EoI form

**Description.** ENR organisations apply through the public EoI form by selecting ENR as their organisation type. The form captures ENR-specific fields (ENR programming type) in addition to the standard organisation, contact, accreditation, publication, and history information. ENR applications enter a dedicated NOC ENR prioritisation queue rather than the standard candidate queue; they do not appear in PbN slot allocation tables.

**Acceptance criteria.**
- Public EoI form includes ENR as a selectable organisation type.
- ENR-specific fields (programming type, ENR slot request with must-have / nice-to-have split) collected at submission.
- ENR applications routed to the NOC ENR prioritisation queue, not the standard EoI review queue.
- ENR applications do not appear in PbN slot allocation tables.

### PRP-FR-023 — NOC ENR prioritisation and submission

**Description.** NOC/IF admins prioritise ENR applications in a ranking view (1–99). Priority rank 1 is highest. For each ENR application the NOC can add justification notes and adjust requested must-have / nice-to-have slot counts before submission. The NOC submits the ranked list to the IOC. After submission, the NOC cannot modify the list (amendment policy pending — see stakeholder-questions-21-April-2026 for open items).

**Acceptance criteria.**
- NOC can re-rank, add justification, and adjust slot counts before submission.
- Priority rank maintained without gaps (re-ranked on remove).
- Unique partial index prevents duplicate ranks for draft entries.
- Submission transitions list to IOC review state.
- ENR organisations do not appear in EoI or PbN screens.

### PRP-FR-024 — IOC ENR grant decisions (cross-NOC combined view)

**Description.** The IOC reviews all NOC ENR submissions in a single combined cross-NOC view at `/admin/ioc/enr`, sortable by NOC / priority / granted / requested. The IOC makes grant decisions per organisation — Granted (full slot count), Partial grant (fewer slots), or Denied (0 slots) — with optional decision notes. The IOC works against a configurable holdback pool sized via event settings. Running pool balance is always visible. Slot grants are editable inline. **After IOC grant, the NOC remains the Responsible Organisation for the ENR org** through Press by Name, accommodation, and OIAC distribution (per Emma 2026-04-24 #4); the NOC informs the ENR organisation of the IOC's decision (per the §6.7 hybrid comms model). An IOC-Direct ENR variant exists at `/admin/ioc/enr/direct` for international-focus non-MRH orgs (CNN, Al Jazeera, BBC World) where there is no NOC mediator (per Emma #226).

**Acceptance criteria.**
- IOC ENR screen shows all NOC/IF submissions in a combined sortable multi-NOC view.
- Running total against the configurable holdback pool visible at all times.
- IOC sets granted slot count per org (0 to requested amount); inline editing supported.
- Outcome recorded as granted / partial / denied with optional decision notes.
- NOC/IF sees IOC decisions per org after IOC submits and remains the Responsible Organisation post-grant; the NOC's view of granted ENR records is read-only after IOC grant (the NOC does not re-rank or amend grants — it informs its ENR orgs and supports them through Press by Name and downstream services).
- IOC-Direct ENR records (`nocCode = IOC_DIRECT`) created via `/admin/ioc/enr/direct` surface in the same combined view.

### PRP-FR-025 — ENR quota pool and undertaking

**Description.** The ENR holdback pool is separate from E-category totals and managed entirely by the IOC. Per-NOC E-category quotas are unaffected by ENR grants. Before an ENR organisation can receive accreditation, it must sign the **News Access Rules undertaking**. Whether the digital undertaking mechanism lives in the PRP or in ACR is an open item, as is the specific signature path (typed name plus timestamp versus DocuSign-grade e-signature) pending IOC Legal determination. See 5.2 in `stakeholder-questions-21-April-2026.md`.

**Note on other undertakings (clarified 2026-04-26 Strategic Plan re-review):** The Photographers Undertaking + Code of Conduct and the NOC E Conditions of Participation Undertaking are **out of PRP scope** — both are individual-level and belong to Press by Name (ACR, 2027). The ENR News Access Rules undertaking remains the only PRP undertaking concern.

**Acceptance criteria.**
- ENR quota pool independent of all E-category quota calculations.
- IOC dashboard shows ENR pool state: total / allocated / remaining.
- Per-NOC ENR grants tracked in `enr_quotas` and `enr_requests`.
- Digital undertaking mechanism implemented per IOC Legal determination; location (PRP or ACR) confirmed before build.

# Functional Requirements — Platform

### PRP-FR-026 — IOC-Direct organisation management (revised 2026-04-26)

**Description.** A reserved list of major international media organisations (AFP, AP, Reuters, Xinhua, Getty, EPA, etc.) bypasses the normal NOC quota process. The IOC acts as their Responsible Organisation under a pseudo-NOC code `IOC_DIRECT`. The IOC manages this list via a dedicated admin screen at `/admin/ioc/orgs` (with related direct-management tooling at `/admin/ioc/direct`) and adds IOC-Direct orgs through the same Direct Entry / Inline PbN Entry mechanics used by NOCs.

**No PbN approval flow for IOC-Direct (per Emma 2026-04-24 #193).** The IOC manages the IOC-Direct list directly; LA28 receives the list (via the cross-RO change feed — see TODOS) and uses it to coordinate accommodation, rate card, SEAT, and ACR enrolment. **OCOG does not approve individual IOC-Direct orgs** — falls out of the §2 reframe (OCOG = coordinator/visibility, not approver). OCOG keeps visibility on IOC-Direct entries and can flag concerns by process; chooses not to approve them.

**IOC-Direct ENR variant.** Beyond the regular IOC-Direct list, the IOC also grants ENR accreditations directly to international-focus non-MRH organisations (CNN, Al Jazeera, BBC World, etc.) without NOC mediation. These flow through `/admin/ioc/enr/direct` (see FR-024 revision) — a sibling of the NOC ENR prioritisation screen, with `enr_requests.noc_code = IOC_DIRECT`.

When a regular NOC attempts to submit an EoI for a reserved-list org, the form blocks submission (existing behaviour).

**Acceptance criteria.**
- IOC admin can add/remove orgs from the `IOC_DIRECT` reserved list.
- IOC admin has the full NOC-equivalent workflow for IOC-Direct: EoI review queue, Direct Entry, PbN allocation.
- No OCOG approval step on IOC-Direct PbN entries (revised 2026-04-26 per §2 reframe and Emma #193). LA28 receives IOC-Direct entries via the cross-RO change feed and uses them to coordinate accommodation, rate card, SEAT, and ACR enrolment. OCOG retains visibility and may flag concerns by process.
- IOC-Direct ENR records flow through `/admin/ioc/enr/direct` and use `nocCode = IOC_DIRECT`.
- Domain-based dedup block prevents regular NOC submissions for reserved org email domains.
- All add/remove/allocation changes audit-logged.

### PRP-FR-027 — IOC sudo (impersonation) mode

**Description.** IOC admins can open a read-only impersonation session as any non-IOC admin user. This allows IOC Operations to see exactly what another admin sees without sharing credentials. All write actions are blocked server-side during sudo sessions. An amber SUDO MODE banner is shown on all admin pages during sudo.

**Acceptance criteria.**
- IOC admin initiates sudo via "Act as user" button (`ioc_admin` role only).
- One-time activation token expires in 10 minutes if unused.
- Token activates in a new browser tab; sudo session cookie set with 1-hour max-age.
- Amber SUDO MODE banner on all admin pages during sudo.
- All write server actions reject requests from sudo sessions.
- IOC cannot sudo into another IOC account.
- `sudo_initiated` logged to the audit trail at token creation time.

### PRP-FR-028 — Audit trail

**Description.** All significant actions across all three workflows are recorded in an immutable audit log (`audit_log`) with actor identity (type, ID, display label), action type, timestamp, and relevant entity IDs. The audit log is append-only. It is visible to IOC and OCOG admins at `/admin/ioc/audit` and `/admin/ocog/audit`.

**Acceptance criteria.**
- Defined audit actions cover at minimum: application submitted / resubmitted / accepted / returned / rejected / unapproved / unreturned / unrejected; email verified; admin login; duplicate flag raised / dismissed; export generated; PbN submitted / approved / unapproved / sent to ACR; quota changed; ENR submitted / decision made / decision revised; sudo initiated; NOC Direct Entry; EoI window toggled (global and per-NOC); event settings changed; feature flag changed; IOC override of OCOG approval.
- Audit log is append-only; no delete or update.
- Actor type, actor ID, and actor display label captured for every entry.
- IOC and OCOG can filter and search the audit log.

### PRP-FR-029 — Games-to-Games organisation persistence

**Description.** Organisations are first-class entities that persist across Games editions. All workflow tables are scoped to `event_id`. Adding a future Games edition is a data operation, not a code change. An organisation record from LA28 carries forward as a contextual signal for subsequent Games. The underlying data model is committed for LA28; cross-Games surfacing UI is a candidate feature (see Section 11).

**Acceptance criteria.**
- `event_id` column present in: `organizations`, `applications`, `org_slot_allocations`, `enr_requests`, `noc_quotas`, `enr_quotas`, `event_settings`.
- Default `event_id` is LA28 for all LA28 operations.
- Organisation UUID stable across Games editions.

### PRP-FR-030 — Role-specific help and guide pages

**Description.** Each admin role has a dedicated Help & Guide page with role-specific guidance, FAQ, and a sticky table of contents: NOC at `/admin/noc/help`, OCOG at `/admin/ocog/help`, IOC at `/admin/ioc/help`. Links from the header on admin pages open the relevant section contextually.

**Acceptance criteria.**
- Each role has a dedicated help page with overview and FAQ.
- Sticky table of contents supports long-page navigation.
- Header link from admin pages opens role-specific content.

### PRP-FR-031 — Feature flags and canary rollout

**Description.** An internal feature-flag mechanism (`feature_flags` table, admin UI at `/admin/ioc/flags`) allows the IOC and D.TEC to stage new capabilities off / canary / on, and enroll specific admin users in canary rollouts. Flag changes are audit-logged. Used operationally to manage risky releases during the EoI and PbN windows.

**Acceptance criteria.**
- Flags support off / canary / on state with per-user canary enrollment.
- Admin UI at `/admin/ioc/flags` allows IOC admins to change flag state.
- All flag changes audit-logged.

### PRP-FR-032 — Invited organisation pre-fill flow

**Description.** NOC and IF admins can invite known organisations by sending a tokenised pre-fill link (`/invite/[token]`). The link opens the EoI form with the invited organisation's known fields pre-populated; the applicant completes the remaining fields and submits. Tokens are one-time-use and tracked in the `invitations` table. Invited links remain valid after the global EoI deadline until the PbN submission deadline.

**Acceptance criteria.**
- NOC/IF can generate an invite link for a named organisation.
- Invite link pre-fills the EoI form with known fields.
- Tokens are one-time-use and expire on use or window close.
- Invite-org submissions remain accessible after the global EoI deadline until PbN submission deadline.
- Invitations stored in `invitations` table; lookup by token is server-side.

# Non-Functional Requirements

## Authentication and Session Management

All admin roles use D.TEC/DGP SSO with MFA required. Applicants use magic-link email verification to submit; after submission, a 90-day status token allows the applicant to check status and view their submitted application without re-verifying.

| Session Type | Cookie | Max-age |
|---|---|---|
| Admin session | `mrp_session` (HMAC-SHA256 signed) | 8 hours |
| IOC sudo impersonation session | `mrp_sudo_session` (HMAC-SHA256 signed) | 1 hour |
| Applicant status session | status token bound to application reference + email | 90 days |

Access control is role-based and enforced server-side on all data reads and writes. NOC and IF admins are restricted to their territory's / sport's data at the data layer.

## Security

- TLS 1.3 minimum for all connections.
- Rate limiting: max 5 magic link requests per email per hour; max 15 per IP per hour.
- Email domain blocklist for disposable email providers.
- CAPTCHA on all public-facing form submission points.
- Atomic token consumption prevents concurrent double-submission attacks.
- Server-side row-level territory enforcement — NOC/IF data isolation at DB layer.
- Content Security Policy with per-request nonce; HSTS enabled.
- Input validation and allowlisting on public endpoints.
- Compliance with IOC Software Security Standard, IAM Standard, Data Protection Standard, Data Privacy Standard.

## Data Privacy and PII

- Data controller: IOC. Data processor: OCOG / D.TEC.
- EoI data is organisation-level with named contact persons; journalist-level PII is collected in Press by Name (ACR, Phase 2).
- Encryption at rest and in transit.
- Data residency: hosted on D.TEC/DGP infrastructure for production.
- Retention: archive until December 31, 2030; then purge.
- Backup retention: 90 days rolling.
- GDPR compliance: formal legal sign-off required before production launch.
- Right-to-be-forgotten: restricted under GDPR Article 17(3)(b) for Games-legitimacy records.

## Performance and Reliability

- Database: PostgreSQL in production; connection pool sized for load.
- ACR adapter retry on push failure: exponential backoff, max 5 attempts, 24-hour window.
- ACR `fetchQuota()` unavailable: cache last-known quota in PRP DB, surface staleness warning.
- Portal supports 206 NOC concurrent sessions during EoI and PbN windows.
- SLA requirements per the D.TEC/IOC SLA KPD document.

## Localisation (revised 2026-04-26)

Per Strategic Plan §4.2: IOC↔LA28 correspondence is English; IOC↔NOC press-accreditation correspondence is English + French + Spanish; Press by Number forms/manual are English + French + Spanish. Per Emma 2026-04-24 (#33): OCOG and IOC admin are NOT needed in French. Smaller French- and Spanish-speaking NOCs may need NOC admin localisation; deferred for confirmation.

**Symmetric framing for French and Spanish.** Both languages cover the same surfaces.

| Surface | EN | FR | ES |
|---|---|---|---|
| `/apply` public form | ✓ shipped | ✓ shipped (commit `982ff55`) | v0.9 committed |
| Applicant transactional emails | ✓ | ✓ | v0.9 committed |
| NOC admin screens | ✓ | v2.0 candidate | v2.0 candidate |
| NOC user manual | ✓ | v2.0 candidate | v2.0 candidate |
| OCOG admin | ✓ | not needed | not needed |
| IOC admin | ✓ | not needed | not needed |

The v2.0 NOC-admin scope is **conditional** on stakeholder confirmation that smaller NOCs actually require admin-screen localisation; the meta-question is logged in stakeholder-questions §6.4c.

## Maintainability

- Next.js App Router. Drizzle ORM. PostgreSQL. Tailwind CSS. shadcn/ui.
- All schema changes versioned as Drizzle kit migrations.
- Integration tests run against a real database in isolation.
- Adapter pattern for ACR integration: stub in dev/test, real API client in production.

# Open Questions

Open questions are no longer tracked in this document. They live in:

> **`docs/input and feedback/stakeholder-questions-21-April-2026.md`** (and the corresponding `.docx` in `docs/archive/`)

Part 1 of that document is the active open-question agenda for the next stakeholder meeting. Part 2 is the backlog of resolved items awaiting a walkthrough confirmation. Any requirement in this document that is subject to a Part 1 decision carries an inline cross-reference to the relevant stakeholder-questions item.

# Delivery Roadmap

| Date | Milestone |
|---|---|
| April 30, 2026 | Gate: ACR API contract signed off. ENR undertaking legal path decided. |
| June 1, 2026 | ACR integration go/no-go gate. Fallback: structured CSV export. |
| July 2026 | IOC imports per-category quota totals for all 206 NOCs and active IFs. |
| July 1 – August 10, 2026 | Production deployment, final QA, NOC / IF onboarding. |
| 31 August 2026 | Portal goes live. EoI window opens. |
| October 5, 2026 | Press by Number process launches. |
| October 23, 2026 | EoI application window closes (OCOG-controlled global deadline). |
| December 18, 2026 | Press by Number closes. |
| October 14, 2027 | Press by Name launches (ACR system). |
| Summer 2028 | LA28 Olympic Games. |

Note: Delivery is iterative. The working design record (PRP-design-confirmation.md) tracks interim sprint outcomes and the feature-flag mechanism (FR-031) supports staged rollouts. This document defines the committed end state; it does not enumerate interim releases.

## Success Criteria

- Portal live by 31 August 2026 (EoI window opens).
- All 206 NOCs and active IFs can log in, review EoI applications (NOCs), and manage PbN allocations.
- OCOG can ingest PbN submissions across all NOCs and IFs, mark them "received and clean", and coordinate downstream services; the NOC controls applicant-facing communication timing (no system-enforced publish gate; revised 2026-04-26).
- IOC has real-time read-only visibility on EoI and PbN; manages ENR grants from the configurable holdback pool (including the IOC-Direct ENR path); reviews PbN for compliance.
- Zero quota overruns — no body can allocate more slots in any category than its IOC-assigned total.
- PbN output to ACR: per-category slots (E/Es/EP/EPs/ET/EC/NOC E/NOC Es) plus ENR per org, "received and clean", zero manual cleanup; IOC-Direct orgs included.
- All PII handling compliant with GDPR.

# RACI — Responsibilities

> **Source of truth:** The authoritative RACI draft is section 6.1 of `docs/input and feedback/stakeholder-questions-21-April-2026.md`. The version below is a snapshot of that draft as of 2026-04-21 and is subject to confirmation at the next stakeholder meeting.

Legend: **R** = Responsible (does the work), **A** = Accountable (single signer), **C** = Consulted, **I** = Informed.

| Activity | R | A | C | I |
|---|---|---|---|---|
| EoI form field list / field changes | D.TEC | OCOG | IOC | NOCs |
| EoI window open/close date (global) | OCOG | OCOG | IOC | NOCs |
| EoI window per-NOC override (pilot / exception) | OCOG | OCOG | IOC | affected NOC |
| EoI queue decisions (accept / return / reject) | NOC | NOC | OCOG | IOC |
| Cross-NOC EoI visibility + duplicate flags | OCOG | OCOG | IOC | NOCs |
| Quota totals per NOC / IF (per category) | IOC | IOC | OCOG | NOCs / IFs |
| PbN allocations (NOC / IF submits to OCOG) | NOC / IF | NOC / IF | OCOG, IOC | D.TEC |
| PbN coordination + "received and clean" sign-off (revised 2026-04-26) | OCOG | OCOG | IOC | NOCs / IFs |
| PbN compliance review (eligibility of accredited orgs; revised 2026-04-26) | IOC | IOC | OCOG | NOCs / IFs |
| PbN close date (global) | OCOG | OCOG | IOC | NOCs / IFs |
| IOC-Direct org list (AFP, AP, Reuters, etc.) | IOC | IOC | OCOG | D.TEC |
| IOC-Direct PbN allocations (no OCOG approval; revised 2026-04-26) | IOC | IOC | OCOG | D.TEC |
| ENR nominations (NOC list) | NOC | NOC | IOC | D.TEC |
| ENR grants from holdback pool | IOC | IOC | OCOG | NOCs |
| NOC admin account provisioning (206 accounts) | OCOG | OCOG | D.TEC | IOC |
| NOC user manual content | OCOG | OCOG | IOC, D.TEC | NOCs |
| Applicant communication of decisions (revised 2026-04-26 — no OCOG batch gate) | NOC | NOC | OCOG (visibility) | IOC, applicant |
| ACR push (per PbN allocation) | OCOG | OCOG | IOC | D.TEC, NOCs |
| Post-`sent_to_acr` data edits | ACR team | OCOG | IOC | NOCs |
| Production incident response (on-call) | D.TEC | D.TEC | OCOG | IOC |
| Portal infrastructure / hosting | D.TEC | D.TEC | OCOG | IOC |
| ACR API contract ownership | D.TEC + ACR | D.TEC | OCOG, IOC | NOCs |
| Production incident response | R/A | I | I | SLA to be defined |

# Data Model Summary

The following are the core data entities in the PRP. Full schema maintained in `src/db/schema.ts`.

| Table | Purpose |
|---|---|
| `organizations` | Master record for each media organisation. Stable UUID across Games editions. Org type (including `ino`, `if_staff`, ENR), country, NOC/IF code, email domain, address, freelancer flag, multi-territory flag, Common Codes ID. |
| `applications` | EoI application records. Per-category flags (E/Es/EP/EPs/ET/EC) and requested quantities, ENR fields where applicable, primary and secondary contact details, publication details, accreditation history. Status lifecycle (pending / candidate / returned / resubmitted / rejected). |
| `application_sequences` | Per-NOC reference number counters (manages `APP-2028-USA-00051` allocation). |
| `admin_users` | Admin user accounts, roles (`noc_admin`, `if_admin`, `ocog_admin`, `ioc_admin`, `ioc_readonly`), and associated NOC/IF code. |
| `noc_quotas` | Per-NOC / per-IF per-category quota totals set by IOC. Eight independent categories: E, Es, EP, EPs, ET, EC, NocE, NocEs (NocEs added 2026-04-26). `entity_type` distinguishes `'noc'` from `'if'` rows. `IOC_DIRECT` is a valid code. |
| `org_slot_allocations` | PbN slot allocations per org per NOC/IF. Eight per-category slot counts (E, Es, EP, EPs, ET, EC, NOC E, NOC Es). PbN state machine (`draft` / `noc_submitted` / `ocog_approved` / `sent_to_acr`). |
| `noc_eoi_windows` | Per-NOC EoI window state (open/closed) supporting OCOG-controlled global window with per-NOC overrides. |
| `event_settings` | Per-event configuration: total capacity (default 6000) and IOC holdback. Configurable by IOC admin. |
| `enr_requests` | NOC ENR nomination records. Priority rank, slot request (must-have + nice-to-have), IOC decision (granted / partial / denied), granted slot count, decision notes. |
| `enr_quotas` | IOC-granted ENR slot totals per NOC. Separate from E-category quotas. |
| `quota_changes` | Append-only audit of all quota changes (import and manual edit). Per-category quota type. Prior and new values with actor and timestamp. |
| `audit_log` | Immutable record of all significant system actions. Actor type, ID, and display label for every entry. |
| `reserved_organizations` | IOC-Direct reserved list. Canonical org name, email domain for dedup, alternate name variants, country, website. |
| `dismissed_duplicate_pairs` | Duplicate-flag pairs dismissed by NOC after review; suppresses re-raising. |
| `invitations` | NOC/IF invited-organisation pre-fill links. Tokenised, one-time use. |
| `feature_flags` | Feature flag state (off / canary / on) and per-user canary enrollment. |
| `sudo_tokens` | One-time IOC sudo activation tokens. SHA-256 token hash, actor and target identity, 10-minute expiry. |
| `magic_link_tokens` | Public EoI applicant email verification tokens. SHA-256 hash, email, IP address, expiry, one-time-use enforcement. |

# Candidate Features (Not Committed for LA28)

The following capabilities are valuable extensions being tracked but are NOT committed for LA28. Each requires a separate prioritisation decision with the business.

- **Games-to-Games organisation surfacing UI.** The data model supports cross-Games persistence (FR-029) and this is committed; a dedicated UI that surfaces an organisation's prior-Games record to reviewers is a candidate feature.
- **Public Organisation Directory.** An opt-in post-event directory of accredited organisations for general public view.
- **IOC anomaly detection.** Concentration-risk indicators, NOC-activity signals, and other anomaly surfacing for IOC review — scope and business value subject to prioritisation review.
- **French localisation of non-EoI screens.** The admin portal and non-EoI public surfaces are English-only in the committed delivery; French for these surfaces is pending business prioritisation.
- **Additional language packs (e.g. Spanish).** Scope and priority subject to business review.

# Glossary

| Term | Definition |
|---|---|
| EoI | Expression of Interest — public-facing form where media organisations apply to their NOC or IF for press accreditation consideration. |
| ENR | Extended Non-Rights Broadcaster — broadcasters without Olympic media rights. ENR organisations self-apply via the EoI form (ENR org type); the NOC prioritises and submits a ranked list; the IOC grants slots from a configurable holdback pool. All handled within the PRP. |
| PbN | Press by Number — the phase where NOCs and IFs formally allocate their IOC-assigned per-category quotas to specific media organisations, subject to OCOG approval. |
| Candidate | An EoI application accepted by the NOC as eligible for PbN slot allocation. Replaces the earlier "Approved" label — acceptance at EoI is a candidacy decision, not accreditation. |
| Direct Entry | NOC/IF workflow to add a known organisation to the candidate list without the org submitting a public form. Supersedes the earlier "Fast-Track" label. |
| ACR | Accreditation system (LA28's platform). Receives the final approved press allocation data from PRP. |
| Common Codes | Shared organisation registry within the ACR system, maintained by D.TEC. Used across all accreditation categories. |
| NOC | National Olympic Committee (206 worldwide). Primary owner of the EoI review process and PbN allocation for its territory. |
| IF | International Federation. Same role as NOC for its sport's media quota management. No public EoI queue — uses invited-org and Direct Entry flows only. |
| OCOG | Organising Committee (LA28). PbN coordinator and safety-net reviewer (revised 2026-04-26 per §2 reframe): ingests NOC submissions, marks them "received and clean", coordinates accommodation / rate card / SEAT / ACR enrolment, and flags issues back to the NOC. Controls the global EoI window and cross-NOC duplicate and summary views. Does not approve individual orgs. |
| IOC | International Olympic Committee. Sets per-category quota totals per NOC/IF (including NOC Es). Manages the ENR holdback pool and IOC-Direct reserved organisations (including the IOC-Direct ENR path). Compliance reviewer of NOC PbN submissions (revised 2026-04-26 per §2 reframe): focused on which orgs are accredited, not per-category counts. Does not approve individual orgs. |
| IOC-Direct | Reserved list of major international media organisations (e.g. AFP, AP, Reuters, Xinhua) for which the IOC acts as Responsible Organisation, bypassing the normal NOC quota process. |
| INO | International News Organisation — routed via the IOC-Direct workflow with a distinct `ino` org type label for ACR coding. (Terminology corrected 2026-04-26 per Emma feedback; was previously written as "Non-Governmental".) |
| IF Staff | IF communications / press staff allocated via the IOC-Direct / INO workflow (`if_staff` org type). |
| Responsible Organisation | The body that acts as the owning entity for a media organisation in the accreditation system. IOC for IOC-Direct orgs; NOC for regular orgs; IF for IF-sport orgs. |
| D.TEC | Deloitte Olympic Technology. Builds and operates the PRP. Also maintains Common Codes. |
| PRP | Press Registration Portal — this system. |
| NOC E | Press Attaché category — NOC communications staff / press officers. Nominated directly by the NOC during PbN via a Direct Entry record; not selectable on the public EoI form. |
