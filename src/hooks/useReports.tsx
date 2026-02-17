import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, eachHourOfInterval } from "date-fns";
import { tr } from "date-fns/locale";

export interface ReportSale {
  id: string;
  sale_number: number;
  payment_method: string;
  subtotal: number;
  discount: number;
  total: number;
  created_at: string;
  created_by: string | null;
  points_earned: number;
  points_redeemed: number;
  loyalty_customer_id: string | null;
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

export interface StaffSalesSummary {
  userId: string;
  fullName: string;
  saleCount: number;
  totalRevenue: number;
  totalDiscount: number;
  itemCount: number;
}

export interface HourlySalesData {
  hour: string;
  total: number;
  count: number;
}

export interface PaymentMethodSummary {
  method: string;
  label: string;
  total: number;
  count: number;
}

export interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

export interface ReportData {
  sales: ReportSale[];
  totalRevenue: number;
  totalDiscount: number;
  netRevenue: number;
  saleCount: number;
  avgBasket: number;
  totalItems: number;
  staffSummary: StaffSalesSummary[];
  hourlySales: HourlySalesData[];
  paymentMethods: PaymentMethodSummary[];
  topProducts: TopProduct[];
  supplierPayments: number;
  supplierPaymentCount: number;
}

const paymentLabels: Record<string, string> = {
  cash: "Nakit",
  card: "Kredi Kartı",
  mixed: "Karma",
};

export function useReportData(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: ["report-data", startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const start = startOfDay(startDate).toISOString();
      const end = endOfDay(endDate).toISOString();

      // Fetch sales with items and profiles in parallel
      const [salesRes, profilesRes, supplierPayRes] = await Promise.all([
        supabase
          .from("sales")
          .select(`
            *,
            loyalty_customers(full_name, phone),
            sale_items(id, product_name, barcode, quantity, unit_price, discount, total, campaign_name)
          `)
          .gte("created_at", start)
          .lte("created_at", end)
          .order("created_at", { ascending: false }),
        supabase.from("profiles").select("user_id, full_name"),
        supabase
          .from("supplier_payments")
          .select("amount")
          .gte("created_at", start)
          .lte("created_at", end),
      ]);

      if (salesRes.error) throw salesRes.error;
      const sales = (salesRes.data || []) as ReportSale[];
      const profiles = profilesRes.data || [];
      const profileMap = new Map(profiles.map((p) => [p.user_id, p.full_name]));

      const supplierPayments = (supplierPayRes.data || []).reduce(
        (s, r) => s + Number(r.amount),
        0
      );

      const totalRevenue = sales.reduce((s, r) => s + Number(r.total), 0);
      const totalDiscount = sales.reduce((s, r) => s + Number(r.discount), 0);
      const netRevenue = totalRevenue;
      const saleCount = sales.length;
      const avgBasket = saleCount > 0 ? totalRevenue / saleCount : 0;
      const totalItems = sales.reduce(
        (s, r) => s + r.sale_items.reduce((si, item) => si + item.quantity, 0),
        0
      );

      // Staff summary
      const staffMap = new Map<string, StaffSalesSummary>();
      for (const sale of sales) {
        const uid = sale.created_by || "unknown";
        const existing = staffMap.get(uid) || {
          userId: uid,
          fullName: profileMap.get(uid) || "Bilinmeyen",
          saleCount: 0,
          totalRevenue: 0,
          totalDiscount: 0,
          itemCount: 0,
        };
        existing.saleCount += 1;
        existing.totalRevenue += Number(sale.total);
        existing.totalDiscount += Number(sale.discount);
        existing.itemCount += sale.sale_items.reduce((s, i) => s + i.quantity, 0);
        staffMap.set(uid, existing);
      }

      // Hourly sales (for single-day view)
      const hours = eachHourOfInterval({
        start: startOfDay(startDate),
        end: endOfDay(startDate),
      });
      const hourlySales: HourlySalesData[] = hours.map((h) => {
        const hourStr = format(h, "HH:00");
        const hourSales = sales.filter(
          (s) => format(new Date(s.created_at), "HH") === format(h, "HH") &&
                 format(new Date(s.created_at), "yyyy-MM-dd") === format(startDate, "yyyy-MM-dd")
        );
        return {
          hour: hourStr,
          total: hourSales.reduce((s, r) => s + Number(r.total), 0),
          count: hourSales.length,
        };
      });

      // Payment method summary
      const pmMap = new Map<string, { total: number; count: number }>();
      for (const sale of sales) {
        const pm = sale.payment_method;
        const existing = pmMap.get(pm) || { total: 0, count: 0 };
        existing.total += Number(sale.total);
        existing.count += 1;
        pmMap.set(pm, existing);
      }
      const paymentMethods: PaymentMethodSummary[] = Array.from(pmMap.entries()).map(
        ([method, data]) => ({
          method,
          label: paymentLabels[method] || method,
          ...data,
        })
      );

      // Top products
      const prodMap = new Map<string, { quantity: number; revenue: number }>();
      for (const sale of sales) {
        for (const item of sale.sale_items) {
          const existing = prodMap.get(item.product_name) || { quantity: 0, revenue: 0 };
          existing.quantity += item.quantity;
          existing.revenue += Number(item.total);
          prodMap.set(item.product_name, existing);
        }
      }
      const topProducts: TopProduct[] = Array.from(prodMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      return {
        sales,
        totalRevenue,
        totalDiscount,
        netRevenue,
        saleCount,
        avgBasket,
        totalItems,
        staffSummary: Array.from(staffMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue),
        hourlySales,
        paymentMethods,
        topProducts,
        supplierPayments,
        supplierPaymentCount: supplierPayRes.data?.length || 0,
      } as ReportData;
    },
  });
}
