// sso-generate — mints a one-time token that carries the caller's Supabase
// session to another 20FIT subdomain. Called by the ORIGIN product (user already
// signed in) right before redirecting to the destination.
//   Auth:  Authorization: Bearer <user access_token>
//   Body:  { redirect_to: "<destination host>", refresh_token: "<user refresh_token>" }
//   Out:   { token }  -> origin redirects to https://<dest>/...?sso_token=<token>
// Stores (access_token, refresh_token, redirect_to) in sso_tokens (service role).
// refresh_token comes from the CLIENT body: a server-side getSession() is empty, so
// that is the only correct source. ALLOWED_HOSTS MUST stay identical to sso-consume.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ALLOWED_HOSTS = new Set([
  "20fit.id", "www.20fit.id", "my.20fit.id", "recipe.20fit.id", "recepie.20fit.id",
  "calorietracker.20fit.id", "medicalscanner.20fit.id", "media.20fit.id",
  "workout.20fit.id", "photo.20fit.id", "ticket.20fit.id", "talent.20fit.id",
  "shop.20fit.id", "clinic.20fit.id", "arena.20fit.id",
]);

function hostOf(v: string): string | null {
  try { return new URL(v.includes("://") ? v : `https://${v}`).hostname; } catch { return null; }
}
function originAllowed(origin: string | null): boolean {
  if (!origin) return false;
  try { return ALLOWED_HOSTS.has(new URL(origin).hostname); } catch { return false; }
}
function corsHeaders(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": originAllowed(origin) ? origin! : "null",
    "Access-Control-Allow-Headers": "authorization, content-type, apikey",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}
function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } });
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(origin) });
  if (!originAllowed(origin)) return json({ error: "Origin not allowed" }, 403, origin);
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const bearer = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
    if (!bearer) return json({ error: "Not authenticated" }, 401, origin);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${bearer}` } },
    });
    const { data: ures, error: uerr } = await userClient.auth.getUser();
    if (uerr || !ures?.user) return json({ error: "Not authenticated" }, 401, origin);

    const body = await req.json().catch(() => ({}));
    const targetHost = hostOf(String(body?.redirect_to || ""));
    if (!targetHost || !ALLOWED_HOSTS.has(targetHost)) return json({ error: "Invalid redirect target" }, 400, origin);
    const refresh_token = String(body?.refresh_token || "").trim();
    if (!refresh_token) return json({ error: "refresh_token required" }, 400, origin);

    const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { error: insErr } = await admin.from("sso_tokens").insert({
      token,
      user_id: ures.user.id,
      access_token: bearer,
      refresh_token,
      redirect_to: targetHost,
      created_from_ip: (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || null,
    });
    if (insErr) return json({ error: "Internal error" }, 500, origin);
    return json({ token }, 200, origin);
  } catch (_e) {
    return json({ error: "Internal error" }, 500, origin);
  }
});
