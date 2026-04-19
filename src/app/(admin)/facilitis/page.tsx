import { FacilitisView } from "@/components/features/facilitis-view";

export default function FacilitisPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Facilitis</h1>
        <p className="text-muted-foreground">
          Agenda de manutenções, colaboradores e acompanhamento de serviços.
        </p>
      </div>
      <FacilitisView />
    </div>
  );
}
