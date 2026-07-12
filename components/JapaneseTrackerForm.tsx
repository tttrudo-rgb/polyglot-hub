import type { Language } from "@/lib/types";
import { updateJapaneseTracking } from "@/lib/actions";

const JLPT_LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;

export function JapaneseTrackerForm({ language }: { language: Language }) {
  return (
    <form action={updateJapaneseTracking} className="paper-card flex flex-wrap items-end gap-4 rounded-lg p-4 text-sm">
      <input type="hidden" name="language_id" value={language.id} />
      <label className="flex flex-col gap-1 text-xs text-ink-soft">
        JLPT level
        <select name="jlpt_level" defaultValue={language.jlpt_level ?? ""} className="rounded border border-ink/20 bg-paper px-2 py-1">
          <option value="">Not set</option>
          {JLPT_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-ink-soft">
        WaniKani level
        <input
          name="wanikani_level"
          type="number"
          min={1}
          max={60}
          defaultValue={language.wanikani_level ?? ""}
          placeholder="1–60"
          className="w-24 rounded border border-ink/20 bg-paper px-2 py-1"
        />
      </label>
      <button type="submit" className="rounded border border-ink/20 px-2 py-1 text-xs hover:border-blue hover:text-blue">
        Save
      </button>
    </form>
  );
}
