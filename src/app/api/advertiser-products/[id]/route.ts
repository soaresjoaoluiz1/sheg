import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isErrorResponse, notFound, requireSession } from "@/lib/api-helpers";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  price: z.number().nullable().optional(),
});

export async function PUT(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const existing = await db.advertiserProduct.findUnique({ where: { id } });
  if (!existing) return notFound("Produto não encontrado");

  const product = await db.advertiserProduct.update({
    where: { id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? undefined,
      price: parsed.data.price,
    },
  });
  return NextResponse.json({ product });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;

  const { id } = await ctx.params;
  await db.advertiserProduct.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
