"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Store, ShoppingCart, Plus, Minus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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

type Category = { id: string; name: string; icon: string | null };
type Product = { id: string; name: string; description: string | null; price: number | null };
type Advertiser = {
  id: string;
  name: string;
  logo: string | null;
  coverImage: string | null;
  description: string | null;
  category: Category | null;
  products: Product[];
  deliveryMode: string;
  deliveryFee: number | null;
  minOrder: number | null;
};

interface MarketResponse {
  advertisers: Advertiser[];
  categories: Category[];
}

async function fetchMarket(): Promise<MarketResponse> {
  const res = await fetch("/api/morador/marketplace");
  if (!res.ok) throw new Error("Falha");
  return await res.json();
}

export function MoradorMarketplaceView() {
  const [selectedCat, setSelectedCat] = useState<string>("ALL");
  const [openShop, setOpenShop] = useState<Advertiser | null>(null);
  const { data, isLoading } = useQuery({ queryKey: ["morador-market"], queryFn: fetchMarket });

  const advertisers = data?.advertisers ?? [];
  const categories = data?.categories ?? [];
  const filtered = selectedCat === "ALL" ? advertisers : advertisers.filter((a) => a.category?.id === selectedCat);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => setSelectedCat("ALL")}
          className={`shrink-0 rounded-full px-3 py-1.5 text-sm border transition-colors ${
            selectedCat === "ALL" ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"
          }`}
        >
          Tudo
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCat(c.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm border transition-colors ${
              selectedCat === c.id ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"
            }`}
          >
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-8 flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" aria-hidden /> Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center space-y-2">
          <Store className="size-8 mx-auto text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">Nenhum anunciante nesta categoria.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((a) => (
            <button key={a.id} onClick={() => setOpenShop(a)} className="text-left rounded-xl border bg-card overflow-hidden hover:border-primary/40 hover:bg-primary/5 transition-colors">
              {a.coverImage && <img src={a.coverImage} alt="" className="w-full aspect-video object-cover" />}
              <div className="p-4 flex items-start gap-3">
                {a.logo ? (
                  <img src={a.logo} alt="" className="size-12 rounded-lg border object-cover shrink-0" />
                ) : (
                  <div className="size-12 rounded-lg bg-muted grid place-items-center text-muted-foreground shrink-0"><Store className="size-5" aria-hidden /></div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{a.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{a.category?.name ?? "—"}</div>
                  {a.deliveryFee !== null && <div className="text-xs text-muted-foreground mt-1">Taxa R$ {a.deliveryFee.toFixed(2)}</div>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {openShop && <ShopDialog shop={openShop} onClose={() => setOpenShop(null)} />}
    </div>
  );
}

function ShopDialog({ shop, onClose }: { shop: Advertiser; onClose: () => void }) {
  const qc = useQueryClient();
  const [cart, setCart] = useState<Map<string, number>>(new Map());

  function add(id: string) { setCart((p) => new Map(p).set(id, (p.get(id) ?? 0) + 1)); }
  function remove(id: string) {
    setCart((p) => {
      const next = new Map(p);
      const cur = next.get(id) ?? 0;
      if (cur <= 1) next.delete(id);
      else next.set(id, cur - 1);
      return next;
    });
  }

  const cartItems = useMemo(() => {
    return Array.from(cart.entries()).map(([id, qty]) => {
      const p = shop.products.find((x) => x.id === id)!;
      return { product: p, qty, subtotal: (p?.price ?? 0) * qty };
    });
  }, [cart, shop.products]);
  const total = cartItems.reduce((acc, i) => acc + i.subtotal, 0);

  const submit = useMutation({
    mutationFn: async () => {
      const items = cartItems.map((i) => ({
        productName: i.product.name,
        quantity: i.qty,
        itemTotal: i.subtotal,
      }));
      const res = await fetch("/api/morador/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          advertiserId: shop.id,
          deliveryMode: "delivery",
          items,
          total: total + (shop.deliveryFee ?? 0),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Falha");
    },
    onSuccess: () => {
      toast.success("Pedido enviado!");
      qc.invalidateQueries({ queryKey: ["morador-market"] });
      setCart(new Map());
      onClose();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{shop.name}</DialogTitle>
          <DialogDescription>
            {shop.deliveryFee !== null && `Taxa R$ ${shop.deliveryFee.toFixed(2)}`}
            {shop.minOrder !== null && ` · Mín R$ ${shop.minOrder.toFixed(2)}`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {shop.products.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Sem produtos cadastrados.</p>
          ) : (
            shop.products.map((p) => {
              const qty = cart.get(p.id) ?? 0;
              return (
                <div key={p.id} className="rounded-lg border p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{p.name}</div>
                    {p.description && <div className="text-xs text-muted-foreground truncate">{p.description}</div>}
                    {p.price !== null && <div className="text-sm font-mono tabular-nums mt-1">R$ {p.price.toFixed(2)}</div>}
                  </div>
                  {qty === 0 ? (
                    <Button size="sm" variant="outline" onClick={() => add(p.id)} className="gap-1.5">
                      <Plus className="size-3.5" aria-hidden /> Adicionar
                    </Button>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Button size="icon-sm" variant="outline" onClick={() => remove(p.id)} aria-label="Remover"><Minus className="size-3.5" aria-hidden /></Button>
                      <span className="font-mono text-sm w-6 text-center">{qty}</span>
                      <Button size="icon-sm" variant="outline" onClick={() => add(p.id)} aria-label="Adicionar"><Plus className="size-3.5" aria-hidden /></Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <ShoppingCart className="size-4 text-primary" aria-hidden />
              <span className="font-medium">Carrinho</span>
              <Button size="icon-xs" variant="ghost" onClick={() => setCart(new Map())} aria-label="Limpar carrinho" className="ml-auto">
                <Trash2 className="size-3" aria-hidden />
              </Button>
            </div>
            {cartItems.map((i) => (
              <div key={i.product.id} className="flex items-center justify-between text-xs">
                <span>{i.qty}× {i.product.name}</span>
                <span className="font-mono">R$ {i.subtotal.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t pt-1 font-medium">
              <span>Total {shop.deliveryFee ? "(c/ taxa)" : ""}</span>
              <span className="font-mono">R$ {(total + (shop.deliveryFee ?? 0)).toFixed(2)}</span>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => submit.mutate()} disabled={cartItems.length === 0 || submit.isPending}>
            {submit.isPending && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
            Fazer pedido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
