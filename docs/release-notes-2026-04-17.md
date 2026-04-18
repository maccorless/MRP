# Release Notes — April 17, 2026

Changes shipped April 16–17, 2026.

---

## EoI Form — New & Updated Fields

The Expression of Interest form has been re-engineered to match the IOC's official first-cut field specification (April 2026).

### Organisation tab

- **Org email address** — new optional field: "Email Address of the Organisation"
- **Other organisation type** — added "Other (please specify)" as an org type option; selecting it reveals a required free-text field
- **Freelancer / Independent** — separated from the existing type list; selecting this reveals:
  - **Press card question**: "Do you hold a Press Card?" (Yes/No radio, required)
  - **Issuing organisation** field (shown and required when press card = Yes)
- **Sport-specific journalism** — Es and EPs categories now require selecting the specific Olympic sport from the full LA28 sports list
- Resubmission/edit prefill now restores all new fields

### Contacts tab

- **Secondary contact** section renamed to **"Editor-in-Chief / Media Organisation Manager (Optional)"**
- Toggle button now reads "Add Editor-in-Chief / Media Manager"
- Added helper text: "The Editor-in-Chief or Media Manager who oversees the accredited team at your organisation"

### Publication tab

- **Online unique visitors per month** — new optional text field
- **Geographical coverage** — new dropdown (International / National / Local / Regional)
- **Social media accounts** — new optional textarea (e.g. "@org on X/Twitter, Instagram: @org")

### Accreditation tab

- **Coverage description** renamed to "Brief description of your coverage plans for Los Angeles 2028" with a 500-character limit and live counter
- **Per-category maximums**: all E/Es/EP/EPs/ET/EC quantity inputs now enforce max = 100 with an inline warning; ENR organisations are limited to max = 3
- **ENR programming type** — new conditional textarea shown when organisation type is ENR, required for submission

### Form UX fixes

- Accreditation tab completion dot now appears immediately when all required fields are filled — previously it was only visible after leaving and returning to the tab
- Continue button on the Publication tab no longer triggers form submission — submission is only possible from the final History tab
- History tab receives a green completion dot as soon as it is visited
- Confirm Submission modal now lists the actual requested categories (E, Es, EP, EPs, ET, EC) rather than showing a blank "Categories" line
- Enter key no longer accidentally submits the form from non-last tabs
- Publication tab requires at least one publication type selected to show green completion dot
- All URL/website inputs now show `https://` pre-populated; bare `https://` is treated as empty and not saved

### CSV export

EoI CSV export now includes 8 additional columns: Org Email, Org Type Other, Online Unique Visitors, Geographical Coverage, Social Media Accounts, Press Card, Press Card Issuer, ENR Programming Type

---

## App Rename: Media Registration Portal → Press Registration Portal (PRP)

The system has been renamed from MRP (Media Registration Portal) to **PRP (Press Registration Portal)** throughout:

- All user-facing page titles and headings
- Session cookie names (`prp_session`)
- CSV export filenames (`prp-eoi-...`)
- Package name and CI test database
- Documentation, CLAUDE.md, and DESIGN.md

---

## NOC Admin — Direct Entry

- **Renamed** throughout from "Fast Track" to "Direct Entry"; URL changed to `/admin/noc/direct-entry`
- **Sport picker** — when Es or EPs is selected, a sport picker appears requiring selection of the specific Olympic sport
- **Secondary contact** — the Editor-in-Chief / Media Manager section from the public EoI form is now available in Direct Entry
- Website field pre-populated with `https://`

---

## NOC Admin — Queue & Duplicate Detection

### Application drawer

Applications in the review queue now open in a **slide-over drawer** rather than requiring full page navigation:

- All sections visible inline: Organisation, Contacts, Accreditation, Publication, History, Audit trail
- **Prev / Next** navigation within the queue (keyboard: ← →, Escape to close)
- All approve / return / reject / un-approve / reverse-rejection actions available inline
- "Open full page ↗" link for the detailed view
- All new EoI fields shown in the drawer and full review page

### Possible Duplicate comparison

- The **Possible Duplicate** badge in the review queue is now a clearly clickable button — clicking it opens a side-by-side comparison modal
- The queue row itself is no longer fully clickable — only the org name and Possible Duplicate badge trigger actions, reducing accidental navigation

**Multi-signal duplicate detection** — flagging now uses four independent signals; any one is sufficient to raise a flag:

| Signal | Rule |
|---|---|
| Email domain | Same email domain within the NOC (original behaviour) |
| Contact email | Same contact email address within the NOC |
| Website domain | Same website hostname (www. stripped) within the NOC |
| Org name + country | Normalised organisation name (legal suffixes stripped) and country both match within the NOC |

**Comparison modal improvements:**

- **Signal banner** above the table lists in plain English which signals triggered the flag (e.g. "Flagged: same email domain · same website")
- **Matched fields highlighted in green** — the new green highlight shows the evidence of a match; previously differing fields were highlighted in yellow
- **Website** row added to the comparison table
- **Inline Reject and Return for correction** — NOC admins can now reject or return either application directly from the comparison modal without navigating away. A required note must be provided; the status badge in the modal updates immediately after each action. The modal stays open so both applications can be actioned in one session.

---

## NOC Admin — Other Improvements

- **Invite Org** — country field now defaults to the NOC admin's own country (changeable)
- **Settings tab removed** — replaced by OCOG-controlled EoI Windows (see below)
- **Application status: "Approved" → "Candidate"** — better reflects that approval = candidacy, not final accreditation
- **Reversal of rejections** — NOC admins can now reverse a rejected application, moving it back to Pending
- **10-application limit** per email address enforced at submission

---

## OCOG Admin — EoI Windows

A new **EoI Windows** tab (`/admin/ocog/windows`) gives OCOG admins full control over which NOC EoI submission windows are open or closed:

- Per-NOC toggle (Open / Close) with last-changed timestamp
- **Open All** and **Close All** bulk actions
- Summary count of open vs. closed windows
- All changes are logged to the audit trail

---

## OCOG Admin — Other Improvements

### PbN results publishing toggle

OCOG admins can now publish/unpublish Press by Number results using a toggle on the OCOG dashboard. When unpublished, applicants see a neutral "pending" status rather than their actual outcome.

### EoI application summary

A new **EoI Summary** view (`/admin/ocog/eoi`) shows application counts by NOC and status (pending, candidate, returned, rejected) in a pivot table. All 206 registered NOCs are listed.

### Duplicate detection panel

A new **Potential Duplicates** panel (`/admin/ocog/duplicates`) surfaces:

- **Cross-NOC duplicates** — organisations with the same email domain accredited under 2+ different NOCs
- **Within-NOC duplicates** — NOCs with 2+ organisations sharing the same email domain

---

## Master Allocation Dashboard — Redesign

The Master Allocation Dashboard (`/admin/ioc/master` and `/admin/ocog/master`) has been significantly redesigned based on stakeholder feedback. Both IOC and OCOG admins have access to the same live view.

### Table layout

The table now shows **quota and allocated slots adjacent per category** — each of the seven categories (NocE, E, Es, EP, EPs, ET, EC) has a Q column and an A column side-by-side, followed by Total Q, Total A, and Δ Remaining. The Δ column turns red when a NOC is over-quota.

"Allocated" means the sum of all org slot allocations in any state (draft, submitted, or approved) — the allocation state is shown separately via the Status badge on each row.

### Continent column

A **Continent** column (Africa / Americas / Asia / Europe / Oceania) is shown by default and can be hidden via a toggle. Based on the static IOC NOC-to-continent mapping.

### Grand totals banner

The system-wide totals banner now shows each category individually (quota and allocated). Previously it showed only grouped Press/Photo totals.

### Capacity tracker

A new **Capacity Tracker** progress bar shows:

- **Distributed** — sum of all NOC + IF + IOC Direct quotas
- **IOC Holdback** — slots the IOC keeps in reserve
- **Total committed** — distributed + holdback
- **Capacity target** — the IOC's total accreditation goal (default 6,000)

The bar is colour-coded: green below 95%, amber at 95–100%, red over capacity.

### Event settings (IOC admin)

IOC admins can now configure two values on the **Quotas** page:

- **Event Capacity** — total accreditation target (default 6,000)
- **IOC Holdback** — slots reserved by the IOC (default 0)

### IF section

The International Federations section replaces the previous placeholder. IF entities appear in their own section below NOC rows.

### Expandable org-level rows

Every NOC, IF, and IOC Direct row can be **expanded** (▶) to show the individual organisations that the entity has allocated slots to, with per-category counts and allocation state.

---

## PbN Improvements

- NocE (Press Attaché) quota now visible in the OCOG PbN review page with an editable slot count and teal-highlighted row
- Added totals column to the allocation table
- All 6 category quota bars always shown (no longer hidden when quota = 0)
- Category labels use correct mixed case: E, Es, EP, EPs, ET, EC
- Org-detail view available within the PbN allocation table

---

## Application Status Page (Applicant-Facing)

- Status is masked ("pending") for applicants until OCOG publishes PbN results
- Applications returned for corrections continue to show their actual status regardless of the publish flag
- Read-only application view added; applicants with a pending application can view (but not re-edit) their submission via their access link

---

## Help & Guide

Each admin role now has a dedicated **Help & Guide** page, accessible via a `? Help` link in the top-right of every admin page:

- **NOC** (`/admin/noc/help`) — Overview, workflow timeline, key screens, Direct Entry explained, FAQ
- **OCOG** (`/admin/ocog/help`) — Overview, EoI summary, PbN approvals, EoI windows, duplicates, master allocations, audit
- **IOC** (`/admin/ioc/help`) — Overview, master allocations, quotas, IOC Direct, ENR review, audit

The help link opens at the section corresponding to the currently active tab. Each page has a sticky table of contents sidebar.

---

## Technical Changes

### Security

- **Content Security Policy with per-request nonce** — middleware generates a unique nonce for every request and injects it into `script-src`, replacing the previous `'unsafe-inline'` allowance
- **HTTP Strict Transport Security** — `max-age=63072000; includeSubDomains; preload` added to all responses
- **Export API status parameter allowlist** — the `status` query parameter on `/api/export/eoi` is validated against an explicit list of valid values; unrecognised values return 400
- **Website URL validation** — submitted URLs are validated against a `https?://…` pattern before being stored; malformed URLs are treated as empty
- **Invite NOC mismatch guard** — if an invitation's NOC code does not match the applicant's selected NOC, submission is rejected
- **Invite flow** — invite_id is now looked up server-side by the applicant's email; client-supplied invite IDs are no longer trusted

### Database

- All 8 new EoI form fields persisted to the database on submission
- `noc_quotas.entity_type` column — distinguishes `'noc'` from `'if'` rows
- New `event_settings` table — stores `capacity` and `ioc_holdback` per event (migration 0020)

---

## Session TTL

EoI applicants now receive a **90-day status token** (previously short-lived), so returning applicants can check their application status without needing to re-authenticate. Admin sessions remain at the existing 8-hour limit.

---

## OCOG Admin — EoI Dashboard Improvements

- **NOC code search/filter** — a search box on the `/admin/ocog/eoi` summary table allows filtering by NOC code or name
- **Drill-down to NOC applications** — NOC rows in the summary table are now clickable and navigate to a read-only list of that NOC's applications
- **Full CSV export** — the EoI CSV export now includes all 57 form fields; previously missing fields (address, contact details, secondary contact, and several other fields) are now included

---

## PbN Offline Workflow

NOC admins can now complete their Press by Number allocation offline:

- **CSV export** — exports a pre-populated spreadsheet containing the current quota and organisation list
- **CSV reimport** — completed allocations can be reimported via file upload or clipboard paste
- Import is **full-overlay only** — the reimported file replaces the entire current allocation; partial updates are not supported
- **Quota cap validation** — import is rejected if the reimported data would exceed the NOC's quota

---

## New Org Types: INO and IF Staff

Two new organisation types are now selectable in IOC direct-entry and relevant admin views:

- **INO** (`ino`) — International Non-Governmental Organisation
- **IF Staff** (`if_staff`) — International Federation Staff

---

## EoI Form — Additional Information Field

The free-text field on the History tab previously labelled "Additional comments" has been **relabelled to "Additional information requested by your NOC"** to better reflect its purpose. The field accepts unstructured text and is visible to NOC admins in the review drawer.

---

## NOC Admin — Un-reject Action

NOC admins can now **reverse a rejection**, moving the application back to Pending:

- A **required note** must be provided when reversing a rejection
- The reversal and note are recorded in the **audit log**
- Reversals are **blocked** once the application has been exported to ACR — the action is hidden and an explanatory message is shown instead

---

## NOC Window Self-Service Removed

NOC admins can no longer set their own EoI window open/close dates. The OCOG sets a **global deadline** that applies to all NOCs. The OCOG retains a **per-NOC override** capability for pilots and exceptions, managed via the EoI Windows tab (`/admin/ocog/windows`).

---

## ENR Self-Application Workflow

ENR (Extended Non-Rights Broadcaster) is now a **selectable org type on the public EoI form** (`/apply`), allowing ENR organisations to apply directly.

### NOC queue

ENR applications in the NOC review queue display a **priority ranking panel** (rank 1–99) in place of the standard Accept as Candidate action. NOC admins assign a rank to indicate priority to the IOC.

### IOC ENR screen

The IOC ENR review screen has been redesigned as a **cross-NOC combined view**:

- Sortable table showing all ENR applications across all NOCs in a single list
- **Configurable pool size banner** with a progress bar showing how many slots have been granted against the configured pool
- **Inline slot grant editing** — IOC admins can grant or adjust slot counts directly in the table without navigating to a separate page

---

## French Localisation

The public EoI form (`/apply`) is now available in **French** via a language toggle (EN | FR) in the form header:

- All labels, placeholders, validation error messages, button text, and informational panels are translated
- The selected language is persisted for the duration of the session
- The admin portal remains English-only
