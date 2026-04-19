import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isErrorResponse, notFound, requireCondo, requireSession } from "@/lib/api-helpers";

const updateSchema = z.object({
  title: z.string().optional(),
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "DONE", "CANCELLED"]).optional(),
  scheduledStart: z.string().optional().nullable(),
  collaborator: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function PUT(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;
  const condoId = await requireCondo();
  if (isErrorResponse(condoId)) return condoId;

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const existing = await db.facilitisService.findFirst({ where: { id, condoId } });
  if (!existing) return notFound("Serviço não encontrado");

  const service = await db.facilitisService.update({
    where: { id },
    data: {
      title: parsed.data.title,
      status: parsed.data.status,
      scheduledStart: parsed.data.scheduledStart !== undefined
        ? parsed.data.scheduledStart ? new Date(parsed.data.scheduledStart) : null
        : undefined,
      collaborator: parsed.data.collaborator ?? undefined,
      notes: parsed.data.notes ?? undefined,
    },
  });
  return NextResponse.json({ service });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;
  const condoId = await requireCondo();
  if (isErrorResponse(condoId)) return condoId;

  const { id } = await ctx.params;
  const existing = await db.facilitisService.findFirst({ where: { id, condoId } });
  if (!existing) return notFound("Serviço não encontrado");

  await db.facilitisService.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
