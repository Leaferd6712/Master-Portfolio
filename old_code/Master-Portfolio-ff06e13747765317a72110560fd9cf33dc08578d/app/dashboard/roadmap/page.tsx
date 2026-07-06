"use client";

import DashboardShell from "@/components/dashboard/DashboardShell";
import { useEffect, useRef, useState } from "react";
import { getRoadmap, saveRoadmap } from "@/lib/api";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

type MonthName = (typeof months)[number];
type MonthNotes = Record<MonthName, string>;

function emptyMonthNotes(): MonthNotes {
  return {
    January: "",
    February: "",
    March: "",
    April: "",
    May: "",
    June: "",
    July: "",
    August: "",
    September: "",
    October: "",
    November: "",
    December: "",
  };
}

function parseRoadmapContent(content: string): MonthNotes {
  const notes = emptyMonthNotes();
  const trimmed = content.trim();

  if (!trimmed) {
    return notes;
  }

  let matchedAnyMonth = false;

  for (let i = 0; i < months.length; i += 1) {
    const month = months[i];
    const nextMonth = i < months.length - 1 ? months[i + 1] : null;
    const startMarker = `## ${month}`;
    const start = trimmed.indexOf(startMarker);
    if (start === -1) {
      continue;
    }

    matchedAnyMonth = true;
    const bodyStart = start + startMarker.length;
    let bodyEnd = trimmed.length;
    if (nextMonth) {
      const nextMarker = `## ${nextMonth}`;
      const nextIndex = trimmed.indexOf(nextMarker, bodyStart);
      if (nextIndex !== -1) {
        bodyEnd = nextIndex;
      }
    }

    notes[month] = trimmed.slice(bodyStart, bodyEnd).trim();
  }

  if (!matchedAnyMonth) {
    notes.January = trimmed;
  }

  return notes;
}

function serializeRoadmapContent(notes: MonthNotes): string {
  return months
    .map((month) => {
      const body = notes[month].trim();
      return `## ${month}\n${body}`;
    })
    .join("\n\n");
}

export default function DashboardRoadmapPage() {
  const [monthNotes, setMonthNotes] = useState<MonthNotes>(emptyMonthNotes());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const hydratedRef = useRef(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getRoadmap();
        setMonthNotes(parseRoadmapContent(data));
        hydratedRef.current = true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load roadmap";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  useEffect(() => {
    if (loading || !hydratedRef.current || !dirty) {
      return;
    }

    const timer = window.setTimeout(() => {
      void persistRoadmap("auto");
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [monthNotes, loading, dirty]);

  async function persistRoadmap(mode: "manual" | "auto") {
    setSaving(true);
    setError("");
    if (mode === "manual") {
      setMessage("");
    }

    const snapshot = serializeRoadmapContent(monthNotes);

    try {
      const result = await saveRoadmap(snapshot);
      setDirty(false);

      if (result.githubSynced) {
        setMessage("Saved and synced to GitHub");
      } else if (result.githubSyncEnabled) {
        setMessage("Saved locally, but GitHub sync failed");
      } else {
        setMessage("Saved locally (GitHub sync is not configured)");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save roadmap";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function onSave() {
    await persistRoadmap("manual");
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
          Keep your high-level roadmap here by month. These notes are not linked to task items.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {months.map((month) => (
            <div key={month} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
              <h2 className="mb-2 text-sm font-semibold text-white">{month}</h2>
              <textarea
                value={monthNotes[month]}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setDirty(true);
                  setMessage("Unsaved changes...");
                  setMonthNotes((prev) => ({ ...prev, [month]: nextValue }));
                }}
                disabled={loading}
                placeholder={`Add ${month} roadmap...`}
                className="min-h-[110px] w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2.5 text-sm text-zinc-200 focus:border-sky-500 focus:outline-none"
              />
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-sm text-zinc-500">{message || ""}</p>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || loading || !dirty}
            className="rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save roadmap"}
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}
