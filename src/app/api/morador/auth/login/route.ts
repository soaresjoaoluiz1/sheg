import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import { signMoradorSession, setMoradorSessionCookie } from "@/lib/morador-auth";

const loginSchema = z.object({
  identifier: z.string().min(3, "Informe e-mail ou WhatsApp"),
  password: z.string().min(4),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const id = parsed.data.identifier.trim();
  const resident = await db.resident.findFirst({
    where: {
      loginEnabled: true,
      OR: [{ email: id.toLowerCase() }, { whatsapp: id }],
    },
    include: { residence: true, condominium: true },
  });
  if (!resident || !resident.passwordHash) {
    return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
  }

  const ok = await verifyPassword(parsed.data.password, resident.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
  }

  const token = await signMoradorSession({
    sub: resident.id,
    residenceId: resident.residenceId,
    condoId: resident.condoId,
    name: resident.name,
  });
  await setMoradorSessionCookie(token);

  return NextResponse.json({
    morador: {
      id: resident.id,
      name: resident.name,
      whatsapp: resident.whatsapp,
      email: resident.email,
      residence: {
        id: resident.residence.id,
        block: resident.residence.block,
        tower: resident.residence.tower,
        number: resident.residence.number,
      },
      condo: { id: resident.condominium.id, name: resident.condominium.name },
    },
  });
}
