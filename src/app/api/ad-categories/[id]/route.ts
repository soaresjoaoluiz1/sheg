import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isErrorResponse, notFound, requireSession } from "@/lib/api-helpers";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  icon: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

export async function PUT(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const existing = await db.adCategory.findUnique({ where: { id } });
  if (!existing) return notFound("Categoria não encontrada");

  const category = await db.adCategory.update({
    where: { id },
    data: {
      name: parsed.data.name,
      icon: parsed.data.icon ?? undefined,
      sortOrder: parsed.data.sortOrder,
    },
  });
  return NextResponse.json({ category });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;

  const { id } = await ctx.params;
  await db.adCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
