import { NextResponse } from "next/server";
import { getAuthHeaderFromCookie, toBackendUrl } from "@/app/api/_lib/backend";

export async function GET() {
  const authHeaders = await getAuthHeaderFromCookie();
  const backendRes = await fetch(toBackendUrl("/download-data"), {
    headers: authHeaders,
    cache: "no-store",
  });

  // If backend returned JSON error, forward as JSON
  const contentType = backendRes.headers.get("content-type") || "";
  if (!backendRes.ok && contentType.includes("application/json")) {
    const data = await backendRes.json().catch(() => null);
    return NextResponse.json(data, { status: backendRes.status });
  }

  const headers = new Headers(backendRes.headers);
  headers.set("Cache-Control", "no-store");
  return new NextResponse(backendRes.body, { status: backendRes.status, headers });
}
