import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, purpose } = await req.json();

    if (!phone || !purpose) {
      return new Response(
        JSON.stringify({ error: "phone and purpose are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!["login", "redeem"].includes(purpose)) {
      return new Response(
        JSON.stringify({ error: "purpose must be 'login' or 'redeem'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if customer exists
    const { data: customer } = await supabase
      .from("loyalty_customers")
      .select("id, full_name, is_active")
      .eq("phone", phone)
      .single();

    if (!customer) {
      return new Response(
        JSON.stringify({ error: "Bu telefon numarasına kayıtlı müşteri bulunamadı" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!customer.is_active) {
      return new Response(
        JSON.stringify({ error: "Bu müşteri hesabı pasif durumda" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Invalidate previous unused OTPs for this phone+purpose
    await supabase
      .from("otp_verifications")
      .update({ verified: true })
      .eq("phone", phone)
      .eq("purpose", purpose)
      .eq("verified", false);

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { error: insertError } = await supabase
      .from("otp_verifications")
      .insert({ phone, code, purpose, expires_at });

    if (insertError) {
      throw insertError;
    }

    // TODO: Send SMS via provider (Twilio, Netgsm, etc.)
    // For now, log the code for development/testing
    console.log(`OTP Code for ${phone} (${purpose}): ${code}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "OTP kodu gönderildi",
        // Include code in response for development/testing only
        // Remove this in production!
        dev_code: code,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-otp error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
