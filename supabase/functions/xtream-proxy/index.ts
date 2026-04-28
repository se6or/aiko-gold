// Xtream Codes API proxy to avoid CORS issues
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface XtreamReq {
  server: string;
  username: string;
  password: string;
  action?: string;
  params?: Record<string, string | number>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as XtreamReq;
    const { server, username, password, action, params } = body;

    if (!server || !username || !password) {
      return new Response(JSON.stringify({ error: "Missing credentials" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize server URL
    let base = server.trim().replace(/\/+$/, "");
    if (!/^https?:\/\//i.test(base)) base = "http://" + base;

    const url = new URL(`${base}/player_api.php`);
    url.searchParams.set("username", username);
    url.searchParams.set("password", password);
    if (action) url.searchParams.set("action", action);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, String(v));
      }
    }

    const upstream = await fetch(url.toString(), {
      headers: { "User-Agent": "AIKO-GOLD-Player/1.0" },
    });

    if (!upstream.ok) {
      return new Response(
        JSON.stringify({ error: `Upstream ${upstream.status}` }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const text = await upstream.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
