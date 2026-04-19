"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Loader2, Megaphone } from "lucide-react";
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

type Notice = {
  id: string;
  title: string;
  body: string;
  photoUrl: string | null;
  targetType: string;
  targetId: string | null;
  createdByName: string | null;
  createdAt: string;
};

const schema = z.object({
  title: z.string().min(2, "Título obrigatório"),
  body: z.string().min(2, "Mensagem obrigatória"),
  targetType: z.enum(["condo", "block", "tower"]),
  targetId: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

async function fetchNotices() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}`+"/api/notices");
  if (!res.ok) throw new Error("Falha");
  return (await res.json()).items as Notice[];
}

export function AvisosView() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const { data: items = [], isLoading } = useQuery({ queryKey: ["notices"], queryFn: fetchNotices });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/notices/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha");
    },
    onSuccess: () => {
      toast.success("Aviso removido");
      qc.invalidateQueries({ queryKey: ["notices"] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between gap-2">
        <Button onClick={() => setCreating(true)} className="gap-2">
          <Plus className="size-3.5" aria-hidden /> Novo aviso
        </Button>
      </div>

      {isLoading ? (
        <div className="py-8 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden /> Carregando...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center space-y-3">
          <Megaphone className="size-8 mx-auto text-muted-foreground" aria-hidden />
          <h3 className="font-semibold">Nenhum aviso publicado</h3>
          <p className="text-sm text-muted-foreground">
            Crie um aviso para ser exibido no portal do morador.
          </p>
          <Button onClick={() => setCreating(true)}>Novo aviso</Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((n) => (
            <article key={n.id} className="rounded-xl border bg-card overflow-hidden flex flex-col">
              {n.photoUrl && (
                <img src={n.photoUrl} alt="" className="w-full aspect-video object-cover" />
              )}
              <div className="p-4 space-y-2 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold leading-tight">{n.title}</h3>
                  <Badge variant="secondary" className="capitalize shrink-0">
                    {n.targetType === "condo" ? "Todo condomínio" : `${n.targetType} ${n.targetId ?? ""}`}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{n.body}</p>
                <div className="text-xs text-muted-foreground pt-2 border-t flex items-center justify-between gap-2">
                  <span>
                    Por {n.createdByName ?? "—"} ·{" "}
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ptBR })}
                  </span>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Excluir aviso"
                    onClick={() => {
                      if (confirm("Excluir este aviso?")) del.mutate(n.id);
                    }}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {creating && (
        <NoticeFormDialog
          onClose={() => setCreating(false)}
          onSaved={() => qc.invalidateQueries({ queryKey: ["notices"] })}
        />
      )}
    </div>
  );
}

function NoticeFormDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [photo, setPhoto] = useState<string | null>(null);
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { targetType: "condo", title: "", body: "", targetId: "" },
  });
  const targetType = watch("targetType");

  async function submit(data: FormData) {
    try {
      let photoUrl: string | null = null;
      if (photo) photoUrl = await uploadDataUrl(photo, "misc");
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}`+"/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          body: data.body,
          targetType: data.targetType,
          targetId: data.targetType === "condo" ? null : data.targetId || null,
          photoUrl,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Falha");
      toast.success("Aviso publicado");
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
          <DialogTitle>Novo aviso</DialogTitle>
          <DialogDescription>Comunicado visível no portal do morador.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="notice-title">Título</Label>
            <Input id="notice-title" {...register("title")} aria-invalid={!!errors.title} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notice-body">Mensagem</Label>
            <textarea
              id="notice-body"
              {...register("body")}
              rows={5}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-y focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
              aria-invalid={!!errors.body}
            />
            {errors.body && <p className="text-sm text-destructive">{errors.body.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="notice-target-type">Alcance</Label>
              <Select value={targetType} onValueChange={(v) => setValue("targetType", (v ?? "condo") as FormData["targetType"])}>
                <SelectTrigger id="notice-target-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="condo">Todo o condomínio</SelectItem>
                  <SelectItem value="block">Bloco específico</SelectItem>
                  <SelectItem value="tower">Torre específica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {targetType !== "condo" && (
              <div className="space-y-2">
                <Label htmlFor="notice-target-id">Identificador</Label>
                <Input id="notice-target-id" {...register("targetId")} placeholder={targetType === "block" ? "A" : "1"} />
              </div>
            )}
          </div>

          <CameraCapture label="Imagem (opcional)" value={photo} onChange={setPhoto} />

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
              Publicar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
