"use client";

import DashboardShell from "@/components/dashboard/DashboardShell";
import { useEffect, useMemo, useState } from "react";
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
  showInNav: true,
  showInInterests: true,
  children: [],
};

type TabPath = number[];

function updateNodeAtPath(
  tabs: SiteTab[],
  path: TabPath,
  updater: (tab: SiteTab) => SiteTab
): SiteTab[] {
  const [index, ...rest] = path;
  return tabs.map((tab, idx) => {
    if (idx !== index) return tab;
    if (rest.length === 0) return updater(tab);
    return {
      ...tab,
      children: updateNodeAtPath(tab.children ?? [], rest, updater),
    };
  });
}

function removeNodeAtPath(tabs: SiteTab[], path: TabPath): SiteTab[] {
  const [index, ...rest] = path;
  if (rest.length === 0) {
    return tabs.filter((_, idx) => idx !== index);
  }

  return tabs.map((tab, idx) => {
    if (idx !== index) return tab;
    return {
      ...tab,
      children: removeNodeAtPath(tab.children ?? [], rest),
    };
  });
}

function moveInList<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function moveNodeAtPath(tabs: SiteTab[], path: TabPath, direction: -1 | 1): SiteTab[] {
  const [index, ...rest] = path;
  if (rest.length === 0) {
    return moveInList(tabs, index, direction);
  }

  return tabs.map((tab, idx) => {
    if (idx !== index) return tab;
    return {
      ...tab,
      children: moveNodeAtPath(tab.children ?? [], rest, direction),
    };
  });
}

function hasInvalidTabFields(tabs: SiteTab[]): boolean {
  return tabs.some((tab) => {
    if (!tab.label.trim() || !tab.href.trim()) return true;
    return hasInvalidTabFields(tab.children ?? []);
  });
}

function sanitizeTabs(tabs: SiteTab[]): SiteTab[] {
  return tabs
    .map((tab) => {
      const label = tab.label.trim();
      if (!label) return null;
      const hrefRaw = tab.href.trim() || "/projects";
      const href = hrefRaw.startsWith("/") || hrefRaw.startsWith("http") ? hrefRaw : `/${hrefRaw}`;
      return {
        label,
        href,
        icon: tab.icon.trim(),
        desc: tab.desc.trim(),
        showInNav: Boolean(tab.showInNav),
        showInInterests: Boolean(tab.showInInterests),
        children: sanitizeTabs(tab.children ?? []),
      } satisfies SiteTab;
    })
    .filter((tab): tab is SiteTab => tab !== null);
}

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

  function updateTab(path: TabPath, patch: Partial<SiteTab>) {
    setTabs((prev) => updateNodeAtPath(prev, path, (tab) => ({ ...tab, ...patch })));
    setSuccess(null);
    setError(null);
  }

  function addTopLevelTab() {
    setTabs((prev) => [...prev, { ...EMPTY_TAB }]);
    setSuccess(null);
    setError(null);
  }

  function addChildTab(path: TabPath) {
    setTabs((prev) =>
      updateNodeAtPath(prev, path, (tab) => ({
        ...tab,
        children: [...(tab.children ?? []), { ...EMPTY_TAB, showInInterests: false }],
      }))
    );
    setSuccess(null);
    setError(null);
  }

  function removeTab(path: TabPath) {
    setTabs((prev) => removeNodeAtPath(prev, path));
    setSuccess(null);
    setError(null);
  }

  function moveTab(path: TabPath, direction: -1 | 1) {
    setTabs((prev) => moveNodeAtPath(prev, path, direction));
    setSuccess(null);
    setError(null);
  }

  async function saveTabs() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: SiteSettings = {
        tabs: sanitizeTabs(tabs),
      };
      const saved = await updateSiteSettings(payload);
      setTabs(saved.tabs ?? []);
      setSuccess("Saved navigation, interests cards, and subcategories successfully.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save tabs";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  const hasValidationErrors = useMemo(() => hasInvalidTabFields(tabs), [tabs]);

  function renderTabEditor(items: SiteTab[], parentPath: TabPath = [], depth = 0): React.ReactNode {
    return items.map((tab, index) => {
      const path = [...parentPath, index];
      const siblingsCount = items.length;
      const isTopLevel = depth === 0;

      return (
        <div
          key={`${path.join("-")}-${tab.label}-${tab.href}`}
          className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5"
          style={{ marginLeft: depth ? `${depth * 0.5}rem` : undefined }}
        >
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {isTopLevel ? `Top-level Tab #${index + 1}` : `Subcategory Level ${depth}`}
                  </h3>
                  <p className="text-sm text-zinc-500">
                    {isTopLevel
                      ? "Controls top navigation and homepage 'What I'm Into' cards."
                      : "Nested grouping for advanced category organization."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => moveTab(path, -1)}
                    disabled={index === 0}
                    className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-sky-500/30 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveTab(path, 1)}
                    disabled={index === siblingsCount - 1}
                    className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-sky-500/30 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => addChildTab(path)}
                    className="rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-sm text-sky-200 transition-colors hover:border-sky-500 hover:bg-sky-500/20"
                  >
                    + Add subcategory
                  </button>
                  <button
                    type="button"
                    onClick={() => removeTab(path)}
                    className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200 transition-colors hover:border-red-500 hover:bg-red-500/20"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-zinc-300">Emoji / Icon</span>
                  <input
                    value={tab.icon}
                    onChange={(event) => updateTab(path, { icon: event.target.value })}
                    className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white placeholder:text-zinc-500"
                    placeholder="e.g. 🤖"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-zinc-300">Title</span>
                  <input
                    value={tab.label}
                    onChange={(event) => updateTab(path, { label: event.target.value })}
                    className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white placeholder:text-zinc-500"
                    placeholder="AI / ML"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-zinc-300">Link (Href)</span>
                  <input
                    value={tab.href}
                    onChange={(event) => updateTab(path, { href: event.target.value })}
                    className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white placeholder:text-zinc-500"
                    placeholder="/projects?category=AI%20/%20ML"
                  />
                </label>
                <label className="block lg:col-span-2">
                  <span className="text-sm font-medium text-zinc-300">Description</span>
                  <input
                    value={tab.desc}
                    onChange={(event) => updateTab(path, { desc: event.target.value })}
                    className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white placeholder:text-zinc-500"
                    placeholder="Describe this tab or subcategory"
                  />
                </label>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <label className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={tab.showInNav}
                    onChange={(event) => updateTab(path, { showInNav: event.target.checked })}
                    className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-sky-400"
                  />
                  Show in top navigation
                </label>
                <label className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={tab.showInInterests}
                    onChange={(event) => updateTab(path, { showInInterests: event.target.checked })}
                    className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-sky-400"
                  />
                  Show in "What I&apos;m Into"
                </label>
              </div>

              {(!tab.label.trim() || !tab.href.trim()) ? (
                <p className="mt-4 text-sm text-amber-300">
                  Title and href are required to save this item.
                </p>
              ) : null}
            </div>
          </div>

          {tab.children && tab.children.length > 0 ? (
            <div className="mt-5 border-l border-zinc-800 pl-3">
              {renderTabEditor(tab.children, path, depth + 1)}
            </div>
          ) : null}
        </div>
      );
    });
  }

  return (
    <DashboardShell
      title="Navigation & Interests CMS"
      description="Manage top navigation tabs, homepage 'What I'm Into' cards, and multi-level subcategories from one place."
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Tab & subcategory manager</h2>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                Add, edit, remove, and reorder tabs at any depth. Each item supports icon, title,
                description, and destination link. Changes sync both the top navigation and homepage cards.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={addTopLevelTab}
                className="inline-flex items-center justify-center rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-400"
              >
                + Add top-level tab
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
            <p className="mt-6 text-zinc-400">Loading configuration...</p>
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
                No tabs configured yet. Click "Add top-level tab" to create your first one.
              </div>
            ) : (
              renderTabEditor(tabs)
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
