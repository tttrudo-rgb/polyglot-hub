import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const dbPath = path.join(dataDir, "polyglot-hub.db");

declare global {
  var __polyglotDb: Database.Database | undefined;
}

function createConnection() {
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

export const db = globalThis.__polyglotDb ?? createConnection();
if (process.env.NODE_ENV !== "production") {
  globalThis.__polyglotDb = db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS languages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      flag_emoji TEXT NOT NULL DEFAULT '🌐',
      stage TEXT NOT NULL DEFAULT 'beginner',
      is_primary INTEGER NOT NULL DEFAULT 0,
      daily_budget_minutes INTEGER NOT NULL DEFAULT 15,
      jlpt_level TEXT,
      wanikani_level INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      language_id TEXT NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
      front TEXT NOT NULL,
      back TEXT NOT NULL,
      reading TEXT,
      example_sentence TEXT,
      notes TEXT,
      image_url TEXT,
      interval_days REAL NOT NULL DEFAULT 0,
      repetitions INTEGER NOT NULL DEFAULT 0,
      ease_factor REAL NOT NULL DEFAULT 2.5,
      due_date TEXT NOT NULL DEFAULT (date('now')),
      last_reviewed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_cards_language ON cards(language_id);
    CREATE INDEX IF NOT EXISTS idx_cards_due ON cards(language_id, due_date);

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      language_id TEXT NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      note TEXT,
      session_date TEXT NOT NULL DEFAULT (date('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_language_date ON sessions(language_id, session_date);

    CREATE TABLE IF NOT EXISTS plan_completions (
      language_id TEXT NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
      plan_date TEXT NOT NULL,
      item_key TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY (language_id, plan_date, item_key)
    );

    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      language_id TEXT NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      url TEXT,
      type TEXT NOT NULL DEFAULT 'video',
      level TEXT NOT NULL DEFAULT 'beginner',
      description TEXT,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      is_custom INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_resources_language ON resources(language_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_resources_unique ON resources(language_id, title);
  `);
}

function columnExists(table: string, column: string): boolean {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return columns.some((c) => c.name === column);
}

/** Adds a column if missing; ignores races with other processes migrating the same file concurrently. */
function addColumnIfMissing(table: string, column: string, definition: string) {
  if (columnExists(table, column)) return;
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  } catch (err) {
    if (!(err instanceof Error) || !/duplicate column name/i.test(err.message)) {
      throw err;
    }
  }
}

/** Adds columns introduced after the initial schema, for DBs created before they existed. */
function migrate() {
  addColumnIfMissing("cards", "reading", "TEXT");
  addColumnIfMissing("languages", "jlpt_level", "TEXT");
  addColumnIfMissing("languages", "wanikani_level", "INTEGER");
}

function seedLanguages() {
  const count = db.prepare("SELECT COUNT(*) as n FROM languages").get() as { n: number };
  if (count.n > 0) return;

  const insert = db.prepare(`
    INSERT OR IGNORE INTO languages (id, name, flag_emoji, stage, is_primary, daily_budget_minutes)
    VALUES (@id, @name, @flag_emoji, @stage, @is_primary, @daily_budget_minutes)
  `);

  const seedTx = db.transaction(() => {
    insert.run({ id: "japanese", name: "Japanese", flag_emoji: "🇯🇵", stage: "intermediate", is_primary: 1, daily_budget_minutes: 30 });
    insert.run({ id: "spanish", name: "Spanish", flag_emoji: "🇪🇸", stage: "advanced", is_primary: 0, daily_budget_minutes: 15 });
    insert.run({ id: "german", name: "German", flag_emoji: "🇩🇪", stage: "beginner", is_primary: 0, daily_budget_minutes: 15 });
    insert.run({ id: "italian", name: "Italian", flag_emoji: "🇮🇹", stage: "beginner", is_primary: 0, daily_budget_minutes: 15 });
  });
  seedTx();
}

interface SeedResource {
  title: string;
  type: "video" | "podcast" | "reading" | "app";
  level: "beginner" | "intermediate" | "advanced";
  description: string;
}

const CURATED_RESOURCES: Record<string, SeedResource[]> = {
  japanese: [
    { title: "Dreaming Japanese", type: "video", level: "beginner", description: "Comprehensible-input video immersion for Japanese, Dreaming Spanish-style." },
    { title: "Comprehensible Japanese (YouTube)", type: "video", level: "beginner", description: "Slow, visual, comprehensible-input lessons for beginners." },
    { title: "NHK Web Easy", type: "reading", level: "intermediate", description: "News articles rewritten in simplified Japanese with furigana." },
    { title: "Satori Reader", type: "reading", level: "intermediate", description: "Graded reader stories with audio, glosses, and grammar notes." },
    { title: "Animelon", type: "video", level: "intermediate", description: "Anime with interactive Japanese/English subtitles." },
    { title: "Tadoku graded readers", type: "reading", level: "beginner", description: "Free graded readers for extensive reading practice." },
  ],
  german: [
    { title: "Deutsch für Euch", type: "video", level: "beginner", description: "Comprehensible-input YouTube channel for German learners." },
    { title: "Comprehensible German", type: "video", level: "beginner", description: "Story-based comprehensible-input videos in German." },
    { title: "Deutsche Welle", type: "reading", level: "intermediate", description: "German public broadcaster's learner-friendly news and courses." },
    { title: "Slow German podcast", type: "podcast", level: "beginner", description: "Slowly-spoken German podcast on everyday topics." },
  ],
  italian: [
    { title: "Italiano con Luca", type: "video", level: "beginner", description: "Popular Italian-learning YouTube channel." },
    { title: "Comprehensible Italian", type: "video", level: "beginner", description: "Comprehensible-input videos taught entirely in Italian." },
    { title: "RAI Easy Italian", type: "video", level: "intermediate", description: "Simplified Italian news content from Italy's public broadcaster." },
  ],
  spanish: [
    { title: "Dreaming Spanish", type: "video", level: "beginner", description: "The original comprehensible-input video immersion method for Spanish." },
    { title: "Español con Juan", type: "video", level: "intermediate", description: "Spanish taught through storytelling, entirely in Spanish." },
    { title: "SpanishPod101 beginner", type: "podcast", level: "beginner", description: "Structured beginner podcast lessons for Spanish." },
  ],
};

function seedResources() {
  const count = db.prepare("SELECT COUNT(*) as n FROM resources").get() as { n: number };
  if (count.n > 0) return;

  const insert = db.prepare(`
    INSERT OR IGNORE INTO resources (language_id, title, url, type, level, description, is_favorite, is_custom)
    VALUES (@language_id, @title, NULL, @type, @level, @description, 0, 0)
  `);

  const seedTx = db.transaction(() => {
    for (const [languageId, resources] of Object.entries(CURATED_RESOURCES)) {
      for (const r of resources) {
        insert.run({ language_id: languageId, title: r.title, type: r.type, level: r.level, description: r.description });
      }
    }
  });
  seedTx();
}

initSchema();
migrate();
seedLanguages();
seedResources();
