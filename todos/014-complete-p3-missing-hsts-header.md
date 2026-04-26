---
status: pending
priority: p3
issue_id: "014"
tags: [code-review, security, headers]
dependencies: []
---

# Missing HSTS Header

## Problem Statement

`next.config.ts` does not include a `Strict-Transport-Security` header. While Railway provides HTTPS termination, the app itself does not enforce HTTPS continuation via HSTS. Browsers that visit over HTTP will not be upgraded automatically.

## Findings

- **File**: `next.config.ts` — `securityHeaders` array
- HSTS not present
- Other security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, CSP) are present

## Proposed Solutions

### Option A: Add HSTS header (Recommended)
```typescript
{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }
```
Add to `securityHeaders` array in `next.config.ts`.
- **Effort**: Tiny
- **Risk**: Low (Railway already enforces HTTPS, so this is belt-and-suspenders)

## Recommended Action

Option A.

## Technical Details

- **Affected files**: `next.config.ts`

## Acceptance Criteria

- [ ] `Strict-Transport-Security` header present in HTTP responses
- [ ] `max-age` set to ≥1 year

## Work Log

- 2026-04-17: Identified by security-sentinel in code review of main branch
