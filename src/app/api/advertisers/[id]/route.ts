import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isErrorResponse, notFound, requireSession } from "@/lib/api-helpers";
import { deleteUploadedFile } from "@/lib/upload";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
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
  deliveryMode: z.enum(["delivery", "pickup", "both"]).optional(),
  deliveryFee: z.number().nullable().optional(),
  minOrder: z.number().nullable().optional(),
});

export async function PUT(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const existing = await db.advertiser.findUnique({ where: { id } });
  if (!existing) return notFound("Anunciante não encontrado");

  const advertiser = await db.advertiser.update({
    where: { id },
    data: {
      name: parsed.data.name,
      categoryId: parsed.data.categoryId ?? undefined,
      phone: parsed.data.phone ?? undefined,
      whatsapp: parsed.data.whatsapp ?? undefined,
      email: parsed.data.email ?? undefined,
      website: parsed.data.website ?? undefined,
      address: parsed.data.address ?? undefined,
      description: parsed.data.description ?? undefined,
      active: parsed.data.active,
      coverImage: parsed.data.coverImage ?? undefined,
      logo: parsed.data.logo ?? undefined,
      deliveryMode: parsed.data.deliveryMode,
      deliveryFee: parsed.data.deliveryFee,
      minOrder: parsed.data.minOrder,
    },
  });
  return NextResponse.json({ advertiser });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;

  const { id } = await ctx.params;
  const existing = await db.advertiser.findUnique({ where: { id } });
  if (!existing) return notFound("Anunciante não encontrado");

  await db.advertiser.delete({ where: { id } });
  await Promise.all([deleteUploadedFile(existing.logo), deleteUploadedFile(existing.coverImage)]);
  return NextResponse.json({ ok: true });
}
