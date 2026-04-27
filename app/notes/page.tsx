export default function NotesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="mb-12">
        <span className="text-sky-400 text-sm font-mono uppercase tracking-widest">
          Learning Log
        </span>
        <h1 className="text-4xl font-bold text-white mt-2">Notes</h1>
        <p className="text-zinc-400 mt-3">
          What I&apos;ve learned, experiments, short writeups, and ideas.
        </p>
      </div>

      {/* Placeholder */}
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <span className="text-7xl mb-6">📝</span>
        <p className="text-zinc-400 text-lg">No notes published yet.</p>
        <p className="text-zinc-600 text-sm mt-2 max-w-md">
          Notes will be written in your{" "}
          <code className="text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded text-xs">
            context.md
          </code>{" "}
          editor and displayed here once the backend is connected (Phase 3).
        </p>
      </div>
    </div>
  );
}
