import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";

export interface DeliveryReport {
  condo: { name: string };
  period: { from: string; to: string };
  totals: {
    total: number;
    pending: number;
    delivered: number;
    byType: { PACKAGE: number; FAST_DELIVERY: number; VISITOR: number };
  };
  packages: Array<{
    id: string;
    status: string;
    deliveryType: string;
    courier: string | null;
    trackingCode: string | null;
    pickupCode: string | null;
    arrivalDate: string;
    deliveryDate: string | null;
    deliveredTo: string | null;
    residence: { block: string | null; tower: string | null; number: string };
  }>;
}

function unitLabel(r: { block: string | null; tower: string | null; number: string }) {
  return [r.block, r.tower && r.tower !== r.block ? r.tower : null, r.number].filter(Boolean).join(" · ");
}

export function generateDeliveriesPDF(data: DeliveryReport): Blob {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36;
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Relatório de Entregas", margin, y);
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(data.condo.name, margin, y);
  y += 14;
  doc.text(
    `Período: ${format(new Date(data.period.from), "dd/MM/yyyy", { locale: ptBR })} → ${format(new Date(data.period.to), "dd/MM/yyyy", { locale: ptBR })}`,
    margin,
    y,
  );
  y += 14;
  doc.text(`Emitido em ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, margin, y);
  doc.setTextColor(0);
  y += 22;

  // Totais
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Resumo", margin, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const summary: Array<[string, string]> = [
    ["Total de registros", String(data.totals.total)],
    ["Aguardando retirada", String(data.totals.pending)],
    ["Entregues", String(data.totals.delivered)],
    ["Encomendas", String(data.totals.byType.PACKAGE)],
    ["Delivery rápido", String(data.totals.byType.FAST_DELIVERY)],
    ["Visitantes", String(data.totals.byType.VISITOR)],
  ];
  for (const [label, value] of summary) {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, margin + 140, y);
    y += 13;
  }

  y += 12;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Detalhamento", margin, y);
  y += 14;

  doc.setFontSize(8);
  const cols = [
    { label: "Data", x: margin, w: 90 },
    { label: "Unidade", x: margin + 92, w: 70 },
    { label: "Tipo", x: margin + 165, w: 65 },
    { label: "Portador", x: margin + 232, w: 110 },
    { label: "Status", x: margin + 345, w: 60 },
    { label: "Retirado por", x: margin + 408, w: 130 },
  ];

  function drawHeader() {
    doc.setFont("helvetica", "bold");
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y - 10, pageWidth - margin * 2, 14, "F");
    for (const c of cols) doc.text(c.label, c.x, y);
    doc.setFont("helvetica", "normal");
    y += 12;
  }
  drawHeader();

  for (const p of data.packages) {
    if (y > pageHeight - margin - 14) {
      doc.addPage();
      y = margin;
      drawHeader();
    }
    const date = format(new Date(p.arrivalDate), "dd/MM HH:mm", { locale: ptBR });
    const unit = unitLabel(p.residence);
    const type = p.deliveryType === "FAST_DELIVERY" ? "Delivery" : p.deliveryType === "VISITOR" ? "Visitante" : "Encomenda";
    const courier = (p.courier ?? "—").substring(0, 24);
    const status = p.status === "DELIVERED" ? "Retirado" : "Aberto";
    const pickedBy = (p.deliveredTo ?? "—").substring(0, 28);
    doc.text(date, cols[0].x, y);
    doc.text(unit, cols[1].x, y);
    doc.text(type, cols[2].x, y);
    doc.text(courier, cols[3].x, y);
    doc.text(status, cols[4].x, y);
    doc.text(pickedBy, cols[5].x, y);
    y += 12;
  }

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Página gerada · ${data.condo.name}`, margin, pageHeight - margin);

  return doc.output("blob");
}
