import { NextResponse } from "next/server";
import { ngrokHeader, toBackendUrl } from "@/app/api/_lib/backend";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const backendRes = await fetch(toBackendUrl(`/images/${encodeURIComponent(filename)}`), {
    headers: { ...ngrokHeader() },
    cache: "no-store",
  });

  if (!backendRes.ok) {
    return NextResponse.json({ error: "Image not found" }, { status: backendRes.status });
  }

  const buffer = await backendRes.arrayBuffer();
  const contentType = backendRes.headers.get("content-type") ?? "application/octet-stream";
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
