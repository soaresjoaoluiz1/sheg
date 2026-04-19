import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isErrorResponse, notFound, requireCondo, requireSession } from "@/lib/api-helpers";
import { deleteUploadedFile } from "@/lib/upload";

const updateSchema = z.object({
  courier: z.string().optional().nullable(),
  trackingCode: z.string().optional().nullable(),
  deliveryPhoto: z.string().optional().nullable(),
});

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;
  const condoId = await requireCondo();
  if (isErrorResponse(condoId)) return condoId;

  const { id } = await ctx.params;
  const pkg = await db.package.findFirst({
    where: { id, condoId },
    include: {
      residence: {
        include: { residents: true },
      },
    },
  });
  if (!pkg) return notFound("Encomenda não encontrada");
  return NextResponse.json({ package: pkg });
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

  const existing = await db.package.findFirst({ where: { id, condoId } });
  if (!existing) return notFound("Encomenda não encontrada");

  const pkg = await db.package.update({
    where: { id },
    data: {
      courier: parsed.data.courier ?? undefined,
      trackingCode: parsed.data.trackingCode ?? undefined,
      deliveryPhoto: parsed.data.deliveryPhoto ?? undefined,
    },
  });
  return NextResponse.json({ package: pkg });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;
  const condoId = await requireCondo();
  if (isErrorResponse(condoId)) return condoId;

  const { id } = await ctx.params;
  const existing = await db.package.findFirst({ where: { id, condoId } });
  if (!existing) return notFound("Encomenda não encontrada");

  await db.package.delete({ where: { id } });
  await Promise.all([
    deleteUploadedFile(existing.deliveryPhoto),
    deleteUploadedFile(existing.releasePhoto),
  ]);
  return NextResponse.json({ ok: true });
}
