import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isErrorResponse, requireCondo, requireSession } from "@/lib/api-helpers";

const createSchema = z.object({
  residenceId: z.string().min(1),
  model: z.string().optional().nullable(),
  year: z.string().optional().nullable(),
  plate: z.string().optional().nullable(),
  platePhoto: z.string().optional().nullable(),
  vehiclePhoto: z.string().optional().nullable(),
});

export async function GET(request: Request) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;
  const condoId = await requireCondo();
  if (isErrorResponse(condoId)) return condoId;

  const url = new URL(request.url);
  const residenceId = url.searchParams.get("residenceId");
  const q = url.searchParams.get("q")?.trim();

  const items = await db.vehicle.findMany({
    where: {
      condoId,
      ...(residenceId ? { residenceId } : {}),
      ...(q
        ? {
            OR: [
              { plate: { contains: q } },
              { model: { contains: q } },
              { year: { contains: q } },
            ],
          }
        : {}),
    },
    include: {
      residence: { select: { id: true, block: true, tower: true, number: true } },
    },
    orderBy: { createdAt: "desc" },
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
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const residence = await db.residence.findFirst({ where: { id: parsed.data.residenceId, condoId } });
  if (!residence) return NextResponse.json({ error: "Unidade não encontrada" }, { status: 404 });

  const vehicle = await db.vehicle.create({
    data: {
      condoId,
      residenceId: parsed.data.residenceId,
      model: parsed.data.model || null,
      year: parsed.data.year || null,
      plate: parsed.data.plate || null,
      platePhoto: parsed.data.platePhoto || null,
      vehiclePhoto: parsed.data.vehiclePhoto || null,
    },
  });
  return NextResponse.json({ vehicle }, { status: 201 });
}
