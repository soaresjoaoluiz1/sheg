import { Package, Users, Home, Bell, TrendingUp } from "lucide-react";
import { getActiveCondoId } from "@/lib/tenant";
import { db } from "@/lib/db";

export default async function DashboardPage() {
  const condoId = await getActiveCondoId();

  const [packagesPending, packagesTotal, residencesCount, residentsCount] = await Promise.all([
    condoId ? db.package.count({ where: { condoId, status: "PENDING" } }) : 0,
    condoId ? db.package.count({ where: { condoId } }) : 0,
    condoId ? db.residence.count({ where: { condoId } }) : 0,
    condoId ? db.resident.count({ where: { condoId } }) : 0,
  ]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-10 space-y-10">
      <div className="space-y-2">
        <h1 className="font-heading text-4xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-lg">
          Visão geral da operação. Use o menu lateral ou <kbd className="font-mono text-xs bg-white/[0.06] border border-white/10 rounded px-1.5 py-0.5">Ctrl K</kbd> para navegar.
        </p>
      </div>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={Package} label="Encomendas em aberto" value={packagesPending} hint="Aguardando retirada" />
        <MetricCard icon={TrendingUp} label="Encomendas totais" value={packagesTotal} hint="Histórico completo" />
        <MetricCard icon={Home} label="Unidades" value={residencesCount} hint="Cadastradas" />
        <MetricCard icon={Users} label="Moradores" value={residentsCount} hint="Ativos" />
      </section>

      <section className="bento-card space-y-4">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-2xl bg-neon/10 text-neon">
            <Bell className="size-6" aria-hidden />
          </div>
          <div>
            <h2 className="font-heading font-semibold text-lg">Sistema operacional</h2>
            <p className="text-sm text-muted-foreground">
              24 telas ativas, 80+ endpoints, WhatsApp mock configurável via /whatsapp.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: number | string;
  hint: string;
}) {
  return (
    <div className="bento-card space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="grid size-9 place-items-center rounded-xl bg-white/[0.05] text-neon">
          <Icon className="size-4" aria-hidden />
        </div>
      </div>
      <div className="font-heading text-4xl font-bold tracking-tight tabular-nums">{value}</div>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </div>
  );
}
