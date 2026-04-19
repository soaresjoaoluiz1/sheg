import { AnunciantesView } from "@/components/features/anunciantes-view";

export default function AnunciantesPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Anunciantes</h1>
        <p className="text-muted-foreground">
          Marketplace local: categorias, anunciantes e produtos.
        </p>
      </div>
      <AnunciantesView />
    </div>
  );
}
