import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { MapaView } from "@/components/features/mapa-view";

export default async function MapaPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.isMaster) redirect("/dashboard");

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Mapa de presença</h1>
        <p className="text-muted-foreground">
          Cidades onde o sistema está ativo. Geocoding via OpenStreetMap.
        </p>
      </div>
      <MapaView />
    </div>
  );
}
