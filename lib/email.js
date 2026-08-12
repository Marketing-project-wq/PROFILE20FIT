// lib/email.js — SATU-SATUNYA jalur kirim email untuk seluruh aplikasi (Resend).
//
// Aturan repo (CLAUDE.md §2/§3): satu sumber kebenaran. TIDAK ADA kode yang boleh
// memanggil Resend API langsung selain modul ini. Provider & SMTP lama sudah dicabut total.
//
// Fitur:
//  - Validasi env saat startup (assertConfig) — dipanggil server.js, gagal dengan pesan jelas.
//  - Pengaman environment: di luar production, HANYA kirim ke EMAIL_TEST_WHITELIST.
//  - Retry exponential backoff untuk error sementara (network / 429 / 5xx).
//    TIDAK retry untuk error permanen (4xx: alamat invalid, domain diblokir, dll).
//  - Idempotency: header Idempotency-Key ke Resend + pre-check ke my20fit_message_log.
//  - Semua percobaan dicatat ke my20fit_message_log (best-effort; tak menggagalkan kirim).
//  - Header List-Unsubscribe + List-Unsubscribe-Post one-click untuk email non-transaksional.
//
// Timezone pengiriman: SELALU WIB (Asia/Jakarta) — keputusan pemilik. Modul ini tak
// mengurus jadwal; penjadwalan WIB ada di scheduler (server.js).

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const cfg = require("./email-config");

// Nama env di Railway = "RESEND.COM_EMAIL_API" (ada titik → wajib bracket notation).
// Fallback ke EMAIL_RESEND_API / RESEND_API_KEY supaya tetap jalan di env lain.
const RESEND_API_KEY =
  process.env["RESEND.COM_EMAIL_API"] ||
  process.env.EMAIL_RESEND_API ||
  process.env.RESEND_API_KEY ||
  "";
const MAIL_FROM = process.env.MAIL_FROM || "20FIT <no-reply@20fit.id>";
// reply-to opsional (mis. cs@20fit.id). Kalau kosong, tak dikirim.
const MAIL_REPLY_TO = process.env.MAIL_REPLY_TO || "";

// production | staging | development. Default: turunkan dari NODE_ENV.
const EMAIL_ENVIRONMENT = String(
  process.env.EMAIL_ENVIRONMENT ||
    (process.env.NODE_ENV === "production" ? "production" : "development")
).toLowerCase();

const TEST_WHITELIST = String(process.env.EMAIL_TEST_WHITELIST || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const IS_PROD_EMAIL = EMAIL_ENVIRONMENT === "production";

// Supabase service client di-inject dari server.js (untuk my20fit_message_log).
let _admin = null;
function init(opts) {
  _admin = (opts && opts.admin) || null;
}

// Dipanggil server.js saat startup. Balikan daftar env yang hilang (kosong = OK).
function assertConfig() {
  const missing = [];
  if (!RESEND_API_KEY) missing.push("EMAIL_RESEND_API");
  if (!MAIL_FROM) missing.push("MAIL_FROM");
  return missing;
}

function envInfo() {
  return {
    environment: EMAIL_ENVIRONMENT,
    is_prod: IS_PROD_EMAIL,
    from: MAIL_FROM,
    reply_to: MAIL_REPLY_TO || null,
    whitelist_count: TEST_WHITELIST.length,
    resend_key_set: !!RESEND_API_KEY,
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Cek status domain di Resend (verified + SPF/DKIM/DMARC) untuk panel kesehatan admin.
// Dijalankan di server Railway (punya egress ke Resend). Read-only.
async function checkDomains() {
  if (!RESEND_API_KEY) return { ok: false, error: "RESEND key belum di-set" };
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 10000);
    const resp = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: "Bearer " + RESEND_API_KEY },
      signal: controller.signal,
    });
    clearTimeout(t);
    const body = await resp.json().catch(() => ({}));
    if (!resp.ok) return { ok: false, error: (body && body.message) || ("HTTP " + resp.status) };
    const list = (body && body.data) || [];
    // Ringkas: status verifikasi per domain + record SPF/DKIM/DMARC kalau ada.
    const domains = list.map((d) => {
      const recs = Array.isArray(d.records) ? d.records : [];
      const findRec = (re) => recs.find((r) => re.test(String(r.record || r.type || r.name || "")));
      return {
        name: d.name,
        status: d.status, // 'verified' | 'pending' | 'not_started' | 'failed'
        spf: (findRec(/spf/i) || {}).status || null,
        dkim: (findRec(/dkim/i) || {}).status || null,
        dmarc: (findRec(/dmarc/i) || {}).status || null,
      };
    });
    return { ok: true, domains };
  } catch (e) {
    return { ok: false, error: (e && e.message) || String(e) };
  }
}

// Catat 1 baris ke my20fit_message_log. Best-effort: error di sini TIDAK menggagalkan kirim.
async function logMessage(row) {
  if (!_admin) return null;
  try {
    const { data, error } = await _admin
      .from("my20fit_message_log")
      .insert(row)
      .select("id")
      .single();
    if (error) {
      // Tabel mungkin belum di-migrate (Fase 1 vs Fase 2). Jangan crash.
      console.warn("[email] message_log insert gagal:", error.message);
      return null;
    }
    return data ? data.id : null;
  } catch (e) {
    console.warn("[email] message_log exception:", e && e.message);
    return null;
  }
}

async function updateMessage(id, patch) {
  if (!_admin || !id) return;
  try {
    await _admin.from("my20fit_message_log").update(patch).eq("id", id);
  } catch (e) {
    /* best-effort */
  }
}

// Cek idempotency: apakah email dengan idempotency_key ini sudah pernah terkirim sukses?
async function alreadySent(idempotencyKey) {
  if (!_admin || !idempotencyKey) return false;
  try {
    const { data } = await _admin
      .from("my20fit_message_log")
      .select("id,status")
      .eq("idempotency_key", idempotencyKey)
      .in("status", ["sent", "delivered", "opened", "clicked"])
      .limit(1);
    return !!(data && data.length);
  } catch (e) {
    return false;
  }
}

// Apakah HTTP status dari Resend layak di-retry (sementara)?
function isTransientStatus(status) {
  return status === 429 || (status >= 500 && status <= 599);
}

/**
 * Kirim satu email lewat Resend.
 *
 * @param {object} o
 * @param {string|string[]} o.to        alamat tujuan
 * @param {string}   o.subject
 * @param {string}   o.html
 * @param {boolean} [o.transactional]   true = email transaksional (OTP/verify/invoice).
 *                                      TIDAK menambahkan header unsubscribe.
 * @param {string}  [o.unsubscribeUrl]  wajib untuk email marketing/reminder (non-transaksional).
 * @param {string}  [o.idempotencyKey]  cegah kirim ganda.
 * @param {string}  [o.channel]         'transactional' | 'marketing' | 'meal_reminder'
 * @param {string}  [o.campaignId]
 * @param {string}  [o.templateId]
 * @param {string}  [o.mealWindow]      'breakfast' | 'lunch' | 'dinner'
 * @param {string}  [o.language]        'id' | 'en' — bahasa saat kirim (dicatat di log)
 * @param {string}  [o.userId]
 * @param {string}  [o.replyTo]
 * @param {object}  [o.tags]            { key: value } → Resend tags
 * @returns {Promise<{ok:boolean, id?:string, skipped?:boolean, reason?:string, error?:string, status?:number}>}
 */
async function send(o) {
  o = o || {};
  const toList = (Array.isArray(o.to) ? o.to : [o.to])
    .map((x) => String(x || "").trim())
    .filter(Boolean);
  const channel = o.channel || (o.transactional ? "transactional" : "marketing");
  const to0 = (toList[0] || "").toLowerCase();

  // Baris log dasar (dipakai untuk semua cabang).
  const baseLog = {
    user_id: o.userId || null,
    channel: channel,
    campaign_id: o.campaignId || null,
    template_id: o.templateId || null,
    meal_window: o.mealWindow || null,
    subject: o.subject || null,
    language: o.language || null, // bahasa saat kirim (butuh migration 010)
    idempotency_key: o.idempotencyKey || null,
  };

  if (!toList.length) {
    return { ok: false, error: "recipient kosong" };
  }

  // 0) KILL SWITCH global (EMAIL_KILL_SWITCH=1) → hentikan SEMUA kirim, termasuk
  //    transaksional. Dicatat sebagai skipped, tidak menyentuh Resend.
  if (cfg.killSwitch()) {
    console.warn(`[email] KILL SWITCH aktif — DIBLOKIR: to=${to0} subject="${o.subject || ""}"`);
    await logMessage(
      Object.assign({}, baseLog, { status: "skipped_killswitch", error_message: "EMAIL_KILL_SWITCH aktif" })
    );
    return { ok: true, skipped: true, reason: "kill_switch" };
  }

  // 1) Idempotency guard.
  if (o.idempotencyKey && (await alreadySent(o.idempotencyKey))) {
    return { ok: true, skipped: true, reason: "already_sent" };
  }

  // 2) Pengaman environment: di luar production, hanya whitelist yang benar-benar dikirim.
  if (!IS_PROD_EMAIL && TEST_WHITELIST.indexOf(to0) === -1) {
    console.warn(
      `[email][${EMAIL_ENVIRONMENT}] DIBLOKIR (bukan production, di luar whitelist): ` +
        `to=${to0} subject="${o.subject || ""}" — dicatat saja, TIDAK dikirim.`
    );
    await logMessage(
      Object.assign({}, baseLog, {
        status: "skipped_env",
        error_message: `blocked: EMAIL_ENVIRONMENT=${EMAIL_ENVIRONMENT}, not whitelisted`,
      })
    );
    return { ok: true, skipped: true, reason: "non_prod_not_whitelisted" };
  }

  // 3) Header. Unsubscribe one-click untuk non-transaksional (syarat Gmail/Yahoo bulk).
  const headers = {};
  if (!o.transactional) {
    if (!o.unsubscribeUrl) {
      // Non-transaksional TANPA unsubscribe = pelanggaran kepatuhan. Tolak, jangan kirim.
      await logMessage(
        Object.assign({}, baseLog, {
          status: "failed",
          error_message: "non-transactional tanpa unsubscribeUrl (ditolak)",
        })
      );
      return { ok: false, error: "email non-transaksional wajib punya unsubscribeUrl" };
    }
    headers["List-Unsubscribe"] = `<${o.unsubscribeUrl}>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }

  const payload = {
    from: MAIL_FROM,
    to: toList,
    subject: o.subject || "",
    html: o.html || "",
  };
  if (Object.keys(headers).length) payload.headers = headers;
  const replyTo = o.replyTo || MAIL_REPLY_TO;
  if (replyTo) payload.reply_to = replyTo;
  if (o.tags && typeof o.tags === "object") {
    payload.tags = Object.keys(o.tags).map((k) => ({
      name: k,
      value: String(o.tags[k]),
    }));
  }

  // 4) Kirim dengan retry backoff (hanya untuk error sementara).
  const MAX_ATTEMPTS = 4;
  const BACKOFF_MS = [500, 1500, 4000]; // jeda sebelum attempt ke-2,3,4
  let lastErr = "";
  let lastStatus = 0;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let status = 0;
    try {
      const reqHeaders = {
        Authorization: "Bearer " + RESEND_API_KEY,
        "Content-Type": "application/json",
      };
      if (o.idempotencyKey) reqHeaders["Idempotency-Key"] = o.idempotencyKey;

      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 20000);
      const resp = await fetch(RESEND_ENDPOINT, {
        method: "POST",
        headers: reqHeaders,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(t);
      status = resp.status;
      lastStatus = status;
      const bodyJson = await resp.json().catch(() => ({}));

      if (resp.ok && bodyJson && bodyJson.id) {
        await logMessage(
          Object.assign({}, baseLog, {
            status: "sent",
            provider_message_id: bodyJson.id,
            sent_at: new Date().toISOString(),
          })
        );
        return { ok: true, id: bodyJson.id };
      }

      // Error dari Resend.
      lastErr =
        (bodyJson && (bodyJson.message || bodyJson.name)) ||
        `HTTP ${status}`;

      if (!isTransientStatus(status)) {
        // Permanen (4xx non-429): JANGAN retry.
        await logMessage(
          Object.assign({}, baseLog, {
            status: "failed",
            error_message: `permanen ${status}: ${lastErr}`.slice(0, 500),
          })
        );
        return { ok: false, error: lastErr, status };
      }
      // else: transient → jatuh ke retry di bawah.
    } catch (e) {
      // Network / abort / timeout = sementara.
      lastErr = (e && e.message) || String(e);
      lastStatus = 0;
    }

    if (attempt < MAX_ATTEMPTS) {
      await sleep(BACKOFF_MS[attempt - 1] || 4000);
    }
  }

  // Semua attempt gagal (transient habis).
  await logMessage(
    Object.assign({}, baseLog, {
      status: "failed",
      error_message: `gagal setelah ${MAX_ATTEMPTS}x: ${lastErr}`.slice(0, 500),
    })
  );
  return { ok: false, error: lastErr, status: lastStatus };
}

module.exports = { init, assertConfig, envInfo, checkDomains, send };
