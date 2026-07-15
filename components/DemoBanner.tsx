import { Sparkles } from "lucide-react";

export function DemoBanner() {
  return (
    <div className="flex items-center justify-center gap-2 bg-gold px-4 py-2 text-center text-sm font-medium text-paper">
      <Sparkles size={14} />
      Demo mode — this is a live portfolio demo of The Polyglot Hub. AI Tutor and AI card generation are
      disabled here to protect the owner&apos;s API key; everything else is fully explorable.
    </div>
  );
}
