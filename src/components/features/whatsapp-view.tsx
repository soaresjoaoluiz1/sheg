"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, RefreshCw, Pencil, Trash2, Send } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

type Message = {
  id: string;
  status: "PENDING" | "SENT" | "FAILED";
  to: string;
  message: string;
  attempts: number;
  lastError: string | null;
  scheduledAt: string;
  sentAt: string | null;
  createdAt: string;
};

const configSchema = z.object({
  baseUrl: z.string().optional(),
  apiKey: z.string().optional(),
  instanceName: z.string().min(1, "Obrigatório"),
});
type ConfigData = z.infer<typeof configSchema>;

const blockSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM").or(z.literal("")),
  end: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM").or(z.literal("")),
});
type BlockData = z.infer<typeof blockSchema>;

async function fetchSetting(key: string) {
  const res = await fetch(`/api/settings?key=${key}`);
  if (!res.ok) throw new Error("Falha");
  return (await res.json()).value;
}

async function saveSetting(key: string, value: unknown) {
  const res = await fetch("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value }),
  });
  if (!res.ok) throw new Error("Falha");
}

export function WhatsAppView() {
  return (
    <Tabs defaultValue="config">
      <TabsList>
        <TabsTrigger value="config">Configuração</TabsTrigger>
        <TabsTrigger value="block">Bloqueio de horário</TabsTrigger>
        <TabsTrigger value="queue">Fila de mensagens</TabsTrigger>
      </TabsList>
      <TabsContent value="config" className="mt-6">
        <ConfigPanel />
      </TabsContent>
      <TabsContent value="block" className="mt-6">
        <BlockPanel />
      </TabsContent>
      <TabsContent value="queue" className="mt-6">
        <QueuePanel />
      </TabsContent>
    </Tabs>
  );
}

function ConfigPanel() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["setting", "condo_evolution_config"],
    queryFn: () => fetchSetting("condo_evolution_config"),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ConfigData>({
    resolver: zodResolver(configSchema),
    defaultValues: { baseUrl: "", apiKey: "", instanceName: "portaria" },
    values: {
      baseUrl: data?.baseUrl ?? "",
      apiKey: data?.apiKey ?? "",
      instanceName: data?.instanceName ?? "portaria",
    },
  });

  async function submit(values: ConfigData) {
    try {
      await saveSetting("condo_evolution_config", values);
      toast.success("Configuração salva");
      qc.invalidateQueries({ queryKey: ["setting", "condo_evolution_config"] });
      reset(values);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="rounded-xl border bg-card p-6 space-y-5 max-w-2xl">
      {isLoading ? (
        <div className="text-muted-foreground text-sm flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" aria-hidden /> Carregando...
        </div>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="baseUrl">URL base da Evolution API</Label>
        <Input id="baseUrl" {...register("baseUrl")} placeholder="https://evolution.example.com" />
        <p className="text-xs text-muted-foreground">
          Em desenvolvimento: deixe vazio para usar o modo mock (mensagens vão pro console).
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="apiKey">API Key</Label>
        <Input id="apiKey" type="password" {...register("apiKey")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="instanceName">Nome da instância</Label>
        <Input id="instanceName" {...register("instanceName")} placeholder="portaria" aria-invalid={!!errors.instanceName} />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting} className="gap-2">
          {isSubmitting ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Save className="size-3.5" aria-hidden />}
          Salvar
        </Button>
      </div>
    </form>
  );
}

function BlockPanel() {
  const { data } = useQuery({
    queryKey: ["setting", "message_block_hours"],
    queryFn: () => fetchSetting("message_block_hours"),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<BlockData>({
    resolver: zodResolver(blockSchema),
    defaultValues: { start: "", end: "" },
    values: { start: data?.start ?? "", end: data?.end ?? "" },
  });

  async function submit(values: BlockData) {
    try {
      await saveSetting("message_block_hours", values);
      toast.success("Horário de bloqueio salvo");
      reset(values);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="rounded-xl border bg-card p-6 space-y-5 max-w-2xl">
      <p className="text-sm text-muted-foreground">
        Mensagens criadas durante o intervalo abaixo são automaticamente reagendadas para o fim do bloqueio.
        Deixe vazio para enviar 24h por dia.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="block-start">Início</Label>
          <Input id="block-start" {...register("start")} placeholder="22:00" />
          {errors.start && <p className="text-sm text-destructive">{errors.start.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="block-end">Fim</Label>
          <Input id="block-end" {...register("end")} placeholder="07:00" />
          {errors.end && <p className="text-sm text-destructive">{errors.end.message}</p>}
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting} className="gap-2">
          {isSubmitting ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Save className="size-3.5" aria-hidden />}
          Salvar
        </Button>
      </div>
    </form>
  );
}

async function fetchQueue(status: string): Promise<Message[]> {
  const params = new URLSearchParams();
  if (status !== "ALL") params.set("status", status);
  const res = await fetch(`/api/message-queue?${params}`);
  if (!res.ok) throw new Error("Falha");
  return (await res.json()).items as Message[];
}

function QueuePanel() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<"PENDING" | "SENT" | "FAILED" | "ALL">("ALL");
  const [editing, setEditing] = useState<Message | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["message-queue", status],
    queryFn: () => fetchQueue(status),
    refetchInterval: 5000,
  });

  const dispatch = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/message-queue", { method: "POST" });
      return await res.json();
    },
    onSuccess: (data) => {
      toast.success(`Disparados: ${data.ok}/${data.processed}`);
      qc.invalidateQueries({ queryKey: ["message-queue"] });
    },
  });

  const retry = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/message-queue/${id}`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Falha");
    },
    onSuccess: () => {
      toast.success("Reenvio iniciado");
      qc.invalidateQueries({ queryKey: ["message-queue"] });
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/message-queue/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("Removida");
      qc.invalidateQueries({ queryKey: ["message-queue"] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <Tabs value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <TabsList>
            <TabsTrigger value="ALL">Todas</TabsTrigger>
            <TabsTrigger value="PENDING">Pendentes</TabsTrigger>
            <TabsTrigger value="SENT">Enviadas</TabsTrigger>
            <TabsTrigger value="FAILED">Falhas</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={() => dispatch.mutate()} disabled={dispatch.isPending} className="gap-2 ml-auto">
          {dispatch.isPending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Send className="size-3.5" aria-hidden />}
          Disparar pendentes
        </Button>
      </div>

      {isLoading ? (
        <div className="py-8 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden /> Carregando...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          Nenhuma mensagem na fila.
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Para</th>
                  <th className="px-4 py-3 font-medium">Mensagem</th>
                  <th className="px-4 py-3 font-medium">Quando</th>
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((m) => (
                  <tr key={m.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Badge
                        variant={m.status === "SENT" ? "secondary" : m.status === "FAILED" ? "destructive" : "default"}
                      >
                        {m.status}
                      </Badge>
                      {m.attempts > 0 && (
                        <div className="text-[10px] text-muted-foreground mt-1">{m.attempts} tentativa(s)</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{m.to}</td>
                    <td className="px-4 py-3 text-xs max-w-md">
                      <div className="truncate">{m.message}</div>
                      {m.lastError && (
                        <div className="text-[11px] text-destructive mt-1">{m.lastError}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {format(new Date(m.sentAt ?? m.scheduledAt), "dd/MM HH:mm", { locale: ptBR })}
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      {m.status === "FAILED" && (
                        <>
                          <Button size="icon-sm" variant="ghost" aria-label="Editar destinatário" onClick={() => setEditing(m)}>
                            <Pencil className="size-3.5" aria-hidden />
                          </Button>
                          <Button size="icon-sm" variant="ghost" aria-label="Reenviar" onClick={() => retry.mutate(m.id)}>
                            <RefreshCw className="size-3.5" aria-hidden />
                          </Button>
                        </>
                      )}
                      <Button size="icon-sm" variant="ghost" aria-label="Excluir" onClick={() => del.mutate(m.id)}>
                        <Trash2 className="size-3.5" aria-hidden />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && (
        <EditRecipientDialog
          message={editing}
          onClose={() => setEditing(null)}
          onSaved={() => qc.invalidateQueries({ queryKey: ["message-queue"] })}
        />
      )}
    </div>
  );
}

function EditRecipientDialog({
  message,
  onClose,
  onSaved,
}: {
  message: Message;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [to, setTo] = useState(message.to);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/message-queue/${message.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Falha");
      toast.success("Destinatário atualizado e fila reagendada");
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Corrigir destinatário</DialogTitle>
          <DialogDescription>
            Atualiza o número e reenviar quando o worker rodar.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="edit-to">Novo número</Label>
          <Input id="edit-to" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={submitting} className="gap-2">
            {submitting && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
