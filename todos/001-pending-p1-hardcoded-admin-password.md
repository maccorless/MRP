---
status: pending
priority: p1
issue_id: "001"
tags: [code-review, security, authentication]
dependencies: []
---

# Hardcoded Universal Admin Password in Production Code

## Problem Statement

`PROTO_PASSWORD = "Password1!"` is hardcoded in `src/app/admin/login/actions.ts` and compared against the submitted password as a plain string equality check. Any seeded admin account (including `ioc.admin@olympics.org` with full IOC privileges) is accessible with this single password. The admin login has no per-user bcrypt verification. The app is deployed to Railway production.

Additionally, `/apply/verify/page.tsx` displays a public-facing note: "Prototype: In production this code is sent by email." — this signals to attackers that prototype-level weaknesses may exist.

## Findings

- **File**: `src/app/admin/login/actions.ts`, lines 10 and 26
- **File**: `src/app/apply/verify/page.tsx` — public disclosure note
- `passwordHash` column is queried to confirm the user exists, but password check is `password !== PROTO_PASSWORD` — no bcrypt
- If Railway DB contains seeded accounts, full admin compromise is possible with `Password1!`

## Proposed Solutions

### Option A: Implement bcrypt verification (Recommended)
- Remove `PROTO_PASSWORD` constant
- Add `bcrypt.compare(password, user.passwordHash)` check
- Migrate seeded accounts to use properly hashed passwords
- **Pros**: Correct, industry-standard
- **Cons**: Requires migrating seed data
- **Effort**: Small
- **Risk**: Low

### Option B: Environment variable password (Stopgap)
- Replace `"Password1!"` with `process.env.PROTO_PASSWORD`
- Set a strong secret in Railway env vars
- **Pros**: Immediate fix, no DB migration
- **Cons**: Still no per-user passwords; technical debt
- **Effort**: Small
- **Risk**: Low

### Option C: Block admin login entirely in production (Drastic)
- Check `process.env.NODE_ENV === "production"` and reject all admin logins
- **Pros**: Eliminates the attack surface immediately
- **Cons**: Breaks all admin workflows
- **Effort**: Small
- **Risk**: Medium (operational impact)

## Recommended Action

Option A for the real fix; Option B as an immediate hotfix while A is implemented.

## Technical Details

- **Affected files**: `src/app/admin/login/actions.ts`, `src/app/apply/verify/page.tsx`
- **Components**: Admin login flow

## Acceptance Criteria

- [ ] `PROTO_PASSWORD` constant removed from source code
- [ ] Admin login uses `bcrypt.compare` against `passwordHash`
- [ ] "Prototype" disclosure text removed from `/apply/verify/page.tsx`
- [ ] Add rate limiting / lockout on `/admin/login` after N failures

## Work Log

- 2026-04-17: Identified by security-sentinel in code review of main branch
