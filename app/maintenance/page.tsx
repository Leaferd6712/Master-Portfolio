import Link from "next/link";

export const metadata = {
  title: "This website is currently down",
};

export default function MaintenancePage() {
  return (
    <div className="min-h-screen px-4 flex items-center justify-center bg-zinc-950">
      <div className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 md:p-10 text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-amber-300">
          Maintenance Mode
        </p>
        <h1 className="mt-4 text-3xl md:text-4xl font-bold text-white leading-tight">
          This website is currently down, come back soon
        </h1>
        <p className="mt-4 text-zinc-400">
          Updates are in progress. Public access will be restored once the work
          is complete.
        </p>

        <Link
          href="/dashboard/login"
          className="mt-10 inline-flex items-center justify-center rounded-xl bg-sky-500 px-6 py-3 font-semibold text-white hover:bg-sky-400 transition-colors"
        >
          Admin sign in
        </Link>
      </div>
    </div>
  );
}
