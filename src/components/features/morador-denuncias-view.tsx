"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, Flag } from "lucide-react";
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
  targetResidentName: string | null;
  targetBlock: string | null;
  targetUnit: string | null;
  photoUrl: string | null;
  adminNotes: string | null;
  createdAt: string;
};

const STATUS_LABEL = {
  aberta: { label: "Aberta", variant: "destructive" as const },
  em_analise: { label: "Em análise", variant: "default" as const },
  resolvida: { label: "Resolvida", variant: "secondary" as const },
  arquivada: { label: "Arquivada", variant: "secondary" as const },
};

const schema = z.object({
  title: z.string().min(2, "Título obrigatório"),
  description: z.string().min(2, "Descrição obrigatória"),
  targetResidentName: z.string().optional(),
  targetBlock: z.string().optional(),
  targetUnit: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

async function fetchComplaints(): Promise<Complaint[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}`+"/api/morador/complaints");
  if (!res.ok) throw new Error("Falha");
  return (await res.json()).items;
}

export function MoradorDenunciasView() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const { data: items = [], isLoading } = useQuery({ queryKey: ["morador-complaints"], queryFn: fetchComplaints });

  return (
    <div className="space-y-3">
      <Button onClick={() => setCreating(true)} className="gap-2 w-full sm:w-auto">
        <Plus className="size-3.5" aria-hidden /> Nova denúncia
      </Button>

      {isLoading ? (
        <div className="py-8 flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" aria-hidden /> Carregando...</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center space-y-2">
          <Flag className="size-8 mx-auto text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">Você ainda não enviou denúncias.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((c) => {
            const s = STATUS_LABEL[c.status];
            return (
              <article key={c.id} className="rounded-xl border bg-card p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold leading-tight">{c.title}</h3>
                  <Badge variant={s.variant}>{s.label}</Badge>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{c.description}</p>
                {(c.targetUnit || c.targetResidentName) && (
                  <div className="text-xs text-muted-foreground">
                    Alvo: {[c.targetResidentName, c.targetBlock, c.targetUnit].filter(Boolean).join(" · ")}
                  </div>
                )}
                {c.adminNotes && (
                  <div className="rounded-md border-l-4 border-primary/40 bg-primary/5 p-3 text-sm">
                    <div className="text-xs font-medium text-muted-foreground mb-1">Resposta da administração</div>
                    <p className="whitespace-pre-line">{c.adminNotes}</p>
                  </div>
                )}
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  Enviada {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: ptBR })}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {creating && (
        <CreateDialog onClose={() => setCreating(false)} onSaved={() => qc.invalidateQueries({ queryKey: ["morador-complaints"] })} />
      )}
    </div>
  );
}

function CreateDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [photo, setPhoto] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function submit(data: FormData) {
    try {
      let photoUrl: string | null = null;
      if (photo) photoUrl = await uploadDataUrl(photo, "misc");
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}`+"/api/morador/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, photoUrl }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Falha");
      toast.success("Denúncia enviada");
      onSaved(); onClose();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova denúncia</DialogTitle>
          <DialogDescription>Seu relato chega ao síndico para análise.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="md-title">Título</Label>
            <Input id="md-title" {...register("title")} aria-invalid={!!errors.title} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="md-desc">Descrição</Label>
            <textarea id="md-desc" {...register("description")} rows={4} className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-y focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none" />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>
          <fieldset className="space-y-3 rounded-lg border p-3">
            <legend className="text-sm font-medium px-1">Sobre quem? (opcional)</legend>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1 col-span-3">
                <Label htmlFor="md-tn">Nome</Label>
                <Input id="md-tn" {...register("targetResidentName")} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="md-tb">Bloco</Label>
                <Input id="md-tb" {...register("targetBlock")} />
              </div>
              <div className="space-y-1 col-span-2">
                <Label htmlFor="md-tu">Unidade</Label>
                <Input id="md-tu" {...register("targetUnit")} />
              </div>
            </div>
          </fieldset>
          <CameraCapture label="Evidência (opcional)" value={photo} onChange={setPhoto} />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
              Enviar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
