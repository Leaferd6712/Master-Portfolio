"use client";

import DashboardShell from "@/components/dashboard/DashboardShell";
import { FormEvent, useRef, useState } from "react";
import { sendChatMessage, ChatMessage } from "@/lib/api";

const prompts = [
  "Break this into tasks",
  "Improve my roadmap",
  "What should I do next?",
  "Organize my projects",
  "Summarise what I'm working on",
  "What are my highest priority items?",
];

export default function DashboardAIPage() {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function onSend(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!input.trim()) return;

    const text = input.trim();
    setInput("");
    setError("");
    setSending(true);

    const updatedMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(updatedMessages);

    // Scroll to bottom after user message renders
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

    try {
      // Pass full history (all messages before the new user message) for context
      const res = await sendChatMessage(text, messages);
      const next: ChatMessage[] = [...updatedMessages, { role: "assistant", content: res.reply }];
      setMessages(next);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
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
    <DashboardShell title="AI" description="Local LM Studio model.">
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

          <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Model</p>
            <p className="text-sm text-emerald-400 font-mono">qwen2.5-coder-3b</p>
            <p className="text-xs text-zinc-600 mt-1">LM Studio · port 1234</p>
          </div>

          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => setMessages([])}
              className="mt-4 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-500 hover:text-red-400 hover:border-red-500/30 transition-colors"
            >
              Clear chat
            </button>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-4 min-h-[260px] max-h-[60vh]">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center py-16 text-center">
                <div>
                  <p className="text-2xl mb-3">🤖</p>
                  <p className="text-zinc-400 text-sm">Ask anything about your projects, tasks, or roadmap.</p>
                  <p className="text-zinc-600 text-xs mt-1">Make sure LM Studio is running on port 1234.</p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
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
              ))
            )}

            {sending && (
              <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-sky-500/12 border border-sky-500/20 p-4 text-sky-400 text-sm animate-pulse">
                Thinking...
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="mt-6 border-t border-zinc-800 pt-6">
            <form onSubmit={onSend}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (input.trim() && !sending) {
                      e.currentTarget.form?.requestSubmit();
                    }
                  }
                }}
                placeholder="Ask the AI to break work into tasks, improve the roadmap, or organize projects… (Enter to send, Shift+Enter for new line)"
                className="min-h-28 w-full rounded-2xl border border-zinc-700 bg-zinc-950 p-4 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-sky-500"
              />
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-sm text-red-400">{error}</p>
                <button
                  type="submit"
                  disabled={sending || input.trim().length === 0}
                  className="rounded-xl bg-sky-500 px-4 py-2.5 font-semibold text-white hover:bg-sky-400 transition-colors disabled:opacity-50"
                >
                  {sending ? "Thinking..." : "Send"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
