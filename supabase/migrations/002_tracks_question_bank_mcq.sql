-- CareerSetu — P0.1: content tracks, question bank, timed MCQ tests
-- Adds the foundation for grouped practice (mock interview + MCQ) across skill tracks.
-- RLS is left DISABLED on these tables: all writes go through Next.js API routes that
-- already verify the user via supabase.auth, consistent with sessions/session_questions.

-- ─── Content tracks ────────────────────────────────────────────────────────────
create table if not exists tracks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  category text not null, -- 'software' | 'project_mgmt' | 'agile' | 'business_analyst' | 'hr'
  parent_id uuid references tracks(id), -- null = top-level track/group; set = sub-track
  description text,
  icon text,
  seniority_levels text[] default array['fresher','intermediate','experienced','lead'],
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

create index if not exists tracks_parent_idx on tracks(parent_id);

-- ─── Companies (interview patterns) ─────────────────────────────────────────────
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  logo_url text,
  interview_style_notes text,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ─── Question bank (interview + MCQ) ────────────────────────────────────────────
create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  track_id uuid references tracks(id) not null,
  company_id uuid references companies(id), -- nullable: generic questions
  format text not null, -- 'interview' | 'mcq'
  round_type text not null, -- 'technical' | 'hr' | 'managerial' | 'aptitude' | 'domain'
  difficulty text not null, -- 'fresher' | 'intermediate' | 'experienced'
  question_text text not null,
  options jsonb, -- mcq only: ["opt a", "opt b", "opt c", "opt d"]
  correct_option int, -- mcq only: 0-based index into options
  explanation text, -- mcq: why correct; interview: ideal-answer key points
  tags text[] default '{}',
  source_note text, -- e.g. "modelled on TCS NQT technical pattern"
  status text default 'draft', -- 'draft' | 'approved' (only approved is served)
  created_at timestamptz default now()
);

create index if not exists questions_track_idx on questions(track_id);
create index if not exists questions_company_idx on questions(company_id);
create index if not exists questions_filters_idx
  on questions(format, round_type, difficulty, status);

-- ─── Timed MCQ tests ────────────────────────────────────────────────────────────
create table if not exists mcq_tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null,
  track_id uuid references tracks(id) not null,
  company_id uuid references companies(id),
  num_questions int not null,
  duration_seconds int not null,
  job_title text, -- experienced/lead: target role title
  job_description text, -- experienced/lead: JD text used to bias question selection
  status text default 'in_progress', -- 'in_progress' | 'submitted' | 'expired'
  score int, -- number correct
  started_at timestamptz default now(),
  submitted_at timestamptz
);

create index if not exists mcq_tests_user_idx on mcq_tests(user_id);

create table if not exists mcq_test_questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid references mcq_tests(id) not null,
  question_id uuid references questions(id) not null,
  user_answer int, -- 0-based index, null = unanswered
  is_correct boolean,
  time_spent_seconds int,
  position int not null
);

create index if not exists mcq_test_questions_test_idx on mcq_test_questions(test_id);

-- ─── Extend existing tables ─────────────────────────────────────────────────────
alter table sessions add column if not exists track_id uuid references tracks(id);
alter table sessions add column if not exists company_id uuid references companies(id);
alter table sessions add column if not exists round_type text; -- 'technical' | 'hr' | 'managerial' | 'domain'
alter table sessions add column if not exists seniority text; -- 'fresher' | 'intermediate' | 'experienced' | 'lead'
alter table sessions add column if not exists job_title text; -- experienced/lead: target role title
alter table sessions add column if not exists job_description text; -- experienced/lead: JD text used to tailor questions

alter table session_feedback add column if not exists competency_scores jsonb; -- { "communication": 7, ... }

-- Résumé on the user profile (stored once, reused to tailor questions for experienced/lead) — P3.2
alter table users add column if not exists resume_text text;
alter table users add column if not exists resume_url text;

-- Measured delivery metrics per answer (computed from audio + transcript) — P4.4
alter table session_questions add column if not exists answer_duration_seconds numeric;
alter table session_questions add column if not exists words_per_minute numeric;
alter table session_questions add column if not exists filler_count int;
alter table session_questions add column if not exists filler_words jsonb; -- { "um": 4, "like": 2 }

-- ─── RLS: disabled (API-route enforced) ─────────────────────────────────────────
alter table tracks disable row level security;
alter table companies disable row level security;
alter table questions disable row level security;
alter table mcq_tests disable row level security;
alter table mcq_test_questions disable row level security;

-- ─── Seed: top-level tracks (groups + leaves) ───────────────────────────────────
insert into tracks (name, slug, category, description, icon, seniority_levels, sort_order) values
  ('Software Technologies', 'software-technologies', 'software',
   'Languages, frameworks, databases, cloud and QA — grouped by discipline.',
   'code', array['fresher','intermediate','experienced','lead'], 1),
  ('IT Project Management', 'it-project-management', 'project_mgmt',
   'SDLC, estimation, risk, stakeholder and delivery management for PM and delivery roles.',
   'kanban', array['intermediate','experienced','lead'], 2),
  ('Scrum Master / Agile', 'scrum-master-agile', 'agile',
   'Scrum framework, ceremonies, SAFe, Kanban and team facilitation.',
   'refresh', array['intermediate','experienced','lead'], 3),
  ('Business Analyst', 'business-analyst', 'business_analyst',
   'Requirements, BRD/FRD and analysis — grouped by industry domain.',
   'clipboard', array['fresher','intermediate','experienced','lead'], 4),
  ('HR Round', 'hr-round', 'hr',
   'Behavioural, situational and culture-fit questions that apply across every role.',
   'users', array['fresher','intermediate','experienced','lead'], 5)
on conflict (slug) do nothing;

-- ─── Seed: Software Technologies sub-tracks ─────────────────────────────────────
insert into tracks (name, slug, category, parent_id, description, icon, seniority_levels, sort_order)
select v.name, v.slug, 'software',
       (select id from tracks where slug = 'software-technologies'),
       v.description, v.icon, array['fresher','intermediate','experienced','lead'], v.sort_order
from (values
  ('Programming Fundamentals', 'software-fundamentals', 'DSA, OOP and core language concepts.', 'binary', 1),
  ('Frontend', 'software-frontend', 'React, Angular, Vue and modern web UI.', 'browser', 2),
  ('Backend', 'software-backend', 'Node.js, Spring Boot, .NET and API design.', 'server', 3),
  ('Databases', 'software-databases', 'SQL, NoSQL, modelling and query optimisation.', 'database', 4),
  ('Cloud & DevOps', 'software-cloud-devops', 'AWS, Azure, Docker, Kubernetes and CI/CD.', 'cloud', 5),
  ('QA & Testing', 'software-qa-testing', 'Manual, automation, Selenium and test strategy.', 'test-pipe', 6)
) as v(name, slug, description, icon, sort_order)
on conflict (slug) do nothing;

-- ─── Seed: Business Analyst domain sub-tracks ───────────────────────────────────
insert into tracks (name, slug, category, parent_id, description, icon, seniority_levels, sort_order)
select v.name, v.slug, 'business_analyst',
       (select id from tracks where slug = 'business-analyst'),
       v.description, 'clipboard', array['fresher','intermediate','experienced','lead'], v.sort_order
from (values
  ('BFSI', 'ba-bfsi', 'Banking and financial services analysis.', 1),
  ('Insurance', 'ba-insurance', 'Policy, claims and underwriting analysis.', 2),
  ('Healthcare', 'ba-healthcare', 'Providers, payers and clinical workflows.', 3),
  ('Retail / E-commerce', 'ba-retail', 'Commerce, catalogue, orders and fulfilment.', 4),
  ('Travel', 'ba-travel', 'Booking, fares, GDS and travel operations.', 5),
  ('Manufacturing', 'ba-manufacturing', 'Supply chain, MES and production planning.', 6),
  ('Life Sciences', 'ba-life-sciences', 'Pharma, clinical trials and regulatory compliance.', 7)
) as v(name, slug, description, sort_order)
on conflict (slug) do nothing;

-- ─── Seed: leading IT companies (interview patterns) ────────────────────────────
insert into companies (name, slug, interview_style_notes, sort_order) values
  ('TCS', 'tcs', 'NQT-style aptitude + technical fundamentals; structured HR round.', 1),
  ('Infosys', 'infosys', 'Strong CS fundamentals, problem-solving and communication focus.', 2),
  ('Wipro', 'wipro', 'Elite/NTH patterns; coding basics, aptitude and managerial round.', 3),
  ('Accenture', 'accenture', 'Cognitive + technical assessment, then behavioural interview.', 4),
  ('Cognizant', 'cognizant', 'GenC pattern: aptitude, technical MCQs and HR fit.', 5),
  ('Capgemini', 'capgemini', 'Pseudo-code, game-based aptitude and behavioural rounds.', 6),
  ('HCLTech', 'hcltech', 'Technical depth for experienced roles; project and domain probing.', 7),
  ('Tech Mahindra', 'tech-mahindra', 'Aptitude, technical fundamentals and communication round.', 8)
on conflict (slug) do nothing;
