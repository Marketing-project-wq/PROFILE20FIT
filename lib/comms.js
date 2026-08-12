// lib/comms.js — Consent, suppression, token unsubscribe, & gerbang frekuensi anti-spam.
//
// Dipakai bersama oleh: halaman unsubscribe (tanpa login), webhook Resend, dan campaign
// engine (meal reminder + onboarding). Satu tempat untuk semua aturan kepatuhan.
//
// Bucket email:
//   transactional  — OTP/verify/invoice: LEWATI semua aturan, selalu kirim.
//   marketing      — campaign onboarding: maks 1/hari, 3/minggu, jam 10:00/15:00 WIB.
//   meal_reminder  — maks 3/hari pada jendela waktu; consent terpisah.
//
// Timezone: SELALU WIB (Asia/Jakarta) — keputusan pemilik.

const WIB_OFFSET_MIN = 420; // UTC+7
const cfg = require("./email-config");

let _admin = null;
function init(opts) {
  _admin = (opts && opts.admin) || null;
}

// -------- util WIB --------
function nowWib() {
  return new Date(Date.now() + WIB_OFFSET_MIN * 60000);
}
function wibDateStr(d) {
  return (d || nowWib()).toISOString().slice(0, 10);
}
function wibMinutes(d) {
  const x = d || nowWib();
  return x.getUTCHours() * 60 + x.getUTCMinutes();
}

// -------- preferensi komunikasi --------
// Pastikan baris prefs ada; balikan barisnya (dengan unsub_token).
async function ensurePrefs(userId, source) {
  if (!_admin || !userId) return null;
  const { data: got } = await _admin
    .from("my20fit_user_comm_prefs")
    .select("*")
    .eq("user_id", userId)
    .limit(1);
  if (got && got.length) return got[0];
  const { data: made } = await _admin
    .from("my20fit_user_comm_prefs")
    .insert({ user_id: userId, consent_source: source || "auto" })
    .select("*")
    .single();
  return made || null;
}

async function getPrefsByUser(userId) {
  if (!_admin || !userId) return null;
  const { data } = await _admin
    .from("my20fit_user_comm_prefs")
    .select("*")
    .eq("user_id", userId)
    .limit(1);
  return (data && data[0]) || null;
}

async function getPrefsByToken(token) {
  if (!_admin || !token) return null;
  const { data } = await _admin
    .from("my20fit_user_comm_prefs")
    .select("*")
    .eq("unsub_token", token)
    .limit(1);
  return (data && data[0]) || null;
}

// URL unsubscribe untuk email bucket tertentu. Token opaque (tak bocorkan user_id).
async function unsubUrl(baseUrl, userId, bucket) {
  const p = await ensurePrefs(userId);
  if (!p) return baseUrl + "/unsubscribe";
  const c = bucket === "meal_reminder" ? "meal_reminder" : "marketing";
  return baseUrl + "/unsubscribe?token=" + encodeURIComponent(p.unsub_token) + "&c=" + c;
}

// Set consent per bucket. patch: { marketing?:bool, meal_reminder?:bool }
async function setConsentByUser(userId, patch, source) {
  if (!_admin || !userId) return null;
  const row = { updated_at: new Date().toISOString(), consent_updated_at: new Date().toISOString() };
  if (typeof patch.marketing === "boolean") row.consent_marketing = patch.marketing;
  if (typeof patch.meal_reminder === "boolean") row.consent_meal_reminder = patch.meal_reminder;
  if (patch.lang === "id" || patch.lang === "en") row.lang = patch.lang; // tangkap bahasa email user
  if (source) row.consent_source = source;
  await ensurePrefs(userId, source);
  const { data } = await _admin
    .from("my20fit_user_comm_prefs")
    .update(row)
    .eq("user_id", userId)
    .select("*")
    .single();
  return data || null;
}

// -------- suppression --------
async function isSuppressed(emailAddr) {
  if (!_admin || !emailAddr) return false;
  const { data } = await _admin
    .from("my20fit_suppression_list")
    .select("email")
    .eq("email", String(emailAddr).toLowerCase())
    .limit(1);
  return !!(data && data.length);
}

async function addSuppression(emailAddr, userId, reason, permanent) {
  if (!_admin || !emailAddr) return;
  try {
    await _admin.from("my20fit_suppression_list").upsert(
      {
        email: String(emailAddr).toLowerCase(),
        user_id: userId || null,
        reason: reason || "manual",
        is_permanent: permanent !== false,
      },
      { onConflict: "email" }
    );
  } catch (e) {
    console.warn("[comms] addSuppression:", e && e.message);
  }
}

// -------- hitung frekuensi (dari my20fit_message_log) --------
// Berapa email (non-transaksional) ke user dalam N jam terakhir. Optionally per-channel.
async function countRecent(userId, sinceIso, channel) {
  if (!_admin || !userId) return 0;
  let q = _admin
    .from("my20fit_message_log")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .neq("channel", "transactional")
    .in("status", ["sent", "delivered", "opened", "clicked"])
    .gte("created_at", sinceIso);
  if (channel) q = q.eq("channel", channel);
  const { count } = await q;
  return count || 0;
}

/**
 * Gerbang global anti-spam. Dipanggil SEBELUM setiap kirim non-transaksional.
 * @returns {Promise<{ok:boolean, reason?:string}>}
 */
async function canSend(o) {
  o = o || {};
  const bucket = o.bucket; // 'marketing' | 'meal_reminder'
  const userId = o.userId;
  const emailAddr = o.email;
  if (!userId || !emailAddr) return { ok: false, reason: "missing_user_or_email" };

  const prefs = await getPrefsByUser(userId);
  if (!prefs) return { ok: false, reason: "no_prefs" };

  // 1) consent per bucket
  if (bucket === "marketing" && !prefs.consent_marketing) return { ok: false, reason: "no_consent_marketing" };
  if (bucket === "meal_reminder" && !prefs.consent_meal_reminder) return { ok: false, reason: "no_consent_meal_reminder" };

  // 2) suppression / hard bounce
  if (await isSuppressed(emailAddr)) return { ok: false, reason: "suppressed" };

  // 3) batas per bucket (frequency cap). Angka dari lib/email-config (override via env).
  const caps = cfg.caps;
  const now = Date.now();
  const h24 = new Date(now - 24 * 3600 * 1000).toISOString();
  const d7 = new Date(now - 7 * 24 * 3600 * 1000).toISOString();
  const h1 = new Date(now - caps.cooldownMinutes * 60 * 1000).toISOString();

  if (bucket === "marketing") {
    if ((await countRecent(userId, h24, "marketing")) >= caps.marketingDaily) return { ok: false, reason: "cap_marketing_daily" };
    if ((await countRecent(userId, d7, "marketing")) >= caps.marketingWeekly) return { ok: false, reason: "cap_marketing_weekly" };
  } else if (bucket === "meal_reminder") {
    if ((await countRecent(userId, h24, "meal_reminder")) >= caps.mealDaily) return { ok: false, reason: "cap_meal_daily" };
  }

  // 4) jangan ada email non-transaksional lain dalam window cooldown (anti-tumpuk)
  if ((await countRecent(userId, h1, null)) >= 1) return { ok: false, reason: "cooldown_" + caps.cooldownMinutes + "m" };

  // 5) pause meal reminder
  if (bucket === "meal_reminder" && prefs.reminder_paused_at) return { ok: false, reason: "reminder_paused" };

  return { ok: true, prefs };
}

module.exports = {
  init,
  nowWib,
  wibDateStr,
  wibMinutes,
  ensurePrefs,
  getPrefsByUser,
  getPrefsByToken,
  unsubUrl,
  setConsentByUser,
  isSuppressed,
  addSuppression,
  countRecent,
  canSend,
};
