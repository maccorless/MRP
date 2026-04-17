Created: 17-Apr-2026 16:00 AEST

# Release Notes — April 17, 2026 (Session 2)

Changes shipped in this release. Covers EoI form bug fixes, seven NOC/OCOG workflow improvements, and the master allocation dashboard redesign.

---

## EoI Form — Bug Fixes

- **Accreditation tab completion dot** now appears immediately when all required fields are filled — previously it was only visible after leaving and returning to the tab
- **Continue button on Publication tab** no longer triggers form submission — submission is now only possible from the final History tab
- **History tab** receives a green completion dot as soon as it is visited
- **Confirm Submission modal** now lists the actual categories requested (E, Es, EP, EPs, ET, EC) rather than showing a blank "Categories" line

---

## Direct Entry — Sport Picker

When a NOC admin selects **Es** (sport-specific journalist) or **EPs** (sport-specific photographer) in the Direct Entry form, a sport picker immediately appears, requiring the admin to specify the Olympic sport. The full LA 2028 sports list is available.

---

## Direct Entry — Secondary Contact

The Direct Entry form now includes the same **Editor-in-Chief / Media Manager** secondary contact section as the public EoI form. Fields: first name, last name, title, email, phone, cell. Revealed via a collapsible "+ Add Editor-in-Chief / Media Manager" button.

---

## NOC Queue — Possible Duplicate Comparison

- The **Possible Duplicate** badge in the NOC review queue is now a clearly clickable button (underlined, pointer cursor) — clicking it opens a side-by-side comparison modal showing both entries
- Differences between the two records are highlighted in yellow
- Each record has a "Review →" button to navigate directly to that application
- The queue row itself is no longer fully clickable — only the org name and the Possible Duplicate badge trigger actions, reducing accidental navigation

---

## Invite Org — Pre-selected Country

The country field in the **Invite Org** form now defaults to the NOC admin's own country (derived from their NOC code). The admin can change it; it is just a default.

---

## URL Fields — https:// Pre-populated

All URL/website fields across the system now show `https://` as the default value rather than a placeholder. Affected forms: public EoI form, Direct Entry, Invite Org, ENR, IOC Direct. Bare `https://` is treated as empty and not saved.

---

## NOC Navigation — Settings Tab Removed

The **Settings** tab has been removed from the NOC admin navigation. The EoI window open/close control (previously in Settings) is now exclusively managed by OCOG admins.

---

## OCOG Admin — EoI Windows

A new **EoI Windows** tab (`/admin/ocog/windows`) gives OCOG admins full control over which NOC EoI submission windows are open or closed.

- Per-NOC toggle (Open / Close) with last-changed timestamp
- **Open All** and **Close All** bulk actions
- Summary count of open vs. closed windows
- All changes are logged to the audit trail

---

## Help & Guide

Each admin role now has a dedicated **Help & Guide** page:

- **NOC:** `/admin/noc/help` — Overview, workflow timeline, key screens, Direct Entry explained, FAQ
- **OCOG:** `/admin/ocog/help` — Overview, EoI summary, PbN approvals, EoI windows, duplicates, master allocations, audit
- **IOC:** `/admin/ioc/help` — Overview, master allocations, quotas, IOC Direct, ENR review, audit

**Contextual linking:** A `? Help` link appears in the top-right of every admin page, next to the user's display name. It opens the help page scrolled directly to the section corresponding to the currently visible tab. Each help page has a sticky table of contents sidebar.

---

## Master Allocation Dashboard — Redesign

The Master Allocation Dashboard (`/admin/ioc/master` and `/admin/ocog/master`) has been significantly redesigned based on stakeholder feedback.

### Table layout

The main allocation table now shows **quota and allocated slots adjacent per category** — each of the seven categories (NocE, E, Es, EP, EPs, ET, EC) has a Q column and an A column side-by-side, followed by:

- **Total Q** — total quota for the entity
- **Total A** — total allocated (all org slot allocations, any state)
- **Δ Remaining** — quota minus allocated; shown in red when negative (over-quota)

Previously the table grouped E/Es/ET/EC as "Press" and EP/EPs as "Photo" — this grouping is removed in favour of always-visible per-category columns.

### Continent column

A **Continent** column (Africa / Americas / Asia / Europe / Oceania) is shown by default, based on a static IOC NOC→continent mapping. It can be hidden via a checkbox toggle.

### Grand totals banner

The system-wide totals banner now shows each category individually (quota and allocated), not just grouped Press/Photo totals. A Total block summarises across all categories.

### Capacity tracker

A new **Capacity Tracker** bar at the top of the dashboard shows:

- **Distributed** — sum of all NOC + IF + IOC Direct quotas
- **IOC Holdback** — slots the IOC keeps in reserve (not distributed to any entity)
- **Total committed** — distributed + holdback
- **Capacity target** — the IOC's total accreditation goal (default 6,000)

The bar is colour-coded: green below 95% of capacity, amber at 95–100%, red over capacity.

### Event settings (IOC admin)

IOC admins can now configure two event-level values on the **Quotas** page:

- **Event Capacity** — total accreditation target (default 6,000)
- **IOC Holdback** — slots reserved by IOC (default 0)

### IF section

The International Federations section replaces the previous "pending stakeholder sign-off" placeholder. IF entities are stored with `entityType = 'if'` in the quota table and appear in their own section below NOC rows. IF codes will be loaded once confirmed.

### Expandable org-level rows

Every NOC, IF, and IOC Direct row in the master table can now be **expanded** (▶) to show the individual organisations that the entity has allocated slots to, including each org's name, per-category slot counts, and allocation state (Draft / Submitted / Approved / Sent to ACR).

### Schema changes

- `noc_quotas.entity_type` column added — distinguishes `'noc'` from `'if'` rows
- New `event_settings` table — stores `capacity` and `ioc_holdback` per event

---
