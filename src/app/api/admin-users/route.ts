import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { requireMaster } from "@/lib/rbac";
import { isErrorResponse } from "@/lib/api-helpers";

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().optional(),
  role: z.enum(["ADMIN", "SINDICO", "RONDA", "ADVOGADO"]).default("ADMIN"),
  isMaster: z.boolean().optional(),
  condoIds: z.array(z.string()).optional(),
});

export async function GET() {
  const session = await requireMaster();
  if (isErrorResponse(session)) return session;

  const items = await db.adminUser.findMany({
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isMaster: true,
      condoId: true,
      createdAt: true,
      condominiums: { select: { condominiumId: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await requireMaster();
  if (isErrorResponse(session)) return session;

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const condoIds = parsed.data.condoIds ?? [];

  try {
    const user = await db.adminUser.create({
      data: {
        email: parsed.data.email.toLowerCase(),
        passwordHash,
        fullName: parsed.data.fullName || null,
        role: parsed.data.role,
        isMaster: parsed.data.isMaster ?? false,
        condoId: condoIds[0] ?? null,
        condominiums: { create: condoIds.map((c) => ({ condominiumId: c })) },
      },
    });
    return NextResponse.json({ user: { id: user.id, email: user.email } }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message.includes("Unique")) {
      return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 409 });
    }
    return NextResponse.json({ error: "Falha ao criar" }, { status: 500 });
  }
}
