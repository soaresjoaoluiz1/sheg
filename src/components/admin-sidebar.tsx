"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Package,
  Users,
  Building2,
  MessageCircle,
  Megaphone,
  Bell,
  ChevronRight,
  AlertTriangle,
  Scale,
  Flag,
  Car,
  Wrench,
  Store,
  ShieldCheck,
  ShoppingBag,
  Shield,
  TrendingUp,
  Map,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

type CountKey = "encomendas" | "ocorrencias" | "denuncias" | "pedidos" | "whatsapp" | "avisos";
type CountsResponse = Record<CountKey, number>;

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  disabled?: boolean;
  countKey?: CountKey;
};

type NavSection = {
  label: string | null;
  masterOnly?: boolean;
  items: NavItem[];
};

const SECTIONS: NavSection[] = [
  {
    label: null,
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/encomendas", label: "Encomendas", icon: Package, countKey: "encomendas" },
      { href: "/unidades", label: "Unidades", icon: Building2 },
      { href: "/moradores", label: "Moradores", icon: Users },
      { href: "/veiculos", label: "Veículos", icon: Car },
      { href: "/facilitis", label: "Facilitis", icon: Wrench },
    ],
  },
  {
    label: "Segurança",
    items: [
      { href: "/ocorrencias", label: "Ocorrências", icon: AlertTriangle, countKey: "ocorrencias" },
      { href: "/reincidencia", label: "Reincidência", icon: Scale },
      { href: "/denuncias", label: "Denúncias", icon: Flag, countKey: "denuncias" },
    ],
  },
  {
    label: "Marketplace",
    items: [
      { href: "/anunciantes", label: "Anunciantes", icon: Store },
      { href: "/anunciantes/moderacao", label: "Moderação", icon: ShieldCheck },
      { href: "/pedidos", label: "Pedidos", icon: ShoppingBag, countKey: "pedidos" },
    ],
  },
  {
    label: "Comunicação",
    items: [
      { href: "/avisos", label: "Avisos", icon: Megaphone, countKey: "avisos" },
      { href: "/whatsapp", label: "WhatsApp", icon: MessageCircle, countKey: "whatsapp" },
      { href: "/lembretes", label: "Lembretes", icon: Bell },
    ],
  },
  {
    label: "Master",
    masterOnly: true,
    items: [
      { href: "/usuarios", label: "Usuários", icon: Shield },
      { href: "/leads", label: "Leads", icon: TrendingUp },
      { href: "/mapa", label: "Mapa", icon: Map },
      { href: "/relatorios", label: "Relatórios", icon: FileText },
    ],
  },
];

async function fetchCounts(): Promise<CountsResponse> {
  const res = await fetch("/api/dashboard/counts");
  if (!res.ok) throw new Error("Falha");
  return await res.json();
}

export function AdminSidebar({ onNavigate, isMaster }: { onNavigate?: () => void; isMaster?: boolean }) {
  const pathname = usePathname();
  const { data: counts } = useQuery({
    queryKey: ["dashboard-counts"],
    queryFn: fetchCounts,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const visible = SECTIONS.filter((s) => !s.masterOnly || isMaster);

  return (
    <nav aria-label="Navegação principal" className="flex flex-col gap-4 p-3">
      {visible.map((section, idx) => (
        <div key={idx} className="flex flex-col gap-0.5">
          {section.label && (
            <div className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {section.label}
            </div>
          )}
          {section.items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            const count = item.countKey ? counts?.[item.countKey] ?? 0 : 0;
            if (item.disabled) {
              return (
                <span
                  key={item.href}
                  aria-disabled
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground/60 cursor-not-allowed"
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  <span className="flex-1">{item.label}</span>
                  <span className="text-[10px] uppercase tracking-wider">em breve</span>
                </span>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-white/[0.04] hover:text-white",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                <span className="flex-1">{item.label}</span>
                {count > 0 && (
                  <span
                    className={cn(
                      "inline-flex items-center justify-center rounded-full px-1.5 text-[10px] font-semibold tabular-nums min-w-[20px] h-5",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-white/10 text-white",
                    )}
                    aria-label={`${count} pendentes`}
                  >
                    {count > 99 ? "99+" : count}
                  </span>
                )}
                {isActive && count === 0 && <ChevronRight className="size-3.5" aria-hidden />}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
