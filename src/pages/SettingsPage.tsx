import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Settings, Store, Upload, Palette } from "lucide-react";

const SettingsPage = () => {
  return (
    <Layout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold">Ayarlar</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Sistem ve mağaza ayarlarını yönetin
          </p>
        </div>

        {/* Store Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Store className="h-4 w-4 text-primary" />
              Mağaza Bilgileri
            </CardTitle>
            <CardDescription>
              Tekel bayi mağaza bilgilerinizi güncelleyin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Mağaza Adı</Label>
              <Input placeholder="Mağaza adınızı girin" />
            </div>
            <div className="space-y-2">
              <Label>Adres</Label>
              <Input placeholder="Mağaza adresinizi girin" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input placeholder="0 (___) ___ __ __" />
              </div>
              <div className="space-y-2">
                <Label>Vergi No</Label>
                <Input placeholder="Vergi numaranızı girin" />
              </div>
            </div>
            <Button>Kaydet</Button>
          </CardContent>
        </Card>

        {/* Logo Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" />
              Logo Ayarları
            </CardTitle>
            <CardDescription>
              Açık ve koyu mod için farklı logolar yükleyebilirsiniz
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Açık Mod Logosu</Label>
                <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/50 cursor-pointer hover:border-primary/40 transition-colors">
                  <div className="text-center">
                    <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
                    <p className="mt-1 text-xs text-muted-foreground">Logo yükle</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Koyu Mod Logosu</Label>
                <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/50 cursor-pointer hover:border-primary/40 transition-colors">
                  <div className="text-center">
                    <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
                    <p className="mt-1 text-xs text-muted-foreground">Logo yükle</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default SettingsPage;
