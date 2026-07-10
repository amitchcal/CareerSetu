# CareerSetu — E2E Regression Suite

Playwright tests live in [`tests/e2e/`](../tests/e2e). Config: [`playwright.config.ts`](../playwright.config.ts).

## What's covered

| File | Scope |
|------|-------|
| `tests/e2e/regression.spec.ts` | **Smoke** — marketing pages, auth pages render, unauthenticated route guards, theme toggle, navbar, responsive @375px |
| `tests/e2e/user-journeys.spec.ts` | **User stories** — signup, login, invalid-login, **redirect-loop regression**, profile save, MCQ mock test start, reports |

Each user-journey test maps to a user story (US-1 … US-7) and is tagged in its `describe` title.

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
