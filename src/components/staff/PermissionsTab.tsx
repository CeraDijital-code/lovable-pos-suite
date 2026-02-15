import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Check, X } from "lucide-react";
import { roleLabels, roleColors, type AppRole } from "@/hooks/useRoles";
import { pagePermissions } from "@/config/rbac";

const allRoles: AppRole[] = ["admin", "kasiyer", "depocu", "muhasebe"];

export default function PermissionsTab() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          Rol – Sayfa Yetki Matrisi
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Her rolün hangi sayfalara erişebildiğini görün. Yönetici rolü tüm sayfalara tam erişime sahiptir.
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Sayfa</th>
                {allRoles.map((role) => (
                  <th key={role} className="text-center py-3 px-2">
                    <Badge variant="outline" className={`text-xs ${roleColors[role]}`}>
                      {roleLabels[role]}
                    </Badge>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagePermissions
                .filter((p) => p.path !== "/profil") // profil herkes için açık, göstermeye gerek yok
                .map((page) => (
                  <tr key={page.path} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-2">
                      <div>
                        <span className="font-medium">{page.label}</span>
                        <p className="text-[11px] text-muted-foreground">{page.description}</p>
                      </div>
                    </td>
                    {allRoles.map((role) => {
                      const allowed =
                        role === "admin" ||
                        page.allowedRoles.length === 0 ||
                        page.allowedRoles.includes(role);
                      return (
                        <td key={role} className="text-center py-3 px-2">
                          {allowed ? (
                            <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-500/10">
                              <Check className="h-3.5 w-3.5 text-green-600" />
                            </div>
                          ) : (
                            <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-destructive/10">
                              <X className="h-3.5 w-3.5 text-destructive" />
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 rounded-lg bg-muted/50 space-y-2">
          <h4 className="font-medium text-sm">Rol Açıklamaları</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div><Badge variant="outline" className={`text-[10px] mr-1.5 ${roleColors.admin}`}>{roleLabels.admin}</Badge>Tüm sisteme tam erişim</div>
            <div><Badge variant="outline" className={`text-[10px] mr-1.5 ${roleColors.kasiyer}`}>{roleLabels.kasiyer}</Badge>Kasa, kampanya, sadakat işlemleri</div>
            <div><Badge variant="outline" className={`text-[10px] mr-1.5 ${roleColors.depocu}`}>{roleLabels.depocu}</Badge>Stok giriş/çıkış, stok raporları</div>
            <div><Badge variant="outline" className={`text-[10px] mr-1.5 ${roleColors.muhasebe}`}>{roleLabels.muhasebe}</Badge>Raporlar, finansal özet</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
