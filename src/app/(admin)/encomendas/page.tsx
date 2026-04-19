import { EncomendasView } from "@/components/features/encomendas-view";

export default function EncomendasPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Encomendas</h1>
        <p className="text-muted-foreground">
          Registro de chegada, notificação WhatsApp e finalização com foto.
        </p>
      </div>
      <EncomendasView />
    </div>
  );
}
