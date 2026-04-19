import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isErrorResponse, notFound, requireCondo, requireSession } from "@/lib/api-helpers";
import { deleteUploadedFile } from "@/lib/upload";

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;
  const condoId = await requireCondo();
  if (isErrorResponse(condoId)) return condoId;

  const { id } = await ctx.params;
  const existing = await db.notice.findFirst({ where: { id, condoId } });
  if (!existing) return notFound("Aviso não encontrado");

  await db.notice.delete({ where: { id } });
  await deleteUploadedFile(existing.photoUrl);
  return NextResponse.json({ ok: true });
}
