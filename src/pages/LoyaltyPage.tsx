import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Heart,
  Plus,
  Search,
  Users,
  Star,
  TrendingUp,
  Phone,
  QrCode,
  Gift,
  Calendar,
  Package,
  ShoppingBag,
  Sparkles,
  Pencil,
  Trash2,
  Eye,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from "lucide-react";
import {
  useLoyaltyCustomers,
  useCreateLoyaltyCustomer,
  useUpdateLoyaltyCustomer,
  useLoyaltyPointRules,
  useCreatePointRule,
  useUpdatePointRule,
  useDeletePointRule,
  useLoyaltyTransactions,
  type LoyaltyCustomer,
  type LoyaltyPointRule,
} from "@/hooks/useLoyalty";
import { useProducts } from "@/hooks/useProducts";
import QRCode from "qrcode";

const DAYS = [
  { value: "monday", label: "Pazartesi" },
  { value: "tuesday", label: "Salı" },
  { value: "wednesday", label: "Çarşamba" },
  { value: "thursday", label: "Perşembe" },
  { value: "friday", label: "Cuma" },
  { value: "saturday", label: "Cumartesi" },
  { value: "sunday", label: "Pazar" },
];

const fmt = (n: number) =>
  n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function QRCodeSVG({ value, size = 160 }: { value: string; size?: number }) {
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

const LoyaltyPage = () => {
  const [customerSearch, setCustomerSearch] = useState("");
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<LoyaltyCustomer | null>(null);
  const [qrModalCustomer, setQrModalCustomer] = useState<LoyaltyCustomer | null>(null);

  // Rule form
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<LoyaltyPointRule | null>(null);
  const [ruleType, setRuleType] = useState("genel");
  const [ruleName, setRuleName] = useState("");
  const [rulePointsPerTl, setRulePointsPerTl] = useState("1");
  const [ruleProductId, setRuleProductId] = useState("");
  const [ruleMinQty, setRuleMinQty] = useState("1");
  const [ruleBonusPoints, setRuleBonusPoints] = useState("0");
  const [ruleValidDays, setRuleValidDays] = useState<string[]>([]);
  const [ruleStartDate, setRuleStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [ruleEndDate, setRuleEndDate] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [ruleIsActive, setRuleIsActive] = useState(true);
  const [productSearch, setProductSearch] = useState("");

  const { data: customers = [] } = useLoyaltyCustomers(customerSearch || undefined);
  const createCustomer = useCreateLoyaltyCustomer();
  const updateCustomer = useUpdateLoyaltyCustomer();
  const { data: rules = [] } = useLoyaltyPointRules();
  const createRule = useCreatePointRule();
  const updateRule = useUpdatePointRule();
  const deleteRule = useDeletePointRule();
  const { data: transactions = [] } = useLoyaltyTransactions(selectedCustomer?.id);
  const { data: allProducts = [] } = useProducts();

  const filteredProducts = allProducts.filter(
    (p) =>
      p.is_active &&
      (productSearch
        ? p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          p.barcode.includes(productSearch)
        : true)
  );

  const handleAddCustomer = () => {
    if (!newName.trim() || !newPhone.trim()) return;
    createCustomer.mutate(
      { full_name: newName.trim(), phone: newPhone.trim() },
      {
        onSuccess: () => {
          setAddCustomerOpen(false);
          setNewName("");
          setNewPhone("");
        },
      }
    );
  };

  const resetRuleForm = () => {
    setEditingRule(null);
    setRuleType("genel");
    setRuleName("");
    setRulePointsPerTl("100");
    setRuleProductId("");
    setRuleMinQty("1");
    setRuleBonusPoints("1");
    setRuleValidDays([]);
    setRuleStartDate(new Date().toISOString().split("T")[0]);
    setRuleEndDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    setRuleIsActive(true);
    setProductSearch("");
  };

  const openEditRule = (rule: LoyaltyPointRule) => {
    setEditingRule(rule);
    setRuleType(rule.type);
    setRuleName(rule.name);
    setRulePointsPerTl(String(rule.points_per_tl));
    setRuleProductId(rule.product_id || "");
    setRuleMinQty(String(rule.min_quantity));
    setRuleBonusPoints(String(rule.bonus_points));
    setRuleValidDays(rule.valid_days || []);
    setRuleStartDate(rule.start_date);
    setRuleEndDate(rule.end_date);
    setRuleIsActive(rule.is_active);
    setRuleModalOpen(true);
  };

  const handleSaveRule = () => {
    const payload: any = {
      name: ruleName,
      type: ruleType,
      points_per_tl: parseFloat(rulePointsPerTl) || 0,
      product_id: ruleType !== "genel" ? ruleProductId || null : null,
      min_quantity: parseInt(ruleMinQty) || 1,
      bonus_points: parseInt(ruleBonusPoints) || 0,
      valid_days: ruleType === "ozel_gun" ? ruleValidDays : null,
      start_date: ruleStartDate,
      end_date: ruleEndDate,
      is_active: ruleIsActive,
    };

    if (editingRule) {
      updateRule.mutate({ id: editingRule.id, ...payload }, {
        onSuccess: () => { setRuleModalOpen(false); resetRuleForm(); },
      });
    } else {
      createRule.mutate(payload, {
        onSuccess: () => { setRuleModalOpen(false); resetRuleForm(); },
      });
    }
  };

  const toggleDay = (day: string) => {
    setRuleValidDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const totalCustomers = customers.length;
  const totalActivePoints = customers.reduce((s, c) => s + c.total_points, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="page-container py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Heart className="h-6 w-6 text-primary" />
              Sadakat Programı
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Müşteri yönetimi ve puan kazanım kuralları
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalCustomers}</p>
                <p className="text-xs text-muted-foreground">Toplam Müşteri</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Star className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalActivePoints.toLocaleString("tr-TR")}</p>
                <p className="text-xs text-muted-foreground">Aktif Puan</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rules.filter((r) => r.is_active).length}</p>
                <p className="text-xs text-muted-foreground">Aktif Kural</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Gift className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rules.length}</p>
                <p className="text-xs text-muted-foreground">Toplam Kural</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="customers" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="customers" className="gap-2">
              <Users className="h-4 w-4" />
              Müşteriler
            </TabsTrigger>
            <TabsTrigger value="rules" className="gap-2">
              <Award className="h-4 w-4" />
              Puan Kuralları
            </TabsTrigger>
          </TabsList>

          {/* CUSTOMERS TAB */}
          <TabsContent value="customers" className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10"
                  placeholder="Müşteri ara (isim veya telefon)..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
              </div>
              <Button className="gap-2" onClick={() => setAddCustomerOpen(true)}>
                <Plus className="h-4 w-4" />
                Yeni Müşteri
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Customer list */}
              <div className="lg:col-span-2 space-y-2">
                {customers.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p>Henüz müşteri yok</p>
                    </CardContent>
                  </Card>
                ) : (
                  customers.map((c) => (
                    <Card
                      key={c.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedCustomer?.id === c.id ? "border-primary ring-1 ring-primary/20" : ""
                      }`}
                      onClick={() => setSelectedCustomer(c)}
                    >
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-primary font-bold text-lg">
                            {c.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{c.full_name}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {c.phone}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-1 text-amber-500">
                            <Star className="h-4 w-4 fill-amber-500" />
                            <span className="font-bold text-lg">{c.total_points}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {c.total_visits} ziyaret
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setQrModalCustomer(c);
                          }}
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Customer detail */}
              <div>
                {selectedCustomer ? (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{selectedCustomer.full_name}</CardTitle>
                        <Badge variant={selectedCustomer.is_active ? "default" : "secondary"}>
                          {selectedCustomer.is_active ? "Aktif" : "Pasif"}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {selectedCustomer.phone}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-lg bg-amber-500/10 p-3">
                          <p className="text-xl font-bold text-amber-500">{selectedCustomer.total_points}</p>
                          <p className="text-[10px] text-muted-foreground">Puan</p>
                        </div>
                        <div className="rounded-lg bg-emerald-500/10 p-3">
                          <p className="text-xl font-bold text-emerald-500">₺{fmt(Number(selectedCustomer.total_spent))}</p>
                          <p className="text-[10px] text-muted-foreground">Harcama</p>
                        </div>
                        <div className="rounded-lg bg-blue-500/10 p-3">
                          <p className="text-xl font-bold text-blue-500">{selectedCustomer.total_visits}</p>
                          <p className="text-[10px] text-muted-foreground">Ziyaret</p>
                        </div>
                      </div>

                      <Separator />
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Son İşlemler
                        </h4>
                        <ScrollArea className="h-48">
                          {transactions.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-4">
                              Henüz işlem yok
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {transactions.slice(0, 20).map((t) => (
                                <div key={t.id} className="flex items-center gap-2 text-sm">
                                  {t.type === "earn" ? (
                                    <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                  ) : (
                                    <ArrowDownRight className="h-3.5 w-3.5 text-red-500 shrink-0" />
                                  )}
                                  <span className="flex-1 truncate text-xs">{t.description}</span>
                                  <span
                                    className={`font-bold text-xs ${
                                      t.type === "earn" ? "text-emerald-500" : "text-red-500"
                                    }`}
                                  >
                                    {t.type === "earn" ? "+" : "-"}{t.points}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </ScrollArea>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1"
                          onClick={() => setQrModalCustomer(selectedCustomer)}
                        >
                          <QrCode className="h-3.5 w-3.5" />
                          QR Kod
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1"
                          onClick={() =>
                            updateCustomer.mutate({
                              id: selectedCustomer.id,
                              is_active: !selectedCustomer.is_active,
                            })
                          }
                        >
                          {selectedCustomer.is_active ? "Pasife Al" : "Aktife Al"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <Eye className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Detay görmek için bir müşteri seçin</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* RULES TAB */}
          <TabsContent value="rules" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Satış tamamlandığında müşteriye kazandırılacak puanları belirleyin
              </p>
              <Button
                className="gap-2"
                onClick={() => {
                  resetRuleForm();
                  setRuleModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Yeni Kural
              </Button>
            </div>

            {/* Rule type legend */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <ShoppingBag className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Genel Kural</p>
                    <p className="text-xs text-muted-foreground">
                      Her X TL harcamaya Y puan
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-amber-500/20 bg-amber-500/5">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Package className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Ürün Bazlı</p>
                    <p className="text-xs text-muted-foreground">
                      X üründen Y adet alana Z puan
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-emerald-500/20 bg-emerald-500/5">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Calendar className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Özel Gün</p>
                    <p className="text-xs text-muted-foreground">
                      Belirli günlerde X ürüne ekstra puan
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Rules list */}
            <div className="space-y-2">
              {rules.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Award className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>Henüz puan kuralı oluşturulmamış</p>
                  </CardContent>
                </Card>
              ) : (
                rules.map((rule) => (
                  <Card key={rule.id} className={!rule.is_active ? "opacity-60" : ""}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div
                        className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                          rule.type === "genel"
                            ? "bg-primary/10"
                            : rule.type === "urun"
                            ? "bg-amber-500/10"
                            : "bg-emerald-500/10"
                        }`}
                      >
                        {rule.type === "genel" ? (
                          <ShoppingBag className="h-5 w-5 text-primary" />
                        ) : rule.type === "urun" ? (
                          <Package className="h-5 w-5 text-amber-500" />
                        ) : (
                          <Calendar className="h-5 w-5 text-emerald-500" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold truncate">{rule.name}</p>
                          <Badge variant={rule.is_active ? "default" : "secondary"} className="text-[10px]">
                            {rule.is_active ? "Aktif" : "Pasif"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {rule.type === "genel" && (
                            <span className="text-xs text-muted-foreground">
                              Her {rule.points_per_tl} TL = {rule.bonus_points} puan
                            </span>
                          )}
                          {(rule.type === "urun" || rule.type === "ozel_gun") && (
                            <>
                              {rule.product && (
                                <Badge variant="outline" className="text-[10px]">
                                  {rule.product.name}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                Min {rule.min_quantity} adet → {rule.bonus_points} puan
                              </span>
                            </>
                          )}
                          {rule.type === "ozel_gun" && rule.valid_days && (
                            <div className="flex gap-1 flex-wrap">
                              {rule.valid_days.map((d) => (
                                <Badge key={d} variant="outline" className="text-[10px] bg-emerald-500/5">
                                  {DAYS.find((dd) => dd.value === d)?.label || d}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {rule.start_date} → {rule.end_date}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditRule(rule)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => deleteRule.mutate(rule.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Customer Modal */}
      <Dialog open={addCustomerOpen} onOpenChange={setAddCustomerOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Yeni Müşteri
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Ad Soyad</Label>
              <Input
                className="mt-1.5"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ahmet Yılmaz"
              />
            </div>
            <div>
              <Label>Telefon</Label>
              <Input
                className="mt-1.5"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="05XX XXX XX XX"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCustomerOpen(false)}>
              İptal
            </Button>
            <Button
              onClick={handleAddCustomer}
              disabled={!newName.trim() || !newPhone.trim() || createCustomer.isPending}
            >
              Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      <Dialog open={!!qrModalCustomer} onOpenChange={() => setQrModalCustomer(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-center">{qrModalCustomer?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3">
            {qrModalCustomer && (
              <div className="bg-white p-4 rounded-xl">
                <QRCodeSVG value={qrModalCustomer.qr_code} size={200} />
              </div>
            )}
            <p className="text-xs text-muted-foreground font-mono">{qrModalCustomer?.qr_code}</p>
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="h-4 w-4 fill-amber-500" />
              <span className="font-bold">{qrModalCustomer?.total_points} Puan</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rule Modal */}
      <Dialog
        open={ruleModalOpen}
        onOpenChange={() => {
          setRuleModalOpen(false);
          resetRuleForm();
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {editingRule ? "Kuralı Düzenle" : "Yeni Puan Kuralı"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Type selection */}
            <div>
              <Label className="text-sm">Kural Tipi</Label>
              <div className="grid grid-cols-3 gap-2 mt-1.5">
                {[
                  { value: "genel", label: "Genel", icon: ShoppingBag, color: "primary" },
                  { value: "urun", label: "Ürün Bazlı", icon: Package, color: "amber-500" },
                  { value: "ozel_gun", label: "Özel Gün", icon: Calendar, color: "emerald-500" },
                ].map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setRuleType(t.value)}
                    className={`rounded-xl border p-3 text-center transition-all ${
                      ruleType === t.value
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "hover:border-primary/30"
                    }`}
                  >
                    <t.icon className={`h-5 w-5 mx-auto mb-1 text-${t.color}`} />
                    <p className="text-xs font-medium">{t.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Kural Adı</Label>
              <Input
                className="mt-1.5"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                placeholder="Her 1 TL = 1 Puan"
              />
            </div>

            {ruleType === "genel" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Her Kaç TL Harcamada</Label>
                  <Input
                    type="number"
                    className="mt-1.5"
                    value={rulePointsPerTl}
                    onChange={(e) => setRulePointsPerTl(e.target.value)}
                    min={1}
                    step="1"
                    placeholder="200"
                  />
                </div>
                <div>
                  <Label>Kaç Puan Kazanılır</Label>
                  <Input
                    type="number"
                    className="mt-1.5"
                    value={ruleBonusPoints}
                    onChange={(e) => setRuleBonusPoints(e.target.value)}
                    min={1}
                    placeholder="10"
                  />
                </div>
                {rulePointsPerTl && ruleBonusPoints && parseInt(ruleBonusPoints) > 0 && (
                  <p className="col-span-2 text-xs text-muted-foreground text-center bg-muted/50 rounded-lg p-2">
                    Örnek: ₺{parseFloat(rulePointsPerTl) * 3} harcayan müşteri → <span className="font-bold text-primary">{parseInt(ruleBonusPoints) * 3} puan</span> kazanır
                  </p>
                )}
              </div>
            )}

            {(ruleType === "urun" || ruleType === "ozel_gun") && (
              <>
                <div>
                  <Label>Ürün Seçin</Label>
                  <Input
                    className="mt-1.5 mb-2"
                    placeholder="Ürün ara (isim veya barkod)..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                  <ScrollArea className="h-32 border rounded-lg p-1">
                    {filteredProducts.slice(0, 20).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setRuleProductId(p.id)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                          ruleProductId === p.id
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted"
                        }`}
                      >
                        <Package className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{p.name}</span>
                        <span className="text-xs text-muted-foreground ml-auto font-mono">
                          {p.barcode}
                        </span>
                      </button>
                    ))}
                  </ScrollArea>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Minimum Adet</Label>
                    <Input
                      type="number"
                      className="mt-1.5"
                      value={ruleMinQty}
                      onChange={(e) => setRuleMinQty(e.target.value)}
                      min={1}
                    />
                  </div>
                  <div>
                    <Label>Bonus Puan</Label>
                    <Input
                      type="number"
                      className="mt-1.5"
                      value={ruleBonusPoints}
                      onChange={(e) => setRuleBonusPoints(e.target.value)}
                      min={0}
                    />
                  </div>
                </div>
              </>
            )}

            {ruleType === "ozel_gun" && (
              <div>
                <Label>Geçerli Günler</Label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {DAYS.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => toggleDay(d.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        ruleValidDays.includes(d.value)
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "bg-background hover:bg-muted"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Başlangıç Tarihi</Label>
                <Input
                  type="date"
                  className="mt-1.5"
                  value={ruleStartDate}
                  onChange={(e) => setRuleStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Bitiş Tarihi</Label>
                <Input
                  type="date"
                  className="mt-1.5"
                  value={ruleEndDate}
                  onChange={(e) => setRuleEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>Aktif</Label>
              <Switch checked={ruleIsActive} onCheckedChange={setRuleIsActive} />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRuleModalOpen(false);
                resetRuleForm();
              }}
            >
              İptal
            </Button>
            <Button
              onClick={handleSaveRule}
              disabled={!ruleName.trim() || createRule.isPending || updateRule.isPending}
            >
              {editingRule ? "Güncelle" : "Oluştur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoyaltyPage;
