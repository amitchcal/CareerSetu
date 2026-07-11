import { Page, expect } from '@playwright/test'

export class AuthPage {
  constructor(private page: Page) {}

  async gotoLogin() {
    await this.page.goto('/login')
  }

  async gotoSignup() {
    await this.page.goto('/signup')
  }

  async login(email: string, password: string) {
    await this.gotoLogin()
    await this.page.getByPlaceholder('you@example.com').fill(email)
    await this.page.getByPlaceholder('Your password').fill(password)
    await this.page.getByRole('button', { name: 'Sign in' }).click()
  }

  async signup(name: string, email: string, password: string) {
    await this.gotoSignup()
    await this.page.getByPlaceholder('Priya Sharma').fill(name)
    await this.page.getByPlaceholder('you@example.com').fill(email)
    await this.page.getByPlaceholder('Min. 6 characters').fill(password)
    await this.page.getByRole('button', { name: 'Create account' }).click()
  }

  async expectLandedInApp(timeout = 20_000) {
    await this.page.waitForURL(/\/(dashboard|onboarding)/, { timeout })
    await expect(this.page).toHaveURL(/\/(dashboard|onboarding)/)
  }
}
