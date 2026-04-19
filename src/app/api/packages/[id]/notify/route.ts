import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isErrorResponse, notFound, requireCondo, requireSession } from "@/lib/api-helpers";
import { enqueueWhatsApp, dispatchOne } from "@/lib/whatsapp";

function unitLabel(r: { block?: string | null; tower?: string | null; number: string }) {
  const parts = [r.block, r.tower && r.tower !== r.block ? r.tower : null, r.number].filter(Boolean);
  return parts.join(" · ");
}

function buildMessage(args: {
  courier: string | null;
  deliveryType: string;
  pickupCode: string | null;
  condoName: string;
  unit: string;
  residentName: string;
  publicUrl: string;
}) {
  const origem = args.courier ?? (args.deliveryType === "FAST_DELIVERY" ? "entrega rápida" : "remetente");
  const codigo = args.pickupCode ? ` Código: ${args.pickupCode}.` : "";
  return `Olá, ${args.residentName}! Sua encomenda (${origem}) chegou na portaria do ${args.condoName}, unidade ${args.unit}.${codigo}\n\nConfirme a retirada: ${args.publicUrl}`;
}

export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;
  const condoId = await requireCondo();
  if (isErrorResponse(condoId)) return condoId;

  const { id } = await ctx.params;
  const pkg = await db.package.findFirst({
    where: { id, condoId },
    include: {
      condominium: true,
      residence: { include: { residents: true } },
    },
  });
  if (!pkg) return notFound("Encomenda não encontrada");

  const residents = pkg.residence.residents.filter((r): r is typeof r & { whatsapp: string } => !!r.whatsapp);
  if (residents.length === 0) {
    return NextResponse.json({ error: "Nenhum morador com WhatsApp cadastrado" }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const publicUrl = `${baseUrl}/p/${pkg.id}`;
  const unit = unitLabel(pkg.residence);

  const enqueued = await Promise.all(
    residents.map((r) =>
      enqueueWhatsApp({
        condoId,
        to: r.whatsapp,
        message: buildMessage({
          courier: pkg.courier,
          deliveryType: pkg.deliveryType,
          pickupCode: pkg.pickupCode,
          condoName: pkg.condominium.name,
          unit,
          residentName: r.name,
          publicUrl,
        }),
        packageId: pkg.id,
        residentId: r.id,
      }),
    ),
  );

  await Promise.all(enqueued.map((m) => (m.scheduledAt <= new Date() ? dispatchOne(m.id) : Promise.resolve())));

  return NextResponse.json({
    enqueued: enqueued.length,
    messages: enqueued.map((m) => ({ id: m.id, to: m.to, status: m.status, scheduledAt: m.scheduledAt })),
  });
}
