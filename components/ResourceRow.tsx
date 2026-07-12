"use client";

import { useState } from "react";
import { ExternalLink, Pencil, Star, Trash2, X } from "lucide-react";
import type { Resource } from "@/lib/types";
import { deleteResource, toggleFavoriteResource, updateResource } from "@/lib/actions";
import { ConfirmSubmitButton } from "./ConfirmSubmitButton";

const TYPE_COLORS: Record<string, string> = {
  video: "bg-blue/15 text-blue",
  podcast: "bg-gold/20 text-gold",
  reading: "bg-green/15 text-green",
  app: "bg-red/15 text-red",
};

export function ResourceRow({ resource, languageId }: { resource: Resource; languageId: string }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <form
        action={async (formData) => {
          await updateResource(formData);
          setEditing(false);
        }}
        className="paper-card flex flex-col gap-2 rounded-lg p-3"
      >
        <input type="hidden" name="id" value={resource.id} />
        <input type="hidden" name="language_id" value={languageId} />
        <input name="title" defaultValue={resource.title} required className="rounded border border-ink/20 bg-paper px-2 py-1 text-sm" />
        <input name="url" defaultValue={resource.url ?? ""} placeholder="https://..." className="rounded border border-ink/20 bg-paper px-2 py-1 text-sm" />
        <input
          name="description"
          defaultValue={resource.description ?? ""}
          placeholder="Description"
          className="rounded border border-ink/20 bg-paper px-2 py-1 text-sm"
        />
        <div className="flex gap-2">
          <select name="type" defaultValue={resource.type} className="rounded border border-ink/20 bg-paper px-2 py-1 text-sm">
            <option value="video">Video</option>
            <option value="podcast">Podcast</option>
            <option value="reading">Reading</option>
            <option value="app">App</option>
          </select>
          <select name="level" defaultValue={resource.level} className="rounded border border-ink/20 bg-paper px-2 py-1 text-sm">
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
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
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{resource.title}</p>
          <span className={`rounded-full px-2 py-0.5 text-xs ${TYPE_COLORS[resource.type] ?? ""}`}>{resource.type}</span>
          <span className="rounded-full bg-ink/5 px-2 py-0.5 text-xs text-ink-soft">{resource.level}</span>
          {resource.is_custom ? <span className="text-xs text-ink-soft">· custom</span> : null}
        </div>
        {resource.description && <p className="mt-1 text-sm text-ink-soft">{resource.description}</p>}
        {resource.url ? (
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 flex w-fit items-center gap-1 text-sm text-blue hover:underline"
          >
            <ExternalLink size={12} /> Open link
          </a>
        ) : (
          <p className="mt-1 text-xs text-ink-soft/70">No link saved — edit to add one</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <form action={toggleFavoriteResource.bind(null, resource.id, languageId)}>
          <button
            type="submit"
            aria-label={resource.is_favorite ? "Unfavorite" : "Favorite"}
            className={resource.is_favorite ? "text-gold" : "text-ink-soft transition hover:text-gold"}
          >
            <Star size={16} fill={resource.is_favorite ? "currentColor" : "none"} />
          </button>
        </form>
        <button onClick={() => setEditing(true)} className="text-ink-soft transition hover:text-blue">
          <Pencil size={16} />
        </button>
        <form action={deleteResource.bind(null, resource.id, languageId)}>
          <ConfirmSubmitButton confirmMessage="Delete this resource?" className="text-ink-soft transition hover:text-red">
            <Trash2 size={16} />
          </ConfirmSubmitButton>
        </form>
      </div>
    </div>
  );
}
