import { NextRequest, NextResponse } from "next/server";

const ANTHROPIC_MODEL = "claude-sonnet-5";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set. Add it to .env.local to enable the AI tutor." },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.messages)) {
    return NextResponse.json({ error: "Request must include a messages array." }, { status: 400 });
  }

  const messages: ChatMessage[] = body.messages
    .slice(-20)
    .filter((m: unknown): m is ChatMessage => {
      const msg = m as { role?: unknown; content?: unknown };
      return (
        (msg.role === "user" || msg.role === "assistant") &&
        typeof msg.content === "string" &&
        msg.content.length > 0
      );
    })
    .map((m: ChatMessage) => ({ role: m.role, content: m.content.slice(0, 4000) }));

  if (messages.length === 0) {
    return NextResponse.json({ error: "No valid messages provided." }, { status: 400 });
  }

  const systemPrompt = typeof body.systemPrompt === "string" ? body.systemPrompt.slice(0, 4000) : undefined;

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    return NextResponse.json(
      { error: `Claude API error (${response.status}): ${errText.slice(0, 300)}` },
      { status: 502 }
    );
  }

  const data = await response.json();
  const textBlock = Array.isArray(data.content)
    ? data.content.find((block: { type?: string }) => block.type === "text")
    : undefined;
  const reply = textBlock?.text ?? "";

  return NextResponse.json({ reply });
}
