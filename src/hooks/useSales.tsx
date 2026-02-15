import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CartItem {
  productId: string;
  barcode: string;
  name: string;
  image_url?: string | null;
  unitPrice: number;
  quantity: number;
  discount: number;
  campaignId?: string | null;
  campaignName?: string | null;
  total: number;
}

export function useCompleteSale() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      items,
      paymentMethod,
      subtotal,
      discount,
      total,
    }: {
      items: CartItem[];
      paymentMethod: string;
      subtotal: number;
      discount: number;
      total: number;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Create sale
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert({
          payment_method: paymentMethod,
          subtotal,
          discount,
          total,
          created_by: user?.id,
        })
        .select()
        .single();
      if (saleError) throw saleError;

      // Create sale items
      const saleItems = items.map((item) => ({
        sale_id: sale.id,
        product_id: item.productId,
        product_name: item.name,
        barcode: item.barcode,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount: item.discount,
        total: item.total,
        campaign_id: item.campaignId || null,
        campaign_name: item.campaignName || null,
      }));

      const { error: itemsError } = await supabase
        .from("sale_items")
        .insert(saleItems);
      if (itemsError) throw itemsError;

      // Update stock for each item
      for (const item of items) {
        const { data: product } = await supabase
          .from("products")
          .select("stock")
          .eq("id", item.productId)
          .single();

        if (product) {
          const newStock = product.stock - item.quantity;
          await supabase
            .from("products")
            .update({ stock: Math.max(0, newStock) })
            .eq("id", item.productId);

          await supabase.from("stock_movements").insert({
            product_id: item.productId,
            movement_type: "out" as const,
            quantity: item.quantity,
            previous_stock: product.stock,
            new_stock: Math.max(0, newStock),
            note: `Satış #${sale.sale_number}`,
            created_by: user?.id,
          });
        }
      }

      return sale;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["stock-movements"] });
      qc.invalidateQueries({ queryKey: ["sales"] });
      toast({ title: "Satış tamamlandı ✓" });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Satış tamamlanamadı.",
        variant: "destructive",
      });
    },
  });
}
