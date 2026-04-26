**Created: 13-Apr-2026 21:30 CEST**
**Last updated: 26-Apr-2026 14:00 CEST**

# Strategic Plan Gap Analysis

Produced on 2026-04-13 after Emma Morris (IOC) shared the **IOC Press Accreditation Strategic Plan (Feb 2026 FINAL)** and the **Paris Master Allocation Table**. This report cross-references our stakeholder-questions document against the Strategic Plan to identify what's already answered, what conflicts, what we missed, and what's still genuinely open.

Refreshed on 2026-04-26: a re-audit of the codebase against the plan produced a "resolved since 13 April" inventory and twelve newly-decided items, captured below in §5 and §6. The original §1–§4 are preserved as a historical record of the 2026-04-13 reading.

> Source of truth: the Strategic Plan is the authoritative IOC document on the accreditation process for LA28, jointly agreed between IOC and LA28.

---

## 1. Questions the Strategic Plan ALREADY ANSWERS (resolve internally)

1. **3.1 — Who receives quotas beyond NOCs?** Plan §2.8: NOCs, selected IFs (~6, sport specialists), IOC-Direct (AFP/AP/Reuters/Xinhua/Getty, non-territory international orgs, Olympic publications, ENRs, IF staff). **No INO category exists.** Close this item.
2. **4.1 Q1 — Is NOC E quota formula-based?** Yes: "calculated exclusively using a fixed formula based on the number of athletes and sports per NOC."
3. **4.1 — NOC E transferability.** "NOC E accreditation will become transferable from LA28 onwards."
4. **5.1 Q1 — ENR submission deadline.** **18 December 2026**, via the Press by Number form (same deadline as PbN).
5. **5.1 Q5 (partial) — ENR self-apply vs NOC nominate.** Non-MRH orgs apply to their NOCs → NOC submits a **priority long list** to IOC → IOC approves/rejects → NOC informs the non-MRH. ENR pool figure is **"approximately 350 to 400"**.
6. **R-5 — ENR partial allocation.** "IOC reviews applications and may reject applications that do not meet the standards." Per-org decisions confirmed.
7. **R-1 / R-8 — EoI as candidacy not accreditation.** NOCs are "solely responsible for handling ALL requests" during the EoI window; IOC has visibility only. Confirms two-stage model — though see conflict #1 on where approval actually happens.
8. **1.3 Q2 — Global deadline.** "The platform will close on 30 October 2026" — hard, IOC-owned. Not a per-NOC choice.

---

## 2. CONFLICTS with the Strategic Plan (discuss with Emma)

1. **R-2 / 3.2 — Who approves PbN. THIS IS THE BIG ONE.** Our docs say "OCOG approves PbN, IOC read-only." Plan contradicts this repeatedly: "**The IOC must approve the accreditation forms**"; "**Mandatory IOC Approval** — IOC Media Operations needs to approve all Press by Number forms"; "IOC and LA28 will review and validate the NOCs' Press by Number forms… IOC will inform the NOCs of any concerns." PbN approval is **IOC-led, with LA28 doing quota-compliance checks**. Our R-2 "RESOLVED 2026-04-11" is wrong; Emma's caveat is correct.
2. **1.5 / 4.4 — NOC "approve as candidate" at EoI.** Plan treats EoI strictly as application collection. There is no EoI-level approval step; candidacy selection happens inside PbN. Our "approve as candidate" UI and the fast-track "pre-approved" concept both misframe the process.
3. **3.2 — Quota entry ownership.** Plan: "Press by Number form is a **pre-populated** form… allocated by the IOC and distributed to NOCs." LA28 will handle distribution via the system. Model A (IOC types into portal) is defensible, but the plan's mental model is clearly IOC → LA28 → pre-populated form. Emma's Model B aligns with the plan.
4. **R-3 — ENR as "completely separate track."** Plan is explicit: ENR "**submissions must be sent to the IOC via the Press by Number form**." ENR is not a separate track — it's a **section of the PbN submission**. Our separate-track architecture diverges.
5. **2.2 — Rejections are permanent / reversals.** Plan: "Any additions or amendments requested by an NOC or individual must be referred by the OCOG to the IOC Media Operations Department." All changes route through IOC, not terminally locked in PRP.
6. **4.3 — After the PRP → ACR handoff, which system is authoritative?** Plan: "The accreditation process will continue up to and during the Games"; extra accreditation requests go OCOG→IOC; weekly IOC status reports run through PbN; inter-category reallocation requires IOC written approval. Our current Model A (ACR terminal; PRP frozen at `sent_to_acr`) contradicts all of this. §4.3 has been rewritten (2026-04-14) as a Thursday P0 with three explicit models (A — ACR takes over; B — PRP stays authoritative and pushes to ACR; C — bidirectional sync) and four decision points. Must be discussed jointly with §4.5 (Excel source of truth) — they are the same underlying question. See `TODOS.md` [TODO-P0-E].
7. **R-4 — IFs have NO ENR.** Plan confirms this, but also says IFs are **Responsible Organisations** for sport-specialist Es/EPs — a concept our docs barely use.

---

## 3. GAPS — Plan topics our questions don't address

1. **NOC quota reallocation rules.** "Requests to re-allocate quotas require written approval from IOC Media Operations"; illegal substitutions (ET→EP) may cause IOC to withdraw accreditation. We have no workflow for inter-category reallocation requests.
2. **NOC allocation hierarchy.** Plan mandates a priority order: national news agency → national sports agency → general daily → sports daily → specialist magazine → general magazine. Our triage signals work ignores this.
3. **Sport Specialists quota for late-qualifying football and co-host cities.** Dedicated FIFA/FEI/World Sailing route for late qualifiers. Completely absent from our design. "**IF is Responsible Organisation**."
4. **Ex/EPx co-host cities.** USOPC-allocated, outside the 6,000 quota, Oklahoma City + football cities. Not in our model at all.
5. **Gender equality quota set-aside.** "IOC sets aside press accreditation quotas specifically for female journalists who are not selected by their respective NOCs." A hidden pool our design doesn't accommodate.
6. **"Responsible Organisation" as a structural role.** The plan uses RO as a role attached to each tab/record (IOC, NOC, or IF). Our data model just has owner NOCs; RO is a richer concept.
7. **Ineligible entity list.** Publishers, marketing, athlete managers, agencies, commercial partners, **government officials/ministries** — "automatically rejected if an NOC attempts to allocate to them." We ask about triage signals but don't hardcode an ineligibility rule.
8. **IOC Master E database + weekly status reports during PbN.** LA28 must send weekly status reports to IOC in an IOC-specified format, and an Excel Master DB persists outside PRP. Our "ACR export + done" model ignores these ongoing reporting obligations. **This is where USOPC's Excel reality lives.**
9. **Three-week IOC document approval lead time.** Every form and press doc must be sent to IOC ≥3 weeks before publication. Affects our EoI form release cadence.
10. **"No show policy" + press conditions undertaking.** NOC E must sign Conditions of Participation. Our design doesn't track undertakings except for ENR.
11. **Accommodation/bed matching.** "Number of beds should always match the number of press accreditations granted." PRP→accommodation system linkage absent.
12. **Working languages.** IOC→NOC correspondence must be **English + French + Spanish**. Our 6.4c asks only about French; Spanish is a miss.
13. **Photographer Code of Conduct / pool access.** Plan references a photographer undertaking and code of conduct — not captured.
14. **Visa/OIAC entry privilege.** The OIAC doubles as a 2-month work/entry permit; implications for data capture (passport, travel docs) likely matter at PbName but worth flagging now.
15. **CNN-type exceptions.** IOC directly allocates ENR to some non-MRH with international focus (e.g., CNN), bypassing the NOC. Our ENR design is NOC-only.

---

## 4. Genuine OPEN questions (plan silent — legitimately ask Emma)

1. **1.1 — Extra EoI fields beyond USOPC pattern.** Plan lists no mandatory EoI field set.
2. **1.2 — Sports dropdown vs free text for Es/EPs.** Plan doesn't specify.
3. **1.4 — Freelancer grouping.** Plan treats freelancers as eligible individuals but doesn't address grouping/reporting.
4. **1.5 Q2/Q3 — Fast-track governance (OCOG notification, OCOG visibility distinction).** Plan doesn't address the portal's fast-track mechanism at all (it predates PRP).
5. **2.3 — Triage signals beyond ineligibility list.**
6. **2.4 — Cross-NOC duplicate detection.** Plan silent; the Master DB implicitly catches it but portal behaviour isn't specified.
7. **4.2 — IOC-Direct management online vs. offline.** Plan has IOC managing these lists externally (Master DB tabs 3–4), which supports Emma's offline preference but doesn't forbid in-portal management.
8. **5.1 Q2 — Amending an ENR submission after sending to IOC.**
9. **5.1 Q4 — Notification content when IOC grants/denies.**
10. **5.2 — ENR Undertaking mechanism.** Plan confirms it exists and will be shared "once News Access Rules are finalised."
11. **6.1 — RACI.** Plan gives role-level authority but no operational RACI for a portal.
12. **6.2 — Common Codes integration.** Plan silent on downstream system wiring.
13. **6.4a/b — NOC account provisioning and manuals.** Plan silent.
14. **6.5 — Pilot NOC strategy.** Plan silent.
15. **Holdback caveat — whether IOC retains quota outside the portal.** Plan confirms IOC Miscellaneous contingency (Master DB tab 7) exists. Worth asking how this surfaces in PRP.

---

## Highest-priority takeaways for Thursday meeting (historical, 2026-04-13)

- **Our PbN approval model (OCOG-approves) is inverted** from what the plan says. R-2 needs to be re-opened.
- **Our EoI "approve as candidate" step has no basis in the plan** — EoI is pure intake.
- **ENR is a section of PbN**, not a separate track, and uses the 18 Dec 2026 PbN deadline.
- Design blind spots: **Sport Specialists (co-host cities)**, **Ex/EPx local press**, **gender equality set-aside**, **Master E weekly reporting**, **NOC allocation hierarchy**, **government-officials auto-reject rule**, **three-week IOC approval lead time**.
- **Spanish** is a missing language requirement alongside French.
- **USOPC's Excel reality** is likely the IOC Master E database itself (PbN tabs) — understanding that document is key to the "Excel import/sync" question.

---

## 5. Resolved since 13 April (audit confirmed 2026-04-26)

The 2026-04-13 → 2026-04-26 commits and decisions resolved the following plan items. They no longer require action from this gap analysis.

- **Two-stage architecture (EoI as intake only, PbN as authoritative allocation).** EoI "approve as candidate" reframed across `/apply` copy and the NOC review drawer. PRP-FR-006 + PRP-FR-009 reflect the model.
- **PbN approval inversion.** IOC sets quotas; OCOG formally approves PbN; IOC retains override authority. PRP-FR-013 and PRP-FR-019.
- **ENR is part of PbN, same 18 Dec 2026 deadline.** ENR self-application via the EoI form, NOC prioritisation, IOC grant from holdback. PRP-FR-022 to PRP-FR-025.
- **6,000 hard cap (§2.1).** `event_settings.capacity` defaults to 6000 in `src/db/schema.ts`. Excludes Ex/EPx as required by the plan.
- **Responsible Organisation terminology.** Adopted in PbN, IOC-Direct, and ENR UI. Remaining sweep tracked under v0.9 "UI copy finalisation pass".
- **Org type taxonomy (`non_mrh`, `ino`, `if_staff`).** Shipped in commit `b1f2697`.
- **30 Oct 2026 hard EoI window close.** OCOG-controlled, plan-aligned (PRP-FR-005).
- **French localisation of `/apply`.** Shipped in commit `982ff55`.
- **EoI deadline as IOC-owned, not per-NOC.** Reflected in PRP-FR-005.
- **NOC reversal model.** Plan: amendments must route through IOC. PRP supports OCOG reversal (`ocog_approved` → `noc_submitted`) and IOC override path (PRP-FR-019).

## 6. Decisions taken 2026-04-26 against remaining plan items

A re-audit of `main` against the Strategic Plan on 2026-04-26 surfaced twelve items either not in code or worth re-flagging. Each was reviewed with the user and resolved into one of four buckets. The full discussion lives in `~/.claude/plans/please-review-docs-input-and-optimized-tome.md`; this section captures the conclusions.

### Bucket A — Committed v0.9 PRP code work

| Item | Plan ref | Decision |
|---|---|---|
| Government / ineligibility soft-warn | §1.3 | Flag `.gov` email domains at NOC review with NOC-acknowledge override. Other ineligible categories (PR, athlete management, etc.) handled as guidance copy in NOC help, not auto-detection — they aren't reliably inferable from EoI fields. |
| NOC allocation hierarchy soft-sort | §1.6 | Add an "IOC suggested priority" sort option to NOC EoI queue and PbN allocation table, ordering rows by `org_type` priority. Plus add the hierarchy to `/admin/noc/help` and in-form NOC reviewer copy. No hard enforcement (plan says "should consider"). |
| ENR >3 slot soft warning | §Non-MRH allocation reminders | Soft informational warning on the ENR EoI section when `slots_requested > 3`. No hard cap, no schema change. IOC's existing free-integer grant flow handles CNN-class exceptions organically. |
| IOC-Direct ENR path | §Non-MRH allocation reminders | Extend the `IOC_DIRECT` pseudo-NOC pattern to ENR. Relax `enr_requests.noc_code` FK to allow `IOC_DIRECT`; mirror the NOC ENR prioritisation screen at `/admin/ioc/enr/direct`. Reuses FR-026 + FR-024 patterns. |
| Spanish localisation | §4.2 | **Promoted from `TODOS.md` "pending" to committed v0.9 scope.** Minimum surfaces: `/apply` form pack, applicant emails, NOC-facing admin screens (EoI queue / PbN / ENR prioritisation), NOC user manual. OCOG and IOC admin screens stay English-only per plan §4.2. Sequence after the v0.9 UI copy finalisation pass. |
| OIAC visa caveated copy | §Other Key Points | Add a caveated paragraph to `/apply/how-it-works` describing the OIAC's intended visa/entry function with an explicit "subject to LA28 + US authority confirmation closer to the Games" qualifier. Mirror in EN / FR / ES. Gate ship on Emma's blessing of the wording. |

### Bucket B — Committed v0.9 process / docs work

| Item | Plan ref | Decision |
|---|---|---|
| Three-week IOC document approval lead time | §2.3 | Document the rule in a release-process artifact and a per-release "≥3 weeks with IOC? Yes / N/A" checklist item. No code feature. Scope: IOC-reviewable surfaces (EoI form fields, applicant copy, applicant emails, NOC manual). |

### Bucket C — Open questions for Emma / Martyn (added to `stakeholder-questions-21-April-2026.md`)

| Item | Plan ref | Decision / D.TEC prior |
|---|---|---|
| Multinational org country/NOC assignment | §1.4 (eligibility) | Cross-cutting: for CNN, Reuters, AFP, AP, Xinhua, Getty, Bloomberg etc., what country/NOC do we record on the application — HQ country, journalist's home base, or `IOC_DIRECT`? Affects all flows, not just ENR. Needs a clear rule before launch. |
| Gender equality set-aside pool | §1.6 Gender Equality | D.TEC prior: out-of-PRP for LA28 (set-aside is journalist-level, reads as Press by Name / ACR territory). May live in a future IOC quota-management system. Awaiting Emma's confirmation. |
| IF Sport Specialists flow + co-host city Ex/EPx flow + timing | §2.6, §3.1 | Largest single design gap remaining. Needs flow + timing design before code. Open: (a) does IF flow run as a parallel process reusing NOC screens with body-scoped `pbn_deadline`? (b) is co-host city Ex/EPx a third process distinct from NOC EoI→PbN and IF Sport Specialists? (c) how do all three sequence and overlap? (d) does USOPC Ex/EPx flow through PRP at all, or is it ACR-imported only? |
| Capture applicant's preferred language on EoI | §4.2 | Companion to the Spanish v0.9 commitment. Should EoI capture a `preferred_language` so we serve the right pack on return visits, or stick with browser-locale? Default today is browser-locale-only. |

### Bucket D — Out of scope / parked

| Item | Plan ref | Decision |
|---|---|---|
| NOC E quota formula | §1.6 | Out of PRP scope for LA28. IOC computes the formula on its side and uploads/enters `noc_e_total`. PRP is the recording surface, not the calculator. Re-evaluate for LA2030+ if PRP grows into a quota-creation system. |
| NOC E individual transferability | §1.6 NEW! | ACR / Press by Name scope. PRP allocates the slot to an org during PbN; person-to-person transfer happens downstream. |
| Photographers Undertaking + NOC E Conditions of Participation | §1.6, §1.3, Annexes | Both individual-level, both Press by Name (ACR, 2027) territory. Add a sentence to PRP-FR-025 noting these are intentionally out of scope. ENR News Access Rules undertaking remains the only PRP undertaking concern. |
| Admin-side free-text translation for cross-NOC viewers | (not in plan) | **Future Ideas only**, not v0.9 / v1.0. Backed by a D.TEC API wrapper around AWS Translate so credentials, rate limiting, audit, and prompt sanitisation stay inside D.TEC infrastructure. |

### Cross-references

- Bucket A and B items land in `TODOS.md` v0.9 / v1.0 sections.
- Bucket C items land in `docs/input and feedback/stakeholder-questions-21-April-2026.md` Part 1.
- Bucket D items land in `TODOS.md` Future Ideas (translation only) or are non-actions documented here.
