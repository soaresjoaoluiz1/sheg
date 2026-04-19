import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getMoradorSession } from "@/lib/morador-auth";
import { MoradorShell } from "@/components/morador-shell";

function unitLabel(r: { block: string | null; tower: string | null; number: string }) {
  return [r.block, r.tower && r.tower !== r.block ? r.tower : null, r.number].filter(Boolean).join(" · ");
}

export default async function MoradorAuthedLayout({ children }: { children: React.ReactNode }) {
  const session = await getMoradorSession();
  if (!session) redirect("/morador/login");

  const resident = await db.resident.findUnique({
    where: { id: session.sub },
    include: { residence: true, condominium: true },
  });
  if (!resident) redirect("/morador/login");

  return (
    <MoradorShell
      name={resident.name}
      unitLabel={unitLabel(resident.residence)}
      condoName={resident.condominium.name}
    >
      {children}
    </MoradorShell>
  );
}
