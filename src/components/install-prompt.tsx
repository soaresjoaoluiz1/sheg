"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "shegou_install_dismissed";

export function InstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;

    function handler(e: Event) {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
      setVisible(true);
    }
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function install() {
    if (!event) return;
    await event.prompt();
    const { outcome } = await event.userChoice;
    if (outcome === "dismissed") {
      localStorage.setItem(DISMISSED_KEY, "1");
    }
    setVisible(false);
    setEvent(null);
  }

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Instalar Shegou"
      className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-80 z-40 rounded-xl border bg-card shadow-lg p-4 space-y-3 animate-in slide-in-from-bottom-4 duration-300"
    >
      <div className="flex items-start gap-3">
        <div className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground shrink-0">
          <Download className="size-5" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">Instalar Shegou</h3>
          <p className="text-xs text-muted-foreground">
            Acesso rápido no celular e no desktop, funciona offline para navegação.
          </p>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="Dispensar" onClick={dismiss}>
          <X className="size-3.5" aria-hidden />
        </Button>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={install} className="flex-1 gap-1.5">
          <Download className="size-3.5" aria-hidden /> Instalar
        </Button>
        <Button size="sm" variant="ghost" onClick={dismiss}>Agora não</Button>
      </div>
    </div>
  );
}
