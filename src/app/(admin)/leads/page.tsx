import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LeadsView } from "@/components/features/leads-view";

export default async function LeadsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.isMaster) redirect("/dashboard");

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
        <p className="text-muted-foreground">CRM comercial: kanban por estágio com export CSV.</p>
      </div>
      <LeadsView />
    </div>
  );
}
