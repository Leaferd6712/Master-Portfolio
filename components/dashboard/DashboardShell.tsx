"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/dashboard/LogoutButton";
import MaintenanceToggle from "@/components/dashboard/MaintenanceToggle";
import DownloadDataButton from "@/components/dashboard/DownloadDataButton";

const dashboardGroups = [
  {
    label: "Workspace",
    links: [
      { href: "/dashboard", label: "Overview" },
      { href: "/dashboard/projects", label: "Projects" },
      { href: "/dashboard/tasks", label: "Tasks" },
      { href: "/dashboard/all-tasks", label: "All Tasks" },
    ],
  },
  {
    label: "Content",
    links: [
      { href: "/dashboard/tabs", label: "Navigation CMS" },
      { href: "/dashboard/notes", label: "Notes CMS" },
      { href: "/dashboard/roadmap", label: "Roadmap" },
      { href: "/dashboard/context", label: "Context" },
    ],
  },
  {
    label: "Tools",
    links: [{ href: "/dashboard/ai", label: "AI Panel" }],
  },
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
  const pathname = usePathname();

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="h-fit rounded-3xl border border-zinc-800 bg-zinc-900 p-4 lg:sticky lg:top-24">
          <p className="mb-4 text-xs uppercase tracking-[0.25em] text-sky-400">
            Dashboard
          </p>
          <div className="space-y-5">
            {dashboardGroups.map((group) => (
              <div key={group.label}>
                <p className="mb-2 px-3 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                  {group.label}
                </p>
                <nav className="flex flex-col gap-1">
                  {group.links.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`rounded-xl px-3 py-2 text-sm transition-colors ${
                          isActive
                            ? "bg-sky-500/10 text-sky-300 ring-1 ring-sky-500/30"
                            : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                        }`}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-4 border-t border-zinc-800 pt-6">
            <MaintenanceToggle />
            <DownloadDataButton />
            <LogoutButton />
          </div>
        </aside>

        <section className="min-w-0">
          <header className="mb-8 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
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
