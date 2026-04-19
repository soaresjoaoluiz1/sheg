import { ReincidenciaView } from "@/components/features/reincidencia-view";

export default function ReincidenciaPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Análise de reincidência</h1>
        <p className="text-muted-foreground">
          Agrupamento de ocorrências por unidade infratora nos últimos 365 dias.
        </p>
      </div>
      <ReincidenciaView />
    </div>
  );
}
