/**
 * Smoke tests — NOC government .gov eligibility flag UI.
 *
 * Covers test plan §3 for the 2026-04-26 changes. Seeds an org/application
 * with a .gov contact email so the amber "Eligibility flag" banner appears,
 * and asserts the form's required-checkbox guard.
 */

import { test, expect } from "@playwright/test";
import { sql, closeDb } from "../fixtures/db";

const T_ORG = `T_GovFlag Org ${Date.now()}`;
const T_REF = `TEST-2028-USA-${String(Math.floor(Math.random() * 90000) + 10000)}`;
let orgId: string | null = null;
let appId: string | null = null;

test.beforeAll(async () => {
  const db = sql();
  const [org] = await db<{ id: string }[]>`
    INSERT INTO organizations (name, country, noc_code, org_type, email_domain, org_email)
    VALUES (${T_ORG}, 'US', 'USA', 'news_agency', 'dept.gov.uk', 'press@example.gov')
    RETURNING id
  `;
  orgId = org.id;

  const [app] = await db<{ id: string }[]>`
    INSERT INTO applications (
      reference_number, organization_id, noc_code,
      contact_name, contact_email,
      category_press, category_photo, category_e, requested_e,
      about, status
    )
    VALUES (
      ${T_REF}, ${orgId}, 'USA',
      'Gov Test Contact', 'j.doe@dept.gov.uk',
      true, false, true, 3,
      'Eligibility-flag E2E seed', 'pending'
    )
    RETURNING id
  `;
  appId = app.id;
});

test.afterAll(async () => {
  if (!appId || !orgId) {
    await closeDb();
    return;
  }
  const db = sql();
  await db`DELETE FROM audit_log WHERE application_id = ${appId}`;
  await db`DELETE FROM applications WHERE id = ${appId}`;
  await db`DELETE FROM organizations WHERE id = ${orgId}`;
  await closeDb();
});

test.describe("NOC eligibility flag (.gov soft-warn)", () => {
  test("amber banner is visible when opening a .gov-flagged application", async ({ page }) => {
    await page.goto("/admin/noc/queue");

    // Locate our seeded row by the org name we set, then click Review.
    const row = page.locator("tbody tr").filter({ hasText: T_ORG });
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: /Review/i }).click();

    // The drawer fetches /api/admin/noc/application/<id> async — wait for the
    // Accept-as-Candidate heading to confirm the body has rendered.
    const drawer = page.getByRole("dialog");
    await expect(
      drawer.getByRole("heading", { name: /Accept as Candidate/i })
    ).toBeVisible();

    // Now the eligibility flag banner should be present. The banner heading
    // matches "⚠ Eligibility flag" exactly; .first() avoids the strict-mode
    // collision with the checkbox label that mentions "Eligibility" elsewhere.
    await expect(drawer.getByText(/Eligibility flag/i).first()).toBeVisible();

    // And the ack checkbox the form will require.
    await expect(drawer.locator('input[name="ack_eligibility_flag"]')).toBeAttached();
  });

  test("ack checkbox is required: clicking Accept without it does not navigate away", async ({ page }) => {
    await page.goto("/admin/noc/queue");
    const row = page.locator("tbody tr").filter({ hasText: T_ORG });
    await row.getByRole("button", { name: /Review/i }).click();

    const drawer = page.getByRole("dialog");
    await expect(
      drawer.getByRole("heading", { name: /Accept as Candidate/i })
    ).toBeVisible();

    // The checkbox carries `required`; clicking Accept should leave the
    // browser on the same URL (HTML form validation blocks submission).
    const urlBefore = page.url();
    await drawer.getByRole("button", { name: /Accept as Candidate/i }).click();

    await page.waitForTimeout(300);
    expect(page.url()).toBe(urlBefore);
    await expect(drawer).toBeVisible();
  });
});
