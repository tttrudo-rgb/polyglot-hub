import type { Language, PlanItemKey, Stage } from "./types";

export interface PlanItem {
  key: PlanItemKey;
  title: string;
  description: string;
  minutes: number;
  completed: boolean;
}

const JAPANESE_INPUT_DESCRIPTIONS: Record<Stage, string> = {
  beginner: "Hiragana/katakana drill + basic vocab (Genki ch. 1–12 progression)",
  intermediate: "Comprehensible input: anime, podcasts, shadowing, sentence mining",
  advanced: "Native content, conversation practice, kanji reading",
};

const GENERIC_INPUT_DESCRIPTIONS: Record<Stage, string> = {
  beginner: "Watch or listen to beginner-friendly comprehensible input",
  intermediate: "Comprehensible input: podcasts, shows, or articles",
  advanced: "Native content: podcasts, shows, or books",
};

const OUTPUT_DESCRIPTIONS: Record<Stage, string> = {
  beginner: "Write 3–5 sentences using today's new words, or repeat basic phrases aloud",
  intermediate: "Shadow a short clip aloud, or write a short journal entry",
  advanced: "Have a short conversation with a partner, or write a paragraph",
};

function inputDescription(language: Language): string {
  const table = language.id === "japanese" ? JAPANESE_INPUT_DESCRIPTIONS : GENERIC_INPUT_DESCRIPTIONS;
  return table[language.stage];
}

/**
 * Auto-generates today's study plan: comprehensible input first, then SRS
 * review, then active output — following the input-hypothesis-first philosophy.
 */
export function generateDailyPlan(
  language: Language,
  dueCardsCount: number,
  completedKeys: Set<PlanItemKey>
): PlanItem[] {
  const total = language.daily_budget_minutes;

  const inputMinutes = Math.max(5, Math.round(total * 0.5));
  let remaining = Math.max(0, total - inputMinutes);

  const reviewMinutes = dueCardsCount > 0 ? Math.max(5, Math.min(remaining, Math.round(dueCardsCount * 1.5))) : 0;
  remaining = Math.max(0, remaining - reviewMinutes);

  const outputMinutes = Math.max(5, remaining);

  const items: PlanItem[] = [
    {
      key: "input",
      title: "Comprehensible Input",
      description: inputDescription(language),
      minutes: inputMinutes,
      completed: completedKeys.has("input"),
    },
    {
      key: "srs_review",
      title: "Flashcard Review",
      description:
        dueCardsCount > 0
          ? `${dueCardsCount} card${dueCardsCount === 1 ? "" : "s"} due`
          : "No cards due — add some from today's input",
      minutes: reviewMinutes,
      completed: completedKeys.has("srs_review"),
    },
    {
      key: "output",
      title: "Active Output",
      description: OUTPUT_DESCRIPTIONS[language.stage],
      minutes: outputMinutes,
      completed: completedKeys.has("output"),
    },
  ];

  return items;
}

export const STAGE_LABELS: Record<Stage, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

/** Cumulative input hours (all-time) required to reach the *next* stage. */
export const STAGE_INPUT_HOUR_THRESHOLDS: Record<Stage, number> = {
  beginner: 30,
  intermediate: 150,
  advanced: Infinity,
};

export function nextStage(stage: Stage): Stage | null {
  if (stage === "beginner") return "intermediate";
  if (stage === "intermediate") return "advanced";
  return null;
}
