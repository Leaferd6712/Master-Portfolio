import { NextResponse } from "next/server";
import {
  getAuthHeaderFromCookie,
  safeBackendJson,
  toBackendUrl,
} from "@/app/api/_lib/backend";

export async function POST(req: Request) {
  const body = await req.text();
  const backendRes = await fetch(toBackendUrl("/ai/chat"), {
    method: "POST",
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
