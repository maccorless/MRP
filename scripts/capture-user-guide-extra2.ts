import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

const BASE = "http://localhost:3000";
const OUT = path.join(__dirname, "..", "docs", "user-guide", "screenshots");
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });

  // ---- EoI form tabs using id="eoi-tab-N"
  console.log("EoI form tabs…");
  const pub = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  {
    const page = await pub.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    const url = `/apply/form?token=K7M2&email=${encodeURIComponent("demo@test.com")}`;
    await page.goto(`${BASE}${url}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);

    // TABS order: 0 Organisation, 1 Contacts, 2 Accreditation, 3 Publication, 4 History
    const tabs: Array<[number, string]> = [
      [0, "apply-05-tab-organisation"],
      [1, "apply-06-tab-contacts"],
      [2, "apply-08-tab-accreditation"],
      [3, "apply-07-tab-publication"],
      [4, "apply-09-tab-history"],
    ];
    for (const [i, name] of tabs) {
      try {
        await page.locator(`#eoi-tab-${i}`).click({ timeout: 8000 });
        await page.waitForTimeout(700);
        await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
        console.log(`  ✓ ${name}`);
      } catch (e) {
        console.log(`  ✗ ${name}  ${(e as Error).message}`);
      }
    }
    await page.close();
  }
  await pub.close();

  // ---- NOC queue detail (find a valid /admin/noc/<id>)
  console.log("NOC queue detail…");
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

    // Click first data row to open drawer
    const row = page.locator("tbody tr").first();
    if (await row.count()) {
      await row.click();
      await page.waitForTimeout(700);
      await page.screenshot({ path: path.join(OUT, "noc-02b-queue-drawer.png"), fullPage: true });
      console.log("  ✓ noc-02b-queue-drawer");

      // "View full application" link in drawer
      const fullLink = page.locator('a[href^="/admin/noc/"]:not([href="/admin/noc/queue"]):not([href="/admin/noc/home"]):not([href="/admin/noc/pbn"]):not([href="/admin/noc/enr"]):not([href="/admin/noc/direct-entry"]):not([href="/admin/noc/invite"]):not([href="/admin/noc/fast-track"]):not([href="/admin/noc/audit"]):not([href="/admin/noc/help"])').first();
      if (await fullLink.count()) {
        const href = await fullLink.getAttribute("href");
        if (href) {
          await page.goto(`${BASE}${href}`, { waitUntil: "networkidle" });
          await page.waitForTimeout(800);
          await page.screenshot({ path: path.join(OUT, "noc-02c-application-detail.png"), fullPage: true });
          console.log("  ✓ noc-02c-application-detail");
        }
      }
    }
    await page.close();
  }
  await nocCtx.close();

  await browser.close();
  console.log("Done.");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
