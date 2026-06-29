"use client";

import DashboardShell from "@/components/dashboard/DashboardShell";
import { useEffect, useState } from "react";
import {
  getSiteSettings,
  type SiteTab,
  type SiteSettings,
  updateSiteSettings,
} from "@/lib/api";

const EMPTY_TAB: SiteTab = {
  label: "",
  href: "/projects",
  icon: "",
  desc: "",
  showInNav: false,
  showInInterests: false,
};

export default function DashboardTabsPage() {
  const [tabs, setTabs] = useState<SiteTab[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const settings = await getSiteSettings();
        setTabs(settings.tabs ?? []);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load tabs";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  function updateTab(index: number, patch: Partial<SiteTab>) {
    setTabs((prev) => prev.map((tab, idx) => (idx === index ? { ...tab, ...patch } : tab)));
  }

  function addTab() {
    setTabs((prev) => [...prev, { ...EMPTY_TAB }]);
    setSuccess(null);
    setError(null);
  }

  function removeTab(index: number) {
    setTabs((prev) => prev.filter((_, idx) => idx !== index));
    setSuccess(null);
    setError(null);
  }

  function moveTab(index: number, direction: -1 | 1) {
    setTabs((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setSuccess(null);
    setError(null);
  }

  async function saveTabs() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const trimmedTabs: SiteSettings = {
        tabs: tabs.map((tab) => ({
          ...tab,
          label: tab.label.trim(),
          href: tab.href.trim() || "/projects",
          icon: tab.icon.trim(),
          desc: tab.desc.trim(),
        })),
      };

      const saved = await updateSiteSettings(trimmedTabs);
      setTabs(saved.tabs);
      setSuccess("Saved site tabs successfully.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save tabs";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  const hasValidationErrors = tabs.some((tab) => !tab.label.trim() || !tab.href.trim());

  return (
    <DashboardShell
      title="Site Tabs"
      description="Manage the navigation tabs and the homepage interest cards shown in 'What I\'m Into'."
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Tab manager</h2>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                Add, edit, remove, and reorder the site tabs. Use the toggles to
                control whether a tab appears in the top navigation and on the
                homepage interest cards.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={addTab}
                className="inline-flex items-center justify-center rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-400"
              >
                + Add tab
              </button>
              <button
                type="button"
                onClick={saveTabs}
                disabled={saving || hasValidationErrors}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>

          {loading ? (
            <p className="mt-6 text-zinc-400">Loading tabs...</p>
          ) : null}

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
              {success}
            </div>
          ) : null}

          <div className="mt-6 space-y-5">
            {tabs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-950 p-6 text-zinc-400">
                No tabs configured yet. Click &quot;Add tab&quot; to create one.
              </div>
            ) : (
              tabs.map((tab, index) => (
                <div
                  key={`${tab.label}-${tab.href}-${index}`}
                  className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-white">Tab #{index + 1}</h3>
                          <p className="text-sm text-zinc-500">
                            Customize the label, destination, and visibility for this tab.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => moveTab(index, -1)}
                            disabled={index === 0}
                            className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-sky-500/30 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveTab(index, 1)}
                            disabled={index === tabs.length - 1}
                            className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-sky-500/30 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => removeTab(index)}
                            className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200 transition-colors hover:border-red-500 hover:bg-red-500/20"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 lg:grid-cols-2">
                        <label className="block">
                          <span className="text-sm font-medium text-zinc-300">Icon</span>
                          <input
                            value={tab.icon}
                            onChange={(event) => updateTab(index, { icon: event.target.value })}
                            className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white placeholder:text-zinc-500"
                            placeholder="e.g. 🤖"
                          />
                        </label>
                        <label className="block">
                          <span className="text-sm font-medium text-zinc-300">Label</span>
                          <input
                            value={tab.label}
                            onChange={(event) => updateTab(index, { label: event.target.value })}
                            className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white placeholder:text-zinc-500"
                            placeholder="AI / ML"
                          />
                        </label>
                        <label className="block">
                          <span className="text-sm font-medium text-zinc-300">Href</span>
                          <input
                            value={tab.href}
                            onChange={(event) => updateTab(index, { href: event.target.value })}
                            className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white placeholder:text-zinc-500"
                            placeholder="/ai"
                          />
                        </label>
                        <label className="block lg:col-span-2">
                          <span className="text-sm font-medium text-zinc-300">Description</span>
                          <input
                            value={tab.desc}
                            onChange={(event) => updateTab(index, { desc: event.target.value })}
                            className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white placeholder:text-zinc-500"
                            placeholder="YOLO models, classifiers, vision systems, and neural nets."
                          />
                        </label>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <label className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-300">
                          <input
                            type="checkbox"
                            checked={tab.showInNav}
                            onChange={(event) => updateTab(index, { showInNav: event.target.checked })}
                            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-sky-400"
                          />
                          Show in navigation
                        </label>
                        <label className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-300">
                          <input
                            type="checkbox"
                            checked={tab.showInInterests}
                            onChange={(event) => updateTab(index, { showInInterests: event.target.checked })}
                            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-sky-400"
                          />
                          Show on homepage
                        </label>
                      </div>

                      {(!tab.label.trim() || !tab.href.trim()) ? (
                        <p className="mt-4 text-sm text-amber-300">
                          Label and href are required to save this tab.
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
