import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function requireMaster() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.isMaster) return NextResponse.json({ error: "Apenas master" }, { status: 403 });
  return session;
}
