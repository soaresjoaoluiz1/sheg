import { WhatsAppView } from "@/components/features/whatsapp-view";

export default function WhatsAppPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">WhatsApp</h1>
        <p className="text-muted-foreground">
          Configuração da Evolution API, fila de mensagens e horário de bloqueio.
        </p>
      </div>
      <WhatsAppView />
    </div>
  );
}
