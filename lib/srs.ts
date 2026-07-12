export interface SrsState {
  interval_days: number;
  repetitions: number;
  ease_factor: number;
}

export interface SrsResult extends SrsState {
  due_date: string;
}

/**
 * Grades a card review using the SM-2 spaced repetition algorithm.
 * quality: 0 (total blackout) .. 5 (perfect recall). UI typically maps
 * Again=0, Hard=3, Good=4, Easy=5.
 */
export function gradeCard(state: SrsState, quality: number, today: Date = new Date()): SrsResult {
  const q = Math.max(0, Math.min(5, quality));

  let { interval_days: interval, repetitions, ease_factor: ease } = state;

  if (q < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * ease);
    }
    repetitions += 1;
  }

  ease = ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  ease = Math.max(1.3, ease);

  const due = new Date(today);
  due.setDate(due.getDate() + interval);
  const due_date = due.toISOString().slice(0, 10);

  return { interval_days: interval, repetitions, ease_factor: Math.round(ease * 100) / 100, due_date };
}
