"use client";

import DashboardShell from "@/components/dashboard/DashboardShell";
import TaskStatusBadge from "@/components/dashboard/TaskStatusBadge";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Project } from "@/components/ProjectCard";
import { addTask, getProjects, getTasks, Task } from "@/lib/api";

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [taskTitle, setTaskTitle] = useState("");
  const [taskCategory, setTaskCategory] = useState("Backend");
  const [taskPriority, setTaskPriority] = useState<Task["priority"]>("medium");
  const [taskMonth, setTaskMonth] = useState("May");

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

  async function handleAddTask(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    try {
      const created = await addTask({
        title: taskTitle.trim(),
        status: "planned",
        priority: taskPriority,
        category: taskCategory,
        month: taskMonth,
        notes: "",
      });
      setTasks((prev) => [created, ...prev]);
      setTaskTitle("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to add task";
      setError(msg);
    }
  }

  const activeTasks = tasks.filter((task) => task.status !== "done");
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
          <p className="mt-2 text-4xl font-bold text-white">{activeTasks.length}</p>
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
              {activeTasks.slice(0, 4).map((task) => (
                <div key={task.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-white font-medium">{task.title}</p>
                      <p className="mt-1 text-sm text-zinc-500">
                        {task.category} · {task.priority} priority · {task.month}
                      </p>
                    </div>
                    <TaskStatusBadge status={task.status} />
                  </div>
                </div>
              ))}
              {activeTasks.length === 0 ? (
                <p className="text-zinc-500">No active tasks. Add one on the right.</p>
              ) : null}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-xl font-semibold text-white">Quick add task</h2>
            <form className="mt-4 grid gap-3" onSubmit={handleAddTask}>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="New task title"
                className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white placeholder:text-zinc-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={taskCategory}
                  onChange={(e) => setTaskCategory(e.target.value)}
                  className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-300"
                >
                  <option>Python</option>
                  <option>ML</option>
                  <option>Vision</option>
                  <option>CAD</option>
                  <option>Games</option>
                  <option>Backend</option>
                </select>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as Task["priority"])}
                  className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-300"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <select
                value={taskMonth}
                onChange={(e) => setTaskMonth(e.target.value)}
                className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-300"
              >
                <option>May</option>
                <option>June</option>
                <option>July</option>
                <option>August</option>
                <option>September</option>
                <option>October</option>
                <option>November</option>
                <option>December</option>
              </select>
              <button
                type="submit"
                className="rounded-xl bg-sky-500 px-4 py-3 font-semibold text-white hover:bg-sky-400 transition-colors"
              >
                Add task
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-xl font-semibold text-white">Current focus</h2>
            <p className="mt-4 text-zinc-400 leading-relaxed">
              Keep active work limited, finish in-progress items, and use the
              task board to move work from idea to done every week.
            </p>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
