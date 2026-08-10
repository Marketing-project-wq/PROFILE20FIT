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

// ======================= ONBOARDING DRIP (belum pernah scan) =======================
// campaign_id tetap. Bahasa Indonesia (mayoritas member Jakarta). TIDAK mengiklankan
// fitur yang tak ada (mis. Habit Tracker) & tak menyebut "mobile app" (produk = web/PWA).
// Klaim/angka yang belum ada datanya → [[BUTUH DATA: ...]].
const ONBOARDING_CAMPAIGN = "onboarding_no_scan";
const ONBOARDING_STEPS = [
  {
    step: 1, day: 2, subject: "Coba scan makanan pertamamu 🍽️",
    kicker: "SELAMAT DATANG DI 20FIT",
    headline: "SATU FOTO, LANGSUNG TERCATAT",
    body: [
      "Onboarding-mu sudah selesai — mantap! Sekarang bagian paling berguna: mencatat makan lewat scan foto.",
      "Cukup potret piringmu, sistem membaca perkiraan kalori & makronya, dan langsung masuk catatan harianmu. Nggak perlu menimbang atau menghitung manual.",
    ],
    ctaText: "Scan makanan pertamaku", cta: "scan",
  },
  {
    step: 2, day: 5, subject: "Belum sempat coba scan? Ini kenapa gampang",
    kicker: "CUMA BUTUH 10 DETIK",
    headline: "NGGAK RIBET, KOK",
    body: [
      "Banyak yang ngira mencatat makan itu ribet — harus nimbang, cari angka kalori, catat manual. Di 20FIT nggak begitu.",
      "Kamu tinggal foto. Itu aja. Sisanya otomatis. Nggak ada form panjang, nggak ada hitung-hitungan.",
    ],
    ctaText: "Coba sekarang", cta: "scan",
  },
  {
    step: 3, day: 10, subject: "Kenapa mencatat makan itu worth it",
    kicker: "PEMANTAUAN, BUKAN DIET KETAT",
    headline: "SADAR DULU, BARU BERUBAH",
    body: [
      "Mencatat makan bukan soal pantang atau angka yang bikin stres. Ini soal tahu — apa yang biasa kamu makan, kapan, dan seberapa banyak.",
      "Begitu gambaran harianmu kelihatan, keputusan kecil jadi lebih gampang. Ini alat pemantauan pribadi, bukan diagnosis atau saran medis.",
    ],
    ctaText: "Mulai pantau makanku", cta: "scan",
  },
  {
    step: 4, day: 20, subject: "Kami hormati pilihanmu",
    kicker: "TERSERAH KAMU",
    headline: "SEPERTINYA INI BELUM COCOK — NGGAK APA-APA",
    body: [
      "Kami sudah beberapa kali mengajak coba fitur scan makanan, tapi mungkin memang belum pas buatmu. Itu sepenuhnya oke.",
      "Ini email terakhir soal ini. Kamu bisa atur email apa saja yang mau diterima, atau berhenti sepenuhnya — kapan pun.",
    ],
    ctaText: "Atur preferensi email", cta: "prefs",
  },
];

function onboardingHtml(def, scanUrl, prefsUrl, unsubscribeUrl) {
  const ctaUrl = def.cta === "prefs" ? prefsUrl : scanUrl;
  const bodyHtml = def.body
    .map((p) => "<p style='margin:0 0 14px;font-size:15px;line-height:1.65;color:#4a453d'>" + p + "</p>")
    .join("");
  return (
    "<!DOCTYPE html><html lang='id' xmlns:v='urn:schemas-microsoft-com:vml' xmlns:o='urn:schemas-microsoft-com:office:office'><head>" +
    "<meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>" +
    "<link href='https://fonts.googleapis.com/css2?family=Anton&display=swap' rel='stylesheet'>" +
    "<!--[if mso]><style>*{font-family:Arial,sans-serif !important}</style><![endif]-->" +
    "<style>@media only screen and (max-width:600px){.card{width:100% !important}}</style>" +
    "</head><body style='margin:0;padding:0;background:" + PAGE_BG + "'>" +
    "<div style='display:none;max-height:0;overflow:hidden;opacity:0'>" + def.body[0] + "</div>" +
    "<table role='presentation' width='100%' cellpadding='0' cellspacing='0' style='background:" + PAGE_BG + "'><tr><td align='center' style='padding:24px 12px'>" +
    "<table role='presentation' class='card' width='600' cellpadding='0' cellspacing='0' style='width:600px;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden'>" +
    // dark hero header
    "<tr><td style='background:" + INK + ";padding:40px 34px 34px'>" +
    "<div style='font-size:12px;letter-spacing:2px;color:#c9a24a;font-weight:bold'>" + def.kicker + "</div>" +
    "<h1 style=\"margin:12px 0 0;font-family:'Anton',Arial Black,Arial,sans-serif;font-weight:400;text-transform:uppercase;font-size:30px;line-height:1.12;color:#ffffff\">" + def.headline + "</h1>" +
    "</td></tr>" +
    "<tr><td style='padding:26px 34px 4px'>" + bodyHtml + "</td></tr>" +
    // CTA + VML
    "<tr><td align='center' style='padding:14px 28px 8px'>" +
    "<!--[if mso]><v:roundrect xmlns:v='urn:schemas-microsoft-com:vml' xmlns:w='urn:schemas-microsoft-com:office:word' href='" + ctaUrl + "' style='height:48px;v-text-anchor:middle;width:260px;' arcsize='24%' strokecolor='" + RED + "' fillcolor='" + RED + "'><w:anchorlock/><center style='color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;'>" + def.ctaText + "</center></v:roundrect><![endif]-->" +
    "<!--[if !mso]><!-- --><a href='" + ctaUrl + "' target='_blank' style='display:inline-block;background:" + RED + ";color:#ffffff;text-decoration:none;padding:14px 34px;border-radius:12px;font-weight:bold;font-size:15px'>" + def.ctaText + "</a><!--<![endif]-->" +
    "</td></tr>" +
    // footer
    "<tr><td style='padding:24px 28px 28px;border-top:1px solid #eee;text-align:center'>" +
    "<img src='" + LOGO_IMG + "' width='120' alt='20FIT' style='width:120px;height:auto;display:block;margin:0 auto 10px'>" +
    "<p style='margin:0 0 6px;font-size:12px;color:#8a8175'>Pantau makanmu, bukan diagnosis medis.</p>" +
    "<p style='margin:0 0 6px;font-size:11px;color:#a99f92;line-height:1.5'>Kamu menerima email ini karena menyetujui kabar & tips dari 20FIT.</p>" +
    "<p style='margin:0 0 8px;font-size:11px'><a href='" + unsubscribeUrl + "' style='color:" + RED + ";text-decoration:underline'>Atur atau berhenti dari email ini</a></p>" +
    "<p style='margin:0;font-size:11px;color:#b7ada0'>PT Kredo AUM, Jakarta, Indonesia</p>" +
    "</td></tr></table></td></tr></table></body></html>"
  );
}

// Apakah user PERNAH scan makanan? (sinyal lifetime: ada baris konsumsi di ledger).
async function everScanned(admin, uid) {
  const { data } = await admin
    .from("my20fit_scan_ledger")
    .select("id")
    .eq("auth_user_id", uid)
    .like("reason", "consume%")
    .limit(1);
  return !!(data && data.length);
}

// -------- ENROLLMENT + pengiriman step onboarding (dipanggil daily cron) --------
async function runOnboarding(ctx) {
  const { admin, email, comms, baseUrl } = ctx;
  const nowMs = Date.now();
  const scanUrl = baseUrl + "/calories.html#camera";
  let enrolled = 0, sent = 0, exited = 0;
  const log = [];

  // 1) ENROLL kandidat baru: onboarded, consent_marketing, belum scan, >=2 hari, tak di campaign lain.
  const { data: cands } = await admin
    .from("my20fit_profile")
    .select("auth_user_id,email,created_at,onboarding_completed")
    .eq("onboarding_completed", true)
    .limit(5000);
  for (const c of cands || []) {
    const uid = c.auth_user_id;
    if (!c.email || !c.created_at) continue;
    const days = (nowMs - new Date(c.created_at).getTime()) / 86400000;
    if (days < 2) continue;
    const prefs = await comms.getPrefsByUser(uid);
    if (!prefs || !prefs.consent_marketing) continue; // wajib consent marketing
    // sudah/pernah di campaign ini? (aktif ATAU cooldown 60 hari sejak selesai)
    const { data: enr } = await admin
      .from("my20fit_campaign_enrollments")
      .select("id,status,completed_at")
      .eq("user_id", uid).eq("campaign_id", ONBOARDING_CAMPAIGN)
      .order("created_at", { ascending: false }).limit(1);
    const last = enr && enr[0];
    if (last && last.status === "active") continue;
    if (last && last.completed_at && (nowMs - new Date(last.completed_at).getTime()) < 60 * 86400000) continue;
    if (await everScanned(admin, uid)) continue; // sudah scan → tak perlu campaign
    // enroll
    const nextAt = new Date(new Date(c.created_at).getTime() + 2 * 86400000).toISOString();
    const { error } = await admin.from("my20fit_campaign_enrollments").insert({
      user_id: uid, campaign_id: ONBOARDING_CAMPAIGN, current_step: 0,
      status: "active", next_send_at: nextAt,
    });
    if (!error) { enrolled++; log.push(c.email + ":enrolled"); }
  }

  // 2) KIRIM step yang jatuh tempo (cek exit sebelum tiap kirim).
  const { data: active } = await admin
    .from("my20fit_campaign_enrollments")
    .select("*")
    .eq("campaign_id", ONBOARDING_CAMPAIGN).eq("status", "active")
    .lte("next_send_at", new Date().toISOString()).limit(2000);

  for (const e of active || []) {
    const uid = e.user_id;
    const { data: prof } = await admin.from("my20fit_profile").select("email,created_at").eq("auth_user_id", uid).limit(1);
    const em = prof && prof[0] && prof[0].email;
    const signup = prof && prof[0] && prof[0].created_at ? new Date(prof[0].created_at).getTime() : nowMs;
    if (!em) continue;

    // ---- exit conditions ----
    if (await everScanned(admin, uid)) { await exitEnroll(admin, e.id, "converted"); exited++; log.push(em + ":exit_converted"); continue; }
    const prefs = await comms.getPrefsByUser(uid);
    if (!prefs || !prefs.consent_marketing) { await exitEnroll(admin, e.id, "unsubscribed"); exited++; log.push(em + ":exit_unsub"); continue; }
    const { data: act } = await admin.from("my20fit_user_activity").select("last_active_at").eq("auth_user_id", uid).limit(1);
    const la = act && act[0] && act[0].last_active_at ? new Date(act[0].last_active_at).getTime() : 0;
    if (la && nowMs - la > 30 * 86400000) { await exitEnroll(admin, e.id, "churned"); exited++; log.push(em + ":exit_churned"); continue; }

    const nextStep = (e.current_step || 0) + 1;
    const def = ONBOARDING_STEPS.find((s) => s.step === nextStep);
    if (!def) { await completeEnroll(admin, e.id, "completed"); log.push(em + ":completed"); continue; }

    // gerbang global marketing (cap harian/mingguan/cooldown)
    const gate = await comms.canSend({ userId: uid, email: em, bucket: "marketing" });
    if (!gate.ok) { log.push(em + ":step" + nextStep + ":" + gate.reason); continue; } // coba lagi cron berikut

    const prefsUrl = await comms.unsubUrl(baseUrl, uid, "marketing");
    const html = onboardingHtml(def, scanUrl, prefsUrl, prefsUrl);
    const idem = "onb:" + ONBOARDING_CAMPAIGN + ":" + uid + ":s" + nextStep;
    const r = await email.send({
      to: em, subject: def.subject, html, channel: "marketing",
      campaignId: ONBOARDING_CAMPAIGN, templateId: "onb_step" + nextStep,
      userId: uid, unsubscribeUrl: prefsUrl, idempotencyKey: idem,
    });
    if (!(r.ok && !r.skipped)) { log.push(em + ":step" + nextStep + ":" + (r.reason || r.error || "fail")); continue; }
    sent++; log.push(em + ":step" + nextStep + ":sent");

    // jadwalkan step berikutnya (relatif SIGNUP) atau selesai.
    const following = ONBOARDING_STEPS.find((s) => s.step === nextStep + 1);
    if (following) {
      const nextAt = new Date(signup + following.day * 86400000).toISOString();
      await admin.from("my20fit_campaign_enrollments").update({ current_step: nextStep, next_send_at: nextAt }).eq("id", e.id);
    } else {
      // step terakhir terkirim → cek apakah SEMUA email tak dibuka (no_engagement).
      const { data: msgs } = await admin.from("my20fit_message_log")
        .select("opened_at").eq("user_id", uid).eq("campaign_id", ONBOARDING_CAMPAIGN)
        .in("status", ["sent", "delivered", "opened", "clicked"]);
      const anyOpen = (msgs || []).some((m) => m.opened_at);
      await admin.from("my20fit_campaign_enrollments").update({ current_step: nextStep }).eq("id", e.id);
      await completeEnroll(admin, e.id, anyOpen ? "completed" : "no_engagement");
      log.push(em + ":completed:" + (anyOpen ? "engaged" : "no_engagement"));
    }
  }
  return { enrolled, sent, exited, log: log.slice(0, 200) };
}

async function exitEnroll(admin, id, reason) {
  await admin.from("my20fit_campaign_enrollments").update({ status: "exited", exit_reason: reason, completed_at: new Date().toISOString() }).eq("id", id);
}
async function completeEnroll(admin, id, reason) {
  await admin.from("my20fit_campaign_enrollments").update({ status: "completed", exit_reason: reason, completed_at: new Date().toISOString() }).eq("id", id);
}

// -------- Evaluasi harian meal reminder: decay 3/7/14 + dormant --------
async function runMealDecayAndDormant(ctx) {
  const { admin, email, comms, baseUrl } = ctx;
  const nowMs = Date.now();
  // "kemarin" WIB
  const y = new Date(comms.nowWib().getTime() - 86400000);
  const yDate = y.toISOString().slice(0, 10);
  let paused = 0, turnedOff = 0, dormant = 0, decayed = 0;

  const { data: prefsList } = await admin
    .from("my20fit_user_comm_prefs").select("*").eq("consent_meal_reminder", true).limit(5000);

  for (const p of prefsList || []) {
    const uid = p.user_id;
    // reminder yang terkirim KEMARIN
    const { data: sentMsgs } = await admin.from("my20fit_message_log")
      .select("opened_at,clicked_at")
      .eq("user_id", uid).eq("channel", "meal_reminder")
      .gte("created_at", yDate + "T00:00:00Z").lte("created_at", yDate + "T23:59:59Z");
    const nSent = (sentMsgs || []).length;

    if (nSent > 0) {
      const anyOpen = (sentMsgs || []).some((m) => m.opened_at || m.clicked_at);
      // apakah user LOG makanan kemarin?
      const { data: dl } = await admin.from("my20fit_daily_log").select("cal_items").eq("auth_user_id", uid).eq("log_date", yDate).limit(1);
      const logged = dl && dl[0] && Array.isArray(dl[0].cal_items) && dl[0].cal_items.length > 0;
      let ci = p.reminder_consecutive_ignored || 0;
      if (anyOpen || logged) {
        ci = 0;
      } else {
        ci += 1; decayed++;
      }
      const patch = { reminder_consecutive_ignored: ci, updated_at: new Date().toISOString() };
      // 7 hari diabaikan & belum paused → PAUSE + kirim 1 email "masih membantu?"
      if (ci >= 7 && !p.reminder_paused_at) {
        patch.reminder_paused_at = new Date().toISOString();
        paused++;
        const { data: prof } = await admin.from("my20fit_profile").select("email").eq("auth_user_id", uid).limit(1);
        const em = prof && prof[0] && prof[0].email;
        if (em) {
          const prefsUrl = await comms.unsubUrl(baseUrl, uid, "meal_reminder");
          const html = onboardingHtml(
            { kicker: "PENGINGAT MAKAN", headline: "REMINDER-NYA MASIH MEMBANTU?",
              body: ["Sepertinya beberapa pengingat makan terakhir terlewat. Kami pause dulu biar nggak mengganggu.",
                     "Kalau masih mau dipakai, kamu bisa atur jam yang lebih pas — atau matikan sepenuhnya."],
              ctaText: "Atur jadwal reminder", cta: "prefs" },
            baseUrl + "/calories.html#camera", prefsUrl, prefsUrl
          );
          await email.send({ to: em, subject: "Reminder makan-nya masih membantu?", html,
            channel: "meal_reminder", templateId: "meal_pause_checkin", userId: uid,
            unsubscribeUrl: prefsUrl, idempotencyKey: "mealpause:" + uid + ":" + yDate });
        }
      }
      await admin.from("my20fit_user_comm_prefs").update(patch).eq("user_id", uid);
    }

    // 14 hari setelah pause tanpa respons → matikan otomatis.
    if (p.reminder_paused_at && nowMs - new Date(p.reminder_paused_at).getTime() >= 14 * 86400000) {
      // respons = ada open/click meal_reminder ATAU log makanan sejak paused
      const since = new Date(p.reminder_paused_at).toISOString();
      const { data: opened } = await admin.from("my20fit_message_log")
        .select("id").eq("user_id", uid).eq("channel", "meal_reminder").not("opened_at", "is", null).gte("opened_at", since).limit(1);
      if (!(opened && opened.length)) {
        await admin.from("my20fit_user_comm_prefs").update({ consent_meal_reminder: false, updated_at: new Date().toISOString() }).eq("user_id", uid);
        turnedOff++;
      }
    }
  }

  // Dormant: 10 email non-transaksional terakhir semua TAK dibuka → suppression 'dormant'.
  // (Query per user berat; batasi ke user yang punya prefs consent apa pun.)
  const { data: anyConsent } = await admin
    .from("my20fit_user_comm_prefs").select("user_id")
    .or("consent_marketing.eq.true,consent_meal_reminder.eq.true").limit(5000);
  for (const row of anyConsent || []) {
    const uid = row.user_id;
    const { data: last10 } = await admin.from("my20fit_message_log")
      .select("opened_at,clicked_at").eq("user_id", uid).neq("channel", "transactional")
      .in("status", ["sent", "delivered", "opened", "clicked"])
      .order("created_at", { ascending: false }).limit(10);
    if ((last10 || []).length >= 10 && last10.every((m) => !m.opened_at && !m.clicked_at)) {
      const { data: prof } = await admin.from("my20fit_profile").select("email").eq("auth_user_id", uid).limit(1);
      const em = prof && prof[0] && prof[0].email;
      if (em) await comms.addSuppression(em, uid, "dormant", true);
      await admin.from("my20fit_user_comm_prefs").update({ consent_marketing: false, consent_meal_reminder: false, updated_at: new Date().toISOString() }).eq("user_id", uid);
      dormant++;
    }
  }

  return { decayed, paused, turnedOff, dormant };
}

async function runDaily(ctx) {
  const onb = await runOnboarding(ctx);
  const decay = await runMealDecayAndDormant(ctx);
  return { ok: true, onboarding: onb, meal_maintenance: decay };
}

module.exports = {
  // konstanta & util (dipakai admin/test)
  MEAL_VARIANTS,
  WINDOW_LOGRANGE,
  ONBOARDING_CAMPAIGN,
  ONBOARDING_STEPS,
  hhmmToMin,
  withinTol,
  loggedInRange,
  pickVariant,
  everScanned,
  // builder & runner
  mealReminderHtml,
  onboardingHtml,
  runMealReminders,
  runOnboarding,
  runMealDecayAndDormant,
  runDaily,
};
