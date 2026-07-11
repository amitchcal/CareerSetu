# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: regression.spec.ts >> Marketing – Landing page >> loads, shows hero CTA, no JS errors
- Location: tests\e2e\regression.spec.ts:15:7

# Error details

```
Error: page.goto: net::ERR_NAME_NOT_RESOLVED at https://thecareersetu.in/
Call log:
  - navigating to "https://thecareersetu.in/", waiting until "load"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e6]:
    - heading "This site can’t be reached" [level=1] [ref=e7]
    - paragraph [ref=e8]:
      - strong [ref=e9]: thecareersetu.in
      - text: ’s DNS address could not be found. Diagnosing the problem.
    - generic [ref=e10]: DNS_PROBE_POSSIBLE
  - button "Reload" [ref=e13] [cursor=pointer]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | 
  3   | // ── helpers ──────────────────────────────────────────────────────────────────
  4   | 
  5   | async function noConsoleErrors(page: import('@playwright/test').Page) {
  6   |   const errors: string[] = []
  7   |   page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  8   |   page.on('pageerror', e => errors.push(e.message))
  9   |   return () => errors
  10  | }
  11  | 
  12  | // ── Marketing pages ───────────────────────────────────────────────────────────
  13  | 
  14  | test.describe('Marketing – Landing page', () => {
  15  |   test('loads, shows hero CTA, no JS errors', async ({ page }) => {
  16  |     const errs = await noConsoleErrors(page)
> 17  |     await page.goto('/')
      |                ^ Error: page.goto: net::ERR_NAME_NOT_RESOLVED at https://thecareersetu.in/
  18  |     await expect(page).toHaveTitle(/CareerSetu/i)
  19  |     // Hero heading visible
  20  |     await expect(page.locator('h1').first()).toBeVisible()
  21  |     // At least one CTA button
  22  |     const cta = page.getByRole('link', { name: /start free|get started|try now/i }).first()
  23  |     await expect(cta).toBeVisible()
  24  |     // Navbar brand visible
  25  |     await expect(page.getByText('CareerSetu').first()).toBeVisible()
  26  |     // No blocking JS errors
  27  |     expect(errs().filter(e => !e.includes('hydrat'))).toHaveLength(0)
  28  |   })
  29  | 
  30  |   test('navbar links render', async ({ page }) => {
  31  |     await page.goto('/')
  32  |     await expect(page.getByRole('link', { name: /pricing/i }).first()).toBeVisible()
  33  |   })
  34  | 
  35  |   test('no broken images on landing', async ({ page }) => {
  36  |     await page.goto('/')
  37  |     const imgs = await page.$$eval('img', els =>
  38  |       els.map(i => ({ src: i.src, ok: (i as HTMLImageElement).naturalWidth > 0 }))
  39  |     )
  40  |     // SVGs report naturalWidth=0 in Firefox even when loaded — exclude them
  41  |     const broken = imgs.filter(i => !i.ok && !i.src.includes('data:') && !i.src.endsWith('.svg'))
  42  |     expect(broken).toHaveLength(0)
  43  |   })
  44  | })
  45  | 
  46  | test.describe('Marketing – Pricing', () => {
  47  |   test('loads and shows plan cards', async ({ page }) => {
  48  |     await page.goto('/pricing')
  49  |     await expect(page).toHaveTitle(/pricing|plans/i)
  50  |     // Expect at least 2 plan headings (Free + paid)
  51  |     const cards = page.locator('[class*="card"], [class*="plan"], section').filter({ hasText: /free|starter|pro/i })
  52  |     await expect(cards.first()).toBeVisible()
  53  |   })
  54  | })
  55  | 
  56  | test.describe('Marketing – About', () => {
  57  |   test('loads without error', async ({ page }) => {
  58  |     const errs = await noConsoleErrors(page)
  59  |     await page.goto('/about')
  60  |     await expect(page.locator('h1').first()).toBeVisible()
  61  |     expect(errs().filter(e => !e.includes('hydrat'))).toHaveLength(0)
  62  |   })
  63  | })
  64  | 
  65  | test.describe('Marketing – Privacy & Terms', () => {
  66  |   test('privacy page loads', async ({ page }) => {
  67  |     await page.goto('/privacy')
  68  |     await expect(page.locator('h1').first()).toBeVisible()
  69  |   })
  70  |   test('terms page loads', async ({ page }) => {
  71  |     await page.goto('/terms')
  72  |     await expect(page.locator('h1').first()).toBeVisible()
  73  |   })
  74  | })
  75  | 
  76  | // ── Auth pages ────────────────────────────────────────────────────────────────
  77  | 
  78  | test.describe('Auth – Login / Signup', () => {
  79  |   test('login page loads without redirect', async ({ page }) => {
  80  |     await page.goto('/login', { waitUntil: 'networkidle' })
  81  |     await expect(page).not.toHaveURL(/\/dashboard/)
  82  |     // Page content rendered (hydrated)
  83  |     await expect(page.locator('body')).not.toBeEmpty()
  84  |     await expect(page.getByText('CareerSetu').first()).toBeVisible({ timeout: 10000 })
  85  |   })
  86  | 
  87  |   test('signup page loads without redirect', async ({ page }) => {
  88  |     await page.goto('/signup', { waitUntil: 'networkidle' })
  89  |     await expect(page).not.toHaveURL(/\/dashboard/)
  90  |     await expect(page.locator('body')).not.toBeEmpty()
  91  |   })
  92  | })
  93  | 
  94  | // ── Redirect behaviour for protected routes ───────────────────────────────────
  95  | 
  96  | test.describe('Auth guard – unauthenticated redirects', () => {
  97  |   const protectedRoutes = [
  98  |     '/dashboard',
  99  |     '/practice',
  100 |     '/reports',
  101 |     '/resume-builder',
  102 |     '/jobs',
  103 |     '/profile',
  104 |     '/subscription',
  105 |     '/question-bank',
  106 |   ]
  107 | 
  108 |   for (const route of protectedRoutes) {
  109 |     test(`${route} → redirects to /login`, async ({ page }) => {
  110 |       await page.goto(route)
  111 |       await expect(page).toHaveURL(/\/login/)
  112 |     })
  113 |   }
  114 | })
  115 | 
  116 | // ── Theme toggle ──────────────────────────────────────────────────────────────
  117 | 
```