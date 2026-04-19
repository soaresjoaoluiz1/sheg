"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, Loader2, Search, Car } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type Residence = { id: string; block: string | null; tower: string | null; number: string };
type Vehicle = {
  id: string;
  model: string | null;
  year: string | null;
  plate: string | null;
  platePhoto: string | null;
  vehiclePhoto: string | null;
  residenceId: string;
  residence: Residence;
};

function unitLabel(r: Residence) {
  return [r.block, r.tower && r.tower !== r.block ? r.tower : null, r.number].filter(Boolean).join(" · ");
}

const schema = z.object({
  residenceId: z.string().min(1, "Selecione"),
  model: z.string().optional(),
  year: z.string().optional(),
  plate: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

async function fetchVehicles(q: string): Promise<Vehicle[]> {
  const p = new URLSearchParams();
  if (q) p.set("q", q);
  const res = await fetch(`/api/vehicles?${p}`);
  if (!res.ok) throw new Error("Falha");
  return (await res.json()).items;
}

async function fetchResidences(): Promise<Residence[]> {
  const res = await fetch("/api/residences");
  if (!res.ok) throw new Error("Falha");
  return (await res.json()).items;
}

export function VeiculosView() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const { data: residences = [] } = useQuery({ queryKey: ["residences"], queryFn: fetchResidences });
  const { data: items = [], isLoading } = useQuery({ queryKey: ["vehicles", search], queryFn: () => fetchVehicles(search) });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha");
    },
    onSuccess: () => { toast.success("Veículo removido"); qc.invalidateQueries({ queryKey: ["vehicles"] }); },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden />
          <Input placeholder="Buscar por placa ou modelo" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-10" />
        </div>
        <Button onClick={() => setCreating(true)} className="gap-2">
          <Plus className="size-3.5" aria-hidden /> Novo veículo
        </Button>
      </div>

      {isLoading ? (
        <div className="py-8 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden /> Carregando...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center space-y-3">
          <Car className="size-8 mx-auto text-muted-foreground" aria-hidden />
          <h3 className="font-semibold">Nenhum veículo cadastrado</h3>
          <Button onClick={() => setCreating(true)}>Novo veículo</Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((v) => (
            <article key={v.id} className="rounded-xl border bg-card overflow-hidden">
              {v.vehiclePhoto && (
                <img src={v.vehiclePhoto} alt="" className="w-full aspect-video object-cover" />
              )}
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">{v.model ?? "Modelo não informado"}</div>
                    <div className="text-xs text-muted-foreground">
                      {unitLabel(v.residence)} {v.year && `· ${v.year}`}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => setEditing(v)} aria-label="Editar">
                      <Pencil className="size-3.5" aria-hidden />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => { if (confirm("Excluir?")) del.mutate(v.id); }} aria-label="Excluir">
                      <Trash2 className="size-3.5" aria-hidden />
                    </Button>
                  </div>
                </div>
                {v.plate && (
                  <div className="inline-flex items-center gap-2 rounded border bg-muted/50 px-2.5 py-1 font-mono text-sm tracking-wider">
                    {v.platePhoto && <img src={v.platePhoto} alt="" className="size-6 rounded object-cover" />}
                    {v.plate}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <VehicleFormDialog
          vehicle={editing}
          residences={residences}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => qc.invalidateQueries({ queryKey: ["vehicles"] })}
        />
      )}
    </div>
  );
}

function VehicleFormDialog({
  vehicle,
  residences,
  onClose,
  onSaved,
}: {
  vehicle: Vehicle | null;
  residences: Residence[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [vehiclePhoto, setVehiclePhoto] = useState<string | null>(vehicle?.vehiclePhoto ?? null);
  const [platePhoto, setPlatePhoto] = useState<string | null>(vehicle?.platePhoto ?? null);
  const [photoDirty, setPhotoDirty] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      residenceId: vehicle?.residenceId ?? "",
      model: vehicle?.model ?? "",
      year: vehicle?.year ?? "",
      plate: vehicle?.plate ?? "",
    },
  });

  async function submit(data: FormData) {
    try {
      let vPhoto = vehicle?.vehiclePhoto ?? null;
      let pPhoto = vehicle?.platePhoto ?? null;
      if (photoDirty) {
        if (vehiclePhoto?.startsWith("data:")) vPhoto = await uploadDataUrl(vehiclePhoto, "vehicles");
        else vPhoto = vehiclePhoto;
        if (platePhoto?.startsWith("data:")) pPhoto = await uploadDataUrl(platePhoto, "vehicles");
        else pPhoto = platePhoto;
      }
      const payload = { ...data, vehiclePhoto: vPhoto, platePhoto: pPhoto };
      const res = await fetch(vehicle ? `/api/vehicles/${vehicle.id}` : "/api/vehicles", {
        method: vehicle ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Falha");
      toast.success(vehicle ? "Atualizado" : "Veículo cadastrado");
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
          <DialogTitle>{vehicle ? "Editar veículo" : "Novo veículo"}</DialogTitle>
          <DialogDescription>Modelo, placa e fotos para identificação.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="v-unit">Unidade</Label>
            <Select value={watch("residenceId")} onValueChange={(v) => setValue("residenceId", v ?? "", { shouldValidate: true })}>
              <SelectTrigger id="v-unit"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {residences.map((r) => <SelectItem key={r.id} value={r.id}>{unitLabel(r)}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.residenceId && <p className="text-sm text-destructive">{errors.residenceId.message}</p>}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="v-model">Modelo</Label>
              <Input id="v-model" {...register("model")} placeholder="Civic, Onix..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="v-year">Ano</Label>
              <Input id="v-year" {...register("year")} placeholder="2024" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="v-plate">Placa</Label>
            <Input id="v-plate" {...register("plate")} placeholder="ABC-1234" className="font-mono tracking-wider uppercase" />
          </div>
          <CameraCapture label="Foto do veículo (opcional)" value={vehiclePhoto} onChange={(v) => { setVehiclePhoto(v); setPhotoDirty(true); }} />
          <CameraCapture label="Foto da placa (opcional)" value={platePhoto} onChange={(v) => { setPlatePhoto(v); setPhotoDirty(true); }} />
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
