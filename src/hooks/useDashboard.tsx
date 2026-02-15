import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay, startOfWeek, startOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from "date-fns";
import { tr } from "date-fns/locale";

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

export interface SalesChartData {
  label: string;
  total: number;
  count: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);

      const { data: todaySales } = await supabase
        .from("sales")
        .select("total")
        .gte("created_at", todayStart.toISOString());

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

      const { count: productCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      const today = new Date().toISOString().split("T")[0];
      const { count: campaignCount } = await supabase
        .from("campaigns")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true)
        .lte("start_date", today)
        .gte("end_date", today);

      const { count: customerCount } = await supabase
        .from("loyalty_customers")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

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
    refetchInterval: 30000,
  });
}

export function useSalesChart(period: "daily" | "weekly" | "monthly") {
  return useQuery({
    queryKey: ["dashboard-sales-chart", period],
    queryFn: async () => {
      const now = new Date();
      let startDate: Date;
      
      if (period === "daily") {
        startDate = subDays(now, 13); // last 14 days
      } else if (period === "weekly") {
        startDate = subDays(now, 7 * 8 - 1); // last 8 weeks
      } else {
        startDate = subDays(now, 365); // last 12 months
      }

      const { data, error } = await supabase
        .from("sales")
        .select("total, created_at")
        .gte("created_at", startOfDay(startDate).toISOString())
        .order("created_at", { ascending: true });
      if (error) throw error;

      const sales = data || [];
      const chartData: SalesChartData[] = [];

      if (period === "daily") {
        const days = eachDayOfInterval({ start: startDate, end: now });
        for (const day of days) {
          const dayStr = format(day, "yyyy-MM-dd");
          const daySales = sales.filter(s => format(new Date(s.created_at), "yyyy-MM-dd") === dayStr);
          chartData.push({
            label: format(day, "dd MMM", { locale: tr }),
            total: daySales.reduce((s, r) => s + Number(r.total), 0),
            count: daySales.length,
          });
        }
      } else if (period === "weekly") {
        const weeks = eachWeekOfInterval({ start: startDate, end: now }, { weekStartsOn: 1 });
        for (let i = 0; i < weeks.length; i++) {
          const weekStart = weeks[i];
          const weekEnd = i < weeks.length - 1 ? weeks[i + 1] : now;
          const weekSales = sales.filter(s => {
            const d = new Date(s.created_at);
            return d >= weekStart && d < weekEnd;
          });
          chartData.push({
            label: format(weekStart, "dd MMM", { locale: tr }),
            total: weekSales.reduce((s, r) => s + Number(r.total), 0),
            count: weekSales.length,
          });
        }
      } else {
        const months = eachMonthOfInterval({ start: startDate, end: now });
        for (const month of months) {
          const monthStr = format(month, "yyyy-MM");
          const monthSales = sales.filter(s => format(new Date(s.created_at), "yyyy-MM") === monthStr);
          chartData.push({
            label: format(month, "MMM yy", { locale: tr }),
            total: monthSales.reduce((s, r) => s + Number(r.total), 0),
            count: monthSales.length,
          });
        }
      }

      return chartData;
    },
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
