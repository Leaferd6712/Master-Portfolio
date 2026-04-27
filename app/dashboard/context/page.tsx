"use client";

import DashboardShell from "@/components/dashboard/DashboardShell";
import { useEffect, useState } from "react";
import { getContext, saveContext } from "@/lib/api";

export default function DashboardContextPage() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const text = await getContext();
        setContent(text);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load context";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  async function onSave() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await saveContext(content);
      setMessage("Saved");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save context";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardShell
      title="Context File"
      description="Your editable brain file. Changes are saved to backend/data/context.md."
    >
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-xl font-semibold text-white">context.md</h2>
          <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Live</span>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={loading}
          className="min-h-[420px] w-full rounded-2xl border border-zinc-700 bg-zinc-950 p-4 text-sm leading-7 text-zinc-200 focus:outline-none focus:border-sky-500"
        />
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-zinc-500">{error || message || ""}</p>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || loading}
            className="rounded-xl bg-sky-500 px-4 py-2.5 font-semibold text-white hover:bg-sky-400 transition-colors"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}
