// recipes.js — resep resmi 20FIT untuk halaman /diet & rekomendasi di Calories.
// CATATAN: angka kalori & makro (protein/karbo/lemak, gram) adalah PERKIRAAN untuk
// panduan porsi — BUKAN saran ahli gizi. Foto sengaja pakai placeholder (emoji + warna);
// foto berlisensi ditambahkan setelah di-approve pemilik. `types` = tipe diet yang cocok.
// Variasi sengaja "makanan normal enak" (pizza/burger/burrito/pasta/rice bowl) versi
// porsi & komposisi terjaga — bukan cuma salad.
(function () {
  var LIST = [
    { id: "rice-chicken", emoji: "🍗", tint: "#C41101", kcal: 520, p: 45, c: 55, f: 12, types: ["normal", "high-protein", "halal"],
      nm: { en: "Grilled Chicken Rice Bowl", id: "Rice Bowl Ayam Panggang" },
      ing: { en: "150g grilled chicken breast, 150g steamed rice, mixed veggies, light teriyaki", id: "150g dada ayam panggang, 150g nasi, sayur campur, teriyaki tipis" },
      steps: { en: "Season & grill chicken, steam rice, plate with veggies, drizzle sauce.", id: "Bumbui & panggang ayam, kukus nasi, tata dengan sayur, siram saus tipis." } },
    { id: "beef-burger", emoji: "🍔", tint: "#C87000", kcal: 560, p: 38, c: 48, f: 22, types: ["normal", "halal"],
      nm: { en: "Lean Beef Burger (whole-wheat)", id: "Burger Sapi Lean (roti gandum)" },
      ing: { en: "120g lean beef patty, whole-wheat bun, lettuce, tomato, light cheese", id: "120g patty sapi lean, roti gandum, selada, tomat, keju tipis" },
      steps: { en: "Grill patty, toast bun, stack with veggies & a little cheese.", id: "Panggang patty, panggang roti, susun dengan sayur & sedikit keju." } },
    { id: "chicken-burrito", emoji: "🌯", tint: "#2A7A4F", kcal: 600, p: 40, c: 62, f: 20, types: ["normal", "high-protein", "halal"],
      nm: { en: "Chicken Burrito", id: "Burrito Ayam" },
      ing: { en: "Whole-wheat tortilla, 120g chicken, brown rice, black beans, salsa", id: "Tortilla gandum, 120g ayam, nasi merah, kacang hitam, salsa" },
      steps: { en: "Fill tortilla with rice, beans, chicken & salsa; roll & sear.", id: "Isi tortilla dengan nasi, kacang, ayam & salsa; gulung & panggang sebentar." } },
    { id: "veggie-pizza", emoji: "🍕", tint: "#C87000", kcal: 620, p: 26, c: 78, f: 22, types: ["normal", "vegetarian"],
      nm: { en: "Thin-Crust Veggie Pizza", id: "Pizza Sayur Tipis" },
      ing: { en: "Thin whole-wheat base, tomato sauce, part-skim mozzarella, lots of veggies", id: "Base gandum tipis, saus tomat, mozzarella rendah lemak, banyak sayur" },
      steps: { en: "Top base, bake until crisp, load with vegetables.", id: "Olesi base, panggang sampai renyah, beri banyak sayur." } },
    { id: "tuna-pasta", emoji: "🍝", tint: "#2F6BFF", kcal: 550, p: 38, c: 70, f: 12, types: ["pescatarian", "high-protein"],
      nm: { en: "Tuna Tomato Pasta", id: "Pasta Tuna Tomat" },
      ing: { en: "90g whole-wheat pasta, 100g tuna, tomato sauce, garlic, basil", id: "90g pasta gandum, 100g tuna, saus tomat, bawang putih, basil" },
      steps: { en: "Boil pasta, sauté garlic, add tuna & tomato, toss.", id: "Rebus pasta, tumis bawang, tambah tuna & tomat, aduk." } },
    { id: "salmon-bowl", emoji: "🐟", tint: "#2F6BFF", kcal: 580, p: 42, c: 55, f: 20, types: ["pescatarian", "high-protein"],
      nm: { en: "Salmon Teriyaki Bowl", id: "Rice Bowl Salmon Teriyaki" },
      ing: { en: "140g salmon, 150g rice, edamame, seaweed, light teriyaki", id: "140g salmon, 150g nasi, edamame, rumput laut, teriyaki tipis" },
      steps: { en: "Pan-sear salmon, plate over rice with edamame & sauce.", id: "Panggang salmon, tata di atas nasi dengan edamame & saus." } },
    { id: "tofu-stirfry", emoji: "🥢", tint: "#2A7A4F", kcal: 480, p: 24, c: 62, f: 14, types: ["vegan", "vegetarian"],
      nm: { en: "Tofu Veggie Stir-fry + Rice", id: "Tumis Tahu Sayur + Nasi" },
      ing: { en: "150g firm tofu, mixed veggies, 130g rice, soy-ginger sauce", id: "150g tahu padat, sayur campur, 130g nasi, saus kecap-jahe" },
      steps: { en: "Stir-fry tofu & veggies, serve over rice.", id: "Tumis tahu & sayur, sajikan di atas nasi." } },
    { id: "tempeh-bowl", emoji: "🌱", tint: "#2A7A4F", kcal: 500, p: 30, c: 58, f: 16, types: ["vegan", "vegetarian", "high-protein"],
      nm: { en: "Tempeh Rice Bowl", id: "Rice Bowl Tempe" },
      ing: { en: "150g tempeh, 130g rice, sautéed greens, sambal matah", id: "150g tempe, 130g nasi, tumis sayur hijau, sambal matah" },
      steps: { en: "Sear tempeh, plate with rice & greens.", id: "Panggang tempe, tata dengan nasi & sayur." } },
    { id: "egg-fried-rice", emoji: "🍚", tint: "#C87000", kcal: 520, p: 22, c: 68, f: 18, types: ["normal", "vegetarian"],
      nm: { en: "Veggie Egg Fried Rice", id: "Nasi Goreng Telur Sayur" },
      ing: { en: "2 eggs, 150g cold rice, peas, carrot, corn, light oil", id: "2 telur, 150g nasi dingin, kacang polong, wortel, jagung, minyak sedikit" },
      steps: { en: "Scramble eggs, fry rice with veggies, combine.", id: "Orak-arik telur, goreng nasi dengan sayur, gabung." } },
    { id: "caesar-wrap", emoji: "🌯", tint: "#C41101", kcal: 470, p: 35, c: 40, f: 18, types: ["normal", "high-protein"],
      nm: { en: "Chicken Caesar Wrap", id: "Wrap Ayam Caesar" },
      ing: { en: "Whole-wheat wrap, 120g chicken, romaine, light caesar, parmesan", id: "Wrap gandum, 120g ayam, romaine, caesar ringan, parmesan" },
      steps: { en: "Toss chicken & romaine with dressing, wrap.", id: "Aduk ayam & romaine dengan dressing, gulung." } },
    { id: "beef-broccoli", emoji: "🥦", tint: "#2A7A4F", kcal: 540, p: 40, c: 58, f: 16, types: ["normal", "high-protein", "halal"],
      nm: { en: "Beef & Broccoli + Rice", id: "Sapi Brokoli + Nasi" },
      ing: { en: "120g lean beef, broccoli, 130g rice, garlic-soy sauce", id: "120g sapi lean, brokoli, 130g nasi, saus bawang-kecap" },
      steps: { en: "Stir-fry beef & broccoli, serve over rice.", id: "Tumis sapi & brokoli, sajikan di atas nasi." } },
    { id: "keto-chicken-avo", emoji: "🥑", tint: "#2A7A4F", kcal: 520, p: 40, c: 10, f: 36, types: ["keto", "low-carb", "high-protein"],
      nm: { en: "Chicken Avocado Plate", id: "Piring Ayam Alpukat" },
      ing: { en: "150g chicken thigh, 1/2 avocado, greens, olive oil", id: "150g paha ayam, 1/2 alpukat, sayur hijau, minyak zaitun" },
      steps: { en: "Grill chicken, plate with avocado & greens.", id: "Panggang ayam, tata dengan alpukat & sayur." } },
    { id: "yogurt-bowl", emoji: "🥣", tint: "#2F6BFF", kcal: 380, p: 32, c: 40, f: 10, types: ["vegetarian", "high-protein", "low-carb"],
      nm: { en: "Greek Yogurt Protein Bowl", id: "Bowl Protein Greek Yogurt" },
      ing: { en: "200g greek yogurt, berries, whey scoop, chia", id: "200g greek yogurt, buah beri, 1 scoop whey, chia" },
      steps: { en: "Mix yogurt & whey, top with berries & chia.", id: "Campur yogurt & whey, beri buah beri & chia." } },
    { id: "shrimp-fried-rice", emoji: "🍤", tint: "#C87000", kcal: 530, p: 34, c: 66, f: 14, types: ["pescatarian"],
      nm: { en: "Shrimp Fried Rice", id: "Nasi Goreng Udang" },
      ing: { en: "120g shrimp, 150g rice, egg, peas & carrot", id: "120g udang, 150g nasi, telur, kacang polong & wortel" },
      steps: { en: "Stir-fry shrimp & veggies, add rice & egg.", id: "Tumis udang & sayur, tambah nasi & telur." } },
    { id: "buddha-bowl", emoji: "🥗", tint: "#2A7A4F", kcal: 490, p: 20, c: 68, f: 14, types: ["vegan", "vegetarian"],
      nm: { en: "Chickpea Buddha Bowl", id: "Buddha Bowl Kacang Arab" },
      ing: { en: "Chickpeas, quinoa, roasted veg, tahini drizzle", id: "Kacang arab, quinoa, sayur panggang, saus tahini" },
      steps: { en: "Roast veg & chickpeas, plate over quinoa, drizzle tahini.", id: "Panggang sayur & kacang arab, tata di atas quinoa, siram tahini." } },
    { id: "oats-pb", emoji: "🥜", tint: "#C87000", kcal: 420, p: 18, c: 58, f: 14, types: ["vegetarian"],
      nm: { en: "Overnight Oats PB & Banana", id: "Overnight Oats Selai Kacang & Pisang" },
      ing: { en: "60g oats, milk, 1 tbsp peanut butter, 1/2 banana", id: "60g oat, susu, 1 sdm selai kacang, 1/2 pisang" },
      steps: { en: "Mix oats & milk, refrigerate overnight, top with PB & banana.", id: "Campur oat & susu, diamkan semalam di kulkas, beri selai kacang & pisang." } }
  ];
  function byType(t) { if (!t || t === "all") return LIST.slice(); return LIST.filter(function (r) { return (r.types || []).indexOf(t) >= 0; }); }
  // Rekomendasi berdasar SISA makro (gram). Isi makro yang kurang tanpa nambah yang sudah cukup.
  function recommendForMacros(rem, n) {
    n = n || 3;
    var def = { p: Math.max(0, +rem.p || 0), c: Math.max(0, +rem.c || 0), f: Math.max(0, +rem.f || 0) };
    var met = { p: (+rem.p || 0) <= 8, c: (+rem.c || 0) <= 15, f: (+rem.f || 0) <= 6 };
    var scored = LIST.map(function (r) {
      var gain = Math.min(r.p, def.p) + Math.min(r.c, def.c) + Math.min(r.f, def.f);
      var pen = (met.p ? r.p * 0.6 : 0) + (met.c ? r.c * 0.5 : 0) + (met.f ? r.f * 0.9 : 0);
      return { r: r, score: gain - pen };
    }).sort(function (a, b) { return b.score - a.score; });
    return scored.slice(0, n).map(function (x) { return x.r; });
  }
  window.Recipes = { LIST: LIST, byType: byType, recommendForMacros: recommendForMacros, DIET_TYPES: ["normal", "vegetarian", "vegan", "pescatarian", "keto", "high-protein", "low-carb", "halal"] };
})();
