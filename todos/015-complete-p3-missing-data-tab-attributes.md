---
status: pending
priority: p3
issue_id: "015"
tags: [code-review, architecture, correctness]
dependencies: []
---

# Missing data-tab Attributes on Conditional Fields

## Problem Statement

Two conditionally-shown required fields in `OrganisationTab.tsx` lack `data-tab` attributes:

1. `org_type_other` (shown when `org_type === "other"`)
2. `press_card_issuer` (shown when `pressCardHeld === true`)

The error navigation logic reads `data-tab` to determine which tab to navigate to when an error occurs. Missing attributes cause `parseInt(el.getAttribute("data-tab") ?? "0", 10)` to return `0` — which happens to be the correct tab for both fields today. Navigation works by accident, not by contract.

Also: `sports_specific_sport` select in `AccreditationTab.tsx` is visually marked required (asterisk) but lacks the `required` attribute — client validation will not catch it.

## Findings

- **File**: `src/app/apply/form/tabs/OrganisationTab.tsx`
  - `org_type_other` input — no `data-tab` attribute
  - `press_card_issuer` input — no `data-tab` attribute
- **File**: `src/app/apply/form/tabs/AccreditationTab.tsx`
  - `sports_specific_sport` select — no `required` attribute despite visual asterisk
- Works today by coincidence; will break if fields move tabs

## Proposed Solutions

### Option A: Add missing attributes (Recommended)
```tsx
// OrganisationTab.tsx — org_type_other:
<input name="org_type_other" ... data-tab="0" />

// OrganisationTab.tsx — press_card_issuer:
<input name="press_card_issuer" ... data-tab="0" />

// AccreditationTab.tsx — sports_specific_sport:
<select name="sports_specific_sport" required data-tab="2" ... />
// OR: remove the asterisk if the field is truly optional
```
- **Effort**: Tiny
- **Risk**: Low

## Recommended Action

Option A. For `sports_specific_sport`: check with product whether a sport must be specified for Es/EPs categories. If yes, add `required`. If no, remove the asterisk.

## Technical Details

- **Affected files**: `src/app/apply/form/tabs/OrganisationTab.tsx`, `src/app/apply/form/tabs/AccreditationTab.tsx`

## Acceptance Criteria

- [ ] `org_type_other` has `data-tab="0"`
- [ ] `press_card_issuer` has `data-tab="0"`
- [ ] `sports_specific_sport` either has `required` attribute (and matching `data-tab="2"`) OR asterisk removed
- [ ] Validation modal correctly routes to these fields when they are in error

## Work Log

- 2026-04-17: Identified by architecture-strategist in code review of main branch
