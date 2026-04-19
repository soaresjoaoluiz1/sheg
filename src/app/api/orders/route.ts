import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isErrorResponse, requireCondo, requireSession } from "@/lib/api-helpers";

const itemSchema = z.object({
  productName: z.string(),
  quantity: z.number().int().positive(),
  itemTotal: z.number(),
});

const createSchema = z.object({
  advertiserId: z.string().optional().nullable(),
  orderNumber: z.string().optional().nullable(),
  status: z.enum(["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"]).default("pending"),
  deliveryMode: z.enum(["delivery", "pickup"]).default("delivery"),
  tower: z.string().optional().nullable(),
  block: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  schedule: z.string().optional().nullable(),
  additionalInfo: z.string().optional().nullable(),
  items: z.array(itemSchema).optional(),
  total: z.number().optional().nullable(),
});

export async function GET(request: Request) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;
  const condoId = await requireCondo();
  if (isErrorResponse(condoId)) return condoId;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const items = await db.order.findMany({
    where: {
      condoId,
      ...(status && status !== "ALL" ? { status } : {}),
    },
    include: { advertiser: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({
    items: items.map((o) => ({
      ...o,
      items: o.items ? safeParse(o.items) : [],
    })),
  });
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

  const order = await db.order.create({
    data: {
      condoId,
      advertiserId: parsed.data.advertiserId || null,
      orderNumber: parsed.data.orderNumber ?? `#${Date.now().toString(36).toUpperCase()}`,
      status: parsed.data.status,
      deliveryMode: parsed.data.deliveryMode,
      tower: parsed.data.tower || null,
      block: parsed.data.block || null,
      unit: parsed.data.unit || null,
      schedule: parsed.data.schedule || null,
      additionalInfo: parsed.data.additionalInfo || null,
      items: parsed.data.items ? JSON.stringify(parsed.data.items) : null,
      total: parsed.data.total ?? null,
    },
  });
  return NextResponse.json({ order }, { status: 201 });
}

function safeParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}
