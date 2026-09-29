import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ============================================================
// sso-generate — buat one-time token pembawa sesi Supabase ke subdomain 20FIT lain.
// Dipanggil produk ASAL (user-nya sudah login) SEBELUM redirect ke produk tujuan.
//   Auth:  Authorization: Bearer <access_token user>
//   Body:  { redirect_to: "<host tujuan>", refresh_token: "<refresh_token sesi user>" }
//   Out:   { token }   → produk asal redirect ke https://<tujuan>/…?sso_token=<token>
// Simpan (access_token, refresh_token, redirect_to) di my20fit_sso_tokens pakai SERVICE
// ROLE (bypass RLS). Token dikonsumsi `sso-consume` di produk tujuan (60 dtk, sekali pakai).
//
// refresh_token DIKIRIM klien di body: getUser() server-side tidak punya sesi lokal, jadi
// getSession() di sini akan kosong — satu-satunya sumber refresh_token yang benar = klien.
// Talent SENGAJA tidak masuk whitelist (auth-nya bukan Supabase → tak bisa consume).
// ============================================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Host *.20fit.id yang memakai Supabase Auth. (talent.20fit.id DIKECUALIKAN.)
const ALLOWED = new Set<string>([
  "20fit.id", "www.20fit.id", "my.20fit.id",
  "recipe.20fit.id", "recepie.20fit.id",
  "calorietracker.20fit.id", "medicalscanner.20fit.id",
  "media.20fit.id", "workout.20fit.id", "photo.20fit.id", "ticket.20fit.id",
]);

function hostOf(v: string): string | null {
  try { return new URL(v.includes("://") ? v : `https://${v}`).hostname.toLowerCase(); }
  catch { return null; }
}
function corsFor(origin: string): Record<string, string> {
  const h = hostOf(origin);
  return {
    "Access-Control-Allow-Origin": h && ALLOWED.has(h) ? origin : "",
    "Access-Control-Allow-Headers": "authorization, content-type",
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
  if (!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY) return json({ error: "server_misconfig" }, 500, ch);

  // Verifikasi user dari access_token yang dibawa klien.
  const bearer = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!bearer) return json({ error: "not_authenticated" }, 401, ch);
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${bearer}` } },
  });
  const { data: ures, error: uerr } = await userClient.auth.getUser();
  if (uerr || !ures?.user) return json({ error: "not_authenticated" }, 401, ch);

  // Target + refresh_token dari body.
  let body: { redirect_to?: string; refresh_token?: string } = {};
  try { body = await req.json(); } catch { /* biarkan default */ }
  const targetHost = hostOf(String(body.redirect_to ?? ""));
  if (!targetHost || !ALLOWED.has(targetHost)) return json({ error: "invalid_redirect" }, 400, ch);
  const refresh_token = String(body.refresh_token ?? "").trim();
  if (!refresh_token) return json({ error: "refresh_token_required" }, 400, ch);

  const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const { error: insErr } = await admin.from("my20fit_sso_tokens").insert({
    token,
    user_id: ures.user.id,
    access_token: bearer,
    refresh_token,
    redirect_to: targetHost,
    created_from_ip: (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || null,
  });
  if (insErr) return json({ error: "internal_error" }, 500, ch);
  return json({ token }, 200, ch);
});
