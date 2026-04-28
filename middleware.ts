import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DASHBOARD_LOGIN = "/dashboard/login";
const MAINTENANCE_PAGE = "/maintenance";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";

async function isMaintenanceEnabled(): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_API_URL}/maintenance`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return false;
    }

    const data = (await res.json()) as { enabled?: boolean };
    return Boolean(data.enabled);
  } catch {
    // Fail open so the portfolio remains reachable if the backend is temporarily unavailable.
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("token")?.value;

  if (pathname.startsWith("/dashboard")) {
    if (pathname === DASHBOARD_LOGIN) {
      return NextResponse.next();
    }

    if (!token) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = DASHBOARD_LOGIN;
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  if (token) {
    if (pathname === MAINTENANCE_PAGE) {
      const homeUrl = req.nextUrl.clone();
      homeUrl.pathname = "/";
      homeUrl.search = "";
      return NextResponse.redirect(homeUrl);
    }
    return NextResponse.next();
  }

  const maintenanceEnabled = await isMaintenanceEnabled();
  if (!maintenanceEnabled) {
    if (pathname === MAINTENANCE_PAGE) {
      const homeUrl = req.nextUrl.clone();
      homeUrl.pathname = "/";
      homeUrl.search = "";
      return NextResponse.redirect(homeUrl);
    }
    return NextResponse.next();
  }

  if (pathname !== MAINTENANCE_PAGE) {
    const maintenanceUrl = req.nextUrl.clone();
    maintenanceUrl.pathname = MAINTENANCE_PAGE;
    maintenanceUrl.search = "";
    return NextResponse.redirect(maintenanceUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
