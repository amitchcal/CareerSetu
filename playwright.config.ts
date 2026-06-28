import { defineConfig, devices } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: BASE_URL,
    screenshot: 'only-on-failure',
    video: 'off',
  },
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
