// recipes.js — resep resmi 20FIT untuk halaman /diet & rekomendasi di Calories.
// CATATAN: angka kalori & makro (protein/karbo/lemak, gram) adalah PERKIRAAN untuk
// panduan porsi — BUKAN saran ahli gizi. Foto sengaja pakai placeholder (emoji + warna);
// foto makanan di-resolve runtime dari TheMealDB (tanpa API key) via resolveImg/applyThumb.
// `types` = tipe diet yang cocok. Variasi sengaja "makanan normal enak"
// (pizza/burger/burrito/pasta/rice bowl) versi porsi & komposisi terjaga — bukan cuma salad.
(function () {
  var LIST = [
    { id: "rice-chicken", emoji: "🍗", tint: "#C41101", kcal: 520, p: 45, c: 55, f: 12, types: ["normal", "high-protein", "halal"], q: "chicken", cat: "Chicken",
      nm: { en: "Grilled Chicken Rice Bowl", id: "Rice Bowl Ayam Panggang" },
      ing: {
        en: "150 g chicken breast\n1 tbsp low-sodium soy sauce\n1 tsp olive oil\n1 clove garlic, minced\n150 g steamed white rice\n100 g mixed vegetables (broccoli, carrot)\n1 tbsp light teriyaki sauce\n1 tsp toasted sesame seeds",
        id: "150 g dada ayam\n1 sdm kecap asin rendah garam\n1 sdt minyak zaitun\n1 siung bawang putih, cincang\n150 g nasi putih kukus\n100 g sayur campur (brokoli, wortel)\n1 sdm saus teriyaki tipis\n1 sdt wijen sangrai"
      },
      steps: {
        en: "1. Marinate the chicken breast with soy sauce, garlic and olive oil, rest 10 min.\n2. Steam the rice and keep it warm.\n3. Grill the chicken 6–8 min per side until cooked through (75°C inside), then slice.\n4. Steam or blanch the vegetables 2–3 min until crisp-tender.\n5. Plate the rice, arrange chicken and vegetables on top.\n6. Drizzle with teriyaki and finish with sesame seeds.",
        id: "1. Marinasi dada ayam dengan kecap, bawang putih & minyak zaitun, diamkan 10 menit.\n2. Kukus nasi dan jaga tetap hangat.\n3. Panggang ayam 6–8 menit tiap sisi sampai matang (dalam 75°C), lalu iris.\n4. Kukus atau blansir sayur 2–3 menit sampai renyah.\n5. Tata nasi, susun ayam & sayur di atasnya.\n6. Siram teriyaki tipis, taburi wijen."
      } },
    { id: "beef-burger", emoji: "🍔", tint: "#C87000", kcal: 560, p: 38, c: 48, f: 22, types: ["normal", "halal"], q: "burger", cat: "Beef",
      nm: { en: "Lean Beef Burger (whole-wheat)", id: "Burger Sapi Lean (roti gandum)" },
      ing: {
        en: "120 g lean ground beef (90/10)\n1/2 tsp salt & pepper\n1 whole-wheat burger bun\n1 slice light cheese\n2 leaves lettuce\n2 slices tomato\n2 slices red onion\n1 tbsp light mayo or mustard",
        id: "120 g daging sapi giling lean (90/10)\n1/2 sdt garam & merica\n1 roti burger gandum\n1 lembar keju rendah lemak\n2 lembar selada\n2 iris tomat\n2 iris bawang bombai\n1 sdm mayo ringan atau mustard"
      },
      steps: {
        en: "1. Season the beef and shape into one patty slightly wider than the bun.\n2. Heat a dry pan over medium-high, grill the patty 3–4 min per side.\n3. Add the cheese in the last minute so it melts.\n4. Lightly toast the bun cut-side down 1 min.\n5. Spread mayo or mustard on the base, layer lettuce, tomato and onion.\n6. Add the patty, close the bun and serve hot.",
        id: "1. Bumbui daging & bentuk satu patty sedikit lebih lebar dari roti.\n2. Panaskan wajan kering api sedang-besar, panggang patty 3–4 menit tiap sisi.\n3. Tambahkan keju di menit terakhir supaya meleleh.\n4. Panggang roti sisi dalam 1 menit sampai sedikit renyah.\n5. Olesi mayo/mustard di dasar roti, tata selada, tomat & bawang.\n6. Letakkan patty, tutup roti, sajikan hangat."
      } },
    { id: "chicken-burrito", emoji: "🌯", tint: "#2A7A4F", kcal: 600, p: 40, c: 62, f: 20, types: ["normal", "high-protein", "halal"], q: "burrito", cat: "Chicken",
      nm: { en: "Chicken Burrito", id: "Burrito Ayam" },
      ing: {
        en: "1 large whole-wheat tortilla\n120 g chicken breast, diced\n1 tsp olive oil\n1/2 tsp cumin & paprika\n100 g cooked brown rice\n80 g black beans, drained\n3 tbsp tomato salsa\n2 tbsp shredded cheese",
        id: "1 tortilla gandum besar\n120 g dada ayam, potong dadu\n1 sdt minyak zaitun\n1/2 sdt jinten & paprika bubuk\n100 g nasi merah matang\n80 g kacang hitam, tiriskan\n3 sdm salsa tomat\n2 sdm keju parut"
      },
      steps: {
        en: "1. Toss the chicken with cumin, paprika and oil.\n2. Sauté the chicken over medium heat 5–6 min until browned and cooked.\n3. Warm the tortilla in a dry pan 20 sec per side to make it pliable.\n4. Layer rice, beans, chicken, salsa and cheese down the centre.\n5. Fold in the sides and roll tightly into a burrito.\n6. Sear the seam-side down 1–2 min to seal, then slice in half.",
        id: "1. Lumuri ayam dengan jinten, paprika & minyak.\n2. Tumis ayam api sedang 5–6 menit sampai kecokelatan & matang.\n3. Hangatkan tortilla di wajan kering 20 detik tiap sisi agar lentur.\n4. Susun nasi, kacang, ayam, salsa & keju di tengah tortilla.\n5. Lipat kedua sisi lalu gulung padat jadi burrito.\n6. Panggang sisi sambungan 1–2 menit agar merekat, potong dua."
      } },
    { id: "veggie-pizza", emoji: "🍕", tint: "#C87000", kcal: 620, p: 26, c: 78, f: 22, types: ["normal", "vegetarian"], q: "pizza", cat: "Vegetarian",
      nm: { en: "Thin-Crust Veggie Pizza", id: "Pizza Sayur Tipis" },
      ing: {
        en: "1 thin whole-wheat pizza base (~120 g)\n4 tbsp tomato pizza sauce\n80 g part-skim mozzarella\n1/2 bell pepper, sliced\n40 g mushrooms, sliced\n30 g red onion, sliced\nhandful of fresh basil\n1 tsp olive oil",
        id: "1 base pizza gandum tipis (~120 g)\n4 sdm saus tomat pizza\n80 g mozzarella rendah lemak\n1/2 paprika, iris\n40 g jamur, iris\n30 g bawang bombai, iris\nsegenggam daun basil segar\n1 sdt minyak zaitun"
      },
      steps: {
        en: "1. Preheat the oven to 220°C.\n2. Spread tomato sauce evenly over the base, leaving a thin border.\n3. Scatter the mozzarella, then top with pepper, mushrooms and onion.\n4. Drizzle lightly with olive oil.\n5. Bake 10–12 min until the crust is crisp and the cheese bubbles.\n6. Finish with fresh basil, slice and serve.",
        id: "1. Panaskan oven ke 220°C.\n2. Ratakan saus tomat di atas base, sisakan pinggir tipis.\n3. Taburi mozzarella, lalu beri paprika, jamur & bawang.\n4. Perciki sedikit minyak zaitun.\n5. Panggang 10–12 menit sampai base renyah & keju berbuih.\n6. Beri basil segar, potong & sajikan."
      } },
    { id: "tuna-pasta", emoji: "🍝", tint: "#2F6BFF", kcal: 550, p: 38, c: 70, f: 12, types: ["pescatarian", "high-protein"], q: "pasta", cat: "Pasta",
      nm: { en: "Tuna Tomato Pasta", id: "Pasta Tuna Tomat" },
      ing: {
        en: "90 g whole-wheat pasta (dry)\n100 g canned tuna in water, drained\n150 ml tomato passata\n2 cloves garlic, minced\n1 tsp olive oil\n1/2 tsp chili flakes\nfresh basil\nsalt & pepper to taste",
        id: "90 g pasta gandum (kering)\n100 g tuna kaleng dalam air, tiriskan\n150 ml saus tomat passata\n2 siung bawang putih, cincang\n1 sdt minyak zaitun\n1/2 sdt cabai bubuk\nbasil segar\ngaram & merica secukupnya"
      },
      steps: {
        en: "1. Boil the pasta in salted water 9–11 min until al dente, reserve 2 tbsp water.\n2. Meanwhile sauté garlic in olive oil 30 sec until fragrant.\n3. Add the passata and chili flakes, simmer 4–5 min.\n4. Stir in the tuna and warm through 1 min.\n5. Toss the drained pasta with the sauce, loosen with reserved water.\n6. Season, top with basil and serve.",
        id: "1. Rebus pasta di air bergaram 9–11 menit sampai al dente, sisakan 2 sdm air.\n2. Sementara itu tumis bawang putih di minyak 30 detik sampai harum.\n3. Tuang passata & cabai bubuk, didihkan pelan 4–5 menit.\n4. Masukkan tuna, hangatkan 1 menit.\n5. Aduk pasta tiris dengan saus, encerkan pakai air rebusan.\n6. Bumbui, beri basil, sajikan."
      } },
    { id: "salmon-bowl", emoji: "🐟", tint: "#2F6BFF", kcal: 580, p: 42, c: 55, f: 20, types: ["pescatarian", "high-protein"], q: "salmon", cat: "Seafood",
      nm: { en: "Salmon Teriyaki Bowl", id: "Rice Bowl Salmon Teriyaki" },
      ing: {
        en: "140 g salmon fillet\n1 tsp olive oil\n2 tbsp teriyaki sauce\n150 g steamed rice\n60 g edamame, shelled\n1 sheet nori, sliced\n1 tsp sesame seeds\n1 spring onion, sliced",
        id: "140 g fillet salmon\n1 sdt minyak zaitun\n2 sdm saus teriyaki\n150 g nasi kukus\n60 g edamame, kupas\n1 lembar nori, iris\n1 sdt wijen\n1 batang daun bawang, iris"
      },
      steps: {
        en: "1. Pat the salmon dry and season lightly.\n2. Heat oil in a pan, sear the salmon skin-side down 4 min.\n3. Flip, cook 2–3 min more, then brush with teriyaki to glaze.\n4. Boil the edamame 3 min and drain.\n5. Plate the rice, place the salmon on top with edamame.\n6. Garnish with nori, sesame and spring onion.",
        id: "1. Keringkan salmon & bumbui tipis.\n2. Panaskan minyak, panggang salmon sisi kulit di bawah 4 menit.\n3. Balik, masak 2–3 menit lagi, olesi teriyaki sampai mengilap.\n4. Rebus edamame 3 menit, tiriskan.\n5. Tata nasi, letakkan salmon di atasnya bersama edamame.\n6. Beri nori, wijen & daun bawang."
      } },
    { id: "tofu-stirfry", emoji: "🥢", tint: "#2A7A4F", kcal: 480, p: 24, c: 62, f: 14, types: ["vegan", "vegetarian"], q: "tofu", cat: "Vegan",
      nm: { en: "Tofu Veggie Stir-fry + Rice", id: "Tumis Tahu Sayur + Nasi" },
      ing: {
        en: "150 g firm tofu, cubed\n1 tbsp vegetable oil\n120 g mixed veggies (broccoli, carrot, snap peas)\n2 cloves garlic, minced\n1 tsp grated ginger\n2 tbsp soy sauce\n130 g steamed rice\n1 tsp sesame oil",
        id: "150 g tahu padat, potong dadu\n1 sdm minyak sayur\n120 g sayur campur (brokoli, wortel, kacang polong)\n2 siung bawang putih, cincang\n1 sdt jahe parut\n2 sdm kecap asin\n130 g nasi kukus\n1 sdt minyak wijen"
      },
      steps: {
        en: "1. Press the tofu 10 min, then cube it.\n2. Heat oil and fry the tofu until golden on all sides, 5–6 min; set aside.\n3. Stir-fry garlic and ginger 30 sec, add the vegetables.\n4. Cook 3–4 min over high heat until crisp-tender.\n5. Return the tofu, add soy sauce and sesame oil, toss 1 min.\n6. Serve hot over steamed rice.",
        id: "1. Tekan tahu 10 menit lalu potong dadu.\n2. Panaskan minyak, goreng tahu sampai keemasan semua sisi 5–6 menit; sisihkan.\n3. Tumis bawang putih & jahe 30 detik, masukkan sayur.\n4. Masak 3–4 menit api besar sampai renyah.\n5. Kembalikan tahu, beri kecap & minyak wijen, aduk 1 menit.\n6. Sajikan panas di atas nasi."
      } },
    { id: "tempeh-bowl", emoji: "🌱", tint: "#2A7A4F", kcal: 500, p: 30, c: 58, f: 16, types: ["vegan", "vegetarian", "high-protein"], q: "rice", cat: "Vegan",
      nm: { en: "Tempeh Rice Bowl", id: "Rice Bowl Tempe" },
      ing: {
        en: "150 g tempeh, sliced\n1 tbsp vegetable oil\n2 tbsp sweet soy sauce (kecap manis)\n1 clove garlic, minced\n130 g steamed rice\n80 g sautéed greens (kale/spinach)\n2 tbsp sambal matah\n1 tsp lime juice",
        id: "150 g tempe, iris\n1 sdm minyak sayur\n2 sdm kecap manis\n1 siung bawang putih, cincang\n130 g nasi kukus\n80 g tumis sayur hijau (kale/bayam)\n2 sdm sambal matah\n1 sdt air jeruk nipis"
      },
      steps: {
        en: "1. Slice the tempeh into thin pieces.\n2. Pan-fry in oil over medium heat 3–4 min per side until golden.\n3. Add garlic and sweet soy sauce, glaze the tempeh 1 min.\n4. Quickly sauté the greens with a pinch of salt 2 min.\n5. Plate the rice with tempeh and greens.\n6. Top with sambal matah and a squeeze of lime.",
        id: "1. Iris tempe tipis-tipis.\n2. Goreng di minyak api sedang 3–4 menit tiap sisi sampai keemasan.\n3. Tambah bawang putih & kecap manis, lumuri tempe 1 menit.\n4. Tumis cepat sayur hijau dengan sejumput garam 2 menit.\n5. Tata nasi dengan tempe & sayur.\n6. Beri sambal matah dan perasan jeruk nipis."
      } },
    { id: "egg-fried-rice", emoji: "🍚", tint: "#C87000", kcal: 520, p: 22, c: 68, f: 18, types: ["normal", "vegetarian"], q: "fried rice", cat: "Vegetarian",
      nm: { en: "Veggie Egg Fried Rice", id: "Nasi Goreng Telur Sayur" },
      ing: {
        en: "2 eggs, beaten\n150 g cold cooked rice (day-old)\n1 tbsp vegetable oil\n40 g green peas\n40 g carrot, diced\n40 g sweet corn\n2 tbsp soy sauce\n1 spring onion, sliced",
        id: "2 telur, kocok\n150 g nasi dingin (nasi kemarin)\n1 sdm minyak sayur\n40 g kacang polong\n40 g wortel, potong dadu\n40 g jagung manis\n2 sdm kecap asin\n1 batang daun bawang, iris"
      },
      steps: {
        en: "1. Heat half the oil, scramble the eggs until just set, remove.\n2. Add the rest of the oil and stir-fry the peas, carrot and corn 2–3 min.\n3. Add the cold rice, breaking up clumps, and fry 3 min over high heat.\n4. Pour in the soy sauce and toss until evenly coated.\n5. Return the eggs and mix through.\n6. Finish with spring onion and serve.",
        id: "1. Panaskan separuh minyak, orak-arik telur sampai set, angkat.\n2. Tambah sisa minyak, tumis kacang polong, wortel & jagung 2–3 menit.\n3. Masukkan nasi dingin, pecah gumpalan, goreng 3 menit api besar.\n4. Tuang kecap, aduk sampai rata.\n5. Kembalikan telur, aduk rata.\n6. Beri daun bawang, sajikan."
      } },
    { id: "caesar-wrap", emoji: "🌯", tint: "#C41101", kcal: 470, p: 35, c: 40, f: 18, types: ["normal", "high-protein"], q: "wrap", cat: "Chicken",
      nm: { en: "Chicken Caesar Wrap", id: "Wrap Ayam Caesar" },
      ing: {
        en: "1 whole-wheat wrap\n120 g grilled chicken breast, sliced\n60 g romaine lettuce, chopped\n2 tbsp light caesar dressing\n1 tbsp grated parmesan\n2 tbsp croutons, crushed\nblack pepper to taste",
        id: "1 wrap gandum\n120 g dada ayam panggang, iris\n60 g selada romaine, cincang\n2 sdm dressing caesar ringan\n1 sdm parmesan parut\n2 sdm crouton, remuk\nmerica hitam secukupnya"
      },
      steps: {
        en: "1. Grill the chicken breast and slice into strips.\n2. Toss the romaine with caesar dressing and parmesan.\n3. Warm the wrap 15 sec to make it flexible.\n4. Lay the salad down the centre, top with chicken and croutons.\n5. Season with black pepper.\n6. Fold the ends and roll tightly, then cut on the diagonal.",
        id: "1. Panggang dada ayam & iris memanjang.\n2. Aduk romaine dengan dressing caesar & parmesan.\n3. Hangatkan wrap 15 detik agar lentur.\n4. Tata salad di tengah, beri ayam & crouton.\n5. Bumbui merica hitam.\n6. Lipat ujungnya, gulung padat, potong serong."
      } },
    { id: "beef-broccoli", emoji: "🥦", tint: "#2A7A4F", kcal: 540, p: 40, c: 58, f: 16, types: ["normal", "high-protein", "halal"], q: "beef", cat: "Beef",
      nm: { en: "Beef & Broccoli + Rice", id: "Sapi Brokoli + Nasi" },
      ing: {
        en: "120 g lean beef, thinly sliced\n150 g broccoli florets\n1 tbsp vegetable oil\n2 cloves garlic, minced\n1 tsp grated ginger\n2 tbsp oyster/soy sauce\n1 tsp cornstarch + 2 tbsp water\n130 g steamed rice",
        id: "120 g sapi lean, iris tipis\n150 g brokoli\n1 sdm minyak sayur\n2 siung bawang putih, cincang\n1 sdt jahe parut\n2 sdm saus tiram/kecap asin\n1 sdt maizena + 2 sdm air\n130 g nasi kukus"
      },
      steps: {
        en: "1. Blanch the broccoli 2 min, then drain.\n2. Heat oil on high, sear the beef 2 min until just browned, remove.\n3. Stir-fry garlic and ginger 30 sec.\n4. Return the beef with broccoli and the oyster/soy sauce.\n5. Add the cornstarch slurry and toss until the sauce thickens, 1 min.\n6. Serve hot over steamed rice.",
        id: "1. Blansir brokoli 2 menit, tiriskan.\n2. Panaskan minyak api besar, tumis sapi 2 menit sampai kecokelatan, angkat.\n3. Tumis bawang putih & jahe 30 detik.\n4. Kembalikan sapi bersama brokoli & saus tiram/kecap.\n5. Tuang larutan maizena, aduk sampai saus mengental 1 menit.\n6. Sajikan panas di atas nasi."
      } },
    { id: "keto-chicken-avo", emoji: "🥑", tint: "#2A7A4F", kcal: 520, p: 40, c: 10, f: 36, types: ["keto", "low-carb", "high-protein"], q: "avocado", cat: "Chicken",
      nm: { en: "Chicken Avocado Plate", id: "Piring Ayam Alpukat" },
      ing: {
        en: "150 g chicken thigh (boneless)\n1 tbsp olive oil\n1/2 avocado, sliced\n60 g mixed leafy greens\n5 cherry tomatoes\n1 tbsp lemon juice\nsalt, pepper & paprika",
        id: "150 g paha ayam (tanpa tulang)\n1 sdm minyak zaitun\n1/2 alpukat, iris\n60 g sayur daun hijau\n5 tomat ceri\n1 sdm air lemon\ngaram, merica & paprika"
      },
      steps: {
        en: "1. Season the chicken thigh with salt, pepper and paprika.\n2. Heat olive oil and pan-sear the chicken 5–6 min per side until crisp and cooked.\n3. Rest the chicken 2 min, then slice.\n4. Arrange the greens and cherry tomatoes on the plate.\n5. Add sliced avocado and the chicken.\n6. Drizzle with lemon juice and a little olive oil.",
        id: "1. Bumbui paha ayam dengan garam, merica & paprika.\n2. Panaskan minyak zaitun, panggang ayam 5–6 menit tiap sisi sampai renyah & matang.\n3. Diamkan ayam 2 menit, lalu iris.\n4. Tata sayur hijau & tomat ceri di piring.\n5. Tambahkan irisan alpukat & ayam.\n6. Siram air lemon & sedikit minyak zaitun."
      } },
    { id: "yogurt-bowl", emoji: "🥣", tint: "#2F6BFF", kcal: 380, p: 32, c: 40, f: 10, types: ["vegetarian", "high-protein", "low-carb"], q: "yogurt", cat: "Breakfast",
      nm: { en: "Greek Yogurt Protein Bowl", id: "Bowl Protein Greek Yogurt" },
      ing: {
        en: "200 g plain greek yogurt\n1 scoop (30 g) vanilla whey protein\n80 g mixed berries\n1 tbsp chia seeds\n1 tsp honey\n1 tbsp granola",
        id: "200 g greek yogurt plain\n1 scoop (30 g) whey protein vanila\n80 g buah beri campur\n1 sdm biji chia\n1 sdt madu\n1 sdm granola"
      },
      steps: {
        en: "1. Whisk the greek yogurt with the whey until smooth.\n2. Spoon the mixture into a bowl.\n3. Scatter the mixed berries on top.\n4. Sprinkle with chia seeds and granola.\n5. Drizzle with honey.\n6. Serve chilled straight away.",
        id: "1. Kocok greek yogurt dengan whey sampai halus.\n2. Tuang campuran ke dalam mangkuk.\n3. Taburi buah beri di atasnya.\n4. Beri biji chia & granola.\n5. Siram madu tipis.\n6. Sajikan dingin segera."
      } },
    { id: "shrimp-fried-rice", emoji: "🍤", tint: "#C87000", kcal: 530, p: 34, c: 66, f: 14, types: ["pescatarian"], q: "shrimp", cat: "Seafood",
      nm: { en: "Shrimp Fried Rice", id: "Nasi Goreng Udang" },
      ing: {
        en: "120 g peeled shrimp\n150 g cold cooked rice (day-old)\n1 egg, beaten\n1 tbsp vegetable oil\n40 g green peas\n40 g carrot, diced\n2 cloves garlic, minced\n2 tbsp soy sauce",
        id: "120 g udang kupas\n150 g nasi dingin (nasi kemarin)\n1 telur, kocok\n1 sdm minyak sayur\n40 g kacang polong\n40 g wortel, potong dadu\n2 siung bawang putih, cincang\n2 sdm kecap asin"
      },
      steps: {
        en: "1. Heat oil and sauté garlic 30 sec until fragrant.\n2. Add the shrimp and cook 2 min until pink, then push to the side.\n3. Pour in the egg and scramble until just set.\n4. Add peas and carrot, stir-fry 2 min.\n5. Add the cold rice and soy sauce, toss over high heat 3 min.\n6. Combine everything evenly and serve hot.",
        id: "1. Panaskan minyak, tumis bawang putih 30 detik sampai harum.\n2. Masukkan udang, masak 2 menit sampai merah muda, geser ke tepi.\n3. Tuang telur, orak-arik sampai set.\n4. Tambah kacang polong & wortel, tumis 2 menit.\n5. Masukkan nasi dingin & kecap, aduk api besar 3 menit.\n6. Aduk semua sampai rata, sajikan panas."
      } },
    { id: "buddha-bowl", emoji: "🥗", tint: "#2A7A4F", kcal: 490, p: 20, c: 68, f: 14, types: ["vegan", "vegetarian"], q: "chickpea", cat: "Vegan",
      nm: { en: "Chickpea Buddha Bowl", id: "Buddha Bowl Kacang Arab" },
      ing: {
        en: "120 g cooked chickpeas\n100 g cooked quinoa\n100 g roasted vegetables (pumpkin, zucchini)\n40 g shredded red cabbage\n2 tbsp tahini\n1 tbsp lemon juice\n1 tsp olive oil\nsalt & cumin",
        id: "120 g kacang arab matang\n100 g quinoa matang\n100 g sayur panggang (labu, zukini)\n40 g kol merah, serut\n2 sdm tahini\n1 sdm air lemon\n1 sdt minyak zaitun\ngaram & jinten"
      },
      steps: {
        en: "1. Preheat the oven to 200°C.\n2. Toss the vegetables and chickpeas with olive oil, salt and cumin.\n3. Roast 20–25 min until golden and tender.\n4. Whisk the tahini with lemon juice and a little water to a pourable sauce.\n5. Arrange quinoa, roasted veg, chickpeas and cabbage in sections in a bowl.\n6. Drizzle with tahini sauce and serve.",
        id: "1. Panaskan oven ke 200°C.\n2. Lumuri sayur & kacang arab dengan minyak zaitun, garam & jinten.\n3. Panggang 20–25 menit sampai keemasan & empuk.\n4. Kocok tahini dengan air lemon & sedikit air sampai saus bisa dituang.\n5. Tata quinoa, sayur panggang, kacang arab & kol per bagian di mangkuk.\n6. Siram saus tahini, sajikan."
      } },
    { id: "oats-pb", emoji: "🥜", tint: "#C87000", kcal: 420, p: 18, c: 58, f: 14, types: ["vegetarian"], q: "oats", cat: "Breakfast",
      nm: { en: "Overnight Oats PB & Banana", id: "Overnight Oats Selai Kacang & Pisang" },
      ing: {
        en: "60 g rolled oats\n180 ml milk (or plant milk)\n1 tbsp peanut butter\n1/2 banana, sliced\n1 tsp chia seeds\n1 tsp honey\npinch of cinnamon",
        id: "60 g oat\n180 ml susu (atau susu nabati)\n1 sdm selai kacang\n1/2 pisang, iris\n1 sdt biji chia\n1 sdt madu\nsejumput kayu manis"
      },
      steps: {
        en: "1. In a jar, stir the oats, milk, chia seeds and cinnamon together.\n2. Swirl in the peanut butter.\n3. Cover and refrigerate overnight (at least 6 hours).\n4. In the morning, stir and loosen with a splash of milk if needed.\n5. Top with sliced banana and a drizzle of honey.\n6. Serve cold or warm briefly if preferred.",
        id: "1. Dalam toples, aduk oat, susu, biji chia & kayu manis.\n2. Campurkan selai kacang.\n3. Tutup & simpan di kulkas semalaman (minimal 6 jam).\n4. Pagi harinya aduk, encerkan dengan sedikit susu bila perlu.\n5. Beri irisan pisang & siraman madu.\n6. Sajikan dingin atau hangatkan sebentar sesuai selera."
      } }
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

  var IMG_CACHE_KEY = "my20fit_foodimg_v1";
  function _imgCache(){ try { return JSON.parse(localStorage.getItem(IMG_CACHE_KEY) || "{}"); } catch(e){ return {}; } }
  function _saveImg(c){ try { localStorage.setItem(IMG_CACHE_KEY, JSON.stringify(c)); } catch(e){} }
  function _hash(s){ var h=0,i; for(i=0;i<s.length;i++){ h=(h*31 + s.charCodeAt(i))|0; } return Math.abs(h); }
  // Returns Promise<url|null>. Tries TheMealDB name search, then category filter (guaranteed photos), caches by id.
  function resolveImg(rec){
    if(!rec || !rec.id) return Promise.resolve(null);
    var c=_imgCache();
    if(Object.prototype.hasOwnProperty.call(c, rec.id)) return Promise.resolve(c[rec.id]);
    var base="https://www.themealdb.com/api/json/v1/1/";
    // TheMealDB serves resized variants by appending /small (~250px) — cukup untuk thumb 96px & hero 150px,
    // jauh lebih ringan dari full-res (~600-800px). Hemat bandwidth & mempercepat load.
    function done(url){ c=_imgCache(); c[rec.id]=url?(url+"/small"):null; _saveImg(c); return c[rec.id]; }
    return fetch(base+"search.php?s="+encodeURIComponent(rec.q||(rec.nm&&rec.nm.en)||""))
      .then(function(r){return r.json();})
      .then(function(j){
        var m=j&&j.meals; if(m&&m[0]&&m[0].strMealThumb) return done(m[0].strMealThumb);
        return fetch(base+"filter.php?c="+encodeURIComponent(rec.cat||"Miscellaneous"))
          .then(function(r){return r.json();})
          .then(function(j2){ var a=j2&&j2.meals; if(a&&a.length){ return done(a[_hash(rec.id)%a.length].strMealThumb); } return done(null); });
      })
      .catch(function(){ return done(null); });
  }
  // ---- Foto hasil GENERATE AI (OpenRouter gemini-2.5-flash-image) via edge function ----
  // Diutamakan di atas TheMealDB supaya tiap menu punya foto khusus dirinya (bukan foto stok generik).
  // Key OpenRouter TIDAK pernah ada di klien — dipanggil lewat edge function my20fit-foodimg
  // (key = Supabase secret). Butuh user login (verify_jwt). Cache: server (tabel my20fit_foodimg,
  // generate sekali per menu) + in-memory sesi ini. TIDAK di localStorage (data-URL besar → bisa
  // jebol kuota & merusak penyimpanan lain). Gagal/hasil kosong → jatuh ke TheMealDB → emoji.
  var SB_URL = "https://cpvzwqptzcxnwzfzgrmt.supabase.co";
  var SB_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwdnp3cXB0emN4bnd6Znpncm10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MzE0MzksImV4cCI6MjA5MTIwNzQzOX0.DIP-tTFxa3GHMhT6b1Tq-Zz0a24P-vbU9ixEtITbqpI"; // anon (publik, RLS-protected)
  var FOODIMG_URL = SB_URL + "/functions/v1/my20fit-foodimg";
  var _gen = {}; // cache in-memory: id -> url | null (null = sudah dicoba & gagal, jangan ulang sesi ini)
  function genImg(rec){
    if(!rec || !rec.id) return Promise.resolve(null);
    if(Object.prototype.hasOwnProperty.call(_gen, rec.id)) return Promise.resolve(_gen[rec.id]);
    if(typeof fetch !== "function") return Promise.resolve(null);
    var tokP = (window.Auth && Auth.token) ? Promise.resolve(Auth.token()).catch(function(){return null;}) : Promise.resolve(null);
    return tokP.then(function(tok){
      if(!tok) { _gen[rec.id] = null; return null; } // butuh login → skip, biar TheMealDB yang jalan
      return fetch(FOODIMG_URL, { method:"POST", headers:{ "Content-Type":"application/json", "Authorization":"Bearer "+tok, "apikey":SB_ANON },
        body: JSON.stringify({ id: rec.id, name: (rec.nm && rec.nm.en) || rec.id, desc: (rec.q||"") }) })
        .then(function(r){ return r.ok ? r.json() : null; })
        .then(function(j){ var u = (j && j.ok && j.url) || null; _gen[rec.id] = u; return u; })
        .catch(function(){ _gen[rec.id] = null; return null; });
    }).catch(function(){ return null; });
  }
  function _setBg(el, url){ if(!el||!url) return; el.style.backgroundImage = "url('" + url + "')"; el.classList.add("has-photo"); el.textContent = ""; }

  // Resolve + apply ke elemen thumb/hero yang awalnya emoji.
  // Urutan: foto GENERATE (khusus menu) → TheMealDB (stok) → biarkan emoji.
  function applyThumb(el, rec){
    if(!el || !rec) return;
    genImg(rec).then(function(gu){
      if(gu){ _setBg(el, gu); return; }
      resolveImg(rec).then(function(u2){ _setBg(el, u2); }).catch(function(){});
    }).catch(function(){
      resolveImg(rec).then(function(u2){ _setBg(el, u2); }).catch(function(){});
    });
  }

  // Lazy variant: hanya resolve+fetch foto saat kartunya masuk viewport (IntersectionObserver).
  // Mencegah 16 fetch TheMealDB serentak di render pertama. Fallback: langsung apply kalau IO tak didukung.
  var _io = null, _ioMap = (typeof WeakMap !== "undefined") ? new WeakMap() : null;
  function _ensureIO(){
    if(_io || typeof IntersectionObserver === "undefined") return _io;
    _io = new IntersectionObserver(function(ents){
      ents.forEach(function(en){
        if(en.isIntersecting){ var el=en.target; _io.unobserve(el); var rec=_ioMap && _ioMap.get(el); if(rec) applyThumb(el, rec); }
      });
    }, { rootMargin: "200px" });
    return _io;
  }
  function applyThumbLazy(el, rec){
    if(!el || !rec) return;
    var io = _ensureIO();
    if(!io || !_ioMap){ applyThumb(el, rec); return; } // tanpa IO -> langsung
    _ioMap.set(el, rec); io.observe(el);
  }

  window.Recipes = { LIST: LIST, byType: byType, recommendForMacros: recommendForMacros, resolveImg: resolveImg, applyThumb: applyThumb, applyThumbLazy: applyThumbLazy, DIET_TYPES: ["normal", "vegetarian", "vegan", "pescatarian", "keto", "high-protein", "low-carb", "halal"] };
})();
