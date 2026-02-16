import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SupplierInvoice {
  id: string;
  supplier_id: string;
  invoice_number: string | null;
  invoice_date: string;
  due_date: string | null;
  subtotal: number;
  tax_amount: number;
  total: number;
  status: string;
  document_url: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupplierInvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string | null;
  product_name: string;
  barcode: string | null;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  total: number;
}

export function useSupplierInvoices(supplierId?: string) {
  return useQuery({
    queryKey: ["supplier-invoices", supplierId],
    queryFn: async () => {
      let query = supabase
        .from("supplier_invoices")
        .select("*, suppliers(name)")
        .order("invoice_date", { ascending: false });
      if (supplierId) query = query.eq("supplier_id", supplierId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useSupplierInvoiceItems(invoiceId: string | undefined) {
  return useQuery({
    queryKey: ["supplier-invoice-items", invoiceId],
    enabled: !!invoiceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplier_invoice_items")
        .select("*")
        .eq("invoice_id", invoiceId!);
      if (error) throw error;
      return data as SupplierInvoiceItem[];
    },
  });
}

export function useCreateSupplierInvoice() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (invoice: Omit<SupplierInvoice, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase.from("supplier_invoices").insert(invoice).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supplier-invoices"] });
      qc.invalidateQueries({ queryKey: ["supplier-balance"] });
      toast({ title: "İrsaliye eklendi" });
    },
    onError: (e: Error) => {
      toast({ title: "Hata", description: e.message, variant: "destructive" });
    },
  });
}

export function useCreateSupplierInvoiceItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: Omit<SupplierInvoiceItem, "id">[]) => {
      const { data, error } = await supabase.from("supplier_invoice_items").insert(items).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supplier-invoice-items"] });
    },
  });
}

export function useUpdateSupplierInvoice() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SupplierInvoice> & { id: string }) => {
      const { data, error } = await supabase.from("supplier_invoices").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supplier-invoices"] });
      qc.invalidateQueries({ queryKey: ["supplier-balance"] });
      toast({ title: "İrsaliye güncellendi" });
    },
    onError: (e: Error) => {
      toast({ title: "Hata", description: e.message, variant: "destructive" });
    },
  });
}

export function useUploadInvoiceDocument() {
  return useMutation({
    mutationFn: async ({ file, supplierId }: { file: File; supplierId: string }) => {
      const ext = file.name.split(".").pop();
      const path = `${supplierId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("supplier-documents").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("supplier-documents").getPublicUrl(path);
      return urlData.publicUrl;
    },
  });
}
