import { test, expect } from './fixtures'

/**
 * US-10 Coding assessment — problem list → open a problem → editor loads.
 */
test.describe('US-10 Coding assessment', () => {
  test('problem list loads for an authenticated user', async ({ authedPage: page }) => {
    await page.goto('/coding')
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: /coding assessment/i })).toBeVisible()
  })

  test('opening a problem loads the editor without a 401/500', async ({ authedPage: page }) => {
    await page.goto('/coding')
    const firstProblem = page.locator('a[href^="/coding/"]').first()
    const hasProblems = (await firstProblem.count()) > 0
    test.skip(!hasProblems, 'no coding questions seeded in this environment')

    await firstProblem.click()
    await expect(page).toHaveURL(/\/coding\/[^/]+$/)
    await expect(page.getByText(/unauthoris|unauthoriz/i)).toHaveCount(0)
    await expect(page.getByText(/internal server error/i)).toHaveCount(0)
  })
})
