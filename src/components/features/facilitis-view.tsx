"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Loader2,
  Trash2,
  Pencil,
  Wrench,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  PlayCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

type Service = {
  id: string;
  title: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "DONE" | "CANCELLED";
  scheduledStart: string | null;
  collaborator: string | null;
  notes: string | null;
  createdAt: string;
};

type Collaborator = {
  id: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  active: boolean;
};

const STATUS = {
  SCHEDULED: { label: "Agendado", icon: Calendar, color: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
  IN_PROGRESS: { label: "Em andamento", icon: PlayCircle, color: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  DONE: { label: "Concluído", icon: CheckCircle2, color: "bg-primary/10 text-primary" },
  CANCELLED: { label: "Cancelado", icon: XCircle, color: "bg-muted text-muted-foreground" },
} as const;

const serviceSchema = z.object({
  title: z.string().min(2, "Título obrigatório"),
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "DONE", "CANCELLED"]),
  scheduledStart: z.string().optional(),
  collaborator: z.string().optional(),
  notes: z.string().optional(),
});
type ServiceForm = z.infer<typeof serviceSchema>;

const collabSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  role: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
});
type CollabForm = z.infer<typeof collabSchema>;

async function fetchServices(status: string): Promise<Service[]> {
  const p = new URLSearchParams();
  if (status !== "ALL") p.set("status", status);
  const res = await fetch(`/api/facilitis/services?${p}`);
  if (!res.ok) throw new Error("Falha");
  return (await res.json()).items;
}

async function fetchCollabs(): Promise<Collaborator[]> {
  const res = await fetch("/api/facilitis/collaborators");
  if (!res.ok) throw new Error("Falha");
  return (await res.json()).items;
}

export function FacilitisView() {
  return (
    <Tabs defaultValue="dashboard">
      <TabsList>
        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        <TabsTrigger value="agenda">Agenda</TabsTrigger>
        <TabsTrigger value="collaborators">Colaboradores</TabsTrigger>
      </TabsList>
      <TabsContent value="dashboard" className="mt-6"><DashboardTab /></TabsContent>
      <TabsContent value="agenda" className="mt-6"><AgendaTab /></TabsContent>
      <TabsContent value="collaborators" className="mt-6"><CollabTab /></TabsContent>
    </Tabs>
  );
}

function DashboardTab() {
  const { data: items = [] } = useQuery({ queryKey: ["facilitis-services", "ALL"], queryFn: () => fetchServices("ALL") });
  const counts = useMemo(() => ({
    SCHEDULED: items.filter((s) => s.status === "SCHEDULED").length,
    IN_PROGRESS: items.filter((s) => s.status === "IN_PROGRESS").length,
    DONE: items.filter((s) => s.status === "DONE").length,
    CANCELLED: items.filter((s) => s.status === "CANCELLED").length,
  }), [items]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {(Object.entries(STATUS) as [keyof typeof STATUS, (typeof STATUS)[keyof typeof STATUS]][]).map(([key, s]) => {
        const Icon = s.icon;
        return (
          <div key={key} className="rounded-xl border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <span className={`grid size-8 place-items-center rounded-lg ${s.color}`}>
                <Icon className="size-4" aria-hidden />
              </span>
            </div>
            <div className="text-3xl font-semibold tracking-tight tabular-nums">{counts[key]}</div>
          </div>
        );
      })}
    </div>
  );
}

function AgendaTab() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>("ALL");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const { data: items = [], isLoading } = useQuery({ queryKey: ["facilitis-services", status], queryFn: () => fetchServices(status) });

  const del = useMutation({
    mutationFn: async (id: string) => { await fetch(`/api/facilitis/services/${id}`, { method: "DELETE" }); },
    onSuccess: () => { toast.success("Removido"); qc.invalidateQueries({ queryKey: ["facilitis-services"] }); },
  });

  const advance = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: string }) => {
      await fetch(`/api/facilitis/services/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["facilitis-services"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Tabs value={status} onValueChange={setStatus}>
          <TabsList>
            <TabsTrigger value="ALL">Tudo</TabsTrigger>
            <TabsTrigger value="SCHEDULED">Agendados</TabsTrigger>
            <TabsTrigger value="IN_PROGRESS">Andamento</TabsTrigger>
            <TabsTrigger value="DONE">Concluídos</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={() => setCreating(true)} className="gap-2 ml-auto">
          <Plus className="size-3.5" aria-hidden /> Novo serviço
        </Button>
      </div>

      {isLoading ? (
        <div className="py-8 flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" aria-hidden /> Carregando...</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center space-y-3">
          <Wrench className="size-8 mx-auto text-muted-foreground" aria-hidden />
          <h3 className="font-semibold">Nenhum serviço</h3>
          <Button onClick={() => setCreating(true)}>Novo serviço</Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((s) => {
            const st = STATUS[s.status];
            const Icon = st.icon;
            return (
              <article key={s.id} className="rounded-xl border bg-card p-4 flex flex-col sm:flex-row gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`grid size-10 place-items-center rounded-lg shrink-0 ${st.color}`}>
                    <Icon className="size-5" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{s.title}</h3>
                      <Badge variant="secondary">{st.label}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
                      {s.scheduledStart && <span className="flex items-center gap-1"><Clock className="size-3" aria-hidden />{format(new Date(s.scheduledStart), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>}
                      {s.collaborator && <span>Resp: {s.collaborator}</span>}
                    </div>
                    {s.notes && <p className="text-sm text-muted-foreground">{s.notes}</p>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 self-start sm:self-center shrink-0">
                  {s.status === "SCHEDULED" && <Button size="sm" variant="outline" onClick={() => advance.mutate({ id: s.id, next: "IN_PROGRESS" })}>Iniciar</Button>}
                  {s.status === "IN_PROGRESS" && <Button size="sm" onClick={() => advance.mutate({ id: s.id, next: "DONE" })}>Concluir</Button>}
                  <Button variant="ghost" size="icon-sm" onClick={() => setEditing(s)} aria-label="Editar"><Pencil className="size-3.5" aria-hidden /></Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => { if (confirm("Excluir?")) del.mutate(s.id); }} aria-label="Excluir"><Trash2 className="size-3.5" aria-hidden /></Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {(creating || editing) && (
        <ServiceFormDialog service={editing} onClose={() => { setCreating(false); setEditing(null); }} onSaved={() => qc.invalidateQueries({ queryKey: ["facilitis-services"] })} />
      )}
    </div>
  );
}

function ServiceFormDialog({ service, onClose, onSaved }: { service: Service | null; onClose: () => void; onSaved: () => void }) {
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<ServiceForm>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      title: service?.title ?? "",
      status: (service?.status ?? "SCHEDULED") as ServiceForm["status"],
      scheduledStart: service?.scheduledStart ? service.scheduledStart.slice(0, 16) : "",
      collaborator: service?.collaborator ?? "",
      notes: service?.notes ?? "",
    },
  });

  async function submit(data: ServiceForm) {
    try {
      const res = await fetch(service ? `/api/facilitis/services/${service.id}` : "/api/facilitis/services", {
        method: service ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, scheduledStart: data.scheduledStart || null, collaborator: data.collaborator || null, notes: data.notes || null }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Falha");
      toast.success(service ? "Atualizado" : "Serviço criado");
      onSaved(); onClose();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{service ? "Editar serviço" : "Novo serviço"}</DialogTitle>
          <DialogDescription>Agende manutenções preventivas e corretivas.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="fs-title">Título</Label>
            <Input id="fs-title" {...register("title")} aria-invalid={!!errors.title} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="fs-status">Status</Label>
              <Select value={watch("status")} onValueChange={(v) => setValue("status", (v ?? "SCHEDULED") as ServiceForm["status"])}>
                <SelectTrigger id="fs-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fs-date">Data/hora</Label>
              <Input id="fs-date" type="datetime-local" {...register("scheduledStart")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fs-collab">Responsável</Label>
            <Input id="fs-collab" {...register("collaborator")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fs-notes">Notas</Label>
            <textarea id="fs-notes" {...register("notes")} rows={3} className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-y focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none" />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CollabTab() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Collaborator | null>(null);
  const { data: items = [], isLoading } = useQuery({ queryKey: ["facilitis-collabs"], queryFn: fetchCollabs });

  const del = useMutation({
    mutationFn: async (id: string) => { await fetch(`/api/facilitis/collaborators/${id}`, { method: "DELETE" }); },
    onSuccess: () => { toast.success("Removido"); qc.invalidateQueries({ queryKey: ["facilitis-collabs"] }); },
  });

  return (
    <div className="space-y-4">
      <Button onClick={() => setCreating(true)} className="gap-2">
        <Plus className="size-3.5" aria-hidden /> Novo colaborador
      </Button>

      {isLoading ? (
        <div className="py-8 flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" aria-hidden /> Carregando...</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center space-y-3">
          <Users className="size-8 mx-auto text-muted-foreground" aria-hidden />
          <h3 className="font-semibold">Nenhum colaborador</h3>
          <Button onClick={() => setCreating(true)}>Novo colaborador</Button>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Função</th>
                <th className="px-4 py-3 font-medium">Contato</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.role ?? "—"}</td>
                  <td className="px-4 py-3 text-xs font-mono">{c.phone ?? c.email ?? "—"}</td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => setEditing(c)} aria-label="Editar"><Pencil className="size-3.5" aria-hidden /></Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => { if (confirm("Excluir?")) del.mutate(c.id); }} aria-label="Excluir"><Trash2 className="size-3.5" aria-hidden /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(creating || editing) && (
        <CollabFormDialog collab={editing} onClose={() => { setCreating(false); setEditing(null); }} onSaved={() => qc.invalidateQueries({ queryKey: ["facilitis-collabs"] })} />
      )}
    </div>
  );
}

function CollabFormDialog({ collab, onClose, onSaved }: { collab: Collaborator | null; onClose: () => void; onSaved: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CollabForm>({
    resolver: zodResolver(collabSchema),
    defaultValues: { name: collab?.name ?? "", role: collab?.role ?? "", phone: collab?.phone ?? "", email: collab?.email ?? "" },
  });

  async function submit(data: CollabForm) {
    try {
      const res = await fetch(collab ? `/api/facilitis/collaborators/${collab.id}` : "/api/facilitis/collaborators", {
        method: collab ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Falha");
      toast.success(collab ? "Atualizado" : "Colaborador criado");
      onSaved(); onClose();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{collab ? "Editar colaborador" : "Novo colaborador"}</DialogTitle>
          <DialogDescription>Prestadores de serviço vinculados ao condomínio.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="fc-name">Nome</Label>
            <Input id="fc-name" {...register("name")} aria-invalid={!!errors.name} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="fc-role">Função</Label>
            <Input id="fc-role" {...register("role")} placeholder="Eletricista, Hidráulico..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="fc-phone">Telefone</Label>
              <Input id="fc-phone" {...register("phone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fc-email">E-mail</Label>
              <Input id="fc-email" {...register("email")} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
