import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isErrorResponse, notFound, requireCondo, requireSession } from "@/lib/api-helpers";
import { enqueueWhatsApp, dispatchOne } from "@/lib/whatsapp";

export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;
  const condoId = await requireCondo();
  if (isErrorResponse(condoId)) return condoId;

  const { id } = await ctx.params;
  const occurrence = await db.occurrence.findFirst({
    where: { id, condoId },
    include: {
      condominium: true,
      offenderResidence: { include: { residents: true } },
    },
  });
  if (!occurrence) return notFound("Ocorrência não encontrada");
  if (!occurrence.offenderResidence) {
    return NextResponse.json({ error: "Ocorrência sem unidade infratora" }, { status: 400 });
  }

  const residents = occurrence.offenderResidence.residents.filter(
    (r): r is typeof r & { whatsapp: string } => !!r.whatsapp,
  );
  if (residents.length === 0) {
    return NextResponse.json({ error: "Nenhum morador com WhatsApp na unidade" }, { status: 400 });
  }

  const protocol = occurrence.id.substring(0, 8).toUpperCase();
  const message = `Prezado(a) morador(a) da ${occurrence.offenderUnit ?? "unidade"}, registramos a ocorrência "${occurrence.title}" (protocolo ${protocol}). Pedimos sua atenção para evitar reincidências. — ${occurrence.condominium.name}`;

  const enqueued = await Promise.all(
    residents.map((r) =>
      enqueueWhatsApp({
        condoId,
        to: r.whatsapp,
        message,
        residentId: r.id,
      }),
    ),
  );
  await Promise.all(enqueued.map((m) => (m.scheduledAt <= new Date() ? dispatchOne(m.id) : Promise.resolve())));

  await db.occurrence.update({
    where: { id: occurrence.id },
    data: { notifiedAt: new Date() },
  });

  return NextResponse.json({ enqueued: enqueued.length, protocol });
}
