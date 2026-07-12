"use client";

import { useState } from "react";
import { HIRAGANA, KATAKANA, type KanaChar } from "@/lib/kana";
import { logSession } from "@/lib/actions";

type Mode = "hiragana" | "katakana" | "both";

const QUIZ_LENGTH = 15;

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildQuestions(mode: Mode): { kana: KanaChar; options: string[] }[] {
  const pool = mode === "hiragana" ? HIRAGANA : mode === "katakana" ? KATAKANA : [...HIRAGANA, ...KATAKANA];
  const questions = shuffle(pool).slice(0, QUIZ_LENGTH);

  return questions.map((kana) => {
    const distractors = shuffle(pool.filter((k) => k.romaji !== kana.romaji))
      .slice(0, 3)
      .map((k) => k.romaji);
    return { kana, options: shuffle([kana.romaji, ...distractors]) };
  });
}

export function KanaQuiz({ languageId }: { languageId: string }) {
  const [mode, setMode] = useState<Mode | null>(null);
  const [questions, setQuestions] = useState<{ kana: KanaChar; options: string[] }[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [logged, setLogged] = useState(false);

  const current = questions[index];
  const done = questions.length > 0 && index >= questions.length;

  function start(m: Mode) {
    setMode(m);
    setQuestions(buildQuestions(m));
    setIndex(0);
    setScore(0);
    setSelected(null);
    setLogged(false);
  }

  function answer(option: string) {
    if (selected) return;
    setSelected(option);
    if (option === current.kana.romaji) setScore((s) => s + 1);
  }

  function next() {
    setSelected(null);
    setIndex((i) => i + 1);
  }

  async function logQuizSession() {
    const formData = new FormData();
    formData.set("language_id", languageId);
    formData.set("type", "review");
    formData.set("duration_minutes", "5");
    formData.set("note", `Kana quiz: ${score}/${questions.length}`);
    await logSession(formData);
    setLogged(true);
  }

  if (!mode) {
    return (
      <div className="paper-card flex flex-col gap-3 rounded-lg p-6">
        <p className="text-sm text-ink-soft">Choose a drill:</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => start("hiragana")} className="rounded bg-blue px-4 py-2 text-sm font-medium text-paper hover:opacity-90">
            Hiragana
          </button>
          <button onClick={() => start("katakana")} className="rounded bg-blue px-4 py-2 text-sm font-medium text-paper hover:opacity-90">
            Katakana
          </button>
          <button onClick={() => start("both")} className="rounded bg-blue px-4 py-2 text-sm font-medium text-paper hover:opacity-90">
            Both
          </button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="paper-card flex flex-col items-center gap-3 rounded-lg p-6 text-center">
        <p className="font-display text-xl font-semibold">Quiz complete 🎉</p>
        <p className="text-sm text-ink-soft">
          {score} / {questions.length} correct
        </p>
        <div className="flex gap-2">
          <button onClick={() => start(mode)} className="rounded bg-blue px-4 py-2 text-sm font-medium text-paper hover:opacity-90">
            Try again
          </button>
          <button onClick={() => setMode(null)} className="rounded border border-ink/20 px-4 py-2 text-sm">
            Change mode
          </button>
          {!logged && (
            <button onClick={logQuizSession} className="rounded border border-gold/50 px-4 py-2 text-sm text-gold hover:bg-gold/10">
              Log this session
            </button>
          )}
        </div>
        {logged && <p className="text-xs text-ink-soft">Session logged ✓</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-center text-xs uppercase tracking-wide text-ink-soft">
        Question {index + 1} of {questions.length} · Score {score}
      </p>
      <div className="paper-card flex min-h-[160px] flex-col items-center justify-center rounded-lg p-8">
        <span className="font-display text-6xl">{current.kana.char}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {current.options.map((option) => {
          const isCorrect = option === current.kana.romaji;
          const showState = selected !== null;
          const className = !showState
            ? "border border-ink/20 hover:border-blue hover:text-blue"
            : isCorrect
              ? "bg-green text-paper"
              : option === selected
                ? "bg-red text-paper"
                : "border border-ink/10 text-ink-soft/50";
          return (
            <button
              key={option}
              onClick={() => answer(option)}
              disabled={showState}
              className={`rounded-lg py-3 text-lg font-medium transition ${className}`}
            >
              {option}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <button onClick={next} className="self-center rounded bg-blue px-6 py-2 text-sm font-medium text-paper hover:opacity-90">
          Next
        </button>
      )}
    </div>
  );
}
