---
title: "feat: Playwright E2E smoke tests and axe-core accessibility regression suite"
type: feat
status: active
date: 2026-04-10
---

# feat: Playwright E2E Smoke Tests and Accessibility Regression Suite

## Context

The MRP has 13 Vitest integration test files covering server-side workflow logic against a real PostgreSQL DB. There is no browser automation. This plan adds a Playwright layer that is entirely orthogonal to the Vitest suite — separate config, separate scripts, separate CI job.

Two concerns:

1. **E2E smoke tests**: Login → key action → verified outcome, one happy-path per admin role
2. **Accessibility regression**: `@axe-core/playwright` scans on key pages to catch WCAG 2.1 AA violations before they reach production

---

## 1. Installation and Configuration

### Install with Bun

```
bun add -d @playwright/test @axe-core/playwright
bunx playwright install --with-deps chromium
```

Chromium only for now. Firefox/WebKit can be added later.

### `playwright.config.ts` at project root

| Setting | Value | Rationale |
|---|---|---|
| `testDir` | `./e2e` | Isolated from `src/test/` (Vitest) |
| `testMatch` | `**/*.spec.ts` | Distinct from Vitest `*.test.ts` |
| `baseURL` | `http://localhost:3000` | Overridable via `E2E_BASE_URL` env var |
| `use.browserName` | `chromium` | Single browser for speed |
| `retries` | `1` in CI, `0` local | Absorbs transient timing |
| `workers` | `1` | Real shared DB — no parallel workers |
| `timeout` | `20000` | Generous for RSC full-page loads |
| `webServer` | `bun dev`, wait for port 3000 | Playwright manages dev server lifecycle |
| `reporter` | `['list', ['html', { outputFolder: 'playwright-report' }]]` | HTML report for PR review |

### Environment variables

Playwright inherits `.env.local` (shell-injected) locally. In CI, inject `NEXTAUTH_SECRET` and `DATABASE_URL` as secrets — same as Vitest today. No separate `.env.e2e` file needed.

---

## 2. Test Structure

### Directory layout

```
e2e/
  fixtures/
    auth.ts             # storageState login helpers for each role
  smoke/
    public-eoi.spec.ts
    noc-admin.spec.ts
    ioc-admin.spec.ts
    ocog-admin.spec.ts
  a11y/
    eoi-form.spec.ts
    noc-queue.spec.ts
    ioc-dashboard.spec.ts
    audit-trail.spec.ts
playwright.config.ts    # at project root
```

### Auth state: stored session cookies

MRP uses HMAC-SHA256 signed cookies — no OAuth redirects to work around. Standard Playwright `storageState` approach:

```
playwright.config.ts
  projects:
    - name: 'setup-ioc'
      testMatch: 'e2e/fixtures/auth.ts'
    - name: 'ioc-tests'
      dependencies: ['setup-ioc']
      use:
        storageState: 'e2e/.auth/ioc.json'
```

`e2e/fixtures/auth.ts` logs in via the real `/admin/login` form for each role and saves `page.context().storageState()`. Files are gitignored (contain signed session cookies).

**Credentials:**

| Role | Email | Redirects to |
|---|---|---|
| IOC | `ioc.admin@olympics.org` | `/admin/ioc` |
| NOC (USA) | `noc.admin@usopc.org` | `/admin/noc` |
| OCOG | `ocog.admin@la28.org` | `/admin/ocog/pbn` |

Password: `Password1!` for all.

---

## 3. Accessibility Tests with axe-core

### Package

```ts
import AxeBuilder from '@axe-core/playwright';

const results = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa', 'best-practice'])
  .analyze();
expect(results.violations).toEqual([]);
```

### Pages to scan

| File | Route | Auth |
|---|---|---|
| `eoi-form.spec.ts` | `/apply` (email entry) | None |
| `noc-queue.spec.ts` | `/admin/noc/queue` | NOC storageState |
| `ioc-dashboard.spec.ts` | `/admin/ioc` | IOC storageState |
| `audit-trail.spec.ts` | `/admin/ioc/audit` | IOC storageState |

**Note on EoI multi-step form:** Testing the full tab form at `/apply/form` requires a valid magic-link token in the URL. For the initial suite, scan `/apply` (the email entry page) only. A follow-up can add full form scanning once a test token utility is in place.

### axe rule scope

Start with `['wcag2a', 'wcag2aa', 'best-practice']`. Exclude `wcag21a`/`wcag21aa` initially — these trigger colour-contrast rules that need a design review pass before becoming automated failures.

---

## 4. Running Playwright Alongside Vitest

### Scripts to add to `package.json`

```json
"test:e2e":        "playwright test",
"test:e2e:ui":     "playwright test --ui",
"test:e2e:headed": "playwright test --headed",
"test:e2e:debug":  "playwright test --debug"
```

Existing `"test": "vitest run"` is unchanged.

### CI: separate jobs

```
job: vitest
  - bun install
  - bun test

job: playwright   (can run in parallel with vitest)
  - bun install
  - bunx playwright install --with-deps chromium
  - bun test:e2e
```

**Why separate:** Vitest hits the DB directly; Playwright hits the app via HTTP. Running them in the same process risks DB state collisions during cleanup hooks. Playwright also adds ~200 MB of browser binaries.

### .gitignore additions

```
e2e/.auth/
playwright-report/
```

---

## 5. Acceptance Criteria

### Public EoI — `e2e/smoke/public-eoi.spec.ts`

- [ ] `/apply` renders page title and "Send Access Code" button
- [ ] Submitting invalid email format shows `role="alert"` error
- [ ] Skip-to-main-content link is present and visible on focus

### NOC Admin — `e2e/smoke/noc-admin.spec.ts`

- [ ] Login redirects to `/admin/noc`
- [ ] Queue table at `/admin/noc/queue` has at least one row (seed data)
- [ ] Clicking a pending application opens `/admin/noc/{id}`
- [ ] Approving an application redirects to `/admin/noc/queue?success=approved` with `role="alert"` banner

### IOC Admin — `e2e/smoke/ioc-admin.spec.ts`

- [ ] Login redirects to `/admin/ioc`
- [ ] Stat cards render on dashboard
- [ ] Audit trail at `/admin/ioc/audit` shows at least one row
- [ ] Search input filters results (or shows empty state)

### OCOG Admin — `e2e/smoke/ocog-admin.spec.ts`

- [ ] Login redirects to `/admin/ocog/pbn`
- [ ] Unauthenticated access to `/admin/ocog/pbn` redirects to `/admin/login`

### Accessibility — `/apply`

- [ ] axe scan returns zero violations
- [ ] Email input has an associated `<label>`

### Accessibility — `/admin/noc/queue`

- [ ] axe scan returns zero violations
- [ ] Filter link buttons have descriptive text (axe `link-name` rule)

### Accessibility — `/admin/ioc`

- [ ] axe scan returns zero violations
- [ ] Tables have `<th>` header cells

### Accessibility — `/admin/ioc/audit`

- [ ] axe scan returns zero violations
- [ ] Pagination controls (when visible) have accessible labels

---

## 6. Implementation Sequence

| Step | Task |
|---|---|
| 1 | `bun add -d`, browser install, add scripts to `package.json` |
| 2 | Write `playwright.config.ts` at project root |
| 3 | Write `e2e/fixtures/auth.ts` — login helper for all three roles (validates auth works before writing dependent tests) |
| 4 | Write `e2e/smoke/noc-admin.spec.ts` (highest-value; primary workflow) |
| 5 | Write `e2e/smoke/ioc-admin.spec.ts` |
| 6 | Write `e2e/smoke/ocog-admin.spec.ts` (lightweight) |
| 7 | Write `e2e/smoke/public-eoi.spec.ts` (no auth dependency, can be done in parallel with step 4) |
| 8 | Write all four `e2e/a11y/*.spec.ts` files |
| 9 | Add CI job definition |
| 10 | Add `e2e/.auth/` and `playwright-report/` to `.gitignore` |

---

## 7. Out of Scope

- Visual regression (screenshot diffing) — deferred; needs stable design baseline
- Firefox / WebKit cross-browser coverage — add after initial suite is stable
- Mobile viewport testing
- EoI multi-step form with real token — deferred; needs test-token utility
- ENR / PbN submission E2E flows — deferred; complex multi-step workflows
