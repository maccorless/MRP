**Last updated: 26-Apr-2026**

# TODOS — LA28 Press Registration Portal

This file lists **committed work that D.TEC knows it needs to do and has not yet done**. It is deliberately scoped:

- **Open stakeholder questions** live in `docs/input and feedback/stakeholder-questions-21-April-2026.md`, not here.
- **Resolved-but-not-implemented** items (for example, the 4.4b Direct Entry alignment, 2.5 close/push buttons, 6.4a bulk account provisioning) will be added here **after** the Part 2 walkthrough meeting signs off the corresponding stakeholder-questions item as CLOSED / CONFIRMED.
- **Items already shipped** are in `docs/release-notes.md`, not here.

Everything in the **v0.9** section is committed and on the plan. The **Future Ideas** section at the bottom is a parking lot of things we have considered but not committed to build.

---

## Version canon

This is the single source of truth for versioning used across this document and the wider document space.

**User-facing releases (what the business sees):**
- **v1.0** — August drop. Testable and launchable for the LA28 press registration process start. All committed features for the initial launch.
- **v2.0** — Pre-EoI-close release. Closes out any remaining integrations and features needed before the EoI window ends.

**Internal prototype track (what engineering sees):**
- **v0.2** — current prototype.
- **v0.9** — all technical integrations complete (ACR, SSO, email, etc.) — the scope of the next section.
- **v1.0** — same as the user-facing August drop; ships when v0.9 is tested and hardened.

No other version labels are in use. Older drafts may refer to `v0.1`, `v1.1`, or `v1.2` — those are historical. Read `v0.1` as the prototype phase and `v1.1/v1.2` as the v2.0 pre-EoI-close release.

---

## v0.9 — Committed technical / infrastructure / ops

Items in this section complete the v0.9 prototype (all technical integrations). They ship before v1.0 hardening begins.

### [v0.9 — P1 security] Remove hardcoded admin password
Current admin-login path accepts a hardcoded password. Replace with proper auth (paired with SSO below where possible). Tracked in `todos/001-pending-p1-hardcoded-admin-password.md`.

### [v0.9 — P1 security] Rate-limit status token endpoint
The `/apply/status` lookup has no rate limiting; a determined actor could iterate reference numbers + emails. Add per-IP and per-reference rate limits. Tracked in `todos/002-pending-p1-status-token-no-rate-limit.md`.

### [v0.9 — P1 a11y] Validation modal accessibility
Confirm Submission / validation modals need focus management, escape handling, and screen-reader announcements to pass WCAG AA. Tracked in `todos/003-pending-p1-validation-modal-accessibility.md`.

### [v0.9] Ex / EPx categories for host-territory press
Two additional accreditation categories (Ex and EPx) for host-territory domestic press. Needed for LA28 by USOPC and expected to recur for future host OCOGs. Schema: add `ex` and `epx` columns to the quota + slot-allocation tables. UI: surface as conditional columns in quota entry, PbN allocation, Master Allocation Dashboard, and CSV export / import, keyed on an `is_host_territory` flag on the NOC / IF record so the categories only appear for the host. CSV contract for ACR handoff extended to carry Ex / EPx counts.

### [v0.9] Real ACR integration client
Replace the ACR adapter stub with the real client. Gate: API contract signed off by April 30; go/no-go on integration June 1 (per `docs/PRP-rq.md` delivery roadmap). Fallback if ACR is not ready: structured CSV export (already built).

### [v0.9] Transactional email infrastructure
Outbound email for invite links, applicant status-token links, batch communications (post-2.5 resolution), and admin notifications. **Sender domain decision revised 2026-04-26: configure the email service for an OCOG (LA28) domain** (e.g. `noreply@la28-press.com`), **not D.TEC** — supersedes the 2026-04-16 D.TEC-domain decision. Reason: applicants and NOCs recognise the LA28 brand, deliverability and trust improve. Implementation note: the FROM domain is configuration of the chosen email service (e.g. Postmark / SES / SendGrid), not PRP code. PRP code stays domain-agnostic.

**Hybrid notifications model (per stakeholder-questions §6.7, 2026-04-26):**
- **PRP sends from the OCOG/LA28 domain** for transactional comms — magic-link verification, status token, OCOG approval notification, ACR-handoff notification, system errors. Audit-logged + bounce-handled.
- **PRP drafts; NOC sends manually** via `mailto:` template for narrative comms — ENR decision letters, EoI accept/return/reject when the NOC adds its own framing, PbN result letters. Mirrors today's invite-form pattern.

Includes: sender-domain config, retry + bounce handling, template management, audit log of sent messages, mailto template generation for the NOC-narrative path.

### [v0.9] SSO integration — separate NOC auth from D.TEC IAM admin auth (revised 2026-04-26)
**Original scope (D.TEC IAM SSO):** retire the hardcoded-password path. Admin sessions defer to D.TEC IAM policy when SSO is integrated (per R-9).

**Scope clarification 2026-04-26 (per Emma #232 + stakeholder-questions §6.8):** D.TEC IAM SSO does NOT fit 206 external NOCs (they aren't D.TEC employees; many small NOCs lack sophisticated IdP setups). Split the auth model:

- **D.TEC operators (IOC, OCOG, super-admin):** D.TEC IAM SSO + MFA — keeps the current scope.
- **NOC admin auth (D.TEC prior, awaiting stakeholder confirmation):** email + magic link, same mechanism as the applicant 90-day status token. Familiar, simple, no password to remember. MFA / step-up auth for sensitive actions (OCOG approval gate, IOC quota changes) added separately if needed. Validate with 1-2 smaller NOC reps during the engagement plan.

Resolve the NOC auth model at the next stakeholder meeting before building.

### [v0.9] `DTEC.SYSADMIN` role
Feature-flag admin UI was disabled in commit `f86c19a` pending a proper role gate. Build the `DTEC.SYSADMIN` role and re-enable the three server-side layers (nav tab, page handlers, feature-flag server actions).

### [v0.9] Monitoring + alerting
Error reporting (Sentry-equivalent), uptime checks, log aggregation, error-budget dashboard, and a paging surface for production-incident response.

### [v0.9] Backup + restore procedures
Documented, tested, with RTO / RPO targets. Includes the `applications`, `organizations`, `org_slot_allocations`, `audit_log`, and `quota_changes` tables at minimum.

### [v0.9] Production runbook + on-call rotation
Who gets paged, what they do, how to escalate, and how to roll back a bad deploy. Pairs with the e2e-deployed workflow already in CI.

### [v0.9] Anomaly digest emails
Scheduled daily / weekly summary to IOC / OCOG / D.TEC covering new applications, flagged duplicates, unresolved returns, direct-entry counts per NOC, and quota-over-threshold warnings. (Carried over from the prior TODO-006.)

### [v0.9] GDPR right-to-erasure workflow
Operator-initiated delete-by-email / delete-by-reference workflow covering applications, contacts, audit-log anonymisation, and confirmation receipts. Aligned with the eventual data-retention policy below.

### [v0.9] Data retention policy implementation
Automated purges aligned with the retention schedule once GDPR residency + retention decisions are confirmed. Works hand-in-hand with the right-to-erasure workflow.

### [v0.9] Test data management
Admin UI + scripts to reset, seed, and reload sample NOCs, organisations, and applications for dev and staging environments. Starting point: the `scripts/reset-enr-to-draft.ts` fragment already in the repo.

### [v0.9] Test data generation
Synthetic NOCs, organisations, and applications at realistic scale (hundreds-to-low-thousands per NOC for the largest territories) so we can load-test and perf-test before v1.0. Distinct from the management tooling above: this is generating *new* realistic data, not reloading known fixtures.

### [v0.9] Complete role permissions matrix document
`docs/role-permissions.md` is the authoritative role × action matrix. Extend and confirm it as v0.9 introduces new authentication (SSO), the `DTEC.SYSADMIN` role for the feature-flag admin UI, and any new admin actions that fall out of the committed items above. Keep the matrix in sync with `src/lib/session.ts`, `src/middleware.ts`, and the per-route guards as those evolve.

### [v0.9] UI copy finalisation pass
Full review of user-facing copy — form labels, status messages, help text, email templates — with business sign-off. Terminology: replace "sponsoring organisation" with **"Responsible Organisation"** everywhere in UI copy and user-facing documentation (per Emma's 2026-04-02 feedback), particularly in IOC-Direct contexts. English is the source; French (already shipped) and Spanish (now committed below) follow from this pass.

### [v0.9] Spanish localisation — applicant surfaces only (revised 2026-04-26 PM)
Plan §4.2 requires English + French + Spanish for IOC↔NOC press-accreditation correspondence and Press by Number forms/manual. **Scope narrowed 2026-04-26 PM** during the Emma feedback walkthrough (#33): NOC-admin screen localisation is demoted from v0.9 to v2.0 for both French and Spanish, pending confirmation that smaller NOCs actually need it (most back-office tooling is English-only in similar D.TEC contexts). Open meta-question lives in stakeholder-questions §6.4c.

**v0.9 minimum scope (committed):**
- `/apply` public form pack — `src/lib/i18n/es.ts` mirroring `fr.ts`, EN|FR|ES toggle on the public surface.
- Applicant transactional emails (verification, status, return).

**Demoted to v2.0 (conditional on stakeholder confirmation):**
- NOC-facing admin screens — EoI queue, PbN allocation, ENR prioritisation. Symmetric for French and Spanish.
- NOC user manual / help page. Symmetric for French and Spanish.

OCOG and IOC admin screens stay English-only per plan §4.2 (IOC↔LA28 correspondence is English) — confirmed by Emma #33. Sequence after the UI copy finalisation pass so we translate finalised English. Companion open question (does the EoI form capture a `preferred_language` for return visits?) is in stakeholder-questions §1.6.

### [v0.9] OIAC visa caveated copy on `/apply/how-it-works`
Plan (Other Key Points) describes the OIAC card + valid passport as carrying a ≥1-month-before / ≥1-month-after entry/work-permit privilege, but flags this as "to verify given the Games-time visa arrangements to be confirmed by LA28 and the relevant US authorities." Add a single caveated paragraph to `/apply/how-it-works` with an explicit "subject to LA28 + US authority confirmation closer to the Games" qualifier. Mirror in EN / FR / ES (rolls into the Spanish localisation work above). Gate copy ship on Emma's blessing of the wording. All other Press by Name / OIAC mechanics remain in ACR scope.

### [v0.9] Government / ineligibility soft-warn flag at NOC review
Plan §1.3 lists ineligible entities (publishers, marketing, athlete management, advertising/PR/promotion agencies, commercial partners, government ministries) and §2.3 step 2 says these "will be automatically rejected if an NOC attempts to allocate to them." Most of these categories are not reliably inferable from EoI form fields. Implement narrowly:
- Detect `.gov` / `.gov.*` email domains at submission.
- Surface a flag in the NOC review drawer.
- Require NOC acknowledgement ("I confirm this isn't a government ministry") before accept-as-candidate.
- Treat as soft-warn, not auto-reject — false positives at the public form would be costly.
Surface the wider ineligibility list as guidance text on `/admin/noc/help` and on the in-form NOC reviewer copy; this is mostly a process rule.

### [v0.9] NOC allocation hierarchy soft-sort + help-page guidance
Plan §1.6 recommends allocation priority: national news agency → national sports agency → general daily → sports daily → specialist mag → general mag. Implement as guidance, not enforcement (plan says "should consider"):
- Add an "IOC suggested priority" sort option to the NOC EoI queue and PbN allocation table that orders rows by `org_type` priority. NOC retains discretion.
- Document the hierarchy on `/admin/noc/help` and in the in-form NOC reviewer copy.

### [v0.9] ENR >3 slot soft warning on EoI form
Plan §Non-MRH allocation reminders: "Up to three people from each non-MRH organisation may be accredited, with certain exceptions for certain organisations (e.g., CNN)." Add a soft informational warning on the ENR section of the EoI form when `slots_requested > 3`: "IOC only approves more than 3 ENR slots for certain press organisations." No hard cap, no schema change, no per-org override — IOC's existing free-integer grant flow (FR-024) handles the exception case organically.

### [v0.9] IOC-Direct ENR path for CNN-class organisations
Plan §Non-MRH allocation reminders: "The IOC allocates ENR accreditations directly to some non-MRH organisations with an international focus (e.g. CNN)." Today ENR is strictly NOC-mediated. Extend the existing `IOC_DIRECT` pseudo-NOC pattern (FR-026) to ENR:
- Relax the `enr_requests.noc_code` FK to allow `IOC_DIRECT`.
- Mirror the NOC ENR prioritisation screen at `/admin/ioc/enr/direct` so the IOC can grant ENR slots directly to international-focus non-MRH orgs without NOC involvement.
- Reserved-list block (already implemented for E-categories) prevents NOC-side double-submission for these orgs.
Cross-cutting open question — what country/NOC do we record for multinational orgs in general (CNN, Reuters, AFP, AP, Xinhua, Getty, Bloomberg)? — lives in `stakeholder-questions-21-April-2026.md`.

### [v0.9] Release-process doc + ≥3-week IOC review checklist
Plan §2.3: "These documents must be sent to the IOC in advance, allowing no less than three weeks for review and comment." Document the rule once, then enforce by checklist:
- Add a `docs/release-process.md` (or extend `docs/release-notes.md`) describing which surfaces require ≥3-week IOC review (EoI form fields, applicant-facing copy, applicant emails, NOC manual) vs which can ship freely (admin internals, bug fixes).
- Add a per-release checklist item: "Has this change been with the IOC for ≥3 weeks? Yes / N/A".
No portal feature; pure release discipline.

### [v0.9] Awaiting external input — from Emma 2026-04-21 + 2026-04-24
Items blocked on external content and revisited once the inputs land. Updated 2026-04-26 with new entries from Emma's 2026-04-24 Word-comment review.

- **How-it-works intro copy** — IOC is rewriting the introduction / explanation text on `/apply/how-it-works` (and anywhere the portal explains the process). We have shipped an interim "subject to IOC review" banner; remove the banner and replace the copy when Emma delivers the approved text.
- **Privacy notice wording** — the submit-confirmation modal's privacy notice needs IOC-Legal sign-off before we can treat it as final. Current text ships as-is; pick up the rewrite once Legal responds.
- **Back-office PbN contact fields** — Emma flagged (2026-04-21 + reinforced 2026-04-24 #8) that when an NOC approves an accreditation, the PbN form in the NOC back-office needs full contact fields. **Interim spec from Emma's MiCo26 reference**: first name, last name, company, email, website, address, phone number. **Replace with Martyn's official LA28 form when delivered.** Bundle with the §4.4b Option C (mandatory at PbN submission) work.
- **NOC E nomination tip text on §1.5 / Direct Entry UI** — IOC to provide replacement copy (per Emma #70). Substance: NOC press attachés can ONLY have NOC E; quota arrives bundled with E/EP/etc. allocation.
- **Post-submit confirmation message review** — IOC to review the applicant-facing success page text + email body (per Emma #59).
- **IOC ENR review screen — EoI fields list** — Emma to provide via Discus the list of EoI fields needed for ENR allocation decisions (per #224); D.TEC then surfaces those fields on `/admin/ioc/enr`.
- **RUS/BLR country eligibility handling (A11)** — Confirm whether EoI submissions from organisations in Russia (RUS) or Belarus (BLR) should be hard-blocked at submission, or soft-flagged for OCOG review. EOR (Refugee Olympic Team) is country-less and must bypass any country validation. Implementation blocked pending this decision.

### [v0.9] PbN mandatory field set (interim, per MiCo26 reference)
Per Emma 2026-04-24 #8, PbN submission to OCOG (the `draft → noc_submitted` transition) must enforce the full Martyn field set populated for each org. **Interim mandatory set**: first name, last name, company, email, website, address, phone. Server-side validation at the state transition, not at row creation. Direct Entry / Inline PbN Entry stay lightweight at create-time (org name, type, country, category). Replace interim list with Martyn's official LA28 form when delivered. Bundles with §4.4b Option C resolution in stakeholder-questions.

### [v0.9] NOC Es category (sport-specific NOC press attaché)
Per Emma 2026-04-24 #197: NOC Es is a needed accreditation category — sport-specific NOC press attaché, complementing the existing NOC E (general press attaché). Schema: add `noc_es_total` to `noc_quotas`; add `noc_es_slots` to `org_slot_allocations`. Surface in NOC PbN allocation table, OCOG PbN view, ACR export (PRP-FR-020), Master Allocation Dashboard. Conditional on entity_type or always-present per IOC quota assignment.

### [v0.9] NOC PbN screen inline contact visibility
Per Emma 2026-04-24 #8: NOCs need to see contact name, email, website at-a-glance on each PbN allocation row to verify their submission is correct (especially with the new EoI process). Today the screen surfaces category + org name only. Add inline contact-info columns; reduces submission errors at scale (~2,000 affiliated NOC orgs total across 206 NOCs).

### [v0.9] Cancel PbN entry action
Per Emma 2026-04-24 #9: NOCs need a way to cancel a PbN entry entered by mistake.
- Available from `draft` and `noc_submitted` states.
- For orgs from EoI: deletes the `org_slot_allocations` row; EoI application stays in candidate pool.
- For orgs added via Direct Entry / Inline PbN Entry (no prior EoI): deletes the allocation row AND marks the org/application as `cancelled`. Org record persists per PRP-FR-029 cross-Games persistence; application is voided.
- Audit logged as `noc_pbn_cancel` with optional reason note.
- Confirmation modal before cancel.
- After `ocog_approved`: requires OCOG reversal first (existing flow).
- After `sent_to_acr`: not possible in PRP (Model A handoff). Will be revisited if §4.3 master-status re-open changes the cutoff.

### [v0.9] LA28 cross-RO change feed
Per Emma 2026-04-24 #11 (and #66): "there will be many changes to press organisations, contact person, accreditation quotas. How will this be managed in the system. The other RO will also have changes /additions/cancellations. How does LA28 see them." New view at `/admin/ocog/changes` showing additions/edits/cancellations across NOCs, IFs, and IOC-Direct, sortable by RO and date, with a since-last-export filter. Foundation for the weekly status reports the Strategic Plan §4.1 references. **Independent of the §4.3 master-status re-open** — can ship before that decision lands. The IOC-Direct continuous-update feed (§4.2) is held until §4.3 resolves, but this cross-RO feed is the foundation either way.

### [v0.9] Date sweep — 24 August → 31 August 2026
Per Emma 2026-04-24 #65: EoI window opens 31 Aug, not 24 Aug. Search and replace across docs (PRP-rq.md, gap-analysis, monkey-test, test-plan, release-notes) and UI copy (`/apply/how-it-works`, public window-state messages, stakeholder-questions §1.3).

### [v0.9] Multi-select sport picker on EoI for Es / EPs
Per Emma 2026-04-24 #63: organisations may request multiple Es and EPs across multiple sports. Today's single-select picker doesn't model this cleanly. **D.TEC prior — option 1A (org-level multi-sport):** convert the picker to multi-select when Es>0 or EPs>0; capture coverage scope (e.g. "4 EPs across Athletics + Swimming"); per-individual sport binding deferred to Press by Name. Schema: child table `application_sport_scope` or JSON column on `applications`. **Open sub-question (option 1B):** do IOC/OCOG need per-slot sport granularity at EoI ("2 EPs for Athletics + 2 EPs for Swimming")? Build per 1A; revise if 1B is required.

### [v0.9] IOC review + flag surface (parity with OCOG)
Per Emma 2026-04-24 #73, #77, #246: IOC actively reviews NOC and IF submissions for compliance (which orgs are accredited), separate from but parallel to OCOG's coordinator role. Today PRP-FR-019 has IOC as read-only on PbN. Promote IOC to "review + flag" parity: a sibling screen at `/admin/ioc/pbn-review` showing all NOC and IF PbN submissions with the same data OCOG sees, plus a "raise issue" / "flag concern" action that routes a comment back to the NOC. Audit logged. Does **not** include any approve / publish power — neither OCOG nor IOC approves individual orgs (per §2 reframe).

### [v0.9] Return-flow status + comments + NOC notification mechanic
Per Emma 2026-04-24 #73 (+ Ken follow-up): when OCOG or IOC find an issue with a submitted form (gov org, quota error, etc.), the system needs to support the return flow. Open design questions: how much is system-supported (status change only vs. inline detailed concerns)? How is the NOC notified (in-app banner, email, both)? **D.TEC prior:** in-app comment thread on the affected PbN row + email notification to the NOC admin via the §6.7 hybrid (PRP sends from OCOG/LA28 domain). Build the mechanic; settle exact UI shape after the meeting confirms the §2 reframe.

### [v0.9] §1.5 Direct Entry UI — surface category access scopes inline
Per Emma 2026-04-24 #71: update the Direct Entry UI and `/admin/noc/help` page to enumerate all categories with one-line access scope each:
- E (Journalist) — ALL venues
- Es (Sport-specific journalist) — own sport venues
- EP (Photographer) — ALL venues
- EPs (Sport-specific photographer) — own sport venues
- ET (Technician) — ALL venues, no seating
- Ec (Support staff) — **MPC only**
- NOC E (Press attaché) — NOC-only Direct Entry category
- NOC Es (Sport-specific press attaché) — new per #197

### [v0.9] INO terminology sweep
Per Emma 2026-04-24 #85: **INO = "International News Organisations"**, not "International Non-Governmental Organisations" (the latter was a misreading on D.TEC's part). Sweep all references in docs (PRP-rq.md, design-confirmation, release-notes, stakeholder-questions, gap-analysis), UI labels (`src/lib/labels.ts`), schema descriptions, and help-page text. The `ino` schema enum value can stay (still works as an abbreviation for International **News** Organisations); only the expansion changes.

### [v0.9] NOC Direct Entry for ENR
Per Emma 2026-04-24 #221: NOCs need the ability to nominate ENR organisations directly without requiring a prior EoI submission, parallel to PRP-FR-007 NOC Direct Entry for E-categories. New entry path: routes to the ENR prioritisation queue with `org_type = enr` and ENR-specific fields (programming type, slot request, must-have / nice-to-have split). Same audit logging shape (`noc_direct_entry`).

### [v0.9] NOC Invite for ENR
Per Emma 2026-04-24 #221: parallel to PRP-FR-032 invite-org pre-fill flow. NOC admin generates an invite link for a known ENR org; link opens an EoI form pre-populated for ENR submission. Lands in the NOC ENR prioritisation queue.

### [v0.9] IOC ENR review Excel export
Per Emma 2026-04-24 #223: downloadable Excel from `/admin/ioc/enr`. **Export-only** (no reimport). Output includes all NOC ENR submissions: priority rank, org name, org type, country, NOC code, NOC's notes / justification, requested slot count (must-have / nice-to-have), contact details. Emma uses the Excel offline to make allocation decisions, then keys the granted slot counts back into the IOC ENR screen. EoI fields needed on the screen are awaiting Emma's Discus list (see "Awaiting external input" above).

### [v0.9] USOPC outreach via Ike Hartman
Per Emma 2026-04-24 #211: Emma to introduce D.TEC to Ike Hartman (USOPC press accreditation lead). Schedule a ~30-minute conversation. Topics: current Excel workflow, expected EoI volume (~1,500 per #56), filter/triage habits, PbN allocation practices. Output feeds stakeholder-questions §2.3b, §4.5, §4.6 IF Sport Specialists.

### [v0.9] NOC rep engagement sessions scheduled
Per Emma 2026-04-24 #255 ("when would this happen"): schedule the 2-3 NOC rep walkthrough sessions described in the stakeholder-questions Appendix. One large territory + one or two smaller territories. Target: before the next stakeholder meeting, or as part of the meeting itself.

### [v0.9] Release Notes in-portal page
Render `docs/release-notes.md` as a reverse-chronological in-portal page (recent at top). Linked from the admin header or footer; visible to all admin roles. Markdown → static page at build time is acceptable for v0.9; no CMS required.

---

## Future Ideas (not committed)

Items below have been considered but are **not** on the plan. They live here so they are not forgotten; they move up into v0.9, v1.0, or v2.0 only when an individual item is explicitly committed.

### Pre-launch hardening (likely between v0.9 and v1.0 when committed)
- **Performance / load test plan** — realistic applicant-submit + admin-queue load before Aug 24.
- **Penetration test** — before public opening on Aug 24.
- **Accessibility VPAT** — formal a11y compliance statement, if LA28 / IOC legal request one.
- **Privacy policy + terms of service** — linked from the public EoI form.
- **Smoke-test checklist per release** — human walkthrough for Railway production after each main merge.
- **Dev / staging / production parity check** — env var inventory, migration lockstep, feature-flag state per environment.

### Post-launch / v2.0 candidates
- **REST API for large NOCs** — authenticated programmatic access to a NOC's territory data. JSON export endpoint already exists; this would wrap it with auth + versioning.
- **Paralympic cross-linking** — link Olympic org records to Paralympic NPC accreditation records.
- **Post-launch analytics dashboard** — submission rates, completion funnel, NOC activity, time-to-decision.
- **Admin bulk actions** — bulk reject / bulk return-for-correction in the NOC queue.
- **Allocation revision history** — Paris workbook pattern replay across PbN revisions.

### Engineering hygiene (nice to have, not tied to a release)
- **Visual regression testing** — Chromatic or Percy after v1.0 launch stabilises.
- **Storybook / component library** — if design continues to evolve.
- **Admin-side free-text translation for cross-NOC viewers.** Free-text fields on EoI submissions (coverage description, additional information, history examples) arrive in the applicant's chosen language. NOC reviewers reading their own NOC's language are fine; OCOG/IOC cross-NOC viewers will hit applications in languages they don't read. Add a "Translate to English / French / Spanish" button on free-text fields backed by a D.TEC API wrapper around AWS Translate (so credentials, rate limiting, audit, and prompt sanitisation stay inside D.TEC infrastructure). Not v0.9 / v1.0 scope — surfaced 2026-04-26 during the Strategic Plan re-review.
