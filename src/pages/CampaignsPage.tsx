import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tags,
  Plus,
  Percent,
  Gift,
  ToggleRight,
  Trash2,
  Pencil,
  ScanBarcode,
  X,
  Calendar,
  Package,
  Star,
  Link2,
  Search,
  Sparkles,
} from "lucide-react";
import {
  useCampaigns,
  useCreateCampaign,
  useUpdateCampaign,
  useDeleteCampaign,
  getCampaignTypeLabel,
  getCampaignTypeIcon,
  getCampaignDetails,
  getCampaignStatus,
  type Campaign,
  type CampaignWithProducts,
} from "@/hooks/useCampaigns";
import { useProducts, type Product } from "@/hooks/useProducts";

type CampaignType = "x_al_y_ode" | "x_alana_y_indirim" | "yuzde_indirim" | "ozel_fiyat";

interface FormState {
  name: string;
  type: CampaignType;
  buy_quantity: number;
  pay_quantity: number;
  discount_percent: number;
  source_buy_quantity: number;
  target_discount_percent: number;
  special_price: number;
  special_price_min_quantity: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  sourceProducts: Product[];
  targetProducts: Product[];
}

const emptyForm: FormState = {
  name: "",
  type: "yuzde_indirim",
  buy_quantity: 2,
  pay_quantity: 1,
  discount_percent: 10,
  source_buy_quantity: 2,
  target_discount_percent: 10,
  special_price: 0,
  special_price_min_quantity: 2,
  start_date: new Date().toISOString().split("T")[0],
  end_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
  is_active: true,
  sourceProducts: [],
  targetProducts: [],
};

const typeConfig: Record<CampaignType, { label: string; icon: React.ReactNode; color: string; desc: string }> = {
  yuzde_indirim: {
    label: "Yüzde İndirim",
    icon: <Percent className="h-5 w-5" />,
    color: "text-info",
    desc: "Ürünlere yüzde bazlı indirim uygula",
  },
  x_al_y_ode: {
    label: "X Al Y Öde",
    icon: <Gift className="h-5 w-5" />,
    color: "text-primary",
    desc: "Belirli adette al, daha azını öde",
  },
  x_alana_y_indirim: {
    label: "X Alana Y'de İndirim",
    icon: <Link2 className="h-5 w-5" />,
    color: "text-warning",
    desc: "Bir üründen alana diğerinde indirim",
  },
  ozel_fiyat: {
    label: "Özel Fiyat",
    icon: <Star className="h-5 w-5" />,
    color: "text-success",
    desc: "Minimum adet alımına özel sabit fiyat",
  },
};

const CampaignsPage = () => {
  const { data: campaigns = [], isLoading } = useCampaigns();
  const { data: allProducts = [] } = useProducts();
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const deleteCampaign = useDeleteCampaign();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCampaigns = useMemo(() => {
    let result = campaigns;
    if (filterStatus !== "all") {
      result = result.filter((c) => {
        const s = getCampaignStatus(c).label;
        return s === filterStatus;
      });
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(q));
    }
    return result;
  }, [campaigns, filterStatus, searchQuery]);

  const stats = useMemo(() => ({
    total: campaigns.length,
    active: campaigns.filter((c) => getCampaignStatus(c).label === "Aktif").length,
    scheduled: campaigns.filter((c) => getCampaignStatus(c).label === "Planlandı").length,
    expired: campaigns.filter((c) => getCampaignStatus(c).label === "Süresi Dolmuş").length,
  }), [campaigns]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (c: CampaignWithProducts) => {
    const sourceProds = (c.campaign_products || [])
      .filter((cp) => cp.role === "source" && cp.products)
      .map((cp) => cp.products as unknown as Product);
    const targetProds = (c.campaign_products || [])
      .filter((cp) => cp.role === "target" && cp.products)
      .map((cp) => cp.products as unknown as Product);

    setEditingId(c.id);
    setForm({
      name: c.name,
      type: c.type,
      buy_quantity: c.buy_quantity,
      pay_quantity: c.pay_quantity,
      discount_percent: c.discount_percent,
      source_buy_quantity: c.source_buy_quantity,
      target_discount_percent: c.target_discount_percent,
      special_price: c.special_price,
      special_price_min_quantity: c.special_price_min_quantity,
      start_date: c.start_date,
      end_date: c.end_date,
      is_active: c.is_active,
      sourceProducts: sourceProds,
      targetProducts: targetProds,
    });
    setDialogOpen(true);
  };

  const handleBarcodeAdd = (target: "source" | "target") => {
    if (!barcodeInput.trim()) return;
    const found = allProducts.find((p) => p.barcode === barcodeInput.trim());
    if (!found) return;
    const list = target === "source" ? form.sourceProducts : form.targetProducts;
    if (list.some((p) => p.id === found.id)) {
      setBarcodeInput("");
      return;
    }
    setForm((prev) => ({
      ...prev,
      [target === "source" ? "sourceProducts" : "targetProducts"]: [...list, found],
    }));
    setBarcodeInput("");
  };

  const removeProduct = (id: string, target: "source" | "target") => {
    const key = target === "source" ? "sourceProducts" : "targetProducts";
    setForm((prev) => ({ ...prev, [key]: prev[key].filter((p) => p.id !== id) }));
  };

  const handleSave = () => {
    if (!form.name.trim() || form.sourceProducts.length === 0) return;

    const payload = {
      name: form.name,
      type: form.type,
      buy_quantity: form.buy_quantity,
      pay_quantity: form.pay_quantity,
      discount_percent: form.discount_percent,
      source_buy_quantity: form.source_buy_quantity,
      target_discount_percent: form.target_discount_percent,
      special_price: form.special_price,
      special_price_min_quantity: form.special_price_min_quantity,
      start_date: form.start_date,
      end_date: form.end_date,
      is_active: form.is_active,
      products: form.sourceProducts.map((p) => p.id),
      targetProducts: form.targetProducts.map((p) => p.id),
    };

    if (editingId) {
      updateCampaign.mutate({ id: editingId, ...payload }, { onSuccess: () => setDialogOpen(false) });
    } else {
      createCampaign.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Kampanya Yönetimi
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              İndirim ve promosyon kampanyalarını oluşturun, yönetin
            </p>
          </div>
          <Button className="gap-2 shadow-lg" size="lg" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Yeni Kampanya
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Toplam", value: stats.total, icon: <Tags className="h-5 w-5" />, color: "text-foreground", bg: "bg-muted" },
            { label: "Aktif", value: stats.active, icon: <ToggleRight className="h-5 w-5" />, color: "text-success", bg: "bg-success/10" },
            { label: "Planlandı", value: stats.scheduled, icon: <Calendar className="h-5 w-5" />, color: "text-info", bg: "bg-info/10" },
            { label: "Süresi Dolmuş", value: stats.expired, icon: <Tags className="h-5 w-5" />, color: "text-destructive", bg: "bg-destructive/10" },
          ].map((s) => (
            <Card key={s.label} className="overflow-hidden">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.bg} ${s.color}`}>
                  {s.icon}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                  <p className="text-2xl font-black">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter & Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Kampanya ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Durum filtrele" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="Aktif">Aktif</SelectItem>
              <SelectItem value="Planlandı">Planlandı</SelectItem>
              <SelectItem value="Süresi Dolmuş">Süresi Dolmuş</SelectItem>
              <SelectItem value="Pasif">Pasif</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Campaign Cards Grid */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Tags className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="text-lg font-medium text-muted-foreground">Henüz kampanya yok</p>
              <p className="text-sm text-muted-foreground/70 mt-1">İlk kampanyanızı oluşturarak başlayın</p>
              <Button className="mt-4 gap-2" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Kampanya Oluştur
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCampaigns.map((c) => {
              const status = getCampaignStatus(c);
              const productCount = (c.campaign_products || []).length;
              const typeInfo = typeConfig[c.type];
              return (
                <Card
                  key={c.id}
                  className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-primary/30"
                >
                  {/* Type indicator strip */}
                  <div className={`absolute top-0 left-0 right-0 h-1 ${
                    c.type === "yuzde_indirim" ? "bg-info" :
                    c.type === "x_al_y_ode" ? "bg-primary" :
                    c.type === "x_alana_y_indirim" ? "bg-warning" :
                    "bg-success"
                  }`} />

                  <CardContent className="p-5 pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          c.type === "yuzde_indirim" ? "bg-info/10 text-info" :
                          c.type === "x_al_y_ode" ? "bg-primary/10 text-primary" :
                          c.type === "x_alana_y_indirim" ? "bg-warning/10 text-warning" :
                          "bg-success/10 text-success"
                        }`}>
                          {typeInfo?.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm leading-tight">{c.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {getCampaignTypeLabel(c.type)}
                          </p>
                        </div>
                      </div>
                      <Badge variant={status.variant} className="text-[10px] shrink-0">
                        {status.label}
                      </Badge>
                    </div>

                    {/* Campaign value */}
                    <div className="rounded-lg bg-muted/50 px-3 py-2 mb-3">
                      <span className="text-lg font-black">{getCampaignDetails(c)}</span>
                    </div>

                    {/* Meta info */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {c.start_date} — {c.end_date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {productCount} ürün
                      </span>
                    </div>

                    {/* Product pills */}
                    {(c.campaign_products || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {(c.campaign_products || []).slice(0, 3).map((cp) => (
                          <Badge key={cp.id} variant="secondary" className="text-[10px] font-normal">
                            {cp.products?.name}
                          </Badge>
                        ))}
                        {(c.campaign_products || []).length > 3 && (
                          <Badge variant="secondary" className="text-[10px] font-normal">
                            +{(c.campaign_products || []).length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="outline" size="sm" className="flex-1 gap-1.5 h-8" onClick={() => openEdit(c)}>
                        <Pencil className="h-3 w-3" />
                        Düzenle
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(c.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingId ? <Pencil className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
              {editingId ? "Kampanyayı Düzenle" : "Yeni Kampanya Oluştur"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Campaign Name */}
            <div>
              <Label className="text-sm font-medium">Kampanya Adı</Label>
              <Input
                className="mt-1.5 h-11"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Örn: Yaz Kampanyası, Haftalık İndirim..."
              />
            </div>

            {/* Campaign Type Selector */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Kampanya Türü</Label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(typeConfig) as CampaignType[]).map((type) => {
                  const cfg = typeConfig[type];
                  const selected = form.type === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setForm((p) => ({ ...p, type }))}
                      className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                        selected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-transparent bg-muted/40 hover:bg-muted/70"
                      }`}
                    >
                      <div className={`${cfg.color}`}>{cfg.icon}</div>
                      <div>
                        <p className="text-sm font-semibold">{cfg.label}</p>
                        <p className="text-[11px] text-muted-foreground leading-tight">{cfg.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Type-specific fields */}
            <Card className="border-dashed">
              <CardContent className="p-4 space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {getCampaignTypeLabel(form.type)} Ayarları
                </p>

                {form.type === "yuzde_indirim" && (
                  <div>
                    <Label>İndirim Yüzdesi</Label>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        className="w-28"
                        value={form.discount_percent}
                        onChange={(e) => setForm((p) => ({ ...p, discount_percent: Number(e.target.value) }))}
                      />
                      <span className="text-lg font-bold text-muted-foreground">%</span>
                    </div>
                  </div>
                )}

                {form.type === "x_al_y_ode" && (
                  <div className="flex items-end gap-3">
                    <div>
                      <Label>Al</Label>
                      <Input
                        type="number"
                        min={1}
                        className="w-20 mt-1.5"
                        value={form.buy_quantity}
                        onChange={(e) => setForm((p) => ({ ...p, buy_quantity: Number(e.target.value) }))}
                      />
                    </div>
                    <span className="pb-2 text-lg font-bold text-muted-foreground">→</span>
                    <div>
                      <Label>Öde</Label>
                      <Input
                        type="number"
                        min={1}
                        className="w-20 mt-1.5"
                        value={form.pay_quantity}
                        onChange={(e) => setForm((p) => ({ ...p, pay_quantity: Number(e.target.value) }))}
                      />
                    </div>
                    <span className="pb-2 text-sm text-muted-foreground">adet</span>
                  </div>
                )}

                {form.type === "x_alana_y_indirim" && (
                  <div className="flex items-end gap-3">
                    <div>
                      <Label>Kaynak Ürün Al</Label>
                      <Input
                        type="number"
                        min={1}
                        className="w-20 mt-1.5"
                        value={form.source_buy_quantity}
                        onChange={(e) => setForm((p) => ({ ...p, source_buy_quantity: Number(e.target.value) }))}
                      />
                    </div>
                    <span className="pb-2 text-lg font-bold text-muted-foreground">→</span>
                    <div>
                      <Label>Hedef İndirim %</Label>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        className="w-20 mt-1.5"
                        value={form.target_discount_percent}
                        onChange={(e) => setForm((p) => ({ ...p, target_discount_percent: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                )}

                {form.type === "ozel_fiyat" && (
                  <div className="flex items-end gap-3">
                    <div>
                      <Label>Minimum Adet</Label>
                      <Input
                        type="number"
                        min={1}
                        className="w-24 mt-1.5"
                        value={form.special_price_min_quantity}
                        onChange={(e) => setForm((p) => ({ ...p, special_price_min_quantity: Number(e.target.value) }))}
                      />
                    </div>
                    <span className="pb-2 text-lg font-bold text-muted-foreground">→</span>
                    <div>
                      <Label>Özel Fiyat (₺)</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        className="w-28 mt-1.5"
                        value={form.special_price}
                        onChange={(e) => setForm((p) => ({ ...p, special_price: Number(e.target.value) }))}
                      />
                    </div>
                    <span className="pb-2 text-sm text-muted-foreground">/ adet</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Date & Status */}
            <div className="grid grid-cols-5 gap-4 items-end">
              <div className="col-span-2">
                <Label>Başlangıç</Label>
                <Input
                  type="date"
                  className="mt-1.5"
                  value={form.start_date}
                  onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
                />
              </div>
              <div className="col-span-2">
                <Label>Bitiş</Label>
                <Input
                  type="date"
                  className="mt-1.5"
                  value={form.end_date}
                  onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-2 pb-1">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, is_active: v }))}
                />
                <Label className="text-xs">{form.is_active ? "Aktif" : "Pasif"}</Label>
              </div>
            </div>

            {/* Product selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                {form.type === "x_alana_y_indirim" ? "Kaynak Ürünler" : "Kampanya Ürünleri"}
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    placeholder="Barkod okutun veya yazın..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleBarcodeAdd("source");
                      }
                    }}
                  />
                </div>
                <Button variant="outline" onClick={() => handleBarcodeAdd("source")}>
                  Ekle
                </Button>
              </div>
              {form.sourceProducts.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.sourceProducts.map((p) => (
                    <Badge key={p.id} variant="secondary" className="gap-1 pr-1 py-1">
                      <Package className="h-3 w-3" />
                      {p.name}
                      <span className="text-[10px] text-muted-foreground ml-0.5">({p.barcode})</span>
                      <button
                        onClick={() => removeProduct(p.id, "source")}
                        className="ml-1 rounded-full hover:bg-destructive/10 p-0.5"
                      >
                        <X className="h-3 w-3 text-destructive" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Target products for x_alana_y_indirim */}
            {form.type === "x_alana_y_indirim" && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Hedef Ürünler (İndirimli)</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-10"
                      placeholder="Hedef ürün barkodu..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleBarcodeAdd("target");
                        }
                      }}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" onClick={() => handleBarcodeAdd("target")}>
                    Ekle
                  </Button>
                </div>
                {form.targetProducts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {form.targetProducts.map((p) => (
                      <Badge key={p.id} variant="outline" className="gap-1 pr-1 py-1">
                        <Package className="h-3 w-3" />
                        {p.name}
                        <button
                          onClick={() => removeProduct(p.id, "target")}
                          className="ml-1 rounded-full hover:bg-destructive/10 p-0.5"
                        >
                          <X className="h-3 w-3 text-destructive" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Save */}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                İptal
              </Button>
              <Button
                size="lg"
                onClick={handleSave}
                disabled={
                  !form.name.trim() ||
                  form.sourceProducts.length === 0 ||
                  createCampaign.isPending ||
                  updateCampaign.isPending
                }
                className="gap-2 min-w-[140px]"
              >
                <Sparkles className="h-4 w-4" />
                {editingId ? "Güncelle" : "Oluştur"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kampanyayı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu kampanya kalıcı olarak silinecektir. Devam etmek istiyor musunuz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) deleteCampaign.mutate(deleteId);
                setDeleteId(null);
              }}
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default CampaignsPage;
