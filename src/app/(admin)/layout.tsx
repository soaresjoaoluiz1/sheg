import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getActiveCondoId } from "@/lib/tenant";
import { db } from "@/lib/db";
import { AdminShell } from "@/components/admin-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const condoId = await getActiveCondoId();
  const condo = condoId ? await db.condominium.findUnique({ where: { id: condoId } }) : null;

  return (
    <AdminShell condoName={condo?.name ?? null} userEmail={session.email} isMaster={session.isMaster}>
      {children}
    </AdminShell>
  );
}
