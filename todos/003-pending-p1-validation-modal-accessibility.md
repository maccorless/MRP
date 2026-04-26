---
status: pending
priority: p1
issue_id: "003"
tags: [code-review, accessibility, a11y, modal]
dependencies: []
---

# Validation Modal Missing Close Button and aria-describedby

## Problem Statement

The new validation errors modal in `EoiFormTabs.tsx` has two accessibility issues that violate WCAG 2.1:

1. **No visible close/X button**: The only way to dismiss the modal is to click "Go to first missing field" (which also performs navigation) or press ESC. Screen reader users and keyboard-only users who want to stay on their current tab have no graceful dismiss path. ESC is not discoverable from the modal ARIA markup.

2. **No `aria-describedby`**: The dialog has `aria-labelledby` but not `aria-describedby`. The introductory paragraph and error list are not programmatically associated with the dialog, so screen readers (VoiceOver/NVDA) will announce the dialog title but skip the instruction text and error list on focus.

Additionally: focus is not returned to the submit button when the modal is dismissed via ESC.

## Findings

- **File**: `src/app/apply/form/EoiFormTabs.tsx`, lines 734–776
- `role="dialog"` + `aria-modal="true"` + `aria-labelledby` ✓ present
- `aria-describedby` ✗ missing
- Close button ✗ missing
- ESC handler clears modal state but does not call `submitButtonRef.current?.focus()`
- WCAG 2.1 SC 2.1.2 (No Keyboard Trap) affected

## Proposed Solutions

### Option A: Add close button + aria-describedby + focus return (Recommended)
```tsx
// Add ref for submit button
const submitButtonRef = useRef<HTMLButtonElement>(null);

// Update ESC handler to return focus:
function handleKeyDown(e: KeyboardEvent) {
  if (e.key === "Escape") {
    setShowValidationModal(false);
    submitButtonRef.current?.focus();
  }
}

// In modal JSX:
<div role="dialog" aria-modal="true"
  aria-labelledby="validation-modal-title"
  aria-describedby="validation-modal-desc">
  <div className="flex items-center justify-between mb-1">
    <h2 id="validation-modal-title">Missing required fields</h2>
    <button type="button" aria-label="Close" onClick={() => {
      setShowValidationModal(false);
      submitButtonRef.current?.focus();
    }}>✕</button>
  </div>
  <p id="validation-modal-desc">Please complete the following before submitting:</p>
  <ul aria-label="Missing fields" role="list">...</ul>
  ...
</div>
```
- **Effort**: Small
- **Risk**: Low

## Recommended Action

Option A.

## Technical Details

- **Affected files**: `src/app/apply/form/EoiFormTabs.tsx`
- Submit button needs a `ref` added (currently has no ref)
- The `<ul>` in the modal also needs `aria-label="Missing fields"` and explicit `role="list"` (Tailwind resets list semantics in Safari/VoiceOver)

## Acceptance Criteria

- [ ] Modal has a visible close button that dismisses without navigating
- [ ] `aria-describedby` on dialog container points to instruction paragraph `id`
- [ ] Pressing ESC returns focus to the submit button
- [ ] `<ul>` in modal has `role="list"` and `aria-label="Missing fields"`
- [ ] Screen reader announces dialog title + description on modal open
- [ ] Keyboard-only user can dismiss modal and stay on current tab

## Work Log

- 2026-04-17: Identified by agent-native-reviewer in code review of main branch
