import { test, expect } from '@playwright/test'

/**
 * US-17 Forgot password — no-auth flow, safe to run anywhere.
 */
test.describe('US-17 Forgot password', () => {
  test('requesting a reset link for a valid-looking email shows confirmation', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.getByPlaceholder('you@example.com').fill(`e2e+${Date.now()}@example.com`)
    await page.getByRole('button', { name: /send reset link/i }).click()
    await expect(page.getByText(/reset link was sent|check your inbox/i)).toBeVisible({ timeout: 10_000 })
  })

  test('has a back-to-login link', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page.getByRole('link', { name: /back to login/i })).toBeVisible()
  })
})
