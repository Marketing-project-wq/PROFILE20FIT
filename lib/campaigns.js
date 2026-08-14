// lib/campaigns.js — Engine campaign email: MEAL REMINDER (3x/hari) + ONBOARDING drip.
//
// Semua kirim lewat lib/email.js dan LULUS gerbang lib/comms.canSend() dulu.
// Timezone: SELALU WIB (Asia/Jakarta). Template email dibangun sebagai fungsi dengan
// SLOT teks (subject/headline/body/signoff) — struktur/warna/layout TIDAK berubah antar
// varian (hanya teks). JANGAN mengarang statistik/testimoni: pakai [[BUTUH DATA: ...]].

const cfg = require("./email-config");

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

// -------- varian teks meal reminder (3 per window, per bahasa) --------
// Bilingual: dipilih sesuai bahasa user (my20fit_user_comm_prefs.lang). TIDAK ada
// klaim/angka karangan. Hanya teks slot yang berubah antar varian; struktur HTML tetap.
const MEAL_VARIANTS = {
  id: {
    breakfast: [
      { subject: "Sarapan? Scan dulu.", headline: "SARAPAN? SCAN DULU.", body: "Sebelum mulai hari, potret sarapanmu dulu. Cuma butuh beberapa detik untuk mencatatnya.", signoff: "Selamat sarapan! 🍳" },
      { subject: "Mulai pagi dengan 1 scan", headline: "MULAI PAGI DENGAN 1 SCAN", body: "Catat sarapanmu supaya gambaran harianmu lengkap sejak pagi. Tinggal foto, sisanya otomatis.", signoff: "Semangat pagi! ☀️" },
      { subject: "Jangan lupa catat sarapan", headline: "CATAT SARAPANMU", body: "Foto piring sarapanmu — biar pemantauan makanmu hari ini dimulai dari langkah kecil ini.", signoff: "Selamat sarapan! 🍳" },
    ],
    lunch: [
      { subject: "Jam makan siang? Scan dulu.", headline: "JAM MAKAN SIANG? SCAN DULU.", body: "Sebelum lanjut kerja, potret makan siangmu dulu. Cepat, tinggal foto.", signoff: "Selamat makan siang! 🍱" },
      { subject: "Makan siang, catat dulu", headline: "MAKAN SIANG, CATAT DULU", body: "Satu foto makan siang bikin catatan harianmu tetap jalan. Nggak sampai semenit.", signoff: "Selamat makan! 🥗" },
      { subject: "Scan makan siangmu", headline: "SCAN MAKAN SIANGMU", body: "Potret makan siangmu untuk memantau asupan hari ini — tanpa ribet menghitung manual.", signoff: "Selamat makan! 🍱" },
    ],
    dinner: [
      { subject: "Makan malam siap? Scan dulu.", headline: "MAKAN MALAM SIAP? SCAN DULU.", body: "Sebelum menikmati makan malam, potret dulu untuk melengkapi catatan harianmu.", signoff: "Selamat makan malam! 🍽️" },
      { subject: "Tutup hari dengan 1 scan", headline: "TUTUP HARI DENGAN 1 SCAN", body: "Foto makan malammu — langkah terakhir memantau asupan hari ini. Cukup sekali potret.", signoff: "Selamat malam! 🌙" },
      { subject: "Catat makan malammu", headline: "CATAT MAKAN MALAMMU", body: "Potret makan malammu supaya gambaran harianmu utuh sampai malam ini.", signoff: "Selamat malam! 🌙" },
    ],
  },
  en: {
    breakfast: [
      { subject: "Breakfast? Scan it first.", headline: "BREAKFAST? SCAN IT FIRST.", body: "Start your day right — snap a photo of your breakfast before the first bite. It takes just seconds to log.", signoff: "Have a great breakfast! 🍳" },
      { subject: "Start your morning with one scan", headline: "START YOUR MORNING WITH ONE SCAN", body: "Log your breakfast so your daily picture is complete from the start. Just snap — the rest is automatic.", signoff: "Good morning! ☀️" },
      { subject: "Don't forget to log breakfast", headline: "LOG YOUR BREAKFAST", body: "Snap your breakfast plate — kick off today's tracking with this small step.", signoff: "Have a great breakfast! 🍳" },
    ],
    lunch: [
      { subject: "Lunchtime? Scan it first.", headline: "LUNCHTIME? SCAN IT FIRST.", body: "Before you dig in, snap a photo of your meal. Quick — just one photo.", signoff: "Enjoy your lunch! 🥗" },
      { subject: "Lunch — log it first", headline: "LUNCH — LOG IT FIRST", body: "One photo of your lunch keeps your daily log going. Under a minute.", signoff: "Enjoy your lunch! 🍱" },
      { subject: "Scan your lunch", headline: "SCAN YOUR LUNCH", body: "Snap your lunch to track today's intake — no manual counting.", signoff: "Enjoy your lunch! 🍱" },
    ],
    dinner: [
      { subject: "Dinner's ready? Scan it first.", headline: "DINNER'S READY? SCAN IT FIRST.", body: "Before you enjoy dinner, snap it to complete today's log.", signoff: "Enjoy your dinner! 🍽️" },
      { subject: "Close the day with one scan", headline: "CLOSE THE DAY WITH ONE SCAN", body: "Snap your dinner — the last step to track today's intake. Just one photo.", signoff: "Have a great evening! 🌙" },
      { subject: "Log your dinner", headline: "LOG YOUR DINNER", body: "Snap your dinner so your daily picture stays complete tonight.", signoff: "Good night! 🌙" },
    ],
  },
};
// String tetap (non-varian) per bahasa. Struktur/warna/layout identik antar bahasa.
const MEAL_UI = {
  id: {
    howItWorks: "Cara kerja", cta: "Scan makanan sekarang",
    steps: [["Snap", "Foto makananmu"], ["Scan", "Analisa otomatis"], ["Done", "Tercatat harian"]],
    micro: "Gratis di 20FIT &nbsp;&bull;&nbsp; Kurang dari semenit",
    heroAlt: "Scan makananmu di 20FIT",
    footerTag: "Pantau makanmu, bukan diagnosis medis.",
    footerWhy: "Kamu menerima email ini karena pengingat makan aktif di akun 20FIT-mu.",
    footerUnsub: "Atur atau berhenti dari pengingat",
  },
  en: {
    howItWorks: "How it works", cta: "Scan my meal now",
    steps: [["Snap", "Photo your plate"], ["Scan", "Auto-detected"], ["Done", "Intake logged"]],
    micro: "Free with 20FIT &nbsp;&bull;&nbsp; Takes under a minute",
    heroAlt: "Scan your meal with 20FIT",
    footerTag: "Track your meals — not a medical diagnosis.",
    footerWhy: "You're receiving this because meal reminders are on in your 20FIT account.",
    footerUnsub: "Manage or stop reminders",
  },
};
const WINDOW_LABEL = { breakfast: "BREAKFAST", lunch: "LUNCHTIME", dinner: "DINNERTIME" };
const WINDOW_LOGRANGE = { breakfast: [240, 659], lunch: [660, 1019], dinner: [1020, 1439] };

function pickVariant(win, dateStr, lang) {
  const L = lang === "en" ? "en" : "id";
  const arr = (MEAL_VARIANTS[L] && MEAL_VARIANTS[L][win]) || MEAL_VARIANTS.id.lunch;
  return arr[dayOfYear(dateStr) % arr.length];
}

// -------- builder HTML meal reminder (table-based, aman semua email client) --------
// Slot yang berubah antar varian: subject/headline/body/signoff. Sisanya TETAP.
function mealReminderHtml(win, v, scanUrl, unsubscribeUrl, lang) {
  const L = lang === "en" ? "en" : "id";
  const ui = MEAL_UI[L];
  const label = WINDOW_LABEL[win] || "MEAL";
  const preheader = v.body;
  const step = (n, t, s) =>
    "<td width='33%' valign='top' align='center' style='padding:0 6px'>" +
    "<div style='width:34px;height:34px;line-height:34px;border-radius:50%;background:" + RED + ";color:#fff;font-weight:bold;font-size:15px;margin:0 auto 8px'>" + n + "</div>" +
    "<div style='font-size:13px;font-weight:bold;color:" + INK + "'>" + t + "</div>" +
    "<div style='font-size:11px;color:#8a8175;margin-top:2px'>" + s + "</div></td>";

  return (
    "<!DOCTYPE html><html lang='" + L + "' xmlns:v='urn:schemas-microsoft-com:vml' xmlns:o='urn:schemas-microsoft-com:office:office'><head>" +
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
    "<tr><td style='padding:0'><a href='" + scanUrl + "' target='_blank'><img class='hero' src='" + HERO_IMG + "' width='600' alt='" + ui.heroAlt + "' style='display:block;width:600px;max-width:100%;height:auto;border:0'></a></td></tr>" +
    "<tr><td style='padding:26px 34px 6px'>" +
    // time pill
    "<span style='display:inline-block;background:" + PILL_BG + ";color:" + RED + ";font-size:12px;font-weight:bold;letter-spacing:1.5px;padding:6px 14px;border-radius:999px'>" + label + "</span>" +
    // headline (Anton, fallback Arial Black)
    "<h1 style=\"margin:14px 0 8px;font-family:'Anton',Arial Black,Arial,sans-serif;font-weight:400;text-transform:uppercase;font-size:30px;line-height:1.1;color:" + INK + "\">" + v.headline + "</h1>" +
    "<p style='margin:0;font-size:15px;line-height:1.6;color:#4a453d'>" + v.body + "</p></td></tr>" +
    // panel 3 langkah
    "<tr><td style='padding:20px 28px 0'><p style='margin:0 0 10px;font-size:12px;font-weight:bold;letter-spacing:1.5px;color:" + INK + ";text-transform:uppercase'>" + ui.howItWorks + "</p><table role='presentation' width='100%' cellpadding='0' cellspacing='0' style='background:#faf8f5;border-radius:12px'><tr><td style='padding:18px 8px'><table role='presentation' width='100%' cellpadding='0' cellspacing='0'><tr>" +
    step("1", ui.steps[0][0], ui.steps[0][1]) + step("2", ui.steps[1][0], ui.steps[1][1]) + step("3", ui.steps[2][0], ui.steps[2][1]) +
    "</tr></table></td></tr></table></td></tr>" +
    // CTA + VML fallback Outlook
    "<tr><td align='center' style='padding:22px 28px 4px'>" +
    "<!--[if mso]><v:roundrect xmlns:v='urn:schemas-microsoft-com:vml' xmlns:w='urn:schemas-microsoft-com:office:word' href='" + scanUrl + "' style='height:48px;v-text-anchor:middle;width:250px;' arcsize='24%' strokecolor='" + RED + "' fillcolor='" + RED + "'><w:anchorlock/><center style='color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;'>" + ui.cta + "</center></v:roundrect><![endif]-->" +
    "<!--[if !mso]><!-- --><a href='" + scanUrl + "' target='_blank' style='display:inline-block;background:" + RED + ";color:#ffffff;text-decoration:none;padding:14px 34px;border-radius:12px;font-weight:bold;font-size:15px'>" + ui.cta + "</a><!--<![endif]-->" +
    "</td></tr>" +
    // microcopy (tanpa klaim 'app' — produk web/PWA)
    "<tr><td align='center' style='padding:6px 28px 0'><p style='margin:0;font-size:13px;color:#9a9aa3'>" + ui.micro + "</p></td></tr>" +
    "<tr><td align='center' style='padding:10px 28px 26px'><p style='margin:0;font-size:13px;color:#8a8175'>" + v.signoff + "</p></td></tr>" +
    // footer
    "<tr><td style='padding:22px 28px 28px;border-top:1px solid #eee;text-align:center'>" +
    "<img src='" + LOGO_IMG + "' width='120' alt='20FIT' style='width:120px;height:auto;display:block;margin:0 auto 10px'>" +
    "<p style='margin:0 0 6px;font-size:12px;color:#8a8175'>" + ui.footerTag + "</p>" +
    "<p style='margin:0 0 6px;font-size:11px;color:#a99f92;line-height:1.5'>" + ui.footerWhy + "</p>" +
    "<p style='margin:0 0 8px;font-size:11px'><a href='" + unsubscribeUrl + "' style='color:" + RED + ";text-decoration:underline'>" + ui.footerUnsub + "</a></p>" +
    "<p style='margin:0;font-size:11px;color:#b7ada0'>PT Kredo AUM, Jakarta, Indonesia</p>" +
    "</td></tr></table></td></tr></table></body></html>"
  );
}

// Kill switch: campaign boleh dimatikan seketika tanpa deploy.
async function campaignEnabled(admin, id) {
  try {
    const { data } = await admin.from("my20fit_campaign_flags").select("enabled").eq("campaign_id", id).limit(1);
    if (!data || !data.length) return true; // default ON kalau flag belum ada
    return data[0].enabled !== false;
  } catch (e) {
    return true;
  }
}

// -------- runner meal reminder (dipanggil cron 15 menit) --------
async function runMealReminders(ctx) {
  const { admin, email, comms, baseUrl } = ctx;
  if (!(await campaignEnabled(admin, "meal_reminder"))) return { ok: true, disabled: true, checked: 0, sent: 0, skipped: 0 };
  const TOL = 15; // menit
  const now = comms.nowWib();
  const wibDate = comms.wibDateStr(now);
  const nowMin = now.getUTCHours() * 60 + now.getUTCMinutes();

  // Consent opt-in dihapus: kirim ke semua user dgn baris prefs & reminder tak di-pause.
  // Suppression/unsubscribe + cap frekuensi ditegakkan per-user oleh comms.canSend.
  const { data: prefsList } = await admin
    .from("my20fit_user_comm_prefs")
    .select("*")
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

      const lang = p.lang === "en" ? "en" : "id"; // bahasa email pilihan user (default id)
      const variant = pickVariant(w.key, wibDate, lang);
      // Deep-link existing: #camera auto-buka scanner saat halaman calories load.
      const scanUrl = baseUrl + "/calories.html#camera";
      const unsub = await comms.unsubUrl(baseUrl, uid, "meal_reminder");
      const html = mealReminderHtml(w.key, variant, scanUrl, unsub, lang);
      // idempotency: 1 reminder per window per hari (cron dobel tak kirim dobel)
      const idem = "mealrem:" + w.key + ":" + uid + ":" + wibDate;
      const r = await email.send({
        to: em, subject: variant.subject, html,
        channel: "meal_reminder", templateId: "meal_" + w.key, mealWindow: w.key,
        userId: uid, unsubscribeUrl: unsub, idempotencyKey: idem, language: lang,
      });
      if (r.ok && !r.skipped) { sent++; log.push(em + ":" + w.key + ":sent"); }
      else { skipped++; log.push(em + ":" + w.key + ":" + (r.reason || r.error || "fail")); }
    }
  }
  return { ok: true, checked: (prefsList || []).length, sent, skipped, wibDate, nowMin, log: log.slice(0, 200) };
}

// ======================= ONBOARDING DRIP (belum pernah scan) =======================
// campaign_id tetap. Bilingual (id/en, ikut bahasa user). TIDAK mengiklankan fitur
// yang tak ada & tak menyebut "mobile app" (produk = web/PWA). Step 1 pakai builder
// welcome kaya (onboardingWelcomeHtml); step 2-4 pakai onboardingHtml (dark hero).
const ONBOARDING_CAMPAIGN = "onboarding_no_scan";
const pickL = (field, lang) => (field && (lang === "en" ? field.en : field.id)) || (field && field.id) || field;
const ONBOARDING_STEPS = [
  {
    step: 1, day: 2, cta: "scan", welcome: true,
    subject: { id: "Coba scan makanan pertamamu 🍽️", en: "Try your first food scan 🍽️" },
  },
  {
    step: 2, day: 5, cta: "scan",
    subject: { id: "Belum sempat coba scan? Ini kenapa gampang", en: "Haven't tried scanning yet? Here's how easy it is" },
    kicker: { id: "CUMA BUTUH 10 DETIK", en: "IT TAKES 10 SECONDS" },
    headline: { id: "NGGAK RIBET, KOK", en: "IT'S REALLY NOT COMPLICATED" },
    body: {
      id: [
        "Banyak yang ngira mencatat makan itu ribet — harus nimbang, cari angka kalori, catat manual. Di 20FIT nggak begitu.",
        "Kamu tinggal foto. Itu aja. Sisanya otomatis. Nggak ada form panjang, nggak ada hitung-hitungan.",
      ],
      en: [
        "Most people think tracking food is a hassle — weighing portions, looking up calories, logging by hand. Not at 20FIT.",
        "You just take a photo. That's it. The rest is automatic — no long forms, no math.",
      ],
    },
    ctaText: { id: "Coba sekarang", en: "Try it now" },
  },
  {
    step: 3, day: 10, cta: "scan",
    subject: { id: "Kenapa mencatat makan itu worth it", en: "Why tracking your food is worth it" },
    kicker: { id: "PEMANTAUAN, BUKAN DIET KETAT", en: "AWARENESS, NOT A STRICT DIET" },
    headline: { id: "SADAR DULU, BARU BERUBAH", en: "AWARENESS COMES FIRST" },
    body: {
      id: [
        "Mencatat makan bukan soal pantang atau angka yang bikin stres. Ini soal tahu — apa yang biasa kamu makan, kapan, dan seberapa banyak.",
        "Begitu gambaran harianmu kelihatan, keputusan kecil jadi lebih gampang. Ini alat pemantauan pribadi, bukan diagnosis atau saran medis.",
      ],
      en: [
        "Tracking food isn't about restriction or stressful numbers. It's about knowing — what you usually eat, when, and how much.",
        "Once your daily picture is clear, small decisions get easier. It's a personal tracking tool, not a diagnosis or medical advice.",
      ],
    },
    ctaText: { id: "Mulai pantau makanku", en: "Start tracking my food" },
  },
  {
    step: 4, day: 20, cta: "prefs",
    subject: { id: "Kami hormati pilihanmu", en: "We respect your choice" },
    kicker: { id: "TERSERAH KAMU", en: "IT'S UP TO YOU" },
    headline: { id: "SEPERTINYA INI BELUM COCOK — NGGAK APA-APA", en: "MAYBE THIS ISN'T FOR YOU — THAT'S OKAY" },
    body: {
      id: [
        "Kami sudah beberapa kali mengajak coba fitur scan makanan, tapi mungkin memang belum pas buatmu. Itu sepenuhnya oke.",
        "Ini email terakhir soal ini. Kamu bisa atur email apa saja yang mau diterima, atau berhenti sepenuhnya — kapan pun.",
      ],
      en: [
        "We've invited you a few times to try the food scan feature, but maybe it's just not the right fit — and that's completely okay.",
        "This is the last email about it. You can choose which emails you'd like to receive, or stop entirely — anytime.",
      ],
    },
    ctaText: { id: "Atur preferensi email", en: "Manage email preferences" },
  },
];

const ONBOARDING_UI = {
  id: { tag: "Pantau makanmu, bukan diagnosis medis.", why: "Kamu menerima email ini karena menyetujui kabar & tips dari 20FIT.", unsub: "Atur atau berhenti dari email ini" },
  en: { tag: "Track your meals — not a medical diagnosis.", why: "You're receiving this because you opted in to news & tips from 20FIT.", unsub: "Manage or stop these emails" },
};

// Step 2-4: dark-hero sederhana, bilingual. urls = {scanUrl, prefsUrl}.
function onboardingHtml(def, lang, urls) {
  const L = lang === "en" ? "en" : "id";
  const ui = ONBOARDING_UI[L];
  const kicker = pickL(def.kicker, L), headline = pickL(def.headline, L), ctaText = pickL(def.ctaText, L);
  const bodyArr = pickL(def.body, L) || [];
  const ctaUrl = def.cta === "prefs" ? urls.prefsUrl : urls.scanUrl;
  const bodyHtml = bodyArr.map((p) => "<p style='margin:0 0 14px;font-size:15px;line-height:1.65;color:#4a453d'>" + p + "</p>").join("");
  return (
    "<!DOCTYPE html><html lang='" + L + "' xmlns:v='urn:schemas-microsoft-com:vml' xmlns:o='urn:schemas-microsoft-com:office:office'><head>" +
    "<meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>" +
    "<link href='https://fonts.googleapis.com/css2?family=Anton&display=swap' rel='stylesheet'>" +
    "<!--[if mso]><style>*{font-family:Arial,sans-serif !important}</style><![endif]-->" +
    "<style>@media only screen and (max-width:600px){.card{width:100% !important}}</style>" +
    "</head><body style='margin:0;padding:0;background:" + PAGE_BG + "'>" +
    "<div style='display:none;max-height:0;overflow:hidden;opacity:0'>" + (bodyArr[0] || "") + "</div>" +
    "<table role='presentation' width='100%' cellpadding='0' cellspacing='0' style='background:" + PAGE_BG + "'><tr><td align='center' style='padding:24px 12px'>" +
    "<table role='presentation' class='card' width='600' cellpadding='0' cellspacing='0' style='width:600px;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden'>" +
    "<tr><td style='background:" + INK + ";padding:40px 34px 34px'>" +
    "<div style='font-size:12px;letter-spacing:2px;color:#c9a24a;font-weight:bold'>" + kicker + "</div>" +
    "<h1 style=\"margin:12px 0 0;font-family:'Anton',Arial Black,Arial,sans-serif;font-weight:400;text-transform:uppercase;font-size:30px;line-height:1.12;color:#ffffff\">" + headline + "</h1>" +
    "</td></tr>" +
    "<tr><td style='padding:26px 34px 4px'>" + bodyHtml + "</td></tr>" +
    "<tr><td align='center' style='padding:14px 28px 8px'>" +
    "<!--[if mso]><v:roundrect xmlns:v='urn:schemas-microsoft-com:vml' xmlns:w='urn:schemas-microsoft-com:office:word' href='" + ctaUrl + "' style='height:48px;v-text-anchor:middle;width:260px;' arcsize='24%' strokecolor='" + RED + "' fillcolor='" + RED + "'><w:anchorlock/><center style='color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;'>" + ctaText + "</center></v:roundrect><![endif]-->" +
    "<!--[if !mso]><!-- --><a href='" + ctaUrl + "' target='_blank' style='display:inline-block;background:" + RED + ";color:#ffffff;text-decoration:none;padding:14px 34px;border-radius:12px;font-weight:bold;font-size:15px'>" + ctaText + "</a><!--<![endif]-->" +
    "</td></tr>" +
    "<tr><td style='padding:24px 28px 28px;border-top:1px solid #eee;text-align:center'>" +
    "<img src='" + LOGO_IMG + "' width='120' alt='20FIT' style='width:120px;height:auto;display:block;margin:0 auto 10px'>" +
    "<p style='margin:0 0 6px;font-size:12px;color:#8a8175'>" + ui.tag + "</p>" +
    "<p style='margin:0 0 6px;font-size:11px;color:#a99f92;line-height:1.5'>" + ui.why + "</p>" +
    "<p style='margin:0 0 8px;font-size:11px'><a href='" + urls.prefsUrl + "' style='color:" + RED + ";text-decoration:underline'>" + ui.unsub + "</a></p>" +
    "<p style='margin:0;font-size:11px;color:#b7ada0'>PT Kredo AUM, Jakarta, Indonesia</p>" +
    "</td></tr></table></td></tr></table></body></html>"
  );
}

// Step 1: welcome kaya (hero gradient + scan spotlight + kartu fitur). Bilingual.
// Habit Tracker -> "Progress & Achievements" (progress.html). Deep link tiap CTA.
// Mockup ponsel = ilustrasi produk (angka contoh, BUKAN data kesehatan user).
const WELCOME_TX = {
  id: {
    badge: "SELAMAT DATANG DI 20FIT", h1: "Kesehatanmu,<br>satu foto saja.",
    sub: "Mulai diet atau menjaga berat badan? 20FIT bantu memantau asupan makanmu sesuai kebutuhan — cukup dari satu foto.",
    heroCta: "Mulai gratis &nbsp;&rarr;", spotKicker: "COBA INI DULU",
    spotH: "Foto. Lihat analisisnya.<br>Sesederhana itu.",
    spotBody: "Bingung mulai dari mana? Foto makananmu dan dapat perkiraan analisis asupanmu lewat <strong style='color:#ffffff;'>Scan Calories</strong>.",
    spotLink: "Coba Scan Calories &rarr;", peek: "INTIP ISINYA", peekTap: "Ketuk untuk buka app &rarr;",
    loginCta: "Masuk / Daftar di my.20fit.id &nbsp;&rarr;", moreKicker: "LEBIH DARI SEKADAR KALORI",
    moreH: "Pantau kesehatanmu menyeluruh",
    aqiT: "Kualitas Udara (AQI)", aqiB: "Cek kualitas udara harian biar tahu kapan lebih baik latihan di dalam ruangan.",
    mcuT: "Medical Check-up", mcuB: "Simpan & pantau catatan medical check-up-mu, semua di satu tempat.",
    proT: "Progress & Achievements", proB: "Bangun kebiasaan sehat dan lihat progres-mu tumbuh, hari demi hari.",
    exploreCta: "Jelajahi semua fitur &nbsp;&rarr;", help: "Ada pertanyaan? Balas saja email ini — tim kami siap bantu.",
    why: "Kamu menerima email ini karena mendaftar di my.20fit.id.", unsub: "Berhenti langganan",
  },
  en: {
    badge: "WELCOME TO 20FIT", h1: "Your health,<br>one snap away.",
    sub: "Starting a diet or maintaining your weight? 20FIT helps you track your food intake based on your needs — all from a single photo.",
    heroCta: "Get started free &nbsp;&rarr;", spotKicker: "TRY THIS FIRST",
    spotH: "Snap. See the analysis.<br>That simple.",
    spotBody: "Not sure where to start? Photograph your meal and get an estimated analysis of your intake with <strong style='color:#ffffff;'>Scan Calories</strong>.",
    spotLink: "Try Scan Calories &rarr;", peek: "HERE'S A PEEK INSIDE", peekTap: "Tap to open the app &rarr;",
    loginCta: "Log In / Sign Up at my.20fit.id &nbsp;&rarr;", moreKicker: "MORE THAN CALORIES",
    moreH: "Track your whole wellness",
    aqiT: "Air Quality (AQI)", aqiB: "Check your daily air quality so you know when it's better to train indoors.",
    mcuT: "Medical Check-up", mcuB: "Keep and monitor your medical check-up records, all in one place.",
    proT: "Progress & Achievements", proB: "Build healthy habits and watch your progress grow, day by day.",
    exploreCta: "Explore all features &nbsp;&rarr;", help: "Got a question? Just reply to this email — our team is here to help.",
    why: "You're receiving this email because you signed up at my.20fit.id.", unsub: "Unsubscribe",
  },
};

function onboardingWelcomeHtml(lang, urls) {
  const L = lang === "en" ? "en" : "id";
  const t = WELCOME_TX[L];
  const card = (bar, url, title, body) =>
    "<tr><td class='px' style='padding:12px 44px 0 44px'><a href='" + url + "' target='_blank' style='display:block;background:#faf9fb;border-radius:16px;text-decoration:none'>" +
    "<table role='presentation' width='100%' cellpadding='0' cellspacing='0'><tr><td width='6' style='background:" + bar + ";border-radius:16px 0 0 16px;font-size:0'>&nbsp;</td>" +
    "<td style='padding:20px'><table role='presentation' width='100%' cellpadding='0' cellspacing='0'><tr><td>" +
    "<p style='margin:0;font-size:16px;line-height:22px;color:#111114;font-weight:800'>" + title + "</p>" +
    "<p style='margin:5px 0 0;font-size:14px;line-height:21px;color:#6a6a75'>" + body + "</p></td>" +
    "<td width='24' align='right' valign='middle' style='font-size:20px;color:#c4c4cc;font-weight:800'>&rsaquo;</td></tr></table></td></tr></table></a></td></tr>";
  const btn = (bg, url, label) =>
    "<tr><td align='center' class='px' style='padding:22px 44px 0 44px'><table role='presentation' cellpadding='0' cellspacing='0' width='100%'><tr>" +
    "<td align='center' bgcolor='" + bg + "' style='border-radius:999px'>" +
    "<!--[if mso]><v:roundrect xmlns:v='urn:schemas-microsoft-com:vml' xmlns:w='urn:schemas-microsoft-com:office:word' href='" + url + "' style='height:52px;v-text-anchor:middle;width:340px;' arcsize='50%' strokecolor='" + bg + "' fillcolor='" + bg + "'><w:anchorlock/><center style='color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;'>" + label.replace(/&nbsp;|&rarr;/g, "").trim() + "</center></v:roundrect><![endif]-->" +
    "<!--[if !mso]><!-- --><a href='" + url + "' target='_blank' style='display:inline-block;padding:16px 32px;font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:800;color:#ffffff;text-decoration:none;border-radius:999px'>" + label + "</a><!--<![endif]-->" +
    "</td></tr></table></td></tr>";
  return (
    "<!DOCTYPE html><html lang='" + L + "' xmlns:v='urn:schemas-microsoft-com:vml' xmlns:o='urn:schemas-microsoft-com:office:office'><head>" +
    "<meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>" +
    "<!--[if mso]><style>*{font-family:Arial,sans-serif !important}</style><![endif]-->" +
    "<style>@media only screen and (max-width:600px){.container{width:100% !important}.px{padding-left:22px !important;padding-right:22px !important}}</style>" +
    "</head><body style='margin:0;padding:0;background:#0e0e10'>" +
    "<div style='display:none;max-height:0;overflow:hidden;opacity:0'>" + t.sub + "</div>" +
    "<table role='presentation' width='100%' cellpadding='0' cellspacing='0' style='background:#0e0e10'><tr><td align='center' style='padding:24px 12px'>" +
    "<table role='presentation' class='container' width='600' cellpadding='0' cellspacing='0' style='width:600px;max-width:600px;background:#ffffff;border-radius:22px;overflow:hidden;font-family:Helvetica,Arial,sans-serif'>" +
    // hero
    "<tr><td style='background:#111114;background-image:linear-gradient(135deg,#20111a 0%,#111114 45%,#3a0d18 100%)'>" +
    "<table role='presentation' width='100%' cellpadding='0' cellspacing='0'>" +
    "<tr><td class='px' style='padding:32px 44px 0 44px'><img src='" + LOGO_IMG + "' alt='20FIT' width='104' style='display:block;width:104px;height:auto;filter:brightness(0) invert(1)'></td></tr>" +
    "<tr><td class='px' style='padding:28px 44px 40px 44px'>" +
    "<span style='display:inline-block;background:rgba(228,0,43,0.18);border:1px solid rgba(228,0,43,0.55);color:#ff7085;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:7px 14px;border-radius:999px'>" + t.badge + "</span>" +
    "<h1 style='margin:22px 0 0;font-size:44px;line-height:46px;color:#ffffff;font-weight:800;letter-spacing:-1px'>" + t.h1 + "</h1>" +
    "<p style='margin:18px 0 0;font-size:16px;line-height:26px;color:#cfcfd6'>" + t.sub + "</p>" +
    "<table role='presentation' cellpadding='0' cellspacing='0' style='margin-top:24px'><tr><td align='center' bgcolor='#E4002B' style='border-radius:999px'>" +
    "<a href='" + urls.scanUrl + "' target='_blank' style='display:inline-block;padding:15px 30px;font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:800;color:#ffffff;text-decoration:none;border-radius:999px'>" + t.heroCta + "</a>" +
    "</td></tr></table></td></tr></table></td></tr>" +
    // scan spotlight
    "<tr><td style='background:#E4002B;background-image:linear-gradient(135deg,#E4002B 0%,#b3001f 100%)'>" +
    "<table role='presentation' width='100%' cellpadding='0' cellspacing='0'><tr><td class='px' style='padding:36px 44px'>" +
    "<p style='margin:0;font-size:12px;color:#ffd6dc;font-weight:700;text-transform:uppercase;letter-spacing:2px'>" + t.spotKicker + "</p>" +
    "<h2 style='margin:12px 0 0;font-size:28px;line-height:34px;color:#ffffff;font-weight:800'>" + t.spotH + "</h2>" +
    "<p style='margin:14px 0 18px;font-size:16px;line-height:26px;color:#ffe3e8'>" + t.spotBody + "</p>" +
    "<a href='" + urls.scanUrl + "' target='_blank' style='display:inline-block;font-size:14px;font-weight:800;color:#ffffff;text-decoration:none;border-bottom:2px solid rgba(255,255,255,0.6);padding-bottom:2px'>" + t.spotLink + "</a>" +
    "</td></tr></table></td></tr>" +
    // login CTA
    btn("#E4002B", urls.loginUrl, t.loginCta) +
    // more features
    "<tr><td class='px' style='padding:40px 44px 4px 44px'><h3 style='margin:0;font-size:13px;color:#E4002B;font-weight:800;text-transform:uppercase;letter-spacing:2px'>" + t.moreKicker + "</h3>" +
    "<p style='margin:8px 0 0;font-size:24px;line-height:30px;color:#111114;font-weight:800'>" + t.moreH + "</p></td></tr>" +
    card("#16a34a", urls.dashboardUrl, t.aqiT, t.aqiB) +
    card("#E4002B", urls.medicalUrl, t.mcuT, t.mcuB) +
    card("#6d28d9", urls.progressUrl, t.proT, t.proB) +
    // explore CTA
    btn("#111114", urls.scanUrl, t.exploreCta) +
    "<tr><td align='center' class='px' style='padding:12px 44px 0 44px'><p style='margin:0;font-size:13px;line-height:20px;color:#9a9aa3'>" + t.help + "</p></td></tr>" +
    // footer
    "<tr><td style='padding:34px 44px 0 44px'><div style='height:1px;background:#eeeeef;line-height:1px;font-size:0'>&nbsp;</div></td></tr>" +
    "<tr><td class='px' style='padding:22px 44px 34px 44px'>" +
    "<img src='" + LOGO_IMG + "' alt='20FIT' width='76' style='display:block;width:76px;height:auto;margin-bottom:12px'>" +
    "<p style='margin:0;font-size:12px;line-height:20px;color:#9a9aa3'>" + t.why + "</p>" +
    "<p style='margin:8px 0 0;font-size:12px;line-height:20px;color:#9a9aa3'><a href='" + urls.prefsUrl + "' style='color:#9a9aa3;text-decoration:underline'>" + t.unsub + "</a> &nbsp;&middot;&nbsp; <a href='" + urls.loginUrl + "' style='color:#9a9aa3;text-decoration:underline'>my.20fit.id</a></p>" +
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

  // 1) ENROLL kandidat baru: onboarded, belum scan, >=2 hari, tak di campaign lain.
  //    Consent opt-in dihapus — hanya lewati yang sudah unsubscribe (suppression).
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
    if (await comms.isSuppressed(c.email)) continue; // sudah unsubscribe/bounce → jangan enroll
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
  // Kill switch: kalau campaign dimatikan, enroll boleh jalan tapi JANGAN kirim.
  if (!(await campaignEnabled(admin, ONBOARDING_CAMPAIGN))) {
    return { enrolled, sent, exited, disabled: true, log: log.slice(0, 200) };
  }
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
    if (await comms.isSuppressed(em)) { await exitEnroll(admin, e.id, "unsubscribed"); exited++; log.push(em + ":exit_unsub"); continue; }
    const prefs = await comms.getPrefsByUser(uid);
    const { data: act } = await admin.from("my20fit_user_activity").select("last_active_at").eq("auth_user_id", uid).limit(1);
    const la = act && act[0] && act[0].last_active_at ? new Date(act[0].last_active_at).getTime() : 0;
    if (la && nowMs - la > 30 * 86400000) { await exitEnroll(admin, e.id, "churned"); exited++; log.push(em + ":exit_churned"); continue; }

    const nextStep = (e.current_step || 0) + 1;
    const def = ONBOARDING_STEPS.find((s) => s.step === nextStep);
    if (!def) { await completeEnroll(admin, e.id, "completed"); log.push(em + ":completed"); continue; }

    // BACKLOG EXPIRY: kalau jadwal step ini telat > N jam (cron mati lama), JANGAN
    // kirim terlambat — lewati step ini, majukan current_step & jadwalkan step
    // berikutnya (relatif signup). Mencegah burst email tertunggak saat cron dinyalakan.
    const scheduledMs = e.next_send_at ? new Date(e.next_send_at).getTime() : nowMs;
    const overdueHours = (nowMs - scheduledMs) / 3600000;
    if (overdueHours > cfg.backlogExpiryHours) {
      const following = ONBOARDING_STEPS.find((s) => s.step === nextStep + 1);
      if (following) {
        const nextAt = new Date(signup + following.day * 86400000).toISOString();
        await admin.from("my20fit_campaign_enrollments").update({ current_step: nextStep, next_send_at: nextAt }).eq("id", e.id);
      } else {
        await completeEnroll(admin, e.id, "expired_backlog");
      }
      log.push(em + ":step" + nextStep + ":skipped_expired(" + Math.round(overdueHours) + "h)");
      continue;
    }

    // gerbang global marketing (cap harian/mingguan/cooldown)
    const gate = await comms.canSend({ userId: uid, email: em, bucket: "marketing" });
    if (!gate.ok) { log.push(em + ":step" + nextStep + ":" + gate.reason); continue; } // coba lagi cron berikut

    const prefsUrl = await comms.unsubUrl(baseUrl, uid, "marketing");
    const lang = prefs.lang === "en" ? "en" : "id"; // bahasa email pilihan user
    const urls = {
      scanUrl: scanUrl, prefsUrl: prefsUrl, loginUrl: baseUrl,
      dashboardUrl: baseUrl + "/dashboard.html", medicalUrl: baseUrl + "/medical.html",
      progressUrl: baseUrl + "/progress.html",
    };
    const html = def.welcome ? onboardingWelcomeHtml(lang, urls) : onboardingHtml(def, lang, urls);
    const subject = pickL(def.subject, lang);
    const idem = "onb:" + ONBOARDING_CAMPAIGN + ":" + uid + ":s" + nextStep;
    const r = await email.send({
      to: em, subject: subject, html, channel: "marketing",
      campaignId: ONBOARDING_CAMPAIGN, templateId: "onb_step" + nextStep,
      userId: uid, unsubscribeUrl: prefsUrl, idempotencyKey: idem, language: lang,
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
    .from("my20fit_user_comm_prefs").select("*").limit(5000);

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
          const lang = p.lang === "en" ? "en" : "id"; // bahasa email pilihan user
          const def = {
            kicker: { id: "PENGINGAT MAKAN", en: "MEAL REMINDER" },
            headline: { id: "REMINDER-NYA MASIH MEMBANTU?", en: "ARE THESE REMINDERS STILL HELPFUL?" },
            body: {
              id: ["Sepertinya beberapa pengingat makan terakhir terlewat. Kami pause dulu biar nggak mengganggu.",
                   "Kalau masih mau dipakai, kamu bisa atur jam yang lebih pas — atau matikan sepenuhnya."],
              en: ["It looks like your last few meal reminders were missed. We've paused them for now so they don't get in the way.",
                   "If you'd still like them, you can set a time that fits better — or turn them off completely."],
            },
            ctaText: { id: "Atur jadwal reminder", en: "Adjust reminder schedule" }, cta: "prefs",
          };
          const html = onboardingHtml(def, lang, { scanUrl: baseUrl + "/calories.html#camera", prefsUrl: prefsUrl });
          const subject = lang === "en" ? "Are your meal reminders still helpful?" : "Reminder makan-nya masih membantu?";
          await email.send({ to: em, subject: subject, html,
            channel: "meal_reminder", templateId: "meal_pause_checkin", userId: uid,
            unsubscribeUrl: prefsUrl, idempotencyKey: "mealpause:" + uid + ":" + yDate, language: lang });
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
        // Matikan meal reminder lewat kolom jadwal (consent dihapus): semua window off.
        await admin.from("my20fit_user_comm_prefs").update({
          reminder_breakfast_enabled: false, reminder_lunch_enabled: false, reminder_dinner_enabled: false,
          updated_at: new Date().toISOString(),
        }).eq("user_id", uid);
        turnedOff++;
      }
    }
  }

  // Dormant: 10 email non-transaksional terakhir semua TAK dibuka → suppression 'dormant'.
  // (Query per user berat; batasi ke user yang punya baris prefs.) Consent dihapus —
  // proteksi disengagement kini murni lewat suppression list.
  const { data: prefRows } = await admin
    .from("my20fit_user_comm_prefs").select("user_id").limit(5000);
  for (const row of prefRows || []) {
    const uid = row.user_id;
    const { data: last10 } = await admin.from("my20fit_message_log")
      .select("opened_at,clicked_at").eq("user_id", uid).neq("channel", "transactional")
      .in("status", ["sent", "delivered", "opened", "clicked"])
      .order("created_at", { ascending: false }).limit(10);
    if ((last10 || []).length >= 10 && last10.every((m) => !m.opened_at && !m.clicked_at)) {
      const { data: prof } = await admin.from("my20fit_profile").select("email").eq("auth_user_id", uid).limit(1);
      const em = prof && prof[0] && prof[0].email;
      if (em) await comms.addSuppression(em, uid, "dormant", true);
      dormant++;
    }
  }

  return { decayed, paused, turnedOff, dormant };
}

// -------- Metrik campaign (untuk admin & monitoring). BEBAS data kesehatan. --------
async function campaignMetrics(admin, sinceIso, opts) {
  opts = opts || {};
  const DISPATCHED = ["sent", "delivered", "opened", "clicked", "bounced", "complained"];
  const base = () => {
    let q = admin.from("my20fit_message_log").select("id", { count: "exact", head: true }).gte("created_at", sinceIso).in("status", DISPATCHED);
    if (opts.channel) q = q.eq("channel", opts.channel);
    if (opts.campaignId) q = q.eq("campaign_id", opts.campaignId);
    return q;
  };
  const cnt = async (col) => {
    const { count } = await base().not(col, "is", null);
    return count || 0;
  };
  const { count: dispatched } = await base();
  const delivered = await cnt("delivered_at");
  const opened = await cnt("opened_at");
  const clicked = await cnt("clicked_at");
  const bounced = await cnt("bounced_at");
  const complained = await cnt("complained_at");
  // unsubscribe di window: dari suppression_list reason 'unsubscribe'.
  let unsub = 0;
  try {
    const { count } = await admin.from("my20fit_suppression_list").select("email", { count: "exact", head: true }).eq("reason", "unsubscribe").gte("created_at", sinceIso);
    unsub = count || 0;
  } catch (e) {}
  const d = dispatched || 0;
  const pct = (n) => (d ? +((n / d) * 100).toFixed(3) : 0);
  return {
    dispatched: d, delivered, opened, clicked, bounced, complained, unsubscribed: unsub,
    open_rate: pct(opened), click_rate: pct(clicked),
    bounce_rate: pct(bounced), complaint_rate: pct(complained), unsub_rate: pct(unsub),
  };
}

// -------- Monitoring otomatis: auto-stop kalau ambang terlampaui --------
// Ambang UMUM INDUSTRI (verifikasi ke dok Resend & kebijakan Gmail/Yahoo terbaru):
//   complaint > 0.1%  ·  hard bounce > 2%  ·  unsubscribe/kirim > 0.5%
async function runMonitor(ctx) {
  const { admin } = ctx;
  const since = new Date(Date.now() - 7 * 86400000).toISOString(); // jendela 7 hari
  const out = [];
  for (const camp of [{ id: "meal_reminder", channel: "meal_reminder" }, { id: "onboarding_no_scan", channel: "marketing", campaignId: "onboarding_no_scan" }]) {
    const m = await campaignMetrics(admin, since, { channel: camp.channel, campaignId: camp.campaignId });
    // Butuh volume minimum biar rate tak liar (mis. 1 dari 2). Ambang dari config (override via env).
    const cb = cfg.circuitBreaker;
    let breach = null;
    if (m.dispatched >= cb.minVolume) {
      if (m.complaint_rate > cb.complaintPct) breach = "complaint " + m.complaint_rate + "%";
      else if (m.bounce_rate > cb.bouncePct) breach = "bounce " + m.bounce_rate + "%";
      else if (m.unsub_rate > cb.unsubPct) breach = "unsub " + m.unsub_rate + "%";
    }
    if (breach) {
      try {
        await admin.from("my20fit_campaign_flags").upsert(
          { campaign_id: camp.id, enabled: false, note: "auto-stop: " + breach, updated_by: "monitor", updated_at: new Date().toISOString() },
          { onConflict: "campaign_id" }
        );
      } catch (e) {}
      console.warn("[monitor] AUTO-STOP " + camp.id + " — " + breach + " (dispatched=" + m.dispatched + ")");
      out.push({ campaign_id: camp.id, auto_stopped: true, breach, metrics: m });
    } else {
      out.push({ campaign_id: camp.id, auto_stopped: false, metrics: m });
    }
  }
  return out;
}

async function runDaily(ctx) {
  const onb = await runOnboarding(ctx);
  const decay = await runMealDecayAndDormant(ctx);
  const monitor = await runMonitor(ctx);
  return { ok: true, onboarding: onb, meal_maintenance: decay, monitor };
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
  campaignEnabled,
  campaignMetrics,
  // builder & runner
  mealReminderHtml,
  onboardingHtml,
  onboardingWelcomeHtml,
  runMealReminders,
  runOnboarding,
  runMealDecayAndDormant,
  runMonitor,
  runDaily,
};
