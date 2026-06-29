"use client";

import DashboardShell from "@/components/dashboard/DashboardShell";
import { useEffect, useState } from "react";
import { getNotes, getProjects, updateNotes, type NoteEntry, type Project } from "@/lib/api";

function newNote(): NoteEntry {
  const now = new Date().toISOString();
  return {
    id: `note-${Date.now()}`,
    title: "",
    projectId: "",
    summary: "",
    content: "",
    tags: [],
    published: true,
    updatedAt: now,
  };
}

export default function DashboardNotesPage() {
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeId, setActiveId] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const [noteData, projectData] = await Promise.all([getNotes(), getProjects()]);
      setNotes(noteData);
      setProjects(projectData);
      setActiveId(noteData[0]?.id ?? "");
    }
    void load();
  }, []);

  const active = notes.find((note) => note.id === activeId);

  function updateActive(patch: Partial<NoteEntry>) {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === activeId ? { ...note, ...patch, updatedAt: new Date().toISOString() } : note
      )
    );
    setMessage("");
  }

  function addNote() {
    const note = newNote();
    setNotes((prev) => [note, ...prev]);
    setActiveId(note.id);
    setMessage("");
  }

  function removeNote(id: string) {
    setNotes((prev) => prev.filter((note) => note.id !== id));
    setActiveId((current) => {
      if (current !== id) return current;
      return notes.find((note) => note.id !== id)?.id ?? "";
    });
  }

  async function save() {
    setSaving(true);
    const saved = await updateNotes(notes);
    setNotes(saved);
    setActiveId((current) => current || saved[0]?.id || "");
    setSaving(false);
    setMessage("Notes saved.");
  }

  return (
    <DashboardShell
      title="Notes CMS"
      description="Write and publish project documentation for the public Notes tab."
    >
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-semibold text-white">Entries</h2>
            <button
              type="button"
              onClick={addNote}
              className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-400"
            >
              Add
            </button>
          </div>
          <div className="space-y-2">
            {notes.map((note) => (
              <button
                key={note.id}
                type="button"
                onClick={() => setActiveId(note.id)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  note.id === activeId
                    ? "border-sky-500/50 bg-sky-500/10 text-white"
                    : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white"
                }`}
              >
                <span className="block truncate">{note.title || "Untitled note"}</span>
                <span className="mt-1 block text-xs text-zinc-600">
                  {note.published ? "Published" : "Draft"}
                </span>
              </button>
            ))}
            {notes.length === 0 ? <p className="text-sm text-zinc-500">No notes yet.</p> : null}
          </div>
        </aside>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          {active ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-white">Editor</h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => removeNote(active.id)}
                    className="rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-200 hover:bg-red-500/10"
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => void save()}
                    disabled={saving}
                    className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save notes"}
                  </button>
                </div>
              </div>

              {message ? <p className="text-sm text-emerald-300">{message}</p> : null}

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm text-zinc-300">Title</span>
                  <input
                    value={active.title}
                    onChange={(e) => updateActive({ title: e.target.value })}
                    className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-zinc-300">Project</span>
                  <select
                    value={active.projectId}
                    onChange={(e) => updateActive({ projectId: e.target.value })}
                    className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-200"
                  >
                    <option value="">General note</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.title}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="text-sm text-zinc-300">Summary</span>
                <input
                  value={active.summary}
                  onChange={(e) => updateActive({ summary: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
                />
              </label>

              <label className="block">
                <span className="text-sm text-zinc-300">Tags</span>
                <input
                  value={active.tags.join(", ")}
                  onChange={(e) =>
                    updateActive({
                      tags: e.target.value.split(",").map((tag) => tag.trim()).filter(Boolean),
                    })
                  }
                  className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
                  placeholder="YOLO, dashboard, FastAPI"
                />
              </label>

              <label className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={active.published}
                  onChange={(e) => updateActive({ published: e.target.checked })}
                />
                Publish on public Notes tab
              </label>

              <label className="block">
                <span className="text-sm text-zinc-300">Documentation</span>
                <textarea
                  value={active.content}
                  onChange={(e) => updateActive({ content: e.target.value })}
                  className="mt-2 min-h-[420px] w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 font-mono text-sm leading-6 text-white"
                  placeholder="# Build note&#10;&#10;What changed, why it matters, and what to inspect next."
                />
              </label>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-zinc-700 bg-zinc-950 p-8 text-center text-zinc-400">
              Create a note to start writing documentation.
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}
