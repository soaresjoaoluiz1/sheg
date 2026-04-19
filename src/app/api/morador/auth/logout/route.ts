import { NextResponse } from "next/server";
import { clearMoradorSessionCookie } from "@/lib/morador-auth";

export async function POST() {
  await clearMoradorSessionCookie();
  return NextResponse.json({ ok: true });
}
