import { MoradorEncomendasView } from "@/components/features/morador-encomendas-view";

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-6 space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Minhas encomendas</h1>
        <p className="text-sm text-muted-foreground">Histórico e status de retirada.</p>
      </div>
      <MoradorEncomendasView />
    </div>
  );
}
