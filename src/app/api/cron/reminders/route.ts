import { NextResponse } from "next/server";
import { processStaleReminders } from "@/lib/reminders";
import { dispatchPending } from "@/lib/whatsapp";

export async function POST() {
  const reminders = await processStaleReminders();
  const dispatch = await dispatchPending(50);
  return NextResponse.json({ reminders, dispatch });
}

export async function GET() {
  return POST();
}
