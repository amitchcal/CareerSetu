import { Page, expect } from '@playwright/test'

export class OnboardingPage {
  constructor(private page: Page) {}

  /** /onboarding/profile — name + target role + experience + language */
  async fillProfile(name: string) {
    await this.page.goto('/onboarding/profile')
    await expect(this.page).not.toHaveURL(/\/login/)
    const nameInput = this.page.getByPlaceholder('e.g. Priya Sharma')
    if (await nameInput.count()) await nameInput.fill(name)
    await this.page.getByRole('button', { name: /continue/i }).click()
  }

  /** /onboarding/goal — goal type + referral source */
  async completeGoal() {
    await expect(this.page).toHaveURL(/\/onboarding\/goal/, { timeout: 15_000 })
    // Pick the first goal option (radio-style label)
    const firstOption = this.page.locator('label').first()
    await firstOption.click({ trial: false }).catch(() => {})
    const continueBtn = this.page.getByRole('button', { name: /continue|finish|done/i }).first()
    if (await continueBtn.count()) await continueBtn.click()
  }
}
