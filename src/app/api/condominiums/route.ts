import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isErrorResponse, requireSession } from "@/lib/api-helpers";

const createSchema = z.object({
  name: z.string().min(2),
  cnpj: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  unitCount: z.number().int().optional().nullable(),
});

export async function GET() {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;

  const items = await db.condominium.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;
  if (!session.isMaster) return NextResponse.json({ error: "Apenas master" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const condo = await db.condominium.create({
    data: {
      name: parsed.data.name,
      cnpj: parsed.data.cnpj || null,
      email: parsed.data.email || null,
      whatsapp: parsed.data.whatsapp || null,
      address: parsed.data.address || null,
      unitCount: parsed.data.unitCount ?? null,
    },
  });
  return NextResponse.json({ condo }, { status: 201 });
}
