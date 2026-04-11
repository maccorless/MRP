# EoI Form Tab Indicator & Submission UX — Design Spec

**Date:** 2026-04-11  
**Status:** Approved  
**Scope:** `src/app/apply/form/EoiFormTabs.tsx` and supporting tab components

---

## Problem

Two related UX issues in the EoI application form:

1. **Misleading dot semantics.** The green dot currently means "all required fields filled," which is vacuously true for History (tab 4) and Publication (tab 3) since they have no required fields. A user who never visits those tabs can see them turn green immediately, giving false confidence.

2. **Premature submit.** The Submit button appears the moment the user lands on the History tab, with no signal that optional sections have not been reviewed.

---

## Design: Option A — Indicator upgrade + smart modal

### Tab indicator states

Three states (the existing `partial` / blue-dot state is removed):

| State | Visual | Meaning |
|---|---|---|
| `empty` | Gray dot | Not yet visited, OR visited but required fields still incomplete |
| `complete` | Green dot ● | Visited + all required fields done |
| `full` | Green checkmark ✓ | Visited + all encouraged fields done |

The TypeScript union type expands from `"empty" | "partial" | "complete"` to `"empty" | "complete" | "full"`.

### Visited tracking

A `visitedTabs` `Set<number>` tracks which tabs the user has navigated to in the current session.

**A tab is marked visited when:**
- The user clicks it in the tab bar
- The user clicks **Continue** (marks the tab being left)
- The user clicks **Back** (marks the tab being left)

**Persistence:** Visited state is stored in `localStorage` under the existing `eoi-draft-${email}` key alongside draft form data, as a `visited` array of tab indices. It is restored on mount alongside the draft.

**Rationale for localStorage (not cookie):** Visited tab indices are non-sensitive UI state. The form already relies on localStorage for draft saving. HttpOnly cookies cannot be read by JS on mount without a server roundtrip; non-HttpOnly cookies offer no security benefit over localStorage for this use case.

### Checkmark field definitions

A tab earns `"full"` status when visited and all encouraged fields are filled. Secondary contact fields and `additional_comments` are excluded.

| Tab | Required fields (dot) | Also required for checkmark |
|---|---|---|
| 0 Organisation | org_name, org_type, country, noc_code | org_website |
| 1 Contacts | contact_first_name, contact_last_name | contact_title, contact_phone, contact_cell |
| 2 Accreditation | at least one category checkbox, about | requested quantity for each checked category |
| 3 Publication | *(none)* | publication_types, circulation, publication_frequency, sports_to_cover |
| 4 History | *(none)* | prior_olympic, prior_paralympic, past_coverage_examples |

`additional_comments` (History tab) is explicitly excluded from the checkmark calculation.

Secondary contact fields (secondary_first_name, secondary_last_name, secondary_title, secondary_email, secondary_phone, secondary_cell) do not affect the checkmark on any tab.

### Smart modal (replaces existing confirmation modal)

The existing pre-submission confirmation modal is replaced with a single context-aware modal.

**Mode 1 — All tabs are `"full"` (all checkmarks):**

Shows the existing summary (organisation name, accreditation categories, primary contact name and email). Single CTA: **"Confirm & Submit"**.

**Mode 2 — One or more tabs are not `"full"`:**

Shows the same summary, plus a callout:

> "Your application is complete and ready to submit. To give your organisation the best chance of approval, we recommend including supporting details — such as publication history and coverage examples. NOCs give the most consideration to applications with full information.
>
> You can submit now or return to complete the remaining sections."

Two CTAs:
- **"Complete my application"** (primary, green) — closes modal, navigates to the first tab that is not `"full"`
- **"Submit as-is"** (secondary, outlined) — proceeds to submit

---

## What does not change

- Tab navigation order and keyboard behaviour
- Required field validation at submit time (unchanged — still blocks submission on missing required fields)
- Draft auto-save to localStorage (the visited array is added to the same key, not a separate one)
- Resubmission and invite-arrival paths (visited state is still not pre-populated for resubmissions)

---

## Out of scope

- Progress bar / inline completeness counter (Option B — deferred)
- Review tab (Option C — deferred to v2)
- Secondary contact encouraged as part of checkmark (explicitly excluded by design)
