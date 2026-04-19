"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, FileDown, Package, Calendar } from "lucide-react";
import { toast } from "sonner";
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
import { generateDeliveriesPDF, type DeliveryReport } from "@/lib/deliveries-pdf";

type Condo = { id: string; name: string };

async function fetchCondos(): Promise<Condo[]> {
  const res = await fetch("/api/condominiums");
  if (!res.ok) return [];
  return (await res.json()).items;
}

export function RelatoriosView() {
  const { data: condos = [] } = useQuery({ queryKey: ["condominiums"], queryFn: fetchCondos });
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [condoId, setCondoId] = useState<string>("");
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<DeliveryReport | null>(null);

  async function load() {
    if (!condoId) {
      toast.error("Selecione um condomínio");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ condoId, from, to });
      const res = await fetch(`/api/reports/deliveries?${params}`);
      if (!res.ok) throw new Error("Falha");
      const json = (await res.json()) as DeliveryReport;
      setPreview(json);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
    finally { setLoading(false); }
  }

  function exportPdf() {
    if (!preview) return;
    const blob = generateDeliveriesPDF(preview);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-entregas-${preview.condo.name.replace(/\s+/g, "-").toLowerCase()}-${from}_${to}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("PDF gerado");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-5 grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto] items-end">
        <div className="space-y-2">
          <Label htmlFor="r-condo">Condomínio</Label>
          <Select value={condoId} onValueChange={(v) => setCondoId(v ?? "")}>
            <SelectTrigger id="r-condo"><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {condos.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="r-from">De</Label>
          <Input id="r-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="r-to">Até</Label>
          <Input id="r-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button onClick={load} disabled={loading} className="gap-2 h-9">
          {loading ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Calendar className="size-3.5" aria-hidden />}
          Gerar
        </Button>
      </div>

      {preview && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Total" value={preview.totals.total} />
            <Stat label="Aguardando" value={preview.totals.pending} />
            <Stat label="Entregues" value={preview.totals.delivered} />
            <Stat label="Encomendas" value={preview.totals.byType.PACKAGE} />
            <Stat label="Delivery" value={preview.totals.byType.FAST_DELIVERY} />
            <Stat label="Visitantes" value={preview.totals.byType.VISITOR} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {preview.packages.length} registro(s) em {preview.condo.name}
            </p>
            <Button onClick={exportPdf} className="gap-2">
              <FileDown className="size-3.5" aria-hidden /> Exportar PDF
            </Button>
          </div>

          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Data</th>
                    <th className="px-4 py-3 font-medium">Unidade</th>
                    <th className="px-4 py-3 font-medium">Tipo</th>
                    <th className="px-4 py-3 font-medium">Portador</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Retirado por</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.packages.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Sem registros no período</td></tr>
                  ) : (
                    preview.packages.map((p) => (
                      <tr key={p.id} className="border-t hover:bg-muted/30">
                        <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(p.arrivalDate).toLocaleString("pt-BR")}</td>
                        <td className="px-4 py-3 font-medium">{[p.residence.block, p.residence.tower !== p.residence.block ? p.residence.tower : null, p.residence.number].filter(Boolean).join(" · ")}</td>
                        <td className="px-4 py-3 text-xs">{p.deliveryType}</td>
                        <td className="px-4 py-3 text-xs">{p.courier ?? "—"}</td>
                        <td className="px-4 py-3 text-xs">{p.status}</td>
                        <td className="px-4 py-3 text-xs">{p.deliveredTo ?? "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!preview && !loading && (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <Package className="size-8 mx-auto text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground mt-2">
            Selecione um condomínio e período para gerar o relatório.
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
