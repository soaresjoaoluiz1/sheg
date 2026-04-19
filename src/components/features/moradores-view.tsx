"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, Loader2, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TableSkeleton } from "@/components/skeletons";
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

type Residence = {
  id: string;
  block: string | null;
  tower: string | null;
  number: string;
};

type Resident = {
  id: string;
  name: string;
  whatsapp: string | null;
  photo: string | null;
  rg: string | null;
  cpf: string | null;
  residenceId: string;
  residence: Residence;
};

const schema = z.object({
  residenceId: z.string().min(1, "Selecione a unidade"),
  name: z.string().min(2, "Nome obrigatório"),
  whatsapp: z.string().optional(),
  rg: z.string().optional(),
  cpf: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function unitLabel(r: Residence) {
  const parts = [r.block, r.tower && r.tower !== r.block ? r.tower : null, r.number].filter(Boolean);
  return parts.join(" · ");
}

async function fetchResidents(q: string) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/residents${params.size ? `?${params}` : ""}`);
  if (!res.ok) throw new Error("Falha");
  return (await res.json()).items as Resident[];
}

async function fetchResidences() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}`+"/api/residences");
  if (!res.ok) throw new Error("Falha");
  return (await res.json()).items as Residence[];
}

export function MoradoresView() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Resident | null>(null);

  const { data: residents = [], isLoading } = useQuery({
    queryKey: ["residents", search],
    queryFn: () => fetchResidents(search),
  });

  const { data: residences = [] } = useQuery({
    queryKey: ["residences"],
    queryFn: fetchResidences,
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/residents/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Falha");
    },
    onSuccess: () => {
      toast.success("Morador removido");
      qc.invalidateQueries({ queryKey: ["residents"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden />
          <Input
            placeholder="Buscar por nome, telefone, CPF ou RG"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
        <Button onClick={() => setCreating(true)} className="gap-2">
          <Plus className="size-3.5" aria-hidden /> Novo morador
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : residents.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center space-y-3">
          <Users className="size-8 mx-auto text-muted-foreground" aria-hidden />
          <h3 className="font-semibold">Nenhum morador cadastrado</h3>
          <p className="text-sm text-muted-foreground">
            Cadastre moradores para começar a notificar encomendas.
          </p>
          <Button onClick={() => setCreating(true)}>Novo morador</Button>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">Unidade</th>
                  <th className="px-4 py-3 font-medium">WhatsApp</th>
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {residents.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {r.photo ? (
                          <img
                            src={r.photo}
                            alt=""
                            className="size-8 rounded-full object-cover border"
                          />
                        ) : (
                          <div className="size-8 rounded-full bg-muted grid place-items-center text-xs font-semibold text-muted-foreground">
                            {r.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium">{r.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{unitLabel(r.residence)}</td>
                    <td className="px-4 py-3 font-mono text-xs">{r.whatsapp ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon-sm" onClick={() => setEditing(r)} aria-label="Editar">
                        <Pencil className="size-3.5" aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Excluir"
                        onClick={() => {
                          if (confirm(`Excluir ${r.name}?`)) del.mutate(r.id);
                        }}
                      >
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

      {(creating || editing) && (
        <ResidentFormDialog
          resident={editing}
          residences={residences}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => qc.invalidateQueries({ queryKey: ["residents"] })}
        />
      )}
    </div>
  );
}

function ResidentFormDialog({
  resident,
  residences,
  onClose,
  onSaved,
}: {
  resident: Resident | null;
  residences: Residence[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [photo, setPhoto] = useState<string | null>(resident?.photo ?? null);
  const [photoDirty, setPhotoDirty] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      residenceId: resident?.residenceId ?? residences[0]?.id ?? "",
      name: resident?.name ?? "",
      whatsapp: resident?.whatsapp ?? "",
      rg: resident?.rg ?? "",
      cpf: resident?.cpf ?? "",
    },
  });

  const selectedResidence = watch("residenceId");

  async function submit(data: FormData) {
    try {
      let photoUrl: string | null | undefined = resident?.photo ?? null;
      if (photoDirty) {
        if (photo && photo.startsWith("data:")) {
          photoUrl = await uploadDataUrl(photo, "residents");
        } else {
          photoUrl = photo;
        }
      }

      const payload = {
        residenceId: data.residenceId,
        name: data.name,
        whatsapp: data.whatsapp || null,
        rg: data.rg || null,
        cpf: data.cpf || null,
        photo: photoUrl,
      };

      const res = await fetch(resident ? `/api/residents/${resident.id}` : "/api/residents", {
        method: resident ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Falha");
      toast.success(resident ? "Morador atualizado" : "Morador criado");
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
          <DialogTitle>{resident ? "Editar morador" : "Novo morador"}</DialogTitle>
          <DialogDescription>Dados de contato e foto para notificações.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="res-unit">Unidade</Label>
            <Select
              value={selectedResidence}
              onValueChange={(v) => setValue("residenceId", v ?? "", { shouldValidate: true })}
            >
              <SelectTrigger id="res-unit">
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
            {errors.residenceId && (
              <p className="text-sm text-destructive">{errors.residenceId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="res-name">Nome</Label>
            <Input id="res-name" {...register("name")} aria-invalid={!!errors.name} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-2 sm:col-span-3">
              <Label htmlFor="res-wa">WhatsApp</Label>
              <Input id="res-wa" {...register("whatsapp")} placeholder="+55 11 99999-9999" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="res-rg">RG</Label>
              <Input id="res-rg" {...register("rg")} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="res-cpf">CPF</Label>
              <Input id="res-cpf" {...register("cpf")} />
            </div>
          </div>

          <CameraCapture
            label="Foto do morador (opcional)"
            value={photo}
            onChange={(v) => {
              setPhoto(v);
              setPhotoDirty(true);
            }}
          />

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
