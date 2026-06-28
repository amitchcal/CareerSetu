-- Video interview feature additions

-- session_type already added in earlier iteration; guard with if not exists via alter
alter table sessions add column if not exists session_type text default 'audio';

-- Extended session columns for video interview configuration
alter table sessions add column if not exists track_id uuid references tracks(id);
alter table sessions add column if not exists company_id uuid references companies(id);
alter table sessions add column if not exists round_type text;
alter table sessions add column if not exists seniority text;
alter table sessions add column if not exists job_title text;
alter table sessions add column if not exists job_description text;
alter table sessions add column if not exists resume_snapshot text;

-- Video upload URL on session_questions
alter table session_questions add column if not exists video_response_url text;

-- Delivery metrics columns (populated from Deepgram + transcript analysis)
alter table session_questions add column if not exists answer_duration_seconds numeric;
alter table session_questions add column if not exists words_per_minute int;
alter table session_questions add column if not exists filler_count int;
alter table session_questions add column if not exists filler_words jsonb;

-- Competency scores on session_feedback (keyed by competency slug)
alter table session_feedback add column if not exists competency_scores jsonb;

-- Indexes for common video-interview queries
create index if not exists sessions_track_id_idx on sessions(track_id);
create index if not exists sessions_session_type_idx on sessions(session_type);
