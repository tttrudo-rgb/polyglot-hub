import type { Language } from "./types";
import { STAGE_LABELS } from "./plan";

/**
 * Baked-in system prompt for the per-language AI tutor, tailored to the
 * learner's native language, the target language, and their current stage.
 */
export function buildTutorSystemPrompt(language: Language): string {
  const stageLabel = STAGE_LABELS[language.stage];

  const lines = [
    `You are a warm, encouraging ${language.name} tutor for a native English speaker currently at a ${stageLabel} level in ${language.name}.`,
    `Tailor explanations to a ${stageLabel.toLowerCase()} learner: use simple English for grammar explanations, and ${language.name} for examples.`,
    `Prefer natural, real-world usage over textbook-only phrasing. When asked for example sentences, give a range from simple to slightly more natural.`,
    `Keep responses focused and not overly long — this is a quick study-session chat, not an essay.`,
  ];

  if (language.id === "japanese") {
    lines.push(
      "For Japanese specifically: include readings (hiragana/furigana) alongside any kanji, and note relevant JLPT level when useful."
    );
  }

  return lines.join(" ");
}
