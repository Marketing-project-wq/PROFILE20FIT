// =============================================================
//  auth.js — Logika login / OTP / onboarding untuk 20fit
//  Dipakai bersama oleh login.html, verify.html, onboarding.html,
//  dashboard.html. Butuh: supabase-js (CDN) + supabase-config.js
// =============================================================

(function () {
  const cfg = window.SUPABASE_CONFIG;

  if (!cfg || cfg.SUPABASE_ANON_KEY === "PASTE_ANON_KEY_DISINI") {
    console.warn(
      "[20fit] Anon key belum diisi. Buka supabase-config.js dan tempel anon key dari Supabase > Settings > API."
    );
  }

  // Inisialisasi client Supabase (auth.users untuk login/sesi)
  const supabase = window.supabase.createClient(
    cfg.SUPABASE_URL,
    cfg.SUPABASE_ANON_KEY,
    { auth: { persistSession: true, autoRefreshToken: true } }
  );

  // ---------- Helper umum ----------
  function go(page) {
    window.location.href = page;
  }

  function gen6() {
    // OTP acak 6 digit (tanpa Math.random bias berlebihan)
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return String(100000 + (arr[0] % 900000));
  }

  // ---------- AUTH ----------
  async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    await supabase.auth.signOut();
    go("login.html");
  }

  async function getUser() {
    const { data } = await supabase.auth.getUser();
    return data.user || null;
  }

  // Lindungi halaman — kalau belum login, lempar ke login
  async function requireAuth() {
    const user = await getUser();
    if (!user) {
      go("login.html");
      throw new Error("not-authenticated");
    }
    return user;
  }

  // ---------- PROFIL (my20fit_profile) ----------
  // Pastikan ada 1 baris profil untuk user ini
  async function ensureProfile(user) {
    const { data: rows, error } = await supabase
      .from("my20fit_profile")
      .select("*")
      .eq("auth_user_id", user.id)
      .limit(1);
    if (error) throw error;
    if (rows && rows.length) return rows[0];

    const { data: inserted, error: insErr } = await supabase
      .from("my20fit_profile")
      .insert({ auth_user_id: user.id, email: user.email })
      .select()
      .single();
    if (insErr) throw insErr;
    return inserted;
  }

  async function getProfile() {
    const user = await requireAuth();
    return ensureProfile(user);
  }

  // ---------- OTP "hardcode" (TANPA Supabase Auth email) ----------
  // Generate OTP acak, simpan sementara, dan kembalikan kodenya
  // supaya bisa ditampilkan di layar (karena email belum disambung).
  function startOtp() {
    const code = gen6();
    const expires = Date.now() + (cfg.OTP_TTL_MINUTES || 10) * 60 * 1000;
    sessionStorage.setItem("otp_code", code);
    sessionStorage.setItem("otp_expires", String(expires));
    // TODO: kalau nanti email disambung, kirim "code" ke email user di sini.
    return code;
  }

  function checkOtp(input) {
    input = (input || "").trim();
    // Kode "sakti" / master selalu diterima (untuk testing/admin)
    if (cfg.MASTER_OTP && input === cfg.MASTER_OTP) return true;
    const code = sessionStorage.getItem("otp_code");
    const exp = Number(sessionStorage.getItem("otp_expires") || 0);
    if (!code) return false;
    if (Date.now() > exp) return false;
    return input === code;
  }

  // Setelah OTP benar -> tandai email terverifikasi di profil
  async function markVerified() {
    const user = await requireAuth();
    await ensureProfile(user);
    const { error } = await supabase
      .from("my20fit_profile")
      .update({ email_verified_at: new Date().toISOString() })
      .eq("auth_user_id", user.id);
    if (error) throw error;
    sessionStorage.removeItem("otp_code");
    sessionStorage.removeItem("otp_expires");
  }

  // ---------- ONBOARDING ----------
  // Simpan gender, umur (dari tgl lahir), tinggi, berat
  async function saveOnboarding({ gender, birthdate, height_cm, weight_kg }) {
    const user = await requireAuth();
    await ensureProfile(user);

    let age = null;
    if (birthdate) {
      const b = new Date(birthdate);
      const t = new Date("2026-06-26"); // tanggal acuan
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
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("auth_user_id", user.id);
    if (error) throw error;
  }

  // ---------- ROUTING setelah login/verifikasi ----------
  // Tentukan user harus ke mana berikutnya
  async function routeAfterAuth() {
    const user = await requireAuth();
    const profile = await ensureProfile(user);

    if (!profile.email_verified_at) return go("verify.html");
    // User lama (sudah pernah onboarding di app 20fit/photo) -> skip
    if (profile.onboarding_completed) return go("dashboard.html");
    return go("onboarding.html");
  }

  // Expose
  window.Auth = {
    supabase,
    signUp,
    signIn,
    signOut,
    getUser,
    requireAuth,
    getProfile,
    ensureProfile,
    startOtp,
    checkOtp,
    markVerified,
    saveOnboarding,
    routeAfterAuth,
    go,
  };
})();
