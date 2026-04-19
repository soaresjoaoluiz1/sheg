import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isErrorResponse, requireCondo, requireSession } from "@/lib/api-helpers";

const createSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(2),
  reporterName: z.string().optional().nullable(),
  reporterPhone: z.string().optional().nullable(),
  reporterBlock: z.string().optional().nullable(),
  reporterTower: z.string().optional().nullable(),
  reporterUnit: z.string().optional().nullable(),
  targetResidentName: z.string().optional().nullable(),
  targetBlock: z.string().optional().nullable(),
  targetTower: z.string().optional().nullable(),
  targetUnit: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
});

export async function GET(request: Request) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;
  const condoId = await requireCondo();
  if (isErrorResponse(condoId)) return condoId;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const items = await db.complaint.findMany({
    where: {
      condoId,
      ...(status && status !== "ALL" ? { status } : {}),
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

  const complaint = await db.complaint.create({
    data: {
      condoId,
      status: "aberta",
      title: parsed.data.title,
      description: parsed.data.description,
      reporterName: parsed.data.reporterName || null,
      reporterPhone: parsed.data.reporterPhone || null,
      reporterBlock: parsed.data.reporterBlock || null,
      reporterTower: parsed.data.reporterTower || null,
      reporterUnit: parsed.data.reporterUnit || null,
      targetResidentName: parsed.data.targetResidentName || null,
      targetBlock: parsed.data.targetBlock || null,
      targetTower: parsed.data.targetTower || null,
      targetUnit: parsed.data.targetUnit || null,
      photoUrl: parsed.data.photoUrl || null,
    },
  });
  return NextResponse.json({ complaint }, { status: 201 });
}
