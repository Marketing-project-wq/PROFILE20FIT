// =============================================================
//  auth.js — Logika login / OTP / onboarding (versi produksi)
//  - Config (URL + anon key) diambil dari server: GET /api/config
//  - OTP diproses di SERVER (/api/send-otp, /api/verify-otp)
//  Butuh: supabase-js (CDN) di halaman.
// =============================================================

(function () {
  let supabase = null;
  let cfgUrl = null, cfgKey = null;
  let cfgGoogleClientId = ""; // Client ID GIS dari /api/config (publik; kosong = tombol Google disembunyikan)

  // URL + anon key PUBLIK — ditanam sebagai fallback supaya web SELALU konek
  // walau /api/config kosong / server belum di-update.
  const FALLBACK_URL = "https://cpvzwqptzcxnwzfzgrmt.supabase.co";
  const FALLBACK_ANON =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwdnp3cXB0emN4bnd6Znpncm10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MzE0MzksImV4cCI6MjA5MTIwNzQzOX0.DIP-tTFxa3GHMhT6b1Tq-Zz0a24P-vbU9ixEtITbqpI";

  // Bootstrap async: pakai config server kalau ada, kalau tidak pakai fallback
  const ready = (async function init() {
    let url = FALLBACK_URL, key = FALLBACK_ANON;
    try {
      const r = await fetch("/api/config");
      const c = await r.json();
      if (c && c.supabaseUrl && c.supabaseAnonKey) { url = c.supabaseUrl; key = c.supabaseAnonKey; }
      if (c && typeof c.googleClientId === "string") cfgGoogleClientId = c.googleClientId;
    } catch (e) { /* pakai fallback */ }
    cfgUrl = url; cfgKey = key;
    supabase = window.supabase.createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
    return supabase;
  })();

  // Heartbeat aktivitas (best-effort) — untuk dashboard admin "siapa aktif/tidak".
  // Dipanggil sekali saat halaman dimuat kalau user sudah login. Tidak memblokir apa pun.
  ready.then(async function () {
    try {
      const { data } = await supabase.auth.getSession();
      if (data && data.session) {
        fetch("/api/activity/ping", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + data.session.access_token },
          body: JSON.stringify({ page: location.pathname }),
        }).catch(function () {});
      }
    } catch (e) {}
  });

  // ---------- MAGIC LINK / LOGIN PAKAI KODE EMAIL (isolated via my20fit-otp) ----------
  async function loginSend(email) {
    await ready;
    // Kode login HANYA untuk email yang sudah punya akun. Gerbang ini ditegakkan
    // di edge function (my20fit-otp) yang punya akses DB sendiri -> tidak
    // tergantung env server. Email tanpa akun -> 404 not_registered.
    const r = await fetch(cfgUrl + "/functions/v1/my20fit-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + cfgKey, "apikey": cfgKey },
      body: JSON.stringify({ action: "login_send", email: email }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      if (r.status === 404 || (j && j.error === "not_registered")) {
        const err = new Error("Email belum terdaftar."); err.code = "not_registered"; throw err;
      }
      throw new Error(j.error || "Gagal mengirim kode login.");
    }
    return j; // { ok, sent, devCode? }
  }
  async function verifyLoginCode(email, token) {
    await ready;
    const { data, error } = await supabase.auth.verifyOtp({ email: email, token: token, type: "email" });
    if (error) throw error;
    return data;
  }

  // ---------- LOGIN PAKAI AKUN 20FIT (FITCO) ----------
  // Server memverifikasi email+password ke API FITCO, lalu (kalau benar)
  // menyiapkan akun Supabase yang sama + mengembalikan kode OTP untuk
  // membuat sesi. Data user tersimpan di database kita (Supabase) selamanya.
  async function fitcoLogin(email, password) {
    await ready;
    const r = await fetch("/api/fitco-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, password: password }),
    });
    const j = await r.json();
    if (!r.ok || !j.email_otp) throw new Error(j.error || "Gagal login dengan akun 20FIT.");
    // Simpan user_id + token 20FIT (dipakai untuk order/pembayaran shop 20FIT).
    try {
      if (j.fitco_user_id) localStorage.setItem("fitco_uid", String(j.fitco_user_id));
      if (j.fitco_token) localStorage.setItem("fitco_token", j.fitco_token);
    } catch (e) {}
    // Buat sesi Supabase dari OTP yang di-generate server (pola sama dgn magic link)
    const { data, error } = await supabase.auth.verifyOtp({ email: j.email, token: j.email_otp, type: "email" });
    if (error) throw error;
    return data;
  }

  // ---------- REGISTER pakai API 20FIT (lewat server /api/fitco-register) ----------
  async function fitcoRegister(fields) {
    await ready;
    const r = await fetch("/api/fitco-register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields || {}),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.email_otp) {
      const e = new Error(j.error || "Gagal daftar.");
      if (r.status === 409) e.code = "email_exists";
      throw e;
    }
    // Simpan user_id + token 20FIT (dipakai untuk order/pembayaran shop 20FIT).
    try {
      if (j.fitco_user_id) localStorage.setItem("fitco_uid", String(j.fitco_user_id));
      if (j.fitco_token) localStorage.setItem("fitco_token", j.fitco_token);
    } catch (e) {}
    const { data, error } = await supabase.auth.verifyOtp({ email: j.email, token: j.email_otp, type: "email" });
    if (error) throw error;
    return data;
  }

  // ---------- LOGIN PAKAI GOOGLE (via API 20FIT /auth/login/google) ----------
  // credential = ID token dari Google Identity Services. Server yang meneruskan
  // ke API 20FIT (dokumentasi developer) lalu mengembalikan OTP untuk sesi.
  async function fitcoGoogleLogin(credential) {
    await ready;
    const r = await fetch("/api/fitco-google-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: credential }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.email_otp) throw new Error(j.error || "Gagal login dengan Google.");
    // Simpan user_id + token 20FIT (dipakai untuk order/pembayaran shop 20FIT).
    try {
      if (j.fitco_user_id) localStorage.setItem("fitco_uid", String(j.fitco_user_id));
      if (j.fitco_token) localStorage.setItem("fitco_token", j.fitco_token);
    } catch (e) {}
    const { data, error } = await supabase.auth.verifyOtp({ email: j.email, token: j.email_otp, type: "email" });
    if (error) throw error;
    return data;
  }

  // ---------- SSO SEAMLESS: login pakai access_token 20FIT (tanpa password) ----------
  // Dipakai kalau app utama 20FIT mengoper token-nya ke my.20fit.id.
  async function tokenLogin(fitcoToken) {
    await ready;
    const r = await fetch("/api/fitco-token-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: fitcoToken }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.email_otp) throw new Error(j.error || "Gagal login dengan token 20FIT.");
    const { data, error } = await supabase.auth.verifyOtp({ email: j.email, token: j.email_otp, type: "email" });
    if (error) throw error;
    return data;
  }

  // ---------- SSO KELUAR: buka 20FIT Photo (photo.20fit.id) tanpa login ulang ----------
  // Server mint OTP satu-kali untuk email sesi yang sedang aktif, lalu kita
  // pindah ke photo.20fit.id dengan OTP di URL fragment (#) — fragment tidak
  // pernah dikirim ke server photo, hanya dibaca halaman /sso di browser.
  async function photoSso() {
    await ready;
    const at = await token();
    if (!at) throw new Error("Sesi habis. Silakan login ulang.");
    const r = await fetch("/api/photo-sso", { method: "POST", headers: { Authorization: "Bearer " + at } });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.email_otp || !j.sso_url) throw new Error(j.error || "Gagal membuka 20FIT Photo.");
    location.href = j.sso_url + "#email=" + encodeURIComponent(j.email) + "&code=" + encodeURIComponent(j.email_otp);
  }

  // ---------- VERIFIKASI OTP AKUN 20FIT (wajib pasca-registrasi baru) ----------
  // OTP ini BEDA dari OTP Supabase kita (sendOtp/verifyOtp di bawah) — ini kode
  // yang dikirim 20FIT sendiri untuk memverifikasi akun di ekosistem mereka.
  async function fitcoVerifyEmail(email, otp) {
    const r = await fetch("/api/fitco-verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, otp: otp }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || "Verifikasi gagal.");
    return j;
  }
  async function fitcoResendVerifyEmail(email) {
    const r = await fetch("/api/fitco-resend-verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || "Gagal mengirim ulang kode.");
    return j;
  }

  // Apakah akun ini SUDAH punya password web? (Google/OTP/FITCO-Google = belum)
  function hasWebPassword(user) { return !!(user && user.user_metadata && user.user_metadata.has_pw); }
  // Set password web (dipakai di onboarding kalau user belum punya password)
  async function setWebPassword(pw) {
    await ready;
    if (!pw || pw.length < 8) throw new Error("Password minimal 8 karakter.");
    const { error } = await supabase.auth.updateUser({ password: pw, data: { has_pw: true } });
    if (error) throw error;
    return true;
  }

  function go(page) {
    window.location.href = page;
  }

  async function token() {
    await ready;
    const { data } = await supabase.auth.getSession();
    return data.session ? data.session.access_token : null;
  }

  // ---------- AUTH ----------
  async function signIn(email, password) {
    await ready;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // Login pakai password = jelas sudah punya password -> tandai (gak diminta bikin lagi)
    try { await supabase.auth.updateUser({ data: { has_pw: true } }); } catch (e) {}
    return data;
  }

  // ---------- ISOLASI DATA PER-AKUN DI SATU DEVICE ----------
  // Cache lokal (kalori, berat, puasa, medical, achievement) tidak boleh
  // kebawa ke akun lain saat ganti akun di browser yang sama.
  function purgeUserCache() {
    try {
      const kill = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (/^my20fit_cal_/.test(k) || k === "my20fit_weight" || k === "my20fit_if" ||
            k === "my20fit_mcu_last" || /^my20fit_ach/.test(k) || /^if_/.test(k) || /^mcu_/.test(k)) {
          kill.push(k);
        }
      }
      kill.forEach(k => { try { localStorage.removeItem(k); } catch (e) {} });
    } catch (e) {}
  }
  let isoDone = false;
  function isolateDevice(user) {
    if (isoDone || !user) return;
    isoDone = true;
    try {
      const prev = localStorage.getItem("my20fit_uid");
      if (prev && prev !== user.id) purgeUserCache(); // akun berganti -> buang cache akun lama
      localStorage.setItem("my20fit_uid", user.id);
    } catch (e) {}
  }

  async function signOut() {
    await ready;
    try { purgeUserCache(); localStorage.removeItem("my20fit_uid"); } catch (e) {}
    await supabase.auth.signOut();
    go("login.html");
  }

  async function getUser() {
    await ready;
    // Pakai sesi LOKAL (localStorage) — tidak bergantung panggilan jaringan,
    // jadi langsung kebaca tepat setelah daftar/login (gak balik ke login).
    const { data } = await supabase.auth.getSession();
    const user = (data.session && data.session.user) || null;
    isolateDevice(user);
    return user;
  }

  async function requireAuth() {
    const user = await getUser();
    if (!user) {
      go("login.html");
      throw new Error("not-authenticated");
    }
    return user;
  }

  // ---------- PROFIL (my20fit_profile) ----------
  async function ensureProfile(user) {
    await ready;
    const { data: rows, error } = await supabase
      .from("my20fit_profile")
      .select("*")
      .eq("auth_user_id", user.id)
      .limit(1);
    if (error) throw error;
    if (rows && rows.length) return rows[0];

    const md = user.user_metadata || {};
    const pendingName = md.full_name || sessionStorage.getItem("pending_name") || null;
    const pendingPhone = md.phone || sessionStorage.getItem("pending_phone") || null;
    const { data: inserted, error: insErr } = await supabase
      .from("my20fit_profile")
      .insert({
        auth_user_id: user.id,
        email: user.email,
        full_name: pendingName,
        phone: pendingPhone,
      })
      .select()
      .single();
    if (insErr) throw insErr;
    return inserted;
  }

  async function getProfile() {
    const user = await requireAuth();
    return ensureProfile(user);
  }

  // ---------- OTP (diproses di SERVER) ----------
  async function sendOtp() {
    const t = await token();
    if (!t) throw new Error("Belum login.");
    const r = await fetch("/api/send-otp", {
      method: "POST",
      headers: { Authorization: "Bearer " + t },
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "Gagal mengirim kode.");
    return j; // { ok, sent, devCode? }
  }

  async function verifyOtp(code) {
    const t = await token();
    if (!t) throw new Error("Belum login.");
    const r = await fetch("/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + t },
      body: JSON.stringify({ code: code }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "Kode salah.");
    return j;
  }

  // ---------- ONBOARDING ----------
  async function saveOnboarding({ gender, birthdate, height_cm, weight_kg, main_goal, health_conditions }) {
    const user = await requireAuth();
    await ensureProfile(user);

    let age = null;
    if (birthdate) {
      const b = new Date(birthdate);
      const t = new Date();
      age = t.getFullYear() - b.getFullYear();
      const m = t.getMonth() - b.getMonth();
      if (m < 0 || (m === 0 && t.getDate() < b.getDate())) age--;
    }

    const upd = {
      gender: gender || null,
      gender_selected_at: gender ? new Date().toISOString() : null,
      height_cm: height_cm || null,
      weight_kg: weight_kg || null,
      main_goal: main_goal || null,
      health_conditions: health_conditions || [],
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    };
    // Hanya set umur kalau tgl lahir diisi; jangan hapus umur yg sudah ada (mis. dari akun 20FIT).
    if (age !== null) upd.age = age;
    const { error } = await supabase
      .from("my20fit_profile")
      .update(upd)
      .eq("auth_user_id", user.id);
    if (error) throw error;
  }

  // ---------- KUOTA SCAN KALORI (10x / bulan + kredit top-up) ----------
  // Disimpan di my20fit_profile supaya SINKRON lintas device.
  const SCAN_FREE = 10;
  function periodNow() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); // YYYY-MM
  }
  function shapeQuota(p) {
    const per = periodNow();
    let used = (p && p.scan_period === per) ? (p.scan_count || 0) : 0; // reset tiap bulan
    const credits = (p && p.scan_credits) || 0;
    const freeLeft = Math.max(0, SCAN_FREE - used);
    return { used: used, freeLimit: SCAN_FREE, freeLeft: freeLeft, credits: credits, remaining: freeLeft + credits, period: per };
  }
  // Baca kuota terkini
  async function getScanQuota() {
    const p = await getProfile();
    return shapeQuota(p);
  }
  // Pakai 1 scan (dipanggil SETELAH scan berhasil). Return kuota terbaru.
  // SERVER-AUTHORITATIVE: konsumsi lewat /api/scan/consume (RPC atomik my20fit_consume_scan).
  // Client TIDAK lagi menulis saldo langsung ke Supabase. Kalau habis -> throw {code:"scan_limit"}.
  async function consumeScan() {
    await ready;
    await requireAuth();
    const t = await token();
    const r = await fetch("/api/scan/consume", { method: "POST", headers: { Authorization: "Bearer " + (t || "") } });
    const j = await r.json().catch(function () { return {}; });
    if (r.status === 402 || (j && j.code === "scan_limit")) {
      const err = new Error("Scan quota habis."); err.code = "scan_limit"; throw err;
    }
    if (!r.ok || !j.ok) throw new Error((j && j.error) || "Gagal memproses scan.");
    return j.quota;
  }
  // Kredit top-up ditambahkan SERVER-AUTHORITATIVE (webhook Xendit untuk pembayaran,
  // atau creditScanOrder saat voucher bikin gratis). Client TIDAK menulis saldo —
  // cukup ambil kuota terbaru dari profil. (Argumen lama diabaikan; dipertahankan
  // agar pemanggil lama tetap kompatibel.)
  async function addScanCredits() {
    await ready;
    return await getScanQuota();
  }

  // Hitung kategori BMI (dipakai live preview di form)
  function bmiInfo(weightKg, heightCm) {
    if (!weightKg || !heightCm) return null;
    const m = heightCm / 100;
    const bmi = weightKg / (m * m);
    let label, color, desc;
    if (bmi < 18.5) { label = "Underweight"; color = "#e11d2a"; desc = "Berat di bawah ideal."; }
    else if (bmi < 25) { label = "Normal"; color = "#2A7A4F"; desc = "Berat ideal, pertahankan!"; }
    else if (bmi < 30) { label = "Overweight"; color = "#C87000"; desc = "Sedikit di atas ideal."; }
    else { label = "Obese"; color = "#e11d2a"; desc = "Jauh di atas ideal."; }
    return { bmi: bmi.toFixed(1), label, color, desc };
  }

  // ---------- DAILY LOG (sleep / water / breathing) -> my20fit_daily_log ----------
  function todayStr() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  async function getDailyLog() {
    const user = await requireAuth();
    const { data, error } = await supabase
      .from("my20fit_daily_log")
      .select("*")
      .eq("auth_user_id", user.id)
      .eq("log_date", todayStr())
      .limit(1);
    if (error) throw error;
    return (data && data[0]) || null;
  }

  // Upsert sebagian field untuk hari ini (per user + tanggal)
  async function saveDaily(fields) {
    const user = await requireAuth();
    const row = Object.assign(
      { auth_user_id: user.id, log_date: todayStr(), updated_at: new Date().toISOString() },
      fields
    );
    const { data, error } = await supabase
      .from("my20fit_daily_log")
      .upsert(row, { onConflict: "auth_user_id,log_date" })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // Profil dianggap LENGKAP hanya jika data inti sudah terisi: gender, umur
  // (dari tanggal lahir), berat, tinggi, dan tujuan. Riwayat kesehatan boleh kosong.
  // Dipakai agar akun lama (mis. dari ekosistem 20FIT) yang datanya belum lengkap
  // tetap diminta melengkapi lewat onboarding.
  function profileComplete(p) {
    return !!(p && p.gender && p.age && p.weight_kg && p.height_cm && p.main_goal);
  }

  // ---------- ROUTING ----------
  // Flow jelas untuk semua (akun baru & akun existing dari ekosistem 20FIT):
  //   0) akun 20FIT ada tapi belum verified -> VERIFIKASI OTP 20FIT dulu
  //   1) belum lengkap  -> isi DATA dulu (onboarding)
  //   2) data lengkap tapi belum punya password web -> BUAT PASSWORD
  //   3) lengkap & punya password -> dashboard
  async function routeAfterAuth() {
    const user = await requireAuth();
    const profile = await ensureProfile(user);
    // Sengaja HANYA cek fitco_email_verified, TIDAK ikut syaratkan fitco_user_id.
    // fitco_user_id kadang masih null tepat setelah registrasi baru (dia baru
    // ke-isi dari langkah login best-effort di /api/fitco-register, yang justru
    // hampir pasti GAGAL untuk akun yang belum verified — akar masalah yang lagi
    // kita perbaiki). fitco_email_verified sendiri sudah cukup & selalu di-set
    // eksplisit (true/false) oleh server begitu ada sinyal dari 20FIT, jadi jangan
    // tambahkan lagi dependency ke fitco_user_id di sini tanpa paham konteks ini.
    if (profile.fitco_email_verified === false) return go("verify.html");
    if (!profileComplete(profile)) return go("onboarding.html");
    if (!hasWebPassword(user)) return go("setpassword.html");
    return go("dashboard.html");
  }

  window.Auth = {
    ready,
    signIn,
    loginSend,
    verifyLoginCode,
    fitcoLogin,
    fitcoGoogleLogin,
    googleClientId: function () { return cfgGoogleClientId; },
    fitcoRegister,
    tokenLogin,
    photoSso,
    fitcoVerifyEmail,
    fitcoResendVerifyEmail,
    hasWebPassword,
    setWebPassword,
    signOut,
    getUser,
    requireAuth,
    getProfile,
    ensureProfile,
    sendOtp,
    verifyOtp,
    saveOnboarding,
    getScanQuota,
    consumeScan,
    addScanCredits,
    profileComplete,
    bmiInfo,
    getDailyLog,
    saveDaily,
    routeAfterAuth,
    token,
    go,
  };
  Object.defineProperty(window.Auth, "supabase", { get: function () { return supabase; } });
})();
