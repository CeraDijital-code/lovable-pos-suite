/**
 * Token/Beko Yazar Kasa POS Mali Departman Konfigürasyonu
 * Her departman, POS cihazındaki KDV grubuna karşılık gelir.
 */

export interface TaxDepartment {
  id: number;
  label: string;
  kdvRate: number;
  description: string;
}

export const TAX_DEPARTMENTS: TaxDepartment[] = [
  { id: 1, label: "Gıda", kdvRate: 1, description: "Gıda ürünleri (%1 KDV)" },
  { id: 2, label: "Temel İhtiyaç / İçecek", kdvRate: 10, description: "Temel ihtiyaç ve içecekler (%10 KDV)" },
  { id: 3, label: "Alkol", kdvRate: 20, description: "Alkollü içecekler (%20 KDV)" },
  { id: 4, label: "Tütün", kdvRate: 20, description: "Tütün ürünleri (%20 KDV)" },
  { id: 5, label: "Diğer", kdvRate: 20, description: "Diğer ürünler (%20 KDV)" },
];

/** KDV oranları dropdown için */
export const KDV_RATES = [1, 10, 20] as const;
export type KdvRate = (typeof KDV_RATES)[number];

/**
 * Kategori adı ve KDV oranına göre POS cihazındaki mali departman ID'sini döndürür.
 * Eşleşme bulunamazsa varsayılan olarak Departman 5 (Diğer) döner.
 */
export function getTaxDepartmentId(categoryName: string | null | undefined, kdvRate: number): number {
  const cat = (categoryName || "").toLowerCase().trim();

  // KDV %1 → Gıda (Dept 1)
  if (kdvRate === 1) return 1;

  // KDV %10 → Temel İhtiyaç / İçecek (Dept 2)
  if (kdvRate === 10) return 2;

  // KDV %20 → Kategori bazlı ayrım
  if (kdvRate === 20) {
    if (cat.includes("alkol") || cat.includes("bira") || cat.includes("şarap") || cat.includes("rakı") || cat.includes("viski") || cat.includes("votka")) {
      return 3; // Alkol
    }
    if (cat.includes("tütün") || cat.includes("sigara") || cat.includes("puro") || cat.includes("pipo")) {
      return 4; // Tütün
    }
    return 5; // Diğer
  }

  return 5; // Varsayılan
}

/**
 * Bridge API'sine gönderilecek ödeme payload'u için ürün satır tipi
 */
export interface BridgePayloadItem {
  name: string;
  price: number;
  quantity: number;
  taxDepartmentId: number;
}

/**
 * Sepet verilerinden Token/Beko Bridge API payload'u oluşturur.
 */
export function buildBridgePayload(
  cartItems: Array<{
    name: string;
    unitPrice: number;
    quantity: number;
    taxDepartmentId: number;
  }>
): BridgePayloadItem[] {
  return cartItems.map((item) => ({
    name: item.name,
    price: item.unitPrice,
    quantity: item.quantity,
    taxDepartmentId: item.taxDepartmentId,
  }));
}
