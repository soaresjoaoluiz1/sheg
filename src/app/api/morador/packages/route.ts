import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getMoradorSession } from "@/lib/morador-auth";

export async function GET(request: Request) {
  const session = await getMoradorSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  const items = await db.package.findMany({
    where: {
      residenceId: session.residenceId,
      ...(status && status !== "ALL" ? { status } : {}),
    },
    orderBy: { arrivalDate: "desc" },
    take: 100,
  });
  return NextResponse.json({ items });
}
