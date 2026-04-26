/**
 * Smoke tests — public EoI entry page (/apply)
 * No authentication required.
 */

import { test, expect } from '@playwright/test';

test.describe('Public EoI — /apply', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/apply');
  });

  test('renders page title and Send Access Code button', async ({ page }) => {
    // Title was renamed to "Press Accreditation" in an earlier copy sweep —
    // the regex tolerates either "Press" or "Media" so the test survives a
    // future rename without a test-only patch.
    await expect(
      page.getByRole('heading', { name: /Apply for (Press|Media) Accreditation/i }),
    ).toBeVisible();

    await expect(
      page.getByRole('button', { name: /Send Access Code/i }),
    ).toBeVisible();
  });

  test('invalid email format shows role="alert" error', async ({ page }) => {
    // The form uses type="email" so we bypass HTML5 validation and submit
    // by navigating directly with an invalid email query (server-side error).
    await page.goto('/apply?error=invalid_email');

    const alert = page.getByRole('alert').filter({ hasText: /valid email/i });
    await expect(alert).toBeVisible();
  });

  test('skip-to-main-content link is present in the DOM', async ({ page }) => {
    // The link is sr-only (visually hidden) until focused; confirm it exists
    // and points to #main-content.
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toHaveCount(1);
    await expect(skipLink).toContainText(/skip to main content/i);
  });

  test('skip-to-main-content link becomes visible on focus', async ({ page }) => {
    const skipLink = page.locator('a[href="#main-content"]');
    await skipLink.focus();
    // After focus the sr-only class is replaced by visible styles; confirm
    // the element is now visible in the accessibility tree.
    await expect(skipLink).toBeVisible();
  });

  test('email input has an associated label', async ({ page }) => {
    const emailInput = page.locator('input#email');
    await expect(emailInput).toBeVisible();
    // Check via aria: label should reference the input
    const label = page.locator('label[for="email"]');
    await expect(label).toHaveCount(1);
    await expect(label).toContainText(/work email/i);
  });
});

// ─── §6 + §10 from 2026-04-26 test plan ──────────────────────────────────────

test.describe('Public — /apply/how-it-works content', () => {
  test('renders the OIAC heading and the LA28+US-authority caveat', async ({ page }) => {
    await page.goto('/apply/how-it-works');

    await expect(
      page.getByRole('heading', {
        name: /Olympic Identity and Accreditation Card.*OIAC/i,
      }),
    ).toBeVisible();

    await expect(
      page.getByText(/Subject to LA28 and the relevant US authorities/i),
    ).toBeVisible();
  });

  test('FR translation of how-it-works still renders the OIAC section (EN fallback OK)', async ({ page }) => {
    await page.goto('/apply/how-it-works?lang=fr');
    // Core heading must still be present even if not yet localised.
    await expect(
      page.getByRole('heading', {
        name: /Olympic Identity and Accreditation Card.*OIAC/i,
      }),
    ).toBeVisible();
  });

  test('does not still display the legacy "August 24, 2026" date string', async ({ page }) => {
    await page.goto('/apply/how-it-works');
    const html = await page.content();
    expect(html).not.toMatch(/August\s+24,\s*2026/i);
    expect(html).not.toMatch(/24\s+August\s+2026/i);
  });
});

// ─── §5 from 2026-04-26 test plan: ENR >3 soft warning lives in the wizard ────

import * as fs from 'fs';
import * as path from 'path';

test.describe('Public — ENR >3 soft warning (source-level)', () => {
  // The warning is rendered by AccreditationStep inside the multi-tab wizard
  // (which requires a magic-link token to enter). To avoid wrapping a full
  // token-bootstrapped form in this smoke suite, this assertion is a
  // source-level invariant: the warning string MUST exist in the step.
  // Server-side acceptance of ENR>3 is covered by the vitest integration test.
  test('AccreditationStep renders the IOC-only-approves-more-than soft-warn copy', () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, '../../src/app/applyb/form/steps/AccreditationStep.tsx'),
      'utf8',
    );
    expect(src).toMatch(/IOC only approves more than/i);
    // And the soft-warn predicate must reference the soft cap, not just max.
    expect(src).toMatch(/cat\.softMax/);
  });
});
