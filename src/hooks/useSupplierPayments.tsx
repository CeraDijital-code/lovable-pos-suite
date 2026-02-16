import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SupplierPayment {
  id: string;
  supplier_id: string;
  invoice_id: string | null;
  amount: number;
  payment_date: string;
  payment_method: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
}

export function useSupplierPayments(supplierId?: string) {
  return useQuery({
    queryKey: ["supplier-payments", supplierId],
    queryFn: async () => {
      let query = supabase
        .from("supplier_payments")
        .select("*, suppliers(name)")
        .order("payment_date", { ascending: false });
      if (supplierId) query = query.eq("supplier_id", supplierId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateSupplierPayment() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (payment: Omit<SupplierPayment, "id" | "created_at">) => {
      const { data, error } = await supabase.from("supplier_payments").insert(payment).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supplier-payments"] });
      qc.invalidateQueries({ queryKey: ["supplier-balance"] });
      toast({ title: "Ödeme kaydedildi" });
    },
    onError: (e: Error) => {
      toast({ title: "Hata", description: e.message, variant: "destructive" });
    },
  });
}
