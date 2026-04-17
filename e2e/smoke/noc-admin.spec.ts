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
});
