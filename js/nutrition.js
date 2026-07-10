// nutrition.js — shared healthy-food helper for Calorie Scan + Home.
// Curated list of common healthy options (approx kcal per typical serving)
// and a small helper that composes a healthy "meal" close to a target kcal.
// Used to: (a) suggest healthy swaps with the SAME calories after a scan,
// and (b) recommend foods on Home to fill the remaining daily calories.
(function () {
  var FOODS = [
    { en: "Grilled chicken breast (150g)", id: "Dada ayam panggang (150g)", kcal: 250, tag: "protein" },
    { en: "Steamed white fish (120g)",     id: "Ikan kukus (120g)",         kcal: 180, tag: "protein" },
    { en: "2 boiled eggs",                 id: "2 telur rebus",             kcal: 155, tag: "protein" },
    { en: "Grilled tempeh (100g)",         id: "Tempe bakar (100g)",        kcal: 190, tag: "protein" },
    { en: "Tofu (100g)",                   id: "Tahu (100g)",               kcal: 145, tag: "protein" },
    { en: "Edamame (100g)",                id: "Edamame (100g)",            kcal: 120, tag: "protein" },
    { en: "Greek yogurt (150g)",           id: "Greek yogurt (150g)",       kcal: 130, tag: "protein" },
    { en: "Steamed rice (100g)",           id: "Nasi putih (100g)",         kcal: 130, tag: "carb" },
    { en: "Brown rice (100g)",             id: "Nasi merah (100g)",         kcal: 120, tag: "carb" },
    { en: "Sweet potato (150g)",           id: "Ubi kukus (150g)",          kcal: 130, tag: "carb" },
    { en: "Oatmeal bowl",                  id: "Semangkuk oatmeal",         kcal: 150, tag: "carb" },
    { en: "Handful of almonds",            id: "Segenggam almond",          kcal: 160, tag: "fat" },
    { en: "Avocado (half)",                id: "Alpukat (setengah)",        kcal: 120, tag: "fat" },
    { en: "Mixed green salad",             id: "Salad sayur",               kcal: 90,  tag: "veg" },
    { en: "Vegetable soup",                id: "Sup sayur bening",          kcal: 85,  tag: "veg" },
    { en: "Banana",                        id: "Pisang",                    kcal: 105, tag: "fruit" },
    { en: "Apple",                         id: "Apel",                      kcal: 95,  tag: "fruit" }
  ];

  // Compose a healthy set of distinct items that sums close to `target` kcal,
  // preferring one protein first, then filling with carbs/veg/fruit.
  function mealFor(target, maxItems) {
    target = Math.round(+target || 0);
    maxItems = maxItems || 4;
    if (target < 60) return [];
    var pool = FOODS.slice().sort(function (a, b) { return b.kcal - a.kcal; });
    var out = [], used = {}, rem = target, gotProtein = false;

    function take(pred) {
      for (var i = 0; i < pool.length; i++) {
        var f = pool[i];
        if (used[f.en]) continue;
        if (pred(f)) { used[f.en] = 1; out.push(f); rem -= f.kcal; return true; }
      }
      return false;
    }
    // 1) one protein that fits (a balanced plate starts with protein)
    if (rem > 120) gotProtein = take(function (f) { return f.tag === "protein" && f.kcal <= rem + 40; });
    // 2) fill with variety: prefer a non-protein that fits, else any that fits
    while (out.length < maxItems && rem > 55) {
      if (take(function (f) { return f.tag !== "protein" && f.kcal <= rem + 25; })) continue;
      if (take(function (f) { return f.kcal <= rem + 25; })) continue;
      break;
    }
    // 3) nothing fit but still short & empty -> smallest item
    if (!out.length) take(function () { return true; });
    return out;
  }

  function totalKcal(list) {
    return (list || []).reduce(function (s, f) { return s + (+f.kcal || 0); }, 0);
  }

  // Localised name using window.L if present (falls back to EN).
  function name(f) {
    if (window.L) return window.L({ en: f.en, id: f.id });
    return f.en;
  }

  window.Nutrition = { foods: FOODS, mealFor: mealFor, totalKcal: totalKcal, name: name };
})();
