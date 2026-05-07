// Translate text via Lovable AI Gateway. Returns { ar, en }.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Req {
  text: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const { text } = (await req.json()) as Req;
    if (!text || !text.trim()) {
      return new Response(JSON.stringify({ ar: "", en: "" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content:
              'You are a translator. Detect the input language and return BOTH Arabic and English versions of the text. Reply ONLY with strict JSON: {"ar":"...","en":"..."}. Preserve meaning, no extra commentary, no markdown.',
          },
          { role: "user", content: text },
        ],
      }),
    });

    if (res.status === 429 || res.status === 402) {
      return new Response(
        JSON.stringify({ error: "rate_limited" }),
        {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await res.json();
    const content: string =
      data?.choices?.[0]?.message?.content?.toString() ?? "{}";
    let parsed: { ar?: string; en?: string } = {};
    try {
      const m = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(m ? m[0] : content);
    } catch {
      parsed = {};
    }
    return new Response(
      JSON.stringify({ ar: parsed.ar || "", en: parsed.en || "" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
