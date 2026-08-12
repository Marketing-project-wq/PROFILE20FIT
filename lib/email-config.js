// lib/email-config.js — SATU tempat semua angka guardrail anti-spam.
// Semua bisa di-override lewat env Railway TANPA ubah kode/deploy ulang.
// Dipakai oleh: email.js (kill switch), comms.js (frequency cap), campaigns.js
// (backlog expiry + circuit breaker).

function num(name, def) {
  const v = parseFloat(process.env[name]);
  return Number.isFinite(v) ? v : def;
}
function bool(name) {
  const v = String(process.env[name] || "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "on" || v === "yes";
}

module.exports = {
  // KILL SWITCH global: set EMAIL_KILL_SWITCH=1 di Railway → SEMUA pengiriman
  // berhenti seketika (termasuk transaksional), tanpa deploy. Fungsi (bukan nilai)
  // supaya dievaluasi tiap kirim → efektif segera setelah env diubah + restart.
  killSwitch: () => bool("EMAIL_KILL_SWITCH"),

  // Frequency cap (hanya email non-transaksional). Ubah via env.
  caps: {
    marketingDaily: num("EMAIL_CAP_MARKETING_DAILY", 1), // maks marketing/user/hari
    marketingWeekly: num("EMAIL_CAP_MARKETING_WEEKLY", 3), // maks marketing/user/minggu
    mealDaily: num("EMAIL_CAP_MEAL_DAILY", 3), // maks meal reminder/user/hari
    cooldownMinutes: num("EMAIL_COOLDOWN_MINUTES", 60), // jeda antar email non-transaksional
  },

  // Backlog: step onboarding yang telat LEBIH dari jam ini → DILEWATI (advance
  // tanpa kirim), bukan dikirim terlambat. Mencegah burst saat cron mati lama.
  backlogExpiryHours: num("EMAIL_BACKLOG_EXPIRY_HOURS", 48),

  // Circuit breaker (auto-stop campaign lewat kill-switch flag). Persen.
  circuitBreaker: {
    minVolume: num("EMAIL_CB_MIN_VOLUME", 50), // butuh volume ini dulu (7 hari) agar rate tak liar
    complaintPct: num("EMAIL_CB_COMPLAINT_PCT", 0.1),
    bouncePct: num("EMAIL_CB_BOUNCE_PCT", 2),
    unsubPct: num("EMAIL_CB_UNSUB_PCT", 0.5),
  },
};
