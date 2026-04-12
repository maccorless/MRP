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
    await expect(
      page.getByRole('heading', { name: /Apply for Media Accreditation/i }),
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
