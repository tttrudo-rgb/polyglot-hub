import { logSession } from "@/lib/actions";

export function SessionLoggerForm({ languageId }: { languageId: string }) {
  return (
    <form action={logSession} className="paper-card flex flex-col gap-3 rounded-lg p-4">
      <input type="hidden" name="language_id" value={languageId} />
      <h3 className="font-display text-lg font-semibold">Log a session</h3>
      <div className="flex flex-wrap gap-2">
        <select name="type" defaultValue="input" className="rounded border border-ink/20 bg-paper px-2 py-1.5 text-sm">
          <option value="input">Input</option>
          <option value="output">Output</option>
          <option value="review">Review</option>
          <option value="conversation">Conversation</option>
        </select>
        <input
          name="duration_minutes"
          type="number"
          min={1}
          max={600}
          required
          placeholder="Minutes"
          className="w-28 rounded border border-ink/20 bg-paper px-2 py-1.5 text-sm"
        />
      </div>
      <input
        name="note"
        placeholder="Note (optional)"
        className="rounded border border-ink/20 bg-paper px-2 py-1.5 text-sm"
      />
      <button
        type="submit"
        className="self-start rounded bg-blue px-3 py-1.5 text-sm font-medium text-paper transition hover:opacity-90"
      >
        Log session
      </button>
    </form>
  );
}
