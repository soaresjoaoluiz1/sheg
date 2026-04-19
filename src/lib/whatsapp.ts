import { db } from "@/lib/db";

interface SettingShape {
  baseUrl?: string;
  apiKey?: string;
  instanceName?: string;
}

interface BlockHours {
  start?: string;
  end?: string;
}

async function getSetting<T = unknown>(condoId: string, key: string): Promise<T | null> {
  const row = await db.setting.findUnique({ where: { condoId_key: { condoId, key } } });
  if (!row) return null;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return null;
  }
}

export async function setSetting(condoId: string, key: string, value: unknown) {
  const json = JSON.stringify(value);
  return db.setting.upsert({
    where: { condoId_key: { condoId, key } },
    create: { condoId, key, value: json },
    update: { value: json },
  });
}

export async function getEvolutionConfig(condoId: string): Promise<SettingShape> {
  const stored = await getSetting<SettingShape>(condoId, "condo_evolution_config");
  return {
    baseUrl: stored?.baseUrl ?? process.env.EVOLUTION_BASE_URL ?? "",
    apiKey: stored?.apiKey ?? process.env.EVOLUTION_API_KEY ?? "",
    instanceName: stored?.instanceName ?? "portaria",
  };
}

export async function getBlockHours(condoId: string): Promise<BlockHours> {
  return (await getSetting<BlockHours>(condoId, "message_block_hours")) ?? {};
}

function timeToMinutes(t?: string): number | null {
  if (!t) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

export function isInsideBlock(now: Date, hours: BlockHours): boolean {
  const start = timeToMinutes(hours.start);
  const end = timeToMinutes(hours.end);
  if (start === null || end === null) return false;
  const cur = now.getHours() * 60 + now.getMinutes();
  if (start === end) return false;
  if (start < end) return cur >= start && cur < end;
  return cur >= start || cur < end;
}

function nextDeliverableDate(now: Date, hours: BlockHours): Date {
  if (!isInsideBlock(now, hours)) return now;
  const end = timeToMinutes(hours.end);
  if (end === null) return now;
  const next = new Date(now);
  next.setSeconds(0, 0);
  next.setMinutes(end % 60);
  next.setHours(Math.floor(end / 60));
  if (next <= now) next.setDate(next.getDate() + 1);
  return next;
}

export interface EnqueueOptions {
  condoId: string;
  to: string;
  message: string;
  packageId?: string;
  residentId?: string;
  scheduledAt?: Date;
}

export async function enqueueWhatsApp(opts: EnqueueOptions) {
  const hours = await getBlockHours(opts.condoId);
  const now = new Date();
  const scheduled = opts.scheduledAt ?? nextDeliverableDate(now, hours);
  return db.messageQueue.create({
    data: {
      condoId: opts.condoId,
      to: opts.to,
      message: opts.message,
      packageId: opts.packageId,
      residentId: opts.residentId,
      scheduledAt: scheduled,
      status: "PENDING",
    },
  });
}

export async function listQueue(condoId: string, status?: string) {
  return db.messageQueue.findMany({
    where: {
      condoId,
      ...(status && status !== "ALL" ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function dispatchOne(messageId: string): Promise<{ ok: boolean; error?: string }> {
  const msg = await db.messageQueue.findUnique({ where: { id: messageId } });
  if (!msg) return { ok: false, error: "Mensagem não encontrada" };
  if (msg.status === "SENT") return { ok: true };

  const config = await getEvolutionConfig(msg.condoId);
  await db.messageQueue.update({
    where: { id: msg.id },
    data: { attempts: { increment: 1 } },
  });

  if (!config.baseUrl || !config.apiKey) {
    console.log(`[whatsapp:mock] → ${msg.to}: ${msg.message}`);
    await db.messageQueue.update({
      where: { id: msg.id },
      data: { status: "SENT", sentAt: new Date(), lastError: null },
    });
    return { ok: true };
  }

  try {
    const url = `${config.baseUrl.replace(/\/$/, "")}/message/sendText/${encodeURIComponent(config.instanceName ?? "portaria")}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: config.apiKey },
      body: JSON.stringify({ number: msg.to, text: msg.message }),
    });
    if (!res.ok) throw new Error(`Evolution API ${res.status}`);
    await db.messageQueue.update({
      where: { id: msg.id },
      data: { status: "SENT", sentAt: new Date(), lastError: null },
    });
    return { ok: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    await db.messageQueue.update({
      where: { id: msg.id },
      data: { status: "FAILED", lastError: error },
    });
    return { ok: false, error };
  }
}

export async function dispatchPending(maxBatch = 20) {
  const now = new Date();
  const pending = await db.messageQueue.findMany({
    where: { status: "PENDING", scheduledAt: { lte: now } },
    orderBy: { scheduledAt: "asc" },
    take: maxBatch,
  });
  const results = await Promise.all(pending.map((m) => dispatchOne(m.id)));
  return { processed: pending.length, ok: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length };
}

export async function retryMessage(id: string) {
  await db.messageQueue.update({
    where: { id },
    data: { status: "PENDING", lastError: null },
  });
  return dispatchOne(id);
}

export async function updateRecipient(id: string, to: string) {
  await db.messageQueue.update({
    where: { id },
    data: { to, status: "PENDING", lastError: null },
  });
}
