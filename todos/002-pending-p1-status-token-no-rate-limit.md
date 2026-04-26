---
status: pending
priority: p1
issue_id: "002"
tags: [code-review, security, rate-limiting]
dependencies: []
---

# No Rate Limiting on Status Token Endpoint

## Problem Statement

`requestStatusToken` in `src/app/apply/status/actions.ts` issues a magic-link status token on every call with no rate limiting. The primary `requestToken` path in `src/app/apply/actions.ts` enforces per-email (5/hour) and per-IP (15/hour) limits — but the status endpoint has neither. An attacker can enumerate applicant emails cheaply (any non-"no applications found" response confirms a valid email) and flood the `magic_link_tokens` table with unbounded writes.

## Findings

- **File**: `src/app/apply/status/actions.ts` — no rate limit guards
- **File**: `src/app/apply/actions.ts` — has correct per-email + per-IP guards; pattern exists to copy
- The status view reveals: whether an email has an application, the application's current status, full contact info, accreditation categories, and NOC
- Token table can be bloated with unlimited rows for a target email

## Proposed Solutions

### Option A: Copy rate limiting from requestToken (Recommended)
- Import the same `ipAddress` extraction and per-email / per-IP check from `src/app/apply/actions.ts`
- Apply identical 5/hour per-email and 15/hour per-IP guards
- **Pros**: Consistent with existing pattern; minimal diff
- **Effort**: Small
- **Risk**: Low

### Option B: Stricter limit (3/hour per email)
- Status requests are less common than initial login requests; a lower limit is defensible
- **Pros**: More restrictive
- **Effort**: Small
- **Risk**: Low

## Recommended Action

Option A — copy the guards from `requestToken` verbatim.

## Technical Details

- **Affected files**: `src/app/apply/status/actions.ts`
- Pattern to copy from: `src/app/apply/actions.ts` — the `ipAddress` extraction, the `checkTokenRateLimit` (or equivalent) calls, and the error response

## Acceptance Criteria

- [ ] `requestStatusToken` enforces per-email rate limit (≤5/hour)
- [ ] `requestStatusToken` enforces per-IP rate limit (≤15/hour)
- [ ] Rate limit error returns a user-friendly message (same as `requestToken`)
- [ ] Audit log records rate-limited attempts

## Work Log

- 2026-04-17: Identified by security-sentinel in code review of main branch
