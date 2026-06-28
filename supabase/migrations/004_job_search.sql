-- Job search feature tables

create table if not exists job_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null,
  query text not null,
  location text,
  extracted_skills jsonb,
  created_at timestamptz default now()
);

create table if not exists job_results (
  id uuid primary key default gen_random_uuid(),
  search_id uuid references job_searches(id) not null,
  external_job_id text,
  title text not null,
  company text not null,
  location text,
  description text,
  apply_url text not null,
  source text,
  match_score int,
  matched_skills jsonb,
  missing_skills jsonb,
  created_at timestamptz default now()
);

create table if not exists tailored_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null,
  job_result_id uuid references job_results(id) not null,
  original_cv_text text,
  tailored_summary text,
  tailored_bullets jsonb,
  keywords_added jsonb,
  upskilling_suggestions jsonb,
  created_at timestamptz default now()
);

-- Indexes for common queries
create index if not exists job_searches_user_id_idx on job_searches(user_id);
create index if not exists job_results_search_id_idx on job_results(search_id);
create index if not exists job_results_match_score_idx on job_results(match_score desc);
create index if not exists tailored_profiles_user_job_idx on tailored_profiles(user_id, job_result_id);

-- RLS
alter table job_searches enable row level security;
alter table job_results enable row level security;
alter table tailored_profiles enable row level security;

create policy "Users can manage own job searches"
  on job_searches for all using (auth.uid() = user_id);

create policy "Users can read job results for own searches"
  on job_results for all using (
    search_id in (select id from job_searches where user_id = auth.uid())
  );

create policy "Users can manage own tailored profiles"
  on tailored_profiles for all using (auth.uid() = user_id);
