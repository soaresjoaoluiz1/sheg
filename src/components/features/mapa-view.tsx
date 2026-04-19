"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, Trash2, MapPin, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

type Pin = {
  id: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  active: boolean;
};

const schema = z.object({
  city: z.string().min(2),
  state: z.string().length(2, "UF com 2 letras"),
});
type FormData = z.infer<typeof schema>;

async function fetchPins(): Promise<Pin[]> {
  const res = await fetch("/api/map-pins");
  if (!res.ok) throw new Error("Falha");
  return (await res.json()).items;
}

export function MapaView() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const { data: items = [], isLoading } = useQuery({ queryKey: ["map-pins"], queryFn: fetchPins });

  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      await fetch(`/api/map-pins/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active }) });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["map-pins"] }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { await fetch(`/api/map-pins/${id}`, { method: "DELETE" }); },
    onSuccess: () => { toast.success("Removido"); qc.invalidateQueries({ queryKey: ["map-pins"] }); },
  });

  const states = new Set(items.filter((p) => p.active).map((p) => p.state));

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-3">
        <SummaryCard label="Cidades ativas" value={items.filter((p) => p.active).length} />
        <SummaryCard label="Estados" value={states.size} />
        <SummaryCard label="Total" value={items.length} />
      </div>

      <Button onClick={() => setCreating(true)} className="gap-2">
        <Plus className="size-3.5" aria-hidden /> Nova cidade
      </Button>

      {isLoading ? (
        <div className="py-8 flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" aria-hidden /> Carregando...</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center space-y-3">
          <MapPin className="size-8 mx-auto text-muted-foreground" aria-hidden />
          <h3 className="font-semibold">Nenhuma cidade cadastrada</h3>
          <Button onClick={() => setCreating(true)}>Adicionar primeira</Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <article key={p.id} className="rounded-xl border bg-card p-4 flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <MapPin className="size-5" aria-hidden />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{p.city}</div>
                <div className="text-xs text-muted-foreground">
                  {p.state} · {p.lat.toFixed(3)}, {p.lng.toFixed(3)}
                </div>
              </div>
              {!p.active && <Badge variant="secondary">Inativo</Badge>}
              <Button variant="ghost" size="icon-sm" onClick={() => toggle.mutate({ id: p.id, active: !p.active })} aria-label="Ativar/desativar">
                {p.active ? <ToggleRight className="size-4 text-primary" aria-hidden /> : <ToggleLeft className="size-4 text-muted-foreground" aria-hidden />}
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => { if (confirm("Excluir?")) del.mutate(p.id); }} aria-label="Excluir"><Trash2 className="size-3.5" aria-hidden /></Button>
            </article>
          ))}
        </div>
      )}

      {creating && (
        <PinFormDialog onClose={() => setCreating(false)} onSaved={() => qc.invalidateQueries({ queryKey: ["map-pins"] })} />
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-1">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-3xl font-semibold tracking-tight tabular-nums">{value}</div>
    </div>
  );
}

function PinFormDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function submit(data: FormData) {
    try {
      const res = await fetch("/api/map-pins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: data.city, state: data.state.toUpperCase() }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Falha");
      }
      toast.success("Cidade adicionada e geocodificada");
      onSaved(); onClose();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova cidade</DialogTitle>
          <DialogDescription>Coordenadas obtidas via OpenStreetMap (Nominatim).</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="m-city">Cidade</Label>
              <Input id="m-city" {...register("city")} aria-invalid={!!errors.city} />
              {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-state">UF</Label>
              <Input id="m-state" maxLength={2} {...register("state")} className="uppercase" aria-invalid={!!errors.state} />
              {errors.state && <p className="text-sm text-destructive">{errors.state.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
              Geocodificar e salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
