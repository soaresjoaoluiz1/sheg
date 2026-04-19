import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isErrorResponse, notFound, requireSession } from "@/lib/api-helpers";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  active: z.boolean().optional(),
});

export async function PUT(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const existing = await db.facilitisCollaborator.findUnique({ where: { id } });
  if (!existing) return notFound("Colaborador não encontrado");

  const collaborator = await db.facilitisCollaborator.update({
    where: { id },
    data: {
      name: parsed.data.name,
      role: parsed.data.role ?? undefined,
      phone: parsed.data.phone ?? undefined,
      email: parsed.data.email ?? undefined,
      active: parsed.data.active,
    },
  });
  return NextResponse.json({ collaborator });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;

  const { id } = await ctx.params;
  const existing = await db.facilitisCollaborator.findUnique({ where: { id } });
  if (!existing) return notFound("Colaborador não encontrado");

  await db.facilitisCollaborator.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
