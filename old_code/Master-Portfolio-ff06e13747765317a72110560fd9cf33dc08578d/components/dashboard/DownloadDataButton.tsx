"use client";

export default function DownloadDataButton() {
  return (
    <a
      href="/api/download-data"
      className="w-full rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors"
    >
      Download data
    </a>
  );
}
