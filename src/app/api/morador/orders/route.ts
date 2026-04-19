import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getMoradorSession } from "@/lib/morador-auth";

const itemSchema = z.object({
  productName: z.string(),
  quantity: z.number().int().positive(),
  itemTotal: z.number(),
});

const createSchema = z.object({
  advertiserId: z.string(),
  deliveryMode: z.enum(["delivery", "pickup"]).default("delivery"),
  schedule: z.string().optional(),
  additionalInfo: z.string().optional(),
  items: z.array(itemSchema).min(1),
  total: z.number(),
});

export async function GET() {
  const session = await getMoradorSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const residence = await db.residence.findUnique({ where: { id: session.residenceId } });
  const items = await db.order.findMany({
    where: {
      condoId: session.condoId,
      block: residence?.block ?? undefined,
      unit: residence?.number ?? undefined,
    },
    include: { advertiser: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({
    items: items.map((o) => ({ ...o, items: o.items ? JSON.parse(o.items) : [] })),
  });
}

export async function POST(request: Request) {
  const session = await getMoradorSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const residence = await db.residence.findUnique({ where: { id: session.residenceId } });
  const order = await db.order.create({
    data: {
      condoId: session.condoId,
      advertiserId: parsed.data.advertiserId,
      orderNumber: `#${Date.now().toString(36).toUpperCase()}`,
      status: "pending",
      deliveryMode: parsed.data.deliveryMode,
      block: residence?.block ?? null,
      tower: residence?.tower ?? null,
      unit: residence?.number ?? null,
      schedule: parsed.data.schedule || null,
      additionalInfo: parsed.data.additionalInfo || null,
      items: JSON.stringify(parsed.data.items),
      total: parsed.data.total,
    },
  });
  return NextResponse.json({ order }, { status: 201 });
}
