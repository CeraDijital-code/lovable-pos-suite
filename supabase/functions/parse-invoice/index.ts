import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { documentUrl, fileName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const isPdf = fileName?.toLowerCase().endsWith(".pdf");

    const userContent: any[] = [
      {
        type: "text",
        text: `Bu bir tedarikçi irsaliyesi/faturası belgesidir. Lütfen belgeden aşağıdaki bilgileri JSON formatında çıkar:

Her ürün kalemi için:
- product_name: Ürün adı
- barcode: Barkod (varsa)
- quantity: Miktar
- unit_price: Birim fiyat
- tax_rate: KDV oranı (yüzde olarak, örn: 10)
- total: Toplam tutar (KDV hariç)

Yanıtı SADECE aşağıdaki JSON formatında ver, başka bir şey ekleme:
{"items": [{"product_name": "...", "barcode": "...", "quantity": 1, "unit_price": 0, "tax_rate": 0, "total": 0}]}`,
      },
    ];

    if (!isPdf) {
      userContent.push({
        type: "image_url",
        image_url: { url: documentUrl },
      });
    } else {
      userContent[0].text += `\n\nBelge URL: ${documentUrl}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: userContent,
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit aşıldı, lütfen tekrar deneyin." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Kredi yetersiz." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI analiz hatası");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Extract JSON from response
    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = { items: [] };
      }
    } catch {
      console.error("JSON parse error, raw content:", content);
      parsed = { items: [] };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-invoice error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
