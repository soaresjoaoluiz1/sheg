import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isErrorResponse, requireSession } from "@/lib/api-helpers";

const STAGES = ["prospeccao", "contato_feito", "qualificado", "fechado", "perdido"] as const;

const createSchema = z.object({
  name: z.string().min(2),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  contact: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  monthlyBilling: z.number().nullable().optional(),
  projectedRevenue: z.number().nullable().optional(),
  referralSource: z.string().optional().nullable(),
  testStart: z.string().optional().nullable(),
  testDays: z.number().int().nullable().optional(),
  paymentDay: z.number().int().nullable().optional(),
  notes: z.string().optional().nullable(),
  stage: z.enum(STAGES).optional(),
});

export async function GET() {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;

  const items = await db.lead.findMany({ orderBy: { createdAt: "desc" }, take: 1000 });
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

  const lead = await db.lead.create({
    data: {
      name: parsed.data.name,
      city: parsed.data.city || null,
      state: parsed.data.state || null,
      role: parsed.data.role || null,
      contact: parsed.data.contact || null,
      company: parsed.data.company || null,
      monthlyBilling: parsed.data.monthlyBilling ?? null,
      projectedRevenue: parsed.data.projectedRevenue ?? null,
      referralSource: parsed.data.referralSource || null,
      testStart: parsed.data.testStart ? new Date(parsed.data.testStart) : null,
      testDays: parsed.data.testDays ?? null,
      paymentDay: parsed.data.paymentDay ?? null,
      notes: parsed.data.notes || null,
      stage: parsed.data.stage ?? "prospeccao",
    },
  });
  return NextResponse.json({ lead }, { status: 201 });
}
