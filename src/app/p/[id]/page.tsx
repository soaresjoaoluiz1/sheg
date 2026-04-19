import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { Package, CheckCircle2, Clock, Truck, UserCheck, Home } from "lucide-react";
import { db } from "@/lib/db";

function unitLabel(r: { block: string | null; tower: string | null; number: string }) {
  const parts = [r.block, r.tower && r.tower !== r.block ? r.tower : null, r.number].filter(Boolean);
  return parts.join(" · ");
}

export default async function PublicPackagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pkg = await db.package.findUnique({
    where: { id },
    include: {
      residence: true,
      condominium: true,
    },
  });
  if (!pkg) notFound();

  const typeLabels = {
    PACKAGE: "Encomenda",
    FAST_DELIVERY: "Entrega rápida",
    VISITOR: "Visitante",
  } as const;
  const typeIcons = {
    PACKAGE: Package,
    FAST_DELIVERY: Truck,
    VISITOR: UserCheck,
  } as const;
  const Icon = typeIcons[pkg.deliveryType as keyof typeof typeIcons];
  const isDelivered = pkg.status === "DELIVERED";

  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 h-16 flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Package className="size-4" aria-hidden />
          </div>
          <div className="leading-tight">
            <div className="font-semibold">Shegou</div>
            <div className="text-xs text-muted-foreground">{pkg.condominium.name}</div>
          </div>
        </div>
      </header>

      <div className="flex-1 mx-auto w-full max-w-2xl px-4 sm:px-6 py-8 space-y-6">
        <div
          className={`rounded-2xl border p-6 sm:p-8 ${
            isDelivered ? "bg-muted/40" : "bg-primary/5 border-primary/30"
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`grid size-12 place-items-center rounded-xl ${
                isDelivered ? "bg-muted" : "bg-primary text-primary-foreground"
              }`}
            >
              {isDelivered ? <CheckCircle2 className="size-6" aria-hidden /> : <Icon className="size-6" aria-hidden />}
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                {typeLabels[pkg.deliveryType as keyof typeof typeLabels]}
              </div>
              <h1 className="text-2xl font-bold">
                {isDelivered ? "Encomenda retirada" : "Aguarda retirada"}
              </h1>
            </div>
          </div>

          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Unidade</dt>
            <dd className="font-medium">{unitLabel(pkg.residence)}</dd>
            {pkg.courier && (
              <>
                <dt className="text-muted-foreground">Portador</dt>
                <dd>{pkg.courier}</dd>
              </>
            )}
            {pkg.pickupCode && !isDelivered && (
              <>
                <dt className="text-muted-foreground">Código</dt>
                <dd>
                  <code className="font-mono bg-muted px-2 py-0.5 rounded text-sm">{pkg.pickupCode}</code>
                </dd>
              </>
            )}
            <dt className="text-muted-foreground">Chegada</dt>
            <dd>
              {format(new Date(pkg.arrivalDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              <span className="text-muted-foreground"> ({formatDistanceToNow(new Date(pkg.arrivalDate), { addSuffix: true, locale: ptBR })})</span>
            </dd>
            {isDelivered && pkg.deliveryDate && (
              <>
                <dt className="text-muted-foreground">Retirada</dt>
                <dd>{format(new Date(pkg.deliveryDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</dd>
                <dt className="text-muted-foreground">Retirado por</dt>
                <dd className="font-medium">{pkg.deliveredTo ?? "—"}</dd>
              </>
            )}
          </dl>
        </div>

        {(pkg.deliveryPhoto || pkg.releasePhoto) && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Comprovantes
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {pkg.deliveryPhoto && (
                <figure className="rounded-xl border overflow-hidden">
                  <img src={pkg.deliveryPhoto} alt="Foto da chegada" className="w-full aspect-square object-cover" />
                  <figcaption className="p-3 text-xs text-muted-foreground flex items-center gap-2">
                    <Clock className="size-3" aria-hidden /> Chegada
                  </figcaption>
                </figure>
              )}
              {pkg.releasePhoto && (
                <figure className="rounded-xl border overflow-hidden">
                  <img src={pkg.releasePhoto} alt="Foto da retirada" className="w-full aspect-square object-cover" />
                  <figcaption className="p-3 text-xs text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="size-3" aria-hidden /> Retirada
                  </figcaption>
                </figure>
              )}
            </div>
          </section>
        )}

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <Home className="size-3.5" aria-hidden /> Voltar para a página inicial
        </Link>
      </div>
    </main>
  );
}
