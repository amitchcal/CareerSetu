# Master Context — CareerSetu

## Project
CareerSetu — an AI-powered mock interview practice app for Indian job seekers (freshers, exam aspirants, job switchers). Users practice voice-based mock interviews with an AI interviewer and receive structured, honest feedback.

## Tech Stack (fixed — do not deviate without asking)
- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui components
- **Backend:** Next.js API routes (no separate backend server for MVP — keep it monolithic)
- **Database + Auth + Storage:** Supabase (Postgres, phone OTP auth, storage bucket for audio files)
- **LLM:** Claude API (Anthropic) via `@anthropic-ai/sdk` — used for: generating interview questions, generating follow-up questions, generating structured feedback
- **Speech-to-Text:** Browser-native `MediaRecorder` API to capture audio → send to a hosted STT API. Use Deepgram (good Indian-English/Hindi accuracy, simple REST API, pay-per-use) unless told otherwise.
- **Text-to-Speech:** Use browser-native `SpeechSynthesis` API for MVP (zero cost, "good enough" for question playback) — do NOT integrate a paid TTS API yet.
- **Payments:** Razorpay (Checkout.js for UPI/card)
- **Deployment target:** Vercel (frontend + API routes), Supabase cloud (managed DB)

## Design System
- **Primary color:** Indigo/blue (`#4F46E5` as primary, Tailwind `indigo-600`)
- **Accent color:** Warm orange/amber for CTAs (`#F59E0B`, Tailwind `amber-500`) — to feel encouraging, not corporate
- **Typography:** `Inter` font (via `next/font/google`), headings semibold, body regular
- **Style:** Clean, mobile-first, generous whitespace, rounded-xl corners on cards, soft shadows — avoid dense/cluttered enterprise SaaS look. Use shadcn/ui defaults as the base and only customize colors.
- **Mobile-first:** Design for 375px width first, then scale up. Most users are on mid-range Android phones.

## Folder Structure Convention

```
/app
  /(marketing)        → public pages: landing, pricing, etc.
  /(auth)              → signup, login
  /(app)               → authenticated app pages: dashboard, interview, etc.
  /api                 → API routes
/components
  /ui                  → shadcn components (auto-generated)
  /shared              → Navbar, Footer, VoiceRecorder, etc.
/lib                   → supabase client, anthropic client, utils
/types                 → shared TypeScript types
```

## Database Schema (create via Supabase migration — implement exactly as below for MVP)

```sql
create table users (
  id uuid primary key default gen_random_uuid(),
  phone text unique not null,
  name text,
  email text,
  target_role text,
  experience_level text, -- 'fresher' | 'intermediate' | 'experienced'
  preferred_language text default 'english', -- 'english' | 'hindi' | 'hinglish'
  goal_type text, -- 'upcoming_interview' | 'general_practice' | 'campus_placement'
  target_interview_date date,
  referral_source text,
  onboarding_complete boolean default false,
  created_at timestamptz default now()
);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null,
  role text not null,
  difficulty text not null, -- 'fresher' | 'intermediate' | 'experienced'
  language text not null,
  num_questions int not null,
  status text default 'in_progress', -- 'in_progress' | 'completed' | 'abandoned'
  created_at timestamptz default now()
);

create table session_questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) not null,
  question_number int not null,
  question_text text not null,
  audio_response_url text,
  transcript text,
  created_at timestamptz default now()
);

create table session_feedback (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) not null unique,
  overall_score int, -- 1-10
  strengths jsonb,
  weaknesses jsonb,
  per_question_feedback jsonb,
  created_at timestamptz default now()
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null,
  plan text default 'free', -- 'free' | 'starter' | 'pro'
  status text default 'active', -- 'active' | 'cancelled' | 'past_due'
  renewal_date date,
  payment_gateway_ref text,
  created_at timestamptz default now()
);
```

## API Contracts (implement these exact shapes)

### `POST /api/interview/start`
- **Request:** `{ userId, role, difficulty, language, numQuestions }`
- **Response:** `{ sessionId, firstQuestion: string }`

### `POST /api/interview/[sessionId]/answer`
- **Request:** `{ questionNumber, audioBlob (multipart/form-data) }`
- **Server flow:** upload audio to Supabase storage → call Deepgram STT → store transcript → call Claude API with full session context to generate next question (or signal `isLastQuestion: true`)
- **Response:** `{ transcript: string, nextQuestion: string | null, isComplete: boolean }`

### `POST /api/interview/[sessionId]/feedback`
- **Request:** `{ sessionId }`
- **Server flow:** fetch all `session_questions` for this session → call Claude API with a structured rubric prompt → parse JSON response → store in `session_feedback`
- **Response:** `{ overallScore, strengths: string[], weaknesses: string[], perQuestionFeedback: Array<{questionNumber, feedback}> }`

## Claude API prompt template for feedback generation (use this exact structure in the API route):

```
You are an experienced, honest hiring manager evaluating a candidate's mock interview practice session.
Do NOT default to generic praise. Be specific and calibrated — point out real issues even if minor.

Role being interviewed for: {role}
Experience level: {difficulty}

Transcript of all Q&A:
{formatted_qa_pairs}

Evaluate using this rubric:
- Structure: Did answers follow a clear structure (e.g. STAR for behavioral questions)?
- Relevance: Did the answer actually address what was asked?
- Clarity: Was the answer concise and easy to follow, or rambling?
- Filler words / hedging: Note if present (e.g. "um", "like", excessive qualifiers).
- Confidence signals: Based on word choice, did the candidate sound confident or uncertain?

Return ONLY valid JSON in this exact shape, no markdown, no preamble:
{
  "overallScore": <integer 1-10>,
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "perQuestionFeedback": [
    {"questionNumber": 1, "feedback": "..."},
    ...
  ]
}
```

## Auth Flow
- Use Supabase phone auth (OTP via SMS)
- On successful OTP verification: check if user row exists in `users` table; if not, create one; check `onboarding_complete` — if false, redirect to `/onboarding/profile`; if true, redirect to `/dashboard`
- Use Supabase's client-side auth helpers for Next.js (`@supabase/ssr`) for session management across the app

## General Rules for All Pages
- Every page must be responsive and tested visually at 375px (mobile) and 1024px+ (desktop) widths
- Use loading skeletons (not blank screens) for any data-fetching state
- Use toast notifications (shadcn `toast` component) for errors and success confirmations
- All forms must have inline validation with clear error messages
- No page should be built with placeholder/lorem-ipsum content — use the actual copy provided in each page's prompt
