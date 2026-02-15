import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tags, Plus, Percent, Gift, ToggleRight, Trash2, Pencil, ScanBarcode, X } from "lucide-react";
import {
  useCampaigns,
  useCreateCampaign,
  useUpdateCampaign,
  useDeleteCampaign,
  getCampaignTypeLabel,
  getCampaignDetails,
  getCampaignStatus,
  type Campaign,
  type CampaignWithProducts,
} from "@/hooks/useCampaigns";
import { useProducts, type Product } from "@/hooks/useProducts";

type CampaignType = "x_al_y_ode" | "x_alana_y_indirim" | "yuzde_indirim";

interface FormState {
  name: string;
  type: CampaignType;
  buy_quantity: number;
  pay_quantity: number;
  discount_percent: number;
  source_buy_quantity: number;
  target_discount_percent: number;
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
  start_date: new Date().toISOString().split("T")[0],
  end_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
  is_active: true,
  sourceProducts: [],
  targetProducts: [],
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
  const [barcodeTarget, setBarcodeTarget] = useState<"source" | "target">("source");

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

  const activeCampaigns = campaigns.filter((c) => getCampaignStatus(c).label === "Aktif");

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Kampanya Yönetimi</h1>
            <p className="text-muted-foreground text-sm mt-1">
              İndirim ve promosyon kampanyalarını yönetin
            </p>
          </div>
          <Button className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Yeni Kampanya
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="stat-card border-primary/20">
            <CardContent className="p-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Gift className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">X Al Y Öde</p>
                  <p className="text-xl font-bold">
                    {campaigns.filter((c) => c.type === "x_al_y_ode").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="stat-card border-info/20">
            <CardContent className="p-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                  <Percent className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Yüzde İndirim</p>
                  <p className="text-xl font-bold">
                    {campaigns.filter((c) => c.type === "yuzde_indirim" || c.type === "x_alana_y_indirim").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="stat-card border-success/20">
            <CardContent className="p-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <ToggleRight className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Aktif Kampanya</p>
                  <p className="text-xl font-bold">{activeCampaigns.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Tags className="h-4 w-4 text-primary" />
              Kampanya Listesi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : campaigns.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Henüz kampanya yok.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kampanya Adı</TableHead>
                    <TableHead>Tür</TableHead>
                    <TableHead>Detay</TableHead>
                    <TableHead>Başlangıç</TableHead>
                    <TableHead>Bitiş</TableHead>
                    <TableHead>Ürün</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((c) => {
                    const status = getCampaignStatus(c);
                    const productCount = (c.campaign_products || []).length;
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{getCampaignTypeLabel(c.type)}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{getCampaignDetails(c)}</TableCell>
                        <TableCell className="text-sm">{c.start_date}</TableCell>
                        <TableCell className="text-sm">{c.end_date}</TableCell>
                        <TableCell className="text-center">{productCount}</TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(c.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Kampanyayı Düzenle" : "Yeni Kampanya"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Kampanya Adı</Label>
                <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Kampanya adı..." />
              </div>
              <div>
                <Label>Kampanya Türü</Label>
                <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v as CampaignType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yuzde_indirim">Yüzde İndirim</SelectItem>
                    <SelectItem value="x_al_y_ode">X Al Y Öde</SelectItem>
                    <SelectItem value="x_alana_y_indirim">X Alana Y'de İndirim</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                    className="rounded"
                  />
                  <Label>Aktif</Label>
                </div>
              </div>
            </div>

            {/* Type-specific fields */}
            {form.type === "yuzde_indirim" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>İndirim Yüzdesi (%)</Label>
                  <Input type="number" min={1} max={100} value={form.discount_percent} onChange={(e) => setForm((p) => ({ ...p, discount_percent: Number(e.target.value) }))} />
                </div>
              </div>
            )}

            {form.type === "x_al_y_ode" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Al (Adet)</Label>
                  <Input type="number" min={1} value={form.buy_quantity} onChange={(e) => setForm((p) => ({ ...p, buy_quantity: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label>Öde (Adet)</Label>
                  <Input type="number" min={1} value={form.pay_quantity} onChange={(e) => setForm((p) => ({ ...p, pay_quantity: Number(e.target.value) }))} />
                </div>
              </div>
            )}

            {form.type === "x_alana_y_indirim" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Kaynak Ürün Al (Adet)</Label>
                  <Input type="number" min={1} value={form.source_buy_quantity} onChange={(e) => setForm((p) => ({ ...p, source_buy_quantity: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label>Hedef Ürün İndirim (%)</Label>
                  <Input type="number" min={1} max={100} value={form.target_discount_percent} onChange={(e) => setForm((p) => ({ ...p, target_discount_percent: Number(e.target.value) }))} />
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Başlangıç Tarihi</Label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))} />
              </div>
              <div>
                <Label>Bitiş Tarihi</Label>
                <Input type="date" value={form.end_date} onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))} />
              </div>
            </div>

            {/* Product selection via barcode */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                {form.type === "x_alana_y_indirim" ? "Kaynak Ürünler (Al)" : "Kampanya Ürünleri"}
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
                <Button variant="outline" onClick={() => handleBarcodeAdd("source")}>Ekle</Button>
              </div>
              {form.sourceProducts.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.sourceProducts.map((p) => (
                    <Badge key={p.id} variant="secondary" className="gap-1.5 pr-1">
                      {p.name} <span className="text-xs text-muted-foreground">({p.barcode})</span>
                      <button onClick={() => removeProduct(p.id, "source")} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Target products for x_alana_y_indirim */}
            {form.type === "x_alana_y_indirim" && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">Hedef Ürünler (İndirimli)</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-10"
                      placeholder="Hedef ürün barkodu..."
                      value={barcodeTarget === "target" ? barcodeInput : ""}
                      onChange={(e) => {
                        setBarcodeTarget("target");
                        setBarcodeInput(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleBarcodeAdd("target");
                        }
                      }}
                    />
                  </div>
                  <Button variant="outline" onClick={() => handleBarcodeAdd("target")}>Ekle</Button>
                </div>
                {form.targetProducts.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.targetProducts.map((p) => (
                      <Badge key={p.id} variant="outline" className="gap-1.5 pr-1">
                        {p.name} <span className="text-xs text-muted-foreground">({p.barcode})</span>
                        <button onClick={() => removeProduct(p.id, "target")} className="ml-1 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
              <Button
                onClick={handleSave}
                disabled={!form.name.trim() || form.sourceProducts.length === 0 || createCampaign.isPending || updateCampaign.isPending}
              >
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
