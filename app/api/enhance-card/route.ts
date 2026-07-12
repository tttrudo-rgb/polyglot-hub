import { NextRequest, NextResponse } from "next/server";

const ANTHROPIC_MODEL = "claude-sonnet-5";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

interface EnhancementResult {
  examples: string[];
  mnemonic: string;
  related: string[];
}

function extractJson(text: string): EnhancementResult | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed.examples) || typeof parsed.mnemonic !== "string" || !Array.isArray(parsed.related)) {
      return null;
    }
    return {
      examples: parsed.examples.slice(0, 3).map(String),
      mnemonic: String(parsed.mnemonic),
      related: parsed.related.slice(0, 6).map(String),
    };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set. Add it to .env.local to enable AI card enhancement." },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => null);
  const front = typeof body?.front === "string" ? body.front.trim().slice(0, 200) : "";
  const back = typeof body?.back === "string" ? body.back.trim().slice(0, 200) : "";
  const languageName = typeof body?.languageName === "string" ? body.languageName.slice(0, 50) : "the target language";

  if (!front || !back) {
    return NextResponse.json({ error: "front and back are required." }, { status: 400 });
  }

  const systemPrompt = [
    `You help a language learner enrich a flashcard for ${languageName}.`,
    `Respond with ONLY a JSON object, no other text, in this exact shape:`,
    `{"examples": ["...", "...", "..."], "mnemonic": "...", "related": ["...", "..."]}`,
    `"examples" is 2-3 natural sentences in ${languageName} using the word, each showing it in context.`,
    `"mnemonic" is one short, vivid memory tip in English for remembering the word.`,
    `"related" is 2-5 related words or synonyms in ${languageName}.`,
  ].join(" ");

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: "user", content: `Front: ${front}\nBack: ${back}` }],
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
  const result = extractJson(textBlock?.text ?? "");

  if (!result) {
    return NextResponse.json({ error: "Could not parse a usable response." }, { status: 502 });
  }

  return NextResponse.json(result);
}
