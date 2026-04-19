"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Play } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const HOURS_PRESETS = [12, 24, 36, 48, 72] as const;
const DELIVERY_TYPES = [
  { value: "PACKAGE", label: "Encomenda" },
  { value: "FAST_DELIVERY", label: "Delivery rápido" },
  { value: "VISITOR", label: "Visitante" },
] as const;

interface Config {
  enabled: boolean;
  scheduleHours: number[];
  deliveryTypes: string[];
  notifyAllResidents: boolean;
  messageTemplate: string;
}

const DEFAULT: Config = {
  enabled: true,
  scheduleHours: [12, 24, 36],
  deliveryTypes: ["PACKAGE"],
  notifyAllResidents: false,
  messageTemplate:
    "Olá, {morador}! Sua encomenda ({origem}) está aguardando retirada na portaria há {horas}h. Unidade {unidade} · {condominio}.",
};

async function fetchConfig() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}`+"/api/settings?key=package_stale_reminders");
  if (!res.ok) throw new Error("Falha");
  const json = await res.json();
  return (json.value as Config) ?? DEFAULT;
}

async function saveConfig(value: Config) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}`+"/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: "package_stale_reminders", value }),
  });
  if (!res.ok) throw new Error("Falha");
}

export function LembretesView() {
  const qc = useQueryClient();
  const { data: initial = DEFAULT } = useQuery({ queryKey: ["setting", "package_stale_reminders"], queryFn: fetchConfig });
  const [config, setConfig] = useState<Config>(DEFAULT);
  const [hydrated, setHydrated] = useState(false);

  if (!hydrated && initial) {
    setConfig({ ...DEFAULT, ...initial });
    setHydrated(true);
  }

  const save = useMutation({
    mutationFn: () => saveConfig(config),
    onSuccess: () => {
      toast.success("Configuração salva");
      qc.invalidateQueries({ queryKey: ["setting", "package_stale_reminders"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const runNow = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}`+"/api/cron/reminders", { method: "POST" });
      return await res.json();
    },
    onSuccess: (data) => {
      toast.success(
        `Lembretes: ${data.reminders.enqueued}/${data.reminders.scanned} · Disparos: ${data.dispatch.ok}/${data.dispatch.processed}`,
      );
    },
  });

  function toggleHour(h: number) {
    setConfig((c) => ({
      ...c,
      scheduleHours: c.scheduleHours.includes(h)
        ? c.scheduleHours.filter((x) => x !== h)
        : [...c.scheduleHours, h].sort((a, b) => a - b),
    }));
  }

  function toggleType(t: string) {
    setConfig((c) => ({
      ...c,
      deliveryTypes: c.deliveryTypes.includes(t)
        ? c.deliveryTypes.filter((x) => x !== t)
        : [...c.deliveryTypes, t],
    }));
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-6 space-y-6 max-w-3xl">
        <label className="flex items-center justify-between gap-4 cursor-pointer">
          <span>
            <span className="font-medium">Ativar lembretes automáticos</span>
            <span className="block text-sm text-muted-foreground">
              Quando ligado, o worker escaneia encomendas paradas a cada 1 minuto.
            </span>
          </span>
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
            className="size-5 accent-primary"
          />
        </label>

        <div className="space-y-2">
          <Label>Intervalos de cobrança</Label>
          <div className="flex flex-wrap gap-2">
            {HOURS_PRESETS.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => toggleHour(h)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  config.scheduleHours.includes(h)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted"
                }`}
              >
                {h}h
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            O morador recebe lembretes em cada intervalo enquanto a encomenda continuar parada.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Tipos de entrega que disparam lembrete</Label>
          <div className="flex flex-wrap gap-2">
            {DELIVERY_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => toggleType(t.value)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  config.deliveryTypes.includes(t.value)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center justify-between gap-4 cursor-pointer">
          <span>
            <span className="font-medium">Notificar todos os moradores da unidade</span>
            <span className="block text-sm text-muted-foreground">
              Caso desligado, só o primeiro morador da unidade recebe.
            </span>
          </span>
          <input
            type="checkbox"
            checked={config.notifyAllResidents}
            onChange={(e) => setConfig({ ...config, notifyAllResidents: e.target.checked })}
            className="size-5 accent-primary"
          />
        </label>

        <div className="space-y-2">
          <Label htmlFor="msg-tpl">Template da mensagem</Label>
          <textarea
            id="msg-tpl"
            value={config.messageTemplate}
            onChange={(e) => setConfig({ ...config, messageTemplate: e.target.value })}
            rows={4}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono resize-y focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
          />
          <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
            Variáveis:
            {["{morador}", "{origem}", "{horas}", "{unidade}", "{condominio}"].map((v) => (
              <Badge key={v} variant="secondary">
                {v}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => runNow.mutate()} disabled={runNow.isPending} className="gap-2">
            {runNow.isPending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Play className="size-3.5" aria-hidden />}
            Rodar agora
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending} className="gap-2">
            {save.isPending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Save className="size-3.5" aria-hidden />}
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}
