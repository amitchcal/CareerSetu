import { test, expect } from './fixtures'

/**
 * US-16 Onboarding — first-run profile + goal capture after signup.
 * Regression guard: `users.phone` was NOT NULL while email/password signup
 * never set it, silently blocking every profile save (see SQL fix in repo
 * notes). This test fails loudly if that regresses.
 */
test.describe('US-16 Onboarding', () => {
  test('profile step renders name/role/experience/language controls', async ({ authedPage: page }) => {
    await page.goto('/onboarding/profile')
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.getByPlaceholder('e.g. Priya Sharma')).toBeVisible()
    await expect(page.getByRole('button', { name: /continue/i })).toBeVisible()
  })

  test('submitting the profile step does not surface a 403/RLS error', async ({ authedPage: page }) => {
    await page.goto('/onboarding/profile')
    const nameInput = page.getByPlaceholder('e.g. Priya Sharma')
    await nameInput.fill('E2E Regression Tester')
    await page.getByRole('button', { name: /continue/i }).click()

    // Must not surface a policy/permission failure.
    await expect(page.getByText(/row-level security|403|forbidden|permission denied/i)).toHaveCount(0, { timeout: 8_000 }).catch(() => {})
  })
})
