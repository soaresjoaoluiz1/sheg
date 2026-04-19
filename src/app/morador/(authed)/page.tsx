import Link from "next/link";
import { Package, Megaphone, Store, Flag } from "lucide-react";
import { db } from "@/lib/db";
import { getMoradorSession } from "@/lib/morador-auth";

export default async function MoradorHomePage() {
  const session = await getMoradorSession();
  if (!session) return null;

  const [pending, notices, advertisers] = await Promise.all([
    db.package.count({ where: { residenceId: session.residenceId, status: "PENDING" } }),
    db.notice.count({ where: { condoId: session.condoId } }),
    db.advertiser.count({
      where: { active: true, condos: { some: { condominiumId: session.condoId } } },
    }),
  ]);

  const tiles = [
    { href: "/morador/encomendas", icon: Package, label: "Encomendas", value: pending, hint: "aguardando retirada" },
    { href: "/morador/avisos", icon: Megaphone, label: "Avisos", value: notices, hint: "comunicados" },
    { href: "/morador/marketplace", icon: Store, label: "Lojas", value: advertisers, hint: "anunciantes ativos" },
    { href: "/morador/denuncias", icon: Flag, label: "Denúncias", value: 0, hint: "registrar" },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-6 space-y-6">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Bem-vindo</p>
        <h1 className="text-2xl font-bold tracking-tight">{session.name}</h1>
      </div>

      <section className="grid grid-cols-2 gap-3">
        {tiles.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="rounded-xl border bg-card p-5 hover:border-primary/40 hover:bg-primary/5 transition-colors"
          >
            <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary mb-3">
              <t.icon className="size-5" aria-hidden />
            </div>
            <div className="text-3xl font-semibold tracking-tight tabular-nums">{t.value}</div>
            <div className="text-sm font-medium">{t.label}</div>
            <div className="text-xs text-muted-foreground">{t.hint}</div>
          </Link>
        ))}
      </section>
    </div>
  );
}
