---
title: "fix: EoI submission confirmation, fast-track minimum fields, and help screens"
type: fix
status: completed
date: 2026-04-09
---

# fix: EoI Submission Confirmation, Fast-Track Minimum Fields, and Help Screens

Three v0.1 scope items from Nas's (Deloitte ACR) review session on 2026-04-09.

## Items

### Bug 1 — EoI submission confirmation
- Added pre-submission confirmation modal to `EoiFormTabs.tsx` — intercepts the final submit, shows org name, categories, contact, and asks user to confirm before firing the server action
- Added "Check your application status →" link on `/apply/submitted` pointing to `/apply/status` (the existing email-based status flow)
- Note: `/apply/status` and `/apply/status/view` already existed and are complete

### Bug 2 — Fast-track minimum fields
- `country` is now required (was optional) — needed for ACR Common Codes export
- `about` is now optional, relabelled "Notes" — it is not in the ACR export type and should not be required

### Enhancement 1 — Help screens
- New `/apply/how-it-works` page: 4-step process, category table, FAQ for applicants
- New `/admin/noc/help` page: workflow timeline, key screens guide, fast-track explanation, FAQ for NOC admins
- "How does this work?" link added to EoI form page header
- "Help & Guide" nav item added to NOC admin navigation

## Files changed

| File | Change |
|---|---|
| `src/app/apply/form/EoiFormTabs.tsx` | Confirmation modal (state, intercept in handleSubmit, modal JSX) |
| `src/app/apply/submitted/page.tsx` | "Check your status" link |
| `src/app/apply/how-it-works/page.tsx` | New — applicant help page |
| `src/app/apply/form/page.tsx` | "How does this work?" link in header |
| `src/app/admin/noc/fast-track/actions.ts` | country required, about optional |
| `src/app/admin/noc/fast-track/page.tsx` | country required attr, Notes label |
| `src/app/admin/noc/help/page.tsx` | New — NOC admin help page |
| `src/app/admin/noc/NocNavTabs.tsx` | "Help & Guide" nav item |
