"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldCheck, ShieldX, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

type Audit = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  category: string | null;
  visible: boolean;
  isResident: boolean;
  residentName: string | null;
  block: string | null;
  unit: string | null;
  condoName: string | null;
  photos: string[];
  advertiser: { id: string; name: string };
  updatedAt: string;
};

const editSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.string().optional(),
  category: z.string().optional(),
});
type EditForm = z.infer<typeof editSchema>;

async function fetchAudits(visible: string): Promise<Audit[]> {
  const p = new URLSearchParams();
  if (visible !== "ALL") p.set("visible", visible);
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/ads-audit?${p}`);
  if (!res.ok) throw new Error("Falha");
  return (await res.json()).items;
}

export function ModeracaoView() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"ALL" | "true" | "false">("ALL");
  const [editing, setEditing] = useState<Audit | null>(null);
  const { data: items = [], isLoading } = useQuery({ queryKey: ["ads-audit", filter], queryFn: () => fetchAudits(filter) });

  const setVisible = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "approve" | "block" }) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/ads-audit/${id}?action=${action}`, { method: "PATCH" });
      if (!res.ok) throw new Error("Falha");
    },
    onSuccess: (_, vars) => {
      toast.success(vars.action === "approve" ? "Anúncio aprovado" : "Anúncio bloqueado");
      qc.invalidateQueries({ queryKey: ["ads-audit"] });
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => { await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/ads-audit/${id}`, { method: "DELETE" }); },
    onSuccess: () => { toast.success("Removido"); qc.invalidateQueries({ queryKey: ["ads-audit"] }); },
  });

  return (
    <div className="space-y-4">
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="ALL">Tudo</TabsTrigger>
          <TabsTrigger value="true">Visíveis</TabsTrigger>
          <TabsTrigger value="false">Bloqueados</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="py-8 flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" aria-hidden /> Carregando...</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center space-y-3">
          <ShieldCheck className="size-8 mx-auto text-muted-foreground" aria-hidden />
          <h3 className="font-semibold">Nenhum anúncio para moderar</h3>
          <p className="text-sm text-muted-foreground">Quando anunciantes ou moradores criarem anúncios, eles aparecem aqui.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((a) => (
            <article key={a.id} className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{a.name}</h3>
                    <Badge variant={a.visible ? "secondary" : "destructive"}>
                      {a.visible ? "Visível" : "Bloqueado"}
                    </Badge>
                    {a.isResident && <Badge variant="secondary">Morador</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {a.advertiser.name}
                    {a.category && ` · ${a.category}`}
                  </div>
                </div>
                {a.price !== null && (
                  <div className="font-mono font-semibold tabular-nums shrink-0">R$ {a.price.toFixed(2)}</div>
                )}
              </div>
              {a.description && <p className="text-sm text-muted-foreground line-clamp-3">{a.description}</p>}
              {a.photos.length > 0 && (
                <div className="grid grid-cols-3 gap-1.5">
                  {a.photos.slice(0, 3).map((url, i) => (
                    <img key={i} src={url} alt="" className="aspect-square rounded object-cover border" />
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {a.visible ? (
                  <Button size="sm" variant="outline" onClick={() => setVisible.mutate({ id: a.id, action: "block" })} className="gap-1.5">
                    <ShieldX className="size-3.5" aria-hidden /> Bloquear
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => setVisible.mutate({ id: a.id, action: "approve" })} className="gap-1.5">
                    <ShieldCheck className="size-3.5" aria-hidden /> Aprovar
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => setEditing(a)} className="gap-1.5">
                  <Pencil className="size-3.5" aria-hidden /> Editar
                </Button>
                <Button size="icon-sm" variant="ghost" onClick={() => { if (confirm("Excluir?")) del.mutate(a.id); }} aria-label="Excluir" className="ml-auto">
                  <Trash2 className="size-3.5" aria-hidden />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && (
        <EditDialog audit={editing} onClose={() => setEditing(null)} onSaved={() => qc.invalidateQueries({ queryKey: ["ads-audit"] })} />
      )}
    </div>
  );
}

function EditDialog({ audit, onClose, onSaved }: { audit: Audit; onClose: () => void; onSaved: () => void }) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: audit.name,
      description: audit.description ?? "",
      price: audit.price !== null ? String(audit.price) : "",
      category: audit.category ?? "",
    },
  });

  async function submit(data: EditForm) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/ads-audit/${audit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description || null,
          price: data.price ? Number(data.price) : null,
          category: data.category || null,
        }),
      });
      if (!res.ok) throw new Error("Falha");
      toast.success("Atualizado");
      onSaved(); onClose();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar anúncio</DialogTitle>
          <DialogDescription>Ajustes inline para ajuste de copy ou preço.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="aud-name">Nome</Label>
            <Input id="aud-name" {...register("name")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="aud-desc">Descrição</Label>
            <textarea id="aud-desc" {...register("description")} rows={3} className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-y focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="aud-price">Preço (R$)</Label>
              <Input id="aud-price" type="number" step="0.01" {...register("price")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aud-cat">Subcategoria</Label>
              <Input id="aud-cat" {...register("category")} />
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
