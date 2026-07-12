import { Award } from "lucide-react";
import type { Badge } from "@/lib/badges";

export function BadgeRow({ badges }: { badges: Badge[] }) {
  const achieved = badges.filter((b) => b.achieved);
  const next = badges.find((b) => !b.achieved);

  if (achieved.length === 0 && !next) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {achieved.map((b) => (
        <span
          key={b.key}
          className="flex items-center gap-1 rounded-full bg-gold/20 px-2 py-1 text-xs font-medium text-gold"
        >
          <Award size={12} /> {b.label}
        </span>
      ))}
      {next && (
        <span className="flex items-center gap-1 rounded-full border border-ink/15 px-2 py-1 text-xs text-ink-soft">
          <Award size={12} /> next: {next.label}
        </span>
      )}
    </div>
  );
}
