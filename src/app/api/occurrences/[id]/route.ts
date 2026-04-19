import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isErrorResponse, notFound, requireCondo, requireSession } from "@/lib/api-helpers";
import { deleteUploadedFile } from "@/lib/upload";

const updateSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  adminResponse: z.string().optional().nullable(),
  photo: z.string().optional().nullable(),
});

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;
  const condoId = await requireCondo();
  if (isErrorResponse(condoId)) return condoId;

  const { id } = await ctx.params;
  const item = await db.occurrence.findFirst({
    where: { id, condoId },
    include: {
      offenderResidence: {
        include: { residents: true },
      },
    },
  });
  if (!item) return notFound("Ocorrência não encontrada");
  return NextResponse.json({ occurrence: item });
}

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

  const existing = await db.occurrence.findFirst({ where: { id, condoId } });
  if (!existing) return notFound("Ocorrência não encontrada");

  const occurrence = await db.occurrence.update({
    where: { id },
    data: {
      status: parsed.data.status,
      title: parsed.data.title,
      description: parsed.data.description,
      adminResponse: parsed.data.adminResponse ?? undefined,
      photo: parsed.data.photo ?? undefined,
    },
  });
  return NextResponse.json({ occurrence });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;
  const condoId = await requireCondo();
  if (isErrorResponse(condoId)) return condoId;

  const { id } = await ctx.params;
  const existing = await db.occurrence.findFirst({ where: { id, condoId } });
  if (!existing) return notFound("Ocorrência não encontrada");

  await db.occurrence.delete({ where: { id } });
  await deleteUploadedFile(existing.photo);
  return NextResponse.json({ ok: true });
}
