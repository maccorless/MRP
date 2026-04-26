**Last updated: 17-Apr-2026 18:00 AEST**

# LA28 Media Registration Portal --- Open Questions for Stakeholders

**Date:** 2026-04-11

**From:** D.TEC (Ken / DTEC)

**To:** IOC Media Operations (Emma / IOC OIS), LA28 Accreditation Lead
(Martyn / OCOG)

**Purpose:** Confirm, choose, or discuss the items below so we can
finalise the portal design before the August 24 launch.

**How to use this document:** Each item describes a real scenario that
will happen in the portal, explains what we've built or plan to build,
and asks for your input. Items marked **PROVISIONAL** have a working
default --- we'll keep it unless you tell us otherwise. Items marked
**OPEN** need a decision before we can build.

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

## 1. Expression of Interest (EoI) --- The Public Application Process

These questions relate to the public-facing form that media
organisations use to apply for press accreditation through their NOC.

### 1.1 EoI Form Fields --- Final List

**Status:** CLOSED --- 2026-04-17

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

**Status:** CLOSED --- 2026-04-17 --- already implemented

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

**Resolution:** A structured dropdown of 36 LA28 sports (at sport level,
not discipline level) is already implemented. The dropdown appears when
Es or EPs is selected on the EoI form and is single-select. This matches
Martyn's recommendation.

**Roles impacted:** Applicant, NOC Admin (filters applications by
sport), OCOG Admin (reporting)

### 1.3 EoI Window --- Who Controls When Applications Open and Close?

**Status:** CLOSED --- 2026-04-17 --- implementation required

**Scenario:** The global EoI window is scheduled to open August 24, 2026
and close October 23, 2026. In the portal, each NOC can independently
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

**Status:** PROVISIONAL --- each freelancer is an independent org

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

**Status:** CLOSED --- 2026-04-17 --- already implemented

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

**Resolution:** The feature has been renamed from "Fast-Track Entry" to
"Direct Entry" and is fully implemented. Any NOC admin may add an
organisation directly without a second approval. Entries are
audit-logged as `noc_direct_entry`, badged in the NOC EoI queue, and
visible in the OCOG cross-NOC view. No limit on the number of direct
entries; audit log is the governance mechanism.

**Roles impacted:** NOC Admin (uses direct entry), OCOG Admin (cross-NOC
visibility), IOC Admin (audit visibility) **NOC input recommended** ---
does this match how NOCs would actually want to work?

## 2. OCOG and NOC Review & Decision-Making

These questions relate to how OCOG and NOC administrators evaluate
applications and manage decisions. The OCOG is the primary review
authority across NOCs; the IOC has visibility but generally does not
approve (with the carved-out exceptions noted above).

### 2.1 NOC Workflow --- EoI Queue vs PbN Screen

**Status:** CLOSED --- 2026-04-17

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
eligibility --- "is this a legitimate media organisation?" --- not about
slot quantities.

**Mode 2 --- "Work on allocation" sessions.** The NOC opens the Press by
Number screen and assigns slot numbers to approved candidates against
their IOC quota. This includes candidates from EoI, direct entries, and
direct PbN additions. The NOC will return to this screen multiple times
as they refine their allocation, respond to OCOG feedback, and
eventually submit.

**Resolution:** The two-screen model is confirmed --- EoI queue for
eligibility decisions, PbN screen for slot allocation. The home
dashboard bridges the two with a summary. Applicant-facing status
communication: applicants see only "Returned for Correction" and "Under
Review" until the official batch communication release date. Other
statuses (approved, rejected) are held and communicated in batch.

**Roles impacted:** NOC Admin (primary), OCOG Admin (visibility) **NOC
input strongly recommended** --- validate with at least one
large-territory and one small-territory NOC representative.

### 2.2 Application Reversals --- Differentiating EoI Approval from PbN Allocation

**Status:** CLOSED --- 2026-04-17 --- implementation required

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

**Resolution:** Rejection is reversible. A NOC admin may un-reject an
application (rejected → pending) without OCOG approval. This is
low-risk because applicants are not notified of rejection until the
batch communication release date. All reversals are audit-logged.
Post-ACR-export reversals remain blocked (per 4.3 Model A). Audit log is
sufficient for OCOG visibility of reversals; no additional visual flag
required.

**Roles impacted:** NOC Admin (EoI reversals), OCOG Admin (PbN
reversals, visibility), IOC Admin (audit visibility)

### 2.3 Dashboard Filtering --- What Signals Help Reviewers Prioritise?

**Status:** CLOSED --- 2026-04-17 --- implementation required

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

**Status:** CLOSED --- 2026-04-17 --- implemented

**Scenario:** A small, unknown media company applies through three NOCs
simultaneously, trying to get credentials through whichever one approves
first. The OCOG --- as the primary cross-NOC authority --- might want to
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

### 2.5 EoI Close Process & Batch Communications

**Status:** OPEN --- for next stakeholder meeting

**Scenario:** When the EoI window closes, and separately when PbN is
finalised, a batch of communications and downstream activities is
triggered --- including rejection notifications, approval-as-candidate
confirmations, and handoffs to subsequent process stages.

**Questions we need answered:**

1.  What communications fire at each close event (EoI close, PbN final
    approval, ACR handoff)?
2.  In what order do they fire, and are any conditional on others
    completing?
3.  Who approves the release of each communication batch --- OCOG, IOC,
    or D.TEC?
4.  Does the portal orchestrate the batch release, or is it a manual
    step by OCOG?
5.  Are rejection notifications truly held until the batch release date,
    and who sets that date?

**Roles impacted:** Applicants (receive communications), NOC Admin (may
trigger release), OCOG Admin (approval authority for communications),
D.TEC (portal orchestration).

## 3. Quota Management --- IOC Sets the Numbers

These questions relate to how the IOC assigns per-category quotas to
each NOC and how those quotas flow through the system.

### 3.1 Quota Assignees Beyond NOCs --- Who Else Gets Quotas?

**Status:** CLOSED --- 2026-04-17 --- awaiting IOC confirmation

**Scenario:** The IOC imports per-category quota totals for each of the
206 NOCs. But there are other entities that also need media quotas:

- **International Federations (IFs):** Resolved --- IFs have quotas set
  by the IOC and enter their own fast-track items for OCOG approval (see
  R-4 below).
- **IOC-Direct organisations (AFP, AP, Reuters, etc.):** Resolved ---
  managed under a special `IOC_DIRECT` pseudo-NOC code.
- **INOs (International Non-Governmental Organisations):** INOs follow
  the IOC-Direct workflow with a distinct org-type label ("INO") to
  differentiate from "Worldwide Agency" for OCOG ACR coding purposes.
  EOR/Refugee Team is handled via the INO/IOC-Direct route and does not
  appear as a standalone NOC in any dropdown. This adopts Martyn
  Cornish's (OCOG) recommendation; to be confirmed with Emma Morris
  (IOC).
- **Other edge cases:** Are there any other entities that receive media
  credential quotas outside the NOC/IF/IOC-Direct model?

**Resolution:** INOs follow the IOC-Direct workflow with a distinct
"INO" org-type label. EOR/Refugee Team is handled via INO/IOC-Direct
route. Awaiting IOC confirmation from Emma Morris.

**Roles impacted:** IOC Admin (assigns quotas), OCOG Admin (approves
allocations)

### 3.2 Quota Ownership --- IOC Enters Direct vs. OCOG Re-keys from Spreadsheet \[EM 2026-04-02\]

**Status:** RESOLVED --- 2026-04-11

**Resolution:** - **Model A confirmed.** IOC enters per-category quota
totals directly into the portal. OCOG does not re-key from a
spreadsheet. The quota-entry screen built for IOC Admin stands; no
rework required. - **OCOG approves PbN. IOC watches.** The OCOG is the
single formal approval gate for PbN slot allocations. The IOC has
read-only visibility on PbN; there is no IOC approval step in the PbN
state machine. This matches what is built. - **Open wrinkle (holdback
caveat):** IOC may retain some quota quantities outside the system ---
what IOC enters in the portal may not equal their total allocation
across all channels. Whether MRP needs to surface this gap (e.g. a
"portal quota vs. total quota" field or informational note) or simply
show what IOC entered is a remaining question to clarify with Emma. Not
blocking --- treat as a display/UX detail to confirm before July
quota-entry phase.

**Scenario:** The IOC determines per-category quota totals for each of
the 206 NOCs. The question is how those numbers get into the portal.

**Roles impacted:** IOC Admin (enters quotas, read-only on PbN), OCOG
Admin (approves PbN)

## 4. Press by Number (PbN) --- Allocating Slots to Organisations

These questions relate to the process where NOCs assign their IOC-given
quotas to specific media organisations, and the OCOG formally approves
those allocations.

### 4.1 NOC E (Press Attaché) --- How NOCs Nominate Their Own Staff

**Status:** PROVISIONAL --- design decided, not yet fully built

**Scenario:** Every NOC has communications staff --- press officers,
spokespeople, media liaisons --- who need press accreditation to access
the Main Press Centre and press areas. These are not external
journalists; they work for the NOC itself. The IOC gives each NOC a
separate "NOC E" quota for these staff (typically 2--5 people),
calculated separately from the main E-category quotas.

These people do not apply through the public EoI form. The NOC nominates
them directly.

**Our provisional decision:** The NOC creates a single organisation
record representing their own communications team (e.g., "USA NOC
Communications Staff") using the direct entry route. During PbN, the
NOC allocates NOC E slots to this org, and the OCOG approves the
allocation as part of the standard PbN approval process. Individual
press attaché names are not collected in MRP --- that happens later in
ACR (Press by Name, 2027).

**Questions we need answered:**

1.  Is the NOC E quota formula-based (the delegation size will be known
    e.g., based on delegation size), or does the IOC set it manually per
    NOC like other categories?
2.  Are there cases where a NOC needs multiple entries (e.g., "NOC comms
    team" + "NOC broadcast team"), or is a single "NOC communications
    staff" org sufficient?
3.  Does the OCOG or IOC need to see the individual names of press
    attachés at this stage, or is a slot count sufficient for MRP?

**Additional open question for Martyn:** Why would a NOC need multiple
direct-entry org records for their NOC-E allocation? What is the
real-world scenario? This will inform whether to discourage multiple
entries more actively in the Press by Number Guide.

**Roles impacted:** NOC Admin (nominates their staff), OCOG Admin
(approves PbN allocation), IOC Admin (sets NOC E quota) **NOC input
recommended** --- ask NOC representatives how they currently handle
press attaché nominations.

### 4.2 IOC-Direct Organisations --- Setup and Workflow \[EM 2026-04-02\]

**Status:** CLOSED --- 2026-04-17

**Background:** There are approximately 20 IOC-direct international
organisations (AFP, AP, Reuters, Xinhua, etc.) that receive press
credentials outside the NOC EoI/PbN track. The portal currently
implements a model where the IOC manages these organisations in-app ---
with an IOC-managed screen for adding/removing orgs and OCOG visibility
and approval of IOC-Direct PbN allocations.

**Resolution:** In-app IOC management of IOC-Direct organisations is
already built and is the preferred workflow, providing full audit trail
and OCOG real-time visibility. If IOC/Emma chooses to manage the list
offline and enroll organisations directly in ACR, that is an operational
choice and requires no system changes. The in-app option remains
available.

**Terminology \[EM 2026-04-02\]:** Per the terminology note above,
"Responsible Organisation" (not "sponsoring organisation") should be
used in UI copy relating to IOC-Direct orgs where one organisation acts
as the owning body for another.

**Roles impacted:** IOC (holds the list, approves), OCOG Admin
(enrolls/imports, has OCOG visibility), Martyn/OCOG (defines import
mechanism)

### 4.3 After the MRP → ACR Handoff --- Where Do Edits Live? (Source of Truth)

**Status:** CLOSED --- 2026-04-17

**The question in one sentence.** After a NOC's PbN allocations have
been handed off from MRP to ACR, **where are subsequent changes made**
--- in MRP (and re-sent to ACR), directly in ACR, or in both systems
kept in sync?

**Resolution:** Model A confirmed. MRP freezes after `sent_to_acr`;
post-handoff changes live in ACR. MRP becomes a historical record only.
Any weekly IOC status reporting must pull from ACR, not MRP. Impact on
code: current implementation stands.

**Roles impacted:** NOC Admin (where they go to change allocations after
handoff), OCOG Admin (where they adjust allocations and generate
reports), IOC Admin (where they approve amendments), ACR team (API
contract shape depends on the answer).

### 4.4 NOC Direct-Entry into PbN --- No EoI Required \[EM 2026-04-02\]

**Status:** CONFIRMED FEATURE --- being built

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
--- the same approval flow as any other PbN entry. The OCOG will be able
to see which PbN entries had a corresponding EoI record and which were
added directly, providing audit visibility without creating a
bureaucratic barrier for NOC press officers.

The quota cap still applies: NOCs cannot add direct-entry orgs past
their per-category total. This hard cap is enforced regardless of entry
route.

**Note on IFs:** This direct PbN entry mechanism also solves the
small-IF workflow (see R-4 and the note below).

**Questions for confirmation:** 1. Please confirm the OCOG is
comfortable with orgs appearing in PbN without an EoI trail, provided
they can see the distinction. 2. Please confirm the hard quota cap
applies equally to direct-entry orgs.

**Roles impacted:** NOC Admin (primary --- uses direct entry), OCOG
Admin (sees and approves PbN result), IOC Admin (audit visibility) **NOC
input recommended** --- ask a NOC press officer whether the inline form
approach (org name, type, country, category in one step) is simple
enough for busy press officers.

### 4.5 PbN Excel Import/Sync --- Reconciling Offline Excel Workflow with the Portal \[EM 2026-04-13\]

**Status:** CLOSED --- 2026-04-17

**Scenario:** Emma's 2026-04-13 feedback notes that "working out these
quotas may take some time for the big NOCs such as the USOPC. They will
have around 500 accreditations to grant in E, Es, EP, Eps etc categories
and need to look at all the applications once the EoI is over. I know
that the USOPC does this allocation offline via an Excel spreadsheet as
he said that it was easier for him to manage."

**Resolution:** Option D+ adopted. MRP is the source of truth throughout
the PbN phase. Portal will provide: (a) export of a standard
CSV/spreadsheet template pre-populated with quotas and org list in the
IOC Master DB shape; (b) full-overlay reimport --- import replaces the
full allocation; (c) optional clipboard paste for mass entry. No partial
row merges.

The app remains fully functional for all NOC sizes; Excel is
accommodated, not required. The stated direction from the Strategic Plan
(MRP replaces Excel templates) stands; large NOCs who prefer Excel can
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

### 5.1 ENR Process --- Remaining Open Questions

**Status:** CLOSED --- 2026-04-17 --- awaiting stakeholder confirmation before build

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

### 5.2 ENR Undertaking --- Legal Mechanism \[EM 2026-04-02\]

**Status:** DEFERRED --- out of scope until IOC News Access Rules finalised

**Updated timing \[EM 2026-04-02\]:** Emma confirms (Comment 120) that
the ENR undertaking will be needed later in the process --- at the Press
by Name stage, not at the ENR nomination or grant stage (per Emma
Morris, IOC, 2026-04-02). IOC News Access Rules must be finalised before
the undertaking text can be drafted. This is out of scope for v1.1.

**Resolution:** The ENR undertaking will be needed at the Press by Name
stage, not at ENR nomination or grant stage. IOC News Access Rules must
be finalised before the undertaking text can be drafted. This is out of
scope for v1.1.

**Open question:** Since the undertaking is required at Press by Name
stage (which is handled in ACR in 2027), should this feature be scoped
as an ACR deliverable rather than an MRP deliverable? Awaiting IOC
clarification.

**Scenario:** Before an ENR organisation can receive accreditation, they
must sign an undertaking acknowledging specific terms. This is currently
handled outside the portal via Adobe Acrobat.

**Three options --- for when this is in scope:**

- **Path A (typed name):** The signatory types their full legal name,
  checks a consent box, and the system records a timestamp and IP
  address. A PDF receipt is emailed. This is a small amount of
  development effort.
- **Path B (DocuSign-grade):** A full e-signature flow with
  cryptographic proof. Required only if IOC Legal determines typed-name
  is insufficient. This is significantly more investment than Path A,
  though Path A work is not discarded.
- **Path C (external process):** Continue using Adobe Acrobat outside
  the portal. Zero development effort, but the undertaking remains
  disconnected from the portal workflow and requires manual tracking.

**Roles impacted:** ENR organisations (sign the undertaking), IOC Legal
(determines the mechanism), IOC Admin (manages ENR workflow)

## 6. Governance & Integration

### 6.1 RACI --- Who Owns What?

**Status:** OPEN --- critical gap

**Scenario:** Three parties are involved in the portal: the IOC
(oversees the process and owns specific decision authority for ENR,
IOC-Direct, and quotas), LA28/OCOG (primary operational authority ---
approves PbN, cross-NOC review), and D.TEC (builds and operates the
portal).

No RACI document exists. This creates risk around: who signs off on form
field changes? Who provisions NOC admin accounts? Who owns the
production infrastructure? Who responds to a production incident at 2am?

**What we need:** A one-page RACI covering: - EoI form field ownership
(who decides what fields are on the form?) - PbN approval authority
(OCOG confirmed, but who handles escalations?) - ENR grant authority
(IOC confirmed) - NOC onboarding and account provisioning - Production
incident response

**Roles impacted:** All roles --- this is a governance question

### 6.2 Common Codes --- Lookup and Coding Trigger

**Status:** OPEN --- needs D.TEC internal alignment + OCOG input

**Scenario:** When a media organisation is approved in MRP, it
eventually needs an entry in Common Codes --- the shared organisation
registry used across all accreditation systems. Common Codes assigns
each org an official code used by downstream applications (AMS, ADS,
Rate Card, ACR).

MRP does not assign Common Codes. The question is how the two systems
connect: - **At submission time:** Should MRP look up existing Common
Codes entries when an org submits their EoI (to pre-fill data and link
to an existing record)? - **At approval time:** When a NOC approves an
application, should MRP trigger the Common Codes coding workflow via an
API call? Or does OCOG ACR staff manually initiate the coding in a
separate system?

This is primarily a D.TEC internal question, but the OCOG may have
operational input on whether the coding workflow should be triggered
automatically or manually.

**What we need:** A decision on the integration direction, and if lookup
is desired, the lookup API specification (search by org name? domain?
country?).

**Roles impacted:** OCOG Admin (may initiate coding manually)

### 6.3 Dedup Policy --- Fail Open, Prevent Duplicates Reaching ACR

**Status:** PARTIALLY CLOSED --- 2026-04-17

**Scenario:** When an applicant submits an EoI, the system checks
whether their organisation already exists (duplicate detection). If the
dedup check is slow or times out, the system accepts the application
anyway (fail open) --- we do not block applicants due to a system issue.

**Resolution (confirmed):** Fail-open at submission --- all applications
are accepted regardless of duplicate check timing. Background detection
flags pairs for review.

**Known gap:** Unresolved duplicate flags are soft warnings --- if a NOC
assigns allocations to both flagged orgs without resolving the flag,
both records will flow to ACR. Whether to add a hard block at OCOG PbN
approval for unresolved pairs is an open question (see 6.2/6.3 gap
below).

**Open question:** Whether unresolved duplicate pairs should trigger a
hard block at OCOG PbN approval is an open question pending the 6.2
Common Codes / org-identity strategy discussion.

> **Dependency note:** This policy relies on Cross-NOC Duplicate
> Detection (section 2.4) being active. Cross-NOC detection is now
> implemented and active per section 2.4.

**Roles impacted:** Applicant (always gets through), NOC Admin (reviews
flagged duplicates), OCOG Admin (final authority on dedup resolution)

### 6.4 NOC Onboarding and System Manual \[EM 2026-04-02\]

**Status:** OPEN --- three separate governance questions with different
owners and lead times (split below)

**Scenario:** Emma asks (Comment 185): "As the NOCs will need to be
onboarded on to the ACR system, will LA28ACR onboard them? A manual will
need to be planned to help the NOCs. Will the system be set up in French
too." These are governance questions that need answers before launch.

#### 6.4a --- Account Provisioning (technical/ops decision)

**Status:** OPEN --- needs OCOG confirmation

Who is responsible for provisioning NOC admin accounts --- provisioning
credentials, communicating login details, and providing initial
guidance? Is this D.TEC, OCOG, or IOC? This must be resolved before
pilot testing (6.5) can begin, and has a direct lead time: 206 NOC
accounts must exist before August 24.

**Answer needed from:** Martyn (OCOG)

#### 6.4b --- User Manual (content owner decision)

**Status:** CLOSED --- 2026-04-17

**Resolution:** The OCOG owns and writes the NOC user manual. D.TEC
contributes technical content; IOC contributes process and policy
content. To be confirmed with Martyn (OCOG) and Emma (IOC).

#### 6.4c --- French Localisation Scope (build scope decision)

**Status:** OPEN --- partially confirmed

The public EoI form will support French at v1.0 launch (this is now
confirmed and in scope). The back-office admin portal (NOC/OCOG/IOC
dashboards) is English-only for v1.0, with French localisation deferred
to v1.1. To be confirmed with Emma (IOC) and Martyn (OCOG).

**Roles impacted:** NOC Admin (receives onboarding), OCOG Admin (may
deliver onboarding), D.TEC (may produce manual), IOC (may set language
requirements)

### 6.5 Pilot NOC Testing \[EM 2026-04-02\]

**Status:** CLOSED --- 2026-04-17 --- covered by 1.3 implementation

**Scenario:** Emma suggests (Comment 184): "I think we should test the
system with a select number of NOCs." This aligns with the general
principle of controlled rollout before full launch, but we have not yet
defined the pilot structure.

**Resolution:** Pilot NOC support is enabled by the OCOG's ability to
selectively open EoI windows for specific NOCs while others remain
closed --- using the same per-NOC window control retained at the OCOG
admin level (per 1.3). This is the same mechanism used for
post-deadline invite extensions. No separate pilot infrastructure is
required. Pilot NOC selection criteria, timeline, and go/no-go threshold
to be agreed between OCOG, IOC, and D.TEC.

**Roles impacted:** OCOG Admin (may coordinate pilot), IOC (may set
go/no-go criteria), NOC Admin (pilot participants), D.TEC (operates the
pilot environment)

## Resolved Decisions --- For Confirmation

The following decisions have been made and implemented. We're listing
them here so you can confirm they match your understanding. If anything
needs revisiting, we can --- these are not locked.

> **Note on disputed resolutions:** R-2, R-3, and R-7 below are listed
> as resolved but are actively disputed by open questions in the body of
> this document. They are flagged clearly. Do not treat them as settled
> until the April 15/16 meeting produces written agreement.

### R-1. EoI Owned by NOC; OCOG Has Cross-NOC Review Authority

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

### R-2. PbN Approval --- OCOG Approves, with IOC Exceptions

> ✅ **RESOLVED 2026-04-11** --- OCOG approves PbN confirmed. IOC has
> read-only visibility; no formal IOC step in the PbN state machine.
> Model A (section 3.2) adopted. The additional conflict with section
> 4.2 (IOC-Direct approval direction) remains open --- see section 4.2.

**Decision:** After a NOC submits their PbN slot allocations, the OCOG
formally reviews and approves (or adjusts) them. The IOC has read-only
visibility on PbN allocations but does not approve them. PbN state
machine: Draft → NOC Submitted → OCOG Approved → Sent to ACR.

**Named exceptions where the IOC has direct approval authority:** -
**IOC-Direct organisations:** The IOC allocates slots to reserved orgs
(AFP, AP, Reuters, etc.) and submits them for OCOG approval through the
same PbN state machine. - **ENR:** The IOC grants ENR allocations from
the holdback pool (separate track, not PbN). - **IOC-managed quotas:**
The IOC sets per-category quota totals per NOC.

**Important caveat \[EM 2026-04-02\]:** Emma's feedback suggests the
approval authority described above may be reversed from the actual
process --- specifically that the IOC approves the PbN (not just reads
it) and the OCOG's role is quota entry and coordination rather than
final PbN approval. See section 3.2 for full detail. This resolved
decision should be treated as provisional until the April 15/16 meeting
with Emma and Martyn confirms which model is correct.

**Roles impacted:** NOC Admin, OCOG Admin, IOC Admin **Please confirm**
the OCOG owns PbN approval and the IOC exceptions are correctly scoped
--- noting that IOC feedback indicates this may need to be reversed (see
3.2).

### R-3. ENR Process --- NOC Nominates, IOC Grants from Holdback

> ⚠ **OPEN-BLOCKING** --- ENR self-application (section 5.1) remains
> unresolved and contradicts the "NOC nominates only" model here. If
> self-application is adopted, the EoI form, NOC queue action set, and
> ENR state machine all change. Awaiting Emma (IOC) and Martyn (OCOG) to
> confirm the ENR front door model before any further ENR intake work
> proceeds.

**Decision:** ENR is a completely separate track from EoI/PbN. Media
organisations do not self-apply for ENR --- the NOC nominates them. The
NOC submits a prioritised list to the IOC. The IOC reviews each org and
grants full, partial, or zero slots from a separate holdback pool. ENR
quota is completely separate from E-category quotas.

**Roles impacted:** NOC Admin, IOC Admin **Please confirm** this matches
your understanding of the ENR process --- and whether ENR
self-application (section 5.1) should replace or supplement this model.

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

### R-5. ENR Partial Allocation (Not All-or-Nothing)

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

### R-7. IOC Can Edit Quotas After Import

> ✅ **RESOLVED 2026-04-11** --- Model A confirmed (section 3.2). IOC
> enters and edits quotas directly in the portal. The quota-entry screen
> and edit capability built for IOC Admin stand.

**Decision:** The IOC imports per-category quota totals from a CSV file.
After import, the IOC can also edit individual NOC quotas directly in
the portal (toggle an edit mode on the quota table). All changes ---
whether from import or manual edit --- are logged in an audit trail
(previous value → new value, who changed it, when).

**Roles impacted:** IOC Admin **Please confirm** both import and in-app
editing should be supported --- noting this depends on section 3.2
resolution.

### R-8. Two-Step Process with Simplified Path for Small NOCs

**Decision:** The portal enforces a two-step process: Step 1 (EoI) where
the NOC approves eligible organisations, and Step 2 (PbN) where the NOC
allocates per-category slots to approved orgs. However, for smaller NOCs
with few applicants, we will provide a streamlined experience --- for
example, allowing approval and slot allocation in a single workflow
view, while still maintaining the same underlying data model and OCOG
approval process.

**Roles impacted:** NOC Admin (all sizes), OCOG Admin (approves
regardless of NOC size) **Please confirm** a simplified flow for small
NOCs is acceptable, as long as the OCOG approval step remains. **NOC
input recommended** --- ask a small-territory NOC whether the current
two-step process feels burdensome.

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

## Appendix A --- Questions Specifically for Martyn (OCOG)

The following items require Martyn's operational input specifically,
beyond Emma's IOC perspective already received.

  ------------------------------------------------------------------------
  \#        Section                       Question
  --------- ----------------------------- --------------------------------
  1         **3.2**                       ~~Does LA28/OCOG want to own
                                          quota entry (Model B), or is
                                          Model A (IOC enters directly)
                                          acceptable?~~ **RESOLVED
                                          2026-04-11** --- Model A
                                          confirmed. IOC enters directly;
                                          OCOG approves PbN. Holdback
                                          caveat: confirm whether MRP
                                          needs to surface the gap between
                                          portal quota and IOC total
                                          allocation (not blocking).

  2         **4.2**                       ~~Does OCOG enroll IOC-Direct
                                          orgs through MRP, or directly in
                                          ACR?~~ **CLOSED 2026-04-17** ---
                                          in-app management confirmed as
                                          preferred; offline remains an
                                          operational option.

  3         **6.4a**                      Who provisions NOC admin
                                          accounts --- OCOG, D.TEC, or
                                          IOC? 206 accounts must exist
                                          before August 24.

  4         **6.4b**                      ~~Will OCOG contribute process
                                          content to the NOC user manual,
                                          or is D.TEC writing it alone?~~
                                          **CLOSED 2026-04-17** --- OCOG
                                          owns the manual; D.TEC and IOC
                                          contribute content.

  5         **6.4c**                      French localisation: public EoI
                                          form confirmed for v1.0. Admin
                                          portal English-only for v1.0.
                                          Confirm with Emma and Martyn.

  6         **6.1**                       Is OCOG willing to own the RACI
                                          for operational decisions (EoI
                                          window authority, PbN
                                          escalations, NOC onboarding)?

  7         **6.5**                       ~~Will OCOG coordinate pilot NOC
                                          selection and feedback
                                          collection, and by when?~~
                                          **CLOSED 2026-04-17** --- pilot
                                          enabled via selective OCOG
                                          window control (per 1.3).
                                          Selection criteria and go/no-go
                                          threshold to be agreed.
  ------------------------------------------------------------------------

## Appendix B --- NOC Representative Engagement Plan

The following items have open questions that cannot be answered from the
IOC or OCOG perspective --- they require direct input from NOC press
accreditation staff. We recommend engaging **two NOC representatives**:
one large territory (e.g. GBR, GER, or FRA --- high application volume)
and one smaller territory (e.g. ISL, CYP --- simpler workflow, likely to
use the streamlined path).

**Suggested format:** 30-minute walkthrough of the current portal UI
with the questions below. NOC contact identification: ask Martyn (OCOG)
to facilitate introductions.

  -----------------------------------------------------------------------
  \#   Section        What to validate with NOC reps
  ---- -------------- ---------------------------------------------------
  1    **2.1**        ~~Does the two-mode model (queue sessions
                      vs. allocation sessions) match how NOC press
                      officers actually work? Do they need a combined
                      view?~~ **CLOSED 2026-04-17** --- two-screen model
                      confirmed.

  2    **2.3**        ~~What signals would a large-territory NOC actually
                      use to triage 400+ applications against an 80-slot
                      quota?~~ **CLOSED 2026-04-17** --- search/filter
                      improvements scoped (NOC text search, OCOG NOC
                      drill-through).

  3    **1.5**        ~~Is unlimited fast-track with audit-only governance
                      how NOC press officers would actually want to
                      operate, or would they want a simple
                      OCOG-notification mechanism?~~ **CLOSED
                      2026-04-17** --- Direct Entry confirmed; audit log
                      is governance mechanism.

  4    **4.4**        Is the inline PbN direct-entry form (name, type,
                      country, category in one step) simple enough for a
                      busy NOC press officer to use without guidance?

  5    **R-8**        Does the two-step EoI → PbN process feel burdensome
                      to a small-territory NOC with only 5--10
                      applicants?

  6    **4.1**        How do NOCs currently handle press attaché
                      nominations? Does the single-org direct-entry model
                      fit their process? Why would a NOC need multiple
                      direct-entry records for their NOC-E allocation?
  -----------------------------------------------------------------------

*End of document. For the full design specification, see*
`docs/MRP-design-confirmation.md`*. For questions or feedback, contact
Ken (D.TEC).*
