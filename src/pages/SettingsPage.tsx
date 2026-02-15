import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { useStoreSettings, useUpdateStoreSettings } from "@/hooks/useStoreSettings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Store, Palette, Receipt, Bell, Upload, Save, Loader2,
  MapPin, Phone, Hash, Building2, X, Image, CheckCircle2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SettingsPage = () => {
  const { data: settings, isLoading } = useStoreSettings();
  const updateSettings = useUpdateStoreSettings();
  const { toast } = useToast();

  // Store info
  const [storeName, setStoreName] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [taxOffice, setTaxOffice] = useState("");

  // Receipt
  const [receiptHeader, setReceiptHeader] = useState("");
  const [receiptFooter, setReceiptFooter] = useState("");
  const [currencySymbol, setCurrencySymbol] = useState("₺");

  // System
  const [minStockAlert, setMinStockAlert] = useState(true);

  // Logos
  const [uploadingLight, setUploadingLight] = useState(false);
  const [uploadingDark, setUploadingDark] = useState(false);
  const lightRef = useRef<HTMLInputElement>(null);
  const darkRef = useRef<HTMLInputElement>(null);

  const [savingStore, setSavingStore] = useState(false);
  const [savingReceipt, setSavingReceipt] = useState(false);
  const [savingSystem, setSavingSystem] = useState(false);

  useEffect(() => {
    if (settings) {
      setStoreName(settings.store_name);
      setStoreAddress(settings.store_address);
      setStorePhone(settings.store_phone);
      setTaxNumber(settings.tax_number);
      setTaxOffice(settings.tax_office);
      setReceiptHeader(settings.receipt_header);
      setReceiptFooter(settings.receipt_footer);
      setCurrencySymbol(settings.currency_symbol);
      setMinStockAlert(settings.min_stock_alert);
    }
  }, [settings]);

  const handleLogoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    mode: "light" | "dark"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const setUploading = mode === "light" ? setUploadingLight : setUploadingDark;
    setUploading(true);

    const filePath = `logos/logo-${mode}.${file.name.split(".").pop()}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Yükleme hatası", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const field = mode === "light" ? "logo_light_url" : "logo_dark_url";
    await updateSettings.mutateAsync({ [field]: publicUrl });
    setUploading(false);
  };

  const removeLogo = async (mode: "light" | "dark") => {
    const field = mode === "light" ? "logo_light_url" : "logo_dark_url";
    await updateSettings.mutateAsync({ [field]: null });
  };

  const saveStoreInfo = async () => {
    setSavingStore(true);
    await updateSettings.mutateAsync({
      store_name: storeName,
      store_address: storeAddress,
      store_phone: storePhone,
      tax_number: taxNumber,
      tax_office: taxOffice,
    });
    setSavingStore(false);
  };

  const saveReceiptInfo = async () => {
    setSavingReceipt(true);
    await updateSettings.mutateAsync({
      receipt_header: receiptHeader,
      receipt_footer: receiptFooter,
      currency_symbol: currencySymbol,
    });
    setSavingReceipt(false);
  };

  const saveSystemInfo = async () => {
    setSavingSystem(true);
    await updateSettings.mutateAsync({
      min_stock_alert: minStockAlert,
    });
    setSavingSystem(false);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl border bg-card p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/15" />
          <div className="relative">
            <h1 className="text-2xl font-bold tracking-tight">Sistem Ayarları</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Mağaza bilgileri, logo, fiş ve sistem ayarlarınızı tek yerden yönetin
            </p>
            {settings?.updated_at && (
              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-success" />
                Son güncelleme: {new Date(settings.updated_at).toLocaleDateString("tr-TR", {
                  day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                })}
              </p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="store" className="space-y-6">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="store" className="gap-1.5 text-xs sm:text-sm">
              <Store className="h-4 w-4" />
              <span className="hidden sm:inline">Mağaza</span>
            </TabsTrigger>
            <TabsTrigger value="logo" className="gap-1.5 text-xs sm:text-sm">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Logo</span>
            </TabsTrigger>
            <TabsTrigger value="receipt" className="gap-1.5 text-xs sm:text-sm">
              <Receipt className="h-4 w-4" />
              <span className="hidden sm:inline">Fiş</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-1.5 text-xs sm:text-sm">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Sistem</span>
            </TabsTrigger>
          </TabsList>

          {/* Store Info */}
          <TabsContent value="store">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Store className="h-4 w-4 text-primary" />
                  Mağaza Bilgileri
                </CardTitle>
                <CardDescription>Tekel bayi mağazanızın temel bilgilerini yönetin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="storeName">Mağaza Adı</Label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="storeName" value={storeName} onChange={e => setStoreName(e.target.value)} className="pl-10" placeholder="Mağaza adı" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storeAddress">Adres</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea id="storeAddress" value={storeAddress} onChange={e => setStoreAddress(e.target.value)} className="pl-10 min-h-[80px]" placeholder="Mağaza adresi" />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="storePhone">Telefon</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="storePhone" value={storePhone} onChange={e => setStorePhone(e.target.value)} className="pl-10" placeholder="0 (___) ___ __ __" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxOffice">Vergi Dairesi</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="taxOffice" value={taxOffice} onChange={e => setTaxOffice(e.target.value)} className="pl-10" placeholder="Vergi dairesi" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxNumber">Vergi / TC No</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="taxNumber" value={taxNumber} onChange={e => setTaxNumber(e.target.value)} className="pl-10" placeholder="Vergi numarası" />
                  </div>
                </div>

                <Separator />
                <div className="flex justify-end">
                  <Button onClick={saveStoreInfo} disabled={savingStore} className="gap-2 min-w-[140px]">
                    {savingStore ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {savingStore ? "Kaydediliyor..." : "Kaydet"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logo */}
          <TabsContent value="logo">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Palette className="h-4 w-4 text-primary" />
                  Logo Ayarları
                </CardTitle>
                <CardDescription>Açık ve koyu mod için farklı logolar yükleyebilirsiniz</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-6">
                  {/* Light Logo */}
                  <div className="space-y-3">
                    <Label>Açık Mod Logosu</Label>
                    <div className="relative group">
                      {settings?.logo_light_url ? (
                        <div className="relative flex h-40 items-center justify-center rounded-xl border bg-background p-4">
                          <img src={settings.logo_light_url} alt="Light logo" className="max-h-full max-w-full object-contain" />
                          <button
                            onClick={() => removeLogo("light")}
                            className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => lightRef.current?.click()}
                          disabled={uploadingLight}
                          className="flex h-40 w-full items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 hover:border-primary/40 hover:bg-muted/50 transition-all cursor-pointer"
                        >
                          {uploadingLight ? (
                            <Loader2 className="h-8 w-8 text-primary animate-spin" />
                          ) : (
                            <div className="text-center space-y-2">
                              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                <Image className="h-5 w-5 text-primary" />
                              </div>
                              <p className="text-xs text-muted-foreground font-medium">Açık mod logosu yükle</p>
                            </div>
                          )}
                        </button>
                      )}
                      <input ref={lightRef} type="file" accept="image/*" className="hidden" onChange={e => handleLogoUpload(e, "light")} />
                    </div>
                  </div>

                  {/* Dark Logo */}
                  <div className="space-y-3">
                    <Label>Koyu Mod Logosu</Label>
                    <div className="relative group">
                      {settings?.logo_dark_url ? (
                        <div className="relative flex h-40 items-center justify-center rounded-xl border bg-foreground/5 p-4">
                          <img src={settings.logo_dark_url} alt="Dark logo" className="max-h-full max-w-full object-contain" />
                          <button
                            onClick={() => removeLogo("dark")}
                            className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => darkRef.current?.click()}
                          disabled={uploadingDark}
                          className="flex h-40 w-full items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/20 bg-foreground/5 hover:border-primary/40 hover:bg-foreground/10 transition-all cursor-pointer"
                        >
                          {uploadingDark ? (
                            <Loader2 className="h-8 w-8 text-primary animate-spin" />
                          ) : (
                            <div className="text-center space-y-2">
                              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                <Image className="h-5 w-5 text-primary" />
                              </div>
                              <p className="text-xs text-muted-foreground font-medium">Koyu mod logosu yükle</p>
                            </div>
                          )}
                        </button>
                      )}
                      <input ref={darkRef} type="file" accept="image/*" className="hidden" onChange={e => handleLogoUpload(e, "dark")} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Receipt */}
          <TabsContent value="receipt">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-primary" />
                  Fiş / Makbuz Ayarları
                </CardTitle>
                <CardDescription>Fiş başlık ve alt bilgilerini düzenleyin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="receiptHeader">Fiş Başlığı</Label>
                  <Textarea
                    id="receiptHeader"
                    value={receiptHeader}
                    onChange={e => setReceiptHeader(e.target.value)}
                    placeholder="Fişin üst kısmında görünecek metin (mağaza adı, adres vb.)"
                    className="min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground">Her satır ayrı bir satır olarak yazdırılır</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="receiptFooter">Fiş Alt Bilgisi</Label>
                  <Textarea
                    id="receiptFooter"
                    value={receiptFooter}
                    onChange={e => setReceiptFooter(e.target.value)}
                    placeholder="Fişin alt kısmında görünecek metin (teşekkür mesajı vb.)"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2 max-w-[200px]">
                  <Label htmlFor="currency">Para Birimi Sembolü</Label>
                  <Input id="currency" value={currencySymbol} onChange={e => setCurrencySymbol(e.target.value)} placeholder="₺" />
                </div>

                {/* Preview */}
                <Separator />
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Fiş Önizleme</Label>
                  <div className="mt-3 mx-auto max-w-[280px] rounded-lg border bg-background p-4 font-mono text-xs space-y-2">
                    <div className="text-center whitespace-pre-line font-semibold">
                      {receiptHeader || storeName || "Mağaza Adı"}
                    </div>
                    <Separator />
                    <div className="space-y-1 text-muted-foreground">
                      <div className="flex justify-between"><span>Ürün Adı x2</span><span>{currencySymbol}25.00</span></div>
                      <div className="flex justify-between"><span>Ürün Adı x1</span><span>{currencySymbol}12.50</span></div>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>TOPLAM</span><span>{currencySymbol}37.50</span>
                    </div>
                    {receiptFooter && (
                      <>
                        <Separator />
                        <div className="text-center whitespace-pre-line text-muted-foreground">{receiptFooter}</div>
                      </>
                    )}
                  </div>
                </div>

                <Separator />
                <div className="flex justify-end">
                  <Button onClick={saveReceiptInfo} disabled={savingReceipt} className="gap-2 min-w-[140px]">
                    {savingReceipt ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {savingReceipt ? "Kaydediliyor..." : "Kaydet"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System */}
          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  Sistem Ayarları
                </CardTitle>
                <CardDescription>Puan sistemi ve bildirim tercihlerini yönetin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Düşük Stok Uyarısı</Label>
                    <p className="text-xs text-muted-foreground">Minimum stok seviyesinin altına düşen ürünler için bildirim</p>
                  </div>
                  <Switch checked={minStockAlert} onCheckedChange={setMinStockAlert} />
                </div>

                <Separator />
                <div className="flex justify-end">
                  <Button onClick={saveSystemInfo} disabled={savingSystem} className="gap-2 min-w-[140px]">
                    {savingSystem ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {savingSystem ? "Kaydediliyor..." : "Kaydet"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default SettingsPage;
