"use client";

import DashboardShell from "@/components/dashboard/DashboardShell";
import TaskStatusBadge from "@/components/dashboard/TaskStatusBadge";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  addTask,
  deleteTask,
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
  useDroppable,
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

const columns: Array<Task["status"]> = ["idea", "planned", "in progress", "done"];

function isColumnId(value: string): boolean {
  return value.startsWith("column:");
}

function columnFromId(value: string): Task["status"] | null {
  if (!isColumnId(value)) return null;
  const status = value.replace("column:", "") as Task["status"];
  return columns.includes(status) ? status : null;
}

function reorderTaskList(prev: Task[], activeId: string, overId: string): Task[] {
  if (activeId === overId) return prev;

  const activeIndex = prev.findIndex((task) => task.id === activeId);
  if (activeIndex < 0) return prev;

  const activeTask = prev[activeIndex];
  const overTask = prev.find((task) => task.id === overId);
  const targetStatus = overTask?.status ?? columnFromId(overId);
  if (!targetStatus) return prev;

  if (targetStatus === activeTask.status) {
    if (!overTask) return prev;

    const sameStatusIds = prev
      .filter((task) => task.status === activeTask.status)
      .map((task) => task.id);
    const from = sameStatusIds.indexOf(activeTask.id);
    const to = sameStatusIds.indexOf(overTask.id);
    if (from < 0 || to < 0 || from === to) return prev;

    const movedIds = arrayMove(sameStatusIds, from, to);
    const movedMap = new Map(prev.map((task) => [task.id, task]));
    const reordered = movedIds
      .map((id) => movedMap.get(id))
      .filter((task): task is Task => Boolean(task));

    let cursor = 0;
    return prev.map((task) => {
      if (task.status !== activeTask.status) return task;
      const next = reordered[cursor];
      cursor += 1;
      return next;
    });
  }

  const next = prev.map((task) => ({ ...task }));
  const [moved] = next.splice(activeIndex, 1);
  moved.status = targetStatus;

  const overIndexInNext = overTask ? next.findIndex((task) => task.id === overTask.id) : -1;
  if (overIndexInNext >= 0) {
    next.splice(overIndexInNext, 0, moved);
    return next;
  }

  const lastInColumn = next.reduce((idx, task, index) => {
    if (task.status === targetStatus) return index;
    return idx;
  }, -1);

  if (lastInColumn >= 0) {
    next.splice(lastInColumn + 1, 0, moved);
  } else {
    next.push(moved);
  }

  return next;
}

function SortableTaskCard({
  task,
  onMoveTask,
  onDeleteTask,
}: {
  task: Task;
  onMoveTask: (taskId: string, status: Task["status"]) => void;
  onDeleteTask: (taskId: string) => void;
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
      <p className="mt-2 text-xs text-zinc-500">
        {task.category} · {task.priority} priority · {task.month}
      </p>
      {task.projectId ? (
        <p className="mt-1 text-[11px] text-sky-300">Linked project task</p>
      ) : null}
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
  );
}

function TaskColumn({
  status,
  items,
  onMoveTask,
  onDeleteTask,
}: {
  status: Task["status"];
  items: Task[];
  onMoveTask: (taskId: string, status: Task["status"]) => void;
  onDeleteTask: (taskId: string) => void;
}) {
  const droppableId = `column:${status}`;
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });

  return (
    <div
      ref={setNodeRef}
      key={status}
      className={`rounded-2xl border bg-zinc-900 p-4 transition-colors ${
        isOver ? "border-sky-500/60" : "border-zinc-800"
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300">{status}</h2>
        <span className="text-xs text-zinc-500">{items.length}</span>
      </div>

      <SortableContext items={items.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 min-h-20">
          {items.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onMoveTask={onMoveTask}
              onDeleteTask={onDeleteTask}
            />
          ))}
          {items.length === 0 ? (
            <p className="text-xs text-zinc-600">Drop tasks here.</p>
          ) : null}
        </div>
      </SortableContext>
    </div>
  );
}

export default function DashboardTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const tasksByColumn = useMemo(() => {
    return columns.reduce(
      (acc, status) => {
        acc[status] = tasks.filter((task) => task.status === status);
        return acc;
      },
      {
        idea: [] as Task[],
        planned: [] as Task[],
        "in progress": [] as Task[],
        done: [] as Task[],
      }
    );
  }, [tasks]);

  async function persistTaskOrder(nextTasks: Task[]) {
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
      setTasks((prev) => [...prev, created]);
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

  function onDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : "";
    if (!overId) return;

    let nextState: Task[] | null = null;
    let changed = false;

    setTasks((prev) => {
      const next = reorderTaskList(prev, activeId, overId);
      nextState = next;
      changed = next !== prev;
      return next;
    });

    if (changed && nextState) {
      void persistTaskOrder(nextState);
    }
  }

  return (
    <DashboardShell
      title="Task Manager"
      description="Projects under 100% are auto-added to tasks. Drag task cards to reorder your priority."
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

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
          {columns.map((status) => (
            <TaskColumn
              key={status}
              status={status}
              items={tasksByColumn[status]}
              onMoveTask={onMoveTask}
              onDeleteTask={onDeleteTask}
            />
          ))}
        </div>
      </DndContext>
    </DashboardShell>
  );
}
