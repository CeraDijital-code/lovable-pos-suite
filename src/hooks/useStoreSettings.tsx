import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface StoreSettings {
  id: string;
  store_name: string;
  store_address: string;
  store_phone: string;
  tax_number: string;
  tax_office: string;
  logo_light_url: string | null;
  logo_dark_url: string | null;
  receipt_header: string;
  receipt_footer: string;
  currency_symbol: string;
  points_per_tl: number;
  min_stock_alert: boolean;
  created_at: string;
  updated_at: string;
}

export function useStoreSettings() {
  return useQuery({
    queryKey: ["store-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as StoreSettings | null;
    },
  });
}

export function useUpdateStoreSettings() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (updates: Partial<StoreSettings>) => {
      // Get existing row id
      const { data: existing } = await supabase
        .from("store_settings")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (!existing) throw new Error("Ayar kaydı bulunamadı");

      const { error } = await supabase
        .from("store_settings")
        .update(updates)
        .eq("id", existing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["store-settings"] });
      toast({ title: "Ayarlar kaydedildi" });
    },
    onError: (err: any) => {
      toast({ title: "Hata", description: err.message, variant: "destructive" });
    },
  });
}
