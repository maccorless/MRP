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
    // The NOC heading contains the NOC code
    await expect(page.getByRole('heading', { name: /NOC/i }).first()).toBeVisible();
  });

  test('queue table at /admin/noc/queue has at least one row', async ({ page }) => {
    await page.goto('/admin/noc/queue');
    await expect(page).toHaveURL(/\/admin\/noc\/queue/);

    // Table body rows — seed data contains at least 3 USA applications
    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount({ min: 1 } as never);
    // More explicit: just confirm at least one tr is visible
    await expect(rows.first()).toBeVisible();
  });

  test('clicking a row Review link navigates to application detail', async ({ page }) => {
    await page.goto('/admin/noc/queue');

    // Click the first "Review →" link in the table
    const reviewLink = page.locator('tbody tr').first().getByRole('link', { name: /Review/i });
    await reviewLink.click();

    // Should navigate to /admin/noc/{uuid}
    await expect(page).toHaveURL(/\/admin\/noc\/[a-f0-9-]+/);
  });

  test('unauthenticated access redirects to /admin/login', async ({ browser }) => {
    // Create a fresh context with no stored credentials
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/admin/noc/queue');
    await expect(page).toHaveURL(/\/admin\/login/);
    await context.close();
  });
});
