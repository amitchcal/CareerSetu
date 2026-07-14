# CareerSetu — User Manual

*Covers all functionality built and shipped as of this version. Grounded in the actual application
routes and behavior — see* [`docs/USER_STORIES.md`](./USER_STORIES.md) *for the underlying story
list this manual expands on.*

---

## Before you start — Prerequisites

- A modern browser: Chrome, Firefox, Edge, or Brave (desktop or mobile). Safari is not officially
  verified.
- A stable internet connection (voice/video interviews stream audio to the server in real time).
- **Microphone access** for voice mock interviews, and **camera + microphone access** for video
  mock interviews — your browser will prompt for permission the first time; you must click
  **Allow**.
- A valid email address you can access, for signup and password reset.
- If signing in with Google: a Google account.
- Recommended screen width: any size works (the app is mobile-first, tested from 375px up), but a
  laptop/desktop is more comfortable for the Résumé Builder and CV Analyzer's dual-file view.

---

## 1. Getting started

### 1.1 Creating an account
**Prerequisite:** a valid email address.
1. Go to the CareerSetu homepage and click **Get Started** (or go directly to `/signup`).
2. Enter your full name, email, and a password (minimum 6 characters).
3. Click **Create account**.
4. If email confirmation is required, you'll see a message to confirm your email from your inbox
   before logging in. Otherwise you're signed in immediately and taken to onboarding.

### 1.2 Signing in
**Prerequisite:** an existing account.
1. Go to `/login`.
2. Enter your email and password, or click **Continue with Google**.
3. On success you're taken to your dashboard (or onboarding, if not yet completed).
4. Wrong credentials show an inline "Login failed" message — you remain on the login page.

### 1.3 Signing in with Google
**Prerequisite:** a Google account; Google Sign-In must be enabled on the site (admin-side
one-time setup).
1. On `/login` or `/signup`, click **Continue with Google**.
2. Choose your Google account in the popup/redirect screen.
3. You're redirected back into the app and signed in automatically.

### 1.4 Forgot password
**Prerequisite:** access to the email used at signup.
1. On `/login`, click **Forgot password?**
2. Enter your email and submit.
3. Check your inbox for a reset link, click it, and set a new password on the reset page.

### 1.5 Logging out
1. Click your profile menu in the navbar (desktop) or open the mobile menu.
2. Click **Logout**.
3. You're returned to the login page and your session is fully cleared.

---

## 2. Onboarding (first-time setup)

**Prerequisite:** a signed-in account with onboarding not yet completed (new accounts are routed
here automatically).

1. **Profile step** (`/onboarding/profile`) — enter your name, target role, experience level
   (fresher / intermediate / experienced), and preferred practice language (English / Hindi /
   Hinglish). If you're experienced, you may optionally paste résumé text so interviews can be
   grounded in your real background.
2. **Goal step** (`/onboarding/goal`) — tell the app your goal (upcoming interview / general
   practice / campus placement), your target interview date if any, and how you heard about
   CareerSetu.
3. **Optional sample interview** (`/onboarding/sample-interview`) — a short guided walkthrough of
   one practice question, so you see how a real session works before committing to a full one.
   This is not saved as a real session.
4. Once both steps are complete, you're taken to your **Dashboard**.

---

## 3. Voice Mock Interview

**Prerequisite:** microphone permission granted in your browser; a completed onboarding profile.

1. Go to **Practice → Voice Interview** (`/interview/new`).
2. Configure: role, difficulty, language, round type, and number of questions. If you selected
   "experienced" or a senior role, you'll be asked to paste a job description — this grounds the
   AI's follow-up questions in a real role.
3. Click **Start Interview**. The AI asks your first question — it's read aloud automatically.
4. Click the microphone button to record your spoken answer, then stop recording when done.
5. Your answer is transcribed automatically; the AI generates the next question based on what you
   said (a real follow-up, not a fixed script).
6. Repeat until all questions are answered — the app tells you when it's the last question.
7. After the final answer, you're taken to the **Feedback page**
   (`/interview/[sessionId]/feedback`) showing:
   - An overall score (1–10)
   - Strengths and weaknesses
   - Per-question feedback covering structure, relevance, clarity, filler words, and confidence
     signals.

---

## 4. Video Mock Interview

**Prerequisite:** camera **and** microphone permission granted; a completed onboarding profile.

1. Go to **Practice → Video Interview** (`/video-interview/new`).
2. Configure the session the same way as the voice interview.
3. Click **Start** — your camera feed appears on screen alongside the question.
4. Record and submit each answer the same way as the voice flow.
5. After the last question, view feedback on `/video-interview/[sessionId]/feedback` — this covers
   the same content rubric as the voice interview, with additional on-camera delivery signals.

---

## 5. MCQ Mock Test

**Prerequisite:** none beyond being signed in — no microphone/camera needed.

1. Go to **Practice → MCQ Test** (`/test/new`).
2. Choose track, company (optional), round type, difficulty, and test length (10, 20, or 30
   questions).
3. Click **Start Test** — you're placed on the test page with a countdown timer.
4. Answer each question by selecting an option; use **Previous/Next** to move between questions
   and change answers before time runs out.
5. Click **Submit** (or let the timer expire) to grade the test.
6. View your score and topic-wise breakdown on the results page.

**Note:** if no approved questions exist for the filter you chose, you'll see a "no approved
questions" message rather than a broken test — try a broader filter (e.g. remove the company
filter).

---

## 6. Coding Assessment

**Prerequisite:** none beyond being signed in.

1. Go to **Practice → Coding** (`/coding`).
2. Browse problems by difficulty and pick one.
3. Write your solution in the in-browser code editor.
4. Click **Run** to execute your code against the problem's test cases and see pass/fail results
   before final submission.

---

## 7. Question Bank

**Prerequisite:** none beyond being signed in.

1. Go to **Question Bank** (`/question-bank`).
2. Filter by track, company, round type, difficulty, and format (MCQ / open-ended).
3. For MCQ items, click to expand and reveal the correct option plus an explanation — useful for
   self-study outside of a timed test.

---

## 8. Résumé Builder

**Prerequisite:** none beyond being signed in.

1. Go to **Résumé Builder** (`/resume-builder`).
2. Click **New Résumé** — your first résumé is automatically marked as your default.
3. Fill in each section via the tabbed editor (`/resume-builder/[id]`): personal info, summary,
   work experience, education, skills, certifications, projects.
4. Click **Improve** on any section to get an AI-rewritten, stronger version of your bullets/summary.
5. Click **Preview** (`/resume-builder/[id]/preview`) to see the rendered résumé, then **Export** to
   download it as a DOCX file.
6. Optionally, pull insights from a completed interview session into your résumé via the
   session-insights link on a finished interview's feedback page.

---

## 9. Job Search & Tailoring

**Prerequisite:** a CV file (PDF or DOCX) ready to upload.

1. Go to **Jobs** (`/jobs`).
2. **Step 1 — Upload your CV.** Drag-and-drop or click to upload; the app extracts your skills
   automatically. The search form does not appear until this step is complete.
3. **Step 2 — Search.** Enter role, location, and experience level, then submit to see matching
   listings on `/jobs/results`.
4. From a specific listing, click **Tailor** to get a version of your résumé/pitch customized for
   that job (`/jobs/[jobId]/tailor`).

---

## 10. CV Analyzer

**Prerequisite:** both a job description file and your CV file, ready to upload.

1. Go to **CV Analyzer** (`/cv-analyzer`).
2. Upload the job description and your CV — the **Analyze** button stays disabled until both files
   are present.
3. Click **Analyze** to see the skill-gap breakdown between your CV and the job description.

---

## 11. Reports & Progress Tracking

**Prerequisite:** at least one completed interview or MCQ session, to have data to show.

1. Go to **Reports** (`/reports`).
2. View your full session history (interview, video, and MCQ tests) with dates and scores.
3. View your competency radar chart and score trend line chart, plus your strongest/weakest
   dimension and this-week vs. all-time session counts.

---

## 12. Subscription & Billing

**Prerequisite:** a UPI app or card for payment, if upgrading.

1. Go to **Subscription** (`/subscription`) to see your current plan (defaults to Free) and usage.
2. Click **Upgrade** to choose Starter (₹199), Pro (₹499), or a pay-per-session option (₹49–99).
3. Complete payment via Razorpay Checkout (UPI or card).
4. To cancel a paid plan, click **Cancel** and confirm in the dialog — you drop back to Free at
   the end of your billing period.

---

## 13. Profile & Account Management

**Prerequisite:** a signed-in account.

1. Go to **Profile** (`/profile`).
2. Update your name, target role, experience level, preferred language, and résumé text at any
   time — this is the same data you set during onboarding.
3. Your email is shown read-only (tied to your sign-in method) and cannot be changed here.

---

## 14. Support & Issue Reporting

**Prerequisite:** none — available from anywhere in the app while signed in.

1. Click the **Issue / Suggestion** button, always visible in the navbar.
2. Fill in your name, email, phone (optional), how critical the issue is (critical / major /
   medium / low / suggestion), and a description. Optionally attach a screenshot URL.
3. Submit — you'll receive a confirmation email with a ticket reference number you can use to
   refer back to your report.

---

## 15. Admin Functions

**Prerequisite:** your email must be on the site's admin allowlist (configured by the site owner,
not self-service).

1. Go to `/admin/questions` to generate new draft questions with AI for a chosen
   track/company/round/difficulty (up to 15 per batch), then **Approve** or **Reject** each draft.
   Only approved questions are ever shown to end users in tests or the question bank.
2. Go to `/admin/issues` to view and manage all submitted support tickets, filterable by status.

---

## Known limitations (as of this version)

- Google Sign-In requires one-time setup by the site owner in the Google Cloud Console and
  Supabase dashboard before the button will work.
- Text-to-speech for interview questions uses your browser's built-in voice — quality varies by
  browser/OS and is not a studio-quality voice.
- The MCQ and Coding question banks are still limited to the tracks currently seeded; broader exam
  categories (e.g. SSC, Bank PO, core engineering trades) are on the roadmap but not yet available.
- There is currently no live/human-paired mock interview or group discussion feature — all practice
  is solo, AI-driven.
