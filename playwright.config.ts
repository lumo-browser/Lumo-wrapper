import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './src/__e2e__',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Electron app takes control, keep to 1 worker
  reporter: 'list',
  use: {
    actionTimeout: 0,
    trace: 'on-first-retry',
  },
});
