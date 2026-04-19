"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Loader2,
  Trash2,
  Pencil,
  Store,
  Tag,
  Package,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

type Category = { id: string; name: string; icon: string | null; sortOrder: number };

type Product = { id: string; name: string; description: string | null; price: number | null };

type Advertiser = {
  id: string;
  name: string;
  categoryId: string | null;
  category: Category | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  description: string | null;
  active: boolean;
  coverImage: string | null;
  logo: string | null;
  deliveryMode: "delivery" | "pickup" | "both";
  deliveryFee: number | null;
  minOrder: number | null;
  products: Product[];
};

const categorySchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  icon: z.string().optional(),
  sortOrder: z.number().int().optional(),
});
type CategoryForm = z.infer<typeof categorySchema>;

const advertiserSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  categoryId: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  deliveryMode: z.enum(["delivery", "pickup", "both"]),
  deliveryFee: z.string().optional(),
  minOrder: z.string().optional(),
});
type AdvertiserForm = z.infer<typeof advertiserSchema>;

const productSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  description: z.string().optional(),
  price: z.string().optional(),
});
type ProductForm = z.infer<typeof productSchema>;

async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}`+"/api/ad-categories");
  if (!res.ok) throw new Error("Falha");
  return (await res.json()).items;
}

async function fetchAdvertisers(): Promise<Advertiser[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}`+"/api/advertisers");
  if (!res.ok) throw new Error("Falha");
  return (await res.json()).items;
}

export function AnunciantesView() {
  return (
    <Tabs defaultValue="advertisers">
      <TabsList>
        <TabsTrigger value="advertisers">Anunciantes</TabsTrigger>
        <TabsTrigger value="categories">Categorias</TabsTrigger>
      </TabsList>
      <TabsContent value="advertisers" className="mt-6"><AdvertisersTab /></TabsContent>
      <TabsContent value="categories" className="mt-6"><CategoriesTab /></TabsContent>
    </Tabs>
  );
}

function CategoriesTab() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const { data: items = [], isLoading } = useQuery({ queryKey: ["ad-categories"], queryFn: fetchCategories });

  const del = useMutation({
    mutationFn: async (id: string) => { await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/ad-categories/${id}`, { method: "DELETE" }); },
    onSuccess: () => { toast.success("Removido"); qc.invalidateQueries({ queryKey: ["ad-categories"] }); },
  });

  return (
    <div className="space-y-4">
      <Button onClick={() => setCreating(true)} className="gap-2">
        <Plus className="size-3.5" aria-hidden /> Nova categoria
      </Button>

      {isLoading ? (
        <div className="py-8 flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" aria-hidden /> Carregando...</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center space-y-3">
          <Tag className="size-8 mx-auto text-muted-foreground" aria-hidden />
          <h3 className="font-semibold">Nenhuma categoria</h3>
          <Button onClick={() => setCreating(true)}>Nova categoria</Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <article key={c.id} className="rounded-xl border bg-card p-4 flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary text-xl">
                {c.icon ?? "🏷"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{c.name}</div>
                <div className="text-xs text-muted-foreground">Ordem #{c.sortOrder}</div>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => setEditing(c)} aria-label="Editar"><Pencil className="size-3.5" aria-hidden /></Button>
              <Button variant="ghost" size="icon-sm" onClick={() => { if (confirm("Excluir?")) del.mutate(c.id); }} aria-label="Excluir"><Trash2 className="size-3.5" aria-hidden /></Button>
            </article>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <CategoryFormDialog category={editing} onClose={() => { setCreating(false); setEditing(null); }} onSaved={() => qc.invalidateQueries({ queryKey: ["ad-categories"] })} />
      )}
    </div>
  );
}

function CategoryFormDialog({ category, onClose, onSaved }: { category: Category | null; onClose: () => void; onSaved: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: category?.name ?? "", icon: category?.icon ?? "", sortOrder: category?.sortOrder ?? 0 },
  });

  async function submit(data: CategoryForm) {
    try {
      const res = await fetch(category ? `/api/ad-categories/${category.id}` : "/api/ad-categories", {
        method: category ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name, icon: data.icon || null, sortOrder: Number(data.sortOrder) || 0 }),
      });
      if (!res.ok) throw new Error("Falha");
      toast.success(category ? "Atualizado" : "Categoria criada");
      onSaved(); onClose();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          <DialogDescription>Categorias agrupam os anunciantes do marketplace.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="cat-name">Nome</Label>
            <Input id="cat-name" {...register("name")} aria-invalid={!!errors.name} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cat-icon">Ícone (emoji ou nome)</Label>
              <Input id="cat-icon" {...register("icon")} placeholder="🍕 ou pizza" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-order">Ordem</Label>
              <Input id="cat-order" type="number" {...register("sortOrder", { valueAsNumber: true })} />
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

function AdvertisersTab() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Advertiser | null>(null);
  const [productsOf, setProductsOf] = useState<Advertiser | null>(null);
  const { data: items = [], isLoading } = useQuery({ queryKey: ["advertisers"], queryFn: fetchAdvertisers });

  const del = useMutation({
    mutationFn: async (id: string) => { await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/advertisers/${id}`, { method: "DELETE" }); },
    onSuccess: () => { toast.success("Removido"); qc.invalidateQueries({ queryKey: ["advertisers"] }); },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/advertisers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["advertisers"] }),
  });

  return (
    <div className="space-y-4">
      <Button onClick={() => setCreating(true)} className="gap-2">
        <Plus className="size-3.5" aria-hidden /> Novo anunciante
      </Button>

      {isLoading ? (
        <div className="py-8 flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" aria-hidden /> Carregando...</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center space-y-3">
          <Store className="size-8 mx-auto text-muted-foreground" aria-hidden />
          <h3 className="font-semibold">Nenhum anunciante</h3>
          <Button onClick={() => setCreating(true)}>Novo anunciante</Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <article key={a.id} className="rounded-xl border bg-card overflow-hidden flex flex-col">
              {a.coverImage && <img src={a.coverImage} alt="" className="w-full aspect-video object-cover" />}
              <div className="p-4 space-y-2 flex-1">
                <div className="flex items-start gap-3">
                  {a.logo ? (
                    <img src={a.logo} alt="" className="size-12 rounded-lg border object-cover shrink-0" />
                  ) : (
                    <div className="size-12 rounded-lg bg-muted grid place-items-center text-muted-foreground shrink-0"><Store className="size-5" aria-hidden /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{a.name}</h3>
                      {!a.active && <Badge variant="secondary">Inativo</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {a.category?.name ?? "Sem categoria"} · {a.deliveryMode}
                    </div>
                  </div>
                </div>
                {a.description && <p className="text-sm text-muted-foreground line-clamp-2">{a.description}</p>}
                <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
                  {a.products.length > 0 && <span>{a.products.length} produto(s)</span>}
                  {a.deliveryFee !== null && <span>Taxa R$ {a.deliveryFee.toFixed(2)}</span>}
                  {a.minOrder !== null && <span>Mín R$ {a.minOrder.toFixed(2)}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 border-t px-2 py-1">
                <Button variant="ghost" size="sm" onClick={() => setProductsOf(a)} className="gap-1.5">
                  <Package className="size-3.5" aria-hidden />Produtos
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => toggle.mutate({ id: a.id, active: !a.active })} aria-label="Ativar/desativar">
                  {a.active ? <ToggleRight className="size-4 text-primary" aria-hidden /> : <ToggleLeft className="size-4 text-muted-foreground" aria-hidden />}
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => setEditing(a)} aria-label="Editar"><Pencil className="size-3.5" aria-hidden /></Button>
                <Button variant="ghost" size="icon-sm" onClick={() => { if (confirm("Excluir?")) del.mutate(a.id); }} aria-label="Excluir" className="ml-auto"><Trash2 className="size-3.5" aria-hidden /></Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <AdvertiserFormDialog advertiser={editing} onClose={() => { setCreating(false); setEditing(null); }} onSaved={() => qc.invalidateQueries({ queryKey: ["advertisers"] })} />
      )}

      {productsOf && (
        <ProductsDialog advertiser={productsOf} onClose={() => setProductsOf(null)} onSaved={() => qc.invalidateQueries({ queryKey: ["advertisers"] })} />
      )}
    </div>
  );
}

function AdvertiserFormDialog({ advertiser, onClose, onSaved }: { advertiser: Advertiser | null; onClose: () => void; onSaved: () => void }) {
  const { data: categories = [] } = useQuery({ queryKey: ["ad-categories"], queryFn: fetchCategories });
  const [logo, setLogo] = useState<string | null>(advertiser?.logo ?? null);
  const [cover, setCover] = useState<string | null>(advertiser?.coverImage ?? null);
  const [photoDirty, setPhotoDirty] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<AdvertiserForm>({
    resolver: zodResolver(advertiserSchema),
    defaultValues: {
      name: advertiser?.name ?? "",
      categoryId: advertiser?.categoryId ?? "",
      phone: advertiser?.phone ?? "",
      whatsapp: advertiser?.whatsapp ?? "",
      email: advertiser?.email ?? "",
      website: advertiser?.website ?? "",
      address: advertiser?.address ?? "",
      description: advertiser?.description ?? "",
      deliveryMode: (advertiser?.deliveryMode ?? "both") as AdvertiserForm["deliveryMode"],
      deliveryFee: advertiser?.deliveryFee != null ? String(advertiser.deliveryFee) : "",
      minOrder: advertiser?.minOrder != null ? String(advertiser.minOrder) : "",
    },
  });

  async function submit(data: AdvertiserForm) {
    try {
      let logoUrl = advertiser?.logo ?? null;
      let coverUrl = advertiser?.coverImage ?? null;
      if (photoDirty) {
        if (logo?.startsWith("data:")) logoUrl = await uploadDataUrl(logo, "misc");
        else logoUrl = logo;
        if (cover?.startsWith("data:")) coverUrl = await uploadDataUrl(cover, "misc");
        else coverUrl = cover;
      }

      const payload = {
        ...data,
        categoryId: data.categoryId || null,
        deliveryFee: data.deliveryFee ? Number(data.deliveryFee) : null,
        minOrder: data.minOrder ? Number(data.minOrder) : null,
        logo: logoUrl,
        coverImage: coverUrl,
      };

      const res = await fetch(advertiser ? `/api/advertisers/${advertiser.id}` : "/api/advertisers", {
        method: advertiser ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Falha");
      toast.success(advertiser ? "Atualizado" : "Anunciante criado");
      onSaved(); onClose();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{advertiser ? "Editar anunciante" : "Novo anunciante"}</DialogTitle>
          <DialogDescription>Dados públicos exibidos no portal do morador.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1" noValidate>
          <div className="space-y-2">
            <Label htmlFor="adv-name">Nome</Label>
            <Input id="adv-name" {...register("name")} aria-invalid={!!errors.name} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="adv-cat">Categoria</Label>
              <Select value={watch("categoryId") ?? ""} onValueChange={(v) => setValue("categoryId", v ?? "")}>
                <SelectTrigger id="adv-cat"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="adv-mode">Modo de entrega</Label>
              <Select value={watch("deliveryMode")} onValueChange={(v) => setValue("deliveryMode", (v ?? "both") as AdvertiserForm["deliveryMode"])}>
                <SelectTrigger id="adv-mode"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Entrega + Retirada</SelectItem>
                  <SelectItem value="delivery">Apenas entrega</SelectItem>
                  <SelectItem value="pickup">Apenas retirada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="adv-phone">Telefone</Label>
              <Input id="adv-phone" {...register("phone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adv-wa">WhatsApp</Label>
              <Input id="adv-wa" {...register("whatsapp")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="adv-email">E-mail</Label>
              <Input id="adv-email" {...register("email")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adv-site">Site</Label>
              <Input id="adv-site" {...register("website")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="adv-addr">Endereço</Label>
            <Input id="adv-addr" {...register("address")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="adv-desc">Descrição</Label>
            <textarea id="adv-desc" {...register("description")} rows={3} className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-y focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="adv-fee">Taxa de entrega (R$)</Label>
              <Input id="adv-fee" type="number" step="0.01" {...register("deliveryFee")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adv-min">Pedido mínimo (R$)</Label>
              <Input id="adv-min" type="number" step="0.01" {...register("minOrder")} />
            </div>
          </div>
          <CameraCapture label="Logo" value={logo} onChange={(v) => { setLogo(v); setPhotoDirty(true); }} />
          <CameraCapture label="Capa" value={cover} onChange={(v) => { setCover(v); setPhotoDirty(true); }} />
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

function ProductsDialog({ advertiser, onClose, onSaved }: { advertiser: Advertiser; onClose: () => void; onSaved: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
  });

  async function submit(data: ProductForm) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}`+"/api/advertiser-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          advertiserId: advertiser.id,
          name: data.name,
          description: data.description || null,
          price: data.price ? Number(data.price) : null,
        }),
      });
      if (!res.ok) throw new Error("Falha");
      toast.success("Produto adicionado");
      reset();
      qc.invalidateQueries({ queryKey: ["advertisers"] });
      onSaved();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
  }

  const del = useMutation({
    mutationFn: async (id: string) => { await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/advertiser-products/${id}`, { method: "DELETE" }); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["advertisers"] }); onSaved(); },
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Produtos · {advertiser.name}</DialogTitle>
          <DialogDescription>Catálogo do anunciante exibido no portal do morador.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_120px_auto] gap-2 items-end border-b pb-4">
          <div className="space-y-1">
            <Label htmlFor="p-name">Nome</Label>
            <Input id="p-name" {...register("name")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="p-desc">Descrição</Label>
            <Input id="p-desc" {...register("description")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="p-price">Preço (R$)</Label>
            <Input id="p-price" type="number" step="0.01" {...register("price")} />
          </div>
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            {isSubmitting ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Plus className="size-3.5" aria-hidden />}
            Adicionar
          </Button>
        </form>
        <div className="space-y-2 max-h-[40vh] overflow-y-auto">
          {advertiser.products.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Nenhum produto cadastrado.</p>
          ) : (
            advertiser.products.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{p.name}</div>
                  {p.description && <div className="text-xs text-muted-foreground truncate">{p.description}</div>}
                </div>
                <div className="font-mono text-sm tabular-nums">
                  {p.price !== null ? `R$ ${p.price.toFixed(2)}` : "—"}
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => del.mutate(p.id)} aria-label="Excluir">
                  <Trash2 className="size-3.5" aria-hidden />
                </Button>
              </div>
            ))
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
