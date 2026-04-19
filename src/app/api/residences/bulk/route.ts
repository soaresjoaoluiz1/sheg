import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isErrorResponse, requireCondo, requireSession } from "@/lib/api-helpers";

const bulkSchema = z.object({
  items: z
    .array(
      z.object({
        block: z.string().optional().nullable(),
        tower: z.string().optional().nullable(),
        number: z.string().min(1),
      }),
    )
    .min(1)
    .max(2000),
  replace: z.boolean().optional(),
});

export async function PUT(request: Request) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;
  const condoId = await requireCondo();
  if (isErrorResponse(condoId)) return condoId;

  const body = await request.json().catch(() => null);
  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const created = await db.$transaction(async (tx) => {
    if (parsed.data.replace) {
      await tx.residence.deleteMany({ where: { condoId } });
    }
    await tx.residence.createMany({
      data: parsed.data.items.map((r) => ({
        condoId,
        block: r.block || null,
        tower: r.tower || null,
        number: r.number,
      })),
    });
    return tx.residence.count({ where: { condoId } });
  });

  return NextResponse.json({ total: created });
}
