---
status: pending
priority: p3
issue_id: "013"
tags: [code-review, security, privacy, pii]
dependencies: []
---

# localStorage PII Not Cleared on Successful Submission

## Problem Statement

The EoI form auto-saves all fields (excluding token, email, resubmit_id) to localStorage keyed by `eoi-draft-${email}`. On shared or public devices, contact names, phone numbers, and organisational details persist in localStorage indefinitely after the applicant submits. There is no TTL or cleanup step on successful submission.

## Findings

- **File**: `src/app/apply/form/EoiFormTabs.tsx`, lines 338–351 (auto-save logic)
- localStorage key: `eoi-draft-${email}`
- Also: `eoi-visited-${email}` for visited tab tracking
- Cleared on: (currently nothing on successful submit)
- Risk: Shared devices in press centres or libraries

## Proposed Solutions

### Option A: Clear localStorage after successful submission (Recommended)
```typescript
// In handleSubmit, after confirmedRef check passes and before requestSubmit():
// OR: in a useEffect watching for the page URL change to /apply/success
localStorage.removeItem(`eoi-draft-${email}`);
localStorage.removeItem(`eoi-visited-${email}`);
```
Since `submitApplication` redirects on success, the cleanup should happen before `requestSubmit()` in the confirmed-submit path.
- **Effort**: Small
- **Risk**: Low

## Recommended Action

Option A.

## Technical Details

- **Affected files**: `src/app/apply/form/EoiFormTabs.tsx`

## Acceptance Criteria

- [ ] localStorage draft data cleared when application is successfully submitted
- [ ] localStorage visited-tabs data cleared on submission
- [ ] Refreshing the apply page after a successful submission shows an empty form (not the draft)

## Work Log

- 2026-04-17: Identified by security-sentinel in code review of main branch
