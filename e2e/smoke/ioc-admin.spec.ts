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

  // ─── §7 from 2026-04-26 test plan: NocEs column on quotas page ─────────────

  test('IOC quotas page renders a NocEs column', async ({ page }) => {
    await page.goto('/admin/ioc/quotas');
    await expect(page).toHaveURL(/\/admin\/ioc\/quotas/);

    // The NocEs (sport-specific press attaché) column was added 2026-04-26
    // per Emma #197. The page renders the read-only and edit tables behind
    // a "Show editable view" toggle; "NocEs" is in both tables. Assert by
    // textContent rather than CSS-uppercased rendered name.
    const allText = await page.locator('table').first().textContent();
    expect(allText ?? '').toMatch(/NocEs/);
  });

  // ─── §10 from 2026-04-26 test plan: INO terminology ───────────────────────

  test('IOC admin pages do not surface the legacy "Non-Governmental" wording', async ({ page }) => {
    // Strategic Plan re-review on 2026-04-26 retired the "Non-Governmental"
    // label in favour of "International News Organisation" (INO). Spot-check
    // the dashboard + quotas page to ensure no stale copy lingers.
    await page.goto('/admin/ioc');
    expect(await page.content()).not.toMatch(/Non-Governmental/i);

    await page.goto('/admin/ioc/quotas');
    expect(await page.content()).not.toMatch(/Non-Governmental/i);
  });
});
