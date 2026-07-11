import { defineConfig, devices } from '@playwright/test'

const PORT = 5173
const BASE_URL = `http://localhost:${PORT}`

/**
 * A single smoke-test project against the Vite dev server. The dev server is
 * started with placeholder API keys so every source is "configured" (and thus
 * requested); the tests then intercept those requests with fixtures, so the
 * suite is deterministic and needs no real keys or network.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      VITE_NEWSAPI_API_KEY: 'e2e',
      VITE_GUARDIAN_API_KEY: 'e2e',
      VITE_NYT_API_KEY: 'e2e',
      VITE_NEWSDATA_API_KEY: 'e2e',
    },
  },
})
