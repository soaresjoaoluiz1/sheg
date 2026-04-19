import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isErrorResponse, notFound, requireCondo, requireSession } from "@/lib/api-helpers";
import { deleteUploadedFile } from "@/lib/upload";

const patchSchema = z.object({
  status: z.enum(["aberta", "em_analise", "resolvida", "arquivada"]).optional(),
  adminNotes: z.string().optional().nullable(),
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

  const existing = await db.complaint.findFirst({ where: { id, condoId } });
  if (!existing) return notFound("Denúncia não encontrada");

  const complaint = await db.complaint.update({
    where: { id },
    data: {
      status: parsed.data.status,
      adminNotes: parsed.data.adminNotes ?? undefined,
    },
  });
  return NextResponse.json({ complaint });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;
  const condoId = await requireCondo();
  if (isErrorResponse(condoId)) return condoId;

  const { id } = await ctx.params;
  const existing = await db.complaint.findFirst({ where: { id, condoId } });
  if (!existing) return notFound("Denúncia não encontrada");

  await db.complaint.delete({ where: { id } });
  await deleteUploadedFile(existing.photoUrl);
  return NextResponse.json({ ok: true });
}
