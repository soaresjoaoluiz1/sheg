"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Package as PackageIcon, Truck, UserCheck, CheckCircle2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Pkg = {
  id: string;
  status: "PENDING" | "DELIVERED";
  deliveryType: "PACKAGE" | "FAST_DELIVERY" | "VISITOR";
  courier: string | null;
  pickupCode: string | null;
  arrivalDate: string;
  deliveryDate: string | null;
  deliveredTo: string | null;
};

const TYPE = {
  PACKAGE: { label: "Encomenda", icon: PackageIcon },
  FAST_DELIVERY: { label: "Delivery", icon: Truck },
  VISITOR: { label: "Visitante", icon: UserCheck },
} as const;

async function fetchPackages(status: string): Promise<Pkg[]> {
  const p = new URLSearchParams();
  if (status !== "ALL") p.set("status", status);
  const res = await fetch(`/api/morador/packages?${p}`);
  if (!res.ok) throw new Error("Falha");
  return (await res.json()).items;
}

export function MoradorEncomendasView() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<"PENDING" | "DELIVERED" | "ALL">("PENDING");
  const { data: items = [], isLoading } = useQuery({ queryKey: ["morador-packages", status], queryFn: () => fetchPackages(status) });

  const confirmPickup = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/morador/packages/${id}/confirm`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Falha");
    },
    onSuccess: () => { toast.success("Retirada confirmada!"); qc.invalidateQueries({ queryKey: ["morador-packages"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  return (
    <div className="space-y-3">
      <Tabs value={status} onValueChange={(v) => setStatus(v as typeof status)}>
        <TabsList>
          <TabsTrigger value="PENDING">Aguardando</TabsTrigger>
          <TabsTrigger value="DELIVERED">Retiradas</TabsTrigger>
          <TabsTrigger value="ALL">Tudo</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="py-8 flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" aria-hidden /> Carregando...</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center space-y-2">
          <PackageIcon className="size-8 mx-auto text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">Sem encomendas neste filtro.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((p) => {
            const t = TYPE[p.deliveryType];
            const Icon = t.icon;
            const isDelivered = p.status === "DELIVERED";
            return (
              <article key={p.id} className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className={`grid size-10 place-items-center rounded-lg shrink-0 ${isDelivered ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
                    <Icon className="size-5" aria-hidden />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{t.label}</span>
                      {isDelivered ? (
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle2 className="size-3" aria-hidden /> Retirada
                        </Badge>
                      ) : (
                        <Badge>Aguardando</Badge>
                      )}
                      {p.pickupCode && !isDelivered && (
                        <code className="text-[11px] font-mono bg-muted px-1.5 py-0.5 rounded">{p.pickupCode}</code>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">{p.courier ?? "Portador não informado"}</div>
                    <div className="text-xs text-muted-foreground">
                      {isDelivered && p.deliveredTo && <>Retirado por {p.deliveredTo} · </>}
                      {formatDistanceToNow(new Date(isDelivered && p.deliveryDate ? p.deliveryDate : p.arrivalDate), { addSuffix: true, locale: ptBR })}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <a href={`/p/${p.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs rounded-md border bg-background hover:bg-muted px-3 h-7 transition-colors">
                    <ExternalLink className="size-3" aria-hidden /> Ver detalhes
                  </a>
                  {!isDelivered && (
                    <Button
                      size="sm"
                      onClick={() => { if (window.confirm("Confirmar retirada?")) confirmPickup.mutate(p.id); }}
                      disabled={confirmPickup.isPending}
                      className="gap-1.5"
                    >
                      <CheckCircle2 className="size-3.5" aria-hidden />
                      Já retirei
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
