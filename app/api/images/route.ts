import { NextResponse } from "next/server";
import { getAuthHeaderFromCookie, toBackendUrl } from "@/app/api/_lib/backend";

export async function POST(req: Request) {
  const authHeaders = await getAuthHeaderFromCookie();
  const form = await req.formData();
  const backendRes = await fetch(toBackendUrl("/images"), {
    method: "POST",
    headers: { ...authHeaders },
    body: form,
    cache: "no-store",
  });

  const data = await backendRes.json().catch(() => null);
  return NextResponse.json(data, { status: backendRes.status });
}
