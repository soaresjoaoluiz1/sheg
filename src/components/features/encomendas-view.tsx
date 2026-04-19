"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Loader2,
  Search,
  Package as PackageIcon,
  Bell,
  CheckCircle2,
  Trash2,
  Link as LinkIcon,
  Truck,
  UserCheck,
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
import { CardListSkeleton } from "@/components/skeletons";
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

type Residence = {
  id: string;
  block: string | null;
  tower: string | null;
  number: string;
  residents: { id: string; name: string; whatsapp: string | null }[];
};

type Package = {
  id: string;
  status: "PENDING" | "DELIVERED";
  deliveryType: "PACKAGE" | "FAST_DELIVERY" | "VISITOR";
  courier: string | null;
  trackingCode: string | null;
  pickupCode: string | null;
  arrivalDate: string;
  deliveryDate: string | null;
  deliveryPhoto: string | null;
  releasePhoto: string | null;
  deliveredTo: string | null;
  residence: Residence;
};

function unitLabel(r: { block?: string | null; tower?: string | null; number: string }) {
  const parts = [r.block, r.tower && r.tower !== r.block ? r.tower : null, r.number].filter(Boolean);
  return parts.join(" · ");
}

const createSchema = z.object({
  residenceId: z.string().min(1, "Selecione a unidade"),
  deliveryType: z.enum(["PACKAGE", "FAST_DELIVERY", "VISITOR"]),
  courier: z.string().optional(),
  trackingCode: z.string().optional(),
});
type CreateData = z.infer<typeof createSchema>;

const deliverSchema = z.object({
  deliveredTo: z.string().min(2, "Nome obrigatório"),
});
type DeliverData = z.infer<typeof deliverSchema>;

async function fetchPackages(status: string, q: string): Promise<Package[]> {
  const params = new URLSearchParams();
  if (status !== "ALL") params.set("status", status);
  if (q) params.set("q", q);
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/packages?${params}`);
  if (!res.ok) throw new Error("Falha");
  return (await res.json()).items as Package[];
}

async function fetchResidences(): Promise<Residence[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}`+"/api/residences");
  if (!res.ok) throw new Error("Falha");
  return (await res.json()).items as Residence[];
}

export function EncomendasView() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<"PENDING" | "DELIVERED" | "ALL">("PENDING");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [delivering, setDelivering] = useState<Package | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["packages", status, search],
    queryFn: () => fetchPackages(status, search),
  });

  const counts = useMemo(() => {
    return {
      PENDING: items.filter((p) => p.status === "PENDING").length,
      DELIVERED: items.filter((p) => p.status === "DELIVERED").length,
    };
  }, [items]);

  const del = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/packages/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Falha");
    },
    onSuccess: () => {
      toast.success("Encomenda removida");
      qc.invalidateQueries({ queryKey: ["packages"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const notify = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/packages/${id}/notify`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Falha");
      return json as { sent: number; preview: string };
    },
    onSuccess: (data) => {
      toast.success(`Notificação enviada para ${data.sent} morador(es)`, {
        description: data.preview,
      });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  function copyLink(pkg: Package) {
    const url = `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/p/${pkg.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado", { description: url });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-3">
        <Tabs value={status} onValueChange={(v) => setStatus(v as typeof status)} className="w-full lg:w-auto">
          <TabsList>
            <TabsTrigger value="PENDING">Abertos {counts.PENDING > 0 && <Badge className="ml-2">{counts.PENDING}</Badge>}</TabsTrigger>
            <TabsTrigger value="DELIVERED">Finalizados</TabsTrigger>
            <TabsTrigger value="ALL">Tudo</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden />
          <Input
            placeholder="Buscar por portador, tracking, código ou unidade"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
        <Button onClick={() => setCreating(true)} className="gap-2">
          <Plus className="size-3.5" aria-hidden /> Registrar
        </Button>
      </div>

      {isLoading ? (
        <CardListSkeleton />
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center space-y-3">
          <PackageIcon className="size-8 mx-auto text-muted-foreground" aria-hidden />
          <h3 className="font-semibold">Nenhuma encomenda</h3>
          <p className="text-sm text-muted-foreground">
            {status === "PENDING"
              ? "Quando uma encomenda chegar, registre aqui."
              : "Nenhum resultado para o filtro atual."}
          </p>
          <Button onClick={() => setCreating(true)}>Registrar encomenda</Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              onNotify={() => notify.mutate(pkg.id)}
              onDeliver={() => setDelivering(pkg)}
              onDelete={() => {
                if (confirm("Excluir esta encomenda?")) del.mutate(pkg.id);
              }}
              onCopyLink={() => copyLink(pkg)}
              notifying={notify.isPending && notify.variables === pkg.id}
            />
          ))}
        </div>
      )}

      {creating && (
        <CreatePackageDialog
          onClose={() => setCreating(false)}
          onSaved={() => qc.invalidateQueries({ queryKey: ["packages"] })}
        />
      )}

      {delivering && (
        <DeliverDialog
          pkg={delivering}
          onClose={() => setDelivering(null)}
          onSaved={() => qc.invalidateQueries({ queryKey: ["packages"] })}
        />
      )}
    </div>
  );
}

function PackageCard({
  pkg,
  onNotify,
  onDeliver,
  onDelete,
  onCopyLink,
  notifying,
}: {
  pkg: Package;
  onNotify: () => void;
  onDeliver: () => void;
  onDelete: () => void;
  onCopyLink: () => void;
  notifying: boolean;
}) {
  const typeLabels = {
    PACKAGE: "Encomenda",
    FAST_DELIVERY: "Delivery",
    VISITOR: "Visitante",
  };
  const typeIcons = {
    PACKAGE: PackageIcon,
    FAST_DELIVERY: Truck,
    VISITOR: UserCheck,
  };
  const Icon = typeIcons[pkg.deliveryType];
  const isDelivered = pkg.status === "DELIVERED";
  const dateToShow = isDelivered && pkg.deliveryDate ? pkg.deliveryDate : pkg.arrivalDate;

  return (
    <article
      className={`rounded-xl border bg-card p-4 flex flex-col sm:flex-row gap-4 transition-colors ${
        isDelivered ? "opacity-80" : ""
      }`}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div
          className={`grid size-11 place-items-center rounded-lg shrink-0 ${
            isDelivered
              ? "bg-muted text-muted-foreground"
              : "bg-primary/10 text-primary"
          }`}
        >
          <Icon className="size-5" aria-hidden />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{unitLabel(pkg.residence)}</span>
            <Badge variant={isDelivered ? "secondary" : "default"}>{typeLabels[pkg.deliveryType]}</Badge>
            {isDelivered && (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="size-3" aria-hidden /> Retirado
              </Badge>
            )}
            {pkg.pickupCode && !isDelivered && (
              <code className="text-[11px] font-mono bg-muted px-1.5 py-0.5 rounded">
                {pkg.pickupCode}
              </code>
            )}
          </div>
          <div className="text-sm text-muted-foreground truncate">
            {pkg.courier ?? "Portador não informado"}
            {pkg.trackingCode && (
              <>
                {" · "}
                <code className="text-[11px]">{pkg.trackingCode}</code>
              </>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {isDelivered && pkg.deliveredTo && (
              <>
                Retirado por <span className="font-medium text-foreground">{pkg.deliveredTo}</span>{" · "}
              </>
            )}
            {formatDistanceToNow(new Date(dateToShow), { addSuffix: true, locale: ptBR })}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 self-start sm:self-center shrink-0">
        {!isDelivered && (
          <>
            <Button size="sm" variant="outline" onClick={onNotify} disabled={notifying} className="gap-1.5">
              {notifying ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <Bell className="size-3.5" aria-hidden />
              )}
              Notificar
            </Button>
            <Button size="sm" onClick={onDeliver} className="gap-1.5">
              <CheckCircle2 className="size-3.5" aria-hidden />
              Finalizar
            </Button>
          </>
        )}
        <Button size="icon-sm" variant="ghost" onClick={onCopyLink} aria-label="Copiar link">
          <LinkIcon className="size-3.5" aria-hidden />
        </Button>
        <Button size="icon-sm" variant="ghost" onClick={onDelete} aria-label="Excluir">
          <Trash2 className="size-3.5" aria-hidden />
        </Button>
      </div>
    </article>
  );
}

function CreatePackageDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { data: residences = [] } = useQuery({ queryKey: ["residences"], queryFn: fetchResidences });
  const [photo, setPhoto] = useState<string | null>(null);
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<CreateData>({
    resolver: zodResolver(createSchema),
    defaultValues: { deliveryType: "PACKAGE" },
  });

  async function submit(data: CreateData) {
    try {
      let photoUrl: string | null = null;
      if (photo) photoUrl = await uploadDataUrl(photo, "packages");
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}`+"/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          residenceId: data.residenceId,
          deliveryType: data.deliveryType,
          courier: data.courier || null,
          trackingCode: data.trackingCode || null,
          deliveryPhoto: photoUrl,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Falha");
      toast.success("Encomenda registrada");
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar encomenda</DialogTitle>
          <DialogDescription>Selecione a unidade e registre os detalhes.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="pkg-unit">Unidade</Label>
            <Select value={watch("residenceId") ?? ""} onValueChange={(v) => setValue("residenceId", v ?? "", { shouldValidate: true })}>
              <SelectTrigger id="pkg-unit">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {residences.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {unitLabel(r)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.residenceId && <p className="text-sm text-destructive">{errors.residenceId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="pkg-type">Tipo</Label>
            <Select value={watch("deliveryType")} onValueChange={(v) => setValue("deliveryType", (v ?? "PACKAGE") as CreateData["deliveryType"])}>
              <SelectTrigger id="pkg-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PACKAGE">Encomenda</SelectItem>
                <SelectItem value="FAST_DELIVERY">Delivery rápido</SelectItem>
                <SelectItem value="VISITOR">Visitante</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="pkg-courier">Portador</Label>
              <Input id="pkg-courier" {...register("courier")} placeholder="Correios, iFood..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pkg-track">Código</Label>
              <Input id="pkg-track" {...register("trackingCode")} placeholder="BR123..." />
            </div>
          </div>

          <CameraCapture label="Foto da chegada (opcional)" value={photo} onChange={setPhoto} />

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

function DeliverDialog({
  pkg,
  onClose,
  onSaved,
}: {
  pkg: Package;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [photo, setPhoto] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<DeliverData>({
    resolver: zodResolver(deliverSchema),
    defaultValues: { deliveredTo: pkg.residence.residents[0]?.name ?? "" },
  });

  async function submit(data: DeliverData) {
    try {
      if (!photo) {
        toast.error("Captura obrigatória da foto de retirada");
        return;
      }
      const photoUrl = await uploadDataUrl(photo, "packages");
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/packages/${pkg.id}/deliver`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveredTo: data.deliveredTo, releasePhoto: photoUrl }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Falha");
      toast.success("Retirada confirmada");
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Finalizar retirada</DialogTitle>
          <DialogDescription>
            Unidade {unitLabel(pkg.residence)} · Foto obrigatória.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="dlv-name">Nome de quem retirou</Label>
            <Input id="dlv-name" {...register("deliveredTo")} aria-invalid={!!errors.deliveredTo} />
            {errors.deliveredTo && <p className="text-sm text-destructive">{errors.deliveredTo.message}</p>}
          </div>

          <CameraCapture label="Foto da retirada *" value={photo} onChange={setPhoto} />

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting || !photo}>
              {isSubmitting && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
              Confirmar retirada
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
