"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Package, Megaphone, Store, Flag, LogOut, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { InstallPrompt } from "@/components/install-prompt";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/morador", label: "Início", icon: Home },
  { href: "/morador/encomendas", label: "Encomendas", icon: Package },
  { href: "/morador/avisos", label: "Avisos", icon: Megaphone },
  { href: "/morador/marketplace", label: "Lojas", icon: Store },
  { href: "/morador/denuncias", label: "Denúncias", icon: Flag },
] as const;

export function MoradorShell({
  children,
  name,
  unitLabel,
  condoName,
}: {
  children: React.ReactNode;
  name: string;
  unitLabel: string;
  condoName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/morador/auth/logout", { method: "POST" });
    toast.success("Sessão encerrada");
    router.push("/morador/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col pb-20 sm:pb-0 relative">
      <div className="glow-sphere w-[500px] h-[500px] -top-[200px] -right-[200px] opacity-25" aria-hidden />

      <header className="glass sticky top-0 z-40">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <User className="size-4" aria-hidden />
            </div>
            <div className="leading-tight min-w-0">
              <div className="font-heading font-bold truncate">{name}</div>
              <div className="text-xs text-muted-foreground truncate">
                {condoName} · {unitLabel}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={logout} aria-label="Sair">
              <LogOut className="size-4" aria-hidden />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>

        <nav className="hidden sm:block border-t border-border" aria-label="Menu morador">
          <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 flex gap-1 -mb-px">
            {NAV.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/morador" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-2.5 text-sm border-b-2 transition-colors",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-white",
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="size-4" aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="flex-1 grid-pattern">{children}</main>

      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border z-40 grid grid-cols-5"
        aria-label="Menu morador"
      >
        {NAV.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/morador" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="size-5" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <InstallPrompt />
    </div>
  );
}
