// lib/class-overrides.js — koreksi SEMENTARA tampilan instruktur jadwal kelas.
//
// Jadwal kelas (arena_class_schedules / gym_class_schedules) milik sistem Arena/booking,
// BUKAN milik my.20fit (tanpa prefix my20fit_ — CLAUDE.md §4: tidak boleh diubah dari repo ini).
// Kalau di sana ada instruktur yang keliru, aturan di sini membuat my.20fit TIDAK menampilkan /
// menghubungkan instruktur itu ke kelas tsb (profil coach, Book Coach, Upcoming Classes, filter
// coach di Book Class, rekomendasi AI Coach). Data aslinya tetap; booking.20fit.id tidak terpengaruh.
//
// HAPUS aturan begitu jadwal di sistem Arena sudah diperbaiki.
//   source     : "arena" | "gym"
//   instructor : teks instructor PERSIS seperti di jadwal
//   class_name : pola nama tipe kelas
module.exports = [
  // Pemilik (2026-09-30): Coach Nando TIDAK mengajar HYROX Youngstar (12-15); jadwal Arena keliru
  // mencatat instruktur "Nando" di semua kelas Youngstar Rabu 16:00.
  { source: "arena", instructor: "Nando", class_name: /youngstar/i },
];
