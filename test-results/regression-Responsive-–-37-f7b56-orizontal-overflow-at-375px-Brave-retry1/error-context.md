# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: regression.spec.ts >> Responsive – 375px >> /about no horizontal overflow at 375px
- Location: tests\e2e\regression.spec.ts:179:9

# Error details

```
Error: page.goto: net::ERR_NAME_NOT_RESOLVED at https://thecareersetu.in/about
Call log:
  - navigating to "https://thecareersetu.in/about", waiting until "load"

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
  118 | test.describe('Theme toggle', () => {
  119 |   test('dark mode class toggled on html element', async ({ page }) => {
  120 |     await page.goto('/')
  121 |     // Find toggle button (aria-label contains "dark" or "light")
  122 |     const toggle = page.getByRole('button', { name: /switch to dark|switch to light|toggle theme/i }).first()
  123 |     // If not found by aria-label, fall back to Sun/Moon icon button
  124 |     const btn = (await toggle.count()) > 0
  125 |       ? toggle
  126 |       : page.locator('button').filter({ hasText: '' }).nth(0)
  127 | 
  128 |     const htmlEl = page.locator('html')
  129 |     const before = await htmlEl.getAttribute('class') ?? ''
  130 | 
  131 |     // Click toggle — we expect the class to change
  132 |     await page.evaluate(() => {
  133 |       // trigger via localStorage + class toggle as a fallback
  134 |       const btn = document.querySelector('[aria-label*="dark"], [aria-label*="light"], [aria-label*="theme"]') as HTMLElement
  135 |       btn?.click()
  136 |     })
  137 |     await page.waitForTimeout(300)
  138 |     const after = await htmlEl.getAttribute('class') ?? ''
  139 |     // Class should have changed (dark added or removed)
  140 |     expect(before).not.toEqual(after)
  141 |   })
  142 | })
  143 | 
  144 | // ── Navbar ────────────────────────────────────────────────────────────────────
  145 | 
  146 | test.describe('Navbar', () => {
  147 |   test('mobile menu opens and closes', async ({ page }) => {
  148 |     await page.setViewportSize({ width: 375, height: 812 })
  149 |     await page.goto('/')
  150 |     const menuBtn = page.getByRole('button', { name: /toggle menu|menu/i })
  151 |     await menuBtn.click()
  152 |     // Sheet/menu content should appear
  153 |     await expect(page.getByText('CareerSetu').nth(1)).toBeVisible()
  154 |   })
  155 | 
  156 |   test('footer renders on landing', async ({ page }) => {
  157 |     await page.goto('/')
  158 |     const footer = page.locator('footer')
  159 |     await expect(footer).toBeVisible()
  160 |   })
  161 | })
  162 | 
  163 | // ── Try / Demo page (no auth) ─────────────────────────────────────────────────
  164 | 
  165 | test.describe('Try page (no-signup demo)', () => {
  166 |   test('loads without redirect', async ({ page }) => {
  167 |     await page.goto('/try')
  168 |     // Should NOT redirect to login
  169 |     await expect(page).not.toHaveURL(/\/login/)
  170 |     await expect(page.locator('body')).toBeVisible()
  171 |   })
  172 | })
  173 | 
  174 | // ── Responsive smoke ──────────────────────────────────────────────────────────
  175 | 
  176 | test.describe('Responsive – 375px', () => {
  177 |   const pages = ['/', '/pricing', '/about', '/login']
  178 |   for (const p of pages) {
  179 |     test(`${p} no horizontal overflow at 375px`, async ({ page }) => {
  180 |       await page.setViewportSize({ width: 375, height: 812 })
> 181 |       await page.goto(p)
      |                  ^ Error: page.goto: net::ERR_NAME_NOT_RESOLVED at https://thecareersetu.in/about
  182 |       const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
  183 |       expect(bodyWidth).toBeLessThanOrEqual(390) // allow a tiny margin
  184 |     })
  185 |   }
  186 | })
  187 | 
```