import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";

export interface OccurrencePDFData {
  id: string;
  title: string;
  description: string;
  status: string;
  complainantName?: string | null;
  complainantUnit?: string | null;
  offenderUnit?: string | null;
  adminResponse?: string | null;
  notifiedAt?: string | null;
  createdAt: string;
  condoName: string;
}

function wrap(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth) as string[];
}

export function generateOccurrencePDF(data: OccurrencePDFData): Blob {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  const maxWidth = pageWidth - margin * 2;

  const protocol = data.id.substring(0, 8).toUpperCase();
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Protocolo de Ocorrência", margin, y);

  y += 24;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(data.condoName, margin, y);
  y += 14;
  doc.text(`Protocolo nº ${protocol}`, margin, y);
  y += 14;
  doc.text(`Emitido em ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, margin, y);
  doc.setTextColor(0);

  y += 28;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(data.title, margin, y);

  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const rows: Array<[string, string]> = [
    ["Status", data.status],
    ["Registrada em", format(new Date(data.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })],
    ["Unidade infratora", data.offenderUnit ?? "—"],
    ["Reclamante", data.complainantName ?? "—"],
    ["Unidade reclamante", data.complainantUnit ?? "—"],
    [
      "Notificado em",
      data.notifiedAt
        ? format(new Date(data.notifiedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })
        : "—",
    ],
  ];
  for (const [label, value] of rows) {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, margin + 120, y);
    y += 14;
  }

  y += 12;
  doc.setFont("helvetica", "bold");
  doc.text("Descrição", margin, y);
  y += 12;
  doc.setFont("helvetica", "normal");
  for (const line of wrap(doc, data.description, maxWidth)) {
    doc.text(line, margin, y);
    y += 13;
  }

  if (data.adminResponse) {
    y += 12;
    doc.setFont("helvetica", "bold");
    doc.text("Resposta administrativa", margin, y);
    y += 12;
    doc.setFont("helvetica", "normal");
    for (const line of wrap(doc, data.adminResponse, maxWidth)) {
      doc.text(line, margin, y);
      y += 13;
    }
  }

  y = doc.internal.pageSize.getHeight() - margin;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Documento gerado automaticamente · ${data.condoName}`, margin, y);

  return doc.output("blob");
}
