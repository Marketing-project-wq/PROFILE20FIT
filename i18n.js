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
      nav_home:"Home", nav_medical:"Medical", nav_progress:"Progress", nav_calories:"Calories", nav_profile:"Profile", nav_scan:"Scan",
      logout:"Log Out",
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
      cycle_dayof:"Day", cycle_of:"of", cycle_next:"next period in", cycle_days:"days",
      // medical
      med_title:"Medical Record", med_sub:"Your medical check-up results & recommendations.",
      med_upload:"Upload Medical Check-Up", med_uploadsub:"PDF / JPG / PNG from any facility — analysed automatically with AI",
      med_history:"History", med_empty:"No MCU results yet. Upload your check-up above.",
      med_analysing:"Compressing & analysing document… ⏳",
      med_attention:"Needs Attention", med_params:"Parameter Details", med_normal:"Normal",
      med_eating:"Eating Plan", med_exercise:"Exercise Recommendations", med_lifestyle:"Lifestyle & Follow-up",
      med_why:"Why it matters:", med_do:"What you can do:", med_unread:"Unreadable parts:",
      // calories
      cal_title:"Calorie Tracker", cal_of:"of", cal_today:"kcal today",
      cal_goalnote:"Calculated from your profile (weight, height, age, gender, goal).",
      cal_targetlbl:"Your daily calorie target", cal_perday:"kcal / day — from your BMI & profile",
      cal_eaten:"Eaten", cal_left:"Left", cal_scanbtn:"Scan food to count calories", cal_ormanual:"or add manually",
      cal_ortype:"or type food + grams (auto kcal)", cal_grams:"grams", cal_estimating:"Estimating calories…", cal_needboth:"Type a food name & grams.",
      cal_foodname:"Food name", cal_today_sec:"Today's Food", cal_empty:"No entries yet. Add food above.",
      cal_recs:"Meal Ideas & Recipes", cal_scan:"Scan Food (AI)", cal_photo:"Photo / Upload Food",
      cal_analysing:"Analysing food… ⏳", cal_detected:"Detected", cal_addlog:"+ Add to Today's Log", cal_added:"Added to log ✅",
      meal_breakfast:"Breakfast", meal_lunch:"Lunch", meal_dinner:"Dinner",
      recipe_view:"View recipe", recipe_hide:"Hide recipe", recipe_ing:"Ingredients", recipe_steps:"How to make", recipe_add:"+ Add to log",
      // progress
      prog_title:"Progress", prog_text:"Weekly stats, achievements, and your training calendar are coming soon.", prog_soon:"Coming Soon",
      // profile
      prof_title:"My Profile", prof_name:"Full Name", prof_email:"Email", prof_phone:"Phone",
      prof_gender:"Gender", prof_male:"Male", prof_female:"Female", prof_weight:"Weight (kg)", prof_height:"Height (cm)",
      prof_goal:"Main Goal", prof_pick:"— choose —", prof_lose:"Lose Weight", prof_muscle:"Build Muscle",
      prof_healthier:"Get Healthier", prof_fit:"Improve Fitness", prof_save:"Save Changes", prof_logout:"Log Out",
      prof_tour:"Replay app tutorial"
    },
    id: {
      nav_home:"Beranda", nav_medical:"Medis", nav_progress:"Progress", nav_calories:"Kalori", nav_profile:"Profil", nav_scan:"Scan",
      logout:"Keluar",
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
      cycle_lastperiod:"Hari pertama haid terakhir", cycle_save:"Simpan", cycle_edit:"Ubah Tanggal",
      cycle_dayof:"Hari ke-", cycle_of:"dari", cycle_next:"haid berikutnya dalam", cycle_days:"hari",
      med_title:"Rekam Medis", med_sub:"Hasil medical check-up & rekomendasi kamu.",
      med_upload:"Upload Medical Check-Up", med_uploadsub:"PDF / JPG / PNG dari faskes mana pun — dianalisa otomatis dengan AI",
      med_history:"Riwayat", med_empty:"Belum ada hasil MCU. Upload hasil check-up kamu di atas.",
      med_analysing:"Mengompres & menganalisa dokumen… ⏳",
      med_attention:"Yang Perlu Diperhatikan", med_params:"Detail Parameter", med_normal:"Normal",
      med_eating:"Rencana Makan", med_exercise:"Rekomendasi Olahraga", med_lifestyle:"Gaya Hidup & Tindak Lanjut",
      med_why:"Kenapa perlu diperhatikan:", med_do:"Yang bisa dilakukan:", med_unread:"Bagian yang tidak terbaca:",
      cal_title:"Pelacak Kalori", cal_of:"dari", cal_today:"kkal hari ini",
      cal_goalnote:"Dihitung dari profil kamu (BB, TB, umur, gender, tujuan).",
      cal_targetlbl:"Target kalori harian kamu", cal_perday:"kkal / hari — dari BMI & profil kamu",
      cal_eaten:"Dimakan", cal_left:"Sisa", cal_scanbtn:"Scan makanan untuk hitung kalori", cal_ormanual:"atau tambah manual",
      cal_ortype:"atau ketik makanan + gram (kkal otomatis)", cal_grams:"gram", cal_estimating:"Menghitung kalori…", cal_needboth:"Isi nama makanan & gram.",
      cal_foodname:"Nama makanan", cal_today_sec:"Makanan Hari Ini", cal_empty:"Belum ada catatan. Tambah makanan di atas.",
      cal_recs:"Ide Menu & Resep", cal_scan:"Scan Makanan (AI)", cal_photo:"Foto / Upload Makanan",
      cal_analysing:"Menganalisa makanan… ⏳", cal_detected:"Terdeteksi", cal_addlog:"+ Tambah ke Log Hari Ini", cal_added:"Ditambahkan ke log ✅",
      meal_breakfast:"Sarapan", meal_lunch:"Makan Siang", meal_dinner:"Makan Malam",
      recipe_view:"Lihat resep", recipe_hide:"Tutup resep", recipe_ing:"Bahan", recipe_steps:"Cara membuat", recipe_add:"+ Tambah ke log",
      prog_title:"Progress", prog_text:"Statistik mingguan, achievement, dan kalender latihan kamu lagi disiapin di sini.", prog_soon:"Segera Hadir",
      prof_title:"Profil Saya", prof_name:"Nama Lengkap", prof_email:"Email", prof_phone:"Nomor HP",
      prof_gender:"Jenis Kelamin", prof_male:"Pria", prof_female:"Wanita", prof_weight:"Berat (kg)", prof_height:"Tinggi (cm)",
      prof_goal:"Tujuan Utama", prof_pick:"— pilih —", prof_lose:"Turunkan Berat", prof_muscle:"Bangun Otot",
      prof_healthier:"Lebih Sehat", prof_fit:"Tingkatkan Kebugaran", prof_save:"Simpan Perubahan", prof_logout:"Keluar / Log Out",
      prof_tour:"Putar ulang tutorial"
    }
  };

  let lang = localStorage.getItem("lang") || "en";
  const cbs = [];

  function t(key){ const d = DICT[lang] || DICT.en; return (d[key] != null) ? d[key] : (DICT.en[key] != null ? DICT.en[key] : key); }
  function apply(){
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach(el=>{ const k=el.getAttribute("data-i18n"); const v=t(k); if(v!=null) el.textContent=v; });
    document.querySelectorAll("[data-i18n-ph]").forEach(el=>{ const k=el.getAttribute("data-i18n-ph"); const v=t(k); if(v!=null) el.placeholder=v; });
    document.querySelectorAll("[data-lang-btn]").forEach(b=>b.classList.toggle("on", b.getAttribute("data-lang-btn")===lang));
  }
  function setLang(l){ lang=l; localStorage.setItem("lang",l); apply(); cbs.forEach(fn=>{try{fn(l)}catch(e){}}); }
  function onChange(fn){ cbs.push(fn); }

  // helper global untuk teks dinamis
  window.L = function(o){ return (o && (o[lang]!=null?o[lang]:o.en)) || ""; };

  // toggle melayang (kalau halaman belum punya .lang sendiri spt login)
  function injectToggle(){
    if(document.querySelector(".lang")) return; // login/reset sudah punya
    const css=document.createElement("style");
    css.textContent=".langfab{position:fixed;top:14px;right:14px;z-index:80;display:flex;gap:3px;background:#fff;border:1px solid #E8E2DB;border-radius:10px;padding:4px;box-shadow:0 4px 16px rgba(0,0,0,.20)}"+
      ".langfab button{border:0;background:transparent;color:#8A7C68;font-weight:800;font-size:12px;padding:6px 11px;border-radius:7px;cursor:pointer;font-family:inherit}"+
      ".langfab button.on{background:#C41101;color:#fff}";
    document.head.appendChild(css);
    const box=document.createElement("div");box.className="langfab";
    box.innerHTML='<button data-lang-btn="en" onclick="I18N.setLang(\'en\')">EN</button><button data-lang-btn="id" onclick="I18N.setLang(\'id\')">ID</button>';
    document.body.appendChild(box);
  }

  window.I18N = { get lang(){return lang;}, t, setLang, apply, onChange };

  function boot(){ injectToggle(); apply(); }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot); else boot();
})();
