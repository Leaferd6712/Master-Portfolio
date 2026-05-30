import { cookies } from "next/headers";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

const NGROK_SKIP =
  process.env.NGROK_SKIP_BROWSER_WARNING === "1" ||
  process.env.NGROK_SKIP_BROWSER_WARNING === "true";

export function ngrokHeader(): Record<string, string> {
  return NGROK_SKIP ? { "ngrok-skip-browser-warning": "1" } : {};
}

export function toBackendUrl(path: string): string {
  return `${BACKEND_API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function getAuthHeaderFromCookie(): Promise<Record<string, string>> {
  const store = await cookies();
  const token = store.get("token")?.value;
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  // Add ngrok skip header when enabled (useful for dev tunnels)
  if (NGROK_SKIP) {
    headers["ngrok-skip-browser-warning"] = "1";
  }
  return headers;
}

export async function safeBackendJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
