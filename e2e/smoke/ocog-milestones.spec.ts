/**
 * Smoke tests — OCOG home + OCOG help LA28 milestone copy.
 *
 * Guards against the year-off-by-2 regression and the "OCOG approval
 * deadline" wording that contradicts the §2 reframe captured in
 * docs/LA28 PRP Integrated Timeline.html: OCOG is a coordinator, not
 * an approver — IOC retains final approval authority for PbN.
 */

import { test, expect } from "@playwright/test";

test.describe("OCOG home — LA28 Key Milestones", () => {
  test("renders the corrected milestones", async ({ page }) => {
    await page.goto("/admin/ocog");

    await expect(page.getByText("LA 2028 — Key Milestones")).toBeVisible();

    for (const expected of [
      "Open per-NOC EoI windows",
      "Jul 2026",
      "EoI window live",
      "31 Aug – 30 Oct 2026",
      "NOC PbN submissions due",
      "18 Dec 2026",
      "OCOG quota-compliance / push to ACR",
      "Oct–Dec 2026",
      "IF PbN deadline",
      "12 Feb 2027",
    ]) {
      await expect(page.getByText(expected, { exact: false }).first()).toBeVisible();
    }
  });

  test("does not surface the legacy year-off-by-2 strings", async ({ page }) => {
    await page.goto("/admin/ocog");
    const body = page.locator("body");
    for (const stale of [
      "OCOG approval deadline",   // §2 reframe: OCOG is a coordinator, not approver
      "Feb–Apr 2028",
      "May 2028",
      "Jun 2028",
    ]) {
      await expect(body).not.toContainText(stale);
    }
  });
});

test.describe("OCOG help — workflow timeline dates", () => {
  test("uses corrected, specific dates", async ({ page }) => {
    await page.goto("/admin/ocog/help");

    for (const expected of [
      "Jul 2026",
      "31 Aug – 30 Oct 2026",
      "Oct – Dec 2026",
      "Jan – Feb 2027",
    ]) {
      await expect(page.getByText(expected).first()).toBeVisible();
    }
  });
});
