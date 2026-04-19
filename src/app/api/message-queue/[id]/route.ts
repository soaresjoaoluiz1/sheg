import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isErrorResponse, notFound, requireCondo, requireSession } from "@/lib/api-helpers";
import { retryMessage, updateRecipient } from "@/lib/whatsapp";

const patchSchema = z.object({
  to: z.string().min(8).optional(),
});

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;
  const condoId = await requireCondo();
  if (isErrorResponse(condoId)) return condoId;

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const msg = await db.messageQueue.findFirst({ where: { id, condoId } });
  if (!msg) return notFound("Mensagem não encontrada");

  if (parsed.data.to) await updateRecipient(id, parsed.data.to);
  return NextResponse.json({ ok: true });
}

export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;
  const condoId = await requireCondo();
  if (isErrorResponse(condoId)) return condoId;

  const { id } = await ctx.params;
  const msg = await db.messageQueue.findFirst({ where: { id, condoId } });
  if (!msg) return notFound("Mensagem não encontrada");

  const result = await retryMessage(id);
  return NextResponse.json(result);
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;
  const condoId = await requireCondo();
  if (isErrorResponse(condoId)) return condoId;

  const { id } = await ctx.params;
  const msg = await db.messageQueue.findFirst({ where: { id, condoId } });
  if (!msg) return notFound("Mensagem não encontrada");

  await db.messageQueue.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
