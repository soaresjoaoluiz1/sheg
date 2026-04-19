import { MoradorMarketplaceView } from "@/components/features/morador-marketplace-view";

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-6 space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Marketplace</h1>
        <p className="text-sm text-muted-foreground">Anunciantes parceiros do seu condomínio.</p>
      </div>
      <MoradorMarketplaceView />
    </div>
  );
}
