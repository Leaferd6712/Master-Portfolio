import { NextResponse } from "next/server";
import {
  getAuthHeaderFromCookie,
  safeBackendJson,
  toBackendUrl,
} from "@/app/api/_lib/backend";

export async function GET() {
  try {
    const res = await fetch(toBackendUrl("/maintenance"), { cache: "no-store" });
    const data = await safeBackendJson(res);
    return NextResponse.json(data ?? { enabled: false });
  } catch {
    return NextResponse.json({ enabled: false });
  }
}

export async function POST(req: Request) {
  const authHeaders = getAuthHeaderFromCookie();
  if (!authHeaders.Authorization) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (body === null || typeof body.enabled !== "boolean") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const backendRes = await fetch(toBackendUrl("/maintenance"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify({ enabled: body.enabled }),
    cache: "no-store",
  });

  const data = await safeBackendJson(backendRes);
  if (!backendRes.ok) {
    return NextResponse.json(
      { error: (data as { detail?: string })?.detail ?? "Failed to update" },
      { status: backendRes.status }
    );
  }

  return NextResponse.json(data);
}
