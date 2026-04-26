---
status: pending
priority: p2
issue_id: "008"
tags: [code-review, performance, accessibility, react]
dependencies: []
---

# setTimeout(60ms) for Post-Modal Focus is a Race Condition on Slow Devices

## Problem Statement

After the validation modal closes and `setActiveTab(tab)` fires, the code waits 60ms before scrolling to and focusing the first error field:

```typescript
setTimeout(() => {
  const target: HTMLElement | null =
    el ?? formRef.current?.querySelector<HTMLElement>('[name^="category_"]') ?? null;
  target?.scrollIntoView({ behavior: "smooth", block: "center" });
  target?.focus();
}, 60);
```

This assumes React will flush the `setActiveTab` state update and re-render (making the hidden tab panel visible) within 60ms. On mobile devices or CPU-throttled environments, the render may not complete in time. The `scrollIntoView` and `focus()` calls on a hidden element are silently no-ops — the user is left on the correct tab but with no focused element.

The identical pattern exists in the confirmation modal close handler.

## Findings

- **File**: `src/app/apply/form/EoiFormTabs.tsx`, ~line 762
- `setTimeout(..., 60)` is a magic number timing assumption
- Tab panels use `hidden` attribute (not conditional unmount), so `scrollIntoView` is a no-op while `hidden`
- The 60ms window has no guarantee across device speeds

## Proposed Solutions

### Option A: Replace with flushSync (Recommended)
```typescript
import { flushSync } from "react-dom";

onClick={() => {
  setShowValidationModal(false);
  flushSync(() => {
    setActiveTab(firstErrTabRef.current);
  });
  const target = firstErrElRef.current
    ?? formRef.current?.querySelector<HTMLElement>('[name^="category_"]')
    ?? null;
  target?.scrollIntoView({ behavior: "smooth", block: "center" });
  target?.focus();
}}
```
`flushSync` synchronously commits the `setActiveTab` state, then scroll/focus run on a visible element. `flushSync` is appropriate in click handlers (not in renders or effects).
- **Effort**: Small
- **Risk**: Low

### Option B: useEffect watching activeTab
- Watch `activeTab` changes in a `useEffect`, store a "pending focus target" ref, and execute focus after the effect runs
- **Pros**: No imperative flushSync
- **Cons**: More indirect; requires another ref
- **Effort**: Small
- **Risk**: Low

## Recommended Action

Option A — `flushSync` is purpose-built for this exact pattern.

## Technical Details

- **Affected files**: `src/app/apply/form/EoiFormTabs.tsx`
- Apply the same fix to the confirmation modal close handler if it has a similar setTimeout

## Acceptance Criteria

- [ ] `setTimeout(..., 60)` replaced with `flushSync` in validation modal close handler
- [ ] First error field receives focus reliably on slow devices / CPU throttle
- [ ] No setTimeout for focus management remains in the form component

## Work Log

- 2026-04-17: Identified by performance-oracle in code review of main branch
