"use client";

import DashboardChatPanel from "@/components/dashboard/DashboardChatPanel";
import DashboardShell from "@/components/dashboard/DashboardShell";
import {
  ChatMessage,
  sendChatMessage,
  sendGeminiChatMessage,
} from "@/lib/api";
import { useEffect, useState } from "react";

const GEMINI_KEY_STORAGE = "dashboard-gemini-api-key";
const GEMINI_MODEL = "gemini-3.6-flash";

export default function DashboardAIPage() {
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [localSending, setLocalSending] = useState(false);
  const [localError, setLocalError] = useState("");

  const [geminiMessages, setGeminiMessages] = useState<ChatMessage[]>([]);
  const [geminiSending, setGeminiSending] = useState(false);
  const [geminiError, setGeminiError] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(GEMINI_KEY_STORAGE);
      if (stored) setGeminiApiKey(stored);
    } catch {
      // sessionStorage may be unavailable
    }
  }, []);

  function persistGeminiKey(value: string) {
    setGeminiApiKey(value);
    try {
      if (value) sessionStorage.setItem(GEMINI_KEY_STORAGE, value);
      else sessionStorage.removeItem(GEMINI_KEY_STORAGE);
    } catch {
      // ignore storage errors
    }
  }

  async function onLocalSend(text: string) {
    setLocalError("");
    setLocalSending(true);
    const updated: ChatMessage[] = [...localMessages, { role: "user", content: text }];
    setLocalMessages(updated);
    try {
      const res = await sendChatMessage(text, localMessages);
      setLocalMessages([...updated, { role: "assistant", content: res.reply }]);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "AI request failed");
    } finally {
      setLocalSending(false);
    }
  }

  async function onGeminiSend(text: string) {
    setGeminiError("");
    setGeminiSending(true);
    const updated: ChatMessage[] = [...geminiMessages, { role: "user", content: text }];
    setGeminiMessages(updated);
    try {
      const res = await sendGeminiChatMessage(text, geminiMessages, geminiApiKey);
      setGeminiMessages([...updated, { role: "assistant", content: res.reply }]);
    } catch (err) {
      setGeminiError(err instanceof Error ? err.message : "Gemini request failed");
    } finally {
      setGeminiSending(false);
    }
  }

  return (
    <DashboardShell title="AI" description="Local LM Studio model and Gemini API.">
      <div className="space-y-10">
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">Local AI</h2>
          <DashboardChatPanel
            messages={localMessages}
            sending={localSending}
            error={localError}
            onSend={onLocalSend}
            onClear={() => setLocalMessages([])}
            modelName="qwen2.5-coder-3b"
            modelHint="LM Studio · port 1234"
            emptyHint="Make sure LM Studio is running on port 1234."
            placeholder="Ask the AI to break work into tasks, improve the roadmap, or organize projects… (Enter to send, Shift+Enter for new line)"
          />
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-1">Gemini AI</h2>
          <p className="text-sm text-zinc-500 mb-4">
            Google AI Studio free API. Paste a key here or leave blank to use server env.
          </p>
          <DashboardChatPanel
            messages={geminiMessages}
            sending={geminiSending}
            error={geminiError}
            onSend={onGeminiSend}
            onClear={() => setGeminiMessages([])}
            modelName={GEMINI_MODEL}
            modelHint="Google Gemini · generateContent"
            emptyHint="Get a key at aistudio.google.com/apikey. Leave the field blank to use GEMINI_API_KEY."
            placeholder="Ask Gemini about your projects, tasks, or roadmap… (Enter to send, Shift+Enter for new line)"
            extraSidebar={
              <div className="mt-6">
                <label className="text-xs text-zinc-500 uppercase tracking-widest">
                  Gemini API key
                </label>
                <input
                  type="password"
                  autoComplete="off"
                  value={geminiApiKey}
                  onChange={(e) => persistGeminiKey(e.target.value)}
                  placeholder="Leave blank to use server env"
                  className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-sky-500"
                />
              </div>
            }
          />
        </section>
      </div>
    </DashboardShell>
  );
}
