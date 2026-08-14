/**
 * lib/api.ts
 *
 * Central frontend API helper.
 *
 * All requests go to local Next.js route handlers in /app/api/*.
 * Those handlers proxy to FastAPI and attach auth from httpOnly cookies.
 */

import type { Project, ProjectLink } from "@/components/ProjectCard";
import { cloneDefaultSiteTabs } from "@/lib/site-config";

// ── Types ─────────────────────────────────────────────────────────────────────

export type { Project, ProjectLink };

export interface Task {
  id: string;
  title: string;
  status: "idea" | "planned" | "in progress" | "done";
  priority: "high" | "medium" | "low";
  category: string;
  month: string;
  notes: string;
  projectId: string;
  startDate?: string;
  endDate?: string;
  timeframe: TimeframeOption;
}

export interface ReorderTaskPayload {
  id: string;
  status?: Task["status"];
}

export interface MaintenanceMode {
  enabled: boolean;
  message: string;
}

export interface SiteTab {
  label: string;
  href: string;
  icon: string;
  desc: string;
  showInNav: boolean;
  showInInterests: boolean;
  children?: SiteTab[];
}

export interface SiteSettings {
  tabs: SiteTab[];
}

export interface DashboardState {
  currentFocus: string;
}

export type TimeframeOption = "1 week" | "2 weeks" | "3 weeks" | "4 weeks";

export interface NoteEntry {
  id: string;
  title: string;
  projectId: string;
  summary: string;
  content: string;
  tags: string[];
  published: boolean;
  updatedAt: string;
}

async function readJson<T>(res: Response): Promise<T> {
  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const error =
      typeof payload === "object" && payload !== null
        ? (payload as { error?: string; detail?: string })
        : {};
    throw new Error(error.error ?? error.detail ?? "Request failed");
  }

  return payload as T;
}

function normalizeProjectPayload(payload: unknown): Project[] {
  if (Array.isArray(payload)) return payload as Project[];
  if (payload && typeof payload === "object") {
    const candidate = payload as { projects?: unknown; items?: unknown; data?: unknown };
    if (Array.isArray(candidate.projects)) return candidate.projects as Project[];
    if (Array.isArray(candidate.items)) return candidate.items as Project[];
    if (Array.isArray(candidate.data)) return candidate.data as Project[];
  }
  return [];
}

async function tryFetchJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ── Auth ───────────────────────────────────────────────────────────────────────

export async function login(password: string): Promise<void> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });

  await readJson<{ ok: boolean }>(res);
}

export async function logout(): Promise<void> {
  const res = await fetch("/api/auth/logout", { method: "POST" });
  await readJson<{ ok: boolean }>(res);
}

// ── Projects ──────────────────────────────────────────────────────────────────

export async function getProjects(): Promise<Project[]> {
  // Keep public pages resilient across local proxy, Next API route, and deployment setups.
  const sources = ["/api/projects", "/backend/projects"];
  for (const url of sources) {
    const payload = await tryFetchJson(url);
    if (!payload) continue;
    const projects = normalizeProjectPayload(payload);
    if (projects.length > 0 || Array.isArray(payload)) {
      return projects;
    }
  }
  return [];
}

export async function addProject(data: Omit<Project, "id">): Promise<Project> {
  const res = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return readJson<Project>(res);
}

export async function updateProject(
  id: string,
  data: Partial<Project>
): Promise<Project> {
  const res = await fetch(`/api/projects/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return readJson<Project>(res);
}

export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`/api/projects/${id}`, {
    method: "DELETE",
  });
  await readJson<Record<string, string>>(res);
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export async function getTasks(): Promise<Task[]> {
  const res = await fetch("/api/tasks", { cache: "no-store" });
  return readJson<Task[]>(res);
}

export async function addTask(data: Omit<Task, "id">): Promise<Task> {
  const res = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return readJson<Task>(res);
}

export async function updateTask(
  id: string,
  data: Partial<Task>
): Promise<Task> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return readJson<Task>(res);
}

export async function deleteTask(id: string): Promise<void> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: "DELETE",
  });
  await readJson<Record<string, string>>(res);
}

export async function reorderTasks(payload: ReorderTaskPayload[]): Promise<Task[]> {
  const res = await fetch("/api/tasks/reorder", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tasks: payload }),
  });
  return readJson<Task[]>(res);
}

// ── Context.md ────────────────────────────────────────────────────────────────

export async function getContext(): Promise<string> {
  const res = await fetch("/api/context", { cache: "no-store" });
  const data = await readJson<{ content: string }>(res);
  return data.content as string;
}

export async function saveContext(content: string): Promise<void> {
  const res = await fetch("/api/context", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  await readJson<Record<string, string>>(res);
}

// ── Roadmap Notes ────────────────────────────────────────────────────────────

export async function getRoadmap(): Promise<string> {
  const res = await fetch("/api/roadmap", { cache: "no-store" });
  const data = await readJson<{ content: string }>(res);
  return data.content as string;
}

export async function saveRoadmap(
  content: string
): Promise<{ githubSynced: boolean; githubSyncEnabled: boolean }> {
  const res = await fetch("/api/roadmap", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  const data = await readJson<{
    ok: string;
    githubSynced?: boolean;
    githubSyncEnabled?: boolean;
  }>(res);

  return {
    githubSynced: Boolean(data.githubSynced),
    githubSyncEnabled: Boolean(data.githubSyncEnabled),
  };
}

// ── AI Chat ───────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function sendChatMessage(
  message: string,
  history: ChatMessage[] = []
): Promise<{ reply: string }> {
  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });
  return readJson<{ reply: string }>(res);
}

export async function sendGeminiChatMessage(
  message: string,
  history: ChatMessage[] = [],
  apiKey = ""
): Promise<{ reply: string }> {
  const res = await fetch("/api/ai/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history, apiKey }),
  });
  return readJson<{ reply: string }>(res);
}

// ── Maintenance ──────────────────────────────────────────────────────────────

export async function getMaintenanceMode(): Promise<MaintenanceMode> {
  const res = await fetch("/api/maintenance", { cache: "no-store" });
  return readJson<MaintenanceMode>(res);
}

export async function updateMaintenanceMode(
  enabled: boolean,
  message = "Website is currently down. Please come back later."
): Promise<MaintenanceMode> {
  const res = await fetch("/api/maintenance", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled, message }),
  });
  return readJson<MaintenanceMode>(res);
}

// Site tabs

export async function getSiteSettings(): Promise<SiteSettings> {
  const sources = ["/api/site-settings", "/backend/site-settings"];
  for (const url of sources) {
    const payload = await tryFetchJson(url);
    if (!payload || typeof payload !== "object") continue;
    const candidate = payload as Partial<SiteSettings>;
    if (Array.isArray(candidate.tabs)) {
      return { tabs: candidate.tabs };
    }
  }
  return { tabs: cloneDefaultSiteTabs() };
}

export async function updateSiteSettings(
  settings: SiteSettings
): Promise<SiteSettings> {
  const res = await fetch("/api/site-settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  return readJson<SiteSettings>(res);
}

// Notes

export async function getNotes(): Promise<NoteEntry[]> {
  const res = await fetch("/api/notes", { cache: "no-store" });
  return readJson<NoteEntry[]>(res);
}

export async function updateNotes(notes: NoteEntry[]): Promise<NoteEntry[]> {
  const res = await fetch("/api/notes", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notes }),
  });
  return readJson<NoteEntry[]>(res);
}

export async function getDashboardState(): Promise<DashboardState> {
  const res = await fetch("/api/dashboard-state", { cache: "no-store" });
  return readJson<DashboardState>(res);
}

export async function updateDashboardState(
  state: DashboardState
): Promise<DashboardState> {
  const res = await fetch("/api/dashboard-state", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state),
  });
  return readJson<DashboardState>(res);
}

export async function uploadProjectImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/images", { method: "POST", body: form });
  const data = await readJson<{ url: string }>(res);
  return data.url;
}
