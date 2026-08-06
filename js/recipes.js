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
      } },
    { id: "gado-gado", emoji: "🥗", tint: "#2A7A4F", kcal: 450, p: 18, c: 42, f: 22, types: ["vegetarian", "halal"], q: "salad", cat: "Vegetarian",
      nm: { en: "Gado-Gado (Indonesian Salad)", id: "Gado-Gado" },
      ing: {
        en: "100 g blanched long beans & spinach\n50 g bean sprouts\n1 boiled egg\n60 g fried tofu\n50 g tempeh\n1/2 boiled potato\n3 tbsp peanut sauce (ground peanut, palm sugar, lime, chili)\nA few prawn crackers",
        id: "100 g kacang panjang & bayam rebus\n50 g tauge\n1 telur rebus\n60 g tahu goreng\n50 g tempe\n1/2 kentang rebus\n3 sdm saus kacang (kacang halus, gula merah, jeruk limau, cabai)\nBeberapa kerupuk"
      },
      steps: {
        en: "1. Blanch the long beans, spinach and bean sprouts briefly, then drain.\n2. Boil the egg and potato, cut into wedges.\n3. Pan-fry the tofu and tempeh until golden, then slice.\n4. Blend the peanut sauce until smooth, loosen with a little warm water.\n5. Arrange the vegetables, egg, tofu and tempeh on a plate.\n6. Pour peanut sauce over the top and add crackers.",
        id: "1. Blansir kacang panjang, bayam & tauge sebentar, tiriskan.\n2. Rebus telur & kentang, potong.\n3. Goreng tahu & tempe sampai keemasan, iris.\n4. Haluskan saus kacang, encerkan sedikit dengan air hangat.\n5. Tata sayur, telur, tahu & tempe di piring.\n6. Siram saus kacang, tambahkan kerupuk."
      } },
    { id: "nasi-pecel", emoji: "🍚", tint: "#2A7A4F", kcal: 480, p: 16, c: 62, f: 16, types: ["vegetarian", "vegan"], q: "vegetarian", cat: "Vegetarian",
      nm: { en: "Nasi Pecel (Rice with Peanut-Sauce Veggies)", id: "Nasi Pecel" },
      ing: {
        en: "150 g steamed rice\n100 g blanched vegetables (spinach, long beans, bean sprouts, cassava leaf)\n1 slice fried tempeh\n3 tbsp spicy peanut sauce (peanut, kaffir lime leaf, palm sugar, chili)\nBasil leaves\nRempeyek cracker (optional)",
        id: "150 g nasi putih\n100 g sayur rebus (bayam, kacang panjang, tauge, daun singkong)\n1 iris tempe goreng\n3 sdm sambal pecel (kacang, daun jeruk, gula merah, cabai)\nDaun kemangi\nRempeyek (opsional)"
      },
      steps: {
        en: "1. Blanch all the vegetables until just tender, then drain well.\n2. Dissolve the peanut-sauce paste with warm water to a pourable consistency.\n3. Plate the warm rice with the vegetables on top.\n4. Pour the spicy peanut sauce over the vegetables.\n5. Add fried tempeh and basil.\n6. Top with rempeyek if you like.",
        id: "1. Rebus semua sayur sampai empuk, tiriskan.\n2. Larutkan sambal pecel dengan air hangat sampai bisa disiram.\n3. Tata nasi hangat, beri sayur di atasnya.\n4. Siram sambal pecel ke sayur.\n5. Tambah tempe goreng & kemangi.\n6. Beri rempeyek bila suka."
      } },
    { id: "soto-ayam", emoji: "🍜", tint: "#C87000", kcal: 380, p: 30, c: 34, f: 12, types: ["normal", "high-protein", "halal"], q: "chicken soup", cat: "Chicken",
      nm: { en: "Soto Ayam (Indonesian Chicken Soup)", id: "Soto Ayam" },
      ing: {
        en: "120 g shredded boiled chicken\nClear turmeric-yellow chicken broth\n50 g rice vermicelli\n50 g bean sprouts\n1/2 boiled egg\nSliced cabbage\nCelery & fried shallots\nLime wedge",
        id: "120 g ayam rebus suwir\nKuah kaldu ayam kuning (kunyit)\n50 g soun\n50 g tauge\n1/2 telur rebus\nKol iris\nSeledri & bawang goreng\nJeruk nipis"
      },
      steps: {
        en: "1. Simmer chicken with turmeric, ginger, lemongrass and garlic to a clear yellow broth.\n2. Shred the cooked chicken.\n3. Soak the vermicelli and blanch the bean sprouts.\n4. Arrange vermicelli, sprouts, cabbage, egg and chicken in a bowl.\n5. Pour the hot broth over.\n6. Finish with celery, fried shallots and a squeeze of lime.",
        id: "1. Rebus ayam dengan kunyit, jahe, serai & bawang putih jadi kuah kuning bening.\n2. Suwir ayam yang sudah matang.\n3. Seduh soun, blansir tauge.\n4. Tata soun, tauge, kol, telur & ayam di mangkuk.\n5. Siram kuah panas.\n6. Taburi seledri, bawang goreng, peras jeruk nipis."
      } },
    { id: "bakwan-sayur", emoji: "🥬", tint: "#C87000", kcal: 250, p: 8, c: 30, f: 10, types: ["vegetarian", "vegan"], q: "vegetable fritter", cat: "Vegetarian",
      nm: { en: "Baked Vegetable Bakwan (Fritters)", id: "Bakwan Sayur (Panggang)" },
      ing: {
        en: "80 g shredded cabbage\n60 g grated carrot\n40 g bean sprouts\n2 tbsp sliced spring onion\n40 g flour batter\n1 clove garlic\nPinch of salt & pepper\n1 tsp oil (brushed, then baked)",
        id: "80 g kol iris\n60 g wortel parut\n40 g tauge\n2 sdm daun bawang\n40 g adonan tepung\n1 siung bawang putih\nSejumput garam & merica\n1 sdt minyak (oles, lalu panggang)"
      },
      steps: {
        en: "1. Mix the vegetables with flour, garlic, salt, pepper and a little water into a thick batter.\n2. Shape into small patties on a lined tray.\n3. Lightly brush with oil.\n4. Bake (or air-fry) at 200°C for 15–18 min, flipping once, until golden and crisp.\n5. Serve warm with chili sauce on the side.",
        id: "1. Campur sayur dengan tepung, bawang putih, garam, merica & sedikit air jadi adonan kental.\n2. Bentuk bulat pipih di loyang beralas.\n3. Oles tipis minyak.\n4. Panggang (atau air-fryer) 200°C 15–18 menit, balik sekali, sampai keemasan & renyah.\n5. Sajikan hangat dengan saus sambal."
      } },
    { id: "idn-a-01", emoji: "🍚", tint: "#C87000", kcal: 520, p: 22, c: 68, f: 18, types: ["normal", "halal"], q: "rice", cat: "Rice",
    nm: { en: "Nasi Goreng Kampung (Indonesian Fried Rice)", id: "Nasi Goreng Kampung" },
    ing: {
      en: "200 g cold cooked rice\n1 egg\n50 g chicken, diced\n2 cloves garlic\n1 shallot\n1 tsp sweet soy sauce\n1 tbsp oil\nSliced scallion and cucumber",
      id: "200 g nasi dingin\n1 telur\n50 g ayam, potong dadu\n2 siung bawang putih\n1 butir bawang merah\n1 sdt kecap manis\n1 sdm minyak\nDaun bawang dan timun"
    },
    steps: {
      en: "1. Heat oil, saute minced garlic and shallot until fragrant.\n2. Push aside, scramble the egg.\n3. Add chicken, cook until done.\n4. Add rice and sweet soy sauce, stir-fry on high heat.\n5. Toss until evenly colored and hot.\n6. Serve with scallion and cucumber.",
      id: "1. Panaskan minyak, tumis bawang putih dan bawang merah sampai harum.\n2. Sisihkan, orak-arik telur.\n3. Masukkan ayam, masak sampai matang.\n4. Tambahkan nasi dan kecap manis, tumis api besar.\n5. Aduk sampai rata dan panas.\n6. Sajikan dengan daun bawang dan timun."
    } },
  { id: "idn-a-02", emoji: "🍚", tint: "#C87000", kcal: 480, p: 14, c: 62, f: 20, types: ["vegetarian", "halal"], q: "rice", cat: "Rice",
    nm: { en: "Nasi Uduk (Jakarta Coconut Rice)", id: "Nasi Uduk" },
    ing: {
      en: "200 g rice\n150 ml coconut milk\n1 bay leaf\n1 stalk lemongrass, bruised\n2 kaffir lime leaves\n1 tsp salt\n100 g tempe, fried and sliced\n1 egg, fried\nFried shallots to top",
      id: "200 g beras\n150 ml santan\n1 lembar daun salam\n1 batang serai, memarkan\n2 lembar daun jeruk\n1 sdt garam\n100 g tempe, goreng dan iris\n1 telur, goreng\nBawang goreng untuk taburan"
    },
    steps: {
      en: "1. Rinse the rice and drain well.\n2. Combine rice, coconut milk, bay leaf, lemongrass, lime leaves and salt.\n3. Steam or cook in a rice cooker until fluffy.\n4. Fluff the rice and remove the aromatics.\n5. Serve topped with fried tempe, fried egg and fried shallots.",
      id: "1. Cuci beras dan tiriskan.\n2. Campur beras, santan, daun salam, serai, daun jeruk dan garam.\n3. Kukus atau masak di rice cooker sampai pulen.\n4. Aduk nasi dan buang bumbu aromatiknya.\n5. Sajikan dengan tempe goreng, telur goreng dan bawang goreng."
    } },
  { id: "idn-a-03", emoji: "🍛", tint: "#C87000", kcal: 510, p: 14, c: 66, f: 18, types: ["vegetarian", "halal"], q: "rice", cat: "Rice",
    nm: { en: "Nasi Kuning (Turmeric Yellow Rice)", id: "Nasi Kuning" },
    ing: {
      en: "200 g rice\n150 ml coconut milk\n1 tsp ground turmeric\n1 stalk lemongrass, bruised\n2 kaffir lime leaves\n1 bay leaf\n1 tsp salt\n1 egg\nFried shallots to top",
      id: "200 g beras\n150 ml santan\n1 sdt kunyit bubuk\n1 batang serai, memarkan\n2 lembar daun jeruk\n1 lembar daun salam\n1 sdt garam\n1 telur\nBawang goreng untuk taburan"
    },
    steps: {
      en: "1. Wash the rice and mix with turmeric.\n2. Add coconut milk, lemongrass, lime leaves, bay leaf and salt.\n3. Cook in a rice cooker until the rice is fluffy and yellow.\n4. Meanwhile fry the egg to your liking.\n5. Fluff the rice and discard the aromatics.\n6. Serve with the egg and fried shallots.",
      id: "1. Cuci beras dan campur dengan kunyit.\n2. Tambahkan santan, serai, daun jeruk, daun salam dan garam.\n3. Masak di rice cooker sampai nasi pulen dan kuning.\n4. Sementara itu goreng telur sesuai selera.\n5. Aduk nasi dan buang bumbu aromatiknya.\n6. Sajikan dengan telur dan bawang goreng."
    } },
  { id: "idn-a-04", emoji: "🍚", tint: "#2A7A4F", kcal: 490, p: 16, c: 64, f: 17, types: ["pescatarian", "halal"], q: "rice", cat: "Rice",
    nm: { en: "Nasi Liwet Sunda (Sundanese Savory Rice)", id: "Nasi Liwet" },
    ing: {
      en: "200 g rice\n1 tbsp anchovies\n3 cloves garlic, sliced\n2 shallots, sliced\n1 stalk lemongrass, bruised\n2 bay leaves\n1 tsp salt\n250 ml water\nFried shallots to top",
      id: "200 g beras\n1 sdm ikan teri\n3 siung bawang putih, iris\n2 butir bawang merah, iris\n1 batang serai, memarkan\n2 lembar daun salam\n1 sdt garam\n250 ml air\nBawang goreng untuk taburan"
    },
    steps: {
      en: "1. Rinse the rice and place in a pot.\n2. Add anchovies, garlic, shallots, lemongrass, bay leaves and salt.\n3. Pour in the water and stir gently.\n4. Cook over low heat until the water is absorbed.\n5. Cover and let it steam until fully cooked.\n6. Fluff and serve topped with fried shallots.",
      id: "1. Cuci beras dan masukkan ke panci.\n2. Tambahkan teri, bawang putih, bawang merah, serai, daun salam dan garam.\n3. Tuang air dan aduk perlahan.\n4. Masak dengan api kecil sampai air menyusut.\n5. Tutup dan biarkan mengukus sampai matang.\n6. Aduk dan sajikan dengan bawang goreng."
    } },
  { id: "idn-a-05", emoji: "🍱", tint: "#C41101", kcal: 620, p: 28, c: 70, f: 24, types: ["normal", "halal"], q: "rice", cat: "Rice",
    nm: { en: "Nasi Campur (Mixed Rice Plate)", id: "Nasi Campur" },
    ing: {
      en: "250 g cooked rice\n100 g chicken, shredded\n1 egg, boiled\n50 g tempe, fried\n2 tbsp sambal\n1 tbsp sweet soy sauce\nHandful of blanched vegetables\nFried shallots and crackers",
      id: "250 g nasi putih\n100 g ayam, suwir\n1 telur, rebus\n50 g tempe, goreng\n2 sdm sambal\n1 sdm kecap manis\nSegenggam sayuran rebus\nBawang goreng dan kerupuk"
    },
    steps: {
      en: "1. Cook the chicken with sweet soy sauce until tender, then shred.\n2. Fry the tempe until golden.\n3. Boil the egg and cut in half.\n4. Arrange rice on a plate.\n5. Top with chicken, tempe, egg and vegetables.\n6. Add sambal, fried shallots and crackers, then serve.",
      id: "1. Masak ayam dengan kecap manis sampai empuk, lalu suwir.\n2. Goreng tempe sampai keemasan.\n3. Rebus telur dan belah dua.\n4. Tata nasi di piring.\n5. Beri ayam, tempe, telur dan sayuran.\n6. Tambahkan sambal, bawang goreng dan kerupuk, lalu sajikan."
    } },
  { id: "idn-a-06", emoji: "🍲", tint: "#2A7A4F", kcal: 430, p: 12, c: 58, f: 16, types: ["vegetarian", "halal"], q: "rice", cat: "Rice",
    nm: { en: "Lontong Sayur (Rice Cake in Vegetable Curry)", id: "Lontong Sayur" },
    ing: {
      en: "2 rice cakes (lontong), sliced\n100 g chayote, julienned\n50 g long beans, cut\n200 ml coconut milk\n2 cloves garlic\n2 shallots\n1 tsp ground coriander\n1 bay leaf\n1 boiled egg",
      id: "2 buah lontong, iris\n100 g labu siam, iris korek\n50 g kacang panjang, potong\n200 ml santan\n2 siung bawang putih\n2 butir bawang merah\n1 sdt ketumbar bubuk\n1 lembar daun salam\n1 telur rebus"
    },
    steps: {
      en: "1. Blend garlic, shallots and coriander into a paste.\n2. Saute the paste with the bay leaf until fragrant.\n3. Add chayote and long beans, stir briefly.\n4. Pour in the coconut milk and simmer until vegetables soften.\n5. Season with salt to taste.\n6. Serve the curry over sliced lontong with boiled egg.",
      id: "1. Haluskan bawang putih, bawang merah dan ketumbar.\n2. Tumis bumbu dengan daun salam sampai harum.\n3. Masukkan labu siam dan kacang panjang, aduk sebentar.\n4. Tuang santan dan masak sampai sayuran empuk.\n5. Bumbui dengan garam secukupnya.\n6. Siramkan sayur ke lontong iris dengan telur rebus."
    } },
  { id: "idn-a-07", emoji: "🥗", tint: "#2A7A4F", kcal: 520, p: 16, c: 62, f: 22, types: ["vegetarian", "vegan", "halal"], q: "tofu", cat: "Rice",
    nm: { en: "Ketoprak (Rice Cake and Tofu in Peanut Sauce)", id: "Ketoprak" },
    ing: {
      en: "1 rice cake (lontong), sliced\n100 g tofu, fried and cubed\n50 g rice vermicelli, soaked\n50 g bean sprouts, blanched\n3 tbsp ground roasted peanuts\n1 clove garlic\n1 tsp sweet soy sauce\nEmping crackers and fried shallots",
      id: "1 buah lontong, iris\n100 g tahu, goreng dan potong dadu\n50 g bihun, rendam\n50 g tauge, seduh\n3 sdm kacang tanah sangrai, haluskan\n1 siung bawang putih\n1 sdt kecap manis\nEmping dan bawang goreng"
    },
    steps: {
      en: "1. Grind the peanuts with garlic and a little water into a sauce.\n2. Stir in the sweet soy sauce and season to taste.\n3. Soak the vermicelli in hot water until soft, then drain.\n4. Arrange lontong, tofu, vermicelli and bean sprouts on a plate.\n5. Pour the peanut sauce generously over the top.\n6. Finish with emping crackers and fried shallots.",
      id: "1. Haluskan kacang dengan bawang putih dan sedikit air jadi saus.\n2. Aduk kecap manis dan bumbui secukupnya.\n3. Rendam bihun di air panas sampai lunak, tiriskan.\n4. Tata lontong, tahu, bihun dan tauge di piring.\n5. Siram saus kacang dengan banyak di atasnya.\n6. Beri emping dan bawang goreng."
    } },
  { id: "idn-a-08", emoji: "🍜", tint: "#C87000", kcal: 540, p: 20, c: 66, f: 20, types: ["normal", "halal"], q: "noodle", cat: "Noodle",
    nm: { en: "Mie Goreng (Indonesian Fried Noodles)", id: "Mie Goreng" },
    ing: {
      en: "150 g yellow egg noodles\n1 egg\n50 g chicken, sliced\n50 g cabbage, shredded\n2 cloves garlic\n1 tbsp sweet soy sauce\n1 tbsp oil\nScallion and fried shallots",
      id: "150 g mie telur kuning\n1 telur\n50 g ayam, iris\n50 g kol, iris\n2 siung bawang putih\n1 sdm kecap manis\n1 sdm minyak\nDaun bawang dan bawang goreng"
    },
    steps: {
      en: "1. Boil the noodles until just tender, then drain.\n2. Heat oil and saute minced garlic until fragrant.\n3. Add chicken and cook until done.\n4. Push aside and scramble the egg.\n5. Add cabbage and noodles with sweet soy sauce.\n6. Stir-fry until well mixed and serve with scallion.",
      id: "1. Rebus mie sampai matang, lalu tiriskan.\n2. Panaskan minyak dan tumis bawang putih sampai harum.\n3. Masukkan ayam dan masak sampai matang.\n4. Sisihkan dan orak-arik telur.\n5. Tambahkan kol dan mie dengan kecap manis.\n6. Tumis sampai rata dan sajikan dengan daun bawang."
    } },
  { id: "idn-a-09", emoji: "🍜", tint: "#2F6BFF", kcal: 420, p: 18, c: 58, f: 12, types: ["normal", "halal"], q: "noodle", cat: "Noodle",
    nm: { en: "Mie Rebus (Noodle Soup)", id: "Mie Rebus" },
    ing: {
      en: "150 g yellow egg noodles\n50 g chicken, sliced\n2 baby bok choy\n1 egg\n2 cloves garlic\n500 ml chicken broth\n1 scallion, sliced\nFried shallots to top",
      id: "150 g mie telur kuning\n50 g ayam, iris\n2 buah sawi hijau\n1 telur\n2 siung bawang putih\n500 ml kaldu ayam\n1 batang daun bawang\nBawang goreng untuk taburan"
    },
    steps: {
      en: "1. Saute minced garlic until fragrant in a pot.\n2. Add chicken and cook briefly.\n3. Pour in the broth and bring to a boil.\n4. Add the noodles and bok choy.\n5. Crack in the egg and simmer until cooked.\n6. Serve hot with scallion and fried shallots.",
      id: "1. Tumis bawang putih sampai harum di panci.\n2. Masukkan ayam dan masak sebentar.\n3. Tuang kaldu dan didihkan.\n4. Masukkan mie dan sawi.\n5. Pecahkan telur dan masak sampai matang.\n6. Sajikan panas dengan daun bawang dan bawang goreng."
    } },
  { id: "idn-a-10", emoji: "🍜", tint: "#C87000", kcal: 470, p: 16, c: 64, f: 16, types: ["normal", "halal"], q: "noodle", cat: "Noodle",
    nm: { en: "Bihun Goreng (Fried Rice Vermicelli)", id: "Bihun Goreng" },
    ing: {
      en: "150 g rice vermicelli, soaked\n1 egg\n50 g chicken, sliced\n50 g cabbage, shredded\n1 carrot, julienned\n2 cloves garlic\n1 tbsp sweet soy sauce\n1 tbsp oil",
      id: "150 g bihun, rendam\n1 telur\n50 g ayam, iris\n50 g kol, iris\n1 wortel, iris korek\n2 siung bawang putih\n1 sdm kecap manis\n1 sdm minyak"
    },
    steps: {
      en: "1. Soak the vermicelli in warm water until soft, then drain.\n2. Heat oil and saute minced garlic until fragrant.\n3. Add chicken and cook until done, then scramble the egg.\n4. Add carrot and cabbage, stir until wilted.\n5. Toss in the vermicelli with sweet soy sauce.\n6. Stir-fry until evenly mixed and serve.",
      id: "1. Rendam bihun di air hangat sampai lunak, tiriskan.\n2. Panaskan minyak dan tumis bawang putih sampai harum.\n3. Masukkan ayam sampai matang, lalu orak-arik telur.\n4. Tambahkan wortel dan kol, aduk sampai layu.\n5. Masukkan bihun dengan kecap manis.\n6. Tumis sampai rata dan sajikan."
    } },
  { id: "idn-a-11", emoji: "🍜", tint: "#C87000", kcal: 560, p: 22, c: 68, f: 20, types: ["normal", "halal"], q: "noodle", cat: "Noodle",
    nm: { en: "Kwetiau Goreng (Fried Flat Rice Noodles)", id: "Kwetiau Goreng" },
    ing: {
      en: "200 g flat rice noodles\n1 egg\n50 g chicken, sliced\n50 g bean sprouts\n1 baby bok choy\n2 cloves garlic\n1 tbsp sweet soy sauce\n1 tbsp oil",
      id: "200 g kwetiau\n1 telur\n50 g ayam, iris\n50 g tauge\n1 buah sawi hijau\n2 siung bawang putih\n1 sdm kecap manis\n1 sdm minyak"
    },
    steps: {
      en: "1. Heat oil and saute minced garlic until fragrant.\n2. Add chicken and cook until done.\n3. Push aside and scramble the egg.\n4. Add the flat noodles and sweet soy sauce.\n5. Toss in bean sprouts and bok choy.\n6. Stir-fry on high heat until hot and serve.",
      id: "1. Panaskan minyak dan tumis bawang putih sampai harum.\n2. Masukkan ayam dan masak sampai matang.\n3. Sisihkan dan orak-arik telur.\n4. Tambahkan kwetiau dan kecap manis.\n5. Masukkan tauge dan sawi.\n6. Tumis api besar sampai panas dan sajikan."
    } },
  { id: "idn-a-12", emoji: "🍜", tint: "#C41101", kcal: 500, p: 26, c: 62, f: 16, types: ["normal", "halal", "high-protein"], q: "noodle", cat: "Noodle",
    nm: { en: "Mie Ayam (Chicken Noodles)", id: "Mie Ayam" },
    ing: {
      en: "150 g yellow egg noodles\n100 g chicken, diced\n2 cloves garlic\n1 tbsp sweet soy sauce\n1 tsp oyster-style sauce\n2 baby bok choy\n1 tsp sesame oil\nScallion and fried shallots",
      id: "150 g mie telur kuning\n100 g ayam, potong dadu\n2 siung bawang putih\n1 sdm kecap manis\n1 sdt saus tiram\n2 buah sawi hijau\n1 sdt minyak wijen\nDaun bawang dan bawang goreng"
    },
    steps: {
      en: "1. Saute garlic, then add chicken.\n2. Season with sweet soy sauce and oyster-style sauce.\n3. Cook until the chicken is tender and glazed.\n4. Boil the noodles and bok choy until just done.\n5. Toss the noodles with sesame oil in a bowl.\n6. Top with the chicken, scallion and fried shallots.",
      id: "1. Tumis bawang putih, lalu masukkan ayam.\n2. Bumbui dengan kecap manis dan saus tiram.\n3. Masak sampai ayam empuk dan mengilap.\n4. Rebus mie dan sawi sampai matang.\n5. Aduk mie dengan minyak wijen di mangkuk.\n6. Beri ayam, daun bawang dan bawang goreng."
    } },
  { id: "idn-a-13", emoji: "🥣", tint: "#2F6BFF", kcal: 350, p: 18, c: 50, f: 9, types: ["normal", "halal"], q: "porridge", cat: "Breakfast",
    nm: { en: "Bubur Ayam (Chicken Rice Porridge)", id: "Bubur Ayam" },
    ing: {
      en: "100 g rice\n800 ml chicken broth\n100 g chicken, shredded\n1 tbsp sweet soy sauce\n1 scallion, sliced\nFried shallots and crackers\n1 tsp salt\nCrispy soybeans to top",
      id: "100 g beras\n800 ml kaldu ayam\n100 g ayam, suwir\n1 sdm kecap manis\n1 batang daun bawang\nBawang goreng dan kerupuk\n1 sdt garam\nKedelai goreng untuk taburan"
    },
    steps: {
      en: "1. Rinse the rice and add to the broth.\n2. Simmer over low heat, stirring often.\n3. Cook until the rice breaks down into a smooth porridge.\n4. Season with salt to taste.\n5. Ladle into bowls and top with shredded chicken.\n6. Finish with sweet soy sauce, scallion, shallots and crackers.",
      id: "1. Cuci beras dan masukkan ke kaldu.\n2. Masak dengan api kecil sambil sering diaduk.\n3. Masak sampai beras hancur jadi bubur lembut.\n4. Bumbui dengan garam secukupnya.\n5. Tuang ke mangkuk dan beri ayam suwir.\n6. Sajikan dengan kecap manis, daun bawang, bawang goreng dan kerupuk."
    } },
  { id: "idn-a-14", emoji: "🍗", tint: "#C41101", kcal: 640, p: 34, c: 68, f: 26, types: ["normal", "halal", "high-protein"], q: "chicken", cat: "Chicken",
    nm: { en: "Nasi Ayam Geprek (Smashed Fried Chicken Rice)", id: "Nasi Ayam Geprek" },
    ing: {
      en: "250 g cooked rice\n1 chicken thigh fillet\n3 tbsp flour\n5 birds eye chilies\n3 cloves garlic\n1 tsp salt\n1 tbsp oil for frying\nCucumber slices",
      id: "250 g nasi putih\n1 potong paha ayam fillet\n3 sdm tepung terigu\n5 buah cabai rawit\n3 siung bawang putih\n1 sdt garam\n1 sdm minyak untuk menggoreng\nIrisan timun"
    },
    steps: {
      en: "1. Coat the chicken in seasoned flour.\n2. Deep-fry until golden and crispy, then drain.\n3. Grind chilies, garlic and salt into a rough sambal.\n4. Place the fried chicken on the sambal.\n5. Smash the chicken so it mixes with the sambal.\n6. Serve over warm rice with cucumber.",
      id: "1. Balur ayam dengan tepung berbumbu.\n2. Goreng sampai keemasan dan renyah, tiriskan.\n3. Ulek cabai, bawang putih dan garam jadi sambal kasar.\n4. Letakkan ayam goreng di atas sambal.\n5. Geprek ayam sampai tercampur sambal.\n6. Sajikan di atas nasi hangat dengan timun."
    } },
  { id: "idn-a-15", emoji: "🍙", tint: "#2A7A4F", kcal: 480, p: 18, c: 62, f: 16, types: ["normal", "halal"], q: "rice", cat: "Rice",
    nm: { en: "Nasi Bakar (Grilled Rice Parcel)", id: "Nasi Bakar" },
    ing: {
      en: "250 g cooked rice\n80 g chicken, minced\n1 tbsp anchovies\n2 cloves garlic\n2 shallots\n2 kaffir lime leaves\n1 tsp salt\nBanana leaf for wrapping",
      id: "250 g nasi putih\n80 g ayam, cincang\n1 sdm ikan teri\n2 siung bawang putih\n2 butir bawang merah\n2 lembar daun jeruk\n1 sdt garam\nDaun pisang untuk membungkus"
    },
    steps: {
      en: "1. Saute garlic, shallots and lime leaves until fragrant.\n2. Add chicken and anchovies, cook until done.\n3. Mix the filling into the cooked rice with salt.\n4. Wrap portions of rice in banana leaf.\n5. Grill the parcels until the leaf is charred and fragrant.\n6. Unwrap and serve warm.",
      id: "1. Tumis bawang putih, bawang merah dan daun jeruk sampai harum.\n2. Masukkan ayam dan teri, masak sampai matang.\n3. Campur isian ke dalam nasi dengan garam.\n4. Bungkus nasi dengan daun pisang.\n5. Bakar bungkusan sampai daun gosong dan harum.\n6. Buka bungkus dan sajikan hangat."
    } },
  { id: "idn-a-16", emoji: "🍙", tint: "#2A7A4F", kcal: 460, p: 16, c: 60, f: 16, types: ["vegetarian", "halal"], q: "rice", cat: "Rice",
    nm: { en: "Nasi Timbel (Sundanese Wrapped Rice)", id: "Nasi Timbel" },
    ing: {
      en: "250 g hot cooked rice\n100 g tofu, fried\n80 g tempe, fried\n2 tbsp sambal\nHandful of fresh vegetables\n1 stalk lemon basil\n1 tsp salt\nBanana leaf for wrapping",
      id: "250 g nasi panas\n100 g tahu, goreng\n80 g tempe, goreng\n2 sdm sambal\nSegenggam lalapan segar\n1 batang kemangi\n1 sdt garam\nDaun pisang untuk membungkus"
    },
    steps: {
      en: "1. Wrap the hot rice tightly in banana leaf.\n2. Let it rest so it takes on the leaf aroma.\n3. Fry the tofu and tempe until golden.\n4. Prepare the sambal and fresh vegetables.\n5. Unwrap the rice onto a plate.\n6. Serve with tofu, tempe, sambal and vegetables.",
      id: "1. Bungkus nasi panas rapat dengan daun pisang.\n2. Diamkan agar nasi menyerap aroma daun.\n3. Goreng tahu dan tempe sampai keemasan.\n4. Siapkan sambal dan lalapan segar.\n5. Buka bungkus nasi ke piring.\n6. Sajikan dengan tahu, tempe, sambal dan lalapan."
    } },
  { id: "idn-a-17", emoji: "🍤", tint: "#2F6BFF", kcal: 540, p: 26, c: 66, f: 18, types: ["pescatarian", "halal"], q: "seafood", cat: "Rice",
    nm: { en: "Nasi Goreng Seafood (Seafood Fried Rice)", id: "Nasi Goreng Seafood" },
    ing: {
      en: "200 g cold cooked rice\n60 g peeled shrimp\n40 g squid rings\n1 egg\n2 cloves garlic\n1 tbsp oyster-style sauce\n1 tbsp oil\nScallion and cucumber",
      id: "200 g nasi dingin\n60 g udang kupas\n40 g cumi, potong cincin\n1 telur\n2 siung bawang putih\n1 sdm saus tiram\n1 sdm minyak\nDaun bawang dan timun"
    },
    steps: {
      en: "1. Heat oil and saute minced garlic until fragrant.\n2. Add shrimp and squid, cook until they turn opaque.\n3. Push aside and scramble the egg.\n4. Add the rice and oyster-style sauce.\n5. Stir-fry on high heat until evenly mixed.\n6. Serve with scallion and cucumber.",
      id: "1. Panaskan minyak dan tumis bawang putih sampai harum.\n2. Masukkan udang dan cumi, masak sampai berubah warna.\n3. Sisihkan dan orak-arik telur.\n4. Tambahkan nasi dan saus tiram.\n5. Tumis api besar sampai rata.\n6. Sajikan dengan daun bawang dan timun."
    } },
  { id: "idn-a-18", emoji: "🍚", tint: "#2A7A4F", kcal: 440, p: 14, c: 60, f: 14, types: ["pescatarian", "halal"], q: "rice", cat: "Rice",
    nm: { en: "Nasi Ulam (Herbed Rice)", id: "Nasi Ulam" },
    ing: {
      en: "250 g cooked rice\n2 tbsp grated toasted coconut\n1 tbsp anchovies, fried\n2 kaffir lime leaves, sliced thin\n1 stalk lemon basil, chopped\n1 tsp fried shallots\n1 tsp salt\n1 red chili, sliced",
      id: "250 g nasi putih\n2 sdm kelapa parut sangrai\n1 sdm ikan teri, goreng\n2 lembar daun jeruk, iris halus\n1 batang kemangi, cincang\n1 sdt bawang goreng\n1 sdt garam\n1 buah cabai merah, iris"
    },
    steps: {
      en: "1. Toast the grated coconut until golden and fragrant.\n2. Fry the anchovies until crisp.\n3. Mix the warm rice with coconut and sliced herbs.\n4. Add anchovies, chili and salt.\n5. Toss everything until evenly combined.\n6. Top with fried shallots and serve.",
      id: "1. Sangrai kelapa parut sampai keemasan dan harum.\n2. Goreng teri sampai renyah.\n3. Campur nasi hangat dengan kelapa dan irisan daun.\n4. Tambahkan teri, cabai dan garam.\n5. Aduk semua sampai tercampur rata.\n6. Beri bawang goreng dan sajikan."
    } },
  { id: "idn-a-19", emoji: "🍜", tint: "#C41101", kcal: 470, p: 24, c: 52, f: 16, types: ["normal", "halal", "high-protein"], q: "noodle", cat: "Noodle",
    nm: { en: "Mie Kocok Bandung (Beef Noodle Soup)", id: "Mie Kocok" },
    ing: {
      en: "150 g flat egg noodles\n80 g beef tendon, boiled\n50 g bean sprouts\n600 ml beef broth\n2 cloves garlic\n1 tsp ground pepper\n1 scallion, sliced\nFried shallots and lime",
      id: "150 g mie pipih\n80 g kikil sapi, rebus\n50 g tauge\n600 ml kaldu sapi\n2 siung bawang putih\n1 sdt lada bubuk\n1 batang daun bawang\nBawang goreng dan jeruk nipis"
    },
    steps: {
      en: "1. Simmer the beef tendon until very tender, then slice.\n2. Saute garlic and add to the beef broth.\n3. Season the broth with pepper and salt.\n4. Blanch the noodles and bean sprouts.\n5. Place noodles and tendon in a bowl.\n6. Pour over hot broth and top with scallion, shallots and lime.",
      id: "1. Rebus kikil sampai sangat empuk, lalu iris.\n2. Tumis bawang putih dan masukkan ke kaldu sapi.\n3. Bumbui kaldu dengan lada dan garam.\n4. Seduh mie dan tauge.\n5. Letakkan mie dan kikil di mangkuk.\n6. Siram kaldu panas dan beri daun bawang, bawang goreng dan jeruk."
    } },
  { id: "idn-a-20", emoji: "🍜", tint: "#2F6BFF", kcal: 520, p: 22, c: 64, f: 18, types: ["normal", "halal"], q: "noodle", cat: "Noodle",
    nm: { en: "Kwetiau Siram (Flat Noodles in Gravy)", id: "Kwetiau Siram" },
    ing: {
      en: "200 g flat rice noodles\n80 g chicken, sliced\n50 g shrimp, peeled\n1 baby bok choy\n2 cloves garlic\n1 tbsp oyster-style sauce\n1 tsp cornstarch\n300 ml chicken broth",
      id: "200 g kwetiau\n80 g ayam, iris\n50 g udang kupas\n1 buah sawi hijau\n2 siung bawang putih\n1 sdm saus tiram\n1 sdt maizena\n300 ml kaldu ayam"
    },
    steps: {
      en: "1. Pan-fry the flat noodles briefly, then set aside on a plate.\n2. Saute garlic, then add chicken and shrimp.\n3. Pour in the broth and oyster-style sauce.\n4. Add bok choy and bring to a simmer.\n5. Stir in cornstarch slurry until the gravy thickens.\n6. Pour the gravy over the noodles and serve.",
      id: "1. Tumis kwetiau sebentar, lalu tata di piring.\n2. Tumis bawang putih, masukkan ayam dan udang.\n3. Tuang kaldu dan saus tiram.\n4. Masukkan sawi dan didihkan.\n5. Tambahkan larutan maizena sampai kuah mengental.\n6. Siramkan kuah ke kwetiau dan sajikan."
    } },
    { id: "idn-b-01", emoji: "🍜", tint: "#C87000", kcal: 340, p: 28, c: 30, f: 11, types: ["normal", "high-protein", "halal"], q: "chicken", cat: "Chicken",
    nm: { en: "Soto Ayam Lamongan (Lamongan Chicken Soup)", id: "Soto Ayam Lamongan" },
    ing: {
      en: "150 g chicken breast\n700 ml chicken broth\n1 handful glass noodles\n1 hard-boiled egg\n2 cloves garlic\n3 shallots\n1 tsp turmeric\nKoya (fried garlic and cracker powder), lime, celery",
      id: "150 g dada ayam\n700 ml kaldu ayam\n1 genggam soun\n1 telur rebus\n2 siung bawang putih\n3 butir bawang merah\n1 sdt kunyit\nKoya, jeruk nipis, seledri"
    },
    steps: {
      en: "1. Boil the chicken until tender, then shred.\n2. Saute ground garlic, shallots and turmeric until fragrant.\n3. Pour the spice paste into the broth and simmer.\n4. Soak the glass noodles in hot water until soft.\n5. Arrange chicken, noodles and egg in a bowl.\n6. Ladle the hot broth over and top with koya and celery.\n7. Serve with lime on the side.",
      id: "1. Rebus ayam sampai empuk, lalu suwir.\n2. Tumis bawang putih, bawang merah dan kunyit halus sampai harum.\n3. Tuang bumbu ke kaldu dan didihkan.\n4. Rendam soun di air panas sampai lunak.\n5. Tata ayam, soun dan telur di mangkuk.\n6. Siram kuah panas lalu taburi koya dan seledri.\n7. Sajikan dengan jeruk nipis."
    } },
  { id: "idn-b-02", emoji: "🥣", tint: "#C87000", kcal: 380, p: 30, c: 34, f: 12, types: ["normal", "high-protein", "halal"], q: "beef", cat: "Beef",
    nm: { en: "Soto Betawi (Jakarta Beef Soup)", id: "Soto Betawi" },
    ing: {
      en: "120 g lean beef, cubed\n300 ml light coconut milk broth\n1 potato, diced\n1 tomato\n2 cloves garlic\n2 shallots\nLime, scallion, fried shallots\nSalt and pepper",
      id: "120 g daging sapi tanpa lemak, potong dadu\n300 ml kuah santan encer\n1 kentang, potong dadu\n1 tomat\n2 siung bawang putih\n2 butir bawang merah\nJeruk nipis, daun bawang, bawang goreng\nGaram dan merica"
    },
    steps: {
      en: "1. Boil the beef until tender, then cube.\n2. Saute ground garlic and shallots until fragrant.\n3. Add the spice paste to the broth with light coconut milk.\n4. Add potato and tomato, simmer until soft.\n5. Return the beef and season to taste.\n6. Serve hot with lime, scallion and fried shallots.",
      id: "1. Rebus daging sapi sampai empuk, lalu potong dadu.\n2. Tumis bawang putih dan bawang merah halus sampai harum.\n3. Masukkan bumbu ke kuah dengan santan encer.\n4. Tambahkan kentang dan tomat, masak sampai empuk.\n5. Kembalikan daging, bumbui secukupnya.\n6. Sajikan panas dengan jeruk nipis, daun bawang, bawang goreng."
    } },
  { id: "idn-b-03", emoji: "🍲", tint: "#C87000", kcal: 360, p: 29, c: 22, f: 16, types: ["normal", "high-protein", "halal"], q: "beef", cat: "Beef",
    nm: { en: "Soto Madura (Madura Beef Soup)", id: "Soto Madura" },
    ing: {
      en: "130 g beef shank\n700 ml beef broth\n1 hard-boiled egg\n3 shallots\n2 cloves garlic\n1 tsp ground ginger\n1 stalk lemongrass\nLime, celery, fried shallots",
      id: "130 g sandung lamur sapi\n700 ml kaldu sapi\n1 telur rebus\n3 butir bawang merah\n2 siung bawang putih\n1 sdt jahe halus\n1 batang serai\nJeruk nipis, seledri, bawang goreng"
    },
    steps: {
      en: "1. Simmer the beef shank until tender, then slice.\n2. Saute ground shallots, garlic and ginger until fragrant.\n3. Add lemongrass and pour in the broth.\n4. Simmer gently for ten minutes.\n5. Place the beef and egg in a bowl.\n6. Ladle the broth over and finish with lime and celery.",
      id: "1. Rebus sandung lamur sampai empuk, lalu iris.\n2. Tumis bawang merah, bawang putih dan jahe halus sampai harum.\n3. Masukkan serai lalu tuang kaldu.\n4. Masak perlahan sepuluh menit.\n5. Letakkan daging dan telur di mangkuk.\n6. Siram kuah lalu beri jeruk nipis dan seledri."
    } },
  { id: "idn-b-04", emoji: "🍜", tint: "#C87000", kcal: 350, p: 27, c: 32, f: 12, types: ["normal", "high-protein", "halal"], q: "chicken", cat: "Chicken",
    nm: { en: "Soto Banjar (Banjar Chicken Soup)", id: "Soto Banjar" },
    ing: {
      en: "150 g chicken breast\n700 ml chicken broth\n1 handful glass noodles\n1 hard-boiled egg\n2 cloves garlic\n3 shallots\n1 pinch cinnamon and clove\nPerkedel, lime, scallion",
      id: "150 g dada ayam\n700 ml kaldu ayam\n1 genggam soun\n1 telur rebus\n2 siung bawang putih\n3 butir bawang merah\n1 sejumput kayu manis dan cengkeh\nPerkedel, jeruk nipis, daun bawang"
    },
    steps: {
      en: "1. Boil the chicken until tender, then shred.\n2. Saute ground garlic and shallots with cinnamon and clove.\n3. Pour the spice paste into the broth and simmer.\n4. Soften the glass noodles in hot water.\n5. Arrange chicken, noodles, egg and perkedel in a bowl.\n6. Ladle the fragrant broth over the top.\n7. Serve with lime and scallion.",
      id: "1. Rebus ayam sampai empuk, lalu suwir.\n2. Tumis bawang putih dan bawang merah halus dengan kayu manis dan cengkeh.\n3. Tuang bumbu ke kaldu dan didihkan.\n4. Lunakkan soun di air panas.\n5. Tata ayam, soun, telur dan perkedel di mangkuk.\n6. Siram kuah harum ke atasnya.\n7. Sajikan dengan jeruk nipis dan daun bawang."
    } },
  { id: "idn-b-05", emoji: "🥩", tint: "#C87000", kcal: 400, p: 30, c: 25, f: 20, types: ["normal", "high-protein", "halal"], q: "beef", cat: "Beef",
    nm: { en: "Rawon (East Java Black Beef Soup)", id: "Rawon" },
    ing: {
      en: "130 g beef chuck, cubed\n700 ml beef broth\n3 keluak nuts\n3 shallots\n2 cloves garlic\n2 candlenuts\n1 stalk lemongrass\nBean sprouts, lime, salted egg",
      id: "130 g daging sapi sengkel, potong dadu\n700 ml kaldu sapi\n3 buah kluwek\n3 butir bawang merah\n2 siung bawang putih\n2 butir kemiri\n1 batang serai\nTauge pendek, jeruk nipis, telur asin"
    },
    steps: {
      en: "1. Boil the beef until tender, then cube.\n2. Grind keluak, shallots, garlic and candlenut into a paste.\n3. Saute the paste with lemongrass until dark and fragrant.\n4. Pour in the broth and add the beef.\n5. Simmer until the broth turns rich and black.\n6. Serve with bean sprouts, lime and salted egg.",
      id: "1. Rebus daging sampai empuk, lalu potong dadu.\n2. Haluskan kluwek, bawang merah, bawang putih dan kemiri.\n3. Tumis bumbu dengan serai sampai gelap dan harum.\n4. Tuang kaldu dan masukkan daging.\n5. Masak sampai kuah pekat dan hitam.\n6. Sajikan dengan tauge, jeruk nipis dan telur asin."
    } },
  { id: "idn-b-06", emoji: "🍲", tint: "#2F6BFF", kcal: 280, p: 26, c: 18, f: 10, types: ["normal", "high-protein", "low-carb", "halal"], q: "chicken", cat: "Chicken",
    nm: { en: "Sop Ayam Klaten (Clear Chicken Soup)", id: "Sop Ayam" },
    ing: {
      en: "150 g chicken breast\n700 ml chicken broth\n1 carrot, sliced\n1 potato, cubed\n2 cloves garlic\n2 shallots\n1 stalk celery\nScallion, fried shallots, pepper",
      id: "150 g dada ayam\n700 ml kaldu ayam\n1 wortel, iris\n1 kentang, potong dadu\n2 siung bawang putih\n2 butir bawang merah\n1 batang seledri\nDaun bawang, bawang goreng, merica"
    },
    steps: {
      en: "1. Boil the chicken until tender, then cut into pieces.\n2. Crush the garlic and shallots and saute lightly.\n3. Add the aromatics to the broth.\n4. Put in carrot and potato, simmer until soft.\n5. Season with pepper and salt.\n6. Finish with celery, scallion and fried shallots.",
      id: "1. Rebus ayam sampai empuk, lalu potong-potong.\n2. Geprek bawang putih dan bawang merah lalu tumis sebentar.\n3. Masukkan bumbu ke kaldu.\n4. Tambahkan wortel dan kentang, masak sampai empuk.\n5. Bumbui merica dan garam.\n6. Akhiri dengan seledri, daun bawang dan bawang goreng."
    } },
  { id: "idn-b-07", emoji: "🥩", tint: "#2F6BFF", kcal: 420, p: 32, c: 20, f: 24, types: ["normal", "high-protein", "halal"], q: "beef", cat: "Beef",
    nm: { en: "Sop Buntut (Oxtail Soup)", id: "Sop Buntut" },
    ing: {
      en: "180 g oxtail\n700 ml beef broth\n1 carrot, chunked\n1 potato, chunked\n2 cloves garlic\n2 shallots\n1 pinch nutmeg\nTomato, scallion, fried shallots",
      id: "180 g buntut sapi\n700 ml kaldu sapi\n1 wortel, potong\n1 kentang, potong\n2 siung bawang putih\n2 butir bawang merah\n1 sejumput pala\nTomat, daun bawang, bawang goreng"
    },
    steps: {
      en: "1. Boil the oxtail until very tender.\n2. Saute crushed garlic and shallots until fragrant.\n3. Add the aromatics and nutmeg to the broth.\n4. Add carrot and potato, simmer until soft.\n5. Return the oxtail and season to taste.\n6. Serve with tomato, scallion and fried shallots.",
      id: "1. Rebus buntut sapi sampai sangat empuk.\n2. Tumis bawang putih dan bawang merah geprek sampai harum.\n3. Masukkan bumbu dan pala ke kaldu.\n4. Tambahkan wortel dan kentang, masak sampai empuk.\n5. Kembalikan buntut dan bumbui secukupnya.\n6. Sajikan dengan tomat, daun bawang dan bawang goreng."
    } },
  { id: "idn-b-08", emoji: "🥬", tint: "#2A7A4F", kcal: 260, p: 8, c: 40, f: 6, types: ["normal", "vegetarian", "vegan", "halal"], q: "vegetable", cat: "Vegetarian",
    nm: { en: "Sayur Asem (Tamarind Vegetable Soup)", id: "Sayur Asem" },
    ing: {
      en: "700 ml water\n1 corn cob, cut\n1 handful long beans\n1 chayote, cubed\n1 handful melinjo leaves\n2 tbsp peanuts\n2 tbsp tamarind\n3 shallots and 2 cloves garlic\nPalm sugar and salt",
      id: "700 ml air\n1 jagung, potong\n1 genggam kacang panjang\n1 labu siam, potong dadu\n1 genggam daun melinjo\n2 sdm kacang tanah\n2 sdm asam jawa\n3 bawang merah dan 2 bawang putih\nGula merah dan garam"
    },
    steps: {
      en: "1. Grind the shallots and garlic into a paste.\n2. Bring the water to a boil with the spice paste.\n3. Add corn and peanuts, simmer until half done.\n4. Add chayote and long beans.\n5. Stir in tamarind, palm sugar and salt.\n6. Add melinjo leaves last and cook briefly.\n7. Serve warm.",
      id: "1. Haluskan bawang merah dan bawang putih.\n2. Didihkan air bersama bumbu halus.\n3. Masukkan jagung dan kacang tanah, masak setengah matang.\n4. Tambahkan labu siam dan kacang panjang.\n5. Bumbui asam jawa, gula merah dan garam.\n6. Masukkan daun melinjo terakhir dan masak sebentar.\n7. Sajikan hangat."
    } },
  { id: "idn-b-09", emoji: "🥗", tint: "#2A7A4F", kcal: 300, p: 9, c: 28, f: 16, types: ["normal", "vegetarian", "vegan", "halal"], q: "vegetable", cat: "Vegetarian",
    nm: { en: "Sayur Lodeh (Coconut Vegetable Stew)", id: "Sayur Lodeh" },
    ing: {
      en: "400 ml light coconut milk\n1 eggplant, cubed\n1 handful long beans\n100 g young jackfruit\n50 g tofu, cubed\n3 shallots and 2 cloves garlic\n2 red chilies\n1 bay leaf and galangal\nSalt",
      id: "400 ml santan encer\n1 terong, potong dadu\n1 genggam kacang panjang\n100 g nangka muda\n50 g tahu, potong dadu\n3 bawang merah dan 2 bawang putih\n2 cabai merah\n1 daun salam dan lengkuas\nGaram"
    },
    steps: {
      en: "1. Grind shallots, garlic and chilies into a paste.\n2. Saute the paste with bay leaf and galangal.\n3. Pour in the light coconut milk.\n4. Add jackfruit and simmer until tender.\n5. Add eggplant, long beans and tofu.\n6. Season with salt and cook until all is soft.\n7. Serve warm.",
      id: "1. Haluskan bawang merah, bawang putih dan cabai.\n2. Tumis bumbu dengan daun salam dan lengkuas.\n3. Tuang santan encer.\n4. Masukkan nangka muda dan masak sampai empuk.\n5. Tambahkan terong, kacang panjang dan tahu.\n6. Bumbui garam dan masak sampai semua lunak.\n7. Sajikan hangat."
    } },
  { id: "idn-b-10", emoji: "🥬", tint: "#2A7A4F", kcal: 250, p: 9, c: 35, f: 4, types: ["normal", "vegetarian", "vegan", "halal"], q: "vegetable", cat: "Vegetarian",
    nm: { en: "Sayur Bening Bayam (Clear Spinach Soup)", id: "Sayur Bening Bayam" },
    ing: {
      en: "700 ml water\n1 bunch spinach\n1 corn cob, sliced\n1 chayote, cubed\n3 shallots, sliced\n2 slices ginger and galangal\n1 tsp palm sugar\nSalt",
      id: "700 ml air\n1 ikat bayam\n1 jagung, iris\n1 labu siam, potong dadu\n3 bawang merah, iris\n2 iris jahe dan lengkuas\n1 sdt gula merah\nGaram"
    },
    steps: {
      en: "1. Boil the water with sliced shallots, ginger and galangal.\n2. Add corn and chayote, simmer until half done.\n3. Season with palm sugar and salt.\n4. Add the spinach and cook briefly.\n5. Turn off the heat while the spinach is still bright green.\n6. Serve warm right away.",
      id: "1. Didihkan air dengan bawang merah iris, jahe dan lengkuas.\n2. Masukkan jagung dan labu siam, masak setengah matang.\n3. Bumbui gula merah dan garam.\n4. Tambahkan bayam dan masak sebentar.\n5. Matikan api saat bayam masih hijau segar.\n6. Sajikan hangat segera."
    } },
  { id: "idn-b-11", emoji: "🍲", tint: "#C41101", kcal: 380, p: 26, c: 40, f: 12, types: ["normal", "high-protein", "halal"], q: "beef", cat: "Beef",
    nm: { en: "Bakso (Beef Meatball Soup)", id: "Bakso" },
    ing: {
      en: "150 g beef meatballs\n700 ml beef broth\n1 handful yellow noodles\n1 handful glass noodles\n2 cloves garlic\n1 stalk bok choy\nScallion, celery, fried shallots\nPepper and salt",
      id: "150 g bakso sapi\n700 ml kaldu sapi\n1 genggam mi kuning\n1 genggam soun\n2 siung bawang putih\n1 batang sawi\nDaun bawang, seledri, bawang goreng\nMerica dan garam"
    },
    steps: {
      en: "1. Saute the crushed garlic until golden.\n2. Add it to the broth and bring to a boil.\n3. Drop in the meatballs and heat through.\n4. Blanch the noodles and bok choy.\n5. Arrange noodles and meatballs in a bowl.\n6. Ladle the hot broth over the top.\n7. Finish with scallion, celery and fried shallots.",
      id: "1. Tumis bawang putih geprek sampai kuning.\n2. Masukkan ke kaldu dan didihkan.\n3. Masukkan bakso dan panaskan sampai mengapung.\n4. Rebus sebentar mi dan sawi.\n5. Tata mi dan bakso di mangkuk.\n6. Siram kuah panas ke atasnya.\n7. Akhiri dengan daun bawang, seledri dan bawang goreng."
    } },
  { id: "idn-b-12", emoji: "🍗", tint: "#C41101", kcal: 420, p: 30, c: 18, f: 24, types: ["normal", "high-protein", "low-carb", "halal"], q: "chicken", cat: "Chicken",
    nm: { en: "Gulai Ayam (Light Chicken Curry Stew)", id: "Gulai Ayam" },
    ing: {
      en: "160 g chicken thigh\n350 ml light coconut milk\n4 shallots and 3 cloves garlic\n2 candlenuts\n1 tsp turmeric and coriander\n1 stalk lemongrass\n2 kaffir lime leaves\nSalt",
      id: "160 g paha ayam\n350 ml santan encer\n4 bawang merah dan 3 bawang putih\n2 kemiri\n1 sdt kunyit dan ketumbar\n1 batang serai\n2 daun jeruk\nGaram"
    },
    steps: {
      en: "1. Grind shallots, garlic, candlenut, turmeric and coriander.\n2. Saute the paste with lemongrass and lime leaves.\n3. Add the chicken and coat with the spices.\n4. Pour in the light coconut milk.\n5. Simmer gently until the chicken is tender.\n6. Season with salt and serve warm.",
      id: "1. Haluskan bawang merah, bawang putih, kemiri, kunyit dan ketumbar.\n2. Tumis bumbu dengan serai dan daun jeruk.\n3. Masukkan ayam dan lumuri bumbu.\n4. Tuang santan encer.\n5. Masak perlahan sampai ayam empuk.\n6. Bumbui garam dan sajikan hangat."
    } },
  { id: "idn-b-13", emoji: "🍲", tint: "#C41101", kcal: 440, p: 30, c: 20, f: 26, types: ["normal", "high-protein", "halal"], q: "beef", cat: "Beef",
    nm: { en: "Tongseng (Spiced Beef and Cabbage Stew)", id: "Tongseng" },
    ing: {
      en: "150 g beef, sliced\n300 ml light coconut milk\n2 handfuls cabbage\n1 tomato, wedged\n4 shallots and 3 cloves garlic\n2 red chilies\n1 tsp sweet soy sauce\nLemongrass and salt",
      id: "150 g daging sapi, iris\n300 ml santan encer\n2 genggam kol\n1 tomat, potong\n4 bawang merah dan 3 bawang putih\n2 cabai merah\n1 sdt kecap manis\nSerai dan garam"
    },
    steps: {
      en: "1. Grind shallots, garlic and chilies into a paste.\n2. Saute the paste with lemongrass until fragrant.\n3. Add the sliced beef and stir until it changes color.\n4. Pour in the light coconut milk and sweet soy sauce.\n5. Add cabbage and tomato near the end.\n6. Season with salt and simmer briefly.\n7. Serve hot.",
      id: "1. Haluskan bawang merah, bawang putih dan cabai.\n2. Tumis bumbu dengan serai sampai harum.\n3. Masukkan irisan daging dan aduk sampai berubah warna.\n4. Tuang santan encer dan kecap manis.\n5. Tambahkan kol dan tomat menjelang akhir.\n6. Bumbui garam dan masak sebentar.\n7. Sajikan panas."
    } },
  { id: "idn-b-14", emoji: "🥩", tint: "#C87000", kcal: 400, p: 32, c: 18, f: 22, types: ["normal", "high-protein", "low-carb", "halal"], q: "beef", cat: "Beef",
    nm: { en: "Coto Makassar (Makassar Beef Soup)", id: "Coto Makassar" },
    ing: {
      en: "150 g beef and offal, cubed\n700 ml beef broth\n3 tbsp ground roasted peanuts\n5 shallots and 3 cloves garlic\n2 candlenuts\n1 tsp cumin and coriander\nGalangal and lemongrass\nLime and scallion",
      id: "150 g daging dan jeroan, potong dadu\n700 ml kaldu sapi\n3 sdm kacang sangrai halus\n5 bawang merah dan 3 bawang putih\n2 kemiri\n1 sdt jinten dan ketumbar\nLengkuas dan serai\nJeruk nipis dan daun bawang"
    },
    steps: {
      en: "1. Boil the beef and offal until tender, then cube.\n2. Grind shallots, garlic, candlenut and spices.\n3. Saute the paste with galangal and lemongrass.\n4. Add the paste and ground peanuts to the broth.\n5. Return the beef and simmer until rich.\n6. Serve with lime and scallion.",
      id: "1. Rebus daging dan jeroan sampai empuk, lalu potong dadu.\n2. Haluskan bawang merah, bawang putih, kemiri dan rempah.\n3. Tumis bumbu dengan lengkuas dan serai.\n4. Masukkan bumbu dan kacang halus ke kaldu.\n5. Kembalikan daging dan masak sampai gurih.\n6. Sajikan dengan jeruk nipis dan daun bawang."
    } },
  { id: "idn-b-15", emoji: "🍗", tint: "#C87000", kcal: 360, p: 28, c: 28, f: 14, types: ["normal", "high-protein", "halal"], q: "chicken", cat: "Chicken",
    nm: { en: "Semur Ayam (Chicken in Sweet Soy Stew)", id: "Semur Ayam" },
    ing: {
      en: "160 g chicken pieces\n300 ml water\n1 potato, cubed\n3 tbsp sweet soy sauce\n4 shallots and 3 cloves garlic\n1 pinch nutmeg and clove\n1 tomato\nSalt and pepper",
      id: "160 g potongan ayam\n300 ml air\n1 kentang, potong dadu\n3 sdm kecap manis\n4 bawang merah dan 3 bawang putih\n1 sejumput pala dan cengkeh\n1 tomat\nGaram dan merica"
    },
    steps: {
      en: "1. Grind the shallots and garlic into a paste.\n2. Saute the paste with nutmeg and clove.\n3. Add the chicken and brown lightly.\n4. Pour in water and sweet soy sauce.\n5. Add potato and tomato, simmer until tender.\n6. Season with salt and pepper.\n7. Serve warm.",
      id: "1. Haluskan bawang merah dan bawang putih.\n2. Tumis bumbu dengan pala dan cengkeh.\n3. Masukkan ayam dan tumis sampai kecokelatan.\n4. Tuang air dan kecap manis.\n5. Tambahkan kentang dan tomat, masak sampai empuk.\n6. Bumbui garam dan merica.\n7. Sajikan hangat."
    } },
  { id: "idn-b-16", emoji: "🍗", tint: "#C87000", kcal: 430, p: 30, c: 18, f: 26, types: ["normal", "high-protein", "low-carb", "halal"], q: "chicken", cat: "Chicken",
    nm: { en: "Opor Ayam (Chicken in Coconut Stew)", id: "Opor Ayam" },
    ing: {
      en: "160 g chicken pieces\n350 ml light coconut milk\n5 shallots and 3 cloves garlic\n2 candlenuts\n1 tsp coriander\n1 stalk lemongrass\n2 kaffir lime leaves\nGalangal and salt",
      id: "160 g potongan ayam\n350 ml santan encer\n5 bawang merah dan 3 bawang putih\n2 kemiri\n1 sdt ketumbar\n1 batang serai\n2 daun jeruk\nLengkuas dan garam"
    },
    steps: {
      en: "1. Grind shallots, garlic, candlenut and coriander.\n2. Saute the paste with lemongrass, lime leaves and galangal.\n3. Add the chicken and coat with the spices.\n4. Pour in the light coconut milk slowly.\n5. Simmer gently while stirring until tender.\n6. Season with salt and serve warm.",
      id: "1. Haluskan bawang merah, bawang putih, kemiri dan ketumbar.\n2. Tumis bumbu dengan serai, daun jeruk dan lengkuas.\n3. Masukkan ayam dan lumuri bumbu.\n4. Tuang santan encer perlahan.\n5. Masak perlahan sambil diaduk sampai empuk.\n6. Bumbui garam dan sajikan hangat."
    } },
  { id: "idn-b-17", emoji: "🥩", tint: "#C41101", kcal: 410, p: 30, c: 22, f: 22, types: ["normal", "high-protein", "halal"], q: "beef", cat: "Beef",
    nm: { en: "Empal Gentong (Cirebon Beef Coconut Soup)", id: "Empal Gentong" },
    ing: {
      en: "150 g beef and tripe, cubed\n350 ml light coconut milk\n5 shallots and 3 cloves garlic\n2 candlenuts\n1 tsp turmeric and coriander\n1 stalk lemongrass\nKucai chives and fried shallots\nSalt",
      id: "150 g daging dan babat, potong dadu\n350 ml santan encer\n5 bawang merah dan 3 bawang putih\n2 kemiri\n1 sdt kunyit dan ketumbar\n1 batang serai\nKucai dan bawang goreng\nGaram"
    },
    steps: {
      en: "1. Boil the beef and tripe until tender, then cube.\n2. Grind shallots, garlic, candlenut and spices.\n3. Saute the paste with lemongrass until fragrant.\n4. Add the light coconut milk and the meat.\n5. Simmer gently until the broth is rich.\n6. Serve with kucai chives and fried shallots.",
      id: "1. Rebus daging dan babat sampai empuk, lalu potong dadu.\n2. Haluskan bawang merah, bawang putih, kemiri dan rempah.\n3. Tumis bumbu dengan serai sampai harum.\n4. Masukkan santan encer dan daging.\n5. Masak perlahan sampai kuah gurih.\n6. Sajikan dengan kucai dan bawang goreng."
    } },
  { id: "idn-b-18", emoji: "🐟", tint: "#2F6BFF", kcal: 320, p: 24, c: 38, f: 6, types: ["pescatarian", "high-protein", "halal"], q: "fish", cat: "Fish",
    nm: { en: "Tekwan (Palembang Fish Dumpling Soup)", id: "Tekwan" },
    ing: {
      en: "120 g fish and tapioca dumplings\n700 ml prawn broth\n1 handful glass noodles\n50 g jicama, sliced\n2 cloves garlic\n1 handful wood ear mushroom\nScallion, celery, fried shallots\nPepper and salt",
      id: "120 g adonan ikan dan tapioka\n700 ml kaldu udang\n1 genggam soun\n50 g bengkuang, iris\n2 siung bawang putih\n1 genggam jamur kuping\nDaun bawang, seledri, bawang goreng\nMerica dan garam"
    },
    steps: {
      en: "1. Shape the fish and tapioca dough into small dumplings.\n2. Boil the dumplings until they float, then set aside.\n3. Saute crushed garlic and add to the prawn broth.\n4. Add jicama and wood ear mushroom, simmer briefly.\n5. Return the dumplings and soften the glass noodles.\n6. Season with pepper and salt.\n7. Serve with scallion, celery and fried shallots.",
      id: "1. Bentuk adonan ikan dan tapioka jadi bulatan kecil.\n2. Rebus tekwan sampai mengapung, lalu sisihkan.\n3. Tumis bawang putih geprek dan masukkan ke kaldu udang.\n4. Tambahkan bengkuang dan jamur kuping, masak sebentar.\n5. Kembalikan tekwan dan lunakkan soun.\n6. Bumbui merica dan garam.\n7. Sajikan dengan daun bawang, seledri dan bawang goreng."
    } },
  { id: "idn-b-19", emoji: "🍲", tint: "#2F6BFF", kcal: 400, p: 30, c: 20, f: 22, types: ["normal", "high-protein", "halal"], q: "beef", cat: "Beef",
    nm: { en: "Sup Iga (Light Beef Rib Soup)", id: "Sup Iga" },
    ing: {
      en: "180 g beef short ribs\n700 ml beef broth\n1 carrot, chunked\n1 potato, chunked\n2 cloves garlic\n2 shallots\n1 pinch nutmeg and clove\nTomato, scallion, fried shallots",
      id: "180 g iga sapi\n700 ml kaldu sapi\n1 wortel, potong\n1 kentang, potong\n2 siung bawang putih\n2 butir bawang merah\n1 sejumput pala dan cengkeh\nTomat, daun bawang, bawang goreng"
    },
    steps: {
      en: "1. Simmer the ribs until the meat is very tender.\n2. Saute crushed garlic and shallots until fragrant.\n3. Add the aromatics, nutmeg and clove to the broth.\n4. Add carrot and potato, simmer until soft.\n5. Season with salt and pepper.\n6. Serve with tomato, scallion and fried shallots.",
      id: "1. Rebus iga sampai dagingnya sangat empuk.\n2. Tumis bawang putih dan bawang merah geprek sampai harum.\n3. Masukkan bumbu, pala dan cengkeh ke kaldu.\n4. Tambahkan wortel dan kentang, masak sampai empuk.\n5. Bumbui garam dan merica.\n6. Sajikan dengan tomat, daun bawang dan bawang goreng."
    } },
  { id: "idn-b-20", emoji: "🐟", tint: "#C41101", kcal: 360, p: 30, c: 14, f: 20, types: ["pescatarian", "high-protein", "low-carb", "halal"], q: "fish", cat: "Fish",
    nm: { en: "Gulai Ikan (Light Fish Curry Stew)", id: "Gulai Ikan" },
    ing: {
      en: "160 g firm white fish\n350 ml light coconut milk\n5 shallots and 3 cloves garlic\n1 tsp turmeric and coriander\n2 red chilies\n1 stalk lemongrass\n2 kaffir lime leaves\nTamarind and salt",
      id: "160 g ikan berdaging padat\n350 ml santan encer\n5 bawang merah dan 3 bawang putih\n1 sdt kunyit dan ketumbar\n2 cabai merah\n1 batang serai\n2 daun jeruk\nAsam jawa dan garam"
    },
    steps: {
      en: "1. Grind shallots, garlic, turmeric, coriander and chilies.\n2. Saute the paste with lemongrass and lime leaves.\n3. Pour in the light coconut milk and bring to a gentle simmer.\n4. Slide in the fish pieces carefully.\n5. Add tamarind and season with salt.\n6. Simmer until the fish is just cooked.\n7. Serve warm.",
      id: "1. Haluskan bawang merah, bawang putih, kunyit, ketumbar dan cabai.\n2. Tumis bumbu dengan serai dan daun jeruk.\n3. Tuang santan encer dan masak perlahan.\n4. Masukkan potongan ikan dengan hati-hati.\n5. Tambahkan asam jawa dan bumbui garam.\n6. Masak sampai ikan matang.\n7. Sajikan hangat."
    } },
    { id: "idn-c-01", emoji: "🍗", tint: "#C41101", kcal: 320, p: 30, c: 12, f: 16, types: ["normal", "high-protein", "halal"], q: "chicken", cat: "Chicken",
    nm: { en: "Ayam Bakar (Grilled Sweet Soy Chicken)", id: "Ayam Bakar Kecap" },
    ing: {
      en: "200 g chicken leg, skin removed\n2 tbsp sweet soy sauce\n2 cloves garlic\n1 tsp grated ginger\n1 tsp coriander powder\n1 tbsp lime juice\nSalt and pepper\nSteamed rice to serve",
      id: "200 g paha ayam, buang kulit\n2 sdm kecap manis\n2 siung bawang putih\n1 sdt jahe parut\n1 sdt ketumbar bubuk\n1 sdm air jeruk nipis\nGaram dan lada\nNasi putih untuk sajian"
    },
    steps: {
      en: "1. Boil chicken briefly with garlic, ginger and coriander until half cooked.\n2. Mix sweet soy sauce, lime juice, salt and pepper.\n3. Coat the chicken with the sauce.\n4. Grill over medium heat, turning and basting, until browned.\n5. Cook until juices run clear and edges are charred.\n6. Rest a few minutes and serve with rice.",
      id: "1. Rebus sebentar ayam dengan bawang putih, jahe, ketumbar sampai setengah matang.\n2. Campur kecap manis, air jeruk nipis, garam, lada.\n3. Lumuri ayam dengan bumbu.\n4. Bakar api sedang sambil dibalik dan diolesi sampai kecokelatan.\n5. Masak sampai matang dan tepi sedikit gosong.\n6. Diamkan sebentar lalu sajikan dengan nasi."
    } },
  { id: "idn-c-02", emoji: "🍖", tint: "#C87000", kcal: 340, p: 31, c: 8, f: 19, types: ["normal", "high-protein", "halal"], q: "chicken", cat: "Chicken",
    nm: { en: "Ayam Goreng Lengkuas (Galangal Fried Chicken, lighter)", id: "Ayam Goreng Lengkuas" },
    ing: {
      en: "200 g chicken, cut into pieces\n3 tbsp grated galangal\n3 cloves garlic\n1 tsp turmeric powder\n2 bay leaves\n1 tsp salt\n1 tbsp oil for pan frying\nLime wedges",
      id: "200 g ayam, potong-potong\n3 sdm lengkuas parut\n3 siung bawang putih\n1 sdt kunyit bubuk\n2 lembar daun salam\n1 sdt garam\n1 sdm minyak untuk menggoreng\nJeruk nipis"
    },
    steps: {
      en: "1. Blend garlic, turmeric and salt into a paste.\n2. Simmer chicken with the paste, galangal and bay leaves until tender.\n3. Keep cooking until the liquid dries and galangal turns crumbly.\n4. Pan fry in a little oil until golden and crisp.\n5. Fry the galangal bits until fragrant.\n6. Serve chicken topped with crispy galangal and lime.",
      id: "1. Haluskan bawang putih, kunyit, garam jadi bumbu.\n2. Ungkep ayam dengan bumbu, lengkuas, daun salam sampai empuk.\n3. Lanjut masak sampai air surut dan lengkuas mengering.\n4. Goreng di sedikit minyak sampai kuning dan renyah.\n5. Goreng serundeng lengkuas sampai harum.\n6. Sajikan ayam dengan taburan lengkuas dan jeruk nipis."
    } },
  { id: "idn-c-03", emoji: "🐟", tint: "#2F6BFF", kcal: 280, p: 34, c: 6, f: 12, types: ["pescatarian", "high-protein", "low-carb", "halal"], q: "fish", cat: "Seafood",
    nm: { en: "Ikan Bakar (Grilled Spiced Fish)", id: "Ikan Bakar Bumbu" },
    ing: {
      en: "1 whole tilapia, cleaned and scored\n2 tbsp sweet soy sauce\n3 cloves garlic\n2 red chilies\n1 tsp grated ginger\n1 tbsp lime juice\n1 tsp salt\nBanana leaf or foil",
      id: "1 ekor ikan nila, bersihkan dan kerat\n2 sdm kecap manis\n3 siung bawang putih\n2 buah cabai merah\n1 sdt jahe parut\n1 sdm air jeruk nipis\n1 sdt garam\nDaun pisang atau aluminium foil"
    },
    steps: {
      en: "1. Blend garlic, chili, ginger and salt into a paste.\n2. Rub the paste inside and over the fish.\n3. Mix sweet soy sauce with lime juice for basting.\n4. Grill the fish on foil over medium heat.\n5. Turn once and baste with the soy mixture.\n6. Cook until the flesh flakes easily and edges char.\n7. Serve with extra lime.",
      id: "1. Haluskan bawang putih, cabai, jahe, garam jadi bumbu.\n2. Lumuri bumbu di dalam dan permukaan ikan.\n3. Campur kecap manis dan air jeruk nipis untuk olesan.\n4. Bakar ikan di atas foil api sedang.\n5. Balik sekali dan oles campuran kecap.\n6. Masak sampai daging mudah disuwir dan tepi gosong.\n7. Sajikan dengan jeruk nipis."
    } },
  { id: "idn-c-04", emoji: "🐠", tint: "#2A7A4F", kcal: 240, p: 28, c: 7, f: 11, types: ["pescatarian", "high-protein", "low-carb", "halal"], q: "fish", cat: "Seafood",
    nm: { en: "Pepes Ikan (Banana-Leaf Steamed Fish)", id: "Pepes Ikan" },
    ing: {
      en: "200 g fish fillet\n4 cloves garlic\n3 shallots\n2 red chilies\n1 tomato, sliced\n2 stalks lemongrass, bruised\n5 basil leaves\nBanana leaf and salt",
      id: "200 g fillet ikan\n4 siung bawang putih\n3 butir bawang merah\n2 buah cabai merah\n1 buah tomat, iris\n2 batang serai, memarkan\n5 lembar daun kemangi\nDaun pisang dan garam"
    },
    steps: {
      en: "1. Blend garlic, shallots and chili into a paste with salt.\n2. Coat the fish with the paste.\n3. Lay fish on banana leaf with tomato, lemongrass and basil.\n4. Wrap tightly and secure the ends.\n5. Steam for about 20 minutes.\n6. Optionally grill the parcel briefly for aroma.\n7. Serve warm in the leaf.",
      id: "1. Haluskan bawang putih, bawang merah, cabai, garam.\n2. Lumuri ikan dengan bumbu halus.\n3. Tata ikan di daun pisang dengan tomat, serai, kemangi.\n4. Bungkus rapat dan sematkan ujungnya.\n5. Kukus sekitar 20 menit.\n6. Bila suka, panggang sebentar agar harum.\n7. Sajikan hangat dalam daun."
    } },
  { id: "idn-c-05", emoji: "🍲", tint: "#2A7A4F", kcal: 200, p: 14, c: 10, f: 12, types: ["vegetarian", "vegan", "halal"], q: "tofu", cat: "Vegan",
    nm: { en: "Pepes Tahu (Steamed Spiced Tofu in Leaf)", id: "Pepes Tahu" },
    ing: {
      en: "200 g firm tofu, mashed\n3 shallots, sliced\n2 cloves garlic\n2 red chilies, sliced\n1 spring onion, chopped\n1 stalk lemongrass, bruised\n5 basil leaves\nBanana leaf and salt",
      id: "200 g tahu putih, haluskan\n3 butir bawang merah, iris\n2 siung bawang putih\n2 buah cabai merah, iris\n1 batang daun bawang, cincang\n1 batang serai, memarkan\n5 lembar daun kemangi\nDaun pisang dan garam"
    },
    steps: {
      en: "1. Mash the tofu until smooth.\n2. Grind garlic and salt, then mix into tofu with shallots and chili.\n3. Add spring onion and half the basil.\n4. Spoon onto banana leaf with lemongrass and remaining basil.\n5. Wrap firmly and secure the ends.\n6. Steam for about 25 minutes until set.\n7. Serve warm.",
      id: "1. Haluskan tahu sampai lembut.\n2. Ulek bawang putih dan garam, campurkan ke tahu dengan bawang merah dan cabai.\n3. Tambah daun bawang dan sebagian kemangi.\n4. Tuang ke daun pisang dengan serai dan sisa kemangi.\n5. Bungkus rapat dan sematkan ujungnya.\n6. Kukus sekitar 25 menit sampai padat.\n7. Sajikan hangat."
    } },
  { id: "idn-c-06", emoji: "🌶️", tint: "#C41101", kcal: 300, p: 27, c: 9, f: 17, types: ["pescatarian", "high-protein", "halal"], q: "fish", cat: "Seafood",
    nm: { en: "Pecel Lele (Catfish with Sambal, lighter)", id: "Pecel Lele" },
    ing: {
      en: "1 catfish, cleaned\n1 tsp turmeric powder\n2 cloves garlic\n1 tsp salt\n5 red chilies for sambal\n3 shallots\n1 tomato\n1 tbsp oil and lime juice",
      id: "1 ekor lele, bersihkan\n1 sdt kunyit bubuk\n2 siung bawang putih\n1 sdt garam\n5 buah cabai merah untuk sambal\n3 butir bawang merah\n1 buah tomat\n1 sdm minyak dan air jeruk nipis"
    },
    steps: {
      en: "1. Rub catfish with turmeric, garlic and salt.\n2. Pan fry in a little oil until golden on both sides.\n3. Boil chilies, shallots and tomato until soft.\n4. Grind them with salt into a rough sambal.\n5. Finish sambal with a splash of lime juice.\n6. Serve the catfish with sambal and fresh vegetables.",
      id: "1. Lumuri lele dengan kunyit, bawang putih, garam.\n2. Goreng di sedikit minyak sampai kuning kedua sisi.\n3. Rebus cabai, bawang merah, tomat sampai layu.\n4. Ulek kasar dengan garam jadi sambal.\n5. Beri perasan jeruk nipis pada sambal.\n6. Sajikan lele dengan sambal dan lalapan."
    } },
  { id: "idn-c-07", emoji: "🍢", tint: "#C41101", kcal: 310, p: 28, c: 12, f: 16, types: ["normal", "high-protein", "halal"], q: "chicken", cat: "Chicken",
    nm: { en: "Sate Ayam (Chicken Satay, peanut sauce)", id: "Sate Ayam Bumbu Kacang" },
    ing: {
      en: "200 g chicken thigh, cubed\n2 tbsp sweet soy sauce\n2 cloves garlic\nBamboo skewers\n4 tbsp peanut sauce\n1 tsp lime juice\n1 shallot, sliced\nCucumber slices",
      id: "200 g paha ayam, potong dadu\n2 sdm kecap manis\n2 siung bawang putih\nTusuk sate\n4 sdm bumbu kacang\n1 sdt air jeruk nipis\n1 butir bawang merah, iris\nIrisan timun"
    },
    steps: {
      en: "1. Marinate chicken with sweet soy and grated garlic 15 minutes.\n2. Thread onto soaked bamboo skewers.\n3. Grill over medium heat, turning often.\n4. Baste with a little sweet soy while grilling.\n5. Warm the peanut sauce and thin with water.\n6. Serve satay with peanut sauce, shallot and cucumber.",
      id: "1. Marinasi ayam dengan kecap dan bawang putih parut 15 menit.\n2. Tusuk ke tusuk bambu yang sudah direndam.\n3. Bakar api sedang sambil sering dibalik.\n4. Oles sedikit kecap manis saat membakar.\n5. Hangatkan bumbu kacang, encerkan dengan air.\n6. Sajikan sate dengan bumbu kacang, bawang merah, timun."
    } },
  { id: "idn-c-08", emoji: "🍛", tint: "#C87000", kcal: 260, p: 18, c: 22, f: 11, types: ["vegetarian", "vegan", "high-protein", "halal"], q: "tempeh", cat: "Vegan",
    nm: { en: "Tempe Bacem (Sweet Braised Tempeh)", id: "Tempe Bacem" },
    ing: {
      en: "200 g tempeh, sliced\n3 tbsp sweet soy sauce\n3 cloves garlic\n3 shallots\n1 tsp coriander\n2 bay leaves\n1 tsp tamarind\n200 ml coconut water",
      id: "200 g tempe, iris\n3 sdm kecap manis\n3 siung bawang putih\n3 butir bawang merah\n1 sdt ketumbar\n2 lembar daun salam\n1 sdt asam jawa\n200 ml air kelapa"
    },
    steps: {
      en: "1. Grind garlic, shallots and coriander into a paste.\n2. Simmer tempeh with the paste, sweet soy, tamarind and bay leaves in coconut water.\n3. Cook until the liquid is almost gone.\n4. Let the tempeh absorb the sweet sauce.\n5. Pan sear lightly in a nonstick pan until browned.\n6. Serve warm as a side.",
      id: "1. Haluskan bawang putih, bawang merah, ketumbar.\n2. Ungkep tempe dengan bumbu, kecap manis, asam jawa, daun salam di air kelapa.\n3. Masak sampai air hampir habis.\n4. Biarkan tempe menyerap bumbu manis.\n5. Panggang sebentar di wajan antilengket sampai kecokelatan.\n6. Sajikan hangat sebagai lauk."
    } },
  { id: "idn-c-09", emoji: "🧆", tint: "#C87000", kcal: 220, p: 15, c: 16, f: 12, types: ["vegetarian", "vegan", "high-protein", "halal"], q: "tofu", cat: "Vegan",
    nm: { en: "Tahu Bacem (Sweet Braised Tofu)", id: "Tahu Bacem" },
    ing: {
      en: "200 g firm tofu, halved\n3 tbsp sweet soy sauce\n3 cloves garlic\n3 shallots\n1 tsp coriander\n2 bay leaves\n1 tsp tamarind\n200 ml coconut water",
      id: "200 g tahu putih, belah dua\n3 sdm kecap manis\n3 siung bawang putih\n3 butir bawang merah\n1 sdt ketumbar\n2 lembar daun salam\n1 sdt asam jawa\n200 ml air kelapa"
    },
    steps: {
      en: "1. Grind garlic, shallots and coriander into a paste.\n2. Simmer tofu with the paste, sweet soy, tamarind and bay leaves in coconut water.\n3. Cook gently until the liquid reduces.\n4. Let the tofu soak up the sweet sauce.\n5. Sear lightly in a nonstick pan until golden.\n6. Serve warm with fresh chili.",
      id: "1. Haluskan bawang putih, bawang merah, ketumbar.\n2. Ungkep tahu dengan bumbu, kecap manis, asam jawa, daun salam di air kelapa.\n3. Masak perlahan sampai air menyusut.\n4. Biarkan tahu menyerap bumbu manis.\n5. Panggang sebentar di wajan antilengket sampai keemasan.\n6. Sajikan hangat dengan cabai rawit."
    } },
  { id: "idn-c-10", emoji: "🥘", tint: "#C87000", kcal: 280, p: 17, c: 24, f: 13, types: ["vegetarian", "vegan", "high-protein", "halal"], q: "tempeh", cat: "Vegan",
    nm: { en: "Tempe Orek (Sweet Crispy Tempeh Stir-Fry)", id: "Orek Tempe" },
    ing: {
      en: "200 g tempeh, cut into sticks\n3 tbsp sweet soy sauce\n3 cloves garlic\n3 shallots\n5 bird chilies\n2 bay leaves\n1 tbsp oil\n1 tsp tamarind water",
      id: "200 g tempe, potong korek\n3 sdm kecap manis\n3 siung bawang putih\n3 butir bawang merah\n5 buah cabai rawit\n2 lembar daun salam\n1 sdm minyak\n1 sdt air asam jawa"
    },
    steps: {
      en: "1. Bake or dry fry the tempeh sticks until firm.\n2. Saute sliced garlic, shallots and chilies until fragrant.\n3. Add bay leaves and the tempeh.\n4. Pour in sweet soy and tamarind water.\n5. Stir over medium heat until sticky and glossy.\n6. Cook until the sauce coats the tempeh, then serve.",
      id: "1. Panggang atau sangrai tempe sampai kesat.\n2. Tumis irisan bawang putih, bawang merah, cabai sampai harum.\n3. Masukkan daun salam dan tempe.\n4. Tuang kecap manis dan air asam jawa.\n5. Aduk di api sedang sampai lengket mengilap.\n6. Masak sampai bumbu menyelimuti tempe, sajikan."
    } },
  { id: "idn-c-11", emoji: "🥬", tint: "#2A7A4F", kcal: 180, p: 6, c: 12, f: 11, types: ["vegetarian", "vegan", "low-carb", "halal"], q: "vegetable", cat: "Vegan",
    nm: { en: "Tumis Kangkung (Stir-Fried Water Spinach)", id: "Tumis Kangkung" },
    ing: {
      en: "1 bunch water spinach, cut\n3 cloves garlic, sliced\n3 shallots, sliced\n3 red chilies, sliced\n1 tomato, wedged\n1 tbsp oil\n1 tsp soy sauce\nSalt and a splash of water",
      id: "1 ikat kangkung, potong\n3 siung bawang putih, iris\n3 butir bawang merah, iris\n3 buah cabai merah, iris\n1 buah tomat, belah\n1 sdm minyak\n1 sdt kecap asin\nGaram dan sedikit air"
    },
    steps: {
      en: "1. Wash the water spinach and drain well.\n2. Heat oil and saute garlic, shallots and chili.\n3. Add tomato and cook briefly.\n4. Toss in the water spinach on high heat.\n5. Season with soy sauce, salt and a splash of water.\n6. Stir fry just until wilted and still green, then serve.",
      id: "1. Cuci kangkung dan tiriskan.\n2. Panaskan minyak, tumis bawang putih, bawang merah, cabai.\n3. Masukkan tomat, masak sebentar.\n4. Masukkan kangkung dengan api besar.\n5. Bumbui kecap asin, garam, sedikit air.\n6. Tumis sampai layu tapi tetap hijau, sajikan."
    } },
  { id: "idn-c-12", emoji: "🥬", tint: "#2A7A4F", kcal: 200, p: 7, c: 12, f: 13, types: ["pescatarian", "low-carb", "halal"], q: "vegetable", cat: "Vegetable",
    nm: { en: "Cah Kangkung Terasi (Water Spinach with Shrimp Paste)", id: "Cah Kangkung Terasi" },
    ing: {
      en: "1 bunch water spinach, cut\n1 tsp shrimp paste, toasted\n3 cloves garlic\n3 shallots\n4 red chilies\n1 tomato\n1 tbsp oil\nSalt and sugar to taste",
      id: "1 ikat kangkung, potong\n1 sdt terasi, bakar\n3 siung bawang putih\n3 butir bawang merah\n4 buah cabai merah\n1 buah tomat\n1 sdm minyak\nGaram dan gula secukupnya"
    },
    steps: {
      en: "1. Grind chili, garlic, shallots and toasted shrimp paste.\n2. Heat oil and saute the paste until fragrant.\n3. Add tomato wedges and cook briefly.\n4. Turn heat high and add the water spinach.\n5. Season with salt and a pinch of sugar.\n6. Stir fry quickly until just wilted, then serve.",
      id: "1. Haluskan cabai, bawang putih, bawang merah, terasi bakar.\n2. Panaskan minyak, tumis bumbu sampai harum.\n3. Masukkan tomat, masak sebentar.\n4. Besarkan api, masukkan kangkung.\n5. Bumbui garam dan sedikit gula.\n6. Tumis cepat sampai layu, sajikan."
    } },
  { id: "idn-c-13", emoji: "🥬", tint: "#2A7A4F", kcal: 190, p: 7, c: 11, f: 12, types: ["vegetarian", "vegan", "low-carb", "halal"], q: "vegetable", cat: "Vegan",
    nm: { en: "Cah Kailan (Stir-Fried Chinese Kale)", id: "Cah Kailan" },
    ing: {
      en: "1 bunch Chinese kale, cut\n3 cloves garlic, chopped\n1 thumb ginger, sliced\n1 tsp soy sauce\n1 tsp sesame oil\n1 tbsp oil\nSalt and pepper\n2 tbsp water",
      id: "1 ikat kailan, potong\n3 siung bawang putih, cincang\n1 ruas jahe, iris\n1 sdt kecap asin\n1 sdt minyak wijen\n1 sdm minyak\nGaram dan lada\n2 sdm air"
    },
    steps: {
      en: "1. Blanch the kale briefly in boiling water and drain.\n2. Heat oil and saute garlic and ginger.\n3. Add the kale and stir on high heat.\n4. Season with soy sauce, salt and pepper.\n5. Add a splash of water and cover briefly.\n6. Finish with sesame oil and serve crisp-tender.",
      id: "1. Rebus sebentar kailan lalu tiriskan.\n2. Panaskan minyak, tumis bawang putih dan jahe.\n3. Masukkan kailan, aduk dengan api besar.\n4. Bumbui kecap asin, garam, lada.\n5. Beri sedikit air lalu tutup sebentar.\n6. Beri minyak wijen dan sajikan renyah."
    } },
  { id: "idn-c-14", emoji: "🫛", tint: "#2A7A4F", kcal: 190, p: 6, c: 14, f: 11, types: ["vegetarian", "vegan", "low-carb", "halal"], q: "vegetable", cat: "Vegan",
    nm: { en: "Oseng Buncis (Sauteed Green Beans)", id: "Oseng Buncis" },
    ing: {
      en: "250 g green beans, sliced\n3 cloves garlic, sliced\n3 shallots, sliced\n3 red chilies, sliced\n1 tomato, diced\n1 tbsp oil\n1 tsp soy sauce\nSalt and a splash of water",
      id: "250 g buncis, iris serong\n3 siung bawang putih, iris\n3 butir bawang merah, iris\n3 buah cabai merah, iris\n1 buah tomat, potong dadu\n1 sdm minyak\n1 sdt kecap asin\nGaram dan sedikit air"
    },
    steps: {
      en: "1. Saute garlic, shallots and chili until fragrant.\n2. Add tomato and cook briefly.\n3. Add the green beans and stir well.\n4. Season with soy sauce and salt.\n5. Add a splash of water and cover to soften.\n6. Cook until just tender but still bright green, then serve.",
      id: "1. Tumis bawang putih, bawang merah, cabai sampai harum.\n2. Masukkan tomat, masak sebentar.\n3. Masukkan buncis, aduk rata.\n4. Bumbui kecap asin dan garam.\n5. Beri sedikit air lalu tutup agar empuk.\n6. Masak sampai empuk tapi tetap hijau, sajikan."
    } },
  { id: "idn-c-15", emoji: "🥗", tint: "#2A7A4F", kcal: 220, p: 8, c: 18, f: 13, types: ["vegetarian", "vegan", "halal"], q: "vegetable", cat: "Vegan",
    nm: { en: "Urap Sayur (Vegetables with Spiced Coconut)", id: "Urap Sayur" },
    ing: {
      en: "150 g bean sprouts\n100 g long beans, cut\n100 g spinach or water spinach\n150 g grated coconut\n3 cloves garlic\n3 red chilies\n1 tsp palm sugar\n1 tbsp lime juice and salt",
      id: "150 g tauge\n100 g kacang panjang, potong\n100 g bayam atau kangkung\n150 g kelapa parut\n3 siung bawang putih\n3 buah cabai merah\n1 sdt gula merah\n1 sdm air jeruk nipis dan garam"
    },
    steps: {
      en: "1. Blanch all the vegetables separately and drain.\n2. Grind garlic, chili, palm sugar and salt.\n3. Mix the paste into the grated coconut.\n4. Steam the coconut mixture for 10 minutes.\n5. Add lime juice to the seasoned coconut.\n6. Toss the vegetables with the coconut just before serving.",
      id: "1. Rebus semua sayur terpisah lalu tiriskan.\n2. Haluskan bawang putih, cabai, gula merah, garam.\n3. Campur bumbu ke kelapa parut.\n4. Kukus kelapa berbumbu 10 menit.\n5. Beri air jeruk nipis pada kelapa.\n6. Aduk sayuran dengan kelapa tepat sebelum disajikan."
    } },
  { id: "idn-c-16", emoji: "🥗", tint: "#2A7A4F", kcal: 260, p: 10, c: 22, f: 15, types: ["vegetarian", "vegan", "halal"], q: "vegetable", cat: "Vegan",
    nm: { en: "Karedok (Raw Vegetables in Peanut Sauce)", id: "Karedok" },
    ing: {
      en: "100 g long beans, sliced\n100 g bean sprouts\n1 small cucumber, diced\n50 g cabbage, shredded\n5 tbsp ground peanuts\n2 cloves garlic\n3 red chilies\n1 tsp palm sugar\n1 tbsp lime juice and salt",
      id: "100 g kacang panjang, iris\n100 g tauge\n1 buah timun kecil, potong dadu\n50 g kol, iris halus\n5 sdm kacang tanah halus\n2 siung bawang putih\n3 buah cabai merah\n1 sdt gula merah\n1 sdm air jeruk nipis dan garam"
    },
    steps: {
      en: "1. Grind garlic, chili and palm sugar with the peanuts.\n2. Add water and lime juice to make a thick sauce.\n3. Season the sauce with salt.\n4. Prepare all the raw vegetables in a bowl.\n5. Pour the peanut sauce over the vegetables.\n6. Toss well and serve immediately.",
      id: "1. Ulek bawang putih, cabai, gula merah bersama kacang tanah.\n2. Beri air dan air jeruk nipis sampai jadi saus kental.\n3. Bumbui saus dengan garam.\n4. Siapkan semua sayuran mentah di mangkuk.\n5. Tuang saus kacang ke atas sayuran.\n6. Aduk rata dan sajikan segera."
    } },
  { id: "idn-c-17", emoji: "🥚", tint: "#C41101", kcal: 260, p: 14, c: 9, f: 18, types: ["vegetarian", "high-protein", "halal"], q: "egg", cat: "Vegetarian",
    nm: { en: "Telur Balado (Eggs in Chili Sauce)", id: "Telur Balado" },
    ing: {
      en: "4 boiled eggs, peeled\n8 red chilies\n4 shallots\n2 cloves garlic\n1 tomato\n1 tbsp oil\n1 tsp lime juice\nSalt and sugar to taste",
      id: "4 butir telur rebus, kupas\n8 buah cabai merah\n4 butir bawang merah\n2 siung bawang putih\n1 buah tomat\n1 sdm minyak\n1 sdt air jeruk nipis\nGaram dan gula secukupnya"
    },
    steps: {
      en: "1. Lightly pan sear the boiled eggs until skins blister.\n2. Grind chili, shallots, garlic and tomato.\n3. Saute the paste in oil until it darkens and smells sweet.\n4. Season with salt and a little sugar.\n5. Add the eggs and coat with the chili sauce.\n6. Finish with lime juice and serve.",
      id: "1. Goreng sebentar telur rebus sampai kulitnya berkerut.\n2. Haluskan cabai, bawang merah, bawang putih, tomat.\n3. Tumis bumbu dengan minyak sampai matang dan harum.\n4. Bumbui garam dan sedikit gula.\n5. Masukkan telur, aduk sampai terbalut sambal.\n6. Beri air jeruk nipis dan sajikan."
    } },
  { id: "idn-c-18", emoji: "🍳", tint: "#C87000", kcal: 240, p: 16, c: 6, f: 17, types: ["vegetarian", "high-protein", "low-carb", "halal"], q: "egg", cat: "Vegetarian",
    nm: { en: "Telur Dadar Sayur (Vegetable Omelette)", id: "Telur Dadar Sayur" },
    ing: {
      en: "3 eggs\n1 carrot, grated\n2 spring onions, chopped\n50 g cabbage, shredded\n1 red chili, sliced\n1 tbsp oil\nSalt and pepper\n1 tsp soy sauce",
      id: "3 butir telur\n1 buah wortel, parut\n2 batang daun bawang, cincang\n50 g kol, iris halus\n1 buah cabai merah, iris\n1 sdm minyak\nGaram dan lada\n1 sdt kecap asin"
    },
    steps: {
      en: "1. Beat the eggs with salt, pepper and soy sauce.\n2. Stir in the carrot, cabbage, spring onion and chili.\n3. Heat oil in a nonstick pan.\n4. Pour in the egg mixture and spread evenly.\n5. Cook on low heat until the base is set.\n6. Flip and cook the other side until golden, then serve.",
      id: "1. Kocok telur dengan garam, lada, kecap asin.\n2. Campurkan wortel, kol, daun bawang, cabai.\n3. Panaskan minyak di wajan antilengket.\n4. Tuang adonan telur, ratakan.\n5. Masak api kecil sampai bagian bawah matang.\n6. Balik dan masak sisi lain sampai keemasan, sajikan."
    } },
  { id: "idn-c-19", emoji: "🥔", tint: "#C87000", kcal: 210, p: 8, c: 26, f: 8, types: ["vegetarian", "halal"], q: "potato", cat: "Snack",
    nm: { en: "Perkedel Kentang (Baked Potato Patties)", id: "Perkedel Kentang Panggang" },
    ing: {
      en: "3 potatoes, boiled and mashed\n2 cloves garlic, fried\n2 shallots, fried\n1 egg\n1 spring onion, chopped\n1 tsp nutmeg powder\nSalt and pepper\n1 tsp oil for brushing",
      id: "3 buah kentang, rebus dan haluskan\n2 siung bawang putih, goreng\n2 butir bawang merah, goreng\n1 butir telur\n1 batang daun bawang, cincang\n1 sdt pala bubuk\nGaram dan lada\n1 sdt minyak untuk olesan"
    },
    steps: {
      en: "1. Mash the boiled potatoes while still warm.\n2. Grind the fried garlic and shallots, then mix in.\n3. Add spring onion, nutmeg, salt and pepper.\n4. Stir in the egg until the mixture holds together.\n5. Shape into small patties on a lined tray.\n6. Brush with oil and bake until golden on both sides.\n7. Serve warm as a snack or side.",
      id: "1. Haluskan kentang rebus selagi hangat.\n2. Ulek bawang putih dan bawang merah goreng, campurkan.\n3. Tambah daun bawang, pala, garam, lada.\n4. Masukkan telur, aduk sampai bisa dibentuk.\n5. Bentuk bulat pipih di loyang beralas.\n6. Oles minyak dan panggang sampai keemasan kedua sisi.\n7. Sajikan hangat sebagai camilan atau lauk."
    } },
  { id: "idn-c-20", emoji: "🐟", tint: "#2F6BFF", kcal: 230, p: 20, c: 12, f: 11, types: ["pescatarian", "high-protein", "halal"], q: "fish", cat: "Snack",
    nm: { en: "Otak-Otak (Baked Fish Cake in Leaf)", id: "Otak-Otak Panggang" },
    ing: {
      en: "250 g fish fillet, minced\n3 tbsp tapioca starch\n3 cloves garlic\n2 shallots\n2 spring onions, chopped\n4 tbsp coconut milk\n1 egg white\nBanana leaf and salt",
      id: "250 g fillet ikan, haluskan\n3 sdm tepung tapioka\n3 siung bawang putih\n2 butir bawang merah\n2 batang daun bawang, cincang\n4 sdm santan\n1 putih telur\nDaun pisang dan garam"
    },
    steps: {
      en: "1. Blend fish, garlic, shallots and salt until smooth.\n2. Mix in tapioca starch, coconut milk and egg white.\n3. Fold in the chopped spring onions.\n4. Spoon the paste onto pieces of banana leaf.\n5. Wrap and secure the parcels.\n6. Bake or grill until firm and lightly charred.\n7. Serve with a sweet chili dip.",
      id: "1. Haluskan ikan, bawang putih, bawang merah, garam.\n2. Campur tepung tapioka, santan, putih telur.\n3. Masukkan daun bawang cincang.\n4. Tuang adonan ke potongan daun pisang.\n5. Bungkus dan sematkan.\n6. Panggang sampai padat dan sedikit gosong.\n7. Sajikan dengan sambal kecap manis."
    } },
    { id: "intl-a-01", emoji: "🍗", tint: "#C41101", kcal: 480, p: 42, c: 30, f: 18, types: ["normal", "high-protein", "halal"], q: "chicken", cat: "Chicken",
    nm: { en: "Teriyaki Chicken with Rice", id: "Ayam Teriyaki dengan Nasi" },
    ing: {
      en: "150 g chicken thigh\n2 tbsp teriyaki sauce\n1 tsp honey\n1 clove garlic\n120 g cooked rice\n80 g steamed broccoli\n1 tsp sesame seeds\n1 tsp oil",
      id: "150 g paha ayam\n2 sdm saus teriyaki\n1 sdt madu\n1 siung bawang putih\n120 g nasi\n80 g brokoli kukus\n1 sdt wijen\n1 sdt minyak"
    },
    steps: {
      en: "1. Sear the chicken in oil until golden.\n2. Add garlic, teriyaki sauce and honey.\n3. Simmer until the sauce glazes the chicken.\n4. Slice the chicken.\n5. Serve over rice with broccoli.\n6. Sprinkle sesame seeds.",
      id: "1. Panggang ayam dengan minyak sampai keemasan.\n2. Tambahkan bawang putih, saus teriyaki dan madu.\n3. Masak sampai saus mengental melapisi ayam.\n4. Iris ayam.\n5. Sajikan di atas nasi dengan brokoli.\n6. Taburi wijen."
    } },
  { id: "intl-a-02", emoji: "🍯", tint: "#C41101", kcal: 500, p: 40, c: 34, f: 20, types: ["normal", "high-protein", "halal"], q: "chicken", cat: "Chicken",
    nm: { en: "Honey Garlic Chicken", id: "Ayam Madu Bawang Putih" },
    ing: {
      en: "160 g chicken breast\n2 tbsp honey\n3 cloves garlic\n1 tbsp soy sauce\n1 tsp rice vinegar\n130 g cooked rice\n60 g green beans\n1 tbsp oil",
      id: "160 g dada ayam\n2 sdm madu\n3 siung bawang putih\n1 sdm kecap asin\n1 sdt cuka beras\n130 g nasi\n60 g buncis\n1 sdm minyak"
    },
    steps: {
      en: "1. Cut chicken into bite pieces.\n2. Brown the chicken in oil.\n3. Add garlic and cook until fragrant.\n4. Stir in honey, soy sauce and vinegar.\n5. Toss until glossy and coated.\n6. Serve with rice and green beans.",
      id: "1. Potong ayam menjadi sepotong kecil.\n2. Tumis ayam dengan minyak sampai kecokelatan.\n3. Masukkan bawang putih sampai harum.\n4. Aduk madu, kecap asin dan cuka.\n5. Aduk sampai mengkilap dan terlapisi.\n6. Sajikan dengan nasi dan buncis."
    } },
  { id: "intl-a-03", emoji: "🍛", tint: "#C87000", kcal: 540, p: 38, c: 40, f: 22, types: ["normal", "high-protein", "halal"], q: "curry", cat: "Chicken",
    nm: { en: "Chicken Curry", id: "Kari Ayam" },
    ing: {
      en: "180 g chicken thigh\n1 tbsp curry powder\n100 ml coconut milk\n1 onion\n2 cloves garlic\n1 tomato\n130 g cooked rice\n1 tbsp oil",
      id: "180 g paha ayam\n1 sdm bubuk kari\n100 ml santan\n1 bawang bombay\n2 siung bawang putih\n1 tomat\n130 g nasi\n1 sdm minyak"
    },
    steps: {
      en: "1. Saute onion and garlic in oil.\n2. Add curry powder and cook briefly.\n3. Add chicken and brown lightly.\n4. Stir in tomato and coconut milk.\n5. Simmer until chicken is tender.\n6. Serve with rice.",
      id: "1. Tumis bawang bombay dan bawang putih.\n2. Tambahkan bubuk kari sebentar.\n3. Masukkan ayam dan tumis sebentar.\n4. Aduk tomat dan santan.\n5. Masak sampai ayam empuk.\n6. Sajikan dengan nasi."
    } },
  { id: "intl-a-04", emoji: "🐔", tint: "#C87000", kcal: 560, p: 40, c: 36, f: 26, types: ["normal", "high-protein", "halal"], q: "chicken", cat: "Chicken",
    nm: { en: "Lighter Butter Chicken", id: "Butter Chicken Ringan" },
    ing: {
      en: "170 g chicken breast\n80 g plain yogurt\n1 tbsp tomato paste\n1 tsp garam masala\n1 tbsp butter\n2 cloves garlic\n120 g cooked rice\n80 ml light cream",
      id: "170 g dada ayam\n80 g yogurt tawar\n1 sdm pasta tomat\n1 sdt garam masala\n1 sdm mentega\n2 siung bawang putih\n120 g nasi\n80 ml krim ringan"
    },
    steps: {
      en: "1. Marinate chicken in yogurt and garam masala.\n2. Sear the chicken in butter.\n3. Add garlic and tomato paste.\n4. Pour in light cream and simmer.\n5. Cook until the sauce thickens.\n6. Serve over rice.",
      id: "1. Rendam ayam dalam yogurt dan garam masala.\n2. Panggang ayam dengan mentega.\n3. Tambahkan bawang putih dan pasta tomat.\n4. Tuang krim ringan dan masak perlahan.\n5. Masak sampai saus mengental.\n6. Sajikan di atas nasi."
    } },
  { id: "intl-a-05", emoji: "🥘", tint: "#C87000", kcal: 520, p: 41, c: 32, f: 24, types: ["normal", "high-protein", "halal"], q: "beef", cat: "Beef",
    nm: { en: "Beef Stir-Fry", id: "Tumis Daging Sapi" },
    ing: {
      en: "160 g lean beef strips\n1 red bell pepper\n1 onion\n2 cloves garlic\n2 tbsp soy sauce\n1 tsp ginger\n130 g cooked rice\n1 tbsp oil",
      id: "160 g daging sapi iris\n1 paprika merah\n1 bawang bombay\n2 siung bawang putih\n2 sdm kecap asin\n1 sdt jahe\n130 g nasi\n1 sdm minyak"
    },
    steps: {
      en: "1. Heat oil in a hot pan.\n2. Stir-fry beef until browned, then set aside.\n3. Saute onion, pepper, garlic and ginger.\n4. Return beef to the pan.\n5. Add soy sauce and toss quickly.\n6. Serve with rice.",
      id: "1. Panaskan minyak di wajan panas.\n2. Tumis daging sampai kecokelatan lalu sisihkan.\n3. Tumis bawang bombay, paprika, bawang putih dan jahe.\n4. Kembalikan daging ke wajan.\n5. Tambahkan kecap asin dan aduk cepat.\n6. Sajikan dengan nasi."
    } },
  { id: "intl-a-06", emoji: "🥩", tint: "#C87000", kcal: 540, p: 43, c: 34, f: 23, types: ["normal", "high-protein", "halal"], q: "beef", cat: "Beef",
    nm: { en: "Beef Bulgogi", id: "Bulgogi Daging Sapi" },
    ing: {
      en: "170 g thin beef slices\n2 tbsp soy sauce\n1 tbsp sesame oil\n1 tbsp brown sugar\n2 cloves garlic\n1 spring onion\n130 g cooked rice\n1 tsp sesame seeds",
      id: "170 g daging sapi iris tipis\n2 sdm kecap asin\n1 sdm minyak wijen\n1 sdm gula merah\n2 siung bawang putih\n1 daun bawang\n130 g nasi\n1 sdt wijen"
    },
    steps: {
      en: "1. Mix soy sauce, sesame oil, sugar and garlic.\n2. Marinate beef for ten minutes.\n3. Sear beef in a hot pan.\n4. Cook until caramelized.\n5. Add spring onion.\n6. Serve with rice and sesame seeds.",
      id: "1. Campur kecap asin, minyak wijen, gula dan bawang putih.\n2. Rendam daging sepuluh menit.\n3. Panggang daging di wajan panas.\n4. Masak sampai karamel.\n5. Tambahkan daun bawang.\n6. Sajikan dengan nasi dan wijen."
    } },
  { id: "intl-a-07", emoji: "🐟", tint: "#2F6BFF", kcal: 430, p: 38, c: 12, f: 26, types: ["pescatarian", "high-protein", "keto", "low-carb", "halal"], q: "salmon", cat: "Seafood",
    nm: { en: "Baked Salmon with Asparagus", id: "Salmon Panggang dengan Asparagus" },
    ing: {
      en: "180 g salmon fillet\n100 g asparagus\n1 lemon\n2 cloves garlic\n1 tbsp olive oil\n1 tsp dried dill\nsalt and pepper",
      id: "180 g fillet salmon\n100 g asparagus\n1 lemon\n2 siung bawang putih\n1 sdm minyak zaitun\n1 sdt dill kering\ngaram dan lada"
    },
    steps: {
      en: "1. Heat the oven to 200 C.\n2. Place salmon and asparagus on a tray.\n3. Drizzle with olive oil and garlic.\n4. Season with dill, salt and pepper.\n5. Squeeze lemon over the top.\n6. Bake for fifteen minutes.",
      id: "1. Panaskan oven ke 200 C.\n2. Letakkan salmon dan asparagus di loyang.\n3. Siram dengan minyak zaitun dan bawang putih.\n4. Bumbui dengan dill, garam dan lada.\n5. Peras lemon di atasnya.\n6. Panggang selama lima belas menit."
    } },
  { id: "intl-a-08", emoji: "🦐", tint: "#2F6BFF", kcal: 400, p: 36, c: 10, f: 24, types: ["pescatarian", "high-protein", "keto", "low-carb", "halal"], q: "shrimp", cat: "Seafood",
    nm: { en: "Garlic Butter Shrimp", id: "Udang Mentega Bawang Putih" },
    ing: {
      en: "200 g peeled shrimp\n2 tbsp butter\n4 cloves garlic\n1 tsp chili flakes\n1 tbsp chopped parsley\n1 lemon\nsalt and pepper",
      id: "200 g udang kupas\n2 sdm mentega\n4 siung bawang putih\n1 sdt cabai bubuk\n1 sdm peterseli cincang\n1 lemon\ngaram dan lada"
    },
    steps: {
      en: "1. Melt butter in a pan.\n2. Add garlic and chili flakes.\n3. Add shrimp and cook until pink.\n4. Season with salt and pepper.\n5. Squeeze in lemon juice.\n6. Finish with parsley.",
      id: "1. Lelehkan mentega di wajan.\n2. Tambahkan bawang putih dan cabai bubuk.\n3. Masukkan udang sampai merah muda.\n4. Bumbui dengan garam dan lada.\n5. Peras air lemon.\n6. Selesaikan dengan peterseli."
    } },
  { id: "intl-a-09", emoji: "🌮", tint: "#2F6BFF", kcal: 470, p: 32, c: 38, f: 20, types: ["pescatarian", "high-protein", "halal"], q: "fish", cat: "Seafood",
    nm: { en: "Fish Tacos", id: "Taco Ikan" },
    ing: {
      en: "180 g white fish fillet\n3 small tortillas\n80 g shredded cabbage\n2 tbsp yogurt\n1 lime\n1 tsp paprika\n1 tsp cumin\n1 tbsp oil",
      id: "180 g fillet ikan putih\n3 tortilla kecil\n80 g kubis iris\n2 sdm yogurt\n1 jeruk nipis\n1 sdt paprika bubuk\n1 sdt jinten\n1 sdm minyak"
    },
    steps: {
      en: "1. Season fish with paprika and cumin.\n2. Pan-fry fish in oil until flaky.\n3. Warm the tortillas.\n4. Mix yogurt with lime for the sauce.\n5. Fill tortillas with fish and cabbage.\n6. Drizzle with the lime sauce.",
      id: "1. Bumbui ikan dengan paprika dan jinten.\n2. Goreng ikan dengan minyak sampai matang.\n3. Hangatkan tortilla.\n4. Campur yogurt dengan jeruk nipis untuk saus.\n5. Isi tortilla dengan ikan dan kubis.\n6. Siram dengan saus jeruk nipis."
    } },
  { id: "intl-a-10", emoji: "🍣", tint: "#2F6BFF", kcal: 410, p: 44, c: 8, f: 22, types: ["pescatarian", "high-protein", "keto", "low-carb", "halal"], q: "tuna", cat: "Seafood",
    nm: { en: "Seared Tuna Steak", id: "Tuna Steak Panggang Sebentar" },
    ing: {
      en: "200 g tuna steak\n1 tbsp soy sauce\n1 tsp sesame oil\n1 tsp black pepper\n1 tbsp sesame seeds\n100 g mixed salad\n1 tbsp olive oil",
      id: "200 g tuna steak\n1 sdm kecap asin\n1 sdt minyak wijen\n1 sdt lada hitam\n1 sdm wijen\n100 g salad campur\n1 sdm minyak zaitun"
    },
    steps: {
      en: "1. Pat the tuna dry.\n2. Coat with pepper and sesame seeds.\n3. Sear in sesame oil for one minute per side.\n4. Rest, then slice.\n5. Dress the salad with olive oil.\n6. Serve tuna over the salad with soy sauce.",
      id: "1. Keringkan tuna.\n2. Lapisi dengan lada dan wijen.\n3. Panggang dengan minyak wijen satu menit per sisi.\n4. Diamkan lalu iris.\n5. Beri salad minyak zaitun.\n6. Sajikan tuna di atas salad dengan kecap asin."
    } },
  { id: "intl-a-11", emoji: "🦃", tint: "#C41101", kcal: 460, p: 40, c: 28, f: 20, types: ["normal", "high-protein", "halal"], q: "turkey", cat: "Meatballs",
    nm: { en: "Turkey Meatballs in Tomato Sauce", id: "Bakso Kalkun Saus Tomat" },
    ing: {
      en: "200 g ground turkey\n1 egg\n2 tbsp breadcrumbs\n200 ml tomato sauce\n2 cloves garlic\n1 tsp oregano\n1 tbsp oil\n80 g cooked pasta",
      id: "200 g kalkun giling\n1 telur\n2 sdm tepung roti\n200 ml saus tomat\n2 siung bawang putih\n1 sdt oregano\n1 sdm minyak\n80 g pasta matang"
    },
    steps: {
      en: "1. Mix turkey, egg and breadcrumbs.\n2. Roll into small meatballs.\n3. Brown the meatballs in oil.\n4. Add garlic and tomato sauce.\n5. Simmer until cooked through.\n6. Serve with pasta and oregano.",
      id: "1. Campur kalkun, telur dan tepung roti.\n2. Bentuk menjadi bakso kecil.\n3. Tumis bakso dengan minyak.\n4. Tambahkan bawang putih dan saus tomat.\n5. Masak sampai matang.\n6. Sajikan dengan pasta dan oregano."
    } },
  { id: "intl-a-12", emoji: "🍝", tint: "#2A7A4F", kcal: 560, p: 34, c: 58, f: 18, types: ["normal", "high-protein"], q: "pasta", cat: "Pasta",
    nm: { en: "Lean Spaghetti Bolognese", id: "Spageti Bolognese Rendah Lemak" },
    ing: {
      en: "120 g spaghetti\n150 g lean ground beef\n200 ml tomato sauce\n1 onion\n2 cloves garlic\n1 carrot\n1 tsp oregano\n1 tbsp oil",
      id: "120 g spageti\n150 g daging sapi giling rendah lemak\n200 ml saus tomat\n1 bawang bombay\n2 siung bawang putih\n1 wortel\n1 sdt oregano\n1 sdm minyak"
    },
    steps: {
      en: "1. Cook the spaghetti until al dente.\n2. Saute onion, garlic and carrot in oil.\n3. Add the beef and brown it.\n4. Pour in tomato sauce and oregano.\n5. Simmer for fifteen minutes.\n6. Toss with the spaghetti.",
      id: "1. Rebus spageti sampai al dente.\n2. Tumis bawang bombay, bawang putih dan wortel.\n3. Masukkan daging dan tumis.\n4. Tuang saus tomat dan oregano.\n5. Masak selama lima belas menit.\n6. Campur dengan spageti."
    } },
  { id: "intl-a-13", emoji: "🌯", tint: "#C41101", kcal: 520, p: 40, c: 42, f: 18, types: ["normal", "high-protein", "halal"], q: "fajita", cat: "Chicken",
    nm: { en: "Chicken Fajita Bowl", id: "Bowl Fajita Ayam" },
    ing: {
      en: "170 g chicken breast\n1 bell pepper\n1 onion\n1 tsp paprika\n1 tsp cumin\n130 g cooked rice\n50 g black beans\n1 tbsp oil",
      id: "170 g dada ayam\n1 paprika\n1 bawang bombay\n1 sdt paprika bubuk\n1 sdt jinten\n130 g nasi\n50 g kacang hitam\n1 sdm minyak"
    },
    steps: {
      en: "1. Slice chicken, pepper and onion.\n2. Toss chicken with paprika and cumin.\n3. Cook chicken in oil until done.\n4. Add pepper and onion and saute.\n5. Warm the rice and beans.\n6. Build the bowl and combine.",
      id: "1. Iris ayam, paprika dan bawang bombay.\n2. Lumuri ayam dengan paprika bubuk dan jinten.\n3. Masak ayam dengan minyak sampai matang.\n4. Tambahkan paprika dan bawang lalu tumis.\n5. Hangatkan nasi dan kacang.\n6. Susun bowl dan campur."
    } },
  { id: "intl-a-14", emoji: "🍜", tint: "#C87000", kcal: 540, p: 30, c: 60, f: 18, types: ["normal", "high-protein", "halal"], q: "padthai", cat: "Noodle",
    nm: { en: "Lighter Chicken Pad Thai", id: "Pad Thai Ayam Ringan" },
    ing: {
      en: "120 g rice noodles\n130 g chicken breast\n1 egg\n60 g bean sprouts\n2 tbsp fish sauce\n1 tbsp tamarind paste\n1 tbsp crushed peanuts\n1 lime",
      id: "120 g mie beras\n130 g dada ayam\n1 telur\n60 g tauge\n2 sdm saus ikan\n1 sdm pasta asam jawa\n1 sdm kacang tumbuk\n1 jeruk nipis"
    },
    steps: {
      en: "1. Soak the rice noodles until soft.\n2. Stir-fry the chicken until cooked.\n3. Push aside and scramble the egg.\n4. Add noodles, fish sauce and tamarind.\n5. Toss with bean sprouts.\n6. Top with peanuts and lime.",
      id: "1. Rendam mie beras sampai lunak.\n2. Tumis ayam sampai matang.\n3. Sisihkan lalu orak-arik telur.\n4. Tambahkan mie, saus ikan dan asam jawa.\n5. Aduk dengan tauge.\n6. Beri kacang dan jeruk nipis."
    } },
  { id: "intl-a-15", emoji: "🥗", tint: "#2A7A4F", kcal: 490, p: 38, c: 44, f: 16, types: ["normal", "high-protein", "halal"], q: "quinoa", cat: "Chicken",
    nm: { en: "Chicken Quinoa Bowl", id: "Bowl Quinoa Ayam" },
    ing: {
      en: "150 g chicken breast\n100 g cooked quinoa\n60 g cherry tomatoes\n50 g cucumber\n30 g feta cheese\n1 tbsp olive oil\n1 lemon\n1 tsp oregano",
      id: "150 g dada ayam\n100 g quinoa matang\n60 g tomat ceri\n50 g mentimun\n30 g keju feta\n1 sdm minyak zaitun\n1 lemon\n1 sdt oregano"
    },
    steps: {
      en: "1. Season and grill the chicken.\n2. Slice the chicken into strips.\n3. Chop tomatoes and cucumber.\n4. Place quinoa in a bowl.\n5. Add chicken and vegetables.\n6. Top with feta, olive oil and lemon.",
      id: "1. Bumbui dan panggang ayam.\n2. Iris ayam menjadi memanjang.\n3. Potong tomat dan mentimun.\n4. Letakkan quinoa dalam mangkuk.\n5. Tambahkan ayam dan sayuran.\n6. Beri feta, minyak zaitun dan lemon."
    } },
  { id: "intl-a-16", emoji: "🍢", tint: "#C87000", kcal: 520, p: 36, c: 26, f: 30, types: ["normal", "high-protein", "halal"], q: "lamb", cat: "Lamb",
    nm: { en: "Lamb Kofta", id: "Kofta Domba" },
    ing: {
      en: "180 g ground lamb\n1 onion\n2 cloves garlic\n1 tsp cumin\n1 tsp coriander\n1 tbsp chopped mint\n2 pita breads\n2 tbsp yogurt",
      id: "180 g daging domba giling\n1 bawang bombay\n2 siung bawang putih\n1 sdt jinten\n1 sdt ketumbar\n1 sdm daun mint cincang\n2 roti pita\n2 sdm yogurt"
    },
    steps: {
      en: "1. Grate the onion and garlic.\n2. Mix lamb with onion, garlic and spices.\n3. Shape onto skewers.\n4. Grill until browned and cooked.\n5. Warm the pita bread.\n6. Serve with yogurt and mint.",
      id: "1. Parut bawang bombay dan bawang putih.\n2. Campur domba dengan bawang dan rempah.\n3. Bentuk pada tusuk sate.\n4. Panggang sampai kecokelatan dan matang.\n5. Hangatkan roti pita.\n6. Sajikan dengan yogurt dan mint."
    } },
  { id: "intl-a-17", emoji: "🥡", tint: "#2A7A4F", kcal: 420, p: 26, c: 38, f: 18, types: ["vegetarian", "vegan", "high-protein"], q: "tofu", cat: "Tofu",
    nm: { en: "Teriyaki Tofu", id: "Tahu Teriyaki" },
    ing: {
      en: "200 g firm tofu\n2 tbsp teriyaki sauce\n1 tsp maple syrup\n1 clove garlic\n120 g cooked rice\n60 g edamame\n1 tbsp oil\n1 tsp sesame seeds",
      id: "200 g tahu padat\n2 sdm saus teriyaki\n1 sdt sirup maple\n1 siung bawang putih\n120 g nasi\n60 g edamame\n1 sdm minyak\n1 sdt wijen"
    },
    steps: {
      en: "1. Press and cube the tofu.\n2. Pan-fry the tofu until crisp.\n3. Add garlic and cook briefly.\n4. Pour in teriyaki sauce and maple syrup.\n5. Toss until glazed.\n6. Serve with rice, edamame and sesame.",
      id: "1. Tekan dan potong dadu tahu.\n2. Goreng tahu sampai renyah.\n3. Tambahkan bawang putih sebentar.\n4. Tuang saus teriyaki dan sirup maple.\n5. Aduk sampai mengilap.\n6. Sajikan dengan nasi, edamame dan wijen."
    } },
  { id: "intl-a-18", emoji: "🌶️", tint: "#C87000", kcal: 510, p: 42, c: 30, f: 24, types: ["normal", "high-protein", "halal"], q: "beef", cat: "Beef",
    nm: { en: "Black Pepper Beef", id: "Sapi Lada Hitam" },
    ing: {
      en: "170 g beef sirloin strips\n1 tbsp black pepper\n2 tbsp oyster sauce\n1 onion\n1 green bell pepper\n2 cloves garlic\n130 g cooked rice\n1 tbsp oil",
      id: "170 g sirloin sapi iris\n1 sdm lada hitam\n2 sdm saus tiram\n1 bawang bombay\n1 paprika hijau\n2 siung bawang putih\n130 g nasi\n1 sdm minyak"
    },
    steps: {
      en: "1. Toss beef with black pepper.\n2. Sear the beef quickly in hot oil.\n3. Remove and saute onion and pepper.\n4. Add garlic and oyster sauce.\n5. Return the beef and toss.\n6. Serve with rice.",
      id: "1. Lumuri daging dengan lada hitam.\n2. Panggang daging cepat di minyak panas.\n3. Angkat lalu tumis bawang dan paprika.\n4. Tambahkan bawang putih dan saus tiram.\n5. Kembalikan daging dan aduk.\n6. Sajikan dengan nasi."
    } },
  { id: "intl-a-19", emoji: "🍋", tint: "#C41101", kcal: 440, p: 44, c: 14, f: 22, types: ["normal", "high-protein", "low-carb", "halal"], q: "chicken", cat: "Chicken",
    nm: { en: "Lemon Herb Chicken", id: "Ayam Lemon Herba" },
    ing: {
      en: "200 g chicken breast\n1 lemon\n2 cloves garlic\n1 tsp dried thyme\n1 tsp rosemary\n2 tbsp olive oil\n120 g roasted vegetables\nsalt and pepper",
      id: "200 g dada ayam\n1 lemon\n2 siung bawang putih\n1 sdt thyme kering\n1 sdt rosemary\n2 sdm minyak zaitun\n120 g sayuran panggang\ngaram dan lada"
    },
    steps: {
      en: "1. Mix lemon juice, garlic, herbs and oil.\n2. Coat the chicken in the marinade.\n3. Rest for ten minutes.\n4. Pan-sear the chicken until golden.\n5. Cook through over lower heat.\n6. Serve with roasted vegetables.",
      id: "1. Campur air lemon, bawang putih, herba dan minyak.\n2. Lumuri ayam dengan bumbu rendaman.\n3. Diamkan sepuluh menit.\n4. Panggang ayam di wajan sampai keemasan.\n5. Masak sampai matang dengan api kecil.\n6. Sajikan dengan sayuran panggang."
    } },
  { id: "intl-a-20", emoji: "🍤", tint: "#2F6BFF", kcal: 520, p: 34, c: 56, f: 16, types: ["pescatarian", "high-protein", "halal"], q: "shrimp", cat: "Noodle",
    nm: { en: "Shrimp Stir-Fry Noodles", id: "Mie Tumis Udang" },
    ing: {
      en: "120 g egg noodles\n180 g peeled shrimp\n1 carrot\n60 g snap peas\n2 tbsp soy sauce\n1 tsp sesame oil\n2 cloves garlic\n1 tbsp oil",
      id: "120 g mie telur\n180 g udang kupas\n1 wortel\n60 g kacang polong\n2 sdm kecap asin\n1 sdt minyak wijen\n2 siung bawang putih\n1 sdm minyak"
    },
    steps: {
      en: "1. Boil the egg noodles and drain.\n2. Stir-fry shrimp in oil until pink.\n3. Add garlic, carrot and snap peas.\n4. Toss in the noodles.\n5. Add soy sauce and sesame oil.\n6. Stir-fry until everything is coated.",
      id: "1. Rebus mie telur lalu tiriskan.\n2. Tumis udang dengan minyak sampai merah muda.\n3. Tambahkan bawang putih, wortel dan kacang polong.\n4. Masukkan mie.\n5. Tambahkan kecap asin dan minyak wijen.\n6. Tumis sampai semua terlapisi."
    } },
    { id: "intl-b-01", emoji: "🍳", tint: "#C87000", kcal: 340, p: 22, c: 6, f: 26, types: ["vegetarian","high-protein","low-carb"], q: "omelette", cat: "Breakfast",
    nm: { en: "Cheese and Herb Omelette", id: "Omelet Keju dan Rempah" },
    ing: {
      en: "3 large eggs\n30 grams grated cheddar\n1 tablespoon butter\n1 tablespoon chopped chives\n1 tablespoon chopped parsley\nSalt and pepper\nSplash of milk",
      id: "3 butir telur besar\n30 gram keju cheddar parut\n1 sendok makan mentega\n1 sendok makan daun kucai cincang\n1 sendok makan peterseli cincang\nGaram dan merica\nSedikit susu"
    },
    steps: {
      en: "1. Whisk the eggs with milk, salt and pepper.\n2. Melt butter in a non-stick pan over medium heat.\n3. Pour in the eggs and swirl to coat.\n4. Scatter cheese and herbs over one half.\n5. Fold the omelette and cook one more minute.\n6. Slide onto a plate and serve warm.",
      id: "1. Kocok telur dengan susu, garam dan merica.\n2. Lelehkan mentega di wajan anti lengket dengan api sedang.\n3. Tuang telur dan ratakan.\n4. Taburkan keju dan rempah di satu sisi.\n5. Lipat omelet dan masak satu menit lagi.\n6. Pindahkan ke piring dan sajikan hangat."
    } },
  { id: "intl-b-02", emoji: "🍳", tint: "#2A7A4F", kcal: 280, p: 14, c: 12, f: 19, types: ["vegetarian","high-protein","low-carb"], q: "egg", cat: "Breakfast",
    nm: { en: "Veggie Scramble", id: "Telur Orak-Arik Sayur" },
    ing: {
      en: "3 eggs\nHalf red bell pepper diced\nHandful baby spinach\n2 mushrooms sliced\n1 tablespoon olive oil\n1 spring onion chopped\nSalt and pepper",
      id: "3 butir telur\nSetengah paprika merah potong dadu\nSegenggam bayam muda\n2 buah jamur iris\n1 sendok makan minyak zaitun\n1 batang daun bawang cincang\nGaram dan merica"
    },
    steps: {
      en: "1. Heat olive oil in a pan over medium heat.\n2. Saute bell pepper and mushrooms 3 minutes.\n3. Add spinach and cook until wilted.\n4. Pour in the beaten eggs.\n5. Stir gently until softly set.\n6. Season and top with spring onion.",
      id: "1. Panaskan minyak zaitun di wajan dengan api sedang.\n2. Tumis paprika dan jamur 3 menit.\n3. Masukkan bayam dan masak sampai layu.\n4. Tuang telur kocok.\n5. Aduk perlahan sampai setengah set.\n6. Bumbui dan taburi daun bawang."
    } },
  { id: "intl-b-03", emoji: "🥞", tint: "#C87000", kcal: 380, p: 28, c: 40, f: 10, types: ["vegetarian","high-protein"], q: "pancake", cat: "Breakfast",
    nm: { en: "Protein Pancakes", id: "Panekuk Protein" },
    ing: {
      en: "1 ripe banana\n2 eggs\n1 scoop vanilla protein powder\n40 grams rolled oats\nHalf teaspoon baking powder\nPinch of cinnamon\n1 teaspoon oil for cooking",
      id: "1 pisang matang\n2 butir telur\n1 sendok protein bubuk vanila\n40 gram oat\nSetengah sendok teh baking powder\nSejumput kayu manis\n1 sendok teh minyak untuk memasak"
    },
    steps: {
      en: "1. Blend banana, eggs, protein powder and oats.\n2. Stir in baking powder and cinnamon.\n3. Heat a lightly oiled pan over medium heat.\n4. Pour small rounds of batter.\n5. Flip when bubbles form on top.\n6. Cook until golden and serve.",
      id: "1. Blender pisang, telur, protein bubuk dan oat.\n2. Aduk baking powder dan kayu manis.\n3. Panaskan wajan berminyak tipis dengan api sedang.\n4. Tuang adonan bulat kecil.\n5. Balik saat muncul gelembung di atas.\n6. Masak sampai keemasan dan sajikan."
    } },
  { id: "intl-b-04", emoji: "🍮", tint: "#2A7A4F", kcal: 260, p: 8, c: 30, f: 12, types: ["vegan","vegetarian"], q: "chia", cat: "Breakfast",
    nm: { en: "Chia Pudding with Berries", id: "Puding Chia dengan Beri" },
    ing: {
      en: "3 tablespoons chia seeds\n200 millilitres almond milk\n1 teaspoon maple syrup\nHalf teaspoon vanilla\nHandful mixed berries\n1 tablespoon chopped almonds\nPinch of salt",
      id: "3 sendok makan biji chia\n200 mililiter susu almond\n1 sendok teh sirup maple\nSetengah sendok teh vanila\nSegenggam beri campur\n1 sendok makan almond cincang\nSejumput garam"
    },
    steps: {
      en: "1. Stir chia seeds into the almond milk.\n2. Add maple syrup, vanilla and salt.\n3. Whisk well so seeds do not clump.\n4. Chill in the fridge for 4 hours.\n5. Stir again and spoon into a glass.\n6. Top with berries and almonds.",
      id: "1. Aduk biji chia ke dalam susu almond.\n2. Tambahkan sirup maple, vanila dan garam.\n3. Kocok rata agar biji tidak menggumpal.\n4. Dinginkan di kulkas selama 4 jam.\n5. Aduk lagi dan tuang ke gelas.\n6. Beri beri dan almond di atasnya."
    } },
  { id: "intl-b-05", emoji: "🥣", tint: "#2F6BFF", kcal: 320, p: 9, c: 58, f: 8, types: ["vegan","vegetarian"], q: "smoothie", cat: "Breakfast",
    nm: { en: "Berry Smoothie Bowl", id: "Mangkuk Smoothie Beri" },
    ing: {
      en: "1 frozen banana\n150 grams frozen mixed berries\n100 millilitres coconut milk\n1 tablespoon granola\n1 tablespoon shredded coconut\nFew fresh strawberries\n1 teaspoon chia seeds",
      id: "1 pisang beku\n150 gram beri campur beku\n100 mililiter santan\n1 sendok makan granola\n1 sendok makan kelapa parut\nBeberapa stroberi segar\n1 sendok teh biji chia"
    },
    steps: {
      en: "1. Blend banana, berries and coconut milk.\n2. Keep it thick so it holds a spoon.\n3. Pour into a chilled bowl.\n4. Arrange sliced strawberries on top.\n5. Sprinkle granola and shredded coconut.\n6. Finish with chia seeds and serve.",
      id: "1. Blender pisang, beri dan santan.\n2. Buat kental agar bisa disendok.\n3. Tuang ke mangkuk dingin.\n4. Tata irisan stroberi di atasnya.\n5. Taburi granola dan kelapa parut.\n6. Akhiri dengan biji chia dan sajikan."
    } },
  { id: "intl-b-06", emoji: "🌾", tint: "#C87000", kcal: 350, p: 12, c: 55, f: 9, types: ["vegetarian"], q: "oats", cat: "Breakfast",
    nm: { en: "Apple Cinnamon Overnight Oats", id: "Overnight Oats Apel Kayu Manis" },
    ing: {
      en: "50 grams rolled oats\n120 millilitres milk\n2 tablespoons Greek yogurt\nHalf grated apple\n1 teaspoon honey\nHalf teaspoon cinnamon\n1 tablespoon raisins",
      id: "50 gram oat\n120 mililiter susu\n2 sendok makan yogurt Yunani\nSetengah apel parut\n1 sendok teh madu\nSetengah sendok teh kayu manis\n1 sendok makan kismis"
    },
    steps: {
      en: "1. Combine oats, milk and yogurt in a jar.\n2. Stir in grated apple and cinnamon.\n3. Add honey and raisins.\n4. Mix well and seal the jar.\n5. Refrigerate overnight.\n6. Stir and enjoy cold in the morning.",
      id: "1. Campur oat, susu dan yogurt dalam toples.\n2. Aduk apel parut dan kayu manis.\n3. Tambahkan madu dan kismis.\n4. Aduk rata dan tutup toples.\n5. Dinginkan semalaman.\n6. Aduk dan nikmati dingin di pagi hari."
    } },
  { id: "intl-b-07", emoji: "🥛", tint: "#2A7A4F", kcal: 300, p: 18, c: 34, f: 8, types: ["vegetarian","high-protein"], q: "yogurt", cat: "Breakfast",
    nm: { en: "Greek Yogurt Parfait", id: "Parfait Yogurt Yunani" },
    ing: {
      en: "200 grams Greek yogurt\n40 grams granola\nHandful blueberries\n1 sliced kiwi\n1 teaspoon honey\n1 tablespoon pumpkin seeds\nPinch of cinnamon",
      id: "200 gram yogurt Yunani\n40 gram granola\nSegenggam blueberry\n1 buah kiwi iris\n1 sendok teh madu\n1 sendok makan biji labu\nSejumput kayu manis"
    },
    steps: {
      en: "1. Spoon half the yogurt into a glass.\n2. Add a layer of granola and blueberries.\n3. Spoon in the rest of the yogurt.\n4. Layer kiwi slices on top.\n5. Drizzle with honey.\n6. Finish with pumpkin seeds and cinnamon.",
      id: "1. Sendokkan setengah yogurt ke gelas.\n2. Beri lapisan granola dan blueberry.\n3. Sendokkan sisa yogurt.\n4. Tata irisan kiwi di atasnya.\n5. Siram dengan madu.\n6. Akhiri dengan biji labu dan kayu manis."
    } },
  { id: "intl-b-08", emoji: "🍅", tint: "#C41101", kcal: 310, p: 16, c: 18, f: 20, types: ["vegetarian","halal"], q: "egg", cat: "Breakfast",
    nm: { en: "Shakshuka", id: "Shakshuka" },
    ing: {
      en: "3 eggs\n400 grams crushed tomatoes\n1 onion sliced\n1 red bell pepper diced\n2 cloves garlic minced\n1 teaspoon paprika\n1 teaspoon cumin\n2 tablespoons olive oil\nFresh coriander",
      id: "3 butir telur\n400 gram tomat hancur\n1 bawang bombay iris\n1 paprika merah potong dadu\n2 siung bawang putih cincang\n1 sendok teh paprika bubuk\n1 sendok teh jintan\n2 sendok makan minyak zaitun\nKetumbar segar"
    },
    steps: {
      en: "1. Heat olive oil and soften onion and pepper.\n2. Add garlic, paprika and cumin.\n3. Pour in the crushed tomatoes and simmer.\n4. Make wells and crack in the eggs.\n5. Cover and cook until whites are set.\n6. Scatter coriander and serve from the pan.",
      id: "1. Panaskan minyak zaitun dan tumis bawang dan paprika.\n2. Tambahkan bawang putih, paprika bubuk dan jintan.\n3. Tuang tomat hancur dan didihkan.\n4. Buat lubang dan pecahkan telur.\n5. Tutup dan masak sampai putih telur set.\n6. Taburi ketumbar dan sajikan dari wajan."
    } },
  { id: "intl-b-09", emoji: "🍲", tint: "#C87000", kcal: 290, p: 18, c: 40, f: 6, types: ["vegan","vegetarian","high-protein","halal"], q: "soup", cat: "Vegan",
    nm: { en: "Red Lentil Soup", id: "Sup Lentil Merah" },
    ing: {
      en: "200 grams red lentils\n1 onion chopped\n2 carrots diced\n2 cloves garlic minced\n1 teaspoon cumin\n1 litre vegetable broth\n1 tablespoon olive oil\nSqueeze of lemon\nSalt and pepper",
      id: "200 gram lentil merah\n1 bawang bombay cincang\n2 wortel potong dadu\n2 siung bawang putih cincang\n1 sendok teh jintan\n1 liter kaldu sayur\n1 sendok makan minyak zaitun\nPerasan lemon\nGaram dan merica"
    },
    steps: {
      en: "1. Heat oil and saute onion, carrot and garlic.\n2. Stir in the cumin until fragrant.\n3. Add lentils and vegetable broth.\n4. Simmer 25 minutes until soft.\n5. Blend until smooth if you like.\n6. Season and finish with lemon juice.",
      id: "1. Panaskan minyak dan tumis bawang, wortel dan bawang putih.\n2. Aduk jintan sampai harum.\n3. Tambahkan lentil dan kaldu sayur.\n4. Didihkan 25 menit sampai lembut.\n5. Blender sampai halus jika suka.\n6. Bumbui dan akhiri dengan perasan lemon."
    } },
  { id: "intl-b-10", emoji: "🍛", tint: "#C87000", kcal: 420, p: 15, c: 52, f: 16, types: ["vegan","vegetarian","halal"], q: "curry", cat: "Vegan",
    nm: { en: "Chickpea Curry", id: "Kari Buncis Kacang Arab" },
    ing: {
      en: "400 grams cooked chickpeas\n400 millilitres coconut milk\n1 onion chopped\n2 cloves garlic minced\n1 tablespoon curry powder\n1 teaspoon grated ginger\n200 grams chopped tomatoes\n1 tablespoon oil\nFresh coriander",
      id: "400 gram buncis kacang arab matang\n400 mililiter santan\n1 bawang bombay cincang\n2 siung bawang putih cincang\n1 sendok makan bubuk kari\n1 sendok teh jahe parut\n200 gram tomat cincang\n1 sendok makan minyak\nKetumbar segar"
    },
    steps: {
      en: "1. Heat oil and soften onion, garlic and ginger.\n2. Stir in curry powder until fragrant.\n3. Add tomatoes and cook down 5 minutes.\n4. Pour in coconut milk and chickpeas.\n5. Simmer 15 minutes until thick.\n6. Garnish with coriander and serve with rice.",
      id: "1. Panaskan minyak dan tumis bawang, bawang putih dan jahe.\n2. Aduk bubuk kari sampai harum.\n3. Tambahkan tomat dan masak 5 menit.\n4. Tuang santan dan buncis kacang arab.\n5. Didihkan 15 menit sampai kental.\n6. Hias dengan ketumbar dan sajikan dengan nasi."
    } },
  { id: "intl-b-11", emoji: "🥘", tint: "#2A7A4F", kcal: 300, p: 12, c: 48, f: 7, types: ["vegan","vegetarian","halal"], q: "soup", cat: "Vegan",
    nm: { en: "Minestrone Soup", id: "Sup Minestrone" },
    ing: {
      en: "1 onion chopped\n2 carrots diced\n2 celery stalks sliced\n1 zucchini diced\n400 grams chopped tomatoes\n400 grams cooked cannellini beans\n80 grams small pasta\n1 litre vegetable broth\n2 tablespoons olive oil",
      id: "1 bawang bombay cincang\n2 wortel potong dadu\n2 batang seledri iris\n1 zukini potong dadu\n400 gram tomat cincang\n400 gram kacang cannellini matang\n80 gram pasta kecil\n1 liter kaldu sayur\n2 sendok makan minyak zaitun"
    },
    steps: {
      en: "1. Heat oil and saute onion, carrot and celery.\n2. Add zucchini and cook 3 minutes.\n3. Pour in tomatoes and vegetable broth.\n4. Simmer 15 minutes then add beans and pasta.\n5. Cook until pasta is tender.\n6. Season to taste and serve hot.",
      id: "1. Panaskan minyak dan tumis bawang, wortel dan seledri.\n2. Tambahkan zukini dan masak 3 menit.\n3. Tuang tomat dan kaldu sayur.\n4. Didihkan 15 menit lalu tambahkan kacang dan pasta.\n5. Masak sampai pasta empuk.\n6. Bumbui sesuai selera dan sajikan panas."
    } },
  { id: "intl-b-12", emoji: "🥗", tint: "#2A7A4F", kcal: 330, p: 9, c: 16, f: 26, types: ["vegetarian","low-carb","halal"], q: "salad", cat: "Salad",
    nm: { en: "Greek Salad", id: "Salad Yunani" },
    ing: {
      en: "3 tomatoes cut in wedges\n1 cucumber sliced\nHalf red onion sliced\n100 grams feta cheese\nHandful black olives\n2 tablespoons olive oil\n1 teaspoon dried oregano\nSqueeze of lemon",
      id: "3 tomat potong juring\n1 mentimun iris\nSetengah bawang merah iris\n100 gram keju feta\nSegenggam zaitun hitam\n2 sendok makan minyak zaitun\n1 sendok teh oregano kering\nPerasan lemon"
    },
    steps: {
      en: "1. Place tomatoes, cucumber and onion in a bowl.\n2. Add the olives.\n3. Break feta into large chunks on top.\n4. Drizzle with olive oil and lemon.\n5. Sprinkle oregano over everything.\n6. Toss gently and serve fresh.",
      id: "1. Taruh tomat, mentimun dan bawang di mangkuk.\n2. Tambahkan zaitun.\n3. Pecahkan feta jadi potongan besar di atasnya.\n4. Siram minyak zaitun dan lemon.\n5. Taburi oregano ke seluruh bagian.\n6. Aduk perlahan dan sajikan segar."
    } },
  { id: "intl-b-13", emoji: "🥙", tint: "#2A7A4F", kcal: 380, p: 14, c: 52, f: 14, types: ["vegan","vegetarian","halal"], q: "quinoa", cat: "Salad",
    nm: { en: "Quinoa Salad", id: "Salad Quinoa" },
    ing: {
      en: "150 grams cooked quinoa\n1 cucumber diced\n10 cherry tomatoes halved\nHalf red onion chopped\nHandful chopped parsley\n2 tablespoons olive oil\n1 tablespoon lemon juice\n40 grams chickpeas\nSalt and pepper",
      id: "150 gram quinoa matang\n1 mentimun potong dadu\n10 tomat ceri belah dua\nSetengah bawang merah cincang\nSegenggam peterseli cincang\n2 sendok makan minyak zaitun\n1 sendok makan air lemon\n40 gram buncis kacang arab\nGaram dan merica"
    },
    steps: {
      en: "1. Let the cooked quinoa cool in a bowl.\n2. Add cucumber, tomatoes and onion.\n3. Stir in chickpeas and parsley.\n4. Whisk olive oil with lemon juice.\n5. Pour the dressing over the salad.\n6. Toss, season and serve.",
      id: "1. Dinginkan quinoa matang dalam mangkuk.\n2. Tambahkan mentimun, tomat dan bawang.\n3. Aduk buncis kacang arab dan peterseli.\n4. Kocok minyak zaitun dengan air lemon.\n5. Tuang dressing ke atas salad.\n6. Aduk, bumbui dan sajikan."
    } },
  { id: "intl-b-14", emoji: "🌯", tint: "#C87000", kcal: 400, p: 13, c: 50, f: 17, types: ["vegan","vegetarian","halal"], q: "wrap", cat: "Snack",
    nm: { en: "Hummus Veggie Wrap", id: "Wrap Hummus Sayur" },
    ing: {
      en: "1 large tortilla\n3 tablespoons hummus\nHandful baby spinach\nHalf grated carrot\nHalf cucumber sliced\nQuarter red bell pepper sliced\n2 tablespoons sweetcorn\nSqueeze of lemon",
      id: "1 tortila besar\n3 sendok makan hummus\nSegenggam bayam muda\nSetengah wortel parut\nSetengah mentimun iris\nSeperempat paprika merah iris\n2 sendok makan jagung manis\nPerasan lemon"
    },
    steps: {
      en: "1. Warm the tortilla slightly.\n2. Spread hummus across the middle.\n3. Layer spinach, carrot and cucumber.\n4. Add bell pepper and sweetcorn.\n5. Squeeze lemon over the filling.\n6. Roll up tightly and slice in half.",
      id: "1. Hangatkan tortila sebentar.\n2. Oleskan hummus di bagian tengah.\n3. Susun bayam, wortel dan mentimun.\n4. Tambahkan paprika dan jagung manis.\n5. Peras lemon di atas isian.\n6. Gulung rapat dan potong jadi dua."
    } },
  { id: "intl-b-15", emoji: "🧆", tint: "#2A7A4F", kcal: 450, p: 16, c: 55, f: 18, types: ["vegan","vegetarian","halal"], q: "falafel", cat: "Vegan",
    nm: { en: "Falafel Bowl", id: "Mangkuk Falafel" },
    ing: {
      en: "6 baked falafel\n150 grams cooked couscous\nHandful mixed greens\n5 cherry tomatoes halved\nHalf cucumber diced\n2 tablespoons hummus\n1 tablespoon tahini\nSqueeze of lemon",
      id: "6 buah falafel panggang\n150 gram couscous matang\nSegenggam sayuran hijau campur\n5 tomat ceri belah dua\nSetengah mentimun potong dadu\n2 sendok makan hummus\n1 sendok makan tahini\nPerasan lemon"
    },
    steps: {
      en: "1. Spoon couscous into the base of a bowl.\n2. Arrange greens, tomatoes and cucumber.\n3. Place the falafel on top.\n4. Add a scoop of hummus.\n5. Thin the tahini with lemon and water.\n6. Drizzle the dressing over and serve.",
      id: "1. Sendokkan couscous ke dasar mangkuk.\n2. Tata sayuran hijau, tomat dan mentimun.\n3. Letakkan falafel di atasnya.\n4. Tambahkan satu sendok hummus.\n5. Encerkan tahini dengan lemon dan air.\n6. Siram dressing di atasnya dan sajikan."
    } },
  { id: "intl-b-16", emoji: "🥦", tint: "#2A7A4F", kcal: 310, p: 12, c: 34, f: 14, types: ["vegan","vegetarian","halal"], q: "stirfry", cat: "Vegan",
    nm: { en: "Veggie Stir-Fry", id: "Tumis Sayur" },
    ing: {
      en: "1 head broccoli in florets\n1 carrot sliced\n1 red bell pepper sliced\n100 grams snap peas\n2 cloves garlic minced\n2 tablespoons soy sauce\n1 tablespoon sesame oil\n1 teaspoon grated ginger\n1 teaspoon sesame seeds",
      id: "1 brokoli potong kuntum\n1 wortel iris\n1 paprika merah iris\n100 gram kacang polong\n2 siung bawang putih cincang\n2 sendok makan kecap asin\n1 sendok makan minyak wijen\n1 sendok teh jahe parut\n1 sendok teh biji wijen"
    },
    steps: {
      en: "1. Heat sesame oil in a wok over high heat.\n2. Add garlic and ginger for 30 seconds.\n3. Toss in broccoli and carrot.\n4. Add bell pepper and snap peas.\n5. Pour in soy sauce and stir-fry 3 minutes.\n6. Sprinkle sesame seeds and serve.",
      id: "1. Panaskan minyak wijen di wajan dengan api besar.\n2. Tambahkan bawang putih dan jahe 30 detik.\n3. Masukkan brokoli dan wortel.\n4. Tambahkan paprika dan kacang polong.\n5. Tuang kecap asin dan tumis 3 menit.\n6. Taburi biji wijen dan sajikan."
    } },
  { id: "intl-b-17", emoji: "🍳", tint: "#C87000", kcal: 270, p: 18, c: 14, f: 16, types: ["vegan","vegetarian","high-protein","halal"], q: "tofu", cat: "Vegan",
    nm: { en: "Tofu Scramble", id: "Tahu Orak-Arik" },
    ing: {
      en: "200 grams firm tofu\nHalf teaspoon turmeric\n1 teaspoon nutritional yeast\nHalf onion chopped\nHandful baby spinach\n1 tablespoon oil\n1 spring onion chopped\nSalt and pepper",
      id: "200 gram tahu padat\nSetengah sendok teh kunyit\n1 sendok teh ragi nutrisi\nSetengah bawang bombay cincang\nSegenggam bayam muda\n1 sendok makan minyak\n1 batang daun bawang cincang\nGaram dan merica"
    },
    steps: {
      en: "1. Crumble the tofu with your hands.\n2. Heat oil and soften the onion.\n3. Add tofu, turmeric and yeast.\n4. Stir-fry 5 minutes until golden.\n5. Fold in spinach until wilted.\n6. Season and top with spring onion.",
      id: "1. Hancurkan tahu dengan tangan.\n2. Panaskan minyak dan tumis bawang.\n3. Tambahkan tahu, kunyit dan ragi.\n4. Tumis 5 menit sampai keemasan.\n5. Masukkan bayam sampai layu.\n6. Bumbui dan taburi daun bawang."
    } },
  { id: "intl-b-18", emoji: "🍜", tint: "#C41101", kcal: 420, p: 14, c: 52, f: 18, types: ["vegan","vegetarian"], q: "noodle", cat: "Salad",
    nm: { en: "Peanut Noodle Salad", id: "Salad Mie Kacang" },
    ing: {
      en: "150 grams cooked rice noodles\n2 tablespoons peanut butter\n1 tablespoon soy sauce\n1 tablespoon lime juice\n1 teaspoon maple syrup\n1 grated carrot\nHalf red bell pepper sliced\n2 tablespoons chopped peanuts\nFresh coriander",
      id: "150 gram mie beras matang\n2 sendok makan selai kacang\n1 sendok makan kecap asin\n1 sendok makan air jeruk nipis\n1 sendok teh sirup maple\n1 wortel parut\nSetengah paprika merah iris\n2 sendok makan kacang cincang\nKetumbar segar"
    },
    steps: {
      en: "1. Rinse the cooked noodles in cold water.\n2. Whisk peanut butter, soy sauce and lime.\n3. Stir in maple syrup for the dressing.\n4. Toss noodles with carrot and bell pepper.\n5. Pour the peanut dressing over and mix.\n6. Top with peanuts and coriander.",
      id: "1. Bilas mie matang dengan air dingin.\n2. Kocok selai kacang, kecap asin dan jeruk nipis.\n3. Aduk sirup maple untuk dressing.\n4. Aduk mie dengan wortel dan paprika.\n5. Tuang dressing kacang dan campur.\n6. Beri kacang dan ketumbar di atasnya."
    } },
  { id: "intl-b-19", emoji: "🍚", tint: "#2A7A4F", kcal: 440, p: 18, c: 62, f: 12, types: ["vegan","vegetarian","high-protein","halal"], q: "rice", cat: "Vegan",
    nm: { en: "Edamame Rice Bowl", id: "Mangkuk Nasi Edamame" },
    ing: {
      en: "150 grams cooked brown rice\n100 grams shelled edamame\nHalf avocado sliced\n1 grated carrot\n2 tablespoons sweetcorn\n1 tablespoon soy sauce\n1 teaspoon sesame oil\n1 teaspoon sesame seeds\n1 sheet nori shredded",
      id: "150 gram nasi merah matang\n100 gram edamame kupas\nSetengah alpukat iris\n1 wortel parut\n2 sendok makan jagung manis\n1 sendok makan kecap asin\n1 sendok teh minyak wijen\n1 sendok teh biji wijen\n1 lembar nori suwir"
    },
    steps: {
      en: "1. Spoon warm brown rice into a bowl.\n2. Steam the edamame 3 minutes.\n3. Arrange edamame, carrot and corn on the rice.\n4. Add the sliced avocado.\n5. Mix soy sauce with sesame oil and drizzle.\n6. Top with sesame seeds and nori.",
      id: "1. Sendokkan nasi merah hangat ke mangkuk.\n2. Kukus edamame 3 menit.\n3. Tata edamame, wortel dan jagung di atas nasi.\n4. Tambahkan irisan alpukat.\n5. Campur kecap asin dengan minyak wijen dan siram.\n6. Beri biji wijen dan nori."
    } },
  { id: "intl-b-20", emoji: "🥤", tint: "#C87000", kcal: 360, p: 14, c: 48, f: 12, types: ["vegetarian","high-protein"], q: "smoothie", cat: "Breakfast",
    nm: { en: "Banana Peanut Smoothie", id: "Smoothie Pisang Kacang" },
    ing: {
      en: "1 ripe banana\n2 tablespoons peanut butter\n250 millilitres milk\n2 tablespoons Greek yogurt\n1 teaspoon honey\n1 tablespoon rolled oats\nPinch of cinnamon\nFew ice cubes",
      id: "1 pisang matang\n2 sendok makan selai kacang\n250 mililiter susu\n2 sendok makan yogurt Yunani\n1 sendok teh madu\n1 sendok makan oat\nSejumput kayu manis\nBeberapa es batu"
    },
    steps: {
      en: "1. Peel the banana and break into chunks.\n2. Add banana and peanut butter to a blender.\n3. Pour in the milk and yogurt.\n4. Add honey, oats and cinnamon.\n5. Blend with ice until smooth.\n6. Pour into a tall glass and serve.",
      id: "1. Kupas pisang dan potong jadi beberapa bagian.\n2. Masukkan pisang dan selai kacang ke blender.\n3. Tuang susu dan yogurt.\n4. Tambahkan madu, oat dan kayu manis.\n5. Blender dengan es sampai halus.\n6. Tuang ke gelas tinggi dan sajikan."
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

  var IMG_CACHE_KEY = "my20fit_foodimg_v5"; // v5: jangan cache null (retry sampai foto AI siap) — reset cache
  function _imgCache(){ try { return JSON.parse(localStorage.getItem(IMG_CACHE_KEY) || "{}"); } catch(e){ return {}; } }
  function _saveImg(c){ try { localStorage.setItem(IMG_CACHE_KEY, JSON.stringify(c)); } catch(e){} }
  // Returns Promise<url|null>. Foto ASLI dari server /api/foodphoto: Pexels (kalau PEXELS_API_KEY
  // di-set) → TheMealDB (nama cocok) → null. Foto AI (OpenRouter/Gemini) SUDAH DIHAPUS: hasilnya
  // selalu blur/tak akurat (keterbatasan text-to-image, bukan bug). Kalau tak ada foto cocok → null
  // → biarkan placeholder rapi (BUKAN foto blur/salah). URL Pexels stabil (di-cache di server).
  function resolveImg(rec){
    if(!rec || !rec.id) return Promise.resolve(null);
    var c=_imgCache();
    if(c[rec.id]) return Promise.resolve(c[rec.id]); // hanya URL sukses yang di-cache
    // PENTING: JANGAN simpan null. Foto AI di-generate on-demand (butuh beberapa detik); kalau
    // percobaan pertama belum siap, biarkan RETRY di load berikutnya (jangan kunci jadi placeholder).
    function done(url){ if(url){ c=_imgCache(); c[rec.id]=url; _saveImg(c); } return url||null; }
    var q = rec.pq || (rec.nm && rec.nm.en) || rec.q || ""; // nama deskriptif (buat AI & Pexels)
    var mdb = rec.q || "";                                   // kata kunci pendek buat fallback TheMealDB (mis. "chicken")
    var desc = (rec.ing && rec.ing.en) ? String(rec.ing.en).replace(/\n/g, ", ") : ""; // bahan (biar AI tahu dish-nya)
    var tokP = (window.Auth && Auth.token) ? Promise.resolve(Auth.token()).catch(function(){return null;}) : Promise.resolve(null);
    return tokP.then(function(tok){
      var h = {}; if(tok) h["Authorization"] = "Bearer " + tok;
      return fetch("/api/foodphoto?id="+encodeURIComponent(rec.id)+"&q="+encodeURIComponent(q)+"&mdb="+encodeURIComponent(mdb)+"&desc="+encodeURIComponent(desc), { headers: h })
        .then(function(r){ return r.ok ? r.json() : null; })
        .then(function(j){ return done(j && j.ok && j.url ? j.url : null); })
        .catch(function(){ return done(null); });
    }).catch(function(){ return done(null); });
  }
  function _setBg(el, url){ if(!el||!url) return; el.style.backgroundImage = "url('" + url + "')"; el.classList.add("has-photo"); el.textContent = ""; }

  // Apply foto ke thumb/hero yang awalnya placeholder (gradient + emoji). Kalau tak ada foto asli
  // yang cocok -> biarkan placeholder rapi (BUKAN foto blur/salah).
  function applyThumb(el, rec){
    if(!el || !rec) return;
    resolveImg(rec).then(function(u){ _setBg(el, u); }).catch(function(){});
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
