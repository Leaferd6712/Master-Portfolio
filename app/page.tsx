"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ProjectCard, { Project } from "@/components/ProjectCard";
import { getProjects } from "@/lib/api";

const interests = [
  {
    icon: "🤖",
    label: "Robotics",
    desc: "Building autonomous systems and physical computing projects.",
  },
  {
    icon: "🧠",
    label: "AI / ML",
    desc: "YOLO models, classifiers, vision systems, and neural nets.",
  },
  {
    icon: "💻",
    label: "Coding",
    desc: "Python, TypeScript, system design, and backend APIs.",
  },
  {
    icon: "🎮",
    label: "Game Dev",
    desc: "Mini simulations, 2D games, and interactive experiences.",
  },
];

export default function HomePage() {
  const [featured, setFeatured] = useState<Project[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const projects = await getProjects();
        setFeatured(projects.slice(0, 3));
      } catch {
        setFeatured([]);
      }
    }
    void load();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="py-24 md:py-36">
        <p className="text-sky-400 text-sm font-mono mb-3 tracking-widest uppercase">
          Hello, I&apos;m
        </p>
        <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight tracking-tight">
          Mathias
        </h1>
        <p className="mt-5 text-xl md:text-2xl text-zinc-400 max-w-2xl leading-relaxed">
          Building at the intersection of AI, robotics, and software — one
          project at a time.
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

      {/* ── Interests ─────────────────────────────────────────── */}
      <section className="py-12 border-t border-zinc-800">
        <h2 className="text-2xl font-bold text-white mb-8">What I&apos;m Into</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {interests.map((item) => (
            <div
              key={item.label}
              className="bg-zinc-900 rounded-xl p-5 border border-zinc-800 hover:border-sky-500/30 transition-colors"
            >
              <span className="text-3xl">{item.icon}</span>
              <h3 className="text-white font-semibold mt-3 text-sm">
                {item.label}
              </h3>
              <p className="text-zinc-500 text-xs mt-1 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured Projects ─────────────────────────────────── */}
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
          {featured.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
