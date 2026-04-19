import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isErrorResponse, notFound, requireSession } from "@/lib/api-helpers";

const patchSchema = z.object({
  active: z.boolean().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const existing = await db.mapPin.findUnique({ where: { id } });
  if (!existing) return notFound("Pino não encontrado");

  const pin = await db.mapPin.update({
    where: { id },
    data: { active: parsed.data.active, lat: parsed.data.lat, lng: parsed.data.lng },
  });
  return NextResponse.json({ pin });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;

  const { id } = await ctx.params;
  await db.mapPin.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
