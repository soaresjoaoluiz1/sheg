import { LembretesView } from "@/components/features/lembretes-view";

export default function LembretesPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Lembretes automáticos</h1>
        <p className="text-muted-foreground">
          O sistema cobra o morador automaticamente quando uma encomenda fica parada.
        </p>
      </div>
      <LembretesView />
    </div>
  );
}
