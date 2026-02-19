import { useState, useEffect, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingCart,
  Tag,
  Star,
  Sparkles,
  Heart,
  Gift,
  Package,
  TrendingUp,
  Clock,
} from "lucide-react";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useCampaigns, getCampaignDetails, getCampaignTypeIcon } from "@/hooks/useCampaigns";
import { getLocalDateString } from "@/hooks/useCampaigns";
import { useProducts } from "@/hooks/useProducts";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

interface CustomerCartItem {
  productId: string;
  name: string;
  image_url?: string | null;
  unitPrice: number;
  quantity: number;
  discount: number;
  manualDiscount: number;
  campaignName?: string | null;
  total: number;
}

interface CustomerDisplayData {
  cart: CustomerCartItem[];
  subtotal: number;
  campaignDiscount: number;
  manualDiscount: number;
  totalDiscount: number;
  grandTotal: number;
  loyaltyCustomer: {
    full_name: string;
    total_points: number;
  } | null;
  earnedPoints: number | null;
  lastAction: string | null;
}

const fmt = (n: number) =>
  n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CustomerDisplayPage = () => {
  const [data, setData] = useState<CustomerDisplayData>({
    cart: [],
    subtotal: 0,
    campaignDiscount: 0,
    manualDiscount: 0,
    totalDiscount: 0,
    grandTotal: 0,
    loyaltyCustomer: null,
    earnedPoints: null,
    lastAction: null,
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const { data: settings } = useStoreSettings();
  const { data: campaigns = [] } = useCampaigns();
  const { data: allProducts = [] } = useProducts();

  // Products with images for carousel
  const productsWithImages = useMemo(
    () => allProducts.filter((p) => p.is_active && p.image_url),
    [allProducts]
  );

  // Active campaigns for display
  const activeCampaigns = useMemo(() => {
    const today = getLocalDateString();
    return campaigns.filter(
      (c) => c.is_active && c.start_date <= today && c.end_date >= today
    );
  }, [campaigns]);

  // Clock
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Listen for cart updates from CashRegisterPage via BroadcastChannel
  useEffect(() => {
    const channel = new BroadcastChannel("pos-customer-display");
    channel.onmessage = (event) => {
      const msg = event.data;
      if (msg.type === "cart-update") {
        setData(msg.payload);
        setShowSuccess(false);
      } else if (msg.type === "sale-complete") {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setData({
            cart: [],
            subtotal: 0,
            campaignDiscount: 0,
            manualDiscount: 0,
            totalDiscount: 0,
            grandTotal: 0,
            loyaltyCustomer: null,
            earnedPoints: null,
            lastAction: null,
          });
        }, 4000);
      }
    };
    return () => channel.close();
  }, []);

  const logoUrl = settings?.logo_dark_url || settings?.logo_light_url;
  const storeName = settings?.store_name || "TekelPOS";
  const hasItems = data.cart.length > 0;
  const totalItems = data.cart.reduce((s, i) => s + i.quantity, 0);

  // Success animation overlay
  if (showSuccess) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background">
        <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="mx-auto h-28 w-28 rounded-full bg-success/20 flex items-center justify-center">
            <Sparkles className="h-14 w-14 text-success animate-pulse" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground">Teşekkürler!</h1>
            <p className="text-xl text-muted-foreground mt-2">
              İyi günler dileriz
            </p>
          </div>
          {data.earnedPoints && data.earnedPoints > 0 && (
            <div className="bg-primary/10 border border-primary/20 rounded-2xl px-8 py-4 inline-block">
              <div className="flex items-center gap-3">
                <Star className="h-6 w-6 text-primary" />
                <span className="text-lg font-semibold text-primary">
                  +{data.earnedPoints} Puan Kazandınız!
                </span>
              </div>
            </div>
          )}
          {logoUrl && (
            <img src={logoUrl} alt={storeName} className="h-12 mx-auto opacity-60 mt-8" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b bg-card/95 backdrop-blur px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <img src={logoUrl} alt={storeName} className="h-10 object-contain" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <ShoppingCart className="h-5 w-5 text-primary-foreground" />
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-foreground">{storeName}</h1>
              <p className="text-xs text-muted-foreground">Hoş Geldiniz</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-mono">
                {currentTime.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {currentTime.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Cart items */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {hasItems ? (
            <>
              {/* Cart header */}
              <div className="px-6 py-3 bg-card/30 border-b shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-foreground">Sepetiniz</span>
                  </div>
                  <Badge variant="secondary" className="text-sm">
                    {totalItems} ürün
                  </Badge>
                </div>
              </div>

              {/* Items list */}
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-2">
                  {data.cart.map((item, idx) => (
                    <div
                      key={`${item.productId}-${idx}`}
                      className="flex items-center gap-4 p-4 rounded-xl bg-card border transition-all duration-300 animate-in slide-in-from-left"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      {/* Product image or icon */}
                      <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          <Package className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>

                      {/* Product info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate text-base">{item.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-muted-foreground">
                            {item.quantity} × ₺{fmt(item.unitPrice)}
                          </span>
                          {item.campaignName && (
                            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary gap-1">
                              <Tag className="h-2.5 w-2.5" />
                              {item.campaignName}
                            </Badge>
                          )}
                        </div>
                        {(item.discount > 0 || item.manualDiscount > 0) && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-xs text-destructive font-medium">
                              -₺{fmt(item.discount + item.manualDiscount)} indirim
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Total */}
                      <div className="text-right shrink-0">
                        <span className="text-lg font-bold text-foreground">₺{fmt(item.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Totals */}
              <div className="shrink-0 border-t bg-card/95 backdrop-blur p-5 space-y-3">
                {data.totalDiscount > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Ara Toplam</span>
                      <span>₺{fmt(data.subtotal)}</span>
                    </div>
                    {data.campaignDiscount > 0 && (
                      <div className="flex justify-between text-sm text-primary">
                        <span className="flex items-center gap-1.5">
                          <Tag className="h-3.5 w-3.5" /> Kampanya İndirimi
                        </span>
                        <span>-₺{fmt(data.campaignDiscount)}</span>
                      </div>
                    )}
                    {data.manualDiscount > 0 && (
                      <div className="flex justify-between text-sm text-destructive">
                        <span>Ek İndirim</span>
                        <span>-₺{fmt(data.manualDiscount)}</span>
                      </div>
                    )}
                    <Separator />
                  </>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-foreground">TOPLAM</span>
                  <span className="text-3xl font-black text-primary">
                    ₺{fmt(data.grandTotal)}
                  </span>
                </div>

                {/* Loyalty info */}
                {data.loyaltyCustomer && (
                  <div className="mt-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Heart className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-semibold text-foreground text-sm">
                            {data.loyaltyCustomer.full_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Mevcut Puan: <span className="font-semibold text-primary">{data.loyaltyCustomer.total_points}</span>
                          </p>
                        </div>
                      </div>
                      {data.earnedPoints && data.earnedPoints > 0 && (
                        <div className="flex items-center gap-1.5 bg-success/10 text-success px-3 py-1.5 rounded-lg">
                          <TrendingUp className="h-4 w-4" />
                          <span className="font-bold text-sm">+{data.earnedPoints} puan</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Empty state with product carousel */
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="text-center space-y-6 max-w-lg w-full">
                {logoUrl ? (
                  <img src={logoUrl} alt={storeName} className="h-20 mx-auto opacity-80" />
                ) : (
                  <div className="mx-auto h-24 w-24 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <ShoppingCart className="h-12 w-12 text-primary/60" />
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{storeName}</h2>
                  <p className="text-muted-foreground mt-2">
                    Hoş Geldiniz
                  </p>
                </div>

                {/* Product image carousel */}
                {productsWithImages.length > 0 && (
                  <div className="mt-8 w-full">
                    <Carousel
                      opts={{ loop: true, align: "center" }}
                      plugins={[Autoplay({ delay: 3500, stopOnInteraction: false })]}
                      className="w-full"
                    >
                      <CarouselContent>
                        {productsWithImages.map((product) => (
                          <CarouselItem key={product.id} className="basis-full md:basis-1/2 lg:basis-1/3">
                            <div className="p-2">
                              <div className="rounded-2xl overflow-hidden border bg-card shadow-sm">
                                <div className="aspect-square relative">
                                  <img
                                    src={product.image_url!}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="p-3 text-center">
                                  <p className="font-semibold text-foreground text-sm truncate">{product.name}</p>
                                  <p className="text-primary font-bold text-lg mt-1">₺{fmt(product.price)}</p>
                                </div>
                              </div>
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                    </Carousel>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar: Active campaigns */}
        {activeCampaigns.length > 0 && !hasItems && (
          <div className="w-80 border-l bg-card/50 flex flex-col overflow-hidden shrink-0">
            <div className="px-5 py-4 border-b shrink-0">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">Aktif Kampanyalar</span>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {activeCampaigns.map((c) => (
                  <div key={c.id} className="p-4 rounded-xl bg-background border border-primary/10 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getCampaignTypeIcon(c.type)}</span>
                      <span className="font-semibold text-sm text-foreground">{c.name}</span>
                    </div>
                    <p className="text-xs text-primary font-medium">
                      {getCampaignDetails(c)}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(c.campaign_products || [])
                        .filter((cp) => cp.role === "source")
                        .slice(0, 3)
                        .map((cp) => (
                          <Badge key={cp.id} variant="secondary" className="text-[10px]">
                            {cp.products?.name || "Ürün"}
                          </Badge>
                        ))}
                      {(c.campaign_products || []).filter((cp) => cp.role === "source").length > 3 && (
                        <Badge variant="secondary" className="text-[10px]">
                          +{(c.campaign_products || []).filter((cp) => cp.role === "source").length - 3} ürün
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDisplayPage;
