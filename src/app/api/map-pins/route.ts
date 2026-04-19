import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isErrorResponse, requireSession } from "@/lib/api-helpers";

const createSchema = z.object({
  city: z.string().min(2),
  state: z.string().length(2),
  lat: z.number().optional(),
  lng: z.number().optional(),
  active: z.boolean().optional(),
});

async function geocode(city: string, state: string): Promise<{ lat: number; lng: number } | null> {
  const params = new URLSearchParams({
    q: `${city}, ${state}, Brazil`,
    format: "json",
    limit: "1",
    countrycodes: "br",
  });
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { "User-Agent": "shegou-localhost/1.0" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

export async function GET() {
  const items = await db.mapPin.findMany({ orderBy: { city: "asc" } });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (isErrorResponse(session)) return session;

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  let { lat, lng } = parsed.data;
  if (lat === undefined || lng === undefined) {
    const geo = await geocode(parsed.data.city, parsed.data.state.toUpperCase());
    if (!geo) {
      return NextResponse.json({ error: "Não consegui geocodificar essa cidade" }, { status: 422 });
    }
    lat = geo.lat;
    lng = geo.lng;
  }

  const pin = await db.mapPin.create({
    data: {
      city: parsed.data.city,
      state: parsed.data.state.toUpperCase(),
      lat,
      lng,
      active: parsed.data.active ?? true,
    },
  });
  return NextResponse.json({ pin }, { status: 201 });
}
