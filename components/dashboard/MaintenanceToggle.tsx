"use client";

import { useEffect, useState } from "react";
import { getMaintenanceMode, updateMaintenanceMode } from "@/lib/api";

export default function MaintenanceToggle() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const state = await getMaintenanceMode();
        setEnabled(Boolean(state.enabled));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load maintenance mode";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  async function handleToggle() {
    if (loading || saving) {
      return;
    }

    const next = !enabled;
    setSaving(true);
    setError("");
    setEnabled(next);

    try {
      const updated = await updateMaintenanceMode(next);
      setEnabled(Boolean(updated.enabled));
    } catch (err) {
      setEnabled(!next);
      const msg = err instanceof Error ? err.message : "Failed to update maintenance mode";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  const label = enabled ? "Maintenance On" : "Maintenance Off";
  const statusColor = enabled ? "text-amber-300" : "text-emerald-300";

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
      <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Site status</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className={`text-xs font-semibold ${statusColor}`}>{label}</p>
        <button
          type="button"
          onClick={handleToggle}
          disabled={loading || saving}
          className="inline-flex items-center rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200 hover:border-zinc-500 hover:text-white disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Loading..." : saving ? "Saving..." : "Toggle"}
        </button>
      </div>
      {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
