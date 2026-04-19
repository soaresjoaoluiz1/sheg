import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getActiveCondoId } from "@/lib/tenant";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.adminUser.findUnique({
    where: { id: session.sub },
    include: {
      condominiums: { select: { condominiumId: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isMaster: user.isMaster,
      condoIds: user.condominiums.map((c) => c.condominiumId),
      activeCondoId: await getActiveCondoId(),
    },
  });
}
