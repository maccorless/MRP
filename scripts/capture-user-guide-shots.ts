/**
 * Captures full-page screenshots for each PRP role, for the user guide.
 * Produces PNGs in docs/user-guide/screenshots/.
 *
 * Usage:  bun scripts/capture-user-guide-shots.ts
 * Requires: dev server already running on http://localhost:3000
 */

import { chromium, Browser, BrowserContext, Page } from "playwright";
import * as fs from "fs";
import * as path from "path";

const BASE = "http://localhost:3000";
const OUT = path.join(__dirname, "..", "docs", "user-guide", "screenshots");
fs.mkdirSync(OUT, { recursive: true });

type Shot = { name: string; url: string; wait?: number; scrollBottom?: boolean; fullPage?: boolean };

const PUBLIC_SHOTS: Shot[] = [
  { name: "00-landing",          url: "/" },
  { name: "apply-01-landing",    url: "/apply" },
  { name: "apply-02-how-it-works", url: "/apply/how-it-works" },
];

const LOGIN_SHOT: Shot = { name: "admin-login", url: "/admin/login" };

const NOC_SHOTS: Shot[] = [
  { name: "noc-01-home",         url: "/admin/noc/home" },
  { name: "noc-02-queue",        url: "/admin/noc/queue" },
  { name: "noc-03-pbn",          url: "/admin/noc/pbn" },
  { name: "noc-04-enr",          url: "/admin/noc/enr" },
  { name: "noc-05-direct-entry", url: "/admin/noc/direct-entry" },
  { name: "noc-06-invite",       url: "/admin/noc/invite" },
  { name: "noc-07-fast-track",   url: "/admin/noc/fast-track" },
  { name: "noc-08-audit",        url: "/admin/noc/audit" },
  { name: "noc-09-help",         url: "/admin/noc/help" },
];

const OCOG_SHOTS: Shot[] = [
  { name: "ocog-01-home",       url: "/admin/ocog" },
  { name: "ocog-02-eoi",        url: "/admin/ocog/eoi" },
  { name: "ocog-03-pbn",        url: "/admin/ocog/pbn" },
  { name: "ocog-04-duplicates", url: "/admin/ocog/duplicates" },
  { name: "ocog-05-master",     url: "/admin/ocog/master" },
  { name: "ocog-06-windows",    url: "/admin/ocog/windows" },
  { name: "ocog-07-audit",      url: "/admin/ocog/audit" },
  { name: "ocog-08-help",       url: "/admin/ocog/help" },
];

const IOC_SHOTS: Shot[] = [
  { name: "ioc-01-home",    url: "/admin/ioc" },
  { name: "ioc-02-master",  url: "/admin/ioc/master" },
  { name: "ioc-03-enr",     url: "/admin/ioc/enr" },
  { name: "ioc-04-quotas",  url: "/admin/ioc/quotas" },
  { name: "ioc-05-direct",  url: "/admin/ioc/direct" },
  { name: "ioc-06-orgs",    url: "/admin/ioc/orgs" },
  { name: "ioc-07-export",  url: "/admin/ioc/export" },
  { name: "ioc-08-flags",   url: "/admin/ioc/flags" },
  { name: "ioc-09-audit",   url: "/admin/ioc/audit" },
  { name: "ioc-10-sudo",    url: "/admin/ioc/sudo" },
  { name: "ioc-11-help",    url: "/admin/ioc/help" },
];

async function loginAs(context: BrowserContext, email: string, expectedPath: string) {
  const page = await context.newPage();
  await page.goto(`${BASE}/admin/login`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "Password1!");
  await page.click('button[type="submit"]');
  await page.waitForURL(`**${expectedPath}**`, { timeout: 15000 });
  await page.close();
}

async function capture(page: Page, shot: Shot) {
  const url = shot.url.startsWith("http") ? shot.url : `${BASE}${shot.url}`;
  const file = path.join(OUT, `${shot.name}.png`);
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(shot.wait ?? 500);
    await page.screenshot({ path: file, fullPage: shot.fullPage !== false });
    console.log(`  ✓ ${shot.name}`);
  } catch (err) {
    console.log(`  ✗ ${shot.name}  ${(err as Error).message}`);
  }
}

async function captureAll(ctx: BrowserContext, shots: Shot[]) {
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const s of shots) {
    await capture(page, s);
  }
  await page.close();
}

(async () => {
  const browser: Browser = await chromium.launch({ headless: true });

  console.log("Capturing public pages…");
  const pub = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await captureAll(pub, PUBLIC_SHOTS);
  await captureAll(pub, [LOGIN_SHOT]);

  // EoI form tabs — requires a verified email session. We'll try straight /apply/form,
  // which on a fresh session will likely redirect to verification. We capture verify screen instead.
  await captureAll(pub, [
    { name: "apply-03-verify-email", url: "/apply" },
  ]);
  await pub.close();

  console.log("Capturing NOC (USOPC)…");
  const nocCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await loginAs(nocCtx, "noc.admin@usopc.org", "/admin/noc");
  await captureAll(nocCtx, NOC_SHOTS);

  // Also capture a queue detail page — find one from the list.
  const p = await nocCtx.newPage();
  await p.goto(`${BASE}/admin/noc/queue`, { waitUntil: "networkidle" });
  const firstLink = await p.locator('a[href^="/admin/noc/queue/"]').first();
  if (await firstLink.count()) {
    const href = await firstLink.getAttribute("href");
    if (href) {
      await p.goto(`${BASE}${href}`, { waitUntil: "networkidle" });
      await p.waitForTimeout(500);
      await p.screenshot({ path: path.join(OUT, "noc-02b-queue-detail.png"), fullPage: true });
      console.log("  ✓ noc-02b-queue-detail");
    }
  }
  await p.close();
  await nocCtx.close();

  console.log("Capturing OCOG (LA28)…");
  const ocogCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await loginAs(ocogCtx, "ocog.admin@la28.org", "/admin/ocog");
  await captureAll(ocogCtx, OCOG_SHOTS);
  await ocogCtx.close();

  console.log("Capturing IOC…");
  const iocCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await loginAs(iocCtx, "ioc.admin@olympics.org", "/admin/ioc");
  await captureAll(iocCtx, IOC_SHOTS);
  await iocCtx.close();

  await browser.close();
  console.log("Done.");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
