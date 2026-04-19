import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isErrorResponse, requireCondo, requireSession } from "@/lib/api-helpers";

const ALLOWED_KEYS = new Set([
  "condo_evolution_config",
  "package_stale_reminders",
  "message_block_hours",
  "condo_admin_contacts",
  "dashboard_banner_images",
]);

const putSchema = z.object({
  key: z.string(),
  value: z.unknown(),
});

export async function GET(request: Request) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;
  const condoId = await requireCondo();
  if (isErrorResponse(condoId)) return condoId;

  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  if (!key) {
    const items = await db.setting.findMany({ where: { condoId } });
    return NextResponse.json({ items });
  }

  const row = await db.setting.findUnique({ where: { condoId_key: { condoId, key } } });
  if (!row) return NextResponse.json({ value: null });
  try {
    return NextResponse.json({ value: JSON.parse(row.value) });
  } catch {
    return NextResponse.json({ value: row.value });
  }
}

export async function PUT(request: Request) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;
  const condoId = await requireCondo();
  if (isErrorResponse(condoId)) return condoId;

  const body = await request.json().catch(() => null);
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  if (!ALLOWED_KEYS.has(parsed.data.key)) {
    return NextResponse.json({ error: "Chave não permitida" }, { status: 400 });
  }

  const json = JSON.stringify(parsed.data.value);
  const row = await db.setting.upsert({
    where: { condoId_key: { condoId, key: parsed.data.key } },
    create: { condoId, key: parsed.data.key, value: json },
    update: { value: json },
  });
  return NextResponse.json({ key: row.key, value: parsed.data.value });
}
