import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookMarked, Flame, Layers, MessageCircle, SquareStack } from "lucide-react";
import {
  getCardStats,
  getDueCardsCount,
  getLanguage,
  getLanguageStreak,
  getLongestStreak,
  getResources,
  getSessionStats,
  getTodayCompletions,
  getTotalInputMinutes,
  todayStr,
} from "@/lib/queries";
import { generateDailyPlan, STAGE_LABELS } from "@/lib/plan";
import { computeBadges } from "@/lib/badges";
import { DailyPlanList } from "@/components/DailyPlanList";
import { SessionLoggerForm } from "@/components/SessionLoggerForm";
import { LanguageSettingsForm } from "@/components/LanguageSettingsForm";
import { BadgeRow } from "@/components/BadgeRow";
import { JapaneseTrackerForm } from "@/components/JapaneseTrackerForm";

function addDaysStr(dateStr: string, delta: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

export default async function LanguagePage({ params }: { params: Promise<{ language: string }> }) {
  const { language: languageId } = await params;
  const language = getLanguage(languageId);
  if (!language) notFound();

  const dueCount = getDueCardsCount(language.id);
  const completions = getTodayCompletions(language.id);
  const plan = generateDailyPlan(language, dueCount, completions);
  const streak = getLanguageStreak(language.id);
  const cardStats = getCardStats(language.id);
  const weekStats = getSessionStats(language.id, addDaysStr(todayStr(), -6));
  const resourceCount = getResources(language.id).length;
  const longestStreak = getLongestStreak(language.id);
  const totalInputHours = Math.round((getTotalInputMinutes(language.id) / 60) * 10) / 10;
  const badges = computeBadges(longestStreak, totalInputHours);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10 sm:px-10">
      <Link href="/" className="flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
        <ArrowLeft size={16} /> Dashboard
      </Link>

      <header className="flex items-center gap-3">
        <span className="text-4xl leading-none">{language.flag_emoji}</span>
        <div>
          <h1 className="font-display text-3xl font-bold">{language.name}</h1>
          <span className="text-xs uppercase tracking-wide text-ink-soft">
            {STAGE_LABELS[language.stage]}
            {language.jlpt_level ? ` · JLPT ${language.jlpt_level}` : ""}
            {language.is_primary ? " · Primary" : ""}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-1 text-red">
          <Flame size={18} />
          <span className="font-medium">{streak}</span>
        </div>
      </header>

      <BadgeRow badges={badges} />

      <LanguageSettingsForm language={language} />
      {language.id === "japanese" && <JapaneseTrackerForm language={language} />}

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-xl font-semibold">Today&apos;s Plan</h2>
        <DailyPlanList languageId={language.id} items={plan} />
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link
          href={`/${language.id}/flashcards`}
          className="paper-card flex items-center justify-between rounded-lg p-4 transition hover:border-blue"
        >
          <span className="flex items-center gap-2 font-medium">
            <Layers size={18} /> Flashcards
          </span>
          <span className="text-sm text-ink-soft">
            {cardStats.due} due · {cardStats.total} total
          </span>
        </Link>
        <Link
          href={`/${language.id}/resources`}
          className="paper-card flex items-center justify-between rounded-lg p-4 transition hover:border-blue"
        >
          <span className="flex items-center gap-2 font-medium">
            <BookMarked size={18} /> Resources
          </span>
          <span className="text-sm text-ink-soft">{resourceCount} available</span>
        </Link>
        <Link
          href={`/${language.id}/tutor`}
          className="paper-card flex items-center justify-between rounded-lg p-4 transition hover:border-blue"
        >
          <span className="flex items-center gap-2 font-medium">
            <MessageCircle size={18} /> Tutor
          </span>
          <span className="text-sm text-ink-soft">Ask anything</span>
        </Link>
        {language.id === "japanese" && (
          <Link
            href={`/${language.id}/kana-quiz`}
            className="paper-card flex items-center justify-between rounded-lg p-4 transition hover:border-blue"
          >
            <span className="flex items-center gap-2 font-medium">
              <SquareStack size={18} /> Kana Quiz
            </span>
            <span className="text-sm text-ink-soft">Hiragana / Katakana</span>
          </Link>
        )}
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SessionLoggerForm languageId={language.id} />
        <div className="paper-card flex flex-col gap-2 rounded-lg p-4">
          <h3 className="font-display text-lg font-semibold">Last 7 days</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <dt className="text-ink-soft">Input</dt>
            <dd className="text-right font-medium">{weekStats.totalInputMinutes} min</dd>
            <dt className="text-ink-soft">Output</dt>
            <dd className="text-right font-medium">{weekStats.totalOutputMinutes} min</dd>
            <dt className="text-ink-soft">Cards reviewed</dt>
            <dd className="text-right font-medium">{weekStats.cardsReviewed}</dd>
            <dt className="text-ink-soft">Days studied</dt>
            <dd className="text-right font-medium">{weekStats.daysStudied} / 7</dd>
          </dl>
        </div>
      </section>
    </div>
  );
}
