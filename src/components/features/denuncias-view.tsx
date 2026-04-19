"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Flag, Loader2, Trash2, FileDown } from "lucide-react";
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

type Complaint = {
  id: string;
  title: string;
  description: string;
  status: "aberta" | "em_analise" | "resolvida" | "arquivada";
  reporterName: string | null;
  reporterPhone: string | null;
  reporterBlock: string | null;
  reporterTower: string | null;
  reporterUnit: string | null;
  targetResidentName: string | null;
  targetBlock: string | null;
  targetTower: string | null;
  targetUnit: string | null;
  photoUrl: string | null;
  adminNotes: string | null;
  createdAt: string;
};

const createSchema = z.object({
  title: z.string().min(2, "Título obrigatório"),
  description: z.string().min(2, "Descrição obrigatória"),
  reporterName: z.string().optional(),
  reporterPhone: z.string().optional(),
  reporterUnit: z.string().optional(),
  reporterBlock: z.string().optional(),
  targetResidentName: z.string().optional(),
  targetUnit: z.string().optional(),
  targetBlock: z.string().optional(),
});
type CreateData = z.infer<typeof createSchema>;

const STATUS: Record<Complaint["status"], { label: string; variant: "default" | "secondary" | "destructive" }> = {
  aberta: { label: "Aberta", variant: "destructive" },
  em_analise: { label: "Em análise", variant: "default" },
  resolvida: { label: "Resolvida", variant: "secondary" },
  arquivada: { label: "Arquivada", variant: "secondary" },
};

async function fetchComplaints(status: string): Promise<Complaint[]> {
  const params = new URLSearchParams();
  if (status !== "ALL") params.set("status", status);
  const res = await fetch(`/api/complaints?${params}`);
  if (!res.ok) throw new Error("Falha");
  return (await res.json()).items as Complaint[];
}

export function DenunciasView() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<Complaint["status"] | "ALL">("aberta");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Complaint | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["complaints", status],
    queryFn: () => fetchComplaints(status),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/complaints/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha");
    },
    onSuccess: () => {
      toast.success("Denúncia removida");
      qc.invalidateQueries({ queryKey: ["complaints"] });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, nextStatus }: { id: string; nextStatus: Complaint["status"] }) => {
      const res = await fetch(`/api/complaints/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error("Falha");
    },
    onSuccess: () => {
      toast.success("Status atualizado");
      qc.invalidateQueries({ queryKey: ["complaints"] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-3">
        <Tabs value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <TabsList>
            <TabsTrigger value="aberta">Abertas</TabsTrigger>
            <TabsTrigger value="em_analise">Em análise</TabsTrigger>
            <TabsTrigger value="resolvida">Resolvidas</TabsTrigger>
            <TabsTrigger value="arquivada">Arquivadas</TabsTrigger>
            <TabsTrigger value="ALL">Tudo</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={() => setCreating(true)} className="gap-2 ml-auto">
          <Plus className="size-3.5" aria-hidden /> Nova denúncia
        </Button>
      </div>

      {isLoading ? (
        <div className="py-8 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden /> Carregando...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center space-y-3">
          <Flag className="size-8 mx-auto text-muted-foreground" aria-hidden />
          <h3 className="font-semibold">Nenhuma denúncia</h3>
          <p className="text-sm text-muted-foreground">
            Registre uma denúncia para iniciar o workflow.
          </p>
          <Button onClick={() => setCreating(true)}>Nova denúncia</Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((c) => (
            <ComplaintCard
              key={c.id}
              complaint={c}
              onAdvance={(next) => updateStatus.mutate({ id: c.id, nextStatus: next })}
              onEdit={() => setEditing(c)}
              onDelete={() => {
                if (confirm("Excluir esta denúncia?")) del.mutate(c.id);
              }}
            />
          ))}
        </div>
      )}

      {creating && (
        <CreateDialog
          onClose={() => setCreating(false)}
          onSaved={() => qc.invalidateQueries({ queryKey: ["complaints"] })}
        />
      )}

      {editing && (
        <NotesDialog
          complaint={editing}
          onClose={() => setEditing(null)}
          onSaved={() => qc.invalidateQueries({ queryKey: ["complaints"] })}
        />
      )}
    </div>
  );
}

function ComplaintCard({
  complaint,
  onAdvance,
  onEdit,
  onDelete,
}: {
  complaint: Complaint;
  onAdvance: (next: Complaint["status"]) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const status = STATUS[complaint.status];
  const reporter = [complaint.reporterName, complaint.reporterUnit].filter(Boolean).join(" · ") || "Anônimo";
  const target = [complaint.targetResidentName, complaint.targetUnit].filter(Boolean).join(" · ") || "—";

  return (
    <article className="rounded-xl border bg-card p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="grid size-10 place-items-center rounded-lg shrink-0 bg-destructive/10 text-destructive">
            <Flag className="size-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{complaint.title}</h3>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-3">
              {complaint.description}
            </p>
            <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
              <span>Denunciante: {reporter}</span>
              <span>Alvo: {target}</span>
              <span>{formatDistanceToNow(new Date(complaint.createdAt), { addSuffix: true, locale: ptBR })}</span>
            </div>
          </div>
        </div>
        {complaint.photoUrl && (
          <img src={complaint.photoUrl} alt="" className="size-20 rounded-lg object-cover border shrink-0" />
        )}
      </div>

      {complaint.adminNotes && (
        <div className="rounded-md border-l-4 border-primary/40 bg-primary/5 p-3 text-sm">
          <div className="text-xs font-medium text-muted-foreground mb-1">Notas administrativas</div>
          <p className="whitespace-pre-line">{complaint.adminNotes}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-2 border-t items-center">
        {complaint.status === "aberta" && (
          <Button size="sm" variant="outline" onClick={() => onAdvance("em_analise")}>
            Mover para análise
          </Button>
        )}
        {complaint.status === "em_analise" && (
          <Button size="sm" onClick={() => onAdvance("resolvida")}>
            Marcar resolvida
          </Button>
        )}
        {complaint.status !== "arquivada" && complaint.status !== "aberta" && (
          <Button size="sm" variant="outline" onClick={() => onAdvance("arquivada")}>
            Arquivar
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={onEdit} className="gap-1.5">
          <FileDown className="size-3.5" aria-hidden />
          Notas
        </Button>
        <Button size="icon-sm" variant="ghost" aria-label="Excluir" onClick={onDelete} className="ml-auto">
          <Trash2 className="size-3.5" aria-hidden />
        </Button>
      </div>
    </article>
  );
}

function CreateDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [photo, setPhoto] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateData>({
    resolver: zodResolver(createSchema),
  });

  async function submit(data: CreateData) {
    try {
      let photoUrl: string | null = null;
      if (photo) photoUrl = await uploadDataUrl(photo, "misc");
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, photoUrl }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Falha");
      toast.success("Denúncia registrada");
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
          <DialogTitle>Nova denúncia</DialogTitle>
          <DialogDescription>Workflow: aberta → em análise → resolvida → arquivada.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="cp-title">Título</Label>
            <Input id="cp-title" {...register("title")} aria-invalid={!!errors.title} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cp-desc">Descrição</Label>
            <textarea
              id="cp-desc"
              {...register("description")}
              rows={4}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-y focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
              aria-invalid={!!errors.description}
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>

          <fieldset className="space-y-3 rounded-lg border p-3">
            <legend className="text-sm font-medium px-1">Denunciante</legend>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="cp-r-name">Nome</Label>
                <Input id="cp-r-name" {...register("reporterName")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cp-r-phone">Telefone</Label>
                <Input id="cp-r-phone" {...register("reporterPhone")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cp-r-block">Bloco</Label>
                <Input id="cp-r-block" {...register("reporterBlock")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cp-r-unit">Unidade</Label>
                <Input id="cp-r-unit" {...register("reporterUnit")} />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-3 rounded-lg border p-3">
            <legend className="text-sm font-medium px-1">Alvo</legend>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="cp-t-name">Nome</Label>
                <Input id="cp-t-name" {...register("targetResidentName")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cp-t-block">Bloco</Label>
                <Input id="cp-t-block" {...register("targetBlock")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cp-t-unit">Unidade</Label>
                <Input id="cp-t-unit" {...register("targetUnit")} />
              </div>
            </div>
          </fieldset>

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

function NotesDialog({
  complaint,
  onClose,
  onSaved,
}: {
  complaint: Complaint;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [notes, setNotes] = useState(complaint.adminNotes ?? "");
  const [status, setStatus] = useState<Complaint["status"]>(complaint.status);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/complaints/${complaint.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes: notes || null }),
      });
      if (!res.ok) throw new Error("Falha");
      toast.success("Atualizado");
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
          <DialogTitle>Notas administrativas</DialogTitle>
          <DialogDescription>{complaint.title}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cp-status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus((v ?? "aberta") as Complaint["status"])}>
              <SelectTrigger id="cp-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aberta">Aberta</SelectItem>
                <SelectItem value="em_analise">Em análise</SelectItem>
                <SelectItem value="resolvida">Resolvida</SelectItem>
                <SelectItem value="arquivada">Arquivada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cp-notes">Notas</Label>
            <textarea
              id="cp-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-y focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
