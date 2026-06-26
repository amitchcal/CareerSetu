export type ExperienceLevel = "fresher" | "intermediate" | "experienced";
export type PreferredLanguage = "english" | "hindi" | "hinglish";
export type GoalType =
  | "upcoming_interview"
  | "general_practice"
  | "campus_placement";
export type SessionStatus = "in_progress" | "completed" | "abandoned";
export type SubscriptionPlan = "free" | "starter" | "pro";
export type SubscriptionStatus = "active" | "cancelled" | "past_due";

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
  created_at: string;
}

export interface SessionQuestion {
  id: string;
  session_id: string;
  question_number: number;
  question_text: string;
  audio_response_url: string | null;
  transcript: string | null;
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
