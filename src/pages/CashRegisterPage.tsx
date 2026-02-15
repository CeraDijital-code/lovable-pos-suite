import { useState, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
  Percent,
  BadgeDollarSign,
  SplitSquareHorizontal,
  Wallet,
  ReceiptText,
  Sparkles,
  Heart,
  Star,
  Phone,
  X,
  Shield,
} from "lucide-react";
import { useProducts, type Product } from "@/hooks/useProducts";
import { useCampaigns, type CampaignWithProducts } from "@/hooks/useCampaigns";
import { useCompleteSale, type CartItem } from "@/hooks/useSales";
import { useAuth } from "@/hooks/useAuth";
import {
  useLoyaltyCustomers,
  useLoyaltyPointRules,
  useEarnPoints,
  useRedeemPoints,
  useSendOtp,
  useVerifyOtp,
  calculateEarnedPoints,
  type LoyaltyCustomer,
} from "@/hooks/useLoyalty";

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
        const disc =
          item.unitPrice * item.quantity * (campaign.discount_percent / 100);
        if (disc > bestDiscount) {
          bestDiscount = disc;
          bestCampaignId = campaign.id;
          bestCampaignName = campaign.name;
        }
      }

      if (
        campaign.type === "x_al_y_ode" &&
        item.quantity >= campaign.buy_quantity
      ) {
        const freeItems =
          Math.floor(item.quantity / campaign.buy_quantity) *
          (campaign.buy_quantity - campaign.pay_quantity);
        const disc = freeItems * item.unitPrice;
        if (disc > bestDiscount) {
          bestDiscount = disc;
          bestCampaignId = campaign.id;
          bestCampaignName = campaign.name;
        }
      }

      if (
        campaign.type === "ozel_fiyat" &&
        item.quantity >= campaign.special_price_min_quantity
      ) {
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

    const lineTotal = item.unitPrice * item.quantity;
    const afterCampaign = lineTotal - bestDiscount;
    const afterManual = afterCampaign - (item.manualDiscount || 0);
    return {
      ...item,
      discount: Math.round(bestDiscount * 100) / 100,
      campaignId: bestCampaignId,
      campaignName: bestCampaignName,
      total: Math.round(Math.max(0, afterManual) * 100) / 100,
    };
  });
}

const fmt = (n: number) =>
  n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const POINTS_PER_TL_REDEEM = 100; // 100 puan = 1 TL

const CashRegisterPage = () => {
  const [barcodeInput, setBarcodeInput] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [page, setPage] = useState(0);
  const barcodeRef = useRef<HTMLInputElement>(null);

  // Modals
  const [discountModal, setDiscountModal] = useState<{
    type: "item" | "cart";
    productId?: string;
  } | null>(null);
  const [discountMode, setDiscountMode] = useState<"amount" | "percent">("amount");
  const [discountValue, setDiscountValue] = useState("");

  const [splitModal, setSplitModal] = useState(false);
  const [splitCash, setSplitCash] = useState("");
  const [splitCard, setSplitCard] = useState("");

  const [paymentModal, setPaymentModal] = useState<string | null>(null);

  // Loyalty state
  const [loyaltySearch, setLoyaltySearch] = useState("");
  const [loyaltyCustomer, setLoyaltyCustomer] = useState<LoyaltyCustomer | null>(null);
  const [loyaltySearchOpen, setLoyaltySearchOpen] = useState(false);
  const [otpModal, setOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpDevCode, setOtpDevCode] = useState<string | null>(null);
  const [pointsToRedeem, setPointsToRedeem] = useState("");

  const { data: allProducts = [] } = useProducts();
  const { data: campaigns = [] } = useCampaigns();
  const completeSale = useCompleteSale();
  const { profile } = useAuth();

  // Loyalty hooks
  const { data: loyaltySearchResults = [] } = useLoyaltyCustomers(
    loyaltySearch.length >= 2 ? loyaltySearch : undefined
  );
  const { data: pointRules = [] } = useLoyaltyPointRules();
  const earnPoints = useEarnPoints();
  const redeemPoints = useRedeemPoints();
  const sendOtp = useSendOtp();
  const verifyOtp = useVerifyOtp();

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
              ? {
                  ...i,
                  quantity: i.quantity + 1,
                  total: i.unitPrice * (i.quantity + 1),
                }
              : i
          );
        } else {
          newCart = [
            ...prev,
            {
              productId: product.id,
              barcode: product.barcode,
              name: product.name,
              image_url: product.image_url,
              unitPrice: product.price,
              quantity: 1,
              discount: 0,
              manualDiscount: 0,
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
            ? {
                ...i,
                quantity: Math.max(0, i.quantity + delta),
                total: i.unitPrice * Math.max(0, i.quantity + delta),
              }
            : i
        )
        .filter((i) => i.quantity > 0);
      return applyCampaigns(updated, campaigns);
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) =>
      applyCampaigns(
        prev.filter((i) => i.productId !== productId),
        campaigns
      )
    );
  };

  // Discount logic
  const applyDiscount = () => {
    if (!discountModal || !discountValue) return;
    const val = parseFloat(discountValue) || 0;
    if (val <= 0) return;

    if (discountModal.type === "item" && discountModal.productId) {
      setCart((prev) => {
        const updated = prev.map((item) => {
          if (item.productId !== discountModal.productId) return item;
          const lineTotal = item.unitPrice * item.quantity;
          let manualDisc =
            discountMode === "percent"
              ? (lineTotal - item.discount) * (val / 100)
              : val;
          manualDisc = Math.min(manualDisc, lineTotal - item.discount);
          return { ...item, manualDiscount: Math.round(manualDisc * 100) / 100 };
        });
        return applyCampaigns(updated, campaigns);
      });
    } else {
      // Cart-wide discount
      setCart((prev) => {
        const currentTotal = prev.reduce(
          (s, i) => s + i.unitPrice * i.quantity - i.discount,
          0
        );
        const totalDisc =
          discountMode === "percent" ? currentTotal * (val / 100) : val;
        // Distribute proportionally
        const updated = prev.map((item) => {
          const lineWeight =
            (item.unitPrice * item.quantity - item.discount) / currentTotal;
          const itemDisc = totalDisc * lineWeight;
          return {
            ...item,
            manualDiscount: Math.round(itemDisc * 100) / 100,
          };
        });
        return applyCampaigns(updated, campaigns);
      });
    }
    setDiscountModal(null);
    setDiscountValue("");
  };

  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const campaignDiscount = cart.reduce((s, i) => s + i.discount, 0);
  const manualDiscountTotal = cart.reduce((s, i) => s + (i.manualDiscount || 0), 0);
  const totalDiscount = campaignDiscount + manualDiscountTotal;
  const grandTotal = Math.max(0, subtotal - totalDiscount);

  // Loyalty points calculation
  const earnedPointsInfo = useMemo(() => {
    if (!loyaltyCustomer || cart.length === 0) return null;
    return calculateEarnedPoints(cart, pointRules, grandTotal);
  }, [loyaltyCustomer, cart, pointRules, grandTotal]);

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
        onSuccess: (sale) => {
          // Earn loyalty points if customer is selected
          if (loyaltyCustomer && earnedPointsInfo && earnedPointsInfo.totalPoints > 0) {
            earnPoints.mutate({
              customerId: loyaltyCustomer.id,
              saleId: sale.id,
              points: earnedPointsInfo.totalPoints,
              description: `Satış #${sale.sale_number} - ${earnedPointsInfo.breakdown.map(b => b.ruleName).join(", ")}`,
              saleTotal: grandTotal,
            });
          }
          setCart([]);
          setPaymentModal(null);
          setLoyaltyCustomer(null);
          setLoyaltySearch("");
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 2000);
        },
      }
    );
  };

  const handleSplitPayment = () => {
    const cashAmt = parseFloat(splitCash) || 0;
    const cardAmt = parseFloat(splitCard) || 0;
    if (Math.abs(cashAmt + cardAmt - grandTotal) > 0.01) return;
    handlePayment(`split:cash=${cashAmt},card=${cardAmt}`);
    setSplitModal(false);
  };

  const handleStartRedeem = () => {
    if (!loyaltyCustomer) return;
    setPointsToRedeem("");
    setOtpCode("");
    setOtpDevCode(null);
    sendOtp.mutate(
      { phone: loyaltyCustomer.phone, purpose: "redeem" },
      {
        onSuccess: (data) => {
          setOtpDevCode(data?.dev_code || null);
          setOtpModal(true);
        },
      }
    );
  };

  const handleVerifyAndRedeem = () => {
    if (!loyaltyCustomer || !otpCode) return;
    const pts = parseInt(pointsToRedeem) || 0;
    if (pts <= 0 || pts > loyaltyCustomer.total_points) return;

    verifyOtp.mutate(
      { phone: loyaltyCustomer.phone, code: otpCode, purpose: "redeem" },
      {
        onSuccess: (data) => {
          if (data.verified) {
            redeemPoints.mutate({
              customerId: loyaltyCustomer.id,
              points: pts,
              description: `Kasada puan harcama - ${pts} puan = ₺${fmt(pts / POINTS_PER_TL_REDEEM)}`,
            });
            setOtpModal(false);
            // Apply discount to cart
            const discountAmount = pts / POINTS_PER_TL_REDEEM;
            setCart((prev) => {
              const currentTotal = prev.reduce((s, i) => s + i.unitPrice * i.quantity - i.discount, 0);
              const updated = prev.map((item) => {
                const lineWeight = (item.unitPrice * item.quantity - item.discount) / currentTotal;
                const itemDisc = discountAmount * lineWeight;
                return { ...item, manualDiscount: (item.manualDiscount || 0) + Math.round(itemDisc * 100) / 100 };
              });
              return applyCampaigns(updated, campaigns);
            });
            // Refresh customer data
            setLoyaltyCustomer({ ...loyaltyCustomer, total_points: loyaltyCustomer.total_points - pts });
          }
        },
      }
    );
  };

  const totalItemCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top bar */}
      <div className="h-12 border-b bg-card/95 backdrop-blur flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <Wallet className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="font-bold">TekelPOS</span>
          <Badge variant="outline" className="text-[10px] font-normal">
            Kasa
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {profile?.full_name}
          </span>
          <a
            href="/"
            className="text-xs text-primary hover:underline font-medium"
          >
            Ana Sayfa
          </a>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Products */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Barcode + Search combined */}
          <div className="p-3 bg-card/30 border-b space-y-2 shrink-0">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/60" />
                <Input
                  ref={barcodeRef}
                  className="pl-11 h-12 text-lg font-mono border-primary/20 focus:border-primary"
                  placeholder="Barkod okutun veya arayın..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleBarcodeScan();
                  }}
                  autoFocus
                />
              </div>
              <Button
                className="h-12 px-5 gap-2 shadow-sm"
                onClick={handleBarcodeScan}
              >
                <Plus className="h-4 w-4" />
                Ekle
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10 h-9 text-sm bg-background/50"
                placeholder="Ürün filtrele..."
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
            {pagedProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Package className="h-12 w-12 mb-2 opacity-30" />
                <p className="text-sm">Ürün bulunamadı</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2">
                {pagedProducts.map((product) => {
                  const inCart = cart.find(
                    (i) => i.productId === product.id
                  );
                  return (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className={`relative flex flex-col items-center gap-1 rounded-xl border p-2.5 transition-all active:scale-[0.97] hover:shadow-md touch-manipulation ${
                        inCart
                          ? "border-primary/50 bg-primary/5 shadow-sm"
                          : "bg-card hover:border-primary/30"
                      }`}
                    >
                      {/* Cart quantity badge */}
                      {inCart && (
                        <div className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-sm">
                          {inCart.quantity}
                        </div>
                      )}
                      <div className="w-full aspect-[4/3] rounded-lg bg-muted/40 flex items-center justify-center overflow-hidden">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover rounded-lg"
                            loading="lazy"
                          />
                        ) : (
                          <Package className="h-7 w-7 text-muted-foreground/30" />
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-center line-clamp-2 leading-tight mt-0.5">
                        {product.name}
                      </span>
                      <span className="text-xs font-bold text-primary">
                        ₺{fmt(Number(product.price))}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-3 pb-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }).map(
                    (_, i) => {
                      const pageNum =
                        totalPages <= 5
                          ? i
                          : Math.max(
                              0,
                              Math.min(page - 2, totalPages - 5)
                            ) + i;
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? "default" : "ghost"}
                          size="icon"
                          className="h-8 w-8 text-xs"
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum + 1}
                        </Button>
                      );
                    }
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
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
        <div className="w-[400px] lg:w-[440px] flex flex-col border-l bg-card shrink-0">
          {/* Loyalty customer bar */}
          <div className="px-3 py-2 border-b bg-card/50 shrink-0">
            {loyaltyCustomer ? (
              <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-2">
                <Heart className="h-4 w-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{loyaltyCustomer.full_name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{loyaltyCustomer.phone}</span>
                    <div className="flex items-center gap-0.5 text-amber-500">
                      <Star className="h-3 w-3 fill-amber-500" />
                      <span className="text-xs font-bold">{loyaltyCustomer.total_points}</span>
                    </div>
                  </div>
                </div>
                {loyaltyCustomer.total_points > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1 shrink-0"
                    onClick={handleStartRedeem}
                    disabled={sendOtp.isPending}
                  >
                    <Star className="h-3 w-3" />
                    Puan Kullan
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => { setLoyaltyCustomer(null); setLoyaltySearch(""); }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  className="pl-8 h-8 text-xs"
                  placeholder="Sadakat müşterisi ara (telefon/isim)..."
                  value={loyaltySearch}
                  onChange={(e) => {
                    setLoyaltySearch(e.target.value);
                    setLoyaltySearchOpen(e.target.value.length >= 2);
                  }}
                  onFocus={() => loyaltySearch.length >= 2 && setLoyaltySearchOpen(true)}
                />
                {loyaltySearchOpen && loyaltySearchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border bg-popover shadow-lg max-h-40 overflow-y-auto">
                    {loyaltySearchResults.map((c) => (
                      <button
                        key={c.id}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                        onClick={() => {
                          setLoyaltyCustomer(c);
                          setLoyaltySearch("");
                          setLoyaltySearchOpen(false);
                        }}
                      >
                        <Heart className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="truncate">{c.full_name}</span>
                        <span className="text-xs text-muted-foreground ml-auto">{c.phone}</span>
                        <span className="text-xs font-bold text-amber-500">{c.total_points}p</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cart header */}
          <div className="px-4 py-2.5 border-b shrink-0 flex items-center justify-between bg-card">
            <div className="flex items-center gap-2">
              <ReceiptText className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">Satış Fişi</span>
              {cart.length > 0 && (
                <Badge className="text-[10px] h-5 bg-primary/10 text-primary border-0">
                  {totalItemCount} ürün
                </Badge>
              )}
            </div>
            <div className="flex gap-1">
              {cart.length > 0 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 gap-1"
                    onClick={() => {
                      setDiscountModal({ type: "cart" });
                      setDiscountMode("percent");
                      setDiscountValue("");
                    }}
                  >
                    <Percent className="h-3 w-3" />
                    İndirim
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive text-xs h-7"
                    onClick={() => setCart([])}
                  >
                    Temizle
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Cart items */}
          <ScrollArea className="flex-1">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                  <ShoppingCart className="h-7 w-7 opacity-40" />
                </div>
                <p className="text-sm font-medium">Sepet Boş</p>
                <p className="text-xs mt-1 text-muted-foreground/70">
                  Barkod okutun veya ürün seçin
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-1.5">
                {cart.map((item, idx) => (
                  <div
                    key={item.productId}
                    className="rounded-xl border bg-background/60 p-2.5 space-y-1.5"
                  >
                    {/* Top row: product info */}
                    <div className="flex items-start gap-2.5">
                      {/* Thumbnail */}
                      <div className="h-11 w-11 rounded-lg bg-muted/40 flex items-center justify-center overflow-hidden shrink-0">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="h-full w-full object-cover rounded-lg"
                          />
                        ) : (
                          <Package className="h-4 w-4 text-muted-foreground/30" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          ₺{fmt(item.unitPrice)} × {item.quantity}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold">₺{fmt(item.total)}</p>
                        {(item.discount > 0 || item.manualDiscount > 0) && (
                          <p className="text-[10px] line-through text-muted-foreground">
                            ₺{fmt(item.unitPrice * item.quantity)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Campaign & discount badges */}
                    {(item.campaignName || item.discount > 0 || item.manualDiscount > 0) && (
                      <div className="flex flex-wrap items-center gap-1">
                        {item.campaignName && (
                          <Badge
                            variant="outline"
                            className="text-[10px] h-5 gap-0.5 bg-success/5 text-success border-success/20 font-normal"
                          >
                            <Sparkles className="h-2.5 w-2.5" />
                            {item.campaignName}
                          </Badge>
                        )}
                        {item.discount > 0 && (
                          <Badge
                            variant="outline"
                            className="text-[10px] h-5 bg-success/5 text-success border-success/20 font-medium"
                          >
                            -₺{fmt(item.discount)}
                          </Badge>
                        )}
                        {item.manualDiscount > 0 && (
                          <Badge
                            variant="outline"
                            className="text-[10px] h-5 bg-info/5 text-info border-info/20 font-medium"
                          >
                            Anlık -₺{fmt(item.manualDiscount)}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Bottom row: qty controls + actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-0.5">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-lg touch-manipulation"
                          onClick={() => updateQuantity(item.productId, -1)}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <div className="w-10 h-8 flex items-center justify-center rounded-lg bg-muted/50 text-sm font-bold">
                          {item.quantity}
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-lg touch-manipulation"
                          onClick={() => updateQuantity(item.productId, 1)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Anlık İndirim"
                          onClick={() => {
                            setDiscountModal({
                              type: "item",
                              productId: item.productId,
                            });
                            setDiscountMode("amount");
                            setDiscountValue("");
                          }}
                        >
                          <BadgeDollarSign className="h-3.5 w-3.5 text-info" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => removeFromCart(item.productId)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive/70" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Payment Summary */}
          <div className="border-t p-4 space-y-3 shrink-0 bg-gradient-to-t from-card to-card/95">
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ara Toplam</span>
                <span className="font-medium">₺{fmt(subtotal)}</span>
              </div>
              {campaignDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-success flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Kampanya
                  </span>
                  <span className="text-success font-semibold">
                    -₺{fmt(campaignDiscount)}
                  </span>
                </div>
              )}
              {manualDiscountTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-info flex items-center gap-1">
                    <BadgeDollarSign className="h-3 w-3" />
                    Anlık İndirim
                  </span>
                  <span className="text-info font-semibold">
                    -₺{fmt(manualDiscountTotal)}
                  </span>
                </div>
              )}
              {/* Loyalty points earned preview */}
              {loyaltyCustomer && earnedPointsInfo && earnedPointsInfo.totalPoints > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1" style={{ color: "hsl(var(--primary))" }}>
                    <Star className="h-3 w-3" />
                    Kazanılacak Puan
                  </span>
                  <span className="font-semibold" style={{ color: "hsl(var(--primary))" }}>
                    +{earnedPointsInfo.totalPoints}
                  </span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between items-baseline">
                <span className="font-bold">TOPLAM</span>
                <span className="text-3xl font-black text-primary tracking-tight">
                  ₺{fmt(grandTotal)}
                </span>
              </div>
            </div>

            {/* Payment buttons */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                className="h-14 flex-col gap-0.5 touch-manipulation shadow-sm"
                disabled={cart.length === 0 || completeSale.isPending}
                onClick={() => handlePayment("cash")}
              >
                <Banknote className="h-5 w-5" />
                <span className="text-[11px]">Nakit</span>
              </Button>
              <Button
                variant="outline"
                className="h-14 flex-col gap-0.5 touch-manipulation"
                disabled={cart.length === 0 || completeSale.isPending}
                onClick={() => handlePayment("card")}
              >
                <CreditCard className="h-5 w-5" />
                <span className="text-[11px]">Kart</span>
              </Button>
              <Button
                variant="outline"
                className="h-14 flex-col gap-0.5 touch-manipulation"
                disabled={cart.length === 0 || completeSale.isPending}
                onClick={() => {
                  setSplitCash(String(Math.round(grandTotal / 2 * 100) / 100));
                  setSplitCard(
                    String(
                      Math.round((grandTotal - grandTotal / 2) * 100) / 100
                    )
                  );
                  setSplitModal(true);
                }}
              >
                <SplitSquareHorizontal className="h-5 w-5" />
                <span className="text-[11px]">Parçalı</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Discount Modal */}
      <Dialog
        open={!!discountModal}
        onOpenChange={() => setDiscountModal(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BadgeDollarSign className="h-5 w-5 text-info" />
              {discountModal?.type === "cart"
                ? "Sepet İndirimi"
                : "Ürün İndirimi"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={discountMode === "amount" ? "default" : "outline"}
                className="h-12 gap-2"
                onClick={() => setDiscountMode("amount")}
              >
                <BadgeDollarSign className="h-4 w-4" />
                Tutar (₺)
              </Button>
              <Button
                variant={discountMode === "percent" ? "default" : "outline"}
                className="h-12 gap-2"
                onClick={() => setDiscountMode("percent")}
              >
                <Percent className="h-4 w-4" />
                Yüzde (%)
              </Button>
            </div>
            <div>
              <Label className="text-sm">
                {discountMode === "amount"
                  ? "İndirim Tutarı (₺)"
                  : "İndirim Yüzdesi (%)"}
              </Label>
              <Input
                type="number"
                className="mt-1.5 h-12 text-xl font-bold text-center"
                placeholder={discountMode === "amount" ? "0.00" : "0"}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                min={0}
                max={discountMode === "percent" ? 100 : undefined}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDiscountModal(null)}
            >
              İptal
            </Button>
            <Button onClick={applyDiscount} disabled={!discountValue}>
              İndirimi Uygula
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Split Payment Modal */}
      <Dialog open={splitModal} onOpenChange={setSplitModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SplitSquareHorizontal className="h-5 w-5 text-primary" />
              Parçalı Ödeme
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <p className="text-xs text-muted-foreground">Toplam Tutar</p>
              <p className="text-2xl font-black text-primary">
                ₺{fmt(grandTotal)}
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="flex items-center gap-2 text-sm">
                  <Banknote className="h-4 w-4" /> Nakit
                </Label>
                <Input
                  type="number"
                  className="mt-1.5 h-11 text-lg font-bold"
                  value={splitCash}
                  onChange={(e) => {
                    setSplitCash(e.target.value);
                    const cash = parseFloat(e.target.value) || 0;
                    setSplitCard(
                      String(
                        Math.round((grandTotal - cash) * 100) / 100
                      )
                    );
                  }}
                  min={0}
                />
              </div>
              <div>
                <Label className="flex items-center gap-2 text-sm">
                  <CreditCard className="h-4 w-4" /> Kart
                </Label>
                <Input
                  type="number"
                  className="mt-1.5 h-11 text-lg font-bold"
                  value={splitCard}
                  onChange={(e) => {
                    setSplitCard(e.target.value);
                    const card = parseFloat(e.target.value) || 0;
                    setSplitCash(
                      String(
                        Math.round((grandTotal - card) * 100) / 100
                      )
                    );
                  }}
                  min={0}
                />
              </div>
            </div>
            {Math.abs(
              (parseFloat(splitCash) || 0) +
                (parseFloat(splitCard) || 0) -
                grandTotal
            ) > 0.01 && (
              <p className="text-xs text-destructive text-center">
                Toplam tutarla eşleşmiyor!
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSplitModal(false)}>
              İptal
            </Button>
            <Button
              onClick={handleSplitPayment}
              disabled={
                Math.abs(
                  (parseFloat(splitCash) || 0) +
                    (parseFloat(splitCard) || 0) -
                    grandTotal
                ) > 0.01 || completeSale.isPending
              }
            >
              Ödemeyi Tamamla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* OTP Modal for Point Redemption */}
      <Dialog open={otpModal} onOpenChange={setOtpModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Puan Harcama - OTP Doğrulama
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <p className="text-xs text-muted-foreground">Müşteri</p>
              <p className="font-semibold">{loyaltyCustomer?.full_name}</p>
              <div className="flex items-center justify-center gap-1 mt-1 text-amber-500">
                <Star className="h-4 w-4 fill-amber-500" />
                <span className="font-bold">{loyaltyCustomer?.total_points} Puan</span>
              </div>
            </div>

            <div>
              <Label>Harcanacak Puan</Label>
              <Input
                type="number"
                className="mt-1.5 h-11 text-lg font-bold text-center"
                value={pointsToRedeem}
                onChange={(e) => setPointsToRedeem(e.target.value)}
                max={loyaltyCustomer?.total_points || 0}
                min={1}
                placeholder="0"
              />
              {pointsToRedeem && parseInt(pointsToRedeem) > 0 && (
                <p className="text-xs text-muted-foreground text-center mt-1">
                  = ₺{fmt(parseInt(pointsToRedeem) / POINTS_PER_TL_REDEEM)} indirim
                </p>
              )}
            </div>

            <div>
              <Label>SMS ile gelen 6 haneli kod</Label>
              <Input
                className="mt-1.5 h-12 text-xl font-bold text-center tracking-[0.5em] font-mono"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                placeholder="••••••"
              />
              {otpDevCode && (
                <p className="text-xs text-muted-foreground text-center mt-1">
                  🧪 Test kodu: <span className="font-mono font-bold">{otpDevCode}</span>
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOtpModal(false)}>
              İptal
            </Button>
            <Button
              onClick={handleVerifyAndRedeem}
              disabled={
                otpCode.length !== 6 ||
                !pointsToRedeem ||
                parseInt(pointsToRedeem) <= 0 ||
                parseInt(pointsToRedeem) > (loyaltyCustomer?.total_points || 0) ||
                verifyOtp.isPending
              }
            >
              Doğrula ve Harca
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success overlay */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300">
            <div className="h-24 w-24 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-14 w-14 text-success" />
            </div>
            <span className="text-2xl font-bold">Satış Tamamlandı!</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashRegisterPage;
