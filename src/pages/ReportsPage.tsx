import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Calendar, DollarSign } from "lucide-react";

const ReportsPage = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Raporlar</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Satış ve stok raporlarını inceleyin
          </p>
        </div>

        <Tabs defaultValue="daily" className="space-y-4">
          <TabsList>
            <TabsTrigger value="daily">Günlük</TabsTrigger>
            <TabsTrigger value="weekly">Haftalık</TabsTrigger>
            <TabsTrigger value="monthly">Aylık</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="stat-card">
                <CardContent className="p-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Günlük Ciro</p>
                      <p className="text-xl font-bold">₺12,450</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="stat-card">
                <CardContent className="p-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                      <TrendingUp className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">İşlem Sayısı</p>
                      <p className="text-xl font-bold">47</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="stat-card">
                <CardContent className="p-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                      <BarChart3 className="h-5 w-5 text-info" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ortalama Sepet</p>
                      <p className="text-xl font-bold">₺265</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="stat-card">
                <CardContent className="p-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                      <Calendar className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Kampanya Satışı</p>
                      <p className="text-xl font-bold">₺3,200</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Placeholder for chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Saatlik Satış Grafiği</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20">
                  <div className="text-center">
                    <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground/40" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Veritabanı bağlandığında grafikler burada görünecek
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="weekly">
            <Card>
              <CardContent className="flex h-64 items-center justify-center">
                <p className="text-muted-foreground">Haftalık rapor verileri yüklenecek</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monthly">
            <Card>
              <CardContent className="flex h-64 items-center justify-center">
                <p className="text-muted-foreground">Aylık rapor verileri yüklenecek</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ReportsPage;
