**Created: 13-Apr-2026 21:30 CEST**
**Last updated: 14-Apr-2026 17:00 CEST**

# Strategic Plan Gap Analysis

Produced on 2026-04-13 after Emma Morris (IOC) shared the **IOC Press Accreditation Strategic Plan (Feb 2026 FINAL)** and the **Paris Master Allocation Table**. This report cross-references our `docs/stakeholder-questions.md` against the Strategic Plan to identify what's already answered, what conflicts, what we missed, and what's still genuinely open.

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
5. **2.2 — Rejections are permanent / reversals.** Plan: "Any additions or amendments requested by an NOC or individual must be referred by the OCOG to the IOC Media Operations Department." All changes route through IOC, not terminally locked in MRP.
6. **4.3 — After the MRP → ACR handoff, which system is authoritative?** Plan: "The accreditation process will continue up to and during the Games"; extra accreditation requests go OCOG→IOC; weekly IOC status reports run through PbN; inter-category reallocation requires IOC written approval. Our current Model A (ACR terminal; MRP frozen at `sent_to_acr`) contradicts all of this. §4.3 has been rewritten (2026-04-14) as a Thursday P0 with three explicit models (A — ACR takes over; B — MRP stays authoritative and pushes to ACR; C — bidirectional sync) and four decision points. Must be discussed jointly with §4.5 (Excel source of truth) — they are the same underlying question. See `TODOS.md` [TODO-P0-E].
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
8. **IOC Master E database + weekly status reports during PbN.** LA28 must send weekly status reports to IOC in an IOC-specified format, and an Excel Master DB persists outside MRP. Our "ACR export + done" model ignores these ongoing reporting obligations. **This is where USOPC's Excel reality lives.**
9. **Three-week IOC document approval lead time.** Every form and press doc must be sent to IOC ≥3 weeks before publication. Affects our EoI form release cadence.
10. **"No show policy" + press conditions undertaking.** NOC E must sign Conditions of Participation. Our design doesn't track undertakings except for ENR.
11. **Accommodation/bed matching.** "Number of beds should always match the number of press accreditations granted." MRP→accommodation system linkage absent.
12. **Working languages.** IOC→NOC correspondence must be **English + French + Spanish**. Our 6.4c asks only about French; Spanish is a miss.
13. **Photographer Code of Conduct / pool access.** Plan references a photographer undertaking and code of conduct — not captured.
14. **Visa/OIAC entry privilege.** The OIAC doubles as a 2-month work/entry permit; implications for data capture (passport, travel docs) likely matter at PbName but worth flagging now.
15. **CNN-type exceptions.** IOC directly allocates ENR to some non-MRH with international focus (e.g., CNN), bypassing the NOC. Our ENR design is NOC-only.

---

## 4. Genuine OPEN questions (plan silent — legitimately ask Emma)

1. **1.1 — Extra EoI fields beyond USOPC pattern.** Plan lists no mandatory EoI field set.
2. **1.2 — Sports dropdown vs free text for Es/EPs.** Plan doesn't specify.
3. **1.4 — Freelancer grouping.** Plan treats freelancers as eligible individuals but doesn't address grouping/reporting.
4. **1.5 Q2/Q3 — Fast-track governance (OCOG notification, OCOG visibility distinction).** Plan doesn't address the portal's fast-track mechanism at all (it predates MRP).
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
15. **Holdback caveat — whether IOC retains quota outside the portal.** Plan confirms IOC Miscellaneous contingency (Master DB tab 7) exists. Worth asking how this surfaces in MRP.

---

## Highest-priority takeaways for Thursday meeting

- **Our PbN approval model (OCOG-approves) is inverted** from what the plan says. R-2 needs to be re-opened.
- **Our EoI "approve as candidate" step has no basis in the plan** — EoI is pure intake.
- **ENR is a section of PbN**, not a separate track, and uses the 18 Dec 2026 PbN deadline.
- Design blind spots: **Sport Specialists (co-host cities)**, **Ex/EPx local press**, **gender equality set-aside**, **Master E weekly reporting**, **NOC allocation hierarchy**, **government-officials auto-reject rule**, **three-week IOC approval lead time**.
- **Spanish** is a missing language requirement alongside French.
- **USOPC's Excel reality** is likely the IOC Master E database itself (PbN tabs) — understanding that document is key to the "Excel import/sync" question.
