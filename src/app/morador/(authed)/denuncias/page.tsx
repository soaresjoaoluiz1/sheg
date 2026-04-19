import { MoradorDenunciasView } from "@/components/features/morador-denuncias-view";

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-6 space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Denúncias</h1>
        <p className="text-sm text-muted-foreground">Suas denúncias enviadas e o status delas.</p>
      </div>
      <MoradorDenunciasView />
    </div>
  );
}
