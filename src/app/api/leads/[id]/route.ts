import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isErrorResponse, notFound, requireSession } from "@/lib/api-helpers";

const STAGES = ["prospeccao", "contato_feito", "qualificado", "fechado", "perdido"] as const;

const patchSchema = z.object({
  name: z.string().optional(),
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
  contacted: z.boolean().optional(),
});

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const existing = await db.lead.findUnique({ where: { id } });
  if (!existing) return notFound("Lead não encontrado");

  const lead = await db.lead.update({
    where: { id },
    data: {
      name: parsed.data.name,
      city: parsed.data.city ?? undefined,
      state: parsed.data.state ?? undefined,
      role: parsed.data.role ?? undefined,
      contact: parsed.data.contact ?? undefined,
      company: parsed.data.company ?? undefined,
      monthlyBilling: parsed.data.monthlyBilling,
      projectedRevenue: parsed.data.projectedRevenue,
      referralSource: parsed.data.referralSource ?? undefined,
      testStart: parsed.data.testStart !== undefined
        ? parsed.data.testStart ? new Date(parsed.data.testStart) : null
        : undefined,
      testDays: parsed.data.testDays,
      paymentDay: parsed.data.paymentDay,
      notes: parsed.data.notes ?? undefined,
      stage: parsed.data.stage,
      contacted: parsed.data.contacted,
    },
  });
  return NextResponse.json({ lead });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;

  const { id } = await ctx.params;
  await db.lead.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
