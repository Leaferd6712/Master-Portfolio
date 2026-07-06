export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-800 mt-24">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-zinc-600 text-sm">
          © {year} YourName. Built with Next.js + Tailwind CSS.
        </p>
        <div className="flex gap-6">
          <a
            href="https://github.com/yourusername"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 hover:text-sky-400 text-sm transition-colors"
          >
            GitHub
          </a>
          <a
            href="mailto:your@email.com"
            className="text-zinc-500 hover:text-sky-400 text-sm transition-colors"
          >
            Email
          </a>
          {/* TODO: Add your dashboard link — keep this subtle */}
          <a
            href="/dashboard"
            className="text-zinc-800 hover:text-zinc-600 text-sm transition-colors"
            title="Dashboard"
          >
            ⚙
          </a>
        </div>
      </div>
    </footer>
  );
}
