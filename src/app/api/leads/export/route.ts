import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

function escapeCsv(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const leads = await db.lead.findMany({ orderBy: { createdAt: "desc" } });
  const headers = [
    "id", "name", "city", "state", "role", "contact", "company",
    "monthlyBilling", "projectedRevenue", "referralSource",
    "testStart", "testDays", "paymentDay", "contacted", "notes",
    "stage", "createdAt",
  ];
  const rows = leads.map((l) =>
    headers.map((h) => {
      const v = (l as Record<string, unknown>)[h];
      if (v instanceof Date) return v.toISOString();
      return escapeCsv(v);
    }).join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
