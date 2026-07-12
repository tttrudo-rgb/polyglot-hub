"use client";

import { useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { addResource } from "@/lib/actions";

export function AddResourceForm({ languageId }: { languageId: string }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="paper-card flex items-center justify-center gap-2 rounded-lg border-dashed p-3 text-ink-soft transition hover:text-ink"
      >
        <Plus size={18} /> Add a resource
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await addResource(formData);
        formRef.current?.reset();
        setOpen(false);
      }}
      className="paper-card flex flex-col gap-2 rounded-lg p-4"
    >
      <input type="hidden" name="language_id" value={languageId} />
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">New resource</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-ink-soft hover:text-ink">
          <X size={18} />
        </button>
      </div>
      <input name="title" required placeholder="Title" className="rounded border border-ink/20 bg-paper px-2 py-1.5 text-sm" />
      <input name="url" placeholder="https:// (optional)" className="rounded border border-ink/20 bg-paper px-2 py-1.5 text-sm" />
      <input name="description" placeholder="Description (optional)" className="rounded border border-ink/20 bg-paper px-2 py-1.5 text-sm" />
      <div className="grid grid-cols-2 gap-2">
        <select name="type" defaultValue="video" className="rounded border border-ink/20 bg-paper px-2 py-1.5 text-sm">
          <option value="video">Video</option>
          <option value="podcast">Podcast</option>
          <option value="reading">Reading</option>
          <option value="app">App</option>
        </select>
        <select name="level" defaultValue="beginner" className="rounded border border-ink/20 bg-paper px-2 py-1.5 text-sm">
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>
      <button
        type="submit"
        className="mt-1 self-start rounded bg-blue px-3 py-1.5 text-sm font-medium text-paper transition hover:opacity-90"
      >
        Add resource
      </button>
    </form>
  );
}
