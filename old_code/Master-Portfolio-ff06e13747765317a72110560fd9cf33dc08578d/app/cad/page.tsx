"use client";

import { useEffect, useState } from "react";
import ProjectCard, { Project } from "@/components/ProjectCard";
import { getProjects } from "@/lib/api";

export default function CADPage() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const all = await getProjects();
        setProjects(all.filter((p) => p.category === "CAD"));
      } catch {
        setProjects([]);
      }
    }
    void load();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="mb-12">
        <span className="text-sky-400 text-sm font-mono uppercase tracking-widest">
          Category
        </span>
        <h1 className="text-4xl font-bold text-white mt-2">CAD / 3D Design</h1>
        <p className="text-zinc-400 mt-3 max-w-2xl leading-relaxed">
          Fusion 360 designs, 3D renders, and STL downloads.
        </p>
      </div>

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <span className="text-7xl mb-6">🧱</span>
          <p className="text-zinc-400 text-lg">CAD designs coming soon.</p>
          <p className="text-zinc-600 text-sm mt-2">
            Add projects in your dashboard with category CAD and they will appear
            here automatically.
          </p>
        </div>
      )}
    </div>
  );
}
