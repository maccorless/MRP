/**
 * Smoke tests — NOC Admin dashboard
 * Uses storageState: 'e2e/.auth/noc.json' (noc.admin@usopc.org, USA).
 * Seed data has pending applications for USA so the queue will be non-empty.
 */

import { test, expect } from '@playwright/test';

test.describe('NOC Admin', () => {
  test('login redirects to /admin/noc', async ({ page }) => {
    // storageState is already applied by the project config; visiting the
    // dashboard directly should succeed without a login redirect.
    await page.goto('/admin/noc');
    await expect(page).toHaveURL(/\/admin\/noc/);
    await expect(page.getByRole('heading', { name: /Welcome/i })).toBeVisible();
  });

  test('queue table at /admin/noc/queue has at least one row', async ({ page }) => {
    await page.goto('/admin/noc/queue');
    await expect(page).toHaveURL(/\/admin\/noc\/queue/);

    // Table body rows — seed data contains at least 3 USA applications
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible();
  });

  test('clicking a row Review button opens the application drawer', async ({ page }) => {
    await page.goto('/admin/noc/queue');

    // Click the first "Review →" button in the table
    const reviewBtn = page.locator('tbody tr').first().getByRole('button', { name: /Review/i });
    await reviewBtn.click();

    // A drawer dialog should appear (no page navigation)
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('unauthenticated access redirects to /admin/login', async ({ browser }) => {
    // Create a fresh context with no stored credentials
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    await page.goto('/admin/noc/queue');
    await expect(page).toHaveURL(/\/admin\/login/);
    await context.close();
  });

  // ─── §10 from 2026-04-26 test plan: Direct-Entry category access scopes ────

  test('Direct Entry form shows access scope inline for each category', async ({ page }) => {
    await page.goto('/admin/noc/direct-entry');

    // Per Emma 2026-04-24 #71: NOC reviewers must see what each category
    // grants without leaving the form. Two anchor strings cover both ends.
    await expect(page.getByText(/Access:\s*ALL competition venues/i).first()).toBeVisible();
    await expect(page.getByText(/Access:\s*MPC only/i).first()).toBeVisible();
  });

  // ─── §8 from 2026-04-26 test plan: cancel-PbN UI surface ───────────────────

  test('PbN page renders without crashing (cancel UI lives per-row)', async ({ page }) => {
    // The Cancel PbN entry "Danger zone" form is rendered conditionally on
    // each editable allocation row. Verifying the section exists requires
    // seeded allocations; this smoke test just asserts the page loads under
    // NOC auth so a routing/regression failure surfaces fast. The state
    // machine itself is covered by uc-noc-pbn-cancel.test.ts.
    await page.goto('/admin/noc/pbn');
    await expect(page).toHaveURL(/\/admin\/noc\/pbn/);
  });
});
