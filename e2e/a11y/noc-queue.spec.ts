/**
 * Accessibility regression — NOC queue page (/admin/noc/queue)
 * Requires NOC authentication. This spec overrides the project-level
 * storageState (IOC) by loading the NOC session directly.
 */

import * as path from 'path';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Override the storageState for this spec to use the NOC session
test.use({ storageState: path.join(__dirname, '../.auth/noc.json') });

test.describe('a11y: /admin/noc/queue', () => {
  test('no axe violations on NOC queue page', async ({ page }) => {
    await page.goto('/admin/noc/queue');
    // Confirm we are on the queue page (not redirected to login)
    await expect(page).toHaveURL(/\/admin\/noc\/queue/);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'best-practice'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('filter link buttons have accessible names (axe link-name rule)', async ({ page }) => {
    await page.goto('/admin/noc/queue');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const linkNameViolations = results.violations.filter((v) => v.id === 'link-name');
    expect(linkNameViolations).toEqual([]);
  });
});
