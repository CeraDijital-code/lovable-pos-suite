import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tags, Plus, Percent, Gift, Calendar, ToggleRight } from "lucide-react";

const sampleCampaigns = [
  {
    id: 1,
    name: "2 Al 1 Öde - Efes Pilsen",
    type: "x_al_y_ode",
    typeLabel: "X Al Y Öde",
    details: "2 Al 1 Öde",
    startDate: "2026-02-01",
    endDate: "2026-02-28",
    status: "active",
    products: 1,
  },
  {
    id: 2,
    name: "Viski %15 İndirim",
    type: "yuzde_indirim",
    typeLabel: "Yüzde İndirim",
    details: "%15 İndirim",
    startDate: "2026-02-10",
    endDate: "2026-03-10",
    status: "active",
    products: 5,
  },
  {
    id: 3,
    name: "Sigara Kategorisi %5",
    type: "yuzde_indirim",
    typeLabel: "Yüzde İndirim",
    details: "%5 İndirim",
    startDate: "2026-01-01",
    endDate: "2026-01-31",
    status: "expired",
    products: 12,
  },
  {
    id: 4,
    name: "3 Al 2 Öde - Red Bull",
    type: "x_al_y_ode",
    typeLabel: "X Al Y Öde",
    details: "3 Al 2 Öde",
    startDate: "2026-03-01",
    endDate: "2026-03-15",
    status: "scheduled",
    products: 1,
  },
];

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Aktif", variant: "default" },
  expired: { label: "Süresi Dolmuş", variant: "secondary" },
  scheduled: { label: "Planlandı", variant: "outline" },
};

const CampaignsPage = () => {
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
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Yeni Kampanya
          </Button>
        </div>

        {/* Campaign Type Cards */}
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
                    {sampleCampaigns.filter((c) => c.type === "x_al_y_ode").length}
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
                    {sampleCampaigns.filter((c) => c.type === "yuzde_indirim").length}
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
                  <p className="text-xl font-bold">
                    {sampleCampaigns.filter((c) => c.status === "active").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaigns Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Tags className="h-4 w-4 text-primary" />
              Kampanya Listesi
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleCampaigns.map((campaign) => {
                  const status = statusMap[campaign.status];
                  return (
                    <TableRow key={campaign.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{campaign.typeLabel}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{campaign.details}</TableCell>
                      <TableCell className="text-sm">{campaign.startDate}</TableCell>
                      <TableCell className="text-sm">{campaign.endDate}</TableCell>
                      <TableCell className="text-center">{campaign.products}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CampaignsPage;
