import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isErrorResponse, requireCondo, requireSession } from "@/lib/api-helpers";

const createSchema = z.object({
  residenceId: z.string().min(1),
  name: z.string().min(2, "Nome obrigatório"),
  whatsapp: z.string().optional().nullable(),
  photo: z.string().optional().nullable(),
  rg: z.string().optional().nullable(),
  cpf: z.string().optional().nullable(),
});

export async function GET(request: Request) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;
  const condoId = await requireCondo();
  if (isErrorResponse(condoId)) return condoId;

  const url = new URL(request.url);
  const residenceId = url.searchParams.get("residenceId");
  const search = url.searchParams.get("q")?.trim();

  const items = await db.resident.findMany({
    where: {
      condoId,
      ...(residenceId ? { residenceId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { whatsapp: { contains: search } },
              { cpf: { contains: search } },
              { rg: { contains: search } },
            ],
          }
        : {}),
    },
    include: {
      residence: { select: { id: true, block: true, tower: true, number: true } },
    },
    orderBy: { name: "asc" },
    take: 500,
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

  const residence = await db.residence.findFirst({
    where: { id: parsed.data.residenceId, condoId },
  });
  if (!residence) {
    return NextResponse.json({ error: "Unidade não encontrada" }, { status: 404 });
  }

  const resident = await db.resident.create({
    data: {
      residenceId: parsed.data.residenceId,
      condoId,
      name: parsed.data.name,
      whatsapp: parsed.data.whatsapp || null,
      photo: parsed.data.photo || null,
      rg: parsed.data.rg || null,
      cpf: parsed.data.cpf || null,
    },
  });
  return NextResponse.json({ resident }, { status: 201 });
}
