-- Seed my20fit_recipe_official dari js/recipes.js — DIGENERATE oleh
-- scripts/gen-recipe-official-seed.js. Jangan edit tangan; regen kalо katalog statik berubah.
-- ON CONFLICT DO NOTHING: aman diulang, tak menimpa edit admin.

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('rice-chicken', 'Grilled Chicken Rice Bowl', 'Rice Bowl Ayam Panggang', 520, 45, 55, 12, ARRAY['normal','high-protein','halal']::text[], 'Chicken', 'chicken', 'protein', '#C41101', '150 g chicken breast
1 tbsp low-sodium soy sauce
1 tsp olive oil
1 clove garlic, minced
150 g steamed white rice
100 g mixed vegetables (broccoli, carrot)
1 tbsp light teriyaki sauce
1 tsp toasted sesame seeds', '150 g dada ayam
1 sdm kecap asin rendah garam
1 sdt minyak zaitun
1 siung bawang putih, cincang
150 g nasi putih kukus
100 g sayur campur (brokoli, wortel)
1 sdm saus teriyaki tipis
1 sdt wijen sangrai', '1. Pat the chicken breast dry, then slice horizontally into an even 1.5 cm thickness for faster, more even cooking.
2. Mince the garlic finely, then whisk it with the soy sauce and olive oil in a bowl.
3. Coat the chicken in the marinade and rest at room temperature for 10 minutes.
4. Rinse the rice, then steam over medium heat about 15 minutes until tender and fluffy.
5. Cut the broccoli into small florets and slice the carrot into thin 3 mm rounds.
6. Heat a grill pan over medium heat 1–2 minutes until a drop of water sizzles on contact.
7. Grill the chicken 6–8 minutes per side without pressing down, until golden and the center reaches 75°C (no pink remains).
8. Rest the chicken off the heat for 3 minutes, then slice against the grain into 1 cm strips.
9. Blanch the broccoli and carrot in simmering water 2–3 minutes until bright green and crisp-tender, then drain immediately.
10. Fluff the rice and spoon it into the bowl as the base.
11. Arrange the sliced chicken and blanched vegetables on top of the rice.
12. Drizzle the teriyaki sauce evenly over the chicken and vegetables.
13. Sprinkle the toasted sesame seeds on top and serve immediately while warm.', '1. Keringkan permukaan dada ayam dengan tisu dapur, lalu iris melintang setebal 1,5 cm agar matang lebih cepat dan merata.
2. Cincang halus bawang putih, lalu kocok rata dengan kecap asin dan minyak zaitun dalam mangkuk.
3. Lumuri ayam dengan bumbu marinasi, diamkan di suhu ruang selama 10 menit.
4. Cuci nasi lalu kukus dengan api sedang sekitar 15 menit sampai matang dan pulen.
5. Potong brokoli jadi kuntum kecil, iris wortel tipis setebal 3 mm.
6. Panaskan wajan grill dengan api sedang 1–2 menit sampai percikan air langsung mendesis.
7. Panggang ayam 6–8 menit tiap sisi tanpa ditekan, sampai permukaan kecokelatan dan bagian dalam mencapai 75°C (tidak ada bagian merah muda).
8. Istirahatkan ayam di luar wajan selama 3 menit, lalu iris melawan arah serat setebal 1 cm.
9. Blansir brokoli dan wortel di air mendidih 2–3 menit sampai hijau cerah dan masih renyah, langsung tiriskan.
10. Kepulkan nasi lalu sendokkan ke mangkuk saji sebagai alas.
11. Susun irisan ayam dan sayur blansir di atas nasi.
12. Siram saus teriyaki merata ke atas ayam dan sayur.
13. Taburi wijen sangrai, sajikan segera selagi hangat.', 1, 30, NULL, NULL, NULL, NULL, 0)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('beef-burger', 'Lean Beef Burger (whole-wheat)', 'Burger Sapi Lean (roti gandum)', 560, 38, 48, 22, ARRAY['normal','halal']::text[], 'Beef', 'burger', 'meal', '#C87000', '120 g lean ground beef (90/10)
1/2 tsp salt & pepper
1 whole-wheat burger bun
1 slice light cheese
2 leaves lettuce
2 slices tomato
2 slices red onion
1 tbsp light mayo or mustard', '120 g daging sapi giling lean (90/10)
1/2 sdt garam & merica
1 roti burger gandum
1 lembar keju rendah lemak
2 lembar selada
2 iris tomat
2 iris bawang bombai
1 sdm mayo ringan atau mustard', '1. Divide the ground beef into one portion and shape gently into a patty about 2 cm thick, slightly wider than the bun (it shrinks as it cooks).
2. Press a shallow dimple in the center of the patty with your thumb so it doesn''t puff up.
3. Season both sides evenly with the salt and pepper just before cooking.
4. Heat a dry, heavy skillet over medium-high heat for 2 minutes until very hot.
5. Lay the patty in the pan and sear undisturbed for 3–4 minutes until a deep brown crust forms underneath.
6. Flip once and cook the second side 3–4 minutes until the center reaches 71°C and juices run clear.
7. Lay the cheese on top during the last minute so it melts fully.
8. Slice the tomato into 5 mm rounds and the onion into thin rings while the patty cooks.
9. Toast the bun cut-side down in the same pan for 1 minute until lightly golden and crisp.
10. Spread the mayo or mustard on the base of the bun.
11. Layer the lettuce, tomato and onion on the bun base.
12. Set the patty with melted cheese on top of the vegetables.
13. Close the bun and serve immediately while the patty is hot.', '1. Bentuk daging sapi giling jadi satu patty setebal sekitar 2 cm, sedikit lebih lebar dari roti karena akan menyusut saat dimasak.
2. Tekan bagian tengah patty dengan ibu jari agar tidak menggembung saat dipanggang.
3. Bumbui kedua sisi dengan garam dan merica merata tepat sebelum dimasak.
4. Panaskan wajan berat tanpa minyak dengan api sedang-besar selama 2 menit sampai benar-benar panas.
5. Letakkan patty di wajan, panggang tanpa dibalik selama 3–4 menit sampai terbentuk kerak cokelat tua di bawahnya.
6. Balik sekali, masak sisi kedua 3–4 menit sampai bagian dalam mencapai 71°C dan cairan yang keluar bening.
7. Letakkan irisan keju di atas patty pada menit terakhir supaya meleleh sempurna.
8. Sambil menunggu, iris tomat setebal 5 mm dan bawang bombai jadi cincin tipis.
9. Panggang roti sisi dalam di wajan yang sama selama 1 menit sampai kecokelatan dan sedikit renyah.
10. Olesi mayo atau mustard di dasar roti.
11. Tata selada, tomat, dan bawang bombai di atas roti.
12. Letakkan patty berkeju di atas sayuran.
13. Tutup roti, sajikan segera selagi patty masih panas.', 1, 15, NULL, NULL, NULL, NULL, 1)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('chicken-burrito', 'Chicken Burrito', 'Burrito Ayam', 600, 40, 62, 20, ARRAY['normal','high-protein','halal']::text[], 'Chicken', 'burrito', 'meal', '#2A7A4F', '1 large whole-wheat tortilla
120 g chicken breast, diced
1 tsp olive oil
1/2 tsp cumin & paprika
100 g cooked brown rice
80 g black beans, drained
3 tbsp tomato salsa
2 tbsp shredded cheese', '1 tortilla gandum besar
120 g dada ayam, potong dadu
1 sdt minyak zaitun
1/2 sdt jinten & paprika bubuk
100 g nasi merah matang
80 g kacang hitam, tiriskan
3 sdm salsa tomat
2 sdm keju parut', '1. Pat the chicken dice dry with paper towel, then toss with cumin, paprika and a pinch of salt in a bowl.
2. Heat the olive oil in a pan over medium heat until it shimmers.
3. Add the chicken and sauté 5–6 minutes, stirring occasionally, until browned on the edges and no pink remains inside.
4. Meanwhile warm the brown rice and black beans in a small pot or microwave until heated through.
5. Warm the tortilla in a dry pan 15–20 seconds per side until soft and pliable so it won''t crack when rolled.
6. Lay the tortilla flat and spoon the rice down the center in a line, leaving a 4 cm border on each side.
7. Layer the black beans, cooked chicken, salsa and shredded cheese on top of the rice.
8. Fold the two shorter ends inward, then fold one long side over the filling and roll tightly away from you.
9. Place the burrito seam-side down in the same pan over medium heat and sear 1–2 minutes until the seam sets and lightly browns.
10. Slice in half on the diagonal and serve immediately while hot.', '1. Keringkan potongan dadu ayam dengan tisu dapur, lalu lumuri dengan jinten, paprika bubuk & sejumput garam.
2. Panaskan minyak zaitun di wajan api sedang sampai mengilap.
3. Masukkan ayam, tumis 5–6 menit sambil sesekali diaduk, sampai pinggirnya kecokelatan dan tidak ada bagian merah muda di dalam.
4. Sambil menunggu, hangatkan nasi merah & kacang hitam di panci kecil atau microwave sampai panas.
5. Hangatkan tortilla di wajan kering 15–20 detik tiap sisi sampai lentur supaya tidak retak saat digulung.
6. Bentangkan tortilla, sendokkan nasi memanjang di tengah, sisakan pinggir 4 cm tiap sisi.
7. Susun kacang hitam, ayam matang, salsa & keju parut di atas nasi.
8. Lipat kedua ujung pendek ke dalam, lalu lipat satu sisi panjang menutupi isian dan gulung padat menjauh dari badan.
9. Letakkan burrito sisi sambungan di bawah di wajan yang sama api sedang, panggang 1–2 menit sampai sambungan merekat & kecokelatan.
10. Potong dua secara diagonal, sajikan segera selagi panas.', 1, 20, NULL, NULL, NULL, NULL, 2)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('veggie-pizza', 'Thin-Crust Veggie Pizza', 'Pizza Sayur Tipis', 620, 26, 78, 22, ARRAY['normal','vegetarian']::text[], 'Vegetarian', 'pizza', 'meal', '#C87000', '1 thin whole-wheat pizza base (~120 g)
4 tbsp tomato pizza sauce
80 g part-skim mozzarella
1/2 bell pepper, sliced
40 g mushrooms, sliced
30 g red onion, sliced
handful of fresh basil
1 tsp olive oil', '1 base pizza gandum tipis (~120 g)
4 sdm saus tomat pizza
80 g mozzarella rendah lemak
1/2 paprika, iris
40 g jamur, iris
30 g bawang bombai, iris
segenggam daun basil segar
1 sdt minyak zaitun', '1. Preheat the oven to 220°C (fan) and place a baking tray or pizza stone inside to heat up.
2. Slice the bell pepper into thin strips, the mushrooms into thin slices, and the red onion into thin rings.
3. Lay the pizza base on a sheet of baking paper and spread the tomato sauce evenly with the back of a spoon, leaving a 1 cm border for the crust.
4. Scatter the mozzarella evenly over the sauce.
5. Arrange the bell pepper, mushrooms and onion over the cheese.
6. Drizzle lightly with olive oil.
7. Slide the pizza, still on its paper, onto the hot tray and bake 10–12 minutes until the crust is crisp and golden at the edges and the cheese is bubbling and lightly browned.
8. Remove from the oven and scatter fresh basil leaves over the top.
9. Slice into wedges and serve immediately while the cheese is still molten.', '1. Panaskan oven ke 220°C (fan), masukkan loyang atau batu pizza agar ikut panas.
2. Iris paprika tipis memanjang, jamur tipis, dan bawang bombai jadi cincin tipis.
3. Letakkan base pizza di atas kertas roti, ratakan saus tomat pakai punggung sendok, sisakan pinggir 1 cm untuk crust.
4. Taburi mozzarella merata di atas saus.
5. Susun paprika, jamur & bawang bombai di atas keju.
6. Perciki sedikit minyak zaitun.
7. Geser pizza beserta kertasnya ke loyang panas, panggang 10–12 menit sampai pinggir crust renyah kecokelatan & keju berbuih kecokelatan.
8. Angkat dari oven, taburi daun basil segar.
9. Potong jadi beberapa wedges, sajikan segera selagi keju masih meleleh.', 1, 18, NULL, NULL, NULL, NULL, 3)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('tuna-pasta', 'Tuna Tomato Pasta', 'Pasta Tuna Tomat', 550, 38, 70, 12, ARRAY['pescatarian','high-protein']::text[], 'Pasta', 'pasta', 'meal', '#2F6BFF', '90 g whole-wheat pasta (dry)
100 g canned tuna in water, drained
150 ml tomato passata
2 cloves garlic, minced
1 tsp olive oil
1/2 tsp chili flakes
fresh basil
salt & pepper to taste', '90 g pasta gandum (kering)
100 g tuna kaleng dalam air, tiriskan
150 ml saus tomat passata
2 siung bawang putih, cincang
1 sdt minyak zaitun
1/2 sdt cabai bubuk
basil segar
garam & merica secukupnya', '1. Bring a pot of generously salted water to a rolling boil.
2. Add the pasta and cook 9–11 minutes, stirring occasionally, until al dente (still slightly firm at the core); reserve 2 tbsp of the cooking water before draining.
3. Meanwhile mince the garlic finely.
4. Heat the olive oil in a pan over medium heat, add the garlic and sauté 30 seconds until fragrant but not browned.
5. Pour in the tomato passata and chili flakes, stir and bring to a gentle simmer 4–5 minutes until slightly thickened.
6. Flake the drained tuna into the sauce and warm through 1 minute without stirring too hard so it stays chunky.
7. Add the drained pasta to the pan and toss to coat, loosening the sauce with the reserved pasta water if it looks thick.
8. Season with salt and pepper to taste.
9. Tear fresh basil leaves over the top and serve immediately.', '1. Didihkan air bergaram banyak-banyak sampai mendidih penuh.
2. Masukkan pasta, rebus 9–11 menit sambil sesekali diaduk sampai al dente (masih sedikit kenyal di tengah); sisakan 2 sdm air rebusan sebelum ditiriskan.
3. Sambil menunggu, cincang halus bawang putih.
4. Panaskan minyak zaitun di wajan api sedang, masukkan bawang putih, tumis 30 detik sampai harum tapi belum kecokelatan.
5. Tuang passata & cabai bubuk, aduk, didihkan pelan 4–5 menit sampai agak mengental.
6. Suwir tuna tiris ke dalam saus, hangatkan 1 menit tanpa diaduk terlalu keras agar tetap berserat.
7. Masukkan pasta tiris ke wajan, aduk rata, encerkan dengan air rebusan tadi kalau saus terlihat kental.
8. Bumbui garam & merica sesuai selera.
9. Sobek daun basil segar di atasnya, sajikan segera.', 1, 20, NULL, NULL, NULL, NULL, 4)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('salmon-bowl', 'Salmon Teriyaki Bowl', 'Rice Bowl Salmon Teriyaki', 580, 42, 55, 20, ARRAY['pescatarian','high-protein']::text[], 'Seafood', 'salmon', 'fish', '#2F6BFF', '140 g salmon fillet
1 tsp olive oil
2 tbsp teriyaki sauce
150 g steamed rice
60 g edamame, shelled
1 sheet nori, sliced
1 tsp sesame seeds
1 spring onion, sliced', '140 g fillet salmon
1 sdt minyak zaitun
2 sdm saus teriyaki
150 g nasi kukus
60 g edamame, kupas
1 lembar nori, iris
1 sdt wijen
1 batang daun bawang, iris', '1. Pat the salmon fillet dry with paper towel and season both sides lightly with salt and pepper.
2. Heat the olive oil in a pan over medium-high heat until shimmering.
3. Place the salmon skin-side down and sear 4 minutes without moving it, until the skin is crisp and releases easily.
4. Flip and cook 2–3 minutes more until the flesh is opaque and flakes easily but the center is still slightly translucent.
5. Brush the teriyaki sauce over the salmon and let it bubble and glaze 30 seconds per side.
6. Meanwhile bring a small pot of water to the boil, add the edamame and boil 3 minutes, then drain.
7. Slice the nori into thin strips.
8. Spoon the steamed rice into a bowl as the base.
9. Place the glazed salmon on top of the rice alongside the edamame.
10. Garnish with nori strips, sesame seeds and sliced spring onion, then serve warm.', '1. Keringkan fillet salmon dengan tisu dapur, bumbui tipis garam & merica kedua sisi.
2. Panaskan minyak zaitun di wajan api sedang-besar sampai mengilap.
3. Letakkan salmon sisi kulit di bawah, panggang 4 menit tanpa digeser sampai kulit renyah & mudah terlepas.
4. Balik, masak 2–3 menit lagi sampai daging matang & mudah terbelah tapi tengahnya masih sedikit translusen.
5. Olesi saus teriyaki ke salmon, biarkan mendidih & mengilap 30 detik tiap sisi.
6. Sambil itu, didihkan air di panci kecil, masukkan edamame, rebus 3 menit, tiriskan.
7. Iris nori tipis-tipis.
8. Sendokkan nasi kukus ke mangkuk sebagai alas.
9. Letakkan salmon mengilap di atas nasi bersama edamame.
10. Taburi nori, wijen & daun bawang iris, sajikan hangat.', 1, 18, NULL, NULL, NULL, NULL, 5)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('tofu-stirfry', 'Tofu Veggie Stir-fry + Rice', 'Tumis Tahu Sayur + Nasi', 480, 24, 62, 14, ARRAY['vegan','vegetarian']::text[], 'Vegan', 'tofu', 'meal', '#2A7A4F', '150 g firm tofu, cubed
1 tbsp vegetable oil
120 g mixed veggies (broccoli, carrot, snap peas)
2 cloves garlic, minced
1 tsp grated ginger
2 tbsp soy sauce
130 g steamed rice
1 tsp sesame oil', '150 g tahu padat, potong dadu
1 sdm minyak sayur
120 g sayur campur (brokoli, wortel, kacang polong)
2 siung bawang putih, cincang
1 sdt jahe parut
2 sdm kecap asin
130 g nasi kukus
1 sdt minyak wijen', '1. Wrap the tofu block in paper towel, place a weight on top, and press 10 minutes to squeeze out excess water.
2. Cut the pressed tofu into 1.5 cm cubes.
3. Heat the vegetable oil in a wok or wide pan over medium-high heat.
4. Fry the tofu cubes 5–6 minutes, turning occasionally, until golden and lightly crisp on all sides, then remove and set aside.
5. Cut the broccoli into small florets, slice the carrot thinly, and trim the snap peas.
6. In the same pan, stir-fry the minced garlic and grated ginger 30 seconds until fragrant.
7. Add the mixed vegetables and stir-fry over high heat 3–4 minutes until crisp-tender and bright in color.
8. Return the fried tofu to the pan, add the soy sauce and sesame oil, and toss everything together 1 minute until glossy and evenly coated.
9. Spoon the steamed rice into a bowl and top with the tofu and vegetable stir-fry, serving immediately while hot.', '1. Bungkus tahu dengan tisu dapur, beri pemberat di atasnya, tekan 10 menit untuk keluarkan airnya.
2. Potong tahu yang sudah ditekan jadi dadu 1,5 cm.
3. Panaskan minyak sayur di wajan atau wajan datar besar api sedang-besar.
4. Goreng tahu 5–6 menit sambil sesekali dibalik, sampai keemasan & sedikit renyah di semua sisi, angkat, sisihkan.
5. Potong brokoli jadi kuntum kecil, iris wortel tipis, siangi kacang polong.
6. Di wajan yang sama, tumis bawang putih cincang & jahe parut 30 detik sampai harum.
7. Masukkan sayur campur, tumis api besar 3–4 menit sampai renyah & warnanya cerah.
8. Kembalikan tahu goreng ke wajan, tambah kecap asin & minyak wijen, aduk rata 1 menit sampai mengilap & tercampur rata.
9. Sendokkan nasi kukus ke mangkuk, beri tumisan tahu & sayur di atasnya, sajikan segera selagi panas.', 1, 25, NULL, NULL, NULL, NULL, 6)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('tempeh-bowl', 'Tempeh Rice Bowl', 'Rice Bowl Tempe', 500, 30, 58, 16, ARRAY['vegan','vegetarian','high-protein']::text[], 'Vegan', 'rice', 'veg', '#2A7A4F', '150 g tempeh, sliced
1 tbsp vegetable oil
2 tbsp sweet soy sauce (kecap manis)
1 clove garlic, minced
130 g steamed rice
80 g sautéed greens (kale/spinach)
2 tbsp sambal matah
1 tsp lime juice', '150 g tempe, iris
1 sdm minyak sayur
2 sdm kecap manis
1 siung bawang putih, cincang
130 g nasi kukus
80 g tumis sayur hijau (kale/bayam)
2 sdm sambal matah
1 sdt air jeruk nipis', '1. Slice the tempeh into thin pieces about 5 mm thick.
2. Heat the vegetable oil in a pan over medium heat.
3. Pan-fry the tempeh 3–4 minutes per side until deep golden and crisp at the edges.
4. Push the tempeh to one side, add the minced garlic to the empty space and sauté 20–30 seconds until fragrant.
5. Pour the sweet soy sauce over the tempeh and toss gently 1 minute until it thickens into a sticky glaze coating every piece.
6. In a separate pan, quickly sauté the greens with a pinch of salt over high heat 2 minutes until just wilted but still bright.
7. Spoon the steamed rice into a bowl as the base.
8. Arrange the glazed tempeh and sautéed greens over the rice.
9. Top with sambal matah and a squeeze of lime juice, then serve immediately.', '1. Iris tempe tipis-tipis sekitar 5 mm.
2. Panaskan minyak sayur di wajan api sedang.
3. Goreng tempe 3–4 menit tiap sisi sampai keemasan tua & renyah di pinggirnya.
4. Geser tempe ke satu sisi, masukkan bawang putih cincang ke ruang kosong, tumis 20–30 detik sampai harum.
5. Tuang kecap manis ke tempe, aduk perlahan 1 menit sampai mengental jadi glaze lengket yang melapisi tiap potongan.
6. Di wajan terpisah, tumis cepat sayur hijau dengan sejumput garam api besar 2 menit sampai layu tapi masih hijau cerah.
7. Sendokkan nasi kukus ke mangkuk sebagai alas.
8. Tata tempe mengilap & sayur tumis di atas nasi.
9. Beri sambal matah & perasan jeruk nipis, sajikan segera.', 1, 18, NULL, NULL, NULL, NULL, 7)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('egg-fried-rice', 'Veggie Egg Fried Rice', 'Nasi Goreng Telur Sayur', 520, 22, 68, 18, ARRAY['normal','vegetarian']::text[], 'Vegetarian', 'fried rice', 'meal', '#C87000', '2 eggs, beaten
150 g cold cooked rice (day-old)
1 tbsp vegetable oil
40 g green peas
40 g carrot, diced
40 g sweet corn
2 tbsp soy sauce
1 spring onion, sliced', '2 telur, kocok
150 g nasi dingin (nasi kemarin)
1 sdm minyak sayur
40 g kacang polong
40 g wortel, potong dadu
40 g jagung manis
2 sdm kecap asin
1 batang daun bawang, iris', '1. Dice the carrot into small 5 mm cubes.
2. Heat half the oil in a wok over medium heat, pour in the beaten eggs and scramble gently until just set but still soft, then remove and set aside.
3. Add the remaining oil to the wok and turn the heat to high.
4. Stir-fry the peas, carrot and corn 2–3 minutes until the carrot is crisp-tender.
5. Add the cold rice, breaking up any clumps with the back of the spatula, and fry 3 minutes over high heat until the grains separate and heat through.
6. Pour in the soy sauce around the edge of the wok and toss until every grain is evenly colored.
7. Return the scrambled egg to the wok and mix through gently to avoid breaking it up too much.
8. Scatter with sliced spring onion, toss once more, and serve immediately while hot.', '1. Potong wortel dadu kecil 5 mm.
2. Panaskan separuh minyak di wajan api sedang, tuang telur kocok, orak-arik perlahan sampai set tapi masih lembut, angkat, sisihkan.
3. Tambah sisa minyak ke wajan, naikkan api ke besar.
4. Tumis kacang polong, wortel & jagung 2–3 menit sampai wortel renyah.
5. Masukkan nasi dingin, pecahkan gumpalannya dengan punggung spatula, goreng 3 menit api besar sampai butirannya lepas & panas merata.
6. Tuang kecap asin di pinggir wajan, aduk sampai tiap butir nasi terwarnai rata.
7. Kembalikan telur orak-arik ke wajan, aduk perlahan supaya tidak terlalu hancur.
8. Taburi daun bawang iris, aduk sekali lagi, sajikan segera selagi panas.', 1, 15, NULL, NULL, NULL, NULL, 8)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('caesar-wrap', 'Chicken Caesar Wrap', 'Wrap Ayam Caesar', 470, 35, 40, 18, ARRAY['normal','high-protein']::text[], 'Chicken', 'wrap', 'meal', '#C41101', '1 whole-wheat wrap
120 g grilled chicken breast, sliced
60 g romaine lettuce, chopped
2 tbsp light caesar dressing
1 tbsp grated parmesan
2 tbsp croutons, crushed
black pepper to taste', '1 wrap gandum
120 g dada ayam panggang, iris
60 g selada romaine, cincang
2 sdm dressing caesar ringan
1 sdm parmesan parut
2 sdm crouton, remuk
merica hitam secukupnya', '1. Season the chicken breast lightly with salt and pepper and grill (or pan-sear) over medium heat 5–6 minutes per side until cooked through with no pink inside.
2. Rest the chicken 2 minutes, then slice into thin strips.
3. Roughly chop the romaine lettuce.
4. In a bowl, toss the romaine with the caesar dressing and grated parmesan until every leaf is lightly coated.
5. Warm the wrap in a dry pan 10–15 seconds per side to make it pliable and easier to roll.
6. Lay the wrap flat and pile the dressed romaine down the center.
7. Top with the sliced chicken and crushed croutons.
8. Season with a few cracks of black pepper.
9. Fold in the two ends, then roll tightly from one side to the other, keeping the filling compact.
10. Cut on the diagonal and serve right away while the wrap is still warm.', '1. Bumbui dada ayam tipis dengan garam & merica, panggang (atau tumis) api sedang 5–6 menit tiap sisi sampai matang & tidak ada bagian merah muda.
2. Diamkan ayam 2 menit, lalu iris tipis memanjang.
3. Cincang kasar selada romaine.
4. Dalam mangkuk, aduk romaine dengan dressing caesar & parmesan parut sampai tiap lembar terlapisi tipis.
5. Hangatkan wrap di wajan kering 10–15 detik tiap sisi agar lentur & mudah digulung.
6. Bentangkan wrap, tumpuk salad yang sudah dibumbui di tengah.
7. Beri ayam iris & crouton remuk di atasnya.
8. Bumbui dengan beberapa putaran merica hitam.
9. Lipat kedua ujungnya, lalu gulung padat dari satu sisi ke sisi lain, jaga isian tetap rapat.
10. Potong serong, sajikan segera selagi wrap masih hangat.', 1, 15, NULL, NULL, NULL, NULL, 9)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('beef-broccoli', 'Beef & Broccoli + Rice', 'Sapi Brokoli + Nasi', 540, 40, 58, 16, ARRAY['normal','high-protein','halal']::text[], 'Beef', 'beef', 'veg', '#2A7A4F', '120 g lean beef, thinly sliced
150 g broccoli florets
1 tbsp vegetable oil
2 cloves garlic, minced
1 tsp grated ginger
2 tbsp oyster/soy sauce
1 tsp cornstarch + 2 tbsp water
130 g steamed rice', '120 g sapi lean, iris tipis
150 g brokoli
1 sdm minyak sayur
2 siung bawang putih, cincang
1 sdt jahe parut
2 sdm saus tiram/kecap asin
1 sdt maizena + 2 sdm air
130 g nasi kukus', '1. Cut the broccoli into small florets.
2. Bring a pot of water to the boil, blanch the broccoli 2 minutes until bright green, then drain and set aside.
3. Slice the beef thinly against the grain if not already, for maximum tenderness.
4. Heat the oil in a wok over high heat until faintly smoking.
5. Sear the beef in a single layer 2 minutes, turning once, until just browned on the outside but still pink inside, then remove.
6. Lower the heat to medium, add the minced garlic and grated ginger, and stir-fry 30 seconds until fragrant.
7. Return the beef and broccoli to the wok along with the oyster/soy sauce, and toss to combine.
8. Stir the cornstarch into the water until smooth, pour into the wok, and toss over high heat 1 minute until the sauce thickens and coats everything glossy.
9. Spoon the steamed rice into a bowl and top with the beef and broccoli, serving immediately while hot.', '1. Potong brokoli jadi kuntum kecil.
2. Didihkan air, blansir brokoli 2 menit sampai hijau cerah, tiriskan, sisihkan.
3. Iris sapi tipis melawan arah serat bila belum, supaya paling empuk.
4. Panaskan minyak di wajan api besar sampai hampir berasap.
5. Tumis sapi selapis 2 menit, balik sekali, sampai kecokelatan di luar tapi masih merah muda di dalam, angkat.
6. Kecilkan api ke sedang, masukkan bawang putih cincang & jahe parut, tumis 30 detik sampai harum.
7. Kembalikan sapi & brokoli ke wajan bersama saus tiram/kecap, aduk rata.
8. Larutkan maizena ke air sampai halus, tuang ke wajan, aduk api besar 1 menit sampai saus mengental & melapisi semuanya mengilap.
9. Sendokkan nasi kukus ke mangkuk, beri sapi & brokoli di atasnya, sajikan segera selagi panas.', 1, 18, NULL, NULL, NULL, NULL, 10)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('keto-chicken-avo', 'Chicken Avocado Plate', 'Piring Ayam Alpukat', 520, 40, 10, 36, ARRAY['keto','low-carb','high-protein']::text[], 'Chicken', 'avocado', 'veg', '#2A7A4F', '150 g chicken thigh (boneless)
1 tbsp olive oil
1/2 avocado, sliced
60 g mixed leafy greens
5 cherry tomatoes
1 tbsp lemon juice
salt, pepper & paprika', '150 g paha ayam (tanpa tulang)
1 sdm minyak zaitun
1/2 alpukat, iris
60 g sayur daun hijau
5 tomat ceri
1 sdm air lemon
garam, merica & paprika', '1. Pat the chicken thigh dry and season both sides with salt, pepper and paprika.
2. Heat the olive oil in a pan over medium heat until shimmering.
3. Place the chicken presentation-side down and sear 5–6 minutes per side until deeply golden and crisp, and the center reaches 75°C with no pink remaining.
4. Rest the chicken 2 minutes off the heat, then slice into strips.
5. Halve the cherry tomatoes.
6. Slice the avocado just before serving to keep it from browning.
7. Arrange the mixed leafy greens and cherry tomato halves across the plate.
8. Add the sliced avocado and the sliced chicken on top.
9. Drizzle with lemon juice and a touch more olive oil, then serve immediately.', '1. Keringkan paha ayam, bumbui kedua sisi dengan garam, merica & paprika bubuk.
2. Panaskan minyak zaitun di wajan api sedang sampai mengilap.
3. Letakkan ayam sisi tampilan di bawah, panggang 5–6 menit tiap sisi sampai kecokelatan tua & renyah, bagian dalam mencapai 75°C tanpa bagian merah muda.
4. Istirahatkan ayam 2 menit di luar wajan, lalu iris memanjang.
5. Belah dua tomat ceri.
6. Iris alpukat tepat sebelum disajikan agar tidak menghitam.
7. Tata sayur daun hijau & tomat ceri belah di piring.
8. Tambahkan irisan alpukat & ayam iris di atasnya.
9. Siram air lemon & sedikit minyak zaitun, sajikan segera.', 1, 18, NULL, NULL, NULL, NULL, 11)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('yogurt-bowl', 'Greek Yogurt Protein Bowl', 'Bowl Protein Greek Yogurt', 380, 32, 40, 10, ARRAY['vegetarian','high-protein','low-carb']::text[], 'Breakfast', 'yogurt', 'meal', '#2F6BFF', '200 g plain greek yogurt
1 scoop (30 g) vanilla whey protein
80 g mixed berries
1 tbsp chia seeds
1 tsp honey
1 tbsp granola', '200 g greek yogurt plain
1 scoop (30 g) whey protein vanila
80 g buah beri campur
1 sdm biji chia
1 sdt madu
1 sdm granola', '1. Spoon the greek yogurt into a bowl and whisk in the whey protein powder until completely smooth with no lumps.
2. Scatter the mixed berries evenly over the top.
3. Sprinkle with chia seeds and granola.
4. Drizzle honey over everything in a thin stream.
5. Serve immediately while chilled, or refrigerate up to 30 minutes before eating.', '1. Sendokkan greek yogurt ke mangkuk, kocok bersama bubuk whey protein sampai benar-benar halus tanpa gumpalan.
2. Taburi buah beri campur merata di atasnya.
3. Beri biji chia & granola.
4. Siram madu tipis merata di atas semuanya.
5. Sajikan segera selagi dingin, atau simpan di kulkas maksimal 30 menit sebelum disantap.', 1, 0, 5, '[object Object]', '[object Object]', '[object Object]', 12)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('shrimp-fried-rice', 'Shrimp Fried Rice', 'Nasi Goreng Udang', 530, 34, 66, 14, ARRAY['pescatarian']::text[], 'Seafood', 'shrimp', 'fish', '#C87000', '120 g peeled shrimp
150 g cold cooked rice (day-old)
1 egg, beaten
1 tbsp vegetable oil
40 g green peas
40 g carrot, diced
2 cloves garlic, minced
2 tbsp soy sauce', '120 g udang kupas
150 g nasi dingin (nasi kemarin)
1 telur, kocok
1 sdm minyak sayur
40 g kacang polong
40 g wortel, potong dadu
2 siung bawang putih, cincang
2 sdm kecap asin', '1. Pat the shrimp dry with paper towel.
2. Dice the carrot into small cubes.
3. Heat the oil in a wok over medium-high heat, add the minced garlic and sauté 30 seconds until fragrant but not browned.
4. Add the shrimp and cook 2 minutes, turning once, until pink and just opaque, then push to the side of the wok.
5. Pour the beaten egg into the empty space and scramble gently until just set.
6. Add the peas and carrot, stir-fry 2 minutes until the carrot softens slightly.
7. Add the cold rice, breaking up clumps, and toss everything together over high heat 3 minutes until piping hot.
8. Pour in the soy sauce and toss until every grain is evenly colored and the shrimp and egg are distributed throughout.
9. Serve immediately while hot.', '1. Keringkan udang dengan tisu dapur.
2. Potong wortel dadu kecil.
3. Panaskan minyak di wajan api sedang-besar, masukkan bawang putih cincang, tumis 30 detik sampai harum tapi belum kecokelatan.
4. Masukkan udang, masak 2 menit sambil dibalik sekali, sampai merah muda & matang, geser ke tepi wajan.
5. Tuang telur kocok ke ruang kosong, orak-arik perlahan sampai set.
6. Tambah kacang polong & wortel, tumis 2 menit sampai wortel agak empuk.
7. Masukkan nasi dingin, pecahkan gumpalannya, aduk semua api besar 3 menit sampai panas merata.
8. Tuang kecap asin, aduk sampai tiap butir nasi terwarnai rata & udang-telur tersebar merata.
9. Sajikan segera selagi panas.', 1, 15, NULL, NULL, NULL, NULL, 13)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('buddha-bowl', 'Chickpea Buddha Bowl', 'Buddha Bowl Kacang Arab', 490, 20, 68, 14, ARRAY['vegan','vegetarian']::text[], 'Vegan', 'chickpea', 'veg', '#2A7A4F', '120 g cooked chickpeas
100 g cooked quinoa
100 g roasted vegetables (pumpkin, zucchini)
40 g shredded red cabbage
2 tbsp tahini
1 tbsp lemon juice
1 tsp olive oil
salt & cumin', '120 g kacang arab matang
100 g quinoa matang
100 g sayur panggang (labu, zukini)
40 g kol merah, serut
2 sdm tahini
1 sdm air lemon
1 sdt minyak zaitun
garam & jinten', '1. Preheat the oven to 200°C.
2. Cut the pumpkin and zucchini into bite-size 2 cm chunks.
3. Toss the chopped vegetables and cooked chickpeas with olive oil, salt and cumin on a baking tray, spreading them in a single layer.
4. Roast 20–25 minutes, turning halfway, until the edges are golden and the vegetables are tender when pierced with a fork.
5. Meanwhile shred the red cabbage thinly.
6. Whisk the tahini with the lemon juice and a splash of water, adding water gradually until you reach a pourable, smooth consistency.
7. Warm the cooked quinoa if needed.
8. Arrange the quinoa, roasted vegetables, roasted chickpeas and shredded cabbage in separate sections in a bowl.
9. Drizzle the tahini sauce over the top and serve.', '1. Panaskan oven ke 200°C.
2. Potong labu & zukini jadi dadu gigitan 2 cm.
3. Lumuri sayur potong & kacang arab matang dengan minyak zaitun, garam & jinten di loyang, ratakan selapis.
4. Panggang 20–25 menit, balik di tengah waktu, sampai pinggirnya keemasan & sayur empuk saat ditusuk garpu.
5. Sambil itu, serut kol merah tipis.
6. Kocok tahini dengan air lemon & sedikit air, tambahkan air bertahap sampai konsistensi bisa dituang & halus.
7. Hangatkan quinoa matang bila perlu.
8. Tata quinoa, sayur panggang, kacang arab panggang & kol serut per bagian di mangkuk.
9. Siram saus tahini di atasnya, sajikan.', 1, 30, NULL, NULL, NULL, NULL, 14)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('oats-pb', 'Overnight Oats PB & Banana', 'Overnight Oats Selai Kacang & Pisang', 420, 18, 58, 14, ARRAY['vegetarian']::text[], 'Breakfast', 'oats', 'veg', '#C87000', '60 g rolled oats
180 ml milk (or plant milk)
1 tbsp peanut butter
1/2 banana, sliced
1 tsp chia seeds
1 tsp honey
pinch of cinnamon', '60 g oat
180 ml susu (atau susu nabati)
1 sdm selai kacang
1/2 pisang, iris
1 sdt biji chia
1 sdt madu
sejumput kayu manis', '1. In a jar or container, combine the rolled oats, milk, chia seeds and a pinch of cinnamon, stirring well.
2. Swirl in the peanut butter, leaving light streaks rather than mixing it in completely.
3. Cover and refrigerate overnight, at least 6 hours, so the oats soften and absorb the liquid.
4. The next morning, stir well and loosen with a splash of extra milk if it looks too thick.
5. Slice the banana just before serving.
6. Top with the sliced banana, a drizzle of honey and an extra pinch of cinnamon.
7. Serve cold straight from the fridge, or let it sit at room temperature briefly if you prefer it less cold.', '1. Dalam toples atau wadah, campur oat, susu, biji chia & sejumput kayu manis, aduk rata.
2. Campurkan selai kacang, sisakan guratan tipis daripada tercampur sepenuhnya.
3. Tutup & simpan di kulkas semalaman, minimal 6 jam, sampai oat melunak & menyerap cairan.
4. Keesokan paginya, aduk rata, encerkan dengan sedikit tambahan susu bila terlalu kental.
5. Iris pisang tepat sebelum disajikan.
6. Beri irisan pisang, siraman madu & sejumput kayu manis tambahan di atasnya.
7. Sajikan dingin langsung dari kulkas, atau diamkan sebentar di suhu ruang bila suka yang tidak terlalu dingin.', 1, 10, NULL, NULL, NULL, NULL, 15)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('gado-gado', 'Gado-Gado (Indonesian Salad)', 'Gado-Gado', 900, 45, 61, 53, ARRAY['vegetarian','halal']::text[], 'Vegetarian', 'salad', 'veg', '#2A7A4F', '100 g long beans, cut into 5 cm pieces
50 g spinach
50 g bean sprouts
1 egg
60 g firm tofu
50 g tempeh
1/2 potato (~75 g)
60 g roasted peanuts, skinless
1 clove garlic
1-2 red finger chilies (adjust to taste)
1 tsp palm sugar, finely chopped
1/2 tbsp lime juice
1/4 tsp salt
3-4 tbsp warm water
Cooking oil as needed
2-3 pieces prawn crackers (krupuk)', '100 g kacang panjang, potong 5 cm
50 g bayam
50 g tauge
1 butir telur
60 g tahu putih
50 g tempe
1/2 buah kentang (~75 g)
60 g kacang tanah goreng, tanpa kulit
1 siung bawang putih
1-2 buah cabai merah keriting (sesuai selera pedas)
1 sdt gula merah, sisir halus
1/2 sdm air jeruk limau/nipis
1/4 sdt garam
3-4 sdm air hangat
Minyak goreng secukupnya
2-3 keping kerupuk', '1. Rinse the long beans and cut into 5 cm pieces; pick the spinach leaves; rinse the bean sprouts.
2. Bring water to a boil in a pot, blanch the long beans 2 minutes until bright green, remove, then blanch the spinach 30 seconds and bean sprouts 30 seconds separately -- drain all in a colander.
3. In another pot, boil the egg and potato together starting from cold water, then cook 10–12 minutes until the yolk is set and the potato is tender when pierced with a fork. Drain, peel the egg, cut into pieces.
4. Heat a little oil in a small pan over medium heat, fry the firm tofu 3–4 minutes per side until golden and slightly firm on the outside; cut the fried tofu and tempeh into bite-sized pieces.
5. Grind or pound the roasted peanuts, garlic, chili and salt into a slightly coarse paste (not as smooth as peanut butter) -- small bits of texture should still be felt.
6. Add the chopped palm sugar and lime juice to the paste, grind/pound a little more until combined and the color darkens slightly.
7. Thin the peanut sauce with warm water 1 tbsp at a time while stirring continuously, stop once it''s pourable but still clings to the back of a spoon.
8. Arrange the blanched vegetables, egg, potato, fried tofu and tempeh side by side on a serving plate.
9. Pour the peanut sauce evenly over the vegetables and sides.
10. Tuck krupuk crackers along the edge of the plate, serve immediately while the vegetables are still warm and crisp.', '1. Cuci bersih kacang panjang, potong sepanjang 5 cm; petik daun bayam; bilas tauge.
2. Didihkan air di panci, blansir kacang panjang 2 menit sampai warnanya hijau cerah, angkat, lalu blansir bayam 30 detik dan tauge 30 detik secara terpisah -- tiriskan semua di saringan.
3. Di panci lain, rebus telur & potongan kentang bersama air dingin sampai mendidih, lalu masak 10–12 menit sampai kuning telur matang & kentang empuk saat ditusuk garpu. Tiriskan, kupas telur, potong-potong.
4. Panaskan sedikit minyak di wajan kecil api sedang, goreng tahu putih 3–4 menit tiap sisi sampai keemasan & bagian luarnya sedikit kokoh; potong tahu goreng & tempe jadi ukuran gigitan.
5. Ulek atau blender kacang tanah goreng, bawang putih, cabai merah, dan garam sampai jadi pasta agak kasar (bukan sehalus selai) -- tekstur berbutir kecil masih terasa.
6. Tambahkan gula merah sisir & air jeruk limau ke pasta, ulek/blender sebentar lagi sampai tercampur rata dan warnanya sedikit lebih gelap.
7. Encerkan bumbu kacang dengan air hangat 1 sdm demi 1 sdm sambil terus diaduk, berhenti begitu kekentalannya bisa dituang tapi tetap menempel di punggung sendok.
8. Tata sayur blansir, telur, kentang, tahu & tempe goreng berdampingan di atas piring saji.
9. Siram bumbu kacang merata ke seluruh permukaan sayur dan lauk.
10. Selipkan kerupuk di sisi piring, sajikan segera selagi sayur masih hangat & renyah.', 1, 20, 10, '[object Object]', '[object Object]', '[object Object]', 16)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('nasi-pecel', 'Nasi Pecel (Rice with Peanut-Sauce Veggies)', 'Nasi Pecel', 480, 16, 62, 16, ARRAY['vegetarian','vegan']::text[], 'Vegetarian', 'vegetarian', 'meal', '#2A7A4F', '150 g steamed rice
100 g blanched vegetables (spinach, long beans, bean sprouts, cassava leaf)
1 slice fried tempeh
3 tbsp spicy peanut sauce (peanut, kaffir lime leaf, palm sugar, chili)
Basil leaves
Rempeyek cracker (optional)', '150 g nasi putih
100 g sayur rebus (bayam, kacang panjang, tauge, daun singkong)
1 iris tempe goreng
3 sdm sambal pecel (kacang, daun jeruk, gula merah, cabai)
Daun kemangi
Rempeyek (opsional)', '1. Bring a pot of water to the boil and blanch the spinach, long beans, bean sprouts and cassava leaf in batches, 2–3 minutes each, until just tender.
2. Drain the vegetables well and let them cool slightly.
3. Pan-fry the tempeh slice 2–3 minutes per side until golden and crisp at the edges.
4. Dissolve the peanut-sauce paste with warm water, stirring gradually until it reaches a pourable consistency.
5. Spoon the warm rice onto a plate as the base.
6. Arrange the blanched vegetables over the rice.
7. Pour the spicy peanut sauce generously over the vegetables.
8. Add the fried tempeh slice and a scatter of basil leaves.
9. Top with rempeyek crackers if using, and serve while the rice is still warm.', '1. Didihkan air, blansir bayam, kacang panjang, tauge & daun singkong bergantian, 2–3 menit tiap jenis, sampai empuk.
2. Tiriskan sayur, biarkan agak dingin.
3. Goreng irisan tempe 2–3 menit tiap sisi sampai keemasan & renyah di pinggirnya.
4. Larutkan sambal pecel dengan air hangat, aduk bertahap sampai konsistensinya bisa disiram.
5. Tata nasi hangat di piring sebagai alas.
6. Susun sayur blansir di atas nasi.
7. Siram sambal pecel banyak-banyak ke atas sayur.
8. Tambah tempe goreng & taburan daun kemangi.
9. Beri rempeyek bila suka, sajikan selagi nasi masih hangat.', 1, 20, NULL, NULL, NULL, NULL, 17)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('soto-ayam', 'Soto Ayam (Indonesian Chicken Soup)', 'Soto Ayam', 380, 30, 34, 12, ARRAY['normal','high-protein','halal']::text[], 'Chicken', 'chicken soup', 'meal', '#C87000', '120 g shredded boiled chicken
Clear turmeric-yellow chicken broth
50 g rice vermicelli
50 g bean sprouts
1/2 boiled egg
Sliced cabbage
Celery & fried shallots
Lime wedge', '120 g ayam rebus suwir
Kuah kaldu ayam kuning (kunyit)
50 g soun
50 g tauge
1/2 telur rebus
Kol iris
Seledri & bawang goreng
Jeruk nipis', '1. Place the chicken in a pot with water, sliced ginger, bruised lemongrass, crushed garlic and turmeric, and bring to a simmer.
2. Simmer gently 20–25 minutes, skimming off any foam, until the chicken is fully cooked and the broth turns a clear golden yellow.
3. Remove the chicken and let it cool slightly, then shred the meat off the bone with two forks.
4. Strain the broth to remove the aromatics and keep it warm over low heat.
5. Soak the rice vermicelli in hot water 5 minutes until softened, then drain.
6. Blanch the bean sprouts and sliced cabbage briefly, 30 seconds, then drain.
7. Halve the boiled egg.
8. Arrange the vermicelli, bean sprouts, cabbage, egg and shredded chicken in a serving bowl.
9. Ladle the hot broth over the top until everything is just covered.
10. Finish with chopped celery, fried shallots and a squeeze of lime, and serve immediately while hot.', '1. Rebus ayam bersama air, jahe iris, serai memar, bawang putih & kunyit, sampai mendidih.
2. Kecilkan api, rebus pelan 20–25 menit sambil sesekali dibuang buihnya, sampai ayam matang sempurna & kuah berwarna kuning bening.
3. Angkat ayam, biarkan agak dingin, lalu suwir dagingnya pakai dua garpu.
4. Saring kuah untuk buang bumbu aromatik, jaga tetap hangat di api kecil.
5. Rendam soun di air panas 5 menit sampai lunak, tiriskan.
6. Blansir tauge & kol iris sebentar 30 detik, tiriskan.
7. Belah dua telur rebus.
8. Tata soun, tauge, kol, telur & ayam suwir di mangkuk saji.
9. Siram kuah panas sampai hampir merendam semua isi.
10. Taburi seledri cincang, bawang goreng & peras jeruk nipis, sajikan segera selagi panas.', 1, 35, NULL, NULL, NULL, NULL, 18)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('bakwan-sayur', 'Baked Vegetable Bakwan (Fritters)', 'Bakwan Sayur (Panggang)', 250, 8, 30, 10, ARRAY['vegetarian','vegan']::text[], 'Vegetarian', 'vegetable fritter', 'veg', '#C87000', '80 g shredded cabbage
60 g grated carrot
40 g bean sprouts
2 tbsp sliced spring onion
40 g flour batter
1 clove garlic
Pinch of salt & pepper
1 tsp oil (brushed, then baked)', '80 g kol iris
60 g wortel parut
40 g tauge
2 sdm daun bawang
40 g adonan tepung
1 siung bawang putih
Sejumput garam & merica
1 sdt minyak (oles, lalu panggang)', '1. Preheat the oven (or air-fryer) to 200°C and line a tray with baking paper.
2. In a bowl, combine the shredded cabbage, grated carrot, bean sprouts, spring onion and minced garlic.
3. Sprinkle in the flour, salt and pepper, then add a little water gradually and mix into a thick, just-holding-together batter.
4. Scoop portions onto the lined tray and flatten gently into small patties about 1.5 cm thick.
5. Brush the tops lightly with oil.
6. Bake 15–18 minutes, flipping once halfway through and brushing the other side with a little more oil, until golden and crisp at the edges.
7. Check doneness by pressing the center — it should feel firm, not wet or doughy.
8. Serve warm with chili sauce on the side.', '1. Panaskan oven (atau air-fryer) ke 200°C, alasi loyang dengan kertas roti.
2. Dalam mangkuk, campur kol iris, wortel parut, tauge, daun bawang & bawang putih cincang.
3. Taburi tepung, garam & merica, lalu tambahkan sedikit air bertahap, aduk jadi adonan kental yang bisa menyatu.
4. Sendokkan adonan ke loyang, pipihkan lembut jadi bentuk bulat pipih setebal 1,5 cm.
5. Oles tipis minyak di permukaannya.
6. Panggang 15–18 menit, balik sekali di tengah waktu & oles sedikit minyak lagi di sisi lainnya, sampai keemasan & renyah di pinggirnya.
7. Cek kematangan dengan menekan bagian tengah — harus terasa padat, tidak basah atau lembek.
8. Sajikan hangat dengan saus sambal di sisinya.', 1, 25, NULL, NULL, NULL, NULL, 19)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-a-01', 'Nasi Goreng Kampung (Indonesian Fried Rice)', 'Nasi Goreng Kampung', 520, 22, 68, 18, ARRAY['normal','halal']::text[], 'Rice', 'rice', 'meal', '#C87000', '200 g cold cooked rice
1 egg
50 g chicken, diced
2 cloves garlic
1 shallot
1 tsp sweet soy sauce
1 tbsp oil
Sliced scallion and cucumber', '200 g nasi dingin
1 telur
50 g ayam, potong dadu
2 siung bawang putih
1 butir bawang merah
1 sdt kecap manis
1 sdm minyak
Daun bawang dan timun', '1. Dice the chicken into small 1 cm cubes.
2. Mince the garlic and slice the shallot thinly.
3. Heat the oil in a wok over medium heat, add the garlic and shallot, and sauté 1 minute until fragrant and lightly golden.
4. Push the aromatics to the side, pour in the beaten egg and scramble gently until just set, then mix through.
5. Add the chicken and cook 3–4 minutes, stirring occasionally, until browned and no pink remains inside.
6. Add the cold rice, breaking up any clumps with the back of the spatula.
7. Pour in the sweet soy sauce and stir-fry over high heat 3 minutes until every grain is evenly colored and hot throughout.
8. Toss once more to make sure everything is combined evenly.
9. Serve immediately with sliced scallion and cucumber on the side.', '1. Potong ayam dadu kecil 1 cm.
2. Cincang bawang putih, iris tipis bawang merah.
3. Panaskan minyak di wajan api sedang, masukkan bawang putih & bawang merah, tumis 1 menit sampai harum & sedikit keemasan.
4. Sisihkan bumbu ke tepi, tuang telur kocok, orak-arik perlahan sampai set, lalu aduk rata.
5. Masukkan ayam, masak 3–4 menit sambil sesekali diaduk, sampai kecokelatan & tidak ada bagian merah muda.
6. Masukkan nasi dingin, pecahkan gumpalannya dengan punggung spatula.
7. Tuang kecap manis, tumis api besar 3 menit sampai tiap butir nasi terwarnai rata & panas merata.
8. Aduk sekali lagi memastikan semua tercampur rata.
9. Sajikan segera dengan daun bawang & timun iris di sisinya.', 1, 15, NULL, NULL, NULL, NULL, 20)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-a-02', 'Nasi Uduk (Jakarta Coconut Rice)', 'Nasi Uduk', 480, 14, 62, 20, ARRAY['vegetarian','halal']::text[], 'Rice', 'rice', 'meal', '#C87000', '200 g rice
150 ml coconut milk
1 bay leaf
1 stalk lemongrass, bruised
2 kaffir lime leaves
1 tsp salt
100 g tempe, fried and sliced
1 egg, fried
Fried shallots to top', '200 g beras
150 ml santan
1 lembar daun salam
1 batang serai, memarkan
2 lembar daun jeruk
1 sdt garam
100 g tempe, goreng dan iris
1 telur, goreng
Bawang goreng untuk taburan', '1. Rinse the rice under running water until it runs mostly clear, then drain well.
2. Combine the rice, coconut milk, bay leaf, bruised lemongrass, kaffir lime leaves and salt in a rice cooker or pot.
3. Steam or cook until the liquid is absorbed and the rice is fluffy and fragrant, about 20 minutes.
4. Meanwhile pan-fry the tempeh slices 2–3 minutes per side until golden and crisp.
5. Fry the egg in the same pan 2–3 minutes until the white is set and the edges are lightly crisp.
6. Once the rice is done, fluff it gently with a fork and remove the bay leaf, lemongrass and lime leaves.
7. Spoon the fragrant rice onto a plate.
8. Top with the fried tempeh, fried egg and a generous scatter of fried shallots.
9. Serve warm immediately.', '1. Cuci beras di bawah air mengalir sampai agak bening, tiriskan.
2. Campur beras, santan, daun salam, serai memar, daun jeruk & garam di rice cooker atau panci.
3. Kukus atau masak sampai cairan terserap & nasi pulen harum, sekitar 20 menit.
4. Sambil itu, goreng irisan tempe 2–3 menit tiap sisi sampai keemasan & renyah.
5. Goreng telur di wajan yang sama 2–3 menit sampai putihnya set & pinggirnya sedikit renyah.
6. Setelah nasi matang, aduk lembut pakai garpu, buang daun salam, serai & daun jeruk.
7. Sendokkan nasi harum ke piring.
8. Beri tempe goreng, telur goreng & taburan bawang goreng banyak-banyak.
9. Sajikan hangat segera.', 1, 30, NULL, NULL, NULL, NULL, 21)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-a-03', 'Nasi Kuning (Turmeric Yellow Rice)', 'Nasi Kuning', 510, 14, 66, 18, ARRAY['vegetarian','halal']::text[], 'Rice', 'rice', 'meal', '#C87000', '200 g rice
150 ml coconut milk
1 tsp ground turmeric
1 stalk lemongrass, bruised
2 kaffir lime leaves
1 bay leaf
1 tsp salt
1 egg
Fried shallots to top', '200 g beras
150 ml santan
1 sdt kunyit bubuk
1 batang serai, memarkan
2 lembar daun jeruk
1 lembar daun salam
1 sdt garam
1 telur
Bawang goreng untuk taburan', '1. Rinse the rice until the water runs fairly clear, then drain.
2. Dissolve the ground turmeric in a little of the coconut milk so the color spreads evenly, set aside.
3. Put the rice into the rice cooker pot, pour in the remaining coconut milk and the turmeric mixture.
4. Add the bruised lemongrass, lime leaves, bay leaf and salt, stir briefly to combine.
5. Turn on the rice cooker and cook until it switches to "warm" mode.
6. Open the lid and fold the rice gently from the bottom so the coconut milk mixes through evenly without clumping.
7. Close the lid again and let it rest 5 minutes so the rice steams through fully and the yellow color turns even.
8. Meanwhile heat a little oil in a small pan over medium heat.
9. Fry the egg until the white is set and the edges turn crisp and golden, cooking the yolk to your liking.
10. Remove and discard the lemongrass, lime leaves and bay leaf from the rice.
11. Fluff the yellow rice onto a serving plate and place the fried egg on top.
12. Scatter fried shallots evenly over and serve while warm.', '1. Cuci beras sampai air bilasannya agak jernih, lalu tiriskan.
2. Larutkan kunyit bubuk dengan sedikit santan agar warnanya larut rata, sisihkan.
3. Masukkan beras ke panci rice cooker, tuang sisa santan dan larutan kunyit.
4. Tambahkan serai memarkan, daun jeruk, daun salam dan garam, aduk sebentar sampai rata.
5. Nyalakan rice cooker dan masak sampai tombol berpindah ke mode "warm".
6. Buka tutup, aduk nasi perlahan dari dasar panci agar santan tercampur merata dan tidak menggumpal.
7. Tutup kembali dan diamkan 5 menit agar nasi tanak sempurna dan warna kuningnya merata.
8. Sambil menunggu, panaskan sedikit minyak di wajan kecil dengan api sedang.
9. Goreng telur sampai bagian putih set dan pinggirnya renyah kecokelatan, sesuai selera kematangan kuning.
10. Angkat dan buang serai, daun jeruk dan daun salam dari nasi.
11. Kepulkan nasi kuning ke piring saji dan letakkan telur goreng di atasnya.
12. Taburi bawang goreng merata, sajikan selagi hangat.', 1, 30, NULL, NULL, NULL, NULL, 22)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-a-04', 'Nasi Liwet Sunda (Sundanese Savory Rice)', 'Nasi Liwet', 490, 16, 64, 17, ARRAY['pescatarian','halal']::text[], 'Rice', 'rice', 'meal', '#2A7A4F', '200 g rice
1 tbsp anchovies
3 cloves garlic, sliced
2 shallots, sliced
1 stalk lemongrass, bruised
2 bay leaves
1 tsp salt
250 ml water
Fried shallots to top', '200 g beras
1 sdm ikan teri
3 siung bawang putih, iris
2 butir bawang merah, iris
1 batang serai, memarkan
2 lembar daun salam
1 sdt garam
250 ml air
Bawang goreng untuk taburan', '1. Rinse the rice until the water runs fairly clear, drain and add to a heavy-bottomed pot with a lid.
2. Thinly slice the garlic and shallots, set aside.
3. Add the anchovies, garlic, shallots, bruised lemongrass, bay leaves and salt on top of the rice.
4. Pour in the water and stir gently so the seasonings spread evenly without breaking the rice grains.
5. Cook uncovered over medium heat until the water reduces and small steam holes appear on the surface.
6. Lower the heat, cover tightly and cook 10-12 minutes until the water is fully absorbed.
7. Turn off the heat and let the covered pot rest 10 minutes so the rice finishes steaming through on residual heat.
8. Uncover and fold the rice from the bottom with a wooden spoon until the seasonings and anchovies mix through evenly.
9. Taste and add more salt if needed.
10. Serve the savory rice warm, topped with fried shallots.', '1. Cuci beras sampai air bilasannya agak jernih, tiriskan dan masukkan ke panci bertutup tebal.
2. Iris tipis bawang putih dan bawang merah, sisihkan.
3. Tambahkan ikan teri, bawang putih, bawang merah, serai memarkan, daun salam dan garam ke atas beras.
4. Tuang air, aduk perlahan sampai bumbu tersebar rata tanpa mengaduk terlalu kuat agar beras tidak patah.
5. Masak dengan api sedang tanpa tutup sampai air menyusut dan permukaan beras terlihat berlubang-lubang kecil.
6. Kecilkan api, tutup panci rapat dan masak 10-12 menit sampai air benar-benar terserap.
7. Matikan api dan diamkan panci tertutup selama 10 menit agar nasi mengukus sempurna dengan uap sisa.
8. Buka tutup, aduk nasi dari dasar dengan sendok kayu sampai bumbu dan teri tercampur merata.
9. Cicipi dan tambahkan garam bila perlu.
10. Sajikan nasi liwet hangat ditaburi bawang goreng.', 1, 35, NULL, NULL, NULL, NULL, 23)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-a-05', 'Nasi Campur (Mixed Rice Plate)', 'Nasi Campur', 620, 28, 70, 24, ARRAY['normal','halal']::text[], 'Rice', 'rice', 'meal', '#C41101', '250 g cooked rice
100 g chicken, shredded
1 egg, boiled
50 g tempe, fried
2 tbsp sambal
1 tbsp sweet soy sauce
Handful of blanched vegetables
Fried shallots and crackers', '250 g nasi putih
100 g ayam, suwir
1 telur, rebus
50 g tempe, goreng
2 sdm sambal
1 sdm kecap manis
Segenggam sayuran rebus
Bawang goreng dan kerupuk', '1. Boil the chicken in enough water until tender, then remove and shred into rough strands.
2. Heat a little oil, add the shredded chicken and sweet soy sauce, cook over medium heat 3-4 minutes until the seasoning is absorbed and the chicken looks slightly glossy.
3. Slice the tempe about 5 mm thick, deep-fry in hot oil until golden and crisp at the edges, then drain.
4. Boil the egg in simmering water 9-10 minutes for a fairly firm yolk, cool, peel and halve.
5. Blanch the vegetables in boiling water 1-2 minutes until bright in color and still crisp, then drain.
6. Arrange the rice on a plate as the base.
7. Place the shredded chicken, fried tempe, boiled egg and blanched vegetables around the rice.
8. Spoon sambal onto one side of the plate.
9. Sprinkle fried shallots over and tuck crackers along the edge.
10. Serve right away while the rice and chicken are still warm.', '1. Rebus dada/daging ayam dalam air secukupnya sampai empuk, angkat dan suwir-suwir kasar.
2. Panaskan sedikit minyak, masukkan ayam suwir dan kecap manis, masak dengan api sedang 3-4 menit sampai bumbu meresap dan ayam agak mengilap.
3. Potong tempe setebal 5 mm, goreng dalam minyak panas sampai keemasan dan renyah di pinggir, tiriskan.
4. Rebus telur dalam air mendidih 9-10 menit untuk kematangan kuning agak padat, dinginkan, kupas dan belah dua.
5. Blansir sayuran di air mendidih 1-2 menit sampai berwarna cerah dan masih renyah, tiriskan.
6. Tata nasi putih di piring sebagai alas.
7. Susun ayam suwir, tempe goreng, telur rebus dan sayuran blansir di sekeliling nasi.
8. Beri sambal secukupnya di salah satu sisi piring.
9. Taburi bawang goreng dan letakkan kerupuk di pinggir piring.
10. Sajikan segera selagi nasi dan ayam masih hangat.', 1, 25, NULL, NULL, NULL, NULL, 24)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-a-06', 'Lontong Sayur (Rice Cake in Vegetable Curry)', 'Lontong Sayur', 430, 12, 58, 16, ARRAY['vegetarian','halal']::text[], 'Rice', 'rice', 'meal', '#2A7A4F', '2 rice cakes (lontong), sliced
100 g chayote, julienned
50 g long beans, cut
200 ml coconut milk
2 cloves garlic
2 shallots
1 tsp ground coriander
1 bay leaf
1 boiled egg', '2 buah lontong, iris
100 g labu siam, iris korek
50 g kacang panjang, potong
200 ml santan
2 siung bawang putih
2 butir bawang merah
1 sdt ketumbar bubuk
1 lembar daun salam
1 telur rebus', '1. Grind the garlic, shallots and ground coriander with a little water into a smooth paste.
2. Heat a little oil, saute the paste with the bay leaf over medium heat 2-3 minutes until fragrant and cooked through.
3. Cut the chayote into thin matchsticks and the long beans into 3 cm pieces.
4. Add the chayote and long beans to the pan, stir 1-2 minutes until slightly wilted.
5. Pour in the coconut milk gradually while stirring so it doesn''t split.
6. Cook over low heat, stirring occasionally, until it comes to a gentle simmer and the vegetables are tender, about 8-10 minutes.
7. Season with salt to taste, tasting and adjusting as needed.
8. Slice the lontong into 2 cm pieces and arrange in a serving bowl.
9. Halve the boiled egg.
10. Ladle the hot coconut vegetable curry over the lontong.
11. Top with the boiled egg and serve immediately.', '1. Haluskan bawang putih, bawang merah dan ketumbar bubuk dengan sedikit air jadi bumbu halus.
2. Panaskan sedikit minyak, tumis bumbu halus dan daun salam dengan api sedang 2-3 menit sampai harum dan warnanya matang.
3. Potong labu siam jadi korek api tipis, potong kacang panjang sepanjang 3 cm.
4. Masukkan labu siam dan kacang panjang ke tumisan, aduk 1-2 menit sampai layu.
5. Tuang santan sedikit demi sedikit sambil diaduk agar tidak pecah.
6. Masak dengan api kecil sambil sesekali diaduk sampai santan mendidih perlahan dan sayuran empuk, sekitar 8-10 menit.
7. Bumbui dengan garam secukupnya, cicipi dan sesuaikan rasa.
8. Iris lontong setebal 2 cm, tata di mangkuk saji.
9. Belah dua telur rebus.
10. Siramkan sayur santan panas ke atas lontong.
11. Letakkan telur rebus di atasnya dan sajikan segera.', 1, 25, NULL, NULL, NULL, NULL, 25)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-a-07', 'Ketoprak (Rice Cake and Tofu in Peanut Sauce)', 'Ketoprak', 520, 16, 62, 22, ARRAY['vegetarian','vegan','halal']::text[], 'Rice', 'tofu', 'veg', '#2A7A4F', '1 rice cake (lontong), sliced
100 g tofu, fried and cubed
50 g rice vermicelli, soaked
50 g bean sprouts, blanched
3 tbsp ground roasted peanuts
1 clove garlic
1 tsp sweet soy sauce
Emping crackers and fried shallots', '1 buah lontong, iris
100 g tahu, goreng dan potong dadu
50 g bihun, rendam
50 g tauge, seduh
3 sdm kacang tanah sangrai, haluskan
1 siung bawang putih
1 sdt kecap manis
Emping dan bawang goreng', '1. Grind the roasted peanuts with the garlic and a little water into a slightly coarse paste.
2. Stir the sweet soy sauce into the peanut paste, mixing well, and season with salt until the sweet-savory balance is right.
3. Thin the peanut sauce with a little warm water until it reaches a pourable consistency, set aside.
4. Soak the vermicelli in hot water 5-8 minutes until soft and pliable, then drain.
5. Blanch the bean sprouts in boiling water for just 30 seconds so they stay crisp, then drain.
6. Cut the fried tofu into 1.5 cm cubes.
7. Slice the lontong into 2 cm pieces.
8. Arrange the lontong, tofu, vermicelli and bean sprouts side by side on a serving plate.
9. Pour the peanut sauce evenly and generously over everything.
10. Sprinkle emping crackers and fried shallots on top.
11. Serve right away before the emping goes soft.', '1. Haluskan kacang tanah sangrai bersama bawang putih dan sedikit air sampai jadi pasta agak kasar.
2. Tambahkan kecap manis ke pasta kacang, aduk rata dan bumbui garam secukupnya sampai rasa manis-gurih seimbang.
3. Encerkan saus kacang dengan sedikit air hangat sampai kekentalannya pas untuk disiram, sisihkan.
4. Rendam bihun di air panas 5-8 menit sampai lunak dan lentur, tiriskan.
5. Seduh tauge di air mendidih 30 detik saja supaya tetap renyah, tiriskan.
6. Potong tahu goreng jadi dadu 1,5 cm.
7. Iris lontong setebal 2 cm.
8. Tata lontong, tahu, bihun dan tauge berdampingan di piring saji.
9. Siram saus kacang secara merata dan cukup banyak ke atas semua bahan.
10. Taburi emping dan bawang goreng di atasnya.
11. Sajikan segera sebelum emping melempem.', 1, 20, NULL, NULL, NULL, NULL, 26)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-a-08', 'Mie Goreng (Indonesian Fried Noodles)', 'Mie Goreng', 540, 20, 66, 20, ARRAY['normal','halal']::text[], 'Noodle', 'noodle', 'meal', '#C87000', '150 g yellow egg noodles
1 egg
50 g chicken, sliced
50 g cabbage, shredded
2 cloves garlic
1 tbsp sweet soy sauce
1 tbsp oil
Scallion and fried shallots', '150 g mie telur kuning
1 telur
50 g ayam, iris
50 g kol, iris
2 siung bawang putih
1 sdm kecap manis
1 sdm minyak
Daun bawang dan bawang goreng', '1. Boil the egg noodles in boiling water 1-2 minutes until soft but still slightly chewy, drain and rinse with cold water to stop them sticking.
2. Slice the chicken about 5 mm thick, shred the cabbage into thin strips, and mince the garlic.
3. Heat the oil in a wok or pan over medium-high heat until it shimmers.
4. Saute the minced garlic 30 seconds until fragrant and lightly golden.
5. Add the chicken, cooking with occasional stirring 3-4 minutes until fully cooked through with no pink remaining.
6. Push the chicken to the side of the wok, pour the egg into the center and scramble until half set.
7. Mix the chicken and egg together.
8. Add the cabbage and noodles, drizzle the sweet soy sauce evenly over.
9. Toss and stir-fry over high heat 2-3 minutes until the noodles are heated through and the cabbage wilts but still has some bite.
10. Taste and adjust the sweet soy sauce if needed.
11. Remove from heat, scatter scallion and fried shallots on top, and serve immediately while hot.', '1. Rebus mie telur di air mendidih 1-2 menit sampai lunak namun masih agak kenyal, tiriskan dan siram air dingin agar tidak lengket.
2. Iris tipis ayam setebal 5 mm, iris kol tipis memanjang, cincang halus bawang putih.
3. Panaskan minyak di wajan atau teflon dengan api sedang-besar sampai beriak.
4. Tumis bawang putih cincang 30 detik sampai harum dan sedikit keemasan.
5. Masukkan ayam, masak sambil sesekali diaduk 3-4 menit sampai matang merata dan tidak ada bagian merah muda.
6. Sisihkan ayam ke pinggir wajan, tuang telur ke tengah dan orak-arik sampai setengah matang.
7. Aduk ayam dan telur jadi satu.
8. Masukkan kol dan mie, tuang kecap manis merata.
9. Aduk dan tumis dengan api besar 2-3 menit sampai mie panas merata dan kol layu tapi masih ada tekstur renyah.
10. Cicipi dan sesuaikan kecap bila perlu.
11. Angkat, taburi daun bawang dan bawang goreng, sajikan segera selagi panas.', 1, 20, NULL, NULL, NULL, NULL, 27)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-a-09', 'Mie Rebus (Noodle Soup)', 'Mie Rebus', 420, 18, 58, 12, ARRAY['normal','halal']::text[], 'Noodle', 'noodle', 'meal', '#2F6BFF', '150 g yellow egg noodles
50 g chicken, sliced
2 baby bok choy
1 egg
2 cloves garlic
500 ml chicken broth
1 scallion, sliced
Fried shallots to top', '150 g mie telur kuning
50 g ayam, iris
2 buah sawi hijau
1 telur
2 siung bawang putih
500 ml kaldu ayam
1 batang daun bawang
Bawang goreng untuk taburan', '1. Mince the garlic finely and slice the chicken about 5 mm thick.
2. Heat a little oil in a pot, saute the garlic 30 seconds until fragrant.
3. Add the chicken, cook 2-3 minutes while stirring until it changes color.
4. Pour in the chicken broth and bring to a boil over medium-high heat.
5. Once boiling, add the egg noodles and cook 1-2 minutes until they start to soften.
6. Halve the bok choy lengthwise, add to the broth and cook 1 minute until wilted.
7. Lower the heat, crack the egg directly into the broth and let it sit undisturbed 1-2 minutes until the white sets.
8. Stir gently just once so the yolk breaks slightly but doesn''t fully scatter.
9. Taste the broth and season with salt or light soy sauce if needed.
10. Ladle into a serving bowl, making sure the noodles, chicken, bok choy and egg are spread evenly.
11. Scatter sliced scallion and fried shallots on top, serve hot.', '1. Cincang halus bawang putih, iris tipis ayam setebal 5 mm.
2. Panaskan sedikit minyak di panci, tumis bawang putih 30 detik sampai harum.
3. Masukkan ayam, masak 2-3 menit sambil diaduk sampai berubah warna.
4. Tuang kaldu ayam, didihkan dengan api sedang-besar.
5. Setelah mendidih, masukkan mie telur dan masak 1-2 menit sampai mulai lunak.
6. Belah bokcoy jadi dua memanjang, masukkan ke kuah dan masak 1 menit sampai layu.
7. Kecilkan api, pecahkan telur langsung ke kuah dan biarkan 1-2 menit tanpa diaduk sampai putihnya set.
8. Aduk perlahan sekali saja agar kuning telur sedikit pecah tapi tidak hancur semua.
9. Cicipi kuah dan bumbui garam atau kecap asin bila perlu.
10. Tuang ke mangkuk saji, pastikan mie, ayam, bokcoy dan telur tersebar merata.
11. Taburi daun bawang iris dan bawang goreng, sajikan panas.', 1, 20, NULL, NULL, NULL, NULL, 28)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-a-10', 'Bihun Goreng (Fried Rice Vermicelli)', 'Bihun Goreng', 470, 16, 64, 16, ARRAY['normal','halal']::text[], 'Noodle', 'noodle', 'meal', '#C87000', '150 g rice vermicelli, soaked
1 egg
50 g chicken, sliced
50 g cabbage, shredded
1 carrot, julienned
2 cloves garlic
1 tbsp sweet soy sauce
1 tbsp oil', '150 g bihun, rendam
1 telur
50 g ayam, iris
50 g kol, iris
1 wortel, iris korek
2 siung bawang putih
1 sdm kecap manis
1 sdm minyak', '1. Soak the vermicelli in warm water 8-10 minutes until soft and pliable, drain and cut into shorter lengths if needed.
2. Slice the chicken thin, shred the cabbage into strips, cut the carrot into matchsticks, and mince the garlic.
3. Heat the oil in a wok over medium-high heat.
4. Saute the garlic 30 seconds until fragrant.
5. Add the chicken, cook 3-4 minutes until cooked through, then push to the side of the wok.
6. Pour the egg into the center, scramble until cooked, then mix with the chicken.
7. Add the carrot and cabbage, stir 1-2 minutes over high heat until wilted but still crisp.
8. Add the vermicelli and sweet soy sauce, tossing gently so the noodles don''t break.
9. Stir-fry 2-3 minutes until the vermicelli is evenly coated and slightly dry at the edges of the wok.
10. Taste and adjust the sweet soy sauce or salt if needed.
11. Remove from heat and serve immediately while hot.', '1. Rendam bihun di air hangat 8-10 menit sampai lunak dan lentur, tiriskan dan potong-potong bila terlalu panjang.
2. Iris tipis ayam, iris kol memanjang, iris korek api wortel, cincang halus bawang putih.
3. Panaskan minyak di wajan dengan api sedang-besar.
4. Tumis bawang putih 30 detik sampai harum.
5. Masukkan ayam, masak 3-4 menit sampai matang merata, lalu sisihkan ke pinggir wajan.
6. Tuang telur ke tengah wajan, orak-arik sampai matang lalu campur dengan ayam.
7. Masukkan wortel dan kol, aduk 1-2 menit dengan api besar sampai layu tapi masih renyah.
8. Masukkan bihun dan kecap manis, aduk perlahan agar bihun tidak putus.
9. Tumis 2-3 menit sampai bihun tercampur rata dan sedikit kering di pinggir wajan.
10. Cicipi dan sesuaikan kecap atau garam bila perlu.
11. Angkat dan sajikan segera selagi panas.', 1, 20, NULL, NULL, NULL, NULL, 29)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-a-11', 'Kwetiau Goreng (Fried Flat Rice Noodles)', 'Kwetiau Goreng', 560, 22, 68, 20, ARRAY['normal','halal']::text[], 'Noodle', 'noodle', 'meal', '#C87000', '200 g flat rice noodles
1 egg
50 g chicken, sliced
50 g bean sprouts
1 baby bok choy
2 cloves garlic
1 tbsp sweet soy sauce
1 tbsp oil', '200 g kwetiau
1 telur
50 g ayam, iris
50 g tauge
1 buah sawi hijau
2 siung bawang putih
1 sdm kecap manis
1 sdm minyak', '1. Carefully separate the sheets of flat rice noodles so they don''t tear, set aside.
2. Slice the chicken thin, mince the garlic, and cut the bok choy into 2-3 pieces.
3. Heat the oil in a wok over high heat until it just starts to smoke lightly.
4. Saute the garlic 20-30 seconds until fragrant, without letting it burn.
5. Add the chicken, cook 3-4 minutes with stirring until cooked through evenly.
6. Push the chicken to the side of the wok, pour the egg into the center and scramble until half set.
7. Mix the chicken and egg together, then add the flat noodles and sweet soy sauce.
8. Toss quickly but gently over high heat so the noodles don''t clump or tear, about 2 minutes.
9. Add the bean sprouts and bok choy, stir-fry 1-2 minutes until wilted but still crisp.
10. Taste and add more sweet soy sauce or salt if needed.
11. Stir-fry briefly until everything is evenly hot, remove from heat and serve immediately.', '1. Pisahkan lembaran kwetiau dengan hati-hati agar tidak robek, sisihkan.
2. Iris tipis ayam, cincang halus bawang putih, potong bokcoy jadi 2-3 bagian.
3. Panaskan minyak di wajan dengan api besar sampai berasap tipis.
4. Tumis bawang putih 20-30 detik sampai harum, jangan sampai gosong.
5. Masukkan ayam, masak 3-4 menit sambil diaduk sampai matang merata.
6. Sisihkan ayam ke pinggir wajan, tuang telur ke tengah dan orak-arik sampai setengah matang.
7. Campurkan ayam dan telur, lalu masukkan kwetiau dan kecap manis.
8. Aduk perlahan tapi cepat dengan api besar agar kwetiau tidak menggumpal atau hancur, sekitar 2 menit.
9. Masukkan tauge dan bokcoy, tumis 1-2 menit sampai layu tapi masih renyah.
10. Cicipi dan tambahkan kecap atau garam bila perlu.
11. Tumis sebentar lagi sampai semua panas merata, angkat dan sajikan segera.', 1, 20, NULL, NULL, NULL, NULL, 30)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-a-12', 'Mie Ayam (Chicken Noodles)', 'Mie Ayam', 500, 26, 62, 16, ARRAY['normal','halal','high-protein']::text[], 'Noodle', 'noodle', 'meal', '#C41101', '150 g yellow egg noodles
100 g chicken, diced
2 cloves garlic
1 tbsp sweet soy sauce
1 tsp oyster-style sauce
2 baby bok choy
1 tsp sesame oil
Scallion and fried shallots', '150 g mie telur kuning
100 g ayam, potong dadu
2 siung bawang putih
1 sdm kecap manis
1 sdt saus tiram
2 buah sawi hijau
1 sdt minyak wijen
Daun bawang dan bawang goreng', '1. Cut the chicken breast into 1.5 cm cubes.
2. Mince the garlic finely.
3. Heat a little oil, saute the garlic 30 seconds until fragrant and lightly golden.
4. Add the chicken, cook over medium heat 4-5 minutes with occasional stirring.
5. Season with the sweet soy sauce and oyster-style sauce, stir to coat.
6. Cook until the chicken is tender, glazed, and the sauce reduces slightly, about 3-4 more minutes.
7. In a separate pot, boil the egg noodles in boiling water 1-2 minutes until cooked but still chewy.
8. Add the bok choy to the noodle water in the last 30 seconds until wilted, then drain together with the noodles.
9. Drizzle sesame oil over the noodles in the serving bowl and toss to coat so they don''t stick and pick up aroma.
10. Place the sesame-oiled noodles as the base and arrange the bok choy alongside.
11. Spoon the hot glazed chicken over the noodles.
12. Scatter sliced scallion and fried shallots on top, serve immediately.', '1. Potong dada ayam jadi dadu 1,5 cm.
2. Cincang halus bawang putih.
3. Panaskan sedikit minyak, tumis bawang putih 30 detik sampai harum dan sedikit keemasan.
4. Masukkan ayam, masak dengan api sedang 4-5 menit sambil sesekali diaduk.
5. Bumbui dengan kecap manis dan saus tiram, aduk rata.
6. Masak sampai ayam empuk, mengilap dan kuahnya sedikit mengental, sekitar 3-4 menit lagi.
7. Rebus mie telur di panci terpisah dengan air mendidih 1-2 menit sampai matang tapi masih kenyal.
8. Masukkan bokcoy ke air rebusan mie di 30 detik terakhir sampai layu, lalu tiriskan bersama mie.
9. Tuang minyak wijen ke mie di mangkuk saji, aduk rata agar tidak lengket dan beraroma.
10. Letakkan mie berminyak wijen sebagai alas, susun bokcoy di sampingnya.
11. Tuang ayam kecap panas di atas mie.
12. Taburi daun bawang iris dan bawang goreng, sajikan segera.', 1, 20, NULL, NULL, NULL, NULL, 31)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-a-13', 'Bubur Ayam (Chicken Rice Porridge)', 'Bubur Ayam', 350, 18, 50, 9, ARRAY['normal','halal']::text[], 'Breakfast', 'porridge', 'meal', '#2F6BFF', '100 g rice
800 ml chicken broth
100 g chicken, shredded
1 tbsp sweet soy sauce
1 scallion, sliced
Fried shallots and crackers
1 tsp salt
Crispy soybeans to top', '100 g beras
800 ml kaldu ayam
100 g ayam, suwir
1 sdm kecap manis
1 batang daun bawang
Bawang goreng dan kerupuk
1 sdt garam
Kedelai goreng untuk taburan', '1. Rinse the rice until the water runs fairly clear.
2. Add the rice to a pot, pour in the chicken broth, stir briefly.
3. Bring to a boil over medium heat, then lower the heat once boiling.
4. Cook with occasional stirring so the rice doesn''t stick and scorch on the bottom of the pot.
5. Cook 25-30 minutes until the rice breaks down into a smooth, thick porridge.
6. Add water gradually if the porridge gets too thick before it''s fully cooked.
7. Season with salt to taste, tasting and adjusting.
8. Shred the chicken roughly with a fork if not already shredded.
9. Ladle the hot porridge into a serving bowl.
10. Place the shredded chicken on top.
11. Drizzle a little sweet soy sauce and scatter sliced scallion, fried shallots and crispy soybeans over.
12. Serve hot with crackers on the side of the bowl.', '1. Cuci beras sampai air bilasannya agak jernih.
2. Masukkan beras ke panci, tuang kaldu ayam, aduk sebentar.
3. Didihkan dengan api sedang, lalu kecilkan api begitu mendidih.
4. Masak sambil sesekali diaduk agar beras tidak menempel dan gosong di dasar panci.
5. Masak 25-30 menit sampai beras pecah dan teksturnya jadi bubur halus dan kental.
6. Tambahkan air sedikit demi sedikit bila bubur terlalu kental sebelum matang sempurna.
7. Bumbui dengan garam secukupnya, cicipi dan sesuaikan.
8. Suwir ayam kasar dengan garpu bila belum tersuwir.
9. Tuang bubur panas ke mangkuk saji.
10. Letakkan ayam suwir di atasnya.
11. Siram sedikit kecap manis dan taburi daun bawang iris, bawang goreng dan kedelai goreng.
12. Sajikan panas dengan kerupuk di pinggir mangkuk.', 1, 35, NULL, NULL, NULL, NULL, 32)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-a-14', 'Nasi Ayam Geprek (Smashed Fried Chicken Rice)', 'Nasi Ayam Geprek', 640, 34, 68, 26, ARRAY['normal','halal','high-protein']::text[], 'Chicken', 'chicken', 'protein', '#C41101', '250 g cooked rice
1 chicken thigh fillet
3 tbsp flour
5 birds eye chilies
3 cloves garlic
1 tsp salt
1 tbsp oil for frying
Cucumber slices', '250 g nasi putih
1 potong paha ayam fillet
3 sdm tepung terigu
5 buah cabai rawit
3 siung bawang putih
1 sdt garam
1 sdm minyak untuk menggoreng
Irisan timun', '1. Pat the chicken thigh fillet dry with paper towels, then cut it in half if too thick so it cooks evenly.
2. Season the chicken with a little salt and let it sit 5 minutes.
3. Coat the chicken evenly in flour, pressing so it sticks into every crevice.
4. Heat the oil in a pan over medium heat until hot enough for shallow-frying.
5. Fry the chicken 4-5 minutes per side until golden, crisp and cooked through with no pink remaining, then drain.
6. Pound the garlic and bird''s eye chilies with a little salt into a coarse, textured sambal, not a smooth paste.
7. Taste the sambal and adjust the heat or salt level.
8. Place the still-warm fried chicken on top of the sambal in a mortar or bowl.
9. Smash the chicken with the pestle until slightly broken up and mixed through the sambal, without turning it to mush.
10. Slice the cucumber thin for garnish.
11. Serve the smashed chicken over warm rice with the cucumber slices alongside.', '1. Keringkan permukaan fillet ayam dengan tisu dapur, lalu potong jadi 2 bagian jika terlalu tebal agar matang merata.
2. Bumbui ayam dengan sedikit garam, diamkan 5 menit.
3. Balur ayam dengan tepung terigu secara merata, tekan-tekan agar tepung menempel sampai ke sela-sela.
4. Panaskan minyak di wajan dengan api sedang sampai cukup panas untuk menggoreng dangkal.
5. Goreng ayam 4-5 menit tiap sisi sampai keemasan, renyah dan matang merata di bagian dalam (tidak ada bagian merah muda), lalu tiriskan.
6. Ulek bawang putih dan cabai rawit dengan sedikit garam sampai jadi sambal agak kasar, bertekstur, bukan halus lembut.
7. Cicipi sambal dan sesuaikan tingkat pedas atau garamnya.
8. Letakkan ayam goreng yang masih hangat di atas sambal dalam cobek atau mangkuk.
9. Geprek ayam dengan ulekan sampai sedikit hancur dan tercampur rata dengan sambal, jangan sampai jadi bubur.
10. Iris timun tipis untuk pelengkap.
11. Sajikan ayam geprek di atas nasi hangat dengan irisan timun di sampingnya.', 1, 25, NULL, NULL, NULL, NULL, 33)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-a-15', 'Nasi Bakar (Grilled Rice Parcel)', 'Nasi Bakar', 480, 18, 62, 16, ARRAY['normal','halal']::text[], 'Rice', 'rice', 'meal', '#2A7A4F', '250 g cooked rice
80 g chicken, minced
1 tbsp anchovies
2 cloves garlic
2 shallots
2 kaffir lime leaves
1 tsp salt
Banana leaf for wrapping', '250 g nasi putih
80 g ayam, cincang
1 sdm ikan teri
2 siung bawang putih
2 butir bawang merah
2 lembar daun jeruk
1 sdt garam
Daun pisang untuk membungkus', '1. Mince the garlic and shallots finely, and thinly slice the lime leaves with the center rib removed.
2. Heat a little oil, saute the garlic, shallots and lime leaves over medium heat 2-3 minutes until fragrant and softened.
3. Add the minced chicken, cooking while stirring and breaking it up 4-5 minutes until fully cooked with no pink remaining.
4. Add the anchovies, cook 1-2 more minutes until well combined, then season with salt.
5. Remove the filling from the heat and let it cool slightly so it doesn''t affect the rice texture.
6. Mix the filling into the warm cooked rice, stirring until the seasoning spreads evenly.
7. Pass the banana leaf briefly over a low flame to soften it so it doesn''t tear when folded.
8. Divide the seasoned rice into portions and place each in the center of a piece of banana leaf.
9. Fold the banana leaf tightly around the rice, securing the ends with a toothpick or skewer.
10. Grill the parcels on a flat pan or low-medium coals, turning every 3-4 minutes for 12-15 minutes until the leaf wilts, browns and releases its aroma.
11. Remove and open the parcels slightly to let the steam escape before serving.
12. Serve the grilled rice parcels warm, straight from the leaf.', '1. Cincang halus bawang putih dan bawang merah, iris tipis daun jeruk buang tulang tengahnya.
2. Panaskan sedikit minyak, tumis bawang putih, bawang merah dan daun jeruk dengan api sedang 2-3 menit sampai harum dan layu.
3. Masukkan ayam cincang, masak sambil diaduk-aduk dan dipecah-pecah 4-5 menit sampai matang merata dan tidak ada bagian merah muda.
4. Masukkan ikan teri, masak 1-2 menit lagi sampai tercampur rata, lalu bumbui dengan garam.
5. Angkat isian dan biarkan sedikit dingin agar tidak merusak tekstur nasi.
6. Campur isian ke dalam nasi putih hangat, aduk rata sampai bumbu tersebar merata.
7. Lemaskan daun pisang sebentar di atas api kecil agar tidak mudah sobek saat dilipat.
8. Bagi nasi berbumbu jadi beberapa porsi, letakkan di tengah daun pisang.
9. Lipat daun pisang rapat membungkus nasi, semat ujungnya dengan tusuk gigi atau lidi.
10. Panggang bungkusan di wajan datar atau bara api kecil-sedang, bolak-balik setiap 3-4 menit selama 12-15 menit sampai daun pisang layu, kecokelatan dan aromanya harum menguar.
11. Angkat, buka sedikit bungkusan agar uap keluar sebelum disajikan.
12. Sajikan nasi bakar hangat langsung dari bungkus daunnya.', 1, 30, NULL, NULL, NULL, NULL, 34)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-a-16', 'Nasi Timbel (Sundanese Wrapped Rice)', 'Nasi Timbel', 460, 16, 60, 16, ARRAY['vegetarian','halal']::text[], 'Rice', 'rice', 'meal', '#2A7A4F', '250 g hot cooked rice
100 g tofu, fried
80 g tempe, fried
2 tbsp sambal
Handful of fresh vegetables
1 stalk lemon basil
1 tsp salt
Banana leaf for wrapping', '250 g nasi panas
100 g tahu, goreng
80 g tempe, goreng
2 sdm sambal
Segenggam lalapan segar
1 batang kemangi
1 sdt garam
Daun pisang untuk membungkus', '1. Pass the banana leaf briefly over a low flame so it becomes pliable and won''t tear.
2. Wrap the hot rice tightly in the banana leaf while it''s still steaming.
3. Fold both ends of the leaf and press lightly so the parcel holds a compact shape.
4. Let the wrapped rice rest 5-10 minutes so it absorbs the leaf''s aroma and the trapped heat makes the rice more tender.
5. Meanwhile, cut the tofu and tempe about 1 cm thick.
6. Heat oil in a pan over medium heat, fry the tofu and tempe 3-4 minutes per side until golden and crisp outside, then drain.
7. Wash the fresh vegetables and lemon basil, drain well.
8. Spoon the sambal into a small bowl, adding a little salt if needed.
9. Unwrap the rice parcel onto a serving plate.
10. Arrange the tofu, fried tempe, fresh vegetables and lemon basil around the rice.
11. Serve with the sambal on the side, eat while still warm.', '1. Lemaskan daun pisang sebentar di atas api kecil agar lentur dan tidak sobek.
2. Bungkus nasi panas rapat dengan daun pisang selagi masih mengepul.
3. Lipat kedua ujung daun dan tekan sedikit agar bentuknya padat.
4. Diamkan bungkusan nasi 5-10 menit supaya menyerap aroma daun dan uap panasnya membuat nasi lebih pulen.
5. Sambil menunggu, potong tahu dan tempe setebal 1 cm.
6. Panaskan minyak di wajan dengan api sedang, goreng tahu dan tempe 3-4 menit tiap sisi sampai keemasan dan renyah di luar, tiriskan.
7. Cuci bersih lalapan segar dan kemangi, tiriskan.
8. Siapkan sambal di mangkuk kecil, tambahkan sedikit garam bila perlu.
9. Buka bungkusan nasi timbel ke piring saji.
10. Susun tahu, tempe goreng, lalapan dan kemangi di sekeliling nasi.
11. Sajikan dengan sambal di sisi piring, santap selagi hangat.', 1, 20, NULL, NULL, NULL, NULL, 35)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-a-17', 'Nasi Goreng Seafood (Seafood Fried Rice)', 'Nasi Goreng Seafood', 540, 26, 66, 18, ARRAY['pescatarian','halal']::text[], 'Rice', 'seafood', 'fish', '#2F6BFF', '200 g cold cooked rice
60 g peeled shrimp
40 g squid rings
1 egg
2 cloves garlic
1 tbsp oyster-style sauce
1 tbsp oil
Scallion and cucumber', '200 g nasi dingin
60 g udang kupas
40 g cumi, potong cincin
1 telur
2 siung bawang putih
1 sdm saus tiram
1 sdm minyak
Daun bawang dan timun', '1. Make sure the rice is cold and the grains are separate so it doesn''t clump when fried.
2. Mince the garlic finely.
3. Heat the oil in a wok or pan over high heat until it just starts to smoke lightly.
4. Saute the garlic 20-30 seconds until fragrant.
5. Add the shrimp and squid, cook 2-3 minutes while stirring until they turn opaque and curl slightly (don''t overcook or they''ll turn rubbery).
6. Push the shrimp and squid to the side of the wok, pour the egg into the center and scramble until half set.
7. Mix the egg together with the shrimp and squid.
8. Add the rice, breaking up any clumps with a spatula while stirring.
9. Pour in the oyster-style sauce, toss over high heat 2-3 minutes until the rice is heated through and slightly dry at the edges.
10. Taste and adjust the salt if needed.
11. Remove from heat, scatter sliced scallion over.
12. Serve with cucumber slices alongside.', '1. Pastikan nasi sudah dingin dan butirannya terpisah agar tidak menggumpal saat digoreng.
2. Cincang halus bawang putih.
3. Panaskan minyak di wajan atau teflon dengan api besar sampai berasap tipis.
4. Tumis bawang putih 20-30 detik sampai harum.
5. Masukkan udang dan cumi, masak 2-3 menit sambil diaduk sampai warnanya berubah opak dan sedikit melengkung (jangan terlalu lama agar tidak alot).
6. Sisihkan udang dan cumi ke pinggir wajan, tuang telur ke tengah dan orak-arik sampai setengah matang.
7. Campurkan telur dengan udang dan cumi.
8. Masukkan nasi, pecahkan gumpalan dengan spatula sambil diaduk.
9. Tuang saus tiram, aduk rata dengan api besar 2-3 menit sampai nasi panas merata dan sedikit kering di pinggir.
10. Cicipi dan sesuaikan garam bila perlu.
11. Angkat, taburi daun bawang iris.
12. Sajikan dengan irisan timun di sampingnya.', 1, 15, NULL, NULL, NULL, NULL, 36)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-a-18', 'Nasi Ulam (Herbed Rice)', 'Nasi Ulam', 440, 14, 60, 14, ARRAY['pescatarian','halal']::text[], 'Rice', 'rice', 'meal', '#2A7A4F', '250 g cooked rice
2 tbsp grated toasted coconut
1 tbsp anchovies, fried
2 kaffir lime leaves, sliced thin
1 stalk lemon basil, chopped
1 tsp fried shallots
1 tsp salt
1 red chili, sliced', '250 g nasi putih
2 sdm kelapa parut sangrai
1 sdm ikan teri, goreng
2 lembar daun jeruk, iris halus
1 batang kemangi, cincang
1 sdt bawang goreng
1 sdt garam
1 buah cabai merah, iris', '1. Toast the grated coconut in a dry pan over low-medium heat, stirring constantly 5-7 minutes until golden and fragrant, then remove and let it cool.
2. Heat a little oil, fry the anchovies over medium heat 2-3 minutes until dry and crisp, then drain.
3. Thinly slice the lime leaves (center rib removed), roughly chop the lemon basil, and thinly slice the red chili.
4. Make sure the rice is still warm so it absorbs the seasoning more easily.
5. Mix the warm rice with the toasted coconut, stirring by hand or with a wooden spoon until the coconut coats every grain.
6. Add the sliced lime leaves and chopped basil, stir to combine.
7. Add the fried anchovies, sliced chili and salt.
8. Toss everything together until evenly combined and lightly browned from the toasted coconut.
9. Taste and adjust the salt if needed.
10. Transfer to a serving plate and scatter fried shallots on top.
11. Serve immediately while the rice is still warm and fragrant.', '1. Sangrai kelapa parut di wajan kering tanpa minyak dengan api kecil-sedang, aduk terus 5-7 menit sampai keemasan dan aromanya harum, lalu angkat dan biarkan dingin.
2. Panaskan sedikit minyak, goreng ikan teri dengan api sedang 2-3 menit sampai kering dan renyah, tiriskan.
3. Iris tipis daun jeruk (buang tulang tengah), cincang kasar kemangi, iris tipis cabai merah.
4. Pastikan nasi masih hangat agar bumbu lebih mudah meresap.
5. Campur nasi hangat dengan kelapa sangrai, aduk rata dengan tangan atau sendok kayu sampai kelapa menempel ke tiap butir nasi.
6. Tambahkan daun jeruk iris dan kemangi cincang, aduk rata.
7. Masukkan teri goreng, cabai iris dan garam.
8. Aduk semua bahan sampai tercampur merata dan warnanya kecokelatan dari kelapa sangrai.
9. Cicipi dan sesuaikan garam bila perlu.
10. Pindahkan ke piring saji, taburi bawang goreng di atasnya.
11. Sajikan segera selagi nasi masih hangat dan aromanya masih kuat.', 1, 20, NULL, NULL, NULL, NULL, 37)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-a-19', 'Mie Kocok Bandung (Beef Noodle Soup)', 'Mie Kocok', 470, 24, 52, 16, ARRAY['normal','halal','high-protein']::text[], 'Noodle', 'noodle', 'meal', '#C41101', '150 g flat egg noodles
80 g beef tendon, boiled
50 g bean sprouts
600 ml beef broth
2 cloves garlic
1 tsp ground pepper
1 scallion, sliced
Fried shallots and lime', '150 g mie pipih
80 g kikil sapi, rebus
50 g tauge
600 ml kaldu sapi
2 siung bawang putih
1 sdt lada bubuk
1 batang daun bawang
Bawang goreng dan jeruk nipis', '1. Boil the beef tendon in plenty of water over medium heat 45-60 minutes (or 20 minutes in a pressure cooker) until very tender and softly chewy, not tough.
2. Remove the tendon, drain and slice thinly into strips about 5 mm thick.
3. Mince the garlic finely.
4. Heat a little oil, saute the garlic 30 seconds until fragrant, then add it to the beef broth.
5. Bring the broth to a boil over medium heat, season with ground pepper and salt to taste.
6. Taste the broth and adjust until the savory balance is right.
7. In a separate pot, blanch the flat noodles in boiling water 1-2 minutes until soft, then drain.
8. Blanch the bean sprouts briefly 20-30 seconds in the same boiling water, drain so they stay crisp.
9. Arrange the noodles and bean sprouts at the bottom of a serving bowl.
10. Layer the sliced tendon on top of the noodles.
11. Ladle the hot broth over until it covers everything.
12. Scatter sliced scallion and fried shallots on top, serve with lime on the side.', '1. Rebus kikil sapi dalam air banyak dengan api sedang 45-60 menit (atau presto 20 menit) sampai sangat empuk dan kenyal lembut, bukan alot.
2. Angkat kikil, tiriskan dan iris tipis memanjang setebal 5 mm.
3. Cincang halus bawang putih.
4. Panaskan sedikit minyak, tumis bawang putih 30 detik sampai harum, lalu masukkan ke kaldu sapi.
5. Didihkan kaldu dengan api sedang, bumbui dengan lada bubuk dan garam secukupnya.
6. Cicipi kaldu dan sesuaikan rasa sampai gurih seimbang.
7. Seduh mie pipih di air mendidih terpisah 1-2 menit sampai lunak, tiriskan.
8. Seduh tauge sebentar 20-30 detik di air mendidih yang sama, tiriskan agar masih renyah.
9. Tata mie dan tauge di dasar mangkuk saji.
10. Susun irisan kikil di atas mie.
11. Siram kuah kaldu panas sampai menutupi semua bahan.
12. Taburi daun bawang iris dan bawang goreng, sajikan dengan jeruk nipis di sampingnya.', 1, 45, NULL, NULL, NULL, NULL, 38)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-a-20', 'Kwetiau Siram (Flat Noodles in Gravy)', 'Kwetiau Siram', 520, 22, 64, 18, ARRAY['normal','halal']::text[], 'Noodle', 'noodle', 'meal', '#2F6BFF', '200 g flat rice noodles
80 g chicken, sliced
50 g shrimp, peeled
1 baby bok choy
2 cloves garlic
1 tbsp oyster-style sauce
1 tsp cornstarch
300 ml chicken broth', '200 g kwetiau
80 g ayam, iris
50 g udang kupas
1 buah sawi hijau
2 siung bawang putih
1 sdm saus tiram
1 sdt maizena
300 ml kaldu ayam', '1. Heat a little oil in a wok over medium-high heat.
2. Stir-fry the flat noodles briefly 1-2 minutes, turning gently, until slightly warmed and not sticking, then arrange on a serving plate.
3. Mix the cornstarch with 2 tablespoons water, set aside.
4. Slice the chicken thin, mince the garlic, and cut the bok choy into 2-3 pieces.
5. Heat a little more oil in the same wok, saute the garlic 30 seconds until fragrant.
6. Add the chicken, cook 2-3 minutes until it changes color and is nearly cooked through.
7. Add the shrimp, cook 1-2 minutes until opaque and curled.
8. Pour in the chicken broth and oyster-style sauce, bring to a boil over medium heat.
9. Add the bok choy, cook 1 minute until wilted.
10. Pour in the cornstarch slurry while stirring quickly until the gravy thickens and turns glossy.
11. Taste and adjust the salt if needed.
12. Pour the hot gravy with its contents over the noodles and serve immediately.', '1. Panaskan sedikit minyak di wajan dengan api sedang-besar.
2. Goreng kwetiau sebentar 1-2 menit sambil dibalik perlahan sampai sedikit hangat dan tidak lengket, lalu tata di piring saji.
3. Larutkan maizena dengan 2 sdm air, sisihkan.
4. Iris tipis ayam, cincang halus bawang putih, potong bokcoy jadi 2-3 bagian.
5. Panaskan sedikit minyak lagi di wajan yang sama, tumis bawang putih 30 detik sampai harum.
6. Masukkan ayam, masak 2-3 menit sampai berubah warna dan hampir matang.
7. Masukkan udang, masak 1-2 menit sampai opak dan melengkung.
8. Tuang kaldu ayam dan saus tiram, didihkan dengan api sedang.
9. Masukkan bokcoy, masak 1 menit sampai layu.
10. Tuang larutan maizena sambil diaduk cepat sampai kuah mengental dan mengilap.
11. Cicipi dan sesuaikan garam bila perlu.
12. Siramkan kuah panas beserta isiannya ke atas kwetiau, sajikan segera.', 1, 20, NULL, NULL, NULL, NULL, 39)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-b-01', 'Soto Ayam Lamongan (Lamongan Chicken Soup)', 'Soto Ayam Lamongan', 340, 28, 30, 11, ARRAY['normal','high-protein','halal']::text[], 'Chicken', 'chicken', 'meal', '#C87000', '150 g chicken breast
700 ml chicken broth
1 handful glass noodles
1 hard-boiled egg
2 cloves garlic
3 shallots
1 tsp turmeric
Koya (fried garlic and cracker powder), lime, celery', '150 g dada ayam
700 ml kaldu ayam
1 genggam soun
1 telur rebus
2 siung bawang putih
3 butir bawang merah
1 sdt kunyit
Koya, jeruk nipis, seledri', '1. Boil the chicken breast in the chicken broth over medium heat 15-20 minutes until cooked through and tender, remove and shred once slightly cooled.
2. Grind the garlic, shallots and turmeric with a little water into a paste.
3. Heat a little oil, saute the spice paste over medium heat 3-4 minutes until fragrant, cooked through and a deep yellow color.
4. Pour the sauteed paste into the broth used to boil the chicken, bring back to a boil over medium heat.
5. Season the broth with salt to taste, tasting and adjusting.
6. Soak the glass noodles in hot water 5 minutes until soft and pliable, then drain.
7. Halve the hard-boiled egg.
8. Arrange the shredded chicken, glass noodles and egg in a serving bowl.
9. Ladle the hot turmeric broth over the top.
10. Sprinkle koya evenly over the surface of the broth.
11. Scatter chopped celery leaves on top.
12. Serve hot with lime wedges on the side, squeezing just before eating.', '1. Rebus dada ayam dalam kaldu ayam dengan api sedang 15-20 menit sampai matang dan empuk, angkat lalu suwir-suwir kasar setelah agak dingin.
2. Haluskan bawang putih, bawang merah dan kunyit dengan sedikit air.
3. Panaskan sedikit minyak, tumis bumbu halus dengan api sedang 3-4 menit sampai harum, matang dan warnanya kuning pekat.
4. Tuang bumbu tumis ke dalam kaldu bekas rebusan ayam, didihkan kembali dengan api sedang.
5. Bumbui kaldu dengan garam secukupnya, cicipi dan sesuaikan.
6. Rendam soun di air panas 5 menit sampai lunak dan lentur, tiriskan.
7. Belah dua telur rebus.
8. Tata ayam suwir, soun dan telur di dalam mangkuk saji.
9. Siram kuah kaldu kunyit yang masih panas ke atasnya.
10. Taburi koya secara merata di permukaan kuah.
11. Taburi daun seledri cincang.
12. Sajikan panas dengan potongan jeruk nipis di sampingnya, peras sesaat sebelum disantap.', 1, 35, NULL, NULL, NULL, NULL, 40)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-b-02', 'Soto Betawi (Jakarta Beef Soup)', 'Soto Betawi', 380, 30, 34, 12, ARRAY['normal','high-protein','halal']::text[], 'Beef', 'beef', 'meal', '#C87000', '120 g lean beef, cubed
300 ml light coconut milk broth
1 potato, diced
1 tomato
2 cloves garlic
2 shallots
Lime, scallion, fried shallots
Salt and pepper', '120 g daging sapi tanpa lemak, potong dadu
300 ml kuah santan encer
1 kentang, potong dadu
1 tomat
2 siung bawang putih
2 butir bawang merah
Jeruk nipis, daun bawang, bawang goreng
Garam dan merica', '1. Cut the beef into 2 cm cubes.
2. Boil the beef in enough water over medium heat 30-40 minutes until tender, set the beef aside and keep the cooking liquid as broth.
3. Grind the garlic and shallots with a little water into a paste.
4. Heat a little oil, saute the spice paste over medium heat 2-3 minutes until fragrant and cooked through.
5. Pour the sauteed paste into the beef broth, add the light coconut milk, stir gently until combined.
6. Cut the potato into 1.5 cm cubes and cut the tomato into 6-8 wedges.
7. Add the potato to the broth, cook over medium heat 8-10 minutes until tender when pierced.
8. Add the tomato, cook 2-3 more minutes until slightly softened but not falling apart.
9. Return the beef to the broth, reheat until it comes to a gentle simmer.
10. Season with salt and pepper to taste, tasting and adjusting.
11. Ladle into a serving bowl, scatter sliced scallion and fried shallots on top.
12. Serve hot with lime on the side.', '1. Potong daging sapi jadi dadu 2 cm.
2. Rebus daging dalam air secukupnya dengan api sedang 30-40 menit sampai empuk, sisihkan daging dan simpan air rebusannya sebagai kaldu.
3. Haluskan bawang putih dan bawang merah dengan sedikit air.
4. Panaskan sedikit minyak, tumis bumbu halus dengan api sedang 2-3 menit sampai harum dan matang.
5. Tuang bumbu tumis ke kaldu rebusan daging, tambahkan santan encer, aduk perlahan sampai tercampur rata.
6. Potong kentang dadu 1,5 cm, potong tomat jadi 6-8 bagian.
7. Masukkan kentang ke kuah, masak dengan api sedang 8-10 menit sampai empuk saat ditusuk.
8. Masukkan tomat, masak 2-3 menit lagi sampai sedikit layu tapi belum hancur.
9. Kembalikan daging sapi ke dalam kuah, panaskan kembali sampai mendidih perlahan.
10. Bumbui dengan garam dan merica secukupnya, cicipi dan sesuaikan.
11. Tuang ke mangkuk saji, taburi daun bawang iris dan bawang goreng.
12. Sajikan panas dengan jeruk nipis di sampingnya.', 1, 45, NULL, NULL, NULL, NULL, 41)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-b-03', 'Soto Madura (Madura Beef Soup)', 'Soto Madura', 360, 29, 22, 16, ARRAY['normal','high-protein','halal']::text[], 'Beef', 'beef', 'meal', '#C87000', '130 g beef shank
700 ml beef broth
1 hard-boiled egg
3 shallots
2 cloves garlic
1 tsp ground ginger
1 stalk lemongrass
Lime, celery, fried shallots', '130 g sandung lamur sapi
700 ml kaldu sapi
1 telur rebus
3 butir bawang merah
2 siung bawang putih
1 sdt jahe halus
1 batang serai
Jeruk nipis, seledri, bawang goreng', '1. Simmer the beef shank in enough water over medium heat for 40–45 minutes until tender and easily pierced with a fork.
2. Lift out the beef, strain the cooking liquid to use as broth, then slice the meat about 5 mm thick.
3. Grind the shallots, garlic and ginger into a smooth paste.
4. Heat a little oil in a pan over medium heat and saute the paste for 2–3 minutes until the shallots turn translucent and fragrant.
5. Bruise the lemongrass stalk and add it to the pan, stirring briefly until its aroma releases.
6. Pour the sauteed paste into the 700 ml beef broth and stir well.
7. Bring to a boil, then lower the heat and simmer gently for 10 minutes until the broth tastes rich and fragrant.
8. Halve the boiled egg.
9. Arrange the sliced beef and egg in the bottom of a serving bowl.
10. Ladle the hot broth over the beef and egg until submerged.
11. Add a squeeze of lime, then sprinkle with chopped celery and fried shallots.
12. Serve immediately while hot.', '1. Rebus sandung lamur sapi dalam air secukupnya dengan api sedang selama 40–45 menit sampai empuk dan mudah ditusuk garpu.
2. Angkat daging, saring air rebusannya untuk dijadikan kaldu, lalu iris daging setebal 5 mm.
3. Haluskan bawang merah, bawang putih dan jahe sampai lembut.
4. Panaskan sedikit minyak di wajan dengan api sedang, tumis bumbu halus 2–3 menit sampai bawang bening dan harum.
5. Memarkan batang serai lalu masukkan ke tumisan, aduk sebentar sampai aromanya keluar.
6. Tuang bumbu tumis ke dalam kaldu sapi 700 ml, aduk rata.
7. Didihkan lalu kecilkan api, masak perlahan selama 10 menit sampai kaldu terasa gurih dan harum.
8. Belah telur rebus jadi dua bagian.
9. Tata irisan daging dan telur di dasar mangkuk saji.
10. Siram kaldu panas ke atas daging dan telur sampai terendam.
11. Beri perasan jeruk nipis, taburi seledri cincang dan bawang goreng.
12. Sajikan segera selagi panas.', 1, 45, NULL, NULL, NULL, NULL, 42)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-b-04', 'Soto Banjar (Banjar Chicken Soup)', 'Soto Banjar', 350, 27, 32, 12, ARRAY['normal','high-protein','halal']::text[], 'Chicken', 'chicken', 'meal', '#C87000', '150 g chicken breast
700 ml chicken broth
1 handful glass noodles
1 hard-boiled egg
2 cloves garlic
3 shallots
1 pinch cinnamon and clove
Perkedel, lime, scallion', '150 g dada ayam
700 ml kaldu ayam
1 genggam soun
1 telur rebus
2 siung bawang putih
3 butir bawang merah
1 sejumput kayu manis dan cengkeh
Perkedel, jeruk nipis, daun bawang', '1. Boil the chicken breast in enough water over medium heat for 20–25 minutes until cooked through and tender.
2. Lift out the chicken, strain the cooking liquid for broth, then shred the meat into thin strands.
3. Grind the garlic and shallots into a smooth paste.
4. Saute the paste in a little oil over medium heat for 2–3 minutes until fragrant.
5. Add the cinnamon and clove, stirring briefly until their aroma releases.
6. Pour the sauteed spices into the chicken broth, stir well and bring back to a boil.
7. Lower the heat and simmer gently for 10 minutes so the spices infuse the broth.
8. Soak the glass noodles in hot water for 3–5 minutes until softened, then drain.
9. Halve the boiled egg and have the perkedel ready.
10. Arrange the shredded chicken, noodles, egg and perkedel in a serving bowl.
11. Ladle the hot broth evenly over all the fillings.
12. Serve with a squeeze of lime and a scatter of scallion.', '1. Rebus dada ayam dalam air secukupnya dengan api sedang selama 20–25 menit sampai matang dan empuk.
2. Angkat ayam, saring air rebusan untuk kaldu, lalu suwir-suwir daging ayam.
3. Haluskan bawang putih dan bawang merah sampai lembut.
4. Tumis bumbu halus dengan sedikit minyak di api sedang selama 2–3 menit sampai harum.
5. Masukkan kayu manis dan cengkeh, tumis sebentar sampai aroma rempah keluar.
6. Tuang bumbu tumis ke kaldu ayam, aduk rata dan didihkan kembali.
7. Kecilkan api, masak perlahan 10 menit supaya bumbu meresap ke kaldu.
8. Rendam soun di air panas selama 3–5 menit sampai lunak, lalu tiriskan.
9. Belah telur rebus jadi dua bagian, siapkan perkedel.
10. Tata ayam suwir, soun, telur dan perkedel di dalam mangkuk saji.
11. Siram kaldu panas merata ke atas semua isian.
12. Sajikan dengan perasan jeruk nipis dan taburan daun bawang.', 1, 35, NULL, NULL, NULL, NULL, 43)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-b-05', 'Rawon (East Java Black Beef Soup)', 'Rawon', 400, 30, 25, 20, ARRAY['normal','high-protein','halal']::text[], 'Beef', 'beef', 'protein', '#C87000', '130 g beef chuck, cubed
700 ml beef broth
3 keluak nuts
3 shallots
2 cloves garlic
2 candlenuts
1 stalk lemongrass
Bean sprouts, lime, salted egg', '130 g daging sapi sengkel, potong dadu
700 ml kaldu sapi
3 buah kluwek
3 butir bawang merah
2 siung bawang putih
2 butir kemiri
1 batang serai
Tauge pendek, jeruk nipis, telur asin', '1. Cube the beef chuck into 2 cm pieces, then simmer in enough water over medium heat for 35–40 minutes until tender.
2. Scrape the kernels out of the keluak shells, then soak briefly in warm water to soften.
3. Grind the keluak, shallots, garlic and candlenut into a smooth, dark paste.
4. Heat oil in a pan over medium heat and saute the paste for 4–5 minutes until it darkens further and turns fragrant.
5. Bruise the lemongrass and stir it into the paste briefly.
6. Pour the beef broth into the sauteed paste, stirring until fully combined.
7. Add the simmered beef along with a little of its cooking liquid.
8. Cook over low heat for 15–20 minutes until the broth turns deep black and the beef is even more tender.
9. Season with salt to taste and adjust as needed.
10. Prepare bean sprouts and halved salted egg as accompaniments.
11. Ladle the hot rawon into a serving bowl.
12. Serve with bean sprouts, lime and salted egg on the side.', '1. Potong daging sapi sengkel dadu 2 cm, lalu rebus dalam air secukupnya dengan api sedang 35–40 menit sampai empuk.
2. Kerok isi kluwek dari cangkangnya, lalu rendam sebentar di air hangat untuk melunakkan.
3. Haluskan kluwek, bawang merah, bawang putih dan kemiri sampai jadi pasta halus dan berwarna gelap.
4. Panaskan minyak di wajan dengan api sedang, tumis bumbu halus 4–5 menit sampai warnanya semakin gelap dan harum.
5. Memarkan serai lalu masukkan ke tumisan, aduk sebentar.
6. Tuang kaldu sapi ke dalam tumisan bumbu, aduk sampai larut merata.
7. Masukkan daging yang sudah direbus beserta sedikit air rebusannya.
8. Masak dengan api kecil selama 15–20 menit sampai kuah berwarna hitam pekat dan daging semakin empuk.
9. Bumbui dengan garam secukupnya, koreksi rasa.
10. Siapkan tauge pendek dan telur asin belah dua sebagai pelengkap.
11. Tuang rawon panas ke mangkuk saji.
12. Sajikan dengan tauge, jeruk nipis dan telur asin di sampingnya.', 1, 55, NULL, NULL, NULL, NULL, 44)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-b-06', 'Sop Ayam Klaten (Clear Chicken Soup)', 'Sop Ayam', 280, 26, 18, 10, ARRAY['normal','high-protein','low-carb','halal']::text[], 'Chicken', 'chicken', 'meal', '#2F6BFF', '150 g chicken breast
700 ml chicken broth
1 carrot, sliced
1 potato, cubed
2 cloves garlic
2 shallots
1 stalk celery
Scallion, fried shallots, pepper', '150 g dada ayam
700 ml kaldu ayam
1 wortel, iris
1 kentang, potong dadu
2 siung bawang putih
2 butir bawang merah
1 batang seledri
Daun bawang, bawang goreng, merica', '1. Cut the chicken breast into a few pieces and simmer in enough water over medium heat for 20 minutes until cooked.
2. Lift out the chicken, strain the broth, then shred or cube the meat into 2 cm pieces.
3. Crush the garlic and shallots until bruised.
4. Saute the crushed aromatics in a little oil over medium heat for 2 minutes until fragrant.
5. Stir the sauteed aromatics into the chicken broth and bring back to a boil.
6. Peel the carrot and slice on the diagonal about 3 mm thick; peel the potato and cube into 1.5 cm pieces.
7. Add the carrot and potato to the broth and cook over medium heat for 10–12 minutes until tender when pierced.
8. Return the chicken pieces to the soup and reheat for 2 minutes.
9. Season with pepper and salt, adjusting to taste.
10. Thinly slice the celery and scallion.
11. Pour the soup into a serving bowl and sprinkle with celery, scallion and fried shallots.
12. Serve hot right away.', '1. Potong dada ayam jadi beberapa bagian, rebus dalam air secukupnya dengan api sedang 20 menit sampai matang.
2. Angkat ayam, saring kaldunya, lalu suwir atau potong dadu 2 cm daging ayam.
3. Geprek bawang putih dan bawang merah sampai memar.
4. Tumis bumbu geprek dengan sedikit minyak di api sedang 2 menit sampai harum.
5. Masukkan tumisan bumbu ke dalam kaldu ayam, didihkan kembali.
6. Kupas wortel lalu iris serong setebal 3 mm, kupas kentang lalu potong dadu 1,5 cm.
7. Masukkan wortel dan kentang ke kaldu, masak dengan api sedang 10–12 menit sampai empuk saat ditusuk.
8. Kembalikan potongan ayam ke dalam kuah, panaskan kembali 2 menit.
9. Bumbui dengan merica dan garam, koreksi rasa.
10. Iris seledri dan daun bawang tipis-tipis.
11. Tuang sop ke mangkuk saji, taburi seledri, daun bawang dan bawang goreng.
12. Sajikan hangat segera.', 1, 30, NULL, NULL, NULL, NULL, 45)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-b-07', 'Sop Buntut (Oxtail Soup)', 'Sop Buntut', 420, 32, 20, 24, ARRAY['normal','high-protein','halal']::text[], 'Beef', 'beef', 'protein', '#2F6BFF', '180 g oxtail
700 ml beef broth
1 carrot, chunked
1 potato, chunked
2 cloves garlic
2 shallots
1 pinch nutmeg
Tomato, scallion, fried shallots', '180 g buntut sapi
700 ml kaldu sapi
1 wortel, potong
1 kentang, potong
2 siung bawang putih
2 butir bawang merah
1 sejumput pala
Tomat, daun bawang, bawang goreng', '1. Rinse the oxtail well, then simmer in enough water over medium heat for 60–75 minutes until the meat is very tender and easily falls off the bone.
2. Skim off the foam that rises to the surface occasionally to keep the broth clear.
3. Lift out the oxtail, strain the broth and set aside.
4. Crush the garlic and shallots until bruised.
5. Saute the crushed aromatics in a little oil over medium heat for 2–3 minutes until fragrant.
6. Stir the sauteed aromatics and ground nutmeg into the broth.
7. Cut the carrot and potato into large chunks about 2.5 cm.
8. Add the carrot and potato to the broth and cook over medium heat for 12–15 minutes until tender.
9. Return the oxtail to the soup and bring back to a boil.
10. Season with salt and pepper, adjusting to taste.
11. Cut the tomato into wedges and thinly slice the scallion.
12. Pour the hot oxtail soup into a bowl and top with tomato, scallion and fried shallots.
13. Serve immediately while hot.', '1. Cuci bersih buntut sapi, rebus dalam air secukupnya dengan api sedang selama 60–75 menit sampai daging sangat empuk dan mudah lepas dari tulang.
2. Sesekali buang buih yang muncul di permukaan supaya kaldu bening.
3. Angkat buntut, saring kaldunya dan sisihkan.
4. Geprek bawang putih dan bawang merah sampai memar.
5. Tumis bumbu geprek dengan sedikit minyak di api sedang 2–3 menit sampai harum.
6. Masukkan tumisan bumbu dan pala bubuk ke dalam kaldu, aduk rata.
7. Potong wortel dan kentang jadi potongan besar sekitar 2,5 cm.
8. Masukkan wortel dan kentang ke kaldu, masak dengan api sedang 12–15 menit sampai empuk.
9. Kembalikan buntut ke dalam kuah, panaskan kembali sampai mendidih.
10. Bumbui dengan garam dan merica, koreksi rasa.
11. Potong tomat jadi beberapa bagian, iris daun bawang tipis.
12. Tuang sop buntut panas ke mangkuk, beri tomat, daun bawang dan bawang goreng.
13. Sajikan segera selagi hangat.', 1, 80, NULL, NULL, NULL, NULL, 46)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-b-08', 'Sayur Asem (Tamarind Vegetable Soup)', 'Sayur Asem', 260, 8, 40, 6, ARRAY['normal','vegetarian','vegan','halal']::text[], 'Vegetarian', 'vegetable', 'veg', '#2A7A4F', '700 ml water
1 corn cob, cut
1 handful long beans
1 chayote, cubed
1 handful melinjo leaves
2 tbsp peanuts
2 tbsp tamarind
3 shallots and 2 cloves garlic
Palm sugar and salt', '700 ml air
1 jagung, potong
1 genggam kacang panjang
1 labu siam, potong dadu
1 genggam daun melinjo
2 sdm kacang tanah
2 sdm asam jawa
3 bawang merah dan 2 bawang putih
Gula merah dan garam', '1. Grind the shallots and garlic into a smooth paste.
2. Bring 700 ml water to a boil in a pot over medium heat together with the spice paste.
3. Cut the corn cob into a few crosswise pieces and add to the boiling water along with the peanuts.
4. Cook over medium heat for 8–10 minutes until the corn is half done.
5. Peel the chayote and cube into 2 cm pieces; cut the long beans into 3 cm lengths.
6. Add the chayote and long beans, cooking for 5 minutes until they start to soften.
7. Dissolve the tamarind in a little water, strain, then pour into the soup.
8. Season with palm sugar and salt, stir well and adjust the sweet-sour balance.
9. Pick the melinjo leaves from their stems.
10. Add the melinjo leaves last, cooking for just 2 minutes until wilted but still green.
11. Remove from heat once all the vegetables are tender but not mushy.
12. Serve warm.', '1. Haluskan bawang merah dan bawang putih sampai lembut.
2. Didihkan 700 ml air di panci dengan api sedang bersama bumbu halus.
3. Potong jagung jadi beberapa bagian melintang, masukkan ke air mendidih bersama kacang tanah.
4. Masak dengan api sedang 8–10 menit sampai jagung setengah matang.
5. Kupas labu siam lalu potong dadu 2 cm, potong kacang panjang sepanjang 3 cm.
6. Masukkan labu siam dan kacang panjang, masak 5 menit sampai mulai empuk.
7. Larutkan asam jawa dengan sedikit air, saring lalu tuang ke dalam sayur.
8. Bumbui dengan gula merah dan garam, aduk rata dan koreksi rasa asam-manisnya.
9. Petik daun melinjo dari tangkainya.
10. Masukkan daun melinjo terakhir, masak 2 menit saja sampai layu tapi masih hijau.
11. Angkat dari api begitu semua sayur empuk namun tidak lembek.
12. Sajikan hangat.', 1, 25, NULL, NULL, NULL, NULL, 47)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-b-09', 'Sayur Lodeh (Coconut Vegetable Stew)', 'Sayur Lodeh', 300, 9, 28, 16, ARRAY['normal','vegetarian','vegan','halal']::text[], 'Vegetarian', 'vegetable', 'veg', '#2A7A4F', '400 ml light coconut milk
1 eggplant, cubed
1 handful long beans
100 g young jackfruit
50 g tofu, cubed
3 shallots and 2 cloves garlic
2 red chilies
1 bay leaf and galangal
Salt', '400 ml santan encer
1 terong, potong dadu
1 genggam kacang panjang
100 g nangka muda
50 g tahu, potong dadu
3 bawang merah dan 2 bawang putih
2 cabai merah
1 daun salam dan lengkuas
Garam', '1. Grind the shallots, garlic and red chilies into a smooth paste.
2. Heat a little oil in a pot over medium heat and saute the paste for 2–3 minutes until cooked through and fragrant.
3. Add the bruised bay leaf and galangal, stirring briefly.
4. Pour in the light coconut milk gradually while stirring so it doesn''t split.
5. Cut the young jackfruit into medium 2 cm pieces and add to the coconut milk.
6. Cook over low-medium heat for 10–12 minutes, stirring occasionally, until the jackfruit is tender.
7. Peel the eggplant and cube into 2 cm pieces; cut the long beans into 3 cm lengths.
8. Add the eggplant, long beans and cubed tofu into the broth.
9. Cook for another 5–6 minutes over low heat until all the vegetables are soft, keeping the coconut milk from boiling hard so it doesn''t split.
10. Season with salt, adjusting to taste.
11. Remove from heat once the broth thickens slightly and the vegetables are evenly cooked.
12. Serve warm.', '1. Haluskan bawang merah, bawang putih dan cabai merah sampai lembut.
2. Panaskan sedikit minyak di panci dengan api sedang, tumis bumbu halus 2–3 menit sampai matang dan harum.
3. Masukkan daun salam dan lengkuas yang sudah dimemarkan, tumis sebentar.
4. Tuang santan encer sedikit demi sedikit sambil diaduk supaya tidak pecah.
5. Potong nangka muda jadi potongan sedang 2 cm, masukkan ke santan.
6. Masak dengan api kecil-sedang 10–12 menit sambil sesekali diaduk sampai nangka empuk.
7. Kupas terong lalu potong dadu 2 cm, potong kacang panjang sepanjang 3 cm.
8. Masukkan terong, kacang panjang dan tahu potong dadu ke dalam kuah.
9. Masak lagi 5–6 menit dengan api kecil sampai semua sayur lunak, jangan sampai santan mendidih keras agar tidak pecah.
10. Bumbui dengan garam, koreksi rasa.
11. Angkat dari api begitu kuah mengental sedikit dan sayur matang merata.
12. Sajikan hangat.', 1, 30, NULL, NULL, NULL, NULL, 48)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-b-10', 'Sayur Bening Bayam (Clear Spinach Soup)', 'Sayur Bening Bayam', 250, 9, 35, 4, ARRAY['normal','vegetarian','vegan','halal']::text[], 'Vegetarian', 'vegetable', 'veg', '#2A7A4F', '700 ml water
1 bunch spinach
1 corn cob, sliced
1 chayote, cubed
3 shallots, sliced
2 slices ginger and galangal
1 tsp palm sugar
Salt', '700 ml air
1 ikat bayam
1 jagung, iris
1 labu siam, potong dadu
3 bawang merah, iris
2 iris jahe dan lengkuas
1 sdt gula merah
Garam', '1. Thinly slice the shallots, and slice the ginger and galangal into 2 pieces each.
2. Bring 700 ml water to a boil in a pot over medium heat with the shallots, ginger and galangal.
3. Slice the corn cob crosswise about 2 cm thick and add to the boiling water.
4. Peel the chayote and cube into 2 cm pieces, then add to the pot.
5. Cook over medium heat for 8–10 minutes until the corn and chayote are half done.
6. Season with palm sugar and salt, stir well and adjust to taste.
7. Pick and rinse the spinach leaves, discarding any tough stems.
8. Add the spinach to the pot and stir briefly.
9. Cook for just 1–2 minutes until the spinach wilts but stays bright green.
10. Turn off the heat right away so the spinach doesn''t overcook and dull in color.
11. Serve warm immediately once done.', '1. Iris tipis bawang merah, iris jahe dan lengkuas masing-masing 2 iris.
2. Didihkan 700 ml air di panci dengan api sedang bersama bawang merah, jahe dan lengkuas.
3. Iris jagung melintang setebal 2 cm, masukkan ke air mendidih.
4. Kupas labu siam lalu potong dadu 2 cm, masukkan ke rebusan.
5. Masak dengan api sedang 8–10 menit sampai jagung dan labu siam setengah matang.
6. Bumbui dengan gula merah dan garam, aduk rata dan koreksi rasa.
7. Petik dan cuci bersih daun bayam, buang batang yang keras.
8. Masukkan bayam ke dalam rebusan, aduk sebentar.
9. Masak hanya 1–2 menit sampai bayam layu namun warnanya masih hijau segar.
10. Matikan api segera supaya bayam tidak overcooked dan berubah warna kusam.
11. Sajikan hangat segera setelah matang.', 1, 20, NULL, NULL, NULL, NULL, 49)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-b-11', 'Bakso (Beef Meatball Soup)', 'Bakso', 380, 26, 40, 12, ARRAY['normal','high-protein','halal']::text[], 'Beef', 'beef', 'meal', '#C41101', '150 g beef meatballs
700 ml beef broth
1 handful yellow noodles
1 handful glass noodles
2 cloves garlic
1 stalk bok choy
Scallion, celery, fried shallots
Pepper and salt', '150 g bakso sapi
700 ml kaldu sapi
1 genggam mi kuning
1 genggam soun
2 siung bawang putih
1 batang sawi
Daun bawang, seledri, bawang goreng
Merica dan garam', '1. Crush the garlic until bruised.
2. Saute the crushed garlic in a little oil over medium heat for 2 minutes until golden brown and fragrant.
3. Stir the sauteed garlic into the beef broth and bring to a boil.
4. Season the broth with pepper and salt, adjusting to taste.
5. Add the meatballs to the boiling broth and cook for 3–4 minutes until they float and are heated through.
6. Boil water separately and cook the yellow noodles for 1–2 minutes until soft, then drain.
7. Soak the glass noodles in hot water for 3 minutes until softened, then drain.
8. Slice the bok choy and blanch briefly in boiling water until wilted and bright green.
9. Arrange the yellow noodles, glass noodles and bok choy in the bottom of a serving bowl.
10. Place the meatballs on top.
11. Ladle the hot broth evenly over all the fillings.
12. Sprinkle with scallion, chopped celery and fried shallots.
13. Serve immediately while hot.', '1. Geprek bawang putih sampai memar.
2. Tumis bawang putih geprek dengan sedikit minyak di api sedang 2 menit sampai kuning kecokelatan dan harum.
3. Masukkan tumisan bawang putih ke dalam kaldu sapi, didihkan.
4. Bumbui kaldu dengan merica dan garam, koreksi rasa.
5. Masukkan bakso ke dalam kaldu mendidih, masak 3–4 menit sampai bakso mengapung dan panas merata.
6. Didihkan air terpisah, rebus mi kuning 1–2 menit sampai lunak lalu tiriskan.
7. Rendam soun di air panas 3 menit sampai lunak, tiriskan.
8. Iris sawi/bok choy lalu blansir sebentar di air mendidih sampai layu dan hijau cerah.
9. Tata mi kuning, soun dan sawi di dasar mangkuk saji.
10. Susun bakso di atasnya.
11. Siram kaldu panas merata ke seluruh isian.
12. Taburi daun bawang, seledri cincang dan bawang goreng.
13. Sajikan segera selagi panas.', 1, 20, NULL, NULL, NULL, NULL, 50)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-b-12', 'Gulai Ayam (Light Chicken Curry Stew)', 'Gulai Ayam', 420, 30, 18, 24, ARRAY['normal','high-protein','low-carb','halal']::text[], 'Chicken', 'chicken', 'protein', '#C41101', '160 g chicken thigh
350 ml light coconut milk
4 shallots and 3 cloves garlic
2 candlenuts
1 tsp turmeric and coriander
1 stalk lemongrass
2 kaffir lime leaves
Salt', '160 g paha ayam
350 ml santan encer
4 bawang merah dan 3 bawang putih
2 kemiri
1 sdt kunyit dan ketumbar
1 batang serai
2 daun jeruk
Garam', '1. Grind the shallots, garlic, candlenut, turmeric and coriander into a smooth paste.
2. Heat a little oil in a pan over medium heat and saute the paste for 3–4 minutes until cooked through, fragrant and deep yellow.
3. Bruise the lemongrass, tear the kaffir lime leaves, and add them to the pan, stirring briefly.
4. Cut the chicken into pieces if not already done, and add to the sauteed paste.
5. Stir well until the chicken is coated in the spices and the outside changes color, about 3 minutes.
6. Pour in the light coconut milk gradually while stirring continuously so it doesn''t split.
7. Cook over low heat, stirring occasionally, for 15–18 minutes until the chicken is tender and cooked through evenly (no pink remaining).
8. Keep the heat low and avoid a hard boil so the coconut milk doesn''t split.
9. Season with salt, adjusting to taste.
10. Remove from heat once the sauce reduces slightly and thickens lightly.
11. Serve warm.', '1. Haluskan bawang merah, bawang putih, kemiri, kunyit dan ketumbar sampai jadi pasta halus.
2. Panaskan sedikit minyak di wajan dengan api sedang, tumis bumbu halus 3–4 menit sampai matang, harum dan warnanya menguning pekat.
3. Memarkan serai, sobek daun jeruk lalu masukkan ke tumisan, aduk sebentar.
4. Potong ayam jadi beberapa bagian jika belum, masukkan ke tumisan bumbu.
5. Aduk rata sampai ayam terlumuri bumbu dan berubah warna di bagian luar, sekitar 3 menit.
6. Tuang santan encer sedikit demi sedikit sambil terus diaduk supaya tidak pecah.
7. Masak dengan api kecil, aduk sesekali, selama 15–18 menit sampai ayam empuk dan matang merata (tidak ada bagian merah muda).
8. Jaga api tetap kecil dan jangan sampai mendidih keras supaya santan tidak pecah.
9. Bumbui dengan garam, koreksi rasa.
10. Angkat dari api begitu kuah sedikit menyusut dan mengental ringan.
11. Sajikan hangat.', 1, 30, NULL, NULL, NULL, NULL, 51)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-b-13', 'Tongseng (Spiced Beef and Cabbage Stew)', 'Tongseng', 440, 30, 20, 26, ARRAY['normal','high-protein','halal']::text[], 'Beef', 'beef', 'meal', '#C41101', '150 g beef, sliced
300 ml light coconut milk
2 handfuls cabbage
1 tomato, wedged
4 shallots and 3 cloves garlic
2 red chilies
1 tsp sweet soy sauce
Lemongrass and salt', '150 g daging sapi, iris
300 ml santan encer
2 genggam kol
1 tomat, potong
4 bawang merah dan 3 bawang putih
2 cabai merah
1 sdt kecap manis
Serai dan garam', '1. Grind the shallots, garlic and red chilies into a smooth paste.
2. Heat a little oil in a pan over medium heat and saute the paste for 2–3 minutes until fragrant.
3. Bruise the lemongrass and add it to the pan, stirring briefly.
4. Thinly slice the beef against the grain and add it to the sauteed paste.
5. Stir over medium-high heat for 3–4 minutes until the beef changes color and browns slightly on the outside.
6. Pour in the light coconut milk and sweet soy sauce, stirring well.
7. Cook over low-medium heat for 8–10 minutes until the beef is tender and the sauce has reduced slightly.
8. Roughly shred the cabbage and cut the tomato into wedges.
9. Add the cabbage and tomato near the end of cooking, stirring well.
10. Cook for another 2–3 minutes until the cabbage wilts but stays slightly crisp.
11. Season with salt, adjusting the sweet-savory balance to taste.
12. Serve hot right away.', '1. Haluskan bawang merah, bawang putih dan cabai merah sampai lembut.
2. Panaskan sedikit minyak di wajan dengan api sedang, tumis bumbu halus 2–3 menit sampai harum.
3. Memarkan serai lalu masukkan ke tumisan, aduk sebentar.
4. Iris daging sapi tipis melawan arah serat, masukkan ke tumisan bumbu.
5. Aduk-aduk dengan api sedang-besar 3–4 menit sampai daging berubah warna dan sedikit kecokelatan di luar.
6. Tuang santan encer dan kecap manis, aduk rata.
7. Masak dengan api kecil-sedang 8–10 menit sampai daging empuk dan kuah agak menyusut.
8. Iris kasar kol, potong tomat jadi beberapa bagian.
9. Masukkan kol dan tomat menjelang akhir masak, aduk rata.
10. Masak 2–3 menit lagi sampai kol layu namun masih sedikit renyah.
11. Bumbui dengan garam, koreksi rasa manis-gurihnya.
12. Sajikan panas segera.', 1, 25, NULL, NULL, NULL, NULL, 52)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-b-14', 'Coto Makassar (Makassar Beef Soup)', 'Coto Makassar', 400, 32, 18, 22, ARRAY['normal','high-protein','low-carb','halal']::text[], 'Beef', 'beef', 'protein', '#C87000', '150 g beef and offal, cubed
700 ml beef broth
3 tbsp ground roasted peanuts
5 shallots and 3 cloves garlic
2 candlenuts
1 tsp cumin and coriander
Galangal and lemongrass
Lime and scallion', '150 g daging dan jeroan, potong dadu
700 ml kaldu sapi
3 sdm kacang sangrai halus
5 bawang merah dan 3 bawang putih
2 kemiri
1 sdt jinten dan ketumbar
Lengkuas dan serai
Jeruk nipis dan daun bawang', '1. Cube the beef and offal into 2 cm pieces, then simmer in enough water over medium heat for 40–45 minutes until tender.
2. Lift out the meat and strain the cooking liquid to use as broth.
3. Grind the shallots, garlic, candlenut, cumin and coriander into a smooth paste.
4. Heat a little oil in a pan over medium heat and saute the paste for 3–4 minutes until cooked through and fragrant.
5. Bruise the galangal and lemongrass and add them to the pan, sauteing briefly until their aroma releases.
6. Pour the sauteed paste into the broth and stir well.
7. Dissolve the ground roasted peanuts in a little broth, then stir into the pot to thicken the soup.
8. Return the cubed beef and offal to the soup.
9. Cook over low-medium heat for 15–20 minutes until the broth thickens and tastes richly savory.
10. Season with salt, adjusting to taste.
11. Ladle the hot coto into a serving bowl.
12. Serve with a squeeze of lime and a scatter of scallion.', '1. Potong daging dan jeroan dadu 2 cm, rebus dalam air secukupnya dengan api sedang 40–45 menit sampai empuk.
2. Angkat daging, saring air rebusannya untuk kaldu.
3. Haluskan bawang merah, bawang putih, kemiri, jinten dan ketumbar sampai jadi pasta halus.
4. Panaskan sedikit minyak di wajan dengan api sedang, tumis bumbu halus 3–4 menit sampai matang dan harum.
5. Memarkan lengkuas dan serai lalu masukkan ke tumisan, tumis sebentar sampai aromanya keluar.
6. Tuang bumbu tumis ke dalam kaldu, aduk rata.
7. Larutkan kacang sangrai halus dengan sedikit kaldu, lalu tuang ke dalam panci untuk mengentalkan kuah.
8. Masukkan kembali potongan daging dan jeroan ke dalam kuah.
9. Masak dengan api kecil-sedang 15–20 menit sampai kuah mengental dan terasa gurih pekat.
10. Bumbui dengan garam, koreksi rasa.
11. Tuang coto panas ke mangkuk saji.
12. Sajikan dengan perasan jeruk nipis dan taburan daun bawang.', 1, 55, NULL, NULL, NULL, NULL, 53)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-b-15', 'Semur Ayam (Chicken in Sweet Soy Stew)', 'Semur Ayam', 360, 28, 28, 14, ARRAY['normal','high-protein','halal']::text[], 'Chicken', 'chicken', 'protein', '#C87000', '160 g chicken pieces
300 ml water
1 potato, cubed
3 tbsp sweet soy sauce
4 shallots and 3 cloves garlic
1 pinch nutmeg and clove
1 tomato
Salt and pepper', '160 g potongan ayam
300 ml air
1 kentang, potong dadu
3 sdm kecap manis
4 bawang merah dan 3 bawang putih
1 sejumput pala dan cengkeh
1 tomat
Garam dan merica', '1. Grind the shallots and garlic into a smooth paste.
2. Heat a little oil in a pan over medium heat and saute the paste for 2–3 minutes until fragrant.
3. Add the nutmeg and clove, stirring briefly until their aroma releases.
4. Add the chicken pieces to the pan and stir until evenly browned on the outside, about 4–5 minutes.
5. Pour in the water and sweet soy sauce, stirring well.
6. Peel the potato and cube into 2 cm pieces.
7. Add the potato to the sauce and cook over low-medium heat for 12–15 minutes until the potato and chicken are tender.
8. Cut the tomato into wedges and add near the end of cooking.
9. Cook for another 2–3 minutes until the tomato softens slightly and the sauce thickens.
10. Season with salt and pepper, adjusting to taste.
11. Remove from heat once the sauce turns deep brown and the chicken is evenly cooked.
12. Serve warm.', '1. Haluskan bawang merah dan bawang putih sampai lembut.
2. Panaskan sedikit minyak di wajan dengan api sedang, tumis bumbu halus 2–3 menit sampai harum.
3. Masukkan pala dan cengkeh, tumis sebentar sampai aroma rempah keluar.
4. Masukkan potongan ayam ke tumisan, aduk sampai permukaannya kecokelatan merata, sekitar 4–5 menit.
5. Tuang air dan kecap manis, aduk rata.
6. Kupas kentang lalu potong dadu 2 cm.
7. Masukkan kentang ke dalam kuah, masak dengan api kecil-sedang 12–15 menit sampai kentang dan ayam empuk.
8. Potong tomat jadi beberapa bagian, masukkan menjelang akhir masak.
9. Masak 2–3 menit lagi sampai tomat sedikit layu dan kuah mengental.
10. Bumbui dengan garam dan merica, koreksi rasa.
11. Angkat begitu kuah berwarna cokelat pekat dan ayam matang merata.
12. Sajikan hangat.', 1, 30, NULL, NULL, NULL, NULL, 54)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-b-16', 'Opor Ayam (Chicken in Coconut Stew)', 'Opor Ayam', 430, 30, 18, 26, ARRAY['normal','high-protein','low-carb','halal']::text[], 'Chicken', 'chicken', 'protein', '#C87000', '160 g chicken pieces
350 ml light coconut milk
5 shallots and 3 cloves garlic
2 candlenuts
1 tsp coriander
1 stalk lemongrass
2 kaffir lime leaves
Galangal and salt', '160 g potongan ayam
350 ml santan encer
5 bawang merah dan 3 bawang putih
2 kemiri
1 sdt ketumbar
1 batang serai
2 daun jeruk
Lengkuas dan garam', '1. Grind the shallots, garlic, candlenut and coriander into a smooth paste.
2. Heat a little oil in a pan over medium heat and saute the paste for 3 minutes until cooked through and fragrant.
3. Bruise the lemongrass and galangal, tear the kaffir lime leaves, and add them to the pan.
4. Saute briefly until the spices smell strongly fragrant.
5. Add the chicken pieces and stir until coated in the spices and changed color, about 3 minutes.
6. Pour in the light coconut milk slowly, a little at a time, while stirring continuously.
7. Cook over low heat, stirring occasionally to keep the coconut milk from splitting, for 18–20 minutes.
8. Cook until the chicken is tender and evenly cooked through, with no pink remaining inside.
9. Season with salt, adjusting to taste.
10. Remove from heat once the sauce thickens lightly and turns a pale yellow.
11. Serve warm.', '1. Haluskan bawang merah, bawang putih, kemiri dan ketumbar sampai jadi pasta halus.
2. Panaskan sedikit minyak di wajan dengan api sedang, tumis bumbu halus 3 menit sampai matang dan harum.
3. Memarkan serai dan lengkuas, sobek daun jeruk, lalu masukkan ke tumisan.
4. Tumis sebentar sampai aroma rempah tercium kuat.
5. Masukkan potongan ayam, aduk sampai terlumuri bumbu dan berubah warna, sekitar 3 menit.
6. Tuang santan encer perlahan sedikit demi sedikit sambil terus diaduk.
7. Masak dengan api kecil, aduk sesekali supaya santan tidak pecah, selama 18–20 menit.
8. Masak sampai ayam empuk dan matang merata, tidak ada bagian merah muda di dalamnya.
9. Bumbui dengan garam, koreksi rasa.
10. Angkat dari api begitu kuah mengental ringan dan berwarna kuning pucat.
11. Sajikan hangat.', 1, 30, NULL, NULL, NULL, NULL, 55)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-b-17', 'Empal Gentong (Cirebon Beef Coconut Soup)', 'Empal Gentong', 410, 30, 22, 22, ARRAY['normal','high-protein','halal']::text[], 'Beef', 'beef', 'protein', '#C41101', '150 g beef and tripe, cubed
350 ml light coconut milk
5 shallots and 3 cloves garlic
2 candlenuts
1 tsp turmeric and coriander
1 stalk lemongrass
Kucai chives and fried shallots
Salt', '150 g daging dan babat, potong dadu
350 ml santan encer
5 bawang merah dan 3 bawang putih
2 kemiri
1 sdt kunyit dan ketumbar
1 batang serai
Kucai dan bawang goreng
Garam', '1. Cube the beef and tripe into 2 cm pieces, then simmer in enough water over medium heat for 40–45 minutes until tender.
2. Lift out the meat and strain the cooking liquid to use as broth.
3. Grind the shallots, garlic, candlenut, turmeric and coriander into a smooth paste.
4. Heat a little oil in a pan over medium heat and saute the paste for 3–4 minutes until cooked through and deep yellow.
5. Bruise the lemongrass and add it to the pan, sauteing briefly until fragrant.
6. Pour in the light coconut milk gradually while stirring so it doesn''t split.
7. Add the beef broth and the simmered meat.
8. Cook over low heat, stirring occasionally, for 15–18 minutes until the broth is rich and slightly thickened.
9. Keep the heat low and avoid a hard boil so the coconut milk doesn''t split.
10. Season with salt, adjusting to taste.
11. Thinly slice the kucai chives.
12. Ladle the hot empal gentong into a bowl and top with kucai chives and fried shallots.', '1. Potong daging dan babat dadu 2 cm, rebus dalam air secukupnya dengan api sedang 40–45 menit sampai empuk.
2. Angkat daging, saring air rebusannya untuk kaldu.
3. Haluskan bawang merah, bawang putih, kemiri, kunyit dan ketumbar sampai jadi pasta halus.
4. Panaskan sedikit minyak di wajan dengan api sedang, tumis bumbu halus 3–4 menit sampai matang dan berwarna kuning pekat.
5. Memarkan serai lalu masukkan ke tumisan, tumis sebentar sampai harum.
6. Tuang santan encer sedikit demi sedikit sambil diaduk supaya tidak pecah.
7. Masukkan kaldu sapi dan daging yang sudah direbus.
8. Masak dengan api kecil, aduk sesekali, selama 15–18 menit sampai kuah gurih dan agak mengental.
9. Jaga api tetap kecil dan jangan sampai mendidih keras supaya santan tidak pecah.
10. Bumbui dengan garam, koreksi rasa.
11. Iris kucai tipis-tipis.
12. Tuang empal gentong panas ke mangkuk, taburi kucai dan bawang goreng.', 1, 55, NULL, NULL, NULL, NULL, 56)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-b-18', 'Tekwan (Palembang Fish Dumpling Soup)', 'Tekwan', 320, 24, 38, 6, ARRAY['pescatarian','high-protein','halal']::text[], 'Fish', 'fish', 'fish', '#2F6BFF', '120 g fish and tapioca dumplings
700 ml prawn broth
1 handful glass noodles
50 g jicama, sliced
2 cloves garlic
1 handful wood ear mushroom
Scallion, celery, fried shallots
Pepper and salt', '120 g adonan ikan dan tapioka
700 ml kaldu udang
1 genggam soun
50 g bengkuang, iris
2 siung bawang putih
1 genggam jamur kuping
Daun bawang, seledri, bawang goreng
Merica dan garam', '1. Shape the fish and tapioca dough into small marble-sized dumplings, about 2 cm in diameter.
2. Bring water to a boil in a separate pot and boil the tekwan dumplings for 3–4 minutes until they float, then lift out and drain.
3. Crush the garlic until bruised and saute in a little oil over medium heat for 2 minutes until fragrant.
4. Stir the sauteed garlic into the prawn broth and bring to a boil.
5. Peel the jicama and slice thinly; soak the wood ear mushroom in warm water until it expands, then slice.
6. Add the jicama and wood ear mushroom to the broth and cook over medium heat for 5 minutes until the jicama is half done.
7. Return the tekwan dumplings to the broth and cook for another 3 minutes until heated through evenly.
8. Soak the glass noodles in hot water for 3 minutes until softened, drain, then add to the broth.
9. Season with pepper and salt, adjusting to taste.
10. Thinly slice the scallion and celery.
11. Pour the hot tekwan into a serving bowl.
12. Sprinkle with scallion, celery and fried shallots, and serve immediately.', '1. Bentuk adonan ikan dan tapioka jadi bulatan kecil sebesar kelereng, sekitar 2 cm diameter.
2. Didihkan air di panci terpisah, rebus bulatan tekwan 3–4 menit sampai mengapung, lalu angkat dan tiriskan.
3. Geprek bawang putih sampai memar, tumis dengan sedikit minyak di api sedang 2 menit sampai harum.
4. Masukkan tumisan bawang putih ke dalam kaldu udang, didihkan.
5. Kupas bengkuang lalu iris tipis-tipis, rendam jamur kuping di air hangat sampai mengembang lalu iris.
6. Masukkan bengkuang dan jamur kuping ke kaldu, masak dengan api sedang 5 menit sampai bengkuang setengah matang.
7. Kembalikan tekwan ke dalam kaldu, masak 3 menit lagi sampai panas merata.
8. Rendam soun di air panas 3 menit sampai lunak, tiriskan lalu masukkan ke kaldu.
9. Bumbui dengan merica dan garam, koreksi rasa.
10. Iris daun bawang dan seledri tipis-tipis.
11. Tuang tekwan panas ke mangkuk saji.
12. Taburi daun bawang, seledri dan bawang goreng, sajikan segera.', 1, 30, NULL, NULL, NULL, NULL, 57)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-b-19', 'Sup Iga (Light Beef Rib Soup)', 'Sup Iga', 400, 30, 20, 22, ARRAY['normal','high-protein','halal']::text[], 'Beef', 'beef', 'meal', '#2F6BFF', '180 g beef short ribs
700 ml beef broth
1 carrot, chunked
1 potato, chunked
2 cloves garlic
2 shallots
1 pinch nutmeg and clove
Tomato, scallion, fried shallots', '180 g iga sapi
700 ml kaldu sapi
1 wortel, potong
1 kentang, potong
2 siung bawang putih
2 butir bawang merah
1 sejumput pala dan cengkeh
Tomat, daun bawang, bawang goreng', '1. Rinse the short ribs well, then simmer in enough water over medium heat for 50–60 minutes until the meat is tender and easily separates from the bone.
2. Skim off the foam that rises to the surface occasionally to keep the broth clear.
3. Lift out the ribs, strain the broth and set aside.
4. Crush the garlic and shallots until bruised.
5. Saute the crushed aromatics in a little oil over medium heat for 2–3 minutes until fragrant.
6. Stir the sauteed aromatics, nutmeg and clove into the broth.
7. Cut the carrot and potato into large chunks about 2.5 cm.
8. Add the carrot and potato to the broth and cook over medium heat for 12–15 minutes until tender.
9. Return the ribs to the soup and bring back to a boil.
10. Season with salt and pepper, adjusting to taste.
11. Cut the tomato into wedges and thinly slice the scallion.
12. Pour the hot rib soup into a bowl and top with tomato, scallion and fried shallots.
13. Serve immediately while hot.', '1. Cuci bersih iga sapi, rebus dalam air secukupnya dengan api sedang 50–60 menit sampai daging empuk dan mudah lepas dari tulang.
2. Sesekali buang buih yang muncul di permukaan supaya kaldu bening.
3. Angkat iga, saring kaldunya dan sisihkan.
4. Geprek bawang putih dan bawang merah sampai memar.
5. Tumis bumbu geprek dengan sedikit minyak di api sedang 2–3 menit sampai harum.
6. Masukkan tumisan bumbu, pala dan cengkeh ke dalam kaldu, aduk rata.
7. Potong wortel dan kentang jadi potongan besar sekitar 2,5 cm.
8. Masukkan wortel dan kentang ke kaldu, masak dengan api sedang 12–15 menit sampai empuk.
9. Kembalikan iga ke dalam kuah, panaskan kembali sampai mendidih.
10. Bumbui dengan garam dan merica, koreksi rasa.
11. Potong tomat jadi beberapa bagian, iris daun bawang tipis.
12. Tuang sup iga panas ke mangkuk, beri tomat, daun bawang dan bawang goreng.
13. Sajikan segera selagi hangat.', 1, 70, NULL, NULL, NULL, NULL, 58)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-b-20', 'Gulai Ikan (Light Fish Curry Stew)', 'Gulai Ikan', 360, 30, 14, 20, ARRAY['pescatarian','high-protein','low-carb','halal']::text[], 'Fish', 'fish', 'fish', '#C41101', '160 g firm white fish
350 ml light coconut milk
5 shallots and 3 cloves garlic
1 tsp turmeric and coriander
2 red chilies
1 stalk lemongrass
2 kaffir lime leaves
Tamarind and salt', '160 g ikan berdaging padat
350 ml santan encer
5 bawang merah dan 3 bawang putih
1 sdt kunyit dan ketumbar
2 cabai merah
1 batang serai
2 daun jeruk
Asam jawa dan garam', '1. Cut the fish into a few pieces, rub lightly with salt and set aside.
2. Grind the shallots, garlic, turmeric, coriander and red chilies into a smooth paste.
3. Heat a little oil in a pan over medium heat and saute the paste for 3 minutes until cooked through and fragrant.
4. Bruise the lemongrass, tear the kaffir lime leaves, and add them to the pan, sauteing briefly.
5. Pour in the light coconut milk slowly while stirring, and cook over low-medium heat until it comes to a gentle simmer.
6. Dissolve the tamarind in a little water, strain, then pour into the sauce.
7. Season with salt, adjusting the sweet-sour balance to taste.
8. Slide in the fish pieces one at a time carefully so they don''t break apart.
9. Cook over low heat for 6–8 minutes without stirring too often, until the fish is cooked and the flesh easily flakes from any bones.
10. Keep the heat low so the coconut milk doesn''t split and the fish doesn''t fall apart.
11. Remove from heat once the fish is evenly cooked and the sauce smells fragrant.
12. Serve warm.', '1. Potong ikan jadi beberapa bagian, lumuri sedikit garam dan sisihkan.
2. Haluskan bawang merah, bawang putih, kunyit, ketumbar dan cabai merah sampai jadi pasta halus.
3. Panaskan sedikit minyak di wajan dengan api sedang, tumis bumbu halus 3 menit sampai matang dan harum.
4. Memarkan serai, sobek daun jeruk, lalu masukkan ke tumisan, tumis sebentar.
5. Tuang santan encer perlahan sambil diaduk, masak dengan api kecil-sedang sampai mendidih pelan.
6. Larutkan asam jawa dengan sedikit air, saring lalu tuang ke dalam kuah.
7. Bumbui dengan garam, koreksi rasa asam-gurihnya.
8. Masukkan potongan ikan satu per satu dengan hati-hati supaya tidak hancur.
9. Masak dengan api kecil 6–8 menit tanpa terlalu sering diaduk sampai ikan matang dan dagingnya mudah terlepas dari duri.
10. Jaga api tetap kecil supaya santan tidak pecah dan ikan tidak hancur.
11. Angkat dari api begitu ikan matang merata dan kuah beraroma harum.
12. Sajikan hangat.', 1, 25, NULL, NULL, NULL, NULL, 59)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-c-01', 'Ayam Bakar (Grilled Sweet Soy Chicken)', 'Ayam Bakar Kecap', 320, 30, 12, 16, ARRAY['normal','high-protein','halal']::text[], 'Chicken', 'chicken', 'protein', '#C41101', '200 g chicken leg, skin removed
2 tbsp sweet soy sauce
2 cloves garlic
1 tsp grated ginger
1 tsp coriander powder
1 tbsp lime juice
Salt and pepper
Steamed rice to serve', '200 g paha ayam, buang kulit
2 sdm kecap manis
2 siung bawang putih
1 sdt jahe parut
1 sdt ketumbar bubuk
1 sdm air jeruk nipis
Garam dan lada
Nasi putih untuk sajian', '1. Remove the skin from the chicken, rinse well, then pat dry with paper towels.
2. Finely chop the garlic and mix with the grated ginger and ground coriander.
3. Boil the chicken together with the chopped aromatics in enough water over medium heat for 12–15 minutes until half cooked.
4. Lift out the chicken and drain, setting aside briefly until slightly cooled.
5. Mix the sweet soy sauce, lime juice, salt and pepper in a small bowl until combined.
6. Coat the chicken evenly with the soy sauce mixture on all sides.
7. Let the chicken sit in the marinade for 10 minutes to absorb the flavor.
8. Heat a grill pan or grill over medium heat for 2 minutes.
9. Grill the chicken, turning and basting with the remaining marinade occasionally, for 10–12 minutes until browned on the outside.
10. Check doneness by piercing the thickest part — the juices should run clear, not pink.
11. In the final minutes, let the edges char slightly for extra smoky aroma.
12. Remove the chicken and rest for 2–3 minutes before serving.
13. Serve with warm steamed rice.', '1. Buang kulit ayam, cuci bersih lalu keringkan dengan tisu dapur.
2. Cincang halus bawang putih, campur dengan jahe parut dan ketumbar bubuk.
3. Rebus ayam bersama bumbu cincang dalam air secukupnya dengan api sedang 12–15 menit sampai setengah matang.
4. Angkat ayam dan tiriskan, sisihkan sebentar sampai agak dingin.
5. Campur kecap manis, air jeruk nipis, garam dan lada dalam mangkuk kecil sampai rata.
6. Lumuri ayam dengan bumbu kecap secara merata di semua sisi.
7. Diamkan ayam terendam bumbu selama 10 menit supaya meresap.
8. Panaskan panggangan atau wajan grill dengan api sedang selama 2 menit.
9. Panggang ayam sambil sesekali dibalik dan diolesi sisa bumbu, selama 10–12 menit sampai permukaannya kecokelatan.
10. Cek kematangan dengan menusuk bagian tebal — cairan yang keluar harus bening, bukan merah muda.
11. Di menit-menit terakhir, biarkan tepi ayam sedikit gosong untuk menambah aroma bakar.
12. Angkat ayam dan diamkan 2–3 menit sebelum disajikan.
13. Sajikan bersama nasi putih hangat.', 1, 35, NULL, NULL, NULL, NULL, 60)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-c-02', 'Ayam Goreng Lengkuas (Galangal Fried Chicken, lighter)', 'Ayam Goreng Lengkuas', 340, 31, 8, 19, ARRAY['normal','high-protein','halal']::text[], 'Chicken', 'chicken', 'protein', '#C87000', '200 g chicken, cut into pieces
3 tbsp grated galangal
3 cloves garlic
1 tsp turmeric powder
2 bay leaves
1 tsp salt
1 tbsp oil for pan frying
Lime wedges', '200 g ayam, potong-potong
3 sdm lengkuas parut
3 siung bawang putih
1 sdt kunyit bubuk
2 lembar daun salam
1 sdt garam
1 sdm minyak untuk menggoreng
Jeruk nipis', '1. Cut the chicken into pieces if not already done, rinse well and drain.
2. Blend the garlic, turmeric powder and salt into a paste.
3. Coat the chicken evenly with the spice paste.
4. Put the chicken into a pot along with the grated galangal and bay leaves, adding a little water until the chicken is nearly submerged.
5. Simmer over medium heat for 15–18 minutes until the chicken is tender.
6. Uncover, raise the heat slightly and continue cooking until the liquid has fully evaporated and the galangal starts to dry out and turn fibrous.
7. Lift out the chicken, separating it from the dried galangal bits at the bottom of the pot.
8. Heat 1 tbsp oil in a flat pan over medium heat.
9. Fry the chicken for 3–4 minutes per side until golden brown and crisp on the outside.
10. In the same pan, fry the leftover dried galangal until crisp and fragrant, about 2–3 minutes, stirring constantly so it doesn''t burn.
11. Remove the chicken and fried galangal, draining off excess oil.
12. Serve the chicken topped with the crispy galangal and lime on the side.', '1. Potong ayam jadi beberapa bagian jika belum, cuci bersih dan tiriskan.
2. Haluskan bawang putih, kunyit bubuk dan garam jadi bumbu.
3. Lumuri ayam dengan bumbu halus secara merata.
4. Masukkan ayam ke dalam panci bersama lengkuas parut dan daun salam, tambahkan sedikit air sampai ayam hampir terendam.
5. Ungkep dengan api sedang 15–18 menit sampai ayam empuk.
6. Buka tutup panci, besarkan api sedikit dan lanjutkan masak sampai air rebusan menyusut habis dan lengkuas mulai kering dan berserat.
7. Angkat ayam, pisahkan dari sisa lengkuas kering di dasar panci.
8. Panaskan 1 sdm minyak di wajan datar dengan api sedang.
9. Goreng ayam 3–4 menit tiap sisi sampai permukaannya kuning kecokelatan dan renyah.
10. Di wajan yang sama, goreng lengkuas kering sisa ungkepan sampai renyah dan harum, sekitar 2–3 menit, aduk terus supaya tidak gosong.
11. Angkat ayam dan lengkuas goreng, tiriskan dari minyak berlebih.
12. Sajikan ayam dengan taburan lengkuas renyah dan jeruk nipis di sampingnya.', 1, 35, NULL, NULL, NULL, NULL, 61)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-c-03', 'Ikan Bakar (Grilled Spiced Fish)', 'Ikan Bakar Bumbu', 280, 34, 6, 12, ARRAY['pescatarian','high-protein','low-carb','halal']::text[], 'Seafood', 'fish', 'fish', '#2F6BFF', '1 whole tilapia, cleaned and scored
2 tbsp sweet soy sauce
3 cloves garlic
2 red chilies
1 tsp grated ginger
1 tbsp lime juice
1 tsp salt
Banana leaf or foil', '1 ekor ikan nila, bersihkan dan kerat
2 sdm kecap manis
3 siung bawang putih
2 buah cabai merah
1 sdt jahe parut
1 sdm air jeruk nipis
1 sdt garam
Daun pisang atau aluminium foil', '1. Clean the tilapia and score both sides diagonally about 1 cm deep, 3 cuts per side, so the marinade penetrates and it cooks evenly.
2. Peel the garlic and roughly chop the chilies, then blend with the grated ginger and salt into a coarse paste.
3. Rub the paste inside the cavity and all over the scored surface of the fish.
4. Let the fish marinate at room temperature for at least 15 minutes.
5. Stir the sweet soy sauce with the lime juice in a small bowl to make the basting glaze.
6. Lay a sheet of banana leaf or foil on the grill and place the fish on top so it doesn''t stick or fall apart.
7. Grill over medium heat 6–7 minutes on the first side without moving it, until it releases easily from the leaf or foil.
8. Flip the fish once, then baste the cooked side generously with the glaze.
9. Grill the second side another 6–7 minutes, basting once more halfway through.
10. Check doneness by flaking the thickest part with a fork — the flesh should be opaque white and separate easily from the bone.
11. In the last 1–2 minutes, move the fish to slightly higher heat so the edges char lightly for flavor.
12. Rest the fish for 2 minutes off the heat before serving.
13. Serve with extra lime wedges on the side.', '1. Bersihkan ikan nila, kerat kedua sisi menyerong sedalam 1 cm, 3 kerat tiap sisi, supaya bumbu meresap dan matang merata.
2. Kupas bawang putih dan cincang kasar cabai, haluskan bersama jahe parut dan garam jadi bumbu agak kasar.
3. Lumuri bumbu ke rongga perut dan seluruh permukaan ikan yang sudah dikerat.
4. Diamkan ikan di suhu ruang minimal 15 menit agar bumbu meresap.
5. Campur kecap manis dengan air jeruk nipis dalam mangkuk kecil untuk olesan.
6. Alasi panggangan dengan daun pisang atau foil, letakkan ikan di atasnya supaya tidak lengket dan mudah hancur.
7. Panggang api sedang 6–7 menit di sisi pertama tanpa digeser, sampai ikan mudah terlepas dari daun/foil.
8. Balik sekali, lalu oles permukaan yang sudah matang dengan olesan kecap secara merata.
9. Panggang sisi kedua 6–7 menit lagi, oles sekali lagi di pertengahan waktu.
10. Cek kematangan dengan menusuk bagian paling tebal pakai garpu — daging harus putih dan mudah terlepas dari tulang.
11. Di 1–2 menit terakhir, geser ikan ke bagian yang lebih panas agar tepinya sedikit gosong untuk menambah aroma.
12. Istirahatkan ikan 2 menit di luar panggangan sebelum disajikan.
13. Sajikan dengan tambahan irisan jeruk nipis.', 1, 30, NULL, NULL, NULL, NULL, 62)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-c-04', 'Pepes Ikan (Banana-Leaf Steamed Fish)', 'Pepes Ikan', 240, 28, 7, 11, ARRAY['pescatarian','high-protein','low-carb','halal']::text[], 'Seafood', 'fish', 'fish', '#2A7A4F', '200 g fish fillet
4 cloves garlic
3 shallots
2 red chilies
1 tomato, sliced
2 stalks lemongrass, bruised
5 basil leaves
Banana leaf and salt', '200 g fillet ikan
4 siung bawang putih
3 butir bawang merah
2 buah cabai merah
1 buah tomat, iris
2 batang serai, memarkan
5 lembar daun kemangi
Daun pisang dan garam', '1. Rinse the fish fillet, pat dry with paper towel, then cut into 2–3 pieces for easier wrapping.
2. Pass the banana leaf briefly back and forth over the stove flame until pliable and less likely to tear when folded.
3. Peel the garlic and shallots, then roughly slice them along with the chilies.
4. Grind garlic, shallots, chili and salt with a mortar or blender into a smooth paste.
5. Rub the fish fillet evenly with the spice paste and let it sit for 10 minutes to absorb.
6. Slice the tomato about 5 mm thick and bruise the lemongrass with the back of a knife.
7. Lay out the banana leaf, arrange the seasoned fish in the center with the tomato, lemongrass and basil leaves.
8. Wrap tightly like an envelope and pin both ends shut with toothpicks or leaf skewers.
9. Bring the steamer water to a full rolling boil with plenty of steam, then steam the parcel for about 20 minutes until the fish is cooked through and no longer translucent at the center.
10. For deeper aroma, sear the parcel briefly 3–4 minutes per side in a dry skillet until the leaf browns slightly and smells fragrant.
11. Unwrap partway and serve warm straight from the leaf.', '1. Cuci bersih fillet ikan, keringkan dengan tisu dapur, lalu potong jadi 2–3 bagian agar mudah dibungkus.
2. Layukan daun pisang bolak-balik sebentar di atas api kompor sampai lemas dan tidak mudah sobek saat dilipat.
3. Kupas bawang putih dan bawang merah, lalu iris kasar bersama cabai merah.
4. Haluskan bawang putih, bawang merah, cabai, dan garam dengan ulekan atau blender sampai jadi pasta halus.
5. Lumuri fillet ikan merata dengan bumbu halus, diamkan 10 menit agar meresap.
6. Iris tomat setebal 5 mm, memarkan serai dengan punggung pisau.
7. Bentangkan daun pisang, tata ikan berbumbu di tengah bersama irisan tomat, serai, dan daun kemangi.
8. Bungkus rapat seperti amplop, sematkan kedua ujungnya dengan tusuk gigi atau lidi.
9. Panaskan kukusan sampai air mendidih dan beruap banyak, lalu kukus bungkusan selama 20 menit sampai ikan matang merata dan tidak lagi bening di bagian tengah.
10. Bila suka aroma lebih kuat, panggang bungkusan pepes sebentar 3–4 menit tiap sisi di atas teflon kering sampai daun sedikit kecokelatan dan harum.
11. Buka sedikit bungkusan dan sajikan hangat langsung di dalam daun.', 1, 35, NULL, NULL, NULL, NULL, 63)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-c-05', 'Pepes Tahu (Steamed Spiced Tofu in Leaf)', 'Pepes Tahu', 200, 14, 10, 12, ARRAY['vegetarian','vegan','halal']::text[], 'Vegan', 'tofu', 'meal', '#2A7A4F', '200 g firm tofu, mashed
3 shallots, sliced
2 cloves garlic
2 red chilies, sliced
1 spring onion, chopped
1 stalk lemongrass, bruised
5 basil leaves
Banana leaf and salt', '200 g tahu putih, haluskan
3 butir bawang merah, iris
2 siung bawang putih
2 buah cabai merah, iris
1 batang daun bawang, cincang
1 batang serai, memarkan
5 lembar daun kemangi
Daun pisang dan garam', '1. Press the firm tofu with a clean cloth to squeeze out excess water, then mash with a fork until smooth with no lumps.
2. Pass the banana leaf briefly over the stove flame until pliable and easy to fold.
3. Grind the garlic with salt using a mortar until it forms a paste.
4. Mix the garlic paste into the tofu along with the sliced shallots and chili, stir well.
5. Add the chopped spring onion and half the basil leaves, mix until evenly combined.
6. Lay out the banana leaf, spoon the tofu mixture into the center along with the bruised lemongrass and remaining basil.
7. Wrap tightly like an envelope and pin both ends shut with a skewer.
8. Bring the steamer water to a full rolling boil with plenty of steam.
9. Steam the parcel for about 25 minutes until the tofu mixture is set and no longer wet when pierced with a skewer.
10. Remove and let rest for 2 minutes before unwrapping so it doesn''t fall apart.
11. Serve warm straight from the leaf.', '1. Peras tahu putih dengan kain bersih untuk membuang kelebihan air, lalu haluskan dengan garpu sampai lembut dan tidak bergerindil.
2. Layukan daun pisang sebentar di atas api sampai lemas dan mudah dilipat.
3. Haluskan bawang putih dengan garam menggunakan ulekan sampai jadi pasta.
4. Campurkan pasta bawang putih ke tahu bersama irisan bawang merah dan cabai, aduk rata.
5. Masukkan daun bawang cincang dan separuh daun kemangi, aduk sampai tercampur rata.
6. Bentangkan daun pisang, sendokkan adonan tahu di tengah bersama serai memarkan dan sisa kemangi.
7. Bungkus rapat seperti amplop, sematkan kedua ujungnya dengan lidi.
8. Panaskan kukusan sampai air mendidih dan beruap banyak.
9. Kukus bungkusan selama 25 menit sampai adonan tahu padat dan tidak lagi basah saat ditusuk lidi.
10. Angkat dan biarkan 2 menit sebelum dibuka agar tidak mudah hancur.
11. Sajikan hangat langsung di dalam daun.', 1, 35, NULL, NULL, NULL, NULL, 64)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-c-06', 'Pecel Lele (Catfish with Sambal, lighter)', 'Pecel Lele', 300, 27, 9, 17, ARRAY['pescatarian','high-protein','halal']::text[], 'Seafood', 'fish', 'veg', '#C41101', '1 catfish, cleaned
1 tsp turmeric powder
2 cloves garlic
1 tsp salt
5 red chilies for sambal
3 shallots
1 tomato
1 tbsp oil and lime juice', '1 ekor lele, bersihkan
1 sdt kunyit bubuk
2 siung bawang putih
1 sdt garam
5 buah cabai merah untuk sambal
3 butir bawang merah
1 buah tomat
1 sdm minyak dan air jeruk nipis', '1. Rinse the catfish, pat dry with paper towel, then score the thickest part lightly so the seasoning penetrates and it cooks evenly.
2. Grind the garlic with salt, mix in the turmeric powder into a loose paste.
3. Rub the paste over the whole surface and belly cavity of the catfish, let it sit for 10 minutes.
4. Heat oil in a pan over medium-high heat until it shimmers.
5. Fry the catfish 5–6 minutes on the first side without flipping, until the skin is golden and crisp.
6. Flip and fry the other side 5–6 minutes more until cooked through and the flesh pulls easily from the bone.
7. While the fish fries, boil the chilies, shallots and tomato in water for 5 minutes until soft and wilted.
8. Drain the chili mixture and pound it roughly with salt into a coarse-textured sambal.
9. Stir in a squeeze of lime juice to finish the sambal.
10. Lift the fried catfish out and drain on paper towel to remove excess oil.
11. Serve the fried catfish with the sambal and fresh raw vegetables.', '1. Cuci bersih lele, keringkan dengan tisu dapur, lalu kerat sedikit di bagian paling tebal agar bumbu meresap dan matang merata.
2. Haluskan bawang putih dengan garam, campur dengan kunyit bubuk jadi pasta encer.
3. Lumuri seluruh permukaan dan rongga perut lele dengan bumbu, diamkan 10 menit.
4. Panaskan minyak di wajan dengan api sedang-besar sampai benar-benar panas.
5. Goreng lele 5–6 menit di sisi pertama tanpa dibalik, sampai kulit keemasan dan renyah.
6. Balik lele, goreng sisi kedua 5–6 menit lagi sampai matang merata dan daging mudah lepas dari tulang.
7. Sambil menggoreng lele, rebus cabai, bawang merah, dan tomat dalam air mendidih 5 menit sampai layu dan lunak.
8. Tiriskan cabai, bawang merah, tomat, lalu ulek kasar bersama garam jadi sambal bertekstur.
9. Beri perasan air jeruk nipis ke sambal, aduk rata.
10. Angkat lele dari minyak, tiriskan di atas tisu dapur agar tidak berminyak.
11. Sajikan lele goreng dengan sambal dan lalapan segar.', 1, 30, NULL, NULL, NULL, NULL, 65)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-c-07', 'Sate Ayam (Chicken Satay, peanut sauce)', 'Sate Ayam Bumbu Kacang', 310, 28, 12, 16, ARRAY['normal','high-protein','halal']::text[], 'Chicken', 'chicken', 'meal', '#C41101', '200 g chicken thigh, cubed
2 tbsp sweet soy sauce
2 cloves garlic
Bamboo skewers
4 tbsp peanut sauce
1 tsp lime juice
1 shallot, sliced
Cucumber slices', '200 g paha ayam, potong dadu
2 sdm kecap manis
2 siung bawang putih
Tusuk sate
4 sdm bumbu kacang
1 sdt air jeruk nipis
1 butir bawang merah, iris
Irisan timun', '1. Cut the chicken thigh into roughly 2 cm cubes so it cooks evenly on the grill.
2. Soak the bamboo skewers in water for 10–15 minutes so they don''t scorch while grilling.
3. Grate the garlic and mix it with the sweet soy sauce in a bowl for the marinade.
4. Coat the chicken with the marinade and let it sit at room temperature for at least 15 minutes to absorb.
5. Thread the chicken pieces onto the skewers, 4–5 pieces each, leaving a little space so they cook evenly.
6. Heat a grill or grill pan over medium heat until properly hot.
7. Grill the skewers 3–4 minutes per side, turning often so no side burns.
8. Brush a little sweet soy sauce over the surface in the last few minutes, grilling until glossy brown and the inside is fully cooked with no pink remaining.
9. While grilling, warm the peanut sauce in a small pot over low heat, thinning it with a little water to a pourable consistency.
10. Remove the skewers from the grill.
11. Serve the satay with the peanut sauce drizzled over, plus sliced shallot and cucumber.', '1. Potong paha ayam jadi dadu sekitar 2 cm agar matang merata saat dibakar.
2. Rendam tusuk sate bambu dalam air 10–15 menit supaya tidak gosong saat dibakar.
3. Parut bawang putih, campur dengan kecap manis dalam mangkuk untuk marinasi.
4. Lumuri ayam dengan bumbu marinasi, diamkan minimal 15 menit di suhu ruang agar meresap.
5. Tusuk potongan ayam ke tusuk sate, isi 4–5 potong tiap tusuk, jangan terlalu rapat agar matang merata.
6. Panaskan panggangan atau wajan grill dengan api sedang sampai benar-benar panas.
7. Bakar sate 3–4 menit tiap sisi sambil sering dibalik supaya tidak gosong di satu sisi.
8. Oles sedikit kecap manis ke permukaan sate di menit-menit terakhir sampai mengilap kecokelatan dan bagian dalam matang tanpa sisa warna merah muda.
9. Sambil membakar, hangatkan bumbu kacang di panci kecil api kecil, encerkan dengan sedikit air sampai kekentalan pas untuk disiram.
10. Angkat sate dari panggangan.
11. Sajikan sate dengan siraman bumbu kacang, irisan bawang merah, dan timun.', 1, 35, NULL, NULL, NULL, NULL, 66)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-c-08', 'Tempe Bacem (Sweet Braised Tempeh)', 'Tempe Bacem', 260, 18, 22, 11, ARRAY['vegetarian','vegan','high-protein','halal']::text[], 'Vegan', 'tempeh', 'meal', '#C87000', '200 g tempeh, sliced
3 tbsp sweet soy sauce
3 cloves garlic
3 shallots
1 tsp coriander
2 bay leaves
1 tsp tamarind
200 ml coconut water', '200 g tempe, iris
3 sdm kecap manis
3 siung bawang putih
3 butir bawang merah
1 sdt ketumbar
2 lembar daun salam
1 sdt asam jawa
200 ml air kelapa', '1. Slice the tempeh about 1 cm thick so the seasoning penetrates to the center.
2. Grind the garlic, shallots and coriander with a little water into a paste.
3. Combine the coconut water, spice paste, sweet soy sauce, tamarind and bay leaves in a pot, stir well.
4. Add the sliced tempeh, making sure it''s submerged in the liquid.
5. Bring to a boil over medium heat, then lower the heat and simmer gently for 20–25 minutes until the liquid has nearly evaporated and the tempeh is tender and browned.
6. Stir gently and turn the tempeh occasionally so the seasoning soaks in evenly on both sides.
7. Turn off the heat and let the tempeh sit in the residual sauce for 5 minutes so the sweetness soaks in further.
8. Heat a nonstick pan with no extra oil over medium heat.
9. Sear the braised tempeh 2–3 minutes per side until the surface is browned and slightly caramelized.
10. Serve warm as a side dish.', '1. Iris tempe setebal 1 cm agar bumbu meresap sampai ke tengah.
2. Haluskan bawang putih, bawang merah, dan ketumbar dengan sedikit air jadi pasta.
3. Campur air kelapa, bumbu halus, kecap manis, asam jawa, dan daun salam dalam panci, aduk rata.
4. Masukkan irisan tempe, pastikan terendam bumbu.
5. Didihkan dengan api sedang, lalu kecilkan api dan ungkep tempe 20–25 menit sampai air menyusut hampir habis dan tempe empuk berwarna cokelat.
6. Sesekali aduk perlahan dan balik tempe supaya bumbu meresap merata di kedua sisi.
7. Matikan api, biarkan tempe terendam bumbu sisa 5 menit agar rasa manisnya makin meresap.
8. Panaskan wajan antilengket tanpa minyak tambahan dengan api sedang.
9. Panggang tempe bacem 2–3 menit tiap sisi sampai permukaannya kecokelatan dan sedikit karamel.
10. Sajikan hangat sebagai lauk.', 1, 35, NULL, NULL, NULL, NULL, 67)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-c-09', 'Tahu Bacem (Sweet Braised Tofu)', 'Tahu Bacem', 220, 15, 16, 12, ARRAY['vegetarian','vegan','high-protein','halal']::text[], 'Vegan', 'tofu', 'meal', '#C87000', '200 g firm tofu, halved
3 tbsp sweet soy sauce
3 cloves garlic
3 shallots
1 tsp coriander
2 bay leaves
1 tsp tamarind
200 ml coconut water', '200 g tahu putih, belah dua
3 sdm kecap manis
3 siung bawang putih
3 butir bawang merah
1 sdt ketumbar
2 lembar daun salam
1 sdt asam jawa
200 ml air kelapa', '1. Halve the tofu, then blot gently with paper towel to reduce its water content.
2. Grind the garlic, shallots and coriander with a little water into a paste.
3. Combine the coconut water, spice paste, sweet soy sauce, tamarind and bay leaves in a pot, stir well.
4. Add the tofu, making sure it''s submerged in the liquid.
5. Bring to a boil over medium heat, then lower the heat and simmer gently for 20 minutes until the liquid reduces and the tofu turns golden brown.
6. Turn the tofu gently now and then so the seasoning soaks in evenly without breaking it apart.
7. Turn off the heat and let the tofu sit in the residual sauce for 5 minutes.
8. Heat a nonstick pan with no extra oil over medium heat.
9. Sear the braised tofu 2 minutes per side until the surface is golden and slightly caramelized.
10. Serve warm with fresh bird''s eye chilies.', '1. Belah tahu jadi dua, lalu tekan perlahan dengan tisu dapur untuk mengurangi kadar air.
2. Haluskan bawang putih, bawang merah, dan ketumbar dengan sedikit air jadi pasta.
3. Campur air kelapa, bumbu halus, kecap manis, asam jawa, dan daun salam dalam panci, aduk rata.
4. Masukkan tahu, pastikan terendam bumbu.
5. Didihkan dengan api sedang, lalu kecilkan api dan ungkep perlahan 20 menit sampai air menyusut dan tahu berwarna cokelat keemasan.
6. Sesekali balik tahu perlahan agar bumbu meresap merata tanpa membuatnya hancur.
7. Matikan api, biarkan tahu terendam bumbu sisa 5 menit.
8. Panaskan wajan antilengket tanpa minyak tambahan dengan api sedang.
9. Panggang tahu bacem 2 menit tiap sisi sampai permukaan keemasan dan sedikit karamel.
10. Sajikan hangat dengan cabai rawit segar.', 1, 30, NULL, NULL, NULL, NULL, 68)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-c-10', 'Tempe Orek (Sweet Crispy Tempeh Stir-Fry)', 'Orek Tempe', 280, 17, 24, 13, ARRAY['vegetarian','vegan','high-protein','halal']::text[], 'Vegan', 'tempeh', 'meal', '#C87000', '200 g tempeh, cut into sticks
3 tbsp sweet soy sauce
3 cloves garlic
3 shallots
5 bird chilies
2 bay leaves
1 tbsp oil
1 tsp tamarind water', '200 g tempe, potong korek
3 sdm kecap manis
3 siung bawang putih
3 butir bawang merah
5 buah cabai rawit
2 lembar daun salam
1 sdm minyak
1 sdt air asam jawa', '1. Cut the tempeh into thin matchsticks about 0.5 cm so it dries and crisps quickly.
2. Heat a dry pan (or with a touch of oil) and dry-fry the tempeh over medium heat for 5–6 minutes until dehydrated and slightly firm on the outside.
3. Remove the tempeh and set aside.
4. Thinly slice the garlic, shallots and bird''s eye chilies.
5. Heat the oil in the same pan, saute the sliced aromatics and chili over medium heat for 2–3 minutes until translucent and fragrant.
6. Add the bay leaves and saute briefly until their aroma releases.
7. Add the fried tempeh and toss with the aromatics.
8. Pour in the sweet soy sauce and tamarind water, stir quickly over medium heat.
9. Cook while stirring constantly for 3–4 minutes until the sauce thickens, turns sticky, and glazes the tempeh glossy all over.
10. Remove from heat as soon as the sauce has reduced with no liquid pooling, and serve immediately while warm.', '1. Potong tempe jadi bentuk korek api tipis sekitar 0,5 cm agar cepat kering dan renyah.
2. Panaskan wajan tanpa minyak (atau sedikit minyak), sangrai tempe dengan api sedang 5–6 menit sampai kesat dan sedikit kaku di bagian luar.
3. Angkat tempe, sisihkan.
4. Iris tipis bawang putih, bawang merah, dan cabai rawit.
5. Panaskan minyak di wajan yang sama, tumis irisan bawang dan cabai dengan api sedang 2–3 menit sampai bening dan harum.
6. Masukkan daun salam, tumis sebentar sampai aromanya keluar.
7. Masukkan tempe yang sudah disangrai, aduk rata dengan bumbu.
8. Tuang kecap manis dan air asam jawa, aduk cepat dengan api sedang.
9. Masak sambil terus diaduk 3–4 menit sampai kecap mengental, lengket, dan mengilap membalut tempe merata.
10. Angkat begitu bumbu sudah menyusut dan tidak lagi berair, sajikan segera selagi hangat.', 1, 25, NULL, NULL, NULL, NULL, 69)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-c-11', 'Tumis Kangkung (Stir-Fried Water Spinach)', 'Tumis Kangkung', 180, 6, 12, 11, ARRAY['vegetarian','vegan','low-carb','halal']::text[], 'Vegan', 'vegetable', 'veg', '#2A7A4F', '1 bunch water spinach, cut
3 cloves garlic, sliced
3 shallots, sliced
3 red chilies, sliced
1 tomato, wedged
1 tbsp oil
1 tsp soy sauce
Salt and a splash of water', '1 ikat kangkung, potong
3 siung bawang putih, iris
3 butir bawang merah, iris
3 buah cabai merah, iris
1 buah tomat, belah
1 sdm minyak
1 sdt kecap asin
Garam dan sedikit air', '1. Pick over the water spinach, discard the tough stem ends, and cut into 5–6 cm lengths.
2. Wash the water spinach thoroughly a few times under running water to remove grit, then drain.
3. Thinly slice the garlic, shallots and red chilies.
4. Heat the oil in a wok over medium heat until it shimmers.
5. Saute the garlic, shallots and chili for 2 minutes until softened and fragrant.
6. Add the tomato and cook briefly for 1 minute until slightly softened.
7. Turn the heat up to high and add all the water spinach at once.
8. Stir quickly and continuously so the heat spreads evenly and the greens don''t overcook.
9. Season with soy sauce, salt and a splash of water, stir to combine.
10. Stir-fry a total of 2–3 minutes until just wilted but the stems stay crisp and bright green, then remove immediately and serve.', '1. Petik kangkung, buang bagian batang yang keras, potong sepanjang 5–6 cm.
2. Cuci bersih kangkung beberapa kali di air mengalir untuk menghilangkan pasir, tiriskan.
3. Iris tipis bawang putih, bawang merah, dan cabai merah.
4. Panaskan minyak di wajan dengan api sedang sampai berkilau.
5. Tumis bawang putih, bawang merah, dan cabai 2 menit sampai layu dan harum.
6. Masukkan tomat, masak sebentar 1 menit sampai sedikit lunak.
7. Besarkan api ke besar, masukkan kangkung sekaligus.
8. Aduk cepat dan terus-menerus supaya panas merata dan kangkung tidak lembek.
9. Bumbui dengan kecap asin, garam, dan sedikit air, aduk rata.
10. Tumis total 2–3 menit sampai layu tapi batangnya masih renyah dan warnanya tetap hijau cerah, lalu segera angkat dan sajikan.', 1, 15, NULL, NULL, NULL, NULL, 70)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-c-12', 'Cah Kangkung Terasi (Water Spinach with Shrimp Paste)', 'Cah Kangkung Terasi', 200, 7, 12, 13, ARRAY['pescatarian','low-carb','halal']::text[], 'Vegetable', 'vegetable', 'veg', '#2A7A4F', '1 bunch water spinach, cut
1 tsp shrimp paste, toasted
3 cloves garlic
3 shallots
4 red chilies
1 tomato
1 tbsp oil
Salt and sugar to taste', '1 ikat kangkung, potong
1 sdt terasi, bakar
3 siung bawang putih
3 butir bawang merah
4 buah cabai merah
1 buah tomat
1 sdm minyak
Garam dan gula secukupnya', '1. Pick and cut the water spinach into 5–6 cm lengths, wash well, and drain.
2. Toast the shrimp paste briefly wrapped in foil over low heat, or dry-fry in a pan, until fragrant, taking care not to burn it.
3. Grind the chili, garlic, shallots and toasted shrimp paste with a mortar or blender.
4. Heat the oil in a wok over medium heat.
5. Saute the ground paste for 2–3 minutes until fully cooked, slightly darkened, and fragrant with no raw smell.
6. Add the tomato wedges and cook for 1 minute until slightly softened.
7. Turn the heat up and add the water spinach all at once.
8. Season with salt and a pinch of sugar, stir quickly.
9. Stir-fry for 2–3 minutes until the water spinach is wilted but still crisp and bright green.
10. Remove immediately so it doesn''t overcook, and serve hot.', '1. Petik dan potong kangkung sepanjang 5–6 cm, cuci bersih, tiriskan.
2. Bakar terasi sebentar dibungkus foil di atas api kecil, atau sangrai di wajan kering sampai harum, hindari gosong.
3. Haluskan cabai, bawang putih, bawang merah, dan terasi bakar dengan ulekan atau blender.
4. Panaskan minyak di wajan dengan api sedang.
5. Tumis bumbu halus 2–3 menit sampai matang, warnanya sedikit gelap, dan aromanya harum tidak langu.
6. Masukkan tomat yang dipotong, masak 1 menit sampai sedikit lunak.
7. Besarkan api, masukkan kangkung sekaligus.
8. Bumbui dengan garam dan sedikit gula, aduk cepat.
9. Tumis 2–3 menit sampai kangkung layu tapi tetap renyah dan hijau segar.
10. Angkat segera agar tidak overcook, sajikan panas.', 1, 15, NULL, NULL, NULL, NULL, 71)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-c-13', 'Cah Kailan (Stir-Fried Chinese Kale)', 'Cah Kailan', 190, 7, 11, 12, ARRAY['vegetarian','vegan','low-carb','halal']::text[], 'Vegan', 'vegetable', 'veg', '#2A7A4F', '1 bunch Chinese kale, cut
3 cloves garlic, chopped
1 thumb ginger, sliced
1 tsp soy sauce
1 tsp sesame oil
1 tbsp oil
Salt and pepper
2 tbsp water', '1 ikat kailan, potong
3 siung bawang putih, cincang
1 ruas jahe, iris
1 sdt kecap asin
1 sdt minyak wijen
1 sdm minyak
Garam dan lada
2 sdm air', '1. Cut the Chinese kale into 5–6 cm lengths, separating the thick stems from the leaves.
2. Bring water to a boil in a pot, blanch the stems first for 1 minute, then add the leaves for 30 seconds, then drain immediately and rinse with cold water to keep the color bright green.
3. Finely chop the garlic and thinly slice the ginger.
4. Heat the oil in a wok over medium-high heat.
5. Saute the garlic and ginger for 1 minute until fragrant, without letting them burn.
6. Add the blanched kale and stir quickly over high heat.
7. Season with soy sauce, salt and pepper.
8. Pour in the 2 tbsp water, cover the wok briefly for 1 minute so the heat distributes without the kale turning too soft.
9. Uncover and stir briefly until the water reduces slightly.
10. Turn off the heat, drizzle in the sesame oil and toss to coat.
11. Serve immediately while still crisp and warm.', '1. Potong kailan jadi batang sepanjang 5–6 cm, pisahkan bagian batang tebal dan daun.
2. Didihkan air di panci, blansir batang kailan dulu 1 menit, baru masukkan bagian daun 30 detik, lalu segera tiriskan dan siram air dingin agar warnanya tetap hijau cerah.
3. Cincang halus bawang putih, iris tipis jahe.
4. Panaskan minyak di wajan dengan api sedang-besar.
5. Tumis bawang putih dan jahe 1 menit sampai harum, jangan sampai gosong.
6. Masukkan kailan yang sudah diblansir, aduk cepat dengan api besar.
7. Bumbui dengan kecap asin, garam, dan lada.
8. Tuang 2 sdm air, tutup wajan sebentar 1 menit supaya panas merata tanpa kailan jadi terlalu lembek.
9. Buka tutup, aduk sebentar sampai air sedikit menyusut.
10. Matikan api, tuang minyak wijen dan aduk rata.
11. Sajikan segera selagi renyah dan hangat.', 1, 15, NULL, NULL, NULL, NULL, 72)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-c-14', 'Oseng Buncis (Sauteed Green Beans)', 'Oseng Buncis', 190, 6, 14, 11, ARRAY['vegetarian','vegan','low-carb','halal']::text[], 'Vegan', 'vegetable', 'veg', '#2A7A4F', '250 g green beans, sliced
3 cloves garlic, sliced
3 shallots, sliced
3 red chilies, sliced
1 tomato, diced
1 tbsp oil
1 tsp soy sauce
Salt and a splash of water', '250 g buncis, iris serong
3 siung bawang putih, iris
3 butir bawang merah, iris
3 buah cabai merah, iris
1 buah tomat, potong dadu
1 sdm minyak
1 sdt kecap asin
Garam dan sedikit air', '1. Slice the green beans thinly on the diagonal, about 3–4 mm, so they cook quickly.
2. Thinly slice the garlic, shallots and red chilies.
3. Heat the oil in a pan over medium heat.
4. Saute the garlic, shallots and chili for 2 minutes until softened and fragrant.
5. Add the tomato and cook for 1 minute until slightly softened.
6. Add the green beans and toss to coat with the aromatics.
7. Season with soy sauce and salt.
8. Pour in a splash of water, cover the pan, and cook over medium-low heat for 4–5 minutes until the beans are tender but still crisp and bright green.
9. Uncover and stir briefly until the water reduces and the seasoning clings to the beans.
10. Remove from heat and serve warm.', '1. Iris buncis serong tipis sekitar 3–4 mm supaya cepat matang.
2. Iris tipis bawang putih, bawang merah, dan cabai merah.
3. Panaskan minyak di wajan dengan api sedang.
4. Tumis bawang putih, bawang merah, dan cabai 2 menit sampai layu dan harum.
5. Masukkan tomat, masak 1 menit sampai agak lunak.
6. Masukkan buncis, aduk rata dengan bumbu.
7. Bumbui dengan kecap asin dan garam.
8. Tuang sedikit air, tutup wajan, masak dengan api sedang-kecil 4–5 menit sampai buncis empuk tapi masih renyah dan warnanya tetap hijau segar.
9. Buka tutup, aduk sebentar sampai air menyusut dan bumbu menempel di buncis.
10. Angkat dan sajikan hangat.', 1, 15, NULL, NULL, NULL, NULL, 73)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-c-15', 'Urap Sayur (Vegetables with Spiced Coconut)', 'Urap Sayur', 220, 8, 18, 13, ARRAY['vegetarian','vegan','halal']::text[], 'Vegan', 'vegetable', 'veg', '#2A7A4F', '150 g bean sprouts
100 g long beans, cut
100 g spinach or water spinach
150 g grated coconut
3 cloves garlic
3 red chilies
1 tsp palm sugar
1 tbsp lime juice and salt', '150 g tauge
100 g kacang panjang, potong
100 g bayam atau kangkung
150 g kelapa parut
3 siung bawang putih
3 buah cabai merah
1 sdt gula merah
1 sdm air jeruk nipis dan garam', '1. Cut the long beans into 3–4 cm lengths, trim the bean sprouts, and pick over the spinach or water spinach.
2. Bring water to a boil in a pot and blanch each vegetable separately (long beans first for 2 minutes, then bean sprouts for 1 minute, then spinach or water spinach for 30 seconds) so each is cooked to the right doneness.
3. Drain each vegetable immediately and let the steam escape so they don''t overcook.
4. Grind the garlic, red chilies, palm sugar and salt with a mortar into a paste.
5. Mix the paste into the grated coconut, stirring until the seasoning is spread evenly throughout.
6. Steam the seasoned coconut for 10 minutes until cooked and fragrant, with no raw coconut smell.
7. Remove the steamed coconut, let it cool slightly, then add the lime juice and stir to combine.
8. Taste the seasoned coconut and adjust the salt or sweetness if needed.
9. Arrange the blanched vegetables on a serving plate.
10. Just before serving, toss the vegetables with the seasoned coconut so they stay fresh and don''t turn watery.', '1. Potong kacang panjang sepanjang 3–4 cm, siangi tauge, dan petik bayam atau kangkung.
2. Didihkan air di panci, rebus masing-masing sayuran terpisah (kacang panjang dulu 2 menit, lalu tauge 1 menit, lalu bayam/kangkung 30 detik) supaya tingkat kematangannya pas.
3. Segera tiriskan tiap sayuran dan biarkan uapnya hilang supaya tidak layu berlebih.
4. Haluskan bawang putih, cabai merah, gula merah, dan garam dengan ulekan sampai jadi pasta.
5. Campurkan bumbu halus ke kelapa parut, aduk rata sampai bumbu menyebar merata di seluruh kelapa.
6. Kukus kelapa berbumbu selama 10 menit sampai matang dan aromanya harum, tidak lagi berbau kelapa mentah.
7. Angkat kelapa kukus, biarkan hangat, lalu beri air jeruk nipis dan aduk rata.
8. Cicipi kelapa berbumbu, sesuaikan asin-manisnya bila perlu.
9. Susun sayuran rebus di piring saji.
10. Tepat sebelum disajikan, aduk sayuran dengan kelapa berbumbu supaya tetap segar dan tidak berair.', 1, 25, NULL, NULL, NULL, NULL, 74)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-c-16', 'Karedok (Raw Vegetables in Peanut Sauce)', 'Karedok', 260, 10, 22, 15, ARRAY['vegetarian','vegan','halal']::text[], 'Vegan', 'vegetable', 'veg', '#2A7A4F', '100 g long beans, sliced
100 g bean sprouts
1 small cucumber, diced
50 g cabbage, shredded
5 tbsp ground peanuts
2 cloves garlic
3 red chilies
1 tsp palm sugar
1 tbsp lime juice and salt', '100 g kacang panjang, iris
100 g tauge
1 buah timun kecil, potong dadu
50 g kol, iris halus
5 sdm kacang tanah halus
2 siung bawang putih
3 buah cabai merah
1 sdt gula merah
1 sdm air jeruk nipis dan garam', '1. Thinly slice the long beans on the diagonal, dice the cucumber small, and finely shred the cabbage.
2. Rinse the bean sprouts and drain, then gather all the raw vegetables together in a large bowl.
3. Grind the garlic, red chilies and palm sugar with a mortar until smooth.
4. Add the ground peanuts to the paste and pound until well combined.
5. Add water little by little while continuing to grind until it forms a thick, spoonable sauce.
6. Stir in the lime juice and salt, taste and adjust the balance of sour, sweet and salty.
7. Pour the peanut sauce over the raw vegetables in the bowl.
8. Toss with your hands or a spoon until all the vegetables are evenly coated in sauce.
9. Serve immediately after tossing so the vegetables stay crisp and fresh, not wilted by the salt in the sauce.', '1. Iris kacang panjang tipis serong, potong timun dadu kecil, iris kol tipis-tipis.
2. Cuci tauge, tiriskan, lalu kumpulkan semua sayuran mentah ini dalam mangkuk besar.
3. Haluskan bawang putih, cabai merah, dan gula merah dengan ulekan sampai halus.
4. Masukkan kacang tanah halus ke bumbu, ulek sampai tercampur rata.
5. Tambahkan air sedikit demi sedikit sambil terus diulek sampai terbentuk saus kental yang bisa disendok.
6. Beri air jeruk nipis dan garam ke saus, cicipi, sesuaikan rasa asam-manis-asinnya.
7. Tuang saus kacang ke atas sayuran mentah di mangkuk.
8. Aduk rata dengan tangan atau sendok sampai semua sayuran terlapisi saus merata.
9. Sajikan segera setelah diaduk supaya sayuran tetap renyah dan segar, tidak layu karena garam dari saus.', 1, 15, NULL, NULL, NULL, NULL, 75)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-c-17', 'Telur Balado (Eggs in Chili Sauce)', 'Telur Balado', 260, 14, 9, 18, ARRAY['vegetarian','high-protein','halal']::text[], 'Vegetarian', 'egg', 'egg', '#C41101', '4 boiled eggs, peeled
8 red chilies
4 shallots
2 cloves garlic
1 tomato
1 tbsp oil
1 tsp lime juice
Salt and sugar to taste', '4 butir telur rebus, kupas
8 buah cabai merah
4 butir bawang merah
2 siung bawang putih
1 buah tomat
1 sdm minyak
1 sdt air jeruk nipis
Garam dan gula secukupnya', '1. Boil the eggs starting from cold water, bring to a boil, then continue boiling for 9–10 minutes for fully set yolks, then plunge into ice water and peel.
2. Fry the boiled eggs briefly in hot oil over medium heat for 2–3 minutes, occasionally shaking the pan, until the surface wrinkles and turns light brown (optional, helps the sauce cling better).
3. Grind the red chilies, shallots, garlic and tomato with a mortar or blender until smooth.
4. Heat the remaining oil in a pan over medium heat.
5. Saute the ground paste for 5–6 minutes, stirring occasionally, until it turns deep red, the oil separates slightly at the edges, and it smells fully cooked with no raw sharpness.
6. Season with salt and a little sugar, stir and taste.
7. Add the fried eggs to the sambal, stirring gently so they''re coated evenly without breaking apart.
8. Cook briefly for 2 minutes over low heat so the seasoning soaks into the egg surface.
9. Turn off the heat, add a squeeze of lime juice, and stir briefly.
10. Serve warm, enough for 2 servings.', '1. Rebus telur dari air dingin sampai mendidih, lanjutkan merebus 9–10 menit untuk kuning telur matang sempurna, lalu rendam di air es dan kupas.
2. Goreng telur rebus sebentar di minyak panas api sedang 2–3 menit sambil sesekali digoyang, sampai kulit luarnya berkerut dan berwarna kecokelatan (opsional, agar bumbu lebih menempel).
3. Haluskan cabai merah, bawang merah, bawang putih, dan tomat dengan ulekan atau blender sampai halus.
4. Panaskan sisa minyak di wajan dengan api sedang.
5. Tumis bumbu halus 5–6 menit sambil sesekali diaduk, sampai warnanya memerah tua, minyak sedikit terpisah di pinggir, dan aromanya matang tidak langu.
6. Bumbui dengan garam dan sedikit gula, aduk rata dan cicipi.
7. Masukkan telur goreng ke dalam sambal, aduk perlahan supaya telur terbalut bumbu merata tanpa hancur.
8. Masak sebentar 2 menit dengan api kecil supaya bumbu meresap ke permukaan telur.
9. Matikan api, beri perasan air jeruk nipis, aduk sebentar.
10. Sajikan hangat, cukup untuk 2 porsi.', 2, 30, NULL, NULL, NULL, NULL, 76)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-c-18', 'Telur Dadar Sayur (Vegetable Omelette)', 'Telur Dadar Sayur', 240, 16, 6, 17, ARRAY['vegetarian','high-protein','low-carb','halal']::text[], 'Vegetarian', 'egg', 'egg', '#C87000', '3 eggs
1 carrot, grated
2 spring onions, chopped
50 g cabbage, shredded
1 red chili, sliced
1 tbsp oil
Salt and pepper
1 tsp soy sauce', '3 butir telur
1 buah wortel, parut
2 batang daun bawang, cincang
50 g kol, iris halus
1 buah cabai merah, iris
1 sdm minyak
Garam dan lada
1 sdt kecap asin', '1. Peel and coarsely grate the carrot.
2. Chop the spring onion and thinly slice the red chili.
3. Crack the eggs into a bowl and beat with a fork until the yolks and whites are fully combined.
4. Season the beaten eggs with salt, pepper and soy sauce, whisk again briefly to combine.
5. Add the grated carrot, shredded cabbage, spring onion and chili to the beaten eggs, stir well.
6. Heat oil in a nonstick pan over low-medium heat until it shimmers.
7. Pour in the entire egg mixture, spreading it evenly with a spatula to a uniform thickness.
8. Cook over low heat for 3–4 minutes without stirring until the base and edges are set and golden.
9. Flip the omelette whole using a plate or lid, cook the other side 2–3 minutes until cooked through with no wet center.
10. Remove, cut into wedges, and serve warm.', '1. Kupas dan parut wortel dengan parutan kasar.
2. Cincang daun bawang dan iris tipis cabai merah.
3. Pecahkan telur ke mangkuk, kocok lepas dengan garpu sampai kuning dan putih menyatu.
4. Bumbui telur kocok dengan garam, lada, dan kecap asin, kocok lagi sebentar sampai rata.
5. Masukkan wortel parut, kol iris, daun bawang, dan cabai ke telur kocok, aduk rata.
6. Panaskan minyak di wajan antilengket dengan api kecil-sedang sampai berkilau.
7. Tuang seluruh adonan telur ke wajan, ratakan dengan spatula agar ketebalannya merata.
8. Masak dengan api kecil selama 3–4 menit tanpa diaduk sampai bagian bawah dan pinggirnya set serta berwarna keemasan.
9. Balik dadar secara utuh menggunakan piring atau tutup panci, masak sisi kedua 2–3 menit sampai matang merata dan tidak ada bagian basah di tengah.
10. Angkat, potong-potong, dan sajikan hangat.', 1, 15, NULL, NULL, NULL, NULL, 77)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-c-19', 'Perkedel Kentang (Baked Potato Patties)', 'Perkedel Kentang Panggang', 210, 8, 26, 8, ARRAY['vegetarian','halal']::text[], 'Snack', 'potato', 'meal', '#C87000', '3 potatoes, boiled and mashed
2 cloves garlic, fried
2 shallots, fried
1 egg
1 spring onion, chopped
1 tsp nutmeg powder
Salt and pepper
1 tsp oil for brushing', '3 buah kentang, rebus dan haluskan
2 siung bawang putih, goreng
2 butir bawang merah, goreng
1 butir telur
1 batang daun bawang, cincang
1 sdt pala bubuk
Garam dan lada
1 sdt minyak untuk olesan', '1. Peel the potatoes, cut into large chunks, and boil in boiling water for 15–20 minutes until tender when pierced with a fork.
2. Drain and mash the potatoes while still warm with a fork or masher until smooth with no lumps.
3. Fry the garlic and shallots briefly in hot oil until golden and crisp, drain, then finely grind or chop.
4. Mix the fried garlic and shallot into the mashed potato, stir well.
5. Add the chopped spring onion, nutmeg, salt and pepper, mix until the seasoning is evenly distributed.
6. Add the egg and mix quickly until the mixture is moist enough to hold together without sticking excessively to your hands.
7. Preheat the oven to 190°C and line a baking tray with parchment paper.
8. Scoop about 2 tbsp of the mixture, shape into a patty about 1.5 cm thick, and place on the tray with space between each.
9. Brush the surface of each patty lightly with oil using a pastry brush.
10. Bake for 12–15 minutes, flip once, then bake another 8–10 minutes until both sides are golden brown and slightly crisp on the outside.
11. Remove and serve warm, enough for 2 servings as a snack or side.', '1. Kupas kentang, potong dadu besar, rebus dalam air mendidih 15–20 menit sampai empuk saat ditusuk garpu.
2. Tiriskan kentang, haluskan selagi masih hangat dengan garpu atau alat penghalus supaya teksturnya lembut tanpa bergerindil.
3. Goreng bawang putih dan bawang merah sebentar di minyak panas sampai keemasan dan renyah, tiriskan, lalu haluskan atau cincang kasar.
4. Campurkan bawang goreng ke kentang tumbuk, aduk rata.
5. Tambahkan daun bawang cincang, pala bubuk, garam, dan lada, aduk sampai bumbu tersebar merata.
6. Masukkan telur, aduk cepat sampai adonan cukup lembap dan bisa dibentuk tanpa lengket berlebih di tangan.
7. Panaskan oven ke 190°C dan alasi loyang dengan kertas panggang.
8. Ambil adonan sekitar 2 sdm, bentuk bulat pipih setebal 1,5 cm, letakkan di loyang dengan jarak antar patty.
9. Oles permukaan tiap patty tipis-tipis dengan minyak menggunakan kuas.
10. Panggang 12–15 menit, balik sekali, lalu panggang lagi 8–10 menit sampai kedua sisi kecokelatan dan bagian luar sedikit renyah.
11. Angkat dan sajikan hangat, cukup untuk 2 porsi sebagai camilan atau lauk pendamping.', 2, 40, NULL, NULL, NULL, NULL, 78)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('idn-c-20', 'Otak-Otak (Baked Fish Cake in Leaf)', 'Otak-Otak Panggang', 230, 20, 12, 11, ARRAY['pescatarian','high-protein','halal']::text[], 'Snack', 'fish', 'fish', '#2F6BFF', '250 g fish fillet, minced
3 tbsp tapioca starch
3 cloves garlic
2 shallots
2 spring onions, chopped
4 tbsp coconut milk
1 egg white
Banana leaf and salt', '250 g fillet ikan, haluskan
3 sdm tepung tapioka
3 siung bawang putih
2 butir bawang merah
2 batang daun bawang, cincang
4 sdm santan
1 putih telur
Daun pisang dan garam', '1. Blend the fish fillet with the garlic, shallots and salt in a food processor or mortar until it forms a smooth, sticky paste.
2. Transfer the fish paste to a bowl, add the tapioca starch, coconut milk and egg white.
3. Mix or knead the mixture by hand until it becomes elastic and springy, no longer excessively sticky.
4. Fold in the chopped spring onion, mixing quickly so the mixture doesn''t deflate.
5. Pass the banana leaf briefly over the stove flame until pliable and easy to fold.
6. Take 2–3 tbsp of the mixture and shape it into a log on a piece of banana leaf.
7. Roll and wrap tightly, securing both ends with a skewer or staple.
8. Bring the steamer to a full rolling boil with plenty of steam, then steam the parcels for 15 minutes until the mixture is firm and doesn''t stick when pierced with a skewer.
9. Remove and let cool slightly, then grill briefly over charcoal or in a dry pan for 2–3 minutes per side until the leaf chars slightly and smells fragrant.
10. Serve the otak-otak with sweet chili-soy dip, enough for 2 servings.', '1. Haluskan fillet ikan bersama bawang putih, bawang merah, dan garam dengan food processor atau ulekan sampai membentuk pasta halus dan lengket.
2. Pindahkan pasta ikan ke mangkuk, tambahkan tepung tapioka, santan, dan putih telur.
3. Aduk atau uleni adonan dengan tangan sampai kalis dan kenyal, tidak lagi lengket berlebihan di tangan.
4. Masukkan daun bawang cincang, aduk rata dengan cepat supaya adonan tidak kempis.
5. Layukan daun pisang sebentar di atas api sampai lemas dan mudah dilipat.
6. Ambil 2–3 sdm adonan, bentuk memanjang di atas potongan daun pisang.
7. Gulung dan bungkus rapat, sematkan kedua ujungnya dengan lidi atau stepler.
8. Panaskan kukusan sampai beruap banyak, kukus bungkusan 15 menit sampai adonan padat dan tidak lengket saat ditusuk lidi.
9. Angkat dan biarkan sedikit dingin, lalu panggang di atas bara arang atau teflon kering 2–3 menit tiap sisi sampai daun sedikit gosong dan aromanya harum.
10. Sajikan otak-otak dengan sambal kecap manis, cukup untuk 2 porsi.', 2, 35, NULL, NULL, NULL, NULL, 79)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('intl-a-01', 'Teriyaki Chicken with Rice', 'Ayam Teriyaki dengan Nasi', 480, 42, 30, 18, ARRAY['normal','high-protein','halal']::text[], 'Chicken', 'chicken', 'protein', '#C41101', '150 g chicken thigh
2 tbsp teriyaki sauce
1 tsp honey
1 clove garlic
120 g cooked rice
80 g steamed broccoli
1 tsp sesame seeds
1 tsp oil', '150 g paha ayam
2 sdm saus teriyaki
1 sdt madu
1 siung bawang putih
120 g nasi
80 g brokoli kukus
1 sdt wijen
1 sdt minyak', '1. Pat the chicken thigh dry with paper towel, then cut into bite-size pieces about 3 cm.
2. Mince the garlic finely.
3. Heat the oil in a pan over medium-high heat until shimmering.
4. Sear the chicken pieces 3–4 minutes without stirring too much, until golden brown on the first side.
5. Flip and cook the other side 2–3 minutes until mostly cooked through.
6. Add the garlic and cook 30 seconds until fragrant, careful not to burn it.
7. Pour in the teriyaki sauce and honey, stir to coat the chicken evenly.
8. Simmer over medium-low heat 3–4 minutes, stirring occasionally, until the sauce reduces and glazes the chicken glossy and thick, and the internal temperature reaches 75°C.
9. Meanwhile, steam the broccoli florets 3–4 minutes until bright green and just tender-crisp.
10. Warm the cooked rice and spoon it into a serving bowl.
11. Slice the glazed chicken and arrange it over the rice with the steamed broccoli.
12. Spoon any remaining glaze from the pan over the top and sprinkle with sesame seeds.
13. Serve immediately while hot.', '1. Keringkan paha ayam dengan tisu dapur, lalu potong dadu sekitar 3 cm.
2. Cincang halus bawang putih.
3. Panaskan minyak di wajan dengan api sedang-besar sampai berkilau.
4. Panggang ayam 3–4 menit tanpa terlalu sering diaduk, sampai kecokelatan di satu sisi.
5. Balik, masak sisi lain 2–3 menit sampai hampir matang.
6. Masukkan bawang putih, tumis 30 detik sampai harum, jangan sampai gosong.
7. Tuang saus teriyaki dan madu, aduk supaya ayam terlapisi rata.
8. Masak dengan api sedang-kecil 3–4 menit sambil sesekali diaduk, sampai saus mengental mengilap dan bagian dalam ayam matang sempurna (suhu internal sekitar 75°C).
9. Sambil menunggu, kukus brokoli 3–4 menit sampai hijau cerah dan masih renyah.
10. Hangatkan nasi, sendokkan ke mangkuk saji.
11. Iris ayam yang sudah mengilap, susun di atas nasi bersama brokoli kukus.
12. Siram sisa saus dari wajan ke atas ayam, taburi wijen.
13. Sajikan segera selagi hangat.', 1, 20, NULL, NULL, NULL, NULL, 80)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('intl-a-02', 'Honey Garlic Chicken', 'Ayam Madu Bawang Putih', 500, 40, 34, 20, ARRAY['normal','high-protein','halal']::text[], 'Chicken', 'chicken', 'protein', '#C41101', '160 g chicken breast
2 tbsp honey
3 cloves garlic
1 tbsp soy sauce
1 tsp rice vinegar
130 g cooked rice
60 g green beans
1 tbsp oil', '160 g dada ayam
2 sdm madu
3 siung bawang putih
1 sdm kecap asin
1 sdt cuka beras
130 g nasi
60 g buncis
1 sdm minyak', '1. Cut the chicken breast into bite-size pieces about 2.5 cm.
2. Mince the garlic finely.
3. Heat the oil in a pan over medium-high heat until hot.
4. Add the chicken and cook 4–5 minutes, stirring occasionally, until browned on all sides.
5. Add the garlic and saute 30–45 seconds until fragrant without burning.
6. Combine the honey, soy sauce and rice vinegar in a small bowl.
7. Pour the sauce mixture into the pan, stir to coat the chicken.
8. Cook over medium heat 3–4 minutes, stirring constantly, until the sauce thickens, turns glossy, and coats the chicken evenly, with the inside fully cooked and no pink remaining.
9. Meanwhile, boil or steam the green beans 3–4 minutes until bright green and still crisp.
10. Warm the cooked rice and spoon it onto a serving plate.
11. Serve the honey garlic chicken over or alongside the rice with the green beans.', '1. Potong dada ayam jadi potongan sedadu sekitar 2,5 cm.
2. Cincang halus bawang putih.
3. Panaskan minyak di wajan dengan api sedang-besar sampai panas.
4. Masukkan ayam, masak 4–5 menit sambil sesekali diaduk sampai kecokelatan di semua sisi.
5. Masukkan bawang putih, tumis 30–45 detik sampai harum tanpa gosong.
6. Campurkan madu, kecap asin, dan cuka beras dalam mangkuk kecil.
7. Tuang campuran saus ke wajan, aduk rata dengan ayam.
8. Masak dengan api sedang 3–4 menit sambil terus diaduk sampai saus mengental, mengilap, dan melapisi ayam merata, serta bagian dalam matang sempurna tanpa sisa warna merah muda.
9. Sambil menunggu, rebus atau kukus buncis 3–4 menit sampai hijau cerah dan masih renyah.
10. Hangatkan nasi, sendokkan ke piring saji.
11. Sajikan ayam madu bawang putih di atas atau di samping nasi bersama buncis.', 1, 20, NULL, NULL, NULL, NULL, 81)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('intl-a-03', 'Chicken Curry', 'Kari Ayam', 540, 38, 40, 22, ARRAY['normal','high-protein','halal']::text[], 'Chicken', 'curry', 'meal', '#C87000', '180 g chicken thigh
1 tbsp curry powder
100 ml coconut milk
1 onion
2 cloves garlic
1 tomato
130 g cooked rice
1 tbsp oil', '180 g paha ayam
1 sdm bubuk kari
100 ml santan
1 bawang bombay
2 siung bawang putih
1 tomat
130 g nasi
1 sdm minyak', '1. Cut the chicken thigh into medium pieces about 3 cm.
2. Finely chop the onion and garlic.
3. Dice the tomato.
4. Heat the oil in a pot or deep pan over medium heat.
5. Saute the onion and garlic 3–4 minutes until softened, translucent and fragrant.
6. Add the curry powder, stir quickly for 30–60 seconds until fragrant and no longer smells raw, careful not to let it burn.
7. Add the chicken, stir to coat with the spices, cook 3–4 minutes until the surface changes color and lightly browns.
8. Add the tomato, stir and cook 1–2 minutes until it starts to soften and release its juices.
9. Pour in the coconut milk, stir well, bring to a boil over medium heat then lower the heat.
10. Simmer uncovered 12–15 minutes, stirring occasionally, until the chicken is tender and fully cooked and the sauce thickens slightly.
11. Taste and adjust the salt if needed.
12. Serve the hot chicken curry with rice.', '1. Potong ayam jadi potongan sedang sekitar 3 cm.
2. Cincang halus bawang bombay dan bawang putih.
3. Potong tomat jadi dadu.
4. Panaskan minyak di panci atau wajan dalam dengan api sedang.
5. Tumis bawang bombay dan bawang putih 3–4 menit sampai layu, bening, dan harum.
6. Masukkan bubuk kari, aduk cepat 30–60 detik sampai aromanya keluar dan tidak lagi berbau mentah, jangan sampai gosong.
7. Masukkan ayam, aduk rata dengan bumbu, masak 3–4 menit sampai permukaan ayam berubah warna dan sedikit kecokelatan.
8. Tambahkan tomat, aduk dan masak 1–2 menit sampai mulai lunak dan mengeluarkan air.
9. Tuang santan, aduk rata, didihkan dengan api sedang lalu kecilkan api.
10. Masak perlahan tanpa tutup 12–15 menit sambil sesekali diaduk, sampai ayam empuk dan matang sempurna serta kuah sedikit mengental.
11. Cicipi dan sesuaikan garam bila perlu.
12. Sajikan kari ayam panas dengan nasi.', 1, 30, NULL, NULL, NULL, NULL, 82)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('intl-a-04', 'Lighter Butter Chicken', 'Butter Chicken Ringan', 560, 40, 36, 26, ARRAY['normal','high-protein','halal']::text[], 'Chicken', 'chicken', 'protein', '#C87000', '170 g chicken breast
80 g plain yogurt
1 tbsp tomato paste
1 tsp garam masala
1 tbsp butter
2 cloves garlic
120 g cooked rice
80 ml light cream', '170 g dada ayam
80 g yogurt tawar
1 sdm pasta tomat
1 sdt garam masala
1 sdm mentega
2 siung bawang putih
120 g nasi
80 ml krim ringan', '1. Cut the chicken breast into 2.5 cm cubes.
2. Mix the yogurt with garam masala in a bowl, add the chicken, toss to coat, and let it marinate at least 15 minutes (chilled is even better).
3. Mince the garlic finely.
4. Melt the butter in a pan over medium-high heat until foaming.
5. Add the chicken with its marinade and cook 5–6 minutes, stirring occasionally, until browned on the surface.
6. Add the garlic and sauté 30 seconds until fragrant.
7. Stir in the tomato paste and cook 1–2 minutes until it darkens slightly.
8. Pour in the light cream and stir to combine, then lower the heat.
9. Simmer gently 6–8 minutes until the sauce thickens and the chicken is cooked through (no pink remaining).
10. Adjust the seasoning with salt if needed.
11. Steam or reheat the rice.
12. Spoon the rice onto a plate, ladle the butter chicken over it, and serve immediately while hot.', '1. Potong dada ayam dadu 2,5 cm.
2. Campur yogurt dengan garam masala dalam mangkuk, masukkan ayam, aduk rata, diamkan minimal 15 menit (lebih baik lagi jika di kulkas).
3. Cincang halus bawang putih.
4. Panaskan mentega di wajan dengan api sedang-besar sampai berbusa.
5. Masukkan ayam berikut marinasinya, masak 5–6 menit sambil sesekali diaduk sampai permukaan kecokelatan.
6. Masukkan bawang putih, tumis 30 detik sampai harum.
7. Tambahkan pasta tomat, aduk rata dan masak 1–2 menit sampai warnanya sedikit gelap.
8. Tuang krim ringan, aduk rata, lalu kecilkan api.
9. Masak perlahan 6–8 menit sampai saus mengental dan ayam matang sempurna (tidak ada bagian merah muda).
10. Koreksi rasa dengan garam bila perlu.
11. Kukus atau hangatkan nasi.
12. Sendokkan nasi ke piring, siram butter chicken di atasnya, sajikan segera selagi hangat.', 1, 30, NULL, NULL, NULL, NULL, 83)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('intl-a-05', 'Beef Stir-Fry', 'Tumis Daging Sapi', 520, 41, 32, 24, ARRAY['normal','high-protein','halal']::text[], 'Beef', 'beef', 'meal', '#C87000', '160 g lean beef strips
1 red bell pepper
1 onion
2 cloves garlic
2 tbsp soy sauce
1 tsp ginger
130 g cooked rice
1 tbsp oil', '160 g daging sapi iris
1 paprika merah
1 bawang bombay
2 siung bawang putih
2 sdm kecap asin
1 sdt jahe
130 g nasi
1 sdm minyak', '1. Slice the beef thinly against the grain, about 3–4 mm thick, so it stays tender.
2. Slice the bell pepper and onion lengthwise into 5 mm strips.
3. Mince the garlic and ginger finely.
4. Heat the oil in a pan or wok over high heat until it shimmers with a faint wisp of smoke.
5. Add the beef and stir-fry quickly 1–2 minutes, tossing constantly, until it changes color and browns lightly at the edges, then remove and set aside.
6. In the same pan, sauté the onion and pepper 2–3 minutes until softened but still crisp.
7. Add the garlic and ginger, stir-frying 30 seconds until fragrant.
8. Return the beef to the pan along with any juices.
9. Pour in the soy sauce and toss quickly over high heat for 1 minute until everything is coated and glossy.
10. Steam or reheat the rice.
11. Serve the stir-fried beef over rice while hot.', '1. Iris tipis daging sapi melawan arah serat setebal 3–4 mm agar empuk.
2. Iris paprika merah dan bawang bombay memanjang setebal 5 mm.
3. Cincang halus bawang putih dan jahe.
4. Panaskan minyak di wajan/wok dengan api besar sampai mengeluarkan asap tipis.
5. Masukkan daging, tumis cepat 1–2 menit sambil terus diaduk sampai berubah warna dan pinggirnya kecokelatan, lalu angkat dan sisihkan.
6. Di wajan yang sama, tumis bawang bombay dan paprika 2–3 menit sampai layu tapi masih renyah.
7. Masukkan bawang putih dan jahe, tumis 30 detik sampai harum.
8. Kembalikan daging ke wajan bersama air yang keluar.
9. Tuang kecap asin, aduk cepat dengan api besar selama 1 menit sampai semua terlapisi dan mengilap.
10. Kukus atau hangatkan nasi.
11. Sajikan tumisan daging di atas nasi selagi panas.', 1, 20, NULL, NULL, NULL, NULL, 84)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('intl-a-06', 'Beef Bulgogi', 'Bulgogi Daging Sapi', 540, 43, 34, 23, ARRAY['normal','high-protein','halal']::text[], 'Beef', 'beef', 'protein', '#C87000', '170 g thin beef slices
2 tbsp soy sauce
1 tbsp sesame oil
1 tbsp brown sugar
2 cloves garlic
1 spring onion
130 g cooked rice
1 tsp sesame seeds', '170 g daging sapi iris tipis
2 sdm kecap asin
1 sdm minyak wijen
1 sdm gula merah
2 siung bawang putih
1 daun bawang
130 g nasi
1 sdt wijen', '1. Mince the garlic finely and slice the spring onion thinly on the diagonal.
2. Mix the soy sauce, sesame oil, brown sugar and garlic in a bowl until the sugar dissolves.
3. Add the thinly sliced beef to the marinade, tossing and gently massaging so the flavors soak in.
4. Marinate at room temperature at least 10 minutes (30 minutes chilled gives more tender results).
5. Heat a pan with little to no oil over high heat until very hot.
6. Add the beef in a single layer without crowding, letting it sit 1–2 minutes until the edges brown.
7. Toss and cook 2–3 more minutes until the marinade reduces and starts to caramelize, coating the beef in a dark glossy glaze.
8. Remove from heat once the beef is cooked through.
9. Scatter in the spring onion and toss briefly.
10. Steam or reheat the rice.
11. Serve the beef over rice, topped with toasted sesame seeds.', '1. Cincang halus bawang putih, iris tipis daun bawang menyerong.
2. Campur kecap asin, minyak wijen, gula merah dan bawang putih dalam mangkuk sampai gula larut.
3. Masukkan irisan tipis daging sapi ke bumbu, aduk rata sambil diremas perlahan agar bumbu meresap.
4. Rendam di suhu ruang minimal 10 menit (idealnya di kulkas 30 menit untuk hasil lebih empuk).
5. Panaskan wajan dengan sedikit atau tanpa minyak dengan api besar sampai benar-benar panas.
6. Masukkan daging dalam satu lapis tipis tanpa ditumpuk, biarkan 1–2 menit sampai pinggirnya kecokelatan.
7. Aduk cepat dan masak 2–3 menit lagi sampai cairan bumbu menyusut dan mulai karamel, melapisi daging jadi mengilap gelap.
8. Angkat dari api saat daging matang merata.
9. Taburkan daun bawang, aduk sebentar.
10. Kukus atau hangatkan nasi.
11. Sajikan daging di atas nasi, taburi wijen sangrai.', 1, 25, NULL, NULL, NULL, NULL, 85)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('intl-a-07', 'Baked Salmon with Asparagus', 'Salmon Panggang dengan Asparagus', 430, 38, 12, 26, ARRAY['pescatarian','high-protein','keto','low-carb','halal']::text[], 'Seafood', 'salmon', 'fish', '#2F6BFF', '180 g salmon fillet
100 g asparagus
1 lemon
2 cloves garlic
1 tbsp olive oil
1 tsp dried dill
salt and pepper', '180 g fillet salmon
100 g asparagus
1 lemon
2 siung bawang putih
1 sdm minyak zaitun
1 sdt dill kering
garam dan lada', '1. Heat the oven to 200°C and line a tray with foil or parchment.
2. Pat the salmon dry with paper towels so the seasoning sticks.
3. Snap off the tough woody ends of the asparagus, about 2–3 cm from the bottom.
4. Mince the garlic finely.
5. Arrange the salmon and asparagus side by side on the tray.
6. Drizzle evenly with olive oil and scatter the minced garlic over both.
7. Season both with dried dill, salt and pepper.
8. Slice the lemon thinly, laying a few slices on the salmon and squeezing the rest over the asparagus.
9. Bake 12–15 minutes until the salmon flakes easily with a fork and is just cooked through (no longer translucent).
10. The asparagus should be tender-crisp with slightly wilted tips.
11. Remove and serve immediately while hot.', '1. Panaskan oven ke 200°C, siapkan loyang dilapis foil atau kertas panggang.
2. Keringkan permukaan salmon dengan tisu dapur agar bumbu menempel.
3. Patahkan bagian pangkal asparagus yang keras, sekitar 2–3 cm dari ujung bawah.
4. Cincang halus bawang putih.
5. Letakkan salmon dan asparagus berdampingan di loyang.
6. Siram merata dengan minyak zaitun, taburi bawang putih cincang.
7. Bumbui dengan dill kering, garam dan lada pada kedua bahan.
8. Iris lemon tipis, letakkan beberapa iris di atas salmon, lalu peras sisanya di atas asparagus.
9. Panggang 12–15 menit sampai salmon mudah terbelah dengan garpu dan bagian dalam sudah matang (tidak lagi bening/translucent).
10. Asparagus harus empuk-renyah dan sedikit layu di ujungnya.
11. Angkat dan sajikan segera selagi hangat.', 1, 25, NULL, NULL, NULL, NULL, 86)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('intl-a-08', 'Garlic Butter Shrimp', 'Udang Mentega Bawang Putih', 400, 36, 10, 24, ARRAY['pescatarian','high-protein','keto','low-carb','halal']::text[], 'Seafood', 'shrimp', 'fish', '#2F6BFF', '200 g peeled shrimp
2 tbsp butter
4 cloves garlic
1 tsp chili flakes
1 tbsp chopped parsley
1 lemon
salt and pepper', '200 g udang kupas
2 sdm mentega
4 siung bawang putih
1 sdt cabai bubuk
1 sdm peterseli cincang
1 lemon
garam dan lada', '1. Pat the shrimp dry with paper towels and season with salt and pepper.
2. Mince the garlic finely and roughly chop the parsley.
3. Melt the butter in a pan over medium heat until foaming but not browned.
4. Add the garlic and chili flakes, sautéing 30 seconds until fragrant (don''t let it burn).
5. Add the shrimp in a single layer, cooking 1–2 minutes on the first side until they start turning pink.
6. Flip and cook 1 more minute on the second side until cooked through and curled into a loose C-shape (tight curls mean it''s overcooked).
7. Remove the pan from the heat and squeeze the lemon juice directly over the shrimp.
8. Scatter the chopped parsley over the top and toss briefly.
9. Serve immediately while the butter is still melted and the shrimp are hot.', '1. Keringkan udang dengan tisu dapur, bumbui dengan garam dan lada.
2. Cincang halus bawang putih, cincang kasar peterseli.
3. Lelehkan mentega di wajan dengan api sedang sampai berbusa tapi belum kecokelatan.
4. Masukkan bawang putih dan cabai bubuk, tumis 30 detik sampai harum (jangan sampai gosong).
5. Masukkan udang dalam satu lapis, masak 1–2 menit di sisi pertama sampai mulai merah muda.
6. Balik udang, masak 1 menit lagi di sisi kedua sampai matang merata dan bentuknya melengkung membentuk huruf C (jangan sampai keriting rapat/overcook).
7. Angkat wajan dari api, peras air lemon langsung ke udang.
8. Taburi peterseli cincang, aduk sebentar.
9. Sajikan segera selagi mentega masih meleleh dan udang panas.', 1, 15, NULL, NULL, NULL, NULL, 87)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('intl-a-09', 'Fish Tacos', 'Taco Ikan', 470, 32, 38, 20, ARRAY['pescatarian','high-protein','halal']::text[], 'Seafood', 'fish', 'meal', '#2F6BFF', '180 g white fish fillet
3 small tortillas
80 g shredded cabbage
2 tbsp yogurt
1 lime
1 tsp paprika
1 tsp cumin
1 tbsp oil', '180 g fillet ikan putih
3 tortilla kecil
80 g kubis iris
2 sdm yogurt
1 jeruk nipis
1 sdt paprika bubuk
1 sdt jinten
1 sdm minyak', '1. Pat the fish fillet dry and season evenly with paprika and cumin.
2. Slice the cabbage thinly.
3. Mix the yogurt with a squeeze of lime juice in a small bowl for the sauce, reserving the rest of the lime for serving.
4. Heat the oil in a pan over medium-high heat.
5. Fry the fish 3–4 minutes on the first side until browned and crisp at the edges.
6. Flip and fry 2–3 more minutes until cooked through and flaky with a fork.
7. Remove the fish and break it into large flakes.
8. Warm the tortillas in a dry pan or over an open flame 20–30 seconds per side until pliable with light brown spots.
9. Fill each tortilla with the flaked fish and shredded cabbage.
10. Drizzle with the yogurt-lime sauce.
11. Serve immediately with extra lime wedges on the side.', '1. Keringkan fillet ikan dengan tisu dapur, bumbui merata dengan paprika bubuk dan jinten.
2. Iris tipis kubis.
3. Campur yogurt dengan sedikit air jeruk nipis dalam mangkuk kecil untuk saus, sisihkan sisa jeruk nipis untuk pelengkap.
4. Panaskan minyak di wajan dengan api sedang-besar.
5. Goreng ikan 3–4 menit di sisi pertama sampai kecokelatan dan tepinya renyah.
6. Balik, goreng 2–3 menit lagi sampai matang merata dan mudah hancur (flaky) dengan garpu.
7. Angkat ikan, hancurkan kasar jadi suiran besar.
8. Panaskan tortilla di wajan kering atau di atas api langsung 20–30 detik per sisi sampai lentur dan sedikit bercak cokelat.
9. Isi tiap tortilla dengan suiran ikan dan kubis iris.
10. Siram saus yogurt-jeruk nipis di atasnya.
11. Sajikan segera dengan tambahan perasan jeruk nipis.', 1, 20, NULL, NULL, NULL, NULL, 88)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('intl-a-10', 'Seared Tuna Steak', 'Tuna Steak Panggang Sebentar', 410, 44, 8, 22, ARRAY['pescatarian','high-protein','keto','low-carb','halal']::text[], 'Seafood', 'tuna', 'fish', '#2F6BFF', '200 g tuna steak
1 tbsp soy sauce
1 tsp sesame oil
1 tsp black pepper
1 tbsp sesame seeds
100 g mixed salad
1 tbsp olive oil', '200 g tuna steak
1 sdm kecap asin
1 sdt minyak wijen
1 sdt lada hitam
1 sdm wijen
100 g salad campur
1 sdm minyak zaitun', '1. Let the tuna sit out of the fridge 10 minutes before cooking so it comes closer to room temperature.
2. Pat the surface dry with paper towels.
3. Season both sides evenly with black pepper, then press the surface into the sesame seeds so they coat evenly.
4. Heat the sesame oil in a pan over high heat until very hot and faintly smoking.
5. Sear the tuna 45–60 seconds per side (including the edges) until the outside is browned but the center stays rare.
6. Remove and rest 1–2 minutes on a cutting board.
7. Slice the tuna thinly against the grain, about 5 mm thick.
8. Toss the mixed salad with olive oil.
9. Arrange the salad on a plate and top with the sliced tuna.
10. Drizzle soy sauce over the tuna and serve immediately.', '1. Keluarkan tuna dari kulkas 10 menit sebelum dimasak agar suhunya merata.
2. Keringkan permukaan tuna dengan tisu dapur.
3. Taburi lada hitam merata di kedua sisi, lalu tekan-tekan permukaannya ke wijen sampai menempel rata.
4. Panaskan minyak wijen di wajan dengan api besar sampai benar-benar panas dan sedikit berasap.
5. Letakkan tuna, panggang 45–60 detik per sisi (termasuk sisi pinggir) sampai bagian luar kecokelatan tapi bagian tengah masih merah/rare.
6. Angkat, istirahatkan 1–2 menit di talenan.
7. Iris tuna tipis melawan arah serat setebal 5 mm.
8. Beri salad campur dengan minyak zaitun, aduk rata.
9. Susun salad di piring, tata irisan tuna di atasnya.
10. Siram kecap asin di atas tuna, sajikan segera.', 1, 15, NULL, NULL, NULL, NULL, 89)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('intl-a-11', 'Turkey Meatballs in Tomato Sauce', 'Bakso Kalkun Saus Tomat', 460, 40, 28, 20, ARRAY['normal','high-protein','halal']::text[], 'Meatballs', 'turkey', 'protein', '#C41101', '200 g ground turkey
1 egg
2 tbsp breadcrumbs
200 ml tomato sauce
2 cloves garlic
1 tsp oregano
1 tbsp oil
80 g cooked pasta', '200 g kalkun giling
1 telur
2 sdm tepung roti
200 ml saus tomat
2 siung bawang putih
1 sdt oregano
1 sdm minyak
80 g pasta matang', '1. Mince the garlic finely.
2. In a bowl, combine the ground turkey, egg, breadcrumbs and part of the garlic, mixing gently by hand without overworking so the meatballs stay tender.
3. Wet your hands slightly and shape the mixture into golf-ball-sized meatballs (about 8–10).
4. Heat the oil in a pan over medium-high heat.
5. Add the meatballs, cooking 4–5 minutes while occasionally rolling them so the surface browns evenly (they don''t need to be cooked through yet).
6. Set the meatballs aside and sauté the remaining garlic in the same pan for 30 seconds until fragrant.
7. Pour in the tomato sauce and oregano, stirring to combine, then lower the heat.
8. Return the meatballs to the pan, cover, and simmer 10–12 minutes, turning occasionally, until cooked through (no pink in the center) and the sauce has thickened.
9. Boil the pasta according to package directions until al dente, then drain.
10. Serve the meatballs and sauce over the pasta, topped with the remaining oregano.', '1. Cincang halus bawang putih.
2. Dalam mangkuk, campur kalkun giling, telur, tepung roti dan sebagian bawang putih, aduk rata dengan tangan tanpa terlalu diremas agar bakso tidak alot.
3. Basahi tangan dengan sedikit air, bentuk adonan jadi bulatan sebesar bola golf (sekitar 8–10 bulatan).
4. Panaskan minyak di wajan dengan api sedang-besar.
5. Masukkan bakso, masak 4–5 menit sambil sesekali digulingkan sampai permukaannya kecokelatan merata (belum perlu matang sampai dalam).
6. Sisihkan bakso, tumis sisa bawang putih di wajan yang sama 30 detik sampai harum.
7. Tuang saus tomat dan oregano, aduk rata, kecilkan api.
8. Kembalikan bakso ke wajan, tutup wajan, masak perlahan 10–12 menit sambil sesekali dibalik sampai matang merata (tidak ada bagian merah muda di tengah) dan saus mengental.
9. Rebus pasta sesuai petunjuk kemasan sampai al dente, tiriskan.
10. Sajikan bakso dan saus di atas pasta, taburi sisa oregano.', 1, 30, NULL, NULL, NULL, NULL, 90)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('intl-a-12', 'Lean Spaghetti Bolognese', 'Spageti Bolognese Rendah Lemak', 560, 34, 58, 18, ARRAY['normal','high-protein']::text[], 'Pasta', 'pasta', 'meal', '#2A7A4F', '120 g spaghetti
150 g lean ground beef
200 ml tomato sauce
1 onion
2 cloves garlic
1 carrot
1 tsp oregano
1 tbsp oil', '120 g spageti
150 g daging sapi giling rendah lemak
200 ml saus tomat
1 bawang bombay
2 siung bawang putih
1 wortel
1 sdt oregano
1 sdm minyak', '1. Finely dice the onion, garlic and carrot into small pieces.
2. Bring a well-salted pot of water to a boil for the spaghetti.
3. Heat the oil in a pan over medium heat.
4. Sauté the onion, garlic and carrot 4–5 minutes until softened and fragrant.
5. Add the ground beef, breaking up any clumps with a spatula, and cook 5–6 minutes until evenly browned with no pink remaining.
6. Pour in the tomato sauce and oregano, stirring to combine.
7. Lower the heat and simmer uncovered 15 minutes, stirring occasionally, until the sauce thickens and comes together.
8. Meanwhile, add the spaghetti to the boiling water and cook according to package directions until al dente.
9. Drain the spaghetti, reserving a little pasta water.
10. Toss the spaghetti with the bolognese sauce in the pan, adding a splash of pasta water if it''s too thick.
11. Serve immediately while hot.', '1. Cincang halus bawang bombay, bawang putih dan wortel.
2. Didihkan air bergaram banyak dalam panci untuk merebus spageti.
3. Panaskan minyak di wajan dengan api sedang.
4. Tumis bawang bombay, bawang putih dan wortel 4–5 menit sampai layu dan harum.
5. Masukkan daging sapi giling, pecahkan gumpalannya dengan spatula, masak 5–6 menit sampai kecokelatan merata dan tidak ada lagi bagian merah muda.
6. Tuang saus tomat dan oregano, aduk rata.
7. Kecilkan api, masak perlahan tanpa tutup 15 menit sambil sesekali diaduk sampai saus mengental dan menyatu.
8. Sambil menunggu, masukkan spageti ke air mendidih, rebus sesuai petunjuk kemasan sampai al dente.
9. Tiriskan spageti, sisakan sedikit air rebusan.
10. Campur spageti dengan saus bolognese di wajan, aduk rata, tambahkan sedikit air rebusan bila terlalu kental.
11. Sajikan segera selagi hangat.', 1, 30, NULL, NULL, NULL, NULL, 91)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('intl-a-13', 'Chicken Fajita Bowl', 'Bowl Fajita Ayam', 520, 40, 42, 18, ARRAY['normal','high-protein','halal']::text[], 'Chicken', 'fajita', 'meal', '#C41101', '170 g chicken breast
1 bell pepper
1 onion
1 tsp paprika
1 tsp cumin
130 g cooked rice
50 g black beans
1 tbsp oil', '170 g dada ayam
1 paprika
1 bawang bombay
1 sdt paprika bubuk
1 sdt jinten
130 g nasi
50 g kacang hitam
1 sdm minyak', '1. Slice the chicken breast lengthwise into 1 cm strips.
2. Slice the bell pepper and onion thinly, lengthwise.
3. Toss the chicken evenly with paprika and cumin.
4. Heat the oil in a pan over medium-high heat.
5. Add the chicken, cooking 5–6 minutes while flipping occasionally until browned outside and cooked through inside (no pink remaining).
6. Remove the chicken and set aside.
7. In the same pan, sauté the pepper and onion 3–4 minutes over high heat until softened and lightly charred at the edges but still crisp.
8. Steam or reheat the rice.
9. Warm the black beans in a small pot or microwave.
10. Spoon the rice into a serving bowl as the base.
11. Arrange the chicken, pepper-onion mix and black beans over the rice.
12. Serve immediately while hot.', '1. Iris dada ayam memanjang setebal 1 cm.
2. Iris paprika dan bawang bombay memanjang tipis.
3. Lumuri ayam dengan paprika bubuk dan jinten sampai rata.
4. Panaskan minyak di wajan dengan api sedang-besar.
5. Masukkan ayam, masak 5–6 menit sambil sesekali dibalik sampai kecokelatan di luar dan matang sempurna di dalam (tidak ada bagian merah muda).
6. Angkat ayam, sisihkan.
7. Di wajan yang sama, tumis paprika dan bawang bombay 3–4 menit dengan api besar sampai layu dan sedikit hangus di pinggir tapi masih renyah.
8. Kukus atau hangatkan nasi.
9. Hangatkan kacang hitam di panci kecil atau microwave.
10. Susun nasi sebagai alas dalam mangkuk saji.
11. Tata ayam, tumisan paprika-bawang dan kacang hitam di atas nasi.
12. Sajikan segera selagi hangat.', 1, 25, NULL, NULL, NULL, NULL, 92)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('intl-a-14', 'Lighter Chicken Pad Thai', 'Pad Thai Ayam Ringan', 540, 30, 60, 18, ARRAY['normal','high-protein','halal']::text[], 'Noodle', 'padthai', 'meal', '#C87000', '120 g rice noodles
130 g chicken breast
1 egg
60 g bean sprouts
2 tbsp fish sauce
1 tbsp tamarind paste
1 tbsp crushed peanuts
1 lime', '120 g mie beras
130 g dada ayam
1 telur
60 g tauge
2 sdm saus ikan
1 sdm pasta asam jawa
1 sdm kacang tumbuk
1 jeruk nipis', '1. Soak the rice noodles in warm water 15–20 minutes until pliable but still slightly firm (not fully soft), then drain.
2. Cut the chicken breast into small strips.
3. Heat a little oil in a pan or wok over high heat.
4. Stir-fry the chicken 4–5 minutes, tossing, until cooked through and lightly browned.
5. Push the chicken to one side of the pan, crack the egg into the empty space, and scramble until half set.
6. Mix the egg together with the chicken.
7. Add the drained noodles, fish sauce and tamarind paste, tossing quickly over high heat for 2–3 minutes until the noodles soften and the seasoning is absorbed evenly.
8. Add the bean sprouts and toss briefly for 30–60 seconds until wilted but still crunchy.
9. Taste and adjust the salty-sour balance if needed.
10. Transfer to a plate and top with the crushed peanuts.
11. Serve with lime wedges on the side.', '1. Rendam mie beras dalam air hangat 15–20 menit sampai lentur tapi masih kenyal (belum lunak sepenuhnya), lalu tiriskan.
2. Potong dada ayam kecil memanjang.
3. Panaskan sedikit minyak di wajan/wok dengan api besar.
4. Tumis ayam 4–5 menit sambil diaduk sampai matang merata dan sedikit kecokelatan.
5. Sisihkan ayam ke pinggir wajan, kocok telur langsung di ruang kosong wajan, orak-arik sampai setengah matang.
6. Aduk telur dengan ayam.
7. Masukkan mie beras yang sudah ditiriskan, saus ikan dan pasta asam jawa, aduk cepat dengan api besar 2–3 menit sampai mie lunak dan bumbu terserap merata.
8. Masukkan tauge, aduk sebentar 30–60 detik sampai layu tapi masih renyah.
9. Cicipi, sesuaikan asin-asamnya bila perlu.
10. Pindahkan ke piring saji, taburi kacang tumbuk.
11. Sajikan dengan potongan jeruk nipis di sampingnya.', 1, 30, NULL, NULL, NULL, NULL, 93)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('intl-a-15', 'Chicken Quinoa Bowl', 'Bowl Quinoa Ayam', 490, 38, 44, 16, ARRAY['normal','high-protein','halal']::text[], 'Chicken', 'quinoa', 'veg', '#2A7A4F', '150 g chicken breast
100 g cooked quinoa
60 g cherry tomatoes
50 g cucumber
30 g feta cheese
1 tbsp olive oil
1 lemon
1 tsp oregano', '150 g dada ayam
100 g quinoa matang
60 g tomat ceri
50 g mentimun
30 g keju feta
1 sdm minyak zaitun
1 lemon
1 sdt oregano', '1. Rub the chicken breast with a little olive oil, oregano, salt and pepper.
2. Heat a grill pan or regular pan over medium-high heat.
3. Grill the chicken 5–6 minutes per side until nicely marked and cooked through (no pink remaining).
4. Remove and rest 3 minutes before slicing.
5. Slice the chicken lengthwise, about 1 cm thick.
6. Halve the cherry tomatoes.
7. Dice the cucumber into small cubes.
8. Crumble the feta cheese roughly with a fork.
9. Spoon the cooked quinoa into the base of a serving bowl.
10. Arrange the chicken, cherry tomatoes and cucumber over the quinoa.
11. Sprinkle the feta on top.
12. Drizzle with olive oil and lemon juice, sprinkle with oregano, and serve immediately.', '1. Bumbui dada ayam dengan sedikit minyak zaitun, oregano, garam dan lada.
2. Panaskan wajan grill atau wajan biasa dengan api sedang-besar.
3. Panggang ayam 5–6 menit per sisi sampai kecokelatan bergaris dan bagian dalam matang sempurna (tidak ada bagian merah muda).
4. Angkat, istirahatkan ayam 3 menit sebelum diiris.
5. Iris ayam memanjang setebal 1 cm.
6. Belah dua tomat ceri.
7. Potong mentimun dadu kecil.
8. Remukkan kasar keju feta dengan garpu.
9. Sendokkan quinoa matang ke dasar mangkuk saji.
10. Tata ayam, tomat ceri dan mentimun di atas quinoa.
11. Taburi feta di atasnya.
12. Siram minyak zaitun dan perasan lemon, taburi oregano, sajikan segera.', 1, 20, NULL, NULL, NULL, NULL, 94)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('intl-a-16', 'Lamb Kofta', 'Kofta Domba', 520, 36, 26, 30, ARRAY['normal','high-protein','halal']::text[], 'Lamb', 'lamb', 'meal', '#C87000', '180 g ground lamb
1 onion
2 cloves garlic
1 tsp cumin
1 tsp coriander
1 tbsp chopped mint
2 pita breads
2 tbsp yogurt', '180 g daging domba giling
1 bawang bombay
2 siung bawang putih
1 sdt jinten
1 sdt ketumbar
1 sdm daun mint cincang
2 roti pita
2 sdm yogurt', '1. Grate the onion and garlic finely, squeezing out some of the excess liquid by hand so the mixture isn''t too wet.
2. In a bowl, combine the ground lamb with the grated onion-garlic, cumin, coriander and part of the mint, kneading by hand until evenly mixed.
3. Chill the mixture 10 minutes to firm up and make it easier to shape.
4. Wet your hands and mold the mixture lengthwise around the skewers (about 4 skewers), pressing firmly so it holds together.
5. Heat a grill or grill pan over medium-high heat.
6. Grill the kofta, turning occasionally, for 8–10 minutes total until evenly browned outside and cooked through (no pink remaining).
7. Meanwhile, warm the pita bread briefly in a dry pan or oven until pliable.
8. Remove the kofta and rest 2 minutes.
9. Serve the kofta with pita bread, yogurt, and the remaining mint scattered on top.', '1. Parut halus bawang bombay dan bawang putih, peras sebagian airnya dengan tangan agar adonan tidak terlalu basah.
2. Dalam mangkuk, campur domba giling dengan bawang parut, jinten, ketumbar dan sebagian mint cincang, uleni rata dengan tangan.
3. Diamkan adonan di kulkas 10 menit agar lebih mudah dibentuk dan padat.
4. Basahi tangan, bentuk adonan memanjang mengelilingi tusuk sate (sekitar 4 tusuk), padatkan agar tidak lepas.
5. Panaskan panggangan atau wajan grill dengan api sedang-besar.
6. Panggang kofta sambil sesekali diputar, 8–10 menit total, sampai kecokelatan merata di luar dan matang sempurna di dalam (tidak ada bagian merah muda).
7. Sambil menunggu, hangatkan roti pita di wajan kering atau oven sebentar sampai lentur.
8. Angkat kofta, istirahatkan 2 menit.
9. Sajikan kofta dengan roti pita, yogurt dan sisa mint cincang di atasnya.', 1, 25, NULL, NULL, NULL, NULL, 95)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('intl-a-17', 'Teriyaki Tofu', 'Tahu Teriyaki', 420, 26, 38, 18, ARRAY['vegetarian','vegan','high-protein']::text[], 'Tofu', 'tofu', 'meal', '#2A7A4F', '200 g firm tofu
2 tbsp teriyaki sauce
1 tsp maple syrup
1 clove garlic
120 g cooked rice
60 g edamame
1 tbsp oil
1 tsp sesame seeds', '200 g tahu padat
2 sdm saus teriyaki
1 sdt sirup maple
1 siung bawang putih
120 g nasi
60 g edamame
1 sdm minyak
1 sdt wijen', '1. Wrap the tofu in paper towels or a clean cloth and press under something heavy for 10 minutes to draw out excess water.
2. Cut the tofu into 2 cm cubes.
3. Mince the garlic finely.
4. Heat the oil in a pan over medium-high heat.
5. Fry the tofu, turning occasionally, for 6–8 minutes until all sides are browned and crisp.
6. Lower the heat to medium, add the garlic, and sauté 30 seconds until fragrant.
7. Pour in the teriyaki sauce and maple syrup, stirring gently.
8. Cook 1–2 minutes, shaking the pan continuously, until the sauce thickens and glazes the tofu glossily.
9. Steam or reheat the rice, and boil or steam the edamame until tender.
10. Spoon the rice into a serving bowl and arrange the teriyaki tofu and edamame alongside.
11. Sprinkle with sesame seeds and serve immediately.', '1. Bungkus tahu dengan tisu dapur/kain bersih, tindih dengan benda berat 10 menit untuk mengeluarkan air.
2. Potong tahu dadu 2 cm.
3. Cincang halus bawang putih.
4. Panaskan minyak di wajan dengan api sedang-besar.
5. Goreng tahu sambil sesekali dibalik, 6–8 menit sampai semua sisi kecokelatan dan renyah di luar.
6. Kecilkan api ke sedang, masukkan bawang putih, tumis 30 detik sampai harum.
7. Tuang saus teriyaki dan sirup maple, aduk perlahan.
8. Masak 1–2 menit sambil terus digoyang sampai saus mengental dan melapisi tahu secara mengilap.
9. Kukus atau hangatkan nasi, rebus atau kukus edamame sampai empuk.
10. Sendokkan nasi ke mangkuk saji, tata tahu teriyaki dan edamame di sampingnya.
11. Taburi wijen, sajikan segera.', 1, 25, NULL, NULL, NULL, NULL, 96)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('intl-a-18', 'Black Pepper Beef', 'Sapi Lada Hitam', 510, 42, 30, 24, ARRAY['normal','high-protein','halal']::text[], 'Beef', 'beef', 'veg', '#C87000', '170 g beef sirloin strips
1 tbsp black pepper
2 tbsp oyster sauce
1 onion
1 green bell pepper
2 cloves garlic
130 g cooked rice
1 tbsp oil', '170 g sirloin sapi iris
1 sdm lada hitam
2 sdm saus tiram
1 bawang bombay
1 paprika hijau
2 siung bawang putih
130 g nasi
1 sdm minyak', '1. Slice the beef sirloin against the grain, about 3–4 mm thick.
2. Toss the beef with part of the black pepper and let it sit 5 minutes.
3. Slice the onion and green bell pepper lengthwise, and mince the garlic finely.
4. Heat the oil in a pan or wok over high heat until faintly smoking.
5. Add the beef and stir-fry quickly 1–2 minutes, tossing constantly, until it changes color and browns at the edges, then remove and set aside.
6. In the same pan, sauté the onion and green pepper 2–3 minutes until softened but still crisp.
7. Add the garlic and sauté 30 seconds until fragrant.
8. Pour in the oyster sauce and remaining black pepper, stirring to combine.
9. Return the beef to the pan and toss over high heat for 1 minute until everything is coated in sauce and heated through.
10. Steam or reheat the rice.
11. Serve immediately over rice while hot.', '1. Iris sirloin sapi melawan arah serat setebal 3–4 mm.
2. Lumuri daging dengan sebagian lada hitam, diamkan 5 menit.
3. Iris bawang bombay dan paprika hijau memanjang, cincang halus bawang putih.
4. Panaskan minyak di wajan/wok dengan api besar sampai berasap tipis.
5. Masukkan daging, tumis cepat 1–2 menit sambil terus diaduk sampai berubah warna dan pinggirnya kecokelatan, lalu angkat dan sisihkan.
6. Di wajan yang sama, tumis bawang bombay dan paprika hijau 2–3 menit sampai layu tapi masih renyah.
7. Masukkan bawang putih, tumis 30 detik sampai harum.
8. Tuang saus tiram dan sisa lada hitam, aduk rata.
9. Kembalikan daging ke wajan, aduk cepat dengan api besar 1 menit sampai semua terlapisi saus dan panas merata.
10. Kukus atau hangatkan nasi.
11. Sajikan segera di atas nasi selagi panas.', 1, 20, NULL, NULL, NULL, NULL, 97)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('intl-a-19', 'Lemon Herb Chicken', 'Ayam Lemon Herba', 440, 44, 14, 22, ARRAY['normal','high-protein','low-carb','halal']::text[], 'Chicken', 'chicken', 'fruit', '#C41101', '200 g chicken breast
1 lemon
2 cloves garlic
1 tsp dried thyme
1 tsp rosemary
2 tbsp olive oil
120 g roasted vegetables
salt and pepper', '200 g dada ayam
1 lemon
2 siung bawang putih
1 sdt thyme kering
1 sdt rosemary
2 sdm minyak zaitun
120 g sayuran panggang
garam dan lada', '1. Mince the garlic finely.
2. Squeeze the lemon juice and mix with the garlic, thyme, rosemary and olive oil in a bowl.
3. Coat the chicken evenly with the marinade on all sides.
4. Let it sit at room temperature for 10 minutes (or longer chilled for deeper flavor).
5. Season the chicken with salt and pepper just before cooking.
6. Heat a pan over medium-high heat until hot.
7. Sear the chicken 4–5 minutes on the first side without moving it, until golden.
8. Flip, lower the heat to medium, and cook 6–8 more minutes until cooked through to the center (no pink remaining, juices run clear).
9. Remove and rest 3 minutes before slicing.
10. Serve with the roasted vegetables on the side.', '1. Cincang halus bawang putih.
2. Peras air lemon, campur dengan bawang putih, thyme, rosemary dan minyak zaitun dalam mangkuk.
3. Lumuri ayam dengan bumbu rendaman merata di semua sisi.
4. Diamkan di suhu ruang 10 menit (atau lebih lama di kulkas untuk rasa lebih meresap).
5. Bumbui ayam dengan garam dan lada tepat sebelum dimasak.
6. Panaskan wajan dengan api sedang-besar sampai panas.
7. Panggang ayam 4–5 menit di sisi pertama tanpa digeser sampai keemasan.
8. Balik, kecilkan api ke sedang, masak 6–8 menit lagi sampai matang sempurna sampai ke bagian dalam (tidak ada bagian merah muda, sari yang keluar bening).
9. Angkat ayam, istirahatkan 3 menit sebelum diiris.
10. Sajikan dengan sayuran panggang di sampingnya.', 1, 25, NULL, NULL, NULL, NULL, 98)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('intl-a-20', 'Shrimp Stir-Fry Noodles', 'Mie Tumis Udang', 520, 34, 56, 16, ARRAY['pescatarian','high-protein','halal']::text[], 'Noodle', 'shrimp', 'fish', '#2F6BFF', '120 g egg noodles
180 g peeled shrimp
1 carrot
60 g snap peas
2 tbsp soy sauce
1 tsp sesame oil
2 cloves garlic
1 tbsp oil', '120 g mie telur
180 g udang kupas
1 wortel
60 g kacang polong
2 sdm kecap asin
1 sdt minyak wijen
2 siung bawang putih
1 sdm minyak', '1. Boil the egg noodles according to package directions until al dente, drain, and rinse with cold water to prevent sticking.
2. Slice the carrot thinly on the diagonal and trim the tough ends off the snap peas.
3. Mince the garlic finely.
4. Pat the shrimp dry with paper towels.
5. Heat the oil in a pan or wok over high heat.
6. Stir-fry the shrimp 2–3 minutes until pink and curled, then remove and set aside.
7. In the same pan, sauté the garlic, carrot and snap peas 2–3 minutes until the carrot softens slightly but stays crisp.
8. Add the drained noodles and toss to combine.
9. Return the shrimp to the pan.
10. Pour in the soy sauce and sesame oil, tossing quickly over high heat for 1–2 minutes until everything is evenly coated and hot.
11. Serve immediately while hot.', '1. Rebus mie telur sesuai petunjuk kemasan sampai al dente, tiriskan, siram air dingin agar tidak lengket.
2. Iris tipis wortel serong, buang ujung keras kacang polong.
3. Cincang halus bawang putih.
4. Keringkan udang dengan tisu dapur.
5. Panaskan minyak di wajan/wok dengan api besar.
6. Tumis udang 2–3 menit sampai berubah merah muda dan melengkung, angkat dan sisihkan.
7. Di wajan yang sama, tumis bawang putih, wortel dan kacang polong 2–3 menit sampai wortel sedikit layu tapi masih renyah.
8. Masukkan mie yang sudah ditiriskan, aduk rata.
9. Kembalikan udang ke wajan.
10. Tuang kecap asin dan minyak wijen, aduk cepat dengan api besar 1–2 menit sampai semua bahan terlapisi merata dan panas.
11. Sajikan segera selagi hangat.', 1, 20, NULL, NULL, NULL, NULL, 99)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('intl-b-01', 'Cheese and Herb Omelette', 'Omelet Keju dan Rempah', 340, 22, 6, 26, ARRAY['vegetarian','high-protein','low-carb']::text[], 'Breakfast', 'omelette', 'egg', '#C87000', '3 large eggs
30 grams grated cheddar
1 tablespoon butter
1 tablespoon chopped chives
1 tablespoon chopped parsley
Salt and pepper
Splash of milk', '3 butir telur besar
30 gram keju cheddar parut
1 sendok makan mentega
1 sendok makan daun kucai cincang
1 sendok makan peterseli cincang
Garam dan merica
Sedikit susu', '1. Crack the eggs into a bowl and add a splash of milk, salt and pepper.
2. Whisk until evenly combined and slightly frothy (don''t overbeat).
3. Melt the butter in a non-stick pan over medium heat until foaming and evenly coating the surface.
4. Pour in the eggs and swirl the pan so they spread evenly across the surface.
5. Let it sit 30–45 seconds until the edges start to set, then gently push from the edges toward the center with a spatula so the runny egg flows outward.
6. Once the surface is nearly set but still slightly wet, scatter the cheddar, chives and parsley over one half.
7. Fold the omelette in half over the filling.
8. Cook 1 more minute over low heat until the cheese melts and the inside is cooked but still soft.
9. Slide onto a plate and serve immediately while warm.', '1. Pecahkan telur ke mangkuk, tambahkan sedikit susu, garam dan lada.
2. Kocok telur sampai rata dan sedikit berbusa (jangan berlebihan).
3. Panaskan mentega di wajan anti lengket dengan api sedang sampai berbusa dan meleleh rata.
4. Tuang telur, goyangkan wajan agar telur menyebar rata ke seluruh permukaan.
5. Biarkan 30–45 detik sampai pinggirnya mulai set, lalu dorong perlahan dari pinggir ke tengah dengan spatula agar bagian yang masih cair mengalir ke pinggir.
6. Saat permukaan hampir set tapi masih sedikit basah, taburkan keju cheddar, kucai dan peterseli di satu sisi.
7. Lipat omelet menjadi dua menutupi isian.
8. Masak satu menit lagi dengan api kecil sampai keju meleleh dan bagian dalam matang tapi tetap lembut.
9. Pindahkan ke piring, sajikan segera selagi hangat.', 1, 10, NULL, NULL, NULL, NULL, 100)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('intl-b-02', 'Veggie Scramble', 'Telur Orak-Arik Sayur', 280, 14, 12, 19, ARRAY['vegetarian','high-protein','low-carb']::text[], 'Breakfast', 'egg', 'egg', '#2A7A4F', '3 eggs
Half red bell pepper diced
Handful baby spinach
2 mushrooms sliced
1 tablespoon olive oil
1 spring onion chopped
Salt and pepper', '3 butir telur
Setengah paprika merah potong dadu
Segenggam bayam muda
2 buah jamur iris
1 sendok makan minyak zaitun
1 batang daun bawang cincang
Garam dan merica', '1. Dice the red bell pepper small and slice the mushrooms thinly.
2. Beat the eggs with salt and pepper in a bowl.
3. Heat the olive oil in a pan over medium heat.
4. Sauté the bell pepper and mushrooms 3 minutes until softened and the mushroom liquid evaporates.
5. Add the baby spinach, cooking 30–60 seconds, stirring, until wilted.
6. Pour in the beaten eggs.
7. Stir gently with a spatula from the edges toward the center every few seconds until the eggs are softly set and still slightly moist (not dry).
8. Remove from heat while still a touch wet, since residual heat will finish cooking them.
9. Season with salt and pepper and scatter the spring onion on top.
10. Serve immediately while hot.', '1. Potong paprika merah dadu kecil, iris jamur tipis.
2. Kocok telur dengan garam dan lada dalam mangkuk.
3. Panaskan minyak zaitun di wajan dengan api sedang.
4. Tumis paprika dan jamur 3 menit sampai layu dan air dari jamur menguap.
5. Masukkan bayam muda, masak 30–60 detik sambil diaduk sampai layu.
6. Tuang telur kocok ke wajan.
7. Aduk perlahan dengan spatula dari pinggir ke tengah setiap beberapa detik sampai telur setengah set dan masih sedikit lembap (jangan sampai kering).
8. Angkat dari api saat telur masih sedikit basah karena akan matang lebih lanjut karena panas sisa.
9. Bumbui dengan garam dan lada, taburi daun bawang.
10. Sajikan segera selagi hangat.', 1, 12, NULL, NULL, NULL, NULL, 101)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('intl-b-03', 'Protein Pancakes', 'Panekuk Protein', 380, 28, 40, 10, ARRAY['vegetarian','high-protein']::text[], 'Breakfast', 'pancake', 'meal', '#C87000', '1 ripe banana
2 eggs
1 scoop vanilla protein powder
40 grams rolled oats
Half teaspoon baking powder
Pinch of cinnamon
1 teaspoon oil for cooking', '1 pisang matang
2 butir telur
1 sendok protein bubuk vanila
40 gram oat
Setengah sendok teh baking powder
Sejumput kayu manis
1 sendok teh minyak untuk memasak', '1. Peel and slice the banana, then add it to a blender with the eggs, protein powder and oats.
2. Blend until smooth with no large oat chunks remaining.
3. Pour the batter into a bowl and stir in the baking powder and cinnamon.
4. Let the batter rest 2–3 minutes so the oats swell slightly and it thickens.
5. Heat a non-stick pan over medium heat and lightly oil the surface.
6. Pour about 2–3 tablespoons of batter per pancake, shaping into rounds.
7. Cook 2–3 minutes until small bubbles appear on the surface and the edges start to look dry.
8. Flip and cook 1–2 more minutes on the second side until golden and cooked through in the center.
9. Repeat with the remaining batter, re-oiling the pan lightly as needed.
10. Serve immediately while warm.', '1. Kupas dan potong pisang, masukkan ke blender bersama telur, protein bubuk dan oat.
2. Blender sampai halus dan tidak ada gumpalan oat yang besar.
3. Tuang adonan ke mangkuk, aduk rata dengan baking powder dan kayu manis.
4. Diamkan adonan 2–3 menit agar oat sedikit mengembang dan adonan mengental.
5. Panaskan wajan anti lengket dengan api sedang, olesi tipis minyak.
6. Tuang adonan sekitar 2–3 sendok makan per panekuk, bentuk bulat.
7. Masak 2–3 menit sampai muncul gelembung kecil di permukaan dan pinggirnya mulai kering.
8. Balik panekuk, masak 1–2 menit lagi di sisi kedua sampai keemasan dan matang di tengah.
9. Ulangi dengan sisa adonan, olesi ulang minyak tipis bila perlu.
10. Sajikan segera selagi hangat.', 1, 15, NULL, NULL, NULL, NULL, 102)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('intl-b-04', 'Chia Pudding with Berries', 'Puding Chia dengan Beri', 260, 8, 30, 12, ARRAY['vegan','vegetarian']::text[], 'Breakfast', 'chia', 'meal', '#2A7A4F', '3 tablespoons chia seeds
200 millilitres almond milk
1 teaspoon maple syrup
Half teaspoon vanilla
Handful mixed berries
1 tablespoon chopped almonds
Pinch of salt', '3 sendok makan biji chia
200 mililiter susu almond
1 sendok teh sirup maple
Setengah sendok teh vanila
Segenggam beri campur
1 sendok makan almond cincang
Sejumput garam', '1. Measure the chia seeds into a jar or bowl.
2. Pour in the almond milk and add the maple syrup, vanilla and a pinch of salt.
3. Whisk vigorously for about 30 seconds so the chia seeds disperse evenly and don''t clump at the bottom.
4. Let the mixture sit for 5 minutes, then whisk again to break up any seeds that have settled.
5. Cover and refrigerate for at least 4 hours, or overnight, until the mixture has thickened into a gel-like pudding.
6. Check the texture — it should hold a spoon upright without sinking; if it''s still runny, chill 30 minutes more.
7. Stir once more to loosen the pudding, then spoon it into a glass or bowl.
8. Scatter the mixed berries evenly over the top.
9. Finish with the chopped almonds and serve chilled.', '1. Takar biji chia ke dalam toples atau mangkuk.
2. Tuang susu almond, lalu tambahkan sirup maple, vanila dan sejumput garam.
3. Kocok kuat-kuat sekitar 30 detik supaya biji chia tersebar rata dan tidak menggumpal di dasar.
4. Diamkan 5 menit, lalu kocok lagi untuk memecah biji yang mengendap.
5. Tutup dan dinginkan di kulkas minimal 4 jam, atau semalaman, sampai campuran mengental jadi puding kental seperti gel.
6. Cek teksturnya — sendok harus bisa berdiri tegak tanpa tenggelam; kalau masih encer, dinginkan 30 menit lagi.
7. Aduk sekali lagi untuk melunakkan puding, lalu sendokkan ke gelas atau mangkuk.
8. Taburi beri campur merata di atasnya.
9. Akhiri dengan almond cincang dan sajikan dingin.', 1, 245, NULL, NULL, NULL, NULL, 103)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('intl-b-05', 'Berry Smoothie Bowl', 'Mangkuk Smoothie Beri', 320, 9, 58, 8, ARRAY['vegan','vegetarian']::text[], 'Breakfast', 'smoothie', 'meal', '#2F6BFF', '1 frozen banana
150 grams frozen mixed berries
100 millilitres coconut milk
1 tablespoon granola
1 tablespoon shredded coconut
Few fresh strawberries
1 teaspoon chia seeds', '1 pisang beku
150 gram beri campur beku
100 mililiter santan
1 sendok makan granola
1 sendok makan kelapa parut
Beberapa stroberi segar
1 sendok teh biji chia', '1. Break the frozen banana into a few chunks so the blender doesn''t strain.
2. Add the banana, frozen mixed berries and coconut milk to the blender.
3. Blend in short pulses first to break up the ice, then run continuously until mostly smooth.
4. Keep the coconut milk to a minimum and stop blending as soon as it''s smooth — you want a thick, spoonable consistency, not a drink.
5. Scrape down the sides with a spatula if bits stick, then blend a final 10 seconds.
6. Pour the smoothie into a chilled bowl, smoothing the top with the back of a spoon.
7. Slice the fresh strawberries thinly and fan them across one side of the bowl.
8. Sprinkle the granola and shredded coconut over the rest.
9. Finish with a scatter of chia seeds and serve immediately before it softens.', '1. Potong pisang beku jadi beberapa bagian supaya tidak membebani blender.
2. Masukkan pisang, beri campur beku dan santan ke dalam blender.
3. Blender dengan pulse dulu untuk memecah es, lalu jalankan terus sampai sebagian besar halus.
4. Gunakan santan seminimal mungkin dan hentikan begitu halus — targetnya kental dan bisa disendok, bukan cair seperti minuman.
5. Kerok sisi blender dengan spatula kalau ada yang menempel, lalu blender lagi 10 detik terakhir.
6. Tuang smoothie ke mangkuk dingin, ratakan permukaannya dengan punggung sendok.
7. Iris tipis stroberi segar dan susun berbaris di salah satu sisi mangkuk.
8. Taburi granola dan kelapa parut di sisa permukaannya.
9. Akhiri dengan biji chia dan sajikan segera sebelum teksturnya melembek.', 1, 10, NULL, NULL, NULL, NULL, 104)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('intl-b-06', 'Apple Cinnamon Overnight Oats', 'Overnight Oats Apel Kayu Manis', 350, 12, 55, 9, ARRAY['vegetarian']::text[], 'Breakfast', 'oats', 'meal', '#C87000', '50 grams rolled oats
120 millilitres milk
2 tablespoons Greek yogurt
Half grated apple
1 teaspoon honey
Half teaspoon cinnamon
1 tablespoon raisins', '50 gram oat
120 mililiter susu
2 sendok makan yogurt Yunani
Setengah apel parut
1 sendok teh madu
Setengah sendok teh kayu manis
1 sendok makan kismis', '1. Grate the apple coarsely, skin on, right before mixing so it doesn''t brown.
2. Combine the rolled oats, milk and Greek yogurt in a jar.
3. Stir in the grated apple and cinnamon until evenly distributed.
4. Add the honey and raisins, stirring until the honey dissolves into the milk.
5. Mix well, scraping the sides so no dry oats are left clinging to the jar.
6. Seal the jar with a lid and refrigerate overnight, at least 6 hours, until the oats have softened and absorbed the liquid.
7. In the morning, check the consistency — stir in a splash of milk if it''s too thick.
8. Give it a final stir to redistribute the apple and spices.
9. Enjoy cold, straight from the jar.', '1. Parut kasar apel dengan kulitnya, tepat sebelum dicampur supaya tidak menghitam.
2. Campur oat, susu dan yogurt Yunani dalam toples.
3. Aduk apel parut dan kayu manis sampai tersebar rata.
4. Tambahkan madu dan kismis, aduk sampai madu larut ke dalam susu.
5. Aduk rata, kerok sisi toples supaya tidak ada oat kering yang menempel.
6. Tutup toples rapat dan dinginkan semalaman, minimal 6 jam, sampai oat melunak dan menyerap cairan.
7. Keesokan paginya, cek kekentalannya — tambahkan sedikit susu kalau terlalu kental.
8. Aduk sekali lagi untuk meratakan apel dan bumbu.
9. Nikmati dingin langsung dari toples.', 1, 0, 5, '[object Object]', '[object Object]', '[object Object]', 105)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('intl-b-07', 'Greek Yogurt Parfait', 'Parfait Yogurt Yunani', 300, 18, 34, 8, ARRAY['vegetarian','high-protein']::text[], 'Breakfast', 'yogurt', 'dairy', '#2A7A4F', '200 grams Greek yogurt
40 grams granola
Handful blueberries
1 sliced kiwi
1 teaspoon honey
1 tablespoon pumpkin seeds
Pinch of cinnamon', '200 gram yogurt Yunani
40 gram granola
Segenggam blueberry
1 buah kiwi iris
1 sendok teh madu
1 sendok makan biji labu
Sejumput kayu manis', '1. Peel the kiwi and slice into thin rounds about 3 mm thick.
2. Spoon half of the Greek yogurt into the bottom of a tall glass, smoothing it flat.
3. Scatter a layer of granola over the yogurt, followed by a layer of blueberries.
4. Spoon in the remaining yogurt, smoothing the top again.
5. Arrange the kiwi slices around the inside edge of the glass so they show through.
6. Drizzle honey evenly over the top layer.
7. Finish with a scatter of pumpkin seeds and a light dusting of cinnamon.
8. Serve immediately so the granola stays crisp.', '1. Kupas kiwi dan iris tipis bulat setebal sekitar 3 mm.
2. Sendokkan setengah yogurt Yunani ke dasar gelas tinggi, ratakan.
3. Taburi lapisan granola di atas yogurt, lanjutkan dengan lapisan blueberry.
4. Sendokkan sisa yogurt, ratakan lagi permukaannya.
5. Tata irisan kiwi di sisi dalam gelas supaya terlihat dari luar.
6. Siram madu merata di lapisan atas.
7. Akhiri dengan taburan biji labu dan sedikit kayu manis.
8. Sajikan segera supaya granola tetap renyah.', 1, 10, NULL, NULL, NULL, NULL, 106)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('intl-b-08', 'Shakshuka', 'Shakshuka', 310, 16, 18, 20, ARRAY['vegetarian','halal']::text[], 'Breakfast', 'egg', 'veg', '#C41101', '3 eggs
400 grams crushed tomatoes
1 onion sliced
1 red bell pepper diced
2 cloves garlic minced
1 teaspoon paprika
1 teaspoon cumin
2 tablespoons olive oil
Fresh coriander', '3 butir telur
400 gram tomat hancur
1 bawang bombay iris
1 paprika merah potong dadu
2 siung bawang putih cincang
1 sendok teh paprika bubuk
1 sendok teh jintan
2 sendok makan minyak zaitun
Ketumbar segar', '1. Slice the onion thinly and dice the bell pepper into roughly 1 cm pieces.
2. Heat the olive oil in a wide skillet over medium heat until it shimmers.
3. Add the onion and bell pepper, cooking 5–6 minutes, stirring occasionally, until soft and just starting to turn golden at the edges.
4. Stir in the minced garlic, paprika and cumin, cooking 30–60 seconds until fragrant but not browned.
5. Pour in the crushed tomatoes, scraping up any browned bits from the pan.
6. Simmer uncovered over medium-low heat for 10 minutes, stirring occasionally, until the sauce thickens and no longer looks watery.
7. Season with salt and pepper, then use the back of a spoon to make 3 shallow wells in the sauce.
8. Crack one egg into each well, keeping the yolks intact.
9. Cover the skillet and cook over low heat for 6–8 minutes, until the whites are fully set but the yolks are still soft and jammy.
10. Check doneness by gently jiggling the pan — the whites should not wobble, only the yolks.
11. Remove from heat, scatter fresh coriander over the top.
12. Serve straight from the pan while still bubbling hot.', '1. Iris tipis bawang bombay dan potong dadu paprika sekitar 1 cm.
2. Panaskan minyak zaitun di wajan lebar dengan api sedang sampai berkilau.
3. Tumis bawang dan paprika 5–6 menit, sesekali diaduk, sampai lunak dan pinggirnya mulai kecokelatan.
4. Masukkan bawang putih cincang, paprika bubuk dan jintan, masak 30–60 detik sampai harum tapi belum gosong.
5. Tuang tomat hancur, kerok bagian dasar wajan yang sedikit lengket.
6. Didihkan tanpa tutup dengan api sedang-kecil selama 10 menit, sesekali diaduk, sampai saus mengental dan tidak lagi berair.
7. Bumbui garam dan merica, lalu buat 3 lubang dangkal di saus dengan punggung sendok.
8. Pecahkan satu telur di tiap lubang, jaga kuning telurnya tetap utuh.
9. Tutup wajan dan masak dengan api kecil selama 6–8 menit, sampai putih telur set sempurna tapi kuningnya masih lembek dan creamy.
10. Cek kematangan dengan menggoyang wajan pelan — putih telur tidak boleh bergoyang, hanya kuningnya.
11. Angkat dari api, taburi ketumbar segar di atasnya.
12. Sajikan langsung dari wajan selagi masih mendidih panas.', 1, 30, NULL, NULL, NULL, NULL, 107)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('intl-b-09', 'Red Lentil Soup', 'Sup Lentil Merah', 290, 18, 40, 6, ARRAY['vegan','vegetarian','high-protein','halal']::text[], 'Vegan', 'soup', 'meal', '#C87000', '200 grams red lentils
1 onion chopped
2 carrots diced
2 cloves garlic minced
1 teaspoon cumin
1 litre vegetable broth
1 tablespoon olive oil
Squeeze of lemon
Salt and pepper', '200 gram lentil merah
1 bawang bombay cincang
2 wortel potong dadu
2 siung bawang putih cincang
1 sendok teh jintan
1 liter kaldu sayur
1 sendok makan minyak zaitun
Perasan lemon
Garam dan merica', '1. Rinse the red lentils under cold water until it runs clear, then drain.
2. Dice the onion and carrots into small, even pieces about 1 cm so they cook at the same rate.
3. Heat the olive oil in a pot over medium heat, then add the onion, carrot and minced garlic.
4. Sauté 4–5 minutes, stirring often, until the onion turns translucent and smells sweet.
5. Stir in the cumin and cook 30 seconds until fragrant.
6. Add the rinsed lentils and vegetable broth, stirring to combine.
7. Bring to a boil, then reduce to a low simmer and cook uncovered for 25 minutes, stirring occasionally, until the lentils fall apart and the carrots are fork-tender.
8. For a smooth soup, blend with an immersion blender until creamy; leave as is for a chunkier texture.
9. Season with salt and pepper to taste.
10. Stir in a generous squeeze of lemon juice just before serving to brighten the flavor.
11. Ladle into a bowl and serve hot.', '1. Bilas lentil merah di bawah air dingin sampai bening, lalu tiriskan.
2. Potong dadu kecil bawang bombay dan wortel sekitar 1 cm supaya matang bersamaan.
3. Panaskan minyak zaitun di panci dengan api sedang, lalu masukkan bawang, wortel dan bawang putih cincang.
4. Tumis 4–5 menit, sering diaduk, sampai bawang bening dan harum.
5. Aduk jintan, masak 30 detik sampai harum.
6. Tambahkan lentil yang sudah dibilas dan kaldu sayur, aduk rata.
7. Didihkan, lalu kecilkan api dan masak tanpa tutup selama 25 menit, sesekali diaduk, sampai lentil hancur dan wortel empuk saat ditusuk.
8. Untuk sup yang halus, blender dengan immersion blender sampai creamy; biarkan apa adanya kalau suka tekstur lebih kasar.
9. Bumbui garam dan merica sesuai selera.
10. Aduk perasan lemon yang banyak tepat sebelum disajikan untuk menyegarkan rasa.
11. Tuang ke mangkuk dan sajikan panas.', 1, 35, NULL, NULL, NULL, NULL, 108)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('intl-b-10', 'Chickpea Curry', 'Kari Buncis Kacang Arab', 420, 15, 52, 16, ARRAY['vegan','vegetarian','halal']::text[], 'Vegan', 'curry', 'meal', '#C87000', '400 grams cooked chickpeas
400 millilitres coconut milk
1 onion chopped
2 cloves garlic minced
1 tablespoon curry powder
1 teaspoon grated ginger
200 grams chopped tomatoes
1 tablespoon oil
Fresh coriander', '400 gram buncis kacang arab matang
400 mililiter santan
1 bawang bombay cincang
2 siung bawang putih cincang
1 sendok makan bubuk kari
1 sendok teh jahe parut
200 gram tomat cincang
1 sendok makan minyak
Ketumbar segar', '1. Finely chop the onion and mince the garlic and ginger.
2. Heat the oil in a pot over medium heat, then add the onion.
3. Cook 4–5 minutes, stirring occasionally, until softened and translucent.
4. Add the garlic and ginger, cooking 1 minute until fragrant.
5. Stir in the curry powder and toast it in the oil for 30–60 seconds until it smells deeply aromatic — this blooms the spices.
6. Add the chopped tomatoes and cook down 5 minutes, mashing lightly, until they break down into a thick paste.
7. Pour in the coconut milk and the drained chickpeas, stirring to combine.
8. Bring to a gentle simmer and cook uncovered for 15 minutes, stirring occasionally, until the sauce thickens and coats the back of a spoon.
9. Taste and adjust seasoning, adding a splash of water if the curry is too thick.
10. Garnish with fresh coriander leaves.
11. Serve hot with rice.', '1. Cincang halus bawang bombay, cincang bawang putih dan jahe.
2. Panaskan minyak di panci dengan api sedang, lalu masukkan bawang bombay.
3. Masak 4–5 menit, sesekali diaduk, sampai lunak dan bening.
4. Tambahkan bawang putih dan jahe, masak 1 menit sampai harum.
5. Aduk bubuk kari dan sangrai dalam minyak selama 30–60 detik sampai aromanya keluar kuat — ini membuat bumbu lebih harum.
6. Masukkan tomat cincang dan masak 5 menit, sedikit dihancurkan, sampai menjadi pasta kental.
7. Tuang santan dan buncis kacang arab yang sudah ditiriskan, aduk rata.
8. Didihkan pelan dan masak tanpa tutup selama 15 menit, sesekali diaduk, sampai saus mengental dan melapisi punggung sendok.
9. Cicipi dan sesuaikan bumbu, tambahkan sedikit air kalau kari terlalu kental.
10. Hias dengan daun ketumbar segar.
11. Sajikan panas dengan nasi.', 1, 30, NULL, NULL, NULL, NULL, 109)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('intl-b-11', 'Minestrone Soup', 'Sup Minestrone', 300, 12, 48, 7, ARRAY['vegan','vegetarian','halal']::text[], 'Vegan', 'soup', 'meal', '#2A7A4F', '1 onion chopped
2 carrots diced
2 celery stalks sliced
1 zucchini diced
400 grams chopped tomatoes
400 grams cooked cannellini beans
80 grams small pasta
1 litre vegetable broth
2 tablespoons olive oil', '1 bawang bombay cincang
2 wortel potong dadu
2 batang seledri iris
1 zukini potong dadu
400 gram tomat cincang
400 gram kacang cannellini matang
80 gram pasta kecil
1 liter kaldu sayur
2 sendok makan minyak zaitun', '1. Dice the onion, carrots and celery into small, even pieces about 1 cm for a classic soffritto.
2. Heat the olive oil in a large pot over medium heat, then add the onion, carrot and celery.
3. Sauté 5–6 minutes, stirring occasionally, until the vegetables soften and the onion turns translucent.
4. Dice the zucchini and add it to the pot, cooking 3 minutes until just starting to soften.
5. Pour in the chopped tomatoes and vegetable broth, stirring to combine.
6. Bring to a boil, then reduce heat and simmer 15 minutes until the vegetables are tender.
7. Add the cannellini beans and small pasta, stirring well so the pasta doesn''t stick to the pot.
8. Cook 8–10 minutes, stirring occasionally, until the pasta is al dente and the soup has thickened slightly.
9. Season with salt and pepper to taste.
10. Ladle into a bowl and serve hot, with a drizzle of olive oil if you like.', '1. Potong dadu kecil bawang bombay, wortel dan seledri sekitar 1 cm untuk soffritto klasik.
2. Panaskan minyak zaitun di panci besar dengan api sedang, lalu masukkan bawang, wortel dan seledri.
3. Tumis 5–6 menit, sesekali diaduk, sampai sayuran lunak dan bawang bening.
4. Potong dadu zukini dan masukkan ke panci, masak 3 menit sampai mulai melunak.
5. Tuang tomat cincang dan kaldu sayur, aduk rata.
6. Didihkan, lalu kecilkan api dan masak 15 menit sampai sayuran empuk.
7. Tambahkan kacang cannellini dan pasta kecil, aduk rata supaya pasta tidak lengket di dasar panci.
8. Masak 8–10 menit, sesekali diaduk, sampai pasta al dente dan sup sedikit mengental.
9. Bumbui garam dan merica sesuai selera.
10. Tuang ke mangkuk dan sajikan panas, beri sedikit minyak zaitun kalau suka.', 1, 35, NULL, NULL, NULL, NULL, 110)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('intl-b-12', 'Greek Salad', 'Salad Yunani', 330, 9, 16, 26, ARRAY['vegetarian','low-carb','halal']::text[], 'Salad', 'salad', 'veg', '#2A7A4F', '3 tomatoes cut in wedges
1 cucumber sliced
Half red onion sliced
100 grams feta cheese
Handful black olives
2 tablespoons olive oil
1 teaspoon dried oregano
Squeeze of lemon', '3 tomat potong juring
1 mentimun iris
Setengah bawang merah iris
100 gram keju feta
Segenggam zaitun hitam
2 sendok makan minyak zaitun
1 sendok teh oregano kering
Perasan lemon', '1. Cut the tomatoes into wedges and slice the cucumber into half-moons about 1 cm thick.
2. Slice the red onion paper-thin so it doesn''t overpower the salad.
3. Place the tomatoes, cucumber and onion in a wide bowl.
4. Scatter the black olives over the vegetables.
5. Break the feta into large, rustic chunks with your fingers and place it on top — don''t crumble it too finely.
6. Drizzle the olive oil evenly over the salad.
7. Squeeze the lemon juice over everything.
8. Sprinkle the dried oregano over the top.
9. Toss very gently, just enough to coat, so the feta stays in chunks.
10. Serve immediately while the vegetables are still crisp.', '1. Potong tomat jadi juring dan iris mentimun bentuk bulan sabit setebal sekitar 1 cm.
2. Iris bawang merah setipis mungkin supaya tidak mendominasi rasa salad.
3. Taruh tomat, mentimun dan bawang di mangkuk lebar.
4. Taburi zaitun hitam di atas sayuran.
5. Pecahkan feta jadi potongan besar dengan tangan dan letakkan di atas — jangan dihancurkan terlalu halus.
6. Siram minyak zaitun merata di atas salad.
7. Peras air lemon ke seluruh bagian.
8. Taburi oregano kering di atasnya.
9. Aduk sangat perlahan, cukup sampai terlapisi, supaya feta tetap berbentuk potongan.
10. Sajikan segera selagi sayuran masih renyah.', 1, 15, NULL, NULL, NULL, NULL, 111)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('intl-b-13', 'Quinoa Salad', 'Salad Quinoa', 380, 14, 52, 14, ARRAY['vegan','vegetarian','halal']::text[], 'Salad', 'quinoa', 'meal', '#2A7A4F', '150 grams cooked quinoa
1 cucumber diced
10 cherry tomatoes halved
Half red onion chopped
Handful chopped parsley
2 tablespoons olive oil
1 tablespoon lemon juice
40 grams chickpeas
Salt and pepper', '150 gram quinoa matang
1 mentimun potong dadu
10 tomat ceri belah dua
Setengah bawang merah cincang
Segenggam peterseli cincang
2 sendok makan minyak zaitun
1 sendok makan air lemon
40 gram buncis kacang arab
Garam dan merica', '1. Spread the cooked quinoa on a plate or wide bowl to cool to room temperature so it doesn''t wilt the vegetables.
2. Dice the cucumber into small cubes about 1 cm and halve the cherry tomatoes.
3. Finely chop the red onion and roughly chop the parsley.
4. Once the quinoa has cooled, fluff it with a fork and transfer to a large bowl.
5. Add the cucumber, tomatoes and onion to the quinoa.
6. Stir in the chickpeas and chopped parsley.
7. In a small bowl, whisk the olive oil with the lemon juice until slightly emulsified.
8. Pour the dressing over the salad.
9. Toss everything together until evenly coated.
10. Season with salt and pepper to taste and serve at room temperature or chilled.', '1. Ratakan quinoa matang di piring atau mangkuk lebar supaya dingin sampai suhu ruang agar tidak melayukan sayuran.
2. Potong dadu kecil mentimun sekitar 1 cm dan belah dua tomat ceri.
3. Cincang halus bawang merah dan cincang kasar peterseli.
4. Setelah quinoa dingin, kepulkan dengan garpu lalu pindahkan ke mangkuk besar.
5. Tambahkan mentimun, tomat dan bawang ke quinoa.
6. Aduk buncis kacang arab dan peterseli cincang.
7. Di mangkuk kecil, kocok minyak zaitun dengan air lemon sampai sedikit menyatu.
8. Tuang dressing ke atas salad.
9. Aduk semua sampai tercampur rata.
10. Bumbui garam dan merica sesuai selera, sajikan suhu ruang atau dingin.', 1, 15, NULL, NULL, NULL, NULL, 112)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('intl-b-14', 'Hummus Veggie Wrap', 'Wrap Hummus Sayur', 400, 13, 50, 17, ARRAY['vegan','vegetarian','halal']::text[], 'Snack', 'wrap', 'meal', '#C87000', '1 large tortilla
3 tablespoons hummus
Handful baby spinach
Half grated carrot
Half cucumber sliced
Quarter red bell pepper sliced
2 tablespoons sweetcorn
Squeeze of lemon', '1 tortila besar
3 sendok makan hummus
Segenggam bayam muda
Setengah wortel parut
Setengah mentimun iris
Seperempat paprika merah iris
2 sendok makan jagung manis
Perasan lemon', '1. Warm the tortilla in a dry skillet over medium heat for about 20 seconds per side, or microwave briefly, so it''s pliable and doesn''t crack when rolled.
2. Slice the cucumber and red bell pepper into thin strips.
3. Lay the warm tortilla flat and spread the hummus evenly across the middle, leaving a 3 cm border.
4. Layer the baby spinach over the hummus first so it anchors the other fillings.
5. Scatter the grated carrot and cucumber strips over the spinach.
6. Add the bell pepper strips and sweetcorn.
7. Squeeze the lemon juice over the filling.
8. Fold in the two opposite sides of the tortilla, then roll tightly from the bottom, tucking the filling in as you go.
9. Slice the wrap in half on a diagonal and serve immediately.', '1. Hangatkan tortila di wajan kering dengan api sedang sekitar 20 detik tiap sisi, atau panaskan sebentar di microwave, supaya lentur dan tidak retak saat digulung.
2. Iris tipis mentimun dan paprika merah.
3. Bentangkan tortila hangat, oleskan hummus merata di bagian tengah, sisakan pinggiran sekitar 3 cm.
4. Susun bayam muda di atas hummus lebih dulu supaya isian lain tidak bergeser.
5. Taburi wortel parut dan irisan mentimun di atas bayam.
6. Tambahkan irisan paprika dan jagung manis.
7. Peras air lemon di atas isian.
8. Lipat kedua sisi tortila yang berlawanan, lalu gulung rapat dari bawah sambil menekan isian.
9. Potong wrap jadi dua secara diagonal dan sajikan segera.', 1, 10, NULL, NULL, NULL, NULL, 113)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('intl-b-15', 'Falafel Bowl', 'Mangkuk Falafel', 450, 16, 55, 18, ARRAY['vegan','vegetarian','halal']::text[], 'Vegan', 'falafel', 'meal', '#2A7A4F', '6 baked falafel
150 grams cooked couscous
Handful mixed greens
5 cherry tomatoes halved
Half cucumber diced
2 tablespoons hummus
1 tablespoon tahini
Squeeze of lemon', '6 buah falafel panggang
150 gram couscous matang
Segenggam sayuran hijau campur
5 tomat ceri belah dua
Setengah mentimun potong dadu
2 sendok makan hummus
1 sendok makan tahini
Perasan lemon', '1. If the falafel is chilled, reheat in a dry skillet or oven for 3–4 minutes until warmed through and the outside is crisp again.
2. Halve the cherry tomatoes and dice the cucumber into small cubes.
3. Fluff the cooked couscous with a fork and spoon it into the base of a bowl.
4. Arrange the mixed greens over one side of the couscous.
5. Add the tomatoes and cucumber alongside the greens.
6. Place the warm falafel on top, whole or halved.
7. Add a generous scoop of hummus to one side of the bowl.
8. In a small bowl, whisk the tahini with a squeeze of lemon and a splash of water, a little at a time, until it turns pale and pourable.
9. Drizzle the tahini dressing over the whole bowl.
10. Serve immediately while the falafel is still warm.', '1. Kalau falafel dingin, panaskan lagi di wajan kering atau oven selama 3–4 menit sampai hangat merata dan bagian luarnya renyah lagi.
2. Belah dua tomat ceri dan potong dadu kecil mentimun.
3. Kepulkan couscous matang dengan garpu, lalu sendokkan ke dasar mangkuk.
4. Tata sayuran hijau di salah satu sisi couscous.
5. Tambahkan tomat dan mentimun di sebelah sayuran.
6. Letakkan falafel hangat di atasnya, utuh atau dibelah dua.
7. Tambahkan satu sendok besar hummus di salah satu sisi mangkuk.
8. Di mangkuk kecil, kocok tahini dengan perasan lemon dan sedikit air, sedikit demi sedikit, sampai warnanya pucat dan bisa dituang.
9. Siram dressing tahini ke seluruh mangkuk.
10. Sajikan segera selagi falafel masih hangat.', 1, 15, NULL, NULL, NULL, NULL, 114)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('intl-b-16', 'Veggie Stir-Fry', 'Tumis Sayur', 310, 12, 34, 14, ARRAY['vegan','vegetarian','halal']::text[], 'Vegan', 'stirfry', 'veg', '#2A7A4F', '1 head broccoli in florets
1 carrot sliced
1 red bell pepper sliced
100 grams snap peas
2 cloves garlic minced
2 tablespoons soy sauce
1 tablespoon sesame oil
1 teaspoon grated ginger
1 teaspoon sesame seeds', '1 brokoli potong kuntum
1 wortel iris
1 paprika merah iris
100 gram kacang polong
2 siung bawang putih cincang
2 sendok makan kecap asin
1 sendok makan minyak wijen
1 sendok teh jahe parut
1 sendok teh biji wijen', '1. Cut the broccoli into small, even florets and slice the carrot and bell pepper thinly on the diagonal so they cook quickly.
2. Heat the sesame oil in a wok or large skillet over high heat until it just starts to shimmer.
3. Add the minced garlic and grated ginger, stirring constantly for about 30 seconds until fragrant but not browned.
4. Toss in the broccoli and carrot first, since they take longest, and stir-fry 2 minutes.
5. Add the bell pepper and snap peas, keeping everything moving in the wok.
6. Pour in the soy sauce and stir-fry 3 minutes more, tossing constantly, until the vegetables are bright in color and tender-crisp — never mushy.
7. Check doneness by tasting a piece of broccoli — it should still have a slight bite.
8. Remove from heat immediately so the vegetables don''t overcook from residual heat.
9. Sprinkle the sesame seeds over the top and serve hot right away.', '1. Potong brokoli jadi kuntum kecil dan seragam, iris tipis wortel dan paprika secara diagonal supaya cepat matang.
2. Panaskan minyak wijen di wajan wok atau wajan besar dengan api besar sampai mulai berkilau.
3. Masukkan bawang putih cincang dan jahe parut, aduk terus sekitar 30 detik sampai harum tapi belum gosong.
4. Masukkan brokoli dan wortel dulu karena paling lama matang, tumis 2 menit.
5. Tambahkan paprika dan kacang polong, terus aduk supaya semua matang merata di wajan.
6. Tuang kecap asin dan tumis 3 menit lagi sambil terus diaduk, sampai sayuran berwarna cerah dan renyah-empuk — jangan sampai lembek.
7. Cek kematangan dengan mencicipi sepotong brokoli — teksturnya harus masih sedikit renyah.
8. Angkat segera dari api supaya sayuran tidak terlalu matang karena panas sisa.
9. Taburi biji wijen di atasnya dan sajikan panas segera.', 1, 15, NULL, NULL, NULL, NULL, 115)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('intl-b-17', 'Tofu Scramble', 'Tahu Orak-Arik', 270, 18, 14, 16, ARRAY['vegan','vegetarian','high-protein','halal']::text[], 'Vegan', 'tofu', 'egg', '#C87000', '200 grams firm tofu
Half teaspoon turmeric
1 teaspoon nutritional yeast
Half onion chopped
Handful baby spinach
1 tablespoon oil
1 spring onion chopped
Salt and pepper', '200 gram tahu padat
Setengah sendok teh kunyit
1 sendok teh ragi nutrisi
Setengah bawang bombay cincang
Segenggam bayam muda
1 sendok makan minyak
1 batang daun bawang cincang
Garam dan merica', '1. Press the tofu between paper towels for a few minutes to squeeze out excess water so it browns instead of steaming.
2. Crumble the tofu with your hands into rough, bite-sized pieces, resembling scrambled eggs.
3. Finely chop the onion.
4. Heat the oil in a nonstick skillet over medium heat, then add the onion.
5. Cook 3 minutes, stirring occasionally, until softened and translucent.
6. Add the crumbled tofu, turmeric and nutritional yeast, stirring to coat every piece evenly with the yellow color.
7. Stir-fry 5 minutes over medium heat, tossing occasionally, until the edges turn lightly golden and any moisture has cooked off.
8. Fold in the baby spinach and cook 1–2 minutes, just until it wilts down.
9. Season with salt and pepper to taste.
10. Remove from heat and top with the chopped spring onion before serving.', '1. Tekan tahu di antara tisu dapur beberapa menit untuk memeras kelebihan air supaya nanti kecokelatan, bukan mengukus.
2. Hancurkan tahu dengan tangan jadi potongan kasar seukuran gigitan, mirip telur orak-arik.
3. Cincang halus bawang bombay.
4. Panaskan minyak di wajan antilengket dengan api sedang, lalu masukkan bawang.
5. Masak 3 menit, sesekali diaduk, sampai lunak dan bening.
6. Masukkan tahu hancur, kunyit dan ragi nutrisi, aduk supaya tiap potongan terlapisi warna kuning merata.
7. Tumis 5 menit dengan api sedang, sesekali diaduk, sampai pinggirnya sedikit keemasan dan airnya sudah menguap.
8. Masukkan bayam muda dan masak 1–2 menit, cukup sampai layu.
9. Bumbui garam dan merica sesuai selera.
10. Angkat dari api dan taburi daun bawang cincang sebelum disajikan.', 1, 20, NULL, NULL, NULL, NULL, 116)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('intl-b-18', 'Peanut Noodle Salad', 'Salad Mie Kacang', 420, 14, 52, 18, ARRAY['vegan','vegetarian']::text[], 'Salad', 'noodle', 'meal', '#C41101', '150 grams cooked rice noodles
2 tablespoons peanut butter
1 tablespoon soy sauce
1 tablespoon lime juice
1 teaspoon maple syrup
1 grated carrot
Half red bell pepper sliced
2 tablespoons chopped peanuts
Fresh coriander', '150 gram mie beras matang
2 sendok makan selai kacang
1 sendok makan kecap asin
1 sendok makan air jeruk nipis
1 sendok teh sirup maple
1 wortel parut
Setengah paprika merah iris
2 sendok makan kacang cincang
Ketumbar segar', '1. Rinse the cooked rice noodles under cold running water, separating the strands with your fingers so they don''t stick together.
2. Drain well and set aside.
3. In a bowl, whisk the peanut butter with the soy sauce and lime juice until smooth — add a teaspoon of warm water if it''s too thick to whisk.
4. Stir in the maple syrup to balance the salt and acidity.
5. Grate the carrot and slice the red bell pepper into thin strips.
6. Place the noodles in a large bowl and toss with the carrot and bell pepper.
7. Pour the peanut dressing over the noodles.
8. Toss thoroughly with tongs, lifting from the bottom, until every strand is coated.
9. Taste and adjust with more lime or soy sauce if needed.
10. Top with the chopped peanuts and fresh coriander before serving.', '1. Bilas mie beras matang di bawah air dingin mengalir, pisahkan helai-helainya dengan jari supaya tidak menggumpal.
2. Tiriskan sampai kering dan sisihkan.
3. Di mangkuk, kocok selai kacang dengan kecap asin dan air jeruk nipis sampai halus — tambahkan seujung sendok teh air hangat kalau terlalu kental untuk dikocok.
4. Aduk sirup maple untuk menyeimbangkan rasa asin dan asam.
5. Parut wortel dan iris tipis paprika merah.
6. Taruh mie di mangkuk besar, aduk dengan wortel dan paprika.
7. Tuang dressing kacang ke atas mie.
8. Aduk merata dengan capit sambil mengangkat dari dasar, sampai setiap helai terlapisi.
9. Cicipi dan sesuaikan dengan tambahan jeruk nipis atau kecap asin kalau perlu.
10. Beri kacang cincang dan ketumbar segar sebelum disajikan.', 1, 15, NULL, NULL, NULL, NULL, 117)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('intl-b-19', 'Edamame Rice Bowl', 'Mangkuk Nasi Edamame', 440, 18, 62, 12, ARRAY['vegan','vegetarian','high-protein','halal']::text[], 'Vegan', 'rice', 'meal', '#2A7A4F', '150 grams cooked brown rice
100 grams shelled edamame
Half avocado sliced
1 grated carrot
2 tablespoons sweetcorn
1 tablespoon soy sauce
1 teaspoon sesame oil
1 teaspoon sesame seeds
1 sheet nori shredded', '150 gram nasi merah matang
100 gram edamame kupas
Setengah alpukat iris
1 wortel parut
2 sendok makan jagung manis
1 sendok makan kecap asin
1 sendok teh minyak wijen
1 sendok teh biji wijen
1 lembar nori suwir', '1. Steam or boil the edamame for 3 minutes until bright green and tender, then drain.
2. While the edamame cooks, grate the carrot and slice the avocado thinly.
3. Warm the cooked brown rice, then spoon it into the base of a bowl.
4. Arrange the edamame, grated carrot and sweetcorn in separate sections over the rice.
5. Fan the sliced avocado over one side of the bowl.
6. In a small bowl, mix the soy sauce with the sesame oil.
7. Drizzle the soy-sesame mixture evenly over the bowl.
8. Sprinkle the sesame seeds on top.
9. Shred the nori sheet with scissors or your hands and scatter it over everything.
10. Serve immediately while the rice is still warm.', '1. Kukus atau rebus edamame selama 3 menit sampai hijau cerah dan empuk, lalu tiriskan.
2. Sambil menunggu edamame, parut wortel dan iris tipis alpukat.
3. Hangatkan nasi merah matang, lalu sendokkan ke dasar mangkuk.
4. Tata edamame, wortel parut dan jagung manis di bagian terpisah di atas nasi.
5. Susun irisan alpukat berbaris di salah satu sisi mangkuk.
6. Di mangkuk kecil, campur kecap asin dengan minyak wijen.
7. Siram campuran kecap-wijen merata ke seluruh mangkuk.
8. Taburi biji wijen di atasnya.
9. Suwir nori dengan gunting atau tangan, taburkan ke seluruh bagian.
10. Sajikan segera selagi nasi masih hangat.', 1, 15, NULL, NULL, NULL, NULL, 118)
on conflict (id) do nothing;

insert into public.my20fit_recipe_official (id, name_en, name_id, kcal, p, c, f, diet_types, category, q, emoji, tint, ingredients_en, ingredients_id, steps_en, steps_id, servings, cook_minutes, prep_minutes, equipment, prep_note, common_mistake, sort_order)
values ('intl-b-20', 'Banana Peanut Smoothie', 'Smoothie Pisang Kacang', 360, 14, 48, 12, ARRAY['vegetarian','high-protein']::text[], 'Breakfast', 'smoothie', 'meal', '#C87000', '1 ripe banana
2 tablespoons peanut butter
250 millilitres milk
2 tablespoons Greek yogurt
1 teaspoon honey
1 tablespoon rolled oats
Pinch of cinnamon
Few ice cubes', '1 pisang matang
2 sendok makan selai kacang
250 mililiter susu
2 sendok makan yogurt Yunani
1 sendok teh madu
1 sendok makan oat
Sejumput kayu manis
Beberapa es batu', '1. Peel the ripe banana and break it into a few chunks.
2. Add the banana and peanut butter to the blender first so the banana helps break down the peanut butter.
3. Pour in the milk and Greek yogurt.
4. Add the honey, rolled oats and a pinch of cinnamon.
5. Blend on low speed for a few seconds to combine, then add the ice cubes.
6. Blend on high until completely smooth, about 30–45 seconds, stopping to scrape down the sides if needed.
7. Check the consistency — it should coat the back of a spoon but still pour; blend in a splash more milk if too thick.
8. Pour into a tall glass immediately, before the oats settle.
9. Serve right away while cold.', '1. Kupas pisang matang dan potong jadi beberapa bagian.
2. Masukkan pisang dan selai kacang ke blender dulu supaya pisang membantu menghaluskan selai kacang.
3. Tuang susu dan yogurt Yunani.
4. Tambahkan madu, oat dan sejumput kayu manis.
5. Blender dengan kecepatan rendah beberapa detik untuk mencampur, lalu masukkan es batu.
6. Blender dengan kecepatan tinggi sampai benar-benar halus, sekitar 30–45 detik, berhenti sebentar untuk mengerok sisi blender kalau perlu.
7. Cek kekentalannya — harus melapisi punggung sendok tapi masih bisa dituang; tambahkan sedikit susu kalau terlalu kental.
8. Tuang ke gelas tinggi segera, sebelum oat mengendap.
9. Sajikan segera selagi dingin.', 1, 8, NULL, NULL, NULL, NULL, 119)
on conflict (id) do nothing;
