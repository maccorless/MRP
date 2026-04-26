---
status: pending
priority: p2
issue_id: "005"
tags: [code-review, security, csp, xss]
dependencies: []
---

# CSP allows unsafe-inline — Nullifies XSS Protection

## Problem Statement

`next.config.ts` includes `'unsafe-inline'` in both `script-src` and `style-src` directives of the Content-Security-Policy header. This negates the primary XSS defence the CSP provides. If any code path introduces unsanitised rendering, the CSP provides no backstop.

The admin panel renders `reviewNote` (free-text written by admins) and the public status view renders the same `reviewNote` verbatim. React JSX escaping is the only line of defence.

## Findings

- **File**: `next.config.ts`, lines 13-14
- `'unsafe-inline'` in both `script-src` and `style-src`
- `reviewNote` rendered in admin views and public status view without additional sanitisation
- React JSX escaping mitigates direct XSS, but does not protect against a future `dangerouslySetInnerHTML` or templating bug

## Proposed Solutions

### Option A: Nonce-based CSP via Next.js middleware (Recommended)
- Implement per-request nonce in `src/middleware.ts`
- Replace `'unsafe-inline'` with `'nonce-{nonce}'` in CSP header
- See: Next.js Content Security Policy docs
- **Effort**: Medium
- **Risk**: Low

### Option B: Hash-based CSP
- Pre-compute SHA-256 hashes of all inline scripts
- **Pros**: No middleware change
- **Cons**: Fragile — any script change requires hash update
- **Effort**: Large
- **Risk**: Medium

## Recommended Action

Option A — implement nonce-based CSP in middleware.

## Technical Details

- **Affected files**: `next.config.ts`, `src/middleware.ts`

## Acceptance Criteria

- [ ] `'unsafe-inline'` removed from `script-src`
- [ ] Nonce-based CSP implemented in middleware
- [ ] All inline scripts (if any) receive the nonce attribute
- [ ] CSP evaluation passes for the apply and admin routes

## Work Log

- 2026-04-17: Identified by security-sentinel in code review of main branch
