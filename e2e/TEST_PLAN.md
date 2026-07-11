# CareerSetu — E2E Regression Test Plan

Author: QA automation (Playwright) · Scope: full-application regression

## 1. Objective
Automated end-to-end regression coverage for every user-facing module of CareerSetu, so that
a change anywhere in auth, onboarding, or the practice/assessment surface is caught before
it reaches production — the way today's login/session/IDOR regressions should have been.

## 2. Test Framework
- **Playwright** (`@playwright/test`), TypeScript.
- Page Object Model in [`tests/e2e/pages/`](../tests/e2e/pages) for reusable flows (auth, onboarding).
- Shared fixture [`tests/e2e/fixtures.ts`](../tests/e2e/fixtures.ts) provides an `authedPage` that
  logs in once per test via a real test account — no mocked auth, so it exercises the real
  Supabase session + middleware path (the exact layer that broke in production this cycle).

## 3. Environments
| Env | Base URL | Notes |
|---|---|---|
| Production (deployed) | `PLAYWRIGHT_BASE_URL` env, defaults to `https://career-setu-eight.vercel.app` | default target |
| Local dev | `PLAYWRIGHT_BASE_URL=http://localhost:3000` | run against `npm run dev` |
| CI | GitHub Actions (`.github/workflows/e2e.yml`) | runs on push/PR to `main` |

The suite **cannot run from the Claude Code sandbox** — its network policy blocks `*.supabase.co`.
It must run from a developer machine or CI where Supabase is reachable.

## 4. Test Data
- **Signup tests** generate a unique email per run (`user+<timestamp>@domain`) — no manual cleanup needed, but Supabase Auth users accumulate over time (see §7 Housekeeping).
- **Authenticated-journey tests** need one persistent test account:
  ```
  TEST_USER_EMAIL=...
  TEST_USER_PASSWORD=...
  ```
  Without these set, all `authedPage`-based tests **skip** (not fail) — the suite stays green in environments without credentials, and CI reports which tests were skipped vs. passed.

## 5. Scope

### In scope (automated)
- Auth: signup, login, invalid login, session persistence across navigation, forgot password
- Onboarding: profile step, RLS/save regression guard
- Dashboard & Practice hub navigation
- MCQ mock test: config → start → question render, 401/500 regression guards
- Coding assessment: list → open problem
- Resume Builder: list, create (IDOR regression guard)
- Job search: form + search submission smoke
- Subscription: plan page renders current plan
- CV Analyzer: upload-zone render, Analyze button gating
- Video interview: config page renders
- Marketing pages, responsive @375px, theme toggle, unauthenticated route guards (existing `regression.spec.ts`)

### Out of scope (manual / not automated here)
- Actual voice/video recording and playback (needs real media devices — Playwright can fake a camera/mic feed but transcription quality can't be assertable)
- Live Razorpay payment completion (needs real payment instrument; automating a live charge is unsafe for regression runs)
- CV Analyzer's real AI analysis output content (subjective LLM output; only the UI gating is asserted here to avoid burning Anthropic quota on every CI run)
- Full MCQ answer-and-submit-with-scoring flow (depends on the question bank being seeded in the target environment; the suite asserts the *start* flow is not broken and skips scoring assertions when no questions exist)
- Admin panel (`/admin/*`) — requires an admin-allowlisted account; add once a dedicated admin test account exists
- Support ticket creation/email delivery (depends on Resend API key; not exercised to avoid sending real emails in CI)

## 6. Traceability Matrix

| ID | User story | Spec file | Regression it guards |
|---|---|---|---|
| US-1 | New user can sign up | `user-journeys.spec.ts` | — |
| US-2 | Returning user can log in | `user-journeys.spec.ts` | — |
| US-3 | Wrong password is rejected | `user-journeys.spec.ts` | — |
| US-4 | Session persists across navigation | `user-journeys.spec.ts` | **middleware redirect-loop** (session cookie present but `getUser()` bounced to `/login`) |
| US-5 | Profile can be saved | `user-journeys.spec.ts` | `users` RLS 403 on upsert |
| US-6 | Mock MCQ test can be started | `user-journeys.spec.ts`, `mcq-test.spec.ts` | **`test/start` 401** (corrupted server anon key / missing auth check) |
| US-7 | Reports page loads | `user-journeys.spec.ts` | — |
| US-8 | Practice hub links to all 3 modes | `practice-hub.spec.ts` | — |
| US-9 | Dashboard renders for authed user | `practice-hub.spec.ts` | — |
| US-10 | Coding assessment list & open | `coding.spec.ts` | — |
| US-11 | Resume Builder list & create | `resume-builder.spec.ts` | **`resume` route IDOR** (spoofable `userId` in body) |
| US-12 | Job search | `jobs.spec.ts` | — |
| US-13 | Subscription page | `subscription.spec.ts` | — |
| US-14 | CV Analyzer upload gating | `cv-analyzer.spec.ts` | — |
| US-15 | Video interview config | `video-interview.spec.ts` | **`video-interview/start` IDOR** (same class as US-11) |
| US-16 | Onboarding profile step | `onboarding.spec.ts` | `users.phone NOT NULL` blocking signup profile save |
| US-17 | Forgot password | `password-recovery.spec.ts` | — |
| — | Marketing/public smoke, unauth guards, theme, responsive | `regression.spec.ts` | — |

## 7. Housekeeping
- Signup tests (`US-1`, and any test using `uniqueEmail()`) create real Supabase Auth users each run. Periodically clear test accounts via **Supabase → Authentication → Users** (filter by the `TEST_SIGNUP_EMAIL_BASE` domain) to keep the project tidy.
- If "Confirm email" is re-enabled in Supabase, `US-1` still passes (it accepts the "confirm your email" toast as a valid outcome) but `US-2`/onward require a **pre-confirmed** `TEST_USER_EMAIL` account, since the suite doesn't have inbox access to click a confirmation link.

## 8. Entry / Exit Criteria
- **Entry:** target environment reachable, `TEST_USER_*` env vars set (for full run), Supabase auth config matches §7.
- **Exit (green build):** 100% pass or explicit skip (never fail) on all specs; any `unauthoris`, `500`, or RLS-permission text appearing in the UI during a flow is a **hard fail** by design, regardless of which spec encounters it.

## 9. Running

```bash
npm run test:e2e                 # smoke + non-authed specs (default: deployed URL)
npm run test:e2e:ui              # interactive runner
TEST_USER_EMAIL=... TEST_USER_PASSWORD=... npm run test:e2e   # full suite
npm run test:e2e:report          # open last HTML report
```

See [`e2e/README.md`](README.md) for CI configuration.
