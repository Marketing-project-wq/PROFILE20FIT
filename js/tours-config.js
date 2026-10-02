/* tours-config.js — ISI semua tur fitur my.20fit.id (SATU file; logika di js/tour.js).
 *
 * Tim boleh mengubah teks/urutan di sini tanpa menyentuh logika. Aturan:
 *  - id langkah UNIK & jangan diganti setelah rilis (dipakai menandai langkah yang sudah dilihat).
 *  - Naikkan `version` tur kalau menambah langkah: user yang sudah selesai versi lama hanya
 *    melihat langkah BARU (id yang belum pernah dilihat).
 *  - sel = selector elemen yang disorot (boleh array: dipakai yang pertama TERLIHAT, mis. menu
 *    bawah di HP vs sidebar di desktop). Tanpa sel = kartu di tengah layar.
 *  - Elemen tak ada / tak terlihat -> pakai `alt` (versi "cara mengisi") kalau ada, kalau tidak
 *    langkah dilewati. `alt.if_not` = nama variabel halaman yang kalau falsy memakai versi alt.
 *  - {nama} di teks diganti variabel dari halaman (mis. {score}); `need` = variabel wajib, kalau
 *    kosong dipakai `alt` (supaya tak pernah menampilkan angka contoh sebagai data user).
 *  - featured:true = langkah fitur unggulan (badge "Unggulan").
 *  - only: "no_scan" / "has_scan" di langkah atau CTA = hanya ditampilkan untuk user tanpa / dengan
 *    scan Visbody (mis. ajakan scan tidak muncul untuk yang sudah scan).
 *  - auto_if: "no_scan" / "has_scan" = tur hanya otomatis untuk user tanpa / dengan scan Visbody
 *    ter-claim; `after` = tur halaman (F3) baru muncul setelah tur itu selesai/dilewati.
 *  - ctas di langkah terakhir: {id, label, href} atau {id, label, action} (action ditangani halaman).
 *
 * Teks = DRAF agent (2026-09-30), PERLU DITINJAU pemilik. Daftar & urutan fitur unggulan juga
 * PERLU DIPUTUSKAN (default: Visbody, AI Coach, Health Score, Scan makanan).
 */
(function () {
  "use strict";
  var NAV = function (href) { return [".bnav a[href='" + href + "']", ".navside a[href='" + href + "']"]; };

  window.TOURS_CONFIG = {
    // ---------------- F2 — SEMUA user baru (dengan / tanpa scan): semua menu + fitur unggulan ----------------
    // Tidak ada tombol putar ulang di Profil lagi (permintaan pemilik 2026-10-01); tur otomatis sekali per user.
    welcome: {
      version: 2, page: "dashboard",
      steps: [
        { id: "hello", title: { en: "Welcome to my.20fit.id", id: "Selamat datang di my.20fit.id" },
          body: { en: "Your hub for your health journey at 20FIT: track workouts & meals, see your Health Score, chat with Coach Intelligence and book classes. Here's a quick tour.", id: "Pusat perjalanan sehatmu di 20FIT: catat latihan & makan, lihat Health Score, chat dengan Coach Intelligence, dan booking kelas. Yuk kenalan sebentar." } },
        { id: "nav_home", sel: NAV("dashboard.html"), title: { en: "Home", id: "Home" },
          body: { en: "Your daily summary: body stats, water, sleep and quick links to everything.", id: "Ringkasan harianmu: kondisi tubuh, minum, tidur, dan akses cepat ke semua fitur." } },
        { id: "nav_event", sel: NAV("event.html"), title: { en: "Event", id: "Event" },
          body: { en: "Your tickets and upcoming 20FIT events in one wallet.", id: "Tiket dan event 20FIT yang akan datang, dalam satu dompet." } },
        { id: "nav_calories", sel: NAV("calories.html"), title: { en: "Calories", id: "Calories" },
          body: { en: "Calorie Tracker: log meals and see your daily target and macros.", id: "Calorie Tracker: catat makan dan lihat target kalori & makro harianmu." } },
        { id: "nav_activity", sel: NAV("activity.html"), title: { en: "Activity", id: "Activity" },
          body: { en: "Workouts, sleep, hydration, Health Score and Coach Intelligence — the centre of your progress.", id: "Latihan, tidur, hidrasi, Health Score, dan Coach Intelligence — pusat progresmu." } },
        { id: "nav_profile", sel: NAV("profile.html"), title: { en: "Profile", id: "Profil" },
          body: { en: "Your data, achievements, history & transactions, receipts and class ratings.", id: "Data dirimu, pencapaian, riwayat & transaksi, bon, dan rating kelas." } },
        { id: "nav_products", sel: ["#hpxProdBtn", "#unApps"], title: { en: "All 20FIT products", id: "Semua produk 20FIT" },
          body: { en: "MCU Scanner, Book Class / Coach / Doctor, Recipe and more — one tap away.", id: "MCU Scanner, Book Class / Coach / Doctor, Recipe, dan lainnya — satu ketukan." } },
        { id: "feat_visbody", featured: true, only: "no_scan", title: { en: "Visbody scan at 20FIT", id: "Scan Visbody di 20FIT" },
          body: { en: "A ±5-minute body composition scan: body fat, muscle, BMR and more. It unlocks your Health Score and makes your plan more accurate.", id: "Scan komposisi tubuh ±5 menit: lemak tubuh, otot, BMR, dan lainnya. Membuka Health Score dan membuat plan-mu lebih tepat." },
          ctas: [{ id: "visbody_how", label: { en: "See how to scan", id: "Lihat cara scan" }, href: "/activity/visbody" }] },
        { id: "feat_coach", featured: true, sel: NAV("activity.html"), title: { en: "Coach Intelligence", id: "Coach Intelligence" },
          body: { en: "Consult and build a workout plan in the style of a 20FIT coach. It's Coach Intelligence — not a doctor.", id: "Konsultasi dan buat workout plan dengan gaya coach 20FIT. Ini Coach Intelligence — bukan dokter." } },
        // v2 (Activity multi-sport): olahraga user.
        { id: "feat_sport", featured: true, sel: NAV("profile.html"), title: { en: "Your sport", id: "Olahragamu" },
          body: { en: "Pick up to 2 sports (padel, running, HYROX, gym…) in your profile — your weekly plan and workout analysis follow them.", id: "Pilih maks 2 olahraga (padel, lari, HYROX, gym…) di profil — plan mingguan & analisa latihanmu menyesuaikan." } },
        { id: "feat_score", featured: true, only: "no_scan", sel: NAV("activity.html"), title: { en: "Health Score", id: "Health Score" },
          body: { en: "One number for your overall fitness. It's locked until you do a Visbody scan or upload your first workout.", id: "Satu angka untuk kebugaranmu. Terkunci sampai kamu scan Visbody atau upload workout pertama." } },
        { id: "feat_foodscan", featured: true, sel: [".scanfab", ".navside .sscan"], title: { en: "Food scan", id: "Scan makanan" },
          body: { en: "Snap your meal and get a calorie estimate in seconds.", id: "Foto makananmu dan dapat perkiraan kalori dalam hitungan detik." } },
        { id: "done", title: { en: "You're all set!", id: "Siap mulai!" },
          body: { en: "Pick your first step:", id: "Pilih langkah pertamamu:" },
          ctas: [
            { id: "schedule_visbody", only: "no_scan", label: { en: "Schedule a Visbody scan", id: "Jadwalkan scan Visbody" }, href: "/activity/visbody" },
            { id: "first_workout", label: { en: "Upload my first workout", id: "Upload workout pertamaku" }, href: "/activity#upload-workout" },
          ] },
      ],
    },

    // ---------------- F1 — sudah scan & claim Visbody: tur /activity dengan data sendiri ----------------
    activity: {
      version: 2, page: "activity", auto_if: "has_scan",
      steps: [
        { id: "vb_result", sel: ["#vbBanner"], title: { en: "Your Visbody result", id: "Hasil Visbody kamu" },
          body: { en: "This is your body composition summary from your scan at 20FIT. Tap “See full result” for every number, explained.", id: "Ini ringkasan komposisi tubuhmu dari scan di 20FIT. Ketuk “Lihat hasil lengkap” untuk semua angka beserta penjelasannya." },
          alt: { sel: [".qa-tile[href='/activity/visbody']"], title: { en: "Your Visbody result", id: "Hasil Visbody kamu" },
            body: { en: "Your full scan result — with plain-language explanations — is always here.", id: "Hasil scan lengkapmu — dengan penjelasan sederhana — selalu ada di sini." } } },
        { id: "score", sel: ["#healthScoreBox"], need: "score", title: { en: "Health Score", id: "Health Score" },
          body: { en: "Your fitness score right now: {score}. It combines body composition, workouts, nutrition, sleep, hydration and lab — based on {filled} of 6 components. More data, more accurate.", id: "Skor kebugaranmu saat ini: {score}. Dihitung dari komposisi tubuh, latihan, nutrisi, tidur, hidrasi, dan lab — berdasarkan {filled} dari 6 komponen. Makin lengkap datamu, makin akurat." },
          alt: { title: { en: "Health Score", id: "Health Score" },
            body: { en: "Your score appears here once your scan data is processed. It combines body composition, workouts, nutrition, sleep, hydration and lab.", id: "Skormu muncul di sini setelah data scan selesai diproses. Dihitung dari komposisi tubuh, latihan, nutrisi, tidur, hidrasi, dan lab." } } },
        { id: "coach", sel: ["#coachCard"], title: { en: "Consult Coach Intelligence", id: "Konsultasi Coach Intelligence" },
          body: { en: "Ask a coach about your scan and what to do next — pick the style that suits you. It's Coach Intelligence, not a doctor.", id: "Tanya coach soal hasil scan-mu dan langkah berikutnya — pilih gaya yang paling cocok. Ini Coach Intelligence, bukan dokter." } },
        { id: "upload", sel: ["#uploadCard"], title: { en: "Upload Health Progress", id: "Upload Health Progress" },
          body: { en: "Upload workout screenshots from Garmin, Apple Watch, Strava or the treadmill, and log sleep & water. It sharpens your score and plan.", id: "Upload screenshot workout dari Garmin/Apple Watch/Strava atau treadmill, catat tidur & minum. Skor dan plan-mu jadi lebih tepat." } },
        { id: "today_plan", sel: ["#todayPlanBox"], title: { en: "Today's Full Plan", id: "Rencana Hari Ini" },
          body: { en: "Today's plan — workout, food, sleep and hydration — adjusted to yesterday's data.", id: "Rencana hari ini — latihan, makan, tidur, dan hidrasi — menyesuaikan data kemarin." } },
        { id: "workout_plan", sel: ["#workoutPlanBox"], title: { en: "Active Workout Plan", id: "Workout Plan Aktif" },
          body: { en: "Your weekly plan. Tick each session when it's done.", id: "Plan latihan mingguanmu. Centang tiap sesi yang selesai." },
          alt: { if_not: "has_plan", title: { en: "Your first workout plan", id: "Workout plan pertamamu" },
            body: { en: "No plan yet — build your first one together with a coach.", id: "Belum ada plan — buat plan pertamamu bersama coach." } } },
        // v2 (Activity multi-sport): layout plan mingguan di sekitar jadwal olahraga.
        { id: "week_plan", sel: [".swk-strip"], title: { en: "Your week, around your sport", id: "Minggumu, di sekitar olahragamu" },
          body: { en: "Your play days stay; your coach fills in supporting training, recovery and rest around them. Tap Weekly plan to move days.", id: "Hari main tetap; coach mengisi latihan pendukung, pemulihan, dan istirahat di sekitarnya. Ketuk Plan mingguan untuk memindah hari." },
          alt: { sel: ["#workoutPlanBox"], title: { en: "A plan around your sport", id: "Plan sesuai olahragamu" },
            body: { en: "In Plan you can build a weekly plan around the days you play — supporting training, recovery and rest included.", id: "Di Plan kamu bisa menyusun plan mingguan di sekitar hari kamu main — lengkap dengan latihan pendukung, pemulihan, dan istirahat." } } },
        { id: "journey", sel: ["#journeyCard"], title: { en: "Health Journey", id: "Health Journey" },
          body: { en: "Your next steps: analyse with a coach → build a plan → set your calorie target → book a class → schedule a rescan.", id: "Langkah berikutnya untukmu: analisa dengan coach → buat plan → atur target kalori → book kelas → jadwalkan rescan." } },
        { id: "book", sel: [".qa-tile[href='/classes']"], title: { en: "Book a class", id: "Book kelas" },
          body: { en: "Train in person with a 20FIT coach.", id: "Latihan langsung dengan coach 20FIT." } },
        { id: "done", title: { en: "That's it!", id: "Selesai!" },
          body: { en: "Start with the first step on your checklist.", id: "Mulai dari langkah pertama di checklist." },
          ctas: [{ id: "journey_next", label: { en: "Start the first step", id: "Mulai langkah pertama" }, action: "journey_next" }] },
      ],
    },

    // ---------------- F2 langkah 4 — tur mini /activity untuk yang belum punya data ----------------
    activity_intro: {
      version: 2, page: "activity", auto_if: "no_scan",
      steps: [
        { id: "score_locked", sel: ["#healthScoreBox"], title: { en: "Health Score", id: "Health Score" },
          body: { en: "Your Health Score unlocks once you do a Visbody scan or upload your first workout.", id: "Health Score terbuka setelah kamu scan Visbody atau upload workout pertama." } },
        { id: "coach", sel: ["#coachCard"], title: { en: "Coach Intelligence", id: "Coach Intelligence" },
          body: { en: "Pick a coach to consult and build a plan. Coach Intelligence — not a doctor.", id: "Pilih coach untuk konsultasi & buat plan. Coach Intelligence — bukan dokter." } },
        { id: "upload", sel: ["#uploadCard"], title: { en: "Upload progress", id: "Upload progress" },
          body: { en: "Empty for now — upload a workout, sleep or daily-activity screenshot and it fills in here.", id: "Masih kosong — upload screenshot workout, tidur, atau aktivitas harian dan datanya muncul di sini." } },
        { id: "today_plan", sel: ["#todayPlanBox"], title: { en: "Today's plan", id: "Rencana hari ini" },
          body: { en: "After your first upload you get a daily plan for workout, food, sleep and water.", id: "Setelah upload pertama, kamu dapat rencana harian untuk latihan, makan, tidur, dan minum." } },
        { id: "workout_plan", sel: ["#workoutPlanBox"], title: { en: "Workout plan", id: "Workout plan" },
          body: { en: "No plan yet — build one with a coach in a few questions.", id: "Belum ada plan — buat bersama coach lewat beberapa pertanyaan." } },
        // v2 (Activity multi-sport): layout plan mingguan di sekitar jadwal olahraga.
        { id: "week_plan", sel: [".swk-strip"], title: { en: "Your week, around your sport", id: "Minggumu, di sekitar olahragamu" },
          body: { en: "Your play days stay; your coach fills in supporting training, recovery and rest around them. Tap Weekly plan to move days.", id: "Hari main tetap; coach mengisi latihan pendukung, pemulihan, dan istirahat di sekitarnya. Ketuk Plan mingguan untuk memindah hari." },
          alt: { sel: ["#workoutPlanBox"], title: { en: "A plan around your sport", id: "Plan sesuai olahragamu" },
            body: { en: "In Plan you can build a weekly plan around the days you play — supporting training, recovery and rest included.", id: "Di Plan kamu bisa menyusun plan mingguan di sekitar hari kamu main — lengkap dengan latihan pendukung, pemulihan, dan istirahat." } } },
        { id: "done", title: { en: "Where to start?", id: "Mulai dari mana?" },
          body: { en: "Choose one to unlock your Health Score:", id: "Pilih salah satu untuk membuka Health Score:" },
          ctas: [
            { id: "schedule_visbody", label: { en: "Schedule a Visbody scan", id: "Jadwalkan scan Visbody" }, href: "/activity/visbody" },
            { id: "first_workout", label: { en: "Upload my first workout", id: "Upload workout pertamaku" }, action: "upload_workout" },
          ] },
      ],
    },

    // ---------------- F3 — tur ringan per halaman (dipindah dari js/tour.js lama) ----------------
    home: {
      version: 1, page: "dashboard", legacy_flag: "tour_home_v1", after: "welcome",
      steps: [
        { id: "customize", sel: [".trk-cust"], title: { en: "Your Home is customizable", id: "Home kamu bisa disesuaikan" },
          body: { en: "Tap Customize to add, remove and reorder your widgets — Hydration, Sleep, Fasting, Photo and more.", id: "Tap Customize untuk menambah, menghapus, dan mengatur urutan widget — Hydration, Sleep, Fasting, Photo, dan lainnya." } },
        { id: "book", sel: ["#locRow"], title: { en: "Book directly from Home", id: "Book langsung dari Home" },
          body: { en: "Book your session right here — pick a location or a personal coach/doctor without leaving the app.", id: "Book sesi langsung di sini — pilih lokasi atau coach/dokter personal tanpa keluar aplikasi." } },
      ],
    },
    calories: {
      version: 1, page: "calories", legacy_flag: "tour_calories_v1",
      steps: [
        { id: "menus", sel: ["#menuRecCard"], title: { en: "Diet menus with real photos", id: "Menu diet dengan foto asli" },
          body: { en: "Browse diet menus with real food photos, recommended from your remaining macros today.", id: "Jelajahi menu diet dengan foto makanan asli, direkomendasikan dari sisa makro kamu hari ini." } },
        { id: "summary", sel: ["#foodSummary"], title: { en: "Today's Food Summary", id: "Ringkasan Makan Hari Ini" },
          body: { en: "The Health Meter scores your day and suggests what nutrients to add.", id: "Health Meter menilai harimu dan memberi saran nutrisi yang masih kurang." } },
      ],
    },
    medical: {
      version: 1, page: "medical", legacy_flag: "tour_medical_v1",
      steps: [
        { id: "upload", sel: [".card.up"], title: { en: "Upload your check-up", id: "Upload hasil check-up" },
          body: { en: "Snap or upload your MCU (PDF/JPG/PNG) from any facility — it's analysed automatically.", id: "Foto atau upload MCU kamu (PDF/JPG/PNG) dari fasilitas mana pun — langsung dianalisis otomatis." } },
        { id: "analysis", sel: ["#result"], title: { en: "AI analysis", id: "Analisis AI" },
          body: { en: "AI explains your results in plain words and flags what to discuss with a doctor. It's not a diagnosis.", id: "AI menjelaskan hasilmu dengan bahasa sederhana dan menandai yang perlu dibahas dengan dokter. Ini bukan diagnosis." } },
        { id: "history", sel: ["#mcuHistoryCard"], title: { en: "Your history", id: "Riwayat kamu" },
          body: { en: "Every check-up is saved here so you can compare results over time.", id: "Setiap check-up tersimpan di sini supaya kamu bisa membandingkan hasil dari waktu ke waktu." } },
        { id: "translate", title: { en: "Instant translation", id: "Terjemahan instan" },
          body: { en: "Read your results in English or Indonesian — lab numbers stay unchanged.", id: "Baca hasilmu dalam Bahasa Inggris atau Indonesia — angka lab tidak diubah." } },
      ],
    },
  };
})();
