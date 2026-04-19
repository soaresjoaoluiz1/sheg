import { MoradoresView } from "@/components/features/moradores-view";

export default function MoradoresPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Moradores</h1>
        <p className="text-muted-foreground">
          Cadastro de moradores por unidade com foto e contato de WhatsApp.
        </p>
      </div>
      <MoradoresView />
    </div>
  );
}
