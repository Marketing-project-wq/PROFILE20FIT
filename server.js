// =============================================================
//  20fit Health Profile — Production Server
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
  console.warn("[20fit] WARNING: SUPABASE_URL / SUPABASE_ANON_KEY belum di-set.");
}
if (!SUPABASE_SERVICE_KEY) {
  console.warn("[20fit] WARNING: SUPABASE_SERVICE_KEY belum di-set (OTP butuh ini).");
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
const MAIL_FROM = process.env.MAIL_FROM || "20fit <no-reply@20fit.id>";

async function sendOtpEmail(to, code) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto">
      <h2 style="color:#1db954">Kode Verifikasi 20fit</h2>
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
    console.log(`[20fit][DEV] OTP untuk ${to}: ${code}`);
    return { sent: false };
  }
  await mailer.sendMail({ from: MAIL_FROM, to, subject: "Kode Verifikasi 20fit", html });
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
    // URL halaman login/authorize 20fit. Setelah user login di sana, 20fit harus
    // redirect balik ke profile.20fit.id/login.html?token=<access_token>.
    // Diisi lewat env FITCO_SSO_URL dari tim developer.
    fitcoSsoUrl: process.env.FITCO_SSO_URL || "",
  });
});

// Cek apakah email SUDAH terdaftar (punya profil di app kita).
// Dipakai untuk membatasi "kirim kode login" hanya ke akun yang benar-benar ada,
// supaya kode tidak terkirim ke email sembarangan yang belum daftar.
app.post("/api/email-exists", async (req, res) => {
  try {
    if (!admin) return res.json({ exists: false, unknown: true });
    const email = String((req.body && req.body.email) || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ error: "Email wajib diisi." });
    const { data, error } = await admin.from("my20fit_profile")
      .select("auth_user_id").eq("email", email).limit(1);
    if (error) return res.json({ exists: false, unknown: true });
    return res.json({ exists: !!(data && data.length) });
  } catch (e) {
    console.error("email-exists:", e.message);
    return res.json({ exists: false, unknown: true });
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

app.get("/api/aqi", (req, res) => {
  const hour = new Date().getHours();
  const aqi = 70 + (hour % 5) * 12; // variasi 70-118
  let label, advice;
  if (aqi <= 50) { label = "Good"; advice = "Udara bagus, aman olahraga di luar."; }
  else if (aqi <= 100) { label = "Moderate"; advice = "Cukup oke, sensitif sebaiknya kurangi outdoor."; }
  else { label = "Unhealthy"; advice = "Sebaiknya olahraga di dalam ruangan."; }
  res.json({ city: req.query.city || "Jakarta", aqi, label, advice });
});

// ---------- Login pakai akun 20fit (FITCO) -> jembatan ke akun Supabase ----------
// Verifikasi email+password ke API FITCO. Kalau benar: siapkan akun Supabase
// yang sama (by email) + balikin OTP untuk membuat sesi. Data user tersimpan
// permanen di database kita (Supabase) & nempel tiap login ulang.
const FITCO_API = process.env.FITCO_API_URL || "https://api.20fit.id";
// Ambil profil user dari 20fit pakai access_token (Bearer). Return field yg kita pakai.
async function fetch20fitProfile(fitcoToken) {
  const out = { email: null, fullName: null, gender: null, phone: null, avatar: null, birthdate: null };
  const pr = await fetch(FITCO_API + "/api/v1/app/user/profile", { headers: { Authorization: "Bearer " + fitcoToken } });
  if (!pr.ok) { const err = new Error("Token 20fit tidak valid."); err.status = 401; throw err; }
  const pj = await pr.json().catch(() => ({}));
  const u = (pj && (pj.data || pj)) || {};
  out.email = u.email ? String(u.email).trim().toLowerCase() : null;
  out.fullName = u.name || u.full_name || u.fullname || null;
  out.gender = u.gender ? String(u.gender).toLowerCase() : null;
  out.phone = u.phone || u.phone_number || null;
  out.avatar = u.profile_photo || u.avatar || u.photo || u.avatar_url || null;
  out.birthdate = u.date_of_birth || u.birthdate || u.dob || null;
  return out;
}

// Pastikan akun Supabase ADA untuk email 20fit, tandai via_20fit (skip set-password),
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
      await admin.from("my20fit_profile").upsert(row, { onConflict: "auth_user_id" });
    }
  } catch (e) { /* non-fatal */ }
  return { email, email_otp: otp };
}

// Login pakai email+password akun 20fit (verifikasi ke API 20fit).
app.post("/api/fitco-login", async (req, res) => {
  try {
    if (!admin) return res.status(500).json({ error: "Server belum dikonfigurasi (service key)." });
    const email = String((req.body && req.body.email) || "").trim().toLowerCase();
    const password = String((req.body && req.body.password) || "");
    if (!email || !password) return res.status(400).json({ error: "Email & password wajib diisi." });

    // 1) Verifikasi ke API 20fit
    let fj = {};
    try {
      const fr = await fetch(FITCO_API + "/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, login_source: "app" }),
      });
      fj = await fr.json().catch(() => ({}));
      if (!fr.ok) return res.status(401).json({ error: "Email atau password akun 20fit salah." });
    } catch (e) {
      return res.status(502).json({ error: "Tidak bisa menghubungi server 20fit. Coba lagi." });
    }
    const fd = (fj && fj.data) || fj || {};
    const fitcoToken =
      fj.access_token || fd.access_token ||
      (fd.token && (fd.token.access_token || (typeof fd.token === "string" ? fd.token : null))) || null;
    if (!fitcoToken) return res.status(401).json({ error: "Login 20fit gagal (token tidak diterima)." });

    // 2) Ambil profil (best effort), lengkapi dari data login
    let info = { email, fullName: fd.name || fd.full_name || null, gender: fd.gender ? String(fd.gender).toLowerCase() : null, phone: fd.phone || fd.phone_number || null, avatar: null, birthdate: null };
    try {
      const p = await fetch20fitProfile(fitcoToken);
      info = { email: p.email || email, fullName: p.fullName || info.fullName, gender: p.gender || info.gender, phone: p.phone || info.phone, avatar: p.avatar, birthdate: p.birthdate };
    } catch (e) { /* non-fatal, pakai data login */ }

    const out = await mirrorAndMintOtp(info);
    return res.json({ ok: true, email: out.email, email_otp: out.email_otp });
  } catch (e) {
    console.error("fitco-login:", e.message);
    return res.status(e.status || 500).json({ error: e.status ? e.message : "Gagal login. Coba lagi." });
  }
});

// SSO SEAMLESS: login pakai access_token 20fit yang SUDAH ADA (dioper dari app utama).
// Token divalidasi ke 20fit (ambil profil), lalu dibuatkan sesi — TANPA password.
app.post("/api/fitco-token-login", async (req, res) => {
  try {
    if (!admin) return res.status(500).json({ error: "Server belum dikonfigurasi (service key)." });
    const fitcoToken = String((req.body && (req.body.token || req.body.access_token)) || "").trim();
    if (!fitcoToken) return res.status(400).json({ error: "Token 20fit wajib." });
    let info;
    try {
      info = await fetch20fitProfile(fitcoToken);
    } catch (e) {
      if (e && e.status === 401) return res.status(401).json({ error: "Token 20fit tidak valid / kedaluwarsa." });
      return res.status(502).json({ error: "Tidak bisa menghubungi server 20fit. Coba lagi." });
    }
    if (!info.email) return res.status(401).json({ error: "Token 20fit tidak berisi email." });
    const out = await mirrorAndMintOtp(info);
    return res.json({ ok: true, email: out.email, email_otp: out.email_otp });
  } catch (e) {
    console.error("fitco-token-login:", e.message);
    return res.status(e.status || 500).json({ error: e.status ? e.message : "Gagal login. Coba lagi." });
  }
});

// ---------- Register pakai API 20fit (/api/v1/auth/register) ----------
// Buat akun langsung di ekosistem 20fit, lalu mirror ke Supabase + buat sesi.
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

    // 1) Daftar ke 20fit
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
          return res.status(409).json({ error: "Email sudah terdaftar di 20fit. Silakan Sign In." });
        }
        return res.status(400).json({ error: (rj && (rj.message || rj.error)) || "Gagal daftar ke 20fit." });
      }
    } catch (e) {
      return res.status(502).json({ error: "Tidak bisa menghubungi server 20fit. Coba lagi." });
    }

    // 2) Login ke 20fit utk ambil token + profil (best effort). Kalau butuh verifikasi
    //    OTP, langkah ini bisa gagal — tidak apa, kita tetap buat sesi dari data daftar.
    let info = { email, fullName: name, gender: (gender === "male" || gender === "female") ? gender : null, phone: phone || null, avatar: null, birthdate: dob || null };
    try {
      const lr = await fetch(FITCO_API + "/api/v1/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, login_source: "app" }),
      });
      const lj = await lr.json().catch(() => ({}));
      const fd = (lj && lj.data) || lj || {};
      const token = fd.access_token || (fd.token && (fd.token.access_token || (typeof fd.token === "string" ? fd.token : null))) || null;
      if (token) {
        try { const p = await fetch20fitProfile(token); info = { email: p.email || email, fullName: p.fullName || name, gender: p.gender || info.gender, phone: p.phone || info.phone, avatar: p.avatar, birthdate: p.birthdate || dob }; } catch (e) {}
      }
    } catch (e) { /* non-fatal */ }

    // 3) Mirror ke Supabase + buat sesi
    const out = await mirrorAndMintOtp(info);
    return res.json({ ok: true, email: out.email, email_otp: out.email_otp });
  } catch (e) {
    console.error("fitco-register:", e.message);
    return res.status(e.status || 500).json({ error: e.status ? e.message : "Gagal daftar. Coba lagi." });
  }
});

// ---------- Static + fallback ----------
app.use(express.static(path.join(__dirname)));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`20fit Health Profile running on port ${PORT} (prod=${IS_PROD})`);
});
