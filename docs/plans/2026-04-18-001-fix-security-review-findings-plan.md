# Security Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply four confirmed security-review fixes — unbiased token generation, tightened CSP style policy, default-secure cookies, and fail-secure `NEXTAUTH_URL` — on the `fixes` branch, verify in Railway staging, then fast-forward to `main`.

**Architecture:** Small, focused edits to five existing files plus one new helper (`src/lib/env.ts`) for the fail-secure URL resolver. Each fix ships in its own commit with dedicated tests so it can be reverted independently if staging reveals a regression. No new dependencies. No schema migrations.

**Tech Stack:** Next.js 16 App Router, TypeScript, Vitest, Node crypto, Web Crypto (middleware edge runtime).

**Out of scope (per stakeholder decision 2026-04-18):**
- `PROTO_PASSWORD` in `src/app/admin/login/actions.ts` — prototype-only, superseded by platform IAM at v1.0.
- 90-day `STATUS_TOKEN_EXPIRY_HOURS` default — intentional for applicant status lookup UX.

---

## Pre-flight

### Task 0: Branch setup

**Files:** none — git only.

- [ ] **Step 0.1: Stash or commit unrelated working-tree changes on `main`**

The review was done while `main` had uncommitted doc edits (`TODOS.md`, `docs/PRP-*.md`, etc.). Those are unrelated to this work. Either:

```bash
# Option A — stash (will restore after this plan completes)
git stash push -u -m "docs: pre-security-fixes WIP"

# Option B — commit to main separately (if the docs are ready to ship)
git add TODOS.md docs/PRP-design-confirmation.md docs/PRP-rq.md docs/feature-flags.md docs/test-plan-manual-walkthrough.md docs/role-permissions.md 'docs/input and feedback/feedback2-stakeholder-questions-updated.md'
git commit -m "docs: stakeholder question updates and role permissions notes"
```

Do NOT commit `static_analysis_codeql_1/`, `.claire/`, `.claude/`, `todos/`, or `scripts/reset-enr-to-draft.ts` in this round — none are part of this plan.

Expected: `git status --short` shows only the directories explicitly listed above as untracked and nothing staged.

- [ ] **Step 0.2: Sync `fixes` to `main` per CLAUDE.md golden rule**

```bash
bun run sync
```

Expected output ends with a line confirming `fixes` fast-forwarded to current `main` (or "already up to date"). This is required before any work on `fixes`.

- [ ] **Step 0.3: Switch to `fixes`**

```bash
git checkout fixes
git status
```

Expected: clean working tree on `fixes`, tracking `origin/fixes`.

- [ ] **Step 0.4: Verify tests pass before touching anything**

```bash
bun test
```

Expected: green. If red, stop — fix the baseline before proceeding so you can attribute later failures to your changes.

- [ ] **Step 0.5: Commit nothing, continue to Task 1**

No commit at this step.

---

## Fix 1: Modulo bias in `generateToken` (CWE-327)

**Background:** `src/lib/tokens.ts:9` does `CHARSET[b % CHARSET.length]` where `CHARSET.length === 31`. Since 256 mod 31 = 8, the first 8 characters (`A`–`H`) appear ~12.5% more often than the rest. The fix is rejection sampling: discard any byte ≥ the largest multiple of 31 that fits in 256 (= 248) and draw more bytes.

### Task 1: Replace modulo with rejection sampling

**Files:**
- Modify: `src/lib/tokens.ts`
- Modify: `src/test/lib-tokens.test.ts`

- [ ] **Step 1.1: Write the failing distribution test**

Add to `src/test/lib-tokens.test.ts`:

```typescript
  it("has uniform distribution across CHARSET (rejection-sampled)", () => {
    const CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    const counts = new Map<string, number>();
    for (const c of CHARSET) counts.set(c, 0);

    // 31 chars × 2000 samples each = 62000 total characters
    const sampleSize = 62000;
    const tokens = Array.from({ length: sampleSize / 10 }, () => generateToken(10));
    for (const tok of tokens) {
      for (const c of tok) counts.set(c, (counts.get(c) ?? 0) + 1);
    }

    const expected = sampleSize / CHARSET.length; // 2000
    // Chi-square-ish tolerance: every bucket must be within ±8% of expected.
    // Biased generator gets the first 8 chars ~12.5% higher → fails this.
    for (const [char, count] of counts) {
      const deviation = Math.abs(count - expected) / expected;
      expect(deviation, `char ${char} count=${count} expected=${expected}`).toBeLessThan(0.08);
    }
  });
```

- [ ] **Step 1.2: Run the new test — expect failure**

```bash
bun test src/test/lib-tokens.test.ts -t "uniform distribution"
```

Expected: FAIL. The biased generator will push at least one of the first 8 chars ~12.5% over expected, exceeding the 8% tolerance.

- [ ] **Step 1.3: Implement rejection sampling**

Replace the body of `src/lib/tokens.ts`:

```typescript
import { createHash, randomBytes } from "crypto";

// No ambiguous characters (0/O, 1/I/L)
const CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateToken(length = 8): string {
  // Rejection sampling: discard bytes ≥ the largest multiple of CHARSET.length
  // that fits in 256, so every character of CHARSET is equally likely.
  const max = 256 - (256 % CHARSET.length); // 248 when CHARSET.length === 31
  const out: string[] = [];
  while (out.length < length) {
    const draw = randomBytes(length - out.length);
    for (const b of draw) {
      if (b < max) out.push(CHARSET[b % CHARSET.length]);
      if (out.length === length) break;
    }
  }
  return out.join("");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token.toUpperCase()).digest("hex");
}
```

- [ ] **Step 1.4: Run the distribution test — expect pass**

```bash
bun test src/test/lib-tokens.test.ts
```

Expected: all 4 existing tests + the new distribution test pass.

- [ ] **Step 1.5: Run the full suite to catch downstream regressions**

```bash
bun test
```

Expected: green. 17 files call `generateToken`/`hashToken`; the signature and output alphabet are unchanged so nothing should break.

- [ ] **Step 1.6: Commit**

```bash
git add src/lib/tokens.ts src/test/lib-tokens.test.ts
git commit -m "fix(security): rejection-sample generateToken to remove modulo bias (CWE-327)"
```

---

## Fix 2: Fail-secure `NEXTAUTH_URL`

**Background:** Two server actions fall back to `"http://localhost:3000"` when `NEXTAUTH_URL` is missing. The fix matches the `NEXTAUTH_SECRET` pattern: throw unless we're in local development.

### Task 2a: Add `requireBaseUrl` helper

**Files:**
- Create: `src/lib/env.ts`
- Create: `src/test/lib-env.test.ts`

- [ ] **Step 2a.1: Write the failing test**

Create `src/test/lib-env.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { requireBaseUrl } from "@/lib/env";

describe("requireBaseUrl", () => {
  const originalUrl = process.env.NEXTAUTH_URL;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    delete process.env.NEXTAUTH_URL;
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    if (originalUrl === undefined) delete process.env.NEXTAUTH_URL;
    else process.env.NEXTAUTH_URL = originalUrl;
    process.env.NODE_ENV = originalEnv;
  });

  it("returns NEXTAUTH_URL when set", () => {
    process.env.NEXTAUTH_URL = "https://portal.example.com";
    expect(requireBaseUrl()).toBe("https://portal.example.com");
  });

  it("returns localhost default in development", () => {
    process.env.NODE_ENV = "development";
    expect(requireBaseUrl()).toBe("http://localhost:3000");
  });

  it("throws in production when NEXTAUTH_URL missing", () => {
    process.env.NODE_ENV = "production";
    expect(() => requireBaseUrl()).toThrow(/NEXTAUTH_URL/);
  });

  it("throws in test when NEXTAUTH_URL missing and not explicitly development", () => {
    process.env.NODE_ENV = "test";
    expect(() => requireBaseUrl()).toThrow(/NEXTAUTH_URL/);
  });

  it("strips a trailing slash", () => {
    process.env.NEXTAUTH_URL = "https://portal.example.com/";
    expect(requireBaseUrl()).toBe("https://portal.example.com");
  });
});
```

- [ ] **Step 2a.2: Run test — expect failure**

```bash
bun test src/test/lib-env.test.ts
```

Expected: FAIL with "Cannot find module '@/lib/env'".

- [ ] **Step 2a.3: Implement the helper**

Create `src/lib/env.ts`:

```typescript
/**
 * Fail-secure lookup for NEXTAUTH_URL.
 * Mirrors the NEXTAUTH_SECRET pattern in src/lib/session.ts — only local
 * development may fall back to a default; every other environment must
 * set the variable explicitly.
 */
export function requireBaseUrl(): string {
  const raw = process.env.NEXTAUTH_URL;
  if (raw) return raw.replace(/\/+$/, "");
  if (process.env.NODE_ENV === "development") return "http://localhost:3000";
  throw new Error("NEXTAUTH_URL is not set");
}
```

- [ ] **Step 2a.4: Run test — expect pass**

```bash
bun test src/test/lib-env.test.ts
```

Expected: all 5 tests pass.

### Task 2b: Wire `requireBaseUrl` into the two call sites

**Files:**
- Modify: `src/app/admin/noc/invite/actions.ts:80`
- Modify: `src/app/admin/ioc/sudo/actions.ts:69`

- [ ] **Step 2b.1: Update NOC invite action**

In `src/app/admin/noc/invite/actions.ts`:

Replace line 80:
```typescript
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
```

With:
```typescript
  const baseUrl = requireBaseUrl();
```

And add to the imports near the top of the file:
```typescript
import { requireBaseUrl } from "@/lib/env";
```

- [ ] **Step 2b.2: Update IOC sudo action**

In `src/app/admin/ioc/sudo/actions.ts`:

Replace line 69:
```typescript
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
```

With:
```typescript
  const baseUrl = requireBaseUrl();
```

And add to imports:
```typescript
import { requireBaseUrl } from "@/lib/env";
```

- [ ] **Step 2b.3: Run related existing tests**

```bash
bun test src/test/uc-noc-invite src/test/uc-ioc-sudo src/test/uc-noc-eoi-window
```

Expected: green. If the test env doesn't set `NEXTAUTH_URL`, the tests will now throw — if so, fix by setting `NEXTAUTH_URL` in the affected test files (search for existing `process.env.NEXTAUTH_SECRET =` lines and add `NEXTAUTH_URL` next to them in the same style).

- [ ] **Step 2b.4: Run the full suite**

```bash
bun test
```

Expected: green.

- [ ] **Step 2b.5: Commit**

```bash
git add src/lib/env.ts src/test/lib-env.test.ts src/app/admin/noc/invite/actions.ts src/app/admin/ioc/sudo/actions.ts
# plus any test files touched in 2b.3
git commit -m "fix(security): fail-secure NEXTAUTH_URL via requireBaseUrl helper"
```

---

## Fix 3: Default-secure cookies (no reliance on `NODE_ENV === "production"`)

**Background:** Three cookie-set sites key the `Secure` flag on `NODE_ENV === "production"`. If Railway staging doesn't set `NODE_ENV=production`, session cookies ride over non-TLS. The fix: default `secure: true`, with an explicit `ALLOW_INSECURE_COOKIES=true` escape hatch for local `bun dev`.

### Task 3a: Add `cookieSecureFlag` helper

**Files:**
- Modify: `src/lib/env.ts`
- Modify: `src/test/lib-env.test.ts`

- [ ] **Step 3a.1: Add the failing test**

Append to `src/test/lib-env.test.ts`:

```typescript
import { cookieSecureFlag } from "@/lib/env";

describe("cookieSecureFlag", () => {
  const original = process.env.ALLOW_INSECURE_COOKIES;

  afterEach(() => {
    if (original === undefined) delete process.env.ALLOW_INSECURE_COOKIES;
    else process.env.ALLOW_INSECURE_COOKIES = original;
  });

  it("defaults to true", () => {
    delete process.env.ALLOW_INSECURE_COOKIES;
    expect(cookieSecureFlag()).toBe(true);
  });

  it("is false only when ALLOW_INSECURE_COOKIES is exactly 'true'", () => {
    process.env.ALLOW_INSECURE_COOKIES = "true";
    expect(cookieSecureFlag()).toBe(false);
  });

  it("is true for any other value of ALLOW_INSECURE_COOKIES", () => {
    for (const v of ["", "false", "0", "yes", "TRUE", " true ", "1"]) {
      process.env.ALLOW_INSECURE_COOKIES = v;
      expect(cookieSecureFlag(), `value=${JSON.stringify(v)}`).toBe(true);
    }
  });
});
```

- [ ] **Step 3a.2: Run — expect failure**

```bash
bun test src/test/lib-env.test.ts
```

Expected: FAIL with "cookieSecureFlag is not exported".

- [ ] **Step 3a.3: Implement**

Append to `src/lib/env.ts`:

```typescript
/**
 * Returns the value to use for the cookie `Secure` attribute.
 * Defaults to true so staging and prod are always Secure, regardless of NODE_ENV.
 * Set ALLOW_INSECURE_COOKIES=true in a local .env.local to develop over http://.
 */
export function cookieSecureFlag(): boolean {
  return process.env.ALLOW_INSECURE_COOKIES !== "true";
}
```

- [ ] **Step 3a.4: Run — expect pass**

```bash
bun test src/test/lib-env.test.ts
```

Expected: all tests green.

### Task 3b: Replace `secure: NODE_ENV === "production"` at the three sites

**Files:**
- Modify: `src/lib/session.ts:88,105`
- Modify: `src/app/admin/sudo/activate/route.ts:77`

- [ ] **Step 3b.1: Update `setSession`**

In `src/lib/session.ts`:

Add to imports:
```typescript
import { cookieSecureFlag } from "@/lib/env";
```

At line 88, replace:
```typescript
    secure: process.env.NODE_ENV === "production",
```

With:
```typescript
    secure: cookieSecureFlag(),
```

- [ ] **Step 3b.2: Update `setSudoSession`**

In the same file at line 105, make the identical replacement:
```typescript
    secure: cookieSecureFlag(),
```

- [ ] **Step 3b.3: Update the sudo activate route**

In `src/app/admin/sudo/activate/route.ts`:

Add to imports:
```typescript
import { cookieSecureFlag } from "@/lib/env";
```

At line 77, replace:
```typescript
    secure: process.env.NODE_ENV === "production",
```

With:
```typescript
    secure: cookieSecureFlag(),
```

- [ ] **Step 3b.4: Run the full suite**

```bash
bun test
```

Expected: green. Some existing tests set cookies and run against a Node test env — they should continue to pass because tests run over http only in-process; no browser is enforcing Secure.

If any test fails because it inspected the previous `secure: false` value, update that test to assert `secure === true` (the new default) instead.

- [ ] **Step 3b.5: Update `.env.example` if one tracks cookie behavior**

```bash
grep -n ALLOW_INSECURE_COOKIES .env.example || echo "ALLOW_INSECURE_COOKIES=true" >> .env.example
```

Also append a comment above the new line:
```
# Set to 'true' ONLY for local http:// development. Every other env must leave this unset.
```

- [ ] **Step 3b.6: Commit**

```bash
git add src/lib/env.ts src/test/lib-env.test.ts src/lib/session.ts src/app/admin/sudo/activate/route.ts .env.example
git commit -m "fix(security): default cookie Secure to true, gate with ALLOW_INSECURE_COOKIES"
```

---

## Fix 4: Remove `'unsafe-inline'` from CSP style-src (full refactor)

**Background:** `src/middleware.ts:17` emits `style-src 'self' 'unsafe-inline'`. CSP 3 style-src nonces do NOT apply to inline `style="..."` attributes, so the only way to drop `'unsafe-inline'` is to eliminate every inline `style={...}` in the codebase.

**Audit (complete inventory):**
- **10 dynamic width styles** — progress / allocation bars where `width: ${pct}%` is computed at render time.
- **1 static gradient** — `src/app/admin/ioc/enr/page.tsx:92`.
- **1 static cursor** — `src/app/admin/noc/enr/EnrPriorityList.tsx:120`.
- **0** `<style>` tags and **0** `dangerouslySetInnerHTML` usages (verified).

**Approach:** Pre-generate 101 width utility classes (`.progress-w-0` … `.progress-w-100`) in `src/app/globals.css`. Introduce a `progressWidthClass(pct)` helper that clamps `[0, 100]` and rounds, returning the matching class. Replace every dynamic inline `style={{ width }}` with this helper. Replace the two static styles with dedicated classes. Remove `'unsafe-inline'` from style-src.

**Why 1% increments and not 5%:** the "over quota" visual on PBN allocation bars switches color at 100% — sub-5% precision matters for usability. 101 CSS rules is ~3 KB uncompressed; trivial.

**Script-src unchanged:** `'unsafe-inline'` stays on script-src per the existing middleware comment (legacy-browser fallback while nonce propagation completes). Only style-src changes in this fix.

### Task 4a: Add progress-width CSS classes

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 4a.1: Append the width-class block to `globals.css`**

Append to the bottom of `src/app/globals.css`:

```css
/* Progress-bar widths — pre-generated to avoid inline style attributes,
   which would require CSP 'unsafe-inline' on style-src. Use the
   progressWidthClass() helper in @/lib/progress to pick the right class. */
.progress-w-0 { width: 0%; }
.progress-w-1 { width: 1%; }
.progress-w-2 { width: 2%; }
.progress-w-3 { width: 3%; }
.progress-w-4 { width: 4%; }
.progress-w-5 { width: 5%; }
.progress-w-6 { width: 6%; }
.progress-w-7 { width: 7%; }
.progress-w-8 { width: 8%; }
.progress-w-9 { width: 9%; }
.progress-w-10 { width: 10%; }
.progress-w-11 { width: 11%; }
.progress-w-12 { width: 12%; }
.progress-w-13 { width: 13%; }
.progress-w-14 { width: 14%; }
.progress-w-15 { width: 15%; }
.progress-w-16 { width: 16%; }
.progress-w-17 { width: 17%; }
.progress-w-18 { width: 18%; }
.progress-w-19 { width: 19%; }
.progress-w-20 { width: 20%; }
.progress-w-21 { width: 21%; }
.progress-w-22 { width: 22%; }
.progress-w-23 { width: 23%; }
.progress-w-24 { width: 24%; }
.progress-w-25 { width: 25%; }
.progress-w-26 { width: 26%; }
.progress-w-27 { width: 27%; }
.progress-w-28 { width: 28%; }
.progress-w-29 { width: 29%; }
.progress-w-30 { width: 30%; }
.progress-w-31 { width: 31%; }
.progress-w-32 { width: 32%; }
.progress-w-33 { width: 33%; }
.progress-w-34 { width: 34%; }
.progress-w-35 { width: 35%; }
.progress-w-36 { width: 36%; }
.progress-w-37 { width: 37%; }
.progress-w-38 { width: 38%; }
.progress-w-39 { width: 39%; }
.progress-w-40 { width: 40%; }
.progress-w-41 { width: 41%; }
.progress-w-42 { width: 42%; }
.progress-w-43 { width: 43%; }
.progress-w-44 { width: 44%; }
.progress-w-45 { width: 45%; }
.progress-w-46 { width: 46%; }
.progress-w-47 { width: 47%; }
.progress-w-48 { width: 48%; }
.progress-w-49 { width: 49%; }
.progress-w-50 { width: 50%; }
.progress-w-51 { width: 51%; }
.progress-w-52 { width: 52%; }
.progress-w-53 { width: 53%; }
.progress-w-54 { width: 54%; }
.progress-w-55 { width: 55%; }
.progress-w-56 { width: 56%; }
.progress-w-57 { width: 57%; }
.progress-w-58 { width: 58%; }
.progress-w-59 { width: 59%; }
.progress-w-60 { width: 60%; }
.progress-w-61 { width: 61%; }
.progress-w-62 { width: 62%; }
.progress-w-63 { width: 63%; }
.progress-w-64 { width: 64%; }
.progress-w-65 { width: 65%; }
.progress-w-66 { width: 66%; }
.progress-w-67 { width: 67%; }
.progress-w-68 { width: 68%; }
.progress-w-69 { width: 69%; }
.progress-w-70 { width: 70%; }
.progress-w-71 { width: 71%; }
.progress-w-72 { width: 72%; }
.progress-w-73 { width: 73%; }
.progress-w-74 { width: 74%; }
.progress-w-75 { width: 75%; }
.progress-w-76 { width: 76%; }
.progress-w-77 { width: 77%; }
.progress-w-78 { width: 78%; }
.progress-w-79 { width: 79%; }
.progress-w-80 { width: 80%; }
.progress-w-81 { width: 81%; }
.progress-w-82 { width: 82%; }
.progress-w-83 { width: 83%; }
.progress-w-84 { width: 84%; }
.progress-w-85 { width: 85%; }
.progress-w-86 { width: 86%; }
.progress-w-87 { width: 87%; }
.progress-w-88 { width: 88%; }
.progress-w-89 { width: 89%; }
.progress-w-90 { width: 90%; }
.progress-w-91 { width: 91%; }
.progress-w-92 { width: 92%; }
.progress-w-93 { width: 93%; }
.progress-w-94 { width: 94%; }
.progress-w-95 { width: 95%; }
.progress-w-96 { width: 96%; }
.progress-w-97 { width: 97%; }
.progress-w-98 { width: 98%; }
.progress-w-99 { width: 99%; }
.progress-w-100 { width: 100%; }

/* Hero gradient used by the IOC ENR summary card. */
.bg-brand-enr-hero {
  background: linear-gradient(135deg, #1e3a8a 0%, var(--color-brand-blue) 100%);
}
```

### Task 4b: Add `progressWidthClass` helper

**Files:**
- Create: `src/lib/progress.ts`
- Create: `src/test/lib-progress.test.ts`

- [ ] **Step 4b.1: Write the failing test**

Create `src/test/lib-progress.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { progressWidthClass } from "@/lib/progress";

describe("progressWidthClass", () => {
  it("returns the right class for integer percentages", () => {
    expect(progressWidthClass(0)).toBe("progress-w-0");
    expect(progressWidthClass(50)).toBe("progress-w-50");
    expect(progressWidthClass(100)).toBe("progress-w-100");
  });

  it("rounds fractional percentages", () => {
    expect(progressWidthClass(37.4)).toBe("progress-w-37");
    expect(progressWidthClass(37.5)).toBe("progress-w-38");
    expect(progressWidthClass(99.9)).toBe("progress-w-100");
  });

  it("clamps below zero to zero", () => {
    expect(progressWidthClass(-10)).toBe("progress-w-0");
    expect(progressWidthClass(-0.1)).toBe("progress-w-0");
  });

  it("clamps above 100 to 100", () => {
    expect(progressWidthClass(120)).toBe("progress-w-100");
    expect(progressWidthClass(250)).toBe("progress-w-100");
  });

  it("treats NaN and non-finite as zero", () => {
    expect(progressWidthClass(NaN)).toBe("progress-w-0");
    expect(progressWidthClass(Infinity)).toBe("progress-w-100");
    expect(progressWidthClass(-Infinity)).toBe("progress-w-0");
  });
});
```

- [ ] **Step 4b.2: Run — expect failure**

```bash
bun test src/test/lib-progress.test.ts
```

Expected: FAIL with "Cannot find module '@/lib/progress'".

- [ ] **Step 4b.3: Implement**

Create `src/lib/progress.ts`:

```typescript
/**
 * Returns a CSS class name that sets `width: N%` in whole-percent steps.
 * Clamps input to [0, 100] so over-quota values still render at 100% fill.
 * Paired with the .progress-w-N rules in src/app/globals.css so progress
 * bars can be driven without inline style attributes (CSP style-src hardening).
 */
export function progressWidthClass(pct: number): string {
  if (Number.isNaN(pct)) return "progress-w-0";
  const clamped = Math.max(0, Math.min(100, pct));
  return `progress-w-${Math.round(clamped)}`;
}
```

- [ ] **Step 4b.4: Run — expect pass**

```bash
bun test src/test/lib-progress.test.ts
```

Expected: all 5 tests pass.

### Task 4c: Replace the two static inline styles

**Files:**
- Modify: `src/app/admin/ioc/enr/page.tsx:92` (gradient)
- Modify: `src/app/admin/noc/enr/EnrPriorityList.tsx:120` (cursor)

- [ ] **Step 4c.1: Replace the gradient**

In `src/app/admin/ioc/enr/page.tsx` around line 92, change:
```tsx
      <div className="rounded-xl p-5 text-white" style={{ background: "linear-gradient(135deg, #1e3a8a 0%, var(--color-brand-blue) 100%)" }}>
```

To:
```tsx
      <div className="bg-brand-enr-hero rounded-xl p-5 text-white">
```

- [ ] **Step 4c.2: Replace the cursor**

In `src/app/admin/noc/enr/EnrPriorityList.tsx` around line 120, find the element that has `style={!isSubmitted ? { cursor: "grab" } : undefined}`. Inspect the surrounding `className` and merge `cursor-grab` into it conditionally.

If the element currently looks like:
```tsx
              <tr
                className="..."
                style={!isSubmitted ? { cursor: "grab" } : undefined}
                ...
```

Change to:
```tsx
              <tr
                className={`... ${!isSubmitted ? "cursor-grab" : ""}`}
                ...
```

Preserve every existing class. Delete the `style={}` attribute entirely.

### Task 4d: Replace the 10 dynamic width inline styles

**Files (all exact):**
- `src/app/admin/ioc/direct/page.tsx:163`
- `src/app/admin/ocog/pbn/[nocCode]/page.tsx:128`
- `src/app/admin/ioc/master/MasterAllocationClient.tsx:146`
- `src/app/admin/ioc/enr/page.tsx:113`
- `src/app/admin/noc/[id]/page.tsx:44`
- `src/app/admin/noc/[id]/page.tsx:45`
- `src/app/admin/noc/pbn/PbnAllocationTable.tsx:334`
- `src/app/admin/noc/pbn/PbnAllocationTable.tsx:355`
- `src/app/admin/noc/queue/ApplicationDrawer.tsx:95`
- `src/app/admin/noc/queue/ApplicationDrawer.tsx:99`

For each file, add this import near the other `@/lib/*` imports:

```typescript
import { progressWidthClass } from "@/lib/progress";
```

Then apply the per-file edits below. In every case, **delete the `style={{ width: ... }}` attribute** and **append the width class to the element's `className`**.

- [ ] **Step 4d.1: `src/app/admin/ioc/direct/page.tsx:163`**

Change:
```tsx
                    <div className={`h-full rounded-full ${over ? "bg-red-500" : "bg-brand-blue"}`} style={{ width: `${pct}%` }} />
```

To:
```tsx
                    <div className={`h-full rounded-full ${over ? "bg-red-500" : "bg-brand-blue"} ${progressWidthClass(pct)}`} />
```

- [ ] **Step 4d.2: `src/app/admin/ocog/pbn/[nocCode]/page.tsx:128`**

Find the element with `style={{ width: `${Math.min(100, Math.round((used / total) * 100))}%` }}`. Extract the percentage into a local variable above the JSX if it isn't already, then apply the helper:

```tsx
                    className={`... ${progressWidthClass((used / total) * 100)}`}
```

Delete the `style={}` attribute. The helper already clamps/rounds so the inline `Math.min(100, Math.round(...))` is redundant — remove it.

- [ ] **Step 4d.3: `src/app/admin/ioc/master/MasterAllocationClient.tsx:146`**

Change:
```tsx
        <div className={`h-2.5 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
```

To:
```tsx
        <div className={`h-2.5 rounded-full transition-all ${barColor} ${progressWidthClass(pct)}`} />
```

- [ ] **Step 4d.4: `src/app/admin/ioc/enr/page.tsx:113`**

Find the element with `style={{ width: `${poolPct}%` }}`. Merge `${progressWidthClass(poolPct)}` into its `className` and delete the `style={}` attribute.

- [ ] **Step 4d.5: `src/app/admin/noc/[id]/page.tsx:44,45`**

Change:
```tsx
        <div className="h-full bg-blue-400 transition-all" style={{ width: `${pctAllocated}%` }} />
        <div className={`h-full transition-all ${overQuota ? "bg-red-400" : "bg-amber-300"}`} style={{ width: `${pctRequest}%` }} />
```

To:
```tsx
        <div className={`h-full bg-blue-400 transition-all ${progressWidthClass(pctAllocated)}`} />
        <div className={`h-full transition-all ${overQuota ? "bg-red-400" : "bg-amber-300"} ${progressWidthClass(pctRequest)}`} />
```

- [ ] **Step 4d.6: `src/app/admin/noc/pbn/PbnAllocationTable.tsx:334`**

Find the element with `style={{ width: `${pct}%` }}` at that line. Merge `${progressWidthClass(pct)}` into its `className` and delete the `style={}`.

- [ ] **Step 4d.7: `src/app/admin/noc/pbn/PbnAllocationTable.tsx:355`**

Change:
```tsx
                <div className={`h-full rounded-full transition-all ${over ? "bg-red-500" : "bg-teal-500"}`} style={{ width: `${pct}%` }} />
```

To:
```tsx
                <div className={`h-full rounded-full transition-all ${over ? "bg-red-500" : "bg-teal-500"} ${progressWidthClass(pct)}`} />
```

- [ ] **Step 4d.8: `src/app/admin/noc/queue/ApplicationDrawer.tsx:95,99`**

Find the two elements with `style={{ width: `${pctAllocated}%` }}` and `style={{ width: `${pctRequest}%` }}`. Merge the matching `progressWidthClass(...)` into each `className` and delete both `style={}` attributes.

- [ ] **Step 4d.9: Verify no remaining `style={` usages**

```bash
rg -n 'style=\{' src/
```

Expected: **no output**. If any line remains, revisit and convert it.

- [ ] **Step 4d.10: Type-check and run the suite**

```bash
bunx tsc --noEmit
bun test
```

Expected: both green. The helper is pure string manipulation and none of the replaced elements change behavior.

### Task 4e: Drop `'unsafe-inline'` from enforced style-src

**Files:**
- Modify: `src/middleware.ts`

- [ ] **Step 4e.1: Update the CSP**

In `src/middleware.ts` around line 17, change:
```typescript
    "style-src 'self' 'unsafe-inline'",
```

To:
```typescript
    "style-src 'self'",
```

Also delete the paragraph of comments above the `cspValue` declaration that explains the `'unsafe-inline'` style-src compromise — it's no longer accurate. Leave the comment about script-src nonces intact; that's still correct.

- [ ] **Step 4e.2: Visual + CSP verification in dev**

```bash
bun dev
```

Open the following pages with DevTools → Console open and confirm **no CSP violations** are logged and the UI renders identically to before:

- `/admin/noc/pbn` — progress bars in the allocation table
- `/admin/noc/queue` → open an application drawer — allocation/request bars
- `/admin/noc/<id>` — any NOC detail page with the two small bars
- `/admin/ocog/pbn/<nocCode>` — allocation bar
- `/admin/ioc/master` — master allocation client bars
- `/admin/ioc/direct` — IOC-direct allocation bar
- `/admin/ioc/enr` — gradient hero + pool pct bar
- `/admin/noc/enr` — priority list, rows should still be grabbable

Any CSP violation in the console means a `style={}` attribute was missed. Fix before committing.

- [ ] **Step 4e.3: Run the full suite one more time**

```bash
bun test
```

Expected: green.

- [ ] **Step 4e.4: Commit the entire Fix 4 as one atomic change**

```bash
git add \
  src/app/globals.css \
  src/lib/progress.ts \
  src/test/lib-progress.test.ts \
  src/middleware.ts \
  src/app/admin/ioc/direct/page.tsx \
  src/app/admin/ocog/pbn/\[nocCode\]/page.tsx \
  src/app/admin/ioc/master/MasterAllocationClient.tsx \
  src/app/admin/ioc/enr/page.tsx \
  src/app/admin/noc/\[id\]/page.tsx \
  src/app/admin/noc/pbn/PbnAllocationTable.tsx \
  src/app/admin/noc/queue/ApplicationDrawer.tsx \
  src/app/admin/noc/enr/EnrPriorityList.tsx

git commit -m "fix(security): remove 'unsafe-inline' from CSP style-src

Refactors all 12 inline style={} usages to utility classes so CSP can
forbid inline styles. Adds progressWidthClass() helper + 101 width rules
for dynamic progress bars. Static gradient and cursor move to classes."
```

---

## Post-implementation

### Task 5: Push to staging and manually verify

**Files:** none — git and Railway only.

- [ ] **Step 5.1: Push `fixes` to origin**

```bash
git push origin fixes
```

Expected: Railway staging auto-deploys. Watch the build in Railway dashboard → staging service until it reports ready.

- [ ] **Step 5.2: Manual verification on staging**

Perform each check on the staging URL (not prod, not localhost):

**Fix 1 — token distribution:** Open a NOC-admin session, create 20 invites in `/admin/noc/invite`, view the invite URLs, and confirm first-character frequencies look roughly even. (Sample size is small, but no one character should dominate.)

**Fix 2 — NEXTAUTH_URL fail-secure:** Temporarily unset `NEXTAUTH_URL` in Railway staging variables → redeploy → confirm the app crashes on boot with "NEXTAUTH_URL is not set". Restore the variable and redeploy.

**Fix 3 — cookie Secure flag:** Log in to `/admin/login` on staging. Open DevTools → Application → Cookies → `prp_session`. Confirm `Secure ✓`, `HttpOnly ✓`, `SameSite Lax`. If staging is served over plain http (unlikely on Railway), the cookie won't be sent at all — that's the correct behavior.

**Fix 4 — CSP style-src hardened:** Open DevTools → Network → click any staging page → view response headers on the document request. Confirm `Content-Security-Policy` contains `style-src 'self'` with NO `'unsafe-inline'`. Then visit `/admin/noc/pbn`, `/admin/noc/queue` (open an application drawer), `/admin/ioc/master`, `/admin/ioc/enr`, and `/admin/noc/enr` with DevTools → Console open. Confirm **zero** CSP violations are logged and progress bars / gradient / grab cursors all render correctly.

- [ ] **Step 5.3: If staging verification fails, iterate on `fixes` and repeat**

Any failure → commit the fix on `fixes`, push, re-verify. Do NOT ff-merge to main until every check passes.

- [ ] **Step 5.4: Fast-forward merge to main**

Per CLAUDE.md release flow:

```bash
git checkout main
git pull origin main
git merge --ff-only origin/fixes
git push origin main
```

Expected: Railway prod auto-deploys. Watch the prod build to ready.

- [ ] **Step 5.5: Smoke-test prod**

Repeat the four verifications from Step 5.2 on the prod URL. Nothing more — prod is not the place to experiment with unsetting env vars.

- [ ] **Step 5.6: Restore any stashed pre-flight changes**

If Step 0.1 used `git stash`:

```bash
git stash pop
```

Resolve any trivial conflicts. These doc changes are unrelated to the security work.

---

## Rollback

Each fix is in its own commit. To revert one without the others:

```bash
# Identify the SHA
git log --oneline fixes | head -5

# Revert on fixes, push, Railway re-deploys staging
git checkout fixes
git revert <sha>
git push origin fixes

# Once verified on staging, ff to main as above
```

If all four need to roll back, revert the four commits in one shot and push.

---

## Summary of what changes

| File | Fix |
|------|-----|
| `src/lib/tokens.ts` | Rejection sampling |
| `src/test/lib-tokens.test.ts` | +distribution test |
| `src/lib/env.ts` *(new)* | `requireBaseUrl`, `cookieSecureFlag` |
| `src/test/lib-env.test.ts` *(new)* | helpers tests |
| `src/lib/session.ts` | `secure: cookieSecureFlag()` ×2 |
| `src/app/admin/sudo/activate/route.ts` | `secure: cookieSecureFlag()` |
| `src/app/admin/noc/invite/actions.ts` | `baseUrl = requireBaseUrl()` |
| `src/app/admin/ioc/sudo/actions.ts` | `baseUrl = requireBaseUrl()` |
| `src/lib/progress.ts` *(new)* | `progressWidthClass` helper |
| `src/test/lib-progress.test.ts` *(new)* | helper tests |
| `src/app/globals.css` | +101 `.progress-w-N` rules, +`.bg-brand-enr-hero` |
| `src/middleware.ts` | Drop `'unsafe-inline'` from style-src |
| `src/app/admin/ioc/direct/page.tsx` | progress bar → class |
| `src/app/admin/ocog/pbn/[nocCode]/page.tsx` | progress bar → class |
| `src/app/admin/ioc/master/MasterAllocationClient.tsx` | progress bar → class |
| `src/app/admin/ioc/enr/page.tsx` | gradient + pool bar → classes |
| `src/app/admin/noc/[id]/page.tsx` | two bars → classes |
| `src/app/admin/noc/pbn/PbnAllocationTable.tsx` | two bars → classes |
| `src/app/admin/noc/queue/ApplicationDrawer.tsx` | two bars → classes |
| `src/app/admin/noc/enr/EnrPriorityList.tsx` | cursor → class |
| `.env.example` | +`ALLOW_INSECURE_COOKIES` doc |

Four commits on `fixes`, then a ff-merge to `main`. No schema migrations. No new dependencies. No behavior change for end users.
