import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { cookies, headers } from "next/headers";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mathias — Portfolio",
  description:
    "Personal portfolio and project hub. Robotics, AI, coding, and more.",
};

async function getMaintenanceEnabled(): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_API_URL}/maintenance`, {
      cache: "no-store",
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { enabled?: boolean };
    return Boolean(data?.enabled);
  } catch {
    return false;
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const token = cookies().get("token")?.value;

  // Never apply maintenance to authenticated admins or the dashboard itself
  const isAdmin = Boolean(token);
  const isDashboard = pathname.startsWith("/dashboard");
  const isApiRoute = pathname.startsWith("/api");

  const maintenanceEnabled =
    !isAdmin && !isDashboard && !isApiRoute
      ? await getMaintenanceEnabled()
      : false;

  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${inter.className} bg-zinc-950 text-white antialiased`}
      >
        {maintenanceEnabled ? (
          <main className="min-h-screen flex items-center justify-center px-6">
            <div className="text-center">
              <div className="mb-6 text-6xl">🔧</div>
              <h1 className="text-4xl font-bold text-white mb-4">
                Website is currently down
              </h1>
              <p className="text-zinc-400 text-lg">Come back later.</p>
            </div>
          </main>
        ) : (
          <>
            <Navbar />
            <main className="min-h-screen">{children}</main>
            <Footer />
          </>
        )}
      </body>
    </html>
  );
}
