"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { reviewCard } from "@/lib/actions";

interface ReviewCard {
  id: number;
  front: string;
  back: string;
  reading: string | null;
  example_sentence: string | null;
  notes: string | null;
}

const GRADES: { label: string; quality: number; className: string }[] = [
  { label: "Again", quality: 0, className: "bg-red text-paper" },
  { label: "Hard", quality: 3, className: "bg-gold text-paper" },
  { label: "Good", quality: 4, className: "bg-blue text-paper" },
  { label: "Easy", quality: 5, className: "bg-green text-paper" },
];

export function FlashcardReview({ languageId, initialCards }: { languageId: string; initialCards: ReviewCard[] }) {
  const [gradedIds, setGradedIds] = useState<Set<number>>(new Set());
  const [flipped, setFlipped] = useState(false);

  const queue = initialCards.filter((c) => !gradedIds.has(c.id));
  const gradedCount = gradedIds.size;

  if (initialCards.length === 0 && gradedCount === 0) {
    return (
      <div className="paper-card rounded-lg p-6 text-center text-ink-soft">
        No cards due today. Add some from today&apos;s input, or check back tomorrow.
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="paper-card rounded-lg p-6 text-center">
        <p className="font-display text-xl font-semibold">Review complete 🎉</p>
        <p className="mt-1 text-sm text-ink-soft">You graded {gradedCount} card{gradedCount === 1 ? "" : "s"}.</p>
      </div>
    );
  }

  const card = queue[0];

  async function grade(quality: number) {
    await reviewCard(card.id, languageId, quality);
    setGradedIds((prev) => new Set(prev).add(card.id));
    setFlipped(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-center text-xs uppercase tracking-wide text-ink-soft">
        Card {gradedCount + 1} of {gradedCount + queue.length}
      </p>
      <button
        onClick={() => setFlipped((f) => !f)}
        className="paper-card flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-lg p-8 text-center"
      >
        {!flipped && card.reading && <span className="text-sm text-ink-soft">{card.reading}</span>}
        <span className="font-display text-3xl font-semibold">{flipped ? card.back : card.front}</span>
        {flipped && card.example_sentence && (
          <span className="text-sm italic text-ink-soft">{card.example_sentence}</span>
        )}
        {flipped && card.notes && <span className="text-xs text-ink-soft">{card.notes}</span>}
        {!flipped && (
          <span className="flex items-center gap-1 text-xs text-ink-soft">
            <RotateCcw size={12} /> tap to reveal
          </span>
        )}
      </button>

      {flipped ? (
        <div className="grid grid-cols-4 gap-2">
          {GRADES.map((g) => (
            <button
              key={g.label}
              onClick={() => grade(g.quality)}
              className={`rounded py-2 text-sm font-medium transition hover:opacity-90 ${g.className}`}
            >
              {g.label}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-ink-soft">Recall the answer, then reveal to grade yourself.</p>
      )}
    </div>
  );
}
