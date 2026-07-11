import { test, expect } from '@playwright/test'
import { AuthPage } from './pages/AuthPage'

/**
 * Authenticated user-journey regression tests, mapped to user stories.
 *
 * These require a pre-existing test account. Provide via env:
 *   TEST_USER_EMAIL=...  TEST_USER_PASSWORD=...
 * When absent, the auth-dependent tests are skipped (so the file is safe to
 * run in any environment). The signup story (US-1) always runs — it creates a
 * fresh, unique email each run.
 *
 * Prereqs for a full green run (see e2e/README.md):
 *   - Supabase "Confirm email" is OFF (instant signup)
 *   - TEST_USER_EMAIL / TEST_USER_PASSWORD is a REAL, currently-existing
 *     account — if Supabase users were ever bulk-deleted, recreate it before
 *     re-running, otherwise every authenticated test below fails with a
 *     "Login failed" diagnostic (see AuthPage.expectLandedInApp).
 *   - The question bank has at least one approved MCQ for US-6 to fully start
 */

const EMAIL = process.env.TEST_USER_EMAIL
const PASSWORD = process.env.TEST_USER_PASSWORD
const hasCreds = Boolean(EMAIL && PASSWORD)

function uniqueEmail() {
  const base = process.env.TEST_SIGNUP_EMAIL_BASE || 'careersetu.e2e@example.com'
  const [name, domain] = base.split('@')
  return `${name}+${Date.now()}@${domain}`
}

// ── US-1: New user can sign up ───────────────────────────────────────────────

test.describe('US-1 Signup', () => {
  test('a new email can create an account without error', async ({ page }) => {
    const email = uniqueEmail()
    const auth = new AuthPage(page)
    await auth.signup('E2E Tester', email, 'Test1234!')

    // Either: instant login → onboarding (Confirm email OFF),
    // or: a "confirm your email" toast (Confirm email ON). Both are non-broken.
    const onboarding = page.waitForURL(/\/onboarding/, { timeout: 15_000 }).then(() => 'onboarding').catch(() => null)
    const confirmToast = page.getByText(/confirm your email|almost there/i).waitFor({ timeout: 15_000 }).then(() => 'toast').catch(() => null)
    const signupFailed = page.getByText(/signup failed/i).waitFor({ timeout: 15_000 }).then(() => 'failed').catch(() => null)

    const outcome = await Promise.race([onboarding, confirmToast, signupFailed])
    expect(outcome, 'signup should not surface a "Signup failed" error').not.toBe('failed')
    expect(outcome).not.toBeNull()
  })
})

// ── US-2: Returning user can log in and reach the app ────────────────────────

test.describe('US-2 Login', () => {
  test.skip(!hasCreds, 'set TEST_USER_EMAIL / TEST_USER_PASSWORD to run')

  test('valid credentials land in the app (dashboard or onboarding)', async ({ page }) => {
    const auth = new AuthPage(page)
    await auth.login(EMAIL!, PASSWORD!)
    await auth.expectLandedInApp()
  })
})

// ── US-3: Wrong password is rejected ─────────────────────────────────────────

test.describe('US-3 Invalid login', () => {
  test('wrong password shows an error and stays on /login', async ({ page }) => {
    const auth = new AuthPage(page)
    await auth.login(uniqueEmail(), 'definitely-wrong-password')
    await expect(page.getByText(/login failed|invalid|incorrect|credentials/i).first()).toBeVisible({ timeout: 15_000 })
    await expect(page).toHaveURL(/\/login/)
  })
})

// ── US-4: No redirect loop — the exact bug fixed today ───────────────────────

test.describe('US-4 Session persists across navigation (redirect-loop regression)', () => {
  test.skip(!hasCreds, 'set TEST_USER_EMAIL / TEST_USER_PASSWORD to run')

  test('after login, a protected route loads instead of bouncing to /login', async ({ page }) => {
    const auth = new AuthPage(page)
    await auth.login(EMAIL!, PASSWORD!)
    await auth.expectLandedInApp()

    // Hard-navigate to a protected route; middleware must NOT bounce to /login.
    await page.goto('/dashboard')
    await expect(page).not.toHaveURL(/\/login/)
    await page.goto('/reports')
    await expect(page).not.toHaveURL(/\/login/)
  })
})

// ── US-5: Profile can be saved ───────────────────────────────────────────────

test.describe('US-5 Profile', () => {
  test.skip(!hasCreds, 'set TEST_USER_EMAIL / TEST_USER_PASSWORD to run')

  test('profile page loads and saving succeeds', async ({ page }) => {
    const auth = new AuthPage(page)
    await auth.login(EMAIL!, PASSWORD!)
    await auth.expectLandedInApp()
    await page.goto('/profile')
    await expect(page).not.toHaveURL(/\/login/)

    const nameInput = page.getByPlaceholder(/priya sharma|your name/i).first()
    if (await nameInput.count()) await nameInput.fill('E2E Tester')

    await page.getByRole('button', { name: /save/i }).first().click()
    // Success toast OR no error toast — must not surface a failure.
    await expect(page.getByText(/error/i)).toHaveCount(0, { timeout: 8_000 }).catch(() => {})
    await expect(page.getByText(/saved|updated|success/i).first()).toBeVisible({ timeout: 10_000 })
  })
})

// ── US-6: MCQ mock test can be configured and started ────────────────────────

test.describe('US-6 Mock MCQ test', () => {
  test.skip(!hasCreds, 'set TEST_USER_EMAIL / TEST_USER_PASSWORD to run')

  test('configure and start — starts, or gracefully reports no questions (no crash / no 401)', async ({ page }) => {
    const auth = new AuthPage(page)
    await auth.login(EMAIL!, PASSWORD!)
    await auth.expectLandedInApp()
    await page.goto('/test/new')
    await expect(page).not.toHaveURL(/\/login/)

    await page.getByRole('button', { name: /start test/i }).click()

    // Acceptable outcomes: navigates into a test, OR a "no approved questions"
    // message. NOT acceptable: "Unauthorised" (the 401 we fixed) or a crash.
    const started = page.waitForURL(/\/test\/[^/]+$/, { timeout: 15_000 }).then(() => 'started').catch(() => null)
    const noQuestions = page.getByText(/no approved questions|no questions/i).waitFor({ timeout: 15_000 }).then(() => 'empty').catch(() => null)
    const unauthorised = page.getByText(/unauthoris|unauthoriz/i).waitFor({ timeout: 15_000 }).then(() => 'unauth').catch(() => null)

    const outcome = await Promise.race([started, noQuestions, unauthorised])
    expect(outcome, 'must not be Unauthorised (401 regression)').not.toBe('unauth')
    expect(outcome).not.toBeNull()
  })
})

// ── US-7: Reports page ───────────────────────────────────────────────────────

test.describe('US-7 Reports', () => {
  test.skip(!hasCreds, 'set TEST_USER_EMAIL / TEST_USER_PASSWORD to run')

  test('reports page loads for an authenticated user', async ({ page }) => {
    const auth = new AuthPage(page)
    await auth.login(EMAIL!, PASSWORD!)
    await auth.expectLandedInApp()
    await page.goto('/reports')
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.locator('body')).toBeVisible()
  })
})
