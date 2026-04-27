"use client";

import { useRouter } from "next/navigation";
import { logout } from "@/lib/api";

export default function LogoutButton() {
  const router = useRouter();

  async function onLogout() {
    await logout();
    router.replace("/dashboard/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      className="w-full rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors"
    >
      Logout
    </button>
  );
}
