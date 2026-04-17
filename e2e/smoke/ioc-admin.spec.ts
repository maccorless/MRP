/**
 * Smoke tests — IOC Admin dashboard
 * Uses storageState: 'e2e/.auth/ioc.json' (ioc.admin@olympics.org).
 */

import { test, expect } from '@playwright/test';

test.describe('IOC Admin', () => {
  test('login redirects to /admin/ioc', async ({ page }) => {
    await page.goto('/admin/ioc');
    await expect(page).toHaveURL(/\/admin\/ioc/);
    await expect(page.getByRole('heading', { name: /IOC Overview/i })).toBeVisible();
  });

  test('stat cards render on dashboard', async ({ page }) => {
    await page.goto('/admin/ioc');

    // The dashboard renders 5 status cards: Pending, Resubmitted, Candidate,
    // Returned, Rejected. Verify at least the Pending and Candidate cards appear.
    await expect(page.getByText('Pending').first()).toBeVisible();
    await expect(page.getByText('Candidate').first()).toBeVisible();
  });

  test('NOC breakdown table has header row', async ({ page }) => {
    await page.goto('/admin/ioc');
    // The "By NOC" section contains a table with a NOC column header
    await expect(page.getByRole('columnheader', { name: /NOC/i }).first()).toBeVisible();
  });

  test('audit trail at /admin/ioc/audit shows at least one row', async ({ page }) => {
    await page.goto('/admin/ioc/audit');
    await expect(page).toHaveURL(/\/admin\/ioc\/audit/);

    // Seed data has ~20 audit log entries; at least one should render
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible();
  });

  test('audit trail search input is present', async ({ page }) => {
    await page.goto('/admin/ioc/audit');
    // The AuditTrailView component renders a search input (type="search" → role searchbox)
    const searchInput = page.getByRole('searchbox');
    await expect(searchInput).toBeVisible();
  });

  test('unauthenticated access to /admin/ioc redirects to /admin/login', async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    await page.goto('/admin/ioc');
    await expect(page).toHaveURL(/\/admin\/login/);
    await context.close();
  });
});
