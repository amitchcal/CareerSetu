import { defineConfig, devices } from '@playwright/test'

// Override with PLAYWRIGHT_BASE_URL to run against the deployed app or a CI preview.
//   PLAYWRIGHT_BASE_URL=https://career-setu-eight.vercel.app npm run test:e2e
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: 1,
  // Capped rather than the default (CPU core count). Auth-heavy specs each
  // log in via Supabase; running too many logins at once across workers was
  // triggering occasional timeouts (observed as "flaky" login retries) —
  // most likely Supabase auth rate-limiting concurrent sign-ins from the
  // same test account. This trades a bit of wall-clock time for reliability.
  workers: process.env.CI ? 2 : 3,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  // Applied to every project so relative paths in page.goto('/…') and the
  // request fixture resolve against the target app.
  use: { baseURL: BASE_URL },
  projects: [
    {
      name: 'Chromium (built-in)',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'Brave',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          executablePath: 'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe',
        },
      },
    },
    {
      name: 'Opera',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          executablePath: 'C:/Users/amitc/AppData/Local/Programs/Opera/opera.exe',
        },
      },
    },
    // Mobile viewports (Chromium)
    {
      name: 'Mobile Chrome (375px)',
      use: { ...devices['Pixel 5'] },
    },
  ],
})
