import { AvisosView } from "@/components/features/avisos-view";

export default function AvisosPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Mural de avisos</h1>
        <p className="text-muted-foreground">
          Comunicados do condomínio com targeting por bloco ou torre.
        </p>
      </div>
      <AvisosView />
    </div>
  );
}
