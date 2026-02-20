import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface CashSession {
  id: string;
  opened_by: string;
  opened_at: string;
  opening_amount: number;
  closed_at: string | null;
  closing_amount: number | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export function useActiveCashSession() {
  return useQuery({
    queryKey: ["cash-session-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cash_register_sessions")
        .select("*")
        .eq("status", "open")
        .order("opened_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as CashSession | null;
    },
  });
}

export function useCashSessions(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["cash-sessions", startDate, endDate],
    queryFn: async () => {
      let q = supabase
        .from("cash_register_sessions")
        .select("*")
        .order("opened_at", { ascending: false });
      if (startDate) q = q.gte("opened_at", startDate);
      if (endDate) q = q.lte("opened_at", endDate);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as CashSession[];
    },
    enabled: !!startDate,
  });
}

export function useOpenCashSession() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ openingAmount, notes }: { openingAmount: number; notes?: string }) => {
      const { data, error } = await supabase
        .from("cash_register_sessions")
        .insert({
          opened_by: user?.id,
          opening_amount: openingAmount,
          notes: notes || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cash-session-active"] });
      qc.invalidateQueries({ queryKey: ["cash-sessions"] });
    },
  });
}

export function useCloseCashSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, closingAmount, notes }: { sessionId: string; closingAmount?: number; notes?: string }) => {
      const { data, error } = await supabase
        .from("cash_register_sessions")
        .update({
          status: "closed",
          closed_at: new Date().toISOString(),
          closing_amount: closingAmount ?? null,
          notes: notes || null,
        })
        .eq("id", sessionId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cash-session-active"] });
      qc.invalidateQueries({ queryKey: ["cash-sessions"] });
    },
  });
}
