"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}`+"/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout} aria-label="Sair da conta">
      <LogOut className="size-4" aria-hidden />
      <span className="hidden sm:inline">Sair</span>
    </Button>
  );
}
