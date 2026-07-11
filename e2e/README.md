# CareerSetu — E2E Regression Suite

Playwright tests live in [`tests/e2e/`](../tests/e2e). Config: [`playwright.config.ts`](../playwright.config.ts).
Full test plan and traceability matrix: [`e2e/TEST_PLAN.md`](TEST_PLAN.md).

## What's covered

| File | Scope |
|------|-------|
| `tests/e2e/regression.spec.ts` | **Smoke** — marketing pages, auth pages render, unauthenticated route guards, theme toggle, navbar, responsive @375px |
| `tests/e2e/user-journeys.spec.ts` | Signup, login, invalid-login, **redirect-loop regression**, profile save, MCQ mock test start, reports |
| `tests/e2e/onboarding.spec.ts` | Profile step render + save (RLS/NOT NULL regression guard) |
| `tests/e2e/practice-hub.spec.ts` | Dashboard + Practice hub navigation to all 3 modes |
| `tests/e2e/mcq-test.spec.ts` | MCQ config → start → question render (401 regression guard) |
| `tests/e2e/coding.spec.ts` | Coding problem list → open problem |
| `tests/e2e/resume-builder.spec.ts` | Resume list + create (IDOR regression guard) |
| `tests/e2e/jobs.spec.ts` | Job search form + submission smoke |
| `tests/e2e/subscription.spec.ts` | Plan page renders current plan |
| `tests/e2e/cv-analyzer.spec.ts` | Upload-zone render, Analyze button gating |
| `tests/e2e/video-interview.spec.ts` | Config page render (IDOR regression guard) |
| `tests/e2e/password-recovery.spec.ts` | Forgot-password request flow |

Page objects live in [`tests/e2e/pages/`](../tests/e2e/pages); shared login/fixtures in [`tests/e2e/fixtures.ts`](../tests/e2e/fixtures.ts).
Every user-journey test maps to a user story (US-1 … US-17) — see the traceability matrix in `TEST_PLAN.md` for which regression each one guards.

## Running

```bash
# against the deployed app (default)
npm run test:e2e

# against a local dev server
PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e

# interactive
npm run test:e2e:ui

# open the last HTML report
npm run test:e2e:report
```

### Base URL
Set `PLAYWRIGHT_BASE_URL` (defaults to `https://career-setu-eight.vercel.app`).

### Authenticated tests
US-2, US-4, US-5, US-6, US-7 need a real account. Provide:

```bash
export TEST_USER_EMAIL="you+e2e@example.com"
export TEST_USER_PASSWORD="your-password"
```

Without these, those tests **skip** (the suite still runs smoke + signup + invalid-login).

## Prerequisites for a fully green run
- **Supabase → Auth → Confirm email = OFF** (so signup logs in instantly; otherwise US-1 asserts the "confirm your email" path instead).
- **Question bank** has ≥1 approved MCQ for the track used, else US-6 asserts the graceful "no approved questions" path.
- The 3 server env vars (`SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `DEEPGRAM_API_KEY`) set on the target deployment.

## CI
[`.github/workflows/e2e.yml`](../.github/workflows/e2e.yml) runs the suite on every push/PR to `main`.
Configure in the repo:
- Variable `PLAYWRIGHT_BASE_URL` (optional; defaults to the deployed URL)
- Secrets `TEST_USER_EMAIL`, `TEST_USER_PASSWORD` (optional; enables authenticated journeys)

## Note on the sandbox
These tests must run where Supabase (`*.supabase.co`) is reachable — CI or your machine. They cannot be executed from the Claude Code remote sandbox, whose network policy blocks outbound Supabase traffic.
