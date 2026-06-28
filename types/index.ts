export type ExperienceLevel = "fresher" | "intermediate" | "experienced";
export type PreferredLanguage = "english" | "hindi" | "hinglish";
export type GoalType =
  | "upcoming_interview"
  | "general_practice"
  | "campus_placement";
export type SessionStatus = "in_progress" | "completed" | "abandoned";
export type SubscriptionPlan = "free" | "starter" | "pro";
export type SubscriptionStatus = "active" | "cancelled" | "past_due";

export type TrackCategory =
  | "software"
  | "project_mgmt"
  | "agile"
  | "business_analyst"
  | "hr";
export type Seniority = "fresher" | "intermediate" | "experienced" | "lead";
export type QuestionFormat = "interview" | "mcq";
export type RoundType =
  | "technical"
  | "hr"
  | "managerial"
  | "aptitude"
  | "domain";
export type QuestionStatus = "draft" | "approved";
export type McqTestStatus = "in_progress" | "submitted" | "expired";

export interface User {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  target_role: string | null;
  experience_level: ExperienceLevel | null;
  preferred_language: PreferredLanguage;
  goal_type: GoalType | null;
  target_interview_date: string | null;
  referral_source: string | null;
  onboarding_complete: boolean;
  resume_text: string | null;
  resume_url: string | null;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  role: string;
  difficulty: ExperienceLevel;
  language: PreferredLanguage;
  num_questions: number;
  status: SessionStatus;
  track_id: string | null;
  company_id: string | null;
  round_type: RoundType | null;
  seniority: Seniority | null;
  job_title: string | null;
  job_description: string | null;
  resume_snapshot: string | null;
  created_at: string;
}

export interface Track {
  id: string;
  name: string;
  slug: string;
  category: TrackCategory;
  parent_id: string | null;
  description: string | null;
  icon: string | null;
  seniority_levels: Seniority[];
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  interview_style_notes: string | null;
  sort_order: number;
  created_at: string;
}

export interface Question {
  id: string;
  track_id: string;
  company_id: string | null;
  format: QuestionFormat;
  round_type: RoundType;
  difficulty: ExperienceLevel;
  question_text: string;
  options: string[] | null;
  correct_option: number | null;
  explanation: string | null;
  tags: string[];
  source_note: string | null;
  status: QuestionStatus;
  created_at: string;
}

export interface McqTest {
  id: string;
  user_id: string;
  track_id: string;
  company_id: string | null;
  num_questions: number;
  duration_seconds: number;
  job_title: string | null;
  job_description: string | null;
  status: McqTestStatus;
  score: number | null;
  started_at: string;
  submitted_at: string | null;
}

export interface McqTestQuestion {
  id: string;
  test_id: string;
  question_id: string;
  user_answer: number | null;
  is_correct: boolean | null;
  time_spent_seconds: number | null;
  position: number;
}

export interface SessionQuestion {
  id: string;
  session_id: string;
  question_number: number;
  question_text: string;
  audio_response_url: string | null;
  transcript: string | null;
  answer_duration_seconds: number | null;
  words_per_minute: number | null;
  filler_count: number | null;
  filler_words: Record<string, number> | null;
  created_at: string;
}

export interface PerQuestionFeedback {
  questionNumber: number;
  feedback: string;
}

export interface SessionFeedback {
  id: string;
  session_id: string;
  overall_score: number | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  per_question_feedback: PerQuestionFeedback[] | null;
  competency_scores: Record<string, number> | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  renewal_date: string | null;
  payment_gateway_ref: string | null;
  created_at: string;
}

// ─── Job Search ───────────────────────────────────────────────────────────────

export interface JobSearch {
  id: string;
  user_id: string;
  query: string;
  location: string | null;
  extracted_skills: string[] | null;
  created_at: string;
}

export interface JobResult {
  id: string;
  search_id: string;
  external_job_id: string | null;
  title: string;
  company: string;
  location: string | null;
  description: string | null;
  apply_url: string;
  source: string | null;
  match_score: number | null;
  matched_skills: string[] | null;
  missing_skills: string[] | null;
  created_at: string;
}

export interface TailoredProfile {
  id: string;
  user_id: string;
  job_result_id: string;
  original_cv_text: string | null;
  tailored_summary: string | null;
  tailored_bullets: string[] | null;
  keywords_added: string[] | null;
  upskilling_suggestions: string[] | null;
  created_at: string;
}
