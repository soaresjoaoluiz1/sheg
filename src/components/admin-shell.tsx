"use client";

import { useState } from "react";
import { Menu, Package, X } from "lucide-react";
import { AdminSidebar } from "@/components/admin-sidebar";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { CommandPalette } from "@/components/command-palette";
import { InstallPrompt } from "@/components/install-prompt";
import { Button } from "@/components/ui/button";

export function AdminShell({
  children,
  condoName,
  userEmail,
  isMaster,
}: {
  children: React.ReactNode;
  condoName: string | null;
  userEmail: string;
  isMaster?: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col relative" data-condo-name={condoName ?? ""}>
      <div className="glow-sphere w-[600px] h-[600px] -top-[200px] -left-[200px] opacity-40" aria-hidden />
      <div className="glow-sphere-cyan w-[500px] h-[500px] top-[40%] -right-[200px] opacity-30" aria-hidden />

      <header className="glass sticky top-0 z-40">
        <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Abrir menu"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-5" aria-hidden />
            </Button>
            <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shrink-0">
              <Package className="size-4" aria-hidden />
            </div>
            <div className="flex flex-col leading-tight min-w-0">
              <span className="font-heading font-bold tracking-tight">Shegou</span>
              <span className="text-xs text-muted-foreground truncate">
                {condoName ?? "Selecione um condomínio"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CommandPalette isMaster={isMaster} />
            <span className="hidden sm:inline text-sm text-muted-foreground">{userEmail}</span>
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="flex-1 flex relative">
        <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 border-r border-border bg-sidebar/80 backdrop-blur-sm">
          <div className="flex-1 overflow-y-auto">
            <AdminSidebar isMaster={isMaster} />
          </div>
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
              aria-hidden
            />
            <div className="absolute left-0 top-0 bottom-0 w-72 bg-sidebar border-r border-border shadow-2xl flex flex-col">
              <div className="h-16 border-b border-border flex items-center justify-between px-4">
                <span className="font-heading font-bold">Menu</span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Fechar menu"
                  onClick={() => setMobileOpen(false)}
                >
                  <X className="size-5" aria-hidden />
                </Button>
              </div>
              <AdminSidebar isMaster={isMaster} onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

        <main className="flex-1 min-w-0 grid-pattern">{children}</main>
      </div>
      <InstallPrompt />
    </div>
  );
}
