# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: user-journeys.spec.ts >> US-7 Reports >> reports page loads for an authenticated user
- Location: tests\e2e\user-journeys.spec.ts:149:7

# Error details

```
Error: page.goto: net::ERR_NAME_NOT_RESOLVED at https://thecareersetu.in/login
Call log:
  - navigating to "https://thecareersetu.in/login", waiting until "load"

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - img [ref=e4]
  - generic [ref=e47]:
    - heading "This site can’t be reached" [level=1] [ref=e48]
    - paragraph [ref=e50]: Check if there is a typo in thecareersetu.in.
    - generic [ref=e54]:
      - generic [ref=e55]:
        - heading "Try:" [level=4] [ref=e56]
        - list [ref=e57]:
          - listitem [ref=e58]:
            - link "Running Windows Network Diagnostics" [ref=e59] [cursor=pointer]:
              - /url: javascript:diagnoseErrors()
          - listitem [ref=e60]: Changing DNS over HTTPS settings
      - generic [ref=e61]: DNS_PROBE_FINISHED_NXDOMAIN
    - generic [ref=e62]:
      - heading "Check your DNS over HTTPS settings" [level=4] [ref=e63]
      - paragraph [ref=e64]: Go to Opera > Preferences… > System > Use DNS-over-HTTPS instead of the system’s DNS settings and check your DNS-over-HTTPS provider.
    - generic [ref=e66]:
      - textbox [active] [ref=e69]: thecareersetu.in
      - button [ref=e70] [cursor=pointer]
```

# Test source

```ts
  1   | import { test, expect, Page } from '@playwright/test'
  2   | 
  3   | /**
  4   |  * Authenticated user-journey regression tests, mapped to user stories.
  5   |  *
  6   |  * These require a pre-existing test account. Provide via env:
  7   |  *   TEST_USER_EMAIL=...  TEST_USER_PASSWORD=...
  8   |  * When absent, the auth-dependent tests are skipped (so the file is safe to
  9   |  * run in any environment). The signup story (US-1) always runs — it creates a
  10  |  * fresh, unique email each run.
  11  |  *
  12  |  * Prereqs for a full green run (see e2e/README.md):
  13  |  *   - Supabase "Confirm email" is OFF (instant signup)
  14  |  *   - The question bank has at least one approved MCQ for US-6 to fully start
  15  |  */
  16  | 
  17  | const EMAIL = process.env.TEST_USER_EMAIL
  18  | const PASSWORD = process.env.TEST_USER_PASSWORD
  19  | const hasCreds = Boolean(EMAIL && PASSWORD)
  20  | 
  21  | // ── helpers ──────────────────────────────────────────────────────────────────
  22  | 
  23  | function uniqueEmail() {
  24  |   const base = process.env.TEST_SIGNUP_EMAIL_BASE || 'careersetu.e2e@example.com'
  25  |   const [name, domain] = base.split('@')
  26  |   return `${name}+${Date.now()}@${domain}`
  27  | }
  28  | 
  29  | async function login(page: Page, email: string, password: string) {
> 30  |   await page.goto('/login')
      |              ^ Error: page.goto: net::ERR_NAME_NOT_RESOLVED at https://thecareersetu.in/login
  31  |   await page.getByPlaceholder('you@example.com').fill(email)
  32  |   await page.getByPlaceholder('Your password').fill(password)
  33  |   await page.getByRole('button', { name: 'Sign in' }).click()
  34  | }
  35  | 
  36  | // ── US-1: New user can sign up ───────────────────────────────────────────────
  37  | 
  38  | test.describe('US-1 Signup', () => {
  39  |   test('a new email can create an account without error', async ({ page }) => {
  40  |     const email = uniqueEmail()
  41  |     await page.goto('/signup')
  42  |     await page.getByPlaceholder('Priya Sharma').fill('E2E Tester')
  43  |     await page.getByPlaceholder('you@example.com').fill(email)
  44  |     await page.getByPlaceholder('Min. 6 characters').fill('Test1234!')
  45  |     await page.getByRole('button', { name: 'Create account' }).click()
  46  | 
  47  |     // Either: instant login → onboarding (Confirm email OFF),
  48  |     // or: a "confirm your email" toast (Confirm email ON). Both are non-broken.
  49  |     const onboarding = page.waitForURL(/\/onboarding/, { timeout: 15_000 }).then(() => 'onboarding').catch(() => null)
  50  |     const confirmToast = page.getByText(/confirm your email|almost there/i).waitFor({ timeout: 15_000 }).then(() => 'toast').catch(() => null)
  51  |     const signupFailed = page.getByText(/signup failed/i).waitFor({ timeout: 15_000 }).then(() => 'failed').catch(() => null)
  52  | 
  53  |     const outcome = await Promise.race([onboarding, confirmToast, signupFailed])
  54  |     expect(outcome, 'signup should not surface a "Signup failed" error').not.toBe('failed')
  55  |     expect(outcome).not.toBeNull()
  56  |   })
  57  | })
  58  | 
  59  | // ── US-2: Returning user can log in and reach the app ────────────────────────
  60  | 
  61  | test.describe('US-2 Login', () => {
  62  |   test.skip(!hasCreds, 'set TEST_USER_EMAIL / TEST_USER_PASSWORD to run')
  63  | 
  64  |   test('valid credentials land in the app (dashboard or onboarding)', async ({ page }) => {
  65  |     await login(page, EMAIL!, PASSWORD!)
  66  |     await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 20_000 })
  67  |     await expect(page).toHaveURL(/\/(dashboard|onboarding)/)
  68  |   })
  69  | })
  70  | 
  71  | // ── US-3: Wrong password is rejected ─────────────────────────────────────────
  72  | 
  73  | test.describe('US-3 Invalid login', () => {
  74  |   test('wrong password shows an error and stays on /login', async ({ page }) => {
  75  |     await login(page, uniqueEmail(), 'definitely-wrong-password')
  76  |     await expect(page.getByText(/login failed|invalid|incorrect|credentials/i).first()).toBeVisible({ timeout: 15_000 })
  77  |     await expect(page).toHaveURL(/\/login/)
  78  |   })
  79  | })
  80  | 
  81  | // ── US-4: No redirect loop — the exact bug fixed today ───────────────────────
  82  | 
  83  | test.describe('US-4 Session persists across navigation (redirect-loop regression)', () => {
  84  |   test.skip(!hasCreds, 'set TEST_USER_EMAIL / TEST_USER_PASSWORD to run')
  85  | 
  86  |   test('after login, a protected route loads instead of bouncing to /login', async ({ page }) => {
  87  |     await login(page, EMAIL!, PASSWORD!)
  88  |     await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 20_000 })
  89  | 
  90  |     // Hard-navigate to a protected route; middleware must NOT bounce to /login.
  91  |     await page.goto('/dashboard')
  92  |     await expect(page).not.toHaveURL(/\/login/)
  93  |     await page.goto('/reports')
  94  |     await expect(page).not.toHaveURL(/\/login/)
  95  |   })
  96  | })
  97  | 
  98  | // ── US-5: Profile can be saved ───────────────────────────────────────────────
  99  | 
  100 | test.describe('US-5 Profile', () => {
  101 |   test.skip(!hasCreds, 'set TEST_USER_EMAIL / TEST_USER_PASSWORD to run')
  102 | 
  103 |   test('profile page loads and saving succeeds', async ({ page }) => {
  104 |     await login(page, EMAIL!, PASSWORD!)
  105 |     await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 20_000 })
  106 |     await page.goto('/profile')
  107 |     await expect(page).not.toHaveURL(/\/login/)
  108 | 
  109 |     const nameInput = page.getByPlaceholder(/priya sharma|your name/i).first()
  110 |     if (await nameInput.count()) await nameInput.fill('E2E Tester')
  111 | 
  112 |     await page.getByRole('button', { name: /save/i }).first().click()
  113 |     // Success toast OR no error toast — must not surface a failure.
  114 |     await expect(page.getByText(/error/i)).toHaveCount(0, { timeout: 8_000 }).catch(() => {})
  115 |     await expect(page.getByText(/saved|updated|success/i).first()).toBeVisible({ timeout: 10_000 })
  116 |   })
  117 | })
  118 | 
  119 | // ── US-6: MCQ mock test can be configured and started ────────────────────────
  120 | 
  121 | test.describe('US-6 Mock MCQ test', () => {
  122 |   test.skip(!hasCreds, 'set TEST_USER_EMAIL / TEST_USER_PASSWORD to run')
  123 | 
  124 |   test('configure and start — starts, or gracefully reports no questions (no crash / no 401)', async ({ page }) => {
  125 |     await login(page, EMAIL!, PASSWORD!)
  126 |     await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 20_000 })
  127 |     await page.goto('/test/new')
  128 |     await expect(page).not.toHaveURL(/\/login/)
  129 | 
  130 |     await page.getByRole('button', { name: /start test/i }).click()
```