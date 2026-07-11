import { test, expect } from './fixtures'

/**
 * US-8 Practice hub — the launchpad to all three practice modes.
 * Maps to: Dashboard → Practice → {Mock interview | MCQ test | Coding}.
 */
test.describe('US-8 Practice hub', () => {
  test('lists all three practice modes with working links', async ({ authedPage: page }) => {
    await page.goto('/practice')
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: 'Practice' })).toBeVisible()

    await expect(page.getByText('Mock interview')).toBeVisible()
    await expect(page.getByText('MCQ test')).toBeVisible()
    await expect(page.getByText('Coding assessment')).toBeVisible()
  })

  test('Mock interview card navigates to /interview/new', async ({ authedPage: page }) => {
    await page.goto('/practice')
    await page.getByText('Mock interview').click()
    await expect(page).toHaveURL(/\/interview\/new/)
    await expect(page).not.toHaveURL(/\/login/)
  })

  test('MCQ test card navigates to /test/new', async ({ authedPage: page }) => {
    await page.goto('/practice')
    await page.getByText('MCQ test').click()
    await expect(page).toHaveURL(/\/test\/new/)
    await expect(page).not.toHaveURL(/\/login/)
  })

  test('Coding assessment card navigates to /coding', async ({ authedPage: page }) => {
    await page.goto('/practice')
    await page.getByText('Coding assessment').click()
    await expect(page).toHaveURL(/\/coding/)
    await expect(page).not.toHaveURL(/\/login/)
  })
})

/**
 * US-9 Dashboard — landing page after login, entry point to everything.
 */
test.describe('US-9 Dashboard', () => {
  test('greets the user and shows the primary CTA', async ({ authedPage: page }) => {
    await page.goto('/dashboard')
    await expect(page).not.toHaveURL(/\/login/)
    // The page legitimately has two "ready to practise"-ish elements (the
    // h1 greeting and a separate CTA card's <p>) — scope to the heading.
    await expect(page.getByRole('heading', { name: /ready to practise/i })).toBeVisible()
    await expect(page.getByText(/start practising/i).first()).toBeVisible()
  })
})
