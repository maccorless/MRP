import { chromium } from "playwright";
import * as path from "path";

const BASE = "http://localhost:3000";
const OUT = path.join(__dirname, "..", "docs", "user-guide", "screenshots");

(async () => {
  const token = process.argv[2];
  if (!token) throw new Error("Usage: capture-form-tabs.ts <token>");

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  const url = `/apply/form?token=${token}&email=${encodeURIComponent("demo@test.com")}`;
  await page.goto(`${BASE}${url}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  const tabs: Array<[number, string]> = [
    [0, "apply-05-tab-organisation"],
    [1, "apply-06-tab-contacts"],
    [2, "apply-08-tab-accreditation"],
    [3, "apply-07-tab-publication"],
    [4, "apply-09-tab-history"],
  ];
  for (const [i, name] of tabs) {
    try {
      await page.locator(`#eoi-tab-${i}`).waitFor({ timeout: 8000 });
      await page.locator(`#eoi-tab-${i}`).click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
      console.log(`  ✓ ${name}`);
    } catch (e) {
      console.log(`  ✗ ${name}  ${(e as Error).message}`);
    }
  }

  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
