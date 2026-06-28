-- ============================================================
-- CareerSetu — Full Database Migration
-- Run this entire script in Supabase SQL Editor
-- (Dashboard → SQL Editor → New query → paste → Run)
-- ============================================================

-- ─── TRACKS ────────────────────────────────────────────────
create table if not exists tracks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  category text,         -- 'technical' | 'hr' | 'domain' | null
  parent_id uuid references tracks(id),
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Add slug column if table already existed without it
alter table tracks add column if not exists slug text;
alter table tracks add constraint if not exists tracks_slug_unique unique (slug);

-- Seed common interview tracks (skip if slug already exists)
insert into tracks (name, slug, category, sort_order) values
  ('Software Engineering', 'software-engineering', 'technical', 1),
  ('Data Science & ML', 'data-science-ml', 'technical', 2),
  ('Product Management', 'product-management', 'domain', 3),
  ('Marketing', 'marketing', 'domain', 4),
  ('Sales', 'sales', 'domain', 5),
  ('Finance & Accounting', 'finance-accounting', 'domain', 6),
  ('Human Resources', 'human-resources', 'hr', 7),
  ('Operations', 'operations', 'domain', 8),
  ('Consulting', 'consulting', 'domain', 9),
  ('General / HR Round', 'general-hr', 'hr', 10)
on conflict (slug) do nothing;

-- ─── COMPANIES ─────────────────────────────────────────────
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  interview_style_notes text,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Add slug column if table already existed without it
alter table companies add column if not exists slug text;
alter table companies add constraint if not exists companies_slug_unique unique (slug);

insert into companies (name, slug, sort_order)
select name, slug, sort_order from (values
  ('TCS', 'tcs', 1),
  ('Infosys', 'infosys', 2),
  ('Wipro', 'wipro', 3),
  ('HCL Technologies', 'hcl-technologies', 4),
  ('Tech Mahindra', 'tech-mahindra', 5),
  ('Cognizant', 'cognizant', 6),
  ('Accenture', 'accenture', 7),
  ('IBM India', 'ibm-india', 8),
  ('Amazon India', 'amazon-india', 9),
  ('Google India', 'google-india', 10),
  ('Microsoft India', 'microsoft-india', 11),
  ('Flipkart', 'flipkart', 12),
  ('Zomato', 'zomato', 13),
  ('Swiggy', 'swiggy', 14),
  ('Paytm', 'paytm', 15),
  ('HDFC Bank', 'hdfc-bank', 16),
  ('ICICI Bank', 'icici-bank', 17)
) as v(name, slug, sort_order)
where not exists (select 1 from companies where companies.slug = v.slug);

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
  phone text,
  criticality text,                  -- 'critical' | 'major' | 'medium' | 'low' | 'suggestion'
  description text not null,
  screenshot_url text,
  status text default 'open',        -- 'open' | 'in_progress' | 'closed'
  admin_comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add missing columns if table already existed (or was created with old schema)
alter table support_tickets add column if not exists phone text;
alter table support_tickets add column if not exists criticality text;
alter table support_tickets add column if not exists screenshot_url text;
-- Make subject nullable (old schema had it NOT NULL but API doesn't use it)
alter table support_tickets alter column subject drop not null;

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
do $$ begin
  if not exists (select 1 from pg_policies where tablename='tracks' and policyname='tracks_public_read') then
    create policy "tracks_public_read" on tracks for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='companies' and policyname='companies_public_read') then
    create policy "companies_public_read" on companies for select using (true);
  end if;
end $$;

-- Users can only access their own data
do $$ begin
  if not exists (select 1 from pg_policies where tablename='resumes' and policyname='resumes_own') then
    create policy "resumes_own" on resumes for all using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='job_searches' and policyname='job_searches_own') then
    create policy "job_searches_own" on job_searches for all using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='job_results' and policyname='job_results_own') then
    create policy "job_results_own" on job_results for all using (
      search_id in (select id from job_searches where user_id = auth.uid())
    );
  end if;
  if not exists (select 1 from pg_policies where tablename='tailored_profiles' and policyname='tailored_profiles_own') then
    create policy "tailored_profiles_own" on tailored_profiles for all using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='support_tickets' and policyname='support_tickets_own') then
    create policy "support_tickets_own" on support_tickets for all using (auth.uid() = user_id or user_id is null);
  end if;
end $$;

-- ─── STORAGE BUCKET ────────────────────────────────────────
-- Create interview-audio bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('interview-audio', 'interview-audio', true)
on conflict (id) do nothing;
