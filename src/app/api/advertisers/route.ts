import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isErrorResponse, requireCondo, requireSession } from "@/lib/api-helpers";

const createSchema = z.object({
  name: z.string().min(2),
  categoryId: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  active: z.boolean().optional(),
  coverImage: z.string().optional().nullable(),
  logo: z.string().optional().nullable(),
  deliveryMode: z.enum(["delivery", "pickup", "both"]).default("both"),
  deliveryFee: z.number().nullable().optional(),
  minOrder: z.number().nullable().optional(),
  condoIds: z.array(z.string()).optional(),
});

export async function GET(request: Request) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;
  const condoId = await requireCondo();
  if (isErrorResponse(condoId)) return condoId;

  const url = new URL(request.url);
  const onlyActive = url.searchParams.get("active");
  const items = await db.advertiser.findMany({
    where: {
      condos: { some: { condominiumId: condoId } },
      ...(onlyActive === "true" ? { active: true } : {}),
    },
    include: {
      category: true,
      products: { orderBy: { name: "asc" } },
      condos: { select: { condominiumId: true } },
    },
    orderBy: { name: "asc" },
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

  const condoIds = parsed.data.condoIds && parsed.data.condoIds.length > 0
    ? parsed.data.condoIds
    : [condoId];

  const advertiser = await db.advertiser.create({
    data: {
      name: parsed.data.name,
      categoryId: parsed.data.categoryId || null,
      phone: parsed.data.phone || null,
      whatsapp: parsed.data.whatsapp || null,
      email: parsed.data.email || null,
      website: parsed.data.website || null,
      address: parsed.data.address || null,
      description: parsed.data.description || null,
      active: parsed.data.active ?? true,
      coverImage: parsed.data.coverImage || null,
      logo: parsed.data.logo || null,
      deliveryMode: parsed.data.deliveryMode,
      deliveryFee: parsed.data.deliveryFee ?? null,
      minOrder: parsed.data.minOrder ?? null,
      condos: { create: condoIds.map((c) => ({ condominiumId: c })) },
    },
    include: { category: true, condos: true },
  });
  return NextResponse.json({ advertiser }, { status: 201 });
}
