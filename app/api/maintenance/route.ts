import { NextResponse } from "next/server";
import {
  getAuthHeaderFromCookie,
  safeBackendJson,
  toBackendUrl,
} from "@/app/api/_lib/backend";

export async function GET() {
  const backendRes = await fetch(toBackendUrl("/maintenance"), {
    cache: "no-store",
  });

  const data = await safeBackendJson(backendRes);
  return NextResponse.json(data, { status: backendRes.status });
}

export async function PUT(req: Request) {
  const body = await req.text();
  const backendRes = await fetch(toBackendUrl("/maintenance"), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaderFromCookie(),
    },
    body,
    cache: "no-store",
  });

  const data = await safeBackendJson(backendRes);
  return NextResponse.json(data, { status: backendRes.status });
}
