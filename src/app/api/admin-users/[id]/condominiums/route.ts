import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireMaster } from "@/lib/rbac";
import { isErrorResponse, notFound } from "@/lib/api-helpers";

const putSchema = z.object({
  condoIds: z.array(z.string()),
});

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireMaster();
  if (isErrorResponse(session)) return session;

  const { id } = await ctx.params;
  const items = await db.adminUserCondominium.findMany({
    where: { adminUserId: id },
    include: { condominium: { select: { id: true, name: true } } },
  });
  return NextResponse.json({ items });
}

export async function PUT(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireMaster();
  if (isErrorResponse(session)) return session;

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const existing = await db.adminUser.findUnique({ where: { id } });
  if (!existing) return notFound("Usuário não encontrado");

  await db.$transaction([
    db.adminUserCondominium.deleteMany({ where: { adminUserId: id } }),
    db.adminUserCondominium.createMany({
      data: parsed.data.condoIds.map((c) => ({ adminUserId: id, condominiumId: c })),
    }),
    db.adminUser.update({
      where: { id },
      data: { condoId: parsed.data.condoIds[0] ?? null },
    }),
  ]);

  return NextResponse.json({ ok: true, count: parsed.data.condoIds.length });
}
