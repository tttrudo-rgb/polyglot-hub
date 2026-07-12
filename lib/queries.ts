import { db } from "./db";
import type { Card, Language, PlanItemKey, Resource, ResourceType, Stage, StudySession } from "./types";
import { STAGE_INPUT_HOUR_THRESHOLDS } from "./plan";

export function todayStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDaysStr(dateStr: string, delta: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + delta);
  return todayStr(d);
}

export function getLanguages(): Language[] {
  return db
    .prepare(`SELECT * FROM languages ORDER BY is_primary DESC, name ASC`)
    .all() as Language[];
}

export function getLanguage(id: string): Language | undefined {
  return db.prepare(`SELECT * FROM languages WHERE id = ?`).get(id) as Language | undefined;
}

export function getDueCardsCount(languageId: string, on: string = todayStr()): number {
  const row = db
    .prepare(`SELECT COUNT(*) as n FROM cards WHERE language_id = ? AND due_date <= ?`)
    .get(languageId, on) as { n: number };
  return row.n;
}

export function getDueCards(languageId: string, on: string = todayStr()): Card[] {
  return db
    .prepare(`SELECT * FROM cards WHERE language_id = ? AND due_date <= ? ORDER BY due_date ASC`)
    .all(languageId, on) as Card[];
}

export function getCards(languageId: string): Card[] {
  return db
    .prepare(`SELECT * FROM cards WHERE language_id = ? ORDER BY created_at DESC`)
    .all(languageId) as Card[];
}

export function getCard(id: number): Card | undefined {
  return db.prepare(`SELECT * FROM cards WHERE id = ?`).get(id) as Card | undefined;
}

export function getTodayCompletions(languageId: string, date: string = todayStr()): Set<PlanItemKey> {
  const rows = db
    .prepare(`SELECT item_key FROM plan_completions WHERE language_id = ? AND plan_date = ?`)
    .all(languageId, date) as { item_key: PlanItemKey }[];
  return new Set(rows.map((r) => r.item_key));
}

/** Consecutive-day study streak for one language, counting back from today (or yesterday if today hasn't been logged yet). */
export function getLanguageStreak(languageId: string): number {
  const rows = db
    .prepare(`SELECT DISTINCT session_date FROM sessions WHERE language_id = ?`)
    .all(languageId) as { session_date: string }[];
  return computeStreak(new Set(rows.map((r) => r.session_date)));
}

/** Consecutive-day streak across ANY language. */
export function getGlobalStreak(): number {
  const rows = db.prepare(`SELECT DISTINCT session_date FROM sessions`).all() as {
    session_date: string;
  }[];
  return computeStreak(new Set(rows.map((r) => r.session_date)));
}

function computeStreak(dateSet: Set<string>): number {
  const today = todayStr();
  let cursor = dateSet.has(today) ? today : addDaysStr(today, -1);
  if (!dateSet.has(cursor)) return 0;

  let streak = 0;
  while (dateSet.has(cursor)) {
    streak += 1;
    cursor = addDaysStr(cursor, -1);
  }
  return streak;
}

/** Longest-ever run of consecutive study days for a language, independent of whether it's still active. */
export function getLongestStreak(languageId: string): number {
  const rows = db
    .prepare(`SELECT DISTINCT session_date FROM sessions WHERE language_id = ? ORDER BY session_date ASC`)
    .all(languageId) as { session_date: string }[];
  if (rows.length === 0) return 0;

  let longest = 1;
  let current = 1;
  for (let i = 1; i < rows.length; i++) {
    const isConsecutive = addDaysStr(rows[i - 1].session_date, 1) === rows[i].session_date;
    current = isConsecutive ? current + 1 : 1;
    longest = Math.max(longest, current);
  }
  return longest;
}

export function getWeeklyInputMinutes(languageId: string): number {
  const since = addDaysStr(todayStr(), -6);
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(duration_minutes), 0) as total FROM sessions
       WHERE language_id = ? AND type = 'input' AND session_date >= ?`
    )
    .get(languageId, since) as { total: number };
  return row.total;
}

export function getTotalInputMinutes(languageId: string): number {
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(duration_minutes), 0) as total FROM sessions
       WHERE language_id = ? AND type = 'input'`
    )
    .get(languageId) as { total: number };
  return row.total;
}

export interface StageProgress {
  percent: number;
  hoursLogged: number;
  hoursNeeded: number | null;
}

export function getStageProgress(language: Language): StageProgress {
  const hoursLogged = Math.round((getTotalInputMinutes(language.id) / 60) * 10) / 10;
  const threshold = STAGE_INPUT_HOUR_THRESHOLDS[language.stage];
  if (!Number.isFinite(threshold)) {
    return { percent: 100, hoursLogged, hoursNeeded: null };
  }
  const percent = Math.max(0, Math.min(100, Math.round((hoursLogged / threshold) * 100)));
  return { percent, hoursLogged, hoursNeeded: threshold };
}

export interface SessionStats {
  totalInputMinutes: number;
  totalOutputMinutes: number;
  cardsReviewed: number;
  daysStudied: number;
}

export function getSessionStats(languageId: string, sinceDate: string): SessionStats {
  const rows = db
    .prepare(
      `SELECT type, SUM(duration_minutes) as minutes, COUNT(*) as count
       FROM sessions WHERE language_id = ? AND session_date >= ?
       GROUP BY type`
    )
    .all(languageId, sinceDate) as { type: string; minutes: number; count: number }[];

  const days = db
    .prepare(
      `SELECT COUNT(DISTINCT session_date) as n FROM sessions
       WHERE language_id = ? AND session_date >= ?`
    )
    .get(languageId, sinceDate) as { n: number };

  const stats: SessionStats = {
    totalInputMinutes: 0,
    totalOutputMinutes: 0,
    cardsReviewed: 0,
    daysStudied: days.n,
  };
  for (const row of rows) {
    if (row.type === "input") stats.totalInputMinutes = row.minutes;
    if (row.type === "output") stats.totalOutputMinutes = row.minutes;
    if (row.type === "review") stats.cardsReviewed = row.count;
  }
  return stats;
}

export function getRecentSessions(languageId: string, limit = 10): StudySession[] {
  return db
    .prepare(`SELECT * FROM sessions WHERE language_id = ? ORDER BY created_at DESC LIMIT ?`)
    .all(languageId, limit) as StudySession[];
}

export interface CardStats {
  total: number;
  due: number;
  averageEase: number;
}

export function getCardStats(languageId: string): CardStats {
  const row = db
    .prepare(
      `SELECT COUNT(*) as total, COALESCE(AVG(ease_factor), 2.5) as avgEase
       FROM cards WHERE language_id = ?`
    )
    .get(languageId) as { total: number; avgEase: number };
  return {
    total: row.total,
    due: getDueCardsCount(languageId),
    averageEase: Math.round(row.avgEase * 100) / 100,
  };
}

export interface ResourceFilters {
  level?: Stage;
  type?: ResourceType;
}

export function getResources(languageId: string, filters: ResourceFilters = {}): Resource[] {
  const clauses = ["language_id = ?"];
  const params: (string | number)[] = [languageId];

  if (filters.level) {
    clauses.push("level = ?");
    params.push(filters.level);
  }
  if (filters.type) {
    clauses.push("type = ?");
    params.push(filters.type);
  }

  return db
    .prepare(
      `SELECT * FROM resources WHERE ${clauses.join(" AND ")}
       ORDER BY is_favorite DESC, is_custom ASC, title ASC`
    )
    .all(...params) as Resource[];
}
