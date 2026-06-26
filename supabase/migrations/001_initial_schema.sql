-- CareerSetu initial schema

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  phone text unique not null,
  name text,
  email text,
  target_role text,
  experience_level text,
  preferred_language text default 'english',
  goal_type text,
  target_interview_date date,
  referral_source text,
  onboarding_complete boolean default false,
  created_at timestamptz default now()
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null,
  role text not null,
  difficulty text not null,
  language text not null,
  num_questions int not null,
  status text default 'in_progress',
  created_at timestamptz default now()
);

create table if not exists session_questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) not null,
  question_number int not null,
  question_text text not null,
  audio_response_url text,
  transcript text,
  created_at timestamptz default now()
);

create table if not exists session_feedback (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) not null unique,
  overall_score int,
  strengths jsonb,
  weaknesses jsonb,
  per_question_feedback jsonb,
  created_at timestamptz default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null,
  plan text default 'free',
  status text default 'active',
  renewal_date date,
  payment_gateway_ref text,
  created_at timestamptz default now()
);

-- Row Level Security
alter table users enable row level security;
alter table sessions enable row level security;
alter table session_questions enable row level security;
alter table session_feedback enable row level security;
alter table subscriptions enable row level security;

-- RLS Policies
create policy "Users can view own profile" on users
  for select using (auth.uid() = id);

create policy "Users can update own profile" on users
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on users
  for insert with check (auth.uid() = id);

create policy "Users can view own sessions" on sessions
  for select using (auth.uid() = user_id);

create policy "Users can insert own sessions" on sessions
  for insert with check (auth.uid() = user_id);

create policy "Users can update own sessions" on sessions
  for update using (auth.uid() = user_id);

create policy "Users can view own session_questions" on session_questions
  for select using (
    auth.uid() = (select user_id from sessions where id = session_id)
  );

create policy "Users can insert own session_questions" on session_questions
  for insert with check (
    auth.uid() = (select user_id from sessions where id = session_id)
  );

create policy "Users can update own session_questions" on session_questions
  for update using (
    auth.uid() = (select user_id from sessions where id = session_id)
  );

create policy "Users can view own feedback" on session_feedback
  for select using (
    auth.uid() = (select user_id from sessions where id = session_id)
  );

create policy "Users can insert own feedback" on session_feedback
  for insert with check (
    auth.uid() = (select user_id from sessions where id = session_id)
  );

create policy "Users can view own subscriptions" on subscriptions
  for select using (auth.uid() = user_id);

create policy "Users can insert own subscriptions" on subscriptions
  for insert with check (auth.uid() = user_id);
