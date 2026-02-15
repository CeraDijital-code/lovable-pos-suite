import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type AppRole = "admin" | "kasiyer" | "depocu" | "muhasebe";

export const roleLabels: Record<AppRole, string> = {
  admin: "Yönetici",
  kasiyer: "Kasiyer",
  depocu: "Depocu",
  muhasebe: "Muhasebe",
};

export const roleColors: Record<AppRole, string> = {
  admin: "bg-destructive/10 text-destructive border-destructive/20",
  kasiyer: "bg-primary/10 text-primary border-primary/20",
  depocu: "bg-success/10 text-success border-success/20",
  muhasebe: "bg-info/10 text-info border-info/20",
};

export function useUserRoles(userId?: string) {
  return useQuery({
    queryKey: ["user-roles", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", userId);
      if (error) throw error;
      return data.map((r) => r.role as AppRole);
    },
    enabled: !!userId,
  });
}

export function useAllUserRoles() {
  return useQuery({
    queryKey: ["all-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*");
      if (error) throw error;
      const map = new Map<string, AppRole[]>();
      for (const r of data) {
        const roles = map.get(r.user_id) || [];
        roles.push(r.role as AppRole);
        map.set(r.user_id, roles);
      }
      return map;
    },
  });
}

export function useCurrentUserRoles() {
  return useQuery({
    queryKey: ["current-user-roles"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (error) throw error;
      return data.map((r) => r.role as AppRole);
    },
  });
}

export function useAssignRole() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-user-roles"] });
      qc.invalidateQueries({ queryKey: ["user-roles"] });
      toast({ title: "Rol atandı" });
    },
    onError: (err: any) => {
      const msg = err?.message?.includes("duplicate") ? "Bu rol zaten atanmış!" : "Rol atanamadı.";
      toast({ title: "Hata", description: msg, variant: "destructive" });
    },
  });
}

export function useRemoveRole() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-user-roles"] });
      qc.invalidateQueries({ queryKey: ["user-roles"] });
      toast({ title: "Rol kaldırıldı" });
    },
    onError: () => {
      toast({ title: "Hata", description: "Rol kaldırılamadı.", variant: "destructive" });
    },
  });
}
