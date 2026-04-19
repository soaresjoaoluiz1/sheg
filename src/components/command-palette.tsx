"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  LayoutDashboard,
  Package,
  Users,
  Building2,
  Car,
  Wrench,
  AlertTriangle,
  Scale,
  Flag,
  Store,
  ShieldCheck,
  ShoppingBag,
  Megaphone,
  MessageCircle,
  Bell,
  Shield,
  TrendingUp,
  Map,
  FileText,
  Search,
  Moon,
  Sun,
  LogOut,
  Plus,
} from "lucide-react";
import { useTheme } from "next-themes";

type Item = {
  value: string;
  label: string;
  icon: typeof Package;
  href?: string;
  action?: () => void;
  section?: string;
  masterOnly?: boolean;
  keywords?: string;
};

interface CommandPaletteProps {
  isMaster?: boolean;
}

export function CommandPalette({ isMaster }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((p) => !p);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  async function logout() {
    setOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const navItems: Item[] = [
    { value: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", section: "Navegação", keywords: "inicio metricas" },
    { value: "encomendas", label: "Encomendas", icon: Package, href: "/encomendas", section: "Navegação", keywords: "pacotes entregas" },
    { value: "unidades", label: "Unidades", icon: Building2, href: "/unidades", section: "Navegação", keywords: "blocos torres apartamentos" },
    { value: "moradores", label: "Moradores", icon: Users, href: "/moradores", section: "Navegação", keywords: "residentes" },
    { value: "veiculos", label: "Veículos", icon: Car, href: "/veiculos", section: "Navegação", keywords: "carros placas" },
    { value: "facilitis", label: "Facilitis", icon: Wrench, href: "/facilitis", section: "Navegação", keywords: "manutencao agenda" },
    { value: "ocorrencias", label: "Ocorrências", icon: AlertTriangle, href: "/ocorrencias", section: "Segurança", keywords: "reclamacoes infratores" },
    { value: "reincidencia", label: "Reincidência", icon: Scale, href: "/reincidencia", section: "Segurança", keywords: "advogado 365 dias" },
    { value: "denuncias", label: "Denúncias", icon: Flag, href: "/denuncias", section: "Segurança", keywords: "reclamacao workflow" },
    { value: "anunciantes", label: "Anunciantes", icon: Store, href: "/anunciantes", section: "Marketplace", keywords: "lojas marketplace" },
    { value: "moderacao", label: "Moderação de anúncios", icon: ShieldCheck, href: "/anunciantes/moderacao", section: "Marketplace", keywords: "audit aprovar bloquear" },
    { value: "pedidos", label: "Pedidos", icon: ShoppingBag, href: "/pedidos", section: "Marketplace", keywords: "orders" },
    { value: "avisos", label: "Avisos", icon: Megaphone, href: "/avisos", section: "Comunicação", keywords: "mural notice" },
    { value: "whatsapp", label: "WhatsApp", icon: MessageCircle, href: "/whatsapp", section: "Comunicação", keywords: "fila mensagens evolution" },
    { value: "lembretes", label: "Lembretes", icon: Bell, href: "/lembretes", section: "Comunicação", keywords: "cron stale reminders" },
  ];

  const masterItems: Item[] = [
    { value: "usuarios", label: "Usuários administrativos", icon: Shield, href: "/usuarios", section: "Master", masterOnly: true },
    { value: "leads", label: "Leads (CRM)", icon: TrendingUp, href: "/leads", section: "Master", masterOnly: true, keywords: "kanban prospeccao" },
    { value: "mapa", label: "Mapa de presença", icon: Map, href: "/mapa", section: "Master", masterOnly: true, keywords: "cidades geocoding" },
    { value: "relatorios", label: "Relatórios PDF", icon: FileText, href: "/relatorios", section: "Master", masterOnly: true, keywords: "entregas pdf" },
  ];

  const actions: Item[] = [
    {
      value: "nova-encomenda",
      label: "Registrar nova encomenda",
      icon: Plus,
      href: "/encomendas",
      section: "Ações rápidas",
      keywords: "criar adicionar",
    },
    {
      value: "nova-ocorrencia",
      label: "Registrar nova ocorrência",
      icon: Plus,
      href: "/ocorrencias",
      section: "Ações rápidas",
    },
    {
      value: "novo-aviso",
      label: "Publicar novo aviso",
      icon: Plus,
      href: "/avisos",
      section: "Ações rápidas",
    },
    {
      value: "tema",
      label: resolvedTheme === "dark" ? "Ativar tema claro" : "Ativar tema escuro",
      icon: resolvedTheme === "dark" ? Sun : Moon,
      action: () => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
        setOpen(false);
      },
      section: "Preferências",
    },
    {
      value: "sair",
      label: "Sair da conta",
      icon: LogOut,
      action: logout,
      section: "Preferências",
    },
  ];

  const all = [...navItems, ...(isMaster ? masterItems : []), ...actions];
  const bySection = all.reduce<Record<string, Item[]>>((acc, it) => {
    const s = it.section ?? "Outros";
    (acc[s] ??= []).push(it);
    return acc;
  }, {});

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md border bg-background hover:bg-muted px-2.5 h-8 text-xs text-muted-foreground transition-colors"
        aria-label="Abrir busca rápida (Ctrl+K)"
      >
        <Search className="size-3.5" aria-hidden />
        <span className="hidden md:inline">Buscar...</span>
        <kbd className="hidden md:inline rounded border bg-muted px-1 font-mono text-[10px]">
          Ctrl K
        </kbd>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal
          aria-label="Busca rápida"
          className="fixed inset-0 z-50 grid place-items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <Command
            label="Busca rápida"
            className="w-full max-w-xl rounded-xl border bg-popover text-popover-foreground shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-2 border-b px-3 h-11">
              <Search className="size-4 text-muted-foreground shrink-0" aria-hidden />
              <Command.Input
                placeholder="O que você procura?"
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
              />
              <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">ESC</kbd>
            </div>

            <Command.List className="max-h-[60vh] overflow-y-auto p-1">
              <Command.Empty className="py-10 text-center text-sm text-muted-foreground">
                Nada encontrado.
              </Command.Empty>

              {Object.entries(bySection).map(([section, items]) => (
                <Command.Group
                  key={section}
                  heading={section}
                  className="px-1 py-1.5 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground"
                >
                  {items.map((it) => {
                    const Icon = it.icon;
                    return (
                      <Command.Item
                        key={it.value}
                        value={`${it.label} ${it.keywords ?? ""}`}
                        onSelect={() => {
                          if (it.href) go(it.href);
                          else if (it.action) it.action();
                        }}
                        className="flex items-center gap-3 rounded-md px-2 py-2 text-sm cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary"
                      >
                        <Icon className="size-4 text-muted-foreground" aria-hidden />
                        {it.label}
                      </Command.Item>
                    );
                  })}
                </Command.Group>
              ))}
            </Command.List>

            <div className="border-t px-3 py-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Navegue com ↑ ↓ · Enter para abrir</span>
              <kbd className="rounded border bg-muted px-1 font-mono">Ctrl K</kbd>
            </div>
          </Command>
        </div>
      )}
    </>
  );
}
