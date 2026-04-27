"use client";

import DashboardShell from "@/components/dashboard/DashboardShell";
import TaskStatusBadge from "@/components/dashboard/TaskStatusBadge";
import { useEffect, useState } from "react";
import { getTasks, Task } from "@/lib/api";

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
          const items = tasks.filter((task) => task.month === month);
          const done = items.filter((task) => task.status === "done").length;
          const progress = items.length === 0 ? 0 : Math.round((done / items.length) * 100);

          return (
            <div key={month} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">{month}</h2>
                  <p className="text-sm text-zinc-500">{items.length} planned items</p>
                </div>
                <span className="text-sm text-sky-400">{progress}%</span>
              </div>
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
