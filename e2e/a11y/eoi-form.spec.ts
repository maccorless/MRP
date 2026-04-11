/**
 * Accessibility regression — public EoI entry page (/apply)
 * No authentication required.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('a11y: /apply', () => {
  test('no axe violations on email entry page', async ({ page }) => {
    await page.goto('/apply');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'best-practice'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('email input has an associated label (axe label rule)', async ({ page }) => {
    await page.goto('/apply');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .include('#email')
      .analyze();

    // Specifically assert no label-related violations on the email input
    const labelViolations = results.violations.filter((v) =>
      ['label', 'label-content-name-mismatch'].includes(v.id),
    );
    expect(labelViolations).toEqual([]);
  });
});
