import { NextResponse } from "next/server";
import { isErrorResponse, requireCondo, requireSession } from "@/lib/api-helpers";
import { getReincidenceGroups } from "@/lib/occurrences";

export async function GET(request: Request) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;
  const condoId = await requireCondo();
  if (isErrorResponse(condoId)) return condoId;

  const url = new URL(request.url);
  const days = Number(url.searchParams.get("days") ?? 365);
  const groups = await getReincidenceGroups(condoId, Number.isFinite(days) ? days : 365);
  return NextResponse.json({ groups, days });
}
