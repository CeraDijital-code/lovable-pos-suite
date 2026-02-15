import { Layout } from "@/components/Layout";
import {
  Package,
  Tags,
  Wallet,
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  {
    title: "Günlük Satış",
    value: "₺12,450",
    change: "+12.5%",
    trend: "up" as const,
    icon: ShoppingCart,
  },
  {
    title: "Toplam Ürün",
    value: "1,284",
    change: "+23",
    trend: "up" as const,
    icon: Package,
  },
  {
    title: "Aktif Kampanya",
    value: "8",
    change: "+2",
    trend: "up" as const,
    icon: Tags,
  },
  {
    title: "Kasa Bakiyesi",
    value: "₺45,200",
    change: "-3.2%",
    trend: "down" as const,
    icon: Wallet,
  },
];

const recentSales = [
  { id: 1, product: "Efes Pilsen 500ml", qty: 3, total: "₺180", time: "14:32" },
  { id: 2, product: "Jack Daniel's 700ml", qty: 1, total: "₺850", time: "14:28" },
  { id: 3, product: "Marlboro Red", qty: 2, total: "₺120", time: "14:15" },
  { id: 4, product: "Chivas Regal 12", qty: 1, total: "₺1,200", time: "13:55" },
  { id: 5, product: "Tuborg Gold 330ml 6'lı", qty: 2, total: "₺360", time: "13:40" },
];

const lowStockItems = [
  { name: "Absolut Vodka 700ml", stock: 3, min: 10 },
  { name: "Parliament Aqua Blue", stock: 5, min: 20 },
  { name: "Red Bull 250ml", stock: 8, min: 24 },
];

const Dashboard = () => {
  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Tekel bayi yönetim paneline hoş geldiniz
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="stat-card">
              <CardContent className="p-0">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <div className="flex items-center gap-1">
                      {stat.trend === "up" ? (
                        <ArrowUpRight className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
                      )}
                      <span
                        className={`text-xs font-medium ${
                          stat.trend === "up"
                            ? "text-success"
                            : "text-destructive"
                        }`}
                      >
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

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
              <div className="space-y-3">
                {recentSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                        <ShoppingCart className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{sale.product}</p>
                        <p className="text-xs text-muted-foreground">
                          {sale.qty} adet • {sale.time}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold">{sale.total}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Alert */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Düşük Stok Uyarıları
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lowStockItems.map((item) => (
                  <div
                    key={item.name}
                    className="rounded-lg border border-warning/20 bg-warning/5 p-3"
                  >
                    <p className="text-sm font-medium">{item.name}</p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Kalan: <strong className="text-warning">{item.stock}</strong> / Min: {item.min}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-warning transition-all"
                        style={{
                          width: `${Math.min((item.stock / item.min) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
