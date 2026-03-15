import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: 0,
  outputDir: '.artifacts/playwright/test-results',
  use: {
    baseURL: 'http://127.0.0.1:4179',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npx vite --host=127.0.0.1 --port=4179',
    port: 4179,
    reuseExistingServer: false,
    timeout: 120000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
