import { buildPortfolioContextSummary } from "@/lib/portfolio-context";
import { buildRepositoryContextSummary } from "@/lib/repo-context";
import { cookies } from "next/headers";
import { getAuthHeaderFromCookie, toBackendUrl } from "@/app/api/_lib/backend";

export const SYSTEM_PROMPT = `You are a focused portfolio planning assistant for a developer's private admin dashboard.
You help break projects into tasks, prioritise work, plan roadmaps, and give concise actionable advice.
Keep replies short and practical — bullet points where helpful, no unnecessary fluff.`;

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function requireDashboardAuth(): Promise<boolean> {
  const password = process.env.DASHBOARD_PASSWORD;
  if (!password) return true;

  const store = await cookies();
  const token = store.get("token")?.value;
  if (!token) return false;

  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const expected = Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");

  return token === expected;
}

export async function buildAssistantContext(): Promise<string> {
  const authHeaders = await getAuthHeaderFromCookie();

  const [contextRes, projectsRes, tasksRes] = await Promise.all([
    fetch(toBackendUrl("/context"), { headers: authHeaders, cache: "no-store" }),
    fetch(toBackendUrl("/projects"), { headers: authHeaders, cache: "no-store" }),
    fetch(toBackendUrl("/tasks"), { headers: authHeaders, cache: "no-store" }),
  ]);

  const contextData = await contextRes.json().catch(() => null);
  const projectsData = await projectsRes.json().catch(() => null);
  const tasksData = await tasksRes.json().catch(() => null);

  const contextText =
    typeof contextData === "object" && contextData && "content" in contextData
      ? String((contextData as { content?: unknown }).content ?? "")
      : "";

  const projects = Array.isArray(projectsData)
    ? projectsData
    : Array.isArray((projectsData as { projects?: unknown })?.projects)
      ? ((projectsData as { projects?: unknown }).projects as unknown[])
      : [];

  const tasks = Array.isArray(tasksData)
    ? tasksData
    : Array.isArray((tasksData as { tasks?: unknown })?.tasks)
      ? ((tasksData as { tasks?: unknown }).tasks as unknown[])
      : [];

  const portfolioContext = buildPortfolioContextSummary({
    contextText,
    projects,
    tasks,
  });
  const repositoryContext = await buildRepositoryContextSummary({
    rootDir: process.cwd(),
    maxFiles: 20,
    maxCharsPerFile: 12000,
  });

  return `${SYSTEM_PROMPT}\n\n${portfolioContext}\n\n${repositoryContext}`;
}
