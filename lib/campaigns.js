// lib/campaigns.js — Engine campaign email: MEAL REMINDER (3x/hari) + ONBOARDING drip.
//
// Semua kirim lewat lib/email.js dan LULUS gerbang lib/comms.canSend() dulu.
// Timezone: SELALU WIB (Asia/Jakarta). Template email dibangun sebagai fungsi dengan
// SLOT teks (subject/headline/body/signoff) — struktur/warna/layout TIDAK berubah antar
// varian (hanya teks). JANGAN mengarang statistik/testimoni: pakai [[BUTUH DATA: ...]].

const HERO_IMG =
  "https://media.20fit.id/wp-content/uploads/2026/08/2441260d-37ce-4764-8ea5-5c66fae5e538-1.jpeg";
const LOGO_IMG = "https://media.20fit.id/wp-content/uploads/2026/05/Logo-20fit.png";
const RED = "#D62828";
const INK = "#141414";
const PAGE_BG = "#F5F4F2";
const PILL_BG = "#FDECEC";

// -------- util waktu --------
function hhmmToMin(t) {
  const p = String(t || "00:00").split(":");
  return (+p[0] || 0) * 60 + (+p[1] || 0);
}
function withinTol(nowMin, targetMin, tol) {
  let d = Math.abs(nowMin - targetMin);
  d = Math.min(d, 1440 - d);
  return d <= tol;
}
// cal_items[].t = "HH:MM" (WIB device). Apakah ada log di rentang [lo,hi] menit?
function loggedInRange(items, range) {
  if (!Array.isArray(items)) return false;
  for (const it of items) {
    if (!it || !it.t) continue;
    const m = hhmmToMin(it.t);
    if (m >= range[0] && m <= range[1]) return true;
  }
  return false;
}
// day-of-year deterministik (rotasi varian; bukan acak → tak mungkin sama 2 hari beruntun).
function dayOfYear(dateStr) {
  const d = new Date(dateStr + "T00:00:00Z");
  const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 0));
  return Math.floor((d - start) / 86400000);
}

// -------- varian teks meal reminder (3-4 per window) --------
// Nada casual-profesional, Bahasa Indonesia. TIDAK ada klaim/angka karangan.
const MEAL_VARIANTS = {
  breakfast: [
    { subject: "Sarapan? Scan dulu.", headline: "SARAPAN? SCAN DULU.", body: "Sebelum mulai hari, potret sarapanmu dulu. Cuma butuh beberapa detik untuk mencatatnya.", signoff: "Selamat sarapan! 🍳" },
    { subject: "Mulai pagi dengan 1 scan", headline: "MULAI PAGI DENGAN 1 SCAN", body: "Catat sarapanmu supaya gambaran harianmu lengkap sejak pagi. Tinggal foto, sisanya otomatis.", signoff: "Semangat pagi! ☀️" },
    { subject: "Jangan lupa catat sarapan", headline: "CATAT SARAPANMU", body: "Foto piring sarapanmu — biar pemantauan makanmu hari ini dimulai dari langkah kecil ini.", signoff: "Have a great breakfast! 🍳" },
  ],
  lunch: [
    { subject: "Jam makan siang? Scan dulu.", headline: "JAM MAKAN SIANG? SCAN DULU.", body: "Sebelum lanjut kerja, potret makan siangmu dulu. Cepat, tinggal foto.", signoff: "Selamat makan siang! 🍱" },
    { subject: "Makan siang, catat dulu", headline: "MAKAN SIANG, CATAT DULU", body: "Satu foto makan siang bikin catatan harianmu tetap jalan. Nggak sampai semenit.", signoff: "Enjoy your lunch! 🥗" },
    { subject: "Scan makan siangmu", headline: "SCAN MAKAN SIANGMU", body: "Potret makan siangmu untuk memantau asupan hari ini — tanpa ribet menghitung manual.", signoff: "Selamat makan! 🍱" },
  ],
  dinner: [
    { subject: "Makan malam siap? Scan dulu.", headline: "MAKAN MALAM SIAP? SCAN DULU.", body: "Sebelum menikmati makan malam, potret dulu untuk melengkapi catatan harianmu.", signoff: "Selamat makan malam! 🍽️" },
    { subject: "Tutup hari dengan 1 scan", headline: "TUTUP HARI DENGAN 1 SCAN", body: "Foto makan malammu — langkah terakhir memantau asupan hari ini. Cukup sekali potret.", signoff: "Have a great dinner! 🌙" },
    { subject: "Catat makan malammu", headline: "CATAT MAKAN MALAMMU", body: "Potret makan malammu supaya gambaran harianmu utuh sampai malam ini.", signoff: "Selamat malam! 🌙" },
  ],
};
const WINDOW_LABEL = { breakfast: "BREAKFAST", lunch: "LUNCHTIME", dinner: "DINNERTIME" };
const WINDOW_LOGRANGE = { breakfast: [240, 659], lunch: [660, 1019], dinner: [1020, 1439] };

function pickVariant(win, dateStr) {
  const arr = MEAL_VARIANTS[win] || MEAL_VARIANTS.lunch;
  return arr[dayOfYear(dateStr) % arr.length];
}

// -------- builder HTML meal reminder (table-based, aman semua email client) --------
// Slot yang berubah antar varian: subject/headline/body/signoff. Sisanya TETAP.
function mealReminderHtml(win, v, scanUrl, unsubscribeUrl) {
  const label = WINDOW_LABEL[win] || "MEAL";
  const preheader = v.body;
  const step = (n, t, s) =>
    "<td width='33%' valign='top' align='center' style='padding:0 6px'>" +
    "<div style='width:34px;height:34px;line-height:34px;border-radius:50%;background:" + RED + ";color:#fff;font-weight:bold;font-size:15px;margin:0 auto 8px'>" + n + "</div>" +
    "<div style='font-size:13px;font-weight:bold;color:" + INK + "'>" + t + "</div>" +
    "<div style='font-size:11px;color:#8a8175;margin-top:2px'>" + s + "</div></td>";

  return (
    "<!DOCTYPE html><html lang='id' xmlns:v='urn:schemas-microsoft-com:vml' xmlns:o='urn:schemas-microsoft-com:office:office'><head>" +
    "<meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>" +
    "<meta http-equiv='X-UA-Compatible' content='IE=edge'>" +
    "<link href='https://fonts.googleapis.com/css2?family=Anton&display=swap' rel='stylesheet'>" +
    "<!--[if mso]><style>*{font-family:Arial,sans-serif !important}</style><![endif]-->" +
    "<style>@media only screen and (max-width:600px){.card{width:100% !important}.hero{width:100% !important;height:auto !important}}</style>" +
    "</head><body style='margin:0;padding:0;background:" + PAGE_BG + "'>" +
    // preheader tersembunyi
    "<div style='display:none;max-height:0;overflow:hidden;opacity:0'>" + preheader + "</div>" +
    "<table role='presentation' width='100%' cellpadding='0' cellspacing='0' style='background:" + PAGE_BG + "'><tr><td align='center' style='padding:24px 12px'>" +
    "<table role='presentation' class='card' width='600' cellpadding='0' cellspacing='0' style='width:600px;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden'>" +
    // hero clickable
    "<tr><td style='padding:0'><a href='" + scanUrl + "' target='_blank'><img class='hero' src='" + HERO_IMG + "' width='600' alt='Scan makananmu di 20FIT' style='display:block;width:600px;max-width:100%;height:auto;border:0'></a></td></tr>" +
    "<tr><td style='padding:26px 34px 6px'>" +
    // time pill
    "<span style='display:inline-block;background:" + PILL_BG + ";color:" + RED + ";font-size:12px;font-weight:bold;letter-spacing:1.5px;padding:6px 14px;border-radius:999px'>" + label + "</span>" +
    // headline (Anton, fallback Arial Black)
    "<h1 style=\"margin:14px 0 8px;font-family:'Anton',Arial Black,Arial,sans-serif;font-weight:400;text-transform:uppercase;font-size:30px;line-height:1.1;color:" + INK + "\">" + v.headline + "</h1>" +
    "<p style='margin:0;font-size:15px;line-height:1.6;color:#4a453d'>" + v.body + "</p></td></tr>" +
    // panel 3 langkah
    "<tr><td style='padding:20px 28px 6px'><table role='presentation' width='100%' cellpadding='0' cellspacing='0' style='background:#faf8f5;border-radius:12px'><tr><td style='padding:18px 8px'><table role='presentation' width='100%' cellpadding='0' cellspacing='0'><tr>" +
    step("1", "Snap", "Foto makananmu") + step("2", "Scan", "Analisa otomatis") + step("3", "Done", "Tercatat harian") +
    "</tr></table></td></tr></table></td></tr>" +
    // CTA + VML fallback Outlook
    "<tr><td align='center' style='padding:22px 28px 6px'>" +
    "<!--[if mso]><v:roundrect xmlns:v='urn:schemas-microsoft-com:vml' xmlns:w='urn:schemas-microsoft-com:office:word' href='" + scanUrl + "' style='height:48px;v-text-anchor:middle;width:240px;' arcsize='24%' strokecolor='" + RED + "' fillcolor='" + RED + "'><w:anchorlock/><center style='color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;'>Scan makanan sekarang</center></v:roundrect><![endif]-->" +
    "<!--[if !mso]><!-- --><a href='" + scanUrl + "' target='_blank' style='display:inline-block;background:" + RED + ";color:#ffffff;text-decoration:none;padding:14px 34px;border-radius:12px;font-weight:bold;font-size:15px'>Scan makanan sekarang</a><!--<![endif]-->" +
    "</td></tr>" +
    "<tr><td align='center' style='padding:8px 28px 26px'><p style='margin:0;font-size:13px;color:#8a8175'>" + v.signoff + "</p></td></tr>" +
    // footer
    "<tr><td style='padding:22px 28px 28px;border-top:1px solid #eee;text-align:center'>" +
    "<img src='" + LOGO_IMG + "' width='120' alt='20FIT' style='width:120px;height:auto;display:block;margin:0 auto 10px'>" +
    "<p style='margin:0 0 6px;font-size:12px;color:#8a8175'>Pantau makanmu, bukan diagnosis medis.</p>" +
    "<p style='margin:0 0 6px;font-size:11px;color:#a99f92;line-height:1.5'>Kamu menerima email ini karena pengingat makan aktif di akun 20FIT-mu.</p>" +
    "<p style='margin:0 0 8px;font-size:11px'><a href='" + unsubscribeUrl + "' style='color:" + RED + ";text-decoration:underline'>Atur atau berhenti dari pengingat</a></p>" +
    "<p style='margin:0;font-size:11px;color:#b7ada0'>PT Kredo AUM, Jakarta, Indonesia</p>" +
    "</td></tr></table></td></tr></table></body></html>"
  );
}

// -------- runner meal reminder (dipanggil cron 15 menit) --------
async function runMealReminders(ctx) {
  const { admin, email, comms, baseUrl } = ctx;
  const TOL = 15; // menit
  const now = comms.nowWib();
  const wibDate = comms.wibDateStr(now);
  const nowMin = now.getUTCHours() * 60 + now.getUTCMinutes();

  const { data: prefsList } = await admin
    .from("my20fit_user_comm_prefs")
    .select("*")
    .eq("consent_meal_reminder", true)
    .is("reminder_paused_at", null);

  let sent = 0, skipped = 0;
  const log = [];

  for (const p of prefsList || []) {
    const uid = p.user_id;
    const windows = [
      { key: "breakfast", en: p.reminder_breakfast_enabled, time: p.reminder_breakfast_time },
      { key: "lunch", en: p.reminder_lunch_enabled, time: p.reminder_lunch_time },
      { key: "dinner", en: p.reminder_dinner_enabled, time: p.reminder_dinner_time },
    ];
    let due = windows.filter((w) => w.en && withinTol(nowMin, hhmmToMin(w.time), TOL));
    if (!due.length) continue;

    // Penurunan otomatis: >=3 hari diabaikan → hanya 1x/hari (perkiraan window utama).
    if ((p.reminder_consecutive_ignored || 0) >= 3) {
      const one = windows.find((w) => w.key === "lunch" && w.en) || windows.find((w) => w.en);
      due = due.filter((w) => one && w.key === one.key);
      if (!due.length) continue;
    }

    // email penerima
    const { data: prof } = await admin.from("my20fit_profile").select("email").eq("auth_user_id", uid).limit(1);
    const em = prof && prof[0] && prof[0].email;
    if (!em) continue;

    // kriteria masuk: aktif dalam 14 hari terakhir
    const { data: act } = await admin.from("my20fit_user_activity").select("last_active_at").eq("auth_user_id", uid).limit(1);
    const la = act && act[0] && act[0].last_active_at ? new Date(act[0].last_active_at).getTime() : 0;
    if (!la || Date.now() - la > 14 * 24 * 3600 * 1000) { skipped++; continue; }

    // log makanan hari ini (untuk skip-if-logged)
    const { data: dl } = await admin.from("my20fit_daily_log").select("cal_items").eq("auth_user_id", uid).eq("log_date", wibDate).limit(1);
    const items = dl && dl[0] && Array.isArray(dl[0].cal_items) ? dl[0].cal_items : [];

    for (const w of due) {
      // SKIP kalau sudah log di window ini
      if (loggedInRange(items, WINDOW_LOGRANGE[w.key])) { skipped++; log.push(em + ":" + w.key + ":skipped_already_logged"); continue; }
      // gerbang global (consent/suppression/cap/cooldown)
      const gate = await comms.canSend({ userId: uid, email: em, bucket: "meal_reminder" });
      if (!gate.ok) { skipped++; log.push(em + ":" + w.key + ":" + gate.reason); continue; }

      const variant = pickVariant(w.key, wibDate);
      // Deep-link existing: #camera auto-buka scanner saat halaman calories load.
      const scanUrl = baseUrl + "/calories.html#camera";
      const unsub = await comms.unsubUrl(baseUrl, uid, "meal_reminder");
      const html = mealReminderHtml(w.key, variant, scanUrl, unsub);
      // idempotency: 1 reminder per window per hari (cron dobel tak kirim dobel)
      const idem = "mealrem:" + w.key + ":" + uid + ":" + wibDate;
      const r = await email.send({
        to: em, subject: variant.subject, html,
        channel: "meal_reminder", templateId: "meal_" + w.key, mealWindow: w.key,
        userId: uid, unsubscribeUrl: unsub, idempotencyKey: idem,
      });
      if (r.ok && !r.skipped) { sent++; log.push(em + ":" + w.key + ":sent"); }
      else { skipped++; log.push(em + ":" + w.key + ":" + (r.reason || r.error || "fail")); }
    }
  }
  return { ok: true, checked: (prefsList || []).length, sent, skipped, wibDate, nowMin, log: log.slice(0, 200) };
}

module.exports = {
  // konstanta & util (dipakai admin/test)
  MEAL_VARIANTS,
  WINDOW_LOGRANGE,
  hhmmToMin,
  withinTol,
  loggedInRange,
  pickVariant,
  // builder & runner
  mealReminderHtml,
  runMealReminders,
};
