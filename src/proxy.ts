import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE_NAME } from "@/lib/auth";
import { verifyMoradorSession, MORADOR_SESSION_COOKIE } from "@/lib/morador-auth";

const PUBLIC_ROUTES = ["/", "/login", "/morador/login"];
const PUBLIC_API_PREFIXES = ["/api/auth", "/api/public", "/api/morador/auth"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/uploads") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const isPublicApi = PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p));
  const isPublicPage = PUBLIC_ROUTES.includes(pathname) || pathname.startsWith("/p/");
  if (isPublicApi || isPublicPage) return NextResponse.next();

  if (pathname.startsWith("/morador") || pathname.startsWith("/api/morador")) {
    const token = request.cookies.get(MORADOR_SESSION_COOKIE)?.value;
    const session = token ? await verifyMoradorSession(token) : null;
    if (!session) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const loginUrl = new URL("/morador/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  const requiresAuth =
    pathname.startsWith("/api/") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/encomendas") ||
    pathname.startsWith("/moradores") ||
    pathname.startsWith("/unidades") ||
    pathname.startsWith("/veiculos") ||
    pathname.startsWith("/facilitis") ||
    pathname.startsWith("/ocorrencias") ||
    pathname.startsWith("/reincidencia") ||
    pathname.startsWith("/denuncias") ||
    pathname.startsWith("/anunciantes") ||
    pathname.startsWith("/pedidos") ||
    pathname.startsWith("/avisos") ||
    pathname.startsWith("/whatsapp") ||
    pathname.startsWith("/lembretes") ||
    pathname.startsWith("/usuarios") ||
    pathname.startsWith("/leads") ||
    pathname.startsWith("/mapa") ||
    pathname.startsWith("/relatorios") ||
    pathname.startsWith("/configuracoes");

  if (!requiresAuth) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
