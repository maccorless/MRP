---
status: pending
priority: p2
issue_id: "010"
tags: [code-review, architecture, maintainability]
dependencies: []
---

# FIELD_LABELS is a Dual Source of Truth — Use DOM Label Lookup Instead

## Problem Statement

`FIELD_LABELS` in `EoiFormTabs.tsx` is a static map that duplicates the human-readable label text that already exists as `<label>` elements in the DOM. Any time a field label is updated in its tab component, `FIELD_LABELS` must also be updated manually. These two sources of truth will diverge over time. Currently, some required fields are already missing from the map (falling back to `name.replace(/_/g, " ")`).

```typescript
const FIELD_LABELS: Record<string, string> = {
  org_name: "Organisation name",
  org_type: "Organisation type",
  // ... 13 entries, but form has more required fields
};
```

## Findings

- **File**: `src/app/apply/form/EoiFormTabs.tsx`, lines 117–131
- `FIELD_LABELS` covers 13 fields; form has more required fields
- Fields not in the map fall back to `name.replace(/_/g, " ")` — produces "requested E", "noc code" etc.
- The correct label already exists as a `<label htmlFor="field-id">` in the DOM

## Proposed Solutions

### Option A: Read label from DOM at validation time (Recommended)
```typescript
// When building errList, replace FIELD_LABELS lookup with:
const el = requiredEls.find((r) => r.name === name);
const labelEl = el?.id
  ? document.querySelector<HTMLLabelElement>(`label[for="${el.id}"]`)
  : null;
const fieldLabel = labelEl
  ? labelEl.textContent?.replace(/\s*[\*\(optional\)]+\s*/g, "").trim() ?? name
  : FIELD_LABELS[name] ?? name.replace(/_/g, " ");
```
- Single source of truth: the `<label>` elements
- Always shows exactly what the user sees
- **Effort**: Small
- **Risk**: Low (category field keeps its hardcoded label as fallback)

### Option B: Keep FIELD_LABELS but document the maintenance requirement
- Add a comment: "FIELD_LABELS must be kept in sync with label text in tab components"
- **Pros**: No code change
- **Cons**: Maintenance burden, will drift
- **Effort**: None
- **Risk**: Medium (technical debt)

## Recommended Action

Option A — eliminate the dual source of truth.

## Technical Details

- **Affected files**: `src/app/apply/form/EoiFormTabs.tsx`
- Ensure all required fields have both `id` and a `<label htmlFor="...">` in their tab components

## Acceptance Criteria

- [ ] `errList` construction reads label text from `<label>` DOM elements
- [ ] `FIELD_LABELS` map removed (or kept only as fallback for non-`<label>` fields like `category`)
- [ ] Validation modal shows the exact label text the user sees in the form
- [ ] Fields without a label element fall back gracefully

## Work Log

- 2026-04-17: Identified by architecture-strategist in code review of main branch
