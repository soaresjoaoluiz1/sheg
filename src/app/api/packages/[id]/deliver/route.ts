import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isErrorResponse, notFound, requireCondo, requireSession } from "@/lib/api-helpers";

const deliverSchema = z.object({
  deliveredTo: z.string().min(2, "Nome de quem retirou é obrigatório"),
  releasePhoto: z.string().min(1, "Foto da retirada é obrigatória"),
});

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;
  const condoId = await requireCondo();
  if (isErrorResponse(condoId)) return condoId;

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = deliverSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await db.package.findFirst({ where: { id, condoId } });
  if (!existing) return notFound("Encomenda não encontrada");
  if (existing.status === "DELIVERED") {
    return NextResponse.json({ error: "Encomenda já foi retirada" }, { status: 409 });
  }

  const pkg = await db.package.update({
    where: { id },
    data: {
      status: "DELIVERED",
      deliveryDate: new Date(),
      deliveredTo: parsed.data.deliveredTo,
      releasePhoto: parsed.data.releasePhoto,
    },
  });
  return NextResponse.json({ package: pkg });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;
  const condoId = await requireCondo();
  if (isErrorResponse(condoId)) return condoId;

  const { id } = await ctx.params;
  const existing = await db.package.findFirst({ where: { id, condoId } });
  if (!existing) return notFound("Encomenda não encontrada");

  const pkg = await db.package.update({
    where: { id },
    data: {
      status: "PENDING",
      deliveryDate: null,
      deliveredTo: null,
      releasePhoto: null,
    },
  });
  return NextResponse.json({ package: pkg });
}
