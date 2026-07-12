import type { Language } from "@/lib/types";
import { updateDailyBudget, updateStage } from "@/lib/actions";

export function LanguageSettingsForm({ language }: { language: Language }) {
  return (
    <div className="paper-card flex flex-wrap items-end gap-4 rounded-lg p-4 text-sm">
      <form action={updateStage} className="flex items-end gap-2">
        <input type="hidden" name="language_id" value={language.id} />
        <label className="flex flex-col gap-1 text-xs text-ink-soft">
          Stage
          <select name="stage" defaultValue={language.stage} className="rounded border border-ink/20 bg-paper px-2 py-1">
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </label>
        <button type="submit" className="rounded border border-ink/20 px-2 py-1 text-xs hover:border-blue hover:text-blue">
          Save
        </button>
      </form>

      <form action={updateDailyBudget} className="flex items-end gap-2">
        <input type="hidden" name="language_id" value={language.id} />
        <label className="flex flex-col gap-1 text-xs text-ink-soft">
          Daily time budget (min)
          <input
            name="daily_budget_minutes"
            type="number"
            min={5}
            max={240}
            defaultValue={language.daily_budget_minutes}
            className="w-24 rounded border border-ink/20 bg-paper px-2 py-1"
          />
        </label>
        <button type="submit" className="rounded border border-ink/20 px-2 py-1 text-xs hover:border-blue hover:text-blue">
          Save
        </button>
      </form>
    </div>
  );
}
