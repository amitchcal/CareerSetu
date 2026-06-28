-- Resume Builder tables

create table if not exists resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null,
  title text not null default 'My Resume',
  personal_info jsonb default '{}'::jsonb,
  -- { name, email, phone, location, linkedin, github, website }
  summary text,
  work_experience jsonb default '[]'::jsonb,
  -- [{ id, company, role, location, start_date, end_date, is_current, bullets: string[] }]
  education jsonb default '[]'::jsonb,
  -- [{ id, institution, degree, field, graduation_year, grade }]
  skills jsonb default '{"technical":[],"soft":[]}'::jsonb,
  certifications jsonb default '[]'::jsonb,
  -- [{ id, name, issuer, year }]
  projects jsonb default '[]'::jsonb,
  -- [{ id, name, description, link, tech: string[] }]
  is_default boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table resumes enable row level security;

create policy "Users can manage own resumes" on resumes
  for all using (auth.uid()::text = user_id::text);

-- Ensure only one default resume per user
create unique index if not exists resumes_user_default_idx
  on resumes (user_id) where is_default = true;

-- Add resume_id FK to job_results if that table exists
do $$ begin
  if exists (select 1 from information_schema.tables where table_name = 'job_results') then
    alter table job_results add column if not exists applied_resume_id uuid references resumes(id);
  end if;
end $$;

-- Function to auto-update updated_at
create or replace function update_resume_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger resume_updated_at
  before update on resumes
  for each row execute function update_resume_updated_at();
