"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, FileDown, Trash2, Pencil, Phone, MapPin } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

type Lead = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  role: string | null;
  contact: string | null;
  company: string | null;
  monthlyBilling: number | null;
  projectedRevenue: number | null;
  notes: string | null;
  contacted: boolean;
  stage: "prospeccao" | "contato_feito" | "qualificado" | "fechado" | "perdido";
};

const STAGES = [
  { id: "prospeccao", label: "Em prospecção", tone: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
  { id: "contato_feito", label: "Contato feito", tone: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  { id: "qualificado", label: "Qualificado", tone: "bg-violet-500/10 text-violet-700 dark:text-violet-400" },
  { id: "fechado", label: "Fechado", tone: "bg-primary/10 text-primary" },
  { id: "perdido", label: "Perdido", tone: "bg-destructive/10 text-destructive" },
] as const;

const schema = z.object({
  name: z.string().min(2),
  city: z.string().optional(),
  state: z.string().optional(),
  role: z.string().optional(),
  contact: z.string().optional(),
  company: z.string().optional(),
  monthlyBilling: z.string().optional(),
  projectedRevenue: z.string().optional(),
  stage: z.enum(["prospeccao", "contato_feito", "qualificado", "fechado", "perdido"]),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

async function fetchLeads(): Promise<Lead[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}`+"/api/leads");
  if (!res.ok) throw new Error("Falha");
  return (await res.json()).items;
}

export function LeadsView() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const { data: leads = [], isLoading } = useQuery({ queryKey: ["leads"], queryFn: fetchLeads });

  const grouped = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    for (const s of STAGES) map[s.id] = [];
    for (const l of leads) (map[l.stage] ??= []).push(l);
    return map;
  }, [leads]);

  const total = useMemo(() => leads.reduce((acc, l) => acc + (l.projectedRevenue ?? 0), 0), [leads]);

  const move = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: Lead["stage"] }) => {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/leads/${id}`, { method: "DELETE" }); },
    onSuccess: () => { toast.success("Removido"); qc.invalidateQueries({ queryKey: ["leads"] }); },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => setCreating(true)} className="gap-2">
          <Plus className="size-3.5" aria-hidden /> Novo lead
        </Button>
        <a href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/leads/export`} className="inline-flex items-center gap-2 text-sm rounded-md border bg-background hover:bg-muted px-3 h-7 transition-colors">
          <FileDown className="size-3.5" aria-hidden /> Exportar CSV
        </a>
        <span className="text-sm text-muted-foreground ml-auto">
          {leads.length} lead(s) · receita projetada R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </span>
      </div>

      {isLoading ? (
        <div className="py-8 flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" aria-hidden /> Carregando...</div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${STAGES.length}, minmax(240px, 1fr))` }}>
          {STAGES.map((s) => (
            <section key={s.id} className="rounded-xl border bg-card flex flex-col">
              <header className={`px-3 py-2 rounded-t-xl ${s.tone} flex items-center justify-between`}>
                <span className="text-xs font-semibold uppercase tracking-wider">{s.label}</span>
                <span className="text-xs font-mono">{grouped[s.id].length}</span>
              </header>
              <div className="p-2 space-y-2 flex-1 min-h-32">
                {grouped[s.id].length === 0 ? (
                  <div className="text-xs text-muted-foreground text-center py-6">Vazio</div>
                ) : (
                  grouped[s.id].map((l) => (
                    <article key={l.id} className="rounded-lg border bg-background p-3 space-y-2 group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{l.name}</div>
                          {l.company && <div className="text-xs text-muted-foreground truncate">{l.company}</div>}
                        </div>
                        {l.contacted && <Badge variant="secondary" className="text-[10px]">contato</Badge>}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {(l.city || l.state) && (
                          <span className="inline-flex items-center gap-1"><MapPin className="size-3" aria-hidden />{[l.city, l.state].filter(Boolean).join("/")}</span>
                        )}
                        {l.contact && <span className="inline-flex items-center gap-1"><Phone className="size-3" aria-hidden />{l.contact}</span>}
                      </div>
                      {l.projectedRevenue !== null && (
                        <div className="text-xs font-mono tabular-nums">R$ {l.projectedRevenue.toFixed(2)}/mês</div>
                      )}
                      <div className="flex items-center gap-1 pt-1 border-t opacity-60 group-hover:opacity-100 transition-opacity">
                        <Select value={l.stage} onValueChange={(v) => move.mutate({ id: l.id, stage: (v ?? "prospeccao") as Lead["stage"] })}>
                          <SelectTrigger className="h-6 text-[10px] flex-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {STAGES.map((st) => <SelectItem key={st.id} value={st.id}>{st.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button size="icon-xs" variant="ghost" onClick={() => setEditing(l)} aria-label="Editar"><Pencil className="size-3" aria-hidden /></Button>
                        <Button size="icon-xs" variant="ghost" onClick={() => { if (confirm("Excluir?")) del.mutate(l.id); }} aria-label="Excluir"><Trash2 className="size-3" aria-hidden /></Button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <LeadFormDialog lead={editing} onClose={() => { setCreating(false); setEditing(null); }} onSaved={() => qc.invalidateQueries({ queryKey: ["leads"] })} />
      )}
    </div>
  );
}

function LeadFormDialog({ lead, onClose, onSaved }: { lead: Lead | null; onClose: () => void; onSaved: () => void }) {
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: lead?.name ?? "",
      city: lead?.city ?? "",
      state: lead?.state ?? "",
      role: lead?.role ?? "",
      contact: lead?.contact ?? "",
      company: lead?.company ?? "",
      monthlyBilling: lead?.monthlyBilling != null ? String(lead.monthlyBilling) : "",
      projectedRevenue: lead?.projectedRevenue != null ? String(lead.projectedRevenue) : "",
      stage: (lead?.stage ?? "prospeccao") as FormData["stage"],
      notes: lead?.notes ?? "",
    },
  });

  async function submit(data: FormData) {
    try {
      const payload = {
        ...data,
        monthlyBilling: data.monthlyBilling ? Number(data.monthlyBilling) : null,
        projectedRevenue: data.projectedRevenue ? Number(data.projectedRevenue) : null,
      };
      const res = await fetch(lead ? `/api/leads/${lead.id}` : "/api/leads", {
        method: lead ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Falha");
      toast.success(lead ? "Atualizado" : "Lead criado");
      onSaved(); onClose();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{lead ? "Editar lead" : "Novo lead"}</DialogTitle>
          <DialogDescription>Comercial interno: prospecção até fechamento.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1" noValidate>
          <div className="space-y-2">
            <Label htmlFor="l-name">Nome</Label>
            <Input id="l-name" {...register("name")} aria-invalid={!!errors.name} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="l-company">Empresa</Label>
              <Input id="l-company" {...register("company")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="l-role">Função</Label>
              <Input id="l-role" {...register("role")} placeholder="Síndico, Admin..." />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="l-city">Cidade</Label>
              <Input id="l-city" {...register("city")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="l-state">UF</Label>
              <Input id="l-state" maxLength={2} {...register("state")} className="uppercase" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="l-contact">Contato</Label>
            <Input id="l-contact" {...register("contact")} placeholder="WhatsApp, e-mail..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="l-billing">Faturamento mensal (R$)</Label>
              <Input id="l-billing" type="number" step="0.01" {...register("monthlyBilling")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="l-revenue">Receita projetada (R$)</Label>
              <Input id="l-revenue" type="number" step="0.01" {...register("projectedRevenue")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="l-stage">Estágio</Label>
            <Select value={watch("stage")} onValueChange={(v) => setValue("stage", (v ?? "prospeccao") as FormData["stage"])}>
              <SelectTrigger id="l-stage"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STAGES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="l-notes">Notas</Label>
            <textarea id="l-notes" {...register("notes")} rows={3} className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-y focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none" />
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
