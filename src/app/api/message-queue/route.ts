import { NextResponse } from "next/server";
import { isErrorResponse, requireCondo, requireSession } from "@/lib/api-helpers";
import { listQueue, dispatchPending } from "@/lib/whatsapp";

export async function GET(request: Request) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;
  const condoId = await requireCondo();
  if (isErrorResponse(condoId)) return condoId;

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? undefined;
  const items = await listQueue(condoId, status);
  return NextResponse.json({ items });
}

export async function POST() {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;
  const condoId = await requireCondo();
  if (isErrorResponse(condoId)) return condoId;

  const result = await dispatchPending();
  return NextResponse.json(result);
}
