/**
 * Smoke tests — NOC home + NOC help LA28 milestone copy.
 *
 * Guards against the year-off-by-2 regression that prompted this fix
 * (the panel previously showed "Feb 2028 — done", "May 2028 — upcoming"
 * etc.). Source of truth: docs/process-timeline-2026-04-26.md +
 * docs/LA28 PRP Integrated Timeline.html (Strategic Plan Feb 2026
 * FINAL + Emma 2026-04-24 corrections).
 */

import { test, expect } from "@playwright/test";

test.describe("NOC home — LA28 Key Milestones", () => {
  test("renders all six milestones with correct dates", async ({ page }) => {
    await page.goto("/admin/noc/home");

    await expect(page.getByText("LA 2028 — Key Milestones")).toBeVisible();

    for (const expected of [
      "EoI window opens",
      "31 Aug 2026",
      "EoI applicant deadline",
      "23 Oct 2026",
      "Platform hard close",
      "30 Oct 2026",
      "PbN + ENR submission deadline",
      "18 Dec 2026",
      "IOC notifies NOCs of approved ENRs",
      "w/c 1 Feb 2027",
      "OIAC card distribution",
      "Apr 2028",
    ]) {
      await expect(page.getByText(expected, { exact: false }).first()).toBeVisible();
    }
  });

  test("does not surface the legacy year-off-by-2 strings", async ({ page }) => {
    await page.goto("/admin/noc/home");
    const body = page.locator("body");
    for (const stale of [
      "Final accreditation confirmed",
      "May 2028",
      "Jun 2028",
      "Feb 2028",
    ]) {
      await expect(body).not.toContainText(stale);
    }
  });
});

test.describe("NOC help — workflow timeline dates", () => {
  test("uses corrected, specific dates", async ({ page }) => {
    await page.goto("/admin/noc/help");

    for (const expected of [
      "31 Aug 2026",
      "Oct – Dec 2026",
      "Oct 2027 – Feb 2028",
    ]) {
      await expect(page.getByText(expected).first()).toBeVisible();
    }
  });
});
