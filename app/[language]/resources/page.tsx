import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getLanguage, getResources } from "@/lib/queries";
import type { ResourceType, Stage } from "@/lib/types";
import { AddResourceForm } from "@/components/AddResourceForm";
import { ResourceFilterForm } from "@/components/ResourceFilterForm";
import { ResourceRow } from "@/components/ResourceRow";

export default async function ResourcesPage({
  params,
  searchParams,
}: {
  params: Promise<{ language: string }>;
  searchParams: Promise<{ level?: string; type?: string }>;
}) {
  const { language: languageId } = await params;
  const { level, type } = await searchParams;
  const language = getLanguage(languageId);
  if (!language) notFound();

  const resources = getResources(language.id, {
    level: level as Stage | undefined,
    type: type as ResourceType | undefined,
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10 sm:px-10">
      <Link href={`/${language.id}`} className="flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
        <ArrowLeft size={16} /> {language.name}
      </Link>

      <header>
        <h1 className="font-display text-3xl font-bold">{language.flag_emoji} Resources</h1>
        <p className="text-sm text-ink-soft">Comprehensible input library, curated + your own additions.</p>
      </header>

      <ResourceFilterForm languageId={language.id} />

      <AddResourceForm languageId={language.id} />

      {resources.length === 0 ? (
        <p className="text-sm text-ink-soft">No resources match these filters.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {resources.map((resource) => (
            <ResourceRow key={resource.id} resource={resource} languageId={language.id} />
          ))}
        </div>
      )}
    </div>
  );
}
