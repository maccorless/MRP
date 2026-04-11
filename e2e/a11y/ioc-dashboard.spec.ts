/**
 * Accessibility regression — IOC dashboard (/admin/ioc)
 * Uses IOC storageState set at the project level in playwright.config.ts.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('a11y: /admin/ioc', () => {
  test('no axe violations on IOC dashboard', async ({ page }) => {
    await page.goto('/admin/ioc');
    await expect(page).toHaveURL(/\/admin\/ioc/);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'best-practice'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('tables have <th> header cells (axe th-has-data-cells rule)', async ({ page }) => {
    await page.goto('/admin/ioc');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const tableViolations = results.violations.filter((v) =>
      ['th-has-data-cells', 'scope-attr-valid', 'table-duplicate-name'].includes(v.id),
    );
    expect(tableViolations).toEqual([]);
  });
});
