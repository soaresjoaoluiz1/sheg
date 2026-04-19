import { PedidosView } from "@/components/features/pedidos-view";

export default function PedidosPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
        <p className="text-muted-foreground">
          Pedidos do marketplace agrupados por status.
        </p>
      </div>
      <PedidosView />
    </div>
  );
}
