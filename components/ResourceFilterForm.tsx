"use client";

import { useRouter, useSearchParams } from "next/navigation";

const LEVELS = ["beginner", "intermediate", "advanced"] as const;
const TYPES = ["video", "podcast", "reading", "app"] as const;

export function ResourceFilterForm({ languageId }: { languageId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const level = searchParams.get("level") ?? "";
  const type = searchParams.get("type") ?? "";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    const qs = params.toString();
    router.push(`/${languageId}/resources${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <select
        value={level}
        onChange={(e) => updateParam("level", e.target.value)}
        className="rounded border border-ink/20 bg-paper px-2 py-1.5 text-sm"
      >
        <option value="">All levels</option>
        {LEVELS.map((l) => (
          <option key={l} value={l}>
            {l[0].toUpperCase() + l.slice(1)}
          </option>
        ))}
      </select>
      <select
        value={type}
        onChange={(e) => updateParam("type", e.target.value)}
        className="rounded border border-ink/20 bg-paper px-2 py-1.5 text-sm"
      >
        <option value="">All types</option>
        {TYPES.map((t) => (
          <option key={t} value={t}>
            {t[0].toUpperCase() + t.slice(1)}
          </option>
        ))}
      </select>
      {(level || type) && (
        <button
          onClick={() => router.push(`/${languageId}/resources`)}
          className="rounded border border-ink/20 px-2 py-1.5 text-sm text-ink-soft hover:text-ink"
        >
          Clear
        </button>
      )}
    </div>
  );
}
