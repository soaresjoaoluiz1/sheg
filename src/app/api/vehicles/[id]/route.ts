import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isErrorResponse, notFound, requireCondo, requireSession } from "@/lib/api-helpers";
import { deleteUploadedFile } from "@/lib/upload";

const updateSchema = z.object({
  model: z.string().optional().nullable(),
  year: z.string().optional().nullable(),
  plate: z.string().optional().nullable(),
  platePhoto: z.string().optional().nullable(),
  vehiclePhoto: z.string().optional().nullable(),
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

  const existing = await db.vehicle.findFirst({ where: { id, condoId } });
  if (!existing) return notFound("Veículo não encontrado");

  const vehicle = await db.vehicle.update({
    where: { id },
    data: {
      model: parsed.data.model ?? undefined,
      year: parsed.data.year ?? undefined,
      plate: parsed.data.plate ?? undefined,
      platePhoto: parsed.data.platePhoto ?? undefined,
      vehiclePhoto: parsed.data.vehiclePhoto ?? undefined,
    },
  });
  return NextResponse.json({ vehicle });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;
  const condoId = await requireCondo();
  if (isErrorResponse(condoId)) return condoId;

  const { id } = await ctx.params;
  const existing = await db.vehicle.findFirst({ where: { id, condoId } });
  if (!existing) return notFound("Veículo não encontrado");

  await db.vehicle.delete({ where: { id } });
  await Promise.all([deleteUploadedFile(existing.platePhoto), deleteUploadedFile(existing.vehiclePhoto)]);
  return NextResponse.json({ ok: true });
}
