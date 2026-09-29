import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ============================================================
// sso-consume — tukar one-time token jadi sesi. Dipanggil produk TUJUAN saat menerima
// ?sso_token=… di URL.
//   Body: { token }
//   Out:  { access_token, refresh_token, user_id }  → klien setSession lokal.
// Validasi + tandai used ATOMIK (update … where used=false and not expired … returning) →
// aman dari balapan / double-use. Service role, RLS bypass. 60 dtk, sekali pakai.
// CORS dibuka untuk *.20fit.id; origin harus cocok dengan redirect_to saat token dibuat.
// ============================================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

function hostOf(v: string): string | null {
  try { return new URL(v).hostname.toLowerCase(); } catch { return null; }
}
function isFit(h: string | null): boolean {
  return !!h && (h === "20fit.id" || h.endsWith(".20fit.id"));
}
function corsFor(origin: string): Record<string, string> {
  const h = hostOf(origin);
  return {
    "Access-Control-Allow-Origin": isFit(h) ? origin : "",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}
function json(body: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin") ?? "";
  const ch = corsFor(origin);
  if (req.method === "OPTIONS") return new Response(null, { headers: ch });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405, ch);
  if (!ch["Access-Control-Allow-Origin"]) return json({ error: "origin_not_allowed" }, 403, ch);
  if (!SUPABASE_URL || !SERVICE_KEY) return json({ error: "server_misconfig" }, 500, ch);

  let token = "";
  try { token = String((await req.json())?.token ?? "").trim(); } catch { /* biarkan kosong */ }
  if (!token) return json({ error: "token_required" }, 400, ch);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  // Ambil + tandai used secara ATOMIK: satu UPDATE ber-filter, returning baris yang kena.
  const { data: rows, error } = await admin
    .from("my20fit_sso_tokens")
    .update({ used: true })
    .eq("token", token)
    .eq("used", false)
    .gt("expires_at", new Date().toISOString())
    .select("access_token, refresh_token, user_id, redirect_to")
    .limit(1);
  if (error) return json({ error: "internal_error" }, 500, ch);
  const row = rows && rows[0];
  if (!row) return json({ error: "invalid_or_expired" }, 401, ch);

  // Token dibuat untuk host tertentu — origin yang meng-consume harus sama.
  const oh = hostOf(origin);
  if (oh && row.redirect_to && oh !== String(row.redirect_to).toLowerCase()) {
    return json({ error: "origin_mismatch" }, 403, ch);
  }

  return json(
    { access_token: row.access_token, refresh_token: row.refresh_token, user_id: row.user_id },
    200, ch,
  );
});
