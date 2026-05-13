import { NextResponse } from "next/server";
import {
  getAuthHeaderFromCookie,
  safeBackendJson,
  toBackendUrl,
} from "@/app/api/_lib/backend";

export async function PUT(req: Request) {
  const authHeaders = await getAuthHeaderFromCookie();
  const body = await req.text();
  const backendRes = await fetch(toBackendUrl("/tasks/reorder"), {
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
