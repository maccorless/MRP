import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  timeout: 20000,
  retries: process.env.CI ? 1 : 0,
  workers: 1, // real shared DB — no parallel workers
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    browserName: 'chromium',
  },
  webServer: {
    command: 'bun dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  projects: [
    {
      name: 'setup',
      testMatch: 'e2e/fixtures/auth.setup.ts',
    },
    {
      name: 'smoke-ioc',
      dependencies: ['setup'],
      use: { storageState: 'e2e/.auth/ioc.json' },
      testMatch: 'e2e/smoke/ioc-admin.spec.ts',
    },
    {
      name: 'smoke-noc',
      dependencies: ['setup'],
      use: { storageState: 'e2e/.auth/noc.json' },
      testMatch: 'e2e/smoke/noc-admin.spec.ts',
    },
    {
      name: 'smoke-ocog',
      dependencies: ['setup'],
      use: { storageState: 'e2e/.auth/ocog.json' },
      testMatch: 'e2e/smoke/ocog-admin.spec.ts',
    },
    {
      name: 'smoke-public',
      testMatch: 'e2e/smoke/public-eoi.spec.ts',
    },
    {
      name: 'a11y',
      dependencies: ['setup'],
      use: { storageState: 'e2e/.auth/ioc.json' },
      testMatch: 'e2e/a11y/*.spec.ts',
    },
  ],
});
