import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isErrorResponse, notFound, requireSession } from "@/lib/api-helpers";

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  price: z.number().nullable().optional(),
  category: z.string().optional().nullable(),
  visible: z.boolean().optional(),
});

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;

  const { id } = await ctx.params;
  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  const existing = await db.adsAudit.findUnique({ where: { id } });
  if (!existing) return notFound("Anúncio não encontrado");

  if (action === "approve" || action === "block") {
    const audit = await db.adsAudit.update({
      where: { id },
      data: { visible: action === "approve" },
    });
    return NextResponse.json({ audit });
  }

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const audit = await db.adsAudit.update({
    where: { id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? undefined,
      price: parsed.data.price,
      category: parsed.data.category ?? undefined,
      visible: parsed.data.visible,
    },
  });
  return NextResponse.json({ audit });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;

  const { id } = await ctx.params;
  await db.adsAudit.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
