"use client";

import DashboardShell from "@/components/dashboard/DashboardShell";
import TaskStatusBadge from "@/components/dashboard/TaskStatusBadge";
import { FormEvent, useEffect, useState } from "react";
import { addTask, deleteTask, getTasks, Task, updateTask } from "@/lib/api";

const columns: Array<Task["status"]> = ["idea", "planned", "in progress", "done"];

export default function DashboardTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getTasks();
        setTasks(data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load tasks";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  async function onCreateTask(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const created = await addTask({
        title: title.trim(),
        status: "idea",
        priority: "medium",
        category: "Backend",
        month: "May",
        notes: "",
      });
      setTasks((prev) => [created, ...prev]);
      setTitle("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to add task";
      setError(msg);
    }
  }

  async function onMoveTask(taskId: string, status: Task["status"]) {
    try {
      const updated = await updateTask(taskId, { status });
      setTasks((prev) => prev.map((task) => (task.id === taskId ? updated : task)));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update task";
      setError(msg);
    }
  }

  async function onDeleteTask(taskId: string) {
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete task";
      setError(msg);
    }
  }

  return (
    <DashboardShell
      title="Task Manager"
      description="Kanban-style board backed by live task data with create, status updates, and delete actions."
    >
      {error ? (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <form
        onSubmit={onCreateTask}
        className="mb-6 flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 md:flex-row"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a new task"
          className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-white placeholder:text-zinc-500"
        />
        <button
          type="submit"
          className="rounded-xl bg-sky-500 px-4 py-2.5 font-semibold text-white hover:bg-sky-400 transition-colors"
        >
          Add task
        </button>
      </form>

      {loading ? <p className="text-zinc-500">Loading tasks...</p> : null}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {columns.map((status) => {
          const items = tasks.filter((task) => task.status === status);
          return (
            <div key={status} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300">
                  {status}
                </h2>
                <span className="text-xs text-zinc-500">{items.length}</span>
              </div>
              <div className="space-y-3">
                {items.map((task) => (
                  <div key={task.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                    <p className="font-medium text-white">{task.title}</p>
                    <p className="mt-2 text-xs text-zinc-500">
                      {task.category} · {task.priority} priority · {task.month}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <TaskStatusBadge status={task.status} />
                      <div className="flex items-center gap-2">
                        <select
                          value={task.status}
                          onChange={(e) => onMoveTask(task.id, e.target.value as Task["status"])}
                          className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-300"
                        >
                          {columns.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => onDeleteTask(task.id)}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {items.length === 0 ? (
                  <p className="text-xs text-zinc-600">No tasks in this column.</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </DashboardShell>
  );
}
