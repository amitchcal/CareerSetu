-- CareerSetu — P2.5: coding assessment support
-- Coding questions reuse the questions table with format='coding'. They carry
-- starter code per language and stdin/stdout test cases. Attempts are graded by
-- running the candidate's code against each test case via the Piston API.

alter table questions add column if not exists starter_code jsonb; -- { "python": "...", "javascript": "..." }
alter table questions add column if not exists test_cases jsonb;   -- [ { "stdin": "...", "expected": "..." } ]

create table if not exists coding_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null,
  question_id uuid references questions(id) not null,
  language text not null,
  source_code text not null,
  passed int default 0,
  total int default 0,
  results jsonb, -- [ { index, passed, stdout, expected, stderr } ]
  created_at timestamptz default now()
);

create index if not exists coding_attempts_user_idx on coding_attempts(user_id);

-- RLS disabled (API-route enforced, consistent with the other app tables)
alter table coding_attempts disable row level security;
