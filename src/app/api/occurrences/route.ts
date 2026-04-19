import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isErrorResponse, requireCondo, requireSession } from "@/lib/api-helpers";

const createSchema = z.object({
  title: z.string().min(2, "Título obrigatório"),
  description: z.string().min(2, "Descrição obrigatória"),
  complainantName: z.string().optional().nullable(),
  complainantUnit: z.string().optional().nullable(),
  offenderResidenceId: z.string().optional().nullable(),
  offenderUnit: z.string().optional().nullable(),
  photo: z.string().optional().nullable(),
});

export async function GET(request: Request) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;
  const condoId = await requireCondo();
  if (isErrorResponse(condoId)) return condoId;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const items = await db.occurrence.findMany({
    where: {
      condoId,
      ...(status && status !== "ALL" ? { status } : {}),
    },
    include: {
      offenderResidence: { select: { id: true, block: true, tower: true, number: true } },
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
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  let offenderUnit = parsed.data.offenderUnit ?? null;
  if (parsed.data.offenderResidenceId && !offenderUnit) {
    const r = await db.residence.findFirst({
      where: { id: parsed.data.offenderResidenceId, condoId },
    });
    if (r) {
      const parts = [r.block, r.tower && r.tower !== r.block ? r.tower : null, r.number].filter(Boolean);
      offenderUnit = parts.join(" · ");
    }
  }

  const occurrence = await db.occurrence.create({
    data: {
      condoId,
      title: parsed.data.title,
      description: parsed.data.description,
      complainantName: parsed.data.complainantName || null,
      complainantUnit: parsed.data.complainantUnit || null,
      offenderResidenceId: parsed.data.offenderResidenceId || null,
      offenderUnit,
      photo: parsed.data.photo || null,
      status: "OPEN",
    },
  });
  return NextResponse.json({ occurrence }, { status: 201 });
}
