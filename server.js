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
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
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
  res.json({ supabaseUrl: SUPABASE_URL || "", supabaseAnonKey: SUPABASE_ANON_KEY || "" });
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

// ---------- Static + fallback ----------
app.use(express.static(path.join(__dirname)));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`20fit Health Profile running on port ${PORT} (prod=${IS_PROD})`);
});
