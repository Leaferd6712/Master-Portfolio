import Link from "next/link";
import LogoutButton from "@/components/dashboard/LogoutButton";
import MaintenanceToggle from "@/components/dashboard/MaintenanceToggle";

const dashboardLinks = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/tasks", label: "Tasks" },
  { href: "/dashboard/roadmap", label: "Roadmap" },
  { href: "/dashboard/projects", label: "Projects" },
  { href: "/dashboard/context", label: "Context" },
  { href: "/dashboard/ai", label: "AI Panel" },
];

export default function DashboardShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-8">
        <aside className="lg:sticky lg:top-24 h-fit bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-sky-400 mb-4">
            Dashboard
          </p>
          <nav className="flex flex-col gap-2">
            {dashboardLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-6 pt-6 border-t border-zinc-800 space-y-4">
            <MaintenanceToggle />
            <LogoutButton />
          </div>
        </aside>

        <section className="min-w-0">
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              {title}
            </h1>
            <p className="mt-3 text-zinc-400 max-w-2xl leading-relaxed">
              {description}
            </p>
          </header>
          {children}
        </section>
      </div>
    </div>
  );
}
