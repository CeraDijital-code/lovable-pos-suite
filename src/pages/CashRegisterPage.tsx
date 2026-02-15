import { useState, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  ScanBarcode,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  ShoppingCart,
  Package,
  Search,
  CheckCircle2,
  Tag,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
} from "lucide-react";
import { useProducts, type Product } from "@/hooks/useProducts";
import { useCampaigns, type CampaignWithProducts } from "@/hooks/useCampaigns";
import { useCompleteSale, type CartItem } from "@/hooks/useSales";
import { useAuth } from "@/hooks/useAuth";

const PRODUCTS_PER_PAGE = 12;

function applyCampaigns(
  items: CartItem[],
  campaigns: CampaignWithProducts[]
): CartItem[] {
  const today = new Date().toISOString().split("T")[0];
  const activeCampaigns = campaigns.filter(
    (c) => c.is_active && c.start_date <= today && c.end_date >= today
  );

  return items.map((item) => {
    let bestDiscount = 0;
    let bestCampaignId: string | null = null;
    let bestCampaignName: string | null = null;

    for (const campaign of activeCampaigns) {
      const sourceProducts = (campaign.campaign_products || [])
        .filter((cp) => cp.role === "source")
        .map((cp) => cp.product_id);

      if (!sourceProducts.includes(item.productId)) continue;

      if (campaign.type === "yuzde_indirim") {
        const disc = item.unitPrice * item.quantity * (campaign.discount_percent / 100);
        if (disc > bestDiscount) {
          bestDiscount = disc;
          bestCampaignId = campaign.id;
          bestCampaignName = campaign.name;
        }
      }

      if (campaign.type === "x_al_y_ode" && item.quantity >= campaign.buy_quantity) {
        const freeItems = Math.floor(item.quantity / campaign.buy_quantity) * (campaign.buy_quantity - campaign.pay_quantity);
        const disc = freeItems * item.unitPrice;
        if (disc > bestDiscount) {
          bestDiscount = disc;
          bestCampaignId = campaign.id;
          bestCampaignName = campaign.name;
        }
      }

      if (campaign.type === "ozel_fiyat" && item.quantity >= campaign.special_price_min_quantity) {
        const normalTotal = item.unitPrice * item.quantity;
        const specialTotal = campaign.special_price * item.quantity;
        const disc = normalTotal - specialTotal;
        if (disc > 0 && disc > bestDiscount) {
          bestDiscount = disc;
          bestCampaignId = campaign.id;
          bestCampaignName = campaign.name;
        }
      }
    }

    const total = item.unitPrice * item.quantity - bestDiscount;
    return {
      ...item,
      discount: Math.round(bestDiscount * 100) / 100,
      campaignId: bestCampaignId,
      campaignName: bestCampaignName,
      total: Math.round(total * 100) / 100,
    };
  });
}

const CashRegisterPage = () => {
  const [barcodeInput, setBarcodeInput] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [page, setPage] = useState(0);
  const barcodeRef = useRef<HTMLInputElement>(null);

  const { data: allProducts = [] } = useProducts();
  const { data: campaigns = [] } = useCampaigns();
  const completeSale = useCompleteSale();
  const { profile } = useAuth();

  // Filter products for grid
  const filteredProducts = useMemo(() => {
    if (!productSearch) return allProducts.filter((p) => p.is_active);
    const q = productSearch.toLowerCase();
    return allProducts.filter(
      (p) =>
        p.is_active &&
        (p.name.toLowerCase().includes(q) || p.barcode.includes(q))
    );
  }, [allProducts, productSearch]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const pagedProducts = filteredProducts.slice(
    page * PRODUCTS_PER_PAGE,
    (page + 1) * PRODUCTS_PER_PAGE
  );

  const addToCart = useCallback(
    (product: Product) => {
      setCart((prev) => {
        const existing = prev.find((i) => i.productId === product.id);
        let newCart;
        if (existing) {
          newCart = prev.map((i) =>
            i.productId === product.id
              ? { ...i, quantity: i.quantity + 1, total: i.unitPrice * (i.quantity + 1) }
              : i
          );
        } else {
          newCart = [
            ...prev,
            {
              productId: product.id,
              barcode: product.barcode,
              name: product.name,
              image_url: (product as any).image_url,
              unitPrice: product.price,
              quantity: 1,
              discount: 0,
              campaignId: null,
              campaignName: null,
              total: product.price,
            },
          ];
        }
        return applyCampaigns(newCart, campaigns);
      });
    },
    [campaigns]
  );

  const handleBarcodeScan = () => {
    if (!barcodeInput.trim()) return;
    const product = allProducts.find((p) => p.barcode === barcodeInput.trim());
    if (product) {
      addToCart(product);
      setBarcodeInput("");
    }
    barcodeRef.current?.focus();
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      const updated = prev
        .map((i) =>
          i.productId === productId
            ? { ...i, quantity: Math.max(0, i.quantity + delta), total: i.unitPrice * Math.max(0, i.quantity + delta) }
            : i
        )
        .filter((i) => i.quantity > 0);
      return applyCampaigns(updated, campaigns);
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => applyCampaigns(prev.filter((i) => i.productId !== productId), campaigns));
  };

  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const totalDiscount = cart.reduce((s, i) => s + i.discount, 0);
  const grandTotal = subtotal - totalDiscount;

  const handlePayment = (method: string) => {
    if (cart.length === 0) return;
    completeSale.mutate(
      {
        items: cart,
        paymentMethod: method,
        subtotal: Math.round(subtotal * 100) / 100,
        discount: Math.round(totalDiscount * 100) / 100,
        total: Math.round(grandTotal * 100) / 100,
      },
      {
        onSuccess: () => {
          setCart([]);
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 2000);
        },
      }
    );
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top bar */}
      <div className="h-14 border-b bg-card flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <ShoppingCart className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">TekelPOS Kasa</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{profile?.full_name}</span>
          <a href="/" className="text-xs text-muted-foreground hover:text-foreground underline">
            Ana Sayfa
          </a>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Products */}
        <div className="flex-1 flex flex-col border-r overflow-hidden">
          {/* Barcode scanner bar */}
          <div className="p-3 border-b bg-card/50 shrink-0">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  ref={barcodeRef}
                  className="pl-11 h-12 text-lg font-mono"
                  placeholder="Barkod okutun..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleBarcodeScan();
                  }}
                  autoFocus
                />
              </div>
              <Button className="h-12 px-6 text-base" onClick={handleBarcodeScan}>
                Ekle
              </Button>
            </div>
          </div>

          {/* Product search */}
          <div className="px-3 pt-3 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10 h-10"
                placeholder="Ürün ara..."
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setPage(0);
                }}
              />
            </div>
          </div>

          {/* Product grid */}
          <div className="flex-1 p-3 overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {pagedProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="flex flex-col items-center gap-1.5 rounded-xl border bg-card p-3 transition-all active:scale-95 hover:border-primary/50 hover:shadow-md touch-manipulation"
                >
                  <div className="w-full aspect-square rounded-lg bg-muted/50 flex items-center justify-center overflow-hidden">
                    {(product as any).image_url ? (
                      <img
                        src={(product as any).image_url}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Package className="h-8 w-8 text-muted-foreground/40" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-center line-clamp-2 leading-tight">
                    {product.name}
                  </span>
                  <span className="text-sm font-bold text-primary">
                    ₺{Number(product.price).toLocaleString("tr-TR")}
                  </span>
                  {product.stock <= product.min_stock && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                      Düşük Stok
                    </Badge>
                  )}
                </button>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4 pb-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground min-w-[80px] text-center">
                  {page + 1} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Cart & Payment */}
        <div className="w-[380px] lg:w-[420px] flex flex-col bg-card shrink-0">
          {/* Cart header */}
          <div className="px-4 py-3 border-b shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-primary" />
              <span className="font-semibold">Sepet</span>
              {cart.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {cart.reduce((s, i) => s + i.quantity, 0)} ürün
                </Badge>
              )}
            </div>
            {cart.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive text-xs h-7"
                onClick={() => setCart([])}
              >
                Temizle
              </Button>
            )}
          </div>

          {/* Cart items */}
          <ScrollArea className="flex-1">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm">Sepet boş</p>
                <p className="text-xs mt-1">Barkod okutun veya ürün seçin</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {cart.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center gap-2 rounded-lg border p-2 bg-background/50"
                  >
                    {/* Thumbnail */}
                    <div className="h-12 w-12 rounded-md bg-muted/50 flex items-center justify-center overflow-hidden shrink-0">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-full w-full object-cover rounded-md"
                        />
                      ) : (
                        <Package className="h-5 w-5 text-muted-foreground/40" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">
                          ₺{item.unitPrice.toLocaleString("tr-TR")}
                        </span>
                        {item.campaignName && (
                          <Badge className="text-[9px] px-1 py-0 h-4 bg-success/10 text-success border-success/20">
                            <Tag className="h-2.5 w-2.5 mr-0.5" />
                            {item.campaignName}
                          </Badge>
                        )}
                      </div>
                      {item.discount > 0 && (
                        <span className="text-[10px] text-success font-medium">
                          -₺{item.discount.toLocaleString("tr-TR")} indirim
                        </span>
                      )}
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 touch-manipulation"
                        onClick={() => updateQuantity(item.productId, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-bold text-sm">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 touch-manipulation"
                        onClick={() => updateQuantity(item.productId, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Total & remove */}
                    <div className="text-right shrink-0 w-16">
                      <p className="text-sm font-bold">
                        ₺{item.total.toLocaleString("tr-TR")}
                      </p>
                      <button
                        className="text-destructive/60 hover:text-destructive mt-0.5"
                        onClick={() => removeFromCart(item.productId)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Payment Summary & Buttons */}
          <div className="border-t bg-card p-4 space-y-3 shrink-0">
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ara Toplam</span>
                <span>₺{subtotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-success flex items-center gap-1">
                    <Tag className="h-3 w-3" /> Kampanya İndirimi
                  </span>
                  <span className="text-success font-medium">
                    -₺{totalDiscount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">TOPLAM</span>
                <span className="text-2xl font-black text-primary">
                  ₺{grandTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                className="h-14 text-base gap-2 touch-manipulation"
                size="lg"
                disabled={cart.length === 0 || completeSale.isPending}
                onClick={() => handlePayment("cash")}
              >
                <Banknote className="h-5 w-5" />
                Nakit
              </Button>
              <Button
                variant="outline"
                className="h-14 text-base gap-2 touch-manipulation"
                size="lg"
                disabled={cart.length === 0 || completeSale.isPending}
                onClick={() => handlePayment("card")}
              >
                <CreditCard className="h-5 w-5" />
                Kart
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Success overlay */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 animate-in zoom-in-95 duration-300">
            <CheckCircle2 className="h-20 w-20 text-success" />
            <span className="text-2xl font-bold">Satış Tamamlandı!</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashRegisterPage;
