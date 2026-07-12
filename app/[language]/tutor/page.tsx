import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getLanguage } from "@/lib/queries";
import { buildTutorSystemPrompt } from "@/lib/tutor";
import { TutorChat } from "@/components/TutorChat";

export default async function TutorPage({ params }: { params: Promise<{ language: string }> }) {
  const { language: languageId } = await params;
  const language = getLanguage(languageId);
  if (!language) notFound();

  const systemPrompt = buildTutorSystemPrompt(language);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10 sm:px-10">
      <Link href={`/${language.id}`} className="flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
        <ArrowLeft size={16} /> {language.name}
      </Link>

      <header>
        <h1 className="font-display text-3xl font-bold">{language.flag_emoji} Tutor</h1>
        <p className="text-sm text-ink-soft">Ask for grammar explanations, example sentences, corrections, or practice conversations.</p>
      </header>

      <TutorChat languageName={language.name} systemPrompt={systemPrompt} />
    </div>
  );
}
