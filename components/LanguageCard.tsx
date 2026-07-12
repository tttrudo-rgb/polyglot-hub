import Link from "next/link";
import { Flame, Star, Trash2 } from "lucide-react";
import type { Language } from "@/lib/types";
import { getLanguageStreak, getWeeklyInputMinutes, getStageProgress } from "@/lib/queries";
import { STAGE_LABELS } from "@/lib/plan";
import { removeLanguage, setPrimaryLanguage } from "@/lib/actions";
import { ProgressBar } from "./ProgressBar";
import { ConfirmSubmitButton } from "./ConfirmSubmitButton";

export function LanguageCard({ language }: { language: Language }) {
  const streak = getLanguageStreak(language.id);
  const weeklyMinutes = getWeeklyInputMinutes(language.id);
  const progress = getStageProgress(language);
  const weeklyHours = Math.round((weeklyMinutes / 60) * 10) / 10;

  return (
    <div className="paper-card flex flex-col gap-3 rounded-lg p-5">
      <div className="flex items-start justify-between">
        <Link href={`/${language.id}`} className="flex items-center gap-2">
          <span className="text-3xl leading-none">{language.flag_emoji}</span>
          <div>
            <h3 className="font-display text-lg font-semibold leading-tight">{language.name}</h3>
            <span className="text-xs uppercase tracking-wide text-ink-soft">
              {STAGE_LABELS[language.stage]}
            </span>
          </div>
        </Link>
        {language.is_primary ? (
          <span className="flex items-center gap-1 rounded-full bg-gold/20 px-2 py-0.5 text-xs font-medium text-gold">
            <Star size={12} fill="currentColor" /> Primary
          </span>
        ) : (
          <form action={setPrimaryLanguage.bind(null, language.id)}>
            <button
              type="submit"
              className="rounded-full border border-ink/15 px-2 py-0.5 text-xs text-ink-soft transition hover:border-gold hover:text-gold"
            >
              Set primary
            </button>
          </form>
        )}
      </div>

      <div className="flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1 text-red">
          <Flame size={16} />
          {streak} day{streak === 1 ? "" : "s"}
        </span>
        <span className="text-ink-soft">{weeklyHours}h input / wk</span>
      </div>

      <div>
        <div className="mb-1 flex justify-between text-xs text-ink-soft">
          <span>Progress to next stage</span>
          <span>{progress.hoursNeeded ? `${progress.hoursLogged}h / ${progress.hoursNeeded}h` : "Maintaining"}</span>
        </div>
        <ProgressBar percent={progress.percent} color="var(--color-green)" />
      </div>

      <div className="mt-1 flex items-center justify-between">
        <Link
          href={`/${language.id}`}
          className="text-sm font-medium text-blue underline-offset-2 hover:underline"
        >
          Open daily plan →
        </Link>
        <form action={removeLanguage.bind(null, language.id)}>
          <ConfirmSubmitButton
            confirmMessage={`Remove ${language.name}? This deletes its cards and logged sessions.`}
            className="text-ink-soft transition hover:text-red"
          >
            <Trash2 size={16} />
          </ConfirmSubmitButton>
        </form>
      </div>
    </div>
  );
}
