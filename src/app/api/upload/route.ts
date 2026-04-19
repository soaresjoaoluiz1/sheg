import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { saveDataUrl, saveUploadedFile } from "@/lib/upload";

const ALLOWED_SUBDIRS = new Set([
  "residents",
  "packages",
  "arrivals",
  "vehicles",
  "occurrences",
  "misc",
]);

const jsonSchema = z.object({
  dataUrl: z.string().startsWith("data:"),
  subdir: z.string(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const body = await request.json();
      const parsed = jsonSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
      }
      if (!ALLOWED_SUBDIRS.has(parsed.data.subdir)) {
        return NextResponse.json({ error: "Subdiretório inválido" }, { status: 400 });
      }
      const saved = await saveDataUrl(parsed.data.dataUrl, parsed.data.subdir);
      return NextResponse.json({ url: saved.url });
    }

    const form = await request.formData();
    const file = form.get("file");
    const subdir = String(form.get("subdir") ?? "misc");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo ausente" }, { status: 400 });
    }
    if (!ALLOWED_SUBDIRS.has(subdir)) {
      return NextResponse.json({ error: "Subdiretório inválido" }, { status: 400 });
    }
    const saved = await saveUploadedFile(file, subdir);
    return NextResponse.json({ url: saved.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha no upload";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
