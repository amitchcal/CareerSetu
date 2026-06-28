-- ============================================================
-- CareerSetu — Full Database Migration
-- Run this entire script in Supabase SQL Editor
-- (Dashboard → SQL Editor → New query → paste → Run)
-- ============================================================

-- ─── TRACKS ────────────────────────────────────────────────
create table if not exists tracks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,         -- 'technical' | 'hr' | 'domain' | null
  parent_id uuid references tracks(id),
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Seed common interview tracks
insert into tracks (name, category, sort_order) values
  ('Software Engineering', 'technical', 1),
  ('Data Science & ML', 'technical', 2),
  ('Product Management', 'domain', 3),
  ('Marketing', 'domain', 4),
  ('Sales', 'domain', 5),
  ('Finance & Accounting', 'domain', 6),
  ('Human Resources', 'hr', 7),
  ('Operations', 'domain', 8),
  ('Consulting', 'domain', 9),
  ('General / HR Round', 'hr', 10)
on conflict do nothing;

-- ─── COMPANIES ─────────────────────────────────────────────
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  interview_style_notes text,
  sort_order int default 0,
  created_at timestamptz default now()
);

insert into companies (name, sort_order) values
  ('TCS', 1),
  ('Infosys', 2),
  ('Wipro', 3),
  ('HCL Technologies', 4),
  ('Tech Mahindra', 5),
  ('Cognizant', 6),
  ('Accenture', 7),
  ('IBM India', 8),
  ('Amazon India', 9),
  ('Google India', 10),
  ('Microsoft India', 11),
  ('Flipkart', 12),
  ('Zomato', 13),
  ('Swiggy', 14),
  ('Paytm', 15),
  ('HDFC Bank', 16),
  ('ICICI Bank', 17)
on conflict do nothing;

-- ─── ALTER USERS ───────────────────────────────────────────
alter table users
  add column if not exists resume_text text;

-- ─── ALTER SESSIONS ────────────────────────────────────────
alter table sessions
  add column if not exists track_id uuid references tracks(id),
  add column if not exists company_id uuid references companies(id),
  add column if not exists round_type text,        -- 'technical' | 'hr' | 'managerial' | 'domain'
  add column if not exists seniority text,          -- 'fresher' | 'intermediate' | 'experienced' | 'lead'
  add column if not exists job_title text,
  add column if not exists job_description text,
  add column if not exists resume_snapshot text;

-- ─── ALTER SESSION_QUESTIONS ───────────────────────────────
alter table session_questions
  add column if not exists answer_duration_seconds numeric,
  add column if not exists words_per_minute numeric,
  add column if not exists filler_count int,
  add column if not exists filler_words jsonb;

-- ─── ALTER SESSION_FEEDBACK ────────────────────────────────
alter table session_feedback
  add column if not exists competency_scores jsonb;

-- ─── RESUMES ───────────────────────────────────────────────
create table if not exists resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null,
  title text not null default 'My Resume',
  is_default boolean default false,
  -- Personal info
  personal_info jsonb default '{}',
  summary text,
  -- Sections as JSONB arrays
  work_experience jsonb default '[]',
  education jsonb default '[]',
  skills jsonb default '[]',
  certifications jsonb default '[]',
  projects jsonb default '[]',
  -- Target role for AI improvement
  target_role text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-update updated_at
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists resumes_updated_at on resumes;
create trigger resumes_updated_at
  before update on resumes
  for each row execute function update_updated_at_column();

-- ─── JOB SEARCHES ──────────────────────────────────────────
create table if not exists job_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null,
  query text not null,
  location text,
  extracted_skills jsonb default '[]',
  created_at timestamptz default now()
);

-- ─── JOB RESULTS ───────────────────────────────────────────
create table if not exists job_results (
  id uuid primary key default gen_random_uuid(),
  search_id uuid references job_searches(id) on delete cascade,
  external_job_id text,
  title text,
  company text,
  location text,
  description text,
  apply_url text,
  source text,
  match_score int,
  matched_skills jsonb default '[]',
  missing_skills jsonb default '[]',
  created_at timestamptz default now()
);

-- ─── TAILORED PROFILES ─────────────────────────────────────
create table if not exists tailored_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null,
  job_result_id uuid references job_results(id),
  original_cv_text text,
  tailored_summary text,
  tailored_bullets jsonb default '[]',
  keywords_added jsonb default '[]',
  upskilling_suggestions jsonb default '[]',
  created_at timestamptz default now(),
  unique(user_id, job_result_id)
);

-- ─── SUPPORT TICKETS ───────────────────────────────────────
create table if not exists support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_ref text unique not null default 'TKT-' || upper(substring(gen_random_uuid()::text, 1, 8)),
  user_id uuid references users(id),
  name text,
  email text,
  subject text not null,
  description text not null,
  status text default 'open',        -- 'open' | 'in_progress' | 'closed'
  admin_comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

drop trigger if exists tickets_updated_at on support_tickets;
create trigger tickets_updated_at
  before update on support_tickets
  for each row execute function update_updated_at_column();

-- ─── ROW LEVEL SECURITY ────────────────────────────────────
-- Enable RLS on new tables (Supabase best practice)
alter table tracks enable row level security;
alter table companies enable row level security;
alter table resumes enable row level security;
alter table job_searches enable row level security;
alter table job_results enable row level security;
alter table tailored_profiles enable row level security;
alter table support_tickets enable row level security;

-- Public read for tracks and companies (needed for interview setup page)
create policy if not exists "tracks_public_read" on tracks for select using (true);
create policy if not exists "companies_public_read" on companies for select using (true);

-- Users can only access their own data
create policy if not exists "resumes_own" on resumes for all using (auth.uid() = user_id);
create policy if not exists "job_searches_own" on job_searches for all using (auth.uid() = user_id);
create policy if not exists "job_results_own" on job_results for all using (
  search_id in (select id from job_searches where user_id = auth.uid())
);
create policy if not exists "tailored_profiles_own" on tailored_profiles for all using (auth.uid() = user_id);
create policy if not exists "support_tickets_own" on support_tickets for all using (auth.uid() = user_id or user_id is null);

-- ─── STORAGE BUCKET ────────────────────────────────────────
-- Create interview-audio bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('interview-audio', 'interview-audio', true)
on conflict (id) do nothing;
