import { cookies } from "next/headers";

const ACTIVE_CONDO_COOKIE = "shegou_active_condo";

export async function getActiveCondoId(): Promise<string | null> {
  const store = await cookies();
  return store.get(ACTIVE_CONDO_COOKIE)?.value ?? null;
}

export async function setActiveCondoId(condoId: string) {
  const store = await cookies();
  store.set(ACTIVE_CONDO_COOKIE, condoId, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export const ACTIVE_CONDO_COOKIE_NAME = ACTIVE_CONDO_COOKIE;
