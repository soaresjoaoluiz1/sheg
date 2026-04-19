import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isErrorResponse, requireSession } from "@/lib/api-helpers";

const createSchema = z.object({
  advertiserId: z.string().min(1),
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  price: z.number().nullable().optional(),
});

export async function GET(request: Request) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;

  const url = new URL(request.url);
  const advertiserId = url.searchParams.get("advertiserId");
  const items = await db.advertiserProduct.findMany({
    where: { ...(advertiserId ? { advertiserId } : {}) },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const product = await db.advertiserProduct.create({
    data: {
      advertiserId: parsed.data.advertiserId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      price: parsed.data.price ?? null,
    },
  });
  return NextResponse.json({ product }, { status: 201 });
}
