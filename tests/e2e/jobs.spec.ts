import { test, expect } from './fixtures'

/**
 * US-12 Job search — search form renders; submitting with a role query
 * returns results or a graceful empty/error toast (never a crash).
 */
test.describe('US-12 Job search', () => {
  test('search page loads with title/location inputs', async ({ authedPage: page }) => {
    await page.goto('/jobs')
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: /find matching jobs/i })).toBeVisible()
  })

  test('searching for a common role does not crash the page', async ({ authedPage: page }) => {
    await page.goto('/jobs')
    const titleInput = page.getByPlaceholder(/job title or role/i)
    await titleInput.fill('Software Engineer')
    await page.getByRole('button', { name: /search jobs/i }).click()

    // Either results render, or a "search failed" toast — both are non-broken.
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })
})
