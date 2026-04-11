/**
 * Smoke tests — OCOG Admin
 * Uses storageState: 'e2e/.auth/ocog.json' (ocog.admin@la28.org).
 */

import { test, expect } from '@playwright/test';

test.describe('OCOG Admin', () => {
  test('login redirects to /admin/ocog/pbn', async ({ page }) => {
    await page.goto('/admin/ocog/pbn');
    await expect(page).toHaveURL(/\/admin\/ocog\/pbn/);
    // Should not be redirected to login
    await expect(page).not.toHaveURL(/\/admin\/login/);
  });

  test('OCOG dashboard page renders without error', async ({ page }) => {
    const response = await page.goto('/admin/ocog/pbn');
    // Confirm the server returns a successful response
    expect(response?.status()).toBeLessThan(500);
    await expect(page).not.toHaveURL(/\/admin\/login/);
  });

  test('unauthenticated access to /admin/ocog/pbn redirects to /admin/login', async ({ browser }) => {
    // New context has no session cookies — middleware should redirect
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/admin/ocog/pbn');
    await expect(page).toHaveURL(/\/admin\/login/);
    await context.close();
  });
});
