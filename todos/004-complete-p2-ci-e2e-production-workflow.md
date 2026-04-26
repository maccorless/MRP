---
status: pending
priority: p2
issue_id: "004"
tags: [code-review, ci, security, testing]
dependencies: []
---

# CI E2E Workflow Runs Against Live Production Without Auth Secrets

## Problem Statement

The new `e2e-deployed.yml` workflow runs `bun test:e2e` against the Railway production URL on every push to `main`. Problems:

1. `NEXTAUTH_SECRET` is not injected — any E2E tests that exercise the admin login or session flow will either crash or submit credentials to production without valid session signing
2. E2E tests that exercise the applicant submission flow will create real application rows in the production database on every push
3. The Railway production URL is hardcoded in the workflow file (infrastructure reconnaissance)

The `playwright.config.ts` conditionally starts `webServer` only when `E2E_BASE_URL` is not set — so the E2E_BASE_URL override mechanism already works correctly. The missing pieces are auth secrets and test data hygiene.

## Findings

- **File**: `.github/workflows/e2e-deployed.yml`
- Missing `NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}` in env block
- Hardcoded `https://mrp-production-1a18.up.railway.app` in workflow
- No test data cleanup step after run
- `playwright.config.ts` already supports `E2E_BASE_URL` override ✓

## Proposed Solutions

### Option A: Add secrets + move URL to repo variable (Recommended)
```yaml
env:
  E2E_BASE_URL: ${{ vars.RAILWAY_PRODUCTION_URL }}
  NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
  CI: true
```
- Add `RAILWAY_PRODUCTION_URL` as a repository variable (not secret)
- **Effort**: Small
- **Risk**: Low

### Option B: Point to a dedicated staging environment instead of production
- Create a Railway staging environment that gets deployed on main push
- Run E2E against staging, not production
- **Pros**: No production data pollution at all
- **Cons**: Requires Railway staging setup
- **Effort**: Medium
- **Risk**: Low

### Option C: Tag E2E test submissions for cleanup
- Prefix test application data (org name, email) with `e2e-test-` 
- Add a cleanup step in the workflow that deletes tagged rows after the run
- **Effort**: Medium
- **Risk**: Medium

## Recommended Action

Option A immediately (10-min fix); Option B is the right long-term answer.

## Technical Details

- **Affected files**: `.github/workflows/e2e-deployed.yml`
- Railway repo variables: Settings → Variables → Repository variables

## Acceptance Criteria

- [ ] `NEXTAUTH_SECRET` injected from GitHub secrets
- [ ] Railway URL moved to repo variable (`vars.RAILWAY_PRODUCTION_URL`)
- [ ] E2E tests do not leave test data rows in production DB, OR have a cleanup step

## Work Log

- 2026-04-17: Identified by security-sentinel in code review of main branch
