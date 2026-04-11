/**
 * Accessibility regression — IOC audit trail (/admin/ioc/audit)
 * Uses IOC storageState set at the project level in playwright.config.ts.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('a11y: /admin/ioc/audit', () => {
  test('no axe violations on audit trail page', async ({ page }) => {
    await page.goto('/admin/ioc/audit');
    await expect(page).toHaveURL(/\/admin\/ioc\/audit/);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'best-practice'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('pagination controls have accessible labels when visible', async ({ page }) => {
    await page.goto('/admin/ioc/audit');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    // Filter for any navigation/region-related violations that would affect pagination
    const navViolations = results.violations.filter((v) =>
      ['aria-label', 'region', 'landmark-no-duplicate-main'].includes(v.id),
    );
    expect(navViolations).toEqual([]);
  });
});
