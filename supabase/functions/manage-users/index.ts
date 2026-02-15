import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { action, ...payload } = body;

    // Auth check
    const authHeader = req.headers.get("Authorization");
    let isAuthenticated = false;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseAdmin.auth.getUser(token);
      isAuthenticated = !!data?.user;
    }

    // Bootstrap: allow creating first user when no users exist
    if (!isAuthenticated && action === "create") {
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      if (existingUsers?.users && existingUsers.users.length === 0) {
        // Allow bootstrap
      } else {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else if (!isAuthenticated) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create") {
      const { email, password, full_name, phone } = payload;

      const { data: userData, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name },
        });

      if (createError) throw createError;

      if (userData.user) {
        await supabaseAdmin
          .from("profiles")
          .update({ phone, full_name })
          .eq("user_id", userData.user.id);
      }

      return new Response(JSON.stringify({ user: userData.user }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "list") {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
      const emailMap = new Map(
        authUsers?.users?.map((u) => [u.id, u.email]) || []
      );

      const enriched = (data || []).map((p) => ({
        ...p,
        email: emailMap.get(p.user_id) || "",
      }));

      return new Response(JSON.stringify({ users: enriched }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update") {
      const { user_id, email, password, full_name, phone, is_active } = payload;

      const authUpdate: Record<string, unknown> = {};
      if (email) authUpdate.email = email;
      if (password) authUpdate.password = password;

      if (Object.keys(authUpdate).length > 0) {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, authUpdate);
        if (error) throw error;
      }

      const profileUpdate: Record<string, unknown> = {};
      if (full_name !== undefined) profileUpdate.full_name = full_name;
      if (phone !== undefined) profileUpdate.phone = phone;
      if (is_active !== undefined) profileUpdate.is_active = is_active;

      if (Object.keys(profileUpdate).length > 0) {
        const { error } = await supabaseAdmin
          .from("profiles")
          .update(profileUpdate)
          .eq("user_id", user_id);
        if (error) throw error;
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const { user_id } = payload;
      const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
