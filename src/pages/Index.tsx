import { useState } from "react";
import { Layout } from "@/components/Layout";
import {
  Package, Tags, TrendingUp, ShoppingCart, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Heart, ChevronDown, ChevronUp,
  CreditCard, Banknote, Star, Loader2, ChevronLeft, ChevronRight,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  useDashboardStats, useRecentSales, useLowStockProducts, useSalesChart,
  type DashboardSale,
} from "@/hooks/useDashboard";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from "recharts";

const paymentIcons: Record<string, typeof CreditCard> = {
  cash: Banknote,
  card: CreditCard,
  points: Star,
};

const paymentLabels: Record<string, string> = {
  cash: "Nakit",
  card: "Kart",
  points: "Puan",
};

function SaleRow({ sale }: { sale: DashboardSale }) {
  const [open, setOpen] = useState(false);
  const PayIcon = paymentIcons[sale.payment_method] || ShoppingCart;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex w-full items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50 text-left">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <PayIcon className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold">#{sale.sale_number}</p>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {paymentLabels[sale.payment_method] || sale.payment_method}
                </Badge>
                {sale.loyalty_customers && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
                    <Heart className="h-2.5 w-2.5" />
                    {sale.loyalty_customers.full_name}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {sale.sale_items?.length || 0} kalem • {format(new Date(sale.created_at), "HH:mm", { locale: tr })}
                {sale.points_earned > 0 && (
                  <span className="text-success ml-2">+{sale.points_earned} puan</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right">
              <span className="text-sm font-bold">₺{Number(sale.total).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
              {sale.discount > 0 && (
                <p className="text-[10px] text-destructive">-₺{Number(sale.discount).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</p>
              )}
            </div>
            {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-12 mr-3 mb-2 mt-1 rounded-lg border bg-muted/30 divide-y">
          {sale.sale_items?.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-3 py-2">
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{item.product_name}</p>
                <p className="text-[10px] text-muted-foreground font-mono">{item.barcode}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-xs">
                <span className="text-muted-foreground">{item.quantity} × ₺{Number(item.unit_price).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                {item.campaign_name && (
                  <Badge variant="outline" className="text-[9px] px-1 py-0 border-primary/30 text-primary">
                    {item.campaign_name}
                  </Badge>
                )}
                <span className="font-semibold w-16 text-right">₺{Number(item.total).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          ))}
          {sale.loyalty_customers && (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
              <Heart className="h-3 w-3 text-primary" />
              <span>{sale.loyalty_customers.full_name} • {sale.loyalty_customers.phone}</span>
              {sale.points_redeemed > 0 && (
                <Badge variant="outline" className="text-[9px] border-destructive/30 text-destructive">
                  -{sale.points_redeemed} puan
                </Badge>
              )}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card p-3 shadow-md">
      <p className="text-xs font-semibold mb-1">{label}</p>
      <p className="text-sm text-primary font-bold">
        ₺{Number(payload[0]?.value || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
      </p>
      {payload[0]?.payload?.count !== undefined && (
        <p className="text-[10px] text-muted-foreground">{payload[0].payload.count} işlem</p>
      )}
    </div>
  );
};

const Dashboard = () => {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentSales, isLoading: salesLoading } = useRecentSales();
  const [lowStockPage, setLowStockPage] = useState(0);
  const { data: lowStock, isLoading: lowStockLoading } = useLowStockProducts(lowStockPage);
  const [chartPeriod, setChartPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const { data: chartData, isLoading: chartLoading } = useSalesChart(chartPeriod);

  const statCards = [
    {
      title: "Günlük Satış",
      value: statsLoading ? "..." : `₺${(stats?.dailySales || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`,
      change: statsLoading ? "" : `${Number(stats?.dailySalesChange) >= 0 ? "+" : ""}${stats?.dailySalesChange}%`,
      subtext: statsLoading ? "" : `${stats?.dailySalesCount} işlem`,
      trend: Number(stats?.dailySalesChange) >= 0 ? "up" as const : "down" as const,
      icon: ShoppingCart,
    },
    {
      title: "Toplam Ürün",
      value: statsLoading ? "..." : String(stats?.productCount || 0),
      change: "",
      trend: "up" as const,
      icon: Package,
    },
    {
      title: "Aktif Kampanya",
      value: statsLoading ? "..." : String(stats?.campaignCount || 0),
      change: "",
      trend: "up" as const,
      icon: Tags,
    },
    {
      title: "Sadakat Müşterileri",
      value: statsLoading ? "..." : String(stats?.customerCount || 0),
      change: statsLoading ? "" : `${(stats?.totalPoints || 0).toLocaleString("tr-TR")} puan`,
      trend: "up" as const,
      icon: Heart,
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Tekel bayi yönetim paneline hoş geldiniz</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title} className="stat-card">
              <CardContent className="p-0">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    {stat.change && (
                      <div className="flex items-center gap-1">
                        {stat.trend === "up" ? (
                          <ArrowUpRight className="h-3.5 w-3.5 text-success" />
                        ) : (
                          <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
                        )}
                        <span className={`text-xs font-medium ${stat.trend === "up" ? "text-success" : "text-destructive"}`}>
                          {stat.change}
                        </span>
                      </div>
                    )}
                    {(stat as any).subtext && (
                      <p className="text-[10px] text-muted-foreground">{(stat as any).subtext}</p>
                    )}
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sales Chart */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Satış Grafiği
              </CardTitle>
              <Tabs value={chartPeriod} onValueChange={(v) => setChartPeriod(v as any)}>
                <TabsList className="h-8">
                  <TabsTrigger value="daily" className="text-xs px-3 h-7">Günlük</TabsTrigger>
                  <TabsTrigger value="weekly" className="text-xs px-3 h-7">Haftalık</TabsTrigger>
                  <TabsTrigger value="monthly" className="text-xs px-3 h-7">Aylık</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !chartData?.length ? (
              <div className="flex flex-col items-center py-12 text-muted-foreground">
                <BarChart3 className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">Henüz satış verisi yok</p>
              </div>
            ) : (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(36, 80%, 50%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(36, 80%, 50%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="hsl(36, 80%, 50%)"
                      strokeWidth={2}
                      fill="url(#salesGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Two columns */}
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Recent Sales */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Son Satışlar
              </CardTitle>
            </CardHeader>
            <CardContent>
              {salesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !recentSales?.length ? (
                <div className="flex flex-col items-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-10 w-10 mb-2 opacity-30" />
                  <p className="text-sm">Henüz satış kaydı yok</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentSales.map((sale) => (
                    <SaleRow key={sale.id} sale={sale} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Alert */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Düşük Stok Uyarıları
                  {lowStock && lowStock.totalCount > 0 && (
                    <Badge variant="outline" className="badge-warning text-[10px] ml-1">
                      {lowStock.totalCount}
                    </Badge>
                  )}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {lowStockLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !lowStock?.items.length ? (
                <div className="flex flex-col items-center py-8 text-muted-foreground">
                  <Package className="h-10 w-10 mb-2 opacity-30" />
                  <p className="text-sm">Tüm ürünler yeterli stokta</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lowStock.items.map((item) => (
                    <div key={item.id} className="rounded-lg border border-warning/20 bg-warning/5 p-3">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{item.barcode}</p>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Kalan: <strong className="text-warning">{item.stock}</strong> / Min: {item.min_stock}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-warning transition-all" style={{ width: `${Math.min((item.stock / item.min_stock) * 100, 100)}%` }} />
                      </div>
                    </div>
                  ))}

                  {lowStock.totalPages > 1 && (
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-[10px] text-muted-foreground">
                        {lowStockPage * 5 + 1}-{Math.min((lowStockPage + 1) * 5, lowStock.totalCount)} / {lowStock.totalCount}
                      </p>
                      <div className="flex gap-1">
                        <Button variant="outline" size="icon" className="h-7 w-7" disabled={lowStockPage === 0} onClick={() => setLowStockPage((p) => p - 1)}>
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-7 w-7" disabled={lowStockPage >= lowStock.totalPages - 1} onClick={() => setLowStockPage((p) => p + 1)}>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
