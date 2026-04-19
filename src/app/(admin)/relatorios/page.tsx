import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { RelatoriosView } from "@/components/features/relatorios-view";

export default async function RelatoriosPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground">
          Relatórios em PDF de entregas por condomínio e período.
        </p>
      </div>
      <RelatoriosView />
    </div>
  );
}
