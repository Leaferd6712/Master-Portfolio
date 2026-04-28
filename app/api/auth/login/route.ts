import { NextResponse } from "next/server";
import { safeBackendJson, toBackendUrl } from "@/app/api/_lib/backend";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  if (!body?.password || typeof body.password !== "string") {
    return NextResponse.json({ error: "Password is required" }, { status: 400 });
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(toBackendUrl("/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: body.password }),
      cache: "no-store",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Cannot reach backend: ${msg}. Check BACKEND_API_URL on Vercel.` },
      { status: 502 }
    );
  }

  const data = (await safeBackendJson(backendRes)) as
    | { token?: string; detail?: string }
    | null;

  if (!backendRes.ok || !data?.token) {
    return NextResponse.json(
      { error: data?.detail ?? "Invalid password" },
      { status: backendRes.status || 401 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("token", data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return res;
}
