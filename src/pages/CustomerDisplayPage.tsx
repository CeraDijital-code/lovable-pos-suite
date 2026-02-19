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
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import TypewriterQuotes from "@/components/customer-display/TypewriterQuotes";
import SnowEffect from "@/components/customer-display/SnowEffect";

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

interface SaleCompleteData {
  earnedPoints: number;
  totalDiscount: number;
  grandTotal: number;
  totalItems: number;
  loyaltyCustomerName: string | null;
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

const fmt = (n: number) => n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── Sub-components ─────────────────────────────────────

const ConfettiEffect = () => {
  const confetti = useMemo(() => {
    return Array.from({ length: 80 }, (_, i) => {
      const colors = [
        "hsl(var(--primary))",
        "hsl(var(--success))",
        "hsl(var(--warning))",
        "hsl(var(--destructive))",
        "#FFD700",
        "#FF69B4",
        "#00CED1",
      ];
      return {
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 2}s`,
        duration: `${2 + Math.random() * 3}s`,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 8,
        rotation: Math.random() * 360,
        drift: (Math.random() - 0.5) * 200,
      };
    });
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-20px) translateX(0px) rotate(0deg) scale(1); opacity: 1; }
          50% { opacity: 1; }
          100% { transform: translateY(100vh) translateX(var(--drift)) rotate(720deg) scale(0.3); opacity: 0; }
        }
        @keyframes success-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 hsl(var(--success) / 0.4); }
          50% { transform: scale(1.05); box-shadow: 0 0 40px 20px hsl(var(--success) / 0); }
        }
        @keyframes float-up {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes star-burst {
          0% { transform: scale(0) rotate(0deg); opacity: 0; }
          50% { transform: scale(1.3) rotate(180deg); opacity: 1; }
          100% { transform: scale(1) rotate(360deg); opacity: 1; }
        }
      `}</style>
      {confetti.map((c) => (
        <div
          key={c.id}
          className="absolute top-0 rounded-sm"
          style={{
            left: c.left,
            width: c.size,
            height: c.size * 0.6,
            backgroundColor: c.color,
            animation: `confetti-fall ${c.duration} ${c.delay} ease-in forwards`,
            ["--drift" as string]: `${c.drift}px`,
            transform: `rotate(${c.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
};

const SuccessOverlay = ({
  saleData,
  logoUrl,
  storeName,
}: {
  saleData: SaleCompleteData | null;
  logoUrl: string | undefined;
  storeName: string;
}) => (
  <div className="h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
    <ConfettiEffect />
    <SnowEffect />

    {/* Radial glow background */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--success)/0.08)_0%,transparent_70%)]" />

    <div className="relative z-10 text-center space-y-8 px-8">
      {/* Animated success icon */}
      <div
        className="mx-auto h-32 w-32 rounded-full bg-success/20 border-2 border-success/40 flex items-center justify-center"
        style={{ animation: "success-pulse 2s infinite, star-burst 0.6s ease-out" }}
      >
        <Sparkles className="h-16 w-16 text-success" />
      </div>

      {/* Thank you text with shimmer */}
      <div style={{ animation: "float-up 0.5s ease-out 0.2s both" }}>
        <h1
          className="text-5xl font-black text-foreground"
          style={{
            background: "linear-gradient(90deg, hsl(var(--foreground)), hsl(var(--primary)), hsl(var(--foreground)))",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "shimmer 3s linear infinite",
          }}
        >
          Teşekkürler!
        </h1>
        <p className="text-xl text-muted-foreground mt-3">Alışverişiniz tamamlandı, iyi günler dileriz ✨</p>
      </div>

      {/* Transaction summary cards */}
      {saleData && (
        <div
          className="flex flex-wrap items-center justify-center gap-4 mt-6"
          style={{ animation: "float-up 0.5s ease-out 0.4s both" }}
        >
          {/* Total */}
          <div className="bg-card/80 backdrop-blur border rounded-2xl px-6 py-4 min-w-[140px]">
            <div className="flex items-center gap-2 justify-center mb-1">
              <ShoppingCart className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Toplam</span>
            </div>
            <span className="text-2xl font-black text-primary">₺{fmt(saleData.grandTotal)}</span>
          </div>

          {/* Discount */}
          {saleData.totalDiscount > 0 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-2xl px-6 py-4 min-w-[140px]">
              <div className="flex items-center gap-2 justify-center mb-1">
                <Tag className="h-4 w-4 text-destructive" />
                <span className="text-xs text-destructive/80">Kazancınız</span>
              </div>
              <span className="text-2xl font-black text-destructive">₺{fmt(saleData.totalDiscount)}</span>
            </div>
          )}

          {/* Points earned */}
          {saleData.earnedPoints > 0 && (
            <div className="bg-primary/10 border border-primary/20 rounded-2xl px-6 py-4 min-w-[140px]">
              <div className="flex items-center gap-2 justify-center mb-1">
                <Star className="h-4 w-4 text-primary" />
                <span className="text-xs text-primary/80">Kazanılan Puan</span>
              </div>
              <span className="text-2xl font-black text-primary">+{saleData.earnedPoints}</span>
            </div>
          )}
        </div>
      )}

      {/* Loyalty customer greeting */}
      {saleData?.loyaltyCustomerName && (
        <div
          className="flex items-center gap-3 justify-center bg-primary/5 border border-primary/20 rounded-xl px-6 py-3"
          style={{ animation: "float-up 0.5s ease-out 0.6s both" }}
        >
          <Heart className="h-5 w-5 text-primary animate-pulse" />
          <span className="text-base font-semibold text-foreground">
            Tekrar bekleriz, <span className="text-primary">{saleData.loyaltyCustomerName}</span>!
          </span>
        </div>
      )}

      {/* Logo */}
      {logoUrl && (
        <div style={{ animation: "float-up 0.5s ease-out 0.8s both" }}>
          <img src={logoUrl} alt={storeName} className="h-14 mx-auto opacity-50 mt-4" />
        </div>
      )}
    </div>
  </div>
);

// ── Main Component ─────────────────────────────────────

const CustomerDisplayPage = () => {
  const [data, setData] = useState<CustomerDisplayData>(emptyData);
  const [showSuccess, setShowSuccess] = useState(false);
  const [saleCompleteData, setSaleCompleteData] = useState<SaleCompleteData | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { logoUrl, logoLightUrl, logoDarkUrl } = useThemeLogo();
  const { data: settings } = useStoreSettings();
  const { data: campaigns = [] } = useCampaigns();
  const { data: allProducts = [] } = useProducts();

  // Products selected for carousel
  const productsWithImages = useMemo(() => allProducts.filter((p) => p.is_active && p.image_url && (p as any).show_in_carousel), [allProducts]);

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
    return campaigns.filter((c) => c.is_active && c.start_date <= today && c.end_date >= today);
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
        // Ignore cart updates while showing success screen
        if (!showSuccess) {
          setData(msg.payload);
        }
      } else if (msg.type === "sale-complete") {
        setSaleCompleteData(msg.payload || null);
        setShowSuccess(true);
        if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
        successTimeoutRef.current = setTimeout(() => {
          setShowSuccess(false);
          setSaleCompleteData(null);
          setData(emptyData);
        }, 6000);
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
        <SuccessOverlay saleData={saleCompleteData} logoUrl={logoUrl || undefined} storeName={storeName} />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-screen flex flex-col bg-background overflow-hidden relative">
      <SnowEffect />
      {/* Header */}
      <div className="shrink-0 border-b bg-card/95 backdrop-blur px-6 py-3 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <img src={logoUrl} alt={storeName} className="h-24 object-contain" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                <ShoppingCart className="h-6 w-6 text-primary-foreground" />
              </div>
            )}
          </div>

          <TypewriterQuotes />

          <div className="flex items-center gap-4">
            {/* Connection status */}
            <div className="flex items-center gap-1.5">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-success" />
              ) : (
                <WifiOff className="h-4 w-4 text-destructive" />
              )}
              <span className="text-[10px] text-muted-foreground">{isConnected ? "Bağlı" : "Bağlantı Yok"}</span>
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
            <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="h-9 w-9 rounded-lg">
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative z-10">
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
                        </div>
                        {item.campaignName && (
                          <div className="mt-1.5 flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-lg px-2.5 py-1">
                            <Sparkles className="h-3.5 w-3.5 text-destructive shrink-0 animate-pulse" />
                            <span className="text-xs font-bold text-destructive truncate">{item.campaignName}</span>
                          </div>
                        )}
                        {(item.discount > 0 || item.manualDiscount > 0) && (
                          <div className="mt-1 flex items-center gap-1.5 text-destructive">
                            <Percent className="h-3 w-3" />
                            <span className="text-sm font-bold">
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
                  <span className="text-3xl font-black text-primary">₺{fmt(data.grandTotal)}</span>
                </div>

                {/* Loyalty info */}
                {data.loyaltyCustomer && (
                  <div className="mt-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Heart className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-semibold text-foreground text-sm">{data.loyaltyCustomer.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Mevcut Puan:{" "}
                            <span className="font-semibold text-primary">{data.loyaltyCustomer.total_points}</span>
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
                  <img src={logoUrl} alt={storeName} className="h-36 mx-auto opacity-90" />
                ) : (
                  <div className="mx-auto h-28 w-28 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <ShoppingCart className="h-14 w-14 text-primary/60" />
                  </div>
                )}

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
                        <span
                          key={`${c.id}-${i}`}
                          className="inline-flex items-center gap-2 text-sm text-primary font-medium"
                        >
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
