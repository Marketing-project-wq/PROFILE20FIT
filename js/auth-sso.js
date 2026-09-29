/* auth-sso.js — SSO 20FIT lintas subdomain (drop-in, tanpa bundler/framework).
 *
 * PASANG DI SUBDOMAIN 20FIT LAIN (yang pakai Supabase Auth) dengan SATU baris:
 *     <script src="https://my.20fit.id/js/auth-sso.js" defer></script>
 * atau host sendiri kopi file ini. Aman di Webflow/no-code: dia me-load supabase-js
 * dari CDN kalau window.supabase belum ada.
 *
 * OTOMATIS saat load: kalau URL punya ?sso_token=… → tukar jadi sesi (consume) → setSession
 * lokal → bersihkan token dari URL. Jadi user yang datang dari produk lain langsung login.
 *
 * API (window.SSO20fit):
 *   ready               Promise — resolve setelah client siap + sso_token (kalau ada) diproses.
 *   supabase            client Supabase (anon key publik).
 *   getSessionSilent()  → session | null (tanpa redirect).
 *   checkAuthOrRedirect() → user | null (redirect ke hub login kalau belum login).
 *   navigateWithSSO(url)  pindah ke produk 20FIT lain SAMBIL membawa sesi (WAJIB dipakai
 *                         di klik menu app-switcher; BUKAN window.location.href biasa).
 *   logoutEverywhere()    signOut lokal + balik ke hub login.
 *
 * CATATAN: talent.20fit.id TIDAK memakai SSO ini (auth-nya bukan Supabase) — navigasi ke
 * talent = redirect biasa (di-handle universal-nav lewat flag noSso).
 */
(function () {
  "use strict";
  if (window.SSO20fit) return; // idempoten

  var SUPABASE_URL = "https://cpvzwqptzcxnwzfzgrmt.supabase.co";
  // Anon key PUBLIK (role=anon, dilindungi RLS) — aman di client & aman di-commit.
  var SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwdnp3cXB0emN4bnd6Znpncm10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MzE0MzksImV4cCI6MjA5MTIwNzQzOX0.DIP-tTFxa3GHMhT6b1Tq-Zz0a24P-vbU9ixEtITbqpI";
  var AUTH_HUB = "https://my.20fit.id";
  var LOGIN_PATH = "/login"; // hub login my.20fit (menerima ?redirect=<url tujuan>)
  var FN = SUPABASE_URL + "/functions/v1";

  // Host yang TIDAK ikut SSO Supabase (auth beda). Navigasi ke sini = redirect biasa.
  var NO_SSO = { "talent.20fit.id": 1 };

  function hostOf(u) { try { return new URL(u).hostname.toLowerCase(); } catch (e) { return null; } }
  function isFit(h) { return !!h && (h === "20fit.id" || /\.20fit\.id$/.test(h)); }

  // Muat supabase-js (UMD → window.supabase) kalau belum ada.
  function ensureSupabase() {
    return new Promise(function (resolve, reject) {
      if (window.supabase && window.supabase.createClient) return resolve(window.supabase);
      var s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
      s.async = true;
      s.onload = function () {
        if (window.supabase && window.supabase.createClient) resolve(window.supabase);
        else reject(new Error("supabase-js load failed"));
      };
      s.onerror = function () { reject(new Error("supabase-js load error")); };
      document.head.appendChild(s);
    });
  }

  var client = null;

  async function consume(token) {
    try {
      var r = await fetch(FN + "/sso-consume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token }),
      });
      if (!r.ok) return null;
      var j = await r.json();
      if (!j || !j.access_token || !j.refresh_token) return null;
      var res = await client.auth.setSession({ access_token: j.access_token, refresh_token: j.refresh_token });
      return (res && res.data && res.data.session) || null;
    } catch (e) { return null; }
  }

  // Proses ?sso_token= (kalau ada) lalu bersihkan URL.
  async function handleIncomingToken() {
    var params, token;
    try { params = new URLSearchParams(location.search); token = params.get("sso_token"); } catch (e) { token = null; }
    if (!token) return null;
    var session = await consume(token);
    try {
      params.delete("sso_token");
      var qs = params.toString();
      history.replaceState({}, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
    } catch (e) { /* biarkan */ }
    return session;
  }

  var ready = (async function init() {
    var sb = await ensureSupabase();
    client = sb.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    });
    var session = await handleIncomingToken();
    try {
      window.dispatchEvent(new CustomEvent("sso20fit:ready", { detail: { session: session || null } }));
    } catch (e) { /* older browsers */ }
    return client;
  })();

  async function getSessionSilent() {
    await ready;
    try { var r = await client.auth.getSession(); return (r && r.data && r.data.session) || null; }
    catch (e) { return null; }
  }

  async function checkAuthOrRedirect() {
    var s = await getSessionSilent();
    if (s) return s.user;
    location.href = AUTH_HUB + LOGIN_PATH + "?redirect=" + encodeURIComponent(location.href);
    return null;
  }

  async function navigateWithSSO(targetUrl) {
    await ready;
    var targetHost = hostOf(targetUrl);
    // Bukan domain 20fit → jangan pernah oper sesi ke luar.
    if (!isFit(targetHost)) { location.href = targetUrl; return; }
    // Host yang bukan Supabase (talent) → redirect biasa.
    if (NO_SSO[targetHost]) { location.href = targetUrl; return; }
    // Sama host → pindah biasa.
    if (targetHost === location.hostname) { location.href = targetUrl; return; }

    var s = await getSessionSilent();
    if (!s) { location.href = AUTH_HUB + LOGIN_PATH + "?redirect=" + encodeURIComponent(targetUrl); return; }

    try {
      var r = await fetch(FN + "/sso-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + s.access_token },
        body: JSON.stringify({ redirect_to: targetHost, refresh_token: s.refresh_token }),
      });
      if (!r.ok) throw new Error("generate failed");
      var j = await r.json();
      if (!j || !j.token) throw new Error("no token");
      var sep = targetUrl.indexOf("?") >= 0 ? "&" : "?";
      location.href = targetUrl + sep + "sso_token=" + encodeURIComponent(j.token);
    } catch (e) {
      location.href = targetUrl; // fallback: buka biasa (login ulang di tujuan)
    }
  }

  async function logoutEverywhere() {
    await ready;
    try { await client.auth.signOut(); } catch (e) { /* lanjut */ }
    location.href = AUTH_HUB + LOGIN_PATH + "?action=logout";
  }

  window.SSO20fit = {
    get supabase() { return client; },
    ready: ready,
    getSessionSilent: getSessionSilent,
    checkAuthOrRedirect: checkAuthOrRedirect,
    navigateWithSSO: navigateWithSSO,
    logoutEverywhere: logoutEverywhere,
  };
})();
