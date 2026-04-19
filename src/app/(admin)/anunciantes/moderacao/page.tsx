import { ModeracaoView } from "@/components/features/moderacao-view";

export default function ModeracaoPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Moderação de anúncios</h1>
        <p className="text-muted-foreground">
          Aprove ou bloqueie anúncios criados por anunciantes ou moradores.
        </p>
      </div>
      <ModeracaoView />
    </div>
  );
}
