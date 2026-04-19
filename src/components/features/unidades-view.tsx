"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Sparkles, Trash2, Pencil, Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GridSkeleton } from "@/components/skeletons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

type Residence = {
  id: string;
  block: string | null;
  tower: string | null;
  number: string;
  _count: { residents: number; packages: number };
};

const schema = z.object({
  block: z.string().optional(),
  tower: z.string().optional(),
  number: z.string().min(1, "Número é obrigatório"),
});
type FormData = z.infer<typeof schema>;

const bulkSchema = z.object({
  block: z.string().min(1, "Bloco obrigatório"),
  floorStart: z.number().int().min(1),
  floorEnd: z.number().int().min(1),
  unitsPerFloor: z.number().int().min(1).max(20),
});
type BulkFormData = z.infer<typeof bulkSchema>;

async function fetchResidences() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}`+"/api/residences");
  if (!res.ok) throw new Error("Falha ao carregar");
  return (await res.json()).items as Residence[];
}

export function UnidadesView() {
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery({ queryKey: ["residences"], queryFn: fetchResidences });
  const [editing, setEditing] = useState<Residence | null>(null);
  const [creating, setCreating] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  const byBlock = items.reduce<Record<string, Residence[]>>((acc, r) => {
    const k = r.block ?? "Sem bloco";
    (acc[k] ??= []).push(r);
    return acc;
  }, {});

  const del = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/residences/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Falha ao excluir");
    },
    onSuccess: () => {
      toast.success("Unidade removida");
      qc.invalidateQueries({ queryKey: ["residences"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setCreating(true)} className="gap-2">
          <Plus className="size-3.5" aria-hidden /> Nova unidade
        </Button>
        <Button variant="outline" onClick={() => setBulkOpen(true)} className="gap-2">
          <Sparkles className="size-3.5" aria-hidden /> Gerar em lote
        </Button>
      </div>

      {isLoading ? (
        <GridSkeleton count={8} />
      ) : items.length === 0 ? (
        <EmptyState onCreate={() => setCreating(true)} onBulk={() => setBulkOpen(true)} />
      ) : (
        <div className="space-y-6">
          {Object.entries(byBlock).map(([block, list]) => (
            <section key={block} className="space-y-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                <Building2 className="size-3.5" aria-hidden /> Bloco {block}
                <span className="text-xs font-normal normal-case">{list.length} unidade(s)</span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {list.map((r) => (
                  <div key={r.id} className="rounded-xl border bg-card p-4 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold">Unidade {r.number}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.tower ? `Torre ${r.tower}` : "Sem torre"}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Editar"
                          onClick={() => setEditing(r)}
                        >
                          <Pencil className="size-3.5" aria-hidden />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Excluir"
                          onClick={() => {
                            if (confirm(`Excluir unidade ${r.number}?`)) del.mutate(r.id);
                          }}
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>{r._count.residents} morador(es)</span>
                      <span>{r._count.packages} encomenda(s)</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <UnitFormDialog
          unit={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => qc.invalidateQueries({ queryKey: ["residences"] })}
        />
      )}

      {bulkOpen && (
        <BulkDialog onClose={() => setBulkOpen(false)} onSaved={() => qc.invalidateQueries({ queryKey: ["residences"] })} />
      )}
    </div>
  );
}

function EmptyState({ onCreate, onBulk }: { onCreate: () => void; onBulk: () => void }) {
  return (
    <div className="rounded-xl border border-dashed p-10 text-center space-y-3">
      <Building2 className="size-8 mx-auto text-muted-foreground" aria-hidden />
      <h3 className="font-semibold">Nenhuma unidade cadastrada</h3>
      <p className="text-sm text-muted-foreground">
        Comece gerando em lote ou adicione uma unidade manualmente.
      </p>
      <div className="flex items-center justify-center gap-2">
        <Button onClick={onCreate}>Nova unidade</Button>
        <Button variant="outline" onClick={onBulk}>Gerar em lote</Button>
      </div>
    </div>
  );
}

function UnitFormDialog({
  unit,
  onClose,
  onSaved,
}: {
  unit: Residence | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      block: unit?.block ?? "",
      tower: unit?.tower ?? "",
      number: unit?.number ?? "",
    },
  });

  async function submit(data: FormData) {
    try {
      const res = await fetch(unit ? `/api/residences/${unit.id}` : "/api/residences", {
        method: unit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          block: data.block || null,
          tower: data.tower || null,
          number: data.number,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Falha");
      toast.success(unit ? "Unidade atualizada" : "Unidade criada");
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{unit ? "Editar unidade" : "Nova unidade"}</DialogTitle>
          <DialogDescription>Bloco, torre e número da unidade.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="block">Bloco</Label>
              <Input id="block" {...register("block")} placeholder="A" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tower">Torre</Label>
              <Input id="tower" {...register("tower")} placeholder="1" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="number">Número</Label>
            <Input id="number" {...register("number")} placeholder="101" aria-invalid={!!errors.number} />
            {errors.number && (
              <p className="text-sm text-destructive">{errors.number.message}</p>
            )}
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

function BulkDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<BulkFormData>({
    resolver: zodResolver(bulkSchema),
    defaultValues: { block: "A", floorStart: 1, floorEnd: 10, unitsPerFloor: 2 },
  });

  async function submit(data: BulkFormData) {
    try {
      const items: { block: string; number: string }[] = [];
      for (let f = data.floorStart; f <= data.floorEnd; f++) {
        for (let u = 1; u <= data.unitsPerFloor; u++) {
          const number = `${f}${String(u).padStart(2, "0")}`;
          items.push({ block: data.block, number });
        }
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}`+"/api/residences/bulk", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Falha");
      const json = await res.json();
      toast.success(`${items.length} unidade(s) criada(s). Total: ${json.total}.`);
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerar unidades em lote</DialogTitle>
          <DialogDescription>
            Cria unidades por andar automaticamente. Ex.: andares 1–10 × 2 unidades = 20 unidades.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="bulk-block">Bloco</Label>
            <Input id="bulk-block" {...register("block")} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="fs">Andar inicial</Label>
              <Input id="fs" type="number" min={1} {...register("floorStart", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fe">Andar final</Label>
              <Input id="fe" type="number" min={1} {...register("floorEnd", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="upf">Unidades/andar</Label>
              <Input id="upf" type="number" min={1} max={20} {...register("unitsPerFloor", { valueAsNumber: true })} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
              Gerar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
