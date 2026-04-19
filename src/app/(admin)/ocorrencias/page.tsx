import { OcorrenciasView } from "@/components/features/ocorrencias-view";

export default function OcorrenciasPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Ocorrências</h1>
        <p className="text-muted-foreground">
          Registre, notifique o infrator via WhatsApp e exporte protocolo em PDF.
        </p>
      </div>
      <OcorrenciasView />
    </div>
  );
}
