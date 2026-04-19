"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Loader2,
  AlertTriangle,
  Bell,
  CheckCircle2,
  FileDown,
  Trash2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDistanceToNow } from "date-fns";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { CameraCapture } from "@/components/camera-capture";
import { uploadDataUrl } from "@/hooks/use-upload";
import { generateOccurrencePDF } from "@/lib/occurrence-pdf";
import { CardListSkeleton } from "@/components/skeletons";

type Residence = {
  id: string;
  block: string | null;
  tower: string | null;
  number: string;
};

type Occurrence = {
  id: string;
  title: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  complainantName: string | null;
  complainantUnit: string | null;
  offenderUnit: string | null;
  offenderResidenceId: string | null;
  photo: string | null;
  notifiedAt: string | null;
  adminResponse: string | null;
  voteCount: number;
  createdAt: string;
  offenderResidence: Residence | null;
};

function unitLabel(r: { block?: string | null; tower?: string | null; number: string }) {
  const parts = [r.block, r.tower && r.tower !== r.block ? r.tower : null, r.number].filter(Boolean);
  return parts.join(" · ");
}

const createSchema = z.object({
  title: z.string().min(2, "Título obrigatório"),
  description: z.string().min(5, "Descreva a ocorrência"),
  complainantName: z.string().optional(),
  complainantUnit: z.string().optional(),
  offenderResidenceId: z.string().optional(),
});
type CreateData = z.infer<typeof createSchema>;

const STATUS_LABELS = {
  OPEN: "Aberta",
  IN_PROGRESS: "Em andamento",
  RESOLVED: "Resolvida",
} as const;

async function fetchOccurrences(status: string) {
  const params = new URLSearchParams();
  if (status !== "ALL") params.set("status", status);
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/occurrences?${params}`);
  if (!res.ok) throw new Error("Falha");
  return (await res.json()).items as Occurrence[];
}

async function fetchResidences(): Promise<Residence[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}`+"/api/residences");
  if (!res.ok) throw new Error("Falha");
  return (await res.json()).items as Residence[];
}

async function fetchCondoName(): Promise<string | null> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}`+"/api/auth/me");
  if (!res.ok) return null;
  return null;
}

export function OcorrenciasView() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<"OPEN" | "IN_PROGRESS" | "RESOLVED" | "ALL">("OPEN");
  const [creating, setCreating] = useState(false);
  const [resolving, setResolving] = useState<Occurrence | null>(null);
  void fetchCondoName;

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["occurrences", status],
    queryFn: () => fetchOccurrences(status),
  });

  const counts = useMemo(
    () => ({
      OPEN: items.filter((x) => x.status === "OPEN").length,
      IN_PROGRESS: items.filter((x) => x.status === "IN_PROGRESS").length,
      RESOLVED: items.filter((x) => x.status === "RESOLVED").length,
    }),
    [items],
  );

  const del = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/occurrences/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Falha");
    },
    onSuccess: () => {
      toast.success("Ocorrência removida");
      qc.invalidateQueries({ queryKey: ["occurrences"] });
    },
  });

  const notify = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/occurrences/${id}/notify`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Falha");
      return json as { enqueued: number; protocol: string };
    },
    onSuccess: (data) => {
      toast.success(`Infrator notificado (${data.enqueued} WhatsApp)`, {
        description: `Protocolo ${data.protocol}`,
      });
      qc.invalidateQueries({ queryKey: ["occurrences"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const advance = useMutation({
    mutationFn: async ({ id, nextStatus }: { id: string; nextStatus: string }) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/occurrences/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Falha");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["occurrences"] });
    },
  });

  async function exportPdf(oc: Occurrence) {
    const condoNameEl = document.querySelector<HTMLElement>("[data-condo-name]");
    const condoName = condoNameEl?.dataset.condoName ?? "Condomínio";
    const blob = generateOccurrencePDF({
      ...oc,
      condoName,
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `protocolo-${oc.id.substring(0, 8)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("PDF gerado");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-3">
        <Tabs value={status} onValueChange={(v) => setStatus(v as typeof status)} className="w-full lg:w-auto">
          <TabsList>
            <TabsTrigger value="OPEN">
              Abertas {counts.OPEN > 0 && <Badge className="ml-2">{counts.OPEN}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="IN_PROGRESS">
              Andamento {counts.IN_PROGRESS > 0 && <Badge className="ml-2">{counts.IN_PROGRESS}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="RESOLVED">Resolvidas</TabsTrigger>
            <TabsTrigger value="ALL">Tudo</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={() => setCreating(true)} className="gap-2 ml-auto">
          <Plus className="size-3.5" aria-hidden /> Nova ocorrência
        </Button>
      </div>

      {isLoading ? (
        <CardListSkeleton count={3} />
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center space-y-3">
          <AlertTriangle className="size-8 mx-auto text-muted-foreground" aria-hidden />
          <h3 className="font-semibold">Nenhuma ocorrência</h3>
          <p className="text-sm text-muted-foreground">
            Registre uma ocorrência para notificar o infrator e gerar protocolo.
          </p>
          <Button onClick={() => setCreating(true)}>Nova ocorrência</Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((oc) => (
            <OccurrenceCard
              key={oc.id}
              oc={oc}
              onDelete={() => {
                if (confirm("Excluir esta ocorrência?")) del.mutate(oc.id);
              }}
              onNotify={() => notify.mutate(oc.id)}
              onResolve={() => setResolving(oc)}
              onProgress={() => advance.mutate({ id: oc.id, nextStatus: "IN_PROGRESS" })}
              onExport={() => exportPdf(oc)}
              notifying={notify.isPending && notify.variables === oc.id}
            />
          ))}
        </div>
      )}

      {creating && (
        <OccurrenceFormDialog
          onClose={() => setCreating(false)}
          onSaved={() => qc.invalidateQueries({ queryKey: ["occurrences"] })}
        />
      )}

      {resolving && (
        <ResolveDialog
          oc={resolving}
          onClose={() => setResolving(null)}
          onSaved={() => qc.invalidateQueries({ queryKey: ["occurrences"] })}
        />
      )}
    </div>
  );
}

function OccurrenceCard({
  oc,
  onDelete,
  onNotify,
  onResolve,
  onProgress,
  onExport,
  notifying,
}: {
  oc: Occurrence;
  onDelete: () => void;
  onNotify: () => void;
  onResolve: () => void;
  onProgress: () => void;
  onExport: () => void;
  notifying: boolean;
}) {
  const statusColor =
    oc.status === "OPEN"
      ? "bg-destructive/10 text-destructive"
      : oc.status === "IN_PROGRESS"
        ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
        : "bg-primary/10 text-primary";
  const protocol = oc.id.substring(0, 8).toUpperCase();

  return (
    <article className="rounded-xl border bg-card p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className={`grid size-10 place-items-center rounded-lg shrink-0 ${statusColor}`}>
            <AlertTriangle className="size-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{oc.title}</h3>
              <Badge variant={oc.status === "RESOLVED" ? "secondary" : "default"}>
                {STATUS_LABELS[oc.status]}
              </Badge>
              {oc.notifiedAt && (
                <Badge variant="secondary" className="gap-1">
                  <Bell className="size-3" aria-hidden /> Notificado
                </Badge>
              )}
              <code className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                {protocol}
              </code>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-3">
              {oc.description}
            </p>
            <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-3">
              {oc.offenderUnit && <span>Unidade infratora: {oc.offenderUnit}</span>}
              {oc.complainantName && <span>Reclamante: {oc.complainantName}</span>}
              <span className="flex items-center gap-1">
                <Clock className="size-3" aria-hidden />
                {formatDistanceToNow(new Date(oc.createdAt), { addSuffix: true, locale: ptBR })}
              </span>
            </div>
          </div>
        </div>
        {oc.photo && (
          <img src={oc.photo} alt="" className="size-20 rounded-lg object-cover border shrink-0" />
        )}
      </div>

      {oc.adminResponse && (
        <div className="rounded-md border-l-4 border-primary/40 bg-primary/5 p-3 text-sm">
          <div className="text-xs font-medium text-muted-foreground mb-1">Resposta</div>
          <p className="whitespace-pre-line">{oc.adminResponse}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-2 border-t">
        {oc.status !== "RESOLVED" && (
          <>
            <Button size="sm" variant="outline" onClick={onNotify} disabled={notifying || !oc.offenderResidenceId} className="gap-1.5">
              {notifying ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Bell className="size-3.5" aria-hidden />}
              Notificar
            </Button>
            {oc.status === "OPEN" && (
              <Button size="sm" variant="outline" onClick={onProgress}>
                Marcar em andamento
              </Button>
            )}
            <Button size="sm" onClick={onResolve} className="gap-1.5">
              <CheckCircle2 className="size-3.5" aria-hidden />
              Resolver
            </Button>
          </>
        )}
        <Button size="sm" variant="outline" onClick={onExport} className="gap-1.5">
          <FileDown className="size-3.5" aria-hidden /> PDF
        </Button>
        <Button size="icon-sm" variant="ghost" aria-label="Excluir" onClick={onDelete} className="ml-auto">
          <Trash2 className="size-3.5" aria-hidden />
        </Button>
      </div>
    </article>
  );
}

function OccurrenceFormDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { data: residences = [] } = useQuery({ queryKey: ["residences"], queryFn: fetchResidences });
  const [photo, setPhoto] = useState<string | null>(null);
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<CreateData>({
    resolver: zodResolver(createSchema),
    defaultValues: { title: "", description: "" },
  });

  async function submit(data: CreateData) {
    try {
      let photoUrl: string | null = null;
      if (photo) photoUrl = await uploadDataUrl(photo, "occurrences");
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}`+"/api/occurrences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          complainantName: data.complainantName || null,
          complainantUnit: data.complainantUnit || null,
          offenderResidenceId: data.offenderResidenceId || null,
          photo: photoUrl,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Falha");
      toast.success("Ocorrência registrada");
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Nova ocorrência</DialogTitle>
          <DialogDescription>Protocolo é gerado automaticamente ao salvar.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="oc-title">Título</Label>
            <Input id="oc-title" {...register("title")} aria-invalid={!!errors.title} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="oc-desc">Descrição</Label>
            <textarea
              id="oc-desc"
              {...register("description")}
              rows={4}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-y focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
              aria-invalid={!!errors.description}
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="oc-offender">Unidade infratora</Label>
            <Select
              value={watch("offenderResidenceId") ?? ""}
              onValueChange={(v) => setValue("offenderResidenceId", v ?? "", { shouldValidate: true })}
            >
              <SelectTrigger id="oc-offender">
                <SelectValue placeholder="Selecione a unidade" />
              </SelectTrigger>
              <SelectContent>
                {residences.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {unitLabel(r)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="oc-comp-name">Reclamante (opcional)</Label>
              <Input id="oc-comp-name" {...register("complainantName")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="oc-comp-unit">Unidade reclamante</Label>
              <Input id="oc-comp-unit" {...register("complainantUnit")} placeholder="A · 102" />
            </div>
          </div>

          <CameraCapture label="Evidência (opcional)" value={photo} onChange={setPhoto} />

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
              Registrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResolveDialog({
  oc,
  onClose,
  onSaved,
}: {
  oc: Occurrence;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [response, setResponse] = useState(oc.adminResponse ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/occurrences/${oc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RESOLVED", adminResponse: response || null }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Falha");
      toast.success("Ocorrência resolvida");
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
          <DialogTitle>Resolver ocorrência</DialogTitle>
          <DialogDescription>Adicione uma resposta administrativa opcional.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="resp">Resposta</Label>
          <textarea
            id="resp"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={4}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-y focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
            Marcar como resolvida
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
