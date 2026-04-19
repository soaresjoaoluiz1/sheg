import { NextResponse } from "next/server";
import { getSession, type SessionPayload } from "@/lib/auth";
import { getActiveCondoId } from "@/lib/tenant";

export async function requireSession(): Promise<SessionPayload | NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return session;
}

export async function requireCondo(): Promise<string | NextResponse> {
  const condoId = await getActiveCondoId();
  if (!condoId) return NextResponse.json({ error: "Nenhum condomínio ativo" }, { status: 400 });
  return condoId;
}

export function isErrorResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

export function notFound(message = "Não encontrado") {
  return NextResponse.json({ error: message }, { status: 404 });
}
