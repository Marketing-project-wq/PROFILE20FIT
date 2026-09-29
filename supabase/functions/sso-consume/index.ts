// sso-consume — redeems a one-time token minted by sso-generate for the
// access/refresh token pair it carries, so the destination subdomain can
// call supabase.auth.setSession() and land the user already signed in.
//
// verify_jwt is OFF here on purpose: a visitor arriving with a relay token
// has, by definition, no session (and therefore no JWT) on THIS subdomain
// yet — that's the whole problem this function exists to solve. The token
// itself (a random 72-char one-time secret, never valid twice, dead after
// 60s) is the only credential this endpoint needs or checks.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// MUST stay identical to the copy in sso-generate — a host present in one and
// missing from the other breaks SSO halfway through the hop.
const ALLOWED_HOSTS = new Set([
  "20fit.id", "www.20fit.id", "my.20fit.id", "recipe.20fit.id", "recepie.20fit.id",
  "calorietracker.20fit.id", "medicalscanner.20fit.id", "media.20fit.id",
  "workout.20fit.id", "photo.20fit.id", "ticket.20fit.id", "talent.20fit.id",
  "shop.20fit.id", "clinic.20fit.id", "arena.20fit.id",
]);

function originAllowed(origin: string | null): boolean {
  if (!origin) return false;
  try { return ALLOWED_HOSTS.has(new URL(origin).hostname); } catch { return false; }
}

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": originAllowed(origin) ? origin! : "null",
    "Access-Control-Allow-Headers": "content-type, apikey",
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
    const body = await req.json().catch(() => ({}));
    const token = String(body?.token || "");
    if (!token) return json({ error: "Token required" }, 400, origin);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: row, error } = await admin
      .from("sso_tokens")
      .select("id, access_token, refresh_token, user_id")
      .eq("token", token)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (error || !row) return json({ error: "Invalid or expired token" }, 401, origin);

    // One-time use — mark it spent immediately.
    await admin.from("sso_tokens").update({ used: true }).eq("id", row.id);

    return json({ access_token: row.access_token, refresh_token: row.refresh_token, user_id: row.user_id }, 200, origin);
  } catch (_e) {
    return json({ error: "Internal error" }, 500, origin);
  }
});
