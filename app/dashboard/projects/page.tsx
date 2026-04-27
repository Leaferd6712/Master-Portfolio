"use client";

import DashboardShell from "@/components/dashboard/DashboardShell";
import { FormEvent, useEffect, useState } from "react";
import type { Project } from "@/components/ProjectCard";
import {
  addProject,
  deleteProject,
  getProjects,
  updateProject,
} from "@/lib/api";

export default function DashboardProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Games");
  const [status, setStatus] = useState<Project["status"]>("planned");
  const [github, setGithub] = useState("");
  const [demo, setDemo] = useState("");
  const [techs, setTechs] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await getProjects();
        setProjects(data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load projects";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  async function onAddProject(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    try {
      const created = await addProject({
        title: title.trim(),
        description: description.trim(),
        category,
        status,
        github: github.trim(),
        demo: demo.trim(),
        image: "",
        techs: techs
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });
      setProjects((prev) => [created, ...prev]);
      setTitle("");
      setDescription("");
      setGithub("");
      setDemo("");
      setTechs("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to add project";
      setError(msg);
    }
  }

  async function onStatusChange(projectId: string, nextStatus: Project["status"]) {
    try {
      const updated = await updateProject(projectId, { status: nextStatus });
      setProjects((prev) => prev.map((project) => (project.id === projectId ? updated : project)));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update project";
      setError(msg);
    }
  }

  async function onDeleteProject(projectId: string) {
    try {
      await deleteProject(projectId);
      setProjects((prev) => prev.filter((project) => project.id !== projectId));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete project";
      setError(msg);
    }
  }

  return (
    <DashboardShell
      title="Project Manager"
      description="Live admin surface for adding projects and managing project statuses."
    >
      {error ? (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-6">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-xl font-semibold text-white">Add project</h2>
          <form className="mt-5 space-y-3" onSubmit={onAddProject}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white placeholder:text-zinc-500"
              placeholder="Project title"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-28 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white placeholder:text-zinc-500"
              placeholder="Project description"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-300"
              >
                <option value="Games">Games</option>
                <option value="ML / Vision">ML / Vision</option>
                <option value="CAD">CAD</option>
                <option value="Backend">Backend</option>
                <option value="Tools">Tools</option>
              </select>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Project["status"])}
                className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-300"
              >
                <option value="planned">planned</option>
                <option value="in progress">in progress</option>
                <option value="finished">finished</option>
              </select>
            </div>
            <input
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white placeholder:text-zinc-500"
              placeholder="GitHub link"
            />
            <input
              value={demo}
              onChange={(e) => setDemo(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white placeholder:text-zinc-500"
              placeholder="Demo link"
            />
            <input
              value={techs}
              onChange={(e) => setTechs(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white placeholder:text-zinc-500"
              placeholder="Tech stack (comma separated)"
            />
            <button
              type="submit"
              className="w-full rounded-xl bg-sky-500 px-4 py-3 font-semibold text-white hover:bg-sky-400 transition-colors"
            >
              Add project
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 overflow-hidden">
          <div className="flex items-center justify-between gap-3 mb-5">
            <h2 className="text-xl font-semibold text-white">Tracked projects</h2>
            <span className="text-sm text-zinc-500">{projects.length} total</span>
          </div>
          {loading ? <p className="mb-4 text-zinc-500">Loading projects...</p> : null}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="text-left text-zinc-500 border-b border-zinc-800">
                  <th className="pb-3 font-medium">Title</th>
                  <th className="pb-3 font-medium">Category</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Tech</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id} className="border-b border-zinc-900 align-top">
                    <td className="py-4 pr-4 text-white font-medium">{project.title}</td>
                    <td className="py-4 pr-4 text-zinc-400">{project.category}</td>
                    <td className="py-4 pr-4 text-zinc-400">
                      <select
                        value={project.status}
                        onChange={(e) => onStatusChange(project.id, e.target.value as Project["status"])}
                        className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-300"
                      >
                        <option value="planned">planned</option>
                        <option value="in progress">in progress</option>
                        <option value="finished">finished</option>
                      </select>
                    </td>
                    <td className="py-4 text-zinc-500">{project.techs.join(", ")}</td>
                    <td className="py-4 pl-2">
                      <button
                        type="button"
                        onClick={() => onDeleteProject(project.id)}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
