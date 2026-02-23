import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Product {
  id: string;
  barcode: string;
  name: string;
  category_id: string | null;
  price: number;
  cost_price: number;
  stock: number;
  min_stock: number;
  unit: string;
  is_active: boolean;
  image_url: string | null;
  show_in_carousel: boolean;
  kdv_rate: number;
  created_at: string;
  updated_at: string;
  categories?: { id: string; name: string } | null;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  movement_type: "in" | "out" | "adjustment";
  quantity: number;
  previous_stock: number;
  new_stock: number;
  note: string | null;
  created_by: string | null;
  created_at: string;
  products?: { name: string; barcode: string } | null;
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Category[];
    },
  });
}

export function useProducts(search?: string, categoryId?: string) {
  return useQuery({
    queryKey: ["products", search, categoryId],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*, categories(id, name)")
        .order("name");

      if (search) {
        query = query.or(`name.ilike.%${search}%,barcode.ilike.%${search}%`);
      }
      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Product[];
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (product: {
      barcode: string;
      name: string;
      category_id: string | null;
      price: number;
      cost_price: number;
      stock: number;
      min_stock: number;
      unit: string;
    }) => {
      const { data, error } = await supabase
        .from("products")
        .insert(product)
        .select()
        .single();
      if (error) throw error;

      // Record stock movement
      if (product.stock > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from("stock_movements").insert({
          product_id: data.id,
          movement_type: "in" as const,
          quantity: product.stock,
          previous_stock: 0,
          new_stock: product.stock,
          note: "İlk stok girişi",
          created_by: user?.id,
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      toast({ title: "Ürün eklendi", description: "Yeni ürün başarıyla kaydedildi." });
    },
    onError: (error: any) => {
      const msg = error?.message?.includes("duplicate")
        ? "Bu barkod numarası zaten kayıtlı!"
        : "Ürün eklenirken hata oluştu.";
      toast({ title: "Hata", description: msg, variant: "destructive" });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Product> & { id: string }) => {
      const { data, error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Güncellendi", description: "Ürün bilgileri güncellendi." });
    },
    onError: () => {
      toast({ title: "Hata", description: "Güncelleme başarısız.", variant: "destructive" });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Silindi", description: "Ürün silindi." });
    },
    onError: () => {
      toast({ title: "Hata", description: "Silme işlemi başarısız.", variant: "destructive" });
    },
  });
}

export function useUpdateStock() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      productId,
      quantity,
      type,
      note,
    }: {
      productId: string;
      quantity: number;
      type: "in" | "out" | "adjustment";
      note?: string;
    }) => {
      // Get current stock
      const { data: product, error: fetchError } = await supabase
        .from("products")
        .select("stock")
        .eq("id", productId)
        .single();
      if (fetchError) throw fetchError;

      const previousStock = product.stock;
      let newStock: number;

      if (type === "adjustment") {
        newStock = quantity;
      } else if (type === "in") {
        newStock = previousStock + quantity;
      } else {
        newStock = previousStock - quantity;
      }

      if (newStock < 0) throw new Error("Stok sıfırın altına düşemez!");

      const { data: { user } } = await supabase.auth.getUser();

      // Update product stock
      const { error: updateError } = await supabase
        .from("products")
        .update({ stock: newStock })
        .eq("id", productId);
      if (updateError) throw updateError;

      // Record movement
      await supabase.from("stock_movements").insert({
        product_id: productId,
        movement_type: type,
        quantity,
        previous_stock: previousStock,
        new_stock: newStock,
        note,
        created_by: user?.id,
      });

      return { previousStock, newStock };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      toast({ title: "Stok güncellendi" });
    },
    onError: (error: any) => {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const { data: cat, error } = await supabase
        .from("categories")
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return cat;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "Kategori eklendi" });
    },
    onError: (error: any) => {
      const msg = error?.message?.includes("duplicate")
        ? "Bu kategori zaten mevcut!"
        : "Kategori eklenemedi.";
      toast({ title: "Hata", description: msg, variant: "destructive" });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "Kategori silindi" });
    },
    onError: () => {
      toast({ title: "Hata", description: "Kategori silinemedi.", variant: "destructive" });
    },
  });
}

export function useStockMovements(filters?: {
  startDate?: string;
  endDate?: string;
  productId?: string;
  type?: string;
}) {
  return useQuery({
    queryKey: ["stock-movements", filters],
    queryFn: async () => {
      let query = supabase
        .from("stock_movements")
        .select("*, products(name, barcode)")
        .order("created_at", { ascending: false });

      if (filters?.startDate) {
        query = query.gte("created_at", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("created_at", filters.endDate + "T23:59:59");
      }
      if (filters?.productId) {
        query = query.eq("product_id", filters.productId);
      }
      if (filters?.type) {
        query = query.eq("movement_type", filters.type as "in" | "out" | "adjustment");
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as StockMovement[];
    },
  });
}
