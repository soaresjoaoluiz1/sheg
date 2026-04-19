import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isErrorResponse, requireSession } from "@/lib/api-helpers";

const createSchema = z.object({
  advertiserId: z.string().min(1),
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  price: z.number().nullable().optional(),
  category: z.string().optional().nullable(),
  photos: z.array(z.string()).optional(),
  isResident: z.boolean().optional(),
  residentName: z.string().optional().nullable(),
  block: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  condoName: z.string().optional().nullable(),
  visible: z.boolean().optional(),
});

export async function GET(request: Request) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;

  const url = new URL(request.url);
  const visible = url.searchParams.get("visible");

  const items = await db.adsAudit.findMany({
    where: visible === "true" ? { visible: true } : visible === "false" ? { visible: false } : {},
    include: { advertiser: { select: { id: true, name: true } } },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
  return NextResponse.json({
    items: items.map((i) => ({
      ...i,
      photos: i.photos ? safeParse(i.photos) : [],
    })),
  });
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const audit = await db.adsAudit.create({
    data: {
      advertiserId: parsed.data.advertiserId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      price: parsed.data.price ?? null,
      category: parsed.data.category || null,
      photos: parsed.data.photos ? JSON.stringify(parsed.data.photos) : null,
      isResident: parsed.data.isResident ?? false,
      residentName: parsed.data.residentName || null,
      block: parsed.data.block || null,
      unit: parsed.data.unit || null,
      condoName: parsed.data.condoName || null,
      visible: parsed.data.visible ?? true,
    },
  });
  return NextResponse.json({ audit }, { status: 201 });
}

function safeParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}
