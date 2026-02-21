import jsPDF from "jspdf";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

// Font cache
let fontLoaded = false;
let regularFontBase64 = "";
let boldFontBase64 = "";

async function loadFontAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function ensureTurkishFonts(doc: jsPDF) {
  if (!fontLoaded) {
    regularFontBase64 = await loadFontAsBase64("/fonts/Roboto-Regular.ttf");
    boldFontBase64 = await loadFontAsBase64("/fonts/Roboto-Bold.ttf");
    fontLoaded = true;
  }

  doc.addFileToVFS("Roboto-Regular.ttf", regularFontBase64);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.addFileToVFS("Roboto-Bold.ttf", boldFontBase64);
  doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");
  doc.setFont("Roboto", "normal");
}

export interface PdfHeaderOptions {
  doc: jsPDF;
  storeName: string;
  subtitle: string;
  dateLabel: string;
  logoUrl?: string | null;
}

async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Draws a professional header bar and returns the Y position after it.
 */
export async function drawPdfHeader(opts: PdfHeaderOptions): Promise<number> {
  const { doc, storeName, subtitle, dateLabel, logoUrl } = opts;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const headerH = 34;

  // Dark header bar
  doc.setFillColor(24, 24, 27);
  doc.rect(0, 0, pageWidth, headerH, "F");

  // Accent line
  doc.setFillColor(245, 158, 11);
  doc.rect(0, headerH, pageWidth, 1.2, "F");

  let logoEndX = margin;

  // Logo
  if (logoUrl) {
    const imgData = await loadImageAsBase64(logoUrl);
    if (imgData) {
      try {
        doc.addImage(imgData, "AUTO", margin, 5, 24, 24);
        logoEndX = margin + 28;
      } catch {
        // logo failed, just skip
      }
    }
  }

  // Store name
  doc.setFont("Roboto", "bold");
  doc.setTextColor(245, 158, 11);
  doc.setFontSize(16);
  doc.text(storeName, logoEndX, 15);

  // Subtitle
  doc.setFont("Roboto", "normal");
  doc.setTextColor(180, 180, 180);
  doc.setFontSize(8);
  doc.text(subtitle, logoEndX, 22);

  // Date info right side
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("Roboto", "bold");
  doc.text(dateLabel, pageWidth - margin, 15, { align: "right" });

  doc.setTextColor(140, 140, 140);
  doc.setFontSize(7);
  doc.setFont("Roboto", "normal");
  doc.text(`Oluşturulma: ${format(new Date(), "dd.MM.yyyy HH:mm")}`, pageWidth - margin, 22, { align: "right" });

  // Reset text color
  doc.setTextColor(30, 30, 30);

  return headerH + 8;
}

/**
 * Draws footer on every page
 */
export function drawPdfFooter(doc: jsPDF, storeName: string, reportTitle: string) {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(248, 248, 248);
    doc.rect(0, pageHeight - 12, pageWidth, 12, "F");
    doc.setDrawColor(220, 220, 220);
    doc.line(0, pageHeight - 12, pageWidth, pageHeight - 12);
    doc.setFont("Roboto", "normal");
    doc.setTextColor(130, 130, 130);
    doc.setFontSize(7);
    doc.text(`${storeName} — ${reportTitle}`, margin, pageHeight - 5);
    doc.text(`Sayfa ${i} / ${pageCount}`, pageWidth - margin, pageHeight - 5, { align: "right" });
  }
}

/**
 * Creates summary stat boxes (like the stock report)
 */
export function drawStatBoxes(
  doc: jsPDF,
  y: number,
  boxes: { label: string; value: string; color: [number, number, number] }[]
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const boxW = (pageWidth - margin * 2 - (boxes.length - 1) * 8) / boxes.length;
  const boxH = 18;

  boxes.forEach((box, i) => {
    const x = margin + i * (boxW + 8);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(x, y, boxW, boxH, 2, 2, "F");
    doc.setDrawColor(box.color[0], box.color[1], box.color[2]);
    doc.setLineWidth(0.6);
    doc.line(x, y, x, y + boxH);

    doc.setFont("Roboto", "normal");
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.text(box.label, x + 5, y + 7);

    doc.setFont("Roboto", "bold");
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(12);
    doc.text(box.value, x + 5, y + 14);
  });

  return y + boxH + 8;
}

/**
 * Default autoTable styles with Roboto font
 */
export function getTableStyles() {
  return {
    styles: {
      font: "Roboto",
      fontSize: 8,
      cellPadding: 3,
      lineColor: [220, 220, 220] as [number, number, number],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [24, 24, 27] as [number, number, number],
      textColor: [255, 255, 255] as [number, number, number],
      fontStyle: "bold" as const,
      fontSize: 8,
      font: "Roboto",
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250] as [number, number, number],
    },
  };
}
