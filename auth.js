// =============================================================
//  auth.js — Logika login / OTP / onboarding (versi produksi)
//  - Config (URL + anon key) diambil dari server: GET /api/config
//  - OTP diproses di SERVER (/api/send-otp, /api/verify-otp)
//  Butuh: supabase-js (CDN) di halaman.
// =============================================================

(function () {
  let supabase = null;
  let cfgUrl = null, cfgKey = null;

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
    } catch (e) { /* pakai fallback */ }
    cfgUrl = url; cfgKey = key;
    supabase = window.supabase.createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
    return supabase;
  })();

  // ---------- LOGIN GOOGLE (OAuth) ----------
  async function signInWithGoogle() {
    await ready;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/login.html" },
    });
    if (error) throw error;
    return data;
  }

  // ---------- MAGIC LINK / LOGIN PAKAI KODE EMAIL (isolated via my20fit-otp) ----------
  async function loginSend(email) {
    await ready;
    const r = await fetch(cfgUrl + "/functions/v1/my20fit-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + cfgKey, "apikey": cfgKey },
      body: JSON.stringify({ action: "login_send", email: email }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "Gagal mengirim kode login.");
    return j; // { ok, sent, devCode? }
  }
  async function verifyLoginCode(email, token) {
    await ready;
    const { data, error } = await supabase.auth.verifyOtp({ email: email, token: token, type: "email" });
    if (error) throw error;
    return data;
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
  async function signUp(email, password, fullName, phone) {
    await ready;
    if (fullName) sessionStorage.setItem("pending_name", fullName);
    if (phone) sessionStorage.setItem("pending_phone", phone);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName || null, phone: phone || null } },
    });
    if (error) throw error;
    // Kalau signUp belum memberi sesi (mis. konfirmasi email), langsung login
    // supaya user GAK perlu sign in lagi. User sudah auto-confirmed di DB.
    if (!data.session) {
      const { error: e2 } = await supabase.auth.signInWithPassword({ email, password });
      if (e2) {
        // signUp tanpa sesi + signin gagal "invalid" = email sudah terdaftar
        // (dgn password berbeda). Kasih pesan jelas.
        if (String(e2.message || "").toLowerCase().includes("invalid login")) {
          const err = new Error("Email sudah terdaftar. Klik Sign In (pakai password lama) atau daftar pakai email lain.");
          err.code = "email_exists";
          throw err;
        }
        throw e2;
      }
    }
    return data;
  }

  async function signIn(email, password) {
    await ready;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
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

    const { error } = await supabase
      .from("my20fit_profile")
      .update({
        gender: gender || null,
        gender_selected_at: gender ? new Date().toISOString() : null,
        age: age,
        height_cm: height_cm || null,
        weight_kg: weight_kg || null,
        main_goal: main_goal || null,
        health_conditions: health_conditions || [],
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("auth_user_id", user.id);
    if (error) throw error;
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

  // ---------- ROUTING ----------
  async function routeAfterAuth() {
    const user = await requireAuth();
    const profile = await ensureProfile(user);
    // Verifikasi email (OTP) opsional untuk sekarang -> langsung masuk.
    // User lama yang sudah onboarding -> dashboard; user baru -> onboarding.
    if (profile.onboarding_completed) return go("dashboard.html");
    return go("onboarding.html");
  }

  window.Auth = {
    ready,
    signUp,
    signIn,
    signInWithGoogle,
    loginSend,
    verifyLoginCode,
    signOut,
    getUser,
    requireAuth,
    getProfile,
    ensureProfile,
    sendOtp,
    verifyOtp,
    saveOnboarding,
    bmiInfo,
    getDailyLog,
    saveDaily,
    routeAfterAuth,
    go,
  };
  Object.defineProperty(window.Auth, "supabase", { get: function () { return supabase; } });
})();
