"use client";

import DashboardShell from "@/components/dashboard/DashboardShell";
import TaskStatusBadge from "@/components/dashboard/TaskStatusBadge";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Project } from "@/components/ProjectCard";
import { getDashboardState, getProjects, getRoadmap, getTasks, Task, updateDashboardState } from "@/lib/api";

const STATUS_RANK: Record<Task["status"], number> = {
  "in progress": 0,
  planned: 1,
  idea: 2,
  done: 3,
};

const PRIORITY_RANK: Record<Task["priority"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function progressColor(pct: number): string {
  if (pct === 0) return "bg-zinc-600";
  if (pct < 40) return "bg-sky-500";
  if (pct < 75) return "bg-amber-400";
  return "bg-emerald-400";
}

function extractMonthNote(content: string, month: string): string {
  const startMarker = `## ${month}`;
  const start = content.indexOf(startMarker);
  if (start === -1) return "";
  const bodyStart = start + startMarker.length;
  const nextIndex = content.indexOf("\n## ", bodyStart);
  const body = nextIndex === -1 ? content.slice(bodyStart) : content.slice(bodyStart, nextIndex);
  return body.trim();
}

function truncate(text: string, max = 280): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [monthNote, setMonthNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentFocus, setCurrentFocus] = useState("");
  const focusReadyRef = useRef(false);
  const currentMonth = useMemo(
    () => new Date().toLocaleString("en-US", { month: "long" }),
    []
  );

  useEffect(() => {
    async function load() {
      try {
        const [tasksRes, projectsRes, focusRes] = await Promise.all([
          getTasks(),
          getProjects(),
          getDashboardState().catch(() => ({ currentFocus: "" })),
        ]);
        setTasks(tasksRes);
        setProjects(projectsRes);
        setCurrentFocus(focusRes.currentFocus ?? "");
        focusReadyRef.current = true;
        try {
          const roadmapRes = await getRoadmap();
          setMonthNote(extractMonthNote(roadmapRes, currentMonth));
        } catch {
          setMonthNote("");
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load dashboard";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [currentMonth]);

  useEffect(() => {
    if (!focusReadyRef.current) return;
    const timer = window.setTimeout(() => {
      void updateDashboardState({ currentFocus }).catch(() => undefined);
    }, 600);
    return () => window.clearTimeout(timer);
  }, [currentFocus]);

  const projectById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects]
  );

  const openTasks = useMemo(() => tasks.filter((task) => task.status !== "done"), [tasks]);
  const nextUp = useMemo(
    () =>
      [...openTasks]
        .sort((a, b) => {
          const statusDiff = STATUS_RANK[a.status] - STATUS_RANK[b.status];
          if (statusDiff !== 0) return statusDiff;
          return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
        })
        .slice(0, 5),
    [openTasks]
  );

  const activeProjects = useMemo(
    () => projects.filter((project) => project.status !== "finished"),
    [projects]
  );

  return (
    <DashboardShell title="Home" description="What to work on next.">
      {error ? (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="mb-6">
        <label htmlFor="current-focus" className="mb-1.5 block text-xs uppercase tracking-[0.18em] text-zinc-500">
          Current focus
        </label>
        <input
          id="current-focus"
          value={currentFocus}
          onChange={(e) => {
            setCurrentFocus(e.target.value);
          }}
          placeholder="One line: what matters this week"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600"
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link
          href="/dashboard/tasks"
          className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-sky-500/40"
        >
          <p className="text-xs text-zinc-500">Open tasks</p>
          <p className="mt-1 text-3xl font-bold text-white">{openTasks.length}</p>
        </Link>
        <Link
          href="/dashboard/projects"
          className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-sky-500/40"
        >
          <p className="text-xs text-zinc-500">Projects</p>
          <p className="mt-1 text-3xl font-bold text-white">{projects.length}</p>
        </Link>
        <Link
          href="/dashboard/projects"
          className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-sky-500/40"
        >
          <p className="text-xs text-zinc-500">Active builds</p>
          <p className="mt-1 text-3xl font-bold text-white">{activeProjects.length}</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Next up</h2>
            <Link href="/dashboard/tasks" className="text-xs text-sky-400 hover:text-sky-300">
              Open tasks
            </Link>
          </div>
          {loading ? (
            <p className="text-sm text-zinc-500">Loading…</p>
          ) : nextUp.length === 0 ? (
            <p className="text-sm text-zinc-500">No open tasks.</p>
          ) : (
            <div className="space-y-2">
              {nextUp.map((task) => {
                const project = projectById.get(task.projectId);
                return (
                  <Link
                    key={task.id}
                    href="/dashboard/tasks"
                    className="block rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 transition-colors hover:border-zinc-700"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-white">{task.title}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {project?.title ?? "No project"} · {task.timeframe}
                        </p>
                      </div>
                      <TaskStatusBadge status={task.status} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Active builds</h2>
              <Link href="/dashboard/projects" className="text-xs text-sky-400 hover:text-sky-300">
                All projects
              </Link>
            </div>
            {loading ? (
              <p className="text-sm text-zinc-500">Loading…</p>
            ) : activeProjects.length === 0 ? (
              <p className="text-sm text-zinc-500">No active projects.</p>
            ) : (
              <div className="space-y-3">
                {activeProjects.slice(0, 6).map((project) => {
                  const pct = project.progress ?? 0;
                  return (
                    <Link
                      key={project.id}
                      href="/dashboard/projects"
                      className="block rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 transition-colors hover:border-zinc-700"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-medium text-white">{project.title}</p>
                        <span className="shrink-0 text-xs text-zinc-500">{project.status}</span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className={`h-full rounded-full ${progressColor(pct)}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{currentMonth}</h2>
              <Link href="/dashboard/roadmap" className="text-xs text-sky-400 hover:text-sky-300">
                Full roadmap
              </Link>
            </div>
            {loading ? (
              <p className="text-sm text-zinc-500">Loading…</p>
            ) : monthNote ? (
              <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-300">{truncate(monthNote)}</p>
            ) : (
              <p className="text-sm text-zinc-500">No roadmap note for this month.</p>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
