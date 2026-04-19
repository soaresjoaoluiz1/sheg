import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isErrorResponse, requireCondo, requireSession } from "@/lib/api-helpers";

const createSchema = z.object({
  title: z.string().min(2),
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "DONE", "CANCELLED"]).default("SCHEDULED"),
  scheduledStart: z.string().optional().nullable(),
  collaborator: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(request: Request) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;
  const condoId = await requireCondo();
  if (isErrorResponse(condoId)) return condoId;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const items = await db.facilitisService.findMany({
    where: {
      condoId,
      ...(status && status !== "ALL" ? { status } : {}),
    },
    orderBy: { scheduledStart: "desc" },
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

  const service = await db.facilitisService.create({
    data: {
      condoId,
      title: parsed.data.title,
      status: parsed.data.status,
      scheduledStart: parsed.data.scheduledStart ? new Date(parsed.data.scheduledStart) : null,
      collaborator: parsed.data.collaborator || null,
      notes: parsed.data.notes || null,
    },
  });
  return NextResponse.json({ service }, { status: 201 });
}
