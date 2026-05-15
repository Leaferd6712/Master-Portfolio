"use client";

import DashboardShell from "@/components/dashboard/DashboardShell";
import TaskStatusBadge from "@/components/dashboard/TaskStatusBadge";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Project } from "@/components/ProjectCard";
import { getProjects, getTasks, Task } from "@/lib/api";

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentFocus, setCurrentFocus] = useState(
    "Keep active work limited, finish in-progress items, and use the task board to move work from idea to done every week."
  );

  useEffect(() => {
    async function load() {
      try {
        const [tasksRes, projectsRes] = await Promise.all([
          getTasks(),
          getProjects(),
        ]);
        setTasks(tasksRes);
        setProjects(projectsRes);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load dashboard";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  useEffect(() => {
    const savedFocus = window.localStorage.getItem("dashboard.currentFocus");
    if (savedFocus && savedFocus.trim()) {
      setCurrentFocus(savedFocus);
    }
  }, []);

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const openTasks = useMemo(() => tasks.filter((task) => task.status !== "done"), [tasks]);
  const todayFocusTasks = useMemo(
    () =>
      tasks.filter((task) => {
        if (task.status === "done") return false;
        const start = task.startDate;
        const end = task.endDate || task.startDate;
        return start <= todayIso && todayIso <= end;
      }),
    [tasks, todayIso]
  );

  const activeProjects = useMemo(
    () => projects.filter((project) => project.status !== "finished"),
    [projects]
  );

  return (
    <DashboardShell
      title="Operating System Overview"
      description="Live dashboard overview powered by FastAPI through your Next.js API routes."
    >
      {error ? (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Open tasks</p>
          <p className="mt-2 text-4xl font-bold text-white">{openTasks.length}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Projects tracked</p>
          <p className="mt-2 text-4xl font-bold text-white">{projects.length}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Active builds</p>
          <p className="mt-2 text-4xl font-bold text-white">{activeProjects.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold text-white">Today&apos;s focus</h2>
            <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Live</span>
          </div>
          {loading ? (
            <p className="text-zinc-500">Loading tasks...</p>
          ) : (
            <div className="space-y-4">
              {todayFocusTasks.slice(0, 4).map((task) => (
                <div key={task.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-white font-medium">{task.title}</p>
                      <p className="mt-1 text-sm text-zinc-500">
                        {task.category} · {task.priority} priority · {task.month}
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">
                        {task.startDate} — {task.endDate}
                      </p>
                    </div>
                    <TaskStatusBadge status={task.status} />
                  </div>
                </div>
              ))}
              {todayFocusTasks.length === 0 ? (
                <p className="text-zinc-500">No tasks are scheduled for today.</p>
              ) : null}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-xl font-semibold text-white">Task Creation</h2>
            <p className="mt-3 text-zinc-400 leading-relaxed">
              Quick Add has been removed. Create all tasks in the Tasks section so each one is linked
              to a project and scheduled.
            </p>
            <Link
              href="/dashboard/tasks"
              className="mt-4 inline-flex rounded-xl bg-sky-500 px-4 py-2.5 font-semibold text-white hover:bg-sky-400 transition-colors"
            >
              Open Tasks Section
            </Link>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-xl font-semibold text-white">Current focus</h2>
            <textarea
              value={currentFocus}
              onChange={(e) => {
                setCurrentFocus(e.target.value);
                window.localStorage.setItem("dashboard.currentFocus", e.target.value);
              }}
              className="mt-4 min-h-36 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-200"
            />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
