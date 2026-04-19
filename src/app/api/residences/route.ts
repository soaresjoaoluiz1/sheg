import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isErrorResponse, requireCondo, requireSession } from "@/lib/api-helpers";

const createSchema = z.object({
  block: z.string().optional().nullable(),
  tower: z.string().optional().nullable(),
  number: z.string().min(1, "Número obrigatório"),
});

export async function GET() {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;
  const condoId = await requireCondo();
  if (isErrorResponse(condoId)) return condoId;

  const items = await db.residence.findMany({
    where: { condoId },
    orderBy: [{ block: "asc" }, { tower: "asc" }, { number: "asc" }],
    include: {
      _count: { select: { residents: true, packages: true } },
    },
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
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const residence = await db.residence.create({
    data: {
      condoId,
      block: parsed.data.block || null,
      tower: parsed.data.tower || null,
      number: parsed.data.number,
    },
  });
  return NextResponse.json({ residence }, { status: 201 });
}
