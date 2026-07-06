import { NextResponse } from "next/server";
import {
  getAuthHeaderFromCookie,
  safeBackendJson,
  toBackendUrl,
} from "@/app/api/_lib/backend";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeaders = await getAuthHeaderFromCookie();
  const { id } = await params;
  const body = await req.text();
  const backendRes = await fetch(toBackendUrl(`/projects/${id}`), {
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

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeaders = await getAuthHeaderFromCookie();
  const { id } = await params;
  const backendRes = await fetch(toBackendUrl(`/projects/${id}`), {
    method: "DELETE",
    headers: {
      ...authHeaders,
    },
    cache: "no-store",
  });

  const data = await safeBackendJson(backendRes);
  return NextResponse.json(data, { status: backendRes.status });
}
