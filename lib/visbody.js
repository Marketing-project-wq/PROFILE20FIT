// lib/visbody.js — SATU-SATUNYA jalur bicara ke Visbody WellnessHub API (timbangan S20).
//
// Aturan repo (CLAUDE.md §2/§3): satu sumber kebenaran, kredensial HANYA di server.
// Tidak ada kode lain yang boleh memanggil api-wellnesshub.visbody.ai langsung, dan
// VISBODY_* tidak pernah sampai ke browser.
//
// CommonJS, mengikuti lib/email.js dkk (spesifikasi memakai import/export ESM —
// repo ini CommonJS, jadi disesuaikan; perilakunya sama).
//
// BELUM PERNAH DIUJI KE API ASLI. Kredensial VISBODY_* belum ada saat modul ini ditulis,
// dan tidak ada timbangan untuk dites. Bentuk request/response mengikuti rangkuman
// dokumentasi yang diberikan pemilik; yang BELUM bisa diverifikasi ditandai di bawah.

const crypto = require("crypto");

const BASE = (process.env.VISBODY_API_URL || "https://api-wellnesshub.visbody.ai").replace(/\/$/, "");
const ACCOUNT_KEY = process.env.VISBODY_ACCOUNT_KEY || "";
const ACCOUNT_SECRET = process.env.VISBODY_ACCOUNT_SECRET || "";
const WEBHOOK_SECRET = process.env.VISBODY_WEBHOOK_SECRET || "";
const DEVICE_KEY = process.env.VISBODY_DEVICE_KEY || "";
const DEVICE_SECRET = process.env.VISBODY_DEVICE_SECRET || "";

const TIMEOUT_MS = 15000;

function configured() {
  return !!(ACCOUNT_KEY && ACCOUNT_SECRET);
}

// ---------- HTTP ----------
async function call(path, opts) {
  opts = opts || {};
  const ctrl = new AbortController();
  const timer = setTimeout(function () { ctrl.abort(); }, opts.timeoutMs || TIMEOUT_MS);
  let res;
  try {
    res = await fetch(BASE + path, {
      method: opts.method || "GET",
      headers: opts.headers || {},
      body: opts.body,
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
  let json = null;
  try { json = await res.json(); } catch (e) { /* balasan bukan JSON */ }
  if (!json) throw new Error("Visbody " + path + ": balasan bukan JSON (HTTP " + res.status + ")");
  // Kontrak Visbody: code 0 = sukses. HTTP status TIDAK dipakai sebagai penentu.
  if (json.code !== 0) {
    throw new Error("Visbody " + path + ": code=" + json.code + " " + (json.message || json.error_msg || ""));
  }
  return json.data;
}

// ---------- Token ----------
// Token berumur 1 jam; di-cache dan diperbarui 60 detik sebelum kedaluwarsa.
let _token = null;
let _tokenExp = 0;
let _inflight = null;

async function getToken() {
  if (!configured()) throw new Error("VISBODY_ACCOUNT_KEY/SECRET belum di-set");
  if (_token && Date.now() < _tokenExp - 60000) return _token;
  // Satu permintaan token pada satu waktu: webhook bisa datang beruntun dan tanpa ini
  // tiap-tiapnya akan meminta token sendiri.
  if (_inflight) return _inflight;
  _inflight = (async function () {
    try {
      const d = await call(
        "/api/v2/token?account_key=" + encodeURIComponent(ACCOUNT_KEY) +
        "&account_secret=" + encodeURIComponent(ACCOUNT_SECRET)
      );
      _token = d && d.token;
      if (!_token) throw new Error("Visbody token: balasan tanpa token");
      _tokenExp = Date.now() + (((d && +d.expires_in) || 3600) * 1000);
      return _token;
    } finally {
      _inflight = null;
    }
  })();
  return _inflight;
}

function authHeaders(extra) {
  return Object.assign({ Authorization: "Bearer " + _token }, extra || {});
}

// ---------- API ----------
async function getScanData(scanId, lang) {
  await getToken();
  return call(
    "/api/v2/scan/" + encodeURIComponent(scanId) + "?unit_group=metric&precision=2",
    { headers: authHeaders({ "Accept-Language": lang === "en" ? "en-US" : "id-ID" }) }
  );
}

// user: { id, email, name, sex, height, birthday }
async function bindUser(scanId, deviceId, user) {
  await getToken();
  return call("/api/v2/user/bind", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      scan_id: scanId,
      device_id: deviceId,
      user_info: {
        name: user.name,
        sex: user.sex,
        height: user.height,
        birthday: user.birthday,
        email: user.email,
        third_uid: user.id,       // = auth.users.id Supabase
      },
    }),
  });
}

// PDF sering belum siap tepat setelah scan -> null, bukan lempar error.
async function getPdfUrl(scanId, lang) {
  try {
    await getToken();
    const d = await call(
      "/api/v2/pdf/" + encodeURIComponent(scanId) + "?unit_group=metric",
      { headers: authHeaders({ "Accept-Language": lang === "id" ? "id-ID" : "en-US" }) }
    );
    return (d && d.pdf_url) || null;
  } catch (e) {
    return null;
  }
}

async function listByUser(userId, page, size) {
  await getToken();
  return call(
    "/api/v2/list?third_uid=" + encodeURIComponent(userId) +
    "&page=" + (page || 1) + "&size=" + (size || 10),
    { headers: authHeaders() }
  );
}

// ---------- Verifikasi webhook ----------
// Pola & kehati-hatiannya menyalin verifyResendSignature() di server.js yang sudah terbukti:
// panjang dicek SEBELUM timingSafeEqual (kalau tidak, timingSafeEqual MELEMPAR saat panjang
// beda — bug yang ada di contoh spesifikasi), plus anti-replay 5 menit.
function verifyWebhook(timestamp, rawBody, signature) {
  if (!WEBHOOK_SECRET || !timestamp || !rawBody || !signature) return false;
  const tsSec = parseInt(String(timestamp), 10);
  if (!tsSec) return false;
  // Visbody bisa mengirim detik atau milidetik — keduanya diterima, selisih tetap dibatasi 5 menit.
  const tsMs = String(timestamp).length > 11 ? tsSec : tsSec * 1000;
  if (Math.abs(Date.now() - tsMs) > 300000) return false;

  const signed = String(timestamp) + "." + rawBody.toString("utf8");
  const expected = "sha256=" + crypto.createHmac("sha256", WEBHOOK_SECRET).update(signed).digest("hex");
  const a = Buffer.from(String(signature));
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try { return crypto.timingSafeEqual(a, b); } catch (e) { return false; }
}

// Kredensial yang DIPAKAI TIMBANGAN untuk memanggil kita (arah sebaliknya).
function checkDeviceCreds(key, secret) {
  if (!DEVICE_KEY || !DEVICE_SECRET) return false;
  const a = Buffer.from(String(key || "")), b = Buffer.from(DEVICE_KEY);
  const c = Buffer.from(String(secret || "")), d = Buffer.from(DEVICE_SECRET);
  if (a.length !== b.length || c.length !== d.length) return false;
  try { return crypto.timingSafeEqual(a, b) && crypto.timingSafeEqual(c, d); } catch (e) { return false; }
}

// ---------- Pemetaan body_composition -> kolom tabel ----------
const NUM_FIELDS = [
  "body_weight", "body_fat_percentage", "body_fat_mass", "muscle_mass", "skeletal_muscle",
  "fat_free_mass", "protein", "total_body_water", "intracellular_water", "extracellular_water",
  "extracellular_water_ratio", "total_minerals", "basal_metabolic_rate", "metabolic_age",
  "body_mass_index", "visceral_fat_grade", "waist_hip_ratio", "body_composition_score",
];
const INT_FIELDS = ["basal_metabolic_rate", "metabolic_age", "visceral_fat_grade", "body_composition_score"];

// Tiap item Visbody berbentuk { name, value, unit, ... }. Nilai yang hilang -> null,
// BUKAN 0: 0 kg berat badan itu angka palsu yang akan mencemari chart tren.
function mapBodyComposition(bc) {
  if (!bc || typeof bc !== "object") return null;
  const out = {};
  NUM_FIELDS.forEach(function (k) {
    const item = bc[k];
    const v = item && typeof item === "object" ? item.value : item;
    const n = (v === null || v === undefined || v === "") ? null : Number(v);
    out[k] = (n === null || !isFinite(n)) ? null : (INT_FIELDS.indexOf(k) >= 0 ? Math.round(n) : n);
  });
  out.segmental_muscle_mass = bc.segmental_muscle_mass || null;
  out.segmental_fat_mass = bc.segmental_fat_mass || null;
  return out;
}

module.exports = {
  configured,
  getToken,
  getScanData,
  bindUser,
  getPdfUrl,
  listByUser,
  verifyWebhook,
  checkDeviceCreds,
  mapBodyComposition,
  NUM_FIELDS,
};
