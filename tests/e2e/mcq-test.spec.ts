import { test, expect } from './fixtures'

/**
 * US-6 MCQ mock test — configure → start → (question rendered | graceful empty state).
 * The "Unauthorised" assertion guards the 401 regression fixed in this codebase
 * (test/start previously trusted a spoofable body userId and never called
 * getUser(), and a corrupted server-side anon key made getUser() fail even
 * when it was called).
 */
test.describe('US-6 Mock MCQ test', () => {
  test('config page renders track/difficulty/length controls', async ({ authedPage: page }) => {
    await page.goto('/test/new')
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.getByText('Difficulty')).toBeVisible()
    await expect(page.getByText('Length')).toBeVisible()
    await expect(page.getByRole('button', { name: /start test/i })).toBeVisible()
  })

  test('starting a test does not 401 and does not crash', async ({ authedPage: page }) => {
    await page.goto('/test/new')
    await page.getByRole('button', { name: /start test/i }).click()

    const started = page.waitForURL(/\/test\/[^/]+$/, { timeout: 15_000 }).then(() => 'started').catch(() => null)
    const noQuestions = page.getByText(/no approved questions|no questions/i).waitFor({ timeout: 15_000 }).then(() => 'empty').catch(() => null)
    const unauthorised = page.getByText(/unauthoris|unauthoriz/i).waitFor({ timeout: 15_000 }).then(() => 'unauth').catch(() => null)
    const serverError = page.getByText(/internal server error|something went wrong/i).waitFor({ timeout: 15_000 }).then(() => 'error').catch(() => null)

    const outcome = await Promise.race([started, noQuestions, unauthorised, serverError])
    expect(outcome, 'regression: test/start must not return 401 Unauthorised').not.toBe('unauth')
    expect(outcome, 'test/start must not 500').not.toBe('error')
    expect(outcome).not.toBeNull()
  })

  test('a started test renders a question and answer options', async ({ authedPage: page }) => {
    await page.goto('/test/new')
    await page.getByRole('button', { name: /start test/i }).click()

    const started = await page.waitForURL(/\/test\/[^/]+$/, { timeout: 15_000 }).then(() => true).catch(() => false)
    test.skip(!started, 'no approved questions available for this environment — nothing to assert on')

       // A question and at least one selectable answer option should render.
    // Answer options are <li><button>...</button></li> inside the question's
    // <ul> — scoped narrowly so this doesn't match unrelated page buttons
    // (e.g. a hidden "report issue" chip elsewhere on the page).
    await expect(page.locator('body')).toContainText(/./)
    const options = page.locator('ul li button')
    await expect(options.first()).toBeVisible({ timeout: 10_000 })
  })
})
