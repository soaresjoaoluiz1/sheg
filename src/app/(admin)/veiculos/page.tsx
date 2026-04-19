import { VeiculosView } from "@/components/features/veiculos-view";

export default function VeiculosPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Veículos</h1>
        <p className="text-muted-foreground">
          Cadastro por unidade com modelo, placa e fotos.
        </p>
      </div>
      <VeiculosView />
    </div>
  );
}
