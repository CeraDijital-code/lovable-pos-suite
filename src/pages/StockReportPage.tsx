import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ClipboardList, Loader2, PackagePlus, PackageMinus, ArrowLeftRight,
  Download, FileText, Printer, ChevronDown,
} from "lucide-react";
import { useStockMovements, useProducts, type StockMovement } from "@/hooks/useProducts";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const movementTypeMap = {
  in: { label: "Giriş", icon: PackagePlus, color: "text-success" },
  out: { label: "Çıkış", icon: PackageMinus, color: "text-destructive" },
  adjustment: { label: "Düzeltme", icon: ArrowLeftRight, color: "text-warning" },
};

interface ProductSummary {
  name: string;
  barcode: string;
  totalIn: number;
  totalOut: number;
  totalAdjustment: number;
  net: number;
  currentStock: number;
}

function buildProductSummary(movements: StockMovement[]): ProductSummary[] {
  const map = new Map<string, ProductSummary>();

  for (const m of movements) {
    const key = m.product_id;
    if (!map.has(key)) {
      map.set(key, {
        name: m.products?.name || "-",
        barcode: m.products?.barcode || "-",
        totalIn: 0,
        totalOut: 0,
        totalAdjustment: 0,
        net: 0,
        currentStock: m.new_stock,
      });
    }
    const s = map.get(key)!;
    if (m.movement_type === "in") s.totalIn += m.quantity;
    else if (m.movement_type === "out") s.totalOut += m.quantity;
    else s.totalAdjustment += m.quantity;
    // Track latest stock
    if (new Date(m.created_at) > new Date()) s.currentStock = m.new_stock;
    s.currentStock = m.new_stock; // movements ordered desc, first is latest
  }

  // Calculate net and fix currentStock (first movement is latest due to desc order)
  const result: ProductSummary[] = [];
  for (const [key, s] of map) {
    s.net = s.totalIn - s.totalOut;
    result.push(s);
  }

  return result.sort((a, b) => a.name.localeCompare(b.name, "tr"));
}

function generatePDF(
  movements: StockMovement[],
  startDate: string,
  endDate: string,
  stats: { totalMovements: number; totalIn: number; totalOut: number },
  printMode = false
) {
  const summary = buildProductSummary(movements);
  const doc = new jsPDF("landscape", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // --- Header background bar ---
  doc.setFillColor(30, 30, 30);
  doc.rect(0, 0, pageWidth, 32, "F");

  // Company name
  doc.setTextColor(245, 158, 11); // amber
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("TekelPOS", margin, 14);

  doc.setTextColor(180, 180, 180);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("ERP Stok Yönetim Sistemi", margin, 20);

  // Report title on right
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("STOK HAREKET RAPORU", pageWidth - margin, 14, { align: "right" });

  doc.setTextColor(180, 180, 180);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  const dateRange = `${format(new Date(startDate), "dd MMMM yyyy", { locale: tr })} — ${format(new Date(endDate), "dd MMMM yyyy", { locale: tr })}`;
  doc.text(dateRange, pageWidth - margin, 21, { align: "right" });

  doc.setTextColor(120, 120, 120);
  doc.setFontSize(7);
  doc.text(`Oluşturulma: ${format(new Date(), "dd.MM.yyyy HH:mm")}`, pageWidth - margin, 27, { align: "right" });

  // --- Summary stats boxes ---
  const boxY = 38;
  const boxH = 18;
  const boxW = (pageWidth - margin * 2 - 20) / 3;
  const boxes = [
    { label: "Toplam Hareket", value: String(stats.totalMovements), color: [245, 158, 11] as [number, number, number] },
    { label: "Toplam Giriş", value: `${stats.totalIn} adet`, color: [34, 197, 94] as [number, number, number] },
    { label: "Toplam Çıkış", value: `${stats.totalOut} adet`, color: [239, 68, 68] as [number, number, number] },
  ];

  boxes.forEach((box, i) => {
    const x = margin + i * (boxW + 10);
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(x, boxY, boxW, boxH, 2, 2, "F");
    doc.setDrawColor(box.color[0], box.color[1], box.color[2]);
    doc.setLineWidth(0.5);
    doc.line(x, boxY, x, boxY + boxH);

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(box.label, x + 5, boxY + 7);

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(box.value, x + 5, boxY + 14);
  });

  // --- Product summary table ---
  const tableStartY = boxY + boxH + 10;

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("ÜRÜN BAZLI STOK ÖZET", margin, tableStartY);

  autoTable(doc, {
    startY: tableStartY + 4,
    margin: { left: margin, right: margin },
    head: [["#", "Barkod", "Ürün Adı", "Giriş", "Çıkış", "Düzeltme", "Net Hareket", "Güncel Stok"]],
    body: summary.map((s, i) => [
      String(i + 1),
      s.barcode,
      s.name,
      String(s.totalIn),
      String(s.totalOut),
      String(s.totalAdjustment),
      s.net >= 0 ? `+${s.net}` : String(s.net),
      String(s.currentStock),
    ]),
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: [220, 220, 220],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [30, 30, 30],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { font: "courier", fontSize: 7 },
      3: { halign: "right", textColor: [34, 150, 80] },
      4: { halign: "right", textColor: [200, 50, 50] },
      5: { halign: "right", textColor: [180, 130, 20] },
      6: { halign: "right", fontStyle: "bold" },
      7: { halign: "right", fontStyle: "bold" },
    },
    didDrawPage: (data) => {
      // Footer on every page
      const pageNum = doc.getNumberOfPages();
      doc.setFillColor(245, 245, 245);
      doc.rect(0, pageHeight - 12, pageWidth, 12, "F");
      doc.setTextColor(130, 130, 130);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text("TekelPOS ERP — Stok Hareket Raporu", margin, pageHeight - 5);
      doc.text(`Sayfa ${data.pageNumber}`, pageWidth - margin, pageHeight - 5, { align: "right" });
    },
  });

  // --- Total row separator ---
  const finalY = (doc as any).lastAutoTable?.finalY || tableStartY + 30;

  if (finalY + 15 < pageHeight - 15) {
    doc.setFillColor(30, 30, 30);
    doc.roundedRect(margin, finalY + 4, pageWidth - margin * 2, 10, 1, 1, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("TOPLAM", margin + 5, finalY + 10.5);
    doc.text(`Giriş: ${stats.totalIn}`, margin + 100, finalY + 10.5);
    doc.text(`Çıkış: ${stats.totalOut}`, margin + 145, finalY + 10.5);
    doc.text(`Net: ${stats.totalIn - stats.totalOut >= 0 ? "+" : ""}${stats.totalIn - stats.totalOut}`, margin + 190, finalY + 10.5);
    doc.text(`${summary.length} ürün`, pageWidth - margin - 5, finalY + 10.5, { align: "right" });
  }

  if (printMode) {
    doc.autoPrint();
    window.open(doc.output("bloburl"), "_blank");
  } else {
    doc.save(`stok-raporu-${startDate}-${endDate}.pdf`);
  }
}

const StockReportPage = () => {
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);
  const [typeFilter, setTypeFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");

  const { data: movements, isLoading } = useStockMovements({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    type: typeFilter && typeFilter !== "all" ? typeFilter : undefined,
    productId: productFilter && productFilter !== "all" ? productFilter : undefined,
  });

  const { data: products } = useProducts();

  const totalIn = movements?.filter((m) => m.movement_type === "in").reduce((s, m) => s + m.quantity, 0) || 0;
  const totalOut = movements?.filter((m) => m.movement_type === "out").reduce((s, m) => s + m.quantity, 0) || 0;
  const totalMovements = movements?.length || 0;

  const stats = { totalMovements, totalIn, totalOut };

  const handleExportCSV = () => {
    if (!movements?.length) return;
    const summary = buildProductSummary(movements);
    const csv = [
      "Barkod,Ürün Adı,Toplam Giriş,Toplam Çıkış,Düzeltme,Net Hareket,Güncel Stok",
      ...summary.map((s) =>
        `"${s.barcode}","${s.name}",${s.totalIn},${s.totalOut},${s.totalAdjustment},${s.net},${s.currentStock}`
      ),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stok-raporu-${startDate}-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    if (!movements?.length) return;
    generatePDF(movements, startDate, endDate, stats);
  };

  const handlePrint = () => {
    if (!movements?.length) return;
    generatePDF(movements, startDate, endDate, stats, true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Stok Raporu</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Tarih bazlı stok hareketleri ve detaylı raporlama
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={handlePrint} disabled={!movements?.length}>
              <Printer className="h-4 w-4" />
              Yazdır
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2" disabled={!movements?.length}>
                  <Download className="h-4 w-4" />
                  Dışa Aktar
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportPDF} className="gap-2">
                  <FileText className="h-4 w-4" />
                  PDF olarak indir
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCSV} className="gap-2">
                  <Download className="h-4 w-4" />
                  CSV olarak indir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Başlangıç Tarihi</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Bitiş Tarihi</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Hareket Tipi</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger><SelectValue placeholder="Tümü" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="in">Giriş</SelectItem>
                    <SelectItem value="out">Çıkış</SelectItem>
                    <SelectItem value="adjustment">Düzeltme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Ürün</Label>
                <Select value={productFilter} onValueChange={setProductFilter}>
                  <SelectTrigger><SelectValue placeholder="Tümü" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    {products?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Toplam Hareket</p>
                <p className="text-xl font-bold">{totalMovements}</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <PackagePlus className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Toplam Giriş</p>
                <p className="text-xl font-bold">{totalIn} adet</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <PackageMinus className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Toplam Çıkış</p>
                <p className="text-xl font-bold">{totalOut} adet</p>
              </div>
            </div>
          </div>
        </div>

        {/* Movements Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Stok Hareketleri</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !movements?.length ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ClipboardList className="h-12 w-12 mb-3 opacity-40" />
                <p>Bu tarih aralığında stok hareketi bulunamadı</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Ürün</TableHead>
                    <TableHead>Barkod</TableHead>
                    <TableHead>Hareket</TableHead>
                    <TableHead className="text-right">Miktar</TableHead>
                    <TableHead className="text-right">Önceki</TableHead>
                    <TableHead className="text-right">Sonraki</TableHead>
                    <TableHead>Not</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((m) => {
                    const info = movementTypeMap[m.movement_type];
                    const Icon = info.icon;
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="text-xs">
                          {format(new Date(m.created_at), "dd MMM yyyy HH:mm", { locale: tr })}
                        </TableCell>
                        <TableCell className="font-medium">{m.products?.name || "-"}</TableCell>
                        <TableCell className="font-mono text-xs">{m.products?.barcode || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <Icon className={`h-3 w-3 ${info.color}`} />
                            {info.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">{m.quantity}</TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">{m.previous_stock}</TableCell>
                        <TableCell className="text-right font-mono font-semibold">{m.new_stock}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {m.note || "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default StockReportPage;
