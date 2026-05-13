"use client";

import DashboardShell from "@/components/dashboard/DashboardShell";
import TaskStatusBadge from "@/components/dashboard/TaskStatusBadge";
import { FormEvent, useEffect, useState } from "react";
import { getTasks, addTask, Task } from "@/lib/api";

const months = [
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function DashboardRoadmapPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [openMonth, setOpenMonth] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newPriority, setNewPriority] = useState<Task["priority"]>("medium");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getTasks();
        setTasks(data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load roadmap";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  function toggleOpenMonth(month: string) {
    if (openMonth === month) {
      setOpenMonth(null);
      return;
    }
    setOpenMonth(month);
    setNewTitle("");
    setNewCategory("");
    setNewPriority("medium");
    setFormError("");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>, month: string) {
    e.preventDefault();
    setFormError("");
    if (!newTitle.trim()) {
      setFormError("Please enter a title");
      return;
    }

    setSubmitting(true);
    try {
      const created = await addTask({
        title: newTitle.trim(),
        status: "planned",
        priority: newPriority,
        category: newCategory.trim() || "General",
        month,
        notes: "",
      });
      setTasks((prev) => [...prev, created]);
      setOpenMonth(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to add task";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardShell
      title="2026 Roadmap"
      description="Month-by-month roadmap view generated from your live task list."
    >
      {error ? (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {loading ? <p className="mb-4 text-zinc-500">Loading roadmap...</p> : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {months.map((month) => {
          // Exclude project-linked tasks from the roadmap view so nothing is added automatically
          const items = tasks.filter((task) => task.month === month && !task.projectId);
          const done = items.filter((task) => task.status === "done").length;
          const progress = items.length === 0 ? 0 : Math.round((done / items.length) * 100);

          return (
            <div key={month} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <button type="button" onClick={() => toggleOpenMonth(month)} className="text-left">
                    <h2 className="text-lg font-semibold text-white">{month}</h2>
                    <p className="text-sm text-zinc-500">{items.length} planned items</p>
                  </button>
                </div>
                <span className="text-sm text-sky-400">{progress}%</span>
              </div>

              {openMonth === month ? (
                <form onSubmit={(e) => void handleSubmit(e, month)} className="mb-4 space-y-2">
                  <div className="flex gap-2">
                    <input
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Task title"
                      className="flex-1 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-500"
                    />
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as Task["priority"])}
                      className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Category"
                      className="flex-1 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-500"
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-md bg-sky-500 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-400 disabled:opacity-60"
                    >
                      {submitting ? "Adding..." : "Add"}
                    </button>
                    <button type="button" onClick={() => setOpenMonth(null)} className="text-sm text-zinc-400 hover:text-zinc-200">
                      Cancel
                    </button>
                  </div>

                  {formError ? <p className="text-sm text-red-400">{formError}</p> : null}
                </form>
              ) : null}
              <div className="h-2 rounded-full bg-zinc-800 overflow-hidden mb-4">
                <div className="h-full bg-sky-500" style={{ width: `${progress}%` }} />
              </div>
              <div className="space-y-3">
                {items.length > 0 ? (
                  items.map((task) => (
                    <div key={task.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                      <p className="text-sm font-medium text-white">{task.title}</p>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <span className="text-xs text-zinc-500">{task.category}</span>
                        <TaskStatusBadge status={task.status} />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-600">No tasks planned yet.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </DashboardShell>
  );
}
