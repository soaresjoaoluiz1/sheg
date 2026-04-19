import { db } from "@/lib/db";

export interface ReincidenceGroup {
  key: string;
  offenderUnit: string | null;
  offenderResidenceId: string | null;
  count: number;
  lastAt: Date;
  firstAt: Date;
  occurrences: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: Date;
  }>;
}

export async function getReincidenceGroups(
  condoId: string,
  days = 365,
): Promise<ReincidenceGroup[]> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const items = await db.occurrence.findMany({
    where: { condoId, createdAt: { gte: cutoff } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      offenderResidenceId: true,
      offenderUnit: true,
    },
  });

  const groups = new Map<string, ReincidenceGroup>();
  for (const it of items) {
    const key = it.offenderResidenceId ?? it.offenderUnit ?? "__none__";
    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
      existing.firstAt = existing.firstAt < it.createdAt ? existing.firstAt : it.createdAt;
      existing.lastAt = existing.lastAt > it.createdAt ? existing.lastAt : it.createdAt;
      existing.occurrences.push({
        id: it.id,
        title: it.title,
        status: it.status,
        createdAt: it.createdAt,
      });
    } else {
      groups.set(key, {
        key,
        offenderUnit: it.offenderUnit,
        offenderResidenceId: it.offenderResidenceId,
        count: 1,
        lastAt: it.createdAt,
        firstAt: it.createdAt,
        occurrences: [
          {
            id: it.id,
            title: it.title,
            status: it.status,
            createdAt: it.createdAt,
          },
        ],
      });
    }
  }

  return Array.from(groups.values()).sort((a, b) => b.count - a.count);
}
