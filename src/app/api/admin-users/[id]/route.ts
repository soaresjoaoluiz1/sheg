import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { requireMaster } from "@/lib/rbac";
import { isErrorResponse, notFound } from "@/lib/api-helpers";

const updateSchema = z.object({
  email: z.string().email().optional(),
  fullName: z.string().optional().nullable(),
  role: z.enum(["ADMIN", "SINDICO", "RONDA", "ADVOGADO"]).optional(),
  isMaster: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

export async function PUT(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireMaster();
  if (isErrorResponse(session)) return session;

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const existing = await db.adminUser.findUnique({ where: { id } });
  if (!existing) return notFound("Usuário não encontrado");

  const data: {
    email?: string;
    fullName?: string | null;
    role?: string;
    isMaster?: boolean;
    passwordHash?: string;
  } = {
    email: parsed.data.email?.toLowerCase(),
    fullName: parsed.data.fullName ?? undefined,
    role: parsed.data.role,
    isMaster: parsed.data.isMaster,
  };
  if (parsed.data.password) {
    data.passwordHash = await hashPassword(parsed.data.password);
  }

  const user = await db.adminUser.update({
    where: { id },
    data,
    select: { id: true, email: true, fullName: true, role: true, isMaster: true },
  });
  return NextResponse.json({ user });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireMaster();
  if (isErrorResponse(session)) return session;

  const { id } = await ctx.params;
  if (id === session.sub) return NextResponse.json({ error: "Não é possível excluir você mesmo" }, { status: 400 });

  const existing = await db.adminUser.findUnique({ where: { id } });
  if (!existing) return notFound("Usuário não encontrado");

  await db.adminUser.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
