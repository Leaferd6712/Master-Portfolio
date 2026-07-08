"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getSiteSettings, type SiteTab } from "@/lib/api";
import { cloneDefaultSiteTabs } from "@/lib/site-config";

const fallbackTabs: SiteTab[] = cloneDefaultSiteTabs();

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [tabs, setTabs] = useState<SiteTab[]>(fallbackTabs);

  useEffect(() => {
    async function loadTabs() {
      try {
        const settings = await getSiteSettings();
        const navTabs = settings.tabs.filter((tab) => tab.showInNav);
        setTabs(navTabs.length ? navTabs : fallbackTabs);
      } catch {
        setTabs(fallbackTabs);
      }
    }

    void loadTabs();
  }, []);

  const links = tabs.filter((tab) => tab.showInNav);

  function isActiveHref(href: string): boolean {
    return pathname === href.split("?")[0];
  }

  function renderNestedMobile(items: SiteTab[], depth = 1): React.ReactNode {
    return items.map((item) => (
      <div key={`${item.label}-${item.href}-${depth}`}>
        <Link
          href={item.href}
          onClick={() => setOpen(false)}
          className={`block rounded-lg px-3 py-1.5 text-xs transition-colors ${
            isActiveHref(item.href)
              ? "bg-sky-500/10 text-sky-300"
              : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
          }`}
          style={{ marginLeft: `${depth * 0.75}rem` }}
        >
          {depth > 1 ? "↳ " : ""}
          {item.label}
        </Link>
        {item.children && item.children.length > 0
          ? renderNestedMobile(item.children, depth + 1)
          : null}
      </div>
    ));
  }

  function renderNestedDesktop(items: SiteTab[], depth = 1): React.ReactNode {
    return items.map((item) => (
      <div key={`${item.label}-${item.href}-${depth}`}>
        <Link
          href={item.href}
          className="block rounded-md px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white"
          style={{ paddingLeft: `${0.75 + depth * 0.5}rem` }}
        >
          <span className="block text-zinc-200">
            {depth > 1 ? "↳ " : ""}
            {item.label}
          </span>
          {item.desc ? (
            <span className="mt-1 block text-xs text-zinc-500">{item.desc}</span>
          ) : null}
        </Link>
        {item.children && item.children.length > 0
          ? renderNestedDesktop(item.children, depth + 1)
          : null}
      </div>
    ));
  }

  return (
    <nav className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link
          href="/"
          className="text-white font-bold text-xl tracking-tight hover:opacity-80 transition-opacity"
        >
          Mathias<span className="text-sky-400">.</span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex gap-6">
          <li>
            <Link
              href="/"
              className={`text-sm font-medium transition-colors ${
                pathname === "/"
                  ? "text-sky-400"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Home
            </Link>
          </li>
          {links.map((l) => (
            <li key={`${l.label}-${l.href}`} className="group relative">
              <Link
                href={l.href}
                className={`text-sm font-medium transition-colors ${
                  isActiveHref(l.href)
                    ? "text-sky-400"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
              {l.children && l.children.length > 0 ? (
                <div className="invisible absolute left-0 top-full min-w-64 pt-4 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-2 shadow-xl">
                    {renderNestedDesktop(l.children)}
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>

        {/* Mobile toggle button */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-1 text-zinc-400 hover:text-white transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation menu"
        >
          <span
            className={`block w-5 h-0.5 bg-current transition-transform duration-200 ${
              open ? "rotate-45 translate-y-2" : ""
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-current transition-opacity duration-200 ${
              open ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-current transition-transform duration-200 ${
              open ? "-rotate-45 -translate-y-2" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950">
          <ul className="px-4 py-3 flex flex-col gap-1">
            <li>
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className={`block py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  pathname === "/"
                    ? "text-sky-400 bg-sky-500/10"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                Home
              </Link>
            </li>
            {links.map((l) => (
              <li key={`${l.label}-${l.href}`}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`block py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    isActiveHref(l.href)
                      ? "text-sky-400 bg-sky-500/10"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  {l.label}
                </Link>
                {l.children && l.children.length > 0 ? (
                  <div className="ml-3 border-l border-zinc-800 pl-2">
                    {renderNestedMobile(l.children)}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}
