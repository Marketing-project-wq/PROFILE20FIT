// =============================================================
//  i18n.js — Bahasa global (English default + toggle EN/ID)
//  - Terjemahkan teks statis: <tag data-i18n="key"> & placeholder data-i18n-ph="key"
//  - Untuk teks dinamis (di-generate JS) pakai helper global L({en:"..",id:".."})
//  - Toggle EN/ID otomatis muncul di tiap halaman (kecuali yang sudah punya .lang)
//  - Simpan pilihan di localStorage "lang" (dibagi dgn login.html)
// =============================================================
(function () {
  const DICT = {
    en: {
      // nav
      nav_home:"Home", nav_medical:"Medical", nav_progress:"Activity", nav_calories:"Calories", nav_profile:"Profile", nav_scan:"Scan",
      logout:"Log Out",
      book_title:"Book at 20FIT", book_class:"Book a class", book_consult:"Book a doctor consultation",
      book_recworkout:"Ready to train? Book your class at 20FIT.", book_recmed:"Based on your results, book a session at the 20FIT clinic.",
      // dashboard
      welcome:"Welcome",
      sec_weather:"Weather & Air Quality", sec_recs:"Recommended Workouts", sec_breath:"Breathing Exercise",
      sec_sleepwater:"Sleep & Water", sec_checklist:"Today's Checklist", sec_cycle:"Menstrual Cycle",
      stat_bmi:"BMI", stat_weight:"Weight", stat_height:"Height",
      aqi_title:"Air Quality · AQI",
      breath_anxiety:"Anxiety", breath_workout:"Workout", breath_relax:"Relax",
      start:"Start", stop:"Stop", ready:"Ready", press_start:"Tap start",
      sleep_label:"Sleep — what time you sleep & wake", bedtime:"Bedtime", waketime:"Wake up",
      hours:"hours", save_sleep:"Save Sleep",
      water_label:"Water (glasses) · target 8", glasses_of:"glasses",
      daysync_note:"Sleep & water are saved automatically to your account.",
      // checklist head
      // cycle
      cycle_intro:"Track your cycle for workout tips that fit your body.",
      cycle_lastperiod:"First day of your last period", cycle_save:"Save", cycle_edit:"Change Date",
      cycle_starttoday:"My period started today", cycle_dayof:"Day", cycle_of:"of", cycle_next:"next period in", cycle_days:"days",
      cycle_endtoday:"My period ended today", cycle_onperiod:"You're on your period.", cycle_endstoday:"Your period likely ends today.",
      cycle_disc:"Estimates from your input — not medical advice or a contraceptive method.",
      // medical
      med_kick:"Medical record",
      med_title:"Medical Record", med_sub:"Your medical check-up results & recommendations.",
      med_upload:"Upload Medical Check-Up", med_uploadsub:"PDF / JPG / PNG from any facility — analysed automatically with AI",
      med_history:"History", med_empty:"No MCU results yet. Upload your check-up above.",
      med_analysing:"Compressing & analysing document…",
      med_attention:"Needs Attention", med_params:"Parameter Details", med_normal:"Normal",
      med_eating:"Eating Plan", med_exercise:"Exercise Recommendations", med_lifestyle:"Lifestyle & Follow-up",
      med_why:"Why it matters:", med_do:"What you can do:", med_unread:"Unreadable parts:",
      med_consult_t:"Talk to a 20FIT doctor", med_consult_s:"Have questions about your results? Book a consultation with our Sport Clinic doctor.", med_consult_cta:"Consult a Doctor",
      // calories
      cal_title:"Calorie Tracker", cal_of:"of", cal_today:"kcal today",
      cal_goalnote:"Calculated from your profile (weight, height, age, gender, goal).",
      cal_targetlbl:"Your daily calorie target", cal_perday:"kcal / day — from your BMI & profile",
      cal_eaten:"Eaten", cal_left:"Left", cal_scanbtn:"Scan food to count calories", cal_ormanual:"or add manually",
      cal_takephoto:"Take photo", cal_album:"Album",
      cal_protein:"Protein", cal_carbs:"Carbs", cal_fat:"Fat", cal_macros:"Macros today",
      cal_togo:"kcal to go", cal_over:"kcal over target",
      cal_ortype:"or type food + grams (auto kcal)", cal_grams:"grams", cal_estimating:"Estimating calories…", cal_needboth:"Type a food name & grams.",
      cal_foodname:"Food name", cal_today_sec:"Today's Food", cal_empty:"No entries yet. Add food above.",
      cal_scan:"Scan Food (AI)", cal_photo:"Photo / Upload Food",
      cal_analysing:"Analysing food…", cal_detected:"Detected", cal_addlog:"+ Add to Today's Log", cal_added:"Added to log ✓",
      recipe_ing:"Ingredients", recipe_steps:"How to make",
      // menu recommendation (calories)
      cal_mrec_title:"Menu recommendations", cal_mrec_sub:"Based on your remaining macros today · swipe for more",
      cal_mrec_loading:"Loading recommendations…", cal_mrec_more:"See more menus →", cal_mrec_disc:"Rough guidance — not a substitute for a nutritionist.",
      // medical extra
      med_close:"Close",
      // corporate program (profile)
      corp_join_t:"Join Corporate Program", corp_join_d:"Enter the unique code from your company/HR to join the employee wellness program.",
      corp_code:"Company code", corp_code_ph:"e.g. ACME-7K2P", corp_continue:"Continue", corp_cancel:"Cancel",
      corp_consent_t:"Consent", corp_join_to:"You are about to join:", corp_visible:"What the company (HR admin) will be able to see:",
      corp_v_bmi:"BMI status", corp_v_mcu:"Medical Check-Up (MCU) results", corp_v_demo:"Gender & age", corp_v_freq:"20FIT product usage frequency", corp_agree:"Agree & Join",
      // onboarding
      ob_head:"Complete Profile", ob_sub:"This helps us tailor your recommendations.",
      ob_gender:"Gender", ob_male:"Male", ob_female:"Female", ob_dob:"Date of Birth", ob_weight:"Weight (kg)", ob_height:"Height (cm)",
      ob_goal:"Your Main Goal", ob_goal_sub:"What do you want to achieve?",
      ob_goal_lose:"Lose Weight", ob_goal_muscle:"Build Muscle", ob_goal_health:"Be Healthier", ob_goal_fit:"Improve Fitness",
      ob_health:"Health Conditions", ob_health_sub:"Anything we should know? (choose any / leave empty)",
      ob_c_hyper:"Hypertension", ob_c_diab:"Diabetes", ob_c_chol:"Cholesterol", ob_c_heart:"Heart", ob_c_asthma:"Asthma", ob_c_injury:"Injury",
      ob_other:"Other (optional)", ob_other_ph:"e.g. certain allergies", ob_save:"Save & Continue",
      // progress
      prog_title:"Progress", prog_text:"Weekly stats, achievements, and your training calendar are coming soon.", prog_soon:"Coming Soon",
      // profile
      prof_title:"My Profile", prof_name:"Full Name", prof_email:"Email", prof_phone:"Phone",
      prof_gender:"Gender", prof_male:"Male", prof_female:"Female", prof_weight:"Weight (kg)", prof_height:"Height (cm)",
      prof_goal:"Main Goal", prof_pick:"— choose —", prof_lose:"Lose Weight", prof_muscle:"Build Muscle",
      prof_healthier:"Get Healthier", prof_fit:"Improve Fitness", prof_save:"Save Changes", prof_logout:"Log Out",
      prof_topup:"Add scans", prof_detail:"Profile details", prof_edit:"Edit", prof_edit_title:"Edit profile", prof_cancel:"Cancel", prof_pay_detail:"Payment details",
      prof_hist_sec:"Purchase History", prof_hist_empty:"No purchases yet.",
      prof_menu_sec:"My Menu Contributions", prof_menu_empty:"You haven't shared any menus yet. Share one from the Diet page.",
      prof_danger:"Danger zone", prof_del_hint:"Permanently delete your account and all your data. This cannot be undone.", prof_del_btn:"Delete my account",
      ob_email_pref:"Email preferences", ob_email_sub:"May we email you? (optional — you can change this anytime)", ob_consent_mkt:"Nutrition tips & news from 20FIT", ob_consent_meal:"Meal-logging reminders",
      corp_title:"Corporate Program", emailpref_title:"Email preferences", emailpref_mkt:"Nutrition tips & news from 20FIT", emailpref_meal:"Meal-logging reminders (email)",
      prof_del_title:"Delete account", prof_del_warn:"This permanently deletes your profile, health data (MCU), daily logs, menu contributions, and purchase history. It cannot be undone.", prof_del_type:"Type DELETE to confirm", prof_del_confirm:"Delete permanently",
      // diet
      diet_title:"Diet",
      diet_intro:"20FIT meal recommendations — pick a diet type, then tap a dish for the full recipe.",
      diet_disc:"Calorie & macro figures are estimates for portion guidance — not a substitute for professional nutrition advice. Photos are placeholders; real photos coming soon.",
      diet_recipes_loading:"Loading recipes…",
      diet_none:"No recipes for this type yet.",
      diet_all:"All",
      diet_user_contrib:"user contribution",
      diet_nutri_est:"Nutrition figures are estimates — not professional advice.",
      diet_kcal:"kcal",
      diet_logfood:"Log Food (I ate this)", diet_logged:"Added to today's log ·", diet_undo:"Undo", diet_log_undone:"Removed from log", diet_log_nokcal:"Calories unknown — can't add to your daily count yet.",
      diet_share_cta:"Share Your Menu",
      diet_share_hint:"Contribute a recipe & earn free scans",
      diet_tc:"Share your healthy menu. For every 10 menus approved by our admin you earn 5 free calorie scans — repeatable. Duplicate or low-effort submissions may be rejected.",
      diet_reward_h:"Menu Contribution → Free Scan",
      diet_reward_toward:"approved menus toward your next +{n} free scans",
      diet_reward_total:"Total approved:",
      diet_reward_earned:"Free scans earned:",
      diet_submit_h:"Submit a healthy menu",
      diet_l_name:"Menu name",
      diet_ph_name:"e.g. Teriyaki chicken rice bowl",
      diet_l_type:"Diet type",
      diet_l_ing:"Ingredients",
      diet_ph_ing:"List the ingredients…",
      diet_l_steps:"How to make",
      diet_ph_steps:"Steps to make it…",
      diet_l_kcal:"Estimated calories",
      diet_optional:"(optional)",
      diet_ph_kcal:"e.g. 550",
      diet_l_photo:"Photo",
      diet_btn_submit:"Submit menu",
      diet_track_hint:"Track your submissions and revise rejected menus in your Profile.",
      diet_rev_h:"Revise menu",
      diet_btn_rev:"Submit revision",
      diet_cancel:"Cancel",
      diet_close:"Close",
      diet_loading:"Loading…",
      diet_st_approved:"Approved", diet_st_rejected:"Rejected", diet_st_pending:"Pending",
      diet_reason:"Reason:",
      diet_revise:"Revise & resubmit",
      diet_err_required:"Name, ingredients and steps are required.",
      diet_sending:"Sending…",
      diet_sent:"Menu sent! Awaiting admin review.",
      diet_err_send:"Failed to send.",
      diet_err_net:"Network error.",
      diet_err_load:"Failed to load.",
      diet_err_img:"Image files only.",
      diet_err_big:"Photo too large (max 8MB).",
      diet_err_photo:"Failed to process photo.",
      diet_err_photoread:"Failed to read photo."
    },
    id: {
      nav_home:"Beranda", nav_medical:"Medis", nav_progress:"Aktivitas", nav_calories:"Kalori", nav_profile:"Profil", nav_scan:"Scan",
      logout:"Keluar",
      book_title:"Booking di 20FIT", book_class:"Booking kelas", book_consult:"Booking konsultasi dokter",
      book_recworkout:"Siap latihan? Booking kelasmu di 20FIT.", book_recmed:"Berdasarkan hasilmu, booking sesi di klinik 20FIT.",
      welcome:"Selamat datang",
      sec_weather:"Cuaca & Kualitas Udara", sec_recs:"Rekomendasi Latihan", sec_breath:"Latihan Pernapasan",
      sec_sleepwater:"Tidur & Air Minum", sec_checklist:"Checklist Hari Ini", sec_cycle:"Siklus Menstruasi",
      stat_bmi:"BMI", stat_weight:"Berat", stat_height:"Tinggi",
      aqi_title:"Kualitas Udara · AQI",
      breath_anxiety:"Cemas", breath_workout:"Latihan", breath_relax:"Rileks",
      start:"Mulai", stop:"Stop", ready:"Siap", press_start:"Tekan mulai",
      sleep_label:"Tidur — jam berapa tidur & bangun", bedtime:"Jam Tidur", waketime:"Jam Bangun",
      hours:"jam", save_sleep:"Simpan Tidur",
      water_label:"Air (gelas) · target 8", glasses_of:"gelas",
      daysync_note:"Data tidur & air minum tersimpan otomatis ke akun kamu.",
      cycle_intro:"Lacak siklusmu untuk rekomendasi latihan yang pas.",
      cycle_lastperiod:"Hari pertama haid terakhir", cycle_save:"Simpan", cycle_edit:"Ubah Tanggal", cycle_starttoday:"Haid mulai hari ini",
      cycle_dayof:"Hari ke-", cycle_of:"dari", cycle_next:"haid berikutnya dalam", cycle_days:"hari",
      cycle_endtoday:"Haid selesai hari ini", cycle_onperiod:"Kamu sedang haid.", cycle_endstoday:"Haidmu kemungkinan selesai hari ini.",
      cycle_disc:"Perkiraan dari inputmu — bukan saran medis atau alat kontrasepsi.",
      med_kick:"Rekam medis",
      med_title:"Rekam Medis", med_sub:"Hasil medical check-up & rekomendasi kamu.",
      med_upload:"Unggah Medical Check-Up", med_uploadsub:"PDF / JPG / PNG dari faskes mana pun — dianalisa otomatis dengan AI",
      med_history:"Riwayat", med_empty:"Belum ada hasil MCU. Upload hasil check-up kamu di atas.",
      med_analysing:"Mengompres & menganalisa dokumen…",
      med_attention:"Yang Perlu Diperhatikan", med_params:"Detail Parameter", med_normal:"Normal",
      med_eating:"Rencana Makan", med_exercise:"Rekomendasi Olahraga", med_lifestyle:"Gaya Hidup & Tindak Lanjut",
      med_why:"Kenapa perlu diperhatikan:", med_do:"Yang bisa dilakukan:", med_unread:"Bagian yang tidak terbaca:",
      med_consult_t:"Konsultasi dengan dokter 20FIT", med_consult_s:"Punya pertanyaan soal hasilmu? Booking konsultasi dengan dokter Sport Clinic kami.", med_consult_cta:"Konsultasi Dokter",
      cal_title:"Pelacak Kalori", cal_of:"dari", cal_today:"kkal hari ini",
      cal_goalnote:"Dihitung dari profil kamu (BB, TB, umur, gender, tujuan).",
      cal_targetlbl:"Target kalori harian kamu", cal_perday:"kkal / hari — dari BMI & profil kamu",
      cal_eaten:"Dimakan", cal_left:"Sisa", cal_scanbtn:"Scan makanan untuk hitung kalori", cal_ormanual:"atau tambah manual",
      cal_takephoto:"Ambil foto", cal_album:"Album",
      cal_protein:"Protein", cal_carbs:"Karbo", cal_fat:"Lemak", cal_macros:"Makro hari ini",
      cal_togo:"kkal lagi", cal_over:"kkal lebih dari target",
      cal_ortype:"atau ketik makanan + gram (kkal otomatis)", cal_grams:"gram", cal_estimating:"Menghitung kalori…", cal_needboth:"Isi nama makanan & gram.",
      cal_foodname:"Nama makanan", cal_today_sec:"Makanan Hari Ini", cal_empty:"Belum ada catatan. Tambah makanan di atas.",
      cal_scan:"Scan Makanan (AI)", cal_photo:"Foto / Upload Makanan",
      cal_analysing:"Menganalisa makanan…", cal_detected:"Terdeteksi", cal_addlog:"+ Tambah ke Log Hari Ini", cal_added:"Ditambahkan ke log ✓",
      recipe_ing:"Bahan", recipe_steps:"Cara membuat",
      cal_mrec_title:"Rekomendasi menu", cal_mrec_sub:"Berdasarkan sisa makro kamu hari ini · geser untuk lihat lainnya",
      cal_mrec_loading:"Memuat rekomendasi…", cal_mrec_more:"Lihat menu lainnya →", cal_mrec_disc:"Perkiraan panduan — bukan pengganti saran ahli gizi.",
      med_close:"Tutup",
      corp_join_t:"Gabung Corporate Program", corp_join_d:"Masukkan kode unik dari perusahaan/HR kamu untuk ikut program kesehatan karyawan.",
      corp_code:"Kode perusahaan", corp_code_ph:"mis. ACME-7K2P", corp_continue:"Lanjut", corp_cancel:"Batal",
      corp_consent_t:"Persetujuan", corp_join_to:"Kamu akan gabung ke:", corp_visible:"Yang akan bisa dilihat perusahaan (admin HR):",
      corp_v_bmi:"Status BMI", corp_v_mcu:"Hasil Medical Check-Up (MCU)", corp_v_demo:"Jenis kelamin & umur", corp_v_freq:"Frekuensi pemakaian produk 20FIT", corp_agree:"Setuju & Gabung",
      ob_head:"Lengkapi Profil", ob_sub:"Data ini bikin rekomendasi kamu makin pas.",
      ob_gender:"Jenis Kelamin", ob_male:"Pria", ob_female:"Wanita", ob_dob:"Tanggal Lahir", ob_weight:"Berat (kg)", ob_height:"Tinggi (cm)",
      ob_goal:"Tujuan Utama Kamu", ob_goal_sub:"Mau capai apa?",
      ob_goal_lose:"Turunkan Berat", ob_goal_muscle:"Bangun Otot", ob_goal_health:"Lebih Sehat", ob_goal_fit:"Tingkatkan Kebugaran",
      ob_health:"Kondisi Kesehatan", ob_health_sub:"Ada yang perlu kami tahu? (boleh lebih dari satu / kosong)",
      ob_c_hyper:"Hipertensi", ob_c_diab:"Diabetes", ob_c_chol:"Kolesterol", ob_c_heart:"Jantung", ob_c_asthma:"Asma", ob_c_injury:"Cedera",
      ob_other:"Lainnya (opsional)", ob_other_ph:"cth: alergi tertentu", ob_save:"Simpan & Lanjut",
      prog_title:"Progress", prog_text:"Statistik mingguan, achievement, dan kalender latihan kamu lagi disiapin di sini.", prog_soon:"Segera Hadir",
      prof_title:"Profil Saya", prof_name:"Nama Lengkap", prof_email:"Email", prof_phone:"Nomor HP",
      prof_gender:"Jenis Kelamin", prof_male:"Pria", prof_female:"Wanita", prof_weight:"Berat (kg)", prof_height:"Tinggi (cm)",
      prof_goal:"Tujuan Utama", prof_pick:"— pilih —", prof_lose:"Turunkan Berat", prof_muscle:"Bangun Otot",
      prof_healthier:"Lebih Sehat", prof_fit:"Tingkatkan Kebugaran", prof_save:"Simpan Perubahan", prof_logout:"Keluar / Log Out",
      prof_topup:"Tambah scan", prof_detail:"Detail profil", prof_edit:"Edit", prof_edit_title:"Edit profil", prof_cancel:"Batal", prof_pay_detail:"Detail pembayaran",
      prof_hist_sec:"Riwayat Pembelian", prof_hist_empty:"Belum ada pembelian.",
      prof_menu_sec:"Kontribusi Menu Saya", prof_menu_empty:"Belum ada menu yang kamu bagikan. Bagikan dari halaman Diet.",
      prof_danger:"Zona berbahaya", prof_del_hint:"Hapus permanen akun dan semua datamu. Tidak bisa dibatalkan.", prof_del_btn:"Hapus akun saya",
      ob_email_pref:"Preferensi Email", ob_email_sub:"Boleh kami kirim email? (opsional — bisa diubah kapan saja)", ob_consent_mkt:"Tips nutrisi & kabar dari 20FIT", ob_consent_meal:"Pengingat mencatat makan",
      corp_title:"Program Korporat", emailpref_title:"Preferensi Email", emailpref_mkt:"Tips nutrisi & kabar dari 20FIT", emailpref_meal:"Pengingat mencatat makan (email)",
      prof_del_title:"Hapus akun", prof_del_warn:"Ini menghapus permanen profil, data kesehatan (MCU), log harian, kontribusi menu, dan riwayat pembelianmu. Tidak bisa dibatalkan.", prof_del_type:"Ketik DELETE untuk konfirmasi", prof_del_confirm:"Hapus permanen",
      // diet
      diet_title:"Diet",
      diet_intro:"Rekomendasi menu dari 20FIT — pilih tipe diet, lalu ketuk menu untuk resep lengkapnya.",
      diet_disc:"Angka kalori & makro adalah perkiraan untuk panduan porsi — bukan pengganti saran ahli gizi. Foto masih placeholder; foto asli menyusul.",
      diet_recipes_loading:"Memuat resep…",
      diet_none:"Belum ada resep untuk tipe ini.",
      diet_all:"Semua",
      diet_user_contrib:"kontribusi user",
      diet_nutri_est:"Angka gizi perkiraan — bukan saran ahli gizi.",
      diet_kcal:"kkal",
      diet_logfood:"Log Food (saya makan ini)", diet_logged:"Ditambahkan ke log hari ini ·", diet_undo:"Batalkan", diet_log_undone:"Dihapus dari log", diet_log_nokcal:"Kalori belum ada — belum bisa masuk hitungan harian.",
      diet_share_cta:"Bagikan Menumu",
      diet_share_hint:"Kontribusi resep & dapat free scan",
      diet_tc:"Bagikan menu makanan sehatmu. Tiap 10 menu yang disetujui admin, kamu dapat 5 free scan kalori — berlaku berulang. Menu duplikat atau asal-asalan bisa ditolak.",
      diet_reward_h:"Kontribusi Menu → Free Scan",
      diet_reward_toward:"menu disetujui menuju +{n} free scan berikutnya",
      diet_reward_total:"Total disetujui:",
      diet_reward_earned:"Free scan sudah didapat:",
      diet_submit_h:"Kirim menu sehat",
      diet_l_name:"Nama menu",
      diet_ph_name:"mis. Rice bowl ayam teriyaki",
      diet_l_type:"Tipe diet",
      diet_l_ing:"Bahan",
      diet_ph_ing:"Tulis bahan-bahannya…",
      diet_l_steps:"Cara buat",
      diet_ph_steps:"Langkah-langkah membuatnya…",
      diet_l_kcal:"Perkiraan kalori",
      diet_optional:"(opsional)",
      diet_ph_kcal:"mis. 550",
      diet_l_photo:"Foto",
      diet_btn_submit:"Kirim menu",
      diet_track_hint:"Lacak submission & revisi menu yang ditolak di halaman Profil kamu.",
      diet_rev_h:"Revisi menu",
      diet_btn_rev:"Kirim revisi",
      diet_cancel:"Batal",
      diet_close:"Tutup",
      diet_loading:"Memuat…",
      diet_st_approved:"Disetujui", diet_st_rejected:"Ditolak", diet_st_pending:"Menunggu",
      diet_reason:"Alasan:",
      diet_revise:"Revisi & kirim ulang",
      diet_err_required:"Nama, bahan, dan cara buat wajib diisi.",
      diet_sending:"Mengirim…",
      diet_sent:"Menu terkirim! Menunggu review admin.",
      diet_err_send:"Gagal kirim.",
      diet_err_net:"Gagal jaringan.",
      diet_err_load:"Gagal memuat.",
      diet_err_img:"Hanya file gambar.",
      diet_err_big:"Foto terlalu besar (maks 8MB).",
      diet_err_photo:"Gagal proses foto.",
      diet_err_photoread:"Gagal baca foto."
    }
  };

  // Market Indonesia: default "id" kecuali (a) user sudah memilih, atau (b) browser jelas berbahasa Inggris.
  let lang = localStorage.getItem("lang") || (((navigator.language || "").toLowerCase().indexOf("en") === 0) ? "en" : "id");
  const cbs = [];

  function t(key){ const d = DICT[lang] || DICT.en; return (d[key] != null) ? d[key] : (DICT.en[key] != null ? DICT.en[key] : key); }
  function apply(){
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach(el=>{ const k=el.getAttribute("data-i18n"); const v=t(k); if(v!=null) el.textContent=v; });
    document.querySelectorAll("[data-i18n-ph]").forEach(el=>{ const k=el.getAttribute("data-i18n-ph"); const v=t(k); if(v!=null) el.placeholder=v; });
    document.querySelectorAll("[data-i18n-aria]").forEach(el=>{ const k=el.getAttribute("data-i18n-aria"); const v=t(k); if(v!=null) el.setAttribute("aria-label",v); });
    document.querySelectorAll("[data-lang-btn]").forEach(b=>b.classList.toggle("on", b.getAttribute("data-lang-btn")===lang));
    if(typeof renderThemeBtn==="function") renderThemeBtn();
  }
  function setLang(l){ lang=l; localStorage.setItem("lang",l); apply(); cbs.forEach(fn=>{try{fn(l)}catch(e){}}); }
  function onChange(fn){ cbs.push(fn); }

  // helper global untuk teks dinamis
  window.L = function(o){ return (o && (o[lang]!=null?o[lang]:o.en)) || ""; };

  // ---- Tema (Light default ala Apple / Dark opsional) ----
  let theme = localStorage.getItem("theme") || "light";
  const SUN='<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/></svg>';
  const MOON='<svg viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/></svg>';
  function renderThemeBtn(){
    const tb=document.getElementById("themeFab"); if(!tb)return;
    // di dark -> tawarkan Light (matahari); di light -> tawarkan Dark (bulan)
    tb.innerHTML = (theme==="light") ? (MOON+"<span>"+(lang==="id"?"Gelap":"Dark")+"</span>") : (SUN+"<span>"+(lang==="id"?"Terang":"Light")+"</span>");
  }
  function applyTheme(){
    document.documentElement.classList.toggle("theme-light", theme==="light");
    // Design system ("Glass Minimalist") keys dark mode off data-theme.
    document.documentElement.setAttribute("data-theme", theme==="light" ? "light" : "dark");
    renderThemeBtn();
  }
  function toggleTheme(){ theme=(theme==="light")?"dark":"light"; localStorage.setItem("theme",theme); applyTheme(); }

  // toggle melayang (kalau halaman belum punya .lang sendiri spt login)
  function injectToggle(){
    if(document.querySelector(".lang")) return; // login/reset sudah punya
    const fcss=document.createElement("style");
    // Flat minimalist (v4): system fonts everywhere — no Barlow / Manrope / Mono.
    var SYS="-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text','Inter',system-ui,'Segoe UI',Roboto,Arial,sans-serif";
    fcss.textContent="body{font-family:"+SYS+" !important}"+
      "h1,.hello,.headline,.sec,.hk{font-family:"+SYS+" !important}"+
      // ---- Hardening anti-overflow (semua widget rapi di desktop & mobile) ----
      "input[type=time],input[type=date]{min-width:150px;max-width:100%}"+
      "img,svg,canvas{max-width:100%}"+
      ".card{overflow-wrap:anywhere}"+
      ".grid2>*,.grid3>*,.main>*,.calgrid>*,#result>*{min-width:0}";
    document.head.appendChild(fcss);
    const css=document.createElement("style");
    // Single top-right row so the toggles never overlap page content, plus a
    // top gap on content-bearing pages that reserves space for the row.
    css.textContent=".topfab{position:fixed;top:0;left:0;right:0;z-index:60;display:flex;align-items:center;justify-content:flex-end;gap:8px;padding:11px 14px;"+
        "background:color-mix(in srgb,var(--bg,#F3F2F0) 86%,transparent);-webkit-backdrop-filter:saturate(180%) blur(16px);backdrop-filter:saturate(180%) blur(16px);border-bottom:1px solid rgba(0,0,0,.07)}"+
      "html:not(.theme-light) .topfab{border-bottom-color:rgba(255,255,255,.08)}"+
      "body{padding-top:64px !important}"+
      "@media(min-width:900px){.topfab{top:12px;left:auto;right:14px;padding:0;background:none;border:0;-webkit-backdrop-filter:none;backdrop-filter:none}.hero{margin-top:18px !important}}"+
      ".langfab{display:flex;gap:3px;background:#fff;border:1px solid #E8E2DB;border-radius:10px;padding:4px;box-shadow:0 4px 16px rgba(0,0,0,.20)}"+
      ".langfab button{border:0;background:transparent;color:#8A7C68;font-weight:800;font-size:12px;padding:6px 11px;border-radius:7px;cursor:pointer;font-family:inherit}"+
      ".langfab button.on{background:#C41101;color:#fff}"+
      ".themefab{display:flex;align-items:center;gap:6px;background:#fff;border:1px solid #E8E2DB;border-radius:10px;padding:7px 11px;box-shadow:0 4px 16px rgba(0,0,0,.20);cursor:pointer;color:#8A7C68;font-weight:800;font-size:12px;font-family:inherit}"+
      ".themefab svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}"+
      "html.theme-light{--bg:#F3F2F0;--pagetx:#1A1714;--pagemut:#8C8578}";
    document.head.appendChild(css);
    const wrap=document.createElement("div");wrap.className="topfab";
    const box=document.createElement("div");box.className="langfab";
    box.innerHTML='<button data-lang-btn="en" onclick="I18N.setLang(\'en\')">EN</button><button data-lang-btn="id" onclick="I18N.setLang(\'id\')">ID</button>';
    const tb=document.createElement("button");tb.className="themefab";tb.id="themeFab";tb.setAttribute("aria-label","theme");tb.onclick=toggleTheme;
    wrap.appendChild(box);wrap.appendChild(tb);
    document.body.appendChild(wrap);
    renderThemeBtn();
  }

  window.I18N = { get lang(){return lang;}, get theme(){return theme;}, t, setLang, apply, onChange, toggleTheme };

  function boot(){ injectToggle(); applyTheme(); apply(); }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot); else boot();
})();
