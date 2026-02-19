import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
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
  Maximize,
  Minimize,
  Percent,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useThemeLogo } from "@/hooks/useThemeLogo";
import { useCampaigns, getCampaignDetails, getCampaignTypeIcon } from "@/hooks/useCampaigns";
import { getLocalDateString } from "@/hooks/useCampaigns";
import { useProducts } from "@/hooks/useProducts";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

// ── Types ──────────────────────────────────────────────
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

const emptyData: CustomerDisplayData = {
  cart: [],
  subtotal: 0,
  campaignDiscount: 0,
  manualDiscount: 0,
  totalDiscount: 0,
  grandTotal: 0,
  loyaltyCustomer: null,
  earnedPoints: null,
  lastAction: null,
};

const fmt = (n: number) =>
  n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── Sub-components ─────────────────────────────────────

const SuccessOverlay = ({
  earnedPoints,
  logoUrl,
  storeName,
}: {
  earnedPoints: number | null;
  logoUrl: string | undefined;
  storeName: string;
}) => (
  <div className="h-screen flex flex-col items-center justify-center bg-background">
    <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500">
      <div className="mx-auto h-28 w-28 rounded-full bg-success/20 flex items-center justify-center">
        <Sparkles className="h-14 w-14 text-success animate-pulse" />
      </div>
      <div>
        <h1 className="text-4xl font-bold text-foreground">Teşekkürler!</h1>
        <p className="text-xl text-muted-foreground mt-2">İyi günler dileriz</p>
      </div>
      {earnedPoints && earnedPoints > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-2xl px-8 py-4 inline-block">
          <div className="flex items-center gap-3">
            <Star className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold text-primary">
              +{earnedPoints} Puan Kazandınız!
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

// ── Main Component ─────────────────────────────────────

const CustomerDisplayPage = () => {
  const [data, setData] = useState<CustomerDisplayData>(emptyData);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { logoUrl, logoLightUrl, logoDarkUrl } = useThemeLogo();
  const { data: settings } = useStoreSettings();
  const { data: campaigns = [] } = useCampaigns();
  const { data: allProducts = [] } = useProducts();

  // Products with images for carousel
  const productsWithImages = useMemo(
    () => allProducts.filter((p) => p.is_active && p.image_url),
    [allProducts]
  );

  // Map product IDs to their active campaigns
  const productCampaignMap = useMemo(() => {
    const today = getLocalDateString();
    const map = new Map<string, { name: string; type: string; details: string }>();
    campaigns
      .filter((c) => c.is_active && c.start_date <= today && c.end_date >= today)
      .forEach((c) => {
        (c.campaign_products || [])
          .filter((cp) => cp.role === "source")
          .forEach((cp) => {
            map.set(cp.product_id, {
              name: c.name,
              type: c.type,
              details: getCampaignDetails(c),
            });
          });
      });
    return map;
  }, [campaigns]);

  // Active campaigns for sidebar
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

  // BroadcastChannel listener
  useEffect(() => {
    const channel = new BroadcastChannel("pos-customer-display");
    setIsConnected(true);

    channel.onmessage = (event) => {
      const msg = event.data;
      if (msg.type === "cart-update") {
        setData(msg.payload);
        setShowSuccess(false);
      } else if (msg.type === "sale-complete") {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setData(emptyData);
        }, 4000);
      }
    };

    return () => {
      channel.close();
      setIsConnected(false);
    };
  }, []);

  // Fullscreen API
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Auto-fullscreen on load (second monitor scenario)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!document.fullscreenElement) {
        containerRef.current?.requestFullscreen?.().catch(() => {});
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const storeName = settings?.store_name || "TekelPOS";
  const hasItems = data.cart.length > 0;
  const totalItems = data.cart.reduce((s, i) => s + i.quantity, 0);

  if (showSuccess) {
    return (
      <div ref={containerRef}>
        <SuccessOverlay
          earnedPoints={data.earnedPoints}
          logoUrl={logoUrl || undefined}
          storeName={storeName}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-screen flex flex-col bg-background overflow-hidden">
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

          <div className="flex items-center gap-4">
            {/* Connection status */}
            <div className="flex items-center gap-1.5">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-success" />
              ) : (
                <WifiOff className="h-4 w-4 text-destructive" />
              )}
              <span className="text-[10px] text-muted-foreground">
                {isConnected ? "Bağlı" : "Bağlantı Yok"}
              </span>
            </div>

            {/* Clock */}
            <div className="text-right">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-mono">
                  {currentTime.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {currentTime.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })}
              </span>
            </div>

            {/* Fullscreen toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="h-9 w-9 rounded-lg"
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Cart items or idle */}
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
                      <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          <Package className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>

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
            /* ── Idle State ── */
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="text-center space-y-6 w-full max-w-2xl">
                {logoUrl ? (
                  <img src={logoUrl} alt={storeName} className="h-24 mx-auto opacity-80" />
                ) : (
                  <div className="mx-auto h-24 w-24 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <ShoppingCart className="h-12 w-12 text-primary/60" />
                  </div>
                )}
                <div>
                  <h2 className="text-3xl font-bold text-foreground">{storeName}</h2>
                  <p className="text-lg text-muted-foreground mt-1">Hoş Geldiniz</p>
                </div>

                {/* Product carousel with campaign badges */}
                {productsWithImages.length > 0 && (
                  <div className="mt-8 w-full">
                    <Carousel
                      opts={{ loop: true, align: "center" }}
                      plugins={[Autoplay({ delay: 3500, stopOnInteraction: false })]}
                      className="w-full"
                    >
                      <CarouselContent>
                        {productsWithImages.map((product) => {
                          const campaign = productCampaignMap.get(product.id);
                          return (
                            <CarouselItem key={product.id} className="basis-full sm:basis-1/2 lg:basis-1/3">
                              <div className="p-2">
                                <div className="rounded-2xl overflow-hidden border bg-card shadow-sm relative group">
                                  {/* Campaign badge */}
                                  {campaign && (
                                    <div className="absolute top-2 left-2 z-10">
                                      <Badge className="bg-destructive text-destructive-foreground text-[10px] font-bold gap-1 shadow-lg">
                                        <Percent className="h-2.5 w-2.5" />
                                        {campaign.name}
                                      </Badge>
                                    </div>
                                  )}
                                  <div className="aspect-square relative overflow-hidden">
                                    <img
                                      src={product.image_url!}
                                      alt={product.name}
                                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                  </div>
                                  <div className="p-3 text-center space-y-1">
                                    <p className="font-semibold text-foreground text-sm truncate">{product.name}</p>
                                    <p className="text-primary font-bold text-lg">₺{fmt(product.price)}</p>
                                    {campaign && (
                                      <p className="text-[10px] text-muted-foreground">{campaign.details}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CarouselItem>
                          );
                        })}
                      </CarouselContent>
                    </Carousel>
                  </div>
                )}

                {/* Scrolling announcement bar for campaigns */}
                {activeCampaigns.length > 0 && (
                  <div className="mt-6 w-full overflow-hidden rounded-xl bg-primary/5 border border-primary/20 py-3">
                    <div className="flex animate-marquee whitespace-nowrap gap-12">
                      {[...activeCampaigns, ...activeCampaigns].map((c, i) => (
                        <span key={`${c.id}-${i}`} className="inline-flex items-center gap-2 text-sm text-primary font-medium">
                          <span className="text-base">{getCampaignTypeIcon(c.type)}</span>
                          <span>{c.name}</span>
                          <span className="text-muted-foreground">—</span>
                          <span className="text-xs text-muted-foreground">{getCampaignDetails(c)}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar: Active campaigns (shown when cart has items) */}
        {activeCampaigns.length > 0 && hasItems && (
          <div className="w-72 border-l bg-card/50 flex flex-col overflow-hidden shrink-0">
            <div className="px-4 py-3 border-b shrink-0">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-primary" />
                <span className="font-semibold text-foreground text-sm">Kampanyalar</span>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {activeCampaigns.map((c) => (
                  <div key={c.id} className="p-3 rounded-xl bg-background border border-primary/10 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getCampaignTypeIcon(c.type)}</span>
                      <span className="font-semibold text-xs text-foreground">{c.name}</span>
                    </div>
                    <p className="text-[10px] text-primary font-medium">{getCampaignDetails(c)}</p>
                    <div className="flex flex-wrap gap-1">
                      {(c.campaign_products || [])
                        .filter((cp) => cp.role === "source")
                        .slice(0, 3)
                        .map((cp) => (
                          <Badge key={cp.id} variant="secondary" className="text-[9px]">
                            {cp.products?.name || "Ürün"}
                          </Badge>
                        ))}
                      {(c.campaign_products || []).filter((cp) => cp.role === "source").length > 3 && (
                        <Badge variant="secondary" className="text-[9px]">
                          +{(c.campaign_products || []).filter((cp) => cp.role === "source").length - 3}
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
