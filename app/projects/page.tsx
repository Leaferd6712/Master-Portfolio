"use client";

import { useState, useMemo, useEffect } from "react";
import ProjectCard, { Project } from "@/components/ProjectCard";
import { getProjects, getSiteSettings } from "@/lib/api";
import { flattenTabs, projectMatchesCategory } from "@/lib/categories";

export default function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState([
    { label: "ML / Vision", depth: 0 },
    { label: "Games", depth: 0 },
    { label: "CAD", depth: 0 },
    { label: "Backend", depth: 0 },
    { label: "Tools", depth: 0 },
  ]);

  useEffect(() => {
    async function load() {
      try {
        const [data, settings] = await Promise.all([getProjects(), getSiteSettings()]);
        setProjects(data);
        const nodes = flattenTabs(settings.tabs)
          .filter((node) => node.label !== "Notes" && node.label !== "Contact")
          .map((node) => ({ label: node.label, depth: node.depth }));
        const projectCategories = Array.from(
          new Set(data.map((project) => project.category).filter(Boolean))
        ).map((label) => ({ label, depth: 0 }));
        const seen = new Set<string>();
        setCategories([...nodes, ...projectCategories].filter((item) => {
          if (seen.has(item.label)) return false;
          seen.add(item.label);
          return true;
        }));
      } catch {
        setProjects([]);
      }
    }
    void load();
  }, []);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      // Filter out draft projects
      if (p.visibility === "draft") return false;
      
      // Simple category matching (supports both direct category and subcategoryPath)
      const matchesCategory =
        activeCategory === "All" ||
        p.category === activeCategory ||
        (p.subcategoryPath && p.subcategoryPath.includes(activeCategory));
      
      const q = search.toLowerCase();
      const matchesSearch =
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.techs.some((t) => t.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [projects, search, activeCategory]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-white mb-2">Projects</h1>
        <p className="text-zinc-400">
          Everything I&apos;ve built — search or filter by category.
        </p>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by title, description, or tech…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-sky-500 mb-6 transition-colors"
      />

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-10">
        {[{ label: "All", depth: 0 }, ...categories].map((cat) => (
          <button
            key={cat.label}
            onClick={() => setActiveCategory(cat.label)}
            style={{ marginLeft: cat.depth ? `${cat.depth * 0.75}rem` : undefined }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat.label
                ? "bg-sky-500 text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700"
            }`}
          >
            {cat.depth ? "↳ " : ""}
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24">
          <p className="text-zinc-500 text-lg">No projects found.</p>
          <button
            onClick={() => {
              setSearch("");
              setActiveCategory("All");
            }}
            className="mt-4 text-sky-400 hover:text-sky-300 text-sm transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
