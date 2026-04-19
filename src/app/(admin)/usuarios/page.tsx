import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { UsuariosView } from "@/components/features/usuarios-view";

export default async function UsuariosPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.isMaster) redirect("/dashboard");

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Usuários administrativos</h1>
        <p className="text-muted-foreground">
          Master, sindico, ronda, advogado e admin com escopo de condomínios.
        </p>
      </div>
      <UsuariosView />
    </div>
  );
}
