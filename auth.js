// =============================================================
//  auth.js — Logika login / OTP / onboarding (versi produksi)
//  - Config (URL + anon key) diambil dari server: GET /api/config
//  - OTP diproses di SERVER (/api/send-otp, /api/verify-otp)
//  Butuh: supabase-js (CDN) di halaman.
// =============================================================

(function () {
  let supabase = null;

  // Bootstrap async: ambil config dari server, lalu buat client
  const ready = (async function init() {
    let cfg = { supabaseUrl: "", supabaseAnonKey: "" };
    try {
      const r = await fetch("/api/config");
      cfg = await r.json();
    } catch (e) {
      console.error("[20fit] Gagal ambil /api/config:", e);
    }
    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
      console.warn("[20fit] Supabase belum dikonfigurasi di server (env vars).");
    }
    supabase = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
    return supabase;
  })();

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
    return data;
  }

  async function signIn(email, password) {
    await ready;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    await ready;
    await supabase.auth.signOut();
    go("login.html");
  }

  async function getUser() {
    await ready;
    const { data } = await supabase.auth.getUser();
    return data.user || null;
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
    if (!profile.email_verified_at) return go("verify.html");
    if (profile.onboarding_completed) return go("dashboard.html");
    return go("onboarding.html");
  }

  window.Auth = {
    ready,
    signUp,
    signIn,
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
})();
