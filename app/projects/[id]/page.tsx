"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Project } from "@/components/ProjectCard";
import { getProjects } from "@/lib/api";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getProjects();
        setProjects(data);
      } catch {
        setProjects([]);
      } finally {
        setLoaded(true);
      }
    }
    void load();
  }, []);

  const project = useMemo(
    () => projects.find((item) => item.id === params.id),
    [projects, params.id]
  );

  const related = useMemo(() => {
    if (!project) return [];
    return projects
      .filter((item) => item.category === project.category && item.id !== project.id)
      .slice(0, 3);
  }, [projects, project]);

  if (!loaded) {
    return <div className="max-w-5xl mx-auto px-4 py-16 text-zinc-500">Loading project...</div>;
  }

  if (!project) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <p className="text-zinc-300">Project not found.</p>
        <Link href="/projects" className="mt-3 inline-block text-sky-400 hover:text-sky-300">
          Back to projects
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <Link href="/projects" className="text-sm text-sky-400 hover:text-sky-300 transition-colors">
        ← Back to projects
      </Link>

      <div className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="h-72 bg-zinc-800 flex items-center justify-center text-zinc-500 text-sm">
          {project.image ? (
            <img src={project.image} alt={project.title} className="h-full w-full object-cover" />
          ) : (
            <span>{project.category} preview image goes here</span>
          )}
        </div>
        <div className="p-8 md:p-10">
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-sky-300">
              {project.category}
            </span>
            <span className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-zinc-300">
              {project.status}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            {project.title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-zinc-400">
            {project.description}
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            {project.techs.map((tech) => (
              <span key={tech} className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-300">
                {tech}
              </span>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            {project.github && (
              <Link href={project.github} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-sky-500 px-5 py-3 font-semibold text-white hover:bg-sky-400 transition-colors">
                View GitHub
              </Link>
            )}
            {project.demo && (
              <Link href={project.demo} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-zinc-700 px-5 py-3 font-semibold text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors">
                Open Demo
              </Link>
            )}
          </div>
        </div>
      </div>

      <section className="mt-12">
        <div className="flex items-center justify-between gap-3 mb-5">
          <h2 className="text-2xl font-semibold text-white">Related work</h2>
          <span className="text-sm text-zinc-500">Same category</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {related.length > 0 ? (
            related.map((item) => (
              <Link
                key={item.id}
                href={`/projects/${item.id}`}
                className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 hover:border-sky-500/30 transition-colors"
              >
                <p className="text-sm text-sky-400">{item.category}</p>
                <h3 className="mt-2 text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-zinc-500 line-clamp-3">{item.description}</p>
              </Link>
            ))
          ) : (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-zinc-500">
              No related projects yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
