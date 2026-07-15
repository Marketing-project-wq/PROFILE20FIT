// =============================================================
//  20FIT Health Profile — Production Server
//  - Serve frontend statis
//  - API verifikasi OTP sendiri (BUKAN Supabase Auth email)
//  - OTP di-generate, di-hash, disimpan & divalidasi di SERVER
//  - Kirim OTP ke email user via SMTP (terisolasi dari project lain)
// =============================================================

require("dotenv").config();
const express = require("express");
const path = require("path");
const crypto = require("crypto");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const nodemailer = require("nodemailer");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- Konfigurasi (dari environment variable) ----------
// URL & anon key bersifat PUBLIK — boleh ada default di sini supaya frontend
// selalu bisa connect walau env Railway belum diisi. (service key TETAP env-only)
const SUPABASE_URL = process.env.SUPABASE_URL || "https://cpvzwqptzcxnwzfzgrmt.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwdnp3cXB0emN4bnd6Znpncm10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MzE0MzksImV4cCI6MjA5MTIwNzQzOX0.DIP-tTFxa3GHMhT6b1Tq-Zz0a24P-vbU9ixEtITbqpI";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const OTP_TTL_MINUTES = parseInt(process.env.OTP_TTL_MINUTES || "10", 10);

// ---- Meta (Facebook) Pixel + Conversions API ----
// Pixel ID = PUBLIK (memang tampil di web) -> ada default, boleh override via env.
const META_PIXEL_ID = process.env.META_PIXEL_ID || "882946526927316";
// Access token Conversions API = RAHASIA! Server-only, HANYA dari env (tidak ada
// default di kode). Isi di Railway > Variables (jangan pernah commit nilainya).
const META_CAPI_TOKEN = process.env.META_CAPI_ACCESS_TOKEN || "";
const META_CAPI_VERSION = process.env.META_CAPI_VERSION || "v19.0";
const DEV_MASTER_OTP = process.env.DEV_MASTER_OTP || ""; // kosong = nonaktif
const IS_PROD = process.env.NODE_ENV === "production";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("[20FIT] WARNING: SUPABASE_URL / SUPABASE_ANON_KEY belum di-set.");
}
if (!SUPABASE_SERVICE_KEY) {
  console.warn("[20FIT] WARNING: SUPABASE_SERVICE_KEY belum di-set (OTP butuh ini).");
}

// Service client (bypass RLS, hanya di server) untuk operasi OTP
const admin =
  SUPABASE_URL && SUPABASE_SERVICE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

// Client anon untuk verifikasi token JWT user
const anon =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

// ---------- Email (SMTP) ----------
let mailer = null;
if (process.env.SMTP_HOST) {
  mailer = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true", // true utk port 465
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}
const MAIL_FROM = process.env.MAIL_FROM || "20FIT <no-reply@20fit.id>";

async function sendOtpEmail(to, code) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto">
      <h2 style="color:#1db954">Kode Verifikasi 20FIT</h2>
      <p>Halo! Gunakan kode di bawah ini untuk verifikasi email kamu:</p>
      <div style="font-size:32px;font-weight:bold;letter-spacing:8px;
                  background:#eafaf0;padding:16px;text-align:center;border-radius:12px">
        ${code}
      </div>
      <p style="color:#666;font-size:13px">Kode berlaku ${OTP_TTL_MINUTES} menit.
         Abaikan email ini jika kamu tidak mendaftar.</p>
    </div>`;
  if (!mailer) {
    // Mode dev: belum ada SMTP -> log ke console server
    console.log(`[20FIT][DEV] OTP untuk ${to}: ${code}`);
    return { sent: false };
  }
  await mailer.sendMail({ from: MAIL_FROM, to, subject: "Kode Verifikasi 20FIT", html });
  return { sent: true };
}

// ---------- Middleware ----------
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // sebagian gateway kirim webhook form-encoded

const apiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 menit
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", apiLimiter);

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5, // maksimal 5 kirim OTP / 10 menit / IP
  message: { error: "Terlalu banyak permintaan kode. Coba lagi nanti." },
});

// ---------- Helper ----------
function sha256(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

function gen6() {
  return String(crypto.randomInt(100000, 1000000));
}

// Ambil user dari Authorization: Bearer <jwt>
async function getUserFromReq(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token || !anon) return null;
  const { data, error } = await anon.auth.getUser(token);
  if (error) return null;
  return data.user || null;
}

// ---------- API ----------

// Config publik untuk frontend (URL + anon key — keduanya memang publik)
app.get("/api/config", (req, res) => {
  res.json({
    supabaseUrl: SUPABASE_URL || "",
    supabaseAnonKey: SUPABASE_ANON_KEY || "",
    version: "xendit-live-1",
    serviceKeySet: !!SUPABASE_SERVICE_KEY,
    adminKeySet: !!ADMIN_KEY,
    // URL halaman login/authorize 20FIT. Setelah user login di sana, 20FIT harus
    // redirect balik ke my.20fit.id/login.html?token=<access_token>.
    // Diisi lewat env FITCO_SSO_URL dari tim developer.
    fitcoSsoUrl: process.env.FITCO_SSO_URL || "",
    // Client ID Google (PUBLIK — memang tampil di web). Frontend memakainya
    // untuk inisialisasi tombol GIS. Nilainya dari env GOOGLE_CLIENT_ID (satu sumber).
    googleClientId: GOOGLE_CLIENT_ID,
    // Meta Pixel ID (PUBLIK). Access token CAPI TIDAK pernah dikirim ke frontend.
    metaPixelId: META_PIXEL_ID,
    // Pembelian paket scan lewat Xendit (server yang isi kredit via webhook).
    xenditEnabled: XENDIT_ENABLED,
  });
});

// Meta Conversions API (server-side). Frontend mengirim event (dengan event_id
// yang sama dgn Pixel browser) -> server meneruskan ke Graph API pakai access
// token RAHASIA. Email di-hash SHA-256 sebelum dikirim (persyaratan Meta).
app.post("/api/meta/event", async (req, res) => {
  try {
    if (!META_CAPI_TOKEN) return res.json({ ok: false, skipped: "capi_not_configured" });
    const b = req.body || {};
    const name = String(b.event_name || "").trim();
    if (!name) return res.status(400).json({ error: "event_name wajib." });
    const sha256 = (v) => crypto.createHash("sha256").update(String(v).trim().toLowerCase()).digest("hex");
    const ua = String(req.headers["user-agent"] || "");
    const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || (req.socket && req.socket.remoteAddress) || "";
    const user_data = { client_user_agent: ua };
    if (ip) user_data.client_ip_address = ip;
    if (b.email) user_data.em = [sha256(b.email)];
    if (b.fbp) user_data.fbp = b.fbp;
    if (b.fbc) user_data.fbc = b.fbc;
    const payload = {
      data: [{
        event_name: name,
        event_time: Math.floor(Date.now() / 1000),
        event_id: b.event_id || undefined,
        action_source: "website",
        event_source_url: b.event_source_url || undefined,
        user_data: user_data,
        custom_data: b.custom_data || {},
      }],
    };
    const url = "https://graph.facebook.com/" + META_CAPI_VERSION + "/" + META_PIXEL_ID +
      "/events?access_token=" + encodeURIComponent(META_CAPI_TOKEN);
    const fr = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const fj = await fr.json().catch(() => ({}));
    if (!fr.ok) { console.error("meta-capi:", JSON.stringify(fj).slice(0, 300)); return res.status(502).json({ ok: false }); }
    return res.json({ ok: true, events_received: fj.events_received });
  } catch (e) {
    console.error("meta-capi:", e.message);
    return res.status(500).json({ ok: false });
  }
});

// Kirim OTP ke email user yang sedang login
app.post("/api/send-otp", otpLimiter, async (req, res) => {
  try {
    if (!admin) return res.status(500).json({ error: "Server belum dikonfigurasi (service key)." });
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ error: "Belum login." });

    const code = gen6();
    const expires = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();

    // Hapus token lama yang belum dipakai untuk user ini
    await admin.from("email_verification_tokens").delete()
      .eq("auth_user_id", user.id).is("consumed_at", null);

    // Simpan HASH dari OTP (bukan OTP mentah)
    const { error: insErr } = await admin.from("email_verification_tokens").insert({
      auth_user_id: user.id,
      email: user.email,
      token: sha256(code),
      expires_at: expires,
    });
    if (insErr) throw insErr;

    const r = await sendOtpEmail(user.email, code);

    // Di dev (tanpa SMTP) kembalikan kode supaya bisa dites; di produksi TIDAK.
    const payload = { ok: true, sent: r.sent };
    if (!IS_PROD && !r.sent) payload.devCode = code;
    res.json(payload);
  } catch (e) {
    console.error("send-otp:", e.message);
    res.status(500).json({ error: "Gagal mengirim kode." });
  }
});

// Verifikasi OTP
app.post("/api/verify-otp", async (req, res) => {
  try {
    if (!admin) return res.status(500).json({ error: "Server belum dikonfigurasi (service key)." });
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ error: "Belum login." });

    const code = String((req.body && req.body.code) || "").trim();
    if (!/^\d{6}$/.test(code)) return res.status(400).json({ error: "Kode harus 6 digit." });

    // Master code (opsional, untuk testing/admin) — nonaktif jika kosong
    const isMaster = DEV_MASTER_OTP && code === DEV_MASTER_OTP;

    if (!isMaster) {
      const { data: rows, error } = await admin
        .from("email_verification_tokens")
        .select("*")
        .eq("auth_user_id", user.id)
        .eq("token", sha256(code))
        .is("consumed_at", null)
        .gt("expires_at", new Date().toISOString())
        .limit(1);
      if (error) throw error;
      if (!rows || !rows.length) return res.status(400).json({ error: "Kode salah atau kedaluwarsa." });

      await admin.from("email_verification_tokens")
        .update({ consumed_at: new Date().toISOString() })
        .eq("id", rows[0].id);
    }

    // Tandai email terverifikasi di profil (buat baris kalau belum ada)
    const { data: existing } = await admin.from("my20fit_profile")
      .select("id").eq("auth_user_id", user.id).limit(1);
    if (existing && existing.length) {
      await admin.from("my20fit_profile")
        .update({ email_verified_at: new Date().toISOString() })
        .eq("auth_user_id", user.id);
    } else {
      await admin.from("my20fit_profile").insert({
        auth_user_id: user.id,
        email: user.email,
        email_verified_at: new Date().toISOString(),
      });
    }

    res.json({ ok: true });
  } catch (e) {
    console.error("verify-otp:", e.message);
    res.status(500).json({ error: "Gagal memverifikasi kode." });
  }
});

// ---------- Weather & AQI (placeholder Jakarta; ganti dgn API asli nanti) ----------
// TODO: ganti dengan WeatherAPI / IQAir pakai API key di env kalau sudah ada.
app.get("/api/weather", (req, res) => {
  const hour = new Date().getHours();
  const temp = 28 + (hour % 6); // variasi ringan 28-33
  const humid = temp > 31;
  res.json({
    city: req.query.city || "Jakarta",
    temp_c: temp,
    description: humid ? "Berawan · Lembap" : "Cerah Berawan",
    outdoor_ok: temp <= 32,
    suggestions: temp > 32
      ? ["EMS Training · Indoor 20 min", "Swimming · Pool 45 min", "Gym Session · Indoor 60 min"]
      : ["Run · Outdoor 30 min", "Cycling · 45 min", "Gym Session · 60 min"],
  });
});

// AQI dari WAQI (aqicn.org) — stasiun darat. Fallback: Open-Meteo (model), lalu estimasi.
// Token WAQI gratis dari aqicn.org/data-platform/token, taruh di env WAQI_TOKEN.
const WAQI_TOKEN = process.env.WAQI_TOKEN || "";
function aqiMeaning(aqi) {
  if (aqi <= 50) return { label: "Good", advice: "Udara bagus — aman olahraga di luar." };
  if (aqi <= 100) return { label: "Moderate", advice: "Cukup oke; yang sensitif sebaiknya kurangi outdoor." };
  if (aqi <= 150) return { label: "Unhealthy for Sensitive", advice: "Kelompok sensitif sebaiknya olahraga di dalam." };
  if (aqi <= 200) return { label: "Unhealthy", advice: "Sebaiknya olahraga di dalam ruangan." };
  if (aqi <= 300) return { label: "Very Unhealthy", advice: "Hindari aktivitas luar; olahraga indoor." };
  return { label: "Hazardous", advice: "Berbahaya — tetap di dalam ruangan." };
}
app.get("/api/aqi", async (req, res) => {
  const lat = req.query.lat, lon = req.query.lon;
  let aqi = null, source = null, city = req.query.city || "";
  // 1) WAQI (kalau token tersedia & ada koordinat)
  if (WAQI_TOKEN && lat && lon) {
    try {
      const r = await fetch("https://api.waqi.info/feed/geo:" + lat + ";" + lon + "/?token=" + encodeURIComponent(WAQI_TOKEN));
      const j = await r.json();
      if (j && j.status === "ok" && j.data && typeof j.data.aqi === "number") {
        aqi = j.data.aqi; source = "WAQI"; city = (j.data.city && j.data.city.name) || city;
      }
    } catch (e) { /* fallback */ }
  }
  // 2) Fallback Open-Meteo (model global CAMS)
  if (aqi == null && lat && lon) {
    try {
      const r = await fetch("https://air-quality-api.open-meteo.com/v1/air-quality?latitude=" + lat + "&longitude=" + lon + "&current=us_aqi");
      const j = await r.json();
      if (j && j.current && typeof j.current.us_aqi === "number") { aqi = Math.round(j.current.us_aqi); source = "Open-Meteo"; }
    } catch (e) { /* fallback */ }
  }
  // 3) Estimasi terakhir (biar UI tidak kosong)
  if (aqi == null) { const h = new Date().getHours(); aqi = 70 + (h % 5) * 12; source = "estimate"; }
  const m = aqiMeaning(aqi);
  res.json({ city: city || "—", aqi: aqi, label: m.label, advice: m.advice, source: source });
});

// ---------- Login pakai akun 20FIT (FITCO) -> jembatan ke akun Supabase ----------
// Verifikasi email+password ke API FITCO. Kalau benar: siapkan akun Supabase
// yang sama (by email) + balikin OTP untuk membuat sesi. Data user tersimpan
// permanen di database kita (Supabase) & nempel tiap login ulang.
const FITCO_API = process.env.FITCO_API_URL || "https://api.20fit.id";
// Endpoint login 20FIT (dari dokumentasi resmi "Login by Email"):
//   POST {api_url}/api/v1/auth/login  body {email,password,login_source:"app"}
//   -> response: data.token.access_token. Bisa dioverride via env bila berubah.
const FITCO_LOGIN_PATH = process.env.FITCO_LOGIN_PATH || "/api/v1/auth/login";
// Endpoint login Google (dari dokumentasi resmi "Login by Google"):
//   POST {api_url}/api/v1/auth/login/google  body {name,email,access_token,google_auth_id}
const FITCO_GOOGLE_LOGIN_PATH = process.env.FITCO_GOOGLE_LOGIN_PATH || "/api/v1/auth/login/google";

// ---------- Xendit Payment Gateway (SEMUA nilai RAHASIA -> hanya dari env) ----------
// Base URL publik & tetap (https://api.xendit.co). TEST vs LIVE ditentukan oleh jenis
// Secret Key: xnd_development_* = test/sandbox, xnd_production_* = live. Jadi tidak ada
// URL sandbox terpisah — cukup ganti Secret Key di env.
// Secret Key & Webhook Verification Token TIDAK boleh ditulis di kode — set di Railway env.
// Baca env dari beberapa kemungkinan nama (biar cocok walau dinamai berbeda di Railway).
function envAny() {
  for (let i = 0; i < arguments.length; i++) {
    const v = process.env[arguments[i]];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}
const XENDIT_BASE_URL = envAny("XENDIT_BASE_URL") || "https://api.xendit.co";
// Secret Key (Basic auth). Nama env alternatif didukung biar fleksibel di Railway.
const XENDIT_SECRET_KEY = envAny("XENDIT_SECRET_KEY", "XENDIT_API_KEY", "XENDIT_SECRETKEY", "XENDIT_SECRET");
// Webhook/Callback Verification Token dari dashboard Xendit (header x-callback-token).
const XENDIT_WEBHOOK_TOKEN = envAny("XENDIT_WEBHOOK_TOKEN", "XENDIT_CALLBACK_TOKEN", "XENDIT_WEBHOOK_VERIFICATION_TOKEN");
// "1" = tandai Xendit aktif di /api/config (info untuk frontend). Pembayaran paket scan
// selalu lewat Xendit (Invoice API).
const XENDIT_ENABLED = process.env.XENDIT_ENABLED === "1";
// Base publik untuk redirect balik setelah bayar.
const XENDIT_REDIRECT_BASE = process.env.XENDIT_REDIRECT_BASE || "https://my.20fit.id";
// Endpoint Create Invoice (Invoice API v2). Bisa dioverride via env kalau berubah.
const XENDIT_INVOICE_PATH = process.env.XENDIT_INVOICE_PATH || "/v2/invoices";

// ---------- Katalog paket scan (server-authoritative) ----------
// Sumber kebenaran harga & jumlah kredit ada di SERVER, bukan client. /api/scan/buy
// hanya menerima package_id; server yang menentukan credits & price dari sini.
// package_id = product_id dari sistem retail 20FIT (FITCO). HARUS sama persis dengan
// SCAN_PACKS di js/deals.js (yang kini dipakai hanya untuk tampilan UI).
const SCAN_PACKAGES = {
  8477: { credits: 10,  price: 25000  },
  8478: { credits: 50,  price: 75000  },
  8479: { credits: 150, price: 150000 },
};

// ---------- Login Google via Google Identity Services (GIS) ----------
// Frontend memakai tombol Google resmi (SDK GIS) untuk mendapatkan ID token,
// lalu mengirimnya ke POST /api/fitco-google-login (diteruskan ke API 20FIT
// /api/v1/auth/login/google). Yang perlu di server hanyalah GOOGLE_CLIENT_ID
// (nilai PUBLIK — memang tampil di web). Tidak perlu Client Secret / Redirect URI.
//
// Nilai diambil dari env GOOGLE_CLIENT_ID (bisa beda per environment: local /
// staging / production). Ada DEFAULT publik (Client ID web app 20FIT) supaya
// tombol Google SELALU tampil walau env belum diisi — pola yang sama dengan
// Supabase URL/anon key yang juga punya default publik di kode. Client ID
// bersifat PUBLIK (bukan secret). Frontend mengambilnya lewat GET /api/config
// (satu sumber). Untuk override, set env GOOGLE_CLIENT_ID di Railway.
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ||
  "26509397037-8d1s0c39hb31738fcl816b8jrv7fdt6i.apps.googleusercontent.com";
// Ambil profil user dari 20FIT pakai access_token (Bearer). Return field yg kita pakai.
async function fetch20fitProfile(fitcoToken) {
  const out = { email: null, fullName: null, gender: null, phone: null, avatar: null, birthdate: null, fitcoUserId: null };
  const pr = await fetch(FITCO_API + "/api/v1/app/user/profile", { headers: { Authorization: "Bearer " + fitcoToken } });
  if (!pr.ok) { const err = new Error("Token 20FIT tidak valid."); err.status = 401; throw err; }
  const pj = await pr.json().catch(() => ({}));
  const u = (pj && (pj.data || pj)) || {};
  out.email = u.email ? String(u.email).trim().toLowerCase() : null;
  out.fullName = u.name || u.full_name || u.fullname || null;
  out.gender = u.gender ? String(u.gender).toLowerCase() : null;
  out.phone = u.phone || u.phone_number || null;
  out.avatar = u.profile_photo || u.avatar || u.photo || u.avatar_url || null;
  out.birthdate = u.date_of_birth || u.birthdate || u.dob || null;
  out.fitcoUserId = u.user_id || u.id || null;
  return out;
}

// Pastikan akun Supabase ADA untuk email 20FIT, tandai via_20fit (skip set-password),
// prefill profil (hanya kolom kosong), lalu balikan OTP untuk membuat sesi.
async function mirrorAndMintOtp(info) {
  const email = String(info.email || "").trim().toLowerCase();
  if (!email) { const e = new Error("Email tidak ditemukan."); e.status = 401; throw e; }
  try {
    await admin.auth.admin.createUser({ email, email_confirm: true, user_metadata: { full_name: info.fullName || null, has_pw: true, via_20fit: true } });
  } catch (e) { /* sudah ada -> abaikan */ }
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (linkErr) throw linkErr;
  try {
    const uid0 = linkData && linkData.user && linkData.user.id;
    const md0 = (linkData && linkData.user && linkData.user.user_metadata) || {};
    if (uid0 && !md0.has_pw) {
      await admin.auth.admin.updateUserById(uid0, { user_metadata: Object.assign({}, md0, { has_pw: true, via_20fit: true }) });
    }
  } catch (e) { /* non-fatal */ }
  const props = (linkData && linkData.properties) || {};
  const otp = props.email_otp || null;
  if (!otp) { const e = new Error("Gagal menyiapkan sesi. Coba lagi."); e.status = 500; throw e; }
  // Prefill profil (hanya kolom yg masih kosong)
  try {
    const uid = linkData && linkData.user && linkData.user.id;
    if (uid) {
      let existing = {};
      try {
        const { data: exRows } = await admin.from("my20fit_profile")
          .select("full_name,gender,phone,avatar_url,age").eq("auth_user_id", uid).limit(1);
        existing = (exRows && exRows[0]) || {};
      } catch (e) {}
      const row = { auth_user_id: uid, email, updated_at: new Date().toISOString() };
      if (info.fullName && !existing.full_name) row.full_name = info.fullName;
      if ((info.gender === "male" || info.gender === "female") && !existing.gender) row.gender = info.gender;
      if (info.phone && !existing.phone) row.phone = info.phone;
      if (info.avatar && !existing.avatar_url) row.avatar_url = info.avatar;
      if (info.birthdate && !existing.age) {
        const b = new Date(info.birthdate), t = new Date();
        let age = t.getFullYear() - b.getFullYear();
        const m = t.getMonth() - b.getMonth();
        if (m < 0 || (m === 0 && t.getDate() < b.getDate())) age--;
        if (age > 0 && age < 120) row.age = age;
      }
      // Ikat akun 20FIT (FITCO) ke profil ini — hanya kalau info memang membawa
      // fitco_user_id (dari login/register/token-login 20FIT). Jangan overwrite
      // jadi null kalau flow pemanggil tidak punya data ini.
      if (info.fitcoUserId) {
        row.fitco_user_id = String(info.fitcoUserId);
        row.fitco_linked_at = new Date().toISOString();
      }
      // Status verifikasi email 20FIT — tri-state: true (login/token-login
      // berhasil = bukti implisit akun sudah verified), false (baru saja
      // register, 20FIT wajibkan verifikasi OTP dulu), atau tidak di-set sama
      // sekali kalau info.fitcoEmailVerified === undefined (flow pemanggil
      // tidak punya info ini) -> jangan sentuh kolomnya di DB supaya status
      // yang sudah ada tidak ke-overwrite jadi null tanpa sengaja.
      if (info.fitcoEmailVerified === true || info.fitcoEmailVerified === false) {
        row.fitco_email_verified = info.fitcoEmailVerified;
      }
      await admin.from("my20fit_profile").upsert(row, { onConflict: "auth_user_id" });
    }
  } catch (e) { /* non-fatal */ }
  return { email, email_otp: otp };
}

// Login pakai email+password akun 20FIT (verifikasi ke API 20FIT).
app.post("/api/fitco-login", async (req, res) => {
  try {
    if (!admin) return res.status(500).json({ error: "Server belum dikonfigurasi (service key)." });
    const email = String((req.body && req.body.email) || "").trim().toLowerCase();
    const password = String((req.body && req.body.password) || "");
    if (!email || !password) return res.status(400).json({ error: "Email & password wajib diisi." });

    // 1) Verifikasi ke API 20FIT
    let fj = {};
    try {
      const fr = await fetch(FITCO_API + FITCO_LOGIN_PATH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, login_source: "app" }),
      });
      fj = await fr.json().catch(() => ({}));
      if (!fr.ok) return res.status(401).json({ error: "Email atau password akun 20FIT salah." });
    } catch (e) {
      return res.status(502).json({ error: "Tidak bisa menghubungi server 20FIT. Coba lagi." });
    }
    const fd = (fj && fj.data) || fj || {};
    const fitcoToken =
      fj.access_token || fd.access_token ||
      (fd.token && (fd.token.access_token || (typeof fd.token === "string" ? fd.token : null))) || null;
    if (!fitcoToken) return res.status(401).json({ error: "Login 20FIT gagal (token tidak diterima)." });
    let fitcoUserId = fd.user_id || fd.id || null;

    // 2) Ambil profil (best effort), lengkapi dari data login
    let info = { email, fullName: fd.name || fd.full_name || null, gender: fd.gender ? String(fd.gender).toLowerCase() : null, phone: fd.phone || fd.phone_number || null, avatar: null, birthdate: fd.date_of_birth || fd.birthdate || fd.dob || null };
    try {
      const p = await fetch20fitProfile(fitcoToken);
      info = { email: p.email || email, fullName: p.fullName || info.fullName, gender: p.gender || info.gender, phone: p.phone || info.phone, avatar: p.avatar, birthdate: p.birthdate };
      fitcoUserId = p.fitcoUserId || fitcoUserId;
    } catch (e) { /* non-fatal, pakai data login */ }

    info.fitcoUserId = fitcoUserId;
    // Login ke 20FIT di atas berhasil (fitcoToken didapat) = bukti implisit akun
    // sudah verified — 20FIT sendiri menolak login akun yang belum verifikasi email.
    info.fitcoEmailVerified = true;
    const out = await mirrorAndMintOtp(info);
    // Kirim user_id + token 20FIT ke client (dipakai untuk order/pembayaran shop 20FIT).
    return res.json({ ok: true, email: out.email, email_otp: out.email_otp, fitco_user_id: fitcoUserId, fitco_token: fitcoToken });
  } catch (e) {
    console.error("fitco-login:", e.message);
    return res.status(e.status || 500).json({ error: e.status ? e.message : "Gagal login. Coba lagi." });
  }
});

// Login pakai akun GOOGLE via API 20FIT (dokumentasi developer "Login by Google").
// Frontend mengirim ID token dari Google Identity Services. Identitas (email/nama/
// google_auth_id) diambil server dari payload token itu — bukan dari input bebas
// client — lalu API 20FIT yang memverifikasi keaslian token ke Google.
// Decode payload JWT (base64url) tanpa verifikasi tanda tangan.
function decodeJwtPayload(jwt) {
  try {
    const part = String(jwt).split(".")[1] || "";
    return JSON.parse(Buffer.from(part.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
  } catch (e) { return {}; }
}

// Jembatan bersama: klaim Google (email/nama/sub) + ID token → verifikasi ke API
// 20FIT, mirror akun Supabase, mint OTP sesi. Dipakai oleh flow GIS (POST) & OAuth.
async function bridgeGoogleToSession(claims, idToken) {
  const email = String((claims && claims.email) || "").trim().toLowerCase();
  const gname = (claims && (claims.name || [claims.given_name, claims.family_name].filter(Boolean).join(" "))) || null;
  const gsub = claims && claims.sub ? String(claims.sub) : null;
  if (!email || !gsub) { const e = new Error("Google credential tidak valid."); e.status = 400; throw e; }

  let fj = {};
  try {
    const fr = await fetch(FITCO_API + FITCO_GOOGLE_LOGIN_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: gname, email, access_token: idToken, google_auth_id: gsub }),
    });
    fj = await fr.json().catch(() => ({}));
    if (!fr.ok) { const e = new Error("Login Google ditolak 20FIT. Pastikan email Google ini terdaftar sebagai akun 20FIT."); e.status = 401; throw e; }
  } catch (e) {
    if (e && e.status) throw e;
    const err = new Error("Tidak bisa menghubungi server 20FIT. Coba lagi."); err.status = 502; throw err;
  }
  const fd = (fj && fj.data) || fj || {};
  const fitcoToken =
    fj.access_token || fd.access_token ||
    (fd.token && (fd.token.access_token || (typeof fd.token === "string" ? fd.token : null))) || null;
  if (!fitcoToken) { const e = new Error("Login Google 20FIT gagal (token tidak diterima)."); e.status = 401; throw e; }
  let fitcoUserId = fd.user_id || fd.id || null;

  let info = { email, fullName: fd.name || fd.full_name || gname, gender: fd.gender ? String(fd.gender).toLowerCase() : null, phone: fd.phone || fd.phone_number || null, avatar: (claims && claims.picture) || null, birthdate: fd.date_of_birth || fd.birthdate || fd.dob || null };
  try {
    const p = await fetch20fitProfile(fitcoToken);
    info = { email: p.email || email, fullName: p.fullName || info.fullName, gender: p.gender || info.gender, phone: p.phone || info.phone, avatar: p.avatar || info.avatar, birthdate: p.birthdate || info.birthdate };
    fitcoUserId = p.fitcoUserId || fitcoUserId;
  } catch (e) { /* non-fatal, pakai data login */ }

  info.fitcoUserId = fitcoUserId;
  info.fitcoEmailVerified = true; // login Google diterima 20FIT + email diverifikasi Google
  const out = await mirrorAndMintOtp(info);
  return { email: out.email, email_otp: out.email_otp, fitco_user_id: fitcoUserId, fitco_token: fitcoToken };
}

// Login Google (GIS): frontend kirim ID token (credential) via POST, server
// meneruskan ke API 20FIT /api/v1/auth/login/google lalu membuat sesi.
app.post("/api/fitco-google-login", async (req, res) => {
  try {
    if (!admin) return res.status(500).json({ error: "Server belum dikonfigurasi (service key)." });
    const credential = String((req.body && req.body.credential) || "").trim();
    if (!credential) return res.status(400).json({ error: "Google credential wajib." });
    const out = await bridgeGoogleToSession(decodeJwtPayload(credential), credential);
    return res.json({ ok: true, email: out.email, email_otp: out.email_otp, fitco_user_id: out.fitco_user_id, fitco_token: out.fitco_token });
  } catch (e) {
    console.error("fitco-google-login:", e.message);
    return res.status(e.status || 500).json({ error: e.status ? e.message : "Gagal login. Coba lagi." });
  }
});

// SSO SEAMLESS: login pakai access_token 20FIT yang SUDAH ADA (dioper dari app utama).
// Token divalidasi ke 20FIT (ambil profil), lalu dibuatkan sesi — TANPA password.
app.post("/api/fitco-token-login", async (req, res) => {
  try {
    if (!admin) return res.status(500).json({ error: "Server belum dikonfigurasi (service key)." });
    const fitcoToken = String((req.body && (req.body.token || req.body.access_token)) || "").trim();
    if (!fitcoToken) return res.status(400).json({ error: "Token 20FIT wajib." });
    let info;
    try {
      info = await fetch20fitProfile(fitcoToken);
    } catch (e) {
      if (e && e.status === 401) return res.status(401).json({ error: "Token 20FIT tidak valid / kedaluwarsa." });
      return res.status(502).json({ error: "Tidak bisa menghubungi server 20FIT. Coba lagi." });
    }
    if (!info.email) return res.status(401).json({ error: "Token 20FIT tidak berisi email." });
    // fetch20fitProfile() di atas berhasil (tidak throw) = token 20FIT valid =
    // bukti implisit akun sudah verified — sama alasannya dgn fitco-login.
    info.fitcoEmailVerified = true;
    const out = await mirrorAndMintOtp(info);
    return res.json({ ok: true, email: out.email, email_otp: out.email_otp });
  } catch (e) {
    console.error("fitco-token-login:", e.message);
    return res.status(e.status || 500).json({ error: e.status ? e.message : "Gagal login. Coba lagi." });
  }
});

// ---------- Register pakai API 20FIT (/api/v1/auth/register) ----------
// Buat akun langsung di ekosistem 20FIT, lalu mirror ke Supabase + buat sesi.
app.post("/api/fitco-register", async (req, res) => {
  try {
    if (!admin) return res.status(500).json({ error: "Server belum dikonfigurasi (service key)." });
    const b = req.body || {};
    const email = String(b.email || "").trim().toLowerCase();
    const password = String(b.password || "");
    const name = String(b.name || "").trim();
    const gender = String(b.gender || "").trim().toLowerCase();
    const dob = String(b.date_of_birth || b.birthdate || "").trim();
    const phone = String(b.phone || "").trim();
    const phoneCode = String(b.phone_code || "+62").trim();
    if (!email || !password) return res.status(400).json({ error: "Email & password wajib diisi." });
    if (!name) return res.status(400).json({ error: "Nama wajib diisi." });
    if (password.length < 8) return res.status(400).json({ error: "Password minimal 8 karakter." });
    if (gender !== "male" && gender !== "female") return res.status(400).json({ error: "Jenis kelamin wajib dipilih." });
    if (!dob) return res.status(400).json({ error: "Tanggal lahir wajib diisi." });

    // 1) Daftar ke 20FIT
    const body = {
      name, email, password, password_confirmation: password,
      gender, date_of_birth: dob,
      phone_code: phoneCode, phone: phone || undefined,
      login_source: "app",
    };
    if (b.referral) body.referral = String(b.referral);
    let rj = {};
    try {
      const rr = await fetch(FITCO_API + "/api/v1/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(body),
      });
      rj = await rr.json().catch(() => ({}));
      if (!rr.ok) {
        const msg = String((rj && (rj.message || rj.error)) || "").toLowerCase();
        if (msg.includes("already") || msg.includes("terdaftar") || msg.includes("exist") || msg.includes("taken")) {
          return res.status(409).json({ error: "Email sudah terdaftar di 20FIT. Silakan Sign In." });
        }
        return res.status(400).json({ error: (rj && (rj.message || rj.error)) || "Gagal daftar ke 20FIT." });
      }
    } catch (e) {
      return res.status(502).json({ error: "Tidak bisa menghubungi server 20FIT. Coba lagi." });
    }

    // 2) Login ke 20FIT utk ambil token + profil (best effort). Kalau butuh verifikasi
    //    OTP, langkah ini bisa gagal — tidak apa, kita tetap buat sesi dari data daftar.
    let info = { email, fullName: name, gender: (gender === "male" || gender === "female") ? gender : null, phone: phone || null, avatar: null, birthdate: dob || null };
    let fitcoToken = null, fitcoUserId = null;
    try {
      const lr = await fetch(FITCO_API + FITCO_LOGIN_PATH, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, login_source: "app" }),
      });
      const lj = await lr.json().catch(() => ({}));
      const fd = (lj && lj.data) || lj || {};
      fitcoToken = fd.access_token || (fd.token && (fd.token.access_token || (typeof fd.token === "string" ? fd.token : null))) || null;
      fitcoUserId = fd.user_id || fd.id || null;
      if (fitcoToken) {
        try { const p = await fetch20fitProfile(fitcoToken); info = { email: p.email || email, fullName: p.fullName || name, gender: p.gender || info.gender, phone: p.phone || info.phone, avatar: p.avatar, birthdate: p.birthdate || dob }; fitcoUserId = p.fitcoUserId || fitcoUserId; } catch (e) {}
      }
    } catch (e) { /* non-fatal */ }

    // 3) Mirror ke Supabase + buat sesi
    info.fitcoUserId = fitcoUserId;
    // Registrasi BARU lewat 20FIT SELALU butuh verifikasi OTP dulu sebelum akun
    // 20FIT-nya bisa dipakai login (lihat FIX 4) — set eksplisit false (bukan
    // dibiarkan null/undefined) supaya routeAfterAuth() tahu akun ini harus
    // diarahkan ke verify.html dulu. Ini unconditional: walau langkah 2 di atas
    // (best-effort login) kebetulan berhasil, kita tetap treat sebagai belum
    // verified karena kasus itu sangat tidak biasa untuk akun yang baru dibuat.
    info.fitcoEmailVerified = false;
    const out = await mirrorAndMintOtp(info);
    // Kirim user_id + token 20FIT (dipakai untuk order/pembayaran shop 20FIT).
    return res.json({ ok: true, email: out.email, email_otp: out.email_otp, fitco_user_id: fitcoUserId, fitco_token: fitcoToken });
  } catch (e) {
    console.error("fitco-register:", e.message);
    return res.status(e.status || 500).json({ error: e.status ? e.message : "Gagal daftar. Coba lagi." });
  }
});

// ---------- Verifikasi OTP akun 20FIT (WAJIB pasca-registrasi baru) ----------
// 20FIT mengirim OTP verifikasi SENDIRI (terpisah total dari OTP Supabase kita
// di /api/send-otp & /api/verify-otp) saat registrasi lewat /api/v1/auth/register.
// Sebelum di-verify, akun 20FIT itu berstatus unverified dan TIDAK BISA dipakai
// login ke app 20FIT ("email is not verified"). Endpoint ini proxy ke endpoint
// verifikasi 20FIT lalu tandai fitco_email_verified=true di profil kita.
app.post("/api/fitco-verify-email", async (req, res) => {
  try {
    if (!admin) return res.status(500).json({ error: "Server belum dikonfigurasi (service key)." });
    const email = String((req.body && req.body.email) || "").trim().toLowerCase();
    const otp = String((req.body && req.body.otp) || "").trim();
    if (!email || !otp) return res.status(400).json({ error: "Email & kode wajib diisi." });
    const r = await fetch(FITCO_API + "/api/v1/auth/email/verify", {
      method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      // Jangan digeneric-kan — user perlu tau persis kenapa (kode salah/kedaluwarsa/dll)
      return res.status(r.status === 422 ? 400 : r.status).json({ error: (j && (j.message || j.error)) || "Verifikasi gagal." });
    }
    try {
      await admin.from("my20fit_profile").update({ fitco_email_verified: true }).eq("email", email);
    } catch (e) {
      console.error("fitco-verify-email (update profile):", e.message);
    }
    return res.json({ ok: true });
  } catch (e) {
    console.error("fitco-verify-email:", e.message);
    return res.status(502).json({ error: "Tidak bisa menghubungi server 20FIT. Coba lagi." });
  }
});

// Kirim ulang OTP verifikasi 20FIT.
// CATATAN PENTING: endpoint /api/v1/auth/otp/resend di bawah ini BELUM
// terverifikasi 100% kompatibel dengan /api/v1/auth/email/verify di atas — ini
// asumsi terbaik dari observasi dokumentasi (dua endpoint ini ada di grup
// dokumentasi yang BEDA: otp/resend ada di folder umum "Authentication > OTP",
// sedangkan email/verify ada di folder "Registration"). Belum pernah ditest
// end-to-end kirim-ulang lalu verify pakai kode barunya. Kalau ada laporan bug
// "tombol kirim ulang gak jalan" atau "kode dari resend tidak bisa dipakai
// verify", MULAI INVESTIGASI DARI SINI.
app.post("/api/fitco-resend-verify-email", async (req, res) => {
  try {
    const email = String((req.body && req.body.email) || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ error: "Email wajib diisi." });
    const r = await fetch(FITCO_API + "/api/v1/auth/otp/resend", {
      method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ email }),
    });
    const j = await r.json().catch(() => ({}));
    // Teruskan response 20FIT apa adanya (sukses maupun gagal) — lihat catatan di atas.
    return res.status(r.status).json(j);
  } catch (e) {
    console.error("fitco-resend-verify-email:", e.message);
    return res.status(502).json({ error: "Tidak bisa menghubungi server 20FIT. Coba lagi." });
  }
});

// ================= PARTNER API (untuk tim/produk lain di ekosistem 20FIT) =================
// Dilindungi API key — nilai HANYA dari env PARTNER_API_KEY (RAHASIA, server-only).
// Tidak ada default di kode: kalau env belum diisi, endpoint terkunci (fail-closed).
const PARTNER_API_KEY = process.env.PARTNER_API_KEY || "";
function partnerAuth(req, res) {
  if (!PARTNER_API_KEY) { res.status(503).json({ error: "Partner API not configured." }); return false; }
  const hdr = String(req.headers["authorization"] || "");
  const key = (hdr.replace(/^Bearer\s+/i, "").trim()) || String(req.headers["x-api-key"] || "").trim();
  if (!key || key !== PARTNER_API_KEY) { res.status(401).json({ error: "Unauthorized: invalid or missing API key." }); return false; }
  return true;
}
// Cek key valid.
app.get("/api/partner/ping", (req, res) => {
  if (!partnerAuth(req, res)) return;
  res.json({ ok: true, service: "my.20fit.id", time: new Date().toISOString() });
});
// Ambil profil kesehatan user berdasarkan email ATAU user_id (auth_user_id).
app.get("/api/partner/profile", async (req, res) => {
  if (!partnerAuth(req, res)) return;
  if (!admin) return res.status(500).json({ error: "Server not configured (service key)." });
  const email = String(req.query.email || "").trim().toLowerCase();
  const uid = String(req.query.user_id || req.query.auth_user_id || "").trim();
  if (!email && !uid) return res.status(400).json({ error: "Provide ?email= or ?user_id=." });
  try {
    let q = admin.from("my20fit_profile")
      .select("auth_user_id,email,full_name,phone,gender,age,height_cm,weight_kg,main_goal,health_conditions,avatar_url,is_plus_member,onboarding_completed,cycle_last_period,cycle_length,updated_at")
      .limit(1);
    q = email ? q.eq("email", email) : q.eq("auth_user_id", uid);
    const { data, error } = await q;
    if (error) return res.status(500).json({ error: error.message });
    if (!data || !data.length) return res.status(404).json({ error: "Profile not found." });
    return res.json({ ok: true, profile: data[0] });
  } catch (e) {
    console.error("partner/profile:", e.message);
    return res.status(500).json({ error: "Internal error." });
  }
});

// ================= ADMIN MONITORING (dashboard internal) =================
// Nilai HANYA dari env ADMIN_KEY (RAHASIA). Tanpa default: env kosong = terkunci (fail-closed).
const ADMIN_KEY = process.env.ADMIN_KEY || "";
// ---------- RBAC admin per-user (superadmin/staff/viewer) ----------
// Master ADMIN_KEY (x-admin-key / ?key=) = superadmin (bootstrap & admin.html lama).
// Selain itu: user login 20FIT (Authorization: Bearer <jwt>) yang punya baris di
// my20fit_admin_roles. Role di-cek di SERVER (bukan cuma UI).
const ADMIN_RANK = { viewer: 1, staff: 2, superadmin: 3 };
async function getAdminContext(req) {
  const masterKey = String(req.headers["x-admin-key"] || "").trim() || String(req.query.key || "").trim();
  if (ADMIN_KEY && masterKey && masterKey === ADMIN_KEY) return { via: "key", role: "superadmin", email: null, user_id: null };
  if (!admin) return null;
  try {
    const user = await getUserFromReq(req);
    if (!user) return null;
    const { data } = await admin.from("my20fit_admin_roles").select("role,email").eq("auth_user_id", user.id).limit(1);
    if (data && data[0]) return { via: "user", role: data[0].role, email: data[0].email || user.email, user_id: user.id };
  } catch (e) {}
  return null;
}
function adminHasRole(ctx, minRole) { return !!(ctx && ADMIN_RANK[ctx.role] >= ADMIN_RANK[minRole || "viewer"]); }
async function requireAdmin(req, res, minRole) {
  const ctx = await getAdminContext(req);
  if (!ctx) { res.status(401).json({ error: "Unauthorized" }); return null; }
  if (!adminHasRole(ctx, minRole)) { res.status(403).json({ error: "Akses ditolak: butuh role " + (minRole || "viewer") + " (role kamu: " + ctx.role + ")" }); return null; }
  return ctx;
}
async function adminAudit(ctx, action, target, detail) {
  if (!admin) return;
  try {
    await admin.from("my20fit_admin_audit_log").insert({
      actor_user_id: (ctx && ctx.user_id) || null,
      actor_email: (ctx && ctx.email) || (ctx && ctx.via === "key" ? "master-key" : null),
      action: action, target: target || null, detail: detail || null,
    });
  } catch (e) {}
}
// Siapa saya (role) — frontend admin memakai ini untuk gating UI.
app.get("/api/admin/me", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer");
  if (!ctx) return;
  return res.json({ ok: true, role: ctx.role, email: ctx.email, via: ctx.via });
});
// List role admin (superadmin only).
app.get("/api/admin/roles", async (req, res) => {
  const ctx = await requireAdmin(req, res, "superadmin"); if (!ctx) return;
  const { data, error } = await admin.from("my20fit_admin_roles")
    .select("auth_user_id,email,role,created_at").order("created_at", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true, roles: data || [] });
});
// Assign/ubah role by email (superadmin only).
app.post("/api/admin/roles", async (req, res) => {
  const ctx = await requireAdmin(req, res, "superadmin"); if (!ctx) return;
  const b = req.body || {};
  const email = String(b.email || "").trim().toLowerCase();
  const role = String(b.role || "").trim();
  if (!email || ["superadmin", "staff", "viewer"].indexOf(role) < 0) return res.status(400).json({ error: "email & role (superadmin/staff/viewer) wajib." });
  let uid = null;
  try {
    for (let page = 1; page <= 30; page++) {
      const { data } = await admin.auth.admin.listUsers({ page: page, perPage: 1000 });
      const u = (data && data.users) || [];
      const hit = u.find(x => String(x.email || "").toLowerCase() === email);
      if (hit) { uid = hit.id; break; }
      if (u.length < 1000) break;
    }
  } catch (e) {}
  if (!uid) return res.status(404).json({ error: "Email itu belum punya akun 20FIT. User harus daftar/login dulu." });
  const { error } = await admin.from("my20fit_admin_roles")
    .upsert({ auth_user_id: uid, email: email, role: role, created_by: ctx.user_id || null }, { onConflict: "auth_user_id" });
  if (error) return res.status(500).json({ error: error.message });
  await adminAudit(ctx, "role.set", email, { role: role });
  return res.json({ ok: true });
});
// Hapus role (superadmin only).
app.delete("/api/admin/roles/:userId", async (req, res) => {
  const ctx = await requireAdmin(req, res, "superadmin"); if (!ctx) return;
  const uid = String(req.params.userId || "");
  const { error } = await admin.from("my20fit_admin_roles").delete().eq("auth_user_id", uid);
  if (error) return res.status(500).json({ error: error.message });
  await adminAudit(ctx, "role.remove", uid, null);
  return res.json({ ok: true });
});
// Log aktivitas admin (superadmin only) — filter by action + limit.
app.get("/api/admin/audit", async (req, res) => {
  const ctx = await requireAdmin(req, res, "superadmin"); if (!ctx) return;
  try {
    let q = admin.from("my20fit_admin_audit_log")
      .select("id,actor_email,action,target,detail,created_at")
      .order("created_at", { ascending: false });
    const action = String(req.query.action || "");
    if (action) q = q.ilike("action", action + "%");
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    q = q.limit(limit);
    const { data, error } = await q;
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true, logs: data || [] });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});
// Info konfigurasi runtime (superadmin only) — status env, TANPA membocorkan nilai rahasia.
app.get("/api/admin/config", async (req, res) => {
  const ctx = await requireAdmin(req, res, "superadmin"); if (!ctx) return;
  const isLive = /production/i.test(XENDIT_SECRET_KEY || "");
  return res.json({
    ok: true,
    config: {
      supabase_service_key: !!admin,
      xendit_secret_key: !!XENDIT_SECRET_KEY,
      xendit_webhook_token: !!XENDIT_WEBHOOK_TOKEN,
      xendit_base_url: XENDIT_BASE_URL,
      xendit_mode: isLive ? "production" : "test",
      xendit_webhook_enforce: XENDIT_WEBHOOK_ENFORCE,
      xendit_enabled: XENDIT_ENABLED,
      meta_capi: !!process.env.META_CAPI_ACCESS_TOKEN,
      admin_master_key: !!process.env.ADMIN_KEY,
    }
  });
});

// Rentang tanggal dari query (today/7d/30d/custom).
function adminRange(q) {
  const now = new Date();
  let to = now, from;
  const r = String((q && q.range) || "7d");
  if (r === "today") from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  else if (r === "all") from = new Date(2020, 0, 1);
  else if (r === "30d") from = new Date(now.getTime() - 30 * 86400000);
  else if (r === "custom") {
    from = q.from ? new Date(q.from) : new Date(now.getTime() - 7 * 86400000);
    to = q.to ? new Date(String(q.to) + "T23:59:59") : now;
  } else from = new Date(now.getTime() - 7 * 86400000);
  return { from: from.toISOString(), to: to.toISOString() };
}
// Metrics overview (viewer+). Semua agregasi dari Supabase (real, bukan dummy).
app.get("/api/admin/metrics", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer"); if (!ctx) return;
  const { from, to } = adminRange(req.query);
  try {
    const { data: orders } = await admin.from("my20fit_scan_orders")
      .select("reff_no,auth_user_id,amount,net_amount,credits,status,payment_method,voucher_id,created_at,paid_at")
      .gte("created_at", from).lte("created_at", to);
    const ord = orders || [];
    const paid = ord.filter(o => o.status === "paid");
    const gross = paid.reduce((s, o) => s + (+o.amount || 0), 0);
    const net = paid.reduce((s, o) => s + (o.net_amount != null ? +o.net_amount : (+o.amount || 0)), 0);
    const byStatus = {}; ord.forEach(o => { byStatus[o.status || "?"] = (byStatus[o.status || "?"] || 0) + 1; });
    // Tren harian: revenue + jumlah transaksi + kumulatif, hari kosong diisi 0 (maks ~366 hari).
    const dayRev = {}, dayCnt = {};
    paid.forEach(o => { const d = String(o.paid_at || o.created_at).slice(0, 10); dayRev[d] = (dayRev[d] || 0) + (+o.amount || 0); dayCnt[d] = (dayCnt[d] || 0) + 1; });
    const trend = [];
    (function () {
      const start = new Date(String(from).slice(0, 10) + "T00:00:00");
      const end = new Date(String(to).slice(0, 10) + "T00:00:00");
      let cum = 0, guard = 0;
      for (let dt = new Date(start); dt <= end && guard < 366; dt.setDate(dt.getDate() + 1), guard++) {
        const key = dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0");
        const rev = dayRev[key] || 0; cum += rev;
        trend.push({ date: key, revenue: rev, count: dayCnt[key] || 0, cumulative: cum });
      }
    })();
    // Produk (paket kredit) terlaris di rentang ini.
    const prodMap = {}; paid.forEach(o => { const k = (+o.credits || 0); const m = prodMap[k] || (prodMap[k] = { credits: k, label: k + " scan", count: 0, revenue: 0 }); m.count++; m.revenue += (o.net_amount != null ? +o.net_amount : +o.amount) || 0; });
    const byProduct = Object.values(prodMap).sort((a, b) => b.revenue - a.revenue);
    const byMethod = {}; paid.forEach(o => { const m = o.payment_method || "(tidak diketahui)"; byMethod[m] = (byMethod[m] || 0) + 1; });
    const paidByUser = {}; paid.forEach(o => { if (o.auth_user_id) paidByUser[o.auth_user_id] = (paidByUser[o.auth_user_id] || 0) + 1; });
    const buyers = Object.keys(paidByUser).length;
    const repeat = Object.keys(paidByUser).filter(k => paidByUser[k] > 1).length;

    const { count: totalUsers } = await admin.from("my20fit_profile").select("id", { count: "exact", head: true });
    const { count: newUsers } = await admin.from("my20fit_profile").select("id", { count: "exact", head: true }).gte("created_at", from).lte("created_at", to);
    const { count: activeVouchers } = await admin.from("my20fit_vouchers").select("id", { count: "exact", head: true }).eq("status", "active");
    const { data: usages } = await admin.from("my20fit_voucher_usages").select("voucher_id,discount_applied,used_at").gte("used_at", from).lte("used_at", to);
    const us = usages || [];
    const topMap = {}; us.forEach(u => { topMap[u.voucher_id] = (topMap[u.voucher_id] || 0) + 1; });
    let top = Object.keys(topMap).map(id => ({ voucher_id: id, count: topMap[id] })).sort((a, b) => b.count - a.count).slice(0, 5);
    if (top.length) {
      const { data: vs } = await admin.from("my20fit_vouchers").select("id,code").in("id", top.map(t => t.voucher_id));
      const cm = {}; (vs || []).forEach(v => cm[v.id] = v.code); top.forEach(t => t.code = cm[t.voucher_id] || "?");
    }
    const in7 = new Date(Date.now() + 7 * 86400000).toISOString();
    const { data: expiring } = await admin.from("my20fit_vouchers")
      .select("code,valid_until").eq("status", "active").not("valid_until", "is", null)
      .gte("valid_until", new Date().toISOString()).lte("valid_until", in7).order("valid_until", { ascending: true });

    return res.json({
      ok: true, range: { from, to }, role: ctx.role,
      revenue: { gross: gross, net: net, discount: Math.max(0, gross - net), aov: paid.length ? Math.round(gross / paid.length) : 0 },
      tx: { total: ord.length, paid: paid.length, byStatus: byStatus, successRate: ord.length ? Math.round(paid.length / ord.length * 100) : 0 },
      trend: trend, byMethod: byMethod, byProduct: byProduct,
      users: { total: totalUsers || 0, new: newUsers || 0, buyers: buyers, repeatRate: buyers ? Math.round(repeat / buyers * 100) : 0 },
      voucher: { active: activeVouchers || 0, uses: us.length, discount: us.reduce((s, u) => s + (+u.discount_applied || 0), 0), top: top, expiring: expiring || [] },
    });
  } catch (e) { console.error("admin/metrics:", e.message); return res.status(500).json({ error: e.message }); }
});

// ---------- Voucher management ----------
function genVoucherCode() { const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s = ""; for (let i = 0; i < 8; i++) s += c[Math.floor(Math.random() * c.length)]; return s; }
app.get("/api/admin/vouchers", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer"); if (!ctx) return;
  try {
    let q = admin.from("my20fit_vouchers").select("*");
    const status = String(req.query.status || "");
    if (["active", "inactive", "expired"].indexOf(status) >= 0) q = q.eq("status", status);
    const search = String(req.query.search || "").trim();
    if (search) q = q.ilike("code", "%" + search + "%");
    const sort = ["created_at", "valid_until", "used_count", "code"].indexOf(String(req.query.sort)) >= 0 ? String(req.query.sort) : "created_at";
    q = q.order(sort, { ascending: String(req.query.dir) === "asc" });
    const { data, error } = await q.limit(500);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true, vouchers: data || [], role: ctx.role });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});
app.get("/api/admin/vouchers/:id", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer"); if (!ctx) return;
  const { data: v } = await admin.from("my20fit_vouchers").select("*").eq("id", req.params.id).limit(1);
  if (!v || !v[0]) return res.status(404).json({ error: "Voucher tak ditemukan." });
  const { data: uses } = await admin.from("my20fit_voucher_usages")
    .select("auth_user_id,reff_no,discount_applied,used_at").eq("voucher_id", req.params.id).order("used_at", { ascending: false }).limit(500);
  return res.json({ ok: true, voucher: v[0], usages: uses || [] });
});
app.post("/api/admin/vouchers", async (req, res) => {
  const ctx = await requireAdmin(req, res, "staff"); if (!ctx) return;
  const b = req.body || {};
  let code = String(b.code || "").trim().toUpperCase();
  if (!code) code = genVoucherCode();
  if (!/^[A-Z0-9._%-]{3,40}$/.test(code)) return res.status(400).json({ error: "Kode voucher tidak valid (3–40 karakter: huruf/angka/. _ - %)." });
  const dt = String(b.discount_type || "");
  if (["percentage", "fixed"].indexOf(dt) < 0) return res.status(400).json({ error: "discount_type harus percentage/fixed." });
  const dv = parseInt(b.discount_value, 10) || 0;
  if (dv <= 0) return res.status(400).json({ error: "discount_value harus > 0." });
  if (dt === "percentage" && dv > 100) return res.status(400).json({ error: "Persentase maksimal 100." });
  const row = {
    code: code, description: b.description || null, discount_type: dt, discount_value: dv,
    min_transaction: parseInt(b.min_transaction, 10) || 0,
    usage_limit_total: (b.usage_limit_total === "" || b.usage_limit_total == null) ? null : parseInt(b.usage_limit_total, 10),
    usage_limit_per_user: (b.usage_limit_per_user === "" || b.usage_limit_per_user == null) ? null : parseInt(b.usage_limit_per_user, 10),
    valid_from: b.valid_from || null, valid_until: b.valid_until || null,
    status: "active", created_by: ctx.user_id || null,
  };
  const { data, error } = await admin.from("my20fit_vouchers").insert(row).select().limit(1);
  if (error) { if (error.code === "23505") return res.status(409).json({ error: "Kode voucher sudah dipakai." }); return res.status(500).json({ error: error.message }); }
  await adminAudit(ctx, "voucher.create", code, { discount_type: dt, discount_value: dv });
  return res.json({ ok: true, voucher: data && data[0] });
});
app.patch("/api/admin/vouchers/:id", async (req, res) => {
  const ctx = await requireAdmin(req, res, "staff"); if (!ctx) return;
  const b = req.body || {};
  const { data: cur } = await admin.from("my20fit_vouchers").select("*").eq("id", req.params.id).limit(1);
  if (!cur || !cur[0]) return res.status(404).json({ error: "Voucher tak ditemukan." });
  const used = (cur[0].used_count || 0) > 0;
  const upd = { updated_at: new Date().toISOString() };
  if (b.description !== undefined) upd.description = b.description || null;
  if (b.valid_from !== undefined) upd.valid_from = b.valid_from || null;
  if (b.valid_until !== undefined) upd.valid_until = b.valid_until || null;
  if (b.usage_limit_total !== undefined) upd.usage_limit_total = (b.usage_limit_total === "" || b.usage_limit_total == null) ? null : parseInt(b.usage_limit_total, 10);
  if (b.usage_limit_per_user !== undefined) upd.usage_limit_per_user = (b.usage_limit_per_user === "" || b.usage_limit_per_user == null) ? null : parseInt(b.usage_limit_per_user, 10);
  if (b.status && ["active", "inactive", "expired"].indexOf(b.status) >= 0) upd.status = b.status;
  const wantsLocked = (b.discount_type !== undefined) || (b.discount_value !== undefined) || (b.min_transaction !== undefined);
  if (used && wantsLocked) return res.status(400).json({ error: "Voucher sudah pernah dipakai — discount_type/value/min_transaction tidak bisa diubah." });
  if (!used) {
    if (b.discount_type && ["percentage", "fixed"].indexOf(b.discount_type) >= 0) upd.discount_type = b.discount_type;
    if (b.discount_value !== undefined) upd.discount_value = parseInt(b.discount_value, 10) || 0;
    if (b.min_transaction !== undefined) upd.min_transaction = parseInt(b.min_transaction, 10) || 0;
  }
  const { error } = await admin.from("my20fit_vouchers").update(upd).eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  await adminAudit(ctx, "voucher.update", cur[0].code, upd);
  return res.json({ ok: true });
});
app.post("/api/admin/vouchers/:id/deactivate", async (req, res) => {
  const ctx = await requireAdmin(req, res, "staff"); if (!ctx) return;
  const { data: cur } = await admin.from("my20fit_vouchers").select("code").eq("id", req.params.id).limit(1);
  const { error } = await admin.from("my20fit_vouchers").update({ status: "inactive", updated_at: new Date().toISOString() }).eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  await adminAudit(ctx, "voucher.deactivate", (cur && cur[0] && cur[0].code) || req.params.id, null);
  return res.json({ ok: true });
});

// ---------- Transaksi (my20fit_scan_orders) ----------
app.get("/api/admin/transactions", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer"); if (!ctx) return;
  const { from, to } = adminRange(req.query);
  try {
    let q = admin.from("my20fit_scan_orders")
      .select("reff_no,auth_user_id,credits,amount,net_amount,status,payment_method,gateway_reference_id,voucher_id,order_type,created_at,paid_at")
      .gte("created_at", from).lte("created_at", to);
    const status = String(req.query.status || ""); if (["paid", "pending", "failed", "expired"].indexOf(status) >= 0) q = q.eq("status", status);
    const method = String(req.query.method || ""); if (method) q = q.eq("payment_method", method);
    q = q.order("created_at", { ascending: false }).limit(1000);
    const { data, error } = await q;
    if (error) return res.status(500).json({ error: error.message });
    let rows = data || [];
    const hv = String(req.query.voucher || "");
    if (hv === "yes") rows = rows.filter(r => r.voucher_id); else if (hv === "no") rows = rows.filter(r => !r.voucher_id);
    const vids = rows.filter(r => r.voucher_id).map(r => r.voucher_id).filter((v, i, a) => a.indexOf(v) === i);
    const vmap = {};
    if (vids.length) { const { data: vs } = await admin.from("my20fit_vouchers").select("id,code").in("id", vids); (vs || []).forEach(v => vmap[v.id] = v.code); }
    rows.forEach(r => { r.voucher_code = r.voucher_id ? (vmap[r.voucher_id] || "?") : null; });
    return res.json({ ok: true, transactions: rows });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});
app.get("/api/admin/transactions/:reff", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer"); if (!ctx) return;
  const { data: o } = await admin.from("my20fit_scan_orders").select("*").eq("reff_no", req.params.reff).limit(1);
  if (!o || !o[0]) return res.status(404).json({ error: "Transaksi tak ditemukan." });
  const t = o[0];
  let voucher = null, usage = null;
  if (t.voucher_id) {
    const { data: v } = await admin.from("my20fit_vouchers").select("code,discount_type,discount_value").eq("id", t.voucher_id).limit(1);
    voucher = (v && v[0]) || null;
    const { data: u } = await admin.from("my20fit_voucher_usages").select("discount_applied,used_at").eq("reff_no", t.reff_no).limit(1);
    usage = (u && u[0]) || null;
  }
  const { data: p } = await admin.from("my20fit_profile").select("email,full_name").eq("auth_user_id", t.auth_user_id).limit(1);
  return res.json({ ok: true, tx: t, buyer: (p && p[0]) || null, voucher: voucher, usage: usage });
});

// ---------- Pengguna: daftar semua + aktif/tidak + statistik pembelian (viewer+) ----------
// Aktif = ping terakhir dalam `window` menit (my20fit_user_activity). Detail user dari
// my20fit_profile; statistik beli dari my20fit_scan_orders (status=paid).
app.get("/api/admin/users", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer"); if (!ctx) return;
  const activeMin = Math.min(Math.max(parseInt(req.query.window, 10) || 15, 1), 10080);
  try {
    const { data: profiles } = await admin.from("my20fit_profile")
      .select("auth_user_id,email,full_name,phone,gender,age,height_cm,weight_kg,main_goal,scan_credits,scan_count,onboarding_completed,is_plus_member,created_at")
      .limit(5000);
    const { data: acts } = await admin.from("my20fit_user_activity")
      .select("auth_user_id,last_active_at,last_page,ping_count").limit(5000);
    const { data: orders } = await admin.from("my20fit_scan_orders")
      .select("auth_user_id,amount,net_amount,credits,status").eq("status", "paid").limit(20000);
    const actMap = {}; (acts || []).forEach(a => actMap[a.auth_user_id] = a);
    const buyMap = {};
    (orders || []).forEach(o => {
      const paidAmt = (o.net_amount != null ? +o.net_amount : +o.amount) || 0;
      const b = buyMap[o.auth_user_id] || (buyMap[o.auth_user_id] = { purchases: 0, totalSpent: 0, credits: 0, highest: 0 });
      b.purchases++; b.totalSpent += paidAmt; b.credits += (+o.credits || 0); if (paidAmt > b.highest) b.highest = paidAmt;
    });
    const now = Date.now();
    const users = (profiles || []).map(p => {
      const a = actMap[p.auth_user_id];
      const mins = a && a.last_active_at ? Math.floor((now - new Date(a.last_active_at).getTime()) / 60000) : null;
      const b = buyMap[p.auth_user_id] || { purchases: 0, totalSpent: 0, credits: 0, highest: 0 };
      return {
        auth_user_id: p.auth_user_id, email: p.email, full_name: p.full_name, phone: p.phone,
        gender: p.gender, age: p.age, height_cm: p.height_cm, weight_kg: p.weight_kg, main_goal: p.main_goal,
        scan_credits: p.scan_credits, onboarding_completed: p.onboarding_completed, is_plus_member: p.is_plus_member,
        created_at: p.created_at, last_active_at: a ? a.last_active_at : null, last_page: a ? a.last_page : null,
        minutes_ago: mins, active: mins != null && mins <= activeMin,
        purchases: b.purchases, total_spent: b.totalSpent, credits_bought: b.credits, highest_purchase: b.highest,
      };
    });
    users.sort((x, y) => (y.last_active_at ? new Date(y.last_active_at).getTime() : 0) - (x.last_active_at ? new Date(x.last_active_at).getTime() : 0));
    const activeCount = users.filter(u => u.active).length;
    const buyers = users.filter(u => u.purchases > 0).length;
    return res.json({ ok: true, window: activeMin, total: users.length, active: activeCount, inactive: users.length - activeCount, buyers: buyers, users: users });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});
// Detail satu user: profil lengkap + riwayat order.
app.get("/api/admin/user-detail", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer"); if (!ctx) return;
  const uid = String(req.query.uid || "");
  if (!uid) return res.status(400).json({ error: "uid wajib." });
  try {
    const { data: p } = await admin.from("my20fit_profile").select("*").eq("auth_user_id", uid).limit(1);
    const { data: orders } = await admin.from("my20fit_scan_orders")
      .select("reff_no,order_type,credits,amount,net_amount,status,payment_method,voucher_id,created_at,paid_at")
      .eq("auth_user_id", uid).order("created_at", { ascending: false }).limit(200);
    const { data: act } = await admin.from("my20fit_user_activity").select("last_active_at,last_page,ping_count,first_seen_at").eq("auth_user_id", uid).limit(1);
    const paid = (orders || []).filter(o => o.status === "paid");
    const stats = {
      purchases: paid.length,
      total_spent: paid.reduce((s, o) => s + ((o.net_amount != null ? +o.net_amount : +o.amount) || 0), 0),
      credits_bought: paid.reduce((s, o) => s + (+o.credits || 0), 0),
      highest_purchase: paid.reduce((m, o) => Math.max(m, (o.net_amount != null ? +o.net_amount : +o.amount) || 0), 0),
    };
    return res.json({ ok: true, profile: (p && p[0]) || null, activity: (act && act[0]) || null, orders: orders || [], stats: stats });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});
// Analisa produk paling laris (paket kredit) — count + revenue per ukuran paket.
app.get("/api/admin/top-products", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer"); if (!ctx) return;
  const { from, to } = adminRange(req.query);
  try {
    const { data: orders } = await admin.from("my20fit_scan_orders")
      .select("credits,amount,net_amount,order_type,status,created_at").eq("status", "paid")
      .gte("created_at", from).lte("created_at", to).limit(20000);
    const map = {};
    (orders || []).forEach(o => {
      const key = (o.credits || 0) + " scan";
      const rev = (o.net_amount != null ? +o.net_amount : +o.amount) || 0;
      const m = map[key] || (map[key] = { product: key, credits: +o.credits || 0, count: 0, revenue: 0 });
      m.count++; m.revenue += rev;
    });
    const products = Object.values(map).sort((a, b) => b.revenue - a.revenue);
    return res.json({ ok: true, products: products, top_by_revenue: products[0] || null, top_by_count: products.slice().sort((a, b) => b.count - a.count)[0] || null });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});
// ---------- Analitik lanjutan: MoM, funnel, retensi (viewer+) ----------
app.get("/api/admin/analytics", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer"); if (!ctx) return;
  try {
    const now = new Date();
    const { data: profiles } = await admin.from("my20fit_profile")
      .select("auth_user_id,created_at,onboarding_completed,scan_count").limit(8000);
    const { data: paid } = await admin.from("my20fit_scan_orders")
      .select("auth_user_id,amount,net_amount,created_at,paid_at,status").eq("status", "paid").limit(30000);
    const { data: acts } = await admin.from("my20fit_user_activity")
      .select("auth_user_id,last_active_at").limit(8000);
    const prof = profiles || [], pd = paid || [], ac = acts || [];
    const mk = d => { const x = new Date(d); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0"); };

    // --- Month-over-month (12 bulan terakhir) ---
    const months = []; for (let i = 11; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); months.push(mk(d)); }
    const mIdx = {}; months.forEach((m, i) => mIdx[m] = i);
    const mom = months.map(m => ({ month: m, revenue: 0, tx: 0, newUsers: 0 }));
    pd.forEach(o => { const m = mk(o.paid_at || o.created_at); if (m in mIdx) { const e = mom[mIdx[m]]; e.revenue += (o.net_amount != null ? +o.net_amount : +o.amount) || 0; e.tx++; } });
    prof.forEach(p => { if (!p.created_at) return; const m = mk(p.created_at); if (m in mIdx) mom[mIdx[m]].newUsers++; });

    // --- Funnel ---
    const buyerSet = {}, buyCnt = {};
    pd.forEach(o => { if (o.auth_user_id) { buyerSet[o.auth_user_id] = true; buyCnt[o.auth_user_id] = (buyCnt[o.auth_user_id] || 0) + 1; } });
    const funnel = [
      { stage: "Terdaftar", count: prof.length },
      { stage: "Onboarding selesai", count: prof.filter(p => p.onboarding_completed).length },
      { stage: "Pernah scan", count: prof.filter(p => (+p.scan_count || 0) > 0).length },
      { stage: "Beli kredit", count: Object.keys(buyerSet).length },
      { stage: "Repeat buyer", count: Object.keys(buyCnt).filter(k => buyCnt[k] > 1).length },
    ];

    // --- Retensi cohort (per bulan daftar, 6 bulan terakhir) ---
    const actMap = {}; ac.forEach(a => { if (a.last_active_at) actMap[a.auth_user_id] = a.last_active_at; });
    const cohMonths = []; for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); cohMonths.push(mk(d)); }
    const coh = {}; cohMonths.forEach(m => coh[m] = { month: m, size: 0, active: 0, buyers: 0 });
    const cutoff = Date.now() - 30 * 86400000;
    prof.forEach(p => { if (!p.created_at) return; const m = mk(p.created_at); const c = coh[m]; if (!c) return; c.size++;
      const la = actMap[p.auth_user_id]; if (la && new Date(la).getTime() >= cutoff) c.active++;
      if (buyerSet[p.auth_user_id]) c.buyers++; });
    const retention = cohMonths.map(m => { const c = coh[m]; return { month: m, size: c.size, active: c.active, buyers: c.buyers,
      activeRate: c.size ? Math.round(c.active / c.size * 100) : 0, buyerRate: c.size ? Math.round(c.buyers / c.size * 100) : 0 }; });

    return res.json({ ok: true, mom: mom, funnel: funnel, retention: retention });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// Catatan: endpoint lama /api/admin/stats (era admin.html) sudah dihapus —
// digantikan /api/admin/metrics (RBAC requireAdmin) di admin dashboard baru.

// ---------- Lupa password via API 20FIT (kirim OTP + reset) ----------
// Reset di sini = reset password akun 20FIT yang sama (dipakai app 20FIT juga).
app.post("/api/fitco-forgot", async (req, res) => {
  try {
    const email = String((req.body && req.body.email) || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ error: "Email wajib diisi." });
    const r = await fetch(FITCO_API + "/api/v1/auth/password/forgot", {
      method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ email }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(r.status === 422 ? 400 : r.status).json({ error: (j && (j.message || j.error)) || "Gagal mengirim kode reset." });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(502).json({ error: "Tidak bisa menghubungi server 20FIT. Coba lagi." });
  }
});
app.post("/api/fitco-reset", async (req, res) => {
  try {
    const email = String((req.body && req.body.email) || "").trim().toLowerCase();
    const otp = String((req.body && req.body.otp) || "").trim();
    const password = String((req.body && req.body.password) || "");
    if (!email || !otp || !password) return res.status(400).json({ error: "Email, kode & password wajib diisi." });
    if (password.length < 8) return res.status(400).json({ error: "Password minimal 8 karakter." });
    const r = await fetch(FITCO_API + "/api/v1/auth/password/reset", {
      method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ email, otp, password, password_confirmation: password }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(r.status === 422 ? 400 : r.status).json({ error: (j && (j.message || j.error)) || "Kode salah atau kedaluwarsa." });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(502).json({ error: "Tidak bisa menghubungi server 20FIT. Coba lagi." });
  }
});

// ---------- 20FIT Arena Open API: riwayat member (read-only proxy) ----------
// API key WAJIB server-side (kata dokumentasi). Simpan di env ARENA_API_KEY,
// JANGAN hardcode. Endpoint kita men-scope riwayat ke phone milik user login.
const ARENA_API_URL = process.env.ARENA_API_URL ||
  "https://cpvzwqptzcxnwzfzgrmt.supabase.co/functions/v1/arena-api";
const ARENA_API_KEY = process.env.ARENA_API_KEY || "";

async function arenaGet(path, phone, extra) {
  const qs = new URLSearchParams(Object.assign({ phone: phone }, extra || {})).toString();
  const r = await fetch(ARENA_API_URL + path + "?" + qs, { headers: { "x-api-key": ARENA_API_KEY } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(j.error || ("Arena API " + r.status)); e.status = r.status; throw e; }
  return j;
}

// Riwayat kelas + paket + venue milik member yang sedang login (by phone dari profil).
app.get("/api/arena/history", async (req, res) => {
  try {
    if (!ARENA_API_KEY) return res.status(500).json({ error: "ARENA_API_KEY belum di-set di server." });
    if (!admin) return res.status(500).json({ error: "Server belum dikonfigurasi (service key)." });
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    // Ambil nomor HP dari profil user — JANGAN percaya phone dari client.
    const { data: rows } = await admin.from("my20fit_profile")
      .select("phone").eq("auth_user_id", user.id).limit(1);
    const phone = rows && rows[0] && rows[0].phone;
    if (!phone) return res.status(400).json({ error: "no_phone", message: "Nomor HP belum ada di profil kamu." });
    const [bk, pk, vn] = await Promise.all([
      arenaGet("/member/bookings", phone, { limit: 100 }).catch(e => ({ error: e.message, data: [] })),
      arenaGet("/member/packages", phone).catch(e => ({ error: e.message, data: [] })),
      arenaGet("/member/venue", phone, { limit: 100 }).catch(e => ({ error: e.message, data: [] })),
    ]);
    return res.json({
      ok: true, phone: phone,
      bookings: bk.data || [], packages: pk.data || [], venue: vn.data || [],
    });
  } catch (e) {
    console.error("arena/history:", e.message);
    return res.status(e.status || 500).json({ error: e.message || "Gagal ambil riwayat." });
  }
});

// ---------- Beli paket scan kalori (pembayaran via Xendit Invoice) ----------
// Pembayaran paket scan sepenuhnya lewat Xendit (lihat xenditCreateInvoice di bawah).
// FITCO_PARTNER_TOKEN masih dipakai HANYA untuk baca/cancel status order di API 20FIT
// (bukan gateway pembayaran).
const FITCO_PARTNER_TOKEN = process.env.FITCO_PARTNER_TOKEN || "";
// Ambil nilai skalar pertama untuk salah satu nama field (mis. sales_order_id / order_no)
// dari respons order 20FIT yang bentuknya bisa bertingkat.
function findScalar(obj, keys) {
  let out = null;
  (function walk(v) {
    if (out != null || !v || typeof v !== "object") return;
    for (const k of Object.keys(v)) {
      if (keys.indexOf(k) >= 0 && v[k] != null && typeof v[k] !== "object") { out = v[k]; return; }
      if (v[k] && typeof v[k] === "object") walk(v[k]);
    }
  })(obj);
  return out;
}
// Tentukan LUNAS / EXPIRED HANYA dari field OTORITATIF milik order 20FIT.
// PENTING: JANGAN pakai key generik "status" atau kata "success"/"successfully" —
// itu amplop response API ({"status":"success","message":"...purchased successfully"}),
// artinya request-nya berhasil, BUKAN pembayarannya lunas. Dulu itu bikin order
// PENDING salah ke-deteksi paid. Sumber kebenaran: is_paid (boolean) +
// payment_status_description ("Paid"/"Settled") + payment_status (angka).
function scanPaidMarkers(obj) {
  const PAID_TEXT = /\b(paid|lunas|settled?)\b/i;        // nilai payment_status_description saat lunas
  const FAIL_TEXT = /\b(expired|failed|cancell?ed|dibatalkan|batal|kadaluarsa|kedaluwarsa|void|rejected)\b/i;
  let paid = false, expired = false; const debug = [];
  (function walk(v) {
    if (!v || typeof v !== "object") return;
    if (Array.isArray(v)) { v.forEach(walk); return; }
    for (const k of Object.keys(v)) {
      const val = v[k];
      const scalar = val != null && typeof val !== "object";
      if (k === "is_paid") { if (val === true) paid = true; debug.push("is_paid=" + val); }
      else if (k === "payment_status_description" || k === "order_status_description") {
        if (scalar) { const s = String(val); if (PAID_TEXT.test(s)) paid = true; if (FAIL_TEXT.test(s)) expired = true; debug.push(k + "=" + s); }
      }
      else if (k === "payment_status") {
        if (scalar) { const s = String(val); if (FITCO_PAID_STATUS.indexOf(s) >= 0) paid = true; if (s === "4") expired = true; debug.push("payment_status=" + s); }
      }
      else if (k === "paid_at" || k === "paid_date" || k === "payment_date" || k === "settlement_at" || k === "settled_at") {
        if (scalar) { paid = true; debug.push(k + "=" + val); }
      }
      if (val && typeof val === "object") walk(val);
    }
  })(obj);
  if (paid) expired = false; // ada 1 sinyal lunas -> anggap LUNAS
  return { paid: paid, expired: expired, debug: debug };
}
// Kode payment_status yang berarti LUNAS. Terdokumentasi hanya 5=Pending & 4=Expired,
// kode "paid" belum terdokumentasi -> bisa di-set via env FITCO_PAID_STATUS (mis. "1,3").
// Deteksi utama tetap pakai teks status_description (paid/settled/success/berhasil).
const FITCO_PAID_STATUS = String(process.env.FITCO_PAID_STATUS || "")
  .split(",").map(s => s.trim()).filter(Boolean);
app.post("/api/scan/buy", async (req, res) => {
  try {
    if (!admin) return res.status(500).json({ error: "Server belum dikonfigurasi (service key)." });
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const b = req.body || {};

    // ===== Pembayaran paket scan = Xendit (Invoice API, satu-satunya jalur) =====
    // Katalog server-authoritative: client HANYA kirim package_id. credits & harga
    // ditentukan server dari SCAN_PACKAGES — nilai credits/price di body diabaikan total.
    const packageId = parseInt(b.package_id, 10) || 0;
    const pack = SCAN_PACKAGES[packageId];
    if (!pack) return res.status(400).json({ error: "Paket tidak ditemukan." });
    const credits = pack.credits;
    const gross = pack.price;

    // Voucher (opsional): validasi & hitung harga akhir.
    let voucherId = null, discount = 0, amount = gross;
    if (b.voucher_code) {
      const vr = await validateVoucherForBuy(b.voucher_code, gross, user.id);
      if (vr.error) return res.status(400).json({ error: vr.error });
      if (vr.voucher) { voucherId = vr.voucher.id; discount = vr.discount; amount = vr.final; }
    }

    const reffNo = newReffNo();
    const title = credits + " calorie scans";

    // ---- Voucher bikin gratis (total Rp 0): kredit langsung, tanpa Xendit ----
    if (amount <= 0) {
      try {
        await admin.from("my20fit_scan_orders").insert({
          reff_no: reffNo, auth_user_id: user.id, credits: credits, amount: gross, net_amount: 0,
          provider: "voucher", order_type: "scan_credit", voucher_id: voucherId,
          payment_method: "voucher", status: "pending", created_at: new Date().toISOString(),
        });
      } catch (e) { console.error("scan_orders insert(free):", e.message); return res.status(500).json({ error: "Gagal menyiapkan order." }); }
      const okFree = await creditScanOrder(reffNo); // set paid + tambah kredit + catat voucher
      if (!okFree) return res.status(500).json({ error: "Gagal menambahkan kredit. Coba lagi." });
      return res.json({ ok: true, free: true, credited: true, sales_order_id: reffNo, order_no: reffNo, provider: "voucher", discount: discount });
    }

    if (!XENDIT_SECRET_KEY) {
      return res.status(503).json({ error: "Pembayaran belum aktif: kredensial Xendit belum di-set di server." });
    }
    // Catat order (pending) DULU supaya webhook bisa mencocokkan. amount=gross, net_amount=setelah diskon.
    try {
      await admin.from("my20fit_scan_orders").insert({
        reff_no: reffNo, auth_user_id: user.id, credits: credits, amount: gross, net_amount: amount,
        provider: "xendit", order_type: "scan_credit", voucher_id: voucherId,
        status: "pending", created_at: new Date().toISOString(),
      });
    } catch (e) { console.error("scan_orders insert:", e.message); return res.status(500).json({ error: "Gagal menyiapkan order." }); }
    try {
      // Xendit invoice id disimpan di kolom payment_link_id (dipakai generik utk id order gateway).
      const r = await xenditCreateInvoice({ reffNo: reffNo, title: title, amount: amount,
        items: [{ name: title, quantity: 1, price: amount }] });
      if (r.invoice_id) { try { await admin.from("my20fit_scan_orders").update({ payment_link_id: String(r.invoice_id) }).eq("reff_no", reffNo); } catch (e) {} }
      return res.json({ ok: true, link: r.url, sales_order_id: reffNo, order_no: reffNo, provider: "xendit", discount: discount, amount: amount });
    } catch (e) {
      try { await admin.from("my20fit_scan_orders").update({ status: "failed" }).eq("reff_no", reffNo); } catch (_) {}
      console.error("scan/buy xendit:", e.message);
      return res.status(502).json({ error: "Gagal membuat pembayaran Xendit. Coba lagi." });
    }
  } catch (e) {
    console.error("scan/buy:", e.message);
    return res.status(502).json({ error: "Gagal memproses pembayaran. Coba lagi." });
  }
});

// ---------- Konsumsi 1 scan (server-authoritative) ----------
// Bentuk kuota seperti Auth.shapeQuota di js/auth.js (satu sumber bentuk).
function shapeQuotaServer(q) {
  const freeLimit = (q && q.free_limit != null) ? (+q.free_limit) : 10;
  const used = (q && +q.used) || 0;
  const credits = (q && +q.credits) || 0;
  const freeLeft = Math.max(0, freeLimit - used);
  return { used: used, freeLimit: freeLimit, freeLeft: freeLeft, credits: credits, remaining: freeLeft + credits, period: (q && q.period) || null };
}
// POST /api/scan/consume — kurangi 1 scan (gratis dulu 10/bln, lalu kredit berbayar)
// lewat RPC atomik my20fit_consume_scan. Saldo TIDAK lagi ditulis dari client.
// 402 + code=scan_limit kalau kuota habis. Balikan { ok, quota }.
app.post("/api/scan/consume", async (req, res) => {
  try {
    if (!admin) return res.status(500).json({ error: "Server belum dikonfigurasi." });
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const { data, error } = await admin.rpc("my20fit_consume_scan", { p_uid: user.id });
    if (error) { console.error("scan/consume rpc:", error.message); return res.status(500).json({ error: "Gagal memproses scan." }); }
    const q = data || {};
    if (!q.ok) {
      if (q.code === "scan_limit") return res.status(402).json({ ok: false, code: "scan_limit", quota: shapeQuotaServer(q) });
      return res.status(400).json({ ok: false, code: q.code || "error" });
    }
    return res.json({ ok: true, quota: shapeQuotaServer(q) });
  } catch (e) { console.error("scan/consume:", e.message); return res.status(500).json({ error: e.message }); }
});

// ---------- Preview voucher sebelum bayar (untuk halaman checkout) ----------
// POST /api/scan/voucher-check { code, price } -> { ok, valid, discount, final } atau { ok:false, error }
app.post("/api/scan/voucher-check", async (req, res) => {
  try {
    if (!admin) return res.status(500).json({ error: "Server belum dikonfigurasi." });
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const b = req.body || {};
    const gross = parseInt(b.price, 10) || 0;
    if (gross <= 0) return res.status(400).json({ error: "Harga paket tidak valid." });
    const vr = await validateVoucherForBuy(b.code, gross, user.id);
    if (vr.error) return res.json({ ok: false, error: vr.error });
    return res.json({ ok: true, valid: !!vr.voucher, code: vr.voucher ? vr.voucher.code : null, discount: vr.discount, final: vr.final });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// ---------- Heartbeat aktivitas user (untuk lacak aktif/tidak aktif) ----------
// POST /api/activity/ping { page } — dipanggil app saat halaman dibuka. Upsert my20fit_user_activity.
app.post("/api/activity/ping", async (req, res) => {
  try {
    if (!admin) return res.json({ ok: false });
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const page = String((req.body && req.body.page) || "").slice(0, 120);
    const nowIso = new Date().toISOString();
    // Ambil ping_count lama (upsert tak bisa increment atomik tanpa rpc).
    const { data: cur } = await admin.from("my20fit_user_activity").select("ping_count,first_seen_at").eq("auth_user_id", user.id).limit(1);
    const prev = cur && cur[0];
    let name = null;
    try { const { data: p } = await admin.from("my20fit_profile").select("full_name").eq("auth_user_id", user.id).limit(1); name = p && p[0] && p[0].full_name; } catch (e) {}
    await admin.from("my20fit_user_activity").upsert({
      auth_user_id: user.id, email: user.email || null, full_name: name,
      last_active_at: nowIso, last_page: page || null,
      first_seen_at: (prev && prev.first_seen_at) || nowIso,
      ping_count: ((prev && prev.ping_count) || 0) + 1,
    }, { onConflict: "auth_user_id" });
    return res.json({ ok: true });
  } catch (e) { return res.json({ ok: false }); }
});

// ---------- Cek status pembayaran order scan (untuk auto thank-you + isi kredit) ----------
// POST /api/scan/order-status  { sales_order_id, fitco_token }
// GET 20FIT /api/v1/app/order/:id. Coba token login user DULU, lalu FITCO_PARTNER_TOKEN.
// Balikan juga http/via/debug utk diagnosa. Toleran: kalau gagal baca -> pending (frontend
// terus mencoba tanpa error), plus note berisi kode HTTP supaya kelihatan kalau tokennya ditolak.
app.post("/api/scan/order-status", async (req, res) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const b = req.body || {};
    const id = String(b.sales_order_id || "").trim();
    if (!id) return res.status(400).json({ error: "sales_order_id kosong." });
    // Order Xendit: statusnya ada di tabel kita (dikredit server via webhook).
    if (admin) {
      try {
        const { data: srows } = await admin.from("my20fit_scan_orders").select("status").eq("reff_no", id).limit(1);
        if (srows && srows[0]) {
          const st = srows[0].status;
          return res.json({ ok: true, paid: st === "paid", expired: st === "failed" || st === "expired", pending: st === "pending", provider: "xendit" });
        }
      } catch (e) {}
    }
    const tokens = [];
    if (b.fitco_token) tokens.push({ tk: String(b.fitco_token), via: "user" });
    if (FITCO_PARTNER_TOKEN) tokens.push({ tk: FITCO_PARTNER_TOKEN, via: "partner" });
    if (!tokens.length) return res.json({ ok: true, paid: false, expired: false, pending: true, note: "no_token" });
    let lastHttp = 0, sig = null, via = "";
    for (const t of tokens) {
      try {
        const r = await fetch(FITCO_API + "/api/v1/app/order/" + encodeURIComponent(id), {
          headers: { "Accept": "application/json", "Authorization": "Bearer " + t.tk },
        });
        lastHttp = r.status;
        if (!r.ok) continue;                 // token ini ditolak / order tak terlihat -> coba token berikut
        const j = await r.json().catch(() => ({}));
        sig = scanPaidMarkers(j); via = t.via; break;
      } catch (e) { lastHttp = -1; }
    }
    if (!sig) {
      try { console.log("order-status", id, "http=" + lastHttp, "-> tak bisa baca status"); } catch (e) {}
      return res.json({ ok: true, paid: false, expired: false, pending: true, note: "http_" + lastHttp, http: lastHttp });
    }
    try { console.log("order-status", id, "via", via, "paid=" + sig.paid, "exp=" + sig.expired, "signals:", sig.debug.join(" | ") || "(none)"); } catch (e) {}
    return res.json({ ok: true, paid: sig.paid, expired: sig.expired, pending: !sig.paid && !sig.expired, http: lastHttp, via: via, debug: sig.debug });
  } catch (e) {
    console.error("order-status:", e.message);
    return res.json({ ok: true, paid: false, expired: false, pending: true, note: "error" });
  }
});

// ---------- Batalkan order scan (best-effort ke 20FIT) ----------
// POST /api/scan/order-cancel  { sales_order_id, fitco_token }
// Pembatalan di sisi app (riwayat) tetap otoritatif; ini upaya terbaik meneruskan
// ke 20FIT (POST /api/v1/app/order/:id/cancel). Balikan cancelled true/false + http.
app.post("/api/scan/order-cancel", async (req, res) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const b = req.body || {};
    const id = String(b.sales_order_id || "").trim();
    if (!id) return res.status(400).json({ error: "sales_order_id kosong." });
    const tokens = [];
    if (b.fitco_token) tokens.push(String(b.fitco_token));
    if (FITCO_PARTNER_TOKEN) tokens.push(FITCO_PARTNER_TOKEN);
    let done = false, lastHttp = 0;
    for (const tk of tokens) {
      try {
        const r = await fetch(FITCO_API + "/api/v1/app/order/" + encodeURIComponent(id) + "/cancel", {
          method: "POST",
          headers: { "Accept": "application/json", "Content-Type": "application/json", "Authorization": "Bearer " + tk },
        });
        lastHttp = r.status;
        if (r.ok) { done = true; break; }
      } catch (e) { lastHttp = -1; }
    }
    return res.json({ ok: true, cancelled: done, http: lastHttp });
  } catch (e) {
    console.error("order-cancel:", e.message);
    return res.json({ ok: true, cancelled: false });
  }
});

// ---------- Xendit: Create Invoice + kredit ----------
// Invoice API v2: POST {BASE}/v2/invoices dengan Basic auth (Secret Key sebagai username,
// password kosong). Balikan { invoice_url, id }. invoice_url = halaman checkout hosted
// Xendit (VA / e-wallet / QRIS / kartu). Invoice kadaluarsa via invoice_duration (detik).
// Dok resmi: https://developer.xendit.co/api-reference/#create-invoice
async function xenditCreateInvoice(o) {
  if (!XENDIT_SECRET_KEY) throw new Error("xendit_creds_missing");
  const body = {
    external_id: o.reffNo,
    amount: o.amount,
    description: o.title || "Calorie scan package",
    currency: "IDR",
    invoice_duration: 24 * 60 * 60, // detik; invoice kadaluarsa 24 jam
    success_redirect_url: XENDIT_REDIRECT_BASE + "/calories?status=paid&reff=" + encodeURIComponent(o.reffNo),
    failure_redirect_url: XENDIT_REDIRECT_BASE + "/calories?status=failed&reff=" + encodeURIComponent(o.reffNo),
    items: o.items,
  };
  const auth = "Basic " + Buffer.from(XENDIT_SECRET_KEY + ":").toString("base64");
  const r = await fetch(XENDIT_BASE_URL + XENDIT_INVOICE_PATH, {
    method: "POST",
    headers: { "Authorization": auth, "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { console.error("xendit-create", r.status, JSON.stringify(j).slice(0, 400)); throw new Error((j && (j.message || j.error_code)) || ("xendit_create_" + r.status)); }
  const url = findScalar(j, ["invoice_url", "invoiceUrl"]);
  if (!url) { console.error("xendit-create no url", JSON.stringify(j).slice(0, 400)); throw new Error("xendit_no_invoice_url"); }
  return { url: url, invoice_id: findScalar(j, ["id"]) };
}
// Reff_no unik & aman (<=40, tanpa spasi/slash).
function newReffNo() { return "SCAN" + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36); }
// Kreditkan order scan yang lunas — ATOMIC & IDEMPOTEN lewat RPC my20fit_credit_scan:
// claim order (pending->paid) + tambah scan_credits dalam satu transaksi berkunci baris,
// jadi aman terhadap retry webhook Xendit & order paralel utk user yang sama.
async function creditScanOrder(reff, meta) {
  if (!admin || !reff) return false;
  const { data, error } = await admin.rpc("my20fit_credit_scan", { p_reff: reff });
  if (error) { try { console.error("credit rpc", error.message); } catch (e) {} return false; }
  if (data === true) { try { console.log("xendit credited", reff); } catch (e) {} }
  if (data === true) {
    // Ambil order utk catat pemakaian voucher + tahu apakah net_amount sudah di-set voucher.
    let hasVoucher = false;
    try {
      const { data: o } = await admin.from("my20fit_scan_orders")
        .select("voucher_id,auth_user_id,amount,net_amount").eq("reff_no", reff).limit(1);
      if (o && o[0] && o[0].voucher_id) {
        hasVoucher = true;
        const disc = Math.max(0, (+o[0].amount || 0) - (+o[0].net_amount || 0));
        await recordVoucherUsage(o[0].voucher_id, o[0].auth_user_id, reff, disc);
      }
    } catch (e) { try { console.error("credit voucher-usage", e.message); } catch (_) {} }
    // Simpan metadata pembayaran (metode/ref gateway/nominal net) bila tersedia dari webhook.
    if (meta) {
      const patch = {};
      if (meta.payment_method) patch.payment_method = String(meta.payment_method).slice(0, 60);
      if (meta.gateway_reference_id) patch.gateway_reference_id = String(meta.gateway_reference_id).slice(0, 120);
      // Jangan timpa net_amount kalau order pakai voucher (net_amount = harga setelah diskon).
      if (!hasVoucher && meta.net_amount != null && !isNaN(+meta.net_amount)) patch.net_amount = +meta.net_amount;
      if (Object.keys(patch).length) { try { await admin.from("my20fit_scan_orders").update(patch).eq("reff_no", reff); } catch (e) { try { console.error("scan_orders meta", e.message); } catch (_) {} } }
    }
  }
  return data === true;
}
// Validasi voucher utk pembelian. gross = harga paket (Rp). Return {voucher, discount, final} atau {error}.
async function validateVoucherForBuy(rawCode, gross, uid) {
  const code = String(rawCode || "").trim().toUpperCase();
  if (!code) return { voucher: null, discount: 0, final: gross };
  const { data: vs } = await admin.from("my20fit_vouchers").select("*").eq("code", code).limit(1);
  const v = vs && vs[0];
  if (!v) return { error: "Kode voucher tidak ditemukan." };
  if (v.status !== "active") return { error: "Voucher tidak aktif." };
  const now = new Date();
  if (v.valid_from && new Date(v.valid_from) > now) return { error: "Voucher belum berlaku." };
  if (v.valid_until && new Date(v.valid_until) < now) return { error: "Voucher sudah kedaluwarsa." };
  if (v.min_transaction && gross < v.min_transaction) return { error: "Voucher butuh minimal transaksi Rp " + Number(v.min_transaction).toLocaleString("id-ID") + "." };
  if (v.usage_limit_total != null && (v.used_count || 0) >= v.usage_limit_total) return { error: "Kuota voucher sudah habis." };
  if (v.usage_limit_per_user != null && uid) {
    const { count } = await admin.from("my20fit_voucher_usages").select("id", { count: "exact", head: true }).eq("voucher_id", v.id).eq("auth_user_id", uid);
    if ((count || 0) >= v.usage_limit_per_user) return { error: "Kamu sudah mencapai batas pemakaian voucher ini." };
  }
  let discount = v.discount_type === "percentage" ? Math.round(gross * (+v.discount_value) / 100) : (+v.discount_value);
  discount = Math.max(0, Math.min(discount, gross));
  return { voucher: v, discount: discount, final: Math.max(0, gross - discount) };
}
// Catat pemakaian voucher + naikkan used_count. Idempoten per reff_no.
async function recordVoucherUsage(voucherId, uid, reff, discount) {
  if (!voucherId || !admin) return;
  try {
    const { data: ex } = await admin.from("my20fit_voucher_usages").select("id").eq("reff_no", reff).limit(1);
    if (ex && ex[0]) return; // sudah tercatat
    await admin.from("my20fit_voucher_usages").insert({ voucher_id: voucherId, auth_user_id: uid, reff_no: reff, discount_applied: discount || 0 });
    const { data: v } = await admin.from("my20fit_vouchers").select("used_count").eq("id", voucherId).limit(1);
    const c = (v && v[0] && v[0].used_count) || 0;
    await admin.from("my20fit_vouchers").update({ used_count: c + 1 }).eq("id", voucherId);
  } catch (e) { try { console.error("recordVoucherUsage", e.message); } catch (_) {} }
}
// Ambil metadata pembayaran dari payload webhook Xendit (invoice callback).
function xenditWebhookMeta(obj) {
  return {
    payment_method: findScalar(obj, ["payment_channel", "paymentChannel", "payment_method", "paymentMethod", "bank_code", "ewallet_type"]),
    gateway_reference_id: findScalar(obj, ["id", "payment_id", "paymentId"]),
    net_amount: findScalar(obj, ["paid_amount", "paidAmount", "amount"])
  };
}

// ---------- Xendit: penerima webhook/callback (verifikasi x-callback-token) ----------
// Xendit mengirim header "x-callback-token" berisi Webhook Verification Token dari dashboard.
// Verifikasi = bandingkan konstan-waktu token yang diterima dengan XENDIT_WEBHOOK_TOKEN.
// (Tidak ada HMAC body seperti gateway lama — Xendit pakai token statis per-akun.)
function xenditVerify(req) {
  const h = req.headers || {};
  const recv = String(h["x-callback-token"] || "");
  const expected = XENDIT_WEBHOOK_TOKEN || "";
  let ok = false;
  try { ok = expected.length > 0 && recv.length === expected.length && crypto.timingSafeEqual(Buffer.from(recv), Buffer.from(expected)); } catch (e) { ok = false; }
  return { valid: ok, reason: ok ? "ok" : (expected ? "mismatch" : "no_token_configured") };
}
// Fail-closed di PRODUCTION: default MENOLAK callback dgn token invalid, walau env tak di-set.
// Escape hatch darurat: XENDIT_WEBHOOK_ENFORCE="0" untuk mematikan enforce (mis. saat debug).
// Non-production: hanya enforce kalau di-set "1" (mudah saat bring-up).
const XENDIT_WEBHOOK_ENFORCE = (process.env.XENDIT_WEBHOOK_ENFORCE === "1") ||
  (IS_PROD && process.env.XENDIT_WEBHOOK_ENFORCE !== "0");
function xenditNotify() {
  return function (req, res) {
    let v = { valid: false, reason: "n/a" };
    try { v = xenditVerify(req); } catch (e) { v = { valid: false, reason: "err" }; }
    const b = req.body || {};
    const reff = findScalar(b, ["external_id", "externalId", "reff_no"]);
    const status = String(findScalar(b, ["status"]) || "").toUpperCase();
    const paid = status === "PAID" || status === "SETTLED";
    try {
      console.log("xendit-notify sig=" + v.valid + "/" + v.reason +
        " reff=" + (reff || "-") + " status=" + (status || "-") + " body=" + JSON.stringify(b).slice(0, 600));
    } catch (e) {}
    if (XENDIT_WEBHOOK_ENFORCE && !v.valid) {
      return res.status(401).json({ status: "error", message: "Invalid callback token" });
    }
    // Kreditkan HANYA kalau token valid (anti-palsu) ATAU enforce dimatikan saat bring-up.
    if (reff && paid && (v.valid || !XENDIT_WEBHOOK_ENFORCE)) {
      creditScanOrder(reff, xenditWebhookMeta(b)).catch(function (e) { try { console.error("creditScanOrder", e.message); } catch (_) {} });
    }
    return res.status(200).json({ status: "success" });
  };
}
app.post("/api/xendit/notify", xenditNotify());
// Sebagian gateway pakai GET utk uji koneksi -> balas 200 juga.
app.get("/api/xendit/notify", function (req, res) { return res.status(200).json({ status: "success" }); });

// Ambil IP keluar (egress) server — coba beberapa penyedia sbg cadangan.
async function egressIp() {
  const jsonSrc = [
    { u: "https://api.ipify.org?format=json", k: "ip" },
    { u: "https://ipinfo.io/json", k: "ip" },
    { u: "https://ifconfig.me/all.json", k: "ip_addr" },
  ];
  for (const s of jsonSrc) {
    try {
      const r = await fetch(s.u, { headers: { "Accept": "application/json" } });
      if (!r.ok) continue;
      const j = await r.json().catch(() => ({}));
      if (j && j[s.k]) return String(j[s.k]).trim();
    } catch (e) {}
  }
  for (const u of ["https://icanhazip.com", "https://api.ipify.org", "https://ifconfig.me/ip"]) {
    try { const r = await fetch(u); if (r.ok) { const t = (await r.text()).trim(); if (t && t.length < 60) return t; } } catch (e) {}
  }
  return "";
}

// Cek IP keluar (egress) server ini — berguna untuk didaftarkan di allowlist/Static IP
// integrasi mana pun yang membutuhkannya.
app.get("/api/whoami", async (req, res) => {
  const ip = await egressIp();
  return res.json({ ok: true, egress_ip: ip, note: ip ? "IP keluar server (egress)." : "Gagal ambil IP; coba lagi." });
});

// Self-test konfigurasi Xendit (non-sensitif): laporkan status env, tanpa bocorkan nilai.
app.get("/api/xendit/selftest", (req, res) => {
  const isLive = /production/i.test(XENDIT_SECRET_KEY || "");
  return res.json({
    enabled: XENDIT_ENABLED,
    baseUrl: XENDIT_BASE_URL,
    secretKeySet: !!XENDIT_SECRET_KEY,
    webhookTokenSet: !!XENDIT_WEBHOOK_TOKEN,
    mode: isLive ? "production" : "test",
    webhookEnforce: XENDIT_WEBHOOK_ENFORCE,
    ready: !!(XENDIT_SECRET_KEY && XENDIT_WEBHOOK_TOKEN),
  });
});

// Halaman gampang lihat egress IP server (buat didaftarkan di allowlist/Static IP bila perlu).
app.get("/ip", async (req, res) => {
  const ip = await egressIp();
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<body style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:48px auto;padding:22px;text-align:center;color:#111">' +
    '<h2 style="margin:0 0 6px">Server egress IP</h2>' +
    '<p style="color:#666;margin:0 0 18px;font-size:14px">IP keluar server 20FIT — daftarkan di kolom <b>Static IP</b>/allowlist bila integrasi memerlukannya.</p>' +
    '<p style="font-size:30px;font-weight:800;letter-spacing:1px;margin:10px 0" id="ip">' + (ip || "—") + '</p>' +
    (ip ? '<button onclick="navigator.clipboard&&navigator.clipboard.writeText(document.getElementById(\'ip\').textContent);this.textContent=\'Copied ✓\'" style="padding:11px 18px;border:0;border-radius:9px;background:#C41101;color:#fff;font-weight:800;font-size:14px;cursor:pointer">Copy IP</button>' : '') +
    '<p style="color:#999;font-size:12.5px;margin-top:22px;line-height:1.6">Refresh halaman ini 3–4×. Kalau angkanya tetap = IP stabil (aman didaftarkan). Kalau berubah-ubah = IP Railway dinamis, hubungi aku dulu.</p>' +
    '</body>');
});

// ---------- Static (URL bersih tanpa .html) + fallback ----------
// Redirect /halaman.html -> /halaman (querystring dipertahankan), lalu sajikan
// /halaman dari halaman.html lewat opsi extensions. Jadi URL nggak ada ".html" lagi.
app.get(/\.html$/, (req, res) => {
  const clean = req.path.replace(/\.html$/, "");
  res.redirect(302, clean + req.url.slice(req.path.length));
});
app.use(express.static(path.join(__dirname), { extensions: ["html"] }));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`20FIT Health Profile running on port ${PORT} (prod=${IS_PROD})`);
});
