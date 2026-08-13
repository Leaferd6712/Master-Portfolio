"use client";

import DashboardShell from "@/components/dashboard/DashboardShell";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { Project, ProjectLink } from "@/components/ProjectCard";
import {
  addProject,
  deleteProject,
  getProjects,
  getSiteSettings,
  type TimeframeOption,
  updateProject,
} from "@/lib/api";
import { flattenTabs } from "@/lib/categories";
import { TIMEFRAME_OPTIONS } from "@/lib/site-config";

function progressLabel(pct: number): string {
  if (pct === 0) return "Not started";
  if (pct <= 15) return "Just started";
  if (pct <= 35) return "Early stages";
  if (pct <= 55) return "Halfway there";
  if (pct <= 75) return "Good progress";
  if (pct <= 90) return "Almost done";
  if (pct < 100) return "Final touches";
  return "Complete!";
}

function progressColor(pct: number): string {
  if (pct === 0) return "bg-zinc-600";
  if (pct < 40) return "bg-sky-500";
  if (pct < 75) return "bg-amber-400";
  return "bg-emerald-400";
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const PRESET_LABELS = [
  { pct: 0, label: "Not started" },
  { pct: 25, label: "Early stages" },
  { pct: 50, label: "Halfway there" },
  { pct: 75, label: "Good progress" },
  { pct: 90, label: "Almost done" },
  { pct: 100, label: "Complete!" },
];

const DEFAULT_LINKS: ProjectLink[] = [
  { label: "GitHub", url: "" },
  { label: "Demo", url: "" },
];

function parseSubcategoryPath(value: string): string[] {
  return value
    .split(">")
    .map((part) => part.trim())
    .filter(Boolean);
}

function stringifySubcategoryPath(path: string[] | undefined): string {
  return (path ?? []).join(" > ");
}

export default function DashboardProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add-form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hiddenNotes, setHiddenNotes] = useState("");
  const [category, setCategory] = useState("Games");
  const [subcategoryPathInput, setSubcategoryPathInput] = useState("");
  const [status, setStatus] = useState("planned");
  const [timeframe, setTimeframe] = useState<TimeframeOption>("2 weeks");
  const [visibility, setVisibility] = useState<Project["visibility"]>("draft");
  const [featured, setFeatured] = useState(false);
  const [links, setLinks] = useState<ProjectLink[]>(DEFAULT_LINKS);
  const [techs, setTechs] = useState("");
  const [progress, setProgress] = useState(0);
  const [imagePreview, setImagePreview] = useState("");
  const [categoryOptions, setCategoryOptions] = useState<string[]>([
    "Games",
    "ML / Vision",
    "CAD",
    "Backend",
    "Tools",
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [listFilter, setListFilter] = useState<"active" | "draft" | "finished">("active");
  const imageInputRef = useRef<HTMLInputElement>(null);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      if (listFilter === "active") return project.status !== "finished";
      if (listFilter === "draft") return (project.visibility ?? "draft") === "draft";
      return project.status === "finished";
    });
  }, [projects, listFilter]);

  function updateLink(idx: number, field: keyof ProjectLink, value: string) {
    setLinks((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  }

  function removeLink(idx: number) {
    setLinks((prev) => prev.filter((_, i) => i !== idx));
  }

  function addLink() {
    setLinks((prev) => [...prev, { label: "", url: "" }]);
  }

  useEffect(() => {
    async function load() {
      try {
        const [data, settings] = await Promise.all([getProjects(), getSiteSettings()]);
        setProjects(data);
        const labels = Array.from(new Set(flattenTabs(settings.tabs).map((node) => node.label)));
        if (labels.length > 0) {
          setCategoryOptions(labels);
          if (!labels.includes(category)) {
            setCategory(labels[0]);
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load projects";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  async function onAddProject(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    try {
      const created = await addProject({
        title: title.trim(),
        description: description.trim(),
        hiddenNotes: hiddenNotes.trim(),
        category,
        subcategoryPath: parseSubcategoryPath(subcategoryPathInput),
        status,
        timeframe,
        visibility: progress >= 100 ? "public" : visibility,
        featured,
        links: links.filter((l) => l.url.trim()),
        image: imagePreview,
        progress,
        techs: techs
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });
      setProjects((prev) => [created, ...prev]);
      setShowAdd(false);
      setExpandedId(created.id);
      setTitle("");
      setDescription("");
      setHiddenNotes("");
      setSubcategoryPathInput("");
      setTimeframe("2 weeks");
      setVisibility("draft");
      setFeatured(false);
      setLinks(DEFAULT_LINKS);
      setTechs("");
      setProgress(0);
      setImagePreview("");
      if (imageInputRef.current) imageInputRef.current.value = "";
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to add project";
      setError(msg);
    }
  }

  async function onImageFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
    projectId?: string
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    if (projectId) {
      await onFieldUpdate(projectId, { image: dataUrl });
    } else {
      setImagePreview(dataUrl);
    }
  }

  async function onFieldUpdate(projectId: string, patch: Partial<Project>) {
    try {
      const updated = await updateProject(projectId, patch);
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? updated : p))
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update project";
      setError(msg);
    }
  }

  async function onDeleteProject(projectId: string) {
    try {
      await deleteProject(projectId);
      setProjects((prev) => prev.filter((project) => project.id !== projectId));
      setExpandedId((current) => (current === projectId ? null : current));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete project";
      setError(msg);
    }
  }

  return (
    <DashboardShell title="Projects" description="List first. Expand a row to edit.">
      {error ? (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-900 p-1">
          {(["active", "draft", "finished"] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setListFilter(filter)}
              className={`rounded-md px-3 py-1.5 text-sm capitalize ${
                listFilter === filter ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowAdd((prev) => !prev)}
          className="rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-sky-400"
        >
          {showAdd ? "Cancel" : "Add project"}
        </button>
      </div>

      {showAdd ? (
        <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-lg font-semibold text-white">New project</h2>
          <form className="mt-4 space-y-3" onSubmit={onAddProject}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white placeholder:text-zinc-500"
              placeholder="Project title"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-28 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white placeholder:text-zinc-500"
              placeholder="Project description"
            />
            <textarea
              value={hiddenNotes}
              onChange={(e) => setHiddenNotes(e.target.value)}
              className="min-h-24 w-full rounded-xl border border-amber-500/30 bg-zinc-950 px-4 py-3 text-white placeholder:text-zinc-500"
              placeholder="Hidden from public notes"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-300"
              >
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <>
                <input
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  list="status-presets"
                  className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-300"
                  placeholder="Status"
                />
                <datalist id="status-presets">
                  <option value="planned" />
                  <option value="in progress" />
                  <option value="finished" />
                </datalist>
              </>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-zinc-300">Sprint timeframe</span>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value as TimeframeOption)}
                  className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-200"
                >
                  {TIMEFRAME_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-zinc-300">Visibility</span>
                <select
                  value={progress >= 100 ? "public" : visibility}
                  onChange={(e) => setVisibility(e.target.value as Project["visibility"])}
                  disabled={progress >= 100}
                  className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-200 disabled:opacity-60"
                >
                  <option value="public">Publish to Public Portfolio</option>
                  <option value="draft">Keep as Draft</option>
                </select>
              </label>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-white">Visibility rule for work in progress</p>
                  <p className="mt-1 text-zinc-500">
                    Projects below 100% can be published publicly or kept private as drafts while you work on them.
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-sky-400"
                  />
                  Mark as featured
                </label>
              </div>
              <p className="mt-3 text-xs text-zinc-500">
                {progress >= 100
                  ? "Completed projects are published automatically."
                  : visibility === "public"
                    ? "This work in progress will appear on the public portfolio."
                    : "This work in progress stays private inside the dashboard until you publish it."}
              </p>
            </div>

            <input
              value={subcategoryPathInput}
              onChange={(e) => setSubcategoryPathInput(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white placeholder:text-zinc-500"
              placeholder="Subcategory path (optional): AI / ML > ML > Object detection models"
            />

            {/* Links */}
            <div className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-medium">Links</span>
                <button
                  type="button"
                  onClick={addLink}
                  className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
                >
                  + Add link
                </button>
              </div>
              {links.length === 0 && (
                <p className="text-xs text-zinc-600">No links — click "+ Add link" to add one.</p>
              )}
              {links.map((link, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    value={link.label}
                    onChange={(e) => updateLink(idx, "label", e.target.value)}
                    className="w-28 shrink-0 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
                    placeholder="Label"
                  />
                  <input
                    value={link.url}
                    onChange={(e) => updateLink(idx, "url", e.target.value)}
                    className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
                    placeholder="https://..."
                  />
                  <button
                    type="button"
                    onClick={() => removeLink(idx)}
                    className="shrink-0 text-zinc-600 hover:text-red-400 transition-colors px-1 text-sm"
                    title="Remove link"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <input
              value={techs}
              onChange={(e) => setTechs(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white placeholder:text-zinc-500"
              placeholder="Tech stack (comma separated)"
            />

            {/* Progress slider */}
            <div className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-medium">Completion</span>
                <span className="text-xs font-semibold text-white tabular-nums">
                  {progress}% — {progressLabel(progress)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full accent-sky-500"
              />
              {/* Preset quick-pick buttons */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {PRESET_LABELS.map((p) => (
                  <button
                    key={p.pct}
                    type="button"
                    onClick={() => setProgress(p.pct)}
                    className={`text-xs px-2 py-0.5 rounded-md border transition-colors ${
                      progress === p.pct
                        ? "bg-sky-500/20 border-sky-500/50 text-sky-300"
                        : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              {/* Progress bar preview */}
              <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${progressColor(progress)}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Background image upload */}
            <div className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 space-y-2">
              <span className="text-xs text-zinc-400 font-medium">Background image</span>
              {imagePreview ? (
                <div className="relative rounded-lg overflow-hidden h-28 bg-zinc-800">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview("");
                      if (imageInputRef.current) imageInputRef.current.value = "";
                    }}
                    className="absolute top-1.5 right-1.5 rounded-full bg-black/60 px-2 py-0.5 text-xs text-zinc-300 hover:text-white"
                  >
                    ✕ remove
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center h-16 rounded-lg border border-dashed border-zinc-700 text-zinc-600 text-xs">
                  No image — will show blank background
                </div>
              )}
              <label className="block cursor-pointer rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-400 hover:border-zinc-500 hover:text-zinc-300 text-center transition-colors">
                Upload image
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => void onImageFileChange(e)}
                />
              </label>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-sky-500 px-4 py-3 font-semibold text-white hover:bg-sky-400 transition-colors"
            >
              Add project
            </button>
          </form>
        </div>
      ) : null}

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">
            {filteredProjects.length} {listFilter}
          </h2>
          <span className="text-xs text-zinc-500">{projects.length} total</span>
        </div>
        {loading ? <p className="mb-4 text-sm text-zinc-500">Loading projects...</p> : null}
        <div className="space-y-2">
          {filteredProjects.map((project) => {
            const missingProgress = !project.progress || project.progress === 0;
            const missingImage = !project.image;
            const expanded = expandedId === project.id;
            const pct = project.progress ?? 0;
            return (
              <div
                key={project.id}
                className="rounded-xl border border-zinc-800 bg-zinc-950"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : project.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-white">{project.title}</p>
                      {(missingProgress || missingImage) ? (
                        <span
                          className="rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-300"
                          title={[
                            missingProgress ? "Missing progress" : "",
                            missingImage ? "Missing image" : "",
                          ].filter(Boolean).join(" · ")}
                        >
                          !
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {project.category} · {project.status} · {project.visibility === "draft" ? "Draft" : "Public"}
                    </p>
                  </div>
                  <div className="hidden w-28 shrink-0 sm:block">
                    <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className={`h-full rounded-full ${progressColor(pct)}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-1 text-right text-[10px] text-zinc-500">{pct}%</p>
                  </div>
                  <span className="text-xs text-zinc-500">{expanded ? "Hide" : "Edit"}</span>
                </button>

                {expanded ? (
                <div className="space-y-3 border-t border-zinc-800 px-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-white font-semibold text-sm">{project.title}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">{project.category}</p>
                      <p className="mt-0.5 text-xs text-zinc-600">
                        {project.visibility === "draft" ? "Draft" : "Public"} · {project.timeframe ?? "2 weeks"}
                      </p>
                      {(project.subcategoryPath ?? []).length > 0 ? (
                        <p className="text-zinc-600 text-xs mt-0.5">
                          {(project.subcategoryPath ?? []).join(" > ")}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <>
                        <input
                          value={project.status}
                          onChange={(e) =>
                            void onFieldUpdate(project.id, { status: e.target.value })
                          }
                          list={`status-presets-${project.id}`}
                          className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-300 w-32"
                          placeholder="Status"
                        />
                        <datalist id={`status-presets-${project.id}`}>
                          <option value="planned" />
                          <option value="in progress" />
                          <option value="finished" />
                        </datalist>
                      </>
                      <button
                        type="button"
                        onClick={() => void onDeleteProject(project.id)}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs text-zinc-400">Subcategory path</span>
                    <input
                      value={stringifySubcategoryPath(project.subcategoryPath)}
                      onChange={(e) =>
                        setProjects((prev) =>
                          prev.map((p) =>
                            p.id === project.id
                              ? { ...p, subcategoryPath: parseSubcategoryPath(e.target.value) }
                              : p
                          )
                        )
                      }
                      onBlur={(e) =>
                        void onFieldUpdate(project.id, {
                          subcategoryPath: parseSubcategoryPath(e.target.value),
                        })
                      }
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
                      placeholder="AI / ML > ML > Object detection models"
                    />
                  </div>

                  {/* Progress slider */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Completion</span>
                      <span className="font-semibold text-white tabular-nums">
                        {project.progress ?? 0}% — {progressLabel(project.progress ?? 0)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={project.progress ?? 0}
                      onChange={(e) =>
                        setProjects((prev) =>
                          prev.map((p) =>
                            p.id === project.id ? { ...p, progress: Number(e.target.value) } : p
                          )
                        )
                      }
                      onMouseUp={(e) =>
                        void onFieldUpdate(project.id, {
                          progress: Number((e.target as HTMLInputElement).value),
                        })
                      }
                      onTouchEnd={(e) =>
                        void onFieldUpdate(project.id, {
                          progress: Number((e.target as HTMLInputElement).value),
                        })
                      }
                      className="w-full accent-sky-500"
                    />
                    {/* Preset quick-pick */}
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_LABELS.map((p) => (
                        <button
                          key={p.pct}
                          type="button"
                          onClick={() => void onFieldUpdate(project.id, { progress: p.pct })}
                          className={`text-xs px-2 py-0.5 rounded-md border transition-colors ${
                            (project.progress ?? 0) === p.pct
                              ? "bg-sky-500/20 border-sky-500/50 text-sky-300"
                              : "border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${progressColor(project.progress ?? 0)}`}
                        style={{ width: `${project.progress ?? 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <label className="block">
                      <span className="text-xs text-zinc-400">Sprint timeframe</span>
                      <select
                        value={project.timeframe ?? "2 weeks"}
                        onChange={(e) => void onFieldUpdate(project.id, { timeframe: e.target.value as TimeframeOption })}
                        className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200"
                      >
                        {TIMEFRAME_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-xs text-zinc-400">Visibility</span>
                      <select
                        value={project.progress === 100 ? "public" : (project.visibility ?? "draft")}
                        onChange={(e) => void onFieldUpdate(project.id, { visibility: e.target.value as Project["visibility"] })}
                        disabled={(project.progress ?? 0) >= 100}
                        className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 disabled:opacity-60"
                      >
                        <option value="public">Publish to Public Portfolio</option>
                        <option value="draft">Keep as Draft</option>
                      </select>
                    </label>
                    <label className="flex items-end">
                      <span className="inline-flex w-full items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-300">
                        <input
                          type="checkbox"
                          checked={Boolean(project.featured)}
                          onChange={(e) => void onFieldUpdate(project.id, { featured: e.target.checked })}
                          className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-sky-400"
                        />
                        Featured project
                      </span>
                    </label>
                  </div>

                  {/* Image upload */}
                  <div className="space-y-1.5">
                    <span className="text-xs text-zinc-400">Background image</span>
                    <div className="flex items-center gap-3">
                      {project.image ? (
                        <div className="relative rounded-lg overflow-hidden h-16 w-24 shrink-0 bg-zinc-800">
                          <img src={project.image} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-16 w-24 shrink-0 rounded-lg border border-dashed border-zinc-700 text-zinc-600 text-xs text-center leading-tight">
                          blank
                        </div>
                      )}
                      <div className="flex flex-col gap-1.5 flex-1">
                        <label className="cursor-pointer rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-400 hover:border-zinc-500 hover:text-zinc-300 text-center transition-colors">
                          {project.image ? "Replace image" : "Upload image"}
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(e) => void onImageFileChange(e, project.id)}
                          />
                        </label>
                        {project.image && (
                          <button
                            type="button"
                            onClick={() => void onFieldUpdate(project.id, { image: "" })}
                            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                          >
                            Remove image
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Hidden admin notes */}
                  <div className="space-y-1.5">
                    <span className="text-xs text-zinc-400">Hidden from public notes</span>
                    <textarea
                      value={project.hiddenNotes ?? ""}
                      onChange={(e) =>
                        setProjects((prev) =>
                          prev.map((p) =>
                            p.id === project.id ? { ...p, hiddenNotes: e.target.value } : p
                          )
                        )
                      }
                      onBlur={(e) =>
                        void onFieldUpdate(project.id, { hiddenNotes: e.target.value })
                      }
                      className="min-h-24 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
                      placeholder="Hidden from public notes"
                    />
                  </div>

                  {/* Links editor */}
                  <InlineLinksEditor
                    projectId={project.id}
                    links={project.links ?? (
                      [
                        ...(project.github ? [{ label: "GitHub", url: project.github }] : [{ label: "GitHub", url: "" }]),
                        ...(project.demo ? [{ label: "Demo", url: project.demo }] : [{ label: "Demo", url: "" }]),
                      ]
                    )}
                    onSave={(newLinks) => void onFieldUpdate(project.id, { links: newLinks })}
                  />
                </div>
                ) : null}
              </div>
            );
          })}
          {!loading && filteredProjects.length === 0 ? (
            <p className="px-1 py-4 text-sm text-zinc-500">No projects in this filter.</p>
          ) : null}
        </div>
      </div>
    </DashboardShell>
  );
}

// ── Inline links editor sub-component ────────────────────────────────────────
function InlineLinksEditor({
  projectId,
  links: initialLinks,
  onSave,
}: {
  projectId: string;
  links: ProjectLink[];
  onSave: (links: ProjectLink[]) => void;
}) {
  const [links, setLinks] = useState<ProjectLink[]>(initialLinks);
  const [dirty, setDirty] = useState(false);

  function updateLink(idx: number, field: keyof ProjectLink, value: string) {
    setLinks((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
    setDirty(true);
  }

  function removeLink(idx: number) {
    setLinks((prev) => prev.filter((_, i) => i !== idx));
    setDirty(true);
  }

  function addLink() {
    setLinks((prev) => [...prev, { label: "", url: "" }]);
    setDirty(true);
  }

  function save() {
    onSave(links.filter((l) => l.label.trim() || l.url.trim()));
    setDirty(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-400">Links</span>
        <div className="flex gap-3">
          {dirty && (
            <button
              type="button"
              onClick={save}
              className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
            >
              Save links
            </button>
          )}
          <button
            type="button"
            onClick={addLink}
            className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
          >
            + Add link
          </button>
        </div>
      </div>
      {links.length === 0 && (
        <p className="text-xs text-zinc-600">No links.</p>
      )}
      {links.map((link, idx) => (
        <div key={idx} className="flex gap-2 items-center">
          <input
            value={link.label}
            onChange={(e) => updateLink(idx, "label", e.target.value)}
            className="w-24 shrink-0 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-white placeholder:text-zinc-600"
            placeholder="Label"
          />
          <input
            value={link.url}
            onChange={(e) => updateLink(idx, "url", e.target.value)}
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-white placeholder:text-zinc-600"
            placeholder="https://..."
          />
          <button
            type="button"
            onClick={() => removeLink(idx)}
            className="shrink-0 text-zinc-600 hover:text-red-400 transition-colors text-xs px-1"
            title="Remove link"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
