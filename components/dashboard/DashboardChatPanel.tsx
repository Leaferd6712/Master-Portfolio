"use client";

import { ChatMessage } from "@/lib/api";
import { FormEvent, ReactNode, useRef, useState } from "react";

const prompts = [
  "Break this into tasks",
  "Improve my roadmap",
  "What should I do next?",
  "Organize my projects",
  "Summarise what I'm working on",
  "What are my highest priority items?",
];

export default function DashboardChatPanel({
  emptyHint,
  error,
  extraSidebar,
  messages,
  modelHint,
  modelName,
  onClear,
  onSend,
  placeholder,
  sending,
}: {
  emptyHint: string;
  error: string;
  extraSidebar?: ReactNode;
  messages: ChatMessage[];
  modelHint: string;
  modelName: string;
  onClear: () => void;
  onSend: (text: string) => Promise<void>;
  placeholder: string;
  sending: boolean;
}) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    await onSend(text);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)] gap-6">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="text-lg font-semibold text-white">Suggested prompts</h2>
        <div className="mt-4 space-y-3">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => setInput(prompt)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-left text-sm text-zinc-300 hover:text-white hover:border-sky-500/30 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Model</p>
          <p className="text-sm text-emerald-400 font-mono">{modelName}</p>
          <p className="text-xs text-zinc-600 mt-1">{modelHint}</p>
        </div>

        {extraSidebar}

        {messages.length > 0 && (
          <button
            type="button"
            onClick={onClear}
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
                <p className="text-zinc-400 text-sm">
                  Ask anything about your projects, tasks, or roadmap.
                </p>
                <p className="text-zinc-600 text-xs mt-1">{emptyHint}</p>
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
          <form onSubmit={handleSubmit}>
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
              placeholder={placeholder}
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
  );
}
