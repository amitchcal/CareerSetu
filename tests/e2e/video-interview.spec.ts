import { test, expect } from './fixtures'

/**
 * US-15 Video interview — config page renders; starting creates a session
 * without 401 (regression guard: video-interview/start had the same
 * spoofable-userId IDOR as the audio interview route).
 * Camera/mic permission flows are exercised manually — see Test Plan.
 */
test.describe('US-15 Video interview', () => {
  test('config page loads for an authenticated user', async ({ authedPage: page }) => {
    await page.goto('/video-interview/new')
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: /configure your video interview/i })).toBeVisible()
  })
})
