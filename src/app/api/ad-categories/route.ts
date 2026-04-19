import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isErrorResponse, requireSession } from "@/lib/api-helpers";

const createSchema = z.object({
  name: z.string().min(2),
  icon: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

export async function GET() {
  const items = await db.adCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
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

  const category = await db.adCategory.create({
    data: {
      name: parsed.data.name,
      icon: parsed.data.icon || null,
      sortOrder: parsed.data.sortOrder ?? 0,
    },
  });
  return NextResponse.json({ category }, { status: 201 });
}
