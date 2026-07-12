export type Stage = "beginner" | "intermediate" | "advanced";

export type SessionType = "input" | "output" | "review" | "conversation";

export type PlanItemKey = "input" | "srs_review" | "output";

export type ResourceType = "video" | "podcast" | "reading" | "app";

export type JlptLevel = "N5" | "N4" | "N3" | "N2" | "N1";

export interface Language {
  id: string;
  name: string;
  flag_emoji: string;
  stage: Stage;
  is_primary: 0 | 1;
  daily_budget_minutes: number;
  jlpt_level: JlptLevel | null;
  wanikani_level: number | null;
  created_at: string;
}

export interface Card {
  id: number;
  language_id: string;
  front: string;
  back: string;
  reading: string | null;
  example_sentence: string | null;
  notes: string | null;
  image_url: string | null;
  interval_days: number;
  repetitions: number;
  ease_factor: number;
  due_date: string;
  last_reviewed_at: string | null;
  created_at: string;
}

export interface StudySession {
  id: number;
  language_id: string;
  type: SessionType;
  duration_minutes: number;
  note: string | null;
  session_date: string;
  created_at: string;
}

export interface PlanCompletion {
  language_id: string;
  plan_date: string;
  item_key: PlanItemKey;
  completed: 1;
}

export interface Resource {
  id: number;
  language_id: string;
  title: string;
  url: string | null;
  type: ResourceType;
  level: Stage;
  description: string | null;
  is_favorite: 0 | 1;
  is_custom: 0 | 1;
  created_at: string;
}
