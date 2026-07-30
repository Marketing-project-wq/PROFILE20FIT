// cycle.js — logika & rekomendasi siklus menstruasi (dipakai Home & Progress).
// Data bilingual {en,id}; halaman render pakai window.L.
(function () {
  const PHASES = {
    menstrual: {
      key: "menstrual", emoji: "", color: "#C41101",
      name: { en: "Menstrual phase", id: "Fase Menstruasi" },
      summary: { en: "Energy is at its lowest — be kind to your body and rest more.",
                 id: "Energi paling rendah — istirahat lebih & jangan paksakan diri." },
      doTips: [
        { en: "Gentle movement: walking, light yoga or stretching", id: "Gerak ringan: jalan kaki, yoga ringan, atau stretching" },
        { en: "Prioritise rest & sleep", id: "Utamakan istirahat & tidur cukup" },
        { en: "A warm compress helps with cramps", id: "Kompres hangat bantu redakan kram" },
      ],
      eatTips: [
        { en: "Iron-rich foods (spinach, red meat, beans)", id: "Makanan tinggi zat besi (bayam, daging merah, kacang)" },
        { en: "Warm foods & plenty of water", id: "Makanan hangat & banyak air putih" },
        { en: "Limit caffeine & salt", id: "Kurangi kafein & garam" },
      ],
    },
    follicular: {
      key: "follicular", emoji: "", color: "#2A7A4F",
      name: { en: "Follicular phase", id: "Fase Folikular" },
      summary: { en: "Energy is rising — a great time to build strength & try new things.",
                 id: "Energi naik — waktu bagus buat latihan berat & coba hal baru." },
      doTips: [
        { en: "Strength training or HIIT", id: "Latihan beban atau HIIT" },
        { en: "Try a new class or workout", id: "Coba kelas atau workout baru" },
      ],
      eatTips: [
        { en: "Lean protein for muscle", id: "Protein tanpa lemak untuk otot" },
        { en: "Fresh veggies & fruit", id: "Sayur & buah segar" },
        { en: "Fermented foods for gut health", id: "Makanan fermentasi untuk pencernaan" },
      ],
    },
    ovulation: {
      key: "ovulation", emoji: "", color: "#C87000",
      name: { en: "Ovulation phase", id: "Fase Ovulasi" },
      summary: { en: "Peak energy & mood — push a bit harder today.",
                 id: "Energi & mood puncak — bisa dorong lebih hari ini." },
      doTips: [
        { en: "High-intensity workouts / group classes", id: "Workout intensitas tinggi / kelas grup" },
        { en: "Great day to socialise", id: "Hari bagus buat bersosialisasi" },
      ],
      eatTips: [
        { en: "Fibre & antioxidant-rich foods", id: "Makanan tinggi serat & antioksidan" },
        { en: "Lighter meals, stay well hydrated", id: "Porsi lebih ringan, cukup minum" },
      ],
    },
    luteal: {
      key: "luteal", emoji: "", color: "#7c5cff",
      name: { en: "Luteal phase", id: "Fase Luteal" },
      summary: { en: "Energy winds down & PMS may appear — go moderate and rest well.",
                 id: "Energi menurun & bisa muncul PMS — sedang-sedang saja & istirahat." },
      doTips: [
        { en: "Moderate exercise: pilates, light cardio", id: "Olahraga sedang: pilates, kardio ringan" },
        { en: "Prioritise sleep & manage stress", id: "Utamakan tidur & kelola stres" },
      ],
      eatTips: [
        { en: "Complex carbs (oats, sweet potato)", id: "Karbo kompleks (oat, ubi)" },
        { en: "Magnesium: dark chocolate, nuts", id: "Magnesium: dark chocolate, kacang" },
        { en: "Cut back on salt, sugar & caffeine", id: "Kurangi garam, gula & kafein" },
      ],
    },
  };

  // Hitung fase dari tanggal menstruasi terakhir.
  function info(lastDate, cycleLen, periodLen) {
    if (!lastDate) return null;
    cycleLen = parseInt(cycleLen, 10) || 28;
    periodLen = parseInt(periodLen, 10) || 5;
    const last = new Date(String(lastDate).slice(0, 10) + "T00:00:00");
    if (isNaN(last.getTime())) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let diff = Math.floor((today - last) / 86400000);
    if (diff < 0) return null;
    const day = (diff % cycleLen) + 1;              // hari ke- dalam siklus (1..cycleLen)
    const ovul = Math.round(cycleLen / 2);          // ~ hari 14
    let key;
    if (day <= periodLen) key = "menstrual";
    else if (day < ovul - 1) key = "follicular";
    else if (day <= ovul + 1) key = "ovulation";
    else key = "luteal";
    const daysToNext = cycleLen - day + 1;           // perkiraan hari sampai menstruasi berikutnya
    const next = new Date(today.getTime() + daysToNext * 86400000);
    const nextStr = next.getFullYear() + "-" + String(next.getMonth() + 1).padStart(2, "0") + "-" + String(next.getDate()).padStart(2, "0");
    return { day: day, cycleLen: cycleLen, phase: key, daysToNext: daysToNext, nextDate: nextStr, meta: PHASES[key] };
  }

  window.Cycle = { info: info };
})();
