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
    version: "auth-fix-3",
    serviceKeySet: !!SUPABASE_SERVICE_KEY,
    // URL halaman login/authorize 20FIT. Setelah user login di sana, 20FIT harus
    // redirect balik ke my.20fit.id/login.html?token=<access_token>.
    // Diisi lewat env FITCO_SSO_URL dari tim developer.
    fitcoSsoUrl: process.env.FITCO_SSO_URL || "",
    // Client ID Google (PUBLIK — memang tampil di web). Frontend memakainya
    // untuk inisialisasi tombol GIS. Kosong = tombol Google disembunyikan.
    googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  });
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

// ---------- Login Google via Google Identity Services (GIS) ----------
// Frontend memakai tombol Google resmi (SDK GIS) untuk mendapatkan ID token,
// lalu mengirimnya ke POST /api/fitco-google-login (diteruskan ke API 20FIT
// /api/v1/auth/login/google). Yang perlu di server hanyalah GOOGLE_CLIENT_ID
// (nilai PUBLIK — memang tampil di web). Tidak perlu Client Secret / Redirect URI.
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
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
function adminAuth(req, res) {
  if (!ADMIN_KEY) { res.status(503).json({ error: "Admin API not configured." }); return false; }
  const hdr = String(req.headers["authorization"] || "");
  const key = (hdr.replace(/^Bearer\s+/i, "").trim()) || String(req.headers["x-admin-key"] || "").trim() || String(req.query.key || "").trim();
  if (!key || key !== ADMIN_KEY) { res.status(401).json({ error: "Unauthorized" }); return false; }
  return true;
}
app.get("/api/admin/stats", async (req, res) => {
  if (!adminAuth(req, res)) return;
  if (!admin) return res.status(500).json({ error: "SUPABASE_SERVICE_KEY belum kebaca di process (admin=null). Set variabel-nya di Railway lalu REDEPLOY service supaya kebaca." });
  try {
    // 1) Semua akun auth (created_at + last_sign_in_at)
    let users = [];
    for (let page = 1; page <= 30; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page: page, perPage: 1000 });
      if (error) return res.status(500).json({ error: "Gagal ambil daftar user (auth): " + error.message });
      const u = (data && data.users) || [];
      users = users.concat(u);
      if (u.length < 1000) break;
    }
    // 2) Profil (status add-on / plus / onboarding / scan)
    const { data: profiles, error: profErr } = await admin.from("my20fit_profile")
      .select("email,full_name,is_plus_member,scan_credits,scan_count,onboarding_completed,gender,updated_at");
    if (profErr) return res.status(500).json({ error: "Gagal query tabel my20fit_profile: " + profErr.message });
    const byEmail = {};
    (profiles || []).forEach(p => { if (p.email) byEmail[String(p.email).toLowerCase()] = p; });

    const now = new Date();
    const mk = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
    const signupsByMonth = {};
    let active7 = 0, active30 = 0, plus = 0, addon = 0, onboarded = 0;
    users.forEach(u => {
      const created = new Date(u.created_at);
      signupsByMonth[mk(created)] = (signupsByMonth[mk(created)] || 0) + 1;
      if (u.last_sign_in_at) {
        const days = (now - new Date(u.last_sign_in_at)) / 86400000;
        if (days <= 7) active7++;
        if (days <= 30) active30++;
      }
      const p = byEmail[String(u.email || "").toLowerCase()];
      if (p) {
        if (p.is_plus_member) plus++;
        if ((p.scan_credits || 0) > 0) addon++;
        if (p.onboarding_completed) onboarded++;
      }
    });
    const months = [];
    for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); months.push({ month: mk(d), count: signupsByMonth[mk(d)] || 0 }); }
    const recentLogins = users.filter(u => u.last_sign_in_at)
      .sort((a, b) => new Date(b.last_sign_in_at) - new Date(a.last_sign_in_at))
      .slice(0, 40)
      .map(u => { const p = byEmail[String(u.email || "").toLowerCase()] || {}; return {
        email: u.email, name: p.full_name || null, last_sign_in: u.last_sign_in_at, created_at: u.created_at,
        plus: !!p.is_plus_member, addon: (p.scan_credits || 0) > 0, scans_used: p.scan_count || 0, onboarded: !!p.onboarding_completed }; });
    const totalScans = (profiles || []).reduce((s, p) => s + (+p.scan_count || 0), 0);

    // 3) Demografi gender + pembeli (buyer) per gender. Buyer = Plus ATAU punya kredit scan.
    let men = 0, women = 0, genderUnknown = 0, menBuyers = 0, womenBuyers = 0;
    (profiles || []).forEach(p => {
      const g = String(p.gender || "").toLowerCase();
      const buyer = !!p.is_plus_member || (+p.scan_credits || 0) > 0;
      if (g === "male") { men++; if (buyer) menBuyers++; }
      else if (g === "female") { women++; if (buyer) womenBuyers++; }
      else genderUnknown++;
    });

    return res.json({
      ok: true,
      totalUsers: users.length,
      thisMonthSignups: signupsByMonth[mk(now)] || 0,
      signupsByMonth: months,
      active7: active7, active30: active30,
      plusMembers: plus, addonBuyers: addon, onboarded: onboarded,
      totalScansUsed: totalScans,
      men: men, women: women, genderUnknown: genderUnknown,
      menBuyers: menBuyers, womenBuyers: womenBuyers,
      recentLogins: recentLogins,
    });
  } catch (e) {
    console.error("admin/stats:", e.message);
    return res.status(500).json({ error: "Internal error: " + (e.message || String(e)) });
  }
});

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

// ---------- Beli paket scan kalori via 20FIT shop order (Xendit) ----------
// POST /api/v1/third-party/shop/order (Bearer). Balikannya berisi link Xendit (field "link").
// Auth token: FITCO_PARTNER_TOKEN (env, kalau endpoint pakai token partner) ATAU token
// login user (dikirim client). Set env kalau dev bilang butuh token partner.
const FITCO_PARTNER_TOKEN = process.env.FITCO_PARTNER_TOKEN || "";
function findXenditLink(obj) {
  let out = null;
  (function walk(v) {
    if (out || !v || typeof v !== "object") return;
    for (const k of Object.keys(v)) {
      const val = v[k];
      if (typeof val === "string" && /^https?:\/\//i.test(val) &&
          (k === "link" || k === "payment_url" || k === "invoice_url" || k === "url" || val.indexOf("xendit") >= 0)) { out = val; return; }
      if (val && typeof val === "object") walk(val);
    }
  })(obj);
  return out;
}
app.post("/api/scan/buy", async (req, res) => {
  try {
    if (!admin) return res.status(500).json({ error: "Server belum dikonfigurasi (service key)." });
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const b = req.body || {};
    const items = (Array.isArray(b.items) ? b.items : [])
      .filter(it => it && it.product_id)
      .map(it => ({ product_id: +it.product_id, quantity: +it.quantity || 1 }));
    if (!items.length) return res.status(400).json({ error: "Item pembelian kosong." });
    // Token 20FIT: token partner (env, dipakai untuk SEMUA user) ATAU token login user.
    const bearer = FITCO_PARTNER_TOKEN || String(b.fitco_token || "");
    if (!bearer) return res.status(503).json({ error: "Pembayaran paket belum aktif: token 20FIT partner belum di-set di server (FITCO_PARTNER_TOKEN)." });
    // Data user dari profil (jangan percaya sepenuhnya input client).
    const { data: rows } = await admin.from("my20fit_profile")
      .select("full_name,phone,email").eq("auth_user_id", user.id).limit(1);
    const p = (rows && rows[0]) || {};
    const email = (p.email || user.email || "").toLowerCase();
    const phone = String(p.phone || "").replace(/^\+?62/, "").replace(/^0/, "");
    const body = {
      user_id: b.user_id || null,
      name: p.full_name || (email ? email.split("@")[0] : "Member"),
      phone_code: "+62",
      phone: phone,
      email: email,
      promo_code: null,
      payment: { payment_type: "xendit-invoices", user_point_booster_id: null, use_fit_points: false },
      items: items,
    };
    const r = await fetch(FITCO_API + "/api/v1/third-party/shop/order", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": "Bearer " + bearer },
      body: JSON.stringify(body),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(r.status === 401 ? 401 : 400).json({ error: (j && (j.message || j.error)) || "Gagal membuat order 20FIT." });
    const link = findXenditLink(j);
    if (!link) return res.status(502).json({ error: "Order dibuat, tapi link pembayaran tidak ditemukan." });
    return res.json({ ok: true, link: link });
  } catch (e) {
    console.error("scan/buy:", e.message);
    return res.status(502).json({ error: "Tidak bisa menghubungi server 20FIT. Coba lagi." });
  }
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
