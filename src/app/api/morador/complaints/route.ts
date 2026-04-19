import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getMoradorSession } from "@/lib/morador-auth";

const createSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(2),
  targetResidentName: z.string().optional(),
  targetBlock: z.string().optional(),
  targetUnit: z.string().optional(),
  photoUrl: z.string().optional().nullable(),
});

export async function GET() {
  const session = await getMoradorSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const residence = await db.residence.findUnique({ where: { id: session.residenceId } });
  const items = await db.complaint.findMany({
    where: {
      condoId: session.condoId,
      reporterName: session.name,
      reporterUnit: residence?.number ?? undefined,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await getMoradorSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const resident = await db.resident.findUnique({
    where: { id: session.sub },
    include: { residence: true },
  });
  if (!resident) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const complaint = await db.complaint.create({
    data: {
      condoId: session.condoId,
      title: parsed.data.title,
      description: parsed.data.description,
      reporterName: resident.name,
      reporterPhone: resident.whatsapp,
      reporterBlock: resident.residence.block,
      reporterTower: resident.residence.tower,
      reporterUnit: resident.residence.number,
      targetResidentName: parsed.data.targetResidentName || null,
      targetBlock: parsed.data.targetBlock || null,
      targetUnit: parsed.data.targetUnit || null,
      photoUrl: parsed.data.photoUrl || null,
      status: "aberta",
    },
  });
  return NextResponse.json({ complaint }, { status: 201 });
}
