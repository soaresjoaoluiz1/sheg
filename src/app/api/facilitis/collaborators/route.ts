import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isErrorResponse, requireCondo, requireSession } from "@/lib/api-helpers";

const createSchema = z.object({
  name: z.string().min(2),
  role: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
});

export async function GET() {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;
  const condoId = await requireCondo();
  if (isErrorResponse(condoId)) return condoId;

  const items = await db.facilitisCollaborator.findMany({
    where: { condos: { some: { condominiumId: condoId } } },
    include: { condos: { select: { condominiumId: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;
  const condoId = await requireCondo();
  if (isErrorResponse(condoId)) return condoId;

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const collaborator = await db.facilitisCollaborator.create({
    data: {
      name: parsed.data.name,
      role: parsed.data.role || null,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      condos: { create: { condominiumId: condoId } },
    },
  });
  return NextResponse.json({ collaborator }, { status: 201 });
}
