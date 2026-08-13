"use client";

import DashboardShell from "@/components/dashboard/DashboardShell";
import TaskStatusBadge from "@/components/dashboard/TaskStatusBadge";
import { useEffect, useState } from "react";
import {
  getTasks,
  reorderTasks,
  Task,
  updateTask,
} from "@/lib/api";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function reorderAllTasks(prev: Task[], activeId: string, overId: string): Task[] {
  if (activeId === overId) return prev;

  const oldIndex = prev.findIndex((task) => task.id === activeId);
  const newIndex = prev.findIndex((task) => task.id === overId);

  if (oldIndex < 0 || newIndex < 0) return prev;
  return arrayMove(prev, oldIndex, newIndex);
}

function SortableAllTaskCard({
  task,
  notesValue,
  onNotesChange,
  onNotesBlur,
}: {
  task: Task;
  notesValue: string;
  onNotesChange: (taskId: string, value: string) => void;
  onNotesBlur: (taskId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-white">{task.title}</p>
          <p className="mt-2 text-xs text-zinc-500">
            {task.category} · {task.priority} priority · {task.month}
          </p>
          <p className="mt-1 text-xs text-emerald-300">Sprint: {task.timeframe}</p>
          {task.projectId ? (
            <p className="mt-1 text-[11px] text-sky-300">Linked project task</p>
          ) : null}
        </div>
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

      <div className="mt-3 flex items-center justify-between gap-3">
        <TaskStatusBadge status={task.status} />
        <span className="text-xs text-zinc-500">View, annotate, reorder</span>
      </div>

      <div className="mt-4">
        <label htmlFor={`notes-${task.id}`} className="mb-1 block text-xs text-zinc-500">
          Notes
        </label>
        <textarea
          id={`notes-${task.id}`}
          value={notesValue}
          onChange={(e) => onNotesChange(task.id, e.target.value)}
          onBlur={() => onNotesBlur(task.id)}
          placeholder="Add notes for this task..."
          className="min-h-20 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500"
        />
      </div>
    </div>
  );
}

export default function DashboardAllTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notesDrafts, setNotesDrafts] = useState<Record<string, string>>({});
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    async function load() {
      try {
        const data = await getTasks();
        setTasks(data);
        const initialDrafts = data.reduce<Record<string, string>>((acc, task) => {
          acc[task.id] = task.notes ?? "";
          return acc;
        }, {});
        setNotesDrafts(initialDrafts);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load tasks";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  async function persistOrder(nextTasks: Task[]) {
    try {
      const saved = await reorderTasks(
        nextTasks.map((task) => ({ id: task.id, status: task.status }))
      );
      setTasks(saved);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to reorder tasks";
      setError(msg);
    }
  }

  function onDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : "";
    if (!overId) return;

    let nextState: Task[] | null = null;
    let changed = false;

    setTasks((prev) => {
      const next = reorderAllTasks(prev, activeId, overId);
      nextState = next;
      changed = next !== prev;
      return next;
    });

    if (changed && nextState) {
      void persistOrder(nextState);
    }
  }

  function onNotesChange(taskId: string, value: string) {
    setNotesDrafts((prev) => ({ ...prev, [taskId]: value }));
  }

  async function onNotesBlur(taskId: string) {
    const draft = notesDrafts[taskId] ?? "";
    const current = tasks.find((task) => task.id === taskId);
    if (!current || (current.notes ?? "") === draft) return;

    try {
      const updated = await updateTask(taskId, { notes: draft });
      setTasks((prev) => prev.map((task) => (task.id === taskId ? updated : task)));
      setNotesDrafts((prev) => ({ ...prev, [taskId]: updated.notes ?? "" }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save notes";
      setError(msg);
    }
  }

  return (
    <DashboardShell
      title="All Tasks"
      description="Use this view to review every task, add notes, and drag cards into your preferred order."
    >
      {error ? (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {loading ? <p className="text-zinc-500">Loading tasks...</p> : null}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300">
              All Tasks
            </h2>
            <span className="text-xs text-zinc-500">{tasks.length}</span>
          </div>

          <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {tasks.map((task) => (
                <SortableAllTaskCard
                  key={task.id}
                  task={task}
                  notesValue={notesDrafts[task.id] ?? ""}
                  onNotesChange={onNotesChange}
                  onNotesBlur={onNotesBlur}
                />
              ))}
              {!loading && tasks.length === 0 ? (
                <p className="text-sm text-zinc-500">No tasks available yet.</p>
              ) : null}
            </div>
          </SortableContext>
        </div>
      </DndContext>
    </DashboardShell>
  );
}
