"use client";

import DashboardShell from "@/components/dashboard/DashboardShell";
import TaskStatusBadge from "@/components/dashboard/TaskStatusBadge";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  addTask,
  deleteTask,
  getProjects,
  getTasks,
  Project,
  reorderTasks,
  Task,
  type TimeframeOption,
  updateTask,
} from "@/lib/api";
import { TIMEFRAME_OPTIONS } from "@/lib/site-config";
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

function reorderAllTasks(prev: Task[], activeId: string, overId: string): Task[] {
  if (activeId === overId) return prev;

  const oldIndex = prev.findIndex((task) => task.id === activeId);
  const newIndex = prev.findIndex((task) => task.id === overId);

  if (oldIndex < 0 || newIndex < 0) return prev;
  return arrayMove(prev, oldIndex, newIndex);
}

function SortableListTaskCard({
  task,
  projectTitle,
  notesValue,
  onNotesChange,
  onNotesBlur,
}: {
  task: Task;
  projectTitle?: string;
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
        <div className="min-w-0">
          <p className="font-medium text-white">{task.title}</p>
          <p className="mt-1 text-xs text-zinc-500">
            {projectTitle ?? "Unlinked"} · {task.priority} · {task.timeframe}
          </p>
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
      <div className="mt-3">
        <TaskStatusBadge status={task.status} />
      </div>
      <textarea
        value={notesValue}
        onChange={(e) => onNotesChange(task.id, e.target.value)}
        onBlur={() => onNotesBlur(task.id)}
        placeholder="Notes"
        className="mt-3 min-h-16 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500"
      />
    </div>
  );
}

function SortableTaskCard({
  task,
  onMoveTask,
  onDeleteTask,
  onUpdateTimeframe,
}: {
  task: Task;
  onMoveTask: (taskId: string, status: Task["status"]) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateTimeframe: (taskId: string, timeframe: TimeframeOption) => Promise<void>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const [editingTimeframe, setEditingTimeframe] = useState(false);
  const [draftTimeframe, setDraftTimeframe] = useState<TimeframeOption>(task.timeframe ?? "2 weeks");
  const [savingTimeframe, setSavingTimeframe] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  async function handleSaveTimeframe() {
    setSavingTimeframe(true);
    await onUpdateTimeframe(task.id, draftTimeframe);
    setSavingTimeframe(false);
    setEditingTimeframe(false);
  }

  function handleCancelTimeframe() {
    setDraftTimeframe(task.timeframe ?? "2 weeks");
    setEditingTimeframe(false);
  }

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
      <p className="mt-1 text-[11px] text-sky-300">Project: {task.projectId}</p>

      {/* Timeframe row */}
      {editingTimeframe ? (
        <div className="mt-2 space-y-2">
          <div className="flex items-center gap-2">
            <label className="w-20 shrink-0 text-[11px] text-zinc-400">Sprint</label>
            <select
              value={draftTimeframe}
              onChange={(e) => setDraftTimeframe(e.target.value as TimeframeOption)}
              className="flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200"
            >
              {TIMEFRAME_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveTimeframe}
              disabled={savingTimeframe}
              className="rounded-md bg-sky-600 px-3 py-1 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-50 transition-colors"
            >
              {savingTimeframe ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={handleCancelTimeframe}
              className="rounded-md border border-zinc-700 px-3 py-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-1 flex items-center gap-2">
          <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
            {task.timeframe ?? "2 weeks"}
          </span>
          <button
            type="button"
            onClick={() => setEditingTimeframe(true)}
            className="text-[11px] text-zinc-500 hover:text-sky-400 transition-colors underline underline-offset-2"
          >
            Edit sprint
          </button>
        </div>
      )}

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
  onUpdateTimeframe,
}: {
  status: Task["status"];
  items: Task[];
  onMoveTask: (taskId: string, status: Task["status"]) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateTimeframe: (taskId: string, timeframe: TimeframeOption) => Promise<void>;
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
              onUpdateTimeframe={onUpdateTimeframe}
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [category, setCategory] = useState("General");
  const [month, setMonth] = useState(new Date().toLocaleString("en-US", { month: "long" }));
  const [timeframe, setTimeframe] = useState<TimeframeOption>("2 weeks");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"board" | "list">("board");
  const [showAdd, setShowAdd] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | Task["status"]>("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [notesDrafts, setNotesDrafts] = useState<Record<string, string>>({});
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

  const projectById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects]
  );

  const filteredListTasks = useMemo(
    () =>
      tasks.filter((task) => {
        if (statusFilter !== "all" && task.status !== statusFilter) return false;
        if (projectFilter !== "all" && task.projectId !== projectFilter) return false;
        return true;
      }),
    [tasks, statusFilter, projectFilter]
  );

  function setViewAndUrl(next: "board" | "list") {
    setView(next);
    const url = next === "list" ? "/dashboard/tasks?view=list" : "/dashboard/tasks";
    window.history.replaceState(null, "", url);
  }

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
        const [taskData, projectData] = await Promise.all([getTasks(), getProjects()]);
        setTasks(taskData);
        setProjects(projectData);
        setNotesDrafts(
          taskData.reduce<Record<string, string>>((acc, task) => {
            acc[task.id] = task.notes ?? "";
            return acc;
          }, {})
        );
        if (projectData.length > 0) {
          setProjectId(projectData[0].id);
          setCategory(projectData[0].category || "General");
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load tasks";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("view") === "list") {
      setView("list");
    }
  }, []);

  async function onCreateTask(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Task title is required");
      return;
    }
    if (!projectId) {
      setError("Create a project first before adding tasks");
      return;
    }
    try {
      setError("");
      const created = await addTask({
        title: title.trim(),
        status: "planned",
        priority,
        category: category.trim() || "General",
        month: month.trim() || "Unscheduled",
        notes: "",
        projectId,
        startDate: "",
        endDate: "",
        timeframe,
      });
      setTasks((prev) => [...prev, created]);
      setNotesDrafts((prev) => ({ ...prev, [created.id]: created.notes ?? "" }));
      setTitle("");
      setTimeframe("2 weeks");
      setShowAdd(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to add task";
      setError(msg);
    }
  }

  async function onUpdateTimeframe(taskId: string, timeframe: TimeframeOption) {
    try {
      const updated = await updateTask(taskId, { timeframe, startDate: "", endDate: "" });
      setTasks((prev) => prev.map((task) => (task.id === taskId ? updated : task)));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update timeframe";
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

  function onDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : "";
    if (!overId) return;

    let nextState: Task[] | null = null;
    let changed = false;

    setTasks((prev) => {
      const next =
        view === "list"
          ? reorderAllTasks(prev, activeId, overId)
          : reorderTaskList(prev, activeId, overId);
      nextState = next;
      changed = next !== prev;
      return next;
    });

    if (changed && nextState) {
      void persistTaskOrder(nextState);
    }
  }

  return (
    <DashboardShell title="Tasks" description="Board or list. Linked to a project.">
      {error ? (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {projects.length === 0 ? (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          <p className="font-medium">Create a project before adding tasks.</p>
          <Link
            href="/dashboard/projects"
            className="mt-2 inline-flex text-xs font-semibold text-amber-100 underline underline-offset-2"
          >
            Go to Projects
          </Link>
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-900 p-1">
          <button
            type="button"
            onClick={() => setViewAndUrl("board")}
            className={`rounded-md px-3 py-1.5 text-sm ${
              view === "board" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            Board
          </button>
          <button
            type="button"
            onClick={() => setViewAndUrl("list")}
            className={`rounded-md px-3 py-1.5 text-sm ${
              view === "list" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            List
          </button>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd((prev) => !prev)}
          disabled={projects.length === 0}
          className="rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-sky-400 disabled:opacity-50"
        >
          {showAdd ? "Cancel" : "Add task"}
        </button>
      </div>

      {showAdd ? (
        <form
          onSubmit={onCreateTask}
          className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-4"
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-white placeholder:text-zinc-500"
            />
            <select
              value={projectId}
              onChange={(e) => {
                const nextId = e.target.value;
                setProjectId(nextId);
                const selectedProject = projects.find((project) => project.id === nextId);
                if (selectedProject?.category) setCategory(selectedProject.category);
              }}
              className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-zinc-200"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Task["priority"])}
              className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-zinc-200"
            >
              <option value="high">High priority</option>
              <option value="medium">Medium priority</option>
              <option value="low">Low priority</option>
            </select>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Category"
              className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-zinc-200"
            />
            <input
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              placeholder="Month"
              className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-zinc-200"
            />
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as TimeframeOption)}
              className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-zinc-200"
            >
              {TIMEFRAME_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={projects.length === 0}
              className="rounded-xl bg-sky-500 px-4 py-2.5 font-semibold text-white hover:bg-sky-400 disabled:opacity-50"
            >
              Add to Planned
            </button>
          </div>
        </form>
      ) : null}

      {loading ? <p className="text-zinc-500">Loading tasks...</p> : null}

      {view === "list" ? (
        <div className="mb-4 flex flex-wrap gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | Task["status"])}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200"
          >
            <option value="all">All statuses</option>
            {columns.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200"
          >
            <option value="all">All projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        {view === "board" ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
            {columns.map((status) => (
              <TaskColumn
                key={status}
                status={status}
                items={tasksByColumn[status]}
                onMoveTask={onMoveTask}
                onDeleteTask={onDeleteTask}
                onUpdateTimeframe={onUpdateTimeframe}
              />
            ))}
          </div>
        ) : (
          <SortableContext
            items={filteredListTasks.map((task) => task.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {filteredListTasks.map((task) => (
                <SortableListTaskCard
                  key={task.id}
                  task={task}
                  projectTitle={projectById.get(task.projectId)?.title}
                  notesValue={notesDrafts[task.id] ?? ""}
                  onNotesChange={onNotesChange}
                  onNotesBlur={onNotesBlur}
                />
              ))}
              {!loading && filteredListTasks.length === 0 ? (
                <p className="text-sm text-zinc-500">No tasks match these filters.</p>
              ) : null}
            </div>
          </SortableContext>
        )}
      </DndContext>
    </DashboardShell>
  );
}
