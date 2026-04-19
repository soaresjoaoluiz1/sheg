import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isErrorResponse, notFound, requireCondo, requireSession } from "@/lib/api-helpers";
import { deleteUploadedFile } from "@/lib/upload";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  whatsapp: z.string().optional().nullable(),
  photo: z.string().optional().nullable(),
  rg: z.string().optional().nullable(),
  cpf: z.string().optional().nullable(),
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

  const existing = await db.resident.findFirst({ where: { id, condoId } });
  if (!existing) return notFound("Morador não encontrado");

  const resident = await db.resident.update({
    where: { id },
    data: {
      name: parsed.data.name,
      whatsapp: parsed.data.whatsapp ?? undefined,
      photo: parsed.data.photo ?? undefined,
      rg: parsed.data.rg ?? undefined,
      cpf: parsed.data.cpf ?? undefined,
    },
  });
  return NextResponse.json({ resident });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;
  const condoId = await requireCondo();
  if (isErrorResponse(condoId)) return condoId;

  const { id } = await ctx.params;
  const existing = await db.resident.findFirst({ where: { id, condoId } });
  if (!existing) return notFound("Morador não encontrado");

  await db.resident.delete({ where: { id } });
  await deleteUploadedFile(existing.photo);
  return NextResponse.json({ ok: true });
}
