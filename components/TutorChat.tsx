"use client";

import { useState } from "react";
import { Send } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Explain a grammar point I'm confused about",
  "Give me 5 example sentences using a word I choose",
  "Correct my writing",
  "Give me a beginner conversation to practice",
];

export function TutorChat({ languageName, systemPrompt }: { languageName: string; systemPrompt: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/claude", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, systemPrompt }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setError("Couldn't reach the tutor. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {messages.length === 0 && !error && (
        <div className="paper-card flex flex-col gap-2 rounded-lg p-4">
          <p className="text-sm text-ink-soft">Try asking your {languageName} tutor:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-ink/20 px-3 py-1 text-xs text-ink-soft transition hover:border-blue hover:text-blue"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`paper-card max-w-[85%] rounded-lg p-3 text-sm whitespace-pre-wrap ${
              m.role === "user" ? "self-end bg-blue/10" : "self-start"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && <div className="paper-card self-start rounded-lg p-3 text-sm text-ink-soft">Thinking…</div>}
      </div>

      {error && (
        <div className="rounded-lg border border-red/30 bg-red/10 p-3 text-sm text-red">{error}</div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask your ${languageName} tutor anything…`}
          className="flex-1 rounded border border-ink/20 bg-paper px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-1 rounded bg-blue px-3 py-2 text-sm font-medium text-paper transition hover:opacity-90 disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
