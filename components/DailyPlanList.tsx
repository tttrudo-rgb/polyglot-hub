import { Check } from "lucide-react";
import type { PlanItem } from "@/lib/plan";
import { togglePlanItem } from "@/lib/actions";

export function DailyPlanList({ languageId, items }: { languageId: string; items: PlanItem[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.key} className="paper-card flex items-center gap-3 rounded-lg p-3">
          <form action={togglePlanItem.bind(null, languageId, item.key)}>
            <button
              type="submit"
              aria-label={item.completed ? "Mark incomplete" : "Mark complete"}
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 transition ${
                item.completed ? "border-green bg-green text-paper" : "border-ink/30 text-transparent"
              }`}
            >
              <Check size={14} strokeWidth={3} />
            </button>
          </form>
          <div className="flex-1">
            <p className={`font-medium ${item.completed ? "text-ink-soft line-through" : ""}`}>{item.title}</p>
            <p className="text-sm text-ink-soft">{item.description}</p>
          </div>
          <span className="shrink-0 rounded-full bg-ink/5 px-2 py-1 text-xs text-ink-soft">
            {item.minutes} min
          </span>
        </li>
      ))}
    </ul>
  );
}
