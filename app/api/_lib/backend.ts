import { cookies } from "next/headers";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";

export function toBackendUrl(path: string): string {
  return `${BACKEND_API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function getAuthHeaderFromCookie(): Promise<Record<string, string>> {
  const store = await cookies();
  const token = store.get("token")?.value;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function safeBackendJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
