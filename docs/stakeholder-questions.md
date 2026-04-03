# LA28 Media Registration Portal — Open Questions for Stakeholders

**Date:** 2026-04-02

**From:** D.TEC (Ken / DTEC)

**To:** IOC Media Operations (Emma / IOC OIS), LA28 Accreditation Lead (Martyn / OCOG)

**Purpose:** Confirm, choose, or discuss the items below so we can finalise the portal design before the August 24 launch.

**How to use this document:** Each item describes a real scenario that will happen in the portal, explains what we've built or plan to build, and asks for your input. Items marked **PROVISIONAL** have a working default — we'll keep it unless you tell us otherwise. Items marked **OPEN** need a decision before we can build.

> **IOC feedback received 2026-04-02:** Emma Morris (IOC Media Operations) has reviewed the design confirmation document and provided 29 inline comments plus written feedback. Key themes from that review are reflected throughout this document. Items updated or added based on Emma's feedback are marked [EM 2026-04-02] in their description where applicable.

**Where NOC input would help:** Some questions affect how NOC administrators experience the portal day-to-day. We've flagged these — you may want to run them past 2–3 NOC representatives (ideally one large territory like USA/GBR/FRA and one smaller territory) to validate that the workflow makes sense from their side.

**A note on roles:** Throughout this document, please keep in mind the general role boundaries:
- **OCOG (LA28)** is the primary review and approval authority for most workflows — EoI visibility across NOCs, PbN formal approval, and cross-NOC oversight.
- **IOC** oversees the process but generally does not approve — with specific carved-out exceptions: ENR grants from the holdback pool, IOC-Direct reserved organisations, and setting per-category quota totals.
- **NOC** owns their territory's EoI review and PbN slot allocation.

**Terminology note [EM 2026-04-02]:** Emma Morris (IOC) requests that the term **"Responsible Organisation"** be used instead of "sponsoring organisation" throughout the portal and documentation. This applies wherever we previously described one organisation as "sponsoring" or acting as the owning body for another, particularly in the IOC-Direct context.

---

## 1. Expression of Interest (EoI) — The Public Application Process

These questions relate to the public-facing form that media organisations use to apply for press accreditation through their NOC.

---

### 1.1 EoI Form Fields — Final List

**Status:** OPEN — we need your input

**Scenario:** A journalist at a news agency in Brazil opens the portal and fills out the EoI form. The form currently has five sections: Organisation details (name, type, country, website, address), Contacts (primary + optional secondary), Accreditation categories (E/Es/EP/EPs/ET/EC with requested quantities), Publication details (type, circulation, frequency, sports), and History (prior Olympic/Paralympic accreditation, past coverage examples).

We built these fields based on the USOPC EoI form and our stakeholder interviews. However, the IOC or OCOG may require additional fields — for example, media accreditation numbers from prior Games, ISSN numbers, or specific affiliation details.

A related question: different NOCs may want to ask applicants slightly different things. Rather than building per-NOC custom forms, we could offer a small number of configurable "free-form fields" that each NOC can label and use as they see fit — for example, "NOC-specific notes" or "Additional information your NOC has requested." This would keep the core form standardised while giving NOCs flexibility.

**What we need:**
1. Please review the current field list and confirm it is complete, or tell us what to add or remove. New fields are low effort to add.
2. Is a standard form sufficient for all NOCs, or do some NOCs need the ability to ask additional questions? If so, would 1–2 configurable free-form fields per NOC be enough?

**Roles impacted:** Applicant (media organisations), NOC Admin (reviews what applicants submit), OCOG Admin (cross-NOC visibility)

---

### 1.2 Sport-Specific Categories (Es / EPs) — Free Text vs. Dropdown

**Status:** PROVISIONAL — free text is built

**Scenario:** A photographer who specialises in swimming selects the "EPs — Sport-specific photographer" category on the EoI form. The form currently asks them to describe the sports they plan to cover in a free-text field ("Which sports do you plan to cover at LA 2028?"). There is no dropdown list of IOC-recognised sports.

**Our provisional decision:** Free text. It's simpler and flexible — applicants can describe niche coverage (e.g., "artistic swimming and water polo") without being constrained to a single-sport selection.

**Alternative:** A structured dropdown of the 32 LA28 sports. This would make it easier for NOCs and the OCOG to filter and report by sport, but forces applicants into a single-sport selection that may not reflect their actual coverage.

**Please confirm:** Is free text acceptable, or do you need a structured sport dropdown for reporting purposes?

**Roles impacted:** Applicant, NOC Admin (filters applications by sport), OCOG Admin (reporting)

---

### 1.3 EoI Window — Who Controls When Applications Open and Close?

**Status:** OPEN — we need your input

**Scenario:** The global EoI window is scheduled to open August 24, 2026 and close October 23, 2026. In the portal, each NOC can independently open or close their own EoI acceptance window. For example, the USA NOC might close their window a week early because they've received enough applications.

Today, only the NOC admin for that territory can toggle their own window. When a NOC's window is closed, applicants who try to submit see a message: "This NOC has closed its Expression of Interest window. New applications are not currently being accepted."

**Our assumption:** The OCOG controls the global dates (when the overall window opens and closes), and can override individual NOC windows if needed. The IOC has visibility into which NOCs have their windows open or closed but does not directly control them.

**Questions we need answered:**

1. **OCOG control:** Should the OCOG be able to override a NOC's window state? For example, if a NOC closes prematurely and an applicant complains, can the OCOG force the window back open?
2. **Global deadline enforcement:** When October 23 arrives, should all NOC windows close automatically? Or does each NOC close manually, with the OCOG monitoring compliance?
3. **Applicant experience:** When an applicant hits a closed window, should they see "contact your NOC at [email]" with the NOC's contact details, or just a generic "not accepting applications" message?

**Roles impacted:** NOC Admin (controls their window), OCOG Admin (global oversight and override), Applicant (blocked when window is closed)
**NOC input recommended** — ask NOC representatives how they'd want this to work in practice.

---

### 1.4 Freelancers — Do We Need to See Them as a Group?

**Status:** PROVISIONAL — each freelancer is an independent org

**Scenario:** A freelance sports photographer in Italy applies for accreditation. They work independently — no employer, no agency. In the portal, they create an "organisation" record that represents themselves (an "org of 1"). We flag them as a freelancer in the system. Deduplication for freelancers uses name + country (not email domain, since freelancers often use personal email).

**Our provisional decision:** Every freelancer is an independent org record. There is no concept of freelancer collectives or group applications.

**Question:** Is there any scenario where the OCOG or a NOC needs to view, filter, or act on freelancers as a group (e.g., "show me all freelancers in this NOC territory" or "apply a different review standard to freelancers")? Or is reviewing them one at a time, just like any other org, always sufficient?

**Roles impacted:** Applicant (freelancers), NOC Admin (reviews freelancer applications), OCOG Admin (cross-NOC visibility)
**NOC input recommended** — large NOCs likely deal with freelancer applications regularly.

---

### 1.5 NOC Fast-Track Entry — Governance

**Status:** PROVISIONAL — built and working

**Scenario:** The press officer at the German NOC knows that Deutsche Presse-Agentur (DPA) will apply — they've been accredited at every Games for 30 years. Rather than waiting for DPA to discover the portal, fill out the form, and go through email verification, the NOC admin enters DPA's details directly through a "fast-track" route. The application is created pre-approved and immediately eligible for PbN slot allocation.

Fast-track entry collects a subset of the full EoI form — only the essential fields (org name, type, country, category selection, contact details). Fields like publication history, circulation, and prior accreditation details are not required, since the NOC already knows this organisation. The full EoI form remains available if the NOC wants the org to submit a complete application through the public route instead.

**Our provisional decision:** Any NOC admin can fast-track any organisation. The system logs this as a `noc_direct_entry` in the audit trail (distinct from public form submissions). There is no limit on the number of fast-track entries, and no approval gate beyond the NOC admin's own authority.

**Questions we need answered:**

1. Is this acceptable, or should fast-track entries require a second approval (e.g., from the OCOG or a senior NOC official)?
2. Should the OCOG be notified when a NOC uses fast-track, or is the audit log sufficient?
3. Should fast-tracked orgs appear in the OCOG's cross-NOC EoI visibility view alongside public applicants, or be distinguished somehow?

**Roles impacted:** NOC Admin (uses fast-track), OCOG Admin (cross-NOC visibility), IOC Admin (audit visibility)
**NOC input recommended** — does this match how NOCs would actually want to work?

---

## 2. OCOG and NOC Review & Decision-Making

These questions relate to how OCOG and NOC administrators evaluate applications and manage decisions. The OCOG is the primary review authority across NOCs; the IOC has visibility but generally does not approve (with the carved-out exceptions noted above).

---

### 2.1 NOC Workflow — EoI Queue vs PbN Screen

**Status:** PROVISIONAL — confirm with NOC representatives

**Scenario:** A NOC press accreditation manager logs into the portal. They may be there to process new applications, or to work on their slot allocation — or both, across different sessions. Our model is that the NOC operates in two distinct **modes** depending on their intention for that session, not two strictly sequential phases:

**Mode 1 — "Clear the queue" sessions.** The NOC works through pending and resubmitted applications, deciding: approved as candidate, returned for corrections, or rejected. The goal is to keep the queue empty as applications arrive. Fast-track entries (known returning orgs the NOC adds directly) appear here as pre-approved. This mode is purely about eligibility — "is this a legitimate media organisation?" — not about slot quantities.

**Mode 2 — "Work on allocation" sessions.** The NOC opens the Press by Number screen and assigns slot numbers to approved candidates against their IOC quota. This includes candidates from EoI, fast-track entries, and direct PbN additions. The NOC will return to this screen multiple times as they refine their allocation, respond to OCOG feedback, and eventually submit.

**How they interact:** The two modes iterate in practice. New applications may arrive while the NOC is mid-allocation. A NOC might clear a batch of applications in the morning, then switch to the allocation screen in the afternoon. The key design principle is that **each screen serves one intent clearly** — the EoI queue is for eligibility decisions; the PbN screen is for allocation. The NOC home dashboard bridges the two with a summary ("X of Y approved candidates have slots assigned") so they always know where they stand.

**Our provisional design:** EoI queue and PbN screen remain separate. The EoI queue does not show PbN slot status; the PbN screen does not replicate EoI decision controls. The home dashboard provides the cross-screen summary.

**Questions we need answered:**

1. Does this session-intent model match how NOC press accreditation managers actually work in practice?
2. Should the EoI queue show any lightweight PbN progress indicator for approved orgs (e.g. a dot meaning "slots assigned" vs "no slots yet")? Or is the home dashboard summary sufficient?
3. Are there NOCs who would want a combined view — a single screen showing both EoI status and PbN allocation side by side? If so, is this a large-territory-only need?

**Roles impacted:** NOC Admin (primary), OCOG Admin (visibility)
**NOC input strongly recommended** — validate with at least one large-territory and one small-territory NOC representative.

---

### 2.2 Application Reversals — Differentiating EoI Approval from PbN Allocation

**Status:** PROVISIONAL — built and working

**Scenario:** There are two distinct decision points in the process, and it's important to understand what a "reversal" means at each stage:

**Stage 1 — EoI approval (NOC decision):** When a NOC approves an EoI application, they are saying "this organisation is a legitimate media entity eligible to be considered for press credentials." This does not guarantee the org will receive any slots — it places them in the candidate pool for PbN. A NOC might approve 200 organisations but only have quota for 80.

**Stage 2 — PbN allocation (NOC proposes, OCOG approves):** During PbN, the NOC assigns specific per-category slot numbers to approved organisations. Some approved orgs may receive zero slots — effectively not receiving credentials despite being eligible. The OCOG then formally approves (or adjusts) the NOC's allocation.

**Reversals at each stage:**

At the EoI stage, the NOC admin can:
- **Unapprove** (approved → pending): The org is removed from the PbN candidate pool. Any draft PbN allocations for that org are automatically reset. This is audit-logged.
- **Unreturn** (returned → pending): The NOC can re-evaluate without waiting for the applicant to resubmit.
- **Rejections are permanent** — once rejected, an application cannot be un-rejected.

At the PbN stage, the OCOG can:
- **Reverse their approval** (OCOG approved → NOC submitted): Sends the allocation back to the NOC for revision. This is audit-logged.

There is no time limit on any reversal. All reversals are visible in the audit trail.

**Questions we need answered:**

1. Is it acceptable that rejection is permanent? Or should there be a path to reverse a rejection (perhaps requiring OCOG approval)?
2. Should the OCOG see a visual flag on EoI applications that have been reversed (beyond the audit log)?
3. Once PbN allocations have been sent to ACR ("sent to ACR" is currently a terminal state), should reversals be blocked in MRP? Or should MRP allow changes that would then need to be re-synced to ACR?

**Roles impacted:** NOC Admin (EoI reversals), OCOG Admin (PbN reversals, visibility), IOC Admin (audit visibility)

---

### 2.3 Dashboard Filtering — What Signals Help Reviewers Prioritise?

**Status:** OPEN — we need your input

**Scenario:** The OCOG admin looking across all 206 NOCs needs to spot problems — applications from non-journalists, government officials seeking credentials, orgs that have been flagged in prior Games. Similarly, a NOC admin for a large territory like the USA sees 400 pending applications against a quota of 80 press slots and needs to prioritise which to review first.

The dashboards currently show simple tables with status filters (pending, approved, returned, rejected), but no "quality signals" to help triage.

**Questions we need answered:**

1. For the OCOG (primary cross-NOC reviewer): what signals would help you identify problematic applications? Examples: org type (wire service vs. blog), prior Games history, category requested, credentials requested vs. typical allocation, application completeness.
2. Does the OCOG need the ability to flag an application as "content-invalid" (e.g., not a real media org) and surface that flag to the relevant NOC? This would be an annotation, not a rejection — the OCOG wouldn't make the approval decision, but the NOC would see the flag.
3. For NOC reviewers: what signals would help you prioritise within your territory?

**Roles impacted:** OCOG Admin (primary cross-NOC review), NOC Admin (territory triage), IOC Admin (also has visibility)
**NOC input recommended** — large-territory NOCs (USA, GBR, GER, FRA, JPN) would benefit most from better filtering.

---

### 2.4 Cross-NOC Duplicate Detection — Currently Disabled

**Status:** OPEN — we need your input

**Scenario:** A small, unknown media company applies through three NOCs simultaneously, trying to get credentials through whichever one approves first. The OCOG — as the primary cross-NOC authority — might want to catch this.

Separately, major wire services like Reuters legitimately operate in many NOC territories. These cases are expected and not problematic — and the largest of these (AFP, AP, Reuters, Xinhua) are already handled as IOC-Direct reserved organisations, bypassing the NOC process entirely.

**Our current state:** Cross-NOC duplicate detection is turned off. Within a single NOC territory, the system blocks true duplicates (same org applying twice to the same NOC). The `isMultiTerritoryFlag` exists in the database but is not shown to anyone.

**Questions we need answered:**

1. Should the OCOG see a report of organisations that appear in multiple NOC territories (same email domain, different NOCs)?
2. If yes, what action can the OCOG take? Informational only? Flag one submission for the NOC to review? Block a submission?
3. Is there a threshold that distinguishes legitimate multi-territory presence from suspicious behaviour?

The IOC also has visibility into this data, but the OCOG would be the primary actor given their cross-NOC review authority.

**Roles impacted:** OCOG Admin (primary cross-NOC review), IOC Admin (visibility), NOC Admin (receives flags)

---

## 3. Quota Management — IOC Sets the Numbers

These questions relate to how the IOC assigns per-category quotas to each NOC and how those quotas flow through the system.

---

### 3.1 Quota Assignees Beyond NOCs — Who Else Gets Quotas?

**Status:** PARTIALLY RESOLVED — some edge cases remain

**Scenario:** The IOC imports per-category quota totals for each of the 206 NOCs. But there are other entities that also need media quotas:

- **International Federations (IFs):** Resolved — IFs have quotas set by the IOC and enter their own fast-track items for OCOG approval (see R-4 below).
- **IOC-Direct organisations (AFP, AP, Reuters, etc.):** Resolved — managed under a special `IOC_DIRECT` pseudo-NOC code.
- **INOs (International Non-Governmental Organisations):** Not yet addressed. Do INOs receive media quotas? If so, do they follow the NOC workflow?
- **Other edge cases:** Are there any other entities that receive media credential quotas outside the NOC/IF/IOC-Direct model?

**Please confirm:** Are NOCs, IFs, and IOC-Direct the complete list of quota recipients, or are there others?

**Roles impacted:** IOC Admin (assigns quotas), OCOG Admin (approves allocations)

---

### 3.2 Quota Ownership — IOC Enters Direct vs. OCOG Re-keys from Spreadsheet [EM 2026-04-02]

**Status:** PROVISIONAL — Model A (IOC enters quotas directly) is our recommendation; challenging Emma's preference for OCOG re-keying

**Scenario:** The IOC determines per-category quota totals for each of the 206 NOCs. The question is how those numbers get into the portal.

**Current design (Model A — what is built and our recommendation):**
1. The IOC imports or manually enters per-category quota totals directly into the portal.
2. The OCOG reviews and formally approves each NOC's PbN slot allocations.
3. IOC has read-only visibility on PbN.

**Emma's preferred approach (Model B — IOC sends spreadsheet, OCOG re-keys):**
1. The IOC provides quotas externally — via spreadsheet or similar — and the OCOG enters them into the portal on IOC's behalf.
2. The IOC validates and approves the final PbN from each NOC.
3. Emma's email: "the Press by Number process is led by the OCOG who release the information to the NOCs, produce the guide, input the quotas in the system." Comment 151: "OCOG to set NOC category quota as per IOC list. IOC approves the PBN."

**Our challenge to Model B:**

We would like to understand whether there is a reason IOC cannot enter quotas directly in the portal. Entering quotas directly gives IOC full ownership of the record, a complete audit trail of what was set and when, and eliminates re-keying errors — a 206-NOC quota table entered from a spreadsheet by a third party is a significant source of transcription risk. If IOC can enter them directly, we believe that is the better workflow.

Model A is already built. We are not asking for confirmation of Model B — we are asking Emma and Martyn to explain whether there is a process or policy reason IOC cannot enter quotas directly, so we can evaluate whether that reason outweighs the accuracy and audit benefits of direct entry.

If Model B is the confirmed answer, this will require significant rework: the quota-entry screen currently built for IOC Admin would need to be moved to OCOG Admin, and a separate IOC PbN-approval step would need to be added.

**Questions for the April 15/16 meeting:**
1. Is there a process or policy reason the IOC cannot enter quotas directly into the portal?
2. If Model B is required: who formally approves each NOC's final PbN allocation — IOC, OCOG, or both in sequence?
3. If both need to sign off at different stages, what is the approval sequence?

**Roles impacted:** IOC Admin, OCOG Admin (quota-entry and approval authority are the core dispute)

---

## 4. Press by Number (PbN) — Allocating Slots to Organisations

These questions relate to the process where NOCs assign their IOC-given quotas to specific media organisations, and the OCOG formally approves those allocations.

---

### 4.1 NOC E (Press Attaché) — How NOCs Nominate Their Own Staff

**Status:** PROVISIONAL — design decided, not yet fully built

**Scenario:** Every NOC has communications staff — press officers, spokespeople, media liaisons — who need press accreditation to access the Main Press Centre and press areas. These are not external journalists; they work for the NOC itself. The IOC gives each NOC a separate "NOC E" quota for these staff (typically 2–5 people), calculated separately from the main E-category quotas.

These people do not apply through the public EoI form. The NOC nominates them directly.

**Our provisional decision:** The NOC creates a single organisation record representing their own communications team (e.g., "USA NOC Communications Staff") using the fast-track entry route. During PbN, the NOC allocates NOC E slots to this org, and the OCOG approves the allocation as part of the standard PbN approval process. Individual press attaché names are not collected in MRP — that happens later in ACR (Press by Name, 2027).

**Questions we need answered:**

1. Is the NOC E quota formula-based (e.g., based on delegation size), or does the IOC set it manually per NOC like other categories?
2. Are there cases where a NOC needs multiple entries (e.g., "NOC comms team" + "NOC broadcast team"), or is a single "NOC communications staff" org sufficient?
3. Does the OCOG or IOC need to see the individual names of press attachés at this stage, or is a slot count sufficient for MRP?

**Roles impacted:** NOC Admin (nominates their staff), OCOG Admin (approves PbN allocation), IOC Admin (sets NOC E quota)
**NOC input recommended** — ask NOC representatives how they currently handle press attaché nominations.

---

### 4.2 IOC-Direct Organisations — Setup and Workflow [EM 2026-04-02]

**Status:** PROVISIONAL — current design has IOC managing in-app; challenging Emma's offline preference

**Background:** There are approximately 20 IOC-direct international organisations (AFP, AP, Reuters, Xinhua, etc.) that receive press credentials outside the NOC EoI/PbN track. The portal currently implements a model where the IOC manages these organisations in-app — with an IOC-managed screen for adding/removing orgs and OCOG visibility and approval of IOC-Direct PbN allocations. Emma's comments (106, 128, 131, 133, 154) suggest an offline model instead: IOC holds the list externally and shares it with the OCOG, who imports or enrolls those orgs directly into the system.

**Our current design (what is built):**

- The IOC manages the ~20 IOC-Direct orgs through a dedicated portal screen — adding, removing, and managing the list entirely within the system.
- The OCOG can see IOC-Direct orgs and the associated PbN state machine — the IOC approves, the OCOG enrolls.
- Full audit trail: every add, remove, or allocation change is logged with actor and timestamp.
- Real-time OCOG visibility: the OCOG can see the current state of all IOC-Direct org allocations at any point in the process.

**Emma's preferred approach (offline):**

- IOC manages the ~20 IOC-Direct org list entirely offline and sends it to the OCOG directly.
- No portal-based management screen. The OCOG receives the list and imports or enrolls those orgs.
- Emma's comment 154: "No need to approve directly accredited orgs, we will have the pre-determined list."
- Domain-blocking feature we built is unnecessary in Emma's model, as these orgs are well-known and the risk of them accidentally applying via a NOC is low.

**Our challenge to the offline model:**

We would like to understand the reason for keeping this offline. The portal can handle this workflow with full audit trail and OCOG visibility. Is there a policy or process reason IOC-Direct must remain outside the portal? Managing these organisations in the system gives IOC full ownership of the record, eliminates manual handoffs to the OCOG, provides a complete audit trail (who added which org, when, and what allocations they received), and gives the OCOG real-time visibility rather than depending on an emailed list. The current design supports the IOC entering and managing these orgs directly — we think this is the better workflow, and we'd like Emma and Martyn to confirm whether there is a process or policy reason it cannot work this way.

**Terminology [EM 2026-04-02]:** Per the terminology note above, "Responsible Organisation" (not "sponsoring organisation") should be used in UI copy relating to IOC-Direct orgs where one organisation acts as the owning body for another.

**Open question for April 15/16 meeting:** Does the OCOG enroll IOC-Direct orgs through MRP or directly in ACR? This needs Martyn's input regardless of which model is chosen.

**Roles impacted:** IOC (holds the list, approves), OCOG Admin (enrolls/imports, has OCOG visibility), Martyn/OCOG (defines import mechanism)

---

### 4.3 After ACR Export — Is MRP Done?

**Status:** OPEN — we need to discuss

**Scenario:** A NOC completes their PbN slot allocations in MRP. The OCOG approves them. The approved allocations are exported to ACR. At this point, the question is: **what happens in MRP after the data flows to ACR?**

Two possible models:

**Option A — MRP is finished after export.** Once allocations are sent to ACR, all subsequent changes (quota adjustments, slot reallocations, new organisations) happen directly in ACR. MRP is not updated and becomes a historical record of the original allocation process. NOCs and the OCOG log into ACR from this point forward.

**Option B — MRP stays active.** MRP continues to be the source of truth for quotas and allocations even after ACR export. If the OCOG needs to adjust a NOC's allocation, they do it in MRP and re-export to ACR. MRP and ACR stay in sync.

**Our current state:** Once PbN reaches "sent to ACR" status, it's a terminal state in MRP — there is no mechanism to make further changes. This is closer to Option A.

**What we need:** Clarity on whether MRP shuts down after the ACR handoff, or whether it needs to remain the active system for quota/allocation changes throughout the Games cycle.

**Roles impacted:** NOC Admin (where they go for changes), OCOG Admin (where they manage allocations), IOC Admin (where they adjust quotas)

---

### 4.4 NOC Direct-Entry into PbN — No EoI Required [EM 2026-04-02]

**Status:** CONFIRMED FEATURE — being built

**Scenario:** Emma's comments (96, 98) and her email describe a pattern that will be supported: some NOCs will not use the EoI form at all and will want to enter organisations directly into their PbN allocation table without any prior EoI record. Emma notes (Comment 98): "There will be press orgs who will not have submitted an EoI that will need to be entered in the PbN stage directly by the NOC." Her email adds: "some might not use the EoI form, some might enter information directly in the Press by Number form."

**Concrete example:** The NOC press officer for a large European territory knows their national broadcaster will receive PbN slots — they have at every Games for the past 20 years. They never asked the broadcaster to fill out an EoI form. At PbN time, they add them directly to the allocation table. No EoI record is created.

**Confirmed design — direct PbN addition:**

NOC admins will be able to add a new org row directly in the PbN allocation table with no EoI record required. A simple inline form captures the minimum needed to create the org record and add it to the allocation in one step: org name, type, country, and category. The OCOG sees the org in their PbN review and approves (or questions) it there — the same approval flow as any other PbN entry. The OCOG will be able to see which PbN entries had a corresponding EoI record and which were added directly, providing audit visibility without creating a bureaucratic barrier for NOC press officers.

The quota cap still applies: NOCs cannot add direct-entry orgs past their per-category total. This hard cap is enforced regardless of entry route.

**Note on IFs:** This direct PbN entry mechanism also solves the small-IF workflow (see R-4 and the note below).

**Questions for confirmation:**
1. Please confirm the OCOG is comfortable with orgs appearing in PbN without an EoI trail, provided they can see the distinction.
2. Please confirm the hard quota cap applies equally to direct-entry orgs.

**Roles impacted:** NOC Admin (primary — uses direct entry), OCOG Admin (sees and approves PbN result), IOC Admin (audit visibility)
**NOC input recommended** — ask a NOC press officer whether the inline form approach (org name, type, country, category in one step) is simple enough for busy press officers.

---

## 5. ENR — Extended Non-Rights Broadcasters

These questions relate to the separate ENR track, where NOCs nominate broadcasters without Olympic media rights and the IOC grants allocations from a holdback pool. ENR is one of the carved-out areas where the IOC is the direct decision-maker (not the OCOG).

---

### 5.1 ENR Process — Remaining Open Questions

**Status:** MOSTLY RESOLVED — additional sub-questions added from IOC review

**Scenario:** A NOC submits a prioritised list of five ENR organisations to the IOC. The IOC reviews the list and grants allocations from the holdback pool — Organisation A gets the full 20 slots requested, Organisation B gets a partial grant of 10 (out of 22 requested), and Organisation C is denied. The NOC sees the IOC's per-org decisions. The core process is built and tested.

**ENR pool size — confirmed [EM 2026-04-02]:** Emma confirms the total ENR holdback pool is **350 slots** across all NOCs. This is a confirmed figure, not an open question.

**IOC visibility requirement — confirmed [EM 2026-04-02]:** Emma states (Comment 119): "It is important that the IOC is able to see all requests from all NOCs when granting ENRs. The total amount is 350 so visibility on all NOC requests is needed before allocation can begin." This is a confirmed requirement. The current IOC ENR screen — which shows one NOC's list at a time — may need to be redesigned to show a combined multi-NOC view with a running total against the 350-slot cap. This redesign should be scoped before the April 15/16 meeting.

**Questions we need answered:**

1. **ENR submission deadline:** Is there a separate deadline for NOC ENR submissions, distinct from the EoI deadline (October 23)? Or does the same deadline apply?
2. **Amending after submission:** Once a NOC submits their ENR list to the IOC, can they amend it (add an org, change the priority order)? Or is submission final?
3. **ENR undertaking timing:** See section 5.2 — this is now deferred. [EM 2026-04-02]
4. **Decision notification:** When the IOC makes grant/deny decisions, how should the NOC be notified? (Note: email notifications are planned for v1.0; this is a design question about what the notification should contain.)
5. **ENR self-application via the EoI portal [EM 2026-04-02] — proposed model:** Emma raises (Comments 94, 95, 118 and her email) whether ENR organisations should be allowed to apply via the EoI portal themselves, rather than only being nominated by NOCs. Ken's clarification: if ENR self-application is enabled, ENR organisations still flow through the PbN process — they still need quota assigned from the 350-slot pool. The proposed flow is:
   1. ENR org selects "ENR" type on the EoI form and submits.
   2. Application routes to the NOC queue. The NOC's action is not approve/reject — it is to **prioritise and rank** the ENR org within their territory.
   3. The NOC submits a prioritised ENR list to the IOC (orgs ordered by priority, no quantities — the NOC is ranking, not allocating).
   4. IOC views all NOC submissions combined against the 350-slot pool and decides grant amounts per org.

   This is structurally similar to the EoI → PbN flow, but with IOC as the allocator rather than OCOG, and with the NOC's role being prioritisation rather than approval. The 350-slot pool is IOC-owned and IOC-allocated regardless of whether ENR orgs self-apply or are nominated.

   **IOC ENR allocation screen (confirmed requirement):** The IOC ENR allocation screen should mirror the OCOG PbN screen — a cross-NOC table of ENR candidates, showing which NOC nominated/ranked each org, with a running total against the 350-slot cap, and editable allocation per org that the IOC fills in. This is a confirmed design requirement. The current IOC ENR screen shows one NOC's list at a time and needs to be redesigned to this combined multi-NOC view.

   **Open questions:** Should ENR applicants share the public EoI form (with ENR as a selectable org type) or have a separate intake flow? Is the proposed prioritise-and-rank model (no NOC approve/reject) acceptable to both IOC and OCOG?

**Roles impacted:** NOC Admin (submits ENR list, may see ENR self-applications), IOC Admin (makes grant decisions, needs multi-NOC combined view), ENR organisations (potential self-applicants)

---

### 5.2 ENR Undertaking — Legal Mechanism [EM 2026-04-02]

**Status:** OPEN — waiting on IOC Legal; timing updated per IOC feedback

**Updated timing [EM 2026-04-02]:** Emma confirms (Comment 120) that the ENR undertaking will be needed later in the process — likely at the Press by Name stage, not at the ENR nomination or grant stage. IOC News Access Rules need to be finalised before the undertaking text can be drafted. This pushes the in-portal ENR undertaking feature later than originally planned — it is now out of scope for v1.1 and should be re-scoped once IOC News Access Rules are ready. Emma notes: "It is important to scope it" — so it remains on the roadmap, just with a later delivery window than previously estimated.

**Scenario:** Before an ENR organisation can receive accreditation, they must sign an undertaking acknowledging specific terms. This is currently handled outside the portal via Adobe Acrobat.

**Three options — for when this is in scope:**

- **Path A (typed name):** The signatory types their full legal name, checks a consent box, and the system records a timestamp and IP address. A PDF receipt is emailed. This is a small amount of development effort.
- **Path B (DocuSign-grade):** A full e-signature flow with cryptographic proof. Required only if IOC Legal determines typed-name is insufficient. This is significantly more investment than Path A, though Path A work is not discarded.
- **Path C (external process):** Continue using Adobe Acrobat outside the portal. Zero development effort, but the undertaking remains disconnected from the portal workflow and requires manual tracking.

**What we need:** IOC Legal to determine which path is legally sufficient — but this decision is not on the critical path until IOC News Access Rules are ready. The decision target date of April 30, 2026 is now deferred accordingly.

**Roles impacted:** ENR organisations (sign the undertaking), IOC Legal (determines the mechanism), IOC Admin (manages ENR workflow)

---

## 6. Governance & Integration

---

### 6.1 RACI — Who Owns What?

**Status:** OPEN — critical gap

**Scenario:** Three parties are involved in the portal: the IOC (oversees the process and owns specific decision authority for ENR, IOC-Direct, and quotas), LA28/OCOG (primary operational authority — approves PbN, cross-NOC review), and D.TEC (builds and operates the portal).

No RACI document exists. This creates risk around: who signs off on form field changes? Who provisions NOC admin accounts? Who owns the production infrastructure? Who responds to a production incident at 2am?

**What we need:** A one-page RACI covering:
- EoI form field ownership (who decides what fields are on the form?)
- PbN approval authority (OCOG confirmed, but who handles escalations?)
- ENR grant authority (IOC confirmed)
- NOC onboarding and account provisioning
- Production incident response

**Roles impacted:** All roles — this is a governance question

---

### 6.2 Common Codes — Lookup and Coding Trigger

**Status:** OPEN — needs D.TEC internal alignment + OCOG input

**Scenario:** When a media organisation is approved in MRP, it eventually needs an entry in Common Codes — the shared organisation registry used across all accreditation systems. Common Codes assigns each org an official code used by downstream applications (AMS, ADS, Rate Card, ACR).

MRP does not assign Common Codes. The question is how the two systems connect:
- **At submission time:** Should MRP look up existing Common Codes entries when an org submits their EoI (to pre-fill data and link to an existing record)?
- **At approval time:** When a NOC approves an application, should MRP trigger the Common Codes coding workflow via an API call? Or does OCOG ACR staff manually initiate the coding in a separate system?

This is primarily a D.TEC internal question, but the OCOG may have operational input on whether the coding workflow should be triggered automatically or manually.

**What we need:** A decision on the integration direction, and if lookup is desired, the lookup API specification (search by org name? domain? country?).

**Roles impacted:** OCOG Admin (may initiate coding manually)

---

### 6.3 Dedup Policy — Fail Open, Prevent Duplicates Reaching ACR

**Status:** PROVISIONAL — decided

**Scenario:** When an applicant submits an EoI, the system checks whether their organisation already exists (duplicate detection). If the dedup check is slow or times out, the system accepts the application anyway (fail open) — we do not block applicants due to a system issue.

**Our decision:** Fail open at submission time. However, we must systematically prevent any duplicate from reaching ACR. This means:
- A background process catches duplicates after the fact and flags them for NOC/OCOG review
- No duplicate can proceed past PbN approval and into the ACR export without being resolved
- The OCOG has the final say on whether a flagged duplicate is legitimate or should be merged/blocked

**Please confirm** this approach is acceptable — accept all submissions, catch duplicates before they reach ACR.

**Roles impacted:** Applicant (always gets through), NOC Admin (reviews flagged duplicates), OCOG Admin (final authority on dedup resolution)

---

### 6.4 NOC Onboarding and System Manual [EM 2026-04-02]

**Status:** OPEN — governance question

**Scenario:** Emma asks (Comment 185): "As the NOCs will need to be onboarded on to the ACR system, will LA28ACR onboard them? A manual will need to be planned to help the NOCs. Will the system be set up in French too." These are governance questions that need answers before launch.

**Questions we need answered:**

1. **Onboarding responsibility:** Who is responsible for onboarding NOC administrators to the portal — provisioning accounts, communicating login details, and providing initial guidance? Is this D.TEC, OCOG, or IOC? Given OCOG's role as operational coordinator of the PbN process, this feels like an OCOG responsibility, but we need confirmation.
2. **User manual:** Will a user manual or guide be produced for NOC administrators? If so, who writes it — D.TEC (technical), OCOG (process), or a joint effort? Emma notes that the OCOG has been working on a Press by Number template, which may inform or align with any portal guide.
3. **French localisation:** French is planned for v1.1 of the portal. Emma's question implies there may be an expectation of French availability at launch. Is French required at launch (blocking), or is English-first acceptable for the initial prototype and v1.0 rollout, with French following in v1.1?

**Roles impacted:** NOC Admin (receives onboarding), OCOG Admin (may deliver onboarding), D.TEC (may produce manual), IOC (may set language requirements)

---

### 6.5 Pilot NOC Testing [EM 2026-04-02]

**Status:** OPEN — pre-launch strategy question

**Scenario:** Emma suggests (Comment 184): "I think we should test the system with a select number of NOCs." This aligns with the general principle of controlled rollout before full launch, but we have not yet defined the pilot structure. Emma also notes (Comment 168) that the IOC only received test URLs on 30 March before the Easter break, and that OCOG and NOCs also need time to review before agreeing on any launch timeline: "I think we need to agree on this together and be realistic but also recognising time is tight."

**Questions we need answered:**

1. **Pilot NOC selection:** Who selects the pilot NOCs, and by what criteria? (Suggestions: one large territory with high application volume, one mid-size, one small to represent different workflow complexity levels. Geographic and linguistic diversity may also be a factor.)
2. **Pilot timeline:** When would pilot NOC testing begin, and how long would the pilot run before full launch? What is the process for collecting and acting on pilot feedback?
3. **Go/no-go threshold:** What is the threshold for moving from pilot to full launch? Who makes that call — OCOG, IOC, or joint?
4. **April 15/16 meeting:** Emma's comment 168 makes clear that the prototype launch date is not currently agreed. The 15/16 April meeting should include a realistic timeline discussion. D.TEC will prepare a revised timeline proposal for that meeting.

**Roles impacted:** OCOG Admin (may coordinate pilot), IOC (may set go/no-go criteria), NOC Admin (pilot participants), D.TEC (operates the pilot environment)

---

## Resolved Decisions — For Confirmation

The following decisions have been made and implemented. We're listing them here so you can confirm they match your understanding. If anything needs revisiting, we can — these are not locked.

---

### R-1. EoI Owned by NOC; OCOG Has Cross-NOC Review Authority

**Decision:** During the EoI phase, the NOC reviews, approves, returns, or rejects applications for their own territory. The OCOG can see all applications across NOCs (read-only during EoI) and will have filtering tools to identify problematic applications. The IOC has visibility but does not approve or reject EoI applications.

**Clarification — EoI approval = candidacy, not accreditation [Ken 2026-04-02]:** When a NOC approves an EoI, they are approving the organisation as a *candidate for quota consideration* — not granting accreditation. An approved organisation may receive zero slots in PbN. This two-stage model (candidacy → allocation) is intentional and important: a NOC with a quota of 80 press slots might approve 200 organisations as candidates, then allocate slots to the 80 they prioritise in PbN. The remaining 120 approved-but-unallocated orgs receive no credentials.

This distinction is currently implicit in the portal but not made explicit to users. We are updating the portal UI to make the candidacy stage clearer — for example, renaming the "Approve" button to "Approve as Candidate" or adding a tooltip/explanatory note that explains approval does not guarantee a credential allocation. This document note reflects that same language change.

**Roles impacted:** NOC Admin, OCOG Admin, IOC Admin
**Please confirm** the role boundaries during EoI, and confirm that framing EoI approval as "candidacy" (not accreditation) accurately reflects how IOC and OCOG expect NOCs to use this stage.

---

### R-2. PbN Approval — OCOG Approves, with IOC Exceptions

**Decision:** After a NOC submits their PbN slot allocations, the OCOG formally reviews and approves (or adjusts) them. The IOC has read-only visibility on PbN allocations but does not approve them. PbN state machine: Draft → NOC Submitted → OCOG Approved → Sent to ACR.

**Named exceptions where the IOC has direct approval authority:**
- **IOC-Direct organisations:** The IOC allocates slots to reserved orgs (AFP, AP, Reuters, etc.) and submits them for OCOG approval through the same PbN state machine.
- **ENR:** The IOC grants ENR allocations from the holdback pool (separate track, not PbN).
- **IOC-managed quotas:** The IOC sets per-category quota totals per NOC.

**Important caveat [EM 2026-04-02]:** Emma's feedback suggests the approval authority described above may be reversed from the actual process — specifically that the IOC approves the PbN (not just reads it) and the OCOG's role is quota entry and coordination rather than final PbN approval. See section 3.2 for full detail. This resolved decision should be treated as provisional until the April 15/16 meeting with Emma and Martyn confirms which model is correct.

**Roles impacted:** NOC Admin, OCOG Admin, IOC Admin
**Please confirm** the OCOG owns PbN approval and the IOC exceptions are correctly scoped — noting that IOC feedback indicates this may need to be reversed (see 3.2).

---

### R-3. ENR Process — NOC Nominates, IOC Grants from Holdback

**Decision:** ENR is a completely separate track from EoI/PbN. Media organisations do not self-apply for ENR — the NOC nominates them. The NOC submits a prioritised list to the IOC. The IOC reviews each org and grants full, partial, or zero slots from a separate holdback pool. ENR quota is completely separate from E-category quotas.

**Roles impacted:** NOC Admin, IOC Admin
**Please confirm** this matches your understanding of the ENR process.

---

### R-4. IFs — Quota and Fast-Track Only, No Public EoI [EM 2026-04-02 updated]

**Decision:** International Federations (IFs) do not have a public EoI queue. They do not receive self-nomination applications from media organisations. Instead:
1. The IOC sets per-category quotas for each IF (same as for NOCs).
2. IFs enter their own organisations directly via the fast-track route (same simplified form as NOC fast-track).
3. IF fast-track entries go to the OCOG for PbN approval through the same state machine as NOC allocations.

**Confirmed — IFs have NO ENR accreditations [EM 2026-04-02]:** Emma confirms (Comments 100, 112) that IFs do not participate in the ENR track at all. ENR accreditations do not exist for IFs. Any ENR-related screens or logic for IF admin roles should be removed or hidden.

**IF scope significantly narrowed [EM 2026-04-02]:** Emma clarifies (Comments 100, 112) that only approximately 6 IFs need to submit PbN for sport specialist media. All other IFs get quotas for their own staff, and the process for them starts directly at Press by Name (the individual name submission stage, handled in ACR in 2027) — not at the EoI or PbN stage in MRP. This means the IF use-case in MRP is much narrower than previously scoped: only ~6 IFs will actively use the portal for PbN submissions.

**Roles impacted:** IF Admin (only ~6 IFs in scope), OCOG Admin (approves those ~6 IFs' PbN), IOC Admin (sets quotas for all IFs)
**Please confirm** IFs should not have a public EoI queue and should use fast-track entry only. (Note: we may need to adjust the current code to align with this — the IF admin screen currently mirrors the full NOC experience including an EoI queue.) Also confirm: should the ~200 IFs that go straight to Press by Name have any presence in MRP at all, or only in ACR?

**Note on small IFs — proposed model [Ken 2026-04-02]:** Emma notes that only ~6 IFs use MRP for sport-specialist PbN. All other IFs go straight to Press by Name in ACR. Ken's challenge: if IOC still sets the quota for small IFs, why not also manage them in MRP and avoid manual ACR entry? The proposed model is: all IFs are in MRP. Large IFs (~6) use the full PbN flow as currently designed. Small IFs skip EoI entirely and use the direct PbN entry feature (see 4.4) — the IF admin adds their orgs directly to the PbN table, which flows to OCOG approval and then ACR export. Nothing needs to be manually keyed into ACR. Please confirm whether this is feasible or whether there is a reason small IFs should remain outside MRP.

---

### R-5. ENR Partial Allocation (Not All-or-Nothing)

**Decision:** When the IOC reviews a NOC's ENR request list, they decide per org: Granted (full slots), Partial (fewer slots than requested), or Denied (zero slots). The IOC sets the exact number of slots granted for each org. This is not all-or-nothing per NOC.

**Roles impacted:** IOC Admin, NOC Admin (sees decisions)
**Please confirm** per-org partial allocation is correct.

---

### R-6. Flat Org Identity Model (No Parent-Child Hierarchy)

**Decision:** Each territory's instance of an organisation is an independent record. For example, a broadcast company with bureaux in Japan and the United States would have two separate org records — one managed by the JPN NOC and one by the USA NOC. They are linked only by a shared email domain, which triggers a multi-territory flag. A parent-child corporate hierarchy model is deferred.

Note: The largest international wire services (AFP, AP, Reuters, Xinhua) are handled separately as IOC-Direct organisations — they bypass the NOC process entirely and are managed by the IOC.

**Roles impacted:** NOC Admin, OCOG Admin, IOC Admin
**Please confirm** the flat model is acceptable, or let us know if corporate hierarchy visibility is needed.

---

### R-7. IOC Can Edit Quotas After Import

**Decision:** The IOC imports per-category quota totals from a CSV file. After import, the IOC can also edit individual NOC quotas directly in the portal (toggle an edit mode on the quota table). All changes — whether from import or manual edit — are logged in an audit trail (previous value → new value, who changed it, when).

**Roles impacted:** IOC Admin
**Please confirm** both import and in-app editing should be supported.

---

### R-8. Two-Step Process with Simplified Path for Small NOCs

**Decision:** The portal enforces a two-step process: Step 1 (EoI) where the NOC approves eligible organisations, and Step 2 (PbN) where the NOC allocates per-category slots to approved orgs. However, for smaller NOCs with few applicants, we will provide a streamlined experience — for example, allowing approval and slot allocation in a single workflow view, while still maintaining the same underlying data model and OCOG approval process.

**Roles impacted:** NOC Admin (all sizes), OCOG Admin (approves regardless of NOC size)
**Please confirm** a simplified flow for small NOCs is acceptable, as long as the OCOG approval step remains.
**NOC input recommended** — ask a small-territory NOC whether the current two-step process feels burdensome.

---

### R-9. Session Timeout — 8 Hours

**Decision:** Admin sessions expire after 8 hours. There is no idle timeout in v0.1. This value is easily configurable if a shorter timeout is preferred. When v1.0 introduces D.TEC SSO, the timeout will match the SSO provider's policy.

**Roles impacted:** All admin roles
**Please confirm** 8 hours is acceptable for the prototype phase, or specify a preferred duration.

---

### R-10. ACR Stub — Build Now, Integrate Later

**Decision:** We built an ACR adapter with a stub implementation that simulates the real ACR API. The stub will be replaced with the real ACR client when the API contract is finalised (June 1, 2026 go/no-go gate). If ACR is not ready by June 1, the fallback is structured CSV export.

**Roles impacted:** OCOG Admin (triggers export), IOC Admin (visibility)
**Please confirm** this approach is acceptable.

---

*End of document. For the full design specification, see `docs/MRP-design-confirmation.md`. For questions or feedback, contact Ken (D.TEC).*
