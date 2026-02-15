import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Campaign {
  id: string;
  name: string;
  type: "x_al_y_ode" | "x_alana_y_indirim" | "yuzde_indirim" | "ozel_fiyat";
  buy_quantity: number;
  pay_quantity: number;
  discount_percent: number;
  source_buy_quantity: number;
  target_discount_percent: number;
  special_price: number;
  special_price_min_quantity: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CampaignProduct {
  id: string;
  campaign_id: string;
  product_id: string;
  role: string;
  created_at: string;
  products?: { id: string; name: string; barcode: string } | null;
}

export interface CampaignWithProducts extends Campaign {
  campaign_products?: CampaignProduct[];
}

const typeLabels: Record<string, string> = {
  x_al_y_ode: "X Al Y Öde",
  x_alana_y_indirim: "X Alana Y'de İndirim",
  yuzde_indirim: "Yüzde İndirim",
  ozel_fiyat: "Özel Fiyat",
};

const typeIcons: Record<string, string> = {
  x_al_y_ode: "🎁",
  x_alana_y_indirim: "🔗",
  yuzde_indirim: "💰",
  ozel_fiyat: "⭐",
};

export function getCampaignTypeLabel(type: string) {
  return typeLabels[type] || type;
}

export function getCampaignTypeIcon(type: string) {
  return typeIcons[type] || "📦";
}

export function getCampaignDetails(c: Campaign): string {
  if (c.type === "x_al_y_ode") return `${c.buy_quantity} Al ${c.pay_quantity} Öde`;
  if (c.type === "x_alana_y_indirim") return `${c.source_buy_quantity} Al → %${c.target_discount_percent} İndirim`;
  if (c.type === "yuzde_indirim") return `%${c.discount_percent} İndirim`;
  if (c.type === "ozel_fiyat") return `${c.special_price_min_quantity}+ adet → ₺${c.special_price}`;
  return "";
}

export function getCampaignStatus(c: Campaign): { label: string; variant: "default" | "secondary" | "outline"; color: string } {
  const today = new Date().toISOString().split("T")[0];
  if (!c.is_active) return { label: "Pasif", variant: "secondary", color: "text-muted-foreground" };
  if (c.end_date < today) return { label: "Süresi Dolmuş", variant: "secondary", color: "text-destructive" };
  if (c.start_date > today) return { label: "Planlandı", variant: "outline", color: "text-info" };
  return { label: "Aktif", variant: "default", color: "text-success" };
}

export function useCampaigns() {
  return useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*, campaign_products(*, products(id, name, barcode))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CampaignWithProducts[];
    },
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      products,
      targetProducts,
      ...campaign
    }: Omit<Campaign, "id" | "created_at" | "updated_at"> & {
      products: string[];
      targetProducts?: string[];
    }) => {
      const { data, error } = await supabase
        .from("campaigns")
        .insert(campaign)
        .select()
        .single();
      if (error) throw error;

      const rows = [
        ...products.map((pid) => ({ campaign_id: data.id, product_id: pid, role: "source" })),
        ...(targetProducts || []).map((pid) => ({ campaign_id: data.id, product_id: pid, role: "target" })),
      ];
      if (rows.length > 0) {
        const { error: pError } = await supabase.from("campaign_products").insert(rows);
        if (pError) throw pError;
      }

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      toast({ title: "Kampanya oluşturuldu ✓" });
    },
    onError: () => {
      toast({ title: "Hata", description: "Kampanya oluşturulamadı.", variant: "destructive" });
    },
  });
}

export function useUpdateCampaign() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      products,
      targetProducts,
      ...updates
    }: Partial<Campaign> & { id: string; products?: string[]; targetProducts?: string[] }) => {
      const { error } = await supabase.from("campaigns").update(updates).eq("id", id);
      if (error) throw error;

      if (products !== undefined) {
        await supabase.from("campaign_products").delete().eq("campaign_id", id);
        const rows = [
          ...products.map((pid) => ({ campaign_id: id, product_id: pid, role: "source" })),
          ...(targetProducts || []).map((pid) => ({ campaign_id: id, product_id: pid, role: "target" })),
        ];
        if (rows.length > 0) {
          await supabase.from("campaign_products").insert(rows);
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      toast({ title: "Kampanya güncellendi ✓" });
    },
    onError: () => {
      toast({ title: "Hata", description: "Güncelleme başarısız.", variant: "destructive" });
    },
  });
}

export function useDeleteCampaign() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      toast({ title: "Kampanya silindi" });
    },
    onError: () => {
      toast({ title: "Hata", description: "Silme başarısız.", variant: "destructive" });
    },
  });
}
