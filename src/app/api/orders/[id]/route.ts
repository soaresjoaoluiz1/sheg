import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isErrorResponse, notFound, requireCondo, requireSession } from "@/lib/api-helpers";

const patchSchema = z.object({
  status: z.enum(["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"]).optional(),
});

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;
  const condoId = await requireCondo();
  if (isErrorResponse(condoId)) return condoId;

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const existing = await db.order.findFirst({ where: { id, condoId } });
  if (!existing) return notFound("Pedido não encontrado");

  const order = await db.order.update({
    where: { id },
    data: { status: parsed.data.status },
  });
  return NextResponse.json({ order });
}
