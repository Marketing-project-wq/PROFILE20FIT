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
const email = require("./lib/email"); // SATU-SATUNYA jalur kirim email (Resend)
const comms = require("./lib/comms"); // consent, suppression, unsubscribe, gerbang frekuensi
const campaigns = require("./lib/campaigns"); // engine meal reminder + onboarding drip
const segments = require("./lib/segments"); // segment engine untuk blast email admin
const blast = require("./lib/blast"); // send queue blast email (batching, kill switch, auto-abort)
const emailConfig = require("./lib/email-config"); // angka guardrail anti-spam (cap, kill switch, backlog, circuit breaker)
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

// Fetch ber-timeout untuk SEMUA panggilan Supabase.
//
// Kenapa: supabase-js memakai fetch TANPA batas waktu. Setiap request kita menyentuh Supabase
// (verifikasi token di getUserFromReq, baca profil, insert order, RPC kredit). Kalau Supabase
// melambat/menggantung, request kita ikut menggantung TANPA BATAS — kita tak pernah menjawab,
// lalu proxy Railway yang menyerah dan membalas 502 HTML. Klien mencoba res.json() atas HTML
// itu, gagal, dan menampilkan "Couldn't start payment. (HTTP 502)" tanpa sebab — kegagalan
// tanpa jejak yang mustahil didiagnosis.
//
// Prinsipnya: KITA yang harus menjawab duluan, dengan JSON. 12 detik cukup longgar untuk
// Supabase sehat (biasanya <300ms) tapi jauh di bawah batas sabar proxy.
const SUPA_TIMEOUT_MS = parseInt(process.env.SUPABASE_TIMEOUT_MS || "12000", 10);
const supaFetch = (url, opts = {}) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), SUPA_TIMEOUT_MS);
  return fetch(url, { ...opts, signal: opts.signal || ctrl.signal })
    .finally(() => clearTimeout(timer));
};

// Service client (bypass RLS, hanya di server) untuk operasi OTP
const admin =
  SUPABASE_URL && SUPABASE_SERVICE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { fetch: supaFetch },
      })
    : null;

// Client anon untuk verifikasi token JWT user
const anon =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { fetch: supaFetch },
      })
    : null;

// ---------- Email (Resend) ----------
// Satu-satunya jalur kirim email = lib/email.js. Provider & SMTP lama sudah dicabut total.
// Timezone pengiriman selalu WIB (Asia/Jakarta).
const CRON_SECRET = process.env.CRON_SECRET || ""; // pengaman endpoint /api/cron/*
const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET || ""; // verifikasi webhook Resend (Svix)
email.init({ admin });
comms.init({ admin });
{
  const _miss = email.assertConfig();
  if (_miss.length) {
    console.warn(
      "[20FIT] WARNING: env email belum lengkap: " + _miss.join(", ") +
        " — email TIDAK akan terkirim sampai di-set di Railway."
    );
  }
  const _ei = email.envInfo();
  console.log(
    `[20FIT] Email via Resend — environment=${_ei.environment}, from=${_ei.from}` +
      (_ei.is_prod ? "" : `, WHITELIST-ONLY (${_ei.whitelist_count} alamat)`)
  );
}

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
  // OTP = transaksional: selalu kirim, tanpa header unsubscribe, tak dihitung frekuensi.
  const r = await email.send({
    to,
    subject: "Kode Verifikasi 20FIT",
    html,
    transactional: true,
    channel: "transactional",
    templateId: "otp",
  });
  // Bantu dev lihat kode saat email diblokir (non-production / env belum di-set).
  if (!r.ok || r.skipped) console.log(`[20FIT][DEV] OTP untuk ${to}: ${code}`);
  return { sent: !!(r.ok && !r.skipped) };
}

// ---------- Cron: notifikasi Intermittent Fasting (buka/tutup eating window) ----------
// Dulu Supabase Edge Function terpisah. Dipindah ke sini agar SATU jalur email (Resend).
// Panggil terjadwal (Railway Cron / pg_cron) tiap ~5-10 menit:
//   POST /api/cron/fasting-notify   header: x-cron-secret: <CRON_SECRET>
const FASTING_LOGO =
  "https://media.20fit.id/wp-content/uploads/2026/05/Copy-of-new-logo-20fit-putih-3.png";
const FASTING_APP = "https://my.20fit.id/calories.html#fasting";
function fastFmt(m) {
  m = ((m % 1440) + 1440) % 1440;
  return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
}
function fastingHtml(kind, info) {
  const open = kind === "open";
  const accent = open ? "#2A7A4F" : "#C87000";
  const accentBg = open ? "#e7f2ec" : "#fbeede";
  const emoji = open ? "🍽️" : "⏰";
  const badge = open ? "EAT NOW" : "WRAP UP";
  const head = open ? "Your eating window is open" : "Your eating window is closing";
  const msg = open
    ? "It's time to break your fast. Enjoy a balanced, mindful meal and hit your calorie &amp; protein targets for today."
    : "Your eating window is about to close. Finish your last meal and get ready to start fasting until your next window.";
  const windowBox = info.window
    ? "<tr><td style='padding:18px 28px 2px'><table role='presentation' width='100%' cellpadding='0' cellspacing='0' style='background:#f6f4f0;border-radius:12px'><tr><td style='padding:15px 18px;text-align:center'>" +
      "<div style='font-size:11px;color:#9a907f;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold'>Eating window</div>" +
      "<div style='font-size:22px;font-weight:bold;color:#0A0908;font-family:Courier New,monospace;margin-top:3px'>" + info.window + "</div>" +
      (info.style ? "<div style='font-size:12px;color:#9a907f;margin-top:3px'>" + info.style + " style</div>" : "") +
      "</td></tr></table></td></tr>"
    : "";
  return "<!DOCTYPE html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'></head>" +
    "<body style='margin:0;padding:0;background:#f4f2ee'>" +
    "<table role='presentation' width='100%' cellpadding='0' cellspacing='0' style='background:#f4f2ee;padding:24px 12px'><tr><td align='center'>" +
    "<table role='presentation' width='480' cellpadding='0' cellspacing='0' style='max-width:480px;width:100%;background:#ffffff;border-radius:18px;overflow:hidden;font-family:Arial,Helvetica,sans-serif'>" +
    "<tr><td style='background:#0A0908;padding:22px;text-align:center'><img src='" + FASTING_LOGO + "' alt='20fit' height='26' style='height:26px'></td></tr>" +
    "<tr><td style='height:5px;line-height:5px;font-size:0;background:" + accent + "'>&nbsp;</td></tr>" +
    "<tr><td style='padding:30px 28px 4px;text-align:center'>" +
    "<div style='font-size:46px;line-height:1'>" + emoji + "</div>" +
    "<div style='display:inline-block;margin:14px 0 8px;padding:6px 16px;border-radius:999px;background:" + accentBg + ";color:" + accent + ";font-size:12px;font-weight:bold;letter-spacing:1.5px'>" + badge + "</div>" +
    "<h1 style='margin:6px 0 0;font-size:23px;color:#0A0908;line-height:1.25'>" + head + "</h1>" +
    "</td></tr>" +
    "<tr><td style='padding:8px 30px 2px;text-align:center'><p style='margin:0;font-size:15px;line-height:1.65;color:#555'>" + msg + "</p></td></tr>" +
    windowBox +
    "<tr><td style='padding:24px 28px 6px;text-align:center'><a href='" + FASTING_APP + "' style='display:inline-block;background:#C41101;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:bold;font-size:15px'>Open my tracker</a></td></tr>" +
    "<tr><td style='padding:22px 30px 28px;text-align:center'><p style='margin:0;font-size:12px;color:#b3a89a;line-height:1.55'>You're receiving this because Intermittent Fasting reminders are ON in your 20fit Health Profile. You can turn them off anytime in the app.</p></td></tr>" +
    "</table>" +
    "<div style='font-size:11px;color:#c2b9ab;margin-top:14px;font-family:Arial,sans-serif'>© 20FIT Sport Clinic · Indonesia</div>" +
    "</td></tr></table></body></html>";
}

// ---------- Core middleware (WAJIB sebelum semua route: body parsing, security, proxy) ----------
// Diletakkan di atas route pertama supaya SETIAP route dapat req.body/req.rawBody.
// (Bug lama: helmet/express.json terdaftar setelah ~40 route -> webhook Resend, consent,
//  konsol email admin, unsubscribe dapat req.body=undefined.)
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({
  limit: "8mb", // 8mb: foto scan (base64) lewat /api/scan/ai
  // Simpan raw body HANYA untuk webhook (verifikasi signature Svix/Resend butuh byte mentah).
  verify: function (req, res, buf) {
    if (req.url && req.url.indexOf("/api/webhooks/") === 0) req.rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: true })); // sebagian gateway kirim webhook form-encoded
// Railway = reverse proxy 1 hop -> req.ip benar (pakai X-Forwarded-For dari proxy tepercaya).
app.set("trust proxy", 1);

// ---------- Ekosistem sub-domain: klasifikasi host (FASE 1B foundation, DORMAN) ----------
// Satu app melayani my.20fit.id + (nanti) calories./menu./medicalcheckup. Middleware ini HANYA
// menandai req.ecoApp dari Host header. Host tak dikenal -> 'my' (perilaku lama TIDAK berubah).
// Belum ada routing/halaman yang bercabang di sini — aktif saat DNS sub-domain diarahkan & halaman dibangun.
function ecoAppOf(req) {
  const host = String(req.headers.host || "").toLowerCase().split(":")[0];
  if (host.startsWith("calories")) return "calories";
  if (host.startsWith("menu")) return "menu";
  if (host.startsWith("medicalcheckup")) return "medicalcheckup";
  return "my";
}
app.use((req, res, next) => { req.ecoApp = ecoAppOf(req); next(); });

// CORS first-party: izinkan subdomain 20FIT lain (mis. calories.20fit.id) memanggil /api
// lintas-origin dgn Bearer token. Hanya origin *.20fit.id / 20fit.id yang di-echo (bukan '*').
// Auth pakai Bearer (bukan cookie) -> tak set Allow-Credentials. Request tanpa Origin
// (same-origin / server-to-server) lewat tanpa perubahan.
const CORS_ALLOW_20FIT = /^https:\/\/([a-z0-9-]+\.)*20fit\.id$/i;
app.use("/api", (req, res, next) => {
  const origin = req.get("origin") || "";
  if (origin && CORS_ALLOW_20FIT.test(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-admin-key, x-cron-secret");
    res.setHeader("Access-Control-Max-Age", "600");
    // /api/pub/* dan /api/menu/* pakai cookie httpOnly (eco_anon) utk sesi anonim
    // (mis. like tanpa login) -> browser wajib boleh kirim/terima cookie lintas-origin.
    var _url = req.originalUrl || "";
    if (_url.startsWith("/api/pub/") || _url.startsWith("/api/menu/")) {
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }
  }
  if (req.method === "OPTIONS") return res.status(204).end();
  next();
});

// ADMIN CMS tersedia di produksi maupun staging. Akses tetap dijaga di server:
// halaman admin butuh login + baris di my20fit_admin_roles, dan semua /api/admin/*
// lewat requireAdmin (JWT admin atau master ADMIN_KEY). Portal korporat juga produksi.

// Penjaga sisi-DB (pelengkap CI): alarm kalau view my20fit_doctors_public memuat
// admin_user_id atau hilang. Panggil berkala (scheduler) dgn ?key=CRON_SECRET.
app.get("/api/cron/guard-doctors-view", async (req, res) => {
  const secret = req.get("x-cron-secret") || (req.query && req.query.key) || "";
  if (!CRON_SECRET || secret !== CRON_SECRET) return res.status(401).json({ error: "unauthorized" });
  if (!admin) return res.status(500).json({ error: "Server belum dikonfigurasi." });
  try {
    const { data, error } = await admin.rpc("my20fit_check_doctors_view");
    if (error) throw error;
    if (data === true) {
      try { console.error("[SECURITY] my20fit_doctors_public memuat admin_user_id atau hilang — cek view!"); } catch (_) {}
      return res.status(500).json({ ok: false, alert: "doctors_view_exposes_admin_user_id_or_missing" });
    }
    return res.json({ ok: true, clean: true });
  } catch (e) { return res.status(500).json({ ok: false, error: (e && e.message) || "check failed" }); }
});

app.post("/api/cron/fasting-notify", async (req, res) => {
  const secret = req.get("x-cron-secret") || (req.query && req.query.key) || "";
  if (!CRON_SECRET || secret !== CRON_SECRET) return res.status(401).json({ error: "unauthorized" });
  if (!admin) return res.status(500).json({ error: "Server belum dikonfigurasi." });
  try {
    const b = req.body || {};
    if (b.action === "test") {
      if (!b.email) return res.status(400).json({ error: "email wajib" });
      const kind = b.kind === "close" ? "close" : "open";
      const r = await email.send({
        to: b.email,
        subject: kind === "close" ? "⏰ Your eating window is closing" : "🍽️ Your eating window is open",
        html: fastingHtml(kind, { style: "16:8", window: "12:00 – 20:00" }),
        transactional: true, channel: "transactional", templateId: "fasting_" + kind,
      });
      return res.json({ ok: true, test: r });
    }
    const WINDOW = 14; // menit toleransi di sekitar jam buka/tutup
    const now = new Date();
    const utcMin = now.getUTCHours() * 60 + now.getUTCMinutes();
    const wibMin = (utcMin + 420) % 1440; // WIB = UTC+7
    const wibDate = new Date(now.getTime() + 420 * 60000).toISOString().slice(0, 10);
    const { data: rows } = await admin.from("my20fit_fasting").select("*").eq("notify_email", true);
    let sent = 0;
    const log = [];
    for (const row of rows || []) {
      if (!row.email || !row.start_time) continue;
      const p = String(row.start_time).split(":");
      const openMin = +p[0] * 60 + +p[1];
      const eat = row.eat_hours || 8;
      if (eat >= 24) continue;
      const closeMin = (openMin + eat * 60) % 1440;
      const info = { style: row.style || undefined, window: fastFmt(openMin) + " – " + fastFmt(closeMin) };
      const dOpen = (((wibMin - openMin) % 1440) + 1440) % 1440;
      const dClose = (((wibMin - closeMin) % 1440) + 1440) % 1440;
      if (dOpen < WINDOW && row.last_open_date !== wibDate) {
        const r = await email.send({
          to: row.email, subject: "🍽️ Your eating window is open",
          html: fastingHtml("open", info), transactional: true, channel: "transactional",
          templateId: "fasting_open", userId: row.auth_user_id || null,
          idempotencyKey: "fasting_open:" + row.auth_user_id + ":" + wibDate,
        });
        if (r.ok && !r.skipped) sent++;
        await admin.from("my20fit_fasting").update({ last_open_date: wibDate }).eq("auth_user_id", row.auth_user_id);
        log.push(row.email + ":open");
      } else if (dClose < WINDOW && row.last_close_date !== wibDate) {
        const r = await email.send({
          to: row.email, subject: "⏰ Your eating window is closing",
          html: fastingHtml("close", info), transactional: true, channel: "transactional",
          templateId: "fasting_close", userId: row.auth_user_id || null,
          idempotencyKey: "fasting_close:" + row.auth_user_id + ":" + wibDate,
        });
        if (r.ok && !r.skipped) sent++;
        await admin.from("my20fit_fasting").update({ last_close_date: wibDate }).eq("auth_user_id", row.auth_user_id);
        log.push(row.email + ":close");
      }
    }
    return res.json({ ok: true, checked: (rows || []).length, sent, wibMin, wibDate, log });
  } catch (e) {
    console.error("fasting-notify:", e && e.message);
    return res.status(500).json({ error: e.message });
  }
});

// ================= Fase 2: Consent, Unsubscribe & Webhook =================

// ---------- Webhook Resend (delivered/opened/clicked/bounce/complaint) ----------
// Verifikasi signature Svix (standard-webhooks). TOLAK payload tanpa verifikasi.
function verifyResendSignature(req) {
  if (!RESEND_WEBHOOK_SECRET) return false;
  const svixId = req.get("svix-id") || req.get("webhook-id");
  const svixTs = req.get("svix-timestamp") || req.get("webhook-timestamp");
  const svixSig = req.get("svix-signature") || req.get("webhook-signature");
  if (!svixId || !svixTs || !svixSig || !req.rawBody) return false;
  // Anti-replay: tolak timestamp > 5 menit dari sekarang.
  const tsSec = parseInt(svixTs, 10);
  if (!tsSec || Math.abs(Date.now() / 1000 - tsSec) > 300) return false;
  const secretB64 = RESEND_WEBHOOK_SECRET.replace(/^whsec_/, "");
  let key;
  try { key = Buffer.from(secretB64, "base64"); } catch (e) { return false; }
  const signedContent = svixId + "." + svixTs + "." + req.rawBody.toString("utf8");
  const expected = crypto.createHmac("sha256", key).update(signedContent).digest("base64");
  // Header bisa memuat beberapa signature (dipisah spasi): "v1,<sig> v1,<sig2>".
  const parts = String(svixSig).split(" ");
  for (let i = 0; i < parts.length; i++) {
    const sig = parts[i].indexOf(",") >= 0 ? parts[i].split(",")[1] : parts[i];
    try {
      const a = Buffer.from(sig, "base64");
      const b = Buffer.from(expected, "base64");
      if (a.length === b.length && crypto.timingSafeEqual(a, b)) return true;
    } catch (e) { /* lanjut cek signature berikutnya */ }
  }
  return false;
}

app.post("/api/webhooks/resend", async (req, res) => {
  if (!verifyResendSignature(req)) return res.status(401).json({ error: "invalid signature" });
  if (!admin) return res.status(500).json({ error: "server belum dikonfigurasi" });
  try {
    const ev = req.body || {};
    const type = ev.type || "";
    const d = ev.data || {};
    const emailId = d.email_id || d.id || null;
    const recips = Array.isArray(d.to) ? d.to : d.to ? [d.to] : [];
    const nowIso = new Date().toISOString();
    // occurred_at = waktu event DARI PAYLOAD (bukan waktu kita terima). Fallback: waktu terima.
    const occurredAt = ev.created_at || d.created_at || nowIso;
    // Dedup webhook retry via svix-id (sama saat Resend mengirim ulang event yang sama).
    const webhookId = req.get("svix-id") || req.get("webhook-id") || null;
    // clicked_url (khusus email.clicked). Defensif terhadap variasi field Resend.
    const clickedUrl = (d.click && (d.click.link || d.click.url)) || d.link || d.url || null;
    const eventType = String(type).replace(/^email\./, "") || "unknown";

    // Ambil metadata kirim SEKALI (enrich event + user_id untuk suppression).
    let msgRow = null;
    if (emailId) {
      try {
        const { data } = await admin.from("my20fit_message_log")
          .select("id,user_id,channel,campaign_id,template_id,meal_window,subject,language")
          .eq("provider_message_id", emailId).limit(1);
        msgRow = (data && data[0]) || null;
      } catch (e) { /* best-effort */ }
    }
    const uid = msgRow && msgRow.user_id ? msgRow.user_id : null;

    // 1) Log event mentah (APPEND-ONLY, idempoten via webhook_id). Best-effort:
    //    kalau tabel belum di-migrate (010), jangan crash — event state tetap jalan.
    try {
      await admin.from("my20fit_email_events").upsert({
        webhook_id: webhookId,
        resend_email_id: emailId,
        message_log_id: msgRow && msgRow.id ? msgRow.id : null,
        user_id: uid,
        recipient_email: recips[0] || null,
        channel: msgRow ? msgRow.channel : null,
        campaign_id: msgRow ? msgRow.campaign_id : null,
        template_id: msgRow ? msgRow.template_id : null,
        meal_window: msgRow ? msgRow.meal_window : null,
        subject: msgRow ? msgRow.subject : null,
        language: msgRow ? msgRow.language : null,
        event_type: eventType,
        clicked_url: clickedUrl,
        occurred_at: occurredAt,
        raw_payload: ev,
      }, { onConflict: "webhook_id", ignoreDuplicates: true });
    } catch (e) { /* best-effort */ }

    // Update baris message_log berdasarkan provider_message_id (best-effort).
    async function patchLog(patch) {
      if (!emailId) return;
      try { await admin.from("my20fit_message_log").update(patch).eq("provider_message_id", emailId); }
      catch (e) { /* best-effort */ }
    }

    // 2) State per-kirim + auto-suppression. occurred_at dari payload.
    if (type === "email.delivered") {
      await patchLog({ status: "delivered", delivered_at: occurredAt });
    } else if (type === "email.opened") {
      await patchLog({ status: "opened", opened_at: occurredAt });
    } else if (type === "email.clicked") {
      await patchLog({ status: "clicked", clicked_at: occurredAt });
    } else if (type === "email.bounced") {
      await patchLog({ status: "bounced", bounced_at: occurredAt, error_message: (d.bounce && (d.bounce.message || d.bounce.type)) || "bounced" });
      // Hard/permanent bounce → suppression permanen.
      const btype = (d.bounce && (d.bounce.type || d.bounce.subType || d.bounce.classification)) || "";
      if (/permanent|hard/i.test(String(btype)) || d.bounce === undefined) {
        for (const to of recips) await comms.addSuppression(to, uid, "hard_bounce", true);
      }
    } else if (type === "email.complained") {
      // Spam complaint → suppression permanen, LANGSUNG.
      await patchLog({ status: "complained", complained_at: occurredAt });
      for (const to of recips) await comms.addSuppression(to, uid, "spam_complaint", true);
    } else if (type === "email.failed") {
      // Gagal kirim permanen di sisi Resend.
      await patchLog({ status: "failed", error_message: (d.failed && (d.failed.reason || d.failed.message)) || d.reason || "failed" });
    } else if (type === "email.suppressed") {
      // Resend menolak kirim karena alamat ada di suppression list. Catat & pastikan tetap ter-suppress.
      await patchLog({ status: "suppressed", error_message: "suppressed by provider" });
      for (const to of recips) await comms.addSuppression(to, uid, "provider_suppressed", true);
    }
    // email.sent / email.delivery_delayed: event sudah tercatat di email_events (state awal sudah 'sent').
    return res.json({ ok: true });
  } catch (e) {
    console.error("webhook/resend:", e && e.message);
    // Balas 200 supaya Resend tak retry badai untuk error internal kita.
    return res.json({ ok: false });
  }
});

// ---------- Unsubscribe (tanpa login; token opaque, tak bocorkan user_id) ----------
// Consent opt-in dihapus. Unsubscribe = berhenti dari SEMUA email non-transaksional
// via suppression list (all-or-nothing) + pause meal reminder. Berlaku seketika.
app.post("/api/unsub/apply", async (req, res) => {
  const b = req.body || {};
  const token = String(b.token || "").trim();
  if (!token) return res.status(400).json({ error: "token wajib" });
  try {
    const p = await comms.getPrefsByToken(token);
    if (!p) return res.status(404).json({ error: "token tidak valid" });
    const uid = p.user_id;
    // Suppression by email (reason unsubscribe) = gerbang utama; email transaksional tetap jalan.
    let em = null;
    try {
      const { data: prof } = await admin.from("my20fit_profile").select("email").eq("auth_user_id", uid).limit(1);
      em = prof && prof[0] && prof[0].email;
      if (em) await comms.addSuppression(em, uid, "unsubscribe", true);
    } catch (e) { /* best-effort */ }
    await admin.from("my20fit_user_comm_prefs")
      .update({ reminder_paused_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("user_id", uid);
    return res.json({ ok: true, unsubscribed: true });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// One-click unsubscribe (header List-Unsubscribe-Post dari Gmail/Yahoo). Berlaku seketika.
// Consent opt-in dihapus → unsubscribe = suppression (berhenti SEMUA email non-transaksional)
// + pause meal reminder. Param `c` diabaikan (all-or-nothing).
app.post("/unsubscribe", async (req, res) => {
  const token = String((req.query && req.query.token) || "").trim();
  if (!token) return res.status(400).send("token wajib");
  try {
    const p = await comms.getPrefsByToken(token);
    if (!p) return res.status(404).send("token tidak valid");
    try {
      const { data: prof } = await admin.from("my20fit_profile").select("email").eq("auth_user_id", p.user_id).limit(1);
      const em = prof && prof[0] && prof[0].email;
      if (em) await comms.addSuppression(em, p.user_id, "unsubscribe", true);
    } catch (e) { /* best-effort */ }
    await admin.from("my20fit_user_comm_prefs")
      .update({ reminder_paused_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("user_id", p.user_id);
    return res.status(200).send("OK: unsubscribed");
  } catch (e) { return res.status(500).send("error"); }
});

// ---------- Cron: MEAL REMINDER (panggil tiap 15 menit) ----------
// POST /api/cron/meal-reminders   header: x-cron-secret: <CRON_SECRET>
// Idempoten (idempotency key per window/hari); hormati skip-if-logged + gerbang frekuensi.
// Kalau cron terlewat (server down), JANGAN kirim susulan — window ±15 menit sudah lewat.
app.post("/api/cron/meal-reminders", async (req, res) => {
  const secret = req.get("x-cron-secret") || (req.query && req.query.key) || "";
  if (!CRON_SECRET || secret !== CRON_SECRET) return res.status(401).json({ error: "unauthorized" });
  if (!admin) return res.status(500).json({ error: "Server belum dikonfigurasi." });
  try {
    const out = await campaigns.runMealReminders({ admin, email, comms, baseUrl: APP_BASE_URL });
    return res.json(out);
  } catch (e) {
    console.error("meal-reminders:", e && e.message);
    return res.status(500).json({ error: e.message });
  }
});

// ---------- Cron: HARIAN (enroll onboarding + kirim step + decay/dormant) ----------
// POST /api/cron/daily   header: x-cron-secret: <CRON_SECRET>   — panggil 1x/hari.
app.post("/api/cron/daily", async (req, res) => {
  const secret = req.get("x-cron-secret") || (req.query && req.query.key) || "";
  if (!CRON_SECRET || secret !== CRON_SECRET) return res.status(401).json({ error: "unauthorized" });
  if (!admin) return res.status(500).json({ error: "Server belum dikonfigurasi." });
  try {
    const out = await campaigns.runDaily({ admin, email, comms, baseUrl: APP_BASE_URL });
    try { out.blast_automations = await blast.runAutomations(blastCtx()); } catch (e) { out.blast_automations = { error: e.message }; }
    return res.json(out);
  } catch (e) {
    console.error("cron/daily:", e && e.message);
    return res.status(500).json({ error: e.message });
  }
});

// ---------- Bahasa email milik user sendiri (in-app) ----------
// Consent opt-in dihapus — semua email dikirim langsung; opt-out lewat unsubscribe.
// Yang tersisa hanyalah pilihan BAHASA email (id/en) supaya isi email mengikuti user.
app.post("/api/comms/lang", async (req, res) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ error: "Sesi habis. Login lagi." });
    const lang = (req.body || {}).lang;
    if (lang !== "id" && lang !== "en") return res.status(400).json({ error: "lang harus id/en" });
    const p = await comms.setLangByUser(user.id, lang);
    return res.json({ ok: true, lang: (p && p.lang) || lang });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// ================= Admin: konsol Email & Campaign (BEBAS data kesehatan) =================
// Role 'marketing' (rank viewer) boleh akses — endpoint ini TIDAK memuat data kesehatan.

// Ringkasan: kill switch, enrollment per tahap, metrik, konversi.
app.get("/api/admin/email/overview", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer");
  if (!ctx) return;
  try {
    const since = new Date(Date.now() - 30 * 86400000).toISOString();
    const { data: flags } = await admin.from("my20fit_campaign_flags").select("*");
    // Enrollment onboarding: breakdown status + step (agregasi di JS).
    const { data: enr } = await admin.from("my20fit_campaign_enrollments")
      .select("status,current_step,exit_reason").eq("campaign_id", "onboarding_no_scan").limit(20000);
    const byStatus = {}, byStep = {}, byExit = {};
    for (const e of enr || []) {
      byStatus[e.status] = (byStatus[e.status] || 0) + 1;
      if (e.status === "active") byStep["step" + (e.current_step || 0)] = (byStep["step" + (e.current_step || 0)] || 0) + 1;
      if (e.exit_reason) byExit[e.exit_reason] = (byExit[e.exit_reason] || 0) + 1;
    }
    const total = (enr || []).length;
    const converted = byExit["converted"] || 0;
    const mMeal = await campaigns.campaignMetrics(admin, since, { channel: "meal_reminder" });
    const mOnb = await campaigns.campaignMetrics(admin, since, { channel: "marketing", campaignId: "onboarding_no_scan" });
    return res.json({
      ok: true, window_days: 30, role: ctx.role,
      flags: flags || [],
      onboarding: {
        total_enrollments: total, by_status: byStatus, active_by_step: byStep, by_exit_reason: byExit,
        conversion_rate: total ? +((converted / total) * 100).toFixed(2) : 0, // % scan pertama
        metrics: mOnb,
      },
      meal_reminder: { metrics: mMeal },
    });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// Analitik per campaign (TASK 2): agregasi my20fit_message_log jadi 1 baris/campaign.
// Bebas data kesehatan. Skala kecil → agregasi di JS, dibatasi window + cap.
app.get("/api/admin/email/campaigns", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer");
  if (!ctx) return;
  try {
    const days = Math.min(365, Math.max(1, parseInt((req.query && req.query.days) || "90", 10) || 90));
    const sinceIso = new Date(Date.now() - days * 86400000).toISOString();
    const CAP = 20000;
    const { data: rows } = await admin.from("my20fit_message_log")
      .select("campaign_id,channel,status,delivered_at,opened_at,clicked_at,bounced_at,complained_at")
      .gte("created_at", sinceIso).order("created_at", { ascending: false }).limit(CAP);
    const list = rows || [];
    const DISPATCHED = ["sent", "delivered", "opened", "clicked", "bounced", "complained"];
    const map = {};
    for (const r of list) {
      const key = r.campaign_id || r.channel || "(lainnya)";
      let m = map[key];
      if (!m) m = map[key] = { key: key, channel: r.channel || null, is_campaign: !!r.campaign_id, dispatched: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, complained: 0 };
      if (DISPATCHED.indexOf(r.status) === -1) continue;
      m.dispatched++;
      if (r.delivered_at) m.delivered++;
      if (r.opened_at) m.opened++;
      if (r.clicked_at) m.clicked++;
      if (r.bounced_at) m.bounced++;
      if (r.complained_at) m.complained++;
    }
    const pct = (n, d) => (d ? +((n / d) * 100).toFixed(2) : 0);
    const campaigns = Object.keys(map).map((k) => {
      const m = map[k]; const d = m.dispatched;
      return Object.assign(m, {
        open_rate: pct(m.opened, d), click_rate: pct(m.clicked, d),
        bounce_rate: pct(m.bounced, d), complaint_rate: pct(m.complained, d),
      });
    }).sort((a, b) => b.dispatched - a.dispatched);
    return res.json({ ok: true, window_days: days, truncated: list.length >= CAP, campaigns: campaigns });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// Drill-down 1 campaign: siapa terima/buka/klik. Email di-join dari profile
// (message_log hanya simpan user_id). Filter + cari + export CSV. Bebas data kesehatan.
app.get("/api/admin/email/campaign", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer");
  if (!ctx) return;
  try {
    const id = String((req.query && req.query.id) || "").trim();
    if (!id) return res.status(400).json({ error: "id campaign wajib" });
    if (!/^[a-zA-Z0-9_.:-]+$/.test(id)) return res.status(400).json({ error: "id campaign tidak valid" });
    const days = Math.min(365, Math.max(1, parseInt((req.query && req.query.days) || "90", 10) || 90));
    const sinceIso = new Date(Date.now() - days * 86400000).toISOString();
    const filter = String((req.query && req.query.filter) || "all");
    const q = String((req.query && req.query.q) || "").trim().toLowerCase();
    const CAP = 5000;
    const { data: rows } = await admin.from("my20fit_message_log")
      .select("user_id,subject,status,sent_at,delivered_at,opened_at,clicked_at,bounced_at,complained_at,created_at")
      .or("campaign_id.eq." + id + ",and(campaign_id.is.null,channel.eq." + id + ")")
      .gte("created_at", sinceIso).order("created_at", { ascending: false }).limit(CAP);
    const list = rows || [];
    const ids = Array.from(new Set(list.map((r) => r.user_id).filter(Boolean)));
    const pmap = {};
    for (let i = 0; i < ids.length; i += 200) {
      const { data: profs } = await admin.from("my20fit_profile").select("auth_user_id,email,full_name").in("auth_user_id", ids.slice(i, i + 200));
      (profs || []).forEach((p) => { pmap[p.auth_user_id] = p; });
    }
    let out = list.map((r) => {
      const p = pmap[r.user_id] || {};
      const st = r.complained_at ? "complaint" : r.bounced_at ? "bounce" : r.clicked_at ? "clicked" : r.opened_at ? "opened" : r.delivered_at ? "delivered" : (r.status || "sent");
      return { email: p.email || "—", name: p.full_name || "", subject: r.subject || "", status: st, sent_at: r.sent_at, opened_at: r.opened_at, clicked_at: r.clicked_at, created_at: r.created_at };
    });
    if (filter === "clicked") out = out.filter((r) => r.clicked_at);
    else if (filter === "opened_not") out = out.filter((r) => r.opened_at && !r.clicked_at);
    else if (filter === "delivered_not") out = out.filter((r) => r.status === "delivered" || r.status === "sent");
    else if (filter === "bounced") out = out.filter((r) => r.status === "bounce" || r.status === "complaint");
    if (q) out = out.filter((r) => (r.email || "").toLowerCase().indexOf(q) >= 0 || (r.name || "").toLowerCase().indexOf(q) >= 0);
    if (String((req.query && req.query.format) || "") === "csv") {
      await adminAudit(ctx, "email.campaign.export", id, { rows: out.length, filter: filter });
      const cell = (v) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
      const head = "email,name,subject,status,sent_at,opened_at,clicked_at\n";
      const body = out.map((r) => [r.email, r.name, r.subject, r.status, r.sent_at || "", r.opened_at || "", r.clicked_at || ""].map(cell).join(",")).join("\n");
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="campaign-' + id.replace(/[^a-z0-9_-]/gi, "_") + '.csv"');
      return res.send(head + body);
    }
    return res.json({ ok: true, id: id, window_days: days, truncated: list.length >= CAP, total: out.length, rows: out.slice(0, 500) });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// Top link diklik untuk 1 campaign (dari my20fit_email_events.clicked_url).
// Metrik paling andal: link mana yang menarik minat. Bebas data kesehatan.
app.get("/api/admin/email/campaign/links", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer");
  if (!ctx) return;
  try {
    const id = String((req.query && req.query.id) || "").trim();
    if (!id) return res.status(400).json({ error: "id campaign wajib" });
    if (!/^[a-zA-Z0-9_.:-]+$/.test(id)) return res.status(400).json({ error: "id campaign tidak valid" });
    const days = Math.min(365, Math.max(1, parseInt((req.query && req.query.days) || "90", 10) || 90));
    const sinceIso = new Date(Date.now() - days * 86400000).toISOString();
    const CAP = 20000;
    let rows = [];
    try {
      const { data } = await admin.from("my20fit_email_events")
        .select("clicked_url,user_id")
        .eq("event_type", "clicked")
        .or("campaign_id.eq." + id + ",and(campaign_id.is.null,channel.eq." + id + ")")
        .gte("occurred_at", sinceIso).limit(CAP);
      rows = data || [];
    } catch (e) { /* tabel belum di-migrate (010) → kembalikan kosong */ }
    const map = {};
    for (const r of rows) {
      const url = r.clicked_url || "(tanpa url)";
      let m = map[url];
      if (!m) m = map[url] = { url: url, clicks: 0, _users: new Set() };
      m.clicks++;
      if (r.user_id) m._users.add(r.user_id);
    }
    const links = Object.keys(map).map((u) => ({ url: u, clicks: map[u].clicks, unique_users: map[u]._users.size }))
      .sort((a, b) => b.clicks - a.clicks).slice(0, 50);
    return res.json({ ok: true, id: id, window_days: days, total_click_events: rows.length, links: links });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// Panel kesehatan email: env, config guardrail, domain (Resend), scheduler terakhir,
// job gagal, bounce/complaint rate. Tidak membocorkan nilai secret. Bebas data kesehatan.
app.get("/api/admin/email/health", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer");
  if (!ctx) return;
  try {
    const env = email.envInfo();
    const since = new Date(Date.now() - 7 * 86400000).toISOString();
    const flags = {
      email_environment: process.env.EMAIL_ENVIRONMENT || null,
      is_prod: env.is_prod,
      mail_from: env.from,
      resend_key_set: env.resend_key_set,
      webhook_secret_set: !!process.env.RESEND_WEBHOOK_SECRET,
      cron_secret_set: !!process.env.CRON_SECRET,
      kill_switch: emailConfig.killSwitch(),
    };
    const config = { caps: emailConfig.caps, backlog_expiry_hours: emailConfig.backlogExpiryHours, circuit_breaker: emailConfig.circuitBreaker };
    // Scheduler terakhir jalan (proxy) = kirim terbaru; webhook aktif (proxy) = event terbaru.
    const { data: lastSend } = await admin.from("my20fit_message_log").select("created_at,channel,status").order("created_at", { ascending: false }).limit(1);
    let lastEvent = null;
    try {
      const { data } = await admin.from("my20fit_email_events").select("created_at,event_type").order("created_at", { ascending: false }).limit(1);
      lastEvent = (data && data[0]) || null;
    } catch (e) { /* tabel mungkin belum di-migrate */ }
    const { count: failed7d } = await admin.from("my20fit_message_log").select("id", { count: "exact", head: true }).eq("status", "failed").gte("created_at", since);
    const rates7d = await campaigns.campaignMetrics(admin, since, {});
    // Status domain live dari Resend (bisa lambat/gagal; best-effort).
    const domain = await email.checkDomains();
    return res.json({
      ok: true, env: flags, config,
      last_send: (lastSend && lastSend[0]) || null, last_event: lastEvent,
      failed_7d: failed7d || 0, rates_7d: rates7d, domain,
    });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// Suppression list (cari). Bebas data kesehatan.
app.get("/api/admin/email/suppression", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer");
  if (!ctx) return;
  try {
    const q = String((req.query && req.query.q) || "").trim().toLowerCase();
    let sel = admin.from("my20fit_suppression_list").select("email,reason,is_permanent,created_at,user_id").order("created_at", { ascending: false }).limit(200);
    if (q) sel = sel.ilike("email", "%" + q + "%");
    const { data } = await sel;
    return res.json({ ok: true, rows: data || [] });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// Tambah/hapus suppression manual (staff+).
app.post("/api/admin/email/suppression", async (req, res) => {
  const ctx = await requireAdmin(req, res, "staff");
  if (!ctx) return;
  try {
    const b = req.body || {};
    const em = String(b.email || "").trim().toLowerCase();
    if (!em) return res.status(400).json({ error: "email wajib" });
    if (b.action === "remove") {
      await admin.from("my20fit_suppression_list").delete().eq("email", em);
    } else {
      await comms.addSuppression(em, b.user_id || null, b.reason || "manual", true);
    }
    await adminAudit(ctx, "email.suppression." + (b.action === "remove" ? "remove" : "add"), em, null);
    return res.json({ ok: true });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// Kill switch per campaign (staff+). Berlaku seketika, tanpa deploy.
app.post("/api/admin/email/killswitch", async (req, res) => {
  const ctx = await requireAdmin(req, res, "staff");
  if (!ctx) return;
  try {
    const b = req.body || {};
    const id = String(b.campaign_id || "").trim();
    if (["meal_reminder", "onboarding_no_scan"].indexOf(id) < 0) return res.status(400).json({ error: "campaign_id tidak dikenal" });
    const enabled = b.enabled !== false;
    await admin.from("my20fit_campaign_flags").upsert(
      { campaign_id: id, enabled: enabled, note: enabled ? "manual: on" : "manual: kill switch", updated_by: ctx.email || "admin", updated_at: new Date().toISOString() },
      { onConflict: "campaign_id" }
    );
    await adminAudit(ctx, "email.killswitch", id, { enabled: enabled });
    return res.json({ ok: true, campaign_id: id, enabled: enabled });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// ---------- Blast: daftar preset segmen ----------
app.get("/api/admin/email/segments", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer");
  if (!ctx) return;
  return res.json({ ok: true, presets: segments.PRESETS });
});

// ---------- Blast: preview segmen (cocok vs layak + rincian + sampel 20) ----------
// BEBAS data kesehatan. Filter kelayakan TAK bisa di-bypass (tak ada parameter override).
app.post("/api/admin/email/segment/preview", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer");
  if (!ctx) return;
  try {
    const presetId = String((req.body && req.body.preset_id) || "").trim();
    if (segments.PRESET_IDS.indexOf(presetId) < 0) return res.status(400).json({ error: "preset tidak dikenal" });
    const out = await segments.previewSegment(admin, presetId);
    return res.json(Object.assign({ ok: true }, out));
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// ============ Blast: send queue (buat draft → tes → confirm → antrian) ============
function blastCtx() { return { admin, email, comms, campaigns, segments, baseUrl: APP_BASE_URL }; }

// Daftar template blast + tanda apakah sudah di-custom (override tersimpan).
app.get("/api/admin/email/templates", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer"); if (!ctx) return;
  let custom = {};
  try {
    const { data } = await admin.from("my20fit_email_templates").select("template_key,subject,html,updated_at");
    (data || []).forEach((r) => { custom[r.template_key] = r; });
  } catch (e) {}
  return res.json({ ok: true, templates: blast.TEMPLATE_IDS.map((id) => ({
    id, label: blast.TEMPLATES[id].label,
    subject: (custom[id] && custom[id].subject) || null,
    customized: !!(custom[id] && custom[id].html),
    updated_at: (custom[id] && custom[id].updated_at) || null,
  })) });
});

// Detail 1 template untuk EDIT/REVIEW: subject + html efektif (override atau default builder).
app.get("/api/admin/email/template/:key", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer"); if (!ctx) return;
  const key = String(req.params.key || "");
  if (blast.TEMPLATE_IDS.indexOf(key) < 0) return res.status(404).json({ error: "template tidak dikenal" });
  try {
    const { data } = await admin.from("my20fit_email_templates").select("subject,html,updated_by,updated_at").eq("template_key", key).limit(1);
    const row = (data && data[0]) || {};
    // HTML default (builder) untuk preview & titik awal edit — placeholder aman.
    const previewUnsub = APP_BASE_URL + "/unsubscribe?token=PREVIEW&c=marketing";
    const defaultHtml = await blast.renderTemplate(admin, campaigns, key, APP_BASE_URL, previewUnsub);
    return res.json({
      ok: true, key, label: blast.TEMPLATES[key].label,
      subject: row.subject || "", html: row.html || "",
      is_custom: !!row.html, default_html: defaultHtml || "",
      updated_by: row.updated_by || null, updated_at: row.updated_at || null,
    });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// Simpan override subject/html (staff+). html kosong = reset ke builder default.
app.put("/api/admin/email/template/:key", async (req, res) => {
  const ctx = await requireAdmin(req, res, "staff"); if (!ctx) return;
  const key = String(req.params.key || "");
  if (blast.TEMPLATE_IDS.indexOf(key) < 0) return res.status(404).json({ error: "template tidak dikenal" });
  try {
    const b = req.body || {};
    const subject = b.subject != null ? String(b.subject).trim() : null;
    const html = (b.html != null && String(b.html).trim() !== "") ? String(b.html) : null;
    if (html == null && (subject == null || subject === "")) {
      // Kosong semua = reset override.
      await admin.from("my20fit_email_templates").delete().eq("template_key", key);
      await adminAudit(ctx, "email.template.reset", key, null);
      return res.json({ ok: true, reset: true });
    }
    await admin.from("my20fit_email_templates").upsert({
      template_key: key, name: blast.TEMPLATES[key].label, subject: subject, html: html,
      updated_by: ctx.email || "admin", updated_at: new Date().toISOString(),
    }, { onConflict: "template_key" });
    await adminAudit(ctx, "email.template.save", key, { has_custom_html: !!html, subject_set: !!subject });
    return res.json({ ok: true, is_custom: !!html });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// Buat draft blast (bekukan penerima eligible). BELUM mengirim.
app.post("/api/admin/email/send/create", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer"); if (!ctx) return;
  try {
    const b = req.body || {};
    const send = await blast.createSend(blastCtx(), {
      name: b.name, segment_id: b.segment_id, template_id: b.template_id, subject: b.subject,
      daily_cap: b.daily_cap ? parseInt(b.daily_cap, 10) : null, created_by: ctx.email || "admin",
    });
    await adminAudit(ctx, "email.blast.create", send.id, { name: send.name, segment: send.segment_id, matched: send.total_matched, eligible: send.total_eligible });
    return res.json({ ok: true, send });
  } catch (e) { return res.status(400).json({ error: e.message }); }
});

// Kirim tes ke alamat internal (@20fit.id). WAJIB sebelum confirm.
app.post("/api/admin/email/send/test", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer"); if (!ctx) return;
  try {
    const b = req.body || {};
    const to = String(ctx.email || b.email || "").trim().toLowerCase();
    if (!to.endsWith("@20fit.id")) return res.status(400).json({ error: "tes hanya ke alamat @20fit.id" });
    const r = await blast.sendTest(blastCtx(), b.send_id, to);
    return res.json({ ok: !!(r.ok && !r.skipped), to, result: r });
  } catch (e) { return res.status(400).json({ error: e.message }); }
});

// Konfirmasi (ketik nama campaign) → masuk antrian.
app.post("/api/admin/email/send/confirm", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer"); if (!ctx) return;
  try {
    const b = req.body || {};
    await blast.confirmSend(blastCtx(), b.send_id, b.typed_name, ctx.email || "admin");
    await adminAudit(ctx, "email.blast.confirm", b.send_id, { typed_name: b.typed_name });
    return res.json({ ok: true });
  } catch (e) { return res.status(400).json({ error: e.message }); }
});

// Pause / Cancel (kill switch di tengah pengiriman).
app.post("/api/admin/email/send/pause", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer"); if (!ctx) return;
  try { await blast.setStatus(blastCtx(), (req.body || {}).send_id, "paused"); await adminAudit(ctx, "email.blast.pause", (req.body || {}).send_id, null); return res.json({ ok: true }); }
  catch (e) { return res.status(400).json({ error: e.message }); }
});
app.post("/api/admin/email/send/resume", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer"); if (!ctx) return;
  try { await blast.setStatus(blastCtx(), (req.body || {}).send_id, "sending"); return res.json({ ok: true }); }
  catch (e) { return res.status(400).json({ error: e.message }); }
});
app.post("/api/admin/email/send/cancel", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer"); if (!ctx) return;
  try { await blast.setStatus(blastCtx(), (req.body || {}).send_id, "cancelled"); await adminAudit(ctx, "email.blast.cancel", (req.body || {}).send_id, null); return res.json({ ok: true }); }
  catch (e) { return res.status(400).json({ error: e.message }); }
});

// Detail 1 send (progress).
app.get("/api/admin/email/send/:id", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer"); if (!ctx) return;
  try {
    const { data } = await admin.from("my20fit_email_sends").select("*").eq("id", req.params.id).limit(1);
    const s = data && data[0];
    if (!s) return res.status(404).json({ error: "tidak ditemukan" });
    const { data: rc } = await admin.from("my20fit_email_send_recipients").select("status").eq("send_id", s.id).limit(20000);
    const by = {};
    for (const r of rc || []) by[r.status] = (by[r.status] || 0) + 1;
    return res.json({ ok: true, send: s, recipient_status: by });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// Riwayat blast.
app.get("/api/admin/email/sends", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer"); if (!ctx) return;
  try {
    const { data } = await admin.from("my20fit_email_sends").select("id,name,segment_id,template_id,status,total_matched,total_eligible,total_sent,total_failed,created_by,created_at,started_at,completed_at,abort_reason").order("created_at", { ascending: false }).limit(100);
    return res.json({ ok: true, sends: data || [] });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// Cron: proses SATU batch antrian (panggil tiap ~1 menit untuk jeda antar batch).
app.post("/api/cron/email-queue", async (req, res) => {
  const secret = req.get("x-cron-secret") || (req.query && req.query.key) || "";
  if (!CRON_SECRET || secret !== CRON_SECRET) return res.status(401).json({ error: "unauthorized" });
  if (!admin) return res.status(500).json({ error: "Server belum dikonfigurasi." });
  try { return res.json(await blast.processBatch(blastCtx())); }
  catch (e) { console.error("email-queue:", e && e.message); return res.status(500).json({ error: e.message }); }
});

// ============ Blast: automation (trigger otomatis, WAJIB dry-run dulu) ============
app.get("/api/admin/email/automations", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer"); if (!ctx) return;
  try { const { data } = await admin.from("my20fit_email_automations").select("*").order("created_at", { ascending: false }); return res.json({ ok: true, automations: data || [] }); }
  catch (e) { return res.status(500).json({ error: e.message }); }
});
app.post("/api/admin/email/automations", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer"); if (!ctx) return;
  try {
    const b = req.body || {};
    if (!String(b.name || "").trim() || segments.PRESET_IDS.indexOf(b.segment_id) < 0 || blast.TEMPLATE_IDS.indexOf(b.template_id) < 0 || !String(b.subject || "").trim())
      return res.status(400).json({ error: "name/segment/template/subject wajib & valid" });
    // Selalu mulai dry-run + disabled (aman). Admin aktifkan setelah review.
    const { data } = await admin.from("my20fit_email_automations").insert({
      name: b.name.trim(), segment_id: b.segment_id, template_id: b.template_id, subject: b.subject.trim(),
      enabled: false, dry_run: true, daily_cap: b.daily_cap ? parseInt(b.daily_cap, 10) : 100, created_by: ctx.email || "admin",
    }).select("*").single();
    await adminAudit(ctx, "email.automation.create", data && data.id, { name: b.name });
    return res.json({ ok: true, automation: data });
  } catch (e) { return res.status(400).json({ error: e.message }); }
});
app.post("/api/admin/email/automations/:id/toggle", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer"); if (!ctx) return;
  try {
    const b = req.body || {};
    const patch = { updated_at: new Date().toISOString() };
    if (typeof b.enabled === "boolean") patch.enabled = b.enabled;
    if (typeof b.dry_run === "boolean") patch.dry_run = b.dry_run;
    await admin.from("my20fit_email_automations").update(patch).eq("id", req.params.id);
    await adminAudit(ctx, "email.automation.toggle", req.params.id, patch);
    return res.json({ ok: true });
  } catch (e) { return res.status(400).json({ error: e.message }); }
});
// Hasil dry-run (siapa yang AKAN dikirim) — untuk review sebelum diaktifkan live.
app.get("/api/admin/email/automations/:id/dryrun", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer"); if (!ctx) return;
  try {
    const { count } = await admin.from("my20fit_email_automation_log").select("id", { count: "exact", head: true }).eq("automation_id", req.params.id).eq("action", "dry_run");
    const { data: sample } = await admin.from("my20fit_email_automation_log").select("user_id,created_at").eq("automation_id", req.params.id).eq("action", "dry_run").order("created_at", { ascending: false }).limit(20);
    return res.json({ ok: true, would_send_total: count || 0, sample: sample || [] });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// ---------- Middleware: rate limiters ----------
// CATATAN: helmet + express.json (rawBody webhook) + urlencoded + trust proxy sudah
// DIPINDAH ke ATAS route pertama (blok "Core middleware") supaya semua route dapat req.body.

// Polling status pembayaran itu MEMANG sering: js/deals.js poll tiap 5 detik selama menunggu
// (12 req/menit). Dengan limit umum 50/10 menit, user kena limit sendiri setelah ~4 menit
// menunggu — padahal invoice Xendit hidup berjam-jam & transfer bank sering >5 menit. Setelah
// itu 429 dijawab, klien menelannya dan order dianggap BELUM LUNAS selamanya: user sudah bayar
// tapi kredit tak pernah muncul. Jadi endpoint status (terautentikasi, read-only, idempoten)
// punya limiter sendiri yang longgar; sisanya tetap ketat.
const PAYMENT_POLL_PATHS = new Set(["/api/scan/order-status", "/api/scan/reconcile", "/api/photo/scan-status"]);
const isPollPath = (req) => PAYMENT_POLL_PATHS.has((req.originalUrl || "").split("?")[0]);
// Proxy gambar preview foto (/api/photo/thumb/:id) = satu request per thumbnail. Satu carousel
// bisa memuat belasan gambar sekaligus -> jangan dihitung ke ember 50/10mnt (nanti user kehabisan
// limit hanya karena membuka dashboard). Punya limiter sendiri yang longgar + cache browser.
const isImgPath = (req) => { const _p = (req.originalUrl || "").split("?")[0]; return _p.startsWith("/api/photo/thumb/") || _p.startsWith("/api/menu/photo"); };
// Unggah foto resep (submit resep multi-langkah bisa mengirim belasan gambar beruntun) ->
// jangan dihitung ke ember 50/10mnt; ada uploadLimiter sendiri di bawah.
const isMenuUploadPath = (req) => (req.originalUrl || "").split("?")[0].startsWith("/api/menu/upload");

// message berupa OBJEK -> express-rate-limit membalas JSON. Kalau string (default), body-nya
// text/html dan res.json() di klien meledak -> error ditelan diam-diam (persis bug di atas).
const limitMsg = { error: "Terlalu banyak permintaan. Coba lagi sebentar lagi.", rate_limited: true };

const apiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 menit
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: limitMsg,
  skip: (req) => isPollPath(req) || isImgPath(req) || isMenuUploadPath(req), // ditangani pollLimiter/imgLimiter/uploadLimiter di bawah
});
const pollLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 400, // 5 detik/poll = 120/10 menit per order; longgar utk beberapa order + sapuan
  standardHeaders: true,
  legacyHeaders: false,
  message: limitMsg,
});
// Limiter khusus proxy gambar preview foto — longgar (satu carousel = belasan gambar), tetap
// membatasi penyalahgunaan. Digabung cache browser (Cache-Control) supaya load ulang tak menembak lagi.
const imgLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: limitMsg,
});
app.use("/api/", apiLimiter);
app.use("/api/scan/order-status", pollLimiter);
app.use("/api/scan/reconcile", pollLimiter);
app.use("/api/photo/scan-status", pollLimiter);
app.use("/api/photo/thumb/", imgLimiter);
app.use("/api/menu/photo", imgLimiter); // foto katalog menu.20fit.id (publik) — kuota longgar, exempt dari apiLimiter 50/10mnt via isImgPath
// Unggah foto resep (submit/revisi, butuh login): longgar utk foto per-langkah beruntun, tetap terbatas.
const uploadLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false, message: limitMsg });
app.use("/api/menu/upload", uploadLimiter);

// Limiter KETAT untuk endpoint kredensial — 50/10mnt global terlalu longgar buat
// tebak-password / OTP. 12 percobaan / 15 menit / IP masih longgar utk user sah.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: limitMsg,
});
app.use([
  "/api/fitco-login", "/api/fitco-register", "/api/fitco-forgot", "/api/fitco-reset",
  "/api/fitco-verify-email", "/api/fitco-resend-verify-email",
], authLimiter);

// Limiter AI generatif (translate) — panggilan berbiaya ke OpenRouter. Cegah dipakai sebagai
// layanan terjemahan umum. Per-IP (pola sama seperti limiter lain; auth user diverifikasi di route).
const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, max: 20,
  standardHeaders: true, legacyHeaders: false, message: limitMsg,
});
app.use("/api/translate", aiLimiter);
// Limiter scan publik anonim — AI berbiaya. Lebih ketat dari apiLimiter (yang tetap berlaku juga).
const pubScanLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, max: 15,
  standardHeaders: true, legacyHeaders: false, message: limitMsg,
});

// Jaring pengaman proses: JANGAN biarkan promise-rejection / exception tak tertangani meng-crash
// server (dulu bisa bikin request in-flight kena 502 platform tanpa jejak). Log saja, proses hidup.
process.on("unhandledRejection", (reason) => {
  try { console.error("unhandledRejection:", (reason && reason.stack) || reason); } catch (e) {}
});
process.on("uncaughtException", (err) => {
  try { console.error("uncaughtException:", (err && err.stack) || err); } catch (e) {}
});

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

// ---------- Ekosistem sub-domain: identitas anonim + guard SSO (FASE 1B foundation) ----------
// Kuota scan anonim TIDAK di localStorage (gampang dihapus) — dicatat di server per anon_id.
const ANON_COOKIE = "eco_anon";
const ANON_SCAN_LIMIT = 5;            // 5 scan TOTAL utk pengunjung anonim (bukan harian; tak ada reset).
const ANON_SCAN_TTL_DAYS = 7;         // hasil scan anonim disimpan sementara, dihapus cron.
const ANON_SALT = process.env.ANON_ID_SALT || SUPABASE_SERVICE_KEY || "20fit"; // garam hash IP (jangan simpan IP mentah).
function readCookie(req, name) {
  const raw = String(req.headers.cookie || "");
  const parts = raw.split(";");
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i].trim(); const eq = p.indexOf("=");
    if (eq > 0 && p.slice(0, eq) === name) { try { return decodeURIComponent(p.slice(eq + 1)); } catch (e) { return p.slice(eq + 1); } }
  }
  return null;
}
// Ambil / buat sesi anonim (cookie httpOnly). createIfMissing=false -> jangan buat baru (read-only).
async function getAnonSession(req, res, createIfMissing) {
  if (!admin) return null;
  const existing = readCookie(req, ANON_COOKIE);
  if (existing) {
    const { data } = await admin.from("my20fit_anonymous_sessions").select("*").eq("anon_id", existing).limit(1);
    if (data && data[0]) return data[0];
  }
  if (!createIfMissing) return null;
  const anonId = crypto.randomUUID();
  const row = {
    anon_id: anonId,
    ip_hash: sha256((req.ip || "") + "|" + ANON_SALT).slice(0, 64),
    ua_hash: sha256(String(req.headers["user-agent"] || "") + "|" + ANON_SALT).slice(0, 32),
    scan_count: 0,
  };
  const { data: ins } = await admin.from("my20fit_anonymous_sessions").insert(row).select("*").limit(1);
  res.cookie(ANON_COOKIE, anonId, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 30 * 24 * 3600 * 1000 });
  return (ins && ins[0]) || row;
}
// return_to WAJIB *.20fit.id (anti open-redirect). Selain https + domain 20fit -> null (jangan dipakai).
function safeReturnTo(url) {
  try {
    const u = new URL(String(url || ""));
    if (u.protocol !== "https:") return null;
    const h = u.hostname.toLowerCase();
    return (h === "20fit.id" || h.endsWith(".20fit.id")) ? u.toString() : null;
  } catch (e) { return null; }
}

// Ambil user dari Authorization: Bearer <jwt>
// null = token memang TIDAK SAH (pemanggil balas 401).
// throw (status 503) = kita TIDAK BISA memverifikasi (Supabase lambat/mati/timeout).
//
// Kenapa dibedakan: dulu `if (error) return null` menyamaratakan SEMUA kegagalan, jadi
// Supabase tersendat dilaporkan ke user sebagai "Unauthorized". User (dan yang men-debug)
// dikirim ke arah salah — mengira sesinya habis, disuruh logout-login, padahal loginnya
// baik-baik saja dan yang bermasalah infrastruktur. Kegagalan infrastruktur TIDAK BOLEH
// menyamar jadi kegagalan autentikasi.
async function getUserFromReq(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token || !anon) return null;
  let data, error;
  try {
    ({ data, error } = await anon.auth.getUser(token));
  } catch (e) {
    // Timeout/jaringan (mis. AbortError dari supaFetch) -> bukan urusan token.
    const err = new Error("auth_unavailable");
    err.status = 503;
    err.userMessage = "Tidak bisa memverifikasi sesi kamu saat ini. Coba lagi sebentar lagi.";
    try { console.error("getUserFromReq infra:", (e && e.message) || e); } catch (_) {}
    throw err;
  }
  if (error) {
    // Token benar-benar ditolak (401/403) -> null. Selain itu (5xx / status kosong =
    // gagal jaringan menurut supabase-js) -> masalah infrastruktur.
    const st = +(error.status || 0);
    if (st === 401 || st === 403 || st === 400) return null;
    const err = new Error("auth_unavailable");
    err.status = 503;
    err.userMessage = "Tidak bisa memverifikasi sesi kamu saat ini. Coba lagi sebentar lagi.";
    try { console.error("getUserFromReq infra:", st, error.message); } catch (_) {}
    throw err;
  }
  return data.user || null;
}

// ---------- API ----------

// Config publik untuk frontend (URL + anon key — keduanya memang publik)
app.get("/api/config", (req, res) => {
  res.json({
    supabaseUrl: SUPABASE_URL || "",
    supabaseAnonKey: SUPABASE_ANON_KEY || "",
    version: "xendit-live-2",
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
  // Koordinat = ANGKA tervalidasi (cegah injeksi parameter ke URL pihak ketiga).
  const lat = parseFloat(req.query.lat), lon = parseFloat(req.query.lon);
  const hasCoord = isFinite(lat) && isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
  let aqi = null, source = null, city = req.query.city || "";
  // 1) WAQI (kalau token tersedia & ada koordinat)
  if (WAQI_TOKEN && hasCoord) {
    try {
      const r = await fetch("https://api.waqi.info/feed/geo:" + lat + ";" + lon + "/?token=" + encodeURIComponent(WAQI_TOKEN));
      const j = await r.json();
      if (j && j.status === "ok" && j.data && typeof j.data.aqi === "number") {
        aqi = j.data.aqi; source = "WAQI"; city = (j.data.city && j.data.city.name) || city;
      }
    } catch (e) { /* fallback */ }
  }
  // 2) Fallback Open-Meteo (model global CAMS)
  if (aqi == null && hasCoord) {
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

// ---------- Pembayaran paket scan: Xendit via API shop order FITCO/20FIT ----------
// POST /api/v1/third-party/shop/order (payment_type "xendit-invoices"). FITCO yang membuat
// invoice Xendit; server kita hanya inisiasi order + poll status. Auth pakai FITCO_PARTNER_TOKEN
// (didefinisikan bareng blok order 20FIT di bawah).
// "1" = tandai Xendit aktif di /api/config (info untuk frontend).
const XENDIT_ENABLED = process.env.XENDIT_ENABLED === "1";

// Asal URL publik app ini, dipakai sbg tujuan kepulangan invoice Xendit (lihat
// createFitcoXenditOrder). Bukan rahasia — pola default publik sama dgn FITCO_API /
// GOOGLE_CLIENT_ID. Set APP_BASE_URL di Railway staging supaya staging balik ke staging.
const APP_BASE_URL = (process.env.APP_BASE_URL || "https://my.20fit.id").replace(/\/+$/, "");

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

// =============================================================
//  INTEGRASI photo.20fit.id (marketplace foto event 20FIT)
//  ------------------------------------------------------------
//  my.20fit.id & photo.20fit.id memakai PROJECT SUPABASE YANG SAMA
//  (cpvzwqptzcxnwzfzgrmt). Karena itu access_token Supabase user di sini
//  SAH juga di photo.20fit.id (requireAuth-nya verifikasi via JWKS project
//  yang sama). Jadi server ini memanggil API photo ATAS NAMA user dengan
//  MENERUSKAN token Supabase-nya apa adanya — tanpa API key rahasia,
//  tanpa perubahan kode di sisi photo.20fit.id.
//
//  requireAuth photo TIDAK auto-create baris users; POST /auth/sync-supabase-user
//  yang membuat/menautkannya (by supabase_auth_id -> email -> insert). Jadi
//  setiap alur memanggil sync dulu, baru endpoint datanya.
// =============================================================
const PHOTO_APP_ORIGIN = (process.env.PHOTO_APP_URL || "https://photo.20fit.id").replace(/\/+$/, "");
const PHOTO_API_BASE = (process.env.PHOTO_API_URL || (PHOTO_APP_ORIGIN + "/api")).replace(/\/+$/, "");
// Halaman yang MEN-SEAT sesi Supabase di photo.20fit.id. Tidak ada route "/sso" di sana;
// yang ada /auth/callback (detectSessionInUrl men-seat #access_token, lalu sync-supabase-user).
const PHOTO_SSO_REDIRECT = process.env.PHOTO_SSO_REDIRECT || (PHOTO_APP_ORIGIN + "/auth/callback");
const PHOTO_OP_TIMEOUT_MS = parseInt(process.env.PHOTO_OP_TIMEOUT_MS || "12000", 10);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Panggil API photo.20fit.id (fetch ke luar TIDAK ikut supaFetch -> WAJIB ber-timeout sendiri).
async function photoApi(pathOrUrl, opts = {}) {
  const url = /^https?:/i.test(pathOrUrl) ? pathOrUrl : (PHOTO_API_BASE + pathOrUrl);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), opts.timeoutMs || PHOTO_OP_TIMEOUT_MS);
  try {
    const headers = Object.assign({ Accept: "application/json" }, opts.headers || {});
    if (opts.token) headers.Authorization = "Bearer " + opts.token;
    return await fetch(url, { method: opts.method || "GET", headers, body: opts.body, signal: ctrl.signal });
  } finally { clearTimeout(t); }
}
async function photoApiJson(pathOrUrl, opts = {}) {
  const r = await photoApi(pathOrUrl, opts);
  let json = null; try { json = await r.json(); } catch (e) {}
  return { status: r.status, ok: r.ok, json };
}

// ---------- SSO KELUAR: buka 20FIT Photo (photo.20fit.id) tanpa login ulang ----------
// Jalur UTAMA (di frontend, Auth.photoSso): oper access_token+refresh_token sesi Supabase yang
// SUDAH ada di browser ini lewat URL fragment ke photo.20fit.id/auth/callback (nol konfigurasi).
// Endpoint ini = FALLBACK saat browser tak punya sesi: mint magic link Supabase ber-redirect ke
// /auth/callback. action_link -> GoTrue /verify -> 302 ke callback#access_token=... (di-seat oleh
// detectSessionInUrl photo). ⚠️ redirect_to WAJIB masuk allow-list "Redirect URLs" project Supabase,
// kalau tidak GoTrue jatuh ke Site URL (bukan photo). Fragment tak pernah masuk log server.
app.post("/api/photo-sso", async (req, res) => {
  try {
    if (!admin) return res.status(500).json({ error: "Server belum dikonfigurasi (service key)." });
    const user = await getUserFromReq(req);
    const email = user && user.email ? String(user.email).trim().toLowerCase() : "";
    if (!email) return res.status(401).json({ error: "Butuh sesi login. Silakan login ulang.", session_expired: true });
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink", email, options: { redirectTo: PHOTO_SSO_REDIRECT },
    });
    if (linkErr) throw linkErr;
    const actionLink = (linkData && linkData.properties && linkData.properties.action_link) || null;
    if (!actionLink) return res.status(500).json({ error: "Gagal menyiapkan SSO. Coba lagi." });
    return res.json({ ok: true, email, sso_url: actionLink });
  } catch (e) {
    if (e && e.status === 503) return res.status(503).json({ error: e.userMessage || "Coba lagi sebentar lagi." });
    console.error("photo-sso:", e && e.message);
    return res.status(500).json({ error: "Gagal membuka 20FIT Photo. Coba lagi." });
  }
});

// ---------- /api/photo/list : katalog foto user (sudah dibeli vs belum) ----------
// Meneruskan token Supabase user ke photo.20fit.id. hasFace menentukan Case A (sudah pernah
// scan wajah -> tampil katalog) vs Case B (belum -> tampil ajakan scan di frontend).
app.get("/api/photo/list", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const user = await getUserFromReq(req);
    if (!user || !token) return res.status(401).json({ error: "Sesi kamu sudah habis. Silakan login lagi.", session_expired: true });

    // 1) Pastikan baris user ADA/tertaut di photo.20fit (requireAuth tak auto-create).
    try { await photoApiJson("/auth/sync-supabase-user", { method: "POST", token, timeoutMs: PHOTO_OP_TIMEOUT_MS }); } catch (e) {}

    // 2) Ambil status wajah + foto match + pembelian + kuota scan — paralel, tahan-gagal.
    const [meR, photosR, purchR, scanR] = await Promise.all([
      photoApiJson("/auth/me", { token }).catch(() => ({ ok: false })),
      photoApiJson("/photos?limit=200&page=1", { token }).catch(() => ({ ok: false })),
      photoApiJson("/purchases/my-photos", { token }).catch(() => ({ ok: false })),
      photoApiJson("/face/scan-status", { token }).catch(() => ({ ok: false })),
    ]);

    // Semua gagal -> photo.20fit tak terjangkau. Degradasi lembut (UI tampil "coba lagi").
    if (!meR.ok && !photosR.ok && !purchR.ok && !scanR.ok) {
      return res.json({ ok: true, unavailable: true, hasFace: null, bought: [], notBought: [] });
    }

    const me = meR.json || {};
    const scan = scanR.json || {};
    const hasFace = !!(me.isVerified || scan.hasLockedFace);

    // Prefer presigned R2 (lintas-origin aman); kalau tak ada -> proxy lokal (referer-safe).
    const thumbOf = (id, signed) => (signed && /^https?:/i.test(signed)) ? signed : ("/api/photo/thumb/" + encodeURIComponent(id));
    const notBought = [], boughtMap = {};

    const matched = (photosR.json && Array.isArray(photosR.json.photos)) ? photosR.json.photos : [];
    for (const m of matched) {
      const p = m && m.photo; if (!p || !p.id) continue;
      // "Dimiliki" = sudah dibayar ATAU gratis-berhak (grant 100% EO / event free / free_access).
      // photos.ts mengekspos flag ini justru supaya foto gratis TIDAK ditampilkan "Beli"+watermark.
      const freeOwned = !!(p.eventFullAccess || p.eventAccessMode === "free" || p.eventAccessMode === "free_access");
      const owned = !!p.isPurchased || freeOwned;
      const item = {
        id: p.id,
        eventName: p.eventName || "",
        price: owned ? null : ((typeof p.price === "number") ? p.price : null),
        discountPercent: owned ? 0 : (p.eventDiscountPercent || 0),
        purchased: owned,
        thumb: thumbOf(p.id, p.thumbnailSignedUrl),
      };
      if (owned) boughtMap[p.id] = item; else notBought.push(item);
    }
    // Pembelian yang wajahnya TAK ke-match (mis. beli All-Access) tak muncul di /photos -> gabungkan.
    const purchased = (purchR.json && Array.isArray(purchR.json.photos)) ? purchR.json.photos : [];
    for (const q of purchased) {
      const id = q && (q.photoId || q.id); if (!id || boughtMap[id]) continue;
      boughtMap[id] = { id, eventName: q.eventName || "", price: null, discountPercent: 0, purchased: true, thumb: thumbOf(id, null) };
    }
    const bought = Object.keys(boughtMap).map((k) => boughtMap[k]);
    // "Dimiliki" menang: cache /photos (5 mnt, per-proses, multi-instance) bisa stale isPurchased=false
    // padahal /purchases sudah lunas -> buang id yang sudah di bought supaya tak dobel di 2 carousel.
    const notBoughtFinal = notBought.filter((it) => !boughtMap[it.id]);

    return res.json({
      ok: true,
      hasFace,
      // photosOk membedakan "foto memang kosong" vs "panggilan /photos gagal" — frontend pakai
      // ini untuk memilih empty-state (belum ada foto) vs "coba lagi" (jangan suruh rescan sia-sia).
      photosOk: !!photosR.ok,
      scan: {
        remaining: (typeof scan.scansRemaining === "number") ? scan.scansRemaining : null,
        allowed: scan.allowed !== false,
        cooldownUntil: scan.cooldownUntil || null,
      },
      counts: { matched: matched.length, bought: bought.length, notBought: notBoughtFinal.length },
      bought, notBought: notBoughtFinal,
    });
  } catch (e) {
    if (e && e.status === 503) return res.status(503).json({ error: e.userMessage || "Coba lagi sebentar lagi." });
    console.error("photo/list:", e && e.message);
    return res.status(500).json({ error: "Gagal memuat fotomu. Coba lagi." });
  }
});

// ---------- /api/photo/thumb/:id : proxy gambar preview (publik, referer-safe) ----------
// <img> tak bisa kirim Authorization, jadi endpoint ini TANPA auth — hanya menyalurkan
// preview watermark (aset publik, low-value). Proxy thumbnail/watermarked photo.20fit.id yang
// hotlink-protected: server set Referer photo.20fit.id supaya lolos. Divalidasi UUID (anti-SSRF).
app.get("/api/photo/thumb/:id", async (req, res) => {
  const id = String(req.params.id || "");
  if (!UUID_RE.test(id)) return res.status(400).end();
  // JANGAN jadi open-relay untuk hotlink pihak ketiga: kita spoof Referer photo.20fit
  // (biar lolos hotlink-protection mereka), jadi tolak request cross-site. Browser meng-set
  // Sec-Fetch-Site untuk <img> pihak ketiga & itu tak bisa dipalsukan dari halaman attacker;
  // <img> di dashboard my.20fit sendiri = same-origin (lolos). Header absen (browser lama/tak ada) -> izinkan.
  const sfs = String(req.headers["sec-fetch-site"] || "");
  if (sfs && sfs !== "same-origin" && sfs !== "same-site" && sfs !== "none") return res.status(403).end();
  const wm = String(req.query.wm || "") === "1";
  const path = (wm ? "/photos/watermarked/" : "/photos/thumbnail/") + id;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), PHOTO_OP_TIMEOUT_MS);
  try {
    const r = await fetch(PHOTO_API_BASE + path, {
      headers: { Referer: PHOTO_APP_ORIGIN + "/", Accept: "image/*" },
      signal: ctrl.signal,
    });
    if (!r.ok) { res.status(502).end(); return; }
    // Preview kecil (~20KB thumbnail / ratusan KB watermark). Batasi biar tak jadi jalur memori besar.
    const len = +(r.headers.get("content-length") || 0);
    if (len && len > 6 * 1024 * 1024) { res.status(502).end(); return; }
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 6 * 1024 * 1024) { res.status(502).end(); return; }
    res.setHeader("Content-Type", r.headers.get("content-type") || "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.end(buf);
  } catch (e) {
    res.status(504).end();
  } finally { clearTimeout(t); }
});

// ---------- /api/photo/scan : Case B — daftarkan wajah user (proxy ke /selfie/process) ----------
// Frontend kirim selfie (base64 terkompres). Server ubah ke multipart 'image' (WAF photo memblok
// base64-in-JSON) lalu teruskan ke POST /selfie/process ATAS NAMA user. Itu register wajah +
// retro-match semua event. Sekali sukses, user jadi Case A.
app.post("/api/photo/scan", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const user = await getUserFromReq(req);
    if (!user || !token) return res.status(401).json({ error: "Sesi kamu sudah habis. Silakan login lagi.", session_expired: true });

    let img = (req.body && req.body.image) || "";
    if (typeof img !== "string" || !img) return res.status(400).json({ error: "Foto selfie diperlukan." });
    const comma = img.indexOf(",");
    if (img.startsWith("data:") && comma > -1) img = img.slice(comma + 1); // buang prefix data URL
    let buf; try { buf = Buffer.from(img, "base64"); } catch (e) { buf = null; }
    if (!buf || buf.length < 500) return res.status(400).json({ error: "Gambar tidak valid." });
    if (buf.length > 9 * 1024 * 1024) return res.status(413).json({ error: "Foto terlalu besar. Coba foto lain." });

    // Pastikan baris user ada di photo.20fit dulu (kalau belum, /selfie/process bisa 401).
    try { await photoApiJson("/auth/sync-supabase-user", { method: "POST", token, timeoutMs: PHOTO_OP_TIMEOUT_MS }); } catch (e) {}

    const fd = new FormData();
    fd.append("image", new Blob([buf], { type: "image/jpeg" }), "selfie.jpg");
    const r = await photoApi("/selfie/process", { method: "POST", token, body: fd, timeoutMs: 90000 });
    let j = null; try { j = await r.json(); } catch (e) {}
    j = j || {};

    if (r.ok) {
      return res.json({ ok: true, step: j.step || "done", count: (typeof j.count === "number") ? j.count : null, attemptId: j.attemptId || null });
    }
    // scan sedang diproses -> minta frontend polling.
    if (r.status === 409) return res.json({ ok: true, step: "processing", attemptId: j.attemptId || null });
    const code = j.error || j.code || "scan_failed";
    const status = (r.status === 429) ? 429 : (r.status === 403) ? 403 : (r.status === 422) ? 422 : (r.status >= 500 ? 502 : 400);
    return res.status(status).json({ ok: false, code, error: (j.message || "Gagal memproses scan. Coba lagi.") });
  } catch (e) {
    if (e && e.status === 503) return res.status(503).json({ error: e.userMessage || "Coba lagi sebentar lagi." });
    console.error("photo/scan:", e && e.message);
    return res.status(502).json({ error: "Gagal memproses scan. Coba lagi." });
  }
});

// ---------- /api/photo/scan-status : polling progres /selfie/process ----------
app.get("/api/photo/scan-status", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const user = await getUserFromReq(req);
    if (!user || !token) return res.status(401).json({ error: "Sesi kamu sudah habis. Silakan login lagi.", session_expired: true });
    const { ok, json } = await photoApiJson("/selfie/status", { token });
    if (!ok) return res.json({ ok: true, status: "unknown" });
    const j = json || {};
    // photo /selfie/status: error = kode mesin (no_face_detected...), errorMessage = teks manusia.
    // Utamakan teks manusia supaya modal tak menampilkan kode mentah ke user.
    return res.json({ ok: true, status: j.status || "idle", step: j.step || null, count: (typeof j.count === "number") ? j.count : null, code: j.error || null, error: j.errorMessage || j.error || null });
  } catch (e) {
    if (e && e.status === 503) return res.status(503).json({ error: e.userMessage || "Coba lagi sebentar lagi." });
    console.error("photo/scan-status:", e && e.message);
    return res.status(500).json({ error: "Gagal cek status scan." });
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
    // PRIVASI: data siklus menstruasi (cycle_last_period/cycle_length) TIDAK PERNAH
    // dikembalikan ke pihak mana pun selain user sendiri — termasuk partner API.
    let q = admin.from("my20fit_profile")
      .select("auth_user_id,email,full_name,phone,gender,age,height_cm,weight_kg,main_goal,health_conditions,avatar_url,is_plus_member,onboarding_completed,updated_at")
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

// ---------- Embed ticket.20fit.id (lewat edge function `ticket-embed`) ----------
// Kontrak (dari edge function ticket-embed, verify_jwt): action `user_token` (email dari sesi)
// → { userToken }; `my_tickets` {userToken} → daftar tiket ASLI user; `ticket_qr` {userToken,code}
// → QR e-tiket ASLI. Dipanggil dgn JWT user. SEMUA tahan-gagal (embed mati → fallback ke
// event_transaction tanpa QR). Bentuk field respons upstream dipetakan defensif (multi-nama).
const TICKET_EMBED_URL = String(SUPABASE_URL || "").replace(/\/+$/, "") + "/functions/v1/ticket-embed";
function bearerOf(req) { const h = req.headers.authorization || ""; return h.startsWith("Bearer ") ? h.slice(7) : ""; }
function firstOf(o, keys) { for (const k of keys) { if (o && o[k] != null && o[k] !== "") return o[k]; } return null; }
function pickArray(d) {
  if (Array.isArray(d)) return d;
  if (d && typeof d === "object") { for (const k of ["tickets", "data", "items", "results"]) if (Array.isArray(d[k])) return d[k]; }
  return null;
}
async function ticketEmbed(userJwt, action, extra) {
  if (!userJwt || !SUPABASE_ANON_KEY) return { status: 0, data: null };
  const ctrl = new AbortController(); const to = setTimeout(() => { try { ctrl.abort(); } catch (_) {} }, 10000);
  try {
    const r = await fetch(TICKET_EMBED_URL, {
      method: "POST", signal: ctrl.signal,
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + userJwt, apikey: SUPABASE_ANON_KEY },
      body: JSON.stringify(Object.assign({ action }, extra || {})),
    });
    const j = await r.json().catch(() => null);
    return { status: r.status, data: j };
  } catch (e) { return { status: 0, data: null, error: e && e.message }; } finally { clearTimeout(to); }
}
function mapEmbedTicket(t) {
  t = t || {};
  const code = firstOf(t, ["code", "ticketCode", "ticket_code", "id", "ref", "reference"]);
  return {
    ref: code != null ? String(code) : null,
    code: code != null ? String(code) : null,
    event_name: firstOf(t, ["eventName", "event_name", "event", "title", "name"]) || "Event 20FIT",
    product_name: firstOf(t, ["ticketType", "ticket_type", "categoryName", "category", "productName", "product_name"]),
    holder: firstOf(t, ["holderName", "holder", "attendeeName", "attendee", "customerName", "name"]),
    paid_at: firstOf(t, ["purchasedAt", "paidAt", "paid_at", "createdAt", "created_at", "date"]),
    status: "valid",
    cover_url: firstOf(t, ["coverUrl", "cover_url", "bannerUrl", "image"]),
    has_qr: true,   // QR asli diambil lazy via /api/tickets/qr?code=
    qr: null,
  };
}
async function embedMyTickets(userJwt) {
  const ut = await ticketEmbed(userJwt, "user_token");
  const userToken = ut.data && firstOf(ut.data, ["userToken", "user_token", "token"]);
  if (!userToken) return null;
  const mt = await ticketEmbed(userJwt, "my_tickets", { userToken });
  const arr = pickArray(mt.data);
  if (!arr) return null;
  return arr.map(mapEmbedTicket).filter(t => t.code);
}

// ---------- /api/tickets/mine : tiket event yang DIBELI user (widget "My Tickets") ----------
// SUMBER UTAMA: embed ticket.20fit.id (tiket ASLI + kode → QR asli). FALLBACK (embed mati/kosong):
// event_transaction (impor invoice Mayar) — pembelian NYATA per email user. READ-ONLY.
//  - CLAUDE.md §4: tabel non-`my20fit_*` milik app lain → HANYA SELECT.
//  - Per-user KETAT: email dari my20fit_profile by auth_user_id (bukan client). Service key bypass
//    RLS → filter email WAJIB + exact-match di JS.
//  - QR: event_transaction TIDAK punya kode gerbang. Sesuai ATURAN KERAS 2b, JANGAN mengarang QR
//    (dan JANGAN pakai rc_ticket_invites.token — itu undangan race-timing, bukan tiket berbayar).
//    QR/e-tiket asli diterbitkan ticket.20fit.id (via API_TICKET) — integrasi belum tersambung,
//    jadi kartu tampil TANPA QR + arahkan ke penerbit. `qr_pending:true`.
//  - TAHAN-GAGAL: query error → {ok:true, tickets:[]}.
app.get("/api/tickets/mine", async (req, res) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ error: "Sesi kamu sudah habis. Silakan login lagi.", session_expired: true });
    if (!admin) return res.json({ ok: true, tickets: [] });
    let email = String(user.email || "").trim().toLowerCase();
    try {
      const { data: prof } = await admin.from("my20fit_profile").select("email").eq("auth_user_id", user.id).limit(1);
      if (prof && prof[0] && prof[0].email) email = String(prof[0].email).trim().toLowerCase();
    } catch (_) {}
    if (!email) return res.json({ ok: true, tickets: [] });
    // SUMBER UTAMA: tiket ASLI + QR dari ticket.20fit.id (embed). Tahan-gagal → fallback di bawah.
    try {
      const embedList = await embedMyTickets(bearerOf(req));
      if (Array.isArray(embedList) && embedList.length) {
        return res.json({ ok: true, tickets: embedList, source: "embed", count: embedList.length });
      }
    } catch (_) {}
    // FALLBACK: pembelian dari event_transaction (tanpa QR gerbang).
    let rows = [];
    try {
      const { data, error } = await admin.from("event_transaction")
        .select("invoice_id,product_name,event_name,customer_name,status,paid_at,gross_amount,is_excluded,email")
        .ilike("email", email).limit(100);
      if (error) throw error;
      rows = (data || []).filter(r => String(r.email || "").trim().toLowerCase() === email && r.is_excluded !== true);
    } catch (_) { return res.json({ ok: true, tickets: [] }); }
    const isPaid = (s) => /paid|settle|success|complete/i.test(String(s || ""));
    const tickets = rows.filter(r => isPaid(r.status)).map(r => ({
      ref: (String(r.invoice_id || "").slice(0, 24)) || null,
      event_name: r.event_name || r.product_name || "Event 20FIT",
      product_name: r.product_name || null,
      holder: r.customer_name || null,
      status: "valid",
      paid_at: r.paid_at || null,
      amount: (r.gross_amount == null ? null : Number(r.gross_amount)),
      qr: null,          // TIDAK dikarang — QR gerbang asli diterbitkan ticket.20fit.id
      qr_pending: true,
    }));
    tickets.sort((a, b) => String(b.paid_at || "").localeCompare(String(a.paid_at || "")));
    return res.json({ ok: true, tickets, count: tickets.length });
  } catch (e) {
    try { console.error("tickets/mine:", e && e.message); } catch (_) {}
    return res.json({ ok: true, tickets: [] }); // tahan-gagal
  }
});

// ---------- /api/tickets/qr?code= : QR e-tiket ASLI (ticket.20fit.id via embed, lazy) ----------
// Dipanggil saat user membuka QR sebuah tiket. Ambil userToken (email sesi) lalu ticket_qr{code}.
// Normalisasi respons upstream ke {img|svg|payload} agar frontend bisa render apa pun bentuknya.
// ?debug=1 (superadmin) → kembalikan respons mentah utk memetakan bentuk sekali saja.
app.get("/api/tickets/qr", async (req, res) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ error: "Sesi kamu sudah habis." });
    const code = String(req.query.code || "").trim();
    if (!code) return res.status(400).json({ error: "code wajib." });
    const userJwt = bearerOf(req);
    const ut = await ticketEmbed(userJwt, "user_token");
    const userToken = ut.data && firstOf(ut.data, ["userToken", "user_token", "token"]);
    if (!userToken) return res.json({ ok: false, error: "no_user_token" });
    const qr = await ticketEmbed(userJwt, "ticket_qr", { userToken, code });
    const d = qr.data;
    if (String(req.query.debug || "") === "1") {
      const ctx = await getAdminContext(req);
      if (ctx && ctx.role === "superadmin") return res.json({ ok: true, debug: true, raw: d });
    }
    let img = null, svg = null, payload = null;
    const looksImg = (s) => /^https?:\/\//i.test(String(s)) || /^data:image\//i.test(String(s));
    if (typeof d === "string") {
      if (looksImg(d)) img = d; else if (/<svg/i.test(d)) svg = d; else payload = d;
    } else if (d && typeof d === "object") {
      img = firstOf(d, ["qrUrl", "qr_url", "imageUrl", "image_url", "png", "url", "dataUrl", "data_url"]);
      if (img && !looksImg(img)) img = "data:image/png;base64," + img; // base64 mentah
      svg = firstOf(d, ["svg", "qrSvg", "qr_svg"]);
      payload = firstOf(d, ["payload", "value", "content", "qr", "code", "token", "data"]);
      if (!img && payload && looksImg(payload)) { img = String(payload); payload = null; }
      if (!svg && payload && /<svg/i.test(String(payload))) { svg = String(payload); payload = null; }
    }
    return res.json({ ok: !!(img || svg || payload), img, svg, payload, code });
  } catch (e) {
    try { console.error("tickets/qr:", e && e.message); } catch (_) {}
    return res.json({ ok: false });
  }
});

// ---------- Katalog "Event Mendatang" (bisa dibeli) — dikelola admin, dibaca dashboard ----------
// Sumber tunggal: my20fit_ticket_events (prefiks my20fit_ sesuai CLAUDE.md §4; TIDAK menyentuh
// rc_events milik sistem race-timing app lain). Buy Now = deep-link ke
// ticket.20fit.id/id/events/<slug> (payment & tiket diproses DI SANA; kita tak proses bayar).
const TICKET_STATUS = ["draft", "on_sale", "sold_out", "closed"];
const TICKET_BUY_BASE = "https://ticket.20fit.id/id/events/";
function ticketBuyUrl(slug) {
  if (!slug) return null; // slug kosong → JANGAN fallback ke homepage; widget sembunyikan tombol
  return TICKET_BUY_BASE + encodeURIComponent(slug) + "?utm_source=my20fit&utm_medium=app_widget";
}
// Publik (tak butuh login): daftar event on_sale utk tab "Event Mendatang".
app.get("/api/events/upcoming", async (req, res) => {
  try {
    if (!admin) return res.status(503).json({ ok: false, error: "service unavailable" });
    const { data, error } = await admin.from("my20fit_ticket_events")
      .select("id,slug,name,subtitle,organizer,venue,city,starts_at,price_from,currency,category,cover_url")
      .eq("status", "on_sale").not("published_at", "is", null)
      .order("starts_at", { ascending: true, nullsFirst: false })
      .order("sort_order", { ascending: true })
      .limit(50);
    if (error) throw error;
    const events = (data || []).map(e => ({
      id: e.id, slug: e.slug || null, name: e.name,
      subtitle: e.subtitle || null, organizer: e.organizer || null,
      venue: e.venue || null, city: e.city || null,
      starts_at: e.starts_at || null,
      price_from: (e.price_from == null ? null : (+e.price_from | 0)),
      currency: e.currency || "IDR", category: e.category || null,
      cover_url: e.cover_url || null,
      buy_url: ticketBuyUrl(e.slug),
    }));
    return res.json({ ok: true, events });
  } catch (e) {
    try { console.error("events/upcoming:", e && e.message); } catch (_) {}
    // Kembalikan error nyata → widget bisa bedakan "gagal" (tombol coba lagi) dari "kosong".
    return res.status(500).json({ ok: false, error: (e && e.message) || "gagal memuat" });
  }
});

// ---------- Admin: "Sinkronkan sekarang" (tombol di admin-v2 Event) ----------
// Memicu edge function sync-ticket-events (tarik semua event + cover dari TICKET_API, upsert,
// archive yang hilang). Server memanggil pakai service key. Sync juga jalan otomatis harian (pg_cron).
app.post("/api/admin/sync-events", async (req, res) => {
  const ctx = await requireAdmin(req, res, "staff"); if (!ctx) return;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return res.status(500).json({ error: "Server belum dikonfigurasi." });
  try {
    const r = await fetch(SUPABASE_URL + "/functions/v1/sync-ticket-events", {
      method: "POST",
      headers: { Authorization: "Bearer " + SUPABASE_SERVICE_KEY, apikey: SUPABASE_SERVICE_KEY, "Content-Type": "application/json" },
      body: "{}",
    });
    const j = await r.json().catch(() => null);
    if (!r.ok) return res.status(502).json({ error: "Sinkronisasi gagal.", detail: j });
    await adminAudit(ctx, "ticket_events.sync", "", { upserted: (j && j.upserted_count) || 0, archived: (j && j.archived && j.archived.length) || 0 });
    return res.json({ ok: true, result: j });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// ---------- Admin CRUD katalog event (admin-v2 section Event) ----------
function ticketRowFromBody(b, ctx) {
  const now = new Date().toISOString();
  return {
    slug: String(b.slug || "").trim().toLowerCase().slice(0, 160),
    name: String(b.name || "").trim().slice(0, 200),
    subtitle: b.subtitle ? String(b.subtitle).slice(0, 240) : null,
    organizer: b.organizer ? String(b.organizer).slice(0, 160) : null,
    venue: b.venue ? String(b.venue).slice(0, 200) : null,
    city: b.city ? String(b.city).slice(0, 120) : null,
    starts_at: b.starts_at ? new Date(b.starts_at).toISOString() : null,
    price_from: Number.isFinite(+b.price_from) && String(b.price_from).trim() !== "" ? (+b.price_from | 0) : null,
    currency: (b.currency ? String(b.currency).trim().toUpperCase() : "IDR").slice(0, 8) || "IDR",
    category: b.category ? String(b.category).slice(0, 80) : null,
    cover_url: b.cover_url ? String(b.cover_url).slice(0, 500) : null,
    status: TICKET_STATUS.includes(b.status) ? b.status : "draft",
    sort_order: Number.isFinite(+b.sort_order) ? (+b.sort_order | 0) : 0,
    published_at: b.published ? (b.published_at ? new Date(b.published_at).toISOString() : now) : null,
    updated_at: now,
    updated_by: ctx.email || (ctx.via === "key" ? "master-key" : null),
  };
}
app.get("/api/admin/event-catalog", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer"); if (!ctx) return;
  try {
    const { data, error } = await admin.from("my20fit_ticket_events")
      .select("id,slug,name,subtitle,organizer,venue,city,starts_at,price_from,currency,category,cover_url,status,sort_order,published_at,updated_at,updated_by")
      .order("sort_order", { ascending: true })
      .order("starts_at", { ascending: true, nullsFirst: false });
    if (error) throw error;
    return res.json({ ok: true, events: data || [] });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});
app.post("/api/admin/event-catalog", async (req, res) => {
  const ctx = await requireAdmin(req, res, "staff"); if (!ctx) return;
  const b = req.body || {};
  const row = ticketRowFromBody(b, ctx);
  if (!row.name) return res.status(400).json({ error: "Nama event wajib." });
  if (!row.slug) return res.status(400).json({ error: "Slug wajib (untuk deep-link Beli Sekarang)." });
  try {
    let data, error;
    if (b.id) {
      ({ data, error } = await admin.from("my20fit_ticket_events").update(row).eq("id", String(b.id)).select("id").limit(1));
    } else {
      ({ data, error } = await admin.from("my20fit_ticket_events").insert(row).select("id").limit(1));
    }
    if (error) throw error;
    await adminAudit(ctx, b.id ? "ticket_events.update" : "ticket_events.create", (data && data[0] && data[0].id) || String(b.id || ""), { name: row.name, slug: row.slug });
    return res.json({ ok: true, id: (data && data[0] && data[0].id) || b.id || null });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});
// Toggle publish/unpublish (published_at null <-> now). Event tampil di tab bila status=on_sale DAN published.
app.post("/api/admin/event-catalog/:id/toggle", async (req, res) => {
  const ctx = await requireAdmin(req, res, "staff"); if (!ctx) return;
  const id = String(req.params.id || "");
  try {
    const { data: cur } = await admin.from("my20fit_ticket_events").select("published_at").eq("id", id).limit(1);
    if (!cur || !cur[0]) return res.status(404).json({ error: "Event tak ditemukan." });
    const nextPub = cur[0].published_at ? null : new Date().toISOString();
    const { error } = await admin.from("my20fit_ticket_events").update({ published_at: nextPub, updated_at: new Date().toISOString(), updated_by: ctx.email || null }).eq("id", id);
    if (error) throw error;
    await adminAudit(ctx, "ticket_events.toggle", id, { published: !!nextPub });
    return res.json({ ok: true, published: !!nextPub });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});
app.delete("/api/admin/event-catalog/:id", async (req, res) => {
  const ctx = await requireAdmin(req, res, "staff"); if (!ctx) return;
  const id = String(req.params.id || "");
  try {
    const { error } = await admin.from("my20fit_ticket_events").delete().eq("id", id);
    if (error) throw error;
    await adminAudit(ctx, "ticket_events.delete", id, null);
    return res.json({ ok: true });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// ---------- Checkout terpadu (STAGE 2) — PROXY TIPIS ke infra 20FIT yang sudah ada ----------
// Prinsip (hasil investigasi ekosistem): JANGAN bangun order/webhook/fulfilment sendiri —
// itu duplikasi infra Mayar yang ada (mayar-webhook-*) → dua kebenaran & double-fulfilment.
// my.20fit hanya jadi KLIEN: per jenis produk, panggil fungsi yang ada / deep-link portalnya.
// Harga TIDAK pernah dipercaya dari client — item divalidasi dari my20fit_catalog_items,
// dan create-youngstar-order pun re-validasi harga dari DB (service role).
//
// Status jalur (per 2026-08):
//   youngstar_packages   → create-youngstar-order (buat order + link bayar Mayar). IN-APP.
//   my20fit_ticket_events→ deep-link ticket.20fit.id/id/events/<slug> (+UTM).
//   lainnya (gym/arena/pt/clinic/arena_booking/clinic_services)
//                        → deep-link booking.20fit.id (belum ada fungsi create-order setara;
//                          menulis ke tabel app lain dilarang §4). Jujur: belum in-app.
//   dokter/coach         → belum (dokter nunggu keputusan is_online_bookable; coach belum ada fungsi).
const BOOKING_PORTAL = "https://booking.20fit.id";
const FN_BASE = SUPABASE_URL + "/functions/v1";
app.post("/api/checkout", async (req, res) => {
  try {
    if (!admin) return res.status(503).json({ error: "Server belum dikonfigurasi." });
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const b = req.body || {};
    const sourceTable = String(b.source_table || "").trim();
    const sourceId = String(b.source_id || "").trim();
    if (!sourceTable || !sourceId) return res.status(400).json({ error: "source_table & source_id wajib." });

    // Validasi item dari read-layer katalog (server-authoritative; abaikan harga client).
    const { data: rows, error: catErr } = await admin.from("my20fit_catalog_items")
      .select("kind,source_table,source_id,slug,title,price,is_active")
      .eq("source_table", sourceTable).eq("source_id", sourceId).limit(1);
    if (catErr) return res.status(500).json({ error: catErr.message });
    const item = rows && rows[0];
    if (!item || !item.is_active) return res.status(404).json({ error: "Produk tak ditemukan / tidak aktif." });

    // Tiket → deep-link ke ticket.20fit.id (dijual di sana; bukan via gateway kita).
    if (sourceTable === "my20fit_ticket_events") {
      if (!item.slug) return res.status(409).json({ error: "Slug tiket kosong." });
      return res.json({ ok: true, mode: "redirect", provider: "external",
        url: "https://ticket.20fit.id/id/events/" + encodeURIComponent(item.slug) + "?utm_source=my20fit&utm_medium=app_widget" });
    }

    // Youngstar → fungsi create-youngstar-order (in-app: buat order + link bayar Mayar).
    if (sourceTable === "youngstar_packages") {
      let prof = {};
      try { const { data } = await admin.from("my20fit_profile").select("full_name,phone,email").eq("auth_user_id", user.id).limit(1); prof = (data && data[0]) || {}; } catch (e) {}
      const email = String(prof.email || user.email || "").toLowerCase();
      const full_name = prof.full_name || (email ? email.split("@")[0] : "Member");
      const normPhone = (v) => String(v || "").replace(/[^\d+]/g, "");
      let phone = normPhone(prof.phone);
      if (phone.replace(/\D/g, "").length < 8) phone = normPhone(b.phone);
      if (phone.replace(/\D/g, "").length < 8) return res.status(400).json({ error: "Nomor HP wajib untuk pembayaran.", need_phone: true });
      const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 20000);
      try {
        const r = await fetch(FN_BASE + "/create-youngstar-order", {
          method: "POST", signal: ctrl.signal,
          headers: { Authorization: "Bearer " + SUPABASE_SERVICE_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({ youngstar_package_id: sourceId, full_name, email, phone }),
        });
        const j = await r.json().catch(() => null);
        if (!r.ok || !j || !j.payment_url) return res.status(502).json({ error: (j && (j.error || j.detail)) || "Gagal membuat pembayaran." });
        return res.json({ ok: true, mode: "redirect", provider: "mayar", order_code: j.order_code || null, url: j.payment_url });
      } catch (e) {
        return res.status(502).json({ error: e && e.name === "AbortError" ? "Timeout menghubungi pembayaran." : "Gagal membuat pembayaran." });
      } finally { clearTimeout(timer); }
    }

    // Jenis lain: belum ada fungsi create-order yang bisa dipanggil dari sini tanpa menulis
    // ke tabel app lain (§4). Deep-link ke portal booking — jujur, belum in-app.
    return res.json({ ok: true, mode: "redirect", provider: "external", url: BOOKING_PORTAL,
      note: "Selesaikan pembelian di booking.20fit.id (belum tersedia in-app)." });
  } catch (e) {
    try { console.error("checkout:", e && e.message); } catch (_) {}
    return res.status(500).json({ error: "Checkout gagal." });
  }
});

// ---------- Katalog terpadu (read-layer) untuk halaman /catalog ----------
// Baca my20fit_catalog_items (VIEW), kelompokkan per kind. Butuh login (app member).
app.get("/api/catalog", async (req, res) => {
  try {
    if (!admin) return res.status(503).json({ ok: false, error: "Server belum dikonfigurasi." });
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ ok: false, error: "Unauthorized" });
    const { data, error } = await admin.from("my20fit_catalog_items")
      .select("kind,source_table,source_id,slug,title,subtitle,price,compare_at_price,currency,cover_url,metadata,sort_order")
      .eq("is_active", true)
      .order("kind", { ascending: true }).order("sort_order", { ascending: true });
    if (error) throw error;
    const ORDER = ["membership", "package", "service", "ticket"];
    const byKind = {};
    (data || []).forEach(it => { (byKind[it.kind] = byKind[it.kind] || []).push(it); });
    const groups = ORDER.filter(k => byKind[k]).map(k => ({ kind: k, items: byKind[k] }));
    Object.keys(byKind).forEach(k => { if (ORDER.indexOf(k) < 0) groups.push({ kind: k, items: byKind[k] }); });
    return res.json({ ok: true, groups });
  } catch (e) {
    try { console.error("catalog:", e && e.message); } catch (_) {}
    return res.status(500).json({ ok: false, error: (e && e.message) || "gagal memuat" });
  }
});

// ---------- Rewards / Perks (papan perks admin + klaim member) ----------
// Admin publikasikan perks nyata (my20fit_reward_offers); member klaim (my20fit_reward_claims,
// status pending → admin fulfill). TIDAK ada ekonomi poin dipaksakan. Semua server-mediated
// (RLS deny-public, service key). Tanpa data contoh — kosong sampai admin isi.
const _crypto = require("crypto");
function newClaimCode() { return "RWD-" + _crypto.randomBytes(4).toString("hex").toUpperCase(); }

// USER: daftar perks aktif + klaim milik user.
app.get("/api/rewards", async (req, res) => {
  try {
    if (!admin) return res.status(503).json({ ok: false, error: "Server belum dikonfigurasi." });
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ ok: false, error: "Unauthorized" });
    const { data: offers, error: e1 } = await admin.from("my20fit_reward_offers")
      .select("id,title,subtitle,description,image_url,terms,cost_label,stock,claimed_count")
      .eq("active", true).order("sort_order", { ascending: true }).limit(100);
    if (e1) throw e1;
    const { data: claims } = await admin.from("my20fit_reward_claims")
      .select("id,offer_id,status,claim_code,created_at,my20fit_reward_offers(title)").eq("auth_user_id", user.id).order("created_at", { ascending: false }).limit(100);
    // Saring di SERVER: hanya yang masih bisa diklaim (active + stok tersisa). Jangan kirim
    // yang sold-out lalu disaring client — itu membocorkan kampanye yang belum jalan / habis.
    const offersOut = (offers || [])
      .filter(o => o.stock == null || (o.claimed_count || 0) < o.stock)
      .map(o => ({
        id: o.id, title: o.title, subtitle: o.subtitle || null, description: o.description || null,
        image_url: o.image_url || null, terms: o.terms || null, cost_label: o.cost_label || null,
        sold_out: false,
      }));
    const claimsOut = (claims || []).map(c => ({
      id: c.id, offer_id: c.offer_id, status: c.status, claim_code: c.claim_code || null,
      created_at: c.created_at, offer_title: (c.my20fit_reward_offers && c.my20fit_reward_offers.title) || null,
    }));
    return res.json({ ok: true, offers: offersOut, claims: claimsOut });
  } catch (e) {
    try { console.error("rewards:", e && e.message); } catch (_) {}
    return res.status(500).json({ ok: false, error: (e && e.message) || "gagal memuat" });
  }
});
// USER: klaim satu perks. Idempoten per (user, offer) selama masih pending.
app.post("/api/rewards/claim", async (req, res) => {
  try {
    if (!admin) return res.status(503).json({ ok: false, error: "Server belum dikonfigurasi." });
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ ok: false, error: "Unauthorized" });
    const offerId = String((req.body && req.body.offer_id) || "").trim();
    if (!offerId) return res.status(400).json({ ok: false, error: "offer_id wajib." });
    const { data: rows, error: e1 } = await admin.from("my20fit_reward_offers").select("id,active,stock,claimed_count,title").eq("id", offerId).limit(1);
    if (e1) throw e1;
    const offer = rows && rows[0];
    if (!offer || !offer.active) return res.status(404).json({ ok: false, error: "Perks tak ditemukan / nonaktif." });
    if (offer.stock != null && (offer.claimed_count || 0) >= offer.stock) return res.status(409).json({ ok: false, error: "Kuota perks sudah habis." });
    // Sudah punya klaim pending untuk perks ini? kembalikan yang ada (idempoten).
    const { data: existing } = await admin.from("my20fit_reward_claims").select("id,claim_code,status").eq("auth_user_id", user.id).eq("offer_id", offerId).eq("status", "pending").limit(1);
    if (existing && existing[0]) return res.json({ ok: true, claim_code: existing[0].claim_code, already: true });
    let prof = {};
    try { const { data } = await admin.from("my20fit_profile").select("full_name,email").eq("auth_user_id", user.id).limit(1); prof = (data && data[0]) || {}; } catch (e) {}
    const code = newClaimCode();
    const { error: e2 } = await admin.from("my20fit_reward_claims").insert({
      offer_id: offerId, auth_user_id: user.id, email: (prof.email || user.email || null),
      name: prof.full_name || null, status: "pending", claim_code: code,
    });
    if (e2) throw e2;
    try { await admin.from("my20fit_reward_offers").update({ claimed_count: (offer.claimed_count || 0) + 1, updated_at: new Date().toISOString() }).eq("id", offerId); } catch (_) {}
    return res.json({ ok: true, claim_code: code });
  } catch (e) {
    try { console.error("rewards/claim:", e && e.message); } catch (_) {}
    return res.status(500).json({ ok: false, error: (e && e.message) || "gagal klaim" });
  }
});

// ADMIN CRUD perks + klaim (admin-v2 section Rewards).
app.get("/api/admin/rewards", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer"); if (!ctx) return;
  try {
    const { data, error } = await admin.from("my20fit_reward_offers")
      .select("id,title,subtitle,description,image_url,terms,cost_label,stock,claimed_count,active,sort_order,updated_at,updated_by")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return res.json({ ok: true, offers: data || [] });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});
app.post("/api/admin/rewards", async (req, res) => {
  const ctx = await requireAdmin(req, res, "staff"); if (!ctx) return;
  const b = req.body || {};
  const title = String(b.title || "").trim();
  if (!title) return res.status(400).json({ error: "Judul perks wajib." });
  const row = {
    title: title.slice(0, 160),
    subtitle: b.subtitle ? String(b.subtitle).slice(0, 200) : null,
    description: b.description ? String(b.description).slice(0, 2000) : null,
    image_url: b.image_url ? String(b.image_url).slice(0, 500) : null,
    terms: b.terms ? String(b.terms).slice(0, 2000) : null,
    cost_label: b.cost_label ? String(b.cost_label).slice(0, 80) : null,
    stock: (b.stock === "" || b.stock == null) ? null : (Number.isFinite(+b.stock) ? (+b.stock | 0) : null),
    active: b.active === false ? false : true,
    sort_order: Number.isFinite(+b.sort_order) ? (+b.sort_order | 0) : 0,
    updated_at: new Date().toISOString(),
    updated_by: ctx.email || (ctx.via === "key" ? "master-key" : null),
  };
  try {
    let data, error;
    if (b.id) ({ data, error } = await admin.from("my20fit_reward_offers").update(row).eq("id", String(b.id)).select("id").limit(1));
    else ({ data, error } = await admin.from("my20fit_reward_offers").insert(row).select("id").limit(1));
    if (error) throw error;
    await adminAudit(ctx, b.id ? "rewards.update" : "rewards.create", (data && data[0] && data[0].id) || String(b.id || ""), { title: row.title });
    return res.json({ ok: true, id: (data && data[0] && data[0].id) || b.id || null });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});
app.post("/api/admin/rewards/:id/toggle", async (req, res) => {
  const ctx = await requireAdmin(req, res, "staff"); if (!ctx) return;
  const id = String(req.params.id || "");
  try {
    const { data: cur } = await admin.from("my20fit_reward_offers").select("active").eq("id", id).limit(1);
    if (!cur || !cur[0]) return res.status(404).json({ error: "Perks tak ditemukan." });
    const next = !cur[0].active;
    const { error } = await admin.from("my20fit_reward_offers").update({ active: next, updated_at: new Date().toISOString(), updated_by: ctx.email || null }).eq("id", id);
    if (error) throw error;
    await adminAudit(ctx, "rewards.toggle", id, { active: next });
    return res.json({ ok: true, active: next });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});
app.delete("/api/admin/rewards/:id", async (req, res) => {
  const ctx = await requireAdmin(req, res, "staff"); if (!ctx) return;
  const id = String(req.params.id || "");
  try {
    const { error } = await admin.from("my20fit_reward_offers").delete().eq("id", id);
    if (error) throw error;
    await adminAudit(ctx, "rewards.delete", id, null);
    return res.json({ ok: true });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});
app.get("/api/admin/reward-claims", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer"); if (!ctx) return;
  try {
    const { data, error } = await admin.from("my20fit_reward_claims")
      .select("id,offer_id,email,name,status,claim_code,created_at,fulfilled_at,my20fit_reward_offers(title)")
      .order("created_at", { ascending: false }).limit(300);
    if (error) throw error;
    const claims = (data || []).map(c => ({
      id: c.id, offer_id: c.offer_id, offer_title: (c.my20fit_reward_offers && c.my20fit_reward_offers.title) || null,
      email: c.email || null, name: c.name || null, status: c.status, claim_code: c.claim_code || null,
      created_at: c.created_at, fulfilled_at: c.fulfilled_at || null,
    }));
    return res.json({ ok: true, claims });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});
app.post("/api/admin/reward-claims/:id/fulfill", async (req, res) => {
  const ctx = await requireAdmin(req, res, "staff"); if (!ctx) return;
  const id = String(req.params.id || "");
  const status = String((req.body && req.body.status) || "fulfilled");
  if (["pending", "fulfilled", "cancelled"].indexOf(status) < 0) return res.status(400).json({ error: "Status tak valid." });
  try {
    const patch = { status, updated_by: ctx.email || null };
    patch.fulfilled_at = status === "fulfilled" ? new Date().toISOString() : null;
    const { error } = await admin.from("my20fit_reward_claims").update(patch).eq("id", id);
    if (error) throw error;
    await adminAudit(ctx, "reward_claims.status", id, { status });
    return res.json({ ok: true, status });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// ---------- Banner promo (Bagian 4): konten + target WA dari DB + catat klik ----------
// Konten/nomor/pesan WA disimpan di my20fit_promo_banners (bukan hardcode). URL WA dirakit di
// server. Klik dicatat ke my20fit_promo_banner_clicks (siapa/kapan/banner mana). Server-mediated.
app.get("/api/promo/banner", async (req, res) => {
  try {
    if (!admin) return res.json({ ok: true, banner: null });
    // Service key bypass RLS → jendela waktu (starts_at/ends_at) difilter EKSPLISIT di sini,
    // supaya promo berhenti sendiri setelah ends_at tanpa deploy/hapus manual.
    const nowIso = new Date().toISOString();
    const { data, error } = await admin.from("my20fit_promo_banners")
      .select("id,key,title_en,title_id,subtitle_en,subtitle_id,cta_en,cta_id,image_url,wa_phone,wa_message,ends_at")
      .eq("active", true)
      .or("starts_at.is.null,starts_at.lte." + nowIso)
      .or("ends_at.is.null,ends_at.gt." + nowIso)
      .order("sort_order", { ascending: true }).limit(1);
    if (error) throw error;
    const b = data && data[0];
    if (!b) return res.json({ ok: true, banner: null });
    let wa = null;
    if (b.wa_phone) wa = "https://api.whatsapp.com/send?phone=" + encodeURIComponent(String(b.wa_phone).replace(/[^\d]/g, "")) + (b.wa_message ? ("&text=" + encodeURIComponent(b.wa_message)) : "");
    return res.json({ ok: true, banner: {
      id: b.id, key: b.key, title_en: b.title_en, title_id: b.title_id,
      subtitle_en: b.subtitle_en, subtitle_id: b.subtitle_id, cta_en: b.cta_en, cta_id: b.cta_id,
      image_url: b.image_url || null, ends_at: b.ends_at || null, wa_url: wa } });
  } catch (e) {
    try { console.error("promo/banner:", e && e.message); } catch (_) {}
    return res.json({ ok: true, banner: null }); // tahan-gagal → banner tak muncul, home aman
  }
});
app.post("/api/promo/click", async (req, res) => {
  try {
    if (!admin) return res.json({ ok: true });
    const b = req.body || {};
    const key = String(b.key || "").slice(0, 80) || null;
    let uid = null; try { const u = await getUserFromReq(req); uid = u ? u.id : null; } catch (_) {}
    let bid = b.banner_id ? String(b.banner_id) : null;
    if (!bid && key) { try { const { data } = await admin.from("my20fit_promo_banners").select("id").eq("key", key).limit(1); bid = data && data[0] ? data[0].id : null; } catch (_) {} }
    const ua = String(req.headers["user-agent"] || "").slice(0, 300);
    await admin.from("my20fit_promo_banner_clicks").insert({ banner_id: bid, banner_key: key, auth_user_id: uid, user_agent: ua });
    return res.json({ ok: true });
  } catch (e) {
    try { console.error("promo/click:", e && e.message); } catch (_) {}
    return res.json({ ok: true }); // logging gagal TIDAK memblok user ke WhatsApp
  }
});

// ================= HOME TILES + BOOK COACH + BOOK DOCTOR =================
// Visibilitas & urutan tile grid home dari CMS (my20fit_home_tiles). Tahan-gagal → dashboard default.
app.get("/api/home-tiles", async (req, res) => {
  try {
    if (!admin) return res.json({ ok: true, tiles: [] });
    const { data, error } = await admin.from("my20fit_home_tiles").select("key,hidden,sort_order").order("sort_order", { ascending: true });
    if (error) throw error;
    return res.json({ ok: true, tiles: data || [] });
  } catch (e) { return res.json({ ok: true, tiles: [] }); }
});

// Daftar coach untuk Book Coach + carousel home. Sumber = roster CMS my20fit_coaches.
// Filter venue lewat KOLOM coaches.venue (arena/gym/both), bukan cocok teks. Dibaca server
// (service key); tabel deny-public. Kosong sampai admin mengisi roster.
app.get("/api/coaches", async (req, res) => {
  try {
    if (!admin) return res.status(503).json({ ok: false, error: "service unavailable" });
    const venue = String(req.query.venue || "").toLowerCase();
    let q = admin.from("my20fit_coaches")
      .select("id,display_name,venue,speciality,photo_url,sort_order")
      .eq("is_active", true);
    if (venue === "arena") q = q.in("venue", ["arena", "both"]);
    else if (venue === "gym") q = q.in("venue", ["gym", "both"]);
    q = q.order("sort_order", { ascending: true }).order("display_name", { ascending: true });
    const { data, error } = await q;
    if (error) throw error;
    const coaches = (data || []).map(c => ({
      id: c.id, name: c.display_name, venue: c.venue,
      speciality: c.speciality || null, photo_url: c.photo_url || null,
    }));
    return res.json({ ok: true, coaches });
  } catch (e) { return res.status(500).json({ ok: false, error: (e && e.message) || "gagal memuat" }); }
});

// Klik coach -> HANYA kelas yang diajar coach itu. Join lewat my20fit_coach_instructor_aliases
// (bukan tebak-teks): tiap alias = kecocokan TEPAT teks instructor di jadwal. Tampilkan jadwal
// mendatang & tidak dibatalkan; hitung sisa kuota; kelas penuh / lewat cutoff / sudah lewat tetap
// ditampilkan tapi tidak bisa dipilih, dengan alasannya.
app.get("/api/coaches/:id/classes", async (req, res) => {
  try {
    if (!admin) return res.status(503).json({ ok: false, error: "service unavailable" });
    const id = String(req.params.id || "");
    const { data: crows } = await admin.from("my20fit_coaches")
      .select("id,display_name,venue,speciality,photo_url").eq("id", id).limit(1);
    const coach = crows && crows[0];
    if (!coach) return res.status(404).json({ ok: false, error: "coach tidak ditemukan" });
    const { data: aliases } = await admin.from("my20fit_coach_instructor_aliases")
      .select("instructor_text,source").eq("coach_id", id);
    const textsBy = { arena: [], gym: [] };
    (aliases || []).forEach(a => { if (textsBy[a.source]) textsBy[a.source].push(a.instructor_text); });
    const p2 = (n) => (n < 10 ? "0" + n : "" + n);
    const now = new Date();
    const today = now.getFullYear() + "-" + p2(now.getMonth() + 1) + "-" + p2(now.getDate());
    const clean = (nm) => String(nm || "").replace(/^20FIT\s+Arena\s+/i, "").replace(/^20FIT\s+/i, "").trim();
    const out = [];
    async function collect(source) {
      const texts = textsBy[source]; if (!texts.length) return;
      const cfg = CLASS_VENUES[source];
      const sel = "id,schedule_date,start_time,end_time,instructor,quota" +
        (source === "arena" ? ",cutoff_minutes" : "") + "," + cfg.types + "(name,color)";
      const { data, error } = await admin.from(cfg.table)
        .select(sel).in("instructor", texts)
        .gte("schedule_date", today).eq("is_cancelled", false)
        .order("schedule_date", { ascending: true }).order("start_time", { ascending: true }).limit(400);
      if (error) throw error;
      const rows = data || [];
      const ids = rows.map(r => r.id);
      const booked = {};
      if (ids.length) {
        const bt = source === "arena" ? "arena_class_bookings" : "gym_class_bookings";
        const { data: bks } = await admin.from(bt).select("schedule_id,status").in("schedule_id", ids).limit(5000);
        (bks || []).forEach(b => {
          const s = String(b.status || "").toLowerCase();
          if (/cancel|fail|expire|refund/.test(s)) return;   // kursi cuma terpakai kalau booking hidup
          booked[b.schedule_id] = (booked[b.schedule_id] || 0) + 1;
        });
      }
      rows.forEach(r => {
        const t = r[cfg.types] || {};
        const start = String(r.start_time || "").slice(0, 5), end = String(r.end_time || "").slice(0, 5);
        const startDt = new Date(r.schedule_date + "T" + (r.start_time || "00:00:00") + "+07:00"); // WIB
        const quota = (r.quota == null) ? null : +r.quota;
        const remaining = (quota == null) ? null : Math.max(0, quota - (booked[r.id] || 0));
        const cutoffMin = source === "arena" ? (r.cutoff_minutes == null ? 0 : +r.cutoff_minutes) : 0;
        const cutoffDt = new Date(startDt.getTime() - cutoffMin * 60000);
        let selectable = true, reason = null;
        if (now.getTime() >= startDt.getTime()) { selectable = false; reason = "passed"; }
        else if (now.getTime() >= cutoffDt.getTime()) { selectable = false; reason = "closed"; }
        else if (remaining != null && remaining <= 0) { selectable = false; reason = "full"; }
        out.push({
          source, id: r.id, date: r.schedule_date, start, end,
          name: clean(t.name) || "Kelas", color: t.color || "#C41101",
          instructor: r.instructor || "", quota, remaining, selectable, reason,
          book_url: cfg.book,
        });
      });
    }
    await collect("arena"); await collect("gym");
    out.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
    return res.json({ ok: true, coach: {
      id: coach.id, name: coach.display_name, venue: coach.venue,
      speciality: coach.speciality || null, photo_url: coach.photo_url || null }, classes: out });
  } catch (e) { return res.status(500).json({ ok: false, error: (e && e.message) || "gagal memuat" }); }
});

// Daftar dokter untuk carousel home. Sumber = roster CMS my20fit_doctors (BUKAN admin_users).
// Kosong sampai admin mengisi -> carousel dokter di home disembunyikan seluruhnya oleh frontend.
app.get("/api/doctors", async (req, res) => {
  try {
    if (!admin) return res.json({ ok: true, doctors: [] });
    const { data, error } = await admin.from("my20fit_doctors")
      .select("id,display_name,speciality,photo_url,sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }).order("display_name", { ascending: true });
    if (error) throw error;
    return res.json({ ok: true, doctors: (data || []).map(d => ({
      id: d.id, name: d.display_name, speciality: d.speciality || null, photo_url: d.photo_url || null })) });
  } catch (e) { return res.json({ ok: true, doctors: [] }); }
});

// ================= BOOKING ARENA/GYM IN-APP (kanal my20fit, DB sama) =================
// Alur = alur yang sudah ada di booking.20fit.id: buat baris 'pending_payment' (RPC kuota-aman)
// -> create-mayar-payment -> user bayar -> webhook mayar-webhook-arena mengubah jadi 'confirmed'.
// booking_code prefiks: CL- (arena class), GM- (gym class). Menambah kanal, TIDAK mengganti
// jalur cash/transfer walk-in. Voucher & sewa venue (BK-) menyusul.
async function classBookingInfo(source, scheduleId) {
  const cfg = CLASS_VENUES[source]; if (!cfg) return null;
  const extra = source === "arena" ? ",price_override,cutoff_minutes" : "";
  const sel = "id,class_type_id,schedule_date,start_time,end_time,quota,is_cancelled" + extra + "," + cfg.types + "(name,color," + cfg.price + ")";
  const { data } = await admin.from(cfg.table).select(sel).eq("id", scheduleId).limit(1);
  const s = data && data[0]; if (!s) return null;
  const t = s[cfg.types] || {};
  const basePrice = (source === "arena" && s.price_override != null) ? +s.price_override : (t[cfg.price] != null ? +t[cfg.price] : 0);
  const bt = source === "arena" ? "arena_class_bookings" : "gym_class_bookings";
  const { data: bks } = await admin.from(bt).select("status").eq("schedule_id", scheduleId).limit(5000);
  let used = 0; (bks || []).forEach(b => { const st = String(b.status || "").toLowerCase(); if (!/cancel|fail|expire|refund/.test(st)) used++; });
  const quota = s.quota == null ? null : +s.quota;
  const remaining = quota == null ? null : Math.max(0, quota - used);
  const startDt = new Date(s.schedule_date + "T" + (s.start_time || "00:00:00") + "+07:00"); // WIB
  const cutoffMin = source === "arena" ? (s.cutoff_minutes == null ? 0 : +s.cutoff_minutes) : 0;
  const cutoffDt = new Date(startDt.getTime() - cutoffMin * 60000);
  const now = new Date();
  let selectable = true, reason = null;
  if (s.is_cancelled) { selectable = false; reason = "cancelled"; }
  else if (now.getTime() >= startDt.getTime()) { selectable = false; reason = "passed"; }
  else if (now.getTime() >= cutoffDt.getTime()) { selectable = false; reason = "closed"; }
  else if (remaining != null && remaining <= 0) { selectable = false; reason = "full"; }
  const clean = (nm) => String(nm || "").replace(/^20FIT\s+Arena\s+/i, "").replace(/^20FIT\s+/i, "").trim();
  return {
    source, id: s.id, name: clean(t.name) || "Kelas", color: t.color || "#C41101",
    date: s.schedule_date, start: String(s.start_time || "").slice(0, 5), end: String(s.end_time || "").slice(0, 5),
    price: basePrice, quota, remaining, selectable, reason,
  };
}
app.get("/api/book/class-info", async (req, res) => {
  try {
    if (!admin) return res.status(503).json({ ok: false, error: "service unavailable" });
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ ok: false, error: "Unauthorized" });
    const source = String(req.query.source || "").toLowerCase();
    const scheduleId = String(req.query.schedule_id || "");
    if (["arena", "gym"].indexOf(source) < 0 || !scheduleId) return res.status(400).json({ ok: false, error: "source & schedule_id wajib." });
    const info = await classBookingInfo(source, scheduleId);
    if (!info) return res.status(404).json({ ok: false, error: "Jadwal tidak ditemukan." });
    let prof = {};
    try { const { data } = await admin.from("my20fit_profile").select("full_name,email,phone").eq("auth_user_id", user.id).limit(1); prof = (data && data[0]) || {}; } catch (e) {}
    return res.json({ ok: true, info, profile: {
      full_name: prof.full_name || "", email: (prof.email || user.email || ""), phone: prof.phone || "" } });
  } catch (e) { return res.status(500).json({ ok: false, error: (e && e.message) || "gagal memuat" }); }
});
function newBookingCode(prefix) { return prefix + Date.now().toString(36).toUpperCase() + "-" + Math.floor(Math.random() * 1679616).toString(36).toUpperCase(); }
app.post("/api/book/class", async (req, res) => {
  try {
    if (!admin) return res.status(500).json({ error: "Server belum dikonfigurasi." });
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ error: "Sesi kamu sudah habis. Silakan login lagi.", session_expired: true });
    const b = req.body || {};
    const source = String(b.source || "").toLowerCase();
    const scheduleId = String(b.schedule_id || "");
    if (["arena", "gym"].indexOf(source) < 0 || !scheduleId) return res.status(400).json({ error: "source & schedule_id wajib." });

    const info = await classBookingInfo(source, scheduleId);
    if (!info) return res.status(404).json({ error: "Jadwal tidak ditemukan." });
    if (!info.selectable) {
      const msg = info.reason === "full" ? "Kelas sudah penuh." : info.reason === "passed" ? "Kelas sudah berlangsung." : info.reason === "cancelled" ? "Kelas dibatalkan." : "Pendaftaran kelas sudah ditutup.";
      return res.status(409).json({ error: msg, reason: info.reason });
    }

    const bt = source === "arena" ? "arena_class_bookings" : "gym_class_bookings";
    // Cegah dobel: sudah ada pending_payment utk user+jadwal ini -> pakai yang lama (jangan buat baru).
    try {
      const { data: dup } = await admin.from(bt).select("booking_code").eq("schedule_id", scheduleId).eq("auth_user_id", user.id).eq("status", "pending_payment").limit(1);
      if (dup && dup[0]) return res.status(409).json({ error: "Kamu sudah punya booking yang menunggu pembayaran untuk kelas ini.", booking_code: dup[0].booking_code, pending: true });
    } catch (_) {}

    // Data diri dari profil (jangan minta ketik ulang). Nomor HP wajib utk Mayar.
    let prof = {};
    try { const { data } = await admin.from("my20fit_profile").select("full_name,email,phone").eq("auth_user_id", user.id).limit(1); prof = (data && data[0]) || {}; } catch (e) {}
    const email = String(prof.email || user.email || "").trim().toLowerCase();
    const fullName = prof.full_name || (email ? email.split("@")[0] : "Member 20FIT");
    const normPhone = (v) => String(v || "").replace(/[^\d+]/g, "");
    let phone = normPhone(prof.phone);
    if (phone.replace(/\D/g, "").length < 8) phone = normPhone(b.phone);
    if (phone.replace(/\D/g, "").length < 8) return res.status(400).json({ error: "Nomor HP wajib untuk pembayaran.", need_phone: true });

    const price = info.price || 0;
    const discount = 0; // voucher menyusul (tabel vouchers milik app lain — belum diproses in-app)
    const code = newBookingCode(source === "arena" ? "CL-" : "GM-");

    // Baris pending_payment via RPC kuota-aman (kunci baris jadwal, cek kuota, insert).
    const { error: rpcErr } = await admin.rpc("my20fit_book_class", {
      p_source: source, p_schedule_id: scheduleId, p_auth_user_id: user.id, p_booking_code: code,
      p_full_name: fullName, p_email: email, p_phone: phone,
      p_price: price, p_discount: discount, p_voucher_code: null,
    });
    if (rpcErr) {
      const m = String(rpcErr.message || "");
      if (/full/.test(m)) return res.status(409).json({ error: "Kelas sudah penuh." });
      if (/cancelled/.test(m)) return res.status(409).json({ error: "Kelas dibatalkan." });
      if (/schedule_not_found/.test(m)) return res.status(404).json({ error: "Jadwal tidak ditemukan." });
      throw rpcErr;
    }

    // Kelas gratis -> tak perlu bayar; langsung confirm.
    if (!price) {
      try { await admin.from(bt).update({ status: "confirmed", payment_method: "free", updated_at: new Date().toISOString() }).eq("booking_code", code); } catch (_) {}
      return res.json({ ok: true, mode: "free", booking_code: code });
    }

    // Pembayaran Mayar (fungsi yang sama dgn produk lain). Redirect balik ke my.20fit.
    const base = String(process.env.APP_BASE_URL || (req.protocol + "://" + req.get("host")) || "").replace(/\/$/, "");
    const redirectUrl = base + "/payment/success?src=class&code=" + encodeURIComponent(code);
    const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 20000);
    try {
      const r = await fetch(FN_BASE + "/create-mayar-payment", {
        method: "POST", signal: ctrl.signal,
        headers: { Authorization: "Bearer " + SUPABASE_SERVICE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ booking_code: code, name: fullName, email, phone, amount: price,
          description: "Booking " + info.name + " - " + code, redirect_url: redirectUrl }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j || !j.payment_url) {
        try { await admin.from(bt).update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("booking_code", code); } catch (_) {}
        return res.status(502).json({ error: (j && (j.error || j.detail)) || "Gagal membuat pembayaran." });
      }
      return res.json({ ok: true, mode: "redirect", provider: "mayar", booking_code: code, url: j.payment_url });
    } catch (e) {
      try { await admin.from(bt).update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("booking_code", code); } catch (_) {}
      return res.status(502).json({ error: e && e.name === "AbortError" ? "Timeout menghubungi pembayaran." : "Gagal membuat pembayaran." });
    } finally { clearTimeout(timer); }
  } catch (e) {
    try { console.error("book/class:", e && e.message); } catch (_) {}
    return res.status(500).json({ error: (e && e.message) || "Gagal memproses booking." });
  }
});

// ---------- CMS admin: roster coach + pemetaan alias + roster dokter + inventori instructor ----------
app.get("/api/admin/coaches", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer"); if (!ctx) return;
  try {
    const { data: cs, error } = await admin.from("my20fit_coaches")
      .select("id,display_name,venue,speciality,bio,photo_url,is_active,sort_order")
      .order("sort_order", { ascending: true }).order("display_name", { ascending: true });
    if (error) throw error;
    const { data: al } = await admin.from("my20fit_coach_instructor_aliases").select("id,coach_id,instructor_text,source");
    const byCoach = {};
    (al || []).forEach(a => { (byCoach[a.coach_id] || (byCoach[a.coach_id] = [])).push({ id: a.id, instructor_text: a.instructor_text, source: a.source }); });
    const coaches = (cs || []).map(c => Object.assign({}, c, { aliases: byCoach[c.id] || [] }));
    return res.json({ ok: true, coaches });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});
app.post("/api/admin/coaches", async (req, res) => {
  const ctx = await requireAdmin(req, res, "staff"); if (!ctx) return;
  const b = req.body || {};
  const name = String(b.display_name || "").trim();
  if (!name) return res.status(400).json({ error: "Nama coach wajib." });
  const venue = ["arena", "gym", "both"].indexOf(String(b.venue)) >= 0 ? String(b.venue) : "both";
  const row = {
    display_name: name.slice(0, 160), venue,
    speciality: b.speciality ? String(b.speciality).slice(0, 200) : null,
    bio: b.bio ? String(b.bio).slice(0, 2000) : null,
    photo_url: b.photo_url ? String(b.photo_url).slice(0, 500) : null,
    is_active: b.is_active === false ? false : true,
    sort_order: Number.isFinite(+b.sort_order) ? (+b.sort_order | 0) : 0,
    updated_at: new Date().toISOString(),
  };
  try {
    let data, error;
    if (b.id) ({ data, error } = await admin.from("my20fit_coaches").update(row).eq("id", String(b.id)).select("id").limit(1));
    else ({ data, error } = await admin.from("my20fit_coaches").insert(row).select("id").limit(1));
    if (error) throw error;
    await adminAudit(ctx, b.id ? "coaches.update" : "coaches.create", (data && data[0] && data[0].id) || String(b.id || ""), { name });
    return res.json({ ok: true, id: (data && data[0] && data[0].id) || b.id || null });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});
app.delete("/api/admin/coaches/:id", async (req, res) => {
  const ctx = await requireAdmin(req, res, "staff"); if (!ctx) return;
  const id = String(req.params.id || "");
  try {
    const { error } = await admin.from("my20fit_coaches").delete().eq("id", id);
    if (error) throw error;
    await adminAudit(ctx, "coaches.delete", id, null);
    return res.json({ ok: true });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});
app.post("/api/admin/coach-aliases", async (req, res) => {
  const ctx = await requireAdmin(req, res, "staff"); if (!ctx) return;
  const b = req.body || {};
  const coachId = String(b.coach_id || "");
  const text = String(b.instructor_text || "").trim();
  const source = ["arena", "gym"].indexOf(String(b.source)) >= 0 ? String(b.source) : null;
  if (!coachId || !text || !source) return res.status(400).json({ error: "coach_id, instructor_text, source wajib." });
  try {
    const { data, error } = await admin.from("my20fit_coach_instructor_aliases")
      .upsert({ coach_id: coachId, instructor_text: text.slice(0, 200), source },
        { onConflict: "coach_id,source,instructor_text", ignoreDuplicates: true })
      .select("id").limit(1);
    if (error) throw error;
    await adminAudit(ctx, "coach_aliases.add", coachId, { instructor_text: text, source });
    return res.json({ ok: true, id: (data && data[0] && data[0].id) || null });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});
app.delete("/api/admin/coach-aliases/:id", async (req, res) => {
  const ctx = await requireAdmin(req, res, "staff"); if (!ctx) return;
  const id = String(req.params.id || "");
  try {
    const { error } = await admin.from("my20fit_coach_instructor_aliases").delete().eq("id", id);
    if (error) throw error;
    await adminAudit(ctx, "coach_aliases.delete", id, null);
    return res.json({ ok: true });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});
// Inventori nilai instructor unik (kedua tabel jadwal) + jumlah kelas + status pemetaan.
// mapped_to = daftar coach yang sudah dipetakan ke teks itu; unmapped = belum ada satu pun.
app.get("/api/admin/instructor-values", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer"); if (!ctx) return;
  try {
    const p2 = (n) => (n < 10 ? "0" + n : "" + n);
    const now = new Date();
    const today = now.getFullYear() + "-" + p2(now.getMonth() + 1) + "-" + p2(now.getDate());
    async function inv(source) {
      const cfg = CLASS_VENUES[source];
      const { data } = await admin.from(cfg.table).select("instructor,schedule_date,is_cancelled").limit(5000);
      const m = {};
      (data || []).forEach(r => {
        const key = String(r.instructor || "").trim(); if (!key) return;
        const o = m[key] || (m[key] = { instructor_text: key, source, total: 0, upcoming: 0 });
        o.total++;
        if (String(r.schedule_date) >= today && r.is_cancelled !== true) o.upcoming++;
      });
      return Object.keys(m).map(k => m[k]);
    }
    const [a, g] = await Promise.all([inv("arena"), inv("gym")]);
    const vals = a.concat(g);
    const { data: al } = await admin.from("my20fit_coach_instructor_aliases")
      .select("instructor_text,source,coach_id,my20fit_coaches(display_name)");
    const mapped = {};
    (al || []).forEach(x => {
      const k = x.source + "||" + x.instructor_text;
      (mapped[k] || (mapped[k] = [])).push((x.my20fit_coaches && x.my20fit_coaches.display_name) || x.coach_id);
    });
    vals.forEach(v => { v.mapped_to = mapped[v.source + "||" + v.instructor_text] || []; });
    vals.sort((x, y) => (y.upcoming - x.upcoming) || (y.total - x.total));
    return res.json({ ok: true, values: vals, unmapped_count: vals.filter(v => !v.mapped_to.length).length });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});
app.get("/api/admin/doctors", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer"); if (!ctx) return;
  try {
    const { data, error } = await admin.from("my20fit_doctors")
      .select("id,display_name,speciality,bio,photo_url,is_active,sort_order")
      .order("sort_order", { ascending: true }).order("display_name", { ascending: true });
    if (error) throw error;
    return res.json({ ok: true, doctors: data || [] });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});
app.post("/api/admin/doctors", async (req, res) => {
  const ctx = await requireAdmin(req, res, "staff"); if (!ctx) return;
  const b = req.body || {};
  const name = String(b.display_name || "").trim();
  if (!name) return res.status(400).json({ error: "Nama dokter wajib." });
  const row = {
    display_name: name.slice(0, 160),
    speciality: b.speciality ? String(b.speciality).slice(0, 200) : null,
    bio: b.bio ? String(b.bio).slice(0, 2000) : null,
    photo_url: b.photo_url ? String(b.photo_url).slice(0, 500) : null,
    is_active: b.is_active === false ? false : true,
    sort_order: Number.isFinite(+b.sort_order) ? (+b.sort_order | 0) : 0,
    updated_at: new Date().toISOString(),
  };
  try {
    let data, error;
    if (b.id) ({ data, error } = await admin.from("my20fit_doctors").update(row).eq("id", String(b.id)).select("id").limit(1));
    else ({ data, error } = await admin.from("my20fit_doctors").insert(row).select("id").limit(1));
    if (error) throw error;
    await adminAudit(ctx, b.id ? "doctors.update" : "doctors.create", (data && data[0] && data[0].id) || String(b.id || ""), { name });
    return res.json({ ok: true, id: (data && data[0] && data[0].id) || b.id || null });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});
app.delete("/api/admin/doctors/:id", async (req, res) => {
  const ctx = await requireAdmin(req, res, "staff"); if (!ctx) return;
  const id = String(req.params.id || "");
  try {
    const { error } = await admin.from("my20fit_doctors").delete().eq("id", id);
    if (error) throw error;
    await adminAudit(ctx, "doctors.delete", id, null);
    return res.json({ ok: true });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});
// Unggah foto coach/dokter -> Supabase Storage bucket 'coach-photos' (public), balik URL publik.
// Simpan di Storage (bukan tempel URL eksternal). Terima data URL base64 (limit body 8mb).
app.post("/api/admin/upload-photo", async (req, res) => {
  const ctx = await requireAdmin(req, res, "staff"); if (!ctx) return;
  try {
    const b = req.body || {};
    const dataUrl = String(b.data_url || "");
    const m = dataUrl.match(/^data:(image\/(png|jpe?g|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!m) return res.status(400).json({ error: "Format gambar tidak didukung (png/jpg/webp)." });
    const contentType = m[1];
    const ext = (m[2] === "jpeg") ? "jpg" : m[2];
    const buf = Buffer.from(m[3], "base64");
    if (buf.length > 5 * 1024 * 1024) return res.status(413).json({ error: "Ukuran gambar maksimal 5MB." });
    const folder = (String(b.kind || "coach") === "doctor") ? "doctors" : "coaches";
    const name = folder + "/" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1e6).toString(36) + "." + ext;
    const { error } = await admin.storage.from("coach-photos").upload(name, buf, { contentType, upsert: false });
    if (error) throw error;
    const { data: pub } = admin.storage.from("coach-photos").getPublicUrl(name);
    await adminAudit(ctx, "photo.upload", name, { bytes: buf.length });
    return res.json({ ok: true, url: (pub && pub.publicUrl) || null, path: name });
  } catch (e) { return res.status(500).json({ error: (e && e.message) || "Gagal unggah foto." }); }
});

// ---------- CMS: nyala/mati kotak grid home (my20fit_home_tiles) + jumlah data per kotak ----------
app.get("/api/admin/home-tiles", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer"); if (!ctx) return;
  try {
    const { data: tiles, error } = await admin.from("my20fit_home_tiles").select("key,hidden,sort_order").order("sort_order", { ascending: true });
    if (error) throw error;
    // Jumlah data per kotak berbasis-data -> supaya tak menyalakan kotak kosong.
    const counts = {};
    async function cnt(key, table, col) {
      try { const { count } = await admin.from(table).select("id", { count: "exact", head: true }).eq(col, true); counts[key] = count || 0; } catch (_) { counts[key] = null; }
    }
    await cnt("book-coach", "my20fit_coaches", "is_active");
    await cnt("book-doctor", "my20fit_doctors", "is_active");
    await cnt("rewards", "my20fit_reward_offers", "active");
    return res.json({ ok: true, tiles: (tiles || []).map(t => ({ key: t.key, hidden: !!t.hidden, sort_order: t.sort_order, count: (t.key in counts) ? counts[t.key] : null })) });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});
app.post("/api/admin/home-tiles/toggle", async (req, res) => {
  const ctx = await requireAdmin(req, res, "staff"); if (!ctx) return;
  const b = req.body || {};
  const key = String(b.key || "").trim();
  const hidden = (b.hidden === true || b.hidden === "true");
  if (!key) return res.status(400).json({ error: "key wajib." });
  try {
    const { data, error } = await admin.from("my20fit_home_tiles").update({ hidden }).eq("key", key).select("key").limit(1);
    if (error) throw error;
    if (!data || !data.length) return res.status(404).json({ error: "Kotak tak ditemukan: " + key });
    await adminAudit(ctx, "home_tiles.toggle", key, { hidden });
    return res.json({ ok: true, key, hidden });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// Layanan dokter (requires_doctor=true) untuk Book Doctor (request).
app.get("/api/clinic/doctor-services", async (req, res) => {
  try {
    if (!admin) return res.status(503).json({ ok: false, error: "service unavailable" });
    const { data, error } = await admin.from("clinic_services")
      .select("id,name,price,description").eq("requires_doctor", true).eq("is_active", true).order("price", { ascending: true });
    if (error) throw error;
    return res.json({ ok: true, services: data || [] });
  } catch (e) { return res.status(500).json({ ok: false, error: (e && e.message) || "gagal memuat" }); }
});

// Book Doctor = REQUEST (bukan booking pasti). Server-side (service key), hanya baris milik user,
// channel='my20fit', TANPA slot (klinik tak pakai slot utk dokter). Dokter dikonfirmasi admin.
app.post("/api/book/doctor-request", async (req, res) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ error: "Sesi kamu sudah habis. Silakan login lagi.", session_expired: true });
    if (!admin) return res.status(500).json({ error: "Server belum dikonfigurasi." });
    const b = req.body || {};
    const serviceId = String(b.service_id || "").trim();
    const wantDate = String(b.preferred_date || "").slice(0, 10);
    const complaint = String(b.complaint || "").slice(0, 1000);
    if (!serviceId) return res.status(400).json({ error: "Layanan wajib dipilih." });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(wantDate)) return res.status(400).json({ error: "Tanggal wajib." });
    // Validasi layanan = dokter & aktif; harga DARI SERVER (jangan percaya client).
    const { data: svc } = await admin.from("clinic_services").select("id,name,price,requires_doctor,is_active").eq("id", serviceId).limit(1);
    const s = svc && svc[0];
    if (!s || s.requires_doctor !== true || s.is_active !== true) return res.status(400).json({ error: "Layanan tidak tersedia untuk request." });
    // Data diri dari profil (jangan minta ketik ulang).
    let email = String(user.email || "").trim().toLowerCase(), fullName = "", phone = "";
    try {
      const { data: prof } = await admin.from("my20fit_profile").select("email,full_name,phone").eq("auth_user_id", user.id).limit(1);
      if (prof && prof[0]) { if (prof[0].email) email = String(prof[0].email).trim().toLowerCase(); fullName = prof[0].full_name || ""; phone = prof[0].phone || ""; }
    } catch (_) {}
    if (!fullName) fullName = email || "Member 20FIT";
    if (!phone) phone = "-";
    const code = "MYD-" + Date.now().toString(36).toUpperCase() + "-" + Math.floor(Math.random() * 10000);
    const row = {
      booking_code: code, service_id: serviceId, slot_id: null,
      full_name: fullName, email: email || null, phone: phone,
      notes: complaint || null, price: Number(s.price) || 0,
      status: "requested", manual_date: wantDate,
      auth_user_id: user.id, channel: "my20fit",
    };
    const { data, error } = await admin.from("clinic_bookings").insert(row).select("id,booking_code").limit(1);
    if (error) throw error;
    return res.json({ ok: true, booking_code: code, id: (data && data[0] && data[0].id) || null });
  } catch (e) {
    try { console.error("book/doctor-request:", e && e.message); } catch (_) {}
    return res.status(500).json({ error: (e && e.message) || "Gagal mengirim permintaan." });
  }
});

// Request/booking klinik milik user (dari my.20fit) — dibaca server (service key, filter auth_user_id).
app.get("/api/my/clinic-requests", async (req, res) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ error: "session", session_expired: true });
    if (!admin) return res.json({ ok: true, items: [] });
    const { data, error } = await admin.from("clinic_bookings")
      .select("booking_code,service_id,status,manual_date,created_at,notes")
      .eq("auth_user_id", user.id).eq("channel", "my20fit").order("created_at", { ascending: false }).limit(50);
    if (error) throw error;
    return res.json({ ok: true, items: data || [] });
  } catch (e) { return res.json({ ok: true, items: [] }); }
});

// ================= FASE 3 & 6: CHECKOUT TERPADU + RIWAYAT =================
// FASE 6 — Riwayat pembelian user: gabungan my20fit_orders + booking + scan, difilter
// auth_user_id (dibaca SERVER pakai service key; user hanya lihat miliknya). Tiap sumber
// dibungkus try → satu gagal tak menjatuhkan yang lain.
app.get("/api/my/purchases", async (req, res) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ error: "session", session_expired: true });
    if (!admin) return res.json({ ok: true, items: [] });
    const uid = user.id;
    const out = [];
    const push = (o) => { if (o) out.push(o); };
    // Orders terpadu
    try {
      const { data } = await admin.from("my20fit_orders")
        .select("order_no,kind,status,net_amount,currency,created_at,paid_at,metadata").eq("auth_user_id", uid)
        .order("created_at", { ascending: false }).limit(100);
      (data || []).forEach(o => push({ source: "order", kind: o.kind, title: (o.metadata && o.metadata.title) || o.kind, status: o.status, amount: o.net_amount, currency: o.currency || "IDR", date: o.paid_at || o.created_at, ref: o.order_no }));
    } catch (_) {}
    // Kelas
    try {
      const { data } = await admin.from("arena_class_bookings").select("booking_code,status,price,created_at").eq("auth_user_id", uid).order("created_at", { ascending: false }).limit(100);
      (data || []).forEach(o => push({ source: "class", kind: "class", title: "Arena/Gym Class", status: o.status, amount: o.price, currency: "IDR", date: o.created_at, ref: o.booking_code }));
    } catch (_) {}
    // Arena
    try {
      const { data } = await admin.from("arena_bookings").select("booking_code,status,created_at").eq("auth_user_id", uid).order("created_at", { ascending: false }).limit(100);
      (data || []).forEach(o => push({ source: "arena", kind: "venue", title: "Arena Booking", status: o.status, amount: null, currency: "IDR", date: o.created_at, ref: o.booking_code }));
    } catch (_) {}
    // Klinik (request/booking dari my.20fit)
    try {
      const { data } = await admin.from("clinic_bookings").select("booking_code,status,price,created_at").eq("auth_user_id", uid).order("created_at", { ascending: false }).limit(100);
      (data || []).forEach(o => push({ source: "clinic", kind: "service", title: "Clinic", status: o.status, amount: o.price, currency: "IDR", date: o.created_at, ref: o.booking_code }));
    } catch (_) {}
    // Scan credits
    try {
      const { data } = await admin.from("my20fit_scan_orders").select("reff_no,status,net_amount,amount,created_at,paid_at").eq("auth_user_id", uid).order("created_at", { ascending: false }).limit(100);
      (data || []).forEach(o => push({ source: "scan", kind: "scan", title: "Food Scan Credits", status: o.status, amount: (o.net_amount != null ? o.net_amount : o.amount), currency: "IDR", date: o.paid_at || o.created_at, ref: o.reff_no }));
    } catch (_) {}
    out.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
    return res.json({ ok: true, items: out });
  } catch (e) { return res.json({ ok: true, items: [] }); }
});

// FASE 3 — Checkout terpadu. Harga DIVALIDASI ULANG di server (katalog/ticket_events), buat
// my20fit_orders 'pending', kembalikan next-step. Gateway inline BELUM (kredensial Xendit
// dedicated belum ada) → payload: ticket=deep-link penerbit, service=bayar-di-klinik, lainnya=pending.
app.post("/api/checkout", async (req, res) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ error: "Sesi kamu sudah habis. Silakan login lagi.", session_expired: true });
    if (!admin) return res.status(500).json({ error: "Server belum dikonfigurasi." });
    const b = req.body || {};
    const kind = String(b.kind || "").trim();
    const itemRef = String(b.itemRef || b.item_ref || "").trim();
    const qty = Math.max(1, Math.min(20, parseInt(b.quantity || 1, 10) || 1));
    const allowed = ["ticket", "membership", "package", "class", "venue", "service"];
    if (!allowed.includes(kind)) return res.status(400).json({ error: "Jenis pembelian tidak dikenal." });
    if (!itemRef) return res.status(400).json({ error: "Item wajib." });
    // Harga dari server (JANGAN percaya client).
    let unit = null, title = null, buyUrl = null;
    if (kind === "ticket") {
      const { data } = await admin.from("my20fit_ticket_events").select("slug,name,price_from,status,published_at").eq("slug", itemRef).limit(1);
      const e = data && data[0];
      if (!e || e.status !== "on_sale" || !e.published_at) return res.status(400).json({ error: "Event tidak tersedia." });
      unit = Number(e.price_from) || 0; title = e.name; buyUrl = ticketBuyUrl(e.slug);
    } else {
      const { data } = await admin.from("my20fit_catalog_items").select("source_id,title,price,is_active").eq("source_id", itemRef).limit(1);
      const it = data && data[0];
      if (!it || it.is_active !== true) return res.status(400).json({ error: "Item tidak tersedia." });
      unit = Number(it.price) || 0; title = it.title;
    }
    const subtotal = unit * qty;
    // Pastikan buyer ada.
    let buyerId = null;
    try {
      const { data: bd } = await admin.from("my20fit_buyers").select("id").eq("auth_user_id", user.id).limit(1);
      if (bd && bd[0]) buyerId = bd[0].id;
      else { const { data: ins } = await admin.from("my20fit_buyers").insert({ auth_user_id: user.id, primary_email: (user.email || "").toLowerCase() }).select("id").limit(1); buyerId = ins && ins[0] ? ins[0].id : null; }
    } catch (_) {}
    const orderNo = "MY-" + Date.now().toString(36).toUpperCase() + "-" + Math.floor(Math.random() * 10000);
    const { data: ord, error } = await admin.from("my20fit_orders").insert({
      order_no: orderNo, auth_user_id: user.id, buyer_id: buyerId, kind, channel: "my20fit",
      subtotal, discount: 0, net_amount: subtotal, currency: "IDR", status: "pending",
      payment_method: String(b.method || "") || null,
      expires_at: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
      metadata: { itemRef, quantity: qty, title },
    }).select("id,order_no").limit(1);
    if (error) throw error;
    const orderId = ord && ord[0] ? ord[0].id : null;
    if (orderId) { try { await admin.from("my20fit_order_items").insert({ order_id: orderId, kind, item_ref: itemRef, title, quantity: qty, unit_price: unit, line_total: subtotal }); } catch (_) {} }
    // Next-step (belum ada gateway inline).
    let payload;
    if (kind === "ticket") payload = { type: "deeplink", url: buyUrl, note: "Selesaikan pembayaran tiket di penerbit resmi 20FIT Ticket." };
    else if (kind === "service") payload = { type: "pay_at_clinic", note: "Bayar di klinik saat kedatangan; staf akan mencatat pembayaran." };
    else payload = { type: "pending", note: "Pesanan tersimpan sebagai pending. Pembayaran online akan tersedia setelah gateway aktif." };
    return res.json({ ok: true, orderNo, reference: orderId, paymentPayload: payload });
  } catch (e) {
    try { console.error("checkout:", e && e.message); } catch (_) {}
    return res.status(500).json({ error: (e && e.message) || "Checkout gagal." });
  }
});

// ================= ADMIN MONITORING (dashboard internal) =================
// Nilai HANYA dari env ADMIN_KEY (RAHASIA). Tanpa default: env kosong = terkunci (fail-closed).
const ADMIN_KEY = process.env.ADMIN_KEY || "";
// ---------- RBAC admin per-user (superadmin/staff/viewer/marketing) ----------
// Master ADMIN_KEY (x-admin-key / ?key=) = superadmin (bootstrap & admin.html lama).
// Selain itu: user login 20FIT (Authorization: Bearer <jwt>) yang punya baris di
// my20fit_admin_roles. Role di-cek di SERVER (bukan cuma UI).
// "marketing" = rank baca setara viewer (nama/email/telepon/pembelian) TAPI DILARANG
// data kesehatan. Larangan ditegakkan di level API (field dipangkas di respons), bukan
// cuma disembunyikan di UI — lihat adminCanSeeHealth().
const ADMIN_RANK = { marketing: 1, viewer: 1, staff: 2, superadmin: 3 };
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
// Role "marketing" DILARANG mengakses data kesehatan (berat/tinggi/umur/gender/tujuan/
// kondisi/siklus/MCU). Endpoint yang memuat data profil kesehatan WAJIB memanggil ini
// dan memangkas field sebelum mengirim respons — diblokir di level API, bukan cuma UI.
function adminCanSeeHealth(ctx) { return !!(ctx && ctx.role !== "marketing"); }
// PRIVASI MUTLAK: data siklus menstruasi (cycle_last_period/cycle_length/period_length/last_period_date)
// TIDAK PERNAH keluar ke pihak mana pun selain user sendiri — termasuk admin & SUPERADMIN.
// adminCanSeeHealth boleh true (admin lihat BMI/MCU), tapi siklus tetap dibuang di sini.
// Dipakai untuk memangkas field siklus dari objek profil sebelum dikirim ke admin.
function stripMenstrualCycle(prof) {
  if (prof && typeof prof === "object") {
    delete prof.cycle_last_period; delete prof.cycle_length; delete prof.period_length; delete prof.last_period_date;
  }
  return prof;
}
async function requireAdmin(req, res, minRole) {
  const ctx = await getAdminContext(req);
  if (!ctx) {
    console.warn("admin 401:", req.method, req.path, "— no admin context (missing/invalid Bearer token or ?key=)");
    res.status(401).json({ error: "Unauthorized" }); return null;
  }
  if (!adminHasRole(ctx, minRole)) {
    console.warn("admin 403:", req.method, req.path, "— role=" + ctx.role + " need=" + (minRole || "viewer"));
    res.status(403).json({ error: "Akses ditolak: butuh role " + (minRole || "viewer") + " (role kamu: " + ctx.role + ")" }); return null;
  }
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
  if (!email || ["superadmin", "staff", "viewer", "marketing"].indexOf(role) < 0) return res.status(400).json({ error: "email & role (superadmin/staff/viewer/marketing) wajib." });
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

// Feature flags modul admin baru (viewer baca; superadmin toggle). Semua fitur baru
// di-gate flag ini (default OFF). Perubahan diaudit.
app.get("/api/admin/feature-flags", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer"); if (!ctx) return;
  try {
    const { data } = await admin.from("my20fit_admin_feature_flags")
      .select("key,enabled,note,updated_by,updated_at").order("key", { ascending: true });
    return res.json({ ok: true, flags: data || [] });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});
app.post("/api/admin/feature-flags", async (req, res) => {
  const ctx = await requireAdmin(req, res, "superadmin"); if (!ctx) return;
  const b = req.body || {};
  const key = String(b.key || "").trim();
  if (!key) return res.status(400).json({ error: "key wajib" });
  try {
    const { error } = await admin.from("my20fit_admin_feature_flags")
      .update({ enabled: !!b.enabled, updated_by: ctx.email || "admin", updated_at: new Date().toISOString() })
      .eq("key", key);
    if (error) return res.status(500).json({ error: error.message });
    await adminAudit(ctx, "feature_flag.set", key, { enabled: !!b.enabled });
    return res.json({ ok: true });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// ================= CORPORATE HEALTH PROGRAM — FASE 1 (fondasi) =================
// Level: superadmin (20FIT) mengelola akun corporate; admin corporate mengelola
// karyawannya sendiri. ISOLASI: data karyawan HANYA diakses lewat server
// (service_role) yang SELALU memfilter corporate_id milik si admin — client tidak
// pernah menentukan corporate_id-nya. Tabel corporate/admin/access_log = RLS
// deny-all; corporate_member = own-row (lapisan kedua). Setiap akses data karyawan
// oleh admin corporate DICATAT di my20fit_corporate_access_log.

var CORP_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // tanpa I/O/0/1 (ambigu)
function genCorpCode(name) {
  var base = String(name || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4) || "CORP";
  var r = "";
  for (var i = 0; i < 4; i++) r += CORP_CODE_ALPHABET[Math.floor(Math.random() * CORP_CODE_ALPHABET.length)];
  return base + "-" + r;
}
function normCorpCode(c) { return String(c || "").trim().toUpperCase().replace(/\s+/g, ""); }
async function corpCodeTaken(code, exceptId) {
  var { data } = await admin.from("my20fit_corporate").select("id,code");
  if (!data) return false;
  var target = normCorpCode(code);
  return data.some(function (r) { return normCorpCode(r.code) === target && r.id !== exceptId; });
}
async function genUniqueCorpCode(name) {
  for (var i = 0; i < 25; i++) { var c = genCorpCode(name); if (!(await corpCodeTaken(c, null))) return c; }
  return genCorpCode(name) + Math.floor(10 + Math.random() * 89);
}
async function findUserIdByEmail(email) {
  email = String(email || "").toLowerCase();
  if (!email) return null;
  try {
    for (var page = 1; page <= 30; page++) {
      var { data } = await admin.auth.admin.listUsers({ page: page, perPage: 1000 });
      var u = (data && data.users) || [];
      var hit = u.find(function (x) { return String(x.email || "").toLowerCase() === email; });
      if (hit) return hit.id;
      if (u.length < 1000) break;
    }
  } catch (e) {}
  return null;
}
// Resolusi konteks admin corporate dari JWT user (bukan dari input client).
async function getCorpAdminContext(req) {
  if (!admin) return null;
  var user = await getUserFromReq(req);
  if (!user) return null;
  var { data } = await admin.from("my20fit_corporate_admin")
    .select("corporate_id,email").eq("auth_user_id", user.id).limit(1);
  if (data && data[0]) return { user_id: user.id, email: data[0].email || user.email, corporate_id: data[0].corporate_id };
  return null;
}
// Konteks untuk endpoint dashboard corporate. Dua jalur:
//  - Admin corporate (punya baris di my20fit_corporate_admin) -> HANYA perusahaannya
//    (corporate_id dari DB, input client diabaikan -> isolasi antar-perusahaan aman).
//  - Superadmin 20FIT -> boleh lihat corporate MANA PUN dgn menyebut corporate_id.
//    Semua akses tetap dicatat di audit (actor = email superadmin).
async function requireCorpAdmin(req, res) {
  var cc = await getCorpAdminContext(req);
  var wantId = String((req.query && req.query.corporate_id) || (req.body && req.body.corporate_id) || "").trim();
  var ctx = null;
  if (cc) { ctx = cc; ctx.is_superadmin = false; } // admin corporate: kunci ke perusahaannya
  else {
    var ac = await getAdminContext(req);
    if (ac && ac.role === "superadmin") {
      if (!wantId) { res.status(400).json({ error: "corporate_id wajib untuk superadmin." }); return null; }
      ctx = { user_id: ac.user_id || null, email: ac.email || "superadmin", corporate_id: wantId, is_superadmin: true };
    }
  }
  if (!ctx) { res.status(403).json({ error: "Bukan admin corporate." }); return null; }
  var { data } = await admin.from("my20fit_corporate").select("id,name,status").eq("id", ctx.corporate_id).limit(1);
  if (!data || !data[0]) { res.status(404).json({ error: "Corporate tidak ditemukan." }); return null; }
  if (data[0].status !== "active" && !ctx.is_superadmin) { res.status(403).json({ error: "Akun corporate non-aktif." }); return null; }
  ctx.corporate_name = data[0].name;
  return ctx;
}
async function corpAudit(ctx, targetUserId, action, detail) {
  if (!admin) return;
  try {
    await admin.from("my20fit_corporate_access_log").insert({
      corporate_id: (ctx && ctx.corporate_id) || null,
      actor_user_id: (ctx && ctx.user_id) || null,
      actor_email: (ctx && ctx.email) || null,
      target_user_id: targetUserId || null,
      action: action, detail: detail || null,
    });
  } catch (e) {}
}

// PRIVASI: superadmin 20FIT HANYA boleh MONITORING OPERASIONAL korporat (jumlah
// anggota & keaktifan pemakaian). Data kesehatan INDIVIDU karyawan (BMI/MCU) — dan
// MUTLAK data siklus menstruasi — TIDAK dibuka ke superadmin. Endpoint roster/kesehatan
// corporate hanya untuk admin corporate perusahaan itu sendiri (jalur non-superadmin).
// Kalau suatu saat superadmin butuh lihat data individu tertentu, itu keputusan pemilik
// yang harus diputuskan eksplisit — BUKAN default. Gate ini ditegakkan di SERVER.
function denyCorpHealthToSuperadmin(ctx, res) {
  if (ctx && ctx.is_superadmin) {
    res.status(403).json({ error: "Superadmin hanya boleh monitoring operasional korporat (lihat /api/admin/corporate/activity). Data kesehatan individu karyawan (BMI/MCU/siklus) tidak dibuka ke superadmin." });
    return true;
  }
  return false;
}

// ---- SUPERADMIN: kelola akun corporate ----
// List semua corporate + jumlah admin & anggota aktif.
app.get("/api/admin/corporate", async (req, res) => {
  var ctx = await requireAdmin(req, res, "superadmin"); if (!ctx) return;
  try {
    var { data: corps, error } = await admin.from("my20fit_corporate")
      .select("id,name,code,status,contact_email,created_at,updated_at").order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    var { data: admins } = await admin.from("my20fit_corporate_admin").select("corporate_id,email");
    var { data: members } = await admin.from("my20fit_corporate_member").select("corporate_id,status");
    var out = (corps || []).map(function (c) {
      var adminList = (admins || []).filter(function (a) { return a.corporate_id === c.id; }).map(function (a) { return a.email; });
      var memberCount = (members || []).filter(function (m) { return m.corporate_id === c.id && m.status === "active"; }).length;
      return { id: c.id, name: c.name, code: c.code, status: c.status, contact_email: c.contact_email, created_at: c.created_at, admins: adminList, member_count: memberCount };
    });
    // Audit BACA: setiap superadmin melihat daftar korporat dicatat (siapa, kapan, apa).
    await adminAudit(ctx, "corporate.list.view", null, { count: out.length });
    return res.json({ ok: true, corporates: out });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// MONITORING OPERASIONAL (superadmin) — agregat per korporat TANPA data kesehatan.
// Hanya: jumlah anggota aktif, keaktifan 7/30 hari (my20fit_user_activity), dan
// pemakaian scan 30 hari. TIDAK ada BMI/MCU/siklus, TIDAK ada baris per-individu.
// Didaftarkan SEBELUM route "/:id" supaya "activity" tidak ketangkap sebagai :id.
app.get("/api/admin/corporate/activity", async (req, res) => {
  var ctx = await requireAdmin(req, res, "superadmin"); if (!ctx) return;
  try {
    var nowMs = Date.now();
    var d7 = new Date(nowMs - 7 * 864e5).toISOString();
    var d30 = new Date(nowMs - 30 * 864e5).toISOString();
    var { data: corps, error } = await admin.from("my20fit_corporate")
      .select("id,name,code,status,created_at").order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    var { data: members } = await admin.from("my20fit_corporate_member").select("corporate_id,auth_user_id,status");
    var activeMembers = (members || []).filter(function (m) { return m.status === "active"; });
    var ids = activeMembers.map(function (m) { return m.auth_user_id; });
    var actMap = {}, scanMap = {};
    if (ids.length) {
      var { data: acts } = await admin.from("my20fit_user_activity").select("auth_user_id,last_active_at").in("auth_user_id", ids);
      (acts || []).forEach(function (a) { actMap[a.auth_user_id] = a.last_active_at; });
      var { data: sc } = await admin.from("my20fit_scan_orders").select("auth_user_id,paid_at").eq("status", "paid").gte("paid_at", d30).in("auth_user_id", ids);
      (sc || []).forEach(function (s) { scanMap[s.auth_user_id] = (scanMap[s.auth_user_id] || 0) + 1; });
    }
    var byCorp = {};
    activeMembers.forEach(function (m) {
      var a = byCorp[m.corporate_id] || (byCorp[m.corporate_id] = { member_count: 0, active_7d: 0, active_30d: 0, scans_30d: 0 });
      a.member_count++;
      var la = actMap[m.auth_user_id];
      if (la && la >= d7) a.active_7d++;
      if (la && la >= d30) a.active_30d++;
      a.scans_30d += (scanMap[m.auth_user_id] || 0);
    });
    var out = (corps || []).map(function (c) {
      var a = byCorp[c.id] || { member_count: 0, active_7d: 0, active_30d: 0, scans_30d: 0 };
      return {
        id: c.id, name: c.name, code: c.code, status: c.status, created_at: c.created_at,
        member_count: a.member_count, active_7d: a.active_7d, active_30d: a.active_30d, scans_30d: a.scans_30d,
        active_7d_pct: a.member_count ? Math.round(a.active_7d / a.member_count * 100) : 0,
        active_30d_pct: a.member_count ? Math.round(a.active_30d / a.member_count * 100) : 0,
      };
    });
    var totals = out.reduce(function (t, c) {
      t.corporates++; t.members += c.member_count; t.active_7d += c.active_7d; t.active_30d += c.active_30d; t.scans_30d += c.scans_30d; return t;
    }, { corporates: 0, members: 0, active_7d: 0, active_30d: 0, scans_30d: 0 });
    await adminAudit(ctx, "corporate.activity.view", null, { corporates: out.length });
    return res.json({
      ok: true, corporates: out, totals: totals, generated_at: new Date().toISOString(),
      note: "Operasional saja (jumlah anggota & keaktifan). TIDAK memuat data kesehatan/BMI/MCU/siklus individu.",
    });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});
// Buat corporate baru { name, code?, contact_email?, admin_email? }.
app.post("/api/admin/corporate", async (req, res) => {
  var ctx = await requireAdmin(req, res, "superadmin"); if (!ctx) return;
  var b = req.body || {};
  var name = String(b.name || "").trim();
  if (!name) return res.status(400).json({ error: "Nama perusahaan wajib." });
  var code = b.code ? normCorpCode(b.code) : await genUniqueCorpCode(name);
  if (!/^[A-Z0-9][A-Z0-9-]{2,23}$/.test(code)) return res.status(400).json({ error: "Kode harus 3-24 karakter (huruf/angka/strip)." });
  if (await corpCodeTaken(code, null)) return res.status(409).json({ error: "Kode '" + code + "' sudah dipakai perusahaan lain." });
  var contact_email = b.contact_email ? String(b.contact_email).trim().toLowerCase() : null;
  var { data: corp, error } = await admin.from("my20fit_corporate")
    .insert({ name: name, code: code, contact_email: contact_email, created_by: ctx.user_id || null })
    .select("id,name,code,status,contact_email,created_at").limit(1).single();
  if (error) return res.status(500).json({ error: error.message });
  var adminResult = null;
  var admin_email = b.admin_email ? String(b.admin_email).trim().toLowerCase() : null;
  if (admin_email) adminResult = await addCorpAdmin(corp.id, admin_email, ctx.user_id, b.admin_password);
  await adminAudit(ctx, "corporate.create", corp.code, { corporate_id: corp.id, name: name, admin_email: admin_email, password_set: !!(adminResult && adminResult.password_set) });
  return res.json({ ok: true, corporate: corp, admin: adminResult });
});
// Helper: tambah admin corporate by email (buat akun login kalau belum ada).
async function addCorpAdmin(corporateId, email, createdBy, password) {
  email = String(email || "").trim().toLowerCase();
  if (!email) return { ok: false, error: "email kosong" };
  var pw = (password == null) ? "" : String(password);
  if (pw && pw.length < 8) return { ok: false, error: "Password minimal 8 karakter." };
  var uid = await findUserIdByEmail(email);
  var created = false, pwSet = false;
  if (!uid) {
    try {
      var payload = { email: email, email_confirm: true, user_metadata: { via_20fit: true, corp_admin: true } };
      if (pw) { payload.password = pw; pwSet = true; }
      var { data: cu } = await admin.auth.admin.createUser(payload);
      uid = cu && cu.user && cu.user.id;
      created = true;
    } catch (e) { return { ok: false, error: "Gagal membuat akun login: " + e.message }; }
  } else if (pw) {
    try { await admin.auth.admin.updateUserById(uid, { password: pw }); pwSet = true; }
    catch (e) { return { ok: false, error: "Gagal set password: " + e.message }; }
  }
  if (!uid) return { ok: false, error: "Tidak bisa resolve user." };
  var { error } = await admin.from("my20fit_corporate_admin")
    .upsert({ corporate_id: corporateId, auth_user_id: uid, email: email, created_by: createdBy || null }, { onConflict: "corporate_id,auth_user_id" });
  if (error) return { ok: false, error: error.message };
  return { ok: true, email: email, account_created: created, password_set: pwSet };
}
// Detail satu corporate + daftar admin-nya.
app.get("/api/admin/corporate/:id", async (req, res) => {
  var ctx = await requireAdmin(req, res, "superadmin"); if (!ctx) return;
  var id = String(req.params.id || "");
  try {
    var { data: corp } = await admin.from("my20fit_corporate").select("*").eq("id", id).limit(1).single();
    if (!corp) return res.status(404).json({ error: "Corporate tidak ditemukan." });
    var { data: admins } = await admin.from("my20fit_corporate_admin").select("auth_user_id,email,created_at").eq("corporate_id", id);
    var { data: members } = await admin.from("my20fit_corporate_member").select("status").eq("corporate_id", id);
    var active = (members || []).filter(function (m) { return m.status === "active"; }).length;
    // Audit BACA: superadmin membuka detail korporat dicatat.
    await adminAudit(ctx, "corporate.detail.view", id, { name: corp.name });
    return res.json({ ok: true, corporate: corp, admins: admins || [], member_count: active });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});
// Edit corporate { name?, code?, status? } — kode divalidasi unik (kecuali dirinya).
app.patch("/api/admin/corporate/:id", async (req, res) => {
  var ctx = await requireAdmin(req, res, "superadmin"); if (!ctx) return;
  var id = String(req.params.id || "");
  var b = req.body || {}; var patch = {};
  if (b.name != null) { var nm = String(b.name).trim(); if (!nm) return res.status(400).json({ error: "Nama tidak boleh kosong." }); patch.name = nm; }
  if (b.contact_email != null) patch.contact_email = String(b.contact_email).trim().toLowerCase() || null;
  if (b.status != null) { var st = String(b.status).trim(); if (["active", "suspended"].indexOf(st) < 0) return res.status(400).json({ error: "status harus active/suspended." }); patch.status = st; }
  if (b.code != null) {
    var code = normCorpCode(b.code);
    if (!/^[A-Z0-9][A-Z0-9-]{2,23}$/.test(code)) return res.status(400).json({ error: "Kode harus 3-24 karakter (huruf/angka/strip)." });
    if (await corpCodeTaken(code, id)) return res.status(409).json({ error: "Kode '" + code + "' sudah dipakai perusahaan lain." });
    patch.code = code;
  }
  if (!Object.keys(patch).length) return res.status(400).json({ error: "Tidak ada perubahan." });
  patch.updated_at = new Date().toISOString();
  var { error } = await admin.from("my20fit_corporate").update(patch).eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  await adminAudit(ctx, "corporate.update", id, patch);
  return res.json({ ok: true });
});
// Tambah admin corporate ke sebuah corporate.
app.post("/api/admin/corporate/:id/admins", async (req, res) => {
  var ctx = await requireAdmin(req, res, "superadmin"); if (!ctx) return;
  var id = String(req.params.id || "");
  var email = String((req.body || {}).email || "").trim().toLowerCase();
  var password = (req.body || {}).password;
  if (!email) return res.status(400).json({ error: "email wajib." });
  var { data: corp } = await admin.from("my20fit_corporate").select("id").eq("id", id).limit(1).single();
  if (!corp) return res.status(404).json({ error: "Corporate tidak ditemukan." });
  var r = await addCorpAdmin(id, email, ctx.user_id, password);
  if (!r.ok) return res.status(400).json({ error: r.error });
  // Jejak TIDAK menyimpan password — hanya flag apakah password di-set.
  await adminAudit(ctx, "corporate.admin.add", id, { email: email, password_set: !!r.password_set });
  return res.json({ ok: true, admin: r });
});
// Kirim UNDANGAN email ke admin portal korporat: link set/reset password (recovery)
// supaya HR bikin passwordnya sendiri, lalu login di /corp-dashboard. Superadmin only.
// (email = modul mailer di scope ini; pakai `addr` untuk alamat agar tak bentrok.)
app.post("/api/admin/corporate/:id/admins/invite", async (req, res) => {
  var ctx = await requireAdmin(req, res, "superadmin"); if (!ctx) return;
  var id = String(req.params.id || "");
  var addr = String((req.body || {}).email || "").trim().toLowerCase();
  if (!addr) return res.status(400).json({ error: "email wajib." });
  try {
    var uid = await findUserIdByEmail(addr);
    if (!uid) return res.status(404).json({ error: "Akun admin belum ada. Tambah adminnya dulu, baru kirim undangan." });
    var { data: ca } = await admin.from("my20fit_corporate_admin").select("id").eq("corporate_id", id).eq("auth_user_id", uid).limit(1);
    if (!ca || !ca[0]) return res.status(404).json({ error: "Email itu bukan admin portal korporat ini." });
    var { data: corp } = await admin.from("my20fit_corporate").select("name").eq("id", id).limit(1);
    var corpName = (corp && corp[0] && corp[0].name) || "perusahaanmu";
    var link = null;
    try {
      var { data: ld, error: le } = await admin.auth.admin.generateLink({
        type: "recovery", email: addr, options: { redirectTo: APP_BASE_URL + "/reset-password" },
      });
      if (le) throw le;
      link = (ld && ld.properties && ld.properties.action_link) || null;
    } catch (e) { return res.status(500).json({ error: "Gagal membuat link undangan: " + e.message }); }
    if (!link) return res.status(500).json({ error: "Link undangan kosong." });
    var portal = APP_BASE_URL + "/corp-dashboard";
    var html = '<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto">' +
      '<h2 style="color:#C41101">Akses Dashboard HR 20FIT — ' + escHtml(corpName) + '</h2>' +
      '<p>Kamu ditunjuk sebagai admin HR untuk memantau program kesehatan karyawan <b>' + escHtml(corpName) + '</b> di 20FIT.</p>' +
      '<p><b>Langkah 1</b> — buat password kamu:</p>' +
      '<p><a href="' + link + '" style="display:inline-block;background:#C41101;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:bold">Set password</a></p>' +
      '<p style="color:#666;font-size:12px;word-break:break-all">' + link + '</p>' +
      '<p><b>Langkah 2</b> — login ke dashboard HR di <a href="' + portal + '">' + portal + '</a> pakai email ini + password yang kamu buat.</p>' +
      '<p style="color:#666;font-size:12px">Akses kamu dibatasi HANYA untuk karyawan ' + escHtml(corpName) + '. Data pribadi sensitif tertentu tidak ditampilkan. Simpan email ini baik-baik.</p></div>';
    var r = await email.send({ to: addr, subject: "Undangan Dashboard HR 20FIT — " + corpName, html: html, transactional: true, channel: "transactional", templateId: "corp_admin_invite", userId: uid });
    await adminAudit(ctx, "corporate.admin.invite", id, { email: addr, mail_sent: !!(r && r.ok && !r.skipped), mail_skipped: !!(r && r.skipped) });
    return res.json({ ok: true, sent: !!(r && r.ok && !r.skipped), skipped: !!(r && r.skipped), message: "Undangan dikirim ke " + addr + "." });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});
// Hapus admin corporate.
app.delete("/api/admin/corporate/:id/admins/:userId", async (req, res) => {
  var ctx = await requireAdmin(req, res, "superadmin"); if (!ctx) return;
  var id = String(req.params.id || ""), uid = String(req.params.userId || "");
  var { error } = await admin.from("my20fit_corporate_admin").delete().eq("corporate_id", id).eq("auth_user_id", uid);
  if (error) return res.status(500).json({ error: error.message });
  await adminAudit(ctx, "corporate.admin.remove", id, { auth_user_id: uid });
  return res.json({ ok: true });
});

// ---- ADMIN CORPORATE: hanya lihat perusahaannya sendiri ----
app.get("/api/corp/me", async (req, res) => {
  var ctx = await requireCorpAdmin(req, res); if (!ctx) return;
  return res.json({ ok: true, corporate_id: ctx.corporate_id, corporate_name: ctx.corporate_name, email: ctx.email, is_superadmin: !!ctx.is_superadmin });
});
// ---- FASE 3: klasifikasi kesehatan & frekuensi (CONFIG-DRIVEN, NON-DIAGNOSTIK) ----
// Ambang di sini bisa diganti oleh dokter/pemilik tanpa ubah logika. BMI pakai band
// WHO Asia-Pacific (referensi publik); "perlu perhatian" TIDAK ditentukan BMI sendiri
// kecuali ekstrem (BMI tak bisa bedakan otot vs lemak). Sisi MCU pakai flag `status`/
// `abnormal_findings` yang SUDAH ada di data (hasil AI) — bukan ambang medis karangan.
// SEMUA label = indikasi awal, BUKAN diagnosis.
var CORP_HEALTH_RULES = {
  bmi_under: 18.5, bmi_over: 23, bmi_obese: 25, // band Asia-Pacific (info)
  bmi_flag_low: 17, bmi_flag_high: 30,          // BMI sendiri hanya menandai di ekstrem
  mcu_attention_min: 2,                          // >= n parameter status 'attention' -> perlu perhatian
  mcu_abnormal_min: 2,                           // atau >= n abnormal_findings
  high_need_min: 4,                              // >= n -> HIGH NEED OF CARE
};
var CORP_USAGE_RULES = { window_days: 30, active_days_min: 8, scan_min: 1, workout_min: 4 };
function corpBmi(p) {
  var h = Number(p && p.height_cm), w = Number(p && p.weight_kg);
  if (!h || !w) return null;
  var m = h / 100; return Math.round((w / (m * m)) * 10) / 10;
}
function corpClassifyHealth(p, mcuResult) {
  var R = CORP_HEALTH_RULES, bmi = corpBmi(p), hasBmi = bmi != null;
  var hasMcu = false, attn = 0, abn = 0, labels = [];
  if (mcuResult && typeof mcuResult === "object") {
    hasMcu = true;
    var params = Array.isArray(mcuResult.parameters) ? mcuResult.parameters : [];
    params.forEach(function (x) { if (x && x.status === "attention") { attn++; if (x.label) labels.push(x.label); } });
    abn = Array.isArray(mcuResult.abnormal_findings) ? mcuResult.abnormal_findings.length : 0;
  }
  var status;
  if (!hasMcu && !hasBmi) status = "unknown";
  else {
    var flag = (hasMcu && (attn >= R.mcu_attention_min || abn >= R.mcu_abnormal_min)) ||
               (hasBmi && (bmi >= R.bmi_flag_high || bmi < R.bmi_flag_low));
    status = flag ? "attention" : "healthy";
  }
  var highNeed = hasMcu && (attn >= R.high_need_min || abn >= R.high_need_min);
  return { status: status, bmi: bmi, hasBmi: hasBmi, hasMcu: hasMcu, attentionCount: attn, abnormalCount: abn, highNeed: highNeed, attentionLabels: labels.slice(0, 8) };
}
function corpClassifyUsage(sig) {
  var R = CORP_USAGE_RULES;
  var freq = (sig.activeDays >= R.active_days_min) || (sig.scans >= R.scan_min) || (sig.workouts >= R.workout_min);
  return { level: freq ? "frequent" : "rare", activeDays: sig.activeDays, scans: sig.scans, workouts: sig.workouts };
}
// Bangun roster lengkap (kesehatan + frekuensi) untuk SATU corporate. Dipakai summary.
// Daftar divisi kanonik (Opsi A). Disimpan sebagai KODE; label bilingual di UI.
var CORP_DIVISIONS = ["hr", "finance", "it", "marketing", "sales", "operations", "cs", "procurement", "legal", "production", "rnd", "logistics", "ga", "engineering", "qa", "management", "other"];
function normDivision(d) { d = String(d || "").trim().toLowerCase(); return CORP_DIVISIONS.indexOf(d) >= 0 ? d : null; }
async function corpRoster(corporateId) {
  var { data: mem } = await admin.from("my20fit_corporate_member")
    .select("auth_user_id,linked_at,consent_at,division,division_other").eq("corporate_id", corporateId).eq("status", "active").order("linked_at", { ascending: false });
  var ids = (mem || []).map(function (m) { return m.auth_user_id; });
  if (!ids.length) return [];
  var since = new Date(Date.now() - CORP_USAGE_RULES.window_days * 864e5).toISOString(), sinceDate = since.slice(0, 10);
  var profMap = {}, mcuMap = {}, dayMap = {}, woMap = {}, scanMap = {};
  var { data: profs } = await admin.from("my20fit_profile").select("auth_user_id,full_name,email,gender,age,height_cm,weight_kg").in("auth_user_id", ids);
  (profs || []).forEach(function (p) { profMap[p.auth_user_id] = p; });
  var { data: mcus } = await admin.from("my20fit_mcu_result").select("auth_user_id,result,created_at").in("auth_user_id", ids).order("created_at", { ascending: false });
  (mcus || []).forEach(function (r) { if (!mcuMap[r.auth_user_id]) mcuMap[r.auth_user_id] = r.result; });
  var { data: logs } = await admin.from("my20fit_daily_log").select("auth_user_id,log_date").in("auth_user_id", ids).gte("log_date", sinceDate);
  (logs || []).forEach(function (l) { (dayMap[l.auth_user_id] = dayMap[l.auth_user_id] || {})[l.log_date] = 1; });
  var { data: wos } = await admin.from("my20fit_workout").select("auth_user_id,workout_date").in("auth_user_id", ids).gte("workout_date", sinceDate);
  (wos || []).forEach(function (w) { woMap[w.auth_user_id] = (woMap[w.auth_user_id] || 0) + 1; (dayMap[w.auth_user_id] = dayMap[w.auth_user_id] || {})[w.workout_date] = 1; });
  var { data: sc } = await admin.from("my20fit_scan_orders").select("auth_user_id,paid_at,status").in("auth_user_id", ids).eq("status", "paid").gte("paid_at", since);
  (sc || []).forEach(function (s) { scanMap[s.auth_user_id] = (scanMap[s.auth_user_id] || 0) + 1; });
  return (mem || []).map(function (m) {
    var p = profMap[m.auth_user_id] || {};
    var h = corpClassifyHealth(p, mcuMap[m.auth_user_id]);
    var activeDays = dayMap[m.auth_user_id] ? Object.keys(dayMap[m.auth_user_id]).length : 0;
    var u = corpClassifyUsage({ activeDays: activeDays, scans: scanMap[m.auth_user_id] || 0, workouts: woMap[m.auth_user_id] || 0 });
    return {
      auth_user_id: m.auth_user_id, full_name: p.full_name || null, email: p.email || null,
      gender: p.gender || null, age: (p.age != null ? p.age : null),
      health_status: h.status, bmi: h.bmi, high_need: h.highNeed, has_mcu: h.hasMcu, has_bmi: h.hasBmi,
      attention_count: h.attentionCount, abnormal_count: h.abnormalCount,
      usage_level: u.level, active_days: u.activeDays, scans: u.scans, workouts: u.workouts, linked_at: m.linked_at,
      division: m.division || null, division_other: m.division_other || null,
    };
  });
}
// Ringkasan + matriks karyawan (admin corporate). Tiap akses dicatat audit.
app.get("/api/corp/summary", async (req, res) => {
  var ctx = await requireCorpAdmin(req, res); if (!ctx) return;
  if (denyCorpHealthToSuperadmin(ctx, res)) return;
  try {
    var roster = await corpRoster(ctx.corporate_id);
    var k = { total: roster.length, healthy: 0, attention: 0, unknown: 0, frequent: 0, rare: 0, high_need: 0 };
    roster.forEach(function (r) {
      if (r.health_status === "healthy") k.healthy++; else if (r.health_status === "attention") k.attention++; else k.unknown++;
      if (r.usage_level === "frequent") k.frequent++; else k.rare++;
      if (r.high_need) k.high_need++;
    });
    await corpAudit(ctx, null, "roster.view", { count: roster.length });
    return res.json({ ok: true, corporate_name: ctx.corporate_name, kpis: k, members: roster });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});
// Detail satu karyawan (WAJIB anggota corporate ini). Akses individual dicatat audit.
app.get("/api/corp/member/:uid", async (req, res) => {
  var ctx = await requireCorpAdmin(req, res); if (!ctx) return;
  if (denyCorpHealthToSuperadmin(ctx, res)) return;
  var uid = String(req.params.uid || "");
  try {
    var { data: mem } = await admin.from("my20fit_corporate_member")
      .select("linked_at,consent_at,consent_version").eq("corporate_id", ctx.corporate_id).eq("auth_user_id", uid).eq("status", "active").limit(1);
    if (!mem || !mem[0]) return res.status(404).json({ error: "Karyawan tidak ditemukan di perusahaan ini." });
    var { data: profs } = await admin.from("my20fit_profile").select("full_name,email,gender,age,height_cm,weight_kg").eq("auth_user_id", uid).limit(1);
    var p = (profs && profs[0]) || {};
    var { data: mcus } = await admin.from("my20fit_mcu_result").select("result,analyzed_at,created_at").eq("auth_user_id", uid).order("created_at", { ascending: false }).limit(1);
    var mcu = (mcus && mcus[0]) || null;
    var h = corpClassifyHealth(p, mcu && mcu.result);
    var since = new Date(Date.now() - CORP_USAGE_RULES.window_days * 864e5).toISOString(), sinceDate = since.slice(0, 10), days = {};
    var { data: logs } = await admin.from("my20fit_daily_log").select("log_date").eq("auth_user_id", uid).gte("log_date", sinceDate);
    (logs || []).forEach(function (l) { days[l.log_date] = 1; });
    var { data: wos } = await admin.from("my20fit_workout").select("workout_date").eq("auth_user_id", uid).gte("workout_date", sinceDate);
    (wos || []).forEach(function (w) { days[w.workout_date] = 1; });
    var { data: sc } = await admin.from("my20fit_scan_orders").select("paid_at").eq("auth_user_id", uid).eq("status", "paid").gte("paid_at", since);
    var u = corpClassifyUsage({ activeDays: Object.keys(days).length, scans: (sc || []).length, workouts: (wos || []).length });
    var attention = [];
    if (mcu && mcu.result && Array.isArray(mcu.result.parameters)) {
      mcu.result.parameters.forEach(function (x) { if (x && x.status === "attention") attention.push({ label: x.label, value: x.value, normal_range: x.normal_range, direction: x.direction }); });
    }
    var abnormal = (mcu && mcu.result && Array.isArray(mcu.result.abnormal_findings)) ? mcu.result.abnormal_findings : [];
    await corpAudit(ctx, uid, "member.view", null);
    return res.json({ ok: true, member: {
      auth_user_id: uid, full_name: p.full_name || null, email: p.email || null, gender: p.gender || null, age: (p.age != null ? p.age : null),
      bmi: h.bmi, health_status: h.status, high_need: h.highNeed, has_mcu: h.hasMcu, mcu_date: mcu ? (mcu.analyzed_at || mcu.created_at) : null,
      attention_params: attention, abnormal_findings: abnormal,
      usage_level: u.level, active_days: u.activeDays, scans: u.scans, workouts: u.workouts,
      linked_at: mem[0].linked_at, consent_at: mem[0].consent_at, consent_version: mem[0].consent_version,
    } });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// ---- FASE 2: SISI KARYAWAN (consent + gabung/keluar) ----
// Teks persetujuan = sumber kebenaran di server; hash & versinya disimpan saat user setuju.
var CORP_CONSENT = {
  version: "2026-07-24-v1",
  text: {
    id: "Dengan bergabung ke Corporate Program, kamu MENYETUJUI perusahaanmu (admin HR yang ditunjuk) dapat melihat data berikut secara individual: status BMI, hasil Medical Check-Up (MCU), jenis kelamin, umur, dan frekuensi pemakaian produk 20FIT. Data ini digunakan untuk program kesehatan karyawan. Yang bisa melihat HANYA admin HR perusahaanmu — perusahaan lain tidak bisa. Kamu bisa KELUAR kapan saja dari halaman Profil; setelah keluar, perusahaan tidak lagi bisa melihat datamu.",
    en: "By joining the Corporate Program, you CONSENT to your company (its designated HR admin) viewing the following data individually: your BMI status, Medical Check-Up (MCU) results, gender, age, and 20FIT product usage frequency. This is used for the employee health program. ONLY your company's HR admin can see it — no other company can. You can LEAVE anytime from your Profile page; after leaving, the company can no longer see your data."
  }
};
function corpConsentHash() { return sha256(CORP_CONSENT.version + "\n" + CORP_CONSENT.text.id + "\n" + CORP_CONSENT.text.en); }
// Validasi kode perusahaan (belum gabung). Auth wajib.
app.post("/api/corp/validate-code", async (req, res) => {
  var user = await getUserFromReq(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  var code = normCorpCode((req.body || {}).code);
  if (!code) return res.status(400).json({ error: "Isi kode perusahaan dulu." });
  var { data } = await admin.from("my20fit_corporate").select("id,name,status").eq("code", code).limit(1);
  var corp = data && data[0];
  if (!corp || corp.status !== "active") return res.status(404).json({ error: "Kode tidak ditemukan atau tidak aktif. Cek lagi dengan HR perusahaanmu." });
  return res.json({ ok: true, corporate_name: corp.name, consent_version: CORP_CONSENT.version, consent_text: CORP_CONSENT.text });
});
// Gabung program (merekam consent: versi + hash teks + waktu).
app.post("/api/corp/join", async (req, res) => {
  var user = await getUserFromReq(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  var code = normCorpCode((req.body || {}).code);
  if (!code) return res.status(400).json({ error: "Isi kode perusahaan." });
  var { data } = await admin.from("my20fit_corporate").select("id,name,status").eq("code", code).limit(1);
  var corp = data && data[0];
  if (!corp || corp.status !== "active") return res.status(404).json({ error: "Kode tidak ditemukan atau tidak aktif." });
  var { data: ex } = await admin.from("my20fit_corporate_member").select("id,corporate_id").eq("auth_user_id", user.id).eq("status", "active").limit(1);
  if (ex && ex[0]) {
    if (ex[0].corporate_id === corp.id) return res.json({ ok: true, already: true, corporate_name: corp.name });
    return res.status(409).json({ error: "Kamu sudah tergabung di perusahaan lain. Keluar dulu sebelum gabung yang baru." });
  }
  var nowISO = new Date().toISOString();
  var { error } = await admin.from("my20fit_corporate_member").insert({
    corporate_id: corp.id, auth_user_id: user.id, status: "active",
    consent_version: CORP_CONSENT.version, consent_text_hash: corpConsentHash(),
    consent_at: nowISO, linked_at: nowISO,
  });
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true, corporate_name: corp.name });
});
// Status keanggotaan user saat ini.
app.get("/api/corp/membership", async (req, res) => {
  var user = await getUserFromReq(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  var { data } = await admin.from("my20fit_corporate_member")
    .select("corporate_id,status,linked_at,consent_at,consent_version,division,division_other").eq("auth_user_id", user.id).eq("status", "active").limit(1);
  var m = data && data[0];
  if (!m) return res.json({ ok: true, member: null });
  var { data: c } = await admin.from("my20fit_corporate").select("name").eq("id", m.corporate_id).limit(1);
  return res.json({ ok: true, member: { corporate_name: (c && c[0] && c[0].name) || "—", linked_at: m.linked_at, consent_at: m.consent_at, consent_version: m.consent_version, division: m.division || null, division_other: m.division_other || null } });
});
// Keluar dari program (hormati kapan pun; setelah ini admin corporate tak bisa lihat lagi).
app.post("/api/corp/leave", async (req, res) => {
  var user = await getUserFromReq(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  var { error } = await admin.from("my20fit_corporate_member")
    .update({ status: "left", left_at: new Date().toISOString() })
    .eq("auth_user_id", user.id).eq("status", "active");
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});
// Set DIVISI karyawan pada keanggotaan korporat aktifnya sendiri. division wajib
// (kode kanonik); 'other' -> division_other teks bebas. Divalidasi ke daftar resmi.
app.post("/api/corp/set-division", async (req, res) => {
  var user = await getUserFromReq(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  var b = req.body || {};
  var div = normDivision(b.division);
  if (!div) return res.status(400).json({ error: "Divisi tidak valid." });
  var other = div === "other" ? String(b.division_other || "").trim().slice(0, 60) : null;
  if (div === "other" && !other) return res.status(400).json({ error: "Isi nama divisi (Lainnya)." });
  var { data: mem } = await admin.from("my20fit_corporate_member")
    .select("id").eq("auth_user_id", user.id).eq("status", "active").limit(1);
  if (!mem || !mem[0]) return res.status(404).json({ error: "Kamu belum tergabung di korporat." });
  var { error } = await admin.from("my20fit_corporate_member")
    .update({ division: div, division_other: other }).eq("id", mem[0].id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true, division: div, division_other: other });
});

// ============ Account: hak data-subject (export data pribadi) ============
// Tabel yang menyimpan data milik user (keyed auth_user_id). OTP (keyed email)
// SENGAJA tidak diekspor: token transien, bukan data pribadi bermakna.
var USER_DATA_TABLES = [
  "my20fit_profile", "my20fit_daily_log", "my20fit_health_entry", "my20fit_workout",
  "my20fit_mcu_result", "my20fit_fasting", "my20fit_user_activity",
  "my20fit_menu_contribution", "my20fit_menu_reward_log", "my20fit_corporate_member",
  "my20fit_scan_orders", "my20fit_scan_ledger", "my20fit_voucher_usages"
];
// Unduh SEMUA data pribadi milik user sendiri (JSON). Auth wajib; hanya row miliknya.
app.get("/api/account/export", async (req, res) => {
  var user = await getUserFromReq(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  var out = { exported_at: new Date().toISOString(), account: { id: user.id, email: user.email || null }, data: {} };
  for (var i = 0; i < USER_DATA_TABLES.length; i++) {
    var t = USER_DATA_TABLES[i];
    try {
      var { data, error } = await admin.from(t).select("*").eq("auth_user_id", user.id);
      out.data[t] = error ? { error: error.message } : (data || []);
    } catch (e) { out.data[t] = { error: (e && e.message) || "failed" }; }
  }
  var fname = "my20fit-data-" + String(user.id).slice(0, 8) + ".json";
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="' + fname + '"');
  return res.status(200).send(JSON.stringify(out, null, 2));
});

// Hapus akun + SEMUA data pribadi milik user SENDIRI (irreversible / hak penghapusan).
// Aman: auth dari JWT pemanggil -> hanya bisa hapus dirinya sendiri (WHERE auth_user_id = user.id).
// Wajib body {confirm:"DELETE"} biar tak terpanggil tak sengaja.
// Catatan keputusan: data komersial (order/ledger/voucher) IKUT dihapus penuh (erasure).
// Audit log (my20fit_*_audit_log, corporate_access_log) SENGAJA dibiarkan (jejak akuntabilitas,
// hanya berisi UUID tanpa profil -> ter-de-identifikasi setelah profil hilang).
app.post("/api/account/delete", async (req, res) => {
  var user = await getUserFromReq(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  var confirm = String((req.body || {}).confirm || "").trim().toUpperCase();
  if (confirm !== "DELETE") return res.status(400).json({ error: "Konfirmasi tidak valid. Ketik DELETE untuk mengonfirmasi." });
  var results = {};
  var byUser = USER_DATA_TABLES.concat(["my20fit_admin_roles", "my20fit_corporate_admin"]);
  for (var i = 0; i < byUser.length; i++) {
    var t = byUser[i];
    try { var { error } = await admin.from(t).delete().eq("auth_user_id", user.id); results[t] = error ? ("ERR: " + error.message) : "ok"; }
    catch (e) { results[t] = "ERR: " + ((e && e.message) || "failed"); }
  }
  try { if (user.email) await admin.from("my20fit_email_otp").delete().eq("email", user.email); } catch (e) {}
  // Hapus akun auth TERAKHIR: kalau data gagal, akun masih ada untuk diulang.
  var authErr = null;
  try { var d = await admin.auth.admin.deleteUser(user.id); if (d && d.error) authErr = d.error.message || String(d.error); }
  catch (e) { authErr = (e && e.message) || "failed"; }
  if (authErr) return res.status(500).json({ error: "Data pribadi terhapus, tapi menghapus akun login gagal: " + authErr + ". Hubungi admin.", results: results });
  return res.json({ ok: true, results: results });
});

// ---- FASE 4: kirim pesan/email ke karyawan (roster terfilter) ----
function corpMsgHtml(bodyText) {
  var safe = String(bodyText || "").replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }).replace(/\n/g, "<br>");
  return '<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#1a1714">' +
    '<div style="background:#000;padding:14px 18px;border-radius:12px 12px 0 0"><span style="color:#fff;font-weight:900;letter-spacing:1px">20<span style="color:#C41101">&#9679;</span>FIT</span></div>' +
    '<div style="border:1px solid #eee;border-top:0;border-radius:0 0 12px 12px;padding:20px">' + safe +
    '<p style="color:#888;font-size:12px;margin-top:22px">Pesan ini dikirim oleh program kesehatan perusahaanmu lewat 20FIT. Kamu bisa keluar dari program kapan saja dari halaman Profil di aplikasi 20FIT.</p>' +
    '</div></div>';
}
// Kirim pesan ke karyawan yang cocok filter. Filter DITERAPKAN ULANG di server (tak percaya client).
app.post("/api/corp/message", async (req, res) => {
  var ctx = await requireCorpAdmin(req, res); if (!ctx) return;
  if (denyCorpHealthToSuperadmin(ctx, res)) return; // filter pakai roster kesehatan -> superadmin tak boleh
  var b = req.body || {};
  var subject = String(b.subject || "").trim(), body = String(b.body || "").trim(), filter = b.filter || {};
  if (!subject || !body) return res.status(400).json({ error: "Subjek & isi pesan wajib diisi." });
  try {
    var roster = await corpRoster(ctx.corporate_id); // hanya anggota AKTIF (opt-out otomatis dihormati)
    var recips = roster.filter(function (m) {
      if (filter.health && m.health_status !== filter.health) return false;
      if (filter.usage && m.usage_level !== filter.usage) return false;
      if (filter.high_need === "1" && !m.high_need) return false;
      return !!m.email;
    });
    if (!recips.length) return res.status(400).json({ error: "Tidak ada penerima (yang punya email) cocok filter itu." });
    var results = [], sent = 0;
    for (var i = 0; i < recips.length; i++) {
      var m = recips[i], personal = body.replace(/\{nama\}/g, m.full_name || ""), st = "skipped";
      try {
        var rr = await email.send({
          to: m.email, subject: subject, html: corpMsgHtml(personal),
          transactional: true, channel: "transactional", templateId: "corp_broadcast",
          userId: m.auth_user_id || null,
        });
        if (rr.ok && !rr.skipped) { st = "sent"; sent++; }
        else if (rr.skipped) { st = "skipped"; }
        else { st = "failed"; }
      } catch (e) { st = "failed"; }
      results.push({ auth_user_id: m.auth_user_id, email: m.email, name: m.full_name || null, status: st });
    }
    try {
      await admin.from("my20fit_corporate_message_log").insert({
        corporate_id: ctx.corporate_id, actor_user_id: ctx.user_id || null, actor_email: ctx.email || null,
        subject: subject, body: body, filter: filter, recipient_count: recips.length, sent_count: sent, recipients: results,
      });
    } catch (e) {}
    await corpAudit(ctx, null, "message.send", { recipient_count: recips.length, sent: sent, subject: subject });
    return res.json({ ok: true, recipient_count: recips.length, sent: sent, dev: !email.envInfo().is_prod });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});
// Riwayat pesan terkirim (corporate ini).
app.get("/api/corp/messages", async (req, res) => {
  var ctx = await requireCorpAdmin(req, res); if (!ctx) return;
  if (denyCorpHealthToSuperadmin(ctx, res)) return;
  try {
    var { data, error } = await admin.from("my20fit_corporate_message_log")
      .select("subject,recipient_count,sent_count,created_at,actor_email").eq("corporate_id", ctx.corporate_id)
      .order("created_at", { ascending: false }).limit(50);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true, messages: data || [] });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});
// ================= DIET Bagian 1: kontribusi menu + reward =================
var MENU_DAILY_LIMIT = 5;
var MENU_DIET_TYPES = ["normal", "vegetarian", "vegan", "pescatarian", "keto", "halal", "high-protein", "low-carb"];
// Ambang reward sumbang-resep -- SATU sumber angka (dipakai /api/menu/mine & /api/menu/reward-config).
// HARUS sama dengan yang di-hardcode di RPC my20fit_grant_menu_reward (floor(approved/10), credits=5) --
// itu RPC terpisah, sudah live/dipakai, sengaja TIDAK diubah di sini (lihat diskusi Tahap 3).
var MENU_REWARD_PER_CYCLE = 10;   // kontribusi approved per cycle
var MENU_REWARD_SCAN_CREDITS = 5; // kredit scan didapat tiap cycle
function menuHash(name, ingredients, steps) {
  var norm = function (s) { return String(s || "").toLowerCase().replace(/\s+/g, " ").trim(); };
  return sha256(norm(name) + "|" + norm(ingredients) + "|" + norm(steps));
}
function startOfTodayISO() { var d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString(); }
// User: submit menu baru (batas harian + deteksi duplikat via content_hash).
app.post("/api/menu/submit", async (req, res) => {
  var user = await getUserFromReq(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  var b = req.body || {};
  var name = String(b.name || "").trim(), ingredients = String(b.ingredients || "").trim(), steps = String(b.steps || "").trim();
  var diet_type = String(b.diet_type || "normal").trim().toLowerCase();
  // Nama tampilan publik -- diisi kontributor sendiri di form (BUKAN email/nama akun asli,
  // lihat migration menu_contribution_display_name). Kosong -> null, klien tampilkan fallback.
  var display_name = String(b.display_name || "").trim().slice(0, 60) || null;
  var stepsStruct = normalizeMenuSteps(b.steps_json);
  if (stepsStruct) steps = stepsStruct.text; // langkah terstruktur (step berfoto) jadi sumber teks langkah
  if (!name || !ingredients || !steps) return res.status(400).json({ error: "Nama, bahan, dan cara buat wajib diisi." });
  if (MENU_DIET_TYPES.indexOf(diet_type) < 0) diet_type = "normal";
  var photo_url = b.photo_url ? String(b.photo_url) : null;
  if (photo_url && photo_url.length > 3000000) return res.status(413).json({ error: "Foto terlalu besar. Kompres dulu (maks ~2MB)." });
  var est_kcal = (b.est_kcal != null && b.est_kcal !== "") ? (Math.max(0, Math.round(+b.est_kcal)) || null) : null;
  var servings = (b.servings != null && b.servings !== "") ? (Math.max(1, Math.round(+b.servings)) || null) : null;
  var cook_minutes = (b.cook_minutes != null && b.cook_minutes !== "") ? (Math.max(0, Math.round(+b.cook_minutes)) || null) : null;
  var prep_minutes = (b.prep_minutes != null && b.prep_minutes !== "") ? (Math.max(0, Math.round(+b.prep_minutes)) || null) : null;
  var equipment = b.equipment ? String(b.equipment).trim().slice(0, 300) || null : null;
  var prep_note = b.prep_note ? String(b.prep_note).trim().slice(0, 500) || null : null;
  var head = await admin.from("my20fit_menu_contribution").select("id", { count: "exact", head: true })
    .eq("auth_user_id", user.id).gte("created_at", startOfTodayISO());
  if ((head.count || 0) >= MENU_DAILY_LIMIT) return res.status(429).json({ error: "Batas " + MENU_DAILY_LIMIT + " submit/hari tercapai. Coba lagi besok." });
  var { data, error } = await admin.from("my20fit_menu_contribution")
    .insert({ auth_user_id: user.id, name: name, diet_type: diet_type, display_name: display_name, ingredients: ingredients, steps: steps, steps_json: stepsStruct ? stepsStruct.json : null, servings: servings, cook_minutes: cook_minutes, prep_minutes: prep_minutes, equipment: equipment, prep_note: prep_note, photo_url: photo_url, est_kcal: est_kcal, content_hash: menuHash(name, ingredients, steps) })
    .select("id").limit(1).single();
  if (error) {
    if (error.code === "23505" || String(error.message || "").toLowerCase().indexOf("duplicate") >= 0)
      return res.status(409).json({ error: "Menu dengan isi persis sama sudah ada. Buat yang berbeda." });
    return res.status(500).json({ error: error.message });
  }
  return res.json({ ok: true, id: data.id });
});
// PUBLIK: angka ambang reward sumbang-resep -- supaya frontend TIDAK hardcode "10"/"5" (bisa
// diubah di sini tanpa deploy frontend). Tidak butuh login: dipakai jadi ajakan SEBELUM user
// masuk juga (tombol "Bikin resep"), bukan cuma di halaman progres yang sudah login.
app.get("/api/menu/reward-config", function (req, res) {
  res.set("Cache-Control", "public, max-age=3600");
  return res.json({ ok: true, per_cycle: MENU_REWARD_PER_CYCLE, reward_scan: MENU_REWARD_SCAN_CREDITS });
});
// User: submission-ku + progres reward.
app.get("/api/menu/mine", async (req, res) => {
  var user = await getUserFromReq(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  var { data: rows, error } = await admin.from("my20fit_menu_contribution")
    .select("id,name,diet_type,display_name,ingredients,steps,steps_json,photo_url,status,reject_reason,est_kcal,servings,cook_minutes,prep_minutes,equipment,prep_note,created_at,reviewed_at,published")
    .eq("auth_user_id", user.id).order("created_at", { ascending: false }).limit(200);
  if (error) return res.status(500).json({ error: error.message });
  // "approved": dipakai match reward RPC yang sudah live (approved saja, lihat catatan di atas
  // MENU_REWARD_PER_CYCLE). "approvedPublished": buat TAMPILAN progres Tahap 3 -- syarat lebih
  // ketat (approved DAN published) supaya orang tak asal kirim 10 resep yang belum tentu tayang.
  var approved = (rows || []).filter(function (r) { return r.status === "approved"; }).length;
  var approvedPublished = (rows || []).filter(function (r) { return r.status === "approved" && r.published; }).length;
  var { data: rl } = await admin.from("my20fit_menu_reward_log").select("credits_granted").eq("auth_user_id", user.id).eq("status", "granted");
  var creditsEarned = (rl || []).reduce(function (s, x) { return s + (+x.credits_granted || 0); }, 0);
  return res.json({
    ok: true, submissions: rows || [],
    approved: approved, approved_published: approvedPublished,
    per_cycle: MENU_REWARD_PER_CYCLE, reward_scan: MENU_REWARD_SCAN_CREDITS,
    toward_next: approved % MENU_REWARD_PER_CYCLE, credits_earned: creditsEarned,
  });
});
// User: revisi menu yang DITOLAK -> pending lagi.
app.post("/api/menu/:id/revise", async (req, res) => {
  var user = await getUserFromReq(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  var id = String(req.params.id || ""), b = req.body || {};
  var { data: cur } = await admin.from("my20fit_menu_contribution").select("id,auth_user_id,status").eq("id", id).limit(1).single();
  if (!cur || cur.auth_user_id !== user.id) return res.status(404).json({ error: "Menu tidak ditemukan." });
  if (cur.status !== "rejected") return res.status(400).json({ error: "Hanya menu yang ditolak yang bisa direvisi." });
  var name = String(b.name || "").trim(), ingredients = String(b.ingredients || "").trim(), steps = String(b.steps || "").trim();
  var stepsStruct = normalizeMenuSteps(b.steps_json);
  if (stepsStruct) steps = stepsStruct.text; // langkah terstruktur (step berfoto) jadi sumber teks langkah
  if (!name || !ingredients || !steps) return res.status(400).json({ error: "Nama, bahan, dan cara buat wajib." });
  var diet_type = String(b.diet_type || "normal").trim().toLowerCase(); if (MENU_DIET_TYPES.indexOf(diet_type) < 0) diet_type = "normal";
  var patch = { name: name, ingredients: ingredients, steps: steps, diet_type: diet_type, content_hash: menuHash(name, ingredients, steps), status: "pending", reject_reason: null, updated_at: new Date().toISOString() };
  if (stepsStruct) patch.steps_json = stepsStruct.json; else if (b.steps_json === null) patch.steps_json = null;
  if (b.servings != null) patch.servings = (b.servings === "") ? null : (Math.max(1, Math.round(+b.servings)) || null);
  if (b.cook_minutes != null) patch.cook_minutes = (b.cook_minutes === "") ? null : (Math.max(0, Math.round(+b.cook_minutes)) || null);
  if (b.prep_minutes != null) patch.prep_minutes = (b.prep_minutes === "") ? null : (Math.max(0, Math.round(+b.prep_minutes)) || null);
  if (b.equipment != null) patch.equipment = String(b.equipment).trim().slice(0, 300) || null;
  if (b.prep_note != null) patch.prep_note = String(b.prep_note).trim().slice(0, 500) || null;
  if (b.est_kcal != null) patch.est_kcal = (b.est_kcal === "") ? null : (Math.max(0, Math.round(+b.est_kcal)) || null);
  if (b.photo_url != null) patch.photo_url = b.photo_url ? String(b.photo_url) : null;
  if (b.display_name != null) patch.display_name = String(b.display_name || "").trim().slice(0, 60) || null;
  var { error } = await admin.from("my20fit_menu_contribution").update(patch).eq("id", id).eq("auth_user_id", user.id);
  if (error) { if (error.code === "23505") return res.status(409).json({ error: "Isi menu identik dgn yang sudah ada." }); return res.status(500).json({ error: error.message }); }
  return res.json({ ok: true });
});
// Superadmin: antrian review (filter status + cari nama).
app.get("/api/admin/menu", async (req, res) => {
  var ctx = await requireAdmin(req, res, "superadmin"); if (!ctx) return;
  try {
    var status = String(req.query.status || "").trim(), q = String(req.query.q || "").trim();
    var query = admin.from("my20fit_menu_contribution")
      .select("id,auth_user_id,name,diet_type,display_name,ingredients,steps,steps_json,photo_url,est_kcal,servings,cook_minutes,prep_minutes,equipment,prep_note,status,reject_reason,created_at,reviewed_at,published")
      .order("created_at", { ascending: false }).limit(200);
    if (["pending", "approved", "rejected"].indexOf(status) >= 0) query = query.eq("status", status);
    if (q) query = query.ilike("name", "%" + q + "%");
    var { data: rows, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    var ids = Array.from(new Set((rows || []).map(function (r) { return r.auth_user_id; })));
    var pmap = {};
    if (ids.length) { var { data: profs } = await admin.from("my20fit_profile").select("auth_user_id,full_name,email").in("auth_user_id", ids); (profs || []).forEach(function (p) { pmap[p.auth_user_id] = p; }); }
    var out = (rows || []).map(function (r) { var p = pmap[r.auth_user_id] || {}; return Object.assign({}, r, { contributor_name: p.full_name || null, contributor_email: p.email || null, health_flag: menuHealthFlag(r.name, r.ingredients, r.steps) }); });
    return res.json({ ok: true, menus: out });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});
// Superadmin: approve -> publish + beri reward (RPC idempoten).
app.post("/api/admin/menu/:id/approve", async (req, res) => {
  var ctx = await requireAdmin(req, res, "superadmin"); if (!ctx) return;
  var id = String(req.params.id || "");
  var { data: m } = await admin.from("my20fit_menu_contribution").select("id,auth_user_id,status").eq("id", id).limit(1).single();
  if (!m) return res.status(404).json({ error: "Menu tidak ditemukan." });
  var { error } = await admin.from("my20fit_menu_contribution")
    .update({ status: "approved", published: true, reject_reason: null, reviewed_by: ctx.user_id || null, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  var granted = 0;
  try { var { data: g } = await admin.rpc("my20fit_grant_menu_reward", { p_uid: m.auth_user_id }); granted = +g || 0; } catch (e) {}
  await adminAudit(ctx, "menu.approve", id, { user: m.auth_user_id, credits_granted: granted });
  return res.json({ ok: true, credits_granted: granted });
});
// Superadmin: reject (alasan wajib). Kalau menu tadinya APPROVED -> clawback reward.
app.post("/api/admin/menu/:id/reject", async (req, res) => {
  var ctx = await requireAdmin(req, res, "superadmin"); if (!ctx) return;
  var id = String(req.params.id || ""), reason = String((req.body || {}).reason || "").trim();
  if (!reason) return res.status(400).json({ error: "Alasan penolakan wajib diisi." });
  var { data: m } = await admin.from("my20fit_menu_contribution").select("id,auth_user_id,status").eq("id", id).limit(1).single();
  if (!m) return res.status(404).json({ error: "Menu tidak ditemukan." });
  var wasApproved = m.status === "approved";
  var { error } = await admin.from("my20fit_menu_contribution")
    .update({ status: "rejected", published: false, reject_reason: reason, reviewed_by: ctx.user_id || null, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  var clawed = 0;
  if (wasApproved) { try { var { data: rv } = await admin.rpc("my20fit_revoke_menu_reward", { p_uid: m.auth_user_id }); clawed = +rv || 0; } catch (e) {} }
  await adminAudit(ctx, wasApproved ? "menu.revoke" : "menu.reject", id, { user: m.auth_user_id, reason: reason, credits_clawed: clawed });
  return res.json({ ok: true, credits_clawed: clawed });
});

// ============ DIET Bagian 2: endpoint PUBLIK untuk menu.20fit.id ============
// Subdomain menu.20fit.id (frontend terpisah) menarik data dari SINI — SATU sumber,
// tanpa duplikat katalog. Semua di bawah ini boleh diakses TANPA login (browse publik).

// Deteksi KLAIM KESEHATAN/medis pada kontribusi user. Ini SINYAL untuk reviewer admin —
// gerbang tayang tetap moderasi admin (approve/reject), bukan auto-block.
var MENU_HEALTH_CLAIM_RE = /(menyembuhkan|nyembuhin|mengobati|\bobat\b|\bsembuh\b|anti[- ]?kanker|\bkanker\b|diabetes|tekanan darah|gula darah|kolesterol|detoks total|awet muda|\bcure\b|\bcures\b|\bheals?\b|\btreats?\b)/i;
function menuHealthFlag(name, ingredients, steps) {
  try { return MENU_HEALTH_CLAIM_RE.test([name, ingredients, steps].join(" ")); }
  catch (e) { return false; }
}

// Katalog resep resmi 20FIT dibaca dari js/recipes.js (SATU sumber; sama dgn /diet).
var _menuCatalogCache = null;
function loadMenuCatalog() {
  if (_menuCatalogCache) return _menuCatalogCache;
  try { var m = require("./js/recipes.js"); _menuCatalogCache = (m && Array.isArray(m.LIST)) ? m.LIST : []; }
  catch (e) { _menuCatalogCache = []; }
  return _menuCatalogCache;
}

// PUBLIK: katalog resep resmi 20FIT (id, nama EN/ID, makro perkiraan, bahan, langkah).
app.get("/api/menu/catalog", function (req, res) {
  var list = loadMenuCatalog();
  res.set("Cache-Control", "public, max-age=300");
  return res.json({ ok: true, count: list.length, recipes: list });
});

// PUBLIK: kontribusi user yang APPROVED + PUBLISHED (tanpa PII). Dibaca service key
// (bypass RLS) TAPI difilter ketat ke approved+published & field aman -> layak publik.
app.get("/api/menu/published", async function (req, res) {
  try {
    if (!admin) return res.json({ ok: true, menus: [] });
    var q = String(req.query.q || "").trim();
    var diet = String(req.query.diet || "").trim().toLowerCase();
    var limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 100));
    var query = admin.from("my20fit_menu_contribution")
      .select("id,name,diet_type,display_name,ingredients,steps,steps_json,photo_url,est_kcal,servings,cook_minutes,prep_minutes,equipment,prep_note,reviewed_at")
      .eq("status", "approved").eq("published", true)
      .order("reviewed_at", { ascending: false }).limit(limit);
    if (q) query = query.ilike("name", "%" + q + "%");
    if (diet && MENU_DIET_TYPES.indexOf(diet) >= 0) query = query.eq("diet_type", diet);
    var { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.set("Cache-Control", "public, max-age=60");
    return res.json({ ok: true, menus: data || [] });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// PUBLIK: katering yang menjual resep ini -- penghubung EKSPLISIT lewat (source, menu_id),
// bukan pencocokan nama (lihat migration create_my20fit_caterer_menus). Murni direktori,
// TANPA transaksi/komisi (dikonfirmasi user) -- order_url/whatsapp langsung ke katering.
// Urutan default: terverifikasi dulu, lalu sort_order manual dari CMS -- BUKAN "terpopuler"
// (datanya belum cukup, lihat my20fit_caterer_clicks). "Terdekat" dihitung di klien (browser
// yang punya lokasi user, bukan server) dari latitude/longitude yang dikirim di sini.
app.get("/api/menu/:id/caterers", async (req, res) => {
  try {
    var menu_id = String(req.params.id || "").slice(0, 80);
    var source = String(req.query.source || "").trim().toLowerCase();
    if (!menu_id || (source !== "official" && source !== "member")) return res.json({ ok: true, caterers: [] });
    if (!admin) return res.json({ ok: true, caterers: [] });
    var { data: links, error } = await admin.from("my20fit_caterer_menus")
      .select("price,portion_note,sort_order,my20fit_caterers!inner(id,name,slug,description,logo_url,phone,whatsapp,address,area,latitude,longitude,delivery_areas,min_order,order_url,is_verified,sort_order,is_active)")
      .eq("source", source).eq("menu_id", menu_id).eq("is_available", true)
      .eq("my20fit_caterers.is_active", true);
    if (error) return res.status(500).json({ error: error.message });
    var out = (links || []).map(function (l) {
      var c = l.my20fit_caterers;
      return {
        id: c.id, name: c.name, slug: c.slug, description: c.description, logo_url: c.logo_url,
        phone: c.phone, whatsapp: c.whatsapp, address: c.address, area: c.area,
        latitude: c.latitude, longitude: c.longitude, delivery_areas: c.delivery_areas,
        min_order: c.min_order, order_url: c.order_url, is_verified: c.is_verified,
        price: l.price, portion_note: l.portion_note,
        _sort: (c.is_verified ? 0 : 1) + "-" + String(c.sort_order || 0).padStart(6, "0") + "-" + String(l.sort_order || 0).padStart(6, "0"),
      };
    }).sort(function (a, b) { return a._sort < b._sort ? -1 : a._sort > b._sort ? 1 : 0; })
      .map(function (c) { delete c._sort; return c; });
    res.set("Cache-Control", "public, max-age=60");
    return res.json({ ok: true, caterers: out });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// PUBLIK (login opsional, guest via cookie eco_anon -- pola sama dgn reaction): catat klik ke
// katering. HANYA disimpan -- TIDAK dipakai utk urutan apapun sekarang (belum cukup data).
// Tabel my20fit_caterer_clicks sengaja 0 RLS policy -- baca/tulis cuma lewat sini.
app.post("/api/menu/caterer-click", async (req, res) => {
  try {
    if (!admin) return res.json({ ok: true });
    var b = req.body || {};
    var caterer_id = String(b.caterer_id || "").trim();
    var source = String(b.source || "").trim().toLowerCase();
    var menu_id = String(b.menu_id || "").slice(0, 80);
    if (!caterer_id || !menu_id || (source !== "official" && source !== "member")) {
      return res.status(400).json({ error: "caterer_id, source, menu_id wajib." });
    }
    var user = await getUserFromReq(req);
    var row = { caterer_id: caterer_id, source: source, menu_id: menu_id };
    if (user) {
      row.auth_user_id = user.id;
    } else {
      var sess = await getAnonSession(req, res, true);
      if (sess) row.anon_id = sess.anon_id;
    }
    await admin.from("my20fit_caterer_clicks").insert(row);
    return res.json({ ok: true });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// ---------- recepie.20fit.id "Eat Now" -> pesan-antar (GrabFood dll) ----------
// TANPA API/scraping Grab. Hanya menautkan ke halaman KATEGORI publik mereka (meta-robots
// index,follow -> memang boleh ditautkan). Pemetaan EKSPLISIT per resep, admin isi via CMS
// (tabel my20fit_menu_delivery_links). Kita TIDAK klaim "restoran X jual ini" -- daftar
// restoran baru muncul di sisi Grab setelah user isi alamat. Preset kategori GrabFood
// dikumpulkan manual dari struktur URL publik food.grab.com (bukan scraping katalog).
var GRABFOOD_BASE = "https://food.grab.com";
var GRABFOOD_PRESETS = [
  { label: "Nasi Goreng", path: "/id/id/cuisines/nasi-goreng-delivery/71" },
  { label: "Ayam Goreng", path: "/id/id/cuisines/ayam-goreng-delivery/69" },
  { label: "Ayam", path: "/id/id/cuisines/ayam-delivery/43" },
  { label: "Sate", path: "/id/id/cuisines/sate-delivery/150" },
  { label: "Bakso", path: "/id/id/cuisines/bakso-delivery/8" },
  { label: "Mie", path: "/id/id/cuisines/mie-delivery/126" },
  { label: "Aneka Nasi", path: "/id/id/cuisines/aneka-nasi-delivery/144" },
  { label: "Hidangan Laut", path: "/id/id/cuisines/hidangan-laut-delivery/151" },
  { label: "Martabak", path: "/id/id/cuisines/martabak-delivery/107" },
  { label: "Camilan", path: "/id/id/cuisines/camilan-delivery/157" },
  { label: "Kopi", path: "/id/id/cuisines/kopi-delivery/47" },
  { label: "Minuman", path: "/id/id/cuisines/minuman-delivery/24" },
  { label: "Roti & Kue", path: "/id/id/cuisines/roti-kue-delivery/7" },
  { label: "Masakan Indonesia", path: "/id/id/restaurants?category=indonesian-87" },
];

// PUBLIK: tautan pesan-antar AKTIF utk satu resep (urut sort_order). Kosong -> klien sembunyikan.
app.get("/api/menu/:id/delivery", async (req, res) => {
  try {
    if (!admin) return res.json({ ok: true, links: [] });
    var menu_id = String(req.params.id || "").slice(0, 80);
    var source = String(req.query.source || "").trim().toLowerCase();
    if (!menu_id || (source !== "official" && source !== "member")) return res.json({ ok: true, links: [] });
    var { data, error } = await admin.from("my20fit_menu_delivery_links")
      .select("id,provider,label,url,sort_order")
      .eq("source", source).eq("menu_id", menu_id).eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    res.set("Cache-Control", "public, max-age=60");
    return res.json({ ok: true, links: data || [] });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// PUBLIK (login opsional, guest via cookie eco_anon): catat klik ke penyedia pesan-antar.
// Hanya analitik -- TIDAK dipakai utk urutan apa pun sekarang. Pola sama caterer-click.
app.post("/api/menu/delivery-click", async (req, res) => {
  try {
    if (!admin) return res.json({ ok: true });
    var b = req.body || {};
    var source = String(b.source || "").trim().toLowerCase();
    var menu_id = String(b.menu_id || "").slice(0, 80);
    var provider = String(b.provider || "").trim().slice(0, 40);
    if (!menu_id || !provider || (source !== "official" && source !== "member"))
      return res.status(400).json({ error: "source, menu_id, provider wajib." });
    var user = await getUserFromReq(req);
    var row = { source: source, menu_id: menu_id, provider: provider };
    if (user) row.auth_user_id = user.id;
    else { var sess = await getAnonSession(req, res, true); if (sess) row.anon_id = sess.anon_id; }
    await admin.from("my20fit_menu_delivery_clicks").insert(row);
    return res.json({ ok: true });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// ADMIN (superadmin): preset kategori GrabFood siap pakai (biar admin tak salin URL manual).
app.get("/api/admin/menu-delivery/presets", async (req, res) => {
  var ctx = await requireAdmin(req, res, "superadmin"); if (!ctx) return;
  return res.json({ ok: true, grabfood_base: GRABFOOD_BASE, presets: GRABFOOD_PRESETS });
});

// ADMIN: daftar pemetaan + resep yang BELUM dipetakan (biar kelihatan yang tertinggal).
app.get("/api/admin/menu-delivery", async (req, res) => {
  var ctx = await requireAdmin(req, res, "superadmin"); if (!ctx) return;
  try {
    var { data: links, error } = await admin.from("my20fit_menu_delivery_links")
      .select("id,source,menu_id,provider,label,url,sort_order,is_active,created_at,updated_at")
      .order("updated_at", { ascending: false }).limit(2000);
    if (error) return res.status(500).json({ error: error.message });
    var official = loadMenuCatalog().map(function (r) {
      return { source: "official", menu_id: r.id, name: (r.nm && (r.nm.id || r.nm.en)) || r.id };
    });
    var { data: mem } = await admin.from("my20fit_menu_contribution")
      .select("id,name").eq("status", "approved").eq("published", true).limit(1000);
    var recipes = official.concat((mem || []).map(function (m) { return { source: "member", menu_id: m.id, name: m.name }; }));
    var mapped = {};
    (links || []).forEach(function (l) { mapped[l.source + ":" + l.menu_id] = true; });
    var unmapped = recipes.filter(function (r) { return !mapped[r.source + ":" + r.menu_id]; });
    return res.json({ ok: true, links: links || [], recipes: recipes, unmapped_count: unmapped.length, unmapped: unmapped });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// ADMIN: buat pemetaan. (Data pemetaan diisi admin, bukan ditebak dari nama makanan.)
app.post("/api/admin/menu-delivery", async (req, res) => {
  var ctx = await requireAdmin(req, res, "superadmin"); if (!ctx) return;
  try {
    var b = req.body || {};
    var source = String(b.source || "").trim().toLowerCase();
    var menu_id = String(b.menu_id || "").slice(0, 80);
    var provider = String(b.provider || "grabfood").trim().slice(0, 40);
    var label = String(b.label || "").trim().slice(0, 120);
    var url = String(b.url || "").trim();
    if (!menu_id || !label || !url || (source !== "official" && source !== "member"))
      return res.status(400).json({ error: "source, menu_id, label, url wajib." });
    if (!/^https:\/\//i.test(url)) return res.status(400).json({ error: "URL harus diawali https://" });
    var sort_order = (b.sort_order != null && b.sort_order !== "") ? (parseInt(b.sort_order, 10) || 0) : 0;
    var is_active = b.is_active === false ? false : true;
    var { data, error } = await admin.from("my20fit_menu_delivery_links")
      .insert({ source: source, menu_id: menu_id, provider: provider, label: label, url: url, sort_order: sort_order, is_active: is_active })
      .select("id").limit(1).single();
    if (error) return res.status(500).json({ error: error.message });
    await adminAudit(ctx, "menu_delivery.create", data.id, { source: source, menu_id: menu_id, provider: provider });
    return res.json({ ok: true, id: data.id });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// ADMIN: ubah pemetaan.
app.post("/api/admin/menu-delivery/:id/update", async (req, res) => {
  var ctx = await requireAdmin(req, res, "superadmin"); if (!ctx) return;
  try {
    var id = String(req.params.id || ""), b = req.body || {};
    var patch = { updated_at: new Date().toISOString() };
    if (b.provider != null) patch.provider = String(b.provider).trim().slice(0, 40);
    if (b.label != null) patch.label = String(b.label).trim().slice(0, 120);
    if (b.url != null) { var u = String(b.url).trim(); if (!/^https:\/\//i.test(u)) return res.status(400).json({ error: "URL harus https://" }); patch.url = u; }
    if (b.sort_order != null) patch.sort_order = parseInt(b.sort_order, 10) || 0;
    if (b.is_active != null) patch.is_active = !!b.is_active;
    var { error } = await admin.from("my20fit_menu_delivery_links").update(patch).eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    await adminAudit(ctx, "menu_delivery.update", id, patch);
    return res.json({ ok: true });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// ADMIN: hapus pemetaan.
app.post("/api/admin/menu-delivery/:id/delete", async (req, res) => {
  var ctx = await requireAdmin(req, res, "superadmin"); if (!ctx) return;
  try {
    var id = String(req.params.id || "");
    var { error } = await admin.from("my20fit_menu_delivery_links").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    await adminAudit(ctx, "menu_delivery.delete", id, null);
    return res.json({ ok: true });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// ---------- recepie.20fit.id: foto langkah, reaction (heart), save (koleksi) ----------
// Normalisasi langkah terstruktur (step berfoto). Terima [{t, photo}] -> bersihkan, batasi
// jumlah/panjang, foto HANYA URL bucket menu-photos kita (anti tempel URL eksternal) / null.
// Balik { json, text } — text dipakai kolom `steps` lama (kompatibel mundur + tampil moderasi).
function normalizeMenuSteps(input) {
  if (!Array.isArray(input)) return null;
  var out = [];
  for (var i = 0; i < input.length && out.length < 40; i++) {
    var it = input[i] || {};
    var t = String(it.t == null ? "" : it.t).trim().slice(0, 2000);
    var photo = it.photo == null ? null : String(it.photo).trim();
    if (photo && !/^https:\/\/[a-z0-9.-]*supabase\.co\/storage\/v1\/object\/public\/menu-photos\//i.test(photo)) photo = null;
    if (!t && !photo) continue;
    out.push({ t: t, photo: photo || null });
  }
  if (!out.length) return null;
  var text = out.map(function (s, idx) { return (idx + 1) + ". " + s.t; }).join("\n");
  return { json: out, text: text };
}

// AUTH: unggah satu foto resep (utama / per-langkah) -> bucket 'menu-photos' (publik), balik URL.
// Disimpan di Storage (bukan base64 di DB). Nama file di-namespace per user + acak (tak tertebak).
app.post("/api/menu/upload", async (req, res) => {
  try {
    var user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    if (!admin) return res.status(503).json({ error: "Storage tidak tersedia." });
    var dataUrl = String((req.body || {}).data_url || "");
    var m = dataUrl.match(/^data:(image\/(png|jpe?g|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!m) return res.status(400).json({ error: "Format gambar tidak didukung (png/jpg/webp)." });
    var contentType = m[1];
    var ext = (m[2] === "jpeg") ? "jpg" : m[2];
    var buf = Buffer.from(m[3], "base64");
    if (buf.length > 5 * 1024 * 1024) return res.status(413).json({ error: "Ukuran gambar maksimal 5MB." });
    var name = user.id + "/" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1e9).toString(36) + "." + ext;
    var up = await admin.storage.from("menu-photos").upload(name, buf, { contentType: contentType, upsert: false });
    if (up.error) throw up.error;
    var { data: pub } = admin.storage.from("menu-photos").getPublicUrl(name);
    return res.json({ ok: true, url: (pub && pub.publicUrl) || null, path: name });
  } catch (e) { return res.status(500).json({ error: (e && e.message) || "Gagal unggah foto." }); }
});

// PUBLIK (login opsional): toggle heart. 1 pemilik (akun ATAU sesi anonim) 1 reaction/resep
// (unique index DB, lihat migration menu_reaction_allow_anon_like). Body {source:'official'|'member'}.
// Jumlah dihitung server (service key) -> tak bisa dicurangi client. Guest diidentifikasi lewat
// cookie httpOnly eco_anon (my20fit_anonymous_sessions) -- SAMA dgn kuota scan anonim, dibuat
// on-demand di sini (bukan dari sekadar buka halaman) supaya tabel tak dibanjiri sesi tak aktif.
app.post("/api/menu/:id/react", async (req, res) => {
  try {
    var menu_id = String(req.params.id || "").slice(0, 80);
    var source = String((req.body || {}).source || "").trim().toLowerCase();
    if (!menu_id) return res.status(400).json({ error: "menu_id wajib." });
    if (source !== "official" && source !== "member") return res.status(400).json({ error: "source tidak valid." });

    var user = await getUserFromReq(req);
    var ownerCol = user ? "auth_user_id" : "anon_id";
    var ownerVal = user ? user.id : null;
    if (!user) {
      var sess = await getAnonSession(req, res, true);
      if (!sess) return res.status(503).json({ error: "Server belum siap." });
      ownerVal = sess.anon_id;
    }

    var { data: ex } = await admin.from("my20fit_menu_reaction").select("id")
      .eq(ownerCol, ownerVal).eq("source", source).eq("menu_id", menu_id).limit(1);
    var reacted;
    if (ex && ex[0]) {
      await admin.from("my20fit_menu_reaction").delete().eq("id", ex[0].id);
      reacted = false;
    } else {
      var row = { source: source, menu_id: menu_id, kind: "heart" };
      row[ownerCol] = ownerVal;
      var ins = await admin.from("my20fit_menu_reaction").insert(row);
      if (ins.error && ins.error.code !== "23505") throw ins.error; // 23505 = race, sudah ada -> anggap reacted
      reacted = true;
    }
    var { count } = await admin.from("my20fit_menu_reaction").select("id", { count: "exact", head: true })
      .eq("source", source).eq("menu_id", menu_id);
    return res.json({ ok: true, reacted: reacted, count: count || 0 });
  } catch (e) { return res.status(500).json({ error: (e && e.message) || "Gagal." }); }
});

// AUTH: pindahkan like sesi anonim (cookie eco_anon) ke akun yang baru login/daftar, supaya
// guest yang like lalu bikin akun tidak kehilangan like-nya. Idempoten: aman dipanggil berkali-kali
// (anon session yang sudah converted_user_id -> tak ada baris anon lagi utk dipindah).
app.post("/api/menu/claim-anon-likes", async (req, res) => {
  try {
    var user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    var sess = await getAnonSession(req, res, false);
    if (!sess) return res.json({ ok: true, migrated: 0 });

    var { data: anonRows } = await admin.from("my20fit_menu_reaction")
      .select("id,source,menu_id,kind").eq("anon_id", sess.anon_id);
    anonRows = anonRows || [];
    var migrated = 0;
    if (anonRows.length) {
      var { data: ownRows } = await admin.from("my20fit_menu_reaction")
        .select("source,menu_id,kind").eq("auth_user_id", user.id);
      var ownKeys = new Set((ownRows || []).map(function (r) { return r.source + ":" + r.menu_id + ":" + r.kind; }));
      for (var i = 0; i < anonRows.length; i++) {
        var r = anonRows[i];
        var key = r.source + ":" + r.menu_id + ":" + r.kind;
        if (ownKeys.has(key)) {
          // Akun ini sudah like resep yang sama dari device lain -> baris anon jadi duplikat, buang.
          await admin.from("my20fit_menu_reaction").delete().eq("id", r.id);
        } else {
          await admin.from("my20fit_menu_reaction").update({ auth_user_id: user.id, anon_id: null }).eq("id", r.id);
          migrated++;
        }
      }
    }
    try { await admin.from("my20fit_anonymous_sessions").update({ converted_user_id: user.id }).eq("anon_id", sess.anon_id); } catch (_e) {}
    return res.json({ ok: true, migrated: migrated });
  } catch (e) { return res.status(500).json({ error: (e && e.message) || "Gagal." }); }
});

// AUTH: toggle simpan resep ke koleksi. Body {source:'official'|'member'}.
app.post("/api/menu/:id/save", async (req, res) => {
  try {
    var user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    var menu_id = String(req.params.id || "").slice(0, 80);
    var source = String((req.body || {}).source || "").trim().toLowerCase();
    if (!menu_id) return res.status(400).json({ error: "menu_id wajib." });
    if (source !== "official" && source !== "member") return res.status(400).json({ error: "source tidak valid." });
    var { data: ex } = await admin.from("my20fit_menu_save").select("id")
      .eq("auth_user_id", user.id).eq("source", source).eq("menu_id", menu_id).limit(1);
    var saved;
    if (ex && ex[0]) {
      await admin.from("my20fit_menu_save").delete().eq("id", ex[0].id);
      saved = false;
    } else {
      var ins = await admin.from("my20fit_menu_save").insert({ auth_user_id: user.id, source: source, menu_id: menu_id });
      if (ins.error && ins.error.code !== "23505") throw ins.error;
      saved = true;
    }
    return res.json({ ok: true, saved: saved });
  } catch (e) { return res.status(500).json({ error: (e && e.message) || "Gagal." }); }
});

// AUTH: koleksi resep tersimpan milik user. Member approved+published di-hydrate (kartu penuh);
// official dikembalikan sbg id (klien resolve dari katalog yang sudah ada).
app.get("/api/menu/saved", async (req, res) => {
  try {
    var user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    var { data: rows, error } = await admin.from("my20fit_menu_save")
      .select("source,menu_id,created_at").eq("auth_user_id", user.id)
      .order("created_at", { ascending: false }).limit(300);
    if (error) throw error;
    rows = rows || [];
    var memberIds = rows.filter(function (r) { return r.source === "member"; }).map(function (r) { return r.menu_id; });
    var members = {};
    if (memberIds.length) {
      var { data: mem } = await admin.from("my20fit_menu_contribution")
        .select("id,name,diet_type,ingredients,steps,steps_json,photo_url,est_kcal,servings,cook_minutes,reviewed_at,status,published")
        .in("id", memberIds);
      (mem || []).forEach(function (mm) { if (mm.status === "approved" && mm.published) members[mm.id] = mm; });
    }
    return res.json({ ok: true, saved: rows, members: members });
  } catch (e) { return res.status(500).json({ error: (e && e.message) || "Gagal." }); }
});

// PUBLIK: jumlah heart utk banyak resep sekaligus (1 call/halaman utk kartu & detail).
// ?ids=source:menu_id,source:menu_id,... Kalau ada token user -> sekaligus balik state
// reacted/saved milik user (opsional; kegagalan verifikasi token TIDAK menghapus counts publik).
app.get("/api/menu/social", async (req, res) => {
  try {
    if (!admin) return res.json({ ok: true, counts: {}, reacted: [], saved: [] });
    var raw = String(req.query.ids || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 200);
    var pairs = [];
    raw.forEach(function (tok) {
      var i = tok.indexOf(":"); if (i < 0) return;
      var s = tok.slice(0, i).toLowerCase(), mid = tok.slice(i + 1);
      if ((s === "official" || s === "member") && mid) pairs.push({ source: s, menu_id: mid });
    });
    var counts = {};
    var ids = pairs.map(function (p) { return p.menu_id; });
    if (ids.length) {
      var { data: cnts } = await admin.from("my20fit_menu_reaction_count").select("source,menu_id,cnt").in("menu_id", ids);
      (cnts || []).forEach(function (r) { counts[r.source + ":" + r.menu_id] = r.cnt; });
    }
    var reacted = [], saved = [];
    if (ids.length) {
      try {
        var user = await getUserFromReq(req);
        if (user) {
          var { data: mr } = await admin.from("my20fit_menu_reaction").select("source,menu_id").eq("auth_user_id", user.id).in("menu_id", ids);
          (mr || []).forEach(function (r) { reacted.push(r.source + ":" + r.menu_id); });
          var { data: ms } = await admin.from("my20fit_menu_save").select("source,menu_id").eq("auth_user_id", user.id).in("menu_id", ids);
          (ms || []).forEach(function (r) { saved.push(r.source + ":" + r.menu_id); });
        } else {
          // Guest: baca status like MILIKNYA dari sesi anonim (cookie eco_anon) kalau sudah ada --
          // read-only (createIfMissing=false), jangan bikin sesi baru cuma dari lihat-lihat halaman.
          var anonSess = await getAnonSession(req, res, false);
          if (anonSess) {
            var { data: ar } = await admin.from("my20fit_menu_reaction").select("source,menu_id").eq("anon_id", anonSess.anon_id).in("menu_id", ids);
            (ar || []).forEach(function (r) { reacted.push(r.source + ":" + r.menu_id); });
          }
        }
      } catch (_e) { /* state user opsional — abaikan, counts publik tetap dikembalikan */ }
    }
    res.set("Cache-Control", "no-store");
    return res.json({ ok: true, counts: counts, reacted: reacted, saved: saved });
  } catch (e) { return res.json({ ok: true, counts: {}, reacted: [], saved: [] }); }
});

// Info konfigurasi runtime (superadmin only) — status env, TANPA membocorkan nilai rahasia.
app.get("/api/admin/config", async (req, res) => {
  const ctx = await requireAdmin(req, res, "superadmin"); if (!ctx) return;
  return res.json({
    ok: true,
    config: {
      supabase_service_key: !!admin,
      xendit_enabled: XENDIT_ENABLED,
      fitco_api_url: FITCO_API,
      fitco_partner_token: !!FITCO_PARTNER_TOKEN,
      meta_capi: !!process.env.META_CAPI_ACCESS_TOKEN,
      admin_master_key: !!process.env.ADMIN_KEY,
    }
  });
});

// Diagnostik pembayaran (superadmin): cek config + REACHABILITY ke FITCO dari server production,
// TANPA membuat order/invoice. GET pada endpoint shop-order (yang POST) -> 404/405 = normal & bukti
// endpoint terjangkau; timeout/refused = jaringan Railway->FITCO bermasalah (sebab paling mungkin
// checkout gagal). Buka: /api/admin/payment-probe?key=<master key>.
app.get("/api/admin/payment-probe", async (req, res) => {
  const ctx = await requireAdmin(req, res, "superadmin"); if (!ctx) return;
  const out = {
    ok: true,
    config: {
      fitco_api_url: FITCO_API,
      fitco_partner_token_set: !!FITCO_PARTNER_TOKEN,
      xendit_enabled: XENDIT_ENABLED,
      scan_products: Object.keys(SCAN_PACKAGES).map(Number),
    },
  };
  const target = FITCO_API + "/api/v1/third-party/shop/order";
  const ctrl = new AbortController();
  const t0 = Date.now();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(target, { method: "GET", headers: { "Accept": "application/json" }, signal: ctrl.signal });
    clearTimeout(timer);
    const sample = (await r.text().catch(() => "")).slice(0, 160);
    out.reach = {
      reachable: true, status: r.status, ms: Date.now() - t0,
      note: "GET pada endpoint POST — 404/405 itu normal, artinya FITCO TERJANGKAU dari server.",
      sample: sample,
    };
  } catch (e) {
    clearTimeout(timer);
    const aborted = e && (e.name === "AbortError" || e.code === "ABORT_ERR");
    out.reach = {
      reachable: false, ms: Date.now() - t0,
      error: aborted ? "timeout_8s" : ((e && e.message) || "fetch_failed"),
      note: "FITCO TIDAK terjangkau dari server (jaringan/URL) — ini yang bikin checkout gagal.",
    };
  }
  try { await adminAudit(ctx, "payment_probe", "fitco", JSON.stringify(out.reach).slice(0, 300)); } catch (e) {}
  return res.json(out);
});

// Rentang tanggal dari query (today/7d/30d/custom).
function adminRange(q) {
  const now = new Date();
  let to = now, from;
  const r = String((q && q.range) || "7d");
  if (r === "today") from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  else if (r === "all") from = new Date(2020, 0, 1);
  else if (r === "30d") from = new Date(now.getTime() - 30 * 86400000);
  else if (r === "week") { // minggu ini: Senin 00:00 (lokal) s/d sekarang
    const dow = (now.getDay() + 6) % 7; // 0 = Senin
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dow);
  } else if (r === "month") { // bulan ini: tgl 1 00:00 (lokal) s/d sekarang
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (r === "custom") {
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
    const { data: orders, error: eOrd } = await admin.from("my20fit_scan_orders")
      .select("reff_no,auth_user_id,amount,net_amount,credits,status,payment_method,voucher_id,created_at,paid_at")
      .gte("created_at", from).lte("created_at", to);
    if (eOrd) throw eOrd;
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
// Aktifkan kembali voucher yang di-nonaktifkan (mirror deactivate) + audit.
app.post("/api/admin/vouchers/:id/activate", async (req, res) => {
  const ctx = await requireAdmin(req, res, "staff"); if (!ctx) return;
  const { data: cur } = await admin.from("my20fit_vouchers").select("code").eq("id", req.params.id).limit(1);
  const { error } = await admin.from("my20fit_vouchers").update({ status: "active", updated_at: new Date().toISOString() }).eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  await adminAudit(ctx, "voucher.activate", (cur && cur[0] && cur[0].code) || req.params.id, null);
  return res.json({ ok: true });
});

// Tracking voucher (analitik): perbandingan per voucher urut revenue bersih + tabel kode gagal.
// Read-only, bebas data kesehatan. % pembeli baru = redeemer dengan <=1 order paid all-time (proxy).
app.get("/api/admin/vouchers/tracking", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer"); if (!ctx) return;
  try {
    const { data: vouchers } = await admin.from("my20fit_vouchers").select("*").order("created_at", { ascending: false }).limit(2000);
    const { data: usages } = await admin.from("my20fit_voucher_usages").select("voucher_id,auth_user_id,discount_applied").limit(100000);
    const { data: orders } = await admin.from("my20fit_scan_orders").select("auth_user_id,net_amount,amount,status,voucher_id").limit(100000);
    let attempts = [];
    try { const { data: at } = await admin.from("my20fit_voucher_attempts").select("code_tried,result").limit(100000); attempts = at || []; } catch (e) {}
    const paidByUser = {}; (orders || []).filter(o => o.status === "paid").forEach(o => { if (o.auth_user_id) paidByUser[o.auth_user_id] = (paidByUser[o.auth_user_id] || 0) + 1; });
    const netByV = {}; (orders || []).filter(o => o.status === "paid" && o.voucher_id).forEach(o => { netByV[o.voucher_id] = (netByV[o.voucher_id] || 0) + ((o.net_amount != null ? +o.net_amount : +o.amount) || 0); });
    const useByV = {}, redeemers = {}, discByV = {};
    (usages || []).forEach(u => {
      useByV[u.voucher_id] = (useByV[u.voucher_id] || 0) + 1;
      (redeemers[u.voucher_id] = redeemers[u.voucher_id] || new Set()).add(u.auth_user_id);
      discByV[u.voucher_id] = (discByV[u.voucher_id] || 0) + (+u.discount_applied || 0);
    });
    const attByCode = {}, failByCode = {};
    (attempts).forEach(a => {
      attByCode[a.code_tried] = (attByCode[a.code_tried] || 0) + 1;
      if (a.result !== "ok") { const m = failByCode[a.code_tried] = failByCode[a.code_tried] || {}; m[a.result] = (m[a.result] || 0) + 1; }
    });
    const now = new Date();
    const rows = (vouchers || []).map(v => {
      const used = useByV[v.id] || 0;
      const rset = redeemers[v.id] || new Set();
      let newB = 0; rset.forEach(uid => { if ((paidByUser[uid] || 0) <= 1) newB++; });
      const att = attByCode[v.code] || 0;
      const expired = v.valid_until && new Date(v.valid_until) < now;
      const quotaFull = v.usage_limit_total != null && used >= v.usage_limit_total;
      const status = v.status !== "active" ? "inactive" : (expired ? "expired" : (quotaFull ? "quota_full" : "active"));
      return {
        id: v.id, code: v.code, discount_type: v.discount_type, discount_value: v.discount_value,
        used: used, quota: v.usage_limit_total, discount_given: discByV[v.id] || 0, net_revenue: netByV[v.id] || 0,
        new_buyer_pct: rset.size ? Math.round(newB / rset.size * 100) : 0,
        attempts: att, redemption_rate: att ? Math.round(used / att * 100) : 0, status: status,
      };
    }).sort((a, b) => b.net_revenue - a.net_revenue);
    const failed_codes = Object.keys(failByCode).map(code => {
      const br = failByCode[code]; const total = Object.keys(br).reduce((s, k) => s + br[k], 0);
      return { code: code, total: total, breakdown: br };
    }).sort((a, b) => b.total - a.total).slice(0, 50);
    return res.json({ ok: true, vouchers: rows, failed_codes: failed_codes });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// Bulk generate kode voucher unik (staff+). Untuk satu kampanye — tiap kode 1x pakai, 1 per user.
app.post("/api/admin/vouchers/bulk", async (req, res) => {
  const ctx = await requireAdmin(req, res, "staff"); if (!ctx) return;
  const b = req.body || {};
  const n = Math.min(Math.max(parseInt(b.count, 10) || 0, 1), 100);
  const prefix = String(b.prefix || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  const dt = String(b.discount_type || ""); if (["percentage", "fixed"].indexOf(dt) < 0) return res.status(400).json({ error: "discount_type harus percentage/fixed." });
  const dv = parseInt(b.discount_value, 10) || 0; if (dv <= 0) return res.status(400).json({ error: "discount_value harus > 0." });
  const rand = () => Math.random().toString(36).slice(2, 8).toUpperCase();
  let created = 0; const codes = [];
  for (let i = 0; i < n * 3 && created < n; i++) {
    const code = (prefix || "V") + rand();
    const row = {
      code: code, name: b.name || null, description: b.description || null,
      discount_type: dt, discount_value: dv, min_transaction: b.min_transaction || null,
      usage_limit_total: 1, usage_limit_per_user: 1,
      valid_from: b.valid_from || null, valid_until: b.valid_until || null,
      status: "active", created_by: ctx.email || null,
    };
    const { error } = await admin.from("my20fit_vouchers").insert(row);
    if (!error) { created++; codes.push(code); }
    else if (error.code !== "23505") return res.status(500).json({ error: error.message });
  }
  await adminAudit(ctx, "voucher.bulk_create", (prefix || "V"), { count: created, discount_type: dt, discount_value: dv });
  return res.json({ ok: true, created: created, codes: codes });
});

// ================= BANNER / PROMOTION (Modul 5) =================
// Admin kelola; endpoint publik (serve + event) rate-limited. cta_url di-allowlist
// (cegah open redirect). Impression/click best-effort, kecualikan bot.
const BANNER_ALLOWED_HOSTS = ["my.20fit.id", "20fit.id", "www.20fit.id", "booking.20fit.id", "photo.20fit.id", "media.20fit.id"];
function bannerCtaValid(url) {
  const u = String(url || "").trim();
  if (!u) return true;                    // boleh kosong
  if (u.charAt(0) === "/") return true;   // path relatif = internal
  try { const h = new URL(u).hostname.toLowerCase(); return BANNER_ALLOWED_HOSTS.some(d => h === d || h.endsWith("." + d)); }
  catch (e) { return false; }
}
app.get("/api/admin/banners", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer"); if (!ctx) return;
  const { data, error } = await admin.from("my20fit_banner").select("*").order("priority", { ascending: false }).order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true, banners: data || [] });
});
app.post("/api/admin/banners", async (req, res) => {
  const ctx = await requireAdmin(req, res, "staff"); if (!ctx) return;
  const b = req.body || {};
  if (!bannerCtaValid(b.cta_url)) return res.status(400).json({ error: "cta_url tidak diizinkan (cegah open redirect). Pakai path '/…' atau domain 20fit.id." });
  const row = {
    title: b.title || null, image_url_id: b.image_url_id || null, image_url_en: b.image_url_en || null,
    alt_text_id: b.alt_text_id || null, alt_text_en: b.alt_text_en || null,
    cta_text_id: b.cta_text_id || null, cta_text_en: b.cta_text_en || null, cta_url: b.cta_url || null,
    cta_type: ["internal_link", "external_link", "deeplink"].indexOf(b.cta_type) >= 0 ? b.cta_type : "internal_link",
    placement: b.placement || "below_aqi", priority: parseInt(b.priority, 10) || 0,
    starts_at: b.starts_at || null, ends_at: b.ends_at || null, is_active: !!b.is_active, created_by: ctx.email || null,
  };
  const { data, error } = await admin.from("my20fit_banner").insert(row).select().limit(1);
  if (error) return res.status(500).json({ error: error.message });
  await adminAudit(ctx, "banner.create", (data && data[0] && data[0].id) || "", { title: row.title });
  return res.json({ ok: true, banner: data && data[0] });
});
app.put("/api/admin/banners/:id", async (req, res) => {
  const ctx = await requireAdmin(req, res, "staff"); if (!ctx) return;
  const b = req.body || {};
  if (b.cta_url !== undefined && !bannerCtaValid(b.cta_url)) return res.status(400).json({ error: "cta_url tidak diizinkan." });
  const upd = { updated_at: new Date().toISOString() };
  ["title", "image_url_id", "image_url_en", "alt_text_id", "alt_text_en", "cta_text_id", "cta_text_en", "cta_url", "placement", "starts_at", "ends_at"].forEach(k => { if (b[k] !== undefined) upd[k] = b[k] || null; });
  if (b.cta_type !== undefined && ["internal_link", "external_link", "deeplink"].indexOf(b.cta_type) >= 0) upd.cta_type = b.cta_type;
  if (b.priority !== undefined) upd.priority = parseInt(b.priority, 10) || 0;
  if (b.is_active !== undefined) upd.is_active = !!b.is_active;
  const { error } = await admin.from("my20fit_banner").update(upd).eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  await adminAudit(ctx, "banner.update", req.params.id, upd);
  return res.json({ ok: true });
});
app.post("/api/admin/banners/:id/toggle", async (req, res) => {
  const ctx = await requireAdmin(req, res, "staff"); if (!ctx) return;
  const on = !!(req.body && req.body.is_active);
  const { error } = await admin.from("my20fit_banner").update({ is_active: on, updated_at: new Date().toISOString() }).eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  await adminAudit(ctx, "banner.toggle", req.params.id, { is_active: on });
  return res.json({ ok: true });
});
app.post("/api/admin/banners/reorder", async (req, res) => {
  const ctx = await requireAdmin(req, res, "staff"); if (!ctx) return;
  const ids = Array.isArray(req.body && req.body.ids) ? req.body.ids : [];
  for (let i = 0; i < ids.length; i++) await admin.from("my20fit_banner").update({ priority: ids.length - i, updated_at: new Date().toISOString() }).eq("id", ids[i]);
  await adminAudit(ctx, "banner.reorder", "", { count: ids.length });
  return res.json({ ok: true });
});
app.delete("/api/admin/banners/:id", async (req, res) => {
  const ctx = await requireAdmin(req, res, "superadmin"); if (!ctx) return;
  const { error } = await admin.from("my20fit_banner").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  await adminAudit(ctx, "banner.delete", req.params.id, null);
  return res.json({ ok: true });
});
app.get("/api/admin/banners/tracking", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer"); if (!ctx) return;
  try {
    const { data: banners } = await admin.from("my20fit_banner").select("id,title,placement,is_active,priority").limit(2000);
    const { data: ev } = await admin.from("my20fit_banner_event").select("banner_id,event_type").limit(200000);
    const imp = {}, clk = {};
    (ev || []).forEach(e => { if (e.event_type === "impression") imp[e.banner_id] = (imp[e.banner_id] || 0) + 1; else if (e.event_type === "click") clk[e.banner_id] = (clk[e.banner_id] || 0) + 1; });
    const rows = (banners || []).map(bn => { const i = imp[bn.id] || 0, c = clk[bn.id] || 0; return { id: bn.id, title: bn.title, placement: bn.placement, is_active: bn.is_active, priority: bn.priority, impressions: i, clicks: c, ctr: i ? Math.round(c / i * 1000) / 10 : 0 }; }).sort((a, b) => b.impressions - a.impressions);
    return res.json({ ok: true, banners: rows });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});
// Publik: banner aktif utk placement (schedule + active + priority). Rate-limited.
app.get("/api/banners/active", apiLimiter, async (req, res) => {
  if (!admin) return res.json({ ok: true, banners: [] });
  try {
    const place = String(req.query.placement || "below_aqi");
    const nowIso = new Date().toISOString();
    const { data } = await admin.from("my20fit_banner")
      .select("id,image_url_id,image_url_en,alt_text_id,alt_text_en,cta_text_id,cta_text_en,cta_url,cta_type,priority,starts_at,ends_at")
      .eq("placement", place).eq("is_active", true).order("priority", { ascending: false }).limit(20);
    const active = (data || []).filter(b => (!b.starts_at || b.starts_at <= nowIso) && (!b.ends_at || b.ends_at >= nowIso));
    return res.json({ ok: true, banners: active });
  } catch (e) { return res.json({ ok: true, banners: [] }); }
});
// Publik: catat impression/click (balas cepat, proses async, kecualikan bot). Rate-limited.
app.post("/api/banners/event", apiLimiter, async (req, res) => {
  res.json({ ok: true });
  try {
    if (!admin) return;
    const b = req.body || {};
    const et = b.event_type === "click" ? "click" : (b.event_type === "impression" ? "impression" : null);
    if (!et || !b.banner_id) return;
    const ua = String(req.get("user-agent") || "").toLowerCase();
    if (/bot|crawler|spider|preview|facebookexternalhit|slurp/.test(ua)) return;
    let uid = null; try { const u = await getUserFromReq(req); uid = (u && u.id) || null; } catch (e) {}
    await admin.from("my20fit_banner_event").insert({ banner_id: b.banner_id, user_id: uid, event_type: et });
  } catch (e) {}
});

// ---------- Transaksi (my20fit_scan_orders) ----------
app.get("/api/admin/transactions", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer"); if (!ctx) return;
  const { from, to } = adminRange(req.query);
  try {
    const status = String(req.query.status || "");
    const method = String(req.query.method || "");
    const hv = String(req.query.voucher || "");
    const applyFilters = (q) => {
      q = q.gte("created_at", from).lte("created_at", to);
      if (["paid", "pending", "failed", "expired"].indexOf(status) >= 0) q = q.eq("status", status);
      if (method) q = q.eq("payment_method", method);
      return q;
    };
    // Baris tampil (tabel): 1000 terbaru.
    let q = applyFilters(admin.from("my20fit_scan_orders")
      .select("reff_no,auth_user_id,credits,amount,net_amount,status,payment_method,gateway_reference_id,voucher_id,order_type,created_at,paid_at"))
      .order("created_at", { ascending: false }).limit(1000);
    const { data, error } = await q;
    if (error) return res.status(500).json({ error: error.message });
    let rows = data || [];
    if (hv === "yes") rows = rows.filter(r => r.voucher_id); else if (hv === "no") rows = rows.filter(r => !r.voucher_id);
    const vids = rows.filter(r => r.voucher_id).map(r => r.voucher_id).filter((v, i, a) => a.indexOf(v) === i);
    const vmap = {};
    if (vids.length) { const { data: vs } = await admin.from("my20fit_vouchers").select("id,code").in("id", vids); (vs || []).forEach(v => vmap[v.id] = v.code); }
    rows.forEach(r => { r.voucher_code = r.voucher_id ? (vmap[r.voucher_id] || "?") : null; });
    // TOTAL (T-3): dihitung dari SELURUH baris terfilter (bukan cuma 1000) → cegah revenue under-report.
    const AGG_CAP = 100000;
    const { data: aggData } = await applyFilters(admin.from("my20fit_scan_orders").select("credits,amount,net_amount,status,voucher_id"))
      .order("created_at", { ascending: false }).limit(AGG_CAP);
    let agg = aggData || [];
    if (hv === "yes") agg = agg.filter(r => r.voucher_id); else if (hv === "no") agg = agg.filter(r => !r.voucher_id);
    const paidAgg = agg.filter(r => r.status === "paid");
    const totals = {
      count: agg.length, paid_count: paidAgg.length,
      gross: paidAgg.reduce((s, o) => s + ((+o.amount) || 0), 0),
      net: paidAgg.reduce((s, o) => s + ((o.net_amount != null ? +o.net_amount : +o.amount) || 0), 0),
      credits: paidAgg.reduce((s, o) => s + ((+o.credits) || 0), 0),
    };
    return res.json({ ok: true, transactions: rows, totals: totals, table_capped: rows.length >= 1000, totals_capped: agg.length >= AGG_CAP });
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
  const seeHealth = adminCanSeeHealth(ctx); // marketing: JANGAN kirim gender/umur/berat/tinggi/tujuan
  const activeMin = Math.min(Math.max(parseInt(req.query.window, 10) || 15, 1), 10080);
  try {
    const { data: profiles, error: eProf } = await admin.from("my20fit_profile")
      .select("auth_user_id,email,full_name,phone,gender,age,height_cm,weight_kg,main_goal,scan_credits,scan_count,onboarding_completed,gender_selected_at,is_plus_member,created_at")
      .limit(5000);
    if (eProf) throw eProf;
    const { data: acts, error: eAct } = await admin.from("my20fit_user_activity")
      .select("auth_user_id,last_active_at,last_page,ping_count").limit(5000);
    if (eAct) throw eAct;
    const { data: orders, error: eOrd } = await admin.from("my20fit_scan_orders")
      .select("auth_user_id,amount,net_amount,credits,status").eq("status", "paid").limit(20000);
    if (eOrd) throw eOrd;
    const actMap = {}; (acts || []).forEach(a => actMap[a.auth_user_id] = a);
    const buyMap = {};
    (orders || []).forEach(o => {
      const paidAmt = (o.net_amount != null ? +o.net_amount : +o.amount) || 0;
      const b = buyMap[o.auth_user_id] || (buyMap[o.auth_user_id] = { purchases: 0, totalSpent: 0, credits: 0, highest: 0, prod: {} });
      b.purchases++; b.totalSpent += paidAmt; b.credits += (+o.credits || 0); if (paidAmt > b.highest) b.highest = paidAmt;
      const c = +o.credits || 0; if (c) b.prod[c] = (b.prod[c] || 0) + 1; // hitung per-paket utk "produk terlaris" per user
    });
    // Katalog produk (paket kredit) — sumber DINAMIS utk dropdown filter produk (bukan hardcode di frontend).
    const catalog = Object.keys(SCAN_PACKAGES).map(id => ({ credits: SCAN_PACKAGES[id].credits, name: SCAN_PACKAGES[id].credits + " scan" }))
      .sort((a, b) => a.credits - b.credits);
    const now = Date.now();
    const users = (profiles || []).map(p => {
      const a = actMap[p.auth_user_id];
      const mins = a && a.last_active_at ? Math.floor((now - new Date(a.last_active_at).getTime()) / 60000) : null;
      const b = buyMap[p.auth_user_id] || { purchases: 0, totalSpent: 0, credits: 0, highest: 0, prod: {} };
      // Produk terlaris user = paket kredit yang paling sering dibeli (dari credits order).
      let topProduct = null, bestN = 0;
      for (const c in (b.prod || {})) { if (b.prod[c] > bestN) { bestN = b.prod[c]; topProduct = { credits: +c, name: c + " scan", count: b.prod[c] }; } }
      // Onboarded = sudah masukan data lewat onboarding my.20fit.id: Auth.saveOnboarding()
      // set onboarding_completed=true + gender/weight (js/auth.js). Menyelesaikan onboarding
      // sudah pasti berarti masuk app + isi data — bukan sekadar konfirmasi email / login.
      const onboarded = !!(p.onboarding_completed && p.weight_kg && p.gender);
      const u = {
        auth_user_id: p.auth_user_id, email: p.email, full_name: p.full_name, phone: p.phone,
        scan_credits: p.scan_credits, onboarding_completed: p.onboarding_completed, is_plus_member: p.is_plus_member,
        is_onboarded: onboarded, onboarded_at: onboarded ? (p.gender_selected_at || null) : null,
        created_at: p.created_at, last_active_at: a ? a.last_active_at : null, last_page: a ? a.last_page : null,
        ping_count: a ? (+a.ping_count || 0) : 0,
        minutes_ago: mins, active: mins != null && mins <= activeMin,
        purchases: b.purchases, total_spent: b.totalSpent, credits_bought: b.credits, highest_purchase: b.highest,
        top_product: topProduct,
      };
      // Data kesehatan HANYA untuk role non-marketing (diblokir di level API, bukan UI).
      if (seeHealth) { u.gender = p.gender; u.age = p.age; u.height_cm = p.height_cm; u.weight_kg = p.weight_kg; u.main_goal = p.main_goal; }
      return u;
    });
    users.sort((x, y) => (y.last_active_at ? new Date(y.last_active_at).getTime() : 0) - (x.last_active_at ? new Date(x.last_active_at).getTime() : 0));
    const activeCount = users.filter(u => u.active).length;
    const buyers = users.filter(u => u.purchases > 0).length;
    const onboardedCount = users.filter(u => u.is_onboarded).length;
    return res.json({ ok: true, window: activeMin, total: users.length, active: activeCount, inactive: users.length - activeCount, buyers: buyers, onboarded: onboardedCount, pending: users.length - onboardedCount, catalog: catalog, users: users });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});
// Detail satu user: profil lengkap + riwayat order.
app.get("/api/admin/user-detail", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer"); if (!ctx) return;
  const uid = String(req.query.uid || "");
  if (!uid) return res.status(400).json({ error: "uid wajib." });
  try {
    // Marketing: JANGAN select("*") — hindari bocornya health_conditions, siklus haid, dll.
    // Hanya kolom kontak + komersial. Non-marketing tetap profil penuh (BMI/MCU),
    // TAPI data siklus menstruasi tetap dibuang untuk SEMUA admin (lihat stripMenstrualCycle).
    const profileCols = adminCanSeeHealth(ctx)
      ? "*"
      : "auth_user_id,full_name,email,phone,scan_credits,onboarding_completed,is_plus_member,created_at";
    const { data: p } = await admin.from("my20fit_profile").select(profileCols).eq("auth_user_id", uid).limit(1);
    var profileOut = stripMenstrualCycle((p && p[0]) || null);
    const { data: orders } = await admin.from("my20fit_scan_orders")
      .select("reff_no,order_type,credits,amount,net_amount,status,payment_method,voucher_id,created_at,paid_at")
      .eq("auth_user_id", uid).order("created_at", { ascending: false }).limit(200);
    const { data: act } = await admin.from("my20fit_user_activity").select("last_active_at,last_page,ping_count,first_seen_at").eq("auth_user_id", uid).limit(1);
    // Timeline email user (TASK 2): email apa yang dia terima, dibuka, diklik.
    const { data: emails } = await admin.from("my20fit_message_log")
      .select("campaign_id,channel,subject,status,sent_at,delivered_at,opened_at,clicked_at,bounced_at,complained_at,created_at")
      .eq("user_id", uid).order("created_at", { ascending: false }).limit(50);
    const paid = (orders || []).filter(o => o.status === "paid");
    const stats = {
      purchases: paid.length,
      total_spent: paid.reduce((s, o) => s + ((o.net_amount != null ? +o.net_amount : +o.amount) || 0), 0),
      credits_bought: paid.reduce((s, o) => s + (+o.credits || 0), 0),
      highest_purchase: paid.reduce((m, o) => Math.max(m, (o.net_amount != null ? +o.net_amount : +o.amount) || 0), 0),
    };
    return res.json({ ok: true, profile: profileOut, activity: (act && act[0]) || null, orders: orders || [], stats: stats, emails: emails || [] });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// ================= TASK 3: KELOLA EMAIL / USER (superadmin) =================
// Semua operasi menyentuh Supabase Auth (shared antara staging & prod — HATI-HATI).
// Diaudit ke my20fit_admin_audit_log dengan target = uid supaya muncul di timeline user.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const escHtml = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
// Muat semua email auth SEKALI (Map email->id) untuk dedupe bulk (hindari scan per-baris).
async function loadAllAuthEmails() {
  const map = new Map();
  try {
    for (let page = 1; page <= 50; page++) {
      const { data } = await admin.auth.admin.listUsers({ page: page, perPage: 1000 });
      const u = (data && data.users) || [];
      u.forEach((x) => { if (x.email) map.set(String(x.email).toLowerCase(), x.id); });
      if (u.length < 1000) break;
    }
  } catch (e) {}
  return map;
}

// Ganti email user — kirim email KONFIRMASI ke alamat baru (user harus klik).
// Auth email TIDAK berubah sampai dikonfirmasi (flow bawaan GoTrue). Consent
// (my20fit_user_comm_prefs) terkunci ke user_id → otomatis ikut. Suppression
// terkunci ke email → kalau email lama disuppress, salin ke email baru (fail-safe).
app.post("/api/admin/user/change-email", async (req, res) => {
  const ctx = await requireAdmin(req, res, "superadmin"); if (!ctx) return;
  try {
    const b = req.body || {};
    const uid = String(b.uid || "").trim();
    const newEmail = String(b.new_email || "").trim().toLowerCase();
    if (!uid) return res.status(400).json({ error: "uid wajib." });
    if (!EMAIL_RE.test(newEmail)) return res.status(400).json({ error: "Format email baru tidak valid." });
    // Ambil user auth saat ini.
    let cur = null;
    try { const g = await admin.auth.admin.getUserById(uid); cur = g && g.data && g.data.user; } catch (e) {}
    if (!cur) return res.status(404).json({ error: "User tidak ditemukan di Auth." });
    const oldEmail = String(cur.email || "").toLowerCase();
    if (oldEmail === newEmail) return res.status(400).json({ error: "Email baru sama dengan yang lama." });
    // Dedupe: email baru tak boleh dipakai user lain.
    const usedBy = await findUserIdByEmail(newEmail);
    if (usedBy && usedBy !== uid) return res.status(409).json({ error: "Email itu sudah dipakai akun lain." });
    // Link konfirmasi email-change (GoTrue). Butuh setting "Secure email change".
    let link = null;
    try {
      const { data: ld, error: le } = await admin.auth.admin.generateLink({
        type: "email_change_new", email: oldEmail, newEmail: newEmail,
        options: { redirectTo: APP_BASE_URL + "/calories.html" },
      });
      if (le) throw le;
      link = (ld && ld.properties && ld.properties.action_link) || null;
    } catch (e) {
      return res.status(500).json({ error: "Gagal membuat link konfirmasi: " + e.message + " (pastikan 'Secure email change' aktif di Supabase Auth)." });
    }
    if (!link) return res.status(500).json({ error: "Link konfirmasi kosong." });
    // Kirim lewat SATU jalur mailer kita (Resend) → tunduk env whitelist saat non-prod.
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#1db954">Konfirmasi perubahan email 20FIT</h2>
        <p>Admin 20FIT mengganti email akunmu menjadi <b>${escHtml(newEmail)}</b>.
           Klik tombol di bawah untuk mengonfirmasi. Kalau ini bukan kamu, abaikan email ini.</p>
        <p><a href="${link}" style="display:inline-block;background:#1db954;color:#fff;
           padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:bold">Konfirmasi email baru</a></p>
        <p style="color:#666;font-size:12px;word-break:break-all">${link}</p>
      </div>`;
    const r = await email.send({ to: newEmail, subject: "Konfirmasi email baru 20FIT", html, transactional: true, channel: "transactional", templateId: "email_change", userId: uid });
    // Salin suppression email lama → baru (fail-safe compliance).
    try {
      const { data: sup } = await admin.from("my20fit_suppression_list").select("reason,is_permanent").eq("email", oldEmail).limit(1);
      if (sup && sup[0]) await comms.addSuppression(newEmail, uid, sup[0].reason || "carried", true);
    } catch (e) {}
    await adminAudit(ctx, "user.change_email", uid, { old: oldEmail, new: newEmail, mail_sent: !!(r && r.ok && !r.skipped), mail_skipped: !!(r && r.skipped) });
    return res.json({ ok: true, pending: true, sent: !!(r && r.ok && !r.skipped), skipped: !!(r && r.skipped), message: "Email konfirmasi dikirim ke " + newEmail + ". Perubahan berlaku setelah user klik konfirmasi." });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// Tambah 1 user manual — TANPA kirim email (email_confirm:true = tak ada invite).
app.post("/api/admin/user/create", async (req, res) => {
  const ctx = await requireAdmin(req, res, "superadmin"); if (!ctx) return;
  try {
    const b = req.body || {};
    const em = String(b.email || "").trim().toLowerCase();
    const fullName = b.full_name != null ? String(b.full_name).trim() : null;
    const phone = b.phone != null ? String(b.phone).trim() : null;
    if (!EMAIL_RE.test(em)) return res.status(400).json({ error: "Format email tidak valid." });
    if (await findUserIdByEmail(em)) return res.status(409).json({ error: "Email sudah terdaftar." });
    let uid = null;
    try {
      const { data: cu, error: ce } = await admin.auth.admin.createUser({ email: em, email_confirm: true, user_metadata: { full_name: fullName, via_20fit: true, admin_created: true } });
      if (ce) throw ce;
      uid = cu && cu.user && cu.user.id;
    } catch (e) { return res.status(500).json({ error: "Gagal membuat akun: " + e.message }); }
    if (!uid) return res.status(500).json({ error: "Akun dibuat tapi uid kosong." });
    await admin.from("my20fit_profile").upsert({ auth_user_id: uid, email: em, full_name: fullName, phone: phone }, { onConflict: "auth_user_id" });
    await adminAudit(ctx, "user.create", uid, { email: em });
    return res.json({ ok: true, uid: uid, email: em });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// Import banyak user via CSV. Dua fase: preview (commit=false) lalu commit=true.
// TANPA kirim email. Body: { rows:[{email,full_name?,phone?}], commit?:bool }.
app.post("/api/admin/user/bulk-import", async (req, res) => {
  const ctx = await requireAdmin(req, res, "superadmin"); if (!ctx) return;
  try {
    const b = req.body || {};
    const rows = Array.isArray(b.rows) ? b.rows : [];
    if (!rows.length) return res.status(400).json({ error: "Tidak ada baris." });
    if (rows.length > 2000) return res.status(400).json({ error: "Maksimal 2000 baris per impor." });
    const existing = await loadAllAuthEmails();
    const seen = new Set();
    const report = rows.map((row, i) => {
      const em = String((row && row.email) || "").trim().toLowerCase();
      const item = { row: i + 1, email: em, full_name: (row && row.full_name) ? String(row.full_name).trim() : null, phone: (row && row.phone) ? String(row.phone).trim() : null };
      if (!EMAIL_RE.test(em)) { item.status = "invalid"; item.reason = "format email salah"; return item; }
      if (seen.has(em)) { item.status = "duplicate_in_file"; item.reason = "email ganda di file"; return item; }
      seen.add(em);
      if (existing.has(em)) { item.status = "duplicate_existing"; item.reason = "sudah terdaftar"; return item; }
      item.status = "new"; return item;
    });
    const counts = report.reduce((a, r) => { a[r.status] = (a[r.status] || 0) + 1; return a; }, {});
    if (!b.commit) {
      return res.json({ ok: true, mode: "preview", counts: counts, total: report.length, rows: report });
    }
    // COMMIT: buat hanya yang 'new'.
    let created = 0;
    for (const it of report) {
      if (it.status !== "new") continue;
      try {
        const { data: cu, error: ce } = await admin.auth.admin.createUser({ email: it.email, email_confirm: true, user_metadata: { full_name: it.full_name, via_20fit: true, admin_created: true, bulk_import: true } });
        if (ce) throw ce;
        const uid = cu && cu.user && cu.user.id;
        if (uid) {
          await admin.from("my20fit_profile").upsert({ auth_user_id: uid, email: it.email, full_name: it.full_name, phone: it.phone }, { onConflict: "auth_user_id" });
          it.status = "created"; created++;
        } else { it.status = "failed"; it.reason = "uid kosong"; }
      } catch (e) { it.status = "failed"; it.reason = e.message; }
    }
    const failed = report.filter((r) => r.status === "failed");
    await adminAudit(ctx, "user.bulk_import", null, { attempted: counts.new || 0, created: created, failed: failed.length });
    return res.json({ ok: true, mode: "commit", created: created, failed: failed.length, total: report.length, rows: report });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// Riwayat audit admin untuk 1 user (aksi user.* yang menargetkan uid ini).
app.get("/api/admin/user/audit", async (req, res) => {
  const ctx = await requireAdmin(req, res, "superadmin"); if (!ctx) return;
  try {
    const uid = String(req.query.uid || "").trim();
    if (!uid) return res.status(400).json({ error: "uid wajib." });
    const { data } = await admin.from("my20fit_admin_audit_log")
      .select("actor_email,action,detail,created_at").eq("target", uid)
      .order("created_at", { ascending: false }).limit(50);
    return res.json({ ok: true, logs: data || [] });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// Analisa produk paling laris (paket kredit) — count + revenue per ukuran paket.
app.get("/api/admin/top-products", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer"); if (!ctx) return;
  const { from, to } = adminRange(req.query);
  try {
    const { data: orders, error: eOrd } = await admin.from("my20fit_scan_orders")
      .select("credits,amount,net_amount,order_type,status,created_at").eq("status", "paid")
      .gte("created_at", from).lte("created_at", to).limit(20000);
    if (eOrd) throw eOrd;
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
    // Surface error query -> jangan diam-diam kembalikan [] (angka jadi salah tanpa jejak).
    const { data: profiles, error: eProf } = await admin.from("my20fit_profile")
      .select("auth_user_id,created_at,onboarding_completed,scan_count").limit(8000);
    if (eProf) throw eProf;
    const { data: paid, error: ePaid } = await admin.from("my20fit_scan_orders")
      .select("auth_user_id,amount,net_amount,credits,created_at,paid_at,status").eq("status", "paid").limit(30000);
    if (ePaid) throw ePaid;
    const { data: acts, error: eAct } = await admin.from("my20fit_user_activity")
      .select("auth_user_id,last_active_at,ping_count,full_name,email").limit(8000);
    if (eAct) throw eAct;
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

    // --- Top Users: user paling aktif (volume buka-halaman) & masih aktif. ---
    // Sinyal = ping_count (my20fit_user_activity) + kebaruan last_active_at (≤14 hari).
    // Catatan: tracking aktivitas masih muda & tak menyimpan log hari-login terpisah,
    // jadi "paling aktif" = volume buka-halaman, bukan jumlah hari login berbeda.
    const recentCut = Date.now() - 14 * 86400000;
    const topUsers = ac
      .filter(a => a.last_active_at && new Date(a.last_active_at).getTime() >= recentCut)
      .map(a => ({ auth_user_id: a.auth_user_id, full_name: a.full_name || null, email: a.email || null, ping_count: +a.ping_count || 0, last_active_at: a.last_active_at }))
      .sort((x, y) => y.ping_count - x.ping_count)
      .slice(0, 10);

    // --- Top Products: paket kredit paling laris (jumlah transaksi + revenue). ---
    const prodMap = {};
    pd.forEach(o => {
      const key = (o.credits || 0) + " scan";
      const rev = (o.net_amount != null ? +o.net_amount : +o.amount) || 0;
      const m = prodMap[key] || (prodMap[key] = { product: key, credits: +o.credits || 0, count: 0, revenue: 0 });
      m.count++; m.revenue += rev;
    });
    const topProducts = Object.values(prodMap).sort((a, b) => b.count - a.count).slice(0, 10);

    return res.json({ ok: true, mom: mom, funnel: funnel, retention: retention, topUsers: topUsers, topProducts: topProducts });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// ---------- Onboarding + jumlah scan dipakai per user (viewer+) ----------
// SUMBER DATA (dikonfirmasi lewat inspeksi skema live, bukan asumsi):
//  - my20fit_profile: user onboarding_completed=true → nama/email/phone + saldo scan.
//      onboarded_at = gender_selected_at (langkah onboarding; TIDAK ada kolom
//      onboarding_completed_at khusus — ini proxy terbaik, coverage 100% utk yg selesai).
//      "Sisa scan" = scan_credits (saldo live = kredit dibeli − dipakai).
//  - my20fit_scan_ledger: 1 baris delta=-1 tiap scan dipakai (reason consume_free/paid),
//      delta>0 utk pembelian (reason purchase). "Jumlah scan dipakai" per user =
//      COUNT baris delta<0. Total all-time = sum baris delta<0 seluruh user.
app.get("/api/admin/onboarding-scan", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer"); if (!ctx) return;
  try {
    const { data: profiles, error: eProf } = await admin.from("my20fit_profile")
      .select("auth_user_id,full_name,email,phone,gender_selected_at,scan_credits")
      .eq("onboarding_completed", true).limit(20000);
    if (eProf) throw eProf;
    const { data: ledger } = await admin.from("my20fit_scan_ledger")
      .select("auth_user_id,delta").lt("delta", 0).limit(200000);
    const usedMap = {};
    (ledger || []).forEach(l => { usedMap[l.auth_user_id] = (usedMap[l.auth_user_id] || 0) + 1; });
    const users = (profiles || []).map(p => {
      const used = usedMap[p.auth_user_id] || 0;
      return {
        auth_user_id: p.auth_user_id, full_name: p.full_name, email: p.email, phone: p.phone,
        onboarded_at: p.gender_selected_at || null,
        scans_used: used, remaining: (p.scan_credits == null ? null : +p.scan_credits),
      };
    });
    const totalUsed = (ledger || []).length;             // total scan dipakai all-time
    const everScanned = users.filter(u => u.scans_used > 0).length;
    users.sort((a, b) => b.scans_used - a.scans_used);
    return res.json({
      ok: true,
      total_onboarded: users.length,
      ever_scanned: everScanned,
      total_scans_used: totalUsed,
      users: users,
    });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// ---------- Recap onboarding/scan/beli per periode + segmen (viewer+ termasuk marketing; NON-kesehatan) ----------
// Untuk marketing: "dalam N hari terakhir, berapa user onboarding, berapa scan, berapa beli",
// lengkap tren harian + daftar user per segmen (nama/email/telepon) supaya bisa ditindaklanjuti.
// SUMBER (skema live, konsisten dgn endpoint lain — TIDAK mengubah perhitungan yang sudah ada):
//  - Onboarding (waktu) = my20fit_profile.gender_selected_at (proxy tgl selesai onboarding).
//  - Scan (waktu)       = my20fit_scan_ledger baris delta<0 (created_at) — 1 baris per scan dipakai.
//  - Beli (waktu)       = my20fit_scan_orders status=paid (paid_at, fallback created_at).
// Segmen "baru onboarding" = onboarding di periode & BELUM PERNAH scan/beli (all-time) → target follow-up.
// TIDAK memuat data kesehatan (aman utk role marketing). "View" (lihat di dashboard) boleh
// viewer+; UNDUH daftar PII wajib staff+superadmin & diaudit lewat /api/admin/export-csv.
app.get("/api/admin/onboarding-recap", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer"); if (!ctx) return;
  const { from, to } = adminRange(req.query);
  const fromMs = new Date(from).getTime(), toMs = new Date(to).getTime();
  const p2 = (n) => (n < 10 ? "0" + n : "" + n);
  const inWin = (ts) => { if (!ts) return false; const t = new Date(ts).getTime(); return !isNaN(t) && t >= fromMs && t <= toMs; };
  const dayKey = (ts) => { const d = new Date(ts); return d.getUTCFullYear() + "-" + p2(d.getUTCMonth() + 1) + "-" + p2(d.getUTCDate()); };
  try {
    // Profil (nama/email/telepon + tgl onboarding). Tidak difilter onboarding supaya nama
    // pembeli/pen-scan yang belum ber-flag onboarding tetap bisa di-resolve.
    const { data: profiles, error: eProf } = await admin.from("my20fit_profile")
      .select("auth_user_id,full_name,email,phone,gender_selected_at,onboarding_completed").limit(20000);
    if (eProf) throw eProf;
    // Ledger scan dipakai (all-time) — utk set "pernah scan" + hitung periode & tren.
    const { data: ledger, error: eLed } = await admin.from("my20fit_scan_ledger")
      .select("auth_user_id,created_at").lt("delta", 0).limit(200000);
    if (eLed) throw eLed;
    // Order paid (all-time) — utk set "pernah beli" + hitung periode & tren.
    const { data: orders, error: eOrd } = await admin.from("my20fit_scan_orders")
      .select("auth_user_id,net_amount,amount,paid_at,created_at").eq("status", "paid").limit(30000);
    if (eOrd) throw eOrd;

    const profMap = {};
    (profiles || []).forEach(p => { profMap[p.auth_user_id] = p; });

    // Scan: set pernah scan (all-time), akumulasi periode per user, tren harian (distinct user).
    const everScanned = new Set(), scanWinCount = {}, scanWinLast = {}, scanDaily = {};
    (ledger || []).forEach(l => {
      if (!l.auth_user_id) return;
      everScanned.add(l.auth_user_id);
      if (inWin(l.created_at)) {
        scanWinCount[l.auth_user_id] = (scanWinCount[l.auth_user_id] || 0) + 1;
        if (!scanWinLast[l.auth_user_id] || new Date(l.created_at) > new Date(scanWinLast[l.auth_user_id])) scanWinLast[l.auth_user_id] = l.created_at;
        const k = dayKey(l.created_at); (scanDaily[k] || (scanDaily[k] = new Set())).add(l.auth_user_id);
      }
    });
    // Beli: set pernah beli (all-time), akumulasi periode per user (count + nominal), tren harian.
    const everBought = new Set(), buyWinCount = {}, buyWinAmt = {}, buyWinLast = {}, buyDaily = {};
    (orders || []).forEach(o => {
      if (!o.auth_user_id) return;
      everBought.add(o.auth_user_id);
      const ts = o.paid_at || o.created_at;
      if (inWin(ts)) {
        const amt = (o.net_amount != null ? +o.net_amount : +o.amount) || 0;
        buyWinCount[o.auth_user_id] = (buyWinCount[o.auth_user_id] || 0) + 1;
        buyWinAmt[o.auth_user_id] = (buyWinAmt[o.auth_user_id] || 0) + amt;
        if (!buyWinLast[o.auth_user_id] || new Date(ts) > new Date(buyWinLast[o.auth_user_id])) buyWinLast[o.auth_user_id] = ts;
        const k = dayKey(ts); (buyDaily[k] || (buyDaily[k] = new Set())).add(o.auth_user_id);
      }
    });

    // Segmen onboarding (dari profil onboarding_completed dgn gender_selected_at di periode).
    const onbDaily = {}, segOnboarded = [], segOnboardedNew = [];
    (profiles || []).forEach(p => {
      if (!(p.onboarding_completed && inWin(p.gender_selected_at))) return;
      const row = { auth_user_id: p.auth_user_id, full_name: p.full_name, email: p.email, phone: p.phone, onboarded_at: p.gender_selected_at };
      segOnboarded.push(row);
      const k = dayKey(p.gender_selected_at); onbDaily[k] = (onbDaily[k] || 0) + 1;
      if (!everScanned.has(p.auth_user_id) && !everBought.has(p.auth_user_id)) segOnboardedNew.push(row);
    });
    // Segmen scan/beli di periode (resolve kontak dari profMap).
    const contact = (uid) => { const p = profMap[uid] || {}; return { auth_user_id: uid, full_name: p.full_name || null, email: p.email || null, phone: p.phone || null }; };
    const segScanned = Object.keys(scanWinCount).map(uid => Object.assign(contact(uid), { scans_in_window: scanWinCount[uid], last_scan_at: scanWinLast[uid] || null }));
    const segBought = Object.keys(buyWinCount).map(uid => Object.assign(contact(uid), { orders_in_window: buyWinCount[uid], amount_in_window: buyWinAmt[uid] || 0, last_paid_at: buyWinLast[uid] || null }));

    // Segmen "repeat buyer" = beli >= 2x di periode (target loyalitas/upsell).
    const segRepeat = Object.keys(buyWinCount).filter(uid => buyWinCount[uid] >= 2)
      .map(uid => Object.assign(contact(uid), { orders_in_window: buyWinCount[uid], amount_in_window: buyWinAmt[uid] || 0, last_paid_at: buyWinLast[uid] || null }));

    segOnboarded.sort((a, b) => new Date(b.onboarded_at || 0) - new Date(a.onboarded_at || 0));
    segOnboardedNew.sort((a, b) => new Date(b.onboarded_at || 0) - new Date(a.onboarded_at || 0));
    segScanned.sort((a, b) => b.scans_in_window - a.scans_in_window);
    segBought.sort((a, b) => b.amount_in_window - a.amount_in_window);
    segRepeat.sort((a, b) => b.orders_in_window - a.orders_in_window || b.amount_in_window - a.amount_in_window);

    // Perbandingan periode SEBELUMNYA (sama panjang) — utk delta founder. Semua dari data yg sudah di-fetch.
    const winLen = Math.max(1, toMs - fromMs);
    const prevFromMs = fromMs - winLen, prevToMs = fromMs;
    const inPrev = (ts) => { if (!ts) return false; const t = new Date(ts).getTime(); return !isNaN(t) && t >= prevFromMs && t < prevToMs; };
    let prevOnb = 0; const prevScanSet = new Set(), prevBuyCount = {};
    (profiles || []).forEach(p => { if (p.onboarding_completed && inPrev(p.gender_selected_at)) prevOnb++; });
    (ledger || []).forEach(l => { if (l.auth_user_id && inPrev(l.created_at)) prevScanSet.add(l.auth_user_id); });
    (orders || []).forEach(o => { if (!o.auth_user_id) return; const ts = o.paid_at || o.created_at; if (inPrev(ts)) prevBuyCount[o.auth_user_id] = (prevBuyCount[o.auth_user_id] || 0) + 1; });
    const prev = {
      onboarded: prevOnb,
      scanned: prevScanSet.size,
      bought: Object.keys(prevBuyCount).length,
      repeat: Object.keys(prevBuyCount).filter(u => prevBuyCount[u] >= 2).length,
    };

    // Tren harian: dari `from` sampai `to` (per hari UTC), isi 0 utk hari kosong.
    const daily = [];
    let d = new Date(Date.UTC(new Date(from).getUTCFullYear(), new Date(from).getUTCMonth(), new Date(from).getUTCDate()));
    const end = new Date(to);
    while (d <= end && daily.length < 400) {
      const k = d.getUTCFullYear() + "-" + p2(d.getUTCMonth() + 1) + "-" + p2(d.getUTCDate());
      daily.push({ date: k, label: p2(d.getUTCMonth() + 1) + "/" + p2(d.getUTCDate()), onboarded: onbDaily[k] || 0, scanned: scanDaily[k] ? scanDaily[k].size : 0, bought: buyDaily[k] ? buyDaily[k].size : 0 });
      d.setUTCDate(d.getUTCDate() + 1);
    }

    return res.json({
      ok: true, range: String(req.query.range || "7d"), from, to,
      totals: { onboarded: segOnboarded.length, onboarded_new: segOnboardedNew.length, scanned: segScanned.length, bought: segBought.length, repeat: segRepeat.length },
      prev: prev,
      daily: daily,
      segments: { onboarded: segOnboarded, onboarded_new: segOnboardedNew, scanned: segScanned, bought: segBought, repeat: segRepeat },
    });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// ---------- Export CSV data pribadi (nama/email/telepon) — HANYA staff+superadmin ----------
// PENGAMAN (wajib): file berisi PII, jadi role dicek DI SERVER (min "staff" — role marketing &
// viewer DILARANG unduh) dan tiap unduhan DICATAT di audit log. File dibangun di server (bukan
// client) supaya gate & jejak tak bisa dilewati. CSV: pemisah titik-koma + BOM UTF-8 (Excel-ID).
function csvCell(v) {
  v = (v == null) ? "" : String(v);
  return /[";\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
}
app.post("/api/admin/export-csv", async (req, res) => {
  const ctx = await requireAdmin(req, res, "staff"); if (!ctx) return; // marketing/viewer ditolak di sini
  const b = req.body || {};
  const kind = String(b.kind || "data").slice(0, 40);
  const headers = Array.isArray(b.headers) ? b.headers.map(h => String(h)).slice(0, 60) : [];
  let rows = Array.isArray(b.rows) ? b.rows : [];
  if (!headers.length || !rows.length) return res.status(400).json({ error: "headers & rows wajib." });
  if (rows.length > 50000) rows = rows.slice(0, 50000); // batas aman
  const sep = ";";
  const lines = [headers.map(csvCell).join(sep)];
  for (const r of rows) lines.push((Array.isArray(r) ? r : []).map(csvCell).join(sep));
  const body = "\uFEFF" + lines.join("\r\n");
  let fname = String(b.filename || (kind + ".csv")).replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 80);
  if (!/\.csv$/i.test(fname)) fname += ".csv";
  await adminAudit(ctx, "export.csv", kind, { filename: fname, rows: rows.length, range: String(b.range || "").slice(0, 20) });
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="' + fname + '"');
  return res.send(body);
});

// ---------- Sumber trafik / attribution (viewer+ termasuk marketing; NON-kesehatan) ----------
// Agregasi first-touch attribution per sumber/medium/campaign/referrer, disandingkan dgn
// konversi (pembeli & revenue) supaya marketing tahu channel mana yg menghasilkan penjualan.
// TIDAK mengarang angka: user tanpa baris attribution dihitung terpisah sebagai "tanpa data".
app.get("/api/admin/attribution", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer"); if (!ctx) return;
  try {
    const { data: rows, error: eRows } = await admin.from("my20fit_signup_attribution")
      .select("auth_user_id,utm_source,utm_medium,utm_campaign,referrer_host,captured").limit(100000);
    if (eRows) throw eRows;
    const attr = rows || [];
    const tracked = attr.filter(r => r.captured !== false); // sumber ASLI (bukan placeholder user lama)
    const preTracking = attr.length - tracked.length;        // user lama (backfill, sebelum tracking)
    const { data: paid, error: ePaid } = await admin.from("my20fit_scan_orders")
      .select("auth_user_id,amount,net_amount,status").eq("status", "paid").limit(50000);
    if (ePaid) throw ePaid;
    const rev = {}, isBuyer = {};
    (paid || []).forEach(o => {
      if (!o.auth_user_id) return;
      isBuyer[o.auth_user_id] = true;
      rev[o.auth_user_id] = (rev[o.auth_user_id] || 0) + ((o.net_amount != null ? +o.net_amount : +o.amount) || 0);
    });
    const { count: totalUsers } = await admin.from("my20fit_profile").select("id", { count: "exact", head: true });
    // Breakdown sumber hanya dari data ASLI (tracked). User lama tak dipaksa punya sumber.
    function groupBy(keyFn, dflt) {
      const m = {};
      tracked.forEach(r => {
        const k = keyFn(r) || dflt;
        const g = m[k] || (m[k] = { key: k, signups: 0, buyers: 0, revenue: 0 });
        g.signups++;
        if (isBuyer[r.auth_user_id]) { g.buyers++; g.revenue += rev[r.auth_user_id] || 0; }
      });
      return Object.values(m)
        .map(g => Object.assign(g, { conv: g.signups ? Math.round(g.buyers / g.signups * 100) : 0 }))
        .sort((a, b) => b.signups - a.signups);
    }
    return res.json({
      ok: true,
      total_users: totalUsers || 0,
      tracked: tracked.length,                                        // user dgn sumber asli
      pre_tracking: preTracking,                                      // user lama (tersimpan, sebelum tracking)
      direct_new: Math.max(0, (totalUsers || 0) - attr.length),       // user baru yang datang langsung
      by_source: groupBy(r => r.utm_source, "(tanpa UTM)"),
      by_medium: groupBy(r => r.utm_medium, "(tidak diset)"),
      by_campaign: groupBy(r => r.utm_campaign, "(tidak diset)"),
      by_referrer: groupBy(r => r.referrer_host, "(tanpa referrer)"),
    });
  } catch (e) { console.error("admin/attribution:", e.message); return res.status(500).json({ error: e.message }); }
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

// Catatan: /api/membership/packages (proxy arena-api) DIHAPUS — halaman Membership kini baca
// dari my20fit_catalog_items via /api/catalog (sumber tunggal katalog). Lihat membership.html.

// ---------- Jadwal 20FIT (Arena / Gym / Clinic) — read-only, buat KALENDER di my.20fit.id ----------
// Data jadwal ada di Supabase yang SAMA (tabel arena_*/gym_*/clinic_* milik sistem booking masing2).
// Kita BACA SAJA (service key) — TIDAK PERNAH menulis. Payment & konfirmasi booking TETAP di
// booking.20fit.id. Kelas (arena/gym): jadwal akurat (tanggal/jam/jenis/instruktur/durasi/harga
// indikatif). Klinik: jadwal SLOT appointment (jam praktik) — layanan & pembayaran dipilih di
// booking.20fit.id. TIDAK expose sisa-kursi real-time (rawan basi/double-book). Butuh login.
// Catatan: skema *_ milik app lain — kalau kolomnya berubah, endpoint ini perlu disesuaikan.
// venue kelas: tabel jadwal + tabel jenis (embed via FK class_type_id) + nama kolom durasi/harga.
const CLASS_VENUES = {
  arena: { table: "arena_class_schedules", types: "arena_class_types", dur: "duration_min", price: "price_member", book: "https://booking.20fit.id/book" },
  gym: { table: "gym_class_schedules", types: "gym_class_types", dur: "duration_minutes", price: "price_guest", book: "https://booking.20fit.id/gym" },
};
app.get("/api/classes/schedule", async (req, res) => {
  try {
    if (!admin) return res.status(500).json({ error: "Server belum dikonfigurasi (service key)." });
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const days = Math.min(60, Math.max(1, parseInt(req.query.days, 10) || 21));
    const venue = ["arena", "gym", "clinic"].includes(String(req.query.venue || "").toLowerCase())
      ? String(req.query.venue).toLowerCase() : "arena";
    const p2 = (n) => (n < 10 ? "0" + n : "" + n);
    const now = new Date();
    const fromD = now.getFullYear() + "-" + p2(now.getMonth() + 1) + "-" + p2(now.getDate());
    const end = new Date(now.getTime() + days * 86400000);
    const toD = end.getFullYear() + "-" + p2(end.getMonth() + 1) + "-" + p2(end.getDate());

    // ---- Klinik: slot appointment (bukan kelas). Dedupe per (tanggal,jam) — banyak staff bisa
    // bagikan window jam yang sama. Tampilkan JADWAL slot aktif, tanpa angka sisa kursi. ----
    if (venue === "clinic") {
      const { data, error } = await admin
        .from("clinic_slots")
        .select("slot_date,start_time,end_time,is_active")
        .gte("slot_date", fromD).lte("slot_date", toD)
        .eq("is_active", true)
        .order("slot_date", { ascending: true }).order("start_time", { ascending: true })
        .limit(3000);
      if (error) throw error;
      const byDate = {}, seen = {};
      (data || []).forEach(s => {
        const start = String(s.start_time || "").slice(0, 5);
        const endt = String(s.end_time || "").slice(0, 5);
        const k = s.slot_date + "|" + start + "|" + endt;
        if (seen[k]) return; seen[k] = 1;
        let dur = null;
        if (start && endt) {
          const a = start.split(":"), b = endt.split(":");
          dur = (+b[0] * 60 + +b[1]) - (+a[0] * 60 + +a[1]);
          if (!(dur > 0)) dur = null;
        }
        (byDate[s.slot_date] || (byDate[s.slot_date] = [])).push({
          start, end: endt, name: "", full_name: "",
          color: "#5a1420", instructor: "", duration_min: dur, price: null,
        });
      });
      const dates = Object.keys(byDate).sort().map(d => ({ date: d, classes: byDate[d] }));
      return res.json({ ok: true, venue: "clinic", booking_url: "https://booking.20fit.id/clinic", dates: dates });
    }

    // ---- Arena / Gym: jadwal kelas (embed jenis kelas via FK). ----
    const cfg = CLASS_VENUES[venue];
    const { data, error } = await admin
      .from(cfg.table)
      .select(`id,class_type_id,schedule_date,start_time,end_time,instructor,${cfg.types}(name,color,${cfg.dur},${cfg.price},is_active)`)
      .gte("schedule_date", fromD).lte("schedule_date", toD)
      .eq("is_cancelled", false)
      .order("schedule_date", { ascending: true }).order("start_time", { ascending: true })
      .limit(600);
    if (error) throw error;
    const clean = (nm) => String(nm || "").replace(/^20FIT\s+Arena\s+/i, "").replace(/^20FIT\s+/i, "").trim();
    const byDate = {};
    (data || []).forEach(s => {
      const t = s[cfg.types] || {};
      if (t.is_active === false) return;
      // id (schedule) + class_type_id dipakai my.20fit.id buat bikin URL deep-link ke
      // booking.20fit.id (kelas auto-kepilih): arena pakai schedule id, gym pakai keduanya.
      (byDate[s.schedule_date] || (byDate[s.schedule_date] = [])).push({
        id: s.id, class_type_id: s.class_type_id || null,
        start: String(s.start_time || "").slice(0, 5),
        end: String(s.end_time || "").slice(0, 5),
        name: clean(t.name) || "Kelas", full_name: t.name || "",
        color: t.color || "#C41101",
        instructor: s.instructor || "",
        duration_min: t[cfg.dur] || null,
        price: (t[cfg.price] != null ? +t[cfg.price] : null),
      });
    });
    const dates = Object.keys(byDate).sort().map(d => ({ date: d, classes: byDate[d] }));
    return res.json({ ok: true, venue: venue, booking_url: cfg.book, dates: dates });
  } catch (e) { console.error("classes/schedule:", e.message); return res.status(500).json({ error: e.message }); }
});

// ---------- Beli paket scan kalori (pembayaran via Xendit lewat FITCO shop order) ----------
// FITCO shop order (payment_type "xendit-invoices") -> FITCO bikin invoice Xendit &
// balikkan link. FITCO_PARTNER_TOKEN dipakai sbg Bearer utk order + baca/cancel status
// di API 20FIT (fallback: token login user dari client).
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
    // "Unauthorized" itu bahasa programmer — user cuma lihat kata asing di bawah tombol bayar
    // dan tak tahu harus apa. Sesi memang bisa mati wajar (token kedaluwarsa, atau beberapa tab
    // saling merotasi refresh token). Beri tahu apa yang terjadi + `session_expired` supaya
    // frontend bisa menawarkan login ulang.
    if (!user) return res.status(401).json({ error: "Sesi kamu sudah habis. Silakan login lagi untuk melanjutkan pembayaran.", session_expired: true });
    const b = req.body || {};

    // ===== Pembayaran paket scan = Xendit via FITCO shop order (satu-satunya jalur) =====
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

    // ---- Voucher bikin gratis (total Rp 0): kredit langsung server-side, tanpa order FITCO ----
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

    const bearer = FITCO_PARTNER_TOKEN || String(b.fitco_token || "");
    if (!bearer) {
      return res.status(503).json({ error: "Pembayaran belum aktif: token 20FIT partner (FITCO_PARTNER_TOKEN) belum di-set di server." });
    }
    // Data user dari profil (jangan percaya penuh input client) untuk order 20FIT.
    let prof = {};
    try {
      const { data: rows } = await admin.from("my20fit_profile").select("full_name,phone,email").eq("auth_user_id", user.id).limit(1);
      prof = (rows && rows[0]) || {};
    } catch (e) {}
    const email = String(prof.email || user.email || "").toLowerCase();
    // Nomor HP WAJIB utk invoice Xendit — FITCO menolak/ gagal bikin invoice tanpa phone valid,
    // jadi order gagal & user tanpa no HP dapat 502 tak jelas. Sumber: profil dulu, lalu fallback
    // ke input checkout (b.phone). Kalau tetap kosong -> balik error jelas + need_phone (frontend
    // memunculkan input HP), TANPA memanggil FITCO dgn phone kosong.
    const normPhone = (v) => String(v || "").replace(/[^\d+]/g, "").replace(/^\+?62/, "").replace(/^0/, "");
    let phone = normPhone(prof.phone);
    let savePhone = null;
    if (phone.length < 8) {
      const p2 = normPhone(b.phone);
      if (p2.length >= 8) { phone = p2; savePhone = String(b.phone).trim().slice(0, 20); }
    }
    if (phone.length < 8) {
      return res.status(400).json({ error: "Nomor HP kamu masih kosong. Masukkan nomor HP untuk melanjutkan pembayaran.", need_phone: true });
    }
    // Simpan nomor HP baru ke profil (best-effort) supaya pembelian berikutnya tak perlu isi lagi.
    if (savePhone) { try { await admin.from("my20fit_profile").update({ phone: savePhone }).eq("auth_user_id", user.id); } catch (e) {} }
    // JANGAN teruskan kode voucher kita ke FITCO sebagai promo_code.
    //
    // Voucher kita hidup di my20fit_vouchers (Supabase kita); FITCO tak tahu & tak perlu tahu.
    // Mengirimnya bikin FITCO MENOLAK SELURUH ORDER — terbukti di log production:
    //   fitco-shop-order ERR 422 {"message":"Promotion does not exists, invalid promo_code: ..."}
    //   scan/buy fitco-xendit: fitco_order_422
    // Jadi SEMUA voucher diskon sebagian selalu gagal: user tak bisa bayar sama sekali.
    // (Voucher 100% seolah "jalan" hanya karena amount<=0 memotong jalur FITCO sepenuhnya —
    // itu sebabnya cuma voucher 100% yang pernah berfungsi.)
    //
    // Diskonnya disampaikan lewat `price` final di items (lihat createFitcoXenditOrder) —
    // pola yang sama dipakai photo.20fit.id. promo_code milik sistem promosi FITCO sendiri;
    // app ini tidak memakainya (tak ada integrasi /api/v1/app/order/verify-promo di sini).
    // Catat order (pending) DULU (server-authoritative). amount=gross; net_amount = estimasi lokal.
    try {
      await admin.from("my20fit_scan_orders").insert({
        reff_no: reffNo, auth_user_id: user.id, credits: credits, amount: gross, net_amount: amount,
        provider: "xendit", order_type: "scan_credit", voucher_id: voucherId,
        status: "pending", created_at: new Date().toISOString(),
      });
    } catch (e) { console.error("scan_orders insert:", e.message); return res.status(500).json({ error: "Gagal menyiapkan order." }); }
    try {
      // FITCO shop order (payment_type xendit-invoices) -> FITCO bikin invoice Xendit + balik link.
      // user_id = FITCO uid member (dari client localStorage 'fitco_uid'). Diteruskan spt
      // implementasi lama yg terbukti jalan; kalau kosong (user non-FITCO) kirim null (order tamu).
      const fitcoUid = b.user_id ? String(b.user_id).trim() : null;
      // price = harga FINAL (setelah voucher) dalam SATU baris item. WAJIB dikirim.
      //
      // Tanpa price, FITCO memakai harga KATALOG-nya sendiri. Voucher kita hidup di Supabase
      // (my20fit_vouchers) dan FITCO TIDAK TAHU voucher itu ada — promo_code yang kita teruskan
      // tak berarti apa-apa bagi mereka. Akibatnya user dengan voucher diskon SEBAGIAN ditagih
      // Xendit HARGA PENUH, sementara my20fit_scan_orders.net_amount mencatat seolah didiskon.
      // (Voucher 100% kebetulan aman: amount<=0 memotong jalur FITCO dan dikredit langsung.)
      //
      // Pola price-satu-baris ini yang dipakai photo.20fit.id justru UNTUK diskon
      // (artifacts/api-server/src/lib/mainapi.ts: price: Math.round(tx.grossAmount)).
      // Bonus: harga jadi eksplisit, jadi katalog FITCO yang bergeser tak diam-diam mengubah
      // tagihan user (product_id di dokumentasi 20FIT pernah salah beberapa kali).
      //
      // Aman dari manipulasi: client HANYA mengirim package_id + voucher_code; `amount` dihitung
      // server dari SCAN_PACKAGES + voucher yang divalidasi server.
      const r = await createFitcoXenditOrder({
        bearer: bearer, userId: fitcoUid, name: prof.full_name || (email ? email.split("@")[0] : "Member"),
        phone: phone, email: email, reffNo: reffNo,
        items: [{ product_id: packageId, quantity: 1, price: amount }],
      });
      // Simpan id order FITCO di payment_link_id — INI SATU-SATUNYA pegangan untuk memantau
      // status. Tanpa itu order jadi TAK TERLACAK: polling tak bisa, /api/scan/reconcile
      // melewatinya, dan user yang tetap membayar TIDAK AKAN PERNAH dapat kreditnya.
      // Jadi gagal keras SEBELUM user melihat link: lebih baik menolak transaksi daripada
      // menerima uang yang kreditnya mustahil kita berikan. (Dulu: id hilang / update DB gagal
      // ditelan diam-diam, user tetap dikasih link.)
      if (!r.orderId) {
        try { await admin.from("my20fit_scan_orders").update({ status: "failed" }).eq("reff_no", reffNo); } catch (_) {}
        console.error("scan/buy NO-ORDER-ID", reffNo, "link ada tapi id order FITCO tidak ditemukan di respons");
        return res.status(502).json({ error: "Gagal menyiapkan pembayaran (id order tidak diterima dari 20FIT). Coba lagi / hubungi admin." });
      }
      const { error: linkErr } = await admin.from("my20fit_scan_orders")
        .update({ payment_link_id: String(r.orderId), fitco_order_no: r.orderNo ? String(r.orderNo) : null }).eq("reff_no", reffNo);
      if (linkErr) {
        try { await admin.from("my20fit_scan_orders").update({ status: "failed" }).eq("reff_no", reffNo); } catch (_) {}
        console.error("scan/buy payment_link_id gagal disimpan:", linkErr.message, reffNo);
        return res.status(502).json({ error: "Gagal menyiapkan pembayaran. Coba lagi." });
      }
      return res.json({ ok: true, link: r.link, sales_order_id: reffNo, order_no: reffNo, provider: "xendit", discount: discount, amount: amount });
    } catch (e) {
      try { await admin.from("my20fit_scan_orders").update({ status: "failed" }).eq("reff_no", reffNo); } catch (_) {}
      console.error("scan/buy fitco-xendit:", e.message);
      return res.status(502).json({ error: (e && e.userMessage) || "Gagal membuat pembayaran. Coba lagi." });
    }
  } catch (e) {
    console.error("scan/buy:", e.message);
    // Hormati status/pesan yg sudah spesifik (mis. 503 auth_unavailable dari getUserFromReq)
    // supaya user tahu sebabnya, bukan dapat 502 generik yang menyesatkan.
    return res.status(e && e.status ? e.status : 502)
      .json({ error: (e && e.userMessage) || "Gagal memproses pembayaran. Coba lagi." });
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
// GET /api/scan/quota — baca saldo/kuota TANPA memotong (utk tampilan, mis. calories.20fit.id).
// Read-only via RPC my20fit_scan_quota. Balikan { ok, quota }.
app.get("/api/scan/quota", async (req, res) => {
  try {
    if (!admin) return res.status(500).json({ error: "Server belum dikonfigurasi." });
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ error: "Unauthorized", session_expired: true });
    const { data, error } = await admin.rpc("my20fit_scan_quota", { p_uid: user.id });
    if (error) throw error;
    // Profil belum ada -> default (0 used, 10 free, 0 credits).
    return res.json({ ok: true, quota: shapeQuotaServer((data && data.ok) ? data : {}) });
  } catch (e) { console.error("scan/quota:", e.message); return res.status(500).json({ error: e.message }); }
});

// POST /api/scan/consume — kurangi 1 scan (gratis dulu 10/bln, lalu kredit berbayar)
// lewat RPC atomik my20fit_consume_scan. Saldo TIDAK lagi ditulis dari client.
// 402 + code=scan_limit kalau kuota habis. Balikan { ok, quota }.
app.post("/api/scan/consume", async (req, res) => {
  try {
    if (!admin) return res.status(500).json({ error: "Server belum dikonfigurasi." });
    const user = await getUserFromReq(req);
    // Sama seperti /api/scan/buy: jangan semprot user dgn "Unauthorized" saat dia lagi scan.
    if (!user) return res.status(401).json({ error: "Sesi kamu sudah habis. Silakan login lagi.", session_expired: true });
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

// POST /api/scan/ai — GERBANG server untuk food scan (FOTO). Enforcement jatah pindah
// ke server: verifikasi login + cek jatah SEBELUM panggil AI (hemat biaya kalau habis),
// lalu potong 1 jatah SETELAH AI sukses & makanan terdeteksi (konsisten dgn perilaku lama:
// foto tanpa makanan = tak dipotong). Client tak lagi memanggil mesin AI langsung utk foto.
// (Ketik-nama-makanan & MCU TETAP gratis & tak lewat sini.)
const AI_FN_URL = SUPABASE_URL + "/functions/v1/my20fit-ai";
// Secret khusus-server untuk edge my20fit-ai: hanya server yang tahu, dikirim sebagai
// header supaya edge MENOLAK panggilan langsung dari browser. Nilai HANYA dari env
// (Railway) — TAK PERNAH ditulis di kode/log. Kosong (belum di-set) => header kosong;
// edge belum mengunci sampai secret dipasang di kedua sisi (server + Supabase edge fn).
const AI_EDGE_SECRET = process.env.AI_EDGE_SECRET || "";
// Timeout khusus AI (bisa lama utk MCU/PDF), terpisah dari SUPA_TIMEOUT_MS (12s, utk REST).
const AI_TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS || "90000", 10);
// SATU jalur pemanggilan mesin AI (my20fit-ai) untuk SEMUA aksi (food/mcu/translate).
// AI SELALU dari server, tak pernah dari browser. Melempar AbortError saat timeout.
async function callAiEdge(payload, timeoutMs) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), timeoutMs || AI_TIMEOUT_MS);
  try {
    const r = await fetch(AI_FN_URL, {
      method: "POST", signal: ctrl.signal,
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + SUPABASE_ANON_KEY,
        "apikey": SUPABASE_ANON_KEY,
        "x-ai-edge-secret": AI_EDGE_SECRET,
      },
      body: JSON.stringify(payload),
    });
    const j = await r.json().catch(() => ({}));
    return { httpOk: r.ok, status: r.status, json: j };
  } finally {
    clearTimeout(to);
  }
}
// Jejak akses AI (MCU/translate): SIAPA + KAPAN + ok/gagal. TIDAK mencatat isi file
// atau hasil analisis — hanya jejak akses. Best-effort: gagal log tak menggagalkan request.
async function logAiAccess(userId, route, ok, errCode) {
  try {
    if (!admin) return;
    await admin.from("my20fit_ai_access_log").insert({
      auth_user_id: userId || null,
      route: String(route || "").slice(0, 40),
      ok: !!ok,
      err_code: errCode ? String(errCode).slice(0, 60) : null,
    });
  } catch (e) { /* jangan ganggu alur utama */ }
}
function scanPeriodJakarta() {
  // Sama persis dgn RPC my20fit_consume_scan: to_char(now() AT TIME ZONE 'Asia/Jakarta','YYYY-MM').
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit" }).formatToParts(new Date());
  const y = (parts.find(p => p.type === "year") || {}).value;
  const m = (parts.find(p => p.type === "month") || {}).value;
  return y + "-" + m;
}

// ---------- Cara A: kamus makanan internal (my20fit_food_ref) ----------
// Sistem "makin pinter" dari koreksi user — BUKAN AI yang belajar. Data agregat & anonim.
// Override hasil AI hanya kalau makanan sudah dikoreksi cukup sering (hindari 1 koreksi
// salah menimpa AI) DAN gram diketahui (porsi bisa "1 mangkuk" yg tak punya gram eksplisit).
const FOOD_REF_MIN_SAMPLES = 3;
function normFoodKey(name) {
  return String(name || "").toLowerCase().normalize("NFKD")
    .replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}
function parseGrams(portion) {
  const m = String(portion || "").match(/(\d+(?:\.\d+)?)\s*(gram|gr|g)\b/i);
  return m ? Math.round(parseFloat(m[1])) : null;
}
function clampPerG(v, max) { v = +v; if (!isFinite(v) || v < 0) return 0; return Math.min(v, max); }
async function refineWithFoodRef(result) {
  try {
    if (!result || !Array.isArray(result.items) || !result.items.length) return false;
    const keys = [...new Set(result.items.map(it => normFoodKey(it && it.name)).filter(Boolean))];
    if (!keys.length) return false;
    const { data: rows } = await admin.from("my20fit_food_ref")
      .select("food_key,kcal_per_g,protein_per_g,carbs_per_g,fat_per_g,fiber_per_g,sample_count")
      .in("food_key", keys).gte("sample_count", FOOD_REF_MIN_SAMPLES);
    if (!rows || !rows.length) return false;
    const map = {}; rows.forEach(r => { map[r.food_key] = r; });
    let any = false;
    result.items.forEach(it => {
      const ref = map[normFoodKey(it && it.name)];
      const g = parseGrams(it && it.portion);
      if (ref && g != null && g > 0) {
        it.kcal = Math.round(ref.kcal_per_g * g);
        it.protein_g = +(ref.protein_per_g * g).toFixed(1);
        it.carbs_g = +(ref.carbs_per_g * g).toFixed(1);
        it.fat_g = +(ref.fat_per_g * g).toFixed(1);
        it.fiber_g = +(ref.fiber_per_g * g).toFixed(1);
        it._source = "20fit_ref";
        any = true;
      }
    });
    if (any) {
      const sum = (k) => result.items.reduce((s, i) => s + (+i[k] || 0), 0);
      result.total_kcal = Math.round(sum("kcal"));
      result.protein_g = +sum("protein_g").toFixed(1);
      result.carbs_g = +sum("carbs_g").toFixed(1);
      result.fat_g = +sum("fat_g").toFixed(1);
      result.fiber_g = +sum("fiber_g").toFixed(1);
    }
    return any;
  } catch (e) { console.error("refineWithFoodRef:", e && e.message); return false; }
}

// Suapkan kamus internal (yg sudah cukup dikoreksi) ke AI sebagai REFERENCE — biar AI
// memilih angka hasil koreksi user untuk makanan yang cocok, BUKAN cuma override setelahnya.
async function buildFoodReference(limit) {
  try {
    const { data: rows } = await admin.from("my20fit_food_ref")
      .select("food_key,kcal_per_g,protein_per_g,carbs_per_g,fat_per_g,fiber_per_g,sample_count")
      .gte("sample_count", FOOD_REF_MIN_SAMPLES)
      .order("sample_count", { ascending: false }).limit(limit || 40);
    if (!rows || !rows.length) return null;
    return rows.map((r) =>
      r.food_key + ": " + (+r.kcal_per_g).toFixed(2) + " kcal/g, P " + (+r.protein_per_g).toFixed(3) +
      ", C " + (+r.carbs_per_g).toFixed(3) + ", F " + (+r.fat_per_g).toFixed(3) +
      ", fiber " + (+r.fiber_per_g).toFixed(3) + " per g"
    ).join("\n");
  } catch (e) { return null; }
}

app.post("/api/scan/ai", async (req, res) => {
  try {
    if (!admin) return res.status(500).json({ error: "Server belum dikonfigurasi." });
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ error: "Sesi kamu sudah habis. Silakan login lagi.", session_expired: true });
    const body = req.body || {};
    if (body.action !== "food") return res.status(400).json({ error: "action tidak didukung di endpoint ini." });
    // 1) Peek jatah (TANPA memotong). period Asia/Jakarta identik dgn RPC consume.
    const period = scanPeriodJakarta();
    const { data: prof } = await admin.from("my20fit_profile")
      .select("scan_count,scan_credits,scan_period").eq("auth_user_id", user.id).limit(1);
    const p0 = (prof && prof[0]) || {};
    const used = (p0.scan_period === period) ? (+p0.scan_count || 0) : 0;
    const credits = +p0.scan_credits || 0;
    if (Math.max(0, 10 - used) + credits <= 0) {
      return res.status(402).json({ ok: false, code: "scan_limit",
        quota: shapeQuotaServer({ used: used, free_limit: 10, credits: credits, period: period }) });
    }
    // 2) Panggil mesin AI server-side (satu jalur callAiEdge: secret + timeout terpusat).
    let aiJson = null;
    try {
      const ai = await callAiEdge({ action: "food", image: body.image, text: body.text, lang: body.lang, reference: await buildFoodReference(40) });
      aiJson = ai.json;
      if (!ai.httpOk || !aiJson || !aiJson.result) throw new Error((aiJson && aiJson.error) || "Gagal menganalisa.");
    } catch (e) {
      if (e && e.name === "AbortError") return res.status(504).json({ error: "Analisa memakan waktu lebih lama dari biasanya. Coba lagi ya." });
      return res.status(502).json({ error: "Gagal menghubungi mesin AI. Coba lagi." });
    }
    // 2b) Cara A: sempurnakan dgn kamus internal — override kalau makanan sudah dikoreksi cukup sering.
    try { await refineWithFoodRef(aiJson.result); } catch (e) {}
    // 3) Potong 1 jatah HANYA kalau makanan terdeteksi (items>0) — sama seperti perilaku lama.
    let quota = null;
    const detected = aiJson.result && Array.isArray(aiJson.result.items) && aiJson.result.items.length > 0;
    if (detected) {
      try {
        const { data: cq } = await admin.rpc("my20fit_consume_scan", { p_uid: user.id });
        if (cq) quota = shapeQuotaServer(cq);
      } catch (e) { console.error("scan/ai consume:", e && e.message); }
    }
    return res.json({ ok: true, result: aiJson.result, consumed: detected, quota: quota });
  } catch (e) { console.error("scan/ai:", e && e.message); return res.status(500).json({ error: "Gagal memproses scan." }); }
});

// ---------- MCU (Medical Check-Up): analisa hasil lab di SERVER, WAJIB login ----------
// Dulu browser memanggil edge my20fit-ai LANGSUNG (anon key di HTML) tanpa auth server —
// dipindah ke sini: verifikasi login -> panggil AI via callAiEdge (secret) -> balikan hasil.
// File diproses di MEMORI (req.body) & TIDAK ditulis ke disk. Jejak akses dicatat (tanpa isi).
app.post("/api/mcu", async (req, res) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ error: "Sesi kamu sudah habis. Silakan login lagi.", session_expired: true });
    const body = req.body || {};
    if (!body.file) return res.status(400).json({ error: "File tidak ada." });
    let ai;
    try {
      ai = await callAiEdge({ action: "mcu", file: body.file, mime: body.mime, lang: body.lang });
      if (!ai.httpOk || !ai.json || !ai.json.result) throw new Error((ai.json && ai.json.error) || "gagal");
    } catch (e) {
      logAiAccess(user.id, "mcu", false, (e && e.name) || "error");
      if (e && e.name === "AbortError") return res.status(504).json({ error: "Analisa memakan waktu lebih lama dari biasanya. Coba lagi ya." });
      return res.status(502).json({ error: "Gagal menganalisa hasil MCU. Coba lagi." });
    }
    logAiAccess(user.id, "mcu", true);
    return res.json({ ok: true, result: ai.json.result });
  } catch (e) {
    console.error("api/mcu:", e && e.message);
    return res.status(500).json({ error: "Gagal memproses. Coba lagi." });
  }
});

// ---------- Terjemah hasil (mis. MCU) ID<->EN via AI, di SERVER, WAJIB login ----------
app.post("/api/translate", async (req, res) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ error: "Sesi kamu sudah habis. Silakan login lagi.", session_expired: true });
    const body = req.body || {};
    if (!body.data || !body.lang) return res.status(400).json({ error: "Data tidak lengkap." });
    if (JSON.stringify(body.data).length > 12000) return res.status(413).json({ error: "Teks terlalu panjang untuk diterjemahkan." });
    let ai;
    try {
      ai = await callAiEdge({ action: "translate", lang: body.lang, data: body.data });
      if (!ai.httpOk || !ai.json || !ai.json.result) throw new Error((ai.json && ai.json.error) || "gagal");
    } catch (e) {
      logAiAccess(user.id, "translate", false, (e && e.name) || "error");
      if (e && e.name === "AbortError") return res.status(504).json({ error: "Terjemahan memakan waktu lebih lama. Coba lagi ya." });
      return res.status(502).json({ error: "Gagal menerjemahkan. Coba lagi." });
    }
    logAiAccess(user.id, "translate", true);
    return res.json({ ok: true, result: ai.json.result });
  } catch (e) {
    console.error("api/translate:", e && e.message);
    return res.status(500).json({ error: "Gagal memproses. Coba lagi." });
  }
});

// ============ EKOSISTEM SUB-DOMAIN PUBLIK — endpoint anonim (FASE 1B foundation) ============
// Dipakai halaman publik calories.20fit.id (DIBANGUN NANTI). Member yang login TIDAK lewat sini —
// halaman publik mengarahkan member ke /api/scan/ai (kuota member existing 10/bln TAK berubah).
// Gating: 5 scan TOTAL (bukan harian, tanpa reset). Hasil scan segar PENUH (tak diblur).
// Yang DIKUNCI = RIWAYAT: nilai gizi item riwayat TIDAK dikirim ke browser.
app.post("/api/pub/scan", pubScanLimiter, async (req, res) => {
  try {
    if (!admin) return res.status(503).json({ error: "Layanan belum siap." });
    const body = req.body || {};
    if (body.action !== "food") return res.status(400).json({ error: "action tidak didukung." });
    if (!body.image && !body.text) return res.status(400).json({ error: "Foto atau teks makanan wajib." });
    const sess = await getAnonSession(req, res, true);
    if (!sess) return res.status(503).json({ error: "Layanan belum siap." });
    if ((sess.scan_count || 0) >= ANON_SCAN_LIMIT) {
      return res.status(402).json({ ok: false, code: "anon_limit", requires_account: true, used: sess.scan_count || 0, limit: ANON_SCAN_LIMIT });
    }
    let ai;
    try {
      ai = await callAiEdge({ action: "food", image: body.image, text: body.text, lang: body.lang, reference: await buildFoodReference(40) });
      if (!ai.httpOk || !ai.json || !ai.json.result) throw new Error((ai.json && ai.json.error) || "gagal");
    } catch (e) {
      if (e && e.name === "AbortError") return res.status(504).json({ error: "Analisa memakan waktu lebih lama. Coba lagi ya." });
      return res.status(502).json({ error: "Gagal menghubungi mesin AI. Coba lagi." });
    }
    try { await refineWithFoodRef(ai.json.result); } catch (e) {}
    const detected = ai.json.result && Array.isArray(ai.json.result.items) && ai.json.result.items.length > 0;
    let used = sess.scan_count || 0;
    if (detected) {
      used = used + 1;
      try { await admin.from("my20fit_anonymous_scans").insert({ anon_id: sess.anon_id, result: ai.json.result }); } catch (e) {}
      try { await admin.from("my20fit_anonymous_sessions").update({ scan_count: used, last_seen_at: new Date().toISOString() }).eq("anon_id", sess.anon_id); } catch (e) {}
    }
    // Hasil segar tetap PENUH (tak diblur). Kunci hanya di riwayat.
    return res.json({ ok: true, result: ai.json.result, consumed: detected, used: used, limit: ANON_SCAN_LIMIT, remaining: Math.max(0, ANON_SCAN_LIMIT - used) });
  } catch (e) { console.error("pub/scan:", e && e.message); return res.status(500).json({ error: "Gagal memproses scan." }); }
});

// GET /api/pub/scan/history — riwayat anonim: nama + waktu SAJA. Nilai gizi DIKUNCI di server.
app.get("/api/pub/scan/history", async (req, res) => {
  try {
    if (!admin) return res.json({ ok: true, items: [], used: 0, limit: ANON_SCAN_LIMIT });
    const sess = await getAnonSession(req, res, false);
    if (!sess) return res.json({ ok: true, items: [], used: 0, limit: ANON_SCAN_LIMIT, requires_account: false });
    const { data } = await admin.from("my20fit_anonymous_scans")
      .select("id,result,created_at").eq("anon_id", sess.anon_id)
      .order("created_at", { ascending: false }).limit(50);
    const items = (data || []).map(function (r) {
      const rr = r.result || {};
      const names = Array.isArray(rr.items) ? rr.items.map(function (it) { return it && it.name; }).filter(Boolean) : [];
      // SENGAJA tanpa kcal/protein/carbs/fat -> nilai gizi riwayat tak dikirim ke browser (locked).
      return { id: r.id, name: names.join(", ") || "Scan", created_at: r.created_at, locked: true, requires_account: true };
    });
    return res.json({ ok: true, items: items, used: sess.scan_count || 0, limit: ANON_SCAN_LIMIT, requires_account: items.length > 0 });
  } catch (e) { console.error("pub/history:", e && e.message); return res.status(500).json({ error: "Gagal memuat riwayat." }); }
});

// GET /api/pub/quota — status kuota scan anonim.
app.get("/api/pub/quota", async (req, res) => {
  try {
    const sess = await getAnonSession(req, res, false);
    const used = sess ? (sess.scan_count || 0) : 0;
    return res.json({ ok: true, used: used, limit: ANON_SCAN_LIMIT, remaining: Math.max(0, ANON_SCAN_LIMIT - used) });
  } catch (e) { return res.json({ ok: true, used: 0, limit: ANON_SCAN_LIMIT, remaining: ANON_SCAN_LIMIT }); }
});

// Cron: hapus data scan anonim kadaluarsa (>7 hari) + sesi anonim mati. Lindungi CRON_SECRET.
app.post("/api/cron/purge-anon", async (req, res) => {
  const key = req.query.key || req.headers["x-cron-secret"] || "";
  if (!CRON_SECRET || key !== CRON_SECRET) return res.status(401).json({ error: "unauthorized" });
  if (!admin) return res.status(503).json({ error: "unavailable" });
  try { await admin.rpc("my20fit_purge_anon", { p_days: ANON_SCAN_TTL_DAYS }); return res.json({ ok: true }); }
  catch (e) { return res.status(500).json({ error: e.message }); }
});

// POST /api/scan/food-correction — user membetulkan hasil scan (nama + gram + kalori/makro).
// Kontribusi DIANONIMKAN ke kamus makanan (my20fit_food_ref): TIDAK menyimpan identitas user,
// foto, atau tanggal — cuma "nama makanan -> nutrisi per gram". Butuh login (anti-spam minimal).
app.post("/api/scan/food-correction", async (req, res) => {
  try {
    if (!admin) return res.status(500).json({ error: "Server belum dikonfigurasi." });
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ error: "Sesi kamu sudah habis. Silakan login lagi.", session_expired: true });
    const b = req.body || {};
    const name = String(b.name || "").trim();
    const grams = Math.round(+b.grams || 0);
    const kcal = +b.kcal;
    if (!name || grams <= 0 || !isFinite(kcal) || kcal <= 0) return res.status(400).json({ error: "Nama, gram, dan kalori wajib & valid." });
    const key = normFoodKey(name);
    if (!key) return res.status(400).json({ error: "Nama makanan tidak valid." });
    // per-gram + clamp fisik (kkal/g maksimum ~9.5 = mendekati lemak murni; makro <= 1 g/g).
    const kcalPerG = clampPerG(kcal / grams, 9.5);
    if (kcalPerG <= 0) return res.status(400).json({ error: "Nilai kalori tidak masuk akal." });
    await admin.rpc("my20fit_food_ref_learn", {
      p_key: key, p_name: name.slice(0, 80),
      p_kcal_per_g: kcalPerG,
      p_protein_per_g: clampPerG((+b.protein_g || 0) / grams, 1),
      p_carbs_per_g: clampPerG((+b.carbs_g || 0) / grams, 1),
      p_fat_per_g: clampPerG((+b.fat_g || 0) / grams, 1),
      p_fiber_per_g: clampPerG((+b.fiber_g || 0) / grams, 1),
      p_region: (String(b.lang || "").toLowerCase() === "en") ? "intl" : "id",
    });
    return res.json({ ok: true });
  } catch (e) { console.error("food-correction:", e && e.message); return res.status(500).json({ error: "Gagal menyimpan koreksi." }); }
});

// POST /api/scan/food-text — estimasi makanan dari NAMA + GRAM (ketik manual). GRATIS (tak potong
// jatah, sama seperti perilaku lama). Cara A+B: cek kamus internal DULU — kalau makanan sudah
// dikoreksi cukup sering, hitung langsung tanpa AI (akurat & instan). Kalau belum, panggil AI.
app.post("/api/scan/food-text", async (req, res) => {
  try {
    if (!admin) return res.status(500).json({ error: "Server belum dikonfigurasi." });
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ error: "Sesi kamu sudah habis. Silakan login lagi.", session_expired: true });
    const b = req.body || {};
    const name = String(b.name || "").trim();
    const grams = Math.round(+b.grams || 0);
    if (!name || grams <= 0) return res.status(400).json({ error: "Nama & gram wajib diisi." });
    const lang = (String(b.lang || "").toLowerCase() === "en") ? "en" : "id";
    // 1) Dict-first: kamus internal (>=3 koreksi) -> hitung langsung tanpa AI.
    const key = normFoodKey(name);
    if (key) {
      const { data: rows } = await admin.from("my20fit_food_ref")
        .select("kcal_per_g,protein_per_g,carbs_per_g,fat_per_g,fiber_per_g,sample_count")
        .eq("food_key", key).gte("sample_count", FOOD_REF_MIN_SAMPLES).limit(1);
      const ref = rows && rows[0];
      if (ref) {
        const kcal = Math.round(ref.kcal_per_g * grams);
        const item = { name: name, portion: grams + "g", kcal: kcal,
          protein_g: +(ref.protein_per_g * grams).toFixed(1), carbs_g: +(ref.carbs_per_g * grams).toFixed(1),
          fat_g: +(ref.fat_per_g * grams).toFixed(1), fiber_g: +(ref.fiber_per_g * grams).toFixed(1), _source: "20fit_ref" };
        return res.json({ ok: true, source: "ref", result: {
          items: [item], total_kcal: kcal, protein_g: item.protein_g, carbs_g: item.carbs_g,
          fat_g: item.fat_g, fiber_g: item.fiber_g,
          note: (lang === "en") ? "Calculated from 20FIT corrected data." : "Dihitung dari data koreksi 20FIT." } });
      }
    }
    // 2) Belum di kamus -> panggil AI via callAiEdge (secret + timeout terpusat). Tetap gratis.
    try {
      const ai = await callAiEdge({ action: "food", text: name + ", " + grams + " gram", lang: lang }, 60000);
      if (!ai.httpOk || !ai.json || !ai.json.result) throw new Error((ai.json && ai.json.error) || "Gagal menganalisa.");
      return res.json({ ok: true, source: "ai", result: ai.json.result });
    } catch (e) {
      if (e && e.name === "AbortError") return res.status(504).json({ error: "Analisa memakan waktu lebih lama dari biasanya. Coba lagi ya." });
      return res.status(502).json({ error: "Gagal menghubungi mesin AI. Coba lagi." });
    }
  } catch (e) { console.error("food-text:", e && e.message); return res.status(500).json({ error: "Gagal memproses." }); }
});

// ---------- Preview voucher sebelum bayar (untuk halaman checkout) ----------
// POST /api/scan/voucher-check { code, price } -> { ok, valid, discount, final } atau { ok:false, error }
app.post("/api/scan/voucher-check", async (req, res) => {
  try {
    if (!admin) return res.status(500).json({ error: "Server belum dikonfigurasi." });
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ ok: false, error: "Sesi kamu sudah habis. Silakan login lagi.", session_expired: true });
    const b = req.body || {};
    const gross = parseInt(b.price, 10) || 0;
    if (gross <= 0) return res.status(400).json({ error: "Harga paket tidak valid." });
    const vr = await validateVoucherForBuy(b.code, gross, user.id);
    if (vr.error) return res.json({ ok: false, error: vr.error });
    return res.json({ ok: true, valid: !!vr.voucher, code: vr.voucher ? vr.voucher.code : null, discount: vr.discount, final: vr.final });
  } catch (e) {
    // JANGAN bocorkan e.message mentah ke user (dulu: "auth_unavailable" muncul di layar).
    try { console.error("voucher-check:", (e && e.message) || e); } catch (_) {}
    return res.status(e && e.status ? e.status : 500)
      .json({ ok: false, error: (e && e.userMessage) || "Gagal cek voucher. Coba lagi." });
  }
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

// POST /api/attribution — simpan sumber trafik (UTM + referrer) user SEKALI (first-touch).
// Dipanggil js/auth.js saat user sudah login. Idempoten by auth_user_id: kunjungan berikutnya
// TIDAK menimpa sumber pertama. Data NON-kesehatan → boleh dilihat role marketing di dashboard.
app.post("/api/attribution", async (req, res) => {
  try {
    if (!admin) return res.json({ ok: false });
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const b = req.body || {};
    const s = (v, n) => { const x = (v == null ? "" : String(v)).trim(); return x ? x.slice(0, n) : null; };
    const referrer = s(b.referrer, 300);
    let referrer_host = null;
    if (referrer) { try { referrer_host = (new URL(referrer).hostname || "").replace(/^www\./, "") || null; } catch (e) {} }
    const fsa = new Date(b.first_seen_at);
    const row = {
      auth_user_id: user.id, captured: true,
      utm_source: s(b.utm_source, 120), utm_medium: s(b.utm_medium, 120),
      utm_campaign: s(b.utm_campaign, 160), utm_content: s(b.utm_content, 160), utm_term: s(b.utm_term, 160),
      referrer: referrer, referrer_host: referrer_host, landing_page: s(b.landing_page, 300),
      first_seen_at: isNaN(fsa.getTime()) ? new Date().toISOString() : fsa.toISOString(),
    };
    // Aturan simpan (data user lama & baru sama-sama aman):
    //  - belum ada baris        -> INSERT sumber asli (user baru).
    //  - ada placeholder lama    -> UPGRADE jadi sumber asli (user lama datang via link UTM).
    //  - sudah ada sumber asli   -> JANGAN ditimpa (first-touch menang).
    const { data: ex } = await admin.from("my20fit_signup_attribution")
      .select("captured").eq("auth_user_id", user.id).limit(1);
    if (ex && ex[0]) {
      if (ex[0].captured === false) await admin.from("my20fit_signup_attribution").update(row).eq("auth_user_id", user.id);
    } else {
      await admin.from("my20fit_signup_attribution").insert(row);
    }
    return res.json({ ok: true });
  } catch (e) { return res.json({ ok: false }); }
});

// POST /api/menu/open — catat user membuka detail sebuah menu di /diet (sinyal minat).
// Snapshot metadata dikirim client supaya dashboard bisa agregasi tanpa duplikasi katalog.
app.post("/api/menu/open", async (req, res) => {
  try {
    if (!admin) return res.json({ ok: false });
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const b = req.body || {};
    const menu_id = String(b.menu_id || "").slice(0, 80);
    if (!menu_id) return res.status(400).json({ error: "menu_id wajib" });
    const types = Array.isArray(b.types)
      ? b.types.filter(t => t != null).map(t => String(t).slice(0, 40)).slice(0, 8) : [];
    const kcal = (b.kcal == null || isNaN(+b.kcal)) ? null : Math.round(+b.kcal);
    await admin.from("my20fit_menu_event").insert({
      auth_user_id: user.id, menu_id: menu_id,
      menu_name: b.name != null ? String(b.name).slice(0, 160) : null,
      menu_types: types.length ? types : null,
      menu_cat: b.cat != null ? String(b.cat).slice(0, 60) : null,
      kcal: kcal,
    });
    return res.json({ ok: true });
  } catch (e) { return res.json({ ok: false }); }
});

// GET /api/foodphoto?id=<menu>&q=<english name> — foto ASLI menu diet (BUKAN generate AI).
// Sumber utama: Pexels (foto profesional, lisensi bebas komersial) bila PEXELS_API_KEY di-set;
// kalau belum di-set → fallback TheMealDB (nama cocok). URL Pexels di-cache per menu di
// my20fit_foodimg (id = "<menu>-px") → STABIL & Pexels dipanggil sekali per menu (hemat kuota).
// Foto AI DIHENTIKAN: hasil selalu blur/tak akurat (keterbatasan text-to-image). Butuh login.
app.get("/api/foodphoto", async (req, res) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) return res.json({ ok: false });
    const id = String(req.query.id || "").slice(0, 80);
    const q = String(req.query.q || "").slice(0, 120);       // nama deskriptif (buat AI & Pexels)
    const mdb = String(req.query.mdb || "").slice(0, 60);    // kata kunci pendek (buat TheMealDB)
    const desc = String(req.query.desc || "").slice(0, 400); // bahan (buat AI biar tahu dish-nya)
    if (!id) return res.json({ ok: false });

    // 0) GENERATE AI (google/gemini-2.5-flash-image) via edge function — PRIMARY (permintaan owner).
    //    Prompt v7 (edge): tegas SATU foto landscape 4:3, satu piring, BUKAN kolase. id "-v8" =
    //    regenerate bersih dgn prompt itu. Key OpenRouter hanya di Supabase secret (bukan di kode).
    //    Gagal/kosong → Pexels/TheMealDB di bawah. Butuh token user (verify_jwt) → forward Authorization.
    const auth = req.headers.authorization || "";
    if (auth && q) {
      try {
        const fr = await fetch(SUPABASE_URL + "/functions/v1/my20fit-foodimg", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": auth, "apikey": SUPABASE_ANON_KEY },
          body: JSON.stringify({ id: id + "-v8", name: q, desc: desc }),
        });
        if (fr.ok) {
          const fj = await fr.json();
          if (fj && fj.ok && fj.url) return res.json({ ok: true, url: fj.url, source: "ai" });
        }
      } catch (_e) {}
    }

    const cacheId = id + "-px";
    // 1) cache stabil (Pexels yang sudah pernah resolve) → URL tak berubah tiap load.
    if (admin) {
      try {
        const { data } = await admin.from("my20fit_foodimg").select("url").eq("id", cacheId).limit(1);
        if (data && data[0] && data[0].url) return res.json({ ok: true, url: data[0].url, cached: true });
      } catch (_e) {}
    }
    // 2) Pexels — foto asli & jelas. Hanya kalau key di-set (owner isi di Railway env).
    const key = process.env.PEXELS_API_KEY;
    if (key && q) {
      try {
        const pr = await fetch("https://api.pexels.com/v1/search?orientation=landscape&per_page=1&query=" + encodeURIComponent(q),
          { headers: { Authorization: key } });
        if (pr.ok) {
          const pj = await pr.json();
          const p = pj && pj.photos && pj.photos[0];
          const url = p && p.src && (p.src.medium || p.src.large || p.src.original);
          if (url) {
            if (admin) { try { await admin.from("my20fit_foodimg").upsert({ id: cacheId, url: url }); } catch (_e) {} }
            return res.json({ ok: true, url: url, source: "pexels" });
          }
        }
      } catch (_e) {}
    }
    // 3) fallback TheMealDB — pakai kata kunci PENDEK (mdb, mis. "chicken") supaya foto ASLI
    //    muncul walau tanpa key Pexels. Foto jelas tapi GENERIK (bukan dish persis). Tidak di-cache
    //    (biar otomatis upgrade ke Pexels begitu key di-set). Kalau mdb kosong, coba q.
    const mdbQ = mdb || q;
    if (mdbQ) {
      try {
        const mr = await fetch("https://www.themealdb.com/api/json/v1/1/search.php?s=" + encodeURIComponent(mdbQ));
        if (mr.ok) {
          const mj = await mr.json();
          const m = mj && mj.meals;
          if (m && m[0] && m[0].strMealThumb) return res.json({ ok: true, url: m[0].strMealThumb + "/small", source: "themealdb" });
        }
      } catch (_e) {}
    }
    return res.json({ ok: false }); // tak ada foto asli yang cocok → klien pakai placeholder rapi
  } catch (e) { return res.json({ ok: false }); }
});

// PUBLIK: foto makanan untuk katalog menu.20fit.id (browse tanpa login). Cermin /api/foodphoto
// tapi TERBALIK urutan cache-check: AI (langkah 0) SEKARANG diaktifkan di sini juga (permintaan
// owner, foto masakan bergaya Indonesia), TAPI hanya utk id yang benar2 ada di katalog resmi
// (loadMenuCatalog) — endpoint ini publik/tanpa login, jadi id sembarangan tidak boleh bisa
// memicu generate AI berbayar berulang-ulang (biaya + abuse). Tiap id resmi digenerate SEKALI lalu
// dicache permanen (tabel my20fit_foodimg + Supabase Storage) — lihat my20fit-foodimg. Gagal/tak
// eligible -> lanjut Pexels -> TheMealDB seperti sebelumnya. Rate limit imgLimiter (lihat isImgPath).
// ok:false -> klien pakai placeholder emoji.
const AI_FOODIMG_TIMEOUT_MS = parseInt(process.env.AI_FOODIMG_TIMEOUT_MS || "40000", 10);
let _officialMenuIdSet = null;
function isOfficialMenuId(id) {
  if (!_officialMenuIdSet) {
    _officialMenuIdSet = new Set(loadMenuCatalog().map((r) => String(r && r.id || "")));
  }
  return _officialMenuIdSet.has(id);
}
app.get("/api/menu/photo", async (req, res) => {
  try {
    const id = String(req.query.id || "").slice(0, 80);
    const q = String(req.query.q || "").slice(0, 120);    // nama deskriptif (Pexels & AI)
    const mdb = String(req.query.mdb || "").slice(0, 60); // kata kunci pendek (TheMealDB)
    if (!id) return res.json({ ok: false });

    // 0) GENERATE AI (google/gemini-2.5-flash-image via my20fit-foodimg), gaya foto Indonesia.
    //    Suffix cache "-ai-id" beda dari "-v8" punya /api/foodphoto (prompt berbeda) supaya tidak
    //    ikut ke-skip oleh cache lama. Dipanggil dgn kredensial anon server (pola sama dgn
    //    callAiEdge) krn endpoint ini publik & tak punya token user untuk diteruskan.
    if (isOfficialMenuId(id) && q) {
      const aiCacheId = id + "-ai-id";
      if (admin) {
        try {
          const { data } = await admin.from("my20fit_foodimg").select("url").eq("id", aiCacheId).limit(1);
          if (data && data[0] && data[0].url) { res.set("Cache-Control", "public, max-age=86400"); return res.json({ ok: true, url: data[0].url, cached: true, source: "ai" }); }
        } catch (_e) {}
      }
      // Timeout eksplisit (pola sama dgn callAiEdge) — endpoint ini PUBLIK & tanpa login, jadi
      // kalau OpenRouter/Supabase lambat/macet, jangan sampai request pengunjung anonim nge-hang.
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), AI_FOODIMG_TIMEOUT_MS);
      try {
        const catRec = loadMenuCatalog().find((r) => r && r.id === id);
        const desc = catRec && catRec.ing && (catRec.ing.en || catRec.ing.id) || "";
        const fr = await fetch(SUPABASE_URL + "/functions/v1/my20fit-foodimg", {
          method: "POST",
          signal: ctrl.signal,
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + SUPABASE_ANON_KEY, apikey: SUPABASE_ANON_KEY },
          body: JSON.stringify({ id: aiCacheId, name: q, desc: String(desc).slice(0, 400), indo: true }),
        });
        if (fr.ok) {
          const fj = await fr.json();
          if (fj && fj.ok && fj.url) { res.set("Cache-Control", "public, max-age=86400"); return res.json({ ok: true, url: fj.url, source: "ai" }); }
        }
      } catch (_e) {
        // timeout/network error -> lanjut fallback Pexels/TheMealDB di bawah, jangan gagalkan request.
      } finally {
        clearTimeout(to);
      }
    }

    const cacheId = id + "-px";
    if (admin) {
      try {
        const { data } = await admin.from("my20fit_foodimg").select("url").eq("id", cacheId).limit(1);
        if (data && data[0] && data[0].url) { res.set("Cache-Control", "public, max-age=86400"); return res.json({ ok: true, url: data[0].url, cached: true }); }
      } catch (_e) {}
    }
    const key = process.env.PEXELS_API_KEY;
    if (key && q) {
      try {
        const pr = await fetch("https://api.pexels.com/v1/search?orientation=landscape&per_page=1&query=" + encodeURIComponent(q),
          { headers: { Authorization: key } });
        if (pr.ok) {
          const pj = await pr.json();
          const p = pj && pj.photos && pj.photos[0];
          // Sumber wajib >=1024px di sisi terpendek — jangan paksa isi foto kecil
          // (fallback ke sumber berikutnya / placeholder emoji drpd foto buram/kepotong).
          const shortSide = p ? Math.min(Number(p.width) || 0, Number(p.height) || 0) : 0;
          const url = p && p.src && shortSide >= 1024 ? (p.src.large2x || p.src.original) : null;
          if (url) {
            if (admin) { try { await admin.from("my20fit_foodimg").upsert({ id: cacheId, url: url }); } catch (_e) {} }
            res.set("Cache-Control", "public, max-age=86400");
            return res.json({ ok: true, url: url, source: "pexels" });
          }
        }
      } catch (_e) {}
    }
    const mdbQ = mdb || q;
    if (mdbQ) {
      try {
        const mr = await fetch("https://www.themealdb.com/api/json/v1/1/search.php?s=" + encodeURIComponent(mdbQ));
        if (mr.ok) {
          const mj = await mr.json();
          const m = mj && mj.meals;
          // Tanpa suffix ukuran = varian TERBESAR yg disediakan TheMealDB (sebelumnya "/small"
          // sengaja minta yg terkecil, ~312px — di bawah standar 1024px kita).
          if (m && m[0] && m[0].strMealThumb) { res.set("Cache-Control", "public, max-age=86400"); return res.json({ ok: true, url: m[0].strMealThumb, source: "themealdb" }); }
        }
      } catch (_e) {}
    }
    return res.json({ ok: false });
  } catch (e) { return res.json({ ok: false }); }
});

// GET /api/admin/menu-analytics (viewer+ termasuk marketing; NON-kesehatan) — agregasi minat
// menu: berapa kali tiap menu dibuka + user unik, dan minat per TIPE menu (biar tahu user lebih
// suka tipe apa). Angka apa adanya dari event; menu yang tak pernah dibuka tak muncul (0 minat).
app.get("/api/admin/menu-analytics", async (req, res) => {
  const ctx = await requireAdmin(req, res, "viewer"); if (!ctx) return;
  const { from, to } = adminRange(req.query);
  try {
    const { data: ev, error } = await admin.from("my20fit_menu_event")
      .select("auth_user_id,menu_id,menu_name,menu_types,menu_cat,kcal,created_at")
      .gte("created_at", from).lte("created_at", to).limit(100000);
    if (error) throw error;
    const events = ev || [];
    const perMenu = {}, perType = {}, allUsers = {};
    events.forEach(e => {
      if (e.auth_user_id) allUsers[e.auth_user_id] = true;
      const m = perMenu[e.menu_id] || (perMenu[e.menu_id] = { menu_id: e.menu_id, name: e.menu_name || e.menu_id, cat: e.menu_cat || null, kcal: e.kcal != null ? e.kcal : null, types: e.menu_types || [], clicks: 0, users: {} });
      m.clicks++; if (e.auth_user_id) m.users[e.auth_user_id] = true;
      if (e.menu_name) m.name = e.menu_name;
      if (e.menu_types && e.menu_types.length) m.types = e.menu_types;
      if (e.kcal != null) m.kcal = e.kcal;
      (e.menu_types || []).forEach(t => {
        const g = perType[t] || (perType[t] = { type: t, clicks: 0, users: {}, menus: {} });
        g.clicks++; if (e.auth_user_id) g.users[e.auth_user_id] = true; g.menus[e.menu_id] = true;
      });
    });
    const menus = Object.values(perMenu)
      .map(m => ({ menu_id: m.menu_id, name: m.name, cat: m.cat, kcal: m.kcal, types: m.types, clicks: m.clicks, users: Object.keys(m.users).length }))
      .sort((a, b) => b.clicks - a.clicks);
    const by_type = Object.values(perType)
      .map(g => ({ type: g.type, clicks: g.clicks, users: Object.keys(g.users).length, menus: Object.keys(g.menus).length }))
      .sort((a, b) => b.clicks - a.clicks);
    return res.json({
      ok: true, range: { from, to },
      total_clicks: events.length, unique_menus: menus.length, unique_users: Object.keys(allUsers).length,
      by_type: by_type, menus: menus,
    });
  } catch (e) { console.error("admin/menu-analytics:", e.message); return res.status(500).json({ error: e.message }); }
});

// ---------- Cek status pembayaran order scan (untuk auto thank-you + isi kredit) ----------
// POST /api/scan/order-status  { sales_order_id (=reff_no kita), fitco_token }
// Order kita (my20fit_scan_orders) = sumber. Kalau masih pending & ada id order FITCO,
// server poll status ke FITCO lalu KREDIT server-authoritative begitu FITCO konfirmasi lunas
// (idempoten lewat RPC my20fit_credit_scan; retry poll tak akan double-credit).
// Poll status order ke FITCO (/api/v1/app/order/:id). Coba token user dulu, lalu partner.
async function fitcoOrderStatus(fitcoId, userToken, orderNo) {
  const tokens = [];
  if (userToken) tokens.push({ tk: String(userToken), via: "user" });
  if (FITCO_PARTNER_TOKEN) tokens.push({ tk: FITCO_PARTNER_TOKEN, via: "partner" });
  if (!tokens.length) return null;
  // Endpoint status, urut prioritas:
  //  1) BARU: /api/v1/callback/order/{order_no}/payment-status  (order_no "WEB..." bila tersimpan)
  //  2) LAMA: /api/v1/app/order/{id}  (jalur yang selama ini jalan — fallback aman)
  // Sinyal DEFINITIF (paid/expired) dari endpoint mana pun langsung dipakai; kalau semua cuma
  // "pending" baru balik pending. Jadi endpoint baru TIDAK menutupi deteksi lunas endpoint lama
  // (anti-regresi terhadap crediting yang sudah jalan).
  const eps = [];
  if (orderNo) eps.push({ url: "/api/v1/callback/order/" + encodeURIComponent(orderNo) + "/payment-status", tag: "callback" });
  if (fitcoId) eps.push({ url: "/api/v1/app/order/" + encodeURIComponent(fitcoId), tag: "app" });
  let lastHttp = 0, lastSig = null;
  for (const ep of eps) {
    for (const t of tokens) {
      // Timeout keras per panggilan (reconcile memanggil ini banyak kali berurutan).
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      try {
        const r = await fetch(FITCO_API + ep.url, {
          headers: { "Accept": "application/json", "Authorization": "Bearer " + t.tk },
          signal: ctrl.signal,
        });
        clearTimeout(timer);
        lastHttp = r.status;
        if (!r.ok) { try { console.log("fitco-status", ep.tag, t.via, r.status); } catch (e) {} continue; }
        const j = await r.json().catch(() => ({}));
        const sig = scanPaidMarkers(j); sig.via = t.via + "/" + ep.tag; sig.http = r.status;
        try { console.log("fitco-status OK", ep.tag, t.via, r.status, "paid=" + sig.paid + " expired=" + sig.expired); } catch (e) {}
        if (sig.paid || sig.expired) return sig;   // definitif -> langsung pakai
        lastSig = sig;                              // readable tapi pending -> catat, coba kandidat lain
      } catch (e) { clearTimeout(timer); lastHttp = -1; }
    }
  }
  if (lastSig) return lastSig;
  return { paid: false, expired: false, debug: [], via: "", http: lastHttp, unreadable: true };
}
app.post("/api/scan/order-status", async (req, res) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const b = req.body || {};
    const id = String(b.sales_order_id || "").trim();
    if (!id) return res.status(400).json({ error: "sales_order_id kosong." });
    // Order kita (server-authoritative): cari by reff_no milik user ini.
    let order = null;
    if (admin) {
      try {
        const { data: srows } = await admin.from("my20fit_scan_orders")
          .select("reff_no,status,provider,payment_link_id,fitco_order_no,auth_user_id").eq("reff_no", id).limit(1);
        order = srows && srows[0];
      } catch (e) {}
    }
    if (order) {
      if (order.auth_user_id && order.auth_user_id !== user.id) return res.status(403).json({ error: "Bukan order kamu." });
      if (order.status === "paid") return res.json({ ok: true, paid: true, expired: false, pending: false, provider: order.provider });
      if (order.status === "failed" || order.status === "expired") return res.json({ ok: true, paid: false, expired: true, pending: false, provider: order.provider });
      // Pending: cek ke FITCO pakai id order FITCO tersimpan (payment_link_id).
      const fitcoId = order.payment_link_id ? String(order.payment_link_id) : "";
      if (fitcoId) {
        const sig = await fitcoOrderStatus(fitcoId, b.fitco_token, order.fitco_order_no);
        if (sig && sig.paid) {
          await creditScanOrder(order.reff_no);  // klaim pending->paid + tambah kredit (idempoten)
          try { console.log("order-status paid+credited", order.reff_no, "fitco=" + fitcoId); } catch (e) {}
          return res.json({ ok: true, paid: true, expired: false, pending: false, provider: order.provider });
        }
        if (sig && sig.expired) {
          try { await admin.from("my20fit_scan_orders").update({ status: "expired" }).eq("reff_no", order.reff_no); } catch (e) {}
          return res.json({ ok: true, paid: false, expired: true, pending: false, provider: order.provider });
        }
      }
      return res.json({ ok: true, paid: false, expired: false, pending: true, provider: order.provider });
    }
    // Fallback (order tak ada di DB kita, mis. legacy): poll FITCO langsung by id.
    const sig = await fitcoOrderStatus(id, b.fitco_token);
    if (!sig || sig.unreadable) return res.json({ ok: true, paid: false, expired: false, pending: true, note: "unreadable" });
    return res.json({ ok: true, paid: sig.paid, expired: sig.expired, pending: !sig.paid && !sig.expired, via: sig.via, debug: sig.debug });
  } catch (e) {
    console.error("order-status:", e.message);
    return res.json({ ok: true, paid: false, expired: false, pending: true, note: "error" });
  }
});

// ---------- Status pembayaran utk halaman /payment/pending + tombol "Cek Status" ----------
// GET /api/payment/status?external_id=<reff_no order scan kita>. Server-authoritative & aman:
// hanya membaca status + memakai jalur kredit yang SUDAH ada (creditScanOrder, idempoten) —
// TIDAK menambah logic kredit baru. Wajib login; user hanya boleh cek order miliknya.
app.get("/api/payment/status", async (req, res) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    if (!admin) return res.status(500).json({ error: "Server belum dikonfigurasi." });
    const ext = String(req.query.external_id || "").trim();
    if (!ext) return res.status(400).json({ error: "external_id kosong." });
    const { data: rows } = await admin.from("my20fit_scan_orders")
      .select("reff_no,status,provider,credits,auth_user_id,payment_link_id,fitco_order_no,paid_at").eq("reff_no", ext).limit(1);
    const order = rows && rows[0];
    if (!order) return res.status(404).json({ status: "NOT_FOUND", error: "Order tidak ditemukan." });
    if (order.auth_user_id && order.auth_user_id !== user.id) return res.status(403).json({ error: "Bukan order kamu." });
    let status = order.status;
    if (status === "pending" && order.payment_link_id) {
      try {
        const sig = await fitcoOrderStatus(String(order.payment_link_id), req.query.fitco_token || null, order.fitco_order_no);
        if (sig && sig.paid) { await creditScanOrder(order.reff_no); status = "paid"; }
        else if (sig && sig.expired) { try { await admin.from("my20fit_scan_orders").update({ status: "expired" }).eq("reff_no", order.reff_no); } catch (e) {} status = "expired"; }
      } catch (e) {}
    }
    let total = null;
    try { const { data: pr } = await admin.from("my20fit_profile").select("scan_credits").eq("auth_user_id", user.id).limit(1); total = pr && pr[0] ? pr[0].scan_credits : null; } catch (e) {}
    const isPaid = (status === "paid");
    const isFail = (status === "failed" || status === "expired");
    return res.json({
      status: isPaid ? "PAID" : (isFail ? "FAILED" : "PENDING"),
      credits_added: isPaid ? (order.credits || 0) : 0,
      total_credits: total,
      paid_at: order.paid_at || null,
      provider: order.provider || null,
      message: isPaid ? "Pembayaran berhasil." : (isFail ? "Pembayaran gagal atau kadaluarsa." : "Pembayaran belum dikonfirmasi."),
    });
  } catch (e) {
    console.error("payment/status:", e.message);
    return res.status(500).json({ error: "Gagal cek status pembayaran." });
  }
});

// ---------- Sapu order tertunda milik user (pemulihan lintas-device) ----------
// POST /api/scan/reconcile  { fitco_token }
// Kenapa perlu: daftar order yang dipantau frontend hanya ada di localStorage. Invoice Xendit
// diterbitkan API 20FIT dan webhook "paid"-nya ACCOUNT-GLOBAL -> callback selalu ke backend
// 20FIT, TIDAK PERNAH ke sini. Jadi tanpa sapuan ini, user yang bayar lalu membuka app dari
// device/browser lain (atau yang localStorage-nya hilang) TIDAK PERNAH dapat kreditnya —
// uang masuk, kredit tidak. Order ada di DB kita (my20fit_scan_orders), jadi sumbernya
// diambil dari sana by auth_user_id, bukan dari klien.
// Dibatasi 20 order & 7 hari terakhir supaya tidak membanjiri API 20FIT tiap app dibuka.
app.post("/api/scan/reconcile", async (req, res) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    if (!admin) return res.json({ ok: true, checked: 0, credited: 0 });
    const b = req.body || {};
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    // supabase-js TIDAK throw: dia balik { data, error }. Kalau error diabaikan, query rusak
    // (schema drift / RLS / service key salah) menghasilkan rows=[] yang TIDAK BISA DIBEDAKAN
    // dari "tidak ada order pending" — jaring pengaman ini mati diam-diam. Jadi error dibaca
    // eksplisit, dicatat, dan dibalikkan sebagai error (bukan sukses palsu).
    const { data, error } = await admin.from("my20fit_scan_orders")
      .select("reff_no,payment_link_id,fitco_order_no,credits,provider")
      .eq("auth_user_id", user.id).eq("status", "pending")
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false }).limit(20);
    if (error) {
      console.error("scan/reconcile query:", error.message);
      return res.status(500).json({ ok: false, error: "Gagal memeriksa pembayaran tertunda." });
    }
    const rows = data || [];
    let checked = 0, credits = 0;
    const creditedOrders = [];
    for (const o of rows) {
      if (!o.payment_link_id) continue;  // order gagal sebelum FITCO bikin invoice
      checked++;
      let sig = null;
      try { sig = await fitcoOrderStatus(String(o.payment_link_id), b.fitco_token, o.fitco_order_no); } catch (e) { continue; }
      if (sig && sig.paid) {
        // Idempoten (RPC my20fit_credit_scan klaim pending->paid sekali saja).
        if (await creditScanOrder(o.reff_no)) {
          creditedOrders.push({ reff_no: o.reff_no, credits: +o.credits || 0 });
          credits += (+o.credits || 0);
          try { console.log("reconcile credited", o.reff_no); } catch (e) {}
        }
      } else if (sig && sig.expired) {
        // Kunci transisi HANYA pending->expired. Tanpa .eq("status","pending") ada balapan:
        // polling lain (order-status) bisa sudah mengkredit order ini jadi 'paid' sejak SELECT
        // di atas, dan update ini akan menimpanya jadi 'expired' — kredit terlanjur diberi,
        // pembukuan jadi salah.
        try { await admin.from("my20fit_scan_orders").update({ status: "expired" }).eq("reff_no", o.reff_no).eq("status", "pending"); } catch (e) {}
      }
    }
    return res.json({ ok: true, checked: checked, credited: creditedOrders.length, credits: credits, orders: creditedOrders });
  } catch (e) {
    // JANGAN balas ok:true di sini — klien menandai _swept dan berhenti mencoba, jadi
    // kegagalan infrastruktur akan diam-diam mematikan jalur kredit lintas-device.
    console.error("scan/reconcile:", (e && e.message) || e);
    return res.status(e && e.status ? e.status : 500)
      .json({ ok: false, error: (e && e.userMessage) || "Gagal memeriksa pembayaran tertunda." });
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
    // Cegah IDOR: user hanya boleh membatalkan order MILIKNYA. Sebelumnya id dari body
    // dioper langsung ke FITCO (pakai fallback partner token) tanpa cek pemilik, sehingga
    // user login mana pun bisa mencoba cancel order user lain. Cek by identifier apa pun
    // pada my20fit_scan_orders yang auth_user_id-nya = user ini (query hanya baris user ini
    // -> tak ada risiko injeksi filter).
    if (!admin) return res.status(500).json({ error: "Server belum dikonfigurasi." });
    let owned = false;
    try {
      const { data: srows } = await admin.from("my20fit_scan_orders")
        .select("reff_no,payment_link_id,fitco_order_no").eq("auth_user_id", user.id);
      owned = (srows || []).some(function (o) {
        return String(o.reff_no) === id || String(o.payment_link_id) === id || String(o.fitco_order_no) === id;
      });
    } catch (e) {}
    if (!owned) return res.status(403).json({ error: "Bukan order kamu." });
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

// ---------- Xendit via FITCO shop order + kredit ----------
// POST {FITCO_API}/api/v1/third-party/shop/order (Bearer) dengan payment_type "xendit-invoices".
// FITCO membuat invoice Xendit & mengembalikan link pembayaran. Balikan { link, orderId }.
// Kredit TIDAK diberikan di sini — server memberi kredit saat order-status mendeteksi FITCO lunas.
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
async function createFitcoXenditOrder(o) {
  // Upaya terbaik supaya Xendit memulangkan user ke SINI, bukan ke platform event 20FIT.
  //
  // Konteks: shop/order TIDAK mendokumentasikan field redirect, dan invoice-nya diterbitkan
  // 20FIT — success_redirect_url bawaannya mengarah ke platform EVENT mereka (endpoint ini
  // aslinya untuk jualan tiket event; kita numpang). Tapi API-nya MENOLERANSI field ekstra,
  // dan app saudara photo.20fit.id sudah mengirim dua field ini pada endpoint sekerabat
  // (/api/v1/third-party/photo/order, lih. artifacts/api-server/src/lib/mainapi.ts) dengan
  // alasan sama.
  //
  // Status: BELUM DIKONFIRMASI apakah 20FIT meneruskannya ke invoice Xendit — tim photo pun
  // menandainya "a dev confirmation". Diteruskan = redirect benar; diabaikan = tidak ada yang
  // rusak. Kredit TIDAK bergantung pada ini: /api/scan/reconcile + polling tetap sumbernya.
  // JANGAN membangun logika kredit di atas asumsi field ini dihormati.
  // Redirect balik dari Xendit -> halaman status khusus /payment/pending (tombol "Cek Status"
  // + auto-cek). external_id = reff_no order kita; halaman juga punya fallback dari localStorage.
  const finishUrl = APP_BASE_URL + "/payment/pending" + (o.reffNo ? ("?external_id=" + encodeURIComponent(o.reffNo)) : "");
  const body = {
    user_id: o.userId || null,
    name: o.name || "Member",
    phone_code: "+62",
    phone: o.phone || "",
    email: o.email || "",
    // SELALU null. promo_code = sistem promosi FITCO sendiri; voucher kita (my20fit_vouchers)
    // bukan promosi mereka — mengirimnya bikin order ditolak 422 "Promotion does not exists".
    // Diskon disampaikan lewat `price` final di items. Field tetap dikirim null karena itu
    // bentuk yang terdokumentasi (photo.20fit.id juga mengirim promo_code: null).
    promo_code: null,
    success_redirect_url: finishUrl,
    failure_redirect_url: APP_BASE_URL + "/payment/failed",
    payment: { payment_type: "xendit-invoices", user_point_booster_id: null, use_fit_points: false },
    items: o.items,
  };
  const url = FITCO_API + "/api/v1/third-party/shop/order";
  // Timeout keras (AbortController): kalau FITCO lambat/menggantung, JANGAN biarkan request
  // menggantung sampai platform (Railway) balas 5xx HTML. Kalau itu terjadi, frontend cuma
  // dapat body non-JSON -> pesan generik "Couldn't start payment." tanpa sebab jelas.
  // Lebih baik gagal cepat dengan pesan JSON yang actionable + tercatat di log.
  const ctrl = new AbortController();
  const t0 = Date.now();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  let r;
  try {
    r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": "Bearer " + o.bearer },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    const aborted = err && (err.name === "AbortError" || err.code === "ABORT_ERR");
    console.error("fitco-shop-order fetch-fail", aborted ? "timeout" : (err && err.message), (Date.now() - t0) + "ms");
    const e = new Error(aborted ? "fitco_timeout" : "fitco_unreachable");
    e.userMessage = aborted
      ? "Pembayaran timeout saat menghubungi 20FIT. Coba lagi sebentar lagi."
      : "Tidak bisa menghubungi server pembayaran 20FIT. Coba lagi.";
    throw e;
  }
  clearTimeout(timer);
  // Baca sbg TEXT dulu lalu parse — supaya body non-JSON (mis. halaman error HTML)
  // tetap ke-log & tidak bikin exception yang tak terbaca.
  const raw = await r.text().catch(() => "");
  let j = {};
  try { j = raw ? JSON.parse(raw) : {}; } catch (e) { j = {}; }
  console.log("fitco-shop-order", r.status, (Date.now() - t0) + "ms", raw ? ("len=" + raw.length) : "empty");
  // Apakah 20FIT MENGHORMATI success_redirect_url yang kita kirim? Ini satu-satunya cara tahu
  // tanpa menunggu konfirmasi dev: kalau responsnya menyebut ulang redirect, cocokkan dengan
  // milik kita. Terbaca di log Railway sbg redirect=ours|theirs|absent.
  //   ours   -> diteruskan; user pulang ke my.20fit.id. Masalah "nyasar ke event" SELESAI.
  //   theirs -> diabaikan & ditimpa (kemungkinan besar ke platform event) -> perlu perubahan
  //             di backend 20FIT; jaring pengaman kita yang menanggung.
  //   absent -> respons tak menyebutkan; cek langsung invoice-nya di dashboard Xendit.
  try {
    const echoed = findScalar(j, ["success_redirect_url", "successRedirectUrl"]);
    console.log("fitco-shop-order redirect=" +
      (!echoed ? "absent" : (String(echoed).indexOf(APP_BASE_URL) === 0 ? "ours" : "theirs")) +
      (echoed ? (" -> " + String(echoed).slice(0, 120)) : ""));
  } catch (e) {}
  if (!r.ok) {
    console.error("fitco-shop-order ERR", r.status, raw.slice(0, 500));
    const e = new Error("fitco_order_" + r.status);
    e.userMessage = (j && (j.message || j.error)) || ("Gagal membuat order pembayaran (HTTP " + r.status + ").");
    throw e;
  }
  const link = findXenditLink(j);
  if (!link) {
    console.error("fitco-shop-order NO-LINK", r.status, raw.slice(0, 500));
    const e = new Error("fitco_no_payment_link");
    e.userMessage = "Order 20FIT dibuat tapi link pembayaran Xendit tidak ditemukan. Coba lagi / hubungi admin.";
    throw e;
  }
  const orderId = findScalar(j, ["sales_order_id", "salesOrderId", "order_id", "order_no", "orderNo"]);
  // order_no khusus (mis. "WEB...") — dipakai endpoint status baru:
  // GET /api/v1/callback/order/{order_no}/payment-status. Bisa null kalau respons tak memuatnya.
  const orderNo = findScalar(j, ["order_no", "orderNo", "order_number", "orderNumber"]);
  return { link: link, orderId: orderId, orderNo: orderNo };
}
// Reff_no unik & aman (<=40, tanpa spasi/slash).
function newReffNo() { return "SCAN" + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36); }
// Kreditkan order scan yang lunas — ATOMIC & IDEMPOTEN lewat RPC my20fit_credit_scan:
// claim order (pending->paid) + tambah scan_credits dalam satu transaksi berkunci baris,
// jadi aman terhadap retry webhook Xendit & order paralel utk user yang sama.
async function creditScanOrder(reff) {
  if (!admin || !reff) return false;
  const { data, error } = await admin.rpc("my20fit_credit_scan", { p_reff: reff });
  if (error) { try { console.error("credit rpc", error.message); } catch (e) {} return false; }
  if (data === true) { try { console.log("xendit credited", reff); } catch (e) {} }
  if (data === true) {
    // Catat pemakaian voucher bila order ini pakai voucher.
    try {
      const { data: o } = await admin.from("my20fit_scan_orders")
        .select("voucher_id,auth_user_id,amount,net_amount").eq("reff_no", reff).limit(1);
      if (o && o[0] && o[0].voucher_id) {
        const disc = Math.max(0, (+o[0].amount || 0) - (+o[0].net_amount || 0));
        await recordVoucherUsage(o[0].voucher_id, o[0].auth_user_id, reff, disc);
      }
    } catch (e) { try { console.error("credit voucher-usage", e.message); } catch (_) {} }
  }
  return data === true;
}
// Catat percobaan pakai voucher (analitik "kode gagal" + redemption rate). Best-effort, non-blocking.
async function logVoucherAttempt(code, uid, result) {
  try { if (admin && code) await admin.from("my20fit_voucher_attempts").insert({ code_tried: String(code).trim().toUpperCase(), auth_user_id: uid || null, result: result }); } catch (e) {}
}
// Wrapper: jalankan validasi lalu CATAT hasilnya sebagai attempt. TIDAK mengubah perilaku validasi.
async function validateVoucherForBuy(rawCode, gross, uid) {
  const r = await validateVoucherForBuyInner(rawCode, gross, uid);
  const code = String(rawCode || "").trim().toUpperCase();
  if (code) {
    let res = "ok";
    if (r && r.error) {
      if (/ditemukan/.test(r.error)) res = "not_found";
      else if (/kedaluwarsa|belum berlaku/.test(r.error)) res = "expired";
      else if (/kuota/.test(r.error)) res = "quota_full";
      else if (/batas pemakaian/.test(r.error)) res = "per_user_limit";
      else res = "not_applicable";
    }
    logVoucherAttempt(code, uid, res);
  }
  return r;
}
// Validasi voucher utk pembelian. gross = harga paket (Rp). Return {voucher, discount, final} atau {error}.
async function validateVoucherForBuyInner(rawCode, gross, uid) {
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
// Catatan: TIDAK ada webhook langsung dari Xendit ke server ini. FITCO yang menerima callback
// Xendit dan menandai order lunas. Server kita memberi kredit (server-authoritative, idempoten)
// saat /api/scan/order-status mendeteksi order FITCO sudah lunas (is_paid).

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

// Self-test konfigurasi pembayaran (non-sensitif): status env, tanpa bocorkan nilai.
app.get("/api/xendit/selftest", (req, res) => {
  return res.json({
    enabled: XENDIT_ENABLED,
    via: "fitco-shop-order",
    fitcoApiUrl: FITCO_API,
    fitcoPartnerTokenSet: !!FITCO_PARTNER_TOKEN,
    ready: !!FITCO_PARTNER_TOKEN,
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

// ---------- Halaman balik-dari-pembayaran (landing redirect dari Xendit) ----------
// /payment/pending (+ alias /payment/success) & /payment/failed. Dilayani eksplisit supaya
// path bertingkat tetap ketemu file-nya (di atas static + catch-all).
app.get(["/payment/pending", "/payment/success"], (req, res) => {
  res.sendFile(path.join(__dirname, "payment-pending.html"));
});
app.get("/payment/failed", (req, res) => {
  res.sendFile(path.join(__dirname, "payment-failed.html"));
});

// ---------- Static (URL bersih tanpa .html) + fallback ----------
// Redirect /halaman.html -> /halaman (querystring dipertahankan), lalu sajikan
// /halaman dari halaman.html lewat opsi extensions. Jadi URL nggak ada ".html" lagi.
app.get(/\.html$/, (req, res) => {
  const clean = req.path.replace(/\.html$/, "");
  res.redirect(302, clean + req.url.slice(req.path.length));
});
// express.static menyajikan SEMUA berkas di root — termasuk source & config internal.
// Blokir berkas/direktori non-publik supaya kode backend & skema DB tidak bisa di-fetch.
app.use((req, res, next) => {
  const p = req.path;
  if (/^\/(server\.js|package\.json|package-lock\.json|railway\.toml|README\.md|CLAUDE\.md)$/i.test(p) ||
      /^\/(db|supabase|docs|archive|node_modules|lib|\.git)(\/|$)/i.test(p)) {
    return res.status(404).sendFile(path.join(__dirname, "index.html"));
  }
  next();
});

// ---------- Langkah 7: swap dashboard admin ke shell baru /admin-v2 ----------
// STAGING: /admin-dashboard OTOMATIS pakai shell baru (deteksi host railway staging atau
//   APP_BASE_URL mengandung "staging") — tanpa menyentuh flag global.
// PRODUKSI: tetap admin lama sampai feature flag `admin_v2` di-ON (default OFF → tak berubah).
// Flag dibaca dari Supabase (dipakai bareng staging+prod), makanya staging pakai deteksi host,
//   bukan flag. Reversible: matikan flag = balik ke admin lama seketika (cache 30 dtk).
// Admin lama SELALU bisa diakses via /admin-dashboard?legacy=1 (jangan terjebak saat ON).
let _adminV2On = false, _adminV2At = 0;
async function adminV2Enabled() {
  if (Date.now() - _adminV2At < 30000) return _adminV2On;
  _adminV2At = Date.now();
  try {
    if (admin) {
      const { data } = await admin.from("my20fit_admin_feature_flags").select("enabled").eq("key", "admin_v2").limit(1);
      _adminV2On = !!(data && data[0] && data[0].enabled);
    }
  } catch (e) { /* pertahankan nilai terakhir */ }
  return _adminV2On;
}
function isStagingReq(req) {
  try {
    const host = String((req.headers && req.headers.host) || "").toLowerCase();
    if (host.indexOf("staging") >= 0) return true;
  } catch (e) {}
  return String(APP_BASE_URL || "").toLowerCase().indexOf("staging") >= 0;
}
app.get("/admin-dashboard", async (req, res, next) => {
  if (req.query && req.query.legacy) return next();          // paksa admin lama
  try { if (isStagingReq(req) || await adminV2Enabled()) return res.redirect(302, "/admin-v2"); } catch (e) {}
  return next();                                              // default: admin lama (static)
});

app.use(express.static(path.join(__dirname), {
  extensions: ["html"], dotfiles: "ignore",
  setHeaders: function (res, filePath) {
    // Cache-busting tanpa hash filename: HTML/JS/CSS SELALU divalidasi ke server sebelum
    // dipakai (ETag/Last-Modified tetap jalan -> balas 304 kalau tak berubah, 200 versi baru
    // kalau berubah). Efeknya: setelah deploy, user OTOMATIS dapat versi terbaru tanpa
    // hard-refresh. Tidak menyentuh localStorage/sesi login -> tidak ada risiko user ke-logout.
    if (/\.(html|js|css)$/i.test(filePath)) res.setHeader("Cache-Control", "no-cache");
  }
}));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Penangkap error terakhir. TANPA ini, error tak tertangani di middleware/route dijawab
// handler bawaan Express sebagai HTML — klien memanggil res.json() atasnya, gagal, lalu
// menampilkan pesan generik ("Couldn't start payment.") tanpa sebab. Untuk /api/ jawabannya
// HARUS selalu JSON supaya kegagalan bisa dibaca & didiagnosis, bukan menyamar.
// Tanda tangan 4-argumen WAJIB — begitu Express mengenali ini sebagai error handler.
app.use((err, req, res, next) => {
  const aborted = err && (err.name === "AbortError" || err.code === "ABORT_ERR");
  const tooBig = err && (err.type === "entity.too.large" || err.status === 413 || err.statusCode === 413);
  try { console.error("unhandled", req.method, req.originalUrl, "-", (err && err.stack) || err); } catch (e) {}
  if (res.headersSent) return next(err);
  if (!req.path.startsWith("/api/")) return res.status(500).send("Internal Server Error");
  if (tooBig) return res.status(413).json({ error: "File terlalu besar (maks 8MB). Coba file yang lebih kecil atau kompres dulu." });
  return res.status(aborted ? 504 : 500).json({
    error: aborted
      ? "Server terlalu lama merespons. Coba lagi sebentar lagi."
      : "Terjadi kesalahan di server. Coba lagi.",
  });
});

// Cek kesiapan env saat start (production). HANYA cetak NAMA var yang belum diset —
// nilai/secret TIDAK pernah ditampilkan. Membantu memverifikasi konfigurasi Railway.
function logEnvReadiness() {
  var core = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_KEY"];
  var important = ["FITCO_API_URL", "FITCO_PARTNER_TOKEN", "MAIL_FROM", "EMAIL_ENVIRONMENT"];
  var optional = ["ADMIN_KEY", "CRON_SECRET", "RESEND_WEBHOOK_SECRET", "EMAIL_TEST_WHITELIST", "MAIL_REPLY_TO", "XENDIT_ENABLED", "API_PHOTO", "PHOTO_SSO_URL", "ARENA_API_URL", "ARENA_API_KEY", "GOOGLE_CLIENT_ID", "META_PIXEL_ID", "WAQI_TOKEN", "APP_BASE_URL"];
  var miss = function (list) { return list.filter(function (k) { return !String(process.env[k] || "").trim(); }); };
  var mc = miss(core), mi = miss(important), mo = miss(optional);
  // Resend API key: nama var Railway = "RESEND.COM_EMAIL_API" (fallback EMAIL_RESEND_API /
  // RESEND_API_KEY). Pakai resolusi kanonik dari lib/email.js (satu sumber kebenaran) supaya
  // key yang di-set dengan nama titik TIDAK salah dilaporkan "belum diset".
  if (!email.envInfo().resend_key_set) mi.push("RESEND.COM_EMAIL_API");
  if (mc.length) console.warn("[20FIT][ENV] ❌ INTI belum diset (app tidak akan jalan benar):", mc.join(", "));
  else console.log("[20FIT][ENV] ✓ Env inti (Supabase) lengkap.");
  if (mi.length) console.warn("[20FIT][ENV] ⚠ PENTING belum diset (login/pembayaran/email bisa gagal):", mi.join(", "));
  if (mo.length) console.log("[20FIT][ENV] ℹ Opsional belum diset:", mo.join(", "));
}

app.listen(PORT, () => {
  console.log(`20FIT Health Profile running on port ${PORT} (prod=${IS_PROD})`);
  try { logEnvReadiness(); } catch (e) {}
});
