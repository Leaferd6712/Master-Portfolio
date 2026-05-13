"use client";

import DashboardShell from "@/components/dashboard/DashboardShell";
import TaskStatusBadge from "@/components/dashboard/TaskStatusBadge";
import { useEffect, useState } from "react";
import { DndContext, PointerSensor, useSensor, useSensors, DragEndEvent, closestCenter } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getTasks, reorderTasks, updateTask, deleteTask, Task } from "@/lib/api";

export default function AllTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

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

  async function persistTaskOrder(next: Task[]) {
    try {
      const saved = await reorderTasks(next.map((t) => ({ id: t.id, status: t.status })));
      setTasks(saved);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save order";
      setError(msg);
    }
  }

  function SortableTaskCard({ task }: { task: Task }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 } as any;

    async function onNotesBlur(newNotes: string) {
      if (newNotes === task.notes) return;
      try {
        const updated = await updateTask(task.id, { notes: newNotes });
        setTasks((prev) => prev.map((p) => (p.id === task.id ? updated : p)));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to save notes";
        setError(msg);
      }
    }

    async function onDelete() {
      try {
        await deleteTask(task.id);
        setTasks((prev) => prev.filter((t) => t.id !== task.id));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to delete";
        setError(msg);
      }
    }

    return (
      <div ref={setNodeRef} style={style} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="font-medium text-white">{task.title}</p>
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200"
            title="Drag to reorder"
            aria-label="Drag to reorder"
          >
            Drag
          </button>
        </div>
        <p className="mt-2 text-xs text-zinc-500">{task.category} · {task.priority} · {task.month}</p>
        {task.projectId ? <p className="mt-1 text-[11px] text-sky-300">Linked project task</p> : null}

        <div className="mt-3 flex items-center justify-between gap-3">
          <TaskStatusBadge status={task.status} />
          <div className="flex items-center gap-2">
            <select
              value={task.status}
              onChange={async (e) => {
                try {
                  const updated = await updateTask(task.id, { status: e.target.value as Task["status"] });
                  setTasks((prev) => prev.map((p) => (p.id === task.id ? updated : p)));
                } catch (err) {
                  const msg = err instanceof Error ? err.message : "Failed to update";
                  setError(msg);
                }
              }}
              className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-300"
            >
              <option value="idea">idea</option>
              <option value="planned">planned</option>
              <option value="in progress">in progress</option>
              <option value="done">done</option>
            </select>
            <button type="button" onClick={onDelete} className="text-xs text-red-400 hover:text-red-300">
              Delete
            </button>
          </div>
        </div>

        <textarea
          defaultValue={task.notes || ""}
          onBlur={(e) => void onNotesBlur(e.target.value)}
          placeholder="Notes for this task"
          className="mt-3 w-full resize-y rounded-md border border-zinc-700 bg-zinc-950 p-2 text-sm text-white placeholder:text-zinc-500"
        />
      </div>
    );
  }

  function TaskListColumn({ items }: { items: Task[] }) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <SortableContext items={items.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {items.map((task) => (
              <SortableTaskCard key={task.id} task={task} />
            ))}
          </div>
        </SortableContext>
      </div>
    );
  }

  function onDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : "";
    if (!overId || activeId === overId) return;

    setTasks((prev) => {
      const from = prev.findIndex((t) => t.id === activeId);
      const to = prev.findIndex((t) => t.id === overId);
      if (from < 0 || to < 0) return prev;
      const next = arrayMove(prev, from, to);
      void persistTaskOrder(next);
      return next;
    });
  }

  return (
    <DashboardShell title="All Tasks" description="All tasks in one place. Drag to reorder; edit notes inline.">
      {error ? <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div> : null}
      {loading ? <p className="text-zinc-500">Loading tasks...</p> : null}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <TaskListColumn items={tasks} />
      </DndContext>
    </DashboardShell>
  );
}
