import type { AppRole } from "@/hooks/useRoles";

export interface PagePermission {
  path: string;
  label: string;
  allowedRoles: AppRole[]; // empty = all authenticated users
  description: string;
}

// Which roles can access which pages
// "admin" always has full access (handled in hasAccess)
export const pagePermissions: PagePermission[] = [
  { path: "/", label: "Dashboard", allowedRoles: [], description: "Ana kontrol paneli" },
  { path: "/stok", label: "Stok Yönetimi", allowedRoles: ["admin", "depocu"], description: "Ürün ve stok yönetimi" },
  { path: "/kampanyalar", label: "Kampanyalar", allowedRoles: ["admin", "kasiyer"], description: "Kampanya oluşturma ve yönetimi" },
  { path: "/kasa", label: "Kasa", allowedRoles: ["admin", "kasiyer"], description: "Satış ve kasa işlemleri" },
  { path: "/raporlar", label: "Raporlar", allowedRoles: ["admin", "muhasebe"], description: "Satış ve finansal raporlar" },
  { path: "/stok-raporu", label: "Stok Raporu", allowedRoles: ["admin", "depocu", "muhasebe"], description: "Stok hareket raporları" },
  { path: "/sadakat", label: "Sadakat", allowedRoles: ["admin", "kasiyer"], description: "Müşteri sadakat programı" },
  { path: "/personel", label: "Personel", allowedRoles: ["admin"], description: "Personel ve yetki yönetimi" },
  { path: "/ayarlar", label: "Ayarlar", allowedRoles: ["admin"], description: "Sistem ayarları" },
  { path: "/profil", label: "Profil", allowedRoles: [], description: "Kişisel profil" },
];

export function hasAccess(userRoles: AppRole[], path: string): boolean {
  const page = pagePermissions.find((p) => p.path === path);
  if (!page) return true; // unknown page = allow
  if (page.allowedRoles.length === 0) return true; // open to all authenticated
  if (userRoles.includes("admin")) return true; // admin = full access
  return userRoles.some((r) => page.allowedRoles.includes(r));
}
