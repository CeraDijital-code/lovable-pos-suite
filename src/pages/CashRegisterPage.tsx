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
import { Wallet, ScanBarcode, Trash2, Plus, CreditCard, Banknote } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const cartItems = [
  { barcode: "8690504012345", name: "Efes Pilsen 500ml", qty: 3, price: 60, total: 180 },
  { barcode: "8690504067890", name: "Jack Daniel's 700ml", qty: 1, price: 850, total: 850 },
  { barcode: "8690504055555", name: "Red Bull 250ml", qty: 2, price: 45, total: 90 },
];

const CashRegisterPage = () => {
  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  const discount = 0;
  const grandTotal = subtotal - discount;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Kasa</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Satış işlemlerini gerçekleştirin
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Cart */}
          <div className="lg:col-span-2 space-y-4">
            {/* Barcode Input */}
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <ScanBarcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Barkod okutun veya ürün arayın..."
                      className="pl-9 text-lg h-12"
                      autoFocus
                    />
                  </div>
                  <Button size="lg" className="h-12 gap-2">
                    <Plus className="h-4 w-4" />
                    Ekle
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Cart Items */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Sepet</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ürün</TableHead>
                      <TableHead className="text-center">Adet</TableHead>
                      <TableHead className="text-right">Birim Fiyat</TableHead>
                      <TableHead className="text-right">Toplam</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cartItems.map((item) => (
                      <TableRow key={item.barcode}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {item.barcode}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            defaultValue={item.qty}
                            className="w-16 text-center mx-auto h-8"
                            min={1}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          ₺{item.price.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ₺{item.total.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Payment Summary */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-primary" />
                  Ödeme Özeti
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ara Toplam</span>
                    <span>₺{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">İndirim</span>
                    <span className="text-success">-₺{discount.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-semibold">Genel Toplam</span>
                    <span className="text-xl font-bold text-primary">
                      ₺{grandTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Button className="w-full gap-2 h-12 text-base" size="lg">
                    <Banknote className="h-5 w-5" />
                    Nakit Ödeme
                  </Button>
                  <Button variant="outline" className="w-full gap-2 h-12 text-base" size="lg">
                    <CreditCard className="h-5 w-5" />
                    Kart ile Ödeme
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ürün Sayısı</span>
                    <span className="font-medium">{cartItems.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Toplam Adet</span>
                    <span className="font-medium">
                      {cartItems.reduce((sum, i) => sum + i.qty, 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CashRegisterPage;
