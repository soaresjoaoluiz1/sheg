import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isErrorResponse, notFound, requireCondo, requireSession } from "@/lib/api-helpers";

const updateSchema = z.object({
  block: z.string().optional().nullable(),
  tower: z.string().optional().nullable(),
  number: z.string().min(1).optional(),
});

export async function PUT(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;
  const condoId = await requireCondo();
  if (isErrorResponse(condoId)) return condoId;

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await db.residence.findFirst({ where: { id, condoId } });
  if (!existing) return notFound("Unidade não encontrada");

  const residence = await db.residence.update({
    where: { id },
    data: {
      block: parsed.data.block ?? undefined,
      tower: parsed.data.tower ?? undefined,
      number: parsed.data.number ?? undefined,
    },
  });
  return NextResponse.json({ residence });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;
  const condoId = await requireCondo();
  if (isErrorResponse(condoId)) return condoId;

  const { id } = await ctx.params;
  const existing = await db.residence.findFirst({ where: { id, condoId } });
  if (!existing) return notFound("Unidade não encontrada");

  await db.residence.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
