"use client";

import { useRef, useState } from "react";
import { Plus, Sparkles, X } from "lucide-react";
import { addCard } from "@/lib/actions";

export function AddCardForm({ languageId, languageName, showReading = false }: { languageId: string; languageName: string; showReading?: boolean }) {
  const [open, setOpen] = useState(false);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [reading, setReading] = useState("");
  const [exampleSentence, setExampleSentence] = useState("");
  const [notes, setNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function resetFields() {
    setFront("");
    setBack("");
    setReading("");
    setExampleSentence("");
    setNotes("");
    setGenError(null);
  }

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

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="paper-card flex items-center justify-center gap-2 rounded-lg border-dashed p-3 text-ink-soft transition hover:text-ink"
      >
        <Plus size={18} /> Add a card
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await addCard(formData);
        formRef.current?.reset();
        resetFields();
        setOpen(false);
      }}
      className="paper-card flex flex-col gap-2 rounded-lg p-4"
    >
      <input type="hidden" name="language_id" value={languageId} />
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">New card</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-ink-soft hover:text-ink">
          <X size={18} />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input
          name="front"
          required
          placeholder="Front (target language)"
          value={front}
          onChange={(e) => setFront(e.target.value)}
          className="rounded border border-ink/20 bg-paper px-2 py-1.5 text-sm"
        />
        <input
          name="back"
          required
          placeholder="Back (meaning)"
          value={back}
          onChange={(e) => setBack(e.target.value)}
          className="rounded border border-ink/20 bg-paper px-2 py-1.5 text-sm"
        />
      </div>
      {showReading && (
        <input
          name="reading"
          placeholder="Reading / furigana (optional)"
          value={reading}
          onChange={(e) => setReading(e.target.value)}
          className="rounded border border-ink/20 bg-paper px-2 py-1.5 text-sm"
        />
      )}
      <textarea
        name="example_sentence"
        placeholder="Example sentence (optional)"
        value={exampleSentence}
        onChange={(e) => setExampleSentence(e.target.value)}
        rows={2}
        className="rounded border border-ink/20 bg-paper px-2 py-1.5 text-sm"
      />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <textarea
          name="notes"
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="rounded border border-ink/20 bg-paper px-2 py-1.5 text-sm"
        />
        <input
          name="image_url"
          placeholder="Image URL (optional)"
          className="rounded border border-ink/20 bg-paper px-2 py-1.5 text-sm"
        />
      </div>

      <button
        type="button"
        onClick={generate}
        disabled={generating || !front.trim() || !back.trim()}
        className="flex w-fit items-center gap-1 rounded border border-gold/50 px-3 py-1.5 text-sm text-gold transition hover:bg-gold/10 disabled:opacity-40"
      >
        <Sparkles size={14} /> {generating ? "Generating…" : "Generate example + mnemonic"}
      </button>
      {genError && <p className="text-xs text-red">{genError}</p>}

      <button
        type="submit"
        className="mt-1 self-start rounded bg-blue px-3 py-1.5 text-sm font-medium text-paper transition hover:opacity-90"
      >
        Add card
      </button>
    </form>
  );
}
