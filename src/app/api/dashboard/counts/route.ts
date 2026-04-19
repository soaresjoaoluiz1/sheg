import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isErrorResponse, requireCondo, requireSession } from "@/lib/api-helpers";

export async function GET() {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;
  const condoId = await requireCondo();
  if (isErrorResponse(condoId)) return condoId;

  const [
    packagesPending,
    occurrencesOpen,
    occurrencesInProgress,
    complaintsOpen,
    ordersPending,
    messagesFailed,
    noticesRecent,
  ] = await Promise.all([
    db.package.count({ where: { condoId, status: "PENDING" } }),
    db.occurrence.count({ where: { condoId, status: "OPEN" } }),
    db.occurrence.count({ where: { condoId, status: "IN_PROGRESS" } }),
    db.complaint.count({ where: { condoId, status: "aberta" } }),
    db.order.count({ where: { condoId, status: "pending" } }),
    db.messageQueue.count({ where: { condoId, status: "FAILED" } }),
    db.notice.count({
      where: { condoId, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
  ]);

  return NextResponse.json({
    encomendas: packagesPending,
    ocorrencias: occurrencesOpen + occurrencesInProgress,
    denuncias: complaintsOpen,
    pedidos: ordersPending,
    whatsapp: messagesFailed,
    avisos: noticesRecent,
  });
}
