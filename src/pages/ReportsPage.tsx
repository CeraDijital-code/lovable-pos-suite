import { useState, useMemo, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  BarChart3, TrendingUp, CalendarIcon, DollarSign, Download, Users, Package,
  CreditCard, ShoppingCart, ChevronDown, Wallet, ArrowDownCircle, DoorOpen, DoorClosed,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
} from "date-fns";
import { tr } from "date-fns/locale";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { useReportData } from "@/hooks/useReports";
import { useCashSessions, type CashSession } from "@/hooks/useCashSessions";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/integrations/supabase/client";
import {
  ensureTurkishFonts, drawPdfHeader, drawPdfFooter, getTableStyles, drawStatBoxes,
} from "@/utils/pdfUtils";

type Period = "daily" | "weekly" | "monthly" | "cash-sessions";

const CHART_COLORS = [
  "hsl(36, 80%, 50%)", "hsl(142, 71%, 45%)", "hsl(217, 91%, 60%)",
  "hsl(0, 72%, 51%)", "hsl(38, 92%, 50%)",
];

const ReportsPage = () => {
  const [period, setPeriod] = useState<Period>("daily");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { data: settings } = useStoreSettings();
  const currency = settings?.currency_symbol || "₺";

  const { startDate, endDate } = useMemo(() => {
    if (period === "daily" || period === "cash-sessions") {
      return { startDate: startOfDay(selectedDate), endDate: endOfDay(selectedDate) };
    } else if (period === "weekly") {
      return {
        startDate: startOfWeek(selectedDate, { weekStartsOn: 1 }),
        endDate: endOfWeek(selectedDate, { weekStartsOn: 1 }),
      };
    } else {
      return { startDate: startOfMonth(selectedDate), endDate: endOfMonth(selectedDate) };
    }
  }, [period, selectedDate]);

  const { data: report, isLoading } = useReportData(startDate, endDate);
  const { data: cashSessions = [], isLoading: sessionsLoading } = useCashSessions(
    startOfMonth(selectedDate).toISOString(),
    endOfMonth(selectedDate).toISOString()
  );

  const [profileMap, setProfileMap] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    supabase.from("profiles").select("user_id, full_name").then(({ data }) => {
      if (data) setProfileMap(new Map(data.map((p) => [p.user_id, p.full_name])));
    });
  }, []);

  const periodLabel = useMemo(() => {
    if (period === "daily") return format(selectedDate, "dd MMMM yyyy", { locale: tr });
    if (period === "weekly")
      return `${format(startDate, "dd MMM", { locale: tr })} - ${format(endDate, "dd MMM yyyy", { locale: tr })}`;
    return format(selectedDate, "MMMM yyyy", { locale: tr });
  }, [period, selectedDate, startDate, endDate]);

  const logoUrl = settings?.logo_light_url || settings?.logo_dark_url || null;

  const generatePDF = async () => {
    if (!report) return;
    const doc = new jsPDF();
    await ensureTurkishFonts(doc);

    const storeName = settings?.store_name || "TekelPOS";
    const title = period === "monthly"
      ? `Ay Sonu Kapanış Raporu — ${periodLabel}`
      : `Gün Sonu Raporu — ${periodLabel}`;

    let y = await drawPdfHeader({
      doc, storeName, subtitle: "ERP Raporlama Sistemi", dateLabel: periodLabel, logoUrl,
    });

    const tbl = getTableStyles();

    // Stat boxes
    y = drawStatBoxes(doc, y, [
      { label: "Toplam Ciro", value: `${currency}${report.totalRevenue.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`, color: [245, 158, 11] },
      { label: "İşlem Sayısı", value: report.saleCount.toString(), color: [34, 197, 94] },
      { label: "Ortalama Sepet", value: `${currency}${report.avgBasket.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`, color: [59, 130, 246] },
    ]);

    // Summary table
    doc.setFont("Roboto", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text("ÖZET BİLGİLER", 14, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [["Metrik", "Değer"]],
      body: [
        ["Toplam Ciro", `${currency}${report.totalRevenue.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`],
        ["Toplam İndirim", `${currency}${report.totalDiscount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`],
        ["İşlem Sayısı", report.saleCount.toString()],
        ["Ortalama Sepet", `${currency}${report.avgBasket.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`],
        ["Satılan Ürün Adedi", report.totalItems.toString()],
        ["Tedarikçi Ödemeleri", `${currency}${report.supplierPayments.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`],
      ],
      ...tbl,
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    // Payment methods
    if (report.paymentMethods.length > 0) {
      doc.setFont("Roboto", "bold");
      doc.setFontSize(10);
      doc.text("ÖDEME YÖNTEMLERİ", 14, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [["Yöntem", "İşlem", "Tutar"]],
        body: report.paymentMethods.map((pm) => [
          pm.label,
          pm.count.toString(),
          `${currency}${pm.total.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`,
        ]),
        ...tbl,
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }

    // Staff
    if (report.staffSummary.length > 0) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFont("Roboto", "bold");
      doc.setFontSize(10);
      doc.text("PERSONEL PERFORMANSI", 14, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [["Personel", "Satış", "Ürün", "Ciro", "İndirim"]],
        body: report.staffSummary.map((s) => [
          s.fullName,
          s.saleCount.toString(),
          s.itemCount.toString(),
          `${currency}${s.totalRevenue.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`,
          `${currency}${s.totalDiscount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`,
        ]),
        ...tbl,
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }

    // Top products
    if (report.topProducts.length > 0) {
      if (y > 220) { doc.addPage(); y = 20; }
      doc.setFont("Roboto", "bold");
      doc.setFontSize(10);
      doc.text("EN ÇOK SATAN ÜRÜNLER", 14, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [["Ürün", "Adet", "Ciro"]],
        body: report.topProducts.map((p) => [
          p.name,
          p.quantity.toString(),
          `${currency}${p.revenue.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`,
        ]),
        ...tbl,
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }

    // Sale details
    if (report.sales.length > 0) {
      if (y > 200) { doc.addPage(); y = 20; }
      doc.setFont("Roboto", "bold");
      doc.setFontSize(10);
      doc.text("SATIŞ DETAYLARI", 14, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [["#", "Saat", "Personel", "Ödeme", "Tutar"]],
        body: report.sales.map((s) => [
          `#${s.sale_number}`,
          format(new Date(s.created_at), "HH:mm"),
          report.staffSummary.find((st) => st.userId === s.created_by)?.fullName || "?",
          s.payment_method === "cash" ? "Nakit" : s.payment_method === "card" ? "Kart" : s.payment_method,
          `${currency}${Number(s.total).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`,
        ]),
        ...tbl,
        styles: { ...tbl.styles, fontSize: 7 },
      });
    }

    drawPdfFooter(doc, storeName, title);

    const filename = period === "monthly"
      ? `ay-sonu-raporu-${format(selectedDate, "yyyy-MM")}.pdf`
      : `gun-sonu-raporu-${format(selectedDate, "yyyy-MM-dd")}.pdf`;
    doc.save(filename);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Raporlar</h1>
            <p className="text-muted-foreground text-sm mt-1">{periodLabel}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {format(selectedDate, "dd MMM yyyy", { locale: tr })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => d && setSelectedDate(d)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                  locale={tr}
                />
              </PopoverContent>
            </Popover>
            <Button onClick={generatePDF} disabled={isLoading || !report} className="gap-2">
              <Download className="h-4 w-4" />
              {period === "monthly" ? "Ay Sonu Raporu" : "Gün Sonu Raporu"}
            </Button>
          </div>
        </div>

        {/* Period tabs */}
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)} className="space-y-4">
          <TabsList>
            <TabsTrigger value="daily">Günlük</TabsTrigger>
            <TabsTrigger value="weekly">Haftalık</TabsTrigger>
            <TabsTrigger value="monthly">Aylık</TabsTrigger>
            <TabsTrigger value="cash-sessions" className="gap-1.5">
              <DoorOpen className="h-3.5 w-3.5" />
              Kasa Raporları
            </TabsTrigger>
          </TabsList>

          {/* Stats cards */}
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : report ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="stat-card">
                <CardContent className="p-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Toplam Ciro</p>
                      <p className="text-xl font-bold">
                        {currency}{report.totalRevenue.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="stat-card">
                <CardContent className="p-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                      <ShoppingCart className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">İşlem Sayısı</p>
                      <p className="text-xl font-bold">{report.saleCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="stat-card">
                <CardContent className="p-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                      <TrendingUp className="h-5 w-5 text-info" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ortalama Sepet</p>
                      <p className="text-xl font-bold">
                        {currency}{report.avgBasket.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="stat-card">
                <CardContent className="p-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                      <ArrowDownCircle className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Toplam İndirim</p>
                      <p className="text-xl font-bold">
                        {currency}{report.totalDiscount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          <TabsContent value="daily" className="space-y-4 mt-0">
            <ReportCharts report={report} isLoading={isLoading} currency={currency} period={period} />
          </TabsContent>
          <TabsContent value="weekly" className="space-y-4 mt-0">
            <ReportCharts report={report} isLoading={isLoading} currency={currency} period={period} />
          </TabsContent>
          <TabsContent value="monthly" className="space-y-4 mt-0">
            <ReportCharts report={report} isLoading={isLoading} currency={currency} period={period} />
          </TabsContent>

          <TabsContent value="cash-sessions" className="space-y-4 mt-0">
            <CashSessionsReport
              sessions={cashSessions}
              isLoading={sessionsLoading}
              profileMap={profileMap}
              currency={currency}
              selectedDate={selectedDate}
              storeName={settings?.store_name || "TekelPOS"}
              logoUrl={logoUrl}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

function ReportCharts({
  report,
  isLoading,
  currency,
  period,
}: {
  report: ReturnType<typeof useReportData>["data"];
  isLoading: boolean;
  currency: string;
  period: Period;
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }
  if (!report) return null;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              {period === "daily" ? "Saatlik Satış" : "Satış Dağılımı"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.hourlySales.length > 0 && period === "daily" ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={report.hourlySales}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <Tooltip
                    formatter={(value: number) => [`${currency}${value.toLocaleString("tr-TR")}`, "Ciro"]}
                    contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--popover))" }}
                  />
                  <Area type="monotone" dataKey="total" stroke="hsl(36, 80%, 50%)" fill="hsl(36, 80%, 50%)" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                Saatlik grafik sadece günlük görünümde aktiftir
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Ödeme Yöntemleri
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.paymentMethods.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={250}>
                  <PieChart>
                    <Pie data={report.paymentMethods} dataKey="total" nameKey="label" cx="50%" cy="50%" outerRadius={90} label={({ label }) => label}>
                      {report.paymentMethods.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => `${currency}${v.toLocaleString("tr-TR")}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-3">
                  {report.paymentMethods.map((pm, i) => (
                    <div key={pm.method} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{pm.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {pm.count} işlem · {currency}{pm.total.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                Bu dönemde satış bulunmuyor
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Personel Performansı
          </CardTitle>
        </CardHeader>
        <CardContent>
          {report.staffSummary.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Personel</TableHead>
                    <TableHead className="text-right">Satış</TableHead>
                    <TableHead className="text-right">Ürün Adedi</TableHead>
                    <TableHead className="text-right">Ciro</TableHead>
                    <TableHead className="text-right">İndirim</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.staffSummary.map((s) => (
                    <TableRow key={s.userId}>
                      <TableCell className="font-medium">{s.fullName}</TableCell>
                      <TableCell className="text-right">{s.saleCount}</TableCell>
                      <TableCell className="text-right">{s.itemCount}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {currency}{s.totalRevenue.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {currency}{s.totalDiscount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">Bu dönemde satış bulunmuyor</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            En Çok Satan Ürünler (Top 10)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {report.topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={report.topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => `${currency}${v.toLocaleString("tr-TR")}`} contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--popover))" }} />
                <Bar dataKey="revenue" fill="hsl(36, 80%, 50%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">Bu dönemde satış bulunmuyor</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            Gelir-Gider Özeti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Toplam Gelir</p>
              <p className="text-lg font-bold text-success">
                +{currency}{report.totalRevenue.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Tedarikçi Ödemeleri</p>
              <p className="text-lg font-bold text-destructive">
                -{currency}{report.supplierPayments.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Net Durum</p>
              <p className={cn(
                "text-lg font-bold",
                (report.totalRevenue - report.supplierPayments) >= 0 ? "text-success" : "text-destructive"
              )}>
                {currency}{(report.totalRevenue - report.supplierPayments).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-primary" />
            Satış Detayları ({report.sales.length} işlem)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {report.sales.length > 0 ? (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {report.sales.map((sale) => {
                const staffName = report.staffSummary.find((s) => s.userId === sale.created_by)?.fullName || "Bilinmeyen";
                return (
                  <Collapsible key={sale.id}>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between rounded-lg border px-4 py-3 hover:bg-muted/50 transition-colors text-left">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-mono text-muted-foreground">#{sale.sale_number}</span>
                          <span className="text-sm">{format(new Date(sale.created_at), "HH:mm")}</span>
                          <Badge variant="outline" className="text-xs">{staffName}</Badge>
                          <Badge variant="secondary" className="text-xs">
                            {sale.payment_method === "cash" ? "Nakit" : sale.payment_method === "card" ? "Kart" : sale.payment_method}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-sm">
                            {currency}{Number(sale.total).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                          </span>
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="ml-4 mr-4 mt-1 mb-2 rounded-lg border bg-muted/30 p-3">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Ürün</TableHead>
                              <TableHead className="text-xs text-right">Adet</TableHead>
                              <TableHead className="text-xs text-right">B.Fiyat</TableHead>
                              <TableHead className="text-xs text-right">İndirim</TableHead>
                              <TableHead className="text-xs text-right">Toplam</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sale.sale_items.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="text-xs">
                                  {item.product_name}
                                  {item.campaign_name && (
                                    <Badge variant="outline" className="ml-1 text-[10px]">{item.campaign_name}</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-xs text-right">{item.quantity}</TableCell>
                                <TableCell className="text-xs text-right">{currency}{Number(item.unit_price).toLocaleString("tr-TR")}</TableCell>
                                <TableCell className="text-xs text-right text-muted-foreground">{currency}{Number(item.discount).toLocaleString("tr-TR")}</TableCell>
                                <TableCell className="text-xs text-right font-medium">{currency}{Number(item.total).toLocaleString("tr-TR")}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {sale.loyalty_customers && (
                          <p className="text-xs text-muted-foreground mt-2">
                            🎯 Sadakat: {sale.loyalty_customers.full_name} | +{sale.points_earned} puan
                          </p>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">Bu dönemde satış bulunmuyor</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface SessionSalesData {
  totalRevenue: number;
  cashTotal: number;
  cardTotal: number;
  mixedTotal: number;
  saleCount: number;
  cashDiff: number;
}

function CashSessionsReport({
  sessions,
  isLoading,
  profileMap,
  currency,
  selectedDate,
  storeName,
  logoUrl,
}: {
  sessions: CashSession[];
  isLoading: boolean;
  profileMap: Map<string, string>;
  currency: string;
  selectedDate: Date;
  storeName: string;
  logoUrl?: string | null;
}) {
  const [sessionSales, setSessionSales] = useState<Map<string, SessionSalesData>>(new Map());

  useEffect(() => {
    if (sessions.length === 0) return;
    const fetchAll = async () => {
      const map = new Map<string, SessionSalesData>();
      for (const session of sessions) {
        const startTime = session.opened_at;
        const endTime = session.closed_at || new Date().toISOString();
        const { data: sales } = await supabase
          .from("sales")
          .select("total, payment_method")
          .gte("created_at", startTime)
          .lte("created_at", endTime);

        const rows = sales || [];
        let totalRevenue = 0, cashTotal = 0, cardTotal = 0, mixedTotal = 0;
        for (const s of rows) {
          const t = Number(s.total);
          totalRevenue += t;
          if (s.payment_method === "cash") cashTotal += t;
          else if (s.payment_method === "card") cardTotal += t;
          else mixedTotal += t;
        }
        for (const s of rows) {
          if (s.payment_method.startsWith("split:")) {
            const cashMatch = s.payment_method.match(/cash=([0-9.]+)/);
            if (cashMatch) cashTotal += parseFloat(cashMatch[1]);
          }
        }
        const expectedCash = Number(session.opening_amount) + cashTotal;
        const closingAmt = session.closing_amount != null ? Number(session.closing_amount) : null;
        const cashDiff = closingAmt != null ? closingAmt - expectedCash : 0;

        map.set(session.id, { totalRevenue, cashTotal, cardTotal, mixedTotal, saleCount: rows.length, cashDiff });
      }
      setSessionSales(map);
    };
    fetchAll();
  }, [sessions]);

  const fmtMoney = (n: number) => `${currency}${n.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`;

  const generateSessionPDF = async (session: CashSession) => {
    const doc = new jsPDF();
    await ensureTurkishFonts(doc);

    const openDate = new Date(session.opened_at);
    const closeDate = session.closed_at ? new Date(session.closed_at) : null;
    const salesData = sessionSales.get(session.id);

    let y = await drawPdfHeader({
      doc,
      storeName,
      subtitle: "Kasa Faaliyet Raporu",
      dateLabel: format(openDate, "dd MMMM yyyy", { locale: tr }),
      logoUrl,
    });

    const tbl = getTableStyles();

    // Session info table
    doc.setFont("Roboto", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text("OTURUM BİLGİLERİ", 14, y);
    y += 4;

    const bodyRows: string[][] = [
      ["Açılış Personeli", profileMap.get(session.opened_by) || "Bilinmeyen"],
      ["Açılış Saati", format(openDate, "HH:mm:ss")],
      ["Açılış Tutarı", fmtMoney(Number(session.opening_amount))],
      ["Kapanış Saati", closeDate ? format(closeDate, "HH:mm:ss") : "Hâlâ Açık"],
      ["Durum", session.status === "open" ? "Açık" : "Kapalı"],
    ];
    if (session.closing_amount != null) {
      bodyRows.push(["Kapanış Tutarı", fmtMoney(Number(session.closing_amount))]);
    }
    if (session.notes) {
      bodyRows.push(["Not", session.notes]);
    }

    autoTable(doc, {
      startY: y,
      head: [["Bilgi", "Değer"]],
      body: bodyRows,
      ...tbl,
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    // Sales summary
    if (salesData) {
      // Stat boxes
      y = drawStatBoxes(doc, y, [
        { label: "Toplam Satış", value: salesData.saleCount.toString(), color: [245, 158, 11] },
        { label: "Nakit", value: fmtMoney(salesData.cashTotal), color: [34, 197, 94] },
        { label: "Kart", value: fmtMoney(salesData.cardTotal), color: [59, 130, 246] },
      ]);

      doc.setFont("Roboto", "bold");
      doc.setFontSize(10);
      doc.text("SATIŞ ÖZETİ", 14, y);
      y += 4;
      const salesRows: string[][] = [
        ["Toplam Satış", salesData.saleCount.toString()],
        ["Toplam Ciro", fmtMoney(salesData.totalRevenue)],
        ["Nakit", fmtMoney(salesData.cashTotal)],
        ["Kart", fmtMoney(salesData.cardTotal)],
      ];
      if (salesData.mixedTotal > 0) salesRows.push(["Karma", fmtMoney(salesData.mixedTotal)]);
      if (session.closing_amount != null) {
        salesRows.push(["Beklenen Nakit", fmtMoney(Number(session.opening_amount) + salesData.cashTotal)]);
        salesRows.push(["Kapanış Kasası", fmtMoney(Number(session.closing_amount))]);
        salesRows.push(["Fark", `${salesData.cashDiff >= 0 ? "+" : ""}${fmtMoney(salesData.cashDiff)}`]);
      }
      autoTable(doc, {
        startY: y,
        head: [["Metrik", "Değer"]],
        body: salesRows,
        ...tbl,
      });
    }

    drawPdfFooter(doc, storeName, "Kasa Faaliyet Raporu");

    doc.save(`kasa-raporu-${format(openDate, "yyyy-MM-dd-HHmm")}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <DoorOpen className="h-4 w-4 text-primary" />
            Kasa Oturumları — {format(selectedDate, "MMMM yyyy", { locale: tr })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Personel</TableHead>
                  <TableHead>Açılış</TableHead>
                  <TableHead>Açılış ₺</TableHead>
                  <TableHead>Kapanış</TableHead>
                  <TableHead>Satış</TableHead>
                  <TableHead>Nakit</TableHead>
                  <TableHead>Kart</TableHead>
                  <TableHead>Ciro</TableHead>
                  <TableHead>Fark</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">PDF</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((s) => {
                  const openDate = new Date(s.opened_at);
                  const closeDate = s.closed_at ? new Date(s.closed_at) : null;
                  const sd = sessionSales.get(s.id);
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{format(openDate, "dd.MM.yyyy")}</TableCell>
                      <TableCell>{profileMap.get(s.opened_by) || "Bilinmeyen"}</TableCell>
                      <TableCell>{format(openDate, "HH:mm")}</TableCell>
                      <TableCell>{fmtMoney(Number(s.opening_amount))}</TableCell>
                      <TableCell>{closeDate ? format(closeDate, "HH:mm") : "—"}</TableCell>
                      <TableCell className="text-center">{sd?.saleCount ?? "—"}</TableCell>
                      <TableCell>{sd ? fmtMoney(sd.cashTotal) : "—"}</TableCell>
                      <TableCell>{sd ? fmtMoney(sd.cardTotal) : "—"}</TableCell>
                      <TableCell className="font-semibold">{sd ? fmtMoney(sd.totalRevenue) : "—"}</TableCell>
                      <TableCell>
                        {sd && s.closing_amount != null ? (
                          <span className={cn("text-xs font-medium", sd.cashDiff >= 0 ? "text-success" : "text-destructive")}>
                            {sd.cashDiff >= 0 ? "+" : ""}{fmtMoney(sd.cashDiff)}
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={s.status === "open" ? "default" : "secondary"} className="text-[10px]">
                          {s.status === "open" ? "Açık" : "Kapalı"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => generateSessionPDF(s)}>
                          <Download className="h-3 w-3" />
                          PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">Bu ay için kasa oturumu bulunmuyor</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ReportsPage;
