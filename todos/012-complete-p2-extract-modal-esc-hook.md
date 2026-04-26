---
status: pending
priority: p2
issue_id: "012"
tags: [code-review, simplicity, react, accessibility]
dependencies: []
---

# Duplicate ESC Key useEffects — Extract useModalEsc Hook

## Problem Statement

Two nearly identical `useEffect` hooks in `EoiFormTabs.tsx` each attach an ESC key listener to `document` for a different modal. They are structurally identical — same focus-first-button, same key check, same cleanup — differing only in which state setter they call. Additionally, `handleGoToFirstError` (the modal's primary CTA handler) is inlined as 10 lines of imperative JSX in the button's `onClick`. The confirmation modal's submit handler is also duplicated byte-for-byte in two branches.

```typescript
// Lines 303–314: confirm modal ESC
useEffect(() => {
  if (!showConfirmModal) return;
  const firstBtn = confirmModalRef.current?.querySelector<HTMLElement>("button");
  firstBtn?.focus();
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") setShowConfirmModal(false);
  }
  document.addEventListener("keydown", handleKeyDown);
  return () => document.removeEventListener("keydown", handleKeyDown);
}, [showConfirmModal]);

// Lines 317–326: validation modal ESC — identical structure
useEffect(() => {
  if (!showValidationModal || !validationModalRef.current) return;
  const firstBtn = validationModalRef.current.querySelector<HTMLElement>("button");
  firstBtn?.focus();
  // ... same pattern
}, [showValidationModal]);
```

## Findings

- **File**: `src/app/apply/form/EoiFormTabs.tsx`, lines 303–326
- Two ESC useEffects with identical structure
- `handleGoToFirstError` logic is 10 lines inlined in JSX (lines 758–769)
- Duplicate confirmation modal submit handlers (lines 843–847 and 868–872) are byte-for-byte identical
- `STATUS_LABELS` object defined inside component body (re-created every render)

## Proposed Solutions

### Option A: Extract useModalEsc hook + named handlers (Recommended)
```typescript
// At module level or in a hooks file:
function useModalEsc(
  isOpen: boolean,
  containerRef: React.RefObject<HTMLDivElement | null>,
  onClose: () => void
) {
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    containerRef.current.querySelector<HTMLElement>("button")?.focus();
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, containerRef, onClose]);
}

// Usage:
useModalEsc(showConfirmModal, confirmModalRef, () => setShowConfirmModal(false));
useModalEsc(showValidationModal, validationModalRef, () => setShowValidationModal(false));

// Extract named handlers:
function handleGoToFirstError() { ... }
function handleConfirmedSubmit() {
  confirmedRef.current = true;
  setShowConfirmModal(false);
  formRef.current?.requestSubmit();
}

// Move to module scope:
const STATUS_LABELS: Record<string, string> = { ... };
```
- Saves ~20 lines
- Prevents future modal implementations from copy-pasting the pattern incorrectly
- **Effort**: Small
- **Risk**: Low

## Recommended Action

Option A.

## Technical Details

- **Affected files**: `src/app/apply/form/EoiFormTabs.tsx`
- `STATUS_LABELS` should join `TABS`, `REQUIRED_FIELDS`, `CHECKMARK_FIELDS`, `FIELD_LABELS` at module scope

## Acceptance Criteria

- [ ] Single `useModalEsc` hook replaces both ESC useEffects
- [ ] `handleGoToFirstError` extracted as named function
- [ ] `handleConfirmedSubmit` extracted and used in both confirmation modal CTA branches
- [ ] `STATUS_LABELS` moved to module scope
- [ ] Behaviour of all modals is unchanged

## Work Log

- 2026-04-17: Identified by code-simplicity-reviewer in code review of main branch
