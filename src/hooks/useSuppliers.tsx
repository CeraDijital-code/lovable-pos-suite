import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Supplier {
  id: string;
  name: string;
  tax_number: string | null;
  tax_office: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  contact_person: string | null;
  iban: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type SupplierInsert = Omit<Supplier, "id" | "created_at" | "updated_at">;

export function useSuppliers() {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Supplier[];
    },
  });
}

export function useSupplier(id: string | undefined) {
  return useQuery({
    queryKey: ["suppliers", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as Supplier;
    },
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (supplier: SupplierInsert) => {
      const { data, error } = await supabase.from("suppliers").insert(supplier).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      toast({ title: "Tedarikçi eklendi" });
    },
    onError: (e: Error) => {
      toast({ title: "Hata", description: e.message, variant: "destructive" });
    },
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Supplier> & { id: string }) => {
      const { data, error } = await supabase.from("suppliers").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      toast({ title: "Tedarikçi güncellendi" });
    },
    onError: (e: Error) => {
      toast({ title: "Hata", description: e.message, variant: "destructive" });
    },
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("suppliers").update({ is_active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      toast({ title: "Tedarikçi pasife alındı" });
    },
    onError: (e: Error) => {
      toast({ title: "Hata", description: e.message, variant: "destructive" });
    },
  });
}

// Get supplier balance (total debt - total payments)
export function useSupplierBalance(supplierId: string | undefined) {
  return useQuery({
    queryKey: ["supplier-balance", supplierId],
    enabled: !!supplierId,
    queryFn: async () => {
      const [invoicesRes, paymentsRes] = await Promise.all([
        supabase
          .from("supplier_invoices")
          .select("total")
          .eq("supplier_id", supplierId!)
          .eq("status", "approved"),
        supabase
          .from("supplier_payments")
          .select("amount")
          .eq("supplier_id", supplierId!),
      ]);
      if (invoicesRes.error) throw invoicesRes.error;
      if (paymentsRes.error) throw paymentsRes.error;

      const totalDebt = (invoicesRes.data || []).reduce((s, i) => s + Number(i.total), 0);
      const totalPaid = (paymentsRes.data || []).reduce((s, p) => s + Number(p.amount), 0);
      return { totalDebt, totalPaid, balance: totalDebt - totalPaid };
    },
  });
}
