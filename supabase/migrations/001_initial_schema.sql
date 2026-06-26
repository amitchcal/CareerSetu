-- CareerSetu initial schema

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
