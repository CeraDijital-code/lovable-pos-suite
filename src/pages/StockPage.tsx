import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, Search, ScanBarcode, Filter } from "lucide-react";

const sampleProducts = [
  { barcode: "8690504012345", name: "Efes Pilsen 500ml", category: "Bira", price: 60, stock: 120, min: 50 },
  { barcode: "8690504067890", name: "Jack Daniel's 700ml", category: "Viski", price: 850, stock: 8, min: 10 },
  { barcode: "8690504011111", name: "Marlboro Red", category: "Sigara", price: 60, stock: 45, min: 20 },
  { barcode: "8690504022222", name: "Chivas Regal 12 700ml", category: "Viski", price: 1200, stock: 15, min: 5 },
  { barcode: "8690504033333", name: "Tuborg Gold 330ml", category: "Bira", price: 55, stock: 200, min: 100 },
  { barcode: "8690504044444", name: "Absolut Vodka 700ml", category: "Votka", price: 650, stock: 3, min: 10 },
  { barcode: "8690504055555", name: "Red Bull 250ml", category: "Enerji İçeceği", price: 45, stock: 8, min: 24 },
  { barcode: "8690504066666", name: "Parliament Aqua Blue", category: "Sigara", price: 65, stock: 5, min: 20 },
];

const StockPage = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Stok Yönetimi</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Ulusal barkod sistemi ile ürün takibi
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Yeni Ürün Ekle
          </Button>
        </div>

        {/* Search & Filter Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Ürün adı veya barkod ile ara..."
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2">
                  <ScanBarcode className="h-4 w-4" />
                  Barkod Oku
                </Button>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filtrele
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Toplam Ürün</p>
                <p className="text-xl font-bold">{sampleProducts.length}</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <Package className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Düşük Stok</p>
                <p className="text-xl font-bold">
                  {sampleProducts.filter((p) => p.stock <= p.min).length}
                </p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <Package className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Stok Değeri</p>
                <p className="text-xl font-bold">₺285,400</p>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Ürün Listesi</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Barkod</TableHead>
                  <TableHead>Ürün Adı</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Fiyat</TableHead>
                  <TableHead className="text-right">Stok</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleProducts.map((product) => (
                  <TableRow key={product.barcode} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono text-xs">
                      {product.barcode}
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{product.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      ₺{product.price.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {product.stock}
                    </TableCell>
                    <TableCell>
                      {product.stock <= product.min ? (
                        <Badge variant="destructive" className="text-xs">
                          Düşük
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs badge-success border">
                          Yeterli
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default StockPage;
