import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

const UPLOADS_ROOT = path.resolve(process.cwd(), "public", "uploads");

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 8 * 1024 * 1024;

export async function ensureUploadsDir(subdir?: string) {
  const target = subdir ? path.join(UPLOADS_ROOT, subdir) : UPLOADS_ROOT;
  await fs.mkdir(target, { recursive: true });
  return target;
}

export async function saveUploadedFile(file: File, subdir: string): Promise<{ url: string; path: string }> {
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error("Tipo de arquivo não suportado. Use JPG, PNG ou WebP.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Arquivo acima do limite de 8 MB.");
  }
  const ext = file.type === "image/png" ? ".png" : file.type === "image/webp" ? ".webp" : ".jpg";
  const filename = `${randomUUID()}${ext}`;
  const dir = await ensureUploadsDir(subdir);
  const fullPath = path.join(dir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(fullPath, buffer);
  return {
    url: `/uploads/${subdir}/${filename}`,
    path: fullPath,
  };
}

export async function saveDataUrl(dataUrl: string, subdir: string): Promise<{ url: string; path: string }> {
  const match = /^data:(image\/(jpeg|png|webp));base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error("Data URL inválida. Esperado JPG, PNG ou WebP base64.");
  const mime = match[1];
  const base64 = match[3];
  const buffer = Buffer.from(base64, "base64");
  if (buffer.byteLength > MAX_BYTES) {
    throw new Error("Arquivo acima do limite de 8 MB.");
  }
  const ext = mime === "image/png" ? ".png" : mime === "image/webp" ? ".webp" : ".jpg";
  const filename = `${randomUUID()}${ext}`;
  const dir = await ensureUploadsDir(subdir);
  const fullPath = path.join(dir, filename);
  await fs.writeFile(fullPath, buffer);
  return {
    url: `/uploads/${subdir}/${filename}`,
    path: fullPath,
  };
}

export async function deleteUploadedFile(publicUrl: string | null | undefined) {
  if (!publicUrl) return;
  if (!publicUrl.startsWith("/uploads/")) return;
  const relative = publicUrl.replace(/^\/uploads\//, "");
  const fullPath = path.join(UPLOADS_ROOT, relative);
  try {
    await fs.unlink(fullPath);
  } catch {}
}
