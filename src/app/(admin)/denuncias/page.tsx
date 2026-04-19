import { DenunciasView } from "@/components/features/denuncias-view";

export default function DenunciasPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Denúncias</h1>
        <p className="text-muted-foreground">
          Workflow de status e notas administrativas para denúncias de moradores.
        </p>
      </div>
      <DenunciasView />
    </div>
  );
}
