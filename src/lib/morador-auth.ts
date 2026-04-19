import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SESSION_COOKIE = "shegou_morador_session";

function secret() {
  const raw = process.env.JWT_SECRET;
  if (!raw) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(raw);
}

export interface MoradorSession {
  sub: string;
  residenceId: string;
  condoId: string;
  name: string;
  [key: string]: unknown;
}

export async function signMoradorSession(payload: MoradorSession): Promise<string> {
  const expires = process.env.JWT_EXPIRES_IN ?? "7d";
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expires)
    .sign(secret());
}

export async function verifyMoradorSession(token: string): Promise<MoradorSession | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as MoradorSession;
  } catch {
    return null;
  }
}

export async function setMoradorSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearMoradorSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getMoradorSession(): Promise<MoradorSession | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyMoradorSession(token);
}

export const MORADOR_SESSION_COOKIE = SESSION_COOKIE;
