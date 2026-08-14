import { NextResponse } from "next/server";
import {
  buildAssistantContext,
  ChatMessage,
  requireDashboardAuth,
} from "@/app/api/_lib/ai-context";

const ALLOWED_MODELS = new Set([
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
]);

const DEFAULT_MODEL = "gemini-3.6-flash";

function resolveModel(): string {
  const fromEnv = process.env.GEMINI_MODEL?.trim();
  if (fromEnv && ALLOWED_MODELS.has(fromEnv)) return fromEnv;
  return DEFAULT_MODEL;
}

function toGeminiContents(history: ChatMessage[], userMessage: string) {
  const contents: { role: "user" | "model"; parts: { text: string }[] }[] = [];

  for (const item of history) {
    if (item.role === "system") continue;
    const role = item.role === "assistant" ? "model" : "user";
    const text = typeof item.content === "string" ? item.content : "";
    if (!text.trim()) continue;
    contents.push({ role, parts: [{ text }] });
  }

  contents.push({ role: "user", parts: [{ text: userMessage }] });
  return contents;
}

function extractReply(data: unknown): string {
  if (!data || typeof data !== "object") return "No response from model.";
  const candidates = (data as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return "No response from model.";
  }
  const parts = (candidates[0] as { content?: { parts?: unknown } })?.content?.parts;
  if (!Array.isArray(parts)) return "No response from model.";
  const text = parts
    .map((part) =>
      typeof part === "object" && part && "text" in part
        ? String((part as { text?: unknown }).text ?? "")
        : ""
    )
    .join("");
  return text.trim() || "No response from model.";
}

export async function POST(req: Request) {
  if (!(await requireDashboardAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);

  if (!body?.message || typeof body.message !== "string") {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const apiKeyFromBody =
    typeof body.apiKey === "string" ? body.apiKey.trim() : "";
  const apiKey = apiKeyFromBody || process.env.GEMINI_API_KEY?.trim() || "";

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Gemini API key missing. Paste it in the Gemini AI section or set GEMINI_API_KEY.",
      },
      { status: 400 }
    );
  }

  const history: ChatMessage[] = Array.isArray(body.history) ? body.history : [];
  const systemInstruction = await buildAssistantContext();
  const model = resolveModel();

  let geminiRes: Response;
  try {
    geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: toGeminiContents(history, body.message.trim()),
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
        cache: "no-store",
      }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Cannot reach Gemini: ${msg}` },
      { status: 502 }
    );
  }

  if (geminiRes.status === 429) {
    return NextResponse.json(
      {
        error:
          "Gemini free-tier rate limit hit. Wait a bit and try again, or switch to a higher quota plan.",
      },
      { status: 429 }
    );
  }

  if (!geminiRes.ok) {
    const text = await geminiRes.text().catch(() => "");
    return NextResponse.json(
      { error: `Gemini error ${geminiRes.status}: ${text}` },
      { status: 502 }
    );
  }

  const data = await geminiRes.json();
  return NextResponse.json({ reply: extractReply(data) });
}
