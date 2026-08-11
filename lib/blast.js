// lib/blast.js — Send queue blast email admin (Fase 2).
//
// KESELAMATAN (blast tak bisa di-undo):
//  - Snapshot penerima DIBEKUKAN saat antrian dibuat (tak hitung ulang segmen saat kirim).
//  - Pengiriman BERTAHAP: 1 batch per panggilan cron (jeda = interval cron).
//  - Cek ulang kelayakan PER penerima saat kirim (unsubscribe di tengah dihormati).
//  - Idempotent: yang sudah 'sent' tak dikirim ulang.
//  - Kill switch: status 'paused'/'cancelled' menghentikan di tengah.
//  - Auto-abort kalau bounce/complaint/error tinggi.
//  - Semua kirim TETAP lewat lib/email.js (satu jalur). Template-only.

// Template blast yang diizinkan → builder di lib/campaigns.js. Tidak ada tulis-bebas.
const TEMPLATES = {
  onboarding_welcome: { label: "Onboarding — Welcome" },
  breakfast_reminder: { label: "Meal — Breakfast" },
  lunch_reminder: { label: "Meal — Lunch" },
  dinner_reminder: { label: "Meal — Dinner" },
};
const TEMPLATE_IDS = Object.keys(TEMPLATES);

const AUTO_ABORT = { min_volume: 20, bounce_rate: 0.05, error_rate: 0.1 }; // + complaint apa pun

// Substitusi placeholder untuk template custom tersimpan.
function substituteTemplate(html, vars) {
  return String(html).replace(/\{\{\s*(scan_url|unsubscribe_url)\s*\}\}/g, (m, k) => vars[k] || "");
}
// Render body email blast. Kalau ada override tersimpan (my20fit_email_templates.html != null)
// pakai itu; kalau tidak, jatuh ke builder di lib/campaigns.js (perilaku lama, tanpa regresi).
async function renderTemplate(admin, campaigns, templateId, baseUrl, unsubscribeUrl) {
  const scanUrl = baseUrl + "/calories.html#camera";
  try {
    const { data } = await admin.from("my20fit_email_templates").select("html").eq("template_key", templateId).limit(1);
    const custom = data && data[0] && data[0].html;
    if (custom) return substituteTemplate(custom, { scan_url: scanUrl, unsubscribe_url: unsubscribeUrl });
  } catch (e) { /* fallback ke builder */ }
  if (templateId === "onboarding_welcome") {
    return campaigns.onboardingHtml(campaigns.ONBOARDING_STEPS[0], scanUrl, unsubscribeUrl, unsubscribeUrl);
  }
  const win = templateId.split("_")[0]; // breakfast|lunch|dinner
  // Blast admin default bahasa ID (varian pertama). Cron per-user pilih bahasa sendiri.
  const variant = (campaigns.MEAL_VARIANTS.id[win] || [])[0] || null;
  if (!variant) return null;
  return campaigns.mealReminderHtml(win, variant, scanUrl, unsubscribeUrl, "id");
}

// ---- Buat draft blast: hitung segmen + kelayakan, BEKUKAN penerima ----
async function createSend(ctx, opts) {
  const { admin, segments } = ctx;
  const name = String(opts.name || "").trim();
  if (!name) throw new Error("nama campaign wajib");
  if (segments.PRESET_IDS.indexOf(opts.segment_id) < 0) throw new Error("segment tidak dikenal");
  if (TEMPLATE_IDS.indexOf(opts.template_id) < 0) throw new Error("template tidak dikenal");
  const subject = String(opts.subject || "").trim();
  if (!subject) throw new Error("subject wajib");

  const matched = await segments.computeSegment(admin, opts.segment_id);
  const { eligible, breakdown } = await segments.applyEligibility(admin, matched, "marketing");

  const { data: send, error } = await admin.from("my20fit_email_sends").insert({
    name, segment_id: opts.segment_id, template_id: opts.template_id, subject,
    status: "draft",
    total_matched: matched.length, total_eligible: eligible.length,
    daily_cap: opts.daily_cap || null,
    exclusion_breakdown: breakdown, created_by: opts.created_by || null,
  }).select("*").single();
  if (error) throw new Error(error.message);

  // Bekukan snapshot penerima (hanya yang ELIGIBLE).
  if (eligible.length) {
    const rows = eligible.map((m) => ({ send_id: send.id, user_id: m.user_id, email: m.email, status: "pending" }));
    // sisipkan bertahap (hindari payload raksasa)
    for (let i = 0; i < rows.length; i += 500) {
      await admin.from("my20fit_email_send_recipients").upsert(rows.slice(i, i + 500), { onConflict: "send_id,user_id" });
    }
  }
  return send;
}

// ---- Kirim tes ke diri sendiri (WAJIB sebelum confirm) ----
async function sendTest(ctx, sendId, toEmail) {
  const { admin, email, comms, campaigns, baseUrl } = ctx;
  const { data: send } = await admin.from("my20fit_email_sends").select("*").eq("id", sendId).limit(1);
  const s = send && send[0];
  if (!s) throw new Error("send tidak ditemukan");
  const unsub = baseUrl + "/unsubscribe?token=TEST&c=marketing";
  const html = await renderTemplate(admin, campaigns, s.template_id, baseUrl, unsub);
  if (!html) throw new Error("gagal render template");
  const r = await email.send({
    to: toEmail, subject: "[TES] " + s.subject, html,
    transactional: true, channel: "transactional", templateId: "blast_test:" + s.template_id,
  });
  if (r.ok && !r.skipped) {
    await admin.from("my20fit_email_sends").update({ test_sent_at: new Date().toISOString() }).eq("id", sendId);
  }
  return r;
}

// ---- Konfirmasi (ketik nama campaign) → masuk antrian ----
async function confirmSend(ctx, sendId, typedName, approvedBy) {
  const { admin } = ctx;
  const { data } = await admin.from("my20fit_email_sends").select("*").eq("id", sendId).limit(1);
  const s = data && data[0];
  if (!s) throw new Error("send tidak ditemukan");
  if (!s.test_sent_at) throw new Error("kirim tes dulu sebelum konfirmasi");
  if (String(typedName || "").trim() !== s.name) throw new Error("nama campaign tidak cocok");
  if (["draft", "preview"].indexOf(s.status) < 0) throw new Error("status tidak bisa dikonfirmasi: " + s.status);
  await admin.from("my20fit_email_sends").update({
    status: "queued", approved_by: approvedBy || null,
  }).eq("id", sendId);
  return { ok: true };
}

async function setStatus(ctx, sendId, status) {
  const { admin } = ctx;
  const patch = { status };
  if (status === "cancelled") patch.cancelled_at = new Date().toISOString();
  await admin.from("my20fit_email_sends").update(patch).eq("id", sendId);
  if (status === "cancelled") {
    await admin.from("my20fit_email_send_recipients").update({ status: "cancelled" }).eq("send_id", sendId).eq("status", "pending");
  }
  return { ok: true };
}

// ---- Auto-abort check untuk 1 send ----
async function checkAutoAbort(admin, s) {
  const sent = s.total_sent || 0;
  if (sent < AUTO_ABORT.min_volume) return null;
  const errorRate = (s.total_failed || 0) / Math.max(1, sent + (s.total_failed || 0));
  if (errorRate > AUTO_ABORT.error_rate) return "error_rate " + (errorRate * 100).toFixed(1) + "%";
  // bounce/complaint dari message_log yang ter-link ke send ini
  const { data: rec } = await admin.from("my20fit_email_send_recipients").select("message_log_id").eq("send_id", s.id).not("message_log_id", "is", null).limit(10000);
  const ids = (rec || []).map((r) => r.message_log_id);
  if (ids.length) {
    const { count: complaints } = await admin.from("my20fit_message_log").select("id", { count: "exact", head: true }).in("id", ids).not("complained_at", "is", null);
    if ((complaints || 0) > 0) return "spam_complaint";
    const { count: bounces } = await admin.from("my20fit_message_log").select("id", { count: "exact", head: true }).in("id", ids).not("bounced_at", "is", null);
    if ((bounces || 0) / Math.max(1, sent) > AUTO_ABORT.bounce_rate) return "bounce_rate";
  }
  return null;
}

// ---- Proses SATU batch (dipanggil cron tiap ~1 menit) ----
async function processBatch(ctx) {
  const { admin, email, comms, campaigns, baseUrl } = ctx;

  // Ambil send aktif tertua (queued/sending). Satu send per panggilan.
  const { data: actives } = await admin.from("my20fit_email_sends")
    .select("*").in("status", ["queued", "sending"]).order("created_at", { ascending: true }).limit(1);
  const s = actives && actives[0];
  if (!s) return { ok: true, idle: true };

  if (s.status === "queued") {
    await admin.from("my20fit_email_sends").update({ status: "sending", started_at: new Date().toISOString() }).eq("id", s.id);
    s.status = "sending";
  }

  // Auto-abort?
  const abort = await checkAutoAbort(admin, s);
  if (abort) {
    await admin.from("my20fit_email_sends").update({ status: "failed", abort_reason: "auto-abort: " + abort }).eq("id", s.id);
    await admin.from("my20fit_email_send_recipients").update({ status: "cancelled" }).eq("send_id", s.id).eq("status", "pending");
    console.warn("[blast] AUTO-ABORT send=" + s.id + " — " + abort);
    return { ok: true, aborted: abort, send_id: s.id };
  }

  // Warm-up: batas harian per send.
  if (s.daily_cap) {
    const dayStart = new Date(); dayStart.setUTCHours(0, 0, 0, 0);
    const { count: sentToday } = await admin.from("my20fit_email_send_recipients")
      .select("id", { count: "exact", head: true }).eq("send_id", s.id).eq("status", "sent").gte("sent_at", dayStart.toISOString());
    if ((sentToday || 0) >= s.daily_cap) return { ok: true, send_id: s.id, capped: true, sent_today: sentToday };
  }

  // Ambil batch pending berikutnya.
  const batchSize = s.batch_size || 50;
  const { data: batch } = await admin.from("my20fit_email_send_recipients")
    .select("*").eq("send_id", s.id).eq("status", "pending").order("created_at", { ascending: true }).limit(batchSize);

  if (!batch || !batch.length) {
    await admin.from("my20fit_email_sends").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", s.id);
    return { ok: true, send_id: s.id, completed: true };
  }

  const unsubBase = baseUrl;
  let sent = 0, failed = 0, skipped = 0;
  for (const r of batch) {
    // CEK ULANG kelayakan (bisa berubah sejak dibekukan — unsubscribe di tengah).
    const prefs = await comms.getPrefsByUser(r.user_id);
    const consentOk = prefs && prefs.consent_marketing;
    const suppressed = await comms.isSuppressed(r.email);
    if (!consentOk || suppressed) {
      await admin.from("my20fit_email_send_recipients").update({ status: "skipped", error_message: !consentOk ? "no_consent" : "suppressed" }).eq("id", r.id);
      skipped++; continue;
    }
    const unsub = await comms.unsubUrl(unsubBase, r.user_id, "marketing");
    const html = await renderTemplate(admin, campaigns, s.template_id, baseUrl, unsub);
    const idem = "blast:" + s.id + ":" + r.user_id;
    const res = await email.send({
      to: r.email, subject: s.subject, html, channel: "marketing",
      campaignId: "blast:" + s.id, templateId: s.template_id, userId: r.user_id,
      unsubscribeUrl: unsub, idempotencyKey: idem,
    });
    if (res.ok && !res.skipped) {
      await admin.from("my20fit_email_send_recipients").update({ status: "sent", sent_at: new Date().toISOString(), message_log_id: null }).eq("id", r.id);
      sent++;
    } else if (res.skipped) {
      await admin.from("my20fit_email_send_recipients").update({ status: "skipped", error_message: res.reason || "skipped" }).eq("id", r.id);
      skipped++;
    } else {
      await admin.from("my20fit_email_send_recipients").update({ status: "failed", error_message: (res.error || "fail").slice(0, 300) }).eq("id", r.id);
      failed++;
    }
  }
  // Update counter agregat.
  await admin.from("my20fit_email_sends").update({
    total_sent: (s.total_sent || 0) + sent,
    total_failed: (s.total_failed || 0) + failed,
  }).eq("id", s.id);

  // Habis? tandai selesai.
  const { count: remaining } = await admin.from("my20fit_email_send_recipients")
    .select("id", { count: "exact", head: true }).eq("send_id", s.id).eq("status", "pending");
  if ((remaining || 0) === 0) {
    await admin.from("my20fit_email_sends").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", s.id);
  }
  return { ok: true, send_id: s.id, batch: { sent, failed, skipped }, remaining: remaining || 0 };
}

// ---- Automation harian (dry-run dulu) ----
// Untuk tiap automation aktif: hitung segmen → keluarkan yang sudah pernah dikirim
// automation ini → filter kelayakan → cap harian → dry-run (catat saja) ATAU antrikan.
async function runAutomations(ctx) {
  const { admin, segments } = ctx;
  const { data: autos } = await admin.from("my20fit_email_automations").select("*").eq("enabled", true);
  const results = [];
  for (const a of autos || []) {
    if (segments.PRESET_IDS.indexOf(a.segment_id) < 0) continue;
    const matched = await segments.computeSegment(admin, a.segment_id);
    // exclude yang SUDAH pernah di-queue automation ini (satu member sekali).
    const { data: doneLog } = await admin.from("my20fit_email_automation_log").select("user_id").eq("automation_id", a.id).eq("action", "queued");
    const done = new Set((doneLog || []).map((x) => x.user_id));
    const fresh = matched.filter((m) => !done.has(m.user_id));
    const { eligible } = await segments.applyEligibility(admin, fresh, "marketing");
    const cap = a.daily_cap || 100;
    const capped = eligible.slice(0, cap);

    if (a.dry_run) {
      // Catat siapa yang AKAN dikirim (review), JANGAN kirim.
      for (let i = 0; i < capped.length; i += 500) {
        const rows = capped.slice(i, i + 500).map((m) => ({ automation_id: a.id, user_id: m.user_id, action: "dry_run" }));
        if (rows.length) await admin.from("my20fit_email_automation_log").upsert(rows, { onConflict: "automation_id,user_id,action" });
      }
      results.push({ automation: a.name, dry_run: true, matched: matched.length, eligible: eligible.length, would_send: capped.length });
      continue;
    }

    // LIVE: buat send + bekukan recipients + log queued.
    if (!capped.length) { results.push({ automation: a.name, queued: 0 }); continue; }
    const { data: send } = await admin.from("my20fit_email_sends").insert({
      name: a.name + " · " + new Date().toISOString().slice(0, 10),
      segment_id: a.segment_id, template_id: a.template_id, subject: a.subject,
      status: "queued", total_matched: matched.length, total_eligible: capped.length,
      daily_cap: a.daily_cap, created_by: "automation", approved_by: "automation",
      test_sent_at: new Date().toISOString(),
    }).select("*").single();
    if (!send) { results.push({ automation: a.name, error: "gagal buat send" }); continue; }
    for (let i = 0; i < capped.length; i += 500) {
      const rows = capped.slice(i, i + 500).map((m) => ({ send_id: send.id, user_id: m.user_id, email: m.email, status: "pending" }));
      await admin.from("my20fit_email_send_recipients").upsert(rows, { onConflict: "send_id,user_id" });
    }
    for (let i = 0; i < capped.length; i += 500) {
      const rows = capped.slice(i, i + 500).map((m) => ({ automation_id: a.id, user_id: m.user_id, action: "queued", send_id: send.id }));
      await admin.from("my20fit_email_automation_log").upsert(rows, { onConflict: "automation_id,user_id,action" });
    }
    results.push({ automation: a.name, queued: capped.length, send_id: send.id });
  }
  return { ok: true, automations: results };
}

module.exports = { TEMPLATES, TEMPLATE_IDS, AUTO_ABORT, renderTemplate, createSend, sendTest, confirmSend, setStatus, processBatch, runAutomations };
