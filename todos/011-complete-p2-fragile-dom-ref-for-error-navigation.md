---
status: pending
priority: p2
issue_id: "011"
tags: [code-review, architecture, react, fragility]
dependencies: []
---

# firstErrElRef Stores a DOM Element — Fragile If Tab Panels Are Ever Conditionally Mounted

## Problem Statement

`firstErrElRef` stores a direct `HTMLElement` reference during validation and dereferences it in the modal close handler (after a render cycle). This works today because all tab panels are always in the DOM (`hidden` attribute, not conditional mount). But this correctness depends on an implicit invariant that is not enforced anywhere. If a future change conditionally mounts/unmounts a tab panel (a common React optimisation), `firstErrElRef.current` will become a detached DOM node, `scrollIntoView` and `focus` will silently fail, and no error will surface.

```typescript
// During validation:
firstErrElRef.current = firstErrEl;           // stores live DOM node
firstErrTabRef.current = firstErrTab;

// In modal close handler (after re-render):
const el = firstErrElRef.current;             // may be detached
target?.scrollIntoView(...);                  // silently no-ops on detached node
target?.focus();
```

## Findings

- **File**: `src/app/apply/form/EoiFormTabs.tsx`, lines 169–170 (refs) and 550, 762 (usage)
- Implicit invariant: "all tab panels are always in DOM" is load-bearing
- No type-level or runtime enforcement of this invariant
- If a panel is ever conditionally rendered, navigation silently fails with no error

## Proposed Solutions

### Option A: Store field name + tab index, re-derive element at close time (Recommended)
```typescript
// Replace two refs with one:
const firstErrRef = useRef<{ name: string; tabIndex: number } | null>(null);

// During validation:
firstErrRef.current = firstErrEl
  ? { name: firstErrEl.name, tabIndex: firstErrTab }
  : { name: "category_", tabIndex: 2 };

// In modal close handler:
const err = firstErrRef.current;
if (err) {
  setActiveTab(err.tabIndex);
  flushSync(() => setActiveTab(err.tabIndex));
  const target = formRef.current?.querySelector<HTMLElement>(`[name="${err.name}"]`);
  target?.scrollIntoView({ behavior: "smooth", block: "center" });
  target?.focus();
}
```
- Does not depend on DOM persistence
- **Effort**: Small
- **Risk**: Low

### Option B: Document the invariant explicitly
- Add comment at the tab panel render site: "all panels must remain mounted for firstErrElRef deferred navigation"
- **Pros**: No code change
- **Cons**: Relies on future developers reading and heeding the comment
- **Effort**: None
- **Risk**: Medium

## Recommended Action

Option A — eliminate the implicit invariant.

## Technical Details

- **Affected files**: `src/app/apply/form/EoiFormTabs.tsx`
- This can be combined with the flushSync fix in todo 008

## Acceptance Criteria

- [ ] `firstErrElRef` no longer stores a live `HTMLElement` reference
- [ ] Error navigation re-derives the DOM element by `name` query after tab switch
- [ ] Navigation still works correctly for all required field types (text, select, radio, checkbox)
- [ ] Error navigation still works if tab panels are ever converted to conditional mounts

## Work Log

- 2026-04-17: Identified by architecture-strategist in code review of main branch
