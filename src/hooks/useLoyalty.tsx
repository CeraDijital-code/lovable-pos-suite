import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { CartItem } from "@/hooks/useSales";

export interface LoyaltyCustomer {
  id: string;
  full_name: string;
  phone: string;
  qr_code: string;
  total_points: number;
  total_spent: number;
  total_visits: number;
  is_active: boolean;
  created_at: string;
}

export interface LoyaltyPointRule {
  id: string;
  name: string;
  type: string;
  points_per_tl: number;
  product_id: string | null;
  min_quantity: number;
  bonus_points: number;
  valid_days: string[] | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  product?: { id: string; name: string; barcode: string } | null;
}

export interface LoyaltyTransaction {
  id: string;
  customer_id: string;
  sale_id: string | null;
  type: string;
  points: number;
  description: string;
  created_by: string | null;
  created_at: string;
}

// --- Customers ---
export function useLoyaltyCustomers(search?: string) {
  return useQuery({
    queryKey: ["loyalty-customers", search],
    queryFn: async () => {
      let q = supabase.from("loyalty_customers").select("*").order("created_at", { ascending: false });
      if (search) {
        q = q.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,qr_code.ilike.%${search}%`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data as LoyaltyCustomer[];
    },
  });
}

export function useFindCustomerByQr() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (qrCode: string) => {
      const { data, error } = await supabase
        .from("loyalty_customers")
        .select("*")
        .eq("qr_code", qrCode)
        .eq("is_active", true)
        .single();
      if (error) throw new Error("Bu QR koda ait müşteri bulunamadı");
      return data as LoyaltyCustomer;
    },
    onError: (err: any) => {
      toast({ title: "Bulunamadı", description: err.message, variant: "destructive" });
    },
  });
}

export function useCreateLoyaltyCustomer() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ full_name, phone }: { full_name: string; phone: string }) => {
      const qr_code = `LYL-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const { data, error } = await supabase
        .from("loyalty_customers")
        .insert({ full_name, phone, qr_code })
        .select()
        .single();
      if (error) throw error;
      return data as LoyaltyCustomer;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loyalty-customers"] });
      toast({ title: "Müşteri eklendi ✓" });
    },
    onError: (err: any) => {
      toast({ title: "Hata", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateLoyaltyCustomer() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LoyaltyCustomer> & { id: string }) => {
      const { data, error } = await supabase
        .from("loyalty_customers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loyalty-customers"] });
      toast({ title: "Müşteri güncellendi ✓" });
    },
    onError: (err: any) => {
      toast({ title: "Hata", description: err.message, variant: "destructive" });
    },
  });
}

// --- Point Rules ---
export function useLoyaltyPointRules() {
  return useQuery({
    queryKey: ["loyalty-point-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loyalty_point_rules")
        .select("*, product:products(id, name, barcode)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as LoyaltyPointRule[];
    },
  });
}

export function useCreatePointRule() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (rule: Omit<LoyaltyPointRule, "id" | "created_at" | "product">) => {
      const { data, error } = await supabase
        .from("loyalty_point_rules")
        .insert(rule)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loyalty-point-rules"] });
      toast({ title: "Puan kuralı eklendi ✓" });
    },
    onError: (err: any) => {
      toast({ title: "Hata", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdatePointRule() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LoyaltyPointRule> & { id: string }) => {
      const { product, ...rest } = updates as any;
      const { data, error } = await supabase
        .from("loyalty_point_rules")
        .update(rest)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loyalty-point-rules"] });
      toast({ title: "Kural güncellendi ✓" });
    },
    onError: (err: any) => {
      toast({ title: "Hata", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeletePointRule() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("loyalty_point_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loyalty-point-rules"] });
      toast({ title: "Kural silindi ✓" });
    },
    onError: (err: any) => {
      toast({ title: "Hata", description: err.message, variant: "destructive" });
    },
  });
}

// --- Transactions ---
export function useLoyaltyTransactions(customerId?: string) {
  return useQuery({
    queryKey: ["loyalty-transactions", customerId],
    enabled: !!customerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loyalty_transactions")
        .select("*")
        .eq("customer_id", customerId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as LoyaltyTransaction[];
    },
  });
}

// --- Points Calculation ---
export function calculateEarnedPoints(
  cartItems: CartItem[],
  rules: LoyaltyPointRule[],
  saleTotal: number
): { totalPoints: number; breakdown: { ruleName: string; points: number }[] } {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const dayName = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][today.getDay()];

  const activeRules = rules.filter(
    (r) => r.is_active && r.start_date <= todayStr && r.end_date >= todayStr
  );

  const breakdown: { ruleName: string; points: number }[] = [];

  for (const rule of activeRules) {
    if (rule.type === "genel") {
      // points_per_tl = "her X TL", bonus_points = "Y puan"
      const threshold = Number(rule.points_per_tl) || 1;
      const pts = Math.floor(saleTotal / threshold) * rule.bonus_points;
      if (pts > 0) breakdown.push({ ruleName: rule.name, points: pts });
    }

    if (rule.type === "urun" && rule.product_id) {
      const cartItem = cartItems.find((i) => i.productId === rule.product_id);
      if (cartItem && cartItem.quantity >= rule.min_quantity) {
        const multiplier = Math.floor(cartItem.quantity / rule.min_quantity);
        breakdown.push({ ruleName: rule.name, points: rule.bonus_points * multiplier });
      }
    }

    if (rule.type === "ozel_gun" && rule.product_id && rule.valid_days) {
      if (rule.valid_days.includes(dayName)) {
        const cartItem = cartItems.find((i) => i.productId === rule.product_id);
        if (cartItem && cartItem.quantity >= rule.min_quantity) {
          const multiplier = Math.floor(cartItem.quantity / rule.min_quantity);
          breakdown.push({ ruleName: rule.name, points: rule.bonus_points * multiplier });
        }
      }
    }
  }

  return {
    totalPoints: breakdown.reduce((s, b) => s + b.points, 0),
    breakdown,
  };
}

// --- OTP ---
export function useSendOtp() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ phone, purpose }: { phone: string; purpose: "login" | "redeem" }) => {
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { phone, purpose },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onError: (err: any) => {
      toast({ title: "OTP Hatası", description: err.message, variant: "destructive" });
    },
  });
}

export function useVerifyOtp() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ phone, code, purpose }: { phone: string; code: string; purpose: "login" | "redeem" }) => {
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: { phone, code, purpose },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { verified: boolean; customer: LoyaltyCustomer; purpose: string };
    },
    onError: (err: any) => {
      toast({ title: "Doğrulama Hatası", description: err.message, variant: "destructive" });
    },
  });
}

// --- Earn & Redeem Points ---
export function useEarnPoints() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      customerId,
      saleId,
      points,
      description,
      saleTotal,
    }: {
      customerId: string;
      saleId: string;
      points: number;
      description: string;
      saleTotal: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      // Insert transaction
      await supabase.from("loyalty_transactions").insert({
        customer_id: customerId,
        sale_id: saleId,
        type: "earn",
        points,
        description,
        created_by: user?.id,
      });

      // Update customer stats
      const { data: customer } = await supabase
        .from("loyalty_customers")
        .select("total_points, total_spent, total_visits")
        .eq("id", customerId)
        .single();

      if (customer) {
        await supabase
          .from("loyalty_customers")
          .update({
            total_points: customer.total_points + points,
            total_spent: Number(customer.total_spent) + saleTotal,
            total_visits: customer.total_visits + 1,
          })
          .eq("id", customerId);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loyalty-customers"] });
      qc.invalidateQueries({ queryKey: ["loyalty-transactions"] });
    },
  });
}

export function useRedeemPoints() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      customerId,
      points,
      description,
    }: {
      customerId: string;
      points: number;
      description: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from("loyalty_transactions").insert({
        customer_id: customerId,
        type: "redeem",
        points,
        description,
        created_by: user?.id,
      });

      const { data: customer } = await supabase
        .from("loyalty_customers")
        .select("total_points")
        .eq("id", customerId)
        .single();

      if (customer) {
        await supabase
          .from("loyalty_customers")
          .update({ total_points: Math.max(0, customer.total_points - points) })
          .eq("id", customerId);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loyalty-customers"] });
      qc.invalidateQueries({ queryKey: ["loyalty-transactions"] });
      toast({ title: "Puan harcandı ✓" });
    },
    onError: (err: any) => {
      toast({ title: "Hata", description: err.message, variant: "destructive" });
    },
  });
}
