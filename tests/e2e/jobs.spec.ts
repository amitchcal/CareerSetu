import { test, expect } from './fixtures'

/**
 * US-12 Job search — CV upload (step 1) gates the search form (step 2), so
 * the search inputs don't exist in the DOM until a CV is uploaded and
 * parsed. Actually uploading + parsing a real CV needs a file fixture and
 * hits the Anthropic-backed /api/cv/parse route, so — matching the CV
 * Analyzer test's scope decision — we assert the upload step renders
 * correctly and leave the full upload→search flow to manual testing.
 */
test.describe('US-12 Job search', () => {
  test('search page loads with the CV upload step', async ({ authedPage: page }) => {
    await page.goto('/jobs')
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: /find matching jobs/i })).toBeVisible()
    await expect(page.getByText(/upload your cv/i)).toBeVisible()
    await expect(page.getByText(/drag.{0,3}drop|click to upload/i)).toBeVisible()
  })
})
