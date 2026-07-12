import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCards, getCardStats, getDueCards, getLanguage } from "@/lib/queries";
import { FlashcardReview } from "@/components/FlashcardReview";
import { AddCardForm } from "@/components/AddCardForm";
import { FlashcardRow } from "@/components/FlashcardRow";

export default async function FlashcardsPage({ params }: { params: Promise<{ language: string }> }) {
  const { language: languageId } = await params;
  const language = getLanguage(languageId);
  if (!language) notFound();

  const dueCards = getDueCards(language.id);
  const allCards = getCards(language.id);
  const stats = getCardStats(language.id);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10 sm:px-10">
      <Link href={`/${language.id}`} className="flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
        <ArrowLeft size={16} /> {language.name}
      </Link>

      <header>
        <h1 className="font-display text-3xl font-bold">
          {language.flag_emoji} Flashcards
        </h1>
        <p className="text-sm text-ink-soft">
          {stats.total} total · {stats.due} due · avg ease {stats.averageEase}
        </p>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-xl font-semibold">Review</h2>
        <FlashcardReview languageId={language.id} initialCards={dueCards} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-xl font-semibold">All cards</h2>
        <AddCardForm languageId={language.id} languageName={language.name} showReading={language.id === "japanese"} />
        {allCards.length === 0 ? (
          <p className="text-sm text-ink-soft">No cards yet — add your first one above.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {allCards.map((card) => (
              <FlashcardRow
                key={card.id}
                card={card}
                languageId={language.id}
                languageName={language.name}
                showReading={language.id === "japanese"}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
