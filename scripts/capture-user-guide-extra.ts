/**
 * Captures additional screenshots for the user guide:
 *  - EoI verify screen
 *  - EoI form tabs (all five)
 *  - EoI submitted screen
 *  - NOC queue detail
 *  - IOC /admin/ioc/direct (retry with longer timeout / different wait)
 */

import { chromium, BrowserContext } from "playwright";
import * as fs from "fs";
import * as path from "path";

const BASE = "http://localhost:3000";
const OUT = path.join(__dirname, "..", "docs", "user-guide", "screenshots");
fs.mkdirSync(OUT, { recursive: true });

async function shot(ctx: BrowserContext, url: string, name: string, waitMs = 800, waitUntil: "load" | "domcontentloaded" | "networkidle" = "networkidle") {
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  try {
    await page.goto(`${BASE}${url}`, { waitUntil, timeout: 30000 });
    await page.waitForTimeout(waitMs);
    await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.log(`  ✗ ${name}  ${(e as Error).message}`);
  }
  await page.close();
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  // EoI applicant flow using demo token K7M2 / demo@test.com
  console.log("Capturing EoI applicant flow…");
  const pub = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  // Verify screen
  await shot(pub, `/apply/verify?token=K7M2&email=${encodeURIComponent("demo@test.com")}`, "apply-04-verify-token");

  // Go via verify -> form. First we click through to the form with the token.
  {
    const page = await pub.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    const url = `/apply/form?token=K7M2&email=${encodeURIComponent("demo@test.com")}`;
    await page.goto(`${BASE}${url}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);

    // Tab 1: Organisation (default)
    await page.screenshot({ path: path.join(OUT, "apply-05-tab-organisation.png"), fullPage: true });
    console.log("  ✓ apply-05-tab-organisation");

    // Click each tab in turn. Tabs are buttons with text; try common selectors.
    const tabSelectors: Array<{ text: string; name: string }> = [
      { text: "Contacts", name: "apply-06-tab-contacts" },
      { text: "Publication", name: "apply-07-tab-publication" },
      { text: "Accreditation", name: "apply-08-tab-accreditation" },
      { text: "History", name: "apply-09-tab-history" },
    ];
    for (const t of tabSelectors) {
      try {
        const tab = page.getByRole("button", { name: t.text, exact: false }).first();
        if (await tab.count()) {
          await tab.click();
        } else {
          await page.getByText(t.text, { exact: false }).first().click();
        }
        await page.waitForTimeout(700);
        await page.screenshot({ path: path.join(OUT, `${t.name}.png`), fullPage: true });
        console.log(`  ✓ ${t.name}`);
      } catch (e) {
        console.log(`  ✗ ${t.name}  ${(e as Error).message}`);
      }
    }
    await page.close();
  }

  // Submitted confirmation screen
  await shot(pub, "/apply/submitted", "apply-10-submitted");

  // Status page
  await shot(pub, "/apply/status", "apply-11-status");

  await pub.close();

  // NOC queue detail (first listing link)
  console.log("Capturing NOC queue detail…");
  const nocCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  {
    const page = await nocCtx.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE}/admin/login`);
    await page.fill('input[name="email"]', "noc.admin@usopc.org");
    await page.fill('input[name="password"]', "Password1!");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/admin/noc**", { timeout: 15000 });
    await page.goto(`${BASE}/admin/noc/queue`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);

    const link = page.locator('a[href*="/admin/noc/queue/"][href$=""]').first();
    const count = await link.count();
    if (count) {
      const href = await link.getAttribute("href");
      if (href && href !== "/admin/noc/queue") {
        await page.goto(`${BASE}${href}`, { waitUntil: "networkidle" });
        await page.waitForTimeout(800);
        await page.screenshot({ path: path.join(OUT, "noc-02b-queue-detail.png"), fullPage: true });
        console.log("  ✓ noc-02b-queue-detail");
      } else {
        console.log(`  ✗ no queue detail link found (href=${href})`);
      }
    } else {
      console.log("  ✗ no queue detail link found");
    }
    await page.close();
  }
  await nocCtx.close();

  // IOC direct — retry with domcontentloaded
  console.log("Capturing IOC direct…");
  const iocCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  {
    const page = await iocCtx.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE}/admin/login`);
    await page.fill('input[name="email"]', "ioc.admin@olympics.org");
    await page.fill('input[name="password"]', "Password1!");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/admin/ioc**", { timeout: 15000 });
    try {
      await page.goto(`${BASE}/admin/ioc/direct`, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForTimeout(2500);
      await page.screenshot({ path: path.join(OUT, "ioc-05-direct.png"), fullPage: true });
      console.log("  ✓ ioc-05-direct");
    } catch (e) {
      console.log(`  ✗ ioc-05-direct  ${(e as Error).message}`);
    }
    await page.close();
  }
  await iocCtx.close();

  await browser.close();
  console.log("Done.");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
