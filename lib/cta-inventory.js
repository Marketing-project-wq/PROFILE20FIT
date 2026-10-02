// Inventaris tujuan CTA my.20fit.id — SATU sumber kebenaran untuk paket olahraga (lib/sport-packs)
// dan nanti ctaResolver (Fase 3 Activity multi-sport).
//
// HANYA tujuan yang terverifikasi ADA di codebase (audit Langkah 0, 1 Okt 2026). Jangan menambah
// tujuan yang belum ada / belum jelas URL-nya — tulis di daftar PENDING di bawah.
//   in_person: true  -> butuh datang ke lokasi 20FIT (Jakarta). Dipakai untuk aturan "user di luar
//                       Jakarta jangan diprioritaskan CTA datang ke lokasi" (Fase 3).
//   external: true   -> link ke subdomain lain (tetap same-tab, CLAUDE.md §G).
module.exports = {
  classes_arena: { route: "/classes", in_person: true,
    label: { en: "See Arena class schedule", id: "Lihat jadwal kelas Arena" } },
  classes_gym: { route: "/classes?venue=gym", in_person: true,
    label: { en: "See Gym class schedule", id: "Lihat jadwal kelas Gym" } },
  // Daftar kelas per coach (bukan booking PT 1-on-1 — itu belum ada).
  book_coach: { route: "/book-coach", in_person: true,
    label: { en: "Train with a 20FIT coach", id: "Latihan bareng coach 20FIT" } },
  // Permintaan konsultasi (dikonfirmasi admin klinik), belum pilih slot/bayar.
  book_doctor: { route: "/book-doctor", in_person: true,
    label: { en: "Consult a doctor (20FIT Sports Clinic)", id: "Konsultasi dokter (20FIT Sports Clinic)" } },
  // Jadwal fisioterapi/recovery in-app; booking-nya di booking.20fit.id/clinic.
  recovery_clinic: { route: "/classes?venue=clinic", in_person: true,
    label: { en: "Physio & recovery schedule", id: "Jadwal fisioterapi & recovery" } },
  calorie_tracker: { route: "/calories", in_person: false,
    label: { en: "Log your food in Calorie Tracker", id: "Catat makan di Calorie Tracker" } },
  mcu_scanner: { route: "/medical", in_person: false,
    label: { en: "Read your MCU results", id: "Baca hasil MCU-mu" } },
  // Info & hasil Visbody. Tombol "jadwalkan scan" belum ada (lib/journey-config.js booking_url null).
  visbody_info: { route: "/activity/visbody", in_person: true,
    label: { en: "Measure your body composition (Visbody)", id: "Ukur komposisi tubuh (Visbody)" } },
  events: { route: "/event", in_person: true,
    label: { en: "See 20FIT events", id: "Lihat event 20FIT" } },
  recipes: { route: "/recipe", in_person: false,
    label: { en: "Find a healthy recipe", id: "Cari resep sehat" } },
  membership: { route: "/membership", in_person: true,
    label: { en: "See membership packages", id: "Lihat paket membership" } },
};

// PENDING (BELUM boleh jadi CTA — TANYA PEMILIK):
//   - /book-class tanpa parameter menampilkan "Gagal memuat kelas ini" -> pakai classes_* di atas.
//   - workout.20fit.id: disembunyikan dari menu 29 Sep 2026 ("belum siap", docs/PRODUCTS-MENU-SSO.md).
//   - Padel Rebel: URL & hubungan dengan 20FIT belum diketahui.
//   - Booking scan Visbody: booking_url / whatsapp masih null.
