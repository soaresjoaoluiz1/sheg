import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword, signSession, setSessionCookie } from "@/lib/auth";
import { setActiveCondoId } from "@/lib/tenant";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha muito curta"),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { email, password } = parsed.data;

  const user = await db.adminUser.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      condominiums: {
        select: { condominiumId: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
  }

  const token = await signSession({
    sub: user.id,
    email: user.email,
    role: user.role,
    isMaster: user.isMaster,
  });

  await setSessionCookie(token);

  const firstCondo = user.condoId ?? user.condominiums[0]?.condominiumId ?? null;
  if (firstCondo) await setActiveCondoId(firstCondo);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isMaster: user.isMaster,
      condoIds: user.condominiums.map((c) => c.condominiumId),
      activeCondoId: firstCondo,
    },
  });
}
