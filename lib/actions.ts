"use server";

import { revalidatePath } from "next/cache";
import { db } from "./db";
import { gradeCard } from "./srs";
import { todayStr } from "./queries";
import type { PlanItemKey, ResourceType, SessionType, Stage } from "./types";

function slugify(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return base || "language";
}

function uniqueLanguageId(name: string): string {
  const base = slugify(name);
  let id = base;
  let suffix = 2;
  const exists = db.prepare(`SELECT 1 FROM languages WHERE id = ?`);
  while (exists.get(id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }
  return id;
}

export async function addLanguage(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const flag_emoji = String(formData.get("flag_emoji") ?? "🌐").trim() || "🌐";
  const stage = String(formData.get("stage") ?? "beginner") as Stage;
  const daily_budget_minutes = Number(formData.get("daily_budget_minutes") ?? 15) || 15;

  const id = uniqueLanguageId(name);
  db.prepare(
    `INSERT INTO languages (id, name, flag_emoji, stage, is_primary, daily_budget_minutes)
     VALUES (?, ?, ?, ?, 0, ?)`
  ).run(id, name, flag_emoji, stage, daily_budget_minutes);

  revalidatePath("/");
}

export async function setPrimaryLanguage(languageId: string) {
  const tx = db.transaction(() => {
    db.prepare(`UPDATE languages SET is_primary = 0`).run();
    db.prepare(`UPDATE languages SET is_primary = 1 WHERE id = ?`).run(languageId);
  });
  tx();
  revalidatePath("/");
  revalidatePath(`/${languageId}`);
}

export async function removeLanguage(languageId: string) {
  db.prepare(`DELETE FROM languages WHERE id = ?`).run(languageId);
  revalidatePath("/");
}

export async function updateDailyBudget(formData: FormData) {
  const languageId = String(formData.get("language_id") ?? "");
  const minutes = Number(formData.get("daily_budget_minutes") ?? 15);
  if (!languageId) return;
  const clamped = Math.max(5, Math.min(240, Math.round(minutes)));
  db.prepare(`UPDATE languages SET daily_budget_minutes = ? WHERE id = ?`).run(clamped, languageId);
  revalidatePath(`/${languageId}`);
}

export async function updateStage(formData: FormData) {
  const languageId = String(formData.get("language_id") ?? "");
  const stage = String(formData.get("stage") ?? "") as Stage;
  if (!languageId || !stage) return;
  db.prepare(`UPDATE languages SET stage = ? WHERE id = ?`).run(stage, languageId);
  revalidatePath(`/${languageId}`);
  revalidatePath("/");
}

export async function updateJapaneseTracking(formData: FormData) {
  const languageId = String(formData.get("language_id") ?? "");
  if (!languageId) return;
  const jlptLevel = String(formData.get("jlpt_level") ?? "").trim() || null;
  const wanikaniRaw = String(formData.get("wanikani_level") ?? "").trim();
  const wanikaniLevel = wanikaniRaw ? Math.max(1, Math.min(60, Math.round(Number(wanikaniRaw)))) : null;

  db.prepare(`UPDATE languages SET jlpt_level = ?, wanikani_level = ? WHERE id = ?`).run(
    jlptLevel,
    wanikaniLevel,
    languageId
  );
  revalidatePath(`/${languageId}`);
}

export async function togglePlanItem(languageId: string, itemKey: PlanItemKey) {
  const date = todayStr();
  const existing = db
    .prepare(`SELECT 1 FROM plan_completions WHERE language_id = ? AND plan_date = ? AND item_key = ?`)
    .get(languageId, date, itemKey);

  if (existing) {
    db.prepare(
      `DELETE FROM plan_completions WHERE language_id = ? AND plan_date = ? AND item_key = ?`
    ).run(languageId, date, itemKey);
  } else {
    db.prepare(
      `INSERT INTO plan_completions (language_id, plan_date, item_key, completed) VALUES (?, ?, ?, 1)`
    ).run(languageId, date, itemKey);
  }
  revalidatePath(`/${languageId}`);
}

export async function addCard(formData: FormData) {
  const language_id = String(formData.get("language_id") ?? "");
  const front = String(formData.get("front") ?? "").trim();
  const back = String(formData.get("back") ?? "").trim();
  if (!language_id || !front || !back) return;
  const reading = String(formData.get("reading") ?? "").trim() || null;
  const example_sentence = String(formData.get("example_sentence") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const image_url = String(formData.get("image_url") ?? "").trim() || null;

  db.prepare(
    `INSERT INTO cards (language_id, front, back, reading, example_sentence, notes, image_url, due_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(language_id, front, back, reading, example_sentence, notes, image_url, todayStr());

  revalidatePath(`/${language_id}/flashcards`);
}

export async function updateCard(formData: FormData) {
  const id = Number(formData.get("id"));
  const language_id = String(formData.get("language_id") ?? "");
  const front = String(formData.get("front") ?? "").trim();
  const back = String(formData.get("back") ?? "").trim();
  if (!id || !front || !back) return;
  const reading = String(formData.get("reading") ?? "").trim() || null;
  const example_sentence = String(formData.get("example_sentence") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const image_url = String(formData.get("image_url") ?? "").trim() || null;

  db.prepare(
    `UPDATE cards SET front = ?, back = ?, reading = ?, example_sentence = ?, notes = ?, image_url = ? WHERE id = ?`
  ).run(front, back, reading, example_sentence, notes, image_url, id);

  revalidatePath(`/${language_id}/flashcards`);
}

export async function deleteCard(id: number, languageId: string) {
  db.prepare(`DELETE FROM cards WHERE id = ?`).run(id);
  revalidatePath(`/${languageId}/flashcards`);
}

export async function reviewCard(id: number, languageId: string, quality: number) {
  const card = db
    .prepare(`SELECT interval_days, repetitions, ease_factor FROM cards WHERE id = ?`)
    .get(id) as { interval_days: number; repetitions: number; ease_factor: number } | undefined;
  if (!card) return;

  const result = gradeCard(card, quality);
  db.prepare(
    `UPDATE cards SET interval_days = ?, repetitions = ?, ease_factor = ?, due_date = ?, last_reviewed_at = datetime('now')
     WHERE id = ?`
  ).run(result.interval_days, result.repetitions, result.ease_factor, result.due_date, id);

  db.prepare(
    `INSERT INTO sessions (language_id, type, duration_minutes, note, session_date)
     VALUES (?, 'review', 1, NULL, ?)`
  ).run(languageId, todayStr());

  revalidatePath(`/${languageId}/flashcards`);
  revalidatePath(`/${languageId}`);
}

export async function logSession(formData: FormData) {
  const language_id = String(formData.get("language_id") ?? "");
  const type = String(formData.get("type") ?? "input") as SessionType;
  const duration_minutes = Number(formData.get("duration_minutes") ?? 0);
  const note = String(formData.get("note") ?? "").trim() || null;
  if (!language_id || !duration_minutes || duration_minutes <= 0) return;

  db.prepare(
    `INSERT INTO sessions (language_id, type, duration_minutes, note, session_date) VALUES (?, ?, ?, ?, ?)`
  ).run(language_id, type, Math.round(duration_minutes), note, todayStr());

  revalidatePath(`/${language_id}`);
  revalidatePath("/");
}

export async function addResource(formData: FormData) {
  const language_id = String(formData.get("language_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!language_id || !title) return;
  const url = String(formData.get("url") ?? "").trim() || null;
  const type = String(formData.get("type") ?? "video") as ResourceType;
  const level = String(formData.get("level") ?? "beginner") as Stage;
  const description = String(formData.get("description") ?? "").trim() || null;

  db.prepare(
    `INSERT INTO resources (language_id, title, url, type, level, description, is_favorite, is_custom)
     VALUES (?, ?, ?, ?, ?, ?, 0, 1)`
  ).run(language_id, title, url, type, level, description);

  revalidatePath(`/${language_id}/resources`);
}

export async function updateResource(formData: FormData) {
  const id = Number(formData.get("id"));
  const language_id = String(formData.get("language_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!id || !language_id || !title) return;
  const url = String(formData.get("url") ?? "").trim() || null;
  const type = String(formData.get("type") ?? "video") as ResourceType;
  const level = String(formData.get("level") ?? "beginner") as Stage;
  const description = String(formData.get("description") ?? "").trim() || null;

  db.prepare(
    `UPDATE resources SET title = ?, url = ?, type = ?, level = ?, description = ? WHERE id = ?`
  ).run(title, url, type, level, description, id);

  revalidatePath(`/${language_id}/resources`);
}

export async function deleteResource(id: number, languageId: string) {
  db.prepare(`DELETE FROM resources WHERE id = ?`).run(id);
  revalidatePath(`/${languageId}/resources`);
}

export async function toggleFavoriteResource(id: number, languageId: string) {
  db.prepare(`UPDATE resources SET is_favorite = 1 - is_favorite WHERE id = ?`).run(id);
  revalidatePath(`/${languageId}/resources`);
}
