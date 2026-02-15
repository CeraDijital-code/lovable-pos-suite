import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Check, X, Loader2 } from "lucide-react";
import { roleLabels, roleColors, type AppRole } from "@/hooks/useRoles";
import { useRolePermissions, allPages, type RolePermissionRow } from "@/config/rbac";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const allRoles: AppRole[] = ["admin", "kasiyer", "depocu", "muhasebe"];

export default function PermissionsTab() {
  const { data: permissions = [], isLoading } = useRolePermissions();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [updating, setUpdating] = useState<string | null>(null);

  const isAllowed = (role: AppRole, path: string) => {
    const perm = permissions.find((p) => p.role === role && p.page_path === path);
    return perm?.allowed ?? false;
  };

  const getPermId = (role: AppRole, path: string) => {
    return permissions.find((p) => p.role === role && p.page_path === path)?.id;
  };

  const handleToggle = async (role: AppRole, path: string, newValue: boolean) => {
    const id = getPermId(role, path);
    if (!id) return;
    const key = `${role}-${path}`;
    setUpdating(key);
    const { error } = await supabase
      .from("role_permissions")
      .update({ allowed: newValue })
      .eq("id", id);
    if (error) {
      toast({ title: "Hata", description: "Yetki güncellenemedi", variant: "destructive" });
    } else {
      await qc.invalidateQueries({ queryKey: ["role-permissions"] });
    }
    setUpdating(null);
  };

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Yükleniyor...
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          Rol – Sayfa Yetki Matrisi
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Her rolün hangi sayfalara erişebildiğini yönetin. Checkbox ile yetkileri açıp kapatabilirsiniz.
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
              {allPages.map((page) => (
                <tr key={page.path} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-2">
                    <div>
                      <span className="font-medium">{page.label}</span>
                      <p className="text-[11px] text-muted-foreground">{page.description}</p>
                    </div>
                  </td>
                  {allRoles.map((role) => {
                    const allowed = isAllowed(role, page.path);
                    const key = `${role}-${page.path}`;
                    const isUpdating = updating === key;
                    const isAdmin = role === "admin";
                    return (
                      <td key={role} className="text-center py-3 px-2">
                        {isUpdating ? (
                          <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
                        ) : (
                          <Checkbox
                            checked={allowed}
                            disabled={isAdmin} // admin always has full access
                            onCheckedChange={(checked) => handleToggle(role, page.path, !!checked)}
                            className="mx-auto"
                          />
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
            <div><Badge variant="outline" className={`text-[10px] mr-1.5 ${roleColors.admin}`}>{roleLabels.admin}</Badge>Tüm sisteme tam erişim (değiştirilemez)</div>
            <div><Badge variant="outline" className={`text-[10px] mr-1.5 ${roleColors.kasiyer}`}>{roleLabels.kasiyer}</Badge>Kasa, kampanya, sadakat işlemleri</div>
            <div><Badge variant="outline" className={`text-[10px] mr-1.5 ${roleColors.depocu}`}>{roleLabels.depocu}</Badge>Stok giriş/çıkış, stok raporları</div>
            <div><Badge variant="outline" className={`text-[10px] mr-1.5 ${roleColors.muhasebe}`}>{roleLabels.muhasebe}</Badge>Raporlar, finansal özet</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
