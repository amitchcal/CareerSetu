import { test, expect } from './fixtures'

/**
 * US-14 CV Analyzer — page renders upload zones and a disabled/enabled
 * Analyze button gated on both files being present. File-upload + AI
 * analysis itself is exercised manually (needs real PDF/DOCX fixtures and
 * burns Anthropic quota) — see Test Plan §Out of Scope.
 */
test.describe('US-14 CV Analyzer', () => {
  test('page loads with JD and CV upload zones', async ({ authedPage: page }) => {
    await page.goto('/cv-analyzer')
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: /cv analyzer/i })).toBeVisible()
    await expect(page.getByText('Upload JD')).toBeVisible()
    await expect(page.getByText('Upload CV')).toBeVisible()
  })

  test('Analyze button is disabled until both files are provided', async ({ authedPage: page }) => {
    await page.goto('/cv-analyzer')
    const analyzeBtn = page.getByRole('button', { name: /analyze my cv/i })
    await expect(analyzeBtn).toBeDisabled()
  })
})
