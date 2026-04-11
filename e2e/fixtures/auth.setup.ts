/**
 * Global auth setup — runs once before all dependent test projects.
 * Logs into each admin role via the real /admin/login form and saves
 * storage state (session cookies) to e2e/.auth/*.json.
 *
 * Credentials come from src/db/seed.ts (password: Password1! for all):
 *   IOC:  ioc.admin@olympics.org   → /admin/ioc
 *   NOC:  noc.admin@usopc.org      → /admin/noc
 *   OCOG: ocog.admin@la28.org      → /admin/ocog/pbn
 */

import * as fs from 'fs';
import * as path from 'path';
import { test as setup, expect } from '@playwright/test';

const AUTH_DIR = path.join(__dirname, '../.auth');

setup.beforeAll(() => {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
});

async function loginAs(
  browser: import('@playwright/test').Browser,
  email: string,
  expectedPath: string,
  outputFile: string,
) {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('/admin/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', 'Password1!');
  await page.click('button[type="submit"]');

  // Wait for redirect to the expected dashboard path
  await page.waitForURL(`**${expectedPath}`, { timeout: 10000 });
  await expect(page).toHaveURL(new RegExp(expectedPath));

  await context.storageState({ path: outputFile });
  await context.close();
}

setup('authenticate all roles', async ({ browser }) => {
  await loginAs(
    browser,
    'ioc.admin@olympics.org',
    '/admin/ioc',
    path.join(AUTH_DIR, 'ioc.json'),
  );

  await loginAs(
    browser,
    'noc.admin@usopc.org',
    '/admin/noc',
    path.join(AUTH_DIR, 'noc.json'),
  );

  await loginAs(
    browser,
    'ocog.admin@la28.org',
    '/admin/ocog/pbn',
    path.join(AUTH_DIR, 'ocog.json'),
  );
});
