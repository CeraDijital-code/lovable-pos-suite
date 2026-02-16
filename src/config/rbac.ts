import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/hooks/useRoles";

export interface PagePermission {
  path: string;
  label: string;
  description: string;
}

// Static page list (for seeding / display)
export const allPages: PagePermission[] = [
  { path: "/", label: "Dashboard", description: "Ana kontrol paneli" },
  { path: "/stok", label: "Stok Yönetimi", description: "Ürün ve stok yönetimi" },
  { path: "/kampanyalar", label: "Kampanyalar", description: "Kampanya oluşturma ve yönetimi" },
  { path: "/kasa", label: "Kasa", description: "Satış ve kasa işlemleri" },
  { path: "/raporlar", label: "Raporlar", description: "Satış ve finansal raporlar" },
  { path: "/stok-raporu", label: "Stok Raporu", description: "Stok hareket raporları" },
  { path: "/sadakat", label: "Sadakat", description: "Müşteri sadakat programı" },
  { path: "/tedarikciler", label: "Tedarikçiler", description: "Tedarikçi ve irsaliye yönetimi" },
  { path: "/personel", label: "Personel", description: "Personel ve yetki yönetimi" },
  { path: "/ayarlar", label: "Ayarlar", description: "Sistem ayarları" },
];

export interface RolePermissionRow {
  id: string;
  role: AppRole;
  page_path: string;
  page_label: string;
  page_description: string;
  allowed: boolean;
}

export function useRolePermissions() {
  return useQuery({
    queryKey: ["role-permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("*")
        .order("page_path");
      if (error) throw error;
      return data as RolePermissionRow[];
    },
  });
}

export function hasAccess(permissions: RolePermissionRow[], userRoles: AppRole[], path: string): boolean {
  if (userRoles.length === 0) return path === "/" || path === "/profil"; // no roles = only dashboard & profile
  if (userRoles.includes("admin")) return true; // admin = everything

  // Check if any of user's roles has allowed=true for this path
  const matching = permissions.filter((p) => p.page_path === path && userRoles.includes(p.role));
  if (matching.length === 0) return true; // page not in permissions table = allow
  return matching.some((p) => p.allowed);
}
