import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isErrorResponse, requireCondo, requireSession } from "@/lib/api-helpers";

const createSchema = z.object({
  title: z.string().min(2, "Título obrigatório"),
  body: z.string().min(2, "Mensagem obrigatória"),
  photoUrl: z.string().optional().nullable(),
  targetType: z.enum(["condo", "block", "tower"]).default("condo"),
  targetId: z.string().optional().nullable(),
});

export async function GET() {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;
  const condoId = await requireCondo();
  if (isErrorResponse(condoId)) return condoId;

  const items = await db.notice.findMany({
    where: { condoId },
    orderBy: { createdAt: "desc" },
    take: 200,
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

  const notice = await db.notice.create({
    data: {
      condoId,
      title: parsed.data.title,
      body: parsed.data.body,
      photoUrl: parsed.data.photoUrl || null,
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId || null,
      createdByName: session.email,
    },
  });
  return NextResponse.json({ notice }, { status: 201 });
}
