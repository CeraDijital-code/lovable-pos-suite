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
  ClipboardList, Filter, Loader2, PackagePlus, PackageMinus, ArrowLeftRight, Download,
} from "lucide-react";
import { useStockMovements, useProducts } from "@/hooks/useProducts";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

const movementTypeMap = {
  in: { label: "Giriş", icon: PackagePlus, color: "text-success" },
  out: { label: "Çıkış", icon: PackageMinus, color: "text-destructive" },
  adjustment: { label: "Düzeltme", icon: ArrowLeftRight, color: "text-warning" },
};

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

  const handleExport = () => {
    if (!movements?.length) return;
    const csv = [
      "Tarih,Ürün,Barkod,Hareket,Miktar,Önceki Stok,Yeni Stok,Not",
      ...movements.map((m) =>
        `"${format(new Date(m.created_at), "dd.MM.yyyy HH:mm")}","${m.products?.name || ""}","${m.products?.barcode || ""}","${movementTypeMap[m.movement_type].label}",${m.quantity},${m.previous_stock},${m.new_stock},"${m.note || ""}"`
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
          <Button variant="outline" className="gap-2" onClick={handleExport} disabled={!movements?.length}>
            <Download className="h-4 w-4" />
            CSV İndir
          </Button>
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
