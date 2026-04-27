import { NextResponse } from "next/server";
import {
  getAuthHeaderFromCookie,
  safeBackendJson,
  toBackendUrl,
} from "@/app/api/_lib/backend";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.text();
  const backendRes = await fetch(toBackendUrl(`/projects/${params.id}`), {
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

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const backendRes = await fetch(toBackendUrl(`/projects/${params.id}`), {
    method: "DELETE",
    headers: {
      ...getAuthHeaderFromCookie(),
    },
    cache: "no-store",
  });

  const data = await safeBackendJson(backendRes);
  return NextResponse.json(data, { status: backendRes.status });
}
