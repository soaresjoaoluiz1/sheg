import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isErrorResponse, requireCondo, requireSession } from "@/lib/api-helpers";

const DELIVERY_TYPES = ["PACKAGE", "FAST_DELIVERY", "VISITOR"] as const;

const createSchema = z.object({
  residenceId: z.string().min(1),
  deliveryType: z.enum(DELIVERY_TYPES).default("PACKAGE"),
  courier: z.string().optional().nullable(),
  trackingCode: z.string().optional().nullable(),
  deliveryPhoto: z.string().optional().nullable(),
});

function generatePickupCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function GET(request: Request) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;
  const condoId = await requireCondo();
  if (isErrorResponse(condoId)) return condoId;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("q")?.trim();
  const residenceId = url.searchParams.get("residenceId");

  const items = await db.package.findMany({
    where: {
      condoId,
      ...(status && status !== "ALL" ? { status } : {}),
      ...(residenceId ? { residenceId } : {}),
      ...(search
        ? {
            OR: [
              { courier: { contains: search } },
              { trackingCode: { contains: search } },
              { pickupCode: { contains: search } },
              { residence: { number: { contains: search } } },
              { residence: { block: { contains: search } } },
            ],
          }
        : {}),
    },
    include: {
      residence: {
        select: {
          id: true,
          block: true,
          tower: true,
          number: true,
          residents: { select: { id: true, name: true, whatsapp: true } },
        },
      },
    },
    orderBy: [{ status: "asc" }, { arrivalDate: "desc" }],
    take: 500,
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
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const residence = await db.residence.findFirst({
    where: { id: parsed.data.residenceId, condoId },
  });
  if (!residence) {
    return NextResponse.json({ error: "Unidade não encontrada" }, { status: 404 });
  }

  const pkg = await db.package.create({
    data: {
      condoId,
      residenceId: parsed.data.residenceId,
      status: "PENDING",
      deliveryType: parsed.data.deliveryType,
      courier: parsed.data.courier || null,
      trackingCode: parsed.data.trackingCode || null,
      deliveryPhoto: parsed.data.deliveryPhoto || null,
      pickupCode: generatePickupCode(),
    },
    include: {
      residence: {
        include: { residents: true },
      },
    },
  });
  return NextResponse.json({ package: pkg }, { status: 201 });
}
