"use client";

import DashboardShell from "@/components/dashboard/DashboardShell";
import TaskStatusBadge from "@/components/dashboard/TaskStatusBadge";
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

function monthFromStartDate(startDate: string, fallback: string): string {
  if (!startDate.trim()) return fallback;
  const parsed = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toLocaleString("en-US", { month: "long" });
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

function SortableTaskCard({
  task,
  projectTitle,
  projects,
  notesValue,
  onNotesChange,
  onNotesBlur,
  onPatch,
  onDeleteTask,
}: {
  task: Task;
  projectTitle?: string;
  projects: Project[];
  notesValue: string;
  onNotesChange: (taskId: string, value: string) => void;
  onNotesBlur: (taskId: string) => void;
  onPatch: (taskId: string, patch: Partial<Task>) => Promise<void>;
  onDeleteTask: (taskId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });
  const [editingTitle, setEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(task.title);

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
        <div className="min-w-0 flex-1">
          {editingTitle ? (
            <input
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onBlur={() => {
                const next = draftTitle.trim();
                setEditingTitle(false);
                if (next && next !== task.title) void onPatch(task.id, { title: next });
                else setDraftTitle(task.title);
              }}
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-white"
              autoFocus
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setDraftTitle(task.title);
                setEditingTitle(true);
              }}
              className="text-left font-medium text-white hover:text-sky-300"
            >
              {task.title}
            </button>
          )}
          <p className="mt-1 text-xs text-zinc-500">
            {projectTitle ?? "No project"} · {task.category} · {task.priority} · {task.month}
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

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <select
          value={task.status}
          onChange={(e) => void onPatch(task.id, { status: e.target.value as Task["status"] })}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-300"
        >
          {columns.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select
          value={task.projectId ?? ""}
          onChange={(e) => void onPatch(task.id, { projectId: e.target.value })}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-300"
        >
          <option value="">No project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.title}
            </option>
          ))}
        </select>
        <select
          value={task.timeframe ?? "2 weeks"}
          onChange={(e) =>
            void onPatch(task.id, {
              timeframe: e.target.value as TimeframeOption,
              startDate: task.startDate ?? "",
              endDate: task.endDate ?? "",
            })
          }
          className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-300"
        >
          {TIMEFRAME_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <TaskStatusBadge status={task.status} />
          <button
            type="button"
            onClick={() => onDeleteTask(task.id)}
            className="ml-auto text-xs text-red-400 hover:text-red-300"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="block text-[11px] text-zinc-500">
          Start
          <input
            type="date"
            value={task.startDate ?? ""}
            onChange={(e) => {
              const startDate = e.target.value;
              void onPatch(task.id, {
                startDate,
                month: monthFromStartDate(startDate, task.month),
              });
            }}
            className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200"
          />
        </label>
        <label className="block text-[11px] text-zinc-500">
          End
          <input
            type="date"
            value={task.endDate ?? ""}
            onChange={(e) => void onPatch(task.id, { endDate: e.target.value })}
            className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200"
          />
        </label>
      </div>

      <label htmlFor={`notes-${task.id}`} className="mb-1 mt-3 block text-xs text-zinc-500">
        Notes
      </label>
      <textarea
        id={`notes-${task.id}`}
        value={notesValue}
        onChange={(e) => onNotesChange(task.id, e.target.value)}
        onBlur={() => onNotesBlur(task.id)}
        placeholder="Add notes for this task..."
        className="min-h-16 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500"
      />
    </div>
  );
}

function TaskColumn({
  status,
  items,
  projects,
  projectById,
  notesDrafts,
  onNotesChange,
  onNotesBlur,
  onPatch,
  onDeleteTask,
}: {
  status: Task["status"];
  items: Task[];
  projects: Project[];
  projectById: Map<string, Project>;
  notesDrafts: Record<string, string>;
  onNotesChange: (taskId: string, value: string) => void;
  onNotesBlur: (taskId: string) => void;
  onPatch: (taskId: string, patch: Partial<Task>) => Promise<void>;
  onDeleteTask: (taskId: string) => void;
}) {
  const droppableId = `column:${status}`;
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border bg-zinc-900 p-4 transition-colors ${
        isOver ? "border-sky-500/60" : "border-zinc-800"
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300">{status}</h2>
        <span className="text-xs text-zinc-500">{items.length}</span>
      </div>
      <SortableContext items={items.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div className="min-h-20 space-y-3">
          {items.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              projectTitle={task.projectId ? projectById.get(task.projectId)?.title : undefined}
              projects={projects}
              notesValue={notesDrafts[task.id] ?? ""}
              onNotesChange={onNotesChange}
              onNotesBlur={onNotesBlur}
              onPatch={onPatch}
              onDeleteTask={onDeleteTask}
            />
          ))}
          {items.length === 0 ? <p className="text-xs text-zinc-600">Drop tasks here.</p> : null}
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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
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
        if (projectFilter === "none") return !task.projectId;
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
    try {
      setError("");
      const created = await addTask({
        title: title.trim(),
        status: "planned",
        priority,
        category: category.trim() || "General",
        month: monthFromStartDate(startDate, month.trim() || "Unscheduled"),
        notes: "",
        projectId,
        startDate,
        endDate,
        timeframe,
      });
      setTasks((prev) => [...prev, created]);
      setNotesDrafts((prev) => ({ ...prev, [created.id]: created.notes ?? "" }));
      setTitle("");
      setTimeframe("2 weeks");
      setStartDate("");
      setEndDate("");
      setShowAdd(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to add task";
      setError(msg);
    }
  }

  async function onPatch(taskId: string, patch: Partial<Task>) {
    try {
      const updated = await updateTask(taskId, patch);
      setTasks((prev) => prev.map((task) => (task.id === taskId ? updated : task)));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update task";
      setError(msg);
    }
  }

  async function onDeleteTask(taskId: string) {
    if (!window.confirm("Delete this task?")) return;
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
    <DashboardShell title="Tasks" description="Board or list. Project link is optional.">
      {error ? (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
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
          className="rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-sky-400"
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
              <option value="">No project</option>
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
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setMonth(monthFromStartDate(e.target.value, month));
              }}
              className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-zinc-200"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-zinc-200"
            />
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              className="rounded-xl bg-sky-500 px-4 py-2.5 font-semibold text-white hover:bg-sky-400"
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
            <option value="none">No project</option>
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
                projects={projects}
                projectById={projectById}
                notesDrafts={notesDrafts}
                onNotesChange={onNotesChange}
                onNotesBlur={onNotesBlur}
                onPatch={onPatch}
                onDeleteTask={onDeleteTask}
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
                <SortableTaskCard
                  key={task.id}
                  task={task}
                  projectTitle={task.projectId ? projectById.get(task.projectId)?.title : undefined}
                  projects={projects}
                  notesValue={notesDrafts[task.id] ?? ""}
                  onNotesChange={onNotesChange}
                  onNotesBlur={onNotesBlur}
                  onPatch={onPatch}
                  onDeleteTask={onDeleteTask}
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
