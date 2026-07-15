import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { todayStr } from "@/lib/queries";

// Populates realistic sample data for the demo deployment only. Never runs
// unless DEMO_MODE=true (which real production never sets), and is
// idempotent — a second call is a harmless no-op once cards already exist.
export async function POST() {
  if (process.env.DEMO_MODE !== "true") {
    return NextResponse.json({ error: "Only available in demo mode." }, { status: 403 });
  }

  const existing = db.prepare(`SELECT COUNT(*) as n FROM cards`).get() as { n: number };
  if (existing.n > 0) {
    return NextResponse.json({ skipped: true, reason: "Demo data already seeded." });
  }

  const today = todayStr();
  function addDays(delta: number): string {
    const d = new Date(today + "T00:00:00");
    d.setDate(d.getDate() + delta);
    return d.toISOString().slice(0, 10);
  }

  const insertCard = db.prepare(`
    INSERT INTO cards (language_id, front, back, reading, example_sentence, notes, interval_days, repetitions, ease_factor, due_date, last_reviewed_at)
    VALUES (@language_id, @front, @back, @reading, @example_sentence, @notes, @interval_days, @repetitions, @ease_factor, @due_date, @last_reviewed_at)
  `);

  const cards = [
    // Japanese — primary language, most cards, varied SRS states
    { language_id: "japanese", front: "頑張って", back: "good luck / do your best", reading: "がんばって", example_sentence: "試験、頑張ってね！", notes: "Mnemonic: encourage a friend before a challenge.", interval_days: 6, repetitions: 3, ease_factor: 2.6, due_date: today, last_reviewed_at: `${addDays(-6)} 09:00:00` },
    { language_id: "japanese", front: "美味しい", back: "delicious", reading: "おいしい", example_sentence: "このラーメンは美味しいです。", notes: "Related: まずい (bad-tasting)", interval_days: 3, repetitions: 2, ease_factor: 2.5, due_date: addDays(3), last_reviewed_at: `${addDays(-3)} 18:20:00` },
    { language_id: "japanese", front: "大丈夫", back: "okay / fine / no problem", reading: "だいじょうぶ", example_sentence: "大丈夫ですか？", notes: null, interval_days: 1, repetitions: 1, ease_factor: 2.3, due_date: today, last_reviewed_at: `${addDays(-1)} 20:00:00` },
    { language_id: "japanese", front: "図書館", back: "library", reading: "としょかん", example_sentence: "図書館で本を借りました。", notes: "Kanji breakdown: 図 (diagram) + 書 (write) + 館 (building)", interval_days: 16, repetitions: 4, ease_factor: 2.8, due_date: addDays(6), last_reviewed_at: `${addDays(-10)} 09:00:00` },
    { language_id: "japanese", front: "電車", back: "train", reading: "でんしゃ", example_sentence: "電車で学校に行きます。", notes: null, interval_days: 1, repetitions: 1, ease_factor: 2.5, due_date: addDays(1), last_reviewed_at: `${addDays(-0)} 08:00:00` },
    { language_id: "japanese", front: "約束", back: "promise", reading: "やくそく", example_sentence: "友達と約束しました。", notes: "Related: 守る (to keep a promise)", interval_days: 1, repetitions: 0, ease_factor: 2.5, due_date: today, last_reviewed_at: null },
    // Spanish — fluent, maintenance mode
    { language_id: "spanish", front: "a pesar de", back: "despite / in spite of", reading: null, example_sentence: "A pesar de la lluvia, salimos a caminar.", notes: null, interval_days: 30, repetitions: 5, ease_factor: 2.9, due_date: addDays(5), last_reviewed_at: `${addDays(-25)} 09:00:00` },
    { language_id: "spanish", front: "madrugar", back: "to wake up early", reading: null, example_sentence: "Me encanta madrugar los fines de semana.", notes: null, interval_days: 14, repetitions: 4, ease_factor: 2.7, due_date: addDays(2), last_reviewed_at: `${addDays(-12)} 09:00:00` },
    // German — beginner
    { language_id: "german", front: "Entschuldigung", back: "excuse me / sorry", reading: null, example_sentence: "Entschuldigung, wo ist der Bahnhof?", notes: null, interval_days: 1, repetitions: 1, ease_factor: 2.4, due_date: today, last_reviewed_at: `${addDays(-1)} 09:00:00` },
    { language_id: "german", front: "vielleicht", back: "maybe / perhaps", reading: null, example_sentence: "Vielleicht komme ich morgen vorbei.", notes: null, interval_days: 1, repetitions: 0, ease_factor: 2.5, due_date: addDays(1), last_reviewed_at: null },
    // Italian — beginner
    { language_id: "italian", front: "magari", back: "maybe / if only", reading: null, example_sentence: "Magari domani farà bel tempo.", notes: null, interval_days: 1, repetitions: 0, ease_factor: 2.5, due_date: today, last_reviewed_at: null },
  ];

  const insertSession = db.prepare(`
    INSERT INTO sessions (language_id, type, duration_minutes, note, session_date)
    VALUES (@language_id, @type, @duration_minutes, @note, @session_date)
  `);

  const sessions: { language_id: string; type: string; duration_minutes: number; note: string | null; session_date: string }[] = [];
  // 9-day streak for Japanese: input + review most days, occasional output/conversation.
  for (let i = 9; i >= 1; i--) {
    sessions.push({ language_id: "japanese", type: "input", duration_minutes: 18 + (i % 4) * 5, note: null, session_date: addDays(-i) });
    if (i % 2 === 0) {
      sessions.push({ language_id: "japanese", type: "review", duration_minutes: 8, note: null, session_date: addDays(-i) });
    }
    if (i % 3 === 0) {
      sessions.push({ language_id: "japanese", type: "output", duration_minutes: 10, note: "Shadowing practice", session_date: addDays(-i) });
    }
  }
  sessions.push({ language_id: "japanese", type: "conversation", duration_minutes: 25, note: "Language exchange call", session_date: addDays(-2) });
  // Lighter, more sporadic activity for the other languages.
  sessions.push({ language_id: "spanish", type: "input", duration_minutes: 20, note: "Podcast episode", session_date: addDays(-1) });
  sessions.push({ language_id: "spanish", type: "input", duration_minutes: 15, note: null, session_date: addDays(-4) });
  sessions.push({ language_id: "german", type: "input", duration_minutes: 12, note: null, session_date: addDays(-2) });
  sessions.push({ language_id: "italian", type: "input", duration_minutes: 10, note: null, session_date: today });

  const seedTx = db.transaction(() => {
    for (const card of cards) insertCard.run(card);
    for (const session of sessions) insertSession.run(session);
    db.prepare(`UPDATE languages SET jlpt_level = 'N3', wanikani_level = 15 WHERE id = 'japanese'`).run();
    db.prepare(`
      INSERT OR IGNORE INTO plan_completions (language_id, plan_date, item_key, completed)
      VALUES ('japanese', @today, 'input', 1)
    `).run({ today });
  });
  seedTx();

  return NextResponse.json({ seeded: true, cards: cards.length, sessions: sessions.length });
}
