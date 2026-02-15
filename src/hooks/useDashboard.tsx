import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DashboardSale {
  id: string;
  sale_number: number;
  payment_method: string;
  subtotal: number;
  discount: number;
  total: number;
  created_at: string;
  created_by: string | null;
  loyalty_customer_id: string | null;
  points_earned: number;
  points_redeemed: number;
  loyalty_customers: { full_name: string; phone: string } | null;
  sale_items: {
    id: string;
    product_name: string;
    barcode: string;
    quantity: number;
    unit_price: number;
    discount: number;
    total: number;
    campaign_name: string | null;
  }[];
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);

      // Today's sales
      const { data: todaySales } = await supabase
        .from("sales")
        .select("total")
        .gte("created_at", todayStart.toISOString());

      // Yesterday's sales
      const { data: yesterdaySales } = await supabase
        .from("sales")
        .select("total")
        .gte("created_at", yesterdayStart.toISOString())
        .lt("created_at", todayStart.toISOString());

      const todayTotal = todaySales?.reduce((s, r) => s + Number(r.total), 0) || 0;
      const yesterdayTotal = yesterdaySales?.reduce((s, r) => s + Number(r.total), 0) || 0;
      const salesChange = yesterdayTotal > 0
        ? (((todayTotal - yesterdayTotal) / yesterdayTotal) * 100).toFixed(1)
        : todayTotal > 0 ? "+100" : "0";

      // Product count
      const { count: productCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Active campaigns
      const today = new Date().toISOString().split("T")[0];
      const { count: campaignCount } = await supabase
        .from("campaigns")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true)
        .lte("start_date", today)
        .gte("end_date", today);

      // Loyalty customers
      const { count: customerCount } = await supabase
        .from("loyalty_customers")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Total points in circulation
      const { data: pointsData } = await supabase
        .from("loyalty_customers")
        .select("total_points")
        .eq("is_active", true);
      const totalPoints = pointsData?.reduce((s, r) => s + r.total_points, 0) || 0;

      return {
        dailySales: todayTotal,
        dailySalesChange: salesChange,
        dailySalesCount: todaySales?.length || 0,
        productCount: productCount || 0,
        campaignCount: campaignCount || 0,
        customerCount: customerCount || 0,
        totalPoints,
      };
    },
    refetchInterval: 30000, // refresh every 30s
  });
}

export function useRecentSales() {
  return useQuery({
    queryKey: ["dashboard-recent-sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select(`
          *,
          loyalty_customers(full_name, phone),
          sale_items(id, product_name, barcode, quantity, unit_price, discount, total, campaign_name)
        `)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as DashboardSale[];
    },
    refetchInterval: 15000,
  });
}

export function useLowStockProducts(page: number, pageSize = 5) {
  return useQuery({
    queryKey: ["dashboard-low-stock", page, pageSize],
    queryFn: async () => {
      // Get total count first
      const { count } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true)
        .filter("stock", "lt", "min_stock" as any);

      // We can't use column references in .lt(), so fetch all and filter client-side
      const { data, error } = await supabase
        .from("products")
        .select("id, name, barcode, stock, min_stock, image_url")
        .eq("is_active", true)
        .order("stock", { ascending: true });
      if (error) throw error;

      const lowStock = (data || []).filter((p) => p.stock < p.min_stock);
      const totalCount = lowStock.length;
      const paged = lowStock.slice(page * pageSize, (page + 1) * pageSize);

      return {
        items: paged,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      };
    },
  });
}
