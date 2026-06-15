import { NextResponse } from "next/server";

const LM_STUDIO_URL =
  process.env.LOCAL_AI_URL ?? "http://127.0.0.1:1234";

const SYSTEM_PROMPT = `You are a focused portfolio planning assistant for a developer's private admin dashboard.
You help break projects into tasks, prioritise work, plan roadmaps, and give concise actionable advice.
Keep replies short and practical — bullet points where helpful, no unnecessary fluff.`;

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  if (!body?.message || typeof body.message !== "string") {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const history: ChatMessage[] = Array.isArray(body.history) ? body.history : [];

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history,
    { role: "user", content: body.message.trim() },
  ];

  let lmRes: Response;
  try {
    lmRes = await fetch(`${LM_STUDIO_URL}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.LOCAL_AI_MODEL ?? "qwen2.5-coder-3b-instruct",
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
      cache: "no-store",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Cannot reach LM Studio: ${msg}. Make sure LM Studio is running on port 1234.` },
      { status: 502 }
    );
  }

  if (!lmRes.ok) {
    const text = await lmRes.text().catch(() => "");
    return NextResponse.json(
      { error: `LM Studio error ${lmRes.status}: ${text}` },
      { status: 502 }
    );
  }

  const data = await lmRes.json();
  const reply: string =
    data?.choices?.[0]?.message?.content ?? "No response from model.";

  return NextResponse.json({ reply });
}
