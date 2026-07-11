import { test, expect } from './fixtures'

/**
 * US-13 Subscription — plan page loads, current plan is shown, no upgrade
 * is actually triggered (Razorpay checkout would need a live payment;
 * out of scope for automated regression — see Test Plan §Out of Scope).
 */
test.describe('US-13 Subscription', () => {
  test('subscription page loads and shows a current plan', async ({ authedPage: page }) => {
    await page.goto('/subscription')
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: /subscription/i })).toBeVisible()
    // A free-tier account should default to the Free plan.
    await expect(page.locator('body')).toContainText(/free|starter|pro/i)
  })
})
