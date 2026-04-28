import Link from "next/link";

export default function MaintenancePage() {
  return (
    <div className="min-h-[70vh] px-4 py-24 flex items-center justify-center">
      <div className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 md:p-10 text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-amber-300">Maintenance Mode</p>
        <h1 className="mt-4 text-3xl md:text-4xl font-bold text-white leading-tight">
          Website is currently down. Please come back later.
        </h1>
        <p className="mt-4 text-zinc-400">
          Updates are currently in progress. Public access will be restored once the work is complete.
        </p>

        <div className="mt-10 pt-6 border-t border-zinc-800 text-sm text-zinc-400">
          Are you a developer?{" "}
          <Link href="/dashboard/login" className="text-sky-400 hover:text-sky-300 font-medium transition-colors">
            Click here
          </Link>
        </div>
      </div>
    </div>
  );
}
