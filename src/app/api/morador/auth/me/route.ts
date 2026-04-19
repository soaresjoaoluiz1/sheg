import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getMoradorSession } from "@/lib/morador-auth";

export async function GET() {
  const session = await getMoradorSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resident = await db.resident.findUnique({
    where: { id: session.sub },
    include: { residence: true, condominium: true },
  });
  if (!resident) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    morador: {
      id: resident.id,
      name: resident.name,
      whatsapp: resident.whatsapp,
      email: resident.email,
      photo: resident.photo,
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
