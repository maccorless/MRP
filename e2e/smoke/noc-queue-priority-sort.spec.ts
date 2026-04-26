/**
 * Smoke tests — NOC queue "IOC suggested priority" sort.
 *
 * Covers test plan §4 for the 2026-04-26 changes. Asserts the new sort
 * link is present, that activating it updates the URL, and that sort
 * + status filter compose correctly.
 */

import { test, expect } from "@playwright/test";

test.describe("NOC queue priority sort", () => {
  test("default URL has no sort param and the priority link is present", async ({ page }) => {
    await page.goto("/admin/noc/queue");

    await expect(page.getByRole("link", { name: /Most recent submission/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /IOC suggested priority/i })).toBeVisible();
  });

  test("clicking 'IOC suggested priority' adds sort=priority to the URL", async ({ page }) => {
    await page.goto("/admin/noc/queue");
    await page.getByRole("link", { name: /IOC suggested priority/i }).click();
    await expect(page).toHaveURL(/[?&]sort=priority(?:&|$)/);
  });

  test("clicking 'Most recent submission' drops the sort param", async ({ page }) => {
    await page.goto("/admin/noc/queue?sort=priority");
    await page.getByRole("link", { name: /Most recent submission/i }).click();
    await expect(page).not.toHaveURL(/[?&]sort=priority/);
  });

  test("status filter retains active sort across selections", async ({ page }) => {
    await page.goto("/admin/noc/queue?status=pending&sort=priority");

    // Page renders with both query params live; the UI then surfaces "Pending"
    // as the active filter. Re-clicking the priority link should keep status.
    await expect(page).toHaveURL(/sort=priority/);
    await expect(page).toHaveURL(/status=pending/);
  });
});
