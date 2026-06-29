"use client";

import { useEffect, useState } from "react";
import { getNotes, type NoteEntry } from "@/lib/api";

function renderLines(content: string) {
  return content.split(/\n+/).map((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("### ")) {
      return <h3 key={index} className="mt-6 text-lg font-semibold text-white">{trimmed.slice(4)}</h3>;
    }
    if (trimmed.startsWith("## ")) {
      return <h2 key={index} className="mt-8 text-2xl font-semibold text-white">{trimmed.slice(3)}</h2>;
    }
    if (trimmed.startsWith("# ")) {
      return <h2 key={index} className="mt-8 text-2xl font-semibold text-white">{trimmed.slice(2)}</h2>;
    }
    if (trimmed.startsWith("- ")) {
      return <p key={index} className="pl-4 text-sm leading-7 text-zinc-300">• {trimmed.slice(2)}</p>;
    }
    return <p key={index} className="text-sm leading-7 text-zinc-300">{trimmed}</p>;
  });
}

export default function NotesPage() {
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setNotes(await getNotes());
      } catch {
        setNotes([]);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="mb-12">
        <span className="text-sky-400 text-sm font-mono uppercase tracking-widest">
          Documentation
        </span>
        <h1 className="text-4xl font-bold text-white mt-2">Notes</h1>
        <p className="text-zinc-400 mt-3">
          Project write-ups, build notes, experiments, and technical decisions.
        </p>
      </div>

      {loading ? <p className="text-zinc-500">Loading notes...</p> : null}

      {!loading && notes.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <p className="text-zinc-400 text-lg">No notes published yet.</p>
        </div>
      ) : null}

      <div className="space-y-6">
        {notes.map((note) => (
          <article
            key={note.id}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-6"
          >
            <div className="flex flex-col gap-3 border-b border-zinc-800 pb-5 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">{note.title}</h2>
                {note.summary ? (
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                    {note.summary}
                  </p>
                ) : null}
              </div>
              <div className="text-xs text-zinc-500">
                {note.updatedAt ? new Date(note.updatedAt).toLocaleDateString() : ""}
              </div>
            </div>
            {note.tags.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {note.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
            <div className="mt-6 space-y-3">{renderLines(note.content)}</div>
          </article>
        ))}
      </div>
    </div>
  );
}
