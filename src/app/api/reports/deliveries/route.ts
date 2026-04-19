import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isErrorResponse, requireSession } from "@/lib/api-helpers";

export async function GET(request: Request) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;

  const url = new URL(request.url);
  const condoId = url.searchParams.get("condoId");
  const fromStr = url.searchParams.get("from");
  const toStr = url.searchParams.get("to");

  if (!condoId) return NextResponse.json({ error: "condoId obrigatório" }, { status: 400 });

  const from = fromStr ? new Date(fromStr) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const to = toStr ? new Date(toStr) : new Date();

  const condo = await db.condominium.findUnique({ where: { id: condoId } });
  if (!condo) return NextResponse.json({ error: "Condomínio não encontrado" }, { status: 404 });

  const packages = await db.package.findMany({
    where: {
      condoId,
      arrivalDate: { gte: from, lte: to },
    },
    include: {
      residence: { select: { block: true, tower: true, number: true } },
    },
    orderBy: { arrivalDate: "desc" },
  });

  const totals = {
    total: packages.length,
    pending: packages.filter((p) => p.status === "PENDING").length,
    delivered: packages.filter((p) => p.status === "DELIVERED").length,
    byType: {
      PACKAGE: packages.filter((p) => p.deliveryType === "PACKAGE").length,
      FAST_DELIVERY: packages.filter((p) => p.deliveryType === "FAST_DELIVERY").length,
      VISITOR: packages.filter((p) => p.deliveryType === "VISITOR").length,
    },
  };

  return NextResponse.json({
    condo: { id: condo.id, name: condo.name },
    period: { from: from.toISOString(), to: to.toISOString() },
    totals,
    packages,
  });
}
