"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ProjectCard, { Project } from "@/components/ProjectCard";
import { getProjects, getSiteSettings, type SiteTab } from "@/lib/api";
import { publicProjects } from "@/lib/categories";

const fallbackInterests: SiteTab[] = [
  {
    icon: "🤖",
    label: "Robotics",
    href: "/projects",
    desc: "Building autonomous systems and physical computing projects.",
    showInNav: false,
    showInInterests: true,
  },
  {
    icon: "🧠",
    label: "AI / ML",
    href: "/ai",
    desc: "YOLO models, classifiers, vision systems, and neural nets.",
    showInNav: true,
    showInInterests: true,
  },
  {
    icon: "💻",
    label: "Coding",
    href: "/projects",
    desc: "Python, TypeScript, system design, and backend APIs.",
    showInNav: false,
    showInInterests: true,
  },
  {
    icon: "🎮",
    label: "Games",
    href: "/games",
    desc: "Mini simulations, 2D games, and interactive experiences.",
    showInNav: true,
    showInInterests: true,
  },
];

export default function HomePage() {
  const [featured, setFeatured] = useState<Project[]>([]);
  const [interests, setInterests] = useState<SiteTab[]>(fallbackInterests);

  useEffect(() => {
    async function load() {
      try {
        const [projects, settings] = await Promise.all([
          getProjects(),
          getSiteSettings(),
        ]);
        // Filter out draft projects if visibility field exists
        const visibleProjects = projects.filter((p) => p.visibility !== "draft");
        // Prefer featured projects, otherwise show first 3
        const markedFeatured = visibleProjects.filter((p) => p.featured === true);
        setFeatured((markedFeatured.length > 0 ? markedFeatured : visibleProjects).slice(0, 3));

        const interestTabs = settings.tabs.filter((tab) => tab.showInInterests);
        setInterests(interestTabs.length ? interestTabs : fallbackInterests);
      } catch {
        setFeatured([]);
        setInterests(fallbackInterests);
      }
    }
    void load();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4">
      <section className="py-24 md:py-36">
        <p className="text-sky-400 text-sm font-mono mb-3 tracking-widest uppercase">
          Hello, I&apos;m
        </p>
        <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight tracking-tight">
          Mathias
        </h1>
        <p className="mt-5 text-xl md:text-2xl text-zinc-400 max-w-2xl leading-relaxed">
          Here are all my projects
        </p>
        <div className="flex flex-wrap gap-4 mt-10">
          <Link
            href="/projects"
            className="px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-lg transition-colors"
          >
            View Projects
          </Link>
          <Link
            href="/contact"
            className="px-6 py-3 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-semibold rounded-lg transition-colors"
          >
            Contact Me
          </Link>
        </div>
      </section>

      <section className="py-12 border-t border-zinc-800">
        <h2 className="text-2xl font-bold text-white mb-8">What I&apos;m Into</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {interests.map((item) => (
            <Link
              key={`${item.label}-${item.href}`}
              href={item.href}
              className="bg-zinc-900 rounded-xl p-5 border border-zinc-800 hover:border-sky-500/30 transition-colors"
            >
              <span className="text-3xl">{item.icon}</span>
              <h3 className="text-white font-semibold mt-3 text-sm">
                {item.label}
              </h3>
              <p className="text-zinc-500 text-xs mt-1 leading-relaxed">
                {item.desc}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="py-12 border-t border-zinc-800">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">Featured Projects</h2>
          <Link
            href="/projects"
            className="text-sky-400 hover:text-sky-300 text-sm font-medium transition-colors"
          >
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featured.length > 0 ? (
            featured.map((p) => <ProjectCard key={p.id} project={p} />)
          ) : (
            <div className="md:col-span-3 rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-sm text-zinc-400">
              No featured projects are published yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
