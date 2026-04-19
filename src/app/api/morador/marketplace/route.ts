import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getMoradorSession } from "@/lib/morador-auth";

export async function GET(request: Request) {
  const session = await getMoradorSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const categoryId = url.searchParams.get("categoryId");

  const advertisers = await db.advertiser.findMany({
    where: {
      active: true,
      condos: { some: { condominiumId: session.condoId } },
      ...(categoryId ? { categoryId } : {}),
    },
    include: {
      category: true,
      products: { orderBy: { name: "asc" } },
    },
    orderBy: { name: "asc" },
  });

  const categories = await db.adCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ advertisers, categories });
}
