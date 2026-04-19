"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, Megaphone } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { Badge } from "@/components/ui/badge";

type Notice = {
  id: string;
  title: string;
  body: string;
  photoUrl: string | null;
  targetType: string;
  targetId: string | null;
  createdByName: string | null;
  createdAt: string;
};

async function fetchNotices(): Promise<Notice[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}`+"/api/morador/notices");
  if (!res.ok) throw new Error("Falha");
  return (await res.json()).items;
}

export function MoradorAvisosView() {
  const { data: items = [], isLoading } = useQuery({ queryKey: ["morador-notices"], queryFn: fetchNotices });

  if (isLoading) {
    return <div className="py-8 flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" aria-hidden /> Carregando...</div>;
  }
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center space-y-2">
        <Megaphone className="size-8 mx-auto text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">Nenhum aviso publicado para você.</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {items.map((n) => (
        <article key={n.id} className="rounded-xl border bg-card overflow-hidden">
          {n.photoUrl && <img src={n.photoUrl} alt="" className="w-full aspect-video object-cover" />}
          <div className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-semibold leading-tight">{n.title}</h2>
              <Badge variant="secondary" className="capitalize shrink-0">
                {n.targetType === "condo" ? "Geral" : `${n.targetType} ${n.targetId ?? ""}`}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{n.body}</p>
            <div className="text-xs text-muted-foreground pt-2 border-t">
              {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ptBR })}
              {n.createdByName && ` · por ${n.createdByName}`}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
