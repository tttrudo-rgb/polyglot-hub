"use client";

import { useState } from "react";
import { Pencil, Sparkles, Trash2, X } from "lucide-react";
import { deleteCard, updateCard } from "@/lib/actions";
import { ConfirmSubmitButton } from "./ConfirmSubmitButton";
import type { Card } from "@/lib/types";

export function FlashcardRow({
  card,
  languageId,
  languageName,
  showReading = false,
}: {
  card: Card;
  languageId: string;
  languageName: string;
  showReading?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [front, setFront] = useState(card.front);
  const [back, setBack] = useState(card.back);
  const [reading, setReading] = useState(card.reading ?? "");
  const [exampleSentence, setExampleSentence] = useState(card.example_sentence ?? "");
  const [notes, setNotes] = useState(card.notes ?? "");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  async function generate() {
    if (!front.trim() || !back.trim() || generating) return;
    setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch("/api/enhance-card", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ front, back, languageName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGenError(data.error ?? "Couldn't generate suggestions.");
        return;
      }
      setExampleSentence(data.examples.join("\n"));
      setNotes(`Mnemonic: ${data.mnemonic}\nRelated: ${data.related.join(", ")}`);
    } catch {
      setGenError("Couldn't reach the AI. Check your connection and try again.");
    } finally {
      setGenerating(false);
    }
  }

  if (editing) {
    return (
      <form
        action={async (formData) => {
          await updateCard(formData);
          setEditing(false);
        }}
        className="paper-card flex flex-col gap-2 rounded-lg p-3"
      >
        <input type="hidden" name="id" value={card.id} />
        <input type="hidden" name="language_id" value={languageId} />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            name="front"
            value={front}
            onChange={(e) => setFront(e.target.value)}
            required
            className="rounded border border-ink/20 bg-paper px-2 py-1 text-sm"
          />
          <input
            name="back"
            value={back}
            onChange={(e) => setBack(e.target.value)}
            required
            className="rounded border border-ink/20 bg-paper px-2 py-1 text-sm"
          />
        </div>
        {showReading && (
          <input
            name="reading"
            value={reading}
            onChange={(e) => setReading(e.target.value)}
            placeholder="Reading / furigana"
            className="rounded border border-ink/20 bg-paper px-2 py-1 text-sm"
          />
        )}
        <textarea
          name="example_sentence"
          value={exampleSentence}
          onChange={(e) => setExampleSentence(e.target.value)}
          placeholder="Example sentence"
          rows={2}
          className="rounded border border-ink/20 bg-paper px-2 py-1 text-sm"
        />
        <textarea
          name="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes"
          rows={2}
          className="rounded border border-ink/20 bg-paper px-2 py-1 text-sm"
        />
        <input
          name="image_url"
          defaultValue={card.image_url ?? ""}
          placeholder="Image URL"
          className="rounded border border-ink/20 bg-paper px-2 py-1 text-sm"
        />
        <button
          type="button"
          onClick={generate}
          disabled={generating || !front.trim() || !back.trim()}
          className="flex w-fit items-center gap-1 rounded border border-gold/50 px-3 py-1 text-xs text-gold transition hover:bg-gold/10 disabled:opacity-40"
        >
          <Sparkles size={12} /> {generating ? "Generating…" : "Generate example + mnemonic"}
        </button>
        {genError && <p className="text-xs text-red">{genError}</p>}
        <div className="flex gap-2">
          <button type="submit" className="rounded bg-blue px-3 py-1 text-xs font-medium text-paper">
            Save
          </button>
          <button type="button" onClick={() => setEditing(false)} className="flex items-center gap-1 rounded border border-ink/20 px-3 py-1 text-xs">
            <X size={12} /> Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="paper-card flex items-start justify-between gap-3 rounded-lg p-3">
      <div>
        {card.reading && <p className="text-xs text-ink-soft">{card.reading}</p>}
        <p className="font-medium">
          {card.front} <span className="text-ink-soft">→</span> {card.back}
        </p>
        {card.example_sentence && <p className="text-sm italic text-ink-soft">{card.example_sentence}</p>}
        <p className="mt-1 text-xs text-ink-soft">
          due {card.due_date} · ease {card.ease_factor} · reps {card.repetitions}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button onClick={() => setEditing(true)} className="text-ink-soft transition hover:text-blue">
          <Pencil size={16} />
        </button>
        <form action={deleteCard.bind(null, card.id, languageId)}>
          <ConfirmSubmitButton confirmMessage="Delete this card?" className="text-ink-soft transition hover:text-red">
            <Trash2 size={16} />
          </ConfirmSubmitButton>
        </form>
      </div>
    </div>
  );
}
