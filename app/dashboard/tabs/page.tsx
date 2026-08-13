"use client";

import DashboardShell from "@/components/dashboard/DashboardShell";
import { useEffect, useMemo, useState } from "react";
import {
  getSiteSettings,
  type SiteTab,
  type SiteSettings,
  updateSiteSettings,
} from "@/lib/api";
import {
  cloneDefaultSiteTabs,
  normalizeDashboardSaveError,
} from "@/lib/site-config";

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
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const settings = await getSiteSettings();
        setTabs(settings.tabs?.length ? settings.tabs : cloneDefaultSiteTabs());
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load tabs";
        setError(msg);
        setTabs(cloneDefaultSiteTabs());
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
    const nextIndex = tabs.length;
    setTabs((prev) => [...prev, { ...EMPTY_TAB }]);
    setExpandedKey(String(nextIndex));
    setSuccess(null);
    setError(null);
  }

  function addChildTab(path: TabPath) {
    let childIndex = 0;
    const next = updateNodeAtPath(tabs, path, (tab) => {
      childIndex = (tab.children ?? []).length;
      return {
        ...tab,
        children: [...(tab.children ?? []), { ...EMPTY_TAB, showInInterests: false }],
      };
    });
    setTabs(next);
    setExpandedKey([...path, childIndex].join("."));
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
      setTabs(saved.tabs?.length ? saved.tabs : cloneDefaultSiteTabs());
      setSuccess("Saved navigation, interests cards, and subcategories successfully.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save tabs";
      setError(normalizeDashboardSaveError(msg));
    } finally {
      setSaving(false);
    }
  }

  function resetToDefaults() {
    setTabs(cloneDefaultSiteTabs());
    setError(null);
    setSuccess("Loaded the starter AI / ML, Games, CAD, Backend, Tools, Notes, and Contact structure.");
  }

  const hasValidationErrors = useMemo(() => hasInvalidTabFields(tabs), [tabs]);

  function renderTabEditor(items: SiteTab[], parentPath: TabPath = [], depth = 0): React.ReactNode {
    return items.map((tab, index) => {
      const path = [...parentPath, index];
      const key = path.join(".");
      const expanded = expandedKey === key;
      const siblingsCount = items.length;

      return (
        <div
          key={key}
          className="rounded-xl border border-zinc-800 bg-zinc-950"
          style={{ marginLeft: depth ? `${depth * 0.75}rem` : undefined }}
        >
          <div className="flex items-center gap-2 px-3 py-2">
            <button
              type="button"
              onClick={() => setExpandedKey(expanded ? null : key)}
              className="min-w-0 flex-1 truncate text-left text-sm text-white"
            >
              <span className="mr-2">{tab.icon || "•"}</span>
              {tab.label || "Untitled"}
              <span className="ml-2 text-xs text-zinc-500">{tab.href}</span>
            </button>
            <button
              type="button"
              onClick={() => moveTab(path, -1)}
              disabled={index === 0}
              className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300 disabled:opacity-40"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => moveTab(path, 1)}
              disabled={index === siblingsCount - 1}
              className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300 disabled:opacity-40"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => setExpandedKey(expanded ? null : key)}
              className="rounded-md px-2 py-1 text-xs text-zinc-400 hover:text-white"
            >
              {expanded ? "Hide" : "Edit"}
            </button>
          </div>

          {expanded ? (
            <div className="space-y-3 border-t border-zinc-800 px-3 py-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => addChildTab(path)}
                  className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs text-sky-200"
                >
                  + Subcategory
                </button>
                <button
                  type="button"
                  onClick={() => removeTab(path)}
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-200"
                >
                  Delete
                </button>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                <input
                  value={tab.icon}
                  onChange={(event) => updateTab(path, { icon: event.target.value })}
                  className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
                  placeholder="Icon"
                />
                <input
                  value={tab.label}
                  onChange={(event) => updateTab(path, { label: event.target.value })}
                  className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
                  placeholder="Title"
                />
                <input
                  value={tab.href}
                  onChange={(event) => updateTab(path, { href: event.target.value })}
                  className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white lg:col-span-2"
                  placeholder="Href"
                />
                <input
                  value={tab.desc}
                  onChange={(event) => updateTab(path, { desc: event.target.value })}
                  className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white lg:col-span-2"
                  placeholder="Description"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <label className="inline-flex items-center gap-2 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={tab.showInNav}
                    onChange={(event) => updateTab(path, { showInNav: event.target.checked })}
                  />
                  Nav
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={tab.showInInterests}
                    onChange={(event) => updateTab(path, { showInInterests: event.target.checked })}
                  />
                  Interests
                </label>
              </div>
              {(!tab.label.trim() || !tab.href.trim()) ? (
                <p className="text-xs text-amber-300">Title and href are required.</p>
              ) : null}
            </div>
          ) : null}

          {tab.children && tab.children.length > 0 ? (
            <div className="space-y-2 border-t border-zinc-800 p-2">
              {renderTabEditor(tab.children, path, depth + 1)}
            </div>
          ) : null}
        </div>
      );
    });
  }

  return (
    <DashboardShell title="Nav" description="Top nav, interests cards, and subcategories.">
      <div className="sticky top-4 z-10 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/95 p-3 backdrop-blur">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={addTopLevelTab}
            className="rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-sky-400"
          >
            Add tab
          </button>
          <button
            type="button"
            onClick={resetToDefaults}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:text-white"
          >
            Reset
          </button>
        </div>
        <button
          type="button"
          onClick={saveTabs}
          disabled={saving || hasValidationErrors}
          className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {loading ? <p className="mb-4 text-sm text-zinc-400">Loading...</p> : null}
      {error ? (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
          {success}
        </div>
      ) : null}

      <div className="space-y-2">
        {tabs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-700 p-6 text-sm text-zinc-400">
            No tabs yet.
          </div>
        ) : (
          renderTabEditor(tabs)
        )}
      </div>
    </DashboardShell>
  );
}
