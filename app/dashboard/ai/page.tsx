"use client";

import DashboardShell from "@/components/dashboard/DashboardShell";
import { FormEvent, useState } from "react";
import { sendChatMessage } from "@/lib/api";

const prompts = [
  "Break this into tasks",
  "Improve my roadmap",
  "What should I do next?",
  "Organize my projects",
];

export default function DashboardAIPage() {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    { role: "user", content: "What should I focus on next?" },
    {
      role: "assistant",
      content:
        "Finish your active projects first. After that, wire the dashboard to FastAPI so your portfolio and private system share the same data source.",
    },
  ]);

  async function onSend(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!input.trim()) return;

    const text = input.trim();
    setInput("");
    setError("");
    setSending(true);
    setMessages((prev) => [...prev, { role: "user", content: text }]);

    try {
      const res = await sendChatMessage(text);
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "AI request failed";
      setError(msg);
    } finally {
      setSending(false);
    }
  }

  function usePrompt(prompt: string) {
    setInput(prompt);
  }

  return (
    <DashboardShell
      title="AI Planning Panel"
      description="Chat panel connected to the backend AI endpoint with dashboard context."
    >
      <div className="grid grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)] gap-6">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-lg font-semibold text-white">Suggested prompts</h2>
          <div className="mt-4 space-y-3">
            {prompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => usePrompt(prompt)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-left text-sm text-zinc-300 hover:text-white hover:border-sky-500/30 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={
                  message.role === "assistant"
                    ? "ml-auto max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-sky-500/12 border border-sky-500/20 p-4 text-sky-50"
                    : "max-w-[75%] whitespace-pre-wrap rounded-2xl rounded-bl-md bg-zinc-950 border border-zinc-800 p-4 text-zinc-200"
                }
              >
                {message.content}
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-zinc-800 pt-6">
            <form onSubmit={onSend}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask the AI to break work into tasks, improve the roadmap, or organize projects..."
                className="min-h-28 w-full rounded-2xl border border-zinc-700 bg-zinc-950 p-4 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-sky-500"
              />
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-sm text-zinc-500">{error}</p>
                <button
                  type="submit"
                  disabled={sending || input.trim().length === 0}
                  className="rounded-xl bg-sky-500 px-4 py-2.5 font-semibold text-white hover:bg-sky-400 transition-colors"
                >
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
