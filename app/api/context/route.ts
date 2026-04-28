import { NextResponse } from "next/server";
import {
  getAuthHeaderFromCookie,
  safeBackendJson,
  toBackendUrl,
} from "@/app/api/_lib/backend";

export async function GET() {
  const authHeaders = await getAuthHeaderFromCookie();
  const backendRes = await fetch(toBackendUrl("/context"), {
    headers: authHeaders,
    cache: "no-store",
  });
  const data = await safeBackendJson(backendRes);
  return NextResponse.json(data, { status: backendRes.status });
}

export async function PUT(req: Request) {
  const authHeaders = await getAuthHeaderFromCookie();
  const body = await req.text();
  const backendRes = await fetch(toBackendUrl("/context"), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body,
    cache: "no-store",
  });

  const data = await safeBackendJson(backendRes);
  return NextResponse.json(data, { status: backendRes.status });
}
