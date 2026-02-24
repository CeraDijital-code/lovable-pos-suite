import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Phone,
  QrCode,
  ShoppingBag,
  Clock,
  Calendar,
  MessageSquare,
  User,
  TrendingUp,
  Award,
  CreditCard,
  Eye,
  X,
} from "lucide-react";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useLoyaltyTransactions, type LoyaltyCustomer, type LoyaltyTransaction } from "@/hooks/useLoyalty";
import QRCode from "qrcode";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

const fmt = (n: number) =>
  n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function QRCodeCanvas({ value, size = 140 }: { value: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      });
    }
  }, [value, size]);
  return <canvas ref={canvasRef} />;
}

interface SaleWithItems {
  id: string;
  sale_number: number;
  total: number;
  discount: number;
  payment_method: string;
  points_earned: number;
  points_redeemed: number;
  created_at: string;
  items: {
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total: number;
    discount: number;
  }[];
}

interface OtpRecord {
  id: string;
  phone: string;
  purpose: string;
  verified: boolean;
  created_at: string;
  expires_at: string;
}

const CustomerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: storeSettings } = useStoreSettings();
  const [drawerSaleId, setDrawerSaleId] = useState<string | null>(null);
  // Fetch customer
  const { data: customer, isLoading: customerLoading } = useQuery({
    queryKey: ["loyalty-customer", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loyalty_customers")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as LoyaltyCustomer;
    },
  });

  // Fetch transactions
  const { data: transactions = [] } = useLoyaltyTransactions(id);

  // Fetch sales linked to this customer
  const { data: sales = [] } = useQuery({
    queryKey: ["customer-sales", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("id, sale_number, total, discount, payment_method, points_earned, points_redeemed, created_at")
        .eq("loyalty_customer_id", id!)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;

      // Fetch items for each sale
      const saleIds = data.map((s: any) => s.id);
      if (saleIds.length === 0) return [] as SaleWithItems[];

      const { data: items, error: itemsError } = await supabase
        .from("sale_items")
        .select("id, sale_id, product_name, quantity, unit_price, total, discount")
        .in("sale_id", saleIds);
      if (itemsError) throw itemsError;

      return data.map((s: any) => ({
        ...s,
        items: (items || []).filter((i: any) => i.sale_id === s.id),
      })) as SaleWithItems[];
    },
  });

  // Fetch OTP records for this customer's phone
  const { data: otpRecords = [] } = useQuery({
    queryKey: ["customer-otps", customer?.phone],
    enabled: !!customer?.phone,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("otp_verifications")
        .select("*")
        .eq("phone", customer!.phone)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as OtpRecord[];
    },
  });

  const pointValueTl = storeSettings?.point_value_tl ?? 0.01;

  const totalEarned = transactions.filter(t => t.type === "earn").reduce((s, t) => s + t.points, 0);
  const totalRedeemed = transactions.filter(t => t.type === "redeem").reduce((s, t) => s + t.points, 0);

  // Fetch sale details for drawer
  const drawerSale = sales.find(s => s.id === drawerSaleId);

  if (customerLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="page-container py-6 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="page-container py-6 text-center">
          <p className="text-muted-foreground">Müşteri bulunamadı</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/sadakat")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Geri Dön
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (d: string) => {
    try {
      return format(new Date(d), "dd MMM yyyy HH:mm", { locale: tr });
    } catch {
      return d;
    }
  };

  const paymentLabel = (m: string) => {
    const map: Record<string, string> = { cash: "Nakit", card: "Kart", mixed: "Karışık" };
    return map[m] || m;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="page-container py-6 space-y-6">
        {/* Back button + header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/sadakat")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <User className="h-6 w-6 text-primary" />
              Müşteri Detayı
            </h1>
          </div>
        </div>

        {/* Customer info card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-1">
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold text-3xl">
                  {customer.full_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold">{customer.full_name}</h2>
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                  <Phone className="h-3.5 w-3.5" />
                  {customer.phone}
                </p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Badge variant={customer.is_active ? "default" : "secondary"}>
                    {customer.is_active ? "Aktif" : "Pasif"}
                  </Badge>
                </div>
              </div>
              <div className="bg-card border rounded-lg p-3">
                <QRCodeCanvas value={customer.qr_code} size={140} />
                <p className="text-[10px] text-muted-foreground mt-1 font-mono">{customer.qr_code}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 inline mr-1" />
                Kayıt: {formatDate(customer.created_at)}
              </p>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <Star className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-amber-500">{customer.total_points}</p>
                  <p className="text-[10px] text-muted-foreground">Mevcut Puan</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    = ₺{fmt(customer.total_points * pointValueTl)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-emerald-500">₺{fmt(Number(customer.total_spent))}</p>
                  <p className="text-[10px] text-muted-foreground">Toplam Harcama</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <ShoppingBag className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-blue-500">{customer.total_visits}</p>
                  <p className="text-[10px] text-muted-foreground">Toplam Ziyaret</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Award className="h-5 w-5 text-purple-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-purple-500">{totalEarned}</p>
                  <p className="text-[10px] text-muted-foreground">Toplam Kazanılan</p>
                  <p className="text-[10px] text-red-400 mt-0.5">-{totalRedeemed} harcanan</p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="transactions" className="space-y-3">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="transactions" className="gap-1.5 text-xs">
                  <Clock className="h-3.5 w-3.5" />
                  Puan Hareketleri
                </TabsTrigger>
                <TabsTrigger value="sales" className="gap-1.5 text-xs">
                  <CreditCard className="h-3.5 w-3.5" />
                  Satın Almalar
                </TabsTrigger>
                <TabsTrigger value="otps" className="gap-1.5 text-xs">
                  <MessageSquare className="h-3.5 w-3.5" />
                  OTP Kayıtları
                </TabsTrigger>
              </TabsList>

              {/* Transactions tab */}
              <TabsContent value="transactions">
                <Card>
                  <CardContent className="p-0">
                    {transactions.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">Henüz puan hareketi yok</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tarih</TableHead>
                            <TableHead>Tür</TableHead>
                            <TableHead>Açıklama</TableHead>
                            <TableHead className="text-right">Puan</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.map((t) => (
                            <TableRow
                              key={t.id}
                              className={t.type === "redeem" && t.sale_id ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}
                              onClick={() => {
                                if (t.type === "redeem" && t.sale_id) setDrawerSaleId(t.sale_id);
                              }}
                            >
                              <TableCell className="text-xs whitespace-nowrap">
                                {formatDate(t.created_at)}
                              </TableCell>
                              <TableCell>
                                {t.type === "earn" ? (
                                  <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 text-[10px]">
                                    <ArrowUpRight className="h-3 w-3 mr-0.5" /> Kazanım
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-red-500 border-red-500/30 text-[10px]">
                                    <ArrowDownRight className="h-3 w-3 mr-0.5" /> Harcama
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-xs max-w-[200px] truncate">{t.description}</TableCell>
                              <TableCell className={`text-right font-bold text-sm ${t.type === "earn" ? "text-emerald-500" : "text-red-500"}`}>
                                {t.type === "earn" ? "+" : "-"}{t.points}
                              </TableCell>
                              {t.type === "redeem" && t.sale_id && (
                                <TableCell className="w-8 p-0">
                                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Sales tab */}
              <TabsContent value="sales">
                <Card>
                  <CardContent className="p-0">
                    {sales.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">Henüz satış kaydı yok</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tarih</TableHead>
                            <TableHead>Fiş No</TableHead>
                            <TableHead>Ürünler</TableHead>
                            <TableHead>Ödeme</TableHead>
                            <TableHead className="text-right">Tutar</TableHead>
                            <TableHead className="text-right">Puan</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sales.map((s) => (
                            <TableRow key={s.id}>
                              <TableCell className="text-xs whitespace-nowrap">
                                {formatDate(s.created_at)}
                              </TableCell>
                              <TableCell className="font-mono text-xs">#{s.sale_number}</TableCell>
                              <TableCell className="text-xs max-w-[200px]">
                                <div className="space-y-0.5">
                                  {s.items.slice(0, 3).map((item) => (
                                    <div key={item.id} className="truncate">
                                      {item.quantity}x {item.product_name}
                                    </div>
                                  ))}
                                  {s.items.length > 3 && (
                                    <span className="text-muted-foreground">+{s.items.length - 3} ürün</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-[10px]">
                                  {paymentLabel(s.payment_method)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-semibold text-sm">
                                ₺{fmt(Number(s.total))}
                                {Number(s.discount) > 0 && (
                                  <span className="text-[10px] text-red-400 block">-₺{fmt(Number(s.discount))}</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right text-xs">
                                {s.points_earned > 0 && (
                                  <span className="text-emerald-500">+{s.points_earned}</span>
                                )}
                                {s.points_redeemed > 0 && (
                                  <span className="text-red-500 block">-{s.points_redeemed}</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* OTP tab */}
              <TabsContent value="otps">
                <Card>
                  <CardContent className="p-0">
                    {otpRecords.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">Henüz OTP kaydı yok</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Gönderim Tarihi</TableHead>
                            <TableHead>Amaç</TableHead>
                            <TableHead>Durum</TableHead>
                            <TableHead>Son Geçerlilik</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {otpRecords.map((otp) => (
                            <TableRow key={otp.id}>
                              <TableCell className="text-xs whitespace-nowrap">
                                {formatDate(otp.created_at)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-[10px]">
                                  {otp.purpose === "redeem" ? "Puan Harcama" : otp.purpose === "login" ? "Giriş" : otp.purpose}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {otp.verified ? (
                                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-[10px]">
                                    Doğrulandı
                                  </Badge>
                                ) : new Date(otp.expires_at) < new Date() ? (
                                  <Badge variant="secondary" className="text-[10px]">
                                    Süresi Doldu
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-[10px]">
                                    Bekliyor
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-xs whitespace-nowrap">
                                {formatDate(otp.expires_at)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        {/* Sale detail drawer for redeem transactions */}
        <Drawer open={!!drawerSaleId} onOpenChange={(open) => { if (!open) setDrawerSaleId(null); }}>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader className="border-b pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <DrawerTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                    Sepet Detayı
                  </DrawerTitle>
                  <DrawerDescription>
                    {drawerSale ? `Fiş #${drawerSale.sale_number} • ${formatDate(drawerSale.created_at)}` : ""}
                  </DrawerDescription>
                </div>
              </div>
            </DrawerHeader>

            {drawerSale ? (
              <div className="p-4 space-y-4 overflow-y-auto">
                {/* Items */}
                <div className="space-y-2">
                  {drawerSale.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} x ₺{fmt(Number(item.unit_price))}
                        </p>
                      </div>
                      <div className="text-right ml-3">
                        <p className="text-sm font-semibold">₺{fmt(Number(item.total))}</p>
                        {Number(item.discount) > 0 && (
                          <p className="text-[10px] text-destructive">-₺{fmt(Number(item.discount))}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Summary */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ödeme Yöntemi</span>
                    <Badge variant="outline">{paymentLabel(drawerSale.payment_method)}</Badge>
                  </div>
                  {Number(drawerSale.discount) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">İndirim</span>
                      <span className="text-destructive font-medium">-₺{fmt(Number(drawerSale.discount))}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base border-t pt-2">
                    <span>Toplam</span>
                    <span>₺{fmt(Number(drawerSale.total))}</span>
                  </div>
                  {(drawerSale.points_earned > 0 || drawerSale.points_redeemed > 0) && (
                    <div className="flex gap-3 justify-end text-xs pt-1">
                      {drawerSale.points_earned > 0 && (
                        <span className="text-emerald-500">+{drawerSale.points_earned} puan kazanıldı</span>
                      )}
                      {drawerSale.points_redeemed > 0 && (
                        <span className="text-destructive">-{drawerSale.points_redeemed} puan harcandı</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm">Satış bilgisi bulunamadı</div>
            )}

            <DrawerFooter className="border-t">
              <DrawerClose asChild>
                <Button variant="outline" className="w-full">Kapat</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
};

export default CustomerDetailPage;
