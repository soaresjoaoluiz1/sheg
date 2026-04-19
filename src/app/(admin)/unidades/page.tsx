import { UnidadesView } from "@/components/features/unidades-view";

export default function UnidadesPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Unidades</h1>
          <p className="text-muted-foreground">
            Cadastro de blocos, torres e apartamentos do condomínio.
          </p>
        </div>
      </div>
      <UnidadesView />
    </div>
  );
}
