const styles: Record<string, string> = {
  idea: "bg-zinc-800 text-zinc-300 border-zinc-700",
  planned: "bg-amber-500/15 text-amber-300 border-amber-500/20",
  "in progress": "bg-sky-500/15 text-sky-300 border-sky-500/20",
  done: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
};

export default function TaskStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${styles[status] ?? styles.idea}`}
    >
      {status}
    </span>
  );
}
