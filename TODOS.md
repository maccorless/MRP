**Last updated: 21-Apr-2026**

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
Outbound email for invite links, applicant status-token links, batch communications (post-2.5 resolution), and admin notifications. Includes: sender domain (D.TEC / portal, not IOC or OCOG per 2026-04-16 meeting decision), retry + bounce handling, template management, audit log of sent messages.

### [v0.9] SSO integration (D.TEC IAM)
Retire the hardcoded-password path above. Admin sessions defer to D.TEC IAM policy when SSO is integrated (per R-9).

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
Full review of user-facing copy — form labels, status messages, help text, email templates — with business sign-off. Terminology: replace "sponsoring organisation" with **"Responsible Organisation"** everywhere in UI copy and user-facing documentation (per Emma's 2026-04-02 feedback), particularly in IOC-Direct contexts. English is the source; French (already shipped) and Spanish (pending Part 2 walkthrough confirmation of the language scope) follow from this pass.

### [v0.9] Awaiting external input — from Emma 2026-04-21
Three items from Emma's 2026-04-21 EoI walkthrough are blocked on external content and must be revisited once the inputs land:

- **How-it-works intro copy** — IOC is rewriting the introduction / explanation text on `/apply/how-it-works` (and anywhere the portal explains the process). We have shipped an interim "subject to IOC review" banner; remove the banner and replace the copy when Emma delivers the approved text.
- **Privacy notice wording** — the submit-confirmation modal's privacy notice needs IOC-Legal sign-off before we can treat it as final. Current text ships as-is; pick up the rewrite once Legal responds.
- **Back-office PbN contact fields** — Emma flagged that when an NOC approves an accreditation, the PbN form in the NOC back-office needs full contact fields (name, email, etc.) so OCOG can contact each accredited organisation for press accommodation, SEAT, Press-by-Name registration, etc. Discuss with Emma + Martyn at the next joint meeting; commit to a back-office spec change after that.

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
