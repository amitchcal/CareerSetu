import { test as base, expect, Page } from '@playwright/test'
import { AuthPage } from './pages/AuthPage'

export const EMAIL = process.env.TEST_USER_EMAIL
export const PASSWORD = process.env.TEST_USER_PASSWORD
export const hasCreds = Boolean(EMAIL && PASSWORD)

export function uniqueEmail(tag = 'e2e') {
  const base = process.env.TEST_SIGNUP_EMAIL_BASE || 'careersetu.e2e@example.com'
  const [name, domain] = base.split('@')
  return `${name}+${tag}${Date.now()}@${domain}`
}

/** Logs in with the shared test account before the test body runs. */
export const test = base.extend<{ authedPage: Page }>({
  authedPage: async ({ page }, use) => {
    test.skip(!hasCreds, 'set TEST_USER_EMAIL / TEST_USER_PASSWORD to run authenticated specs')
    const auth = new AuthPage(page)
    await auth.login(EMAIL!, PASSWORD!)
    await auth.expectLandedInApp()
    await use(page)
  },
})

export { expect }
