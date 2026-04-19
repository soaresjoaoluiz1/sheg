"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type OrderItem = { productName: string; quantity: number; itemTotal: number };
type Order = {
  id: string;
  orderNumber: string | null;
  status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled";
  deliveryMode: string;
  block: string | null;
  unit: string | null;
  schedule: string | null;
  additionalInfo: string | null;
  items: OrderItem[];
  total: number | null;
  createdAt: string;
  advertiser: { id: string; name: string } | null;
};

const STATUS_LABELS: Record<Order["status"], string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  preparing: "Em preparo",
  ready: "Pronto",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const STATUS_VARIANTS: Record<Order["status"], "default" | "secondary" | "destructive"> = {
  pending: "default",
  confirmed: "default",
  preparing: "default",
  ready: "default",
  delivered: "secondary",
  cancelled: "destructive",
};

async function fetchOrders(status: string): Promise<Order[]> {
  const p = new URLSearchParams();
  if (status !== "ALL") p.set("status", status);
  const res = await fetch(`/api/orders?${p}`);
  if (!res.ok) throw new Error("Falha");
  return (await res.json()).items;
}

export function PedidosView() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>("ALL");
  const { data: items = [], isLoading } = useQuery({ queryKey: ["orders", status], queryFn: () => fetchOrders(status) });

  const updateStatus = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: Order["status"] }) => {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error("Falha");
    },
    onSuccess: () => { toast.success("Status atualizado"); qc.invalidateQueries({ queryKey: ["orders"] }); },
  });

  return (
    <div className="space-y-4">
      <Tabs value={status} onValueChange={setStatus}>
        <TabsList>
          <TabsTrigger value="ALL">Tudo</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="preparing">Em preparo</TabsTrigger>
          <TabsTrigger value="ready">Prontos</TabsTrigger>
          <TabsTrigger value="delivered">Entregues</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="py-8 flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" aria-hidden /> Carregando...</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center space-y-3">
          <ShoppingBag className="size-8 mx-auto text-muted-foreground" aria-hidden />
          <h3 className="font-semibold">Nenhum pedido</h3>
          <p className="text-sm text-muted-foreground">Pedidos enviados pelo portal do morador aparecem aqui.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((o) => (
            <article key={o.id} className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">Pedido {o.orderNumber ?? `#${o.id.substring(0, 6)}`}</h3>
                    <Badge variant={STATUS_VARIANTS[o.status]}>{STATUS_LABELS[o.status]}</Badge>
                    <Badge variant="secondary">{o.deliveryMode}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {o.advertiser?.name ?? "Anunciante removido"}
                    {(o.block || o.unit) && ` · Unidade ${[o.block, o.unit].filter(Boolean).join(" ")}`}
                    {" · "}
                    {format(new Date(o.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {o.total !== null && (
                    <div className="font-mono font-semibold tabular-nums">R$ {o.total.toFixed(2)}</div>
                  )}
                  <Select value={o.status} onValueChange={(v) => updateStatus.mutate({ id: o.id, next: (v ?? "pending") as Order["status"] })}>
                    <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {o.items.length > 0 && (
                <ul className="text-sm divide-y">
                  {o.items.map((it, i) => (
                    <li key={i} className="py-1.5 flex items-center justify-between gap-2">
                      <span>{it.quantity}× {it.productName}</span>
                      <span className="font-mono tabular-nums text-muted-foreground">R$ {it.itemTotal.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              )}

              {(o.schedule || o.additionalInfo) && (
                <div className="text-xs text-muted-foreground rounded-md bg-muted/40 p-2">
                  {o.schedule && <div><strong>Horário:</strong> {o.schedule}</div>}
                  {o.additionalInfo && <div><strong>Obs:</strong> {o.additionalInfo}</div>}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
