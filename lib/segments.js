// lib/segments.js — Segment engine untuk blast email admin.
//
// PEMISAHAN WAJIB (aturan keselamatan prompt):
//   SEGMEN    = siapa yang cocok secara bisnis (compute di sini)
//   KELAYAKAN = siapa yang BOLEH dikirimi (applyEligibility — TIDAK bisa di-bypass)
// Marketing memilih segmen; sistem yang menyaring consent/suppression/frekuensi.
// Tidak ada parameter override / "kirim ke semua". Kalau ada, itu bug kritis.
//
// Preview HANYA nama, email, tanggal signup, sumber — TANPA data kesehatan.
// Timezone WIB.

const WIB_OFFSET_MIN = 420;
function wibNow() { return new Date(Date.now() + WIB_OFFSET_MIN * 60000); }

// ---------- Preset segmen (bebas data kesehatan) ----------
const PRESETS = [
  { id: "onboarded_no_scan", name: "Onboarded belum pernah scan", desc: "onboarding_completed = true DAN total_scan = 0" },
  { id: "scanned_then_stopped", name: "Pernah scan tapi berhenti", desc: "pernah scan DAN scan terakhir > 14 hari lalu" },
  { id: "active_7d", name: "Aktif 7 hari terakhir", desc: "ada aktivitas dalam 7 hari" },
  { id: "buyers_this_month", name: "Pembeli bulan ini", desc: "ada pembelian sukses bulan berjalan" },
  { id: "never_bought", name: "Belum pernah beli", desc: "total_pembelian = 0" },
  { id: "credit_low", name: "Credit hampir habis", desc: "sisa_credit < 2" },
  { id: "inactive_30d", name: "Tidak aktif 30 hari", desc: "tidak ada aktivitas 30 hari" },
];
const PRESET_IDS = PRESETS.map((p) => p.id);

// Muat data dasar sekali (876 member = kecil). Balikan map/set untuk semua preset.
async function loadBase(admin) {
  const nowMs = Date.now();
  const [{ data: profiles }, { data: ledger }, { data: orders }, { data: acts }] = await Promise.all([
    admin.from("my20fit_profile").select("auth_user_id,email,full_name,created_at,onboarding_completed,scan_credits,scan_count").limit(20000),
    admin.from("my20fit_scan_ledger").select("auth_user_id,created_at,reason").like("reason", "consume%").limit(50000),
    admin.from("my20fit_scan_orders").select("auth_user_id,paid_at,status").eq("status", "paid").limit(50000),
    admin.from("my20fit_user_activity").select("auth_user_id,last_active_at").limit(50000),
  ]);

  const lastScan = new Map(); // uid -> ms terbaru
  for (const r of ledger || []) {
    if (!r.auth_user_id || !r.created_at) continue;
    const t = new Date(r.created_at).getTime();
    if (!lastScan.has(r.auth_user_id) || t > lastScan.get(r.auth_user_id)) lastScan.set(r.auth_user_id, t);
  }
  const lastBuy = new Map();
  for (const o of orders || []) {
    if (!o.auth_user_id || !o.paid_at) continue;
    const t = new Date(o.paid_at).getTime();
    if (!lastBuy.has(o.auth_user_id) || t > lastBuy.get(o.auth_user_id)) lastBuy.set(o.auth_user_id, t);
  }
  const lastActive = new Map();
  for (const a of acts || []) {
    if (a.auth_user_id && a.last_active_at) lastActive.set(a.auth_user_id, new Date(a.last_active_at).getTime());
  }
  // awal bulan berjalan (WIB)
  const w = wibNow();
  const monthStart = Date.UTC(w.getUTCFullYear(), w.getUTCMonth(), 1) - WIB_OFFSET_MIN * 60000;

  return { profiles: profiles || [], lastScan, lastBuy, lastActive, nowMs, monthStart };
}

// Hitung segmen (preset) → array {user_id, email, full_name, created_at}.
async function computeSegment(admin, presetId) {
  if (PRESET_IDS.indexOf(presetId) < 0) throw new Error("preset tidak dikenal");
  const b = await loadBase(admin);
  const D14 = 14 * 86400000, D7 = 7 * 86400000, D30 = 30 * 86400000;
  const out = [];
  for (const p of b.profiles) {
    const uid = p.auth_user_id;
    if (!uid || !p.email) continue;
    const scannedAt = b.lastScan.get(uid);
    const boughtAt = b.lastBuy.get(uid);
    const activeAt = b.lastActive.get(uid);
    let hit = false;
    switch (presetId) {
      case "onboarded_no_scan": hit = !!p.onboarding_completed && !scannedAt && !(p.scan_count > 0); break;
      case "scanned_then_stopped": hit = !!scannedAt && b.nowMs - scannedAt > D14; break;
      case "active_7d": hit = !!activeAt && b.nowMs - activeAt <= D7; break;
      case "buyers_this_month": hit = !!boughtAt && boughtAt >= b.monthStart; break;
      case "never_bought": hit = !boughtAt; break;
      case "credit_low": hit = (p.scan_credits || 0) < 2; break;
      case "inactive_30d": hit = !activeAt || b.nowMs - activeAt > D30; break;
    }
    if (hit) out.push({ user_id: uid, email: p.email, full_name: p.full_name || null, created_at: p.created_at });
  }
  return out;
}

// ---------- Filter KELAYAKAN (tak bisa di-bypass) ----------
// bucket selalu 'marketing' untuk blast campaign. Balikan { eligible, excluded, breakdown }.
async function applyEligibility(admin, matched, bucket) {
  bucket = bucket || "marketing";
  const uids = matched.map((m) => m.user_id);
  const emails = matched.map((m) => String(m.email).toLowerCase());
  if (!uids.length) return { eligible: [], excluded: [], breakdown: {} };

  // Ambil sinyal kelayakan secara batch.
  const [{ data: prefs }, { data: supp }, { data: enroll }, { data: recent }] = await Promise.all([
    admin.from("my20fit_user_comm_prefs").select("user_id,consent_marketing,consent_meal_reminder").in("user_id", uids),
    admin.from("my20fit_suppression_list").select("email,reason").in("email", emails),
    admin.from("my20fit_campaign_enrollments").select("user_id").eq("status", "active").in("user_id", uids),
    admin.from("my20fit_message_log").select("user_id,created_at,channel")
      .in("user_id", uids).neq("channel", "transactional")
      .gte("created_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString()),
  ]);

  const consentOk = new Set();
  for (const p of prefs || []) {
    if (bucket === "marketing" && p.consent_marketing) consentOk.add(p.user_id);
    if (bucket === "meal_reminder" && p.consent_meal_reminder) consentOk.add(p.user_id);
  }
  const suppReason = new Map();
  for (const s of supp || []) suppReason.set(String(s.email).toLowerCase(), s.reason);
  const inCampaign = new Set((enroll || []).map((e) => e.user_id));
  const recent24h = new Set((recent || []).map((r) => r.user_id));

  const breakdown = { no_consent: 0, suppressed_unsubscribe: 0, suppressed_bounce: 0, suppressed_complaint: 0, suppressed_dormant: 0, suppressed_other: 0, in_other_campaign: 0, recent_24h: 0 };
  const eligible = [];
  const excluded = [];
  for (const m of matched) {
    const em = String(m.email).toLowerCase();
    // Urutan cek → hitung SATU alasan utama per orang (untuk rincian yang jelas).
    if (!consentOk.has(m.user_id)) { breakdown.no_consent++; excluded.push({ ...m, reason: "no_consent" }); continue; }
    if (suppReason.has(em)) {
      const r = suppReason.get(em);
      if (r === "unsubscribe") breakdown.suppressed_unsubscribe++;
      else if (r === "hard_bounce") breakdown.suppressed_bounce++;
      else if (r === "spam_complaint") breakdown.suppressed_complaint++;
      else if (r === "dormant") breakdown.suppressed_dormant++;
      else breakdown.suppressed_other++;
      excluded.push({ ...m, reason: "suppressed:" + r }); continue;
    }
    if (inCampaign.has(m.user_id)) { breakdown.in_other_campaign++; excluded.push({ ...m, reason: "in_other_campaign" }); continue; }
    if (recent24h.has(m.user_id)) { breakdown.recent_24h++; excluded.push({ ...m, reason: "recent_24h" }); continue; }
    eligible.push(m);
  }
  return { eligible, excluded, breakdown };
}

// Ambil "sumber" (utm_source) untuk sampel preview.
async function attachSource(admin, sample) {
  const uids = sample.map((s) => s.user_id);
  if (!uids.length) return sample;
  const { data } = await admin.from("my20fit_signup_attribution").select("auth_user_id,utm_source,referrer_host").in("auth_user_id", uids);
  const src = new Map();
  for (const a of data || []) src.set(a.auth_user_id, a.utm_source || a.referrer_host || null);
  return sample.map((s) => ({ ...s, source: src.get(s.user_id) || null }));
}

// Preview lengkap untuk 1 preset: total cocok vs layak + rincian + sampel 20 (tanpa data kesehatan).
async function previewSegment(admin, presetId) {
  const matched = await computeSegment(admin, presetId);
  const { eligible, breakdown } = await applyEligibility(admin, matched, "marketing");
  let sample = eligible.slice(0, 20).map((m) => ({
    user_id: m.user_id, full_name: m.full_name, email: m.email, signup_at: m.created_at,
  }));
  sample = await attachSource(admin, sample);
  return {
    preset_id: presetId,
    total_matched: matched.length,
    total_eligible: eligible.length,
    total_excluded: matched.length - eligible.length,
    exclusion_breakdown: breakdown,
    sample, // nama, email, signup, source — TANPA data kesehatan
  };
}

module.exports = { PRESETS, PRESET_IDS, computeSegment, applyEligibility, previewSegment };
