# Release Notes — April 16–17, 2026

Changes shipped since noon Thursday April 16, 2026.

---

## App rename: Media Registration Portal → Press Registration Portal (PRP)

The system has been renamed from MRP (Media Registration Portal) to **PRP (Press Registration Portal)** throughout. This affects:

- All user-facing page titles and headings
- Session cookie names (`prp_session`)
- CSV export filenames (`prp-eoi-...`)
- Package name and CI test database
- Documentation, CLAUDE.md, and DESIGN.md

---

## EoI Form — New & Updated Fields

The Expression of Interest form has been re-engineered to match the IOC's official first-cut field specification (April 2026).

### Organisation tab

- **Org email address** — new optional field: "Email Address of the Organisation"
- **Other organisation type** — added "Other (please specify)" as an org type option; selecting it reveals a required free-text field
- **Freelancer / Independent** — separated from the existing type list (previously handled separately); selecting this reveals:
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

### Form UX

- Enter key no longer accidentally submits the form from non-last tabs
- Publication tab requires at least one publication type selected to show green completion dot
- Prefill on resubmission/edit now restores all new fields

### Server action + CSV export

- All 8 new fields persisted to the database on submission
- EoI CSV export now includes 8 additional columns: Org Email, Org Type Other, Online Unique Visitors, Geographical Coverage, Social Media Accounts, Press Card, Press Card Issuer, ENR Programming Type

---

## IOC Master Allocation Dashboard (new)

A new **Master Allocation Dashboard** is now available to both IOC and OCOG admins.

- **Location:** `/admin/ioc/master` (IOC) and `/admin/ocog/master` (OCOG)
- **Purpose:** Replaces the manual Paris-style Excel tracking spreadsheet with a live view
- **Data shown per NOC:**
  - IOC quota (per category)
  - Submitted allocations (NOC-submitted, in-flight)
  - Approved allocations (OCOG-approved / sent to ACR)
  - NocE (Press Attaché) slots
  - Compressed view: Press Total / Photo Total / NocE / Grand Total
  - Expanded view: all 6 individual categories (E, Es, EP, EPs, ET, EC)
- **Sections:** NOCs (all 206) · IOC Direct · ENR · IFs (placeholder — IF quota workflow pending)
- **Filters:** Search by NOC code/name, filter by entity type, filter by PbN status
- **Grand total row** pinned at top of table

---

## NOC Admin Queue — Application Drawer

Applications in the NOC review queue now open in a **slide-over drawer** rather than requiring a full page navigation.

- Click any row to open the detail drawer
- All sections visible in the drawer: Organisation, Contacts, Accreditation, Publication, History, Audit trail
- **Prev / Next** navigation within the queue (keyboard: ← →, Escape to close)
- All approve / return / reject / un-approve / reverse-rejection actions available inline
- "Open full page ↗" link for the detailed view
- **New fields** from the EoI re-engineering are now shown in the drawer and full review page:
  - Org email, Org type (specified), Press card status
  - Editor-in-Chief / Media Manager (renamed secondary contact heading)
  - Online unique visitors, Geographical coverage, Social media accounts
  - ENR programming type

---

## NOC Admin — Other Improvements

### Direct Entry (formerly Fast Track)

- **Renamed** throughout from "Fast Track" to "Direct Entry"
- URL changed to `/admin/noc/direct-entry` (old URL redirects)
- Query param changed to `direct_entry_submitted`
- Approved status badge renamed to **"Candidate"** across all admin views

### Application status changes

- **"Approved" → "Candidate"** — the status label for approved applications now reads "Candidate" everywhere in admin and applicant-facing UIs, better reflecting that approval = candidacy, not final accreditation
- **Reversal of rejections** — NOC admins can now reverse a rejected application, moving it back to Pending
- **10-application limit** per email address enforced at submission
- **Invite flow security** — invite_id is now looked up server-side by the applicant's email; client-supplied invite IDs are no longer trusted

---

## OCOG Admin Improvements

### PbN results publishing toggle

OCOG admins can now publish/unpublish Press by Number results using a toggle on the OCOG dashboard. When results are unpublished, applicants see a neutral "pending" status rather than their actual outcome (except for applications returned for corrections, which remain visible).

### EoI application summary

A new **EoI Summary** view (`/admin/ocog/eoi`) shows application counts by NOC and status (pending, approved, returned, rejected) in a pivot table. All 206 registered NOCs are listed, including those with zero applications.

### Duplicate detection

A new **Potential Duplicates** panel (`/admin/ocog/duplicates`) surfaces two types of anomalies:

- **Cross-NOC duplicates** — organisations with the same email domain accredited under 2+ different NOCs (multi-territory flag)
- **Within-NOC duplicates** — NOCs with 2+ organisations sharing the same email domain

Duplicate organisations are also flagged with a warning badge in the NOC review queue.

---

## PbN Improvements

- NocE (Press Attaché) quota is now visible in the OCOG PbN review page, with an editable slot count and teal-highlighted row
- Added totals column to the allocation table
- All 6 category quota bars always shown (no longer hidden when quota = 0)
- Category labels use correct mixed case: E, Es, EP, EPs, ET, EC
- Org-detail view available within the PbN allocation table
- "Responsible Organisation" terminology adopted consistently

---

## Application Status Page (Applicant-Facing)

- Status is masked ("pending") for applicants until OCOG publishes PbN results
- Applications returned for corrections continue to show their actual status regardless of the publish flag
- Read-only application view added; applicants with a pending application can view (but not re-edit) their submission via their access link
- Pending-edit flow clearly distinguished from resubmission flow

---
