import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const pkg = await db.package.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      deliveryType: true,
      courier: true,
      pickupCode: true,
      arrivalDate: true,
      deliveryDate: true,
      deliveredTo: true,
      deliveryPhoto: true,
      releasePhoto: true,
      residence: {
        select: {
          block: true,
          tower: true,
          number: true,
        },
      },
      condominium: {
        select: { name: true },
      },
    },
  });
  if (!pkg) return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
  return NextResponse.json({ package: pkg });
}
