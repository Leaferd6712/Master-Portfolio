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
      { href: "/dashboard", label: "Home" },
      { href: "/dashboard/projects", label: "Projects" },
      { href: "/dashboard/tasks", label: "Tasks" },
    ],
  },
  {
    label: "Content",
    links: [
      { href: "/dashboard/tabs", label: "Nav" },
      { href: "/dashboard/notes", label: "Notes" },
      { href: "/dashboard/roadmap", label: "Roadmap" },
      { href: "/dashboard/context", label: "Context" },
    ],
  },
  {
    label: "Tools",
    links: [{ href: "/dashboard/ai", label: "AI" }],
  },
];

export default function DashboardShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border border-zinc-800 bg-zinc-900 p-3 lg:sticky lg:top-24">
          <p className="mb-3 px-3 text-xs uppercase tracking-[0.25em] text-sky-400">
            Dashboard
          </p>
          <div className="space-y-4">
            {dashboardGroups.map((group) => (
              <div key={group.label}>
                <p className="mb-1 px-3 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                  {group.label}
                </p>
                <nav className="flex flex-col gap-0.5">
                  {group.links.map((link) => {
                    const isActive =
                      link.href === "/dashboard"
                        ? pathname === "/dashboard"
                        : pathname === link.href || pathname.startsWith(`${link.href}/`);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
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
          <div className="mt-5 space-y-3 border-t border-zinc-800 pt-5">
            <MaintenanceToggle />
            <DownloadDataButton />
            <LogoutButton />
          </div>
        </aside>

        <section className="min-w-0">
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-white md:text-3xl">{title}</h1>
            {description ? (
              <p className="mt-1 text-sm text-zinc-400">{description}</p>
            ) : null}
          </header>
          {children}
        </section>
      </div>
    </div>
  );
}
