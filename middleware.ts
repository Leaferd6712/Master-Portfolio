import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DASHBOARD_LOGIN = "/dashboard/login";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Dashboard auth
  if (pathname.startsWith("/dashboard")) {
    if (pathname === DASHBOARD_LOGIN) {
      const res = NextResponse.next();
      res.headers.set("x-pathname", pathname);
      return res;
    }

    const token = req.cookies.get("token")?.value;
    if (!token) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = DASHBOARD_LOGIN;
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Pass the pathname to server components so the root layout can read it
  const res = NextResponse.next();
  res.headers.set("x-pathname", pathname);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
