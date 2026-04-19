import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getMoradorSession } from "@/lib/morador-auth";

export async function GET() {
  const session = await getMoradorSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const residence = await db.residence.findUnique({ where: { id: session.residenceId } });
  if (!residence) return NextResponse.json({ items: [] });

  const items = await db.notice.findMany({
    where: {
      condoId: session.condoId,
      OR: [
        { targetType: "condo" },
        { targetType: "block", targetId: residence.block ?? undefined },
        { targetType: "tower", targetId: residence.tower ?? undefined },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ items });
}
