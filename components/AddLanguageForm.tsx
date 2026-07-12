"use client";

import { useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { addLanguage } from "@/lib/actions";

export function AddLanguageForm() {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="paper-card flex min-h-[180px] w-full flex-col items-center justify-center gap-2 rounded-lg border-dashed p-6 text-ink-soft transition hover:text-ink"
      >
        <Plus size={28} />
        <span className="text-sm">Add a language</span>
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await addLanguage(formData);
        formRef.current?.reset();
        setOpen(false);
      }}
      className="paper-card flex flex-col gap-3 rounded-lg p-5"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">New language</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-ink-soft hover:text-ink">
          <X size={18} />
        </button>
      </div>
      <div className="flex gap-2">
        <input
          name="flag_emoji"
          placeholder="🏳️"
          maxLength={4}
          defaultValue="🌐"
          className="w-16 rounded border border-ink/20 bg-paper px-2 py-1.5 text-center text-lg"
        />
        <input
          name="name"
          required
          placeholder="Language name"
          className="flex-1 rounded border border-ink/20 bg-paper px-2 py-1.5"
        />
      </div>
      <div className="flex gap-2">
        <select
          name="stage"
          defaultValue="beginner"
          className="flex-1 rounded border border-ink/20 bg-paper px-2 py-1.5"
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <input
          name="daily_budget_minutes"
          type="number"
          min={5}
          max={240}
          defaultValue={15}
          className="w-24 rounded border border-ink/20 bg-paper px-2 py-1.5"
          title="Daily minutes"
        />
      </div>
      <button
        type="submit"
        className="mt-1 rounded bg-blue px-3 py-2 text-sm font-medium text-paper transition hover:opacity-90"
      >
        Add language
      </button>
    </form>
  );
}
