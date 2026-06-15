"use client";

import DashboardShell from "@/components/dashboard/DashboardShell";
import { useEffect, useState } from "react";
import { getRoadmap, saveRoadmap } from "@/lib/api";

export default function DashboardRoadmapPage() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await getRoadmap();
        setContent(data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load roadmap";
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
      await saveRoadmap(content);
      setMessage("Saved");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save roadmap";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardShell
      title="2026 Roadmap"
      description="General roadmap notes, completely separate from tasks."
    >
      {error ? (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {loading ? <p className="mb-4 text-zinc-500">Loading roadmap...</p> : null}

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <p className="text-sm text-zinc-400">
          Keep your high-level roadmap here. This box is for general direction and is not linked to task items.
        </p>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={loading}
          placeholder="Add your general roadmap here..."
          className="mt-3 min-h-[140px] w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-sm text-zinc-200 focus:border-sky-500 focus:outline-none"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-sm text-zinc-500">{message || ""}</p>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || loading}
            className="rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save roadmap"}
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}
