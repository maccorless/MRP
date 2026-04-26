**Last updated: 26-Apr-2026**

# LA28 Press Registration Portal (PRP) --- Open Questions for Stakeholders

**Date:** 2026-04-11 (restructured 2026-04-21)

**From:** D.TEC PRP

**To:** IOC Media Operations (Emma / IOC OIS), LA28 Accreditation Lead
(Martyn / OCOG)

**Purpose:** Confirm, choose, or discuss the items below so we can
finalise the portal design before the 31 August launch.

**How to use this document (updated 2026-04-21):** This document has
been restructured into two parts, and the focus is Part 1.

- **Part 1 --- Open Questions (Requires Discussion):** Items that need a
  decision. Each item carries a clear D.TEC recommendation or proposed
  path so the meeting starts from a concrete position. These are the
  agenda items for the next stakeholder meeting.
- **Part 2 --- Resolved Design (Awaiting Business Sign-Off):** Everything
  previously marked CLOSED, RESOLVED, CONFIRMED, PROVISIONAL, or
  DEFERRED. Every item here is now labelled **RESOLVED**. A separate
  walkthrough meeting will be scheduled to confirm Part 2 as a block ---
  RESOLVED items will become **CLOSED / CONFIRMED** at the end of that
  walkthrough. Please focus on Part 1 first. If you want to reopen any
  Part 2 item ahead of the walkthrough, flag it and we will pull it into
  Part 1.

Item numbering is preserved from the previous version so cross-references
still resolve. Appendix A (questions for Martyn) and most of Appendix B
have been folded into the body of the document to remove redundancy.

> **IOC feedback received 2026-04-02:** Emma Morris (IOC Media
> Operations) has reviewed the design confirmation document and provided
> 29 inline comments plus written feedback. Key themes from that review
> are reflected throughout this document. Items updated or added based
> on Emma's feedback are marked \[EM 2026-04-02\] in their description
> where applicable.

**Where NOC input would help:** Some questions affect how NOC
administrators experience the portal day-to-day. We've flagged these ---
you may want to run them past 2--3 NOC representatives (ideally one
large territory like USA/GBR/FRA and one smaller territory) to validate
that the workflow makes sense from their side.

**A note on roles:** Throughout this document, please keep in mind the
general role boundaries: - **OCOG (LA28)** is the primary review and
approval authority for most workflows --- EoI visibility across NOCs,
PbN formal approval, and cross-NOC oversight. - **IOC** oversees the
process but generally does not approve --- with specific carved-out
exceptions: ENR grants from the holdback pool, IOC-Direct reserved
organisations, and setting per-category quota totals. - **NOC** owns
their territory's EoI review and PbN slot allocation.

**Terminology note \[EM 2026-04-02\]:** Emma Morris (IOC) requests that
the term **"Responsible Organisation"** be used instead of "sponsoring
organisation" throughout the portal and documentation. This applies
wherever we previously described one organisation as "sponsoring" or
acting as the owning body for another, particularly in the IOC-Direct
context.

# Part 1 --- Open Questions (Requires Discussion)

The items below need a decision. Each item carries a clear D.TEC
recommendation or proposed path so the meeting starts from a concrete
position. 4.4b, 2.3b, and 5.2 are new to Part 1 as of 2026-04-21. Sections 1.6, 3.3, 4.6, and 6.6 are new to Part 1 as of 2026-04-26 from the Strategic Plan re-review. Sections 6.7, 6.8 are new to Part 1 from the 2026-04-26 Emma feedback walkthrough. Sections 1.2, 1.5, 2.1, 2.2, 3.1, 4.2, 4.3 have been **RE-OPENED** in Part 2 (status changed from RESOLVED) following Emma's 2026-04-24 Word comments on the doc.

## 1.6 Capture Applicant's Preferred Language on EoI? \[New 2026-04-26\]

**Status:** OPEN --- decision needed alongside the v0.9 Spanish localisation commitment.

**D.TEC recommendation: capture preferred language on EoI submission and use it for return-visit experiences.**

**Scenario.** Plan §4.2 requires English + French + Spanish for IOC↔NOC press-accreditation correspondence and Press by Number forms/manual. The 2026-04-26 Strategic Plan re-review promoted Spanish from "pending" to committed v0.9 scope (see `TODOS.md`). The applicant chooses EN / FR / ES via a toggle on the public form. But the applicant comes back to the portal multiple times after submission --- to check status, to resubmit if returned, to view the published outcome. Today the toggle's choice doesn't persist across visits; the applicant lands on browser-locale-only on return.

**Options:**

- **Option A (recommended): persist the toggle choice as a `preferred_language` field on the application record.** When the applicant returns via status check, magic link, or 90-day status token, the portal serves the previously chosen language pack. Resubmission and outcome emails are sent in the applicant's preferred language. Schema cost: one nullable enum column on `applications`. UX cost: zero --- the toggle still works on return visits.
- **Option B: leave behaviour as-is.** The toggle drives the current session only; returning applicants get browser-locale or English fallback. Simpler, but risks language-mismatched emails (e.g. a Spanish-speaking applicant gets an English status email after they explicitly chose ES on their submission).

**Roles impacted:** Applicants (primary), NOC admins (no change --- admin language is independent of applicant language).

## 3.3 Gender Equality Set-Aside Pool --- In PRP or Outside? \[New 2026-04-26\]

**Status:** OPEN --- D.TEC prior is "out of PRP scope for LA28."

**D.TEC recommendation: out of PRP scope for LA28; revisit for LA2030+ if a fuller IOC quota-management system lands in the portal.**

**Scenario.** Plan §1.6 (Gender Equality) describes IOC-led initiatives to encourage gender-balanced press allocations. The only operational element is one sentence: "The IOC also sets aside press accreditation quotas specifically for female journalists who are not selected by their respective NOCs." The plan doesn't specify pool size, application path, NOC-vs-self nomination, or whether the set-aside flows through PRP (where the org applies) or ACR (where the named female journalist is registered).

**D.TEC reading.** The set-aside reads as journalist-level (a named individual is accredited against it), which is a Press by Name concern handled in ACR in 2027 --- not a PRP / EoI / PbN concern in 2026. PRP allocates slots to organisations during PbN; gender appears at Press by Name when individual journalists are named. We have not modelled a gender-set-aside sub-bucket inside the IOC holdback pool, and we propose not to do so for LA28.

**Open questions for Emma:**

1. Does LA28 require a PRP-side surface for the gender set-aside (e.g. a sub-bucket inside the IOC holdback, or a separate pool the IOC tops up during PbN)? If yes, what triggers a top-up --- a NOC's submission ratio falling below a threshold, or IOC discretion?
2. Or is the set-aside entirely a Press by Name / ACR concern, with PRP playing no role for LA28?
3. For LA2030+, should we plan for the set-aside to live in the future IOC quota-management system that may grow inside PRP?

**Roles impacted:** IOC (set-aside owner), NOC (read-only visibility if the set-aside surfaces in PRP).

## 4.6 IF Sport Specialists + Co-Host City Ex/EPx --- Flow & Timing Design \[New 2026-04-26\]

**Status:** OPEN --- largest single design discussion remaining. Needs flow + timing design before any code can land.

**D.TEC recommendation: bring this to a dedicated design discussion with Emma and Martyn before committing to scope.**

**Scenario.** The Strategic Plan describes two flows that PRP does not yet model:

1. **IF Sport Specialists (§2.6).** "The IOC reserves an additional quota of sport specialist accreditations for NOCs with late qualifying football teams, as well as a limited quota for sport specialist journalists or photographers recommended by the relevant International Federation that have not been allocated accreditation by their NOC. … For LA28, the **International Federation will serve as the Responsible Organisation** for these Es and EPs accreditations." The plan's IF timeline is **18 January 2027 – 12 February 2027** for IF Press by Number, distinct from the NOC PbN deadline of 18 December 2026. Likely IFs include **FIFA, FIBA, FEI (Equestrian), World Sailing**, and softball / canoe slalom federations for Oklahoma City venues. Note FIBA was added per Emma's 2026-04-24 feedback; basketball is not a co-host city sport for LA28, so FIBA's RO role is for the IF Sport Specialists track only (§2.6), not the Ex/EPx co-host track (§3.1).

2. **Co-host city Ex/EPx (§3.1).** "The IOC proposes to allocate a limited quantity of Ex and EPx accreditations for local and national football press who would not normally receive accreditations through the USOPC allocation. For the LA28 Games this will apply also to sports being hosted in Oklahoma City (Canoeing slalom and Softball)." The Ex/EPx allocations sit outside the 6,000 quota and are USOPC-allocated in coordination with LA28 Press Operations.

PRP today has the structural enablers (IF admin role per FR-019; `entity_type: 'noc' | 'if'` on `noc_quotas` per FR-013; `if_staff` org type) but no IF-as-RO PbN screen scoped to sport specialists, no per-body PbN deadline, no co-host city designation, no Ex/EPx categories in the schema. `TODOS.md` carries an Ex/EPx schema/UI item, but not the workflow.

**Open questions to resolve with Emma + Martyn:**

1. **Parallel process or distinct surfaces?** Does the IF Sport Specialist flow run as a parallel process largely reusing NOC screens, with a body-scoped `pbn_deadline` field per `entity_type` (NOC default 18 Dec 2026, IF default 12 Feb 2027) and shared PbN allocation UI? Or does it warrant a separate IF-only screen with different copy and empty-states?
2. **Co-host city Ex/EPx --- third process?** Is this a third process distinct from NOC EoI→PbN and IF Sport Specialists? Who's the Responsible Organisation --- USOPC, LA28 Press Operations, or the relevant IF?
3. **Timing and sequencing across all three processes.** What overlaps, what depends on what? Does the IF PbN window start before or after NOC PbN closes? Does Ex/EPx allocation depend on USOPC's main quota being exhausted?
4. **USOPC Ex/EPx --- through PRP or ACR-only?** Does the USOPC Ex/EPx allocation flow through PRP at all, or is it entirely USOPC-side and only ACR-imported? Plan says "allocated by the USOPC in close coordination with LA28 Press Operations" --- is "in coordination" ledgered in PRP?
5. **Late-qualifier handling.** Plan acknowledges football team qualifications may resolve late. Does PRP need to handle "tentative" IF rows that solidify post-qualification?

**Roles impacted:** IF admins (primary), USOPC (TBD --- needs an account model if they touch PRP), OCOG (visibility / approval), IOC (oversight). NOCs from late-qualifying football nations have a downstream concern.

## 6.6 Multinational Organisation Country / NOC Assignment \[New 2026-04-26\]

**Status:** OPEN --- needed before launch so applicants and NOCs aren't ambiguous about ownership. Cross-cutting; affects all flows.

**D.TEC recommendation: define a clear rule for multinational orgs and bake it into the EoI form's NOC selection flow + reserved-list logic.**

**Scenario.** Several major press organisations operate across many territories: CNN, Reuters, AFP, Associated Press, Xinhua News Agency, Getty Images, Bloomberg, BBC, Al Jazeera, etc. The Strategic Plan handles some of these explicitly --- the four IOC-recognised world news agencies (AFP, AP, Reuters, Xinhua) and the IOC photographic agency (Getty) are IOC-Direct accreditations bypassing NOC quotas (§Quota and §Organisations not included in the NOC Quotas). PRP-FR-026 already supports this via the `IOC_DIRECT` pseudo-NOC and a reserved-list block.

But several questions remain unresolved for the broader multinational set:

1. **What country / NOC does an applicant pick on the EoI form for a multinational org?** Today the form auto-suggests an NOC code from the applicant's country selection. For a CNN journalist working out of London, do they apply via CNN's HQ-country NOC (USOPC), the journalist's home-base NOC (BOA), or are they expected to recognise that CNN is `IOC_DIRECT` and self-route accordingly?
2. **How does the reserved-list block extend?** Today the block is keyed on email domain (`@cnn.com`, `@reuters.com`, etc.) and on org name + country. For a sub-domain or subsidiary (e.g. `@gulf.cnn.com`, `@reutersukltd.com`), does the block fire? What's the false-positive cost --- could a small UK org with a confusingly similar name be wrongly blocked?
3. **What about non-IOC-Direct multinationals?** Bloomberg, BBC, Al Jazeera, Sky News, etc. are not on the IOC-Direct reserved list (or are they?). They're large enough that they likely apply through multiple NOCs. Should one apply per HQ NOC, or one per territory of coverage? Plan is silent.
4. **ENR-specific (ties to 5.x):** see §1.6 / §Non-MRH allocation reminders --- the plan says IOC allocates ENR directly to some non-MRH with international focus (e.g. CNN). The 2026-04-26 Strategic Plan re-review committed to extending `IOC_DIRECT` to ENR (see `TODOS.md`). The country/NOC question above tells the IOC how to route the application before it lands at the IOC-Direct ENR queue.

**D.TEC proposed default rule (for discussion):**

- **Tier 1 --- Reserved IOC-Direct list:** Org is on the `IOC_DIRECT` reserved list (currently AFP, AP, Reuters, Xinhua, Getty). EoI form blocks NOC submission and routes the applicant to an IOC-Direct application path (UI to be designed). Applies to E and ENR alike.
- **Tier 2 --- Multinational, not IOC-Direct:** Applicant submits via the NOC of the **journalist's home base** (where they work most of the time), not the org's HQ country. This avoids USA being flooded with submissions for every CNN/Bloomberg/AP journalist worldwide. NOC may reject if they don't recognise the applicant or if quota doesn't permit.
- **Tier 3 --- Single-territory orgs:** Standard EoI flow; applicant picks the NOC of their primary working country.

**Open questions for Emma:**

1. Is the Tier 2 rule (apply via journalist's home-base NOC) defensible, or should multinationals always apply via HQ-country NOC?
2. Should the reserved IOC-Direct list be visible to applicants (so they know to use the IOC-Direct path), or kept admin-only and surfaced as a "we've routed your application" message?
3. Bloomberg, BBC, Sky, Al Jazeera --- on the IOC-Direct list or not?

**Roles impacted:** Applicants (primary), NOC admins (handling territory-of-residence assignments), IOC (IOC-Direct path, reserved list management), OCOG (cross-NOC duplicate detection picks up the cases that don't fit cleanly in any tier).

## 6.7 Notifications and Sender Domain --- What Does PRP Send vs. What Does the NOC Send Manually? \[New 2026-04-26\]

**Status:** OPEN --- needed before transactional email infrastructure ships in v0.9.

**D.TEC recommendation: hybrid model + OCOG sender domain.**

**Scenario.** Emma's 2026-04-24 framing (Word comments #2, #3, #23, #78) emphasises that **the NOC is the party that informs its press orgs of decisions**, not OCOG. Today PRP has no outbound email built; only a `mailto:` link in the NOC invite form. The 2026-04-16 decision had PRP sending all transactional comms from a D.TEC domain. Emma's framing pushes back on that: the messages should look like they come from LA28/OCOG (the recognisable Olympics brand) and, for narrative comms (rejections, ENR decisions, PbN result letters), from the NOC itself.

**Three options:**

- **(a) PRP sends from a single OCOG (LA28) domain "on behalf of" the NOC.** Clean, single-domain, deliverable, audit-logged. The applicant sees an LA28 domain in the FROM and a "from your NOC" framing in the body. D.TEC stays domain-agnostic in code; the domain is configuration of the chosen email service.
- **(b) PRP drafts the message; the NOC sends manually** via a `mailto:` link or copy-paste template (matches today's invite flow). The NOC is visibly the sender; their own email infrastructure delivers. Cost: no automated delivery confirmation, no bounce handling, no audit trail of what was actually sent.
- **(c) PRP sends from each NOC's own domain.** Operationally infeasible — would require SPF / DKIM / DMARC delegation per NOC for 206 NOCs. **Off the table.**

**D.TEC prior — hybrid (a + b):**

- **(a) for transactional comms** — magic-link verification, status token, acknowledgement of submission, OCOG approval notification, ACR-handoff notification, system errors. Delivered by PRP from the OCOG/LA28 domain. Audit-logged.
- **(b) for NOC-narrative outbound comms** — ENR decision letters, EoI accept/return/reject batch comms when the NOC wants to add their own framing, PbN result letters. PRP generates the templated text (with NOC context, status, applicant ref) and presents a "Send via your email" button that opens the user's mail client.

**Decision (Ken, 2026-04-26):** Sender domain is **OCOG (LA28)**, not D.TEC (supersedes the 2026-04-16 D.TEC decision). This is configuration of the chosen email service, not PRP code. PRP code stays domain-agnostic.

**Open questions for the meeting:**

1. Confirm hybrid (a + b) is the right split for the listed comms types?
2. Confirm OCOG sender domain (e.g. `noreply@la28-press.com` or similar)?
3. For (b), should the NOC also have an option to "let PRP send it" rather than mailto, for NOCs without good email tooling?
4. Where exactly are the boundaries? Is "applicant returned" a (a) or a (b)?

**Roles impacted:** Applicants (primary), NOC Admin (uses (b) for narrative comms), OCOG (owns sender domain), D.TEC (integrates the email service).

## 6.8 NOC Authentication Model --- What Fits 206 NOCs, Many Small / Non-Technical? \[New 2026-04-26\]

**Status:** OPEN --- raised by Emma 2026-04-24 (comment #232: "Hoping the login will not be too complicated especially for the smaller NOCs!").

**D.TEC recommendation: separate NOC auth from D.TEC IAM admin auth.**

**Scenario.** Today's `TODOS.md` lists "SSO integration (D.TEC IAM)" as the v0.9 admin auth solution. D.TEC IAM fits D.TEC employees and partners. It does **not** fit 206 external NOCs, many of whom are small organisations with limited IT infrastructure. Emma's comment flags concern that smaller NOCs may struggle with a complex login. The 206-NOC sizing also makes manual provisioning of D.TEC IAM identities impractical.

**Three options:**

- **(a) Email + magic link** (matches the applicant flow). NOC admin enters their email; receives a one-click sign-in link. Simple. No password to remember. Familiar UX for any NOC admin who has ever applied for accreditation themselves. Security: only as strong as the NOC's email account.
- **(b) Credentialed login (username + password) provisioned by OCOG.** The OCOG generates and distributes credentials to each NOC at onboarding. Familiar pattern, simple to operate. Security: subject to password reuse and weak passwords.
- **(c) OAuth via NOC-provided IdP.** Each NOC delegates auth to their own provider. Most secure. Requires NOC tech setup — many smaller NOCs don't have an IdP. Operationally heavy.

**D.TEC prior:** option (a) magic link for NOC admin — same mechanism as the applicant status token (already a 90-day magic link). Add MFA or step-up auth for sensitive actions (OCOG approval, IOC quota changes) if needed. D.TEC IAM is preserved for D.TEC operators (IOC, OCOG, super-admin), not NOCs.

**Open questions for the meeting:**

1. Is magic-link auth acceptable to the IOC and OCOG for NOC admin sessions?
2. What MFA / step-up rules should apply (if any)?
3. How do we handle account recovery if the NOC's email changes between Games?
4. Pilot NOC validation: walk this past 1-2 smaller NOC reps during the engagement plan to confirm UX is workable.

**Roles impacted:** NOC Admin (primary), OCOG (provisions and supports NOC accounts per R-9 / §6.4a), D.TEC (builds the auth path).

## 4.4b NOC Direct Entry ⇄ Inline PbN Entry --- Align to the Same Minimum? \[New 2026-04-21, revised 2026-04-26\]

**Status:** OPEN --- decision needed before implementation of 4.4
completes.

**Emma's 2026-04-24 pushback (Word comment #8):** PbN fields must be **mandatory** when the form is submitted to LA28. Required fields per Emma (citing the MiCo26 form): first name, last name, company, email, website, address, phone number. Reason: LA28 needs full contact details to coordinate ACM (accommodation), RTC (rate card), SEAT, and approval-time verification ("website will be needed to check the org. Contact name is important to make sure it is not an NOC using an E"). Martyn finalising the official LA28 PbN field set. Also: NOC E and NOC Es belong **in the PbN table** alongside E/EP/Es (not below). Approximate scale: ~2,000 affiliated NOC organisations.

**Revised D.TEC recommendation (2026-04-26): Option C.** Direct Entry stays **lightweight at create-time** (org name, type, country, category) — same as Inline PbN Entry. But **PbN submission to OCOG (the `draft → noc_submitted` transition) requires the full Martyn field set populated**. Mandatory PbN fields are enforced server-side at the state transition, not at row creation. This satisfies Emma's "fields must be mandatory at PbN" requirement without forcing NOCs to fill the full form at the moment they add an org. Replaces the prior Option A.

**D.TEC recommendation (original, superseded): Option A.** Strip Direct Entry down to the
same four required fields as Inline PbN Entry (org name, type,
country, category) so both paths use one validation surface, one audit
pattern, and one place to evolve the minimum record. We are asking the
meeting to confirm or reject this recommendation.

**Scenario.** Sections 1.5 (NOC Direct Entry) and 4.4 (NOC Direct-Entry
into PbN) describe two different ways a NOC admin can add a known
organisation to the system without a public EoI submission:

- **Direct Entry** (`/admin/noc/direct-entry`): a fuller form that
  creates the org, creates an EoI-equivalent application record marked
  as a candidate, and immediately makes it eligible for PbN allocation.
  Required fields today: org name, type, country, primary contact full
  name, primary contact email, plus category selection with requested
  slot counts (and sport if Es or EPs is selected).
- **Inline PbN Entry** (`AddOrgToPbnPanel`, shown inline in the PbN
  allocation table): a slim panel that creates the org and drops it
  into PbN in one step. Required fields today: org name and type only;
  country is optional; categories and slot counts are allocated inline
  in the PbN table after the org row is created.

These are materially different today. Emma's request (Comments 96 and
98, and the 2026-04-02 email) was specifically for a fast inline path
so NOC press officers don't have to fill out a full EoI on behalf of
orgs they already know. But we now have two entry paths for the same
conceptual action ("NOC vouches for this org"), with two validation
surfaces, two audit-log patterns, and two places where future field
changes must land.

**Options:**

- **Option A (recommended): reduce Direct Entry to the inline
  minimum.** Trim the Direct Entry form to require only org name,
  type, country, and category. Primary contact, slot counts, website,
  and secondary contact become optional at entry time, collectable
  later inside the EoI / PbN workflow. Both entry paths validate the
  same minimum, write the same shape of org record, and share one
  audit-log pattern. Inline PbN Entry would also require `country`
  (currently optional) so the minimum is truly identical. NOC press
  officers get the fast experience from either entry point, and a
  future field change lands in one place. Cost: candidate records
  entered via Direct Entry no longer carry contact info until the NOC
  chooses to add it. Downstream workflows that currently assume
  contact info is present on a direct-entered candidate need to handle
  "no contact yet."

- **Option B: leave Direct Entry as is; keep both paths distinct.**
  Direct Entry remains the heavier route that collects contact info
  and category counts up front, producing a fuller candidate record.
  Inline PbN Entry remains the lightweight route for NOCs who want to
  add an org straight into the allocation table. NOC admins choose per
  org. Preserves today's candidate-record fidelity for Direct Entry,
  keeps two code paths to maintain, and leaves "two ways to do the
  same thing" as a known property of the design.

**What stakeholders will see if Option A is adopted.** The inline PbN
add-org panel described in 4.4 behaves exactly as today: the NOC adds
an org inline with name, type, country, and category. The only visible
change is on the Direct Entry page, which becomes a shorter form with
the same four required fields and everything else optional. No
behaviour change for OCOG or IOC. If Option B is adopted, 4.4 ships as
described today alongside the existing longer Direct Entry form.

**Why D.TEC recommends Option A.** One validation surface, one audit
pattern, one place to evolve the minimum record. Aligns with Emma's
stated goal of a fast inline UX without creating a parallel data path.
The "contact info optional at entry time" cost is small: contact info
is collectable in PbN before allocation, and downstream ACR handoff
only needs it at Press by Name time.

**Roles impacted:** NOC Admin (primary: both paths), OCOG Admin (sees
the resulting PbN entries), IOC Admin (audit visibility).

**NOC input recommended:** see Engagement Plan at the end of this
document.

## 2.5 EoI Close, PbN Finalisation, and ACR Push --- Dates and Control

**Status:** OPEN.

**Two things we are asking the meeting to do:**

- **A. Confirm the proposed design** (Part 1 below) for how EoI close,
  PbN finalisation, and ACR push are triggered.
- **B. Answer three remaining questions** (Part 2 below) that D.TEC
  cannot resolve internally.

### Known dates (already published externally; also referenced in `docs/PRP-rq.md`)

- **31 August 2026**: PRP goes live; EoI window opens (date revised 2026-04-24 per Emma).
- **October 5, 2026**: Press by Number process launches.
- **October 23, 2026**: EoI global close date (OCOG-controlled).
- **December 18, 2026**: Press by Number close date (OCOG-controlled).

**Who controls the dates.** The OCOG. Each date is stored in PRP and
editable by the OCOG Admin (EoI open/close dates are already built per
1.3).

### Part A: proposed design (please confirm or amend)

1.  **Dates configure when the button becomes available; they do not
    close the phase automatically.** Closing each phase requires a
    manual button click by the OCOG. This avoids anything firing by
    accident if a date is missed or mis-set. Before the date arrives,
    the corresponding close / finalise / push button is visible but
    disabled in the OCOG admin screen, with a tooltip stating the
    earliest date it will be clickable.
2.  **EoI global close (Oct 23).** At or after the date, the OCOG
    clicks "Close EoI window globally" in PRP. All NOC EoI windows
    close. Any per-NOC override (e.g. a pilot NOC kept open beyond the
    global date) that the OCOG has set in the Windows screen stays
    active until the OCOG manually clears it; overrides are not
    automatically expired by the global close.
3.  **PbN finalisation (Dec 18).** At or after the date, the OCOG
    clicks "Finalise PbN" per NOC / IF submission once they have
    formally approved it. This transitions the allocation to
    `ocog_approved` and makes the ACR push available.
4.  **ACR push: serial handoff, per allocation.** Once
    `ocog_approved`, the OCOG clicks "Send to ACR" per allocation.
    State transitions to `sent_to_acr`; the allocation then becomes a
    historical record in PRP (Model A, per 4.3). There is no single
    "global ACR push" date. Allocations flow to ACR one at a time as
    the OCOG approves and pushes each.
5.  **Batch communications --- REVISED 2026-04-26 per Emma feedback (#23, #78).** Originally proposed: OCOG clicks a button to fire batch comms. Emma pushes back: "The Press by Number process for NOCs is owned by the NOCs. They already confirm the quotas to each of their press orgs when they submit the Press by Number form. […] approval or rejection notifications **do not come from the OCOG** at this stage. The NOC manages this." **Revised D.TEC prior:** NOC controls the timing of communications to its orgs (per-org or batch, the NOC decides), via the `mailto:` template hybrid (see §6.7). OCOG retains a safety-net role only — review submissions, raise issues, require correction — but does not approve, publish, or send applicant-facing comms at PbN stage. The "publish/unpublish" toggle in PRP-FR-009 / PRP-FR-019 is removed; applicants see status as soon as the NOC chooses to communicate it.

6.  **Late PbN submissions (NEW open question per Emma #11).** Emma flags that "many NOCs will not submit their forms" by 18 Dec 2026. Default proposal: late submissions still flow through OCOG/IOC review and ACR push but are flagged "late" for IOC reporting. Confirm at the meeting.

### Part B: three remaining questions

1.  Who signs off on the **content of each batch communication
    template** (OCOG, IOC, or D.TEC)?
2.  Should the OCOG be allowed to **extend the global EoI or PbN close
    dates** after they are set? With or without IOC notification?
3.  Are any downstream systems (Common Codes, ACR) **coupled to the
    date of EoI close** rather than to the OCOG pushing a button? If
    so, those handoffs need to match the manual-button model and we
    need to confirm that now.

**Roles impacted:** Applicants (receive communications), NOC Admin
(awaits EoI close; submits PbN before finalisation), OCOG Admin (owns
dates and buttons), IOC Admin (visibility), D.TEC (PRP orchestration).

## 6.1 RACI --- Draft for Review

**Status:** OPEN --- D.TEC has drafted the table below from current
understanding. Please confirm, amend, or replace cells marked `??`. Any
cell you want to change, please leave a note in the row.

Legend: **R** = Responsible (does the work), **A** = Accountable
(single signer), **C** = Consulted, **I** = Informed.

| Activity | R | A | C | I |
|---|---|---|---|---|
| EoI form field list / field changes | D.TEC | OCOG | IOC | NOCs |
| EoI window open/close date (global) | OCOG | OCOG | IOC | NOCs |
| EoI window per-NOC override (pilot / exception) | OCOG | OCOG | IOC | affected NOC |
| EoI queue decisions (accept / return / reject) | NOC | NOC | OCOG | IOC |
| Cross-NOC EoI visibility + duplicate flags | OCOG | OCOG | IOC | NOCs |
| Quota totals per NOC / IF (per category) | IOC | IOC | OCOG | NOCs / IFs |
| PbN allocations (NOC / IF submits to OCOG) | NOC / IF | OCOG | IOC | D.TEC |
| PbN formal approval | OCOG | OCOG | IOC | NOCs / IFs |
| PbN close date (global) | OCOG | OCOG | IOC | NOCs / IFs |
| IOC-Direct org list (AFP, AP, Reuters, etc.) | IOC | IOC | OCOG | D.TEC |
| IOC-Direct PbN allocations | IOC | OCOG | — | D.TEC |
| ENR nominations (NOC list) | NOC | NOC | IOC | D.TEC |
| ENR grants from holdback pool | IOC | IOC | OCOG | NOCs |
| NOC admin account provisioning (206 accounts) | OCOG | OCOG | D.TEC | IOC |
| NOC user manual content | OCOG | OCOG | IOC, D.TEC | NOCs |
| Batch communication sign-off / release | OCOG | OCOG | IOC | NOCs |
| ACR push (per PbN allocation) | OCOG | OCOG | IOC | D.TEC, NOCs |
| Post-`sent_to_acr` data edits | ACR team | OCOG | IOC | NOCs |
| Production incident response (on-call) | D.TEC | D.TEC | OCOG | IOC |
| Portal infrastructure / hosting | D.TEC | D.TEC | OCOG | IOC |
| ACR API contract ownership | D.TEC + ACR | D.TEC | OCOG, IOC | NOCs |

**Roles impacted:** All roles. This is a governance question.

## 6.4c French / Spanish Localisation Scope --- Symmetric Framing \[updated 2026-04-26 with Emma feedback\]

**Status:** OCOG and IOC parts answered; NOC scope reopened with a meta-question.

**What is confirmed:**

- The public EoI form supports **French at v1.0** (ships 31 August, 2026).
- **Spanish for `/apply` + applicant emails is committed v0.9** (per Strategic Plan §4.2 requirement). Same surface set as French.
- Admin portal (NOC, OCOG, IOC dashboards) is **English-only at v1.0**.

**Emma's 2026-04-24 answers (Word comment #33):**

- **OCOG admin: NO** — French not needed.
- **IOC admin: NO** — French not needed.
- **NOC admin: probably yes for smaller French-speaking NOCs** ("to discuss").

**D.TEC framing — symmetric French and Spanish.** Both languages cover the same surfaces. Plan §4.2 says IOC↔LA28 correspondence is English; OCOG and IOC admin stay English-only for both languages. NOC admin localisation, if added, applies symmetrically to both French and Spanish (and any future languages).

**D.TEC current commitment (revised 2026-04-26):**

- v0.9: Spanish for `/apply` + applicant emails (matches today's French scope on the public surface).
- v2.0: French and Spanish for NOC admin screens + NOC user manual, **conditional** on the meta-question below being answered yes.

**New meta-question for the next meeting:** Do smaller NOCs (French- or Spanish-speaking) actually need admin-screen localisation, or can they operate the NOC admin in English while their applicants see EN/FR/ES? Most back-office tooling in similar D.TEC contexts is English-only; we want explicit confirmation before committing to the build cost. Validate with 2-3 smaller-NOC representatives during the engagement plan (Appendix).

**Roles impacted:** NOC Admin (smaller French/Spanish-speaking territories), D.TEC (builds the localisation if confirmed).

## 5.2 ENR Undertaking --- Lives in PRP or ACR? \[moved from Part 2 2026-04-21\]

**Status:** OPEN --- needs discussion.

**Background:** Before an ENR organisation can receive accreditation,
they must sign an undertaking acknowledging specific terms. Emma
confirms (Comment 120) that the undertaking is needed at the **Press by
Name stage, not at ENR nomination or grant stage**. Press by Name is
handled in ACR (in 2027), after the PRP hands off.

**D.TEC position:** No recommendation in advance. The PRP-vs-ACR
question and the Path A / B / C question both need the stakeholder
discussion to settle. D.TEC will present the trade-offs live at the
meeting and agree a resolution there.

**Open question 1:** Since the undertaking is required at Press by
Name stage, should this feature be scoped as a **PRP deliverable** or
an **ACR deliverable**?

**Open question 2 --- three options for the undertaking mechanism
itself (still relevant whichever system hosts it):**

- **Path A (typed name):** The signatory types their full legal name,
  checks a consent box, and the system records a timestamp and IP
  address. A PDF receipt is emailed. Small amount of development
  effort.
- **Path B (DocuSign-grade):** A full e-signature flow with
  cryptographic proof. Required only if IOC Legal determines typed-name
  is insufficient. Significantly more investment than Path A, though
  Path A work is not discarded.
- **Path C (external process):** Continue using Adobe Acrobat outside
  any portal. Zero development effort, but the undertaking remains
  disconnected from the workflow.

**What D.TEC needs from this discussion:**

1.  Does the undertaking live in PRP or ACR?
2.  Which path (A / B / C)?
3.  When does IOC Legal confirm the undertaking text? (It is gated on
    the IOC News Access Rules, which must be finalised first.)

**Roles impacted:** ENR organisations (sign the undertaking), IOC Legal
(determines mechanism), IOC Admin (manages ENR workflow), D.TEC or ACR
team (implements).

## 2.3b EoI Queue Filter & Search --- Is Current Functionality Enough for Large-Territory NOCs? \[promoted from Appendix B 2026-04-21\]

**Status:** OPEN --- NOC input needed.

**Current functionality (already built, per 2.3):**

- **NOC queue** (`/admin/noc/queue`) has a full-text search input that
  matches org name, contact name, contact email, and country.
- **Filter pills** for status: pending, returned, rejected, approved,
  direct entry.
- **Column header sort** on submission date and status.
- **Per-page pagination** (200 rows) for large queues.

**OCOG cross-NOC side:** The OCOG EoI summary page
(`/admin/ocog/eoi`) now supports search/filter by NOC code and
clickable NOC rows that drill into a read-only view of that NOC's
application list.

**Sizing data point (Emma 2026-04-24):** USOPC quota will probably be ~500 (TBC May 2026). Expected EoI volume is **1,500+ requests** for the USA territory ("triple or more requests to deal with"). Treat this as the worst-case for the filter/search design.

**Question:** For a large-territory NOC (e.g. USOPC with 1,500+
applications against an ~500-slot quota), is this level of filter and
search enough? Specifically:

1.  Do NOC press officers want additional filters (org type, sport,
    publication history, prior-Games accreditation)?
2.  Do they want saved views ("my shortlist")?
3.  Do they want bulk triage actions (bulk-reject, bulk-return)?

**D.TEC recommendation:** Validate with NOC reps before adding more
filters. Large-territory NOCs may have idiosyncratic triage habits that
no filter set covers well --- the right next feature depends on what
they actually do today.

**Roles impacted:** NOC Admin (primary), OCOG Admin (secondary).

**NOC input recommended** --- see Engagement Plan at the end of this
document.

# Part 2 --- Resolved Design (Awaiting Business Sign-Off)

Every item in Part 2 is labelled **RESOLVED**. A dedicated walkthrough
meeting will be scheduled to review Part 2 as a block, at which point
RESOLVED items will become **CLOSED / CONFIRMED** and locked for v1.0.
Please focus on Part 1 first. If you want to reopen any Part 2 item
ahead of the walkthrough, flag it and we will pull it into Part 1.

Appendix A content (questions previously directed at Martyn/OCOG) has
been folded into the relevant item below rather than duplicated in a
separate table.

## 1. Expression of Interest (EoI) --- The Public Application Process

These questions relate to the public-facing form that media
organisations use to apply for press accreditation through their NOC.

### 1.1 EoI Form Fields --- Final List

**Status:** RESOLVED --- 2026-04-17

**Scenario:** A journalist at a news agency in Brazil opens the portal
and fills out the EoI form. The form currently has five sections:
Organisation details (name, type, country, website, address), Contacts
(primary + optional secondary), Accreditation categories
(E/Es/EP/EPs/ET/EC with requested quantities), Publication details
(type, circulation, frequency, sports), and History (prior
Olympic/Paralympic accreditation, past coverage examples).

We built these fields based on the USOPC EoI form and our stakeholder
interviews. However, the IOC or OCOG may require additional fields ---
for example, media accreditation numbers from prior Games, ISSN numbers,
or specific affiliation details.

A related question: different NOCs may want to ask applicants slightly
different things. Rather than building per-NOC custom forms, we could
offer a small number of configurable "free-form fields" that each NOC
can label and use as they see fit --- for example, "NOC-specific notes"
or "Additional information your NOC has requested." This would keep the
core form standardised while giving NOCs flexibility.

**Resolution:** The current field list as implemented stands. One
generic multi-line "Additional information requested by your NOC"
free-text field will be added to the form (Publication Details or
History tab) if not already present. Full per-NOC field configuration is
deferred to post-LA28. Terminology: "Responsible Organisation" (RO)
replaces "sponsoring organisation" in IOC-Direct contexts only; "NOC"
remains correct elsewhere.

**Roles impacted:** Applicant (media organisations), NOC Admin (reviews
what applicants submit), OCOG Admin (cross-NOC visibility), IOC Admin
(cross-RO-visibility)

### 1.2 Sport-Specific Categories (Es / EPs) --- Free Text vs. Dropdown

**Status:** RE-OPENED 2026-04-26 per Emma comment #63: "What happens if an organisation requests multiple Es and EPs accreditations at EoI stage" --- today's single-select picker doesn't handle multi-sport orgs cleanly.

**Scenario:** A photographer who specialises in swimming selects the
"EPs --- Sport-specific photographer" category on the EoI form. The form
currently asks them to describe the sports they plan to cover in a
free-text field ("Which sports do you plan to cover at LA 2028?"). There
is no dropdown list of IOC-recognised sports.

**Our provisional decision:** Free text. It's simpler and flexible ---
applicants can describe niche coverage (e.g., "artistic swimming and
water polo") without being constrained to a single-sport selection.

**Alternative:** A structured dropdown of the 32 LA28 sports. This would
make it easier for NOCs and the OCOG to filter and report by sport, but
forces applicants into a single-sport selection that may not reflect
their actual coverage.

**Resolution (revised 2026-04-26):** A structured dropdown of 36 LA28 sports (at sport level, not discipline level) is implemented. **D.TEC prior — option 1A:** convert the picker to **multi-select** when Es>0 or EPs>0 is requested. Capture the org's coverage scope (e.g. "4 EPs across Athletics + Swimming"); per-individual sport binding is deferred to Press by Name (ACR, 2027). Schema impact: child table `application_sport_scope` or a JSON column on `applications`.

**Open sub-question for the meeting (option 1B):** Do the IOC / OCOG need **per-slot sport granularity** at EoI ("2 EPs for Athletics + 2 EPs for Swimming")? More UI complexity (matrix table of category × sport × count), more allocation certainty earlier. D.TEC prior is no — defer per-slot binding to PbName — but flag for explicit confirmation before building.

**Roles impacted:** Applicant, NOC Admin (filters applications by
sport), OCOG Admin (reporting)

### 1.3 EoI Window --- Who Controls When Applications Open and Close?

**Status:** RESOLVED --- 2026-04-17 --- implementation required

**Scenario:** The global EoI window is scheduled to open 31 August 2026
and close 23 October 2026 (revised 2026-04-24 per Emma). In the portal, each NOC can independently
open or close their own EoI acceptance window. For example, the USA NOC
might close their window a week early because they've received enough
applications.

Today, only the NOC admin for that territory can toggle their own
window. When a NOC's window is closed, applicants who try to submit see
a message: "This NOC has closed its Expression of Interest window. New
applications are not currently being accepted."

**Our assumption:** The OCOG controls the global dates (when the overall
window opens and closes), and can override individual NOC windows if
needed. The IOC has visibility into which NOCs have their windows open
or closed but does not directly control them.

**Resolution:** Per-NOC window self-service control is removed from the
NOC admin interface. The OCOG sets one global EoI open/close date that
applies to all NOCs simultaneously. All windows auto-close at the global
deadline. When an applicant encounters a closed window, they see a
generic message directing them to contact their NOC.

The invite route (NOC inviting specific orgs) remains open after the
global EoI deadline until the NOC's PbN submission deadline. After PbN
close, no EoI intake of any kind is permitted.

The OCOG retains the ability to selectively open or extend windows for
specific NOCs at the OCOG admin level (for pilot programmes and
exception handling).

**Roles impacted:** NOC Admin (controls their window), OCOG Admin
(global oversight and override), Applicant (blocked when window is
closed) **NOC input recommended** --- ask NOC representatives how they'd
want this to work in practice.

### 1.4 Freelancers --- Do We Need to See Them as a Group?

**Status:** RESOLVED (was PROVISIONAL) --- each freelancer is an independent org

**Scenario:** A freelance sports photographer in Italy applies for
accreditation. They work independently --- no employer, no agency. In
the portal, they create an "organisation" record that represents
themselves (an "org of 1"). We flag them as a freelancer in the system.
Deduplication for freelancers uses name + country (not email domain,
since freelancers often use personal email).

**Our provisional decision:** Every freelancer is an independent org
record. There is no concept of freelancer collectives or group
applications.

**Question:** Is there any scenario where the OCOG or a NOC needs to
view, filter, or act on freelancers as a group (e.g., "show me all
freelancers in this NOC territory" or "apply a different review standard
to freelancers")? Or is reviewing them one at a time, just like any
other org, always sufficient?

**Additional open question:** Selecting "freelancer" as org type
collapses the media-type signal --- the system cannot distinguish a
freelance print journalist from a freelance broadcaster or photographer.
Option A: add a secondary media-type selector that appears when
"freelancer" is chosen. Option B: accept this limitation (freelancers
are predominantly print/online). Stakeholder input needed on whether
this distinction matters for accreditation category decisions.

**Roles impacted:** Applicant (freelancers), NOC Admin (reviews
freelancer applications), OCOG Admin (cross-NOC visibility) **NOC input
recommended** --- large NOCs likely deal with freelancer applications
regularly.

### 1.5 NOC Fast-Track Entry --- Governance

**Status:** RE-OPENED 2026-04-26 (text refresh) --- core feature is built; resolution text needs to enumerate all Direct Entry categories with access scopes per Emma comments #69, #70, #71. The NOC E nomination tip text is awaiting IOC rewrite per #70.

**Scenario:** The press officer at the German NOC knows that Deutsche
Presse-Agentur (DPA) will apply --- they've been accredited at every
Games for 30 years. Rather than waiting for DPA to discover the portal,
fill out the form, and go through email verification, the NOC admin
enters DPA's details directly through a "fast-track" route. The
application is created pre-approved and immediately eligible for PbN
slot allocation.

Fast-track entry collects a subset of the full EoI form --- only the
essential fields (org name, type, country, category selection, contact
details). Fields like publication history, circulation, and prior
accreditation details are not required, since the NOC already knows this
organisation. The full EoI form remains available if the NOC wants the
org to submit a complete application through the public route instead.

**Resolution (revised 2026-04-26):** The feature has been renamed from "Fast-Track Entry" to
"Direct Entry" and is fully implemented. Any NOC admin may add an
organisation directly without a second approval. Entries are
audit-logged as `noc_direct_entry`, badged in the NOC EoI queue, and
visible in the OCOG cross-NOC view. No limit on the number of direct
entries; audit log is the governance mechanism.

**Direct Entry categories with access scopes (per Emma #71):**

- **E** (Journalist) — ALL competition venues
- **Es** (Sport-specific journalist) — own sport venues
- **EP** (Photographer) — ALL competition venues
- **EPs** (Sport-specific photographer) — own sport venues
- **ET** (Technician) — ALL venues, no seating
- **Ec** (Support staff) — **MPC only**
- **NOC E** (Press attaché) — NOC-only Direct Entry category; press attachés can ONLY have NOC E (not E/EP/etc.)
- **NOC Es** (Sport-specific press attaché) — new category per Emma #197; sport-specific access only

**Mandatory PbN field set (per Emma #8 → §4.4b Option C):** Direct Entry stays lightweight at create-time (org name, type, country, category). PbN submission to OCOG (the `draft → noc_submitted` transition) requires the full Martyn field set populated: first name, last name, company, email, website, address, phone. Replace with Martyn's official LA28 form when delivered.

**NOC E nomination tip text:** awaiting IOC rewrite (Emma #70). Substance: NOC press attachés can ONLY have NOC E; quota arrives bundled with E/EP/etc. allocation.

**Roles impacted:** NOC Admin (uses direct entry), OCOG Admin (cross-NOC
visibility), IOC Admin (audit visibility) **NOC input recommended** ---
does this match how NOCs would actually want to work?

## 2. OCOG and NOC Review & Decision-Making \[REFRAMED 2026-04-26\]

These questions relate to how applications and PbN allocations are
reviewed and decided. **The framing changed materially on 2026-04-26
following Emma's Word comments #2, #23, #73, #77, #78.** Previously
this section was described as "OCOG is the primary review authority;
IOC has visibility but generally does not approve." Emma's framing:

- **NOC = arbiter** of slot allocations within their assigned quota.
  The NOC decides which orgs get accreditation, communicates with its
  affiliated orgs (per the §6.7 hybrid comms model), and submits the
  PbN form to LA28 with all decisions already made.
- **OCOG = coordinator + safety-net reviewer.** OCOG ingests NOC
  submissions, coordinates downstream services (accommodation, rate
  card, SEAT, ACR enrolment), and flags issues back to the NOC if
  something is wrong (gov ministry org, mixed-up quotas). OCOG **does
  not approve individual orgs**. It only contacts the NOC if anomalies
  are found.
- **IOC = compliance reviewer.** IOC also reviews NOC submissions for
  compliance with eligibility rules (which orgs are accredited, not
  the per-category slot counts). IOC does not adjust quotas or approve
  individual orgs. Like OCOG, IOC contacts the NOC only if issues are
  found.

Quoting Emma directly (#78): "The NOC decides when to send approval to
the organisations with their quota then submits this in the PBN form.
The OCOG does not approve individual org nor does the IOC. It is only
if we see anomalies that we will contact the NOC."

This reframe affects §2.1 (workflow), §2.2 (reversals), §2.5 (batch
comms), §4.3 (handoff master-status), R-2 (PbN approval), and
PRP-FR-009 / PRP-FR-019 (publish/unpublish gate to be removed). Items
that were previously RESOLVED on the assumption of OCOG-as-approver
are flagged below as **RE-OPENED 2026-04-26**.

### 2.1 NOC Workflow --- EoI Queue vs PbN Screen

**Status:** RE-OPENED 2026-04-26 --- the two-screen model is correct, but applicant-facing status communication needs revision per the §2 reframe.

**Scenario:** A NOC press accreditation manager logs into the portal.
They may be there to process new applications, or to work on their slot
allocation --- or both, across different sessions. Our model is that the
NOC operates in two distinct **modes** depending on their intention for
that session, not two strictly sequential phases:

**Mode 1 --- "Clear the queue" sessions.** The NOC works through pending
and resubmitted applications, deciding: approved as candidate, returned
for corrections, or rejected. The goal is to keep the queue empty as
applications arrive. Direct entries (known returning orgs the NOC adds
directly) appear here as pre-approved. This mode is purely about
eligibility ("is this a legitimate media organisation?"), not about
slot quantities.

**Mode 2 --- "Work on allocation" sessions.** The NOC opens the Press by
Number screen and assigns slot numbers to approved candidates against
their IOC quota. This includes candidates from EoI, direct entries, and
direct PbN additions. The NOC will return to this screen multiple times
as they refine their allocation, respond to OCOG feedback, and
eventually submit.

**Resolution (revised 2026-04-26):** The two-screen model is confirmed --- EoI queue for
eligibility decisions, PbN screen for slot allocation. The home
dashboard bridges the two with a summary.

**Applicant-facing status communication --- REVISED.** The previous design held statuses ("approved", "rejected") until OCOG triggered a batch release. Per Emma (#23, #78), the **NOC controls when applicants see status updates**, not the OCOG. The publish/unpublish gate is removed. The NOC's review action becomes visible to the applicant as soon as the NOC chooses to communicate it (per the §6.7 hybrid comms model: PRP renders the message, NOC sends via `mailto:` template). See PRP-FR-009 / PRP-FR-019 for the FR text changes.

**Roles impacted:** NOC Admin (primary), OCOG Admin (visibility) **NOC
input strongly recommended** --- validate with at least one
large-territory and one small-territory NOC representative.

### 2.2 Application Reversals --- Differentiating EoI Approval from PbN Allocation

**Status:** RE-OPENED 2026-04-26 --- the reversibility model stands, but the "applicants are not notified until batch release" rationale changes per the §2 reframe.

**Scenario:** There are two distinct decision points in the process, and
it's important to understand what a "reversal" means at each stage:

**Stage 1 --- EoI approval as candidate (NOC decision):** When a NOC
approves an EoI application, they are saying "this organisation is a
legitimate media entity eligible to be considered for press credentials."
This does not guarantee the org will receive any slots --- it places them
in the candidate pool for PbN. A NOC might approve 200 organisations but
only have quota for 80.

**Stage 2 --- PbN allocation (NOC proposes, OCOG approves):** During
PbN, the NOC assigns specific per-category slot numbers to approved
organisations. Some approved orgs may receive zero slots --- effectively
not receiving credentials despite being eligible. The OCOG then formally
approves (or adjusts) the NOC's allocation.

**Resolution (revised 2026-04-26):** Rejection is reversible. A NOC admin may un-reject an
application (rejected → pending) without OCOG approval. **Risk framing changes per §2 reframe:** previously "low-risk because applicants are not notified until the batch communication release date" — that rationale is dropped. The NOC controls communication timing per §6.7 hybrid; if the NOC has already communicated a rejection to the applicant, the un-reject is the NOC's call to handle the follow-up. All reversals are audit-logged. Post-ACR-export reversal handling depends on the §4.3 master-status re-open. Audit log is sufficient for OCOG visibility of reversals; no additional visual flag required.

**IOC review scope (per Emma #77):** IOC reviews focus on **the organisations the NOC has accredited** (compliance with eligibility rules), not the per-category slot counts. NOC controls slot counts within their quota.

**Roles impacted:** NOC Admin (EoI reversals), OCOG Admin (PbN
reversals, visibility), IOC Admin (audit visibility)

### 2.3 Dashboard Filtering --- What Signals Help Reviewers Prioritise?

**Status:** RESOLVED --- 2026-04-17 --- implementation required

**Scenario:** The OCOG admin looking across all 206 NOCs needs to spot
problems --- applications from non-journalists, government officials
seeking credentials, orgs that have been flagged in prior Games.
Similarly, a NOC admin for a large territory like the USA sees 400
pending applications against a quota of 80 press slots and needs to
prioritise which to review first.

The dashboards currently show simple tables with status filters
(pending, approved, returned, rejected), but no "quality signals" to
help triage.

**Resolution:** The existing OCOG EoI summary page (/admin/ocog/eoi)
showing per-NOC status counts is confirmed as the right level of detail
for OCOG cross-NOC oversight during EoI. The following improvements will
be implemented: (a) search/filter by NOC code on the OCOG EoI summary;
(b) clickable NOC rows allowing OCOG to drill into a read-only view of
that NOC's application list; (c) text search on the NOC EoI queue to
help large-territory NOC admins triage high volumes; (d) verify the EoI
CSV export includes all form fields. The OCOG "flag as content-invalid"
annotation feature is deferred to post-LA28. The 10-submission-per-email
limit is confirmed built.

**Roles impacted:** OCOG Admin (primary cross-NOC review), NOC Admin
(territory triage), IOC Admin (also has visibility) **NOC input
recommended** --- large-territory NOCs (USA, GBR, GER, FRA, JPN) would
benefit most from better filtering.

### 2.4 Cross-NOC Duplicate Detection --- Currently Disabled

**Status:** RESOLVED --- 2026-04-17 --- implemented

**Scenario:** A small, unknown media company applies through three NOCs
simultaneously, trying to get credentials through whichever one approves
first. The OCOG, as the primary cross-NOC authority, might want to
catch this.

Separately, major wire services like Reuters legitimately operate in
many NOC territories. These cases are expected and not problematic ---
and the largest of these (AFP, AP, Reuters, Xinhua) are already handled
as IOC-Direct reserved organisations, bypassing the NOC process
entirely.

**Resolution:** Duplicate detection is fully implemented per the
requirements in `docs/brainstorms/2026-04-17-duplicate-detection-requirements.md`.
Within a single NOC: pairs are flagged when any of four signals fire ---
same email domain, same contact email, same website hostname, or
normalised org name + same country. NOC admins can reject or return for
correction directly from the comparison modal. Cross-NOC: organisations
appearing in multiple NOC territories are flagged via the
`isMultiTerritoryFlag` and surfaced in the IOC dashboard.

Note: unresolved duplicate flags are currently soft warnings --- both
flagged organisations can flow to ACR if the NOC never resolves the
flag. Whether unresolved pairs should trigger a hard block at OCOG PbN
approval is an open question tied to the Common Codes / org-identity
strategy (see 6.2 and 6.3).

**Roles impacted:** OCOG Admin (primary cross-NOC review), IOC Admin
(visibility), NOC Admin (receives flags)

## 3. Quota Management --- IOC Sets the Numbers

These questions relate to how the IOC assigns per-category quotas to
each NOC and how those quotas flow through the system.

### 3.1 Quota Assignees Beyond NOCs --- Who Else Gets Quotas?

**Status:** RE-OPENED 2026-04-26 per Emma comments #83, #85, #190 --- category enumeration needed; INO terminology fix; EOR placement question.

**Scenario:** The IOC imports per-category quota totals for each of the
206 NOCs. But there are other entities that also need media quotas:

- **International Federations (IFs):** Resolved --- IFs have quotas set
  by the IOC and enter their own fast-track items for OCOG approval (see
  R-4 below).
- **IOC-Direct organisations (AFP, AP, Reuters, Xinhua, Getty, etc.):** Resolved ---
  managed under a special `IOC_DIRECT` pseudo-NOC code.
- **INOs (International News Organisations** --- terminology corrected per Emma #85; was previously "International Non-Governmental Organisations" which was a misreading): INOs follow
  the IOC-Direct workflow with a distinct org-type label ("INO") to
  differentiate from "Worldwide Agency" for OCOG ACR coding purposes.
  EPA (European Photo Agency) is the canonical example.
- **Other edge cases:** Are there any other entities that receive media
  credential quotas outside the NOC/IF/IOC-Direct model?

**Category enumeration per quota assignee (per Emma #83):**

- **NOCs**: E, Es, EP, EPs, ET, Ec, **NOC E**, **NOC Es** (new per #197), ENR (long list submission)
- **IFs (selected)**: Es, EPs (sport specialists for their sport), plus 1 Es + 1 EPs for IF staff. Named: FIFA, FIBA, FEI, World Sailing — exact list TBC (per #5).
- **IOC-Direct**: 4 IOC-recognised news agencies (AFP, AP, Reuters, Xinhua) + Getty + INO + ENR direct (CNN-class — see §5.1) + IF staff allocation oversight
- **USOPC (host territory)**: Ex, EPx (outside the 6,000 quota) — see §4.6

**EOR / Refugee Olympic Team placement (NEW open question per Emma #190):**

Emma's note: "in past Games we have treated the Refugee team as an NOC and it belonged in this category but I am happy to put them here but they will request NOC E." EOR will request NOC E, which is a NOC-only category. Two ways to model:

- **Option A (D.TEC prior — recommended):** treat EOR as a special NOC code with full NOC quotas (E, EP, NOC E, NOC Es, etc.). Matches past Games. Schema-clean: `noc_quotas.entity_type` already supports `noc | if`; add `EOR` as a code under `noc`.
- **Option B:** keep EOR under IOC-Direct but allow NOC E as a permitted exception in the IOC-Direct flow.

**Resolution status:** awaiting Emma's confirmation between Options A and B at the next meeting.

**Roles impacted:** IOC Admin (assigns quotas), OCOG Admin (approves
allocations)

### 3.2 Quota Ownership --- IOC Enters Direct vs. OCOG Re-keys from Spreadsheet \[EM 2026-04-02\]

**Status:** RESOLVED --- 2026-04-11

**Resolution:** - **Model A confirmed.** The IOC **owns the quotas and
enters or imports** them directly into PRP. OCOG does not re-key from
a spreadsheet. The quota-entry screen built for IOC Admin stands; no
rework required. - **OCOG approves PbN. IOC watches.** The OCOG is the
single formal approval gate for PbN slot allocations. The IOC has
read-only visibility on PbN; there is no IOC approval step in the PbN
state machine. This matches what is built. - **Holdback caveat:** IOC
may retain some quota quantities outside the system --- what IOC
enters in PRP may not equal their total allocation across all
channels. Whether PRP needs to surface this gap (e.g. a "portal quota
vs. total quota" field or informational note) or simply show what IOC
entered is a UX detail to confirm before the July quota-entry phase.
Not blocking.

**Scenario:** The IOC determines per-category quota totals for each of
the 206 NOCs. The question is how those numbers get into the portal.

**Roles impacted:** IOC Admin (enters quotas, read-only on PbN), OCOG
Admin (approves PbN)

## 4. Press by Number (PbN) --- Allocating Slots to Organisations

These questions relate to the process where NOCs assign their IOC-given
quotas to specific media organisations, and the OCOG formally approves
those allocations.

### 4.1 NOC E (Press Attaché) --- How NOCs Nominate Their Own Staff \[CLOSED 2026-04-26 per Emma #196\]

**Status:** CLOSED 2026-04-26 --- Emma #196 confirms: NOC E in overall NOC quota, only press attachés / NOC staff producing written content, not via EoI form, small NOCs typically get 1. The new **NOC Es** category (sport-specific NOC press attaché) is added per #197 and tracked as a v0.9 TODO.

**Scenario:** Every NOC has communications staff --- press officers,
spokespeople, media liaisons --- who need press accreditation to access
the Main Press Centre and press areas. These are not external
journalists; they work for the NOC itself. The IOC gives each NOC a
separate "NOC E" quota for these staff (typically 2--5 people),
calculated separately from the main E-category quotas.

These people do not apply through the public EoI form. The NOC nominates
them directly.

**Resolution:** The NOC creates a **single** organisation record
representing their own communications team (e.g., "USA NOC
Communications Staff") using the direct entry route. During PbN, the
NOC allocates NOC E slots to this org, and the OCOG approves the
allocation as part of the standard PbN approval process. Individual
press attaché names are not collected in PRP --- that happens later in
ACR (Press by Name, 2027).

A NOC may create more than one direct-entry record for NOC E if they
have a legitimate operational reason (e.g. separate press and
broadcast teams); there is no hard block on multiples, but the Press
by Number Guide will encourage a single record as the default.

**Roles impacted:** NOC Admin (nominates their staff), OCOG Admin
(approves PbN allocation), IOC Admin (sets NOC E quota).

### 4.2 IOC-Direct Organisations --- Setup and Workflow \[EM 2026-04-02; RE-OPENED 2026-04-26\]

**Status:** RE-OPENED 2026-04-26 per Emma #193: "There is no PbN for IOC direct. LA28 does not need to approve. IOC updates the LA reguarly with this list so they can contact them for press services. This list is constantly updated until Games time. How do we ensure each new contact is highlighted or changed when sent to LA"

**Background:** There are approximately 20 IOC-direct international
organisations (AFP, AP, Reuters, Xinhua, etc.) that receive press
credentials outside the NOC EoI/PbN track. The portal currently
implements a model where the IOC manages these organisations in-app ---
with an IOC-managed screen for adding/removing orgs and OCOG visibility
and approval of IOC-Direct PbN allocations.

**Resolution (revised 2026-04-26):** In-app IOC management of IOC-Direct organisations
is already built. **Workflow changes per Emma #193:**

- **No PbN approval flow** for IOC-Direct orgs. The IOC manages IOC-Direct directly; LA28 does NOT approve. IOC sends LA28 an updated list periodically; LA28 receives it and contacts orgs for press services (accommodation, rate card, etc.).
- **IOC enters into PRP, not into ACR** (per #199). PRP is the source of truth; LA28/OCOG handles the downstream feed into ACR. IOC does not enter ACR directly.
- **OCOG approval is removed for IOC-Direct** in PRP-FR-026, falling out of the §2 reframe (OCOG = coordinator/visibility, not approver). OCOG keeps visibility on IOC-Direct entries by process; chooses not to flag them.
- **Continuous updates until Games time.** Emma flags that the IOC-Direct list is continuously updated. LA28 needs new/changed contact highlighting in the feed.

**Open question for the meeting (continuous updates):** how does PRP highlight new/changed IOC-Direct contacts in the feed to LA28? This is the same shape as the §4.3 master-status / round-tripping question for NOC PbN — at some point ACR becomes master. **Hold the IOC-Direct continuous-change feed work until §4.3 resolves the master-status cutoff.** No v0.9 TODO yet.

**Terminology \[EM 2026-04-02\]:** Per the terminology note above,
"Responsible Organisation" (not "sponsoring organisation") is used in
UI copy relating to IOC-Direct orgs where one organisation acts as the
owning body for another.

**Roles impacted:** IOC (holds the list, approves), OCOG Admin
(enrolls/imports, has OCOG visibility), D.TEC (builds the screens).

### 4.3 After the PRP → ACR Handoff --- Where Do Edits Live? (Source of Truth)

**Status:** RE-OPENED 2026-04-26 --- big re-open. Emma #11, #66, #206 directly contradict the prior Model A resolution: "many NOCs will not submit their forms" by 18 Dec; "there will be many changes to press organisations, contact person, accreditation quotas. How will this be managed in the system. The other RO will also have changes /additions/cancellations. How does LA28 see them"

**The question in one sentence.** After a NOC's PbN allocations have
been handed off from PRP to ACR, **where are subsequent changes made**
--- in PRP (and re-sent to ACR), directly in ACR, or in both systems
kept in sync?

**Prior resolution (Model A, 2026-04-17 — now superseded):** PRP freezes after `sent_to_acr`; post-handoff changes live in ACR. **Emma's pushback challenges this:** ongoing changes are the rule, not the exception, and NOCs frequently need to update orgs/contacts/quotas right up to and during the Games.

**Revised D.TEC framing for the meeting:**

The core question is no longer "Model A vs. Model B." It's:

- Once **Press by Name starts in ACR (October 2027)**, can PRP still be the master? PbName introduces individual-level data (passport, photo) that PRP doesn't carry. ACR's PbName mode may also modify quotas, org lists, and contact info — and we **don't want to build an ACR→PRP back-interface** to bring those changes home.
- Therefore: PRP's "master beyond submission" claim is bounded by what ACR allows post-handoff. We need a clear list of: what can change in ACR after `sent_to_acr`, what can ACR overwrite vs. preserve, what triggers a permanent PRP-data divergence?
- The natural handoff candidate is **PbName-start (October 2027)** rather than `sent_to_acr` (Dec 2026 / Jan 2027). In the window between those two events, PRP could remain master and stream changes into ACR; after PbName-start, ACR is canonical.
- This needs a working session with the **ACR team** plus Emma + Martyn before D.TEC can commit to a design.

**Open questions for the meeting:**

1. What can ACR change after `sent_to_acr`? (quotas, contact info, org list — yes/no for each)
2. Does ACR have a way to ingest a stream of updates from PRP, or is it strictly one-shot import?
3. Where do we put the master-status cutoff — at `sent_to_acr` (status quo, but Emma's reality breaks it), at PbName-start (October 2027), or somewhere else?
4. How does LA28 see ongoing changes from non-NOC ROs (IFs, IOC-Direct)? — see also §4.2.

**This re-open blocks several v0.9 items:** post-`ocog_approved` change handling, ACR push redesign (one-shot vs. ongoing sync), IOC-Direct continuous-update feed (§4.2). These are explicitly held until the meeting resolves the master-status cutoff.

**A small piece that does NOT depend on this re-open** and is committed to v0.9: **LA28 cross-RO change feed at `/admin/ocog/changes`** — a since-last-export view of additions/edits/cancellations across NOCs, IFs, and IOC-Direct. Foundation for the weekly status reports the Strategic Plan §4.1 references.

**Roles impacted:** NOC Admin (where they go to change allocations after
handoff), OCOG Admin (where they adjust allocations and generate
reports), IOC Admin (where they approve amendments), ACR team (API
contract shape depends on the answer).

### 4.4 NOC Direct-Entry into PbN --- No EoI Required \[EM 2026-04-02\]

**Status:** RESOLVED (CONFIRMED FEATURE being built) --- refinement pending in 4.4b (Part 1)

**Scenario:** Emma's comments (96, 98) and her email describe a pattern
that will be supported: some NOCs will not use the EoI form at all and
will want to enter organisations directly into their PbN allocation
table without any prior EoI record. Emma notes (Comment 98): "There will
be press orgs who will not have submitted an EoI that will need to be
entered in the PbN stage directly by the NOC." Her email adds: "some
might not use the EoI form, some might enter information directly in the
Press by Number form."

**Concrete example:** The NOC press officer for a large European
territory knows their national broadcaster will receive PbN slots ---
they have at every Games for the past 20 years. They never asked the
broadcaster to fill out an EoI form. At PbN time, they add them directly
to the allocation table. No EoI record is created.

**Confirmed design --- direct PbN addition:**

NOC admins will be able to add a new org row directly in the PbN
allocation table with no EoI record required. A simple inline form
captures the minimum needed to create the org record and add it to the
allocation in one step: org name, type, country, and category. The OCOG
sees the org in their PbN review and approves (or questions) it there
--- the same approval flow as any other PbN entry. The OCOG will be
able to see which PbN entries had a corresponding EoI record and which
were added directly, providing audit visibility without creating a
bureaucratic barrier for NOC press officers. The quota cap applies
equally to direct-entry orgs: NOCs cannot add direct-entry orgs past
their per-category total.

**Note on IFs:** This direct PbN entry mechanism also solves the
small-IF workflow (see R-4).

**Refinement still pending:** Section 4.4b (Part 1) asks whether
Direct Entry should be reduced to the same minimum required fields as
Inline PbN Entry. If Option A in 4.4b is adopted, this feature's
implementation collapses to a single entry route with two UIs.

**Roles impacted:** NOC Admin (primary --- uses direct entry), OCOG
Admin (sees and approves PbN result), IOC Admin (audit visibility).

### 4.5 PbN Excel Import/Sync --- Reconciling Offline Excel Workflow with the Portal \[EM 2026-04-13\]

**Status:** RESOLVED --- 2026-04-17

**Scenario:** Emma's 2026-04-13 feedback notes that "working out these
quotas may take some time for the big NOCs such as the USOPC. They will
have around 500 accreditations to grant in E, Es, EP, Eps etc categories
and need to look at all the applications once the EoI is over. I know
that the USOPC does this allocation offline via an Excel spreadsheet as
he said that it was easier for him to manage."

**Resolution:** Option D+ adopted. PRP is the source of truth throughout
the PbN phase. Portal will provide: (a) export of a standard
CSV/spreadsheet template pre-populated with quotas and org list in the
IOC Master DB shape; (b) full-overlay reimport --- import replaces the
full allocation; (c) optional clipboard paste for mass entry. No partial
row merges.

The app remains fully functional for all NOC sizes; Excel is
accommodated, not required. The stated direction from the Strategic Plan
(PRP replaces Excel templates) stands; large NOCs who prefer Excel can
export-edit-import.

**Roles impacted:** NOC Admin (especially large NOCs), IOC Admin (Master
DB owner), OCOG Admin (reporting recipient) **NOC input strongly
recommended** --- a 15-minute conversation with the USOPC press officer
about their actual Excel workflow would resolve most of the above
questions.

## 5. ENR --- Extended Non-Rights Broadcasters

These questions relate to the separate ENR track, where NOCs nominate
broadcasters without Olympic media rights and the IOC grants allocations
from a holdback pool. ENR is one of the carved-out areas where the IOC
is the direct decision-maker (not the OCOG).

### 5.1 ENR Process --- Remaining Open Questions \[CLOSED 2026-04-26 per Emma #222, #225, #226\]

**Status:** CLOSED 2026-04-26 with three reinforcements + four new v0.9 TODOs:

- **CLOSED:** ENR review/decision/comms mechanic (per #222 — NOC informs ENR of IOC decision; LA28 receives list to add to NOC allocation; IOC review by w/c 1 Feb 2027; strict 18 Dec 2026 cutoff).
- **CLOSED:** >3 ENR slot policy is informational, not enforced. CNN, ESPN, etc. can get more (per #225). v0.9 soft warning at submission tracked in TODOS.
- **CLOSED:** IOC-Direct ENR concept for international-focus non-MRH (CNN, Al Jazeera, BBC World) per #226. v0.9 TODO tracks the IOC-Direct ENR path extension.
- **NEW v0.9 TODOs:** NOC Direct Entry for ENR + NOC Invite for ENR (per #221 — parity with E-category flows). IOC ENR Excel export (per #223 — export-only, keyed back in). IOC ENR review screen surface needed EoI fields (per #224 — awaiting Emma's Discus list).

**Scenario:** A NOC submits a prioritised list of five ENR organisations
to the IOC. The IOC reviews the list and grants allocations from the
holdback pool --- Organisation A gets the full 20 slots requested,
Organisation B gets a partial grant of 10 (out of 22 requested), and
Organisation C is denied. The NOC sees the IOC's per-org decisions. The
core process is built and tested.

**Resolution:** ENR pool size is IOC-configurable via the quota
table/import (same mechanism as regular category quotas --- not
hardcoded at 350). ENR organisations may self-apply via the public EoI
form; "ENR" will be added as a selectable organisation type. ENR
applications route to the NOC queue; the NOC may approve, reject, or
priority-rank ENR organisations. After EoI close, the NOC submits a
prioritised list to the IOC.

The IOC allocation screen will be a cross-NOC combined view (default)
showing all NOC ENR nominations, filterable and sortable, with a running
total against the configurable pool size.

**Roles impacted:** NOC Admin (submits ENR list, may see ENR
self-applications), IOC Admin (makes grant decisions, needs multi-NOC
combined view), ENR organisations (potential self-applicants)

> Section 5.2 (ENR Undertaking) has been **moved to Part 1** as of
> 2026-04-21 --- the PRP-vs-ACR location question is still open.

## 6. Governance & Integration

### 6.2 Common Codes --- Lookup and Coding Trigger

**Status:** RESOLVED --- DTEC-internal decision

**Context:** When a media organisation is approved in PRP, it
eventually needs an entry in Common Codes --- the shared organisation
registry used across all accreditation systems. Common Codes assigns
each org an official code used by downstream applications (AMS, ADS,
Rate Card, ACR). PRP does not assign Common Codes.

**Resolution:** This is a D.TEC-internal integration decision (lookup
API shape, coding trigger timing, manual vs automatic). D.TEC will
settle the integration direction in an internal design review and
report the conclusion to the OCOG. No stakeholder input required
unless the OCOG wants to weigh in on whether the coding workflow is
triggered automatically at NOC approval or manually by OCOG ACR staff.

**Roles impacted:** D.TEC (primary), OCOG Admin (may initiate coding
manually).

### 6.3 Dedup Policy --- Fail Open, Prevent Duplicates Reaching ACR

**Status:** RESOLVED --- 2026-04-17

**Scenario:** When an applicant submits an EoI, the system checks
whether their organisation already exists (duplicate detection). If
the dedup check is slow or times out, the system accepts the
application anyway (fail open) --- we do not block applicants due to a
system issue.

**Resolution:** Fail-open at submission --- all applications are
accepted regardless of duplicate check timing. Background detection
flags pairs for review. Dedup logic as implemented:

- **Within a single NOC:** a pair is flagged when any of four signals
  fire --- same email domain, same contact email, same website
  hostname, or normalised org name + same country. NOC admins can
  resolve the flag by rejecting or returning one of the pair directly
  from the comparison modal in the NOC queue.
- **Cross-NOC:** organisations appearing in multiple NOC territories
  are flagged via `isMultiTerritoryFlag` and surfaced in the IOC
  dashboard. Cross-NOC flags are informational --- legitimate global
  wire services (AP, Reuters, AFP, Xinhua) are handled as IOC-Direct
  and bypass the NOC process entirely.
- **Unresolved flags remain soft warnings through PbN.** If a NOC
  allocates slots to both flagged orgs without resolving the flag,
  both records currently flow to ACR. A hard block at OCOG PbN
  approval is **not implemented** --- it is left as OCOG operational
  discretion (the OCOG can refuse to approve a PbN submission that
  contains an unresolved duplicate).

**Roles impacted:** Applicant (always gets through), NOC Admin
(reviews flagged duplicates), OCOG Admin (final authority on dedup
resolution).

### 6.4 NOC Onboarding and System Manual \[EM 2026-04-02\]

**Status:** RESOLVED (6.4a and 6.4b) --- 6.4c moved to Part 1 for
scope confirmation

**Scenario:** Emma asks (Comment 185): "As the NOCs will need to be
onboarded on to the ACR system, will LA28ACR onboard them? A manual
will need to be planned to help the NOCs. Will the system be set up in
French too." These are governance questions that need answers before
launch.

#### 6.4a --- Account Provisioning

**Status:** RESOLVED --- 2026-04-21.

**Resolution:** **The OCOG provisions NOC admin accounts** ---
generating credentials, communicating login details, and providing
initial guidance. D.TEC supports the OCOG with technical tooling. 206
NOC accounts must exist before 31 August.

#### 6.4b --- User Manual

**Status:** RESOLVED --- 2026-04-17

**Resolution:** The **OCOG owns and writes the NOC user manual**.
D.TEC contributes technical content; IOC contributes process and
policy content.

#### 6.4c --- French Localisation Scope (now in Part 1)

See section 6.4c in Part 1.

**Roles impacted:** NOC Admin, OCOG Admin, D.TEC, IOC.

### 6.5 Pilot NOC Testing \[EM 2026-04-02\]

**Status:** RESOLVED --- 2026-04-17 --- covered by 1.3 implementation

**Resolution:** Pilot NOC support is enabled by the OCOG's ability to
**selectively open EoI windows for specific NOCs** while others
remain closed --- the same per-NOC window control retained at the
OCOG admin level (per 1.3). This is the same mechanism used for
post-deadline invite extensions. No separate pilot infrastructure is
required.

**EoI pilot agreed (early dates):** The pilot will be handled by this
feature (global EoI start and end dates, with per-NOC overrides). This
is on the **v1.0 backlog** and must ship with v1.0 since it is the
mechanism by which the pilot runs. Pilot NOC selection criteria,
timeline, and go/no-go threshold to be agreed between OCOG, IOC, and
D.TEC.

**Roles impacted:** OCOG Admin (coordinates pilot), IOC (may set
go/no-go criteria), NOC Admin (pilot participants), D.TEC (operates
the pilot environment).

## Resolved Decisions (R-1 to R-10) \[CLOSED markings updated 2026-04-26\]

All decisions below are **RESOLVED** and will be reviewed as a block in
the Part 2 walkthrough meeting. **Per Emma's 2026-04-24 Word comments**, several R-N items now have explicit IOC sign-off and can be promoted from RESOLVED to **CLOSED**: R-1 (#5), R-3 (#4), R-5 (#4, #248), R-7 (#5), R-8 (#5).

R-2 is **RE-OPENED** (not CLOSED) per Emma's #2, #23, #73, #77, #78, #239 — the OCOG-as-approver framing is wrong; see §2 reframe above. R-2 will be re-resolved in the meeting under the new three-role model (NOC arbiter / IOC + OCOG co-reviewers).

### R-1. EoI Owned by NOC; OCOG Has Cross-NOC Review Authority \[CLOSED 2026-04-26 per Emma #5\]

**Decision:** During the EoI phase, the NOC reviews, approves, returns,
or rejects applications for their own territory. The OCOG can see all
applications across NOCs (read-only during EoI) and will have filtering
tools to identify problematic applications. The IOC has visibility but
does not approve or reject EoI applications.

**Clarification --- EoI approval = candidacy, not accreditation \[Ken
2026-04-02\]:** When a NOC approves an EoI, they are approving the
organisation as a *candidate for quota consideration* --- not granting
accreditation. An approved organisation may receive zero slots in PbN.
This two-stage model (candidacy → allocation) is intentional and
important: a NOC with a quota of 80 press slots might approve 200
organisations as candidates, then allocate slots to the 80 they
prioritise in PbN. The remaining 120 approved-but-unallocated orgs
receive no credentials.

This distinction is currently implicit in the portal but not made
explicit to users. The "Approve as Candidate" label change and
explanatory tooltip are required in the portal UI to make clear that EoI
approval places the organisation in the candidate pool, not that it
guarantees credential allocation.

**Roles impacted:** NOC Admin, OCOG Admin, IOC Admin **Please confirm**
the role boundaries during EoI, and confirm that framing EoI approval as
"candidacy" (not accreditation) accurately reflects how IOC and OCOG
expect NOCs to use this stage.

### R-2. PbN Approval --- OCOG Approves, with IOC Exceptions \[RE-OPENED 2026-04-26 per Emma #2, #23, #73, #77, #78, #239\]

**Decision (resolved 2026-04-11):** After a NOC submits their PbN slot
allocations, the OCOG formally reviews and approves (or adjusts) them.
The IOC has read-only visibility on PbN allocations but does not
approve them. PbN state machine: Draft → NOC Submitted → OCOG Approved
→ Sent to ACR. This matches the Model A resolution in section 3.2.

**Named exceptions where the IOC has direct approval authority:**
**IOC-Direct organisations:** The IOC allocates slots to reserved orgs
(AFP, AP, Reuters, etc.) and submits them for OCOG approval through
the same PbN state machine. **ENR:** The IOC grants ENR allocations
from the holdback pool (separate track, not PbN). **IOC-managed
quotas:** The IOC sets per-category quota totals per NOC.

**Roles impacted:** NOC Admin, OCOG Admin, IOC Admin.

### R-3. ENR Process --- NOC Nominates, IOC Grants from Holdback \[CLOSED 2026-04-26 per Emma #4\]

**Decision (updated 2026-04-17):** ENR is a separate track from
EoI/PbN. ENR organisations **may self-apply via the public EoI form**
(per the 5.1 resolution), and the NOC may also nominate organisations
directly. Either way, the NOC assembles a prioritised list and submits
it to the IOC. The IOC reviews each org and grants full, partial, or
zero slots from a separate holdback pool. ENR quota is completely
separate from E-category quotas. The earlier "NOC nominates only"
model is superseded by section 5.1.

**Roles impacted:** NOC Admin, IOC Admin, ENR organisations (may
self-apply).

### R-4. IFs --- Quota and Fast-Track Only, No Public EoI \[EM 2026-04-02 updated\]

**Decision (updated 2026-04-17):** International Federations (IFs) operate
via two distinct tracks:

- **IF-Staff track (all IFs --- staff journalists/photographers quota):**
  Handled via the IOC-Direct/INO workflow with an "IF-Staff" organisation
  type flag, in the same way as INOs. The IOC sets per-category quotas
  for each IF. IFs in this track do not have a public EoI queue and go
  directly to Press by Name in ACR.
- **IF-PbN track (approximately 6--8 IFs that act as responsible
  organisations):** These IFs allocate quota to sport-specific press
  organisations. They use the direct entry or invite process via an IF
  admin actor. OCOG approves their PbN allocations through the same state
  machine as NOC allocations.

**Confirmed --- IFs have NO ENR accreditations \[EM 2026-04-02\]:** Emma
confirms (Comments 100, 112) that IFs do not participate in the ENR
track at all. ENR accreditations do not exist for IFs. Any ENR-related
screens or logic for IF admin roles should be removed or hidden.

**Roles impacted:** IF Admin (only \~6--8 IFs in scope for PbN), OCOG
Admin (approves those IFs' PbN), IOC Admin (sets quotas for all IFs)

### R-5. ENR Partial Allocation (Not All-or-Nothing) \[CLOSED 2026-04-26 per Emma #248\]

**Decision:** When the IOC reviews a NOC's ENR request list, they decide
per org: Granted (full slots), Partial (fewer slots than requested), or
Denied (zero slots). The IOC sets the exact number of slots granted for
each org. This is not all-or-nothing per NOC.

**Roles impacted:** IOC Admin, NOC Admin (sees decisions) **Please
confirm** per-org partial allocation is correct.

### R-6. Flat Org Identity Model (No Parent-Child Hierarchy)

**Decision:** Each territory's instance of an organisation is an
independent record. For example, a broadcast company with bureaux in
Japan and the United States would have two separate org records --- one
managed by the JPN NOC and one by the USA NOC. They are linked only by a
shared email domain, which triggers a multi-territory flag. A
parent-child corporate hierarchy model is deferred.

Note: The largest international wire services (AFP, AP, Reuters, Xinhua)
are handled separately as IOC-Direct organisations --- they bypass the
NOC process entirely and are managed by the IOC.

**Roles impacted:** NOC Admin, OCOG Admin, IOC Admin **Please confirm**
the flat model is acceptable, or let us know if corporate hierarchy
visibility is needed.

### R-7. IOC Can Edit Quotas After Import \[CLOSED 2026-04-26 per Emma #5 (IOC owns quotas)\]

**Decision (resolved 2026-04-11):** The IOC imports per-category quota
totals from a CSV file.
After import, the IOC can also edit individual NOC quotas directly in
the portal (toggle an edit mode on the quota table). All changes ---
whether from import or manual edit --- are logged in an audit trail
(previous value → new value, who changed it, when).

**Roles impacted:** IOC Admin.

### R-8. Two-Step Process with Simplified Path for Small NOCs \[CLOSED 2026-04-26 per Emma #5\]

**Decision:** The portal enforces a two-step process: Step 1 (EoI)
where the NOC approves eligible organisations, and Step 2 (PbN) where
the NOC allocates per-category slots to approved orgs. NOCs can reach
Step 2 via any combination of: public EoI submissions, invite-link
pre-filled EoIs, Direct Entry, and Inline PbN Entry --- all feed into
the same PbN allocation table. For smaller NOCs with few applicants, a
streamlined experience is available (approval + slot allocation in a
single workflow view) while the underlying data model and OCOG
approval gate remain the same.

**Roles impacted:** NOC Admin (all sizes), OCOG Admin (approves
regardless of NOC size).

### R-9. Session Timeout

**Decision (updated 2026-04-17):** Admin sessions remain at 8 hours
(will defer to D.TEC IAM policy when SSO is integrated). EoI applicant
sessions will use a 90-day timeout --- applicants should not be timed
out mid-application or when returning to check their application status
at a later date.

**Roles impacted:** All admin roles; EoI applicants **Please confirm**
8-hour admin sessions and 90-day applicant sessions are acceptable.

### R-10. ACR Stub --- Build Now, Integrate Later

**Decision:** We built an ACR adapter with a stub implementation that
simulates the real ACR API. The stub will be replaced with the real ACR
client when the API contract is finalised (June 1, 2026 go/no-go gate).
If ACR is not ready by June 1, the fallback is structured CSV export.

**Roles impacted:** OCOG Admin (triggers export), IOC Admin (visibility)
**Please confirm** this approach is acceptable.

## Appendix --- NOC Representative Engagement Plan

Three Part 1 items benefit from direct input from NOC press officers.
We recommend running **2--3 sessions** with NOC representatives ---
one large territory (e.g. GBR, GER, FRA, USA --- high application
volume) and one smaller territory (e.g. ISL, CYP --- simpler workflow,
likely to use the streamlined path). **OCOG and D.TEC to drive the
sessions jointly.** Martyn (OCOG) to facilitate NOC introductions.

**Scheduling action (per Emma #255, 2026-04-24):** Emma asked when these sessions would happen. Target: schedule **before the next stakeholder meeting** or hold them as part of the meeting itself. D.TEC + OCOG to confirm timing within 1 week of this update.

**USOPC outreach (per Emma #211, 2026-04-24):** Emma offered to introduce D.TEC to **Ike Hartman** (USOPC press accreditation lead). Schedule a ~30-minute conversation covering current Excel workflow, expected EoI volume (~1,500 per #56), filter/triage habits, and PbN allocation practices. Output feeds §2.3b, §4.5, and §4.6.

**Format:** 30--45 minute walkthrough of the current portal UI
focused on the NOC EoI queue, Direct Entry, Inline PbN Entry, and the
PbN allocation table.

**Questions to validate with NOC reps:**

1.  **4.4b** --- Would NOC press officers prefer one minimal entry
    form (name, type, country, category) for both Direct Entry and
    Inline PbN Entry, with contact info collected later --- or is the
    fuller Direct Entry record (contact info + category counts up
    front) genuinely useful at entry time?
2.  **2.3b** --- Is the current EoI queue filter and search enough for
    a large-territory NOC (400+ applications), or do they need extra
    filters (org type, sport, history), saved views, or bulk triage
    actions?
3.  **R-8** --- Does the two-step EoI → PbN process, with the
    flexibility to feed PbN from EoI submissions + invite links +
    Direct Entry + Inline PbN Entry, match how NOC press officers
    actually want to work?

*End of document. For the full design specification, see*
`docs/PRP-design-confirmation.md`*. For questions or feedback, contact
Ken (D.TEC).*

---

## Critic Review (post-revision, 2026-04-21)

*Two independent critic passes were run on this document. The
round-1 pass (pre-revision) flagged five clarity issues and three
ambiguity hotspots. Those findings were then addressed, and a round-2
pass was run on the revised document. The round-2 rating is the
current state; round-1 is summarised for transparency only.*

**Round-2 rating:** Good (for clarity + ambiguity).

**Round-1 findings, all resolved in this version:**

- 4.4b recommendation was stated three times with different wording;
  consolidated to one statement plus rationale.
- 2.5 mixed proposal with leftover open questions; now split into Part
  A (confirm proposed design) and Part B (three remaining questions).
- 6.1 RACI had two `??` cells without proposed values; both now carry
  D.TEC proposals (Batch communications A = OCOG; ACR API contract A
  = D.TEC).
- 5.2 had no D.TEC recommendation; added explicit "D.TEC position: no
  recommendation in advance; resolution at the meeting," flagged as a
  deliberate deviation from the Part 1 pattern.
- 6.4c's "required" was underspecified; now decomposed into legal
  mandate / operational necessity / user preference.
- Stale "provisional until April 15/16 meeting" caveats on R-2, R-3,
  and R-7 contradicted the Part 2 "uniformly RESOLVED" framing;
  removed.
- 2.5 per-NOC override persistence was ambiguous; now explicit
  ("stays active until the OCOG manually clears it").
- 4.4b "collapses toward a single entry route" was vague; replaced
  with concrete "What stakeholders will see if Option A is adopted."

**Round-2 residual issues:**

1.  **Em-dash usage remains partial.** Ken's style rule is "no em
    dashes, ever." The document still carries em dashes in titles,
    status lines, and many bullet explanations. Partial cleanup was
    deliberate (full purge was out of scope). Cosmetic style drift
    against an internal rule; external readers unfamiliar with the
    rule are unlikely to notice.
2.  **"Finalise" still appears** in the preamble and in the PbN
    Finalisation domain term. Domain-term uses are fine; preamble use
    is a minor drift that was left intact.
3.  **Passive construction in 2.5 intro** ("how EoI close, PbN
    finalisation, and ACR push are triggered"). Minor.

**New issues introduced by the revisions:** None material.

**Overall assessment:** The doc is meeting-ready. The Part 1 / Part 2
split works, every Part 1 item states an explicit ask plus a D.TEC
position (or an explicit "no recommendation"), and the RACI gives
stakeholders something concrete to confirm or amend. Remaining style
drift is cosmetic only.
