import { BookOpen } from "lucide-react";
import { getGlobalStreak, getLanguages, todayStr } from "@/lib/queries";
import { LanguageCard } from "@/components/LanguageCard";
import { AddLanguageForm } from "@/components/AddLanguageForm";

// This page reads live DB state (languages, streaks) with no dynamic route
// segment to force per-request rendering, so Next would otherwise statically
// prerender it once at build time and freeze that snapshot.
export const dynamic = "force-dynamic";

const QUOTES = [
  ["Learning another language is not only learning different words for the same things, but learning another way to think about things.", "Flora Lewis"],
  ["One language sets you in a corridor for life. Two languages open every door along the way.", "Frank Smith"],
  ["He who knows no foreign languages knows nothing of his own.", "Johann Wolfgang von Goethe"],
  ["The more languages you know, the more you are human.", "Tomáš Garrigue Masaryk"],
  ["To have another language is to possess a second soul.", "Charlemagne"],
  ["Comprehensible input isn't the best way to teach language acquisition. It's the only way.", "Stephen Krashen"],
] as const;

function quoteOfTheDay() {
  const day = new Date().getDate();
  return QUOTES[day % QUOTES.length];
}

export default function Home() {
  const languages = getLanguages();
  const globalStreak = getGlobalStreak();
  const [quote, author] = quoteOfTheDay();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10 sm:px-10">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-ink-soft">
          <BookOpen size={20} />
          <span className="text-xs uppercase tracking-[0.2em]">{todayStr()}</span>
        </div>
        <h1 className="font-display text-4xl font-bold">The Polyglot Hub</h1>
        <p className="max-w-2xl text-sm text-ink-soft">
          {globalStreak > 0
            ? `${globalStreak}-day global streak — keep it going.`
            : "Study any language today to start a new streak."}
        </p>
      </header>

      <blockquote className="paper-card rounded-lg border-l-4 border-l-gold p-4 font-display italic text-ink-soft">
        “{quote}”
        <footer className="mt-1 text-sm not-italic text-ink-soft/80">— {author}</footer>
      </blockquote>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {languages.map((language) => (
          <LanguageCard key={language.id} language={language} />
        ))}
        <AddLanguageForm />
      </section>
    </div>
  );
}
