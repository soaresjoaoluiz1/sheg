"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Scale, AlertTriangle, CheckCircle2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type OccItem = { id: string; title: string; status: string; createdAt: string };
type Group = {
  key: string;
  offenderUnit: string | null;
  offenderResidenceId: string | null;
  count: number;
  firstAt: string;
  lastAt: string;
  occurrences: OccItem[];
};

async function fetchGroups(days: number): Promise<{ groups: Group[]; days: number }> {
  const res = await fetch(`/api/occurrences/reincidence?days=${days}`);
  if (!res.ok) throw new Error("Falha");
  return await res.json();
}

const WINDOWS = [
  { value: 30, label: "30 dias" },
  { value: 90, label: "90 dias" },
  { value: 180, label: "180 dias" },
  { value: 365, label: "365 dias" },
] as const;

export function ReincidenciaView() {
  const [days, setDays] = useState<number>(365);
  const { data, isLoading } = useQuery({
    queryKey: ["reincidence", days],
    queryFn: () => fetchGroups(days),
  });

  const groups = data?.groups ?? [];
  const recidivist = groups.filter((g) => g.count >= 2);
  const firstTimers = groups.filter((g) => g.count === 1);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm font-medium">Janela:</span>
        <Tabs value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <TabsList>
            {WINDOWS.map((w) => (
              <TabsTrigger key={w.value} value={String(w.value)}>
                {w.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          icon={AlertTriangle}
          label="Reincidentes"
          value={recidivist.length}
          hint=">= 2 ocorrências"
          tone="destructive"
        />
        <SummaryCard icon={Scale} label="Primeira ocorrência" value={firstTimers.length} hint="Unidades únicas" tone="default" />
        <SummaryCard icon={CheckCircle2} label="Ocorrências totais" value={groups.reduce((a, g) => a + g.count, 0)} hint={`Últimos ${days} dias`} tone="primary" />
      </div>

      {isLoading ? (
        <div className="py-8 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden /> Carregando...
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center space-y-3">
          <Scale className="size-8 mx-auto text-muted-foreground" aria-hidden />
          <h3 className="font-semibold">Nenhuma ocorrência no período</h3>
        </div>
      ) : (
        <div className="space-y-4">
          {recidivist.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Reincidentes
              </h2>
              {recidivist.map((g) => (
                <GroupCard key={g.key} group={g} />
              ))}
            </section>
          )}
          {firstTimers.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Primeira ocorrência
              </h2>
              {firstTimers.map((g) => (
                <GroupCard key={g.key} group={g} />
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: number;
  hint: string;
  tone: "default" | "destructive" | "primary";
}) {
  const bg = tone === "destructive" ? "bg-destructive/10 text-destructive" : tone === "primary" ? "bg-primary/10 text-primary" : "bg-muted text-foreground";
  return (
    <div className="rounded-xl border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={`grid size-8 place-items-center rounded-lg ${bg}`}>
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <div className="text-3xl font-semibold tracking-tight tabular-nums">{value}</div>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </div>
  );
}

function GroupCard({ group }: { group: Group }) {
  const label = group.offenderUnit ?? "Unidade desconhecida";
  return (
    <article className="rounded-xl border bg-card p-4 space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary font-semibold text-sm">
            {group.count}×
          </div>
          <div>
            <div className="font-semibold">{label}</div>
            <div className="text-xs text-muted-foreground">
              Primeira em {format(new Date(group.firstAt), "dd/MM/yyyy", { locale: ptBR })} ·{" "}
              Última {formatDistanceToNow(new Date(group.lastAt), { addSuffix: true, locale: ptBR })}
            </div>
          </div>
        </div>
        <Badge variant={group.count >= 2 ? "destructive" : "secondary"}>
          {group.count >= 2 ? "Reincidente" : "1ª ocorrência"}
        </Badge>
      </header>
      <ul className="text-sm divide-y">
        {group.occurrences
          .slice()
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map((oc) => (
            <li key={oc.id} className="py-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-medium">{oc.title}</div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(oc.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </div>
              </div>
              <Badge variant={oc.status === "RESOLVED" ? "secondary" : "default"}>
                {oc.status === "OPEN" ? "Aberta" : oc.status === "IN_PROGRESS" ? "Andamento" : "Resolvida"}
              </Badge>
            </li>
          ))}
      </ul>
    </article>
  );
}
