import { db } from "@/lib/db";
import { enqueueWhatsApp } from "@/lib/whatsapp";

interface ReminderConfig {
  enabled: boolean;
  scheduleHours: number[];
  deliveryTypes: string[];
  notifyAllResidents: boolean;
  messageTemplate: string;
}

const DEFAULT_CONFIG: ReminderConfig = {
  enabled: true,
  scheduleHours: [12, 24, 36],
  deliveryTypes: ["PACKAGE"],
  notifyAllResidents: false,
  messageTemplate:
    "Olá, {morador}! Sua encomenda ({origem}) está aguardando retirada na portaria há {horas}h. Unidade {unidade} · {condominio}.",
};

function unitLabel(r: { block?: string | null; tower?: string | null; number: string }) {
  const parts = [r.block, r.tower && r.tower !== r.block ? r.tower : null, r.number].filter(Boolean);
  return parts.join(" · ");
}

async function getConfig(condoId: string): Promise<ReminderConfig> {
  const row = await db.setting.findUnique({
    where: { condoId_key: { condoId, key: "package_stale_reminders" } },
  });
  if (!row) return DEFAULT_CONFIG;
  try {
    const parsed = JSON.parse(row.value) as Partial<ReminderConfig>;
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return DEFAULT_CONFIG;
  }
}

function applyTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_match, key) => vars[key] ?? "");
}

export async function processStaleReminders(now = new Date()): Promise<{
  scanned: number;
  enqueued: number;
}> {
  const condos = await db.condominium.findMany({ select: { id: true, name: true } });
  let scanned = 0;
  let enqueued = 0;

  for (const condo of condos) {
    const config = await getConfig(condo.id);
    if (!config.enabled) continue;

    for (const hours of [...config.scheduleHours].sort((a, b) => a - b)) {
      const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000);
      const packages = await db.package.findMany({
        where: {
          condoId: condo.id,
          status: "PENDING",
          deliveryType: { in: config.deliveryTypes },
          arrivalDate: { lte: cutoff },
        },
        include: {
          residence: { include: { residents: true } },
        },
      });

      for (const pkg of packages) {
        scanned++;
        const existing = await db.packageReminder.findUnique({
          where: { packageId_hoursBucket: { packageId: pkg.id, hoursBucket: hours } },
        });
        if (existing) continue;

        const recipients = config.notifyAllResidents
          ? pkg.residence.residents
          : pkg.residence.residents.slice(0, 1);
        const withWhatsapp = recipients.filter((r): r is typeof r & { whatsapp: string } => !!r.whatsapp);
        if (withWhatsapp.length === 0) continue;

        for (const r of withWhatsapp) {
          const message = applyTemplate(config.messageTemplate, {
            morador: r.name,
            origem: pkg.courier ?? "remetente",
            horas: String(hours),
            unidade: unitLabel(pkg.residence),
            condominio: condo.name,
          });
          await enqueueWhatsApp({
            condoId: condo.id,
            to: r.whatsapp,
            message,
            packageId: pkg.id,
            residentId: r.id,
          });
          enqueued++;
        }

        await db.packageReminder.create({
          data: { packageId: pkg.id, hoursBucket: hours },
        });
      }
    }
  }

  return { scanned, enqueued };
}
