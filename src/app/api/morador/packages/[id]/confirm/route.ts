import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getMoradorSession } from "@/lib/morador-auth";

export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getMoradorSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const pkg = await db.package.findFirst({
    where: { id, residenceId: session.residenceId },
  });
  if (!pkg) return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
  if (pkg.status === "DELIVERED") {
    return NextResponse.json({ error: "Já confirmada" }, { status: 409 });
  }

  const updated = await db.package.update({
    where: { id },
    data: {
      status: "DELIVERED",
      deliveryDate: new Date(),
      deliveredTo: session.name,
    },
  });
  return NextResponse.json({ package: updated });
}
