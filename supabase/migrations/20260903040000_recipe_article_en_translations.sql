-- Terjemahan EN untuk 50 artikel yang sudah ditulis sesi Claude lain (2026-09-02, sekitar
-- 08:02-08:51 UTC) saat masih di skema satu-bahasa. Migration sebelumnya
-- (20260902100000_recipe_article_bilingual) menyalin title/excerpt/body_md/category ke
-- KEDUA kolom _id/_en secara identik (satu-satunya pilihan aman saat itu, krn belum ada
-- teks EN asli) -- migration ini menggantinya dengan terjemahan EN asli (ditulis manual,
-- bukan mesin-terjemah literal) supaya toggle ID/EN benar-benar berfungsi utk ke-50
-- artikel ini juga, bukan cuma 4 artikel yang saya tulis sendiri.

-- Sudah diterapkan ke DB live (project cpvzwqptzcxnwzfzgrmt) via apply_migration (5 batch
-- krn ukuran), diverifikasi: 54/54 baris title_en != title_id, 0 title_en kosong.

update public.my20fit_recipe_article set title_en='🍎 10 Healthy Snacks Under 150 Calories', excerpt_en='Snacking doesn''t have to derail your healthy habits. Choose filling snacks with calories under control.', category_en='Healthy Snacks', body_md_en='Snacking doesn''t have to derail your healthy habits. Choose filling snacks with calories under control.

![🍎 10 Healthy Snacks Under 150 Calories](https://images.unsplash.com/photo-1447279506476-3faec8071eee?auto=format&fit=crop&w=1000&q=70)

## Filling choices
Fruit, Greek yogurt, boiled eggs, and edamame give you a satisfying feeling without excess calories.

## Prep before you''re hungry
Having healthy snacks ready to go keeps you from reaching for fried snacks or chips when hunger strikes.

**Quick tips:**
- Apple + a thin spread of peanut butter
- Greek yogurt + berries
- Boiled egg
- Steamed edamame
- A handful of unsalted roasted nuts

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='10-camilan-sehat-di-bawah-150-kalori';
update public.my20fit_recipe_article set title_en='🍱 5 Healthier Rice Dishes, the 20FIT Way', excerpt_en='Rice can still be part of a healthy diet — as long as you''re smart about the sides and the portion.', category_en='Menu Recommendations', body_md_en='Rice can still be part of a healthy diet — as long as you''re smart about the sides and the portion.

![🍱 5 Healthier Rice Dishes, the 20FIT Way](https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=1000&q=70)

## Choose a better carb
Use brown rice, or mix it with white rice, to add fiber and slow down the rise in blood sugar.

## Round it out with protein & veggies
Add a protein side and vegetables so the plate is more balanced and keeps you full longer.

**Quick tips:**
- Brown rice + grilled chicken + fresh vegetables
- Rice + steamed tofu parcel + urap (vegetable salad)
- Rice + steamed fish + stir-fried water spinach
- Rice + spicy egg + clear vegetable soup
- Trim the rice portion, add more vegetables

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='5-menu-nasi-yang-lebih-sehat-versi-20fit';
update public.my20fit_recipe_article set title_en='🥗 5 Healthy Eating Principles That Are Easy to Apply Daily', excerpt_en='Eating healthy doesn''t have to be complicated or expensive. The key is consistency with a few basic principles, not strict rules that are hard to keep.', category_en='Healthy Eating', body_md_en='Eating healthy doesn''t have to be complicated or expensive. The key is consistency with a few basic principles, not strict rules that are hard to keep.

![🥗 5 Healthy Eating Principles That Are Easy to Apply Daily](https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=70)

## Favor whole foods
Choose ingredients as close as possible to their original form: brown rice, vegetables, fruit, eggs, fish, tofu and tempeh. The less processed, the better.

## Balance your plate
Picture half the plate as vegetables/fruit, a quarter protein, a quarter carbohydrates. This pattern manages portions automatically, without needing to count anything.

**Quick tips:**
- Make plain water your main drink
- Cut back on fried food and added sugar
- Don''t skip protein at any meal
- Eat slowly, stop before you''re overly full
- Leave room for flexibility

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='5-prinsip-makan-sehat-yang-gampang-diterapkan-sehari-hari';
update public.my20fit_recipe_article set title_en='🍱 7 High-Protein Healthy Breakfasts for Busy Mornings', excerpt_en='A busy morning is no excuse to skip a nutritious breakfast. These dishes are quick to prepare and filling.', category_en='Menu Recommendations', body_md_en='A busy morning is no excuse to skip a nutritious breakfast. These dishes are quick to prepare and filling.

![🍱 7 High-Protein Healthy Breakfasts for Busy Mornings](https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=1000&q=70)

## Quick options
Boiled eggs + whole wheat toast, Greek yogurt + fruit, or overnight oats can all be prepped the night before.

## For the savory crowd
Scrambled tofu and tempeh, shredded chicken breast, or a protein smoothie work well if you''re not a fan of sweet breakfasts.

**Quick tips:**
- Overnight oats + chia seeds + banana
- Vegetable omelette
- Greek yogurt + granola + berries
- Whole wheat toast + avocado + egg
- Milk smoothie + peanut butter

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='7-menu-sarapan-sehat-tinggi-protein-untuk-pagi-sibuk';
update public.my20fit_recipe_article set title_en='🍎 Make Your Own Energy Bars at Home', excerpt_en='Homemade energy bars are cheaper and let you control the sugar content.', category_en='Healthy Snacks', body_md_en='Homemade energy bars are cheaper and let you control the sugar content.

![🍎 Make Your Own Energy Bars at Home](https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1000&q=70)

## Base ingredients
Oats, dates, nuts, and seeds can be combined without any baking required.

## Keep the sweetness natural
Use dates or banana as a natural sweetener instead of added sugar.

**Quick tips:**
- Oats + dates + nuts as the base
- Add chia or sesame seeds
- Sweeten with fruit, not sugar
- Press into a pan and chill in the fridge
- Cut into small portions for control

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='bikin-energy-bar-sendiri-di-rumah';
update public.my20fit_recipe_article set title_en='🍎 Fruit as a Snack: Which Ones Keep You Fullest', excerpt_en='Fruit is a natural snack, but some are more filling thanks to their fiber and water content.', category_en='Healthy Snacks', body_md_en='Fruit is a natural snack, but some are more filling thanks to their fiber and water content.

![🍎 Fruit as a Snack: Which Ones Keep You Fullest](https://images.unsplash.com/photo-1447279506476-3faec8071eee?auto=format&fit=crop&w=1000&q=70)

## Choose high-fiber fruit
Apples, pears, oranges, and guava are high in fiber, so they keep you full longer.

## Pair it with protein
Adding a little protein (yogurt/nuts) makes a fruit snack more resistant to hunger.

**Quick tips:**
- Apples & pears (eat the skin)
- Oranges & guava, high in vitamin C
- Banana for quick energy
- Berries, low sugar, high antioxidants
- Pair with yogurt or nuts

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='buah-sebagai-camilan-mana-yang-paling-mengenyangkan';
update public.my20fit_recipe_article set title_en='👩‍🍳 Kitchen Seasonings That Make Healthy Cooking Taste Better', excerpt_en='Healthy food is often assumed to be bland. The right seasoning can change everything.', category_en='Recipes & Kitchen', body_md_en='Healthy food is often assumed to be bland. The right seasoning can change everything.

![👩‍🍳 Kitchen Seasonings That Make Healthy Cooking Taste Better](https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1000&q=70)

## Spices & aromatics
Onion, ginger, turmeric, lemongrass, lime leaves, and pepper add deep flavor without needing much salt or sugar.

## Acid & freshness
A squeeze of lime, vinegar, and tomato add brightness and reduce how much salt you need.

**Quick tips:**
- Keep a stock of dried spices
- Use fresh garlic & ginger
- Squeeze lime juice at the end of cooking
- Cut back on salt, add more spice
- Fresh herbs as a finishing touch

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='bumbu-dapur-yang-bikin-masakan-sehat-lebih-lezat';
update public.my20fit_recipe_article set title_en='🍎 Late-Night Snacks That Won''t Derail Your Diet', excerpt_en='Feeling hungry at night is normal. The key is choosing a light snack, not an excessive one.', category_en='Healthy Snacks', body_md_en='Feeling hungry at night is normal. The key is choosing a light snack, not an excessive one.

![🍎 Late-Night Snacks That Won''t Derail Your Diet](https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&w=1000&q=70)

## Keep it light
Greek yogurt, fruit, or a glass of warm milk is enough to settle hunger without weighing you down.

## Control the portion
Serve a small portion on a plate instead of eating straight out of a large package.

**Quick tips:**
- A small serving of Greek yogurt + berries
- A glass of warm milk
- Sliced fruit
- A handful of nuts
- Avoid chips straight from a big bag

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='camilan-malam-yang-tidak-menggagalkan-diet';
update public.my20fit_recipe_article set title_en='🍎 High-Protein Snacks to Get You Through the Workday', excerpt_en='Protein-rich snacks help you stay focused and keep hunger at bay until your next meal.', category_en='Healthy Snacks', body_md_en='Protein-rich snacks help you stay focused and keep hunger at bay until your next meal.

![🍎 High-Protein Snacks to Get You Through the Workday](https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&w=1000&q=70)

## Why protein
High-protein snacks are more filling than sugary snacks, which burn off quickly.

## Easy desk-friendly ideas
Greek yogurt, milk, boiled eggs, or nuts are easy to store and don''t make a mess.

**Quick tips:**
- Unsweetened Greek yogurt
- Boiled egg
- Low-fat milk/UHT milk
- Edamame
- Shredded chicken breast

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='camilan-tinggi-protein-untuk-menemani-kerja';
update public.my20fit_recipe_article set title_en='🥗 How to Read a Nutrition Label Correctly', excerpt_en='A nutrition label is an honest tool for judging food — as long as you know how to read it.', category_en='Healthy Eating', body_md_en='A nutrition label is an honest tool for judging food — as long as you know how to read it.

![🥗 How to Read a Nutrition Label Correctly](https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1000&q=70)

## Mind the serving size
The nutrition figures apply per serving, not per package. A small package can contain 2-3 servings.

## Check sugar, sodium, fat
Compare total sugar, sodium, and saturated fat across products. Choose the lower option for everyday consumption.

**Quick tips:**
- Read the ingredient list (largest amount listed first)
- Watch for sugar''s other names
- Compare per 100g across brands
- Choose lower sodium
- Don''t be fooled by a “healthy” claim on the front of the pack

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='cara-membaca-label-gizi-kemasan-dengan-benar';
update public.my20fit_recipe_article set title_en='👩‍🍳 How to Store Vegetables So They Stay Fresh Longer', excerpt_en='Vegetables wilt fast when stored the wrong way. Proper storage cuts down on waste.', category_en='Recipes & Kitchen', body_md_en='Vegetables wilt fast when stored the wrong way. Proper storage cuts down on waste.

![👩‍🍳 How to Store Vegetables So They Stay Fresh Longer](https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=1000&q=70)

## Know each vegetable''s character
Leafy greens like it cool and humid; some fruit-vegetables hold up better at room temperature. Store them accordingly.

## Tricks to extend shelf life
Wrap leafy greens in a paper towel, and only wash them right before use to prevent them from spoiling quickly.

**Quick tips:**
- Store leaves with an absorbent paper towel
- Don''t wash before storing
- Keep ethylene-producing fruit (like bananas) separate
- Use perforated containers
- Check and use the fastest-wilting ones first

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='cara-menyimpan-sayur-agar-awet-dan-tetap-segar';
update public.my20fit_recipe_article set title_en='📍 How to Order Healthier at a Fast-Food Restaurant', excerpt_en='Eating fast food once in a while is fine — with smarter choices.', category_en='Healthy Places to Eat', body_md_en='Eating fast food once in a while is fine — with smarter choices.

![📍 How to Order Healthier at a Fast-Food Restaurant](https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1000&q=70)

## Choose a lighter main
Pick grilled chicken if it''s available, stick to the regular size, and add a salad instead of a large fries.

## Watch what you drink
Swap soda for water or unsweetened tea to cut hundreds of calories of sugar.

**Quick tips:**
- Regular size, not jumbo
- Water instead of soda
- Add vegetables/salad if available
- Go easy on sweet sauces/mayo
- Skip the automatic upsize

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='cara-pesan-sehat-di-restoran-cepat-saji';
update public.my20fit_recipe_article set title_en='⚖️ Smart Cheat Meals: Enjoying Without the Guilt', excerpt_en='Enjoying a favorite meal once in a while actually helps with long-term consistency.', category_en='Diet Guide', body_md_en='Enjoying a favorite meal once in a while actually helps with long-term consistency.

![⚖️ Smart Cheat Meals: Enjoying Without the Guilt](https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1000&q=70)

## Plan it, don''t wing it
A scheduled cheat meal keeps you in control and stops you from feeling like you''ve “failed”.

## Get back on track
Treat one meal as just part of the pattern, then continue your healthy habits at the next one.

**Quick tips:**
- Schedule it, don''t make it a daily impulse
- Enjoy a reasonable portion
- Still include protein & vegetables
- Don''t “make up for it” afterward
- Get straight back to your routine at the next meal

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='cheat-meal-yang-cerdas-menikmati-tanpa-rasa-bersalah';
update public.my20fit_recipe_article set title_en='📍 Signs of a Healthy Eatery Worth Trying', excerpt_en='Not every place labeled “healthy” actually is. Know the signs before you order.', category_en='Healthy Places to Eat', body_md_en='Not every place labeled “healthy” actually is. Know the signs before you order.

![📍 Signs of a Healthy Eatery Worth Trying](https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1000&q=70)

## Transparent about ingredients
A good place is usually upfront about its ingredients and cooking methods, and offers enough vegetable options.

## Healthier cooking methods
Check whether grilled/steamed/boiled options are available, not just fried, and whether vegetable portions are adequate.

**Quick tips:**
- Portion and oil-level options available
- A varied vegetable menu
- Nutrition/portion info available
- Low-sugar drink options
- Cleanliness is maintained

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='ciri-ciri-tempat-makan-sehat-yang-layak-dicoba';
update public.my20fit_recipe_article set title_en='⚖️ Calorie Deficit 101: The Basics of Losing Weight', excerpt_en='Losing weight comes down to something simple: eating less than you burn. But how you do it matters.', category_en='Diet Guide', body_md_en='Losing weight comes down to something simple: eating less than you burn. But how you do it matters.

![⚖️ Calorie Deficit 101: The Basics of Losing Weight](https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1000&q=70)

## What is a calorie deficit
A deficit means eating slightly below your daily needs, gradually and sustainably — not extremely.

## Keep it healthy
Keep protein and vegetables up so you stay full and preserve muscle as the weight comes down.

**Quick tips:**
- Cut gradually, not drastically
- High protein keeps you full
- Load up on low-calorie vegetables
- Get enough sleep & manage stress
- Track progress weekly, not daily

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='defisit-kalori-101-dasar-menurunkan-berat-badan';
update public.my20fit_recipe_article set title_en='⚖️ High-Protein Diets: Who They''re For and How', excerpt_en='High-protein diets are popular because they help with fullness and preserving muscle. But balance still matters.', category_en='Diet Guide', body_md_en='High-protein diets are popular because they help with fullness and preserving muscle. But balance still matters.

![⚖️ High-Protein Diets: Who They''re For and How](https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1000&q=70)

## Main benefits
Higher protein supports fullness and helps maintain muscle mass, especially while losing weight.

## Keep it balanced
Don''t neglect vegetables and fiber. Vary your protein sources between animal and plant-based.

**Quick tips:**
- Spread protein throughout the day
- Don''t forget vegetables & fiber
- Stay hydrated
- Pair it with strength training
- Adjust to your own health condition

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='diet-tinggi-protein-untuk-siapa-dan-bagaimana';
update public.my20fit_recipe_article set title_en='🍎 Swap Fried Snacks for These Instead', excerpt_en='Fried food is tempting, but there are crunchy alternatives that are kinder to your body.', category_en='Healthy Snacks', body_md_en='Fried food is tempting, but there are crunchy alternatives that are kinder to your body.

![🍎 Swap Fried Snacks for These Instead](https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1000&q=70)

## Healthier versions
Roasted nuts, baked sweet potato/potato, or baked banana give you that same satisfying crunch without excess oil.

## The crispy trick without deep-frying
An air fryer or oven produces a crispy texture with very little oil.

**Quick tips:**
- Roasted nuts/edamame
- Baked sweet potato
- Oven-baked vegetable chips
- Popcorn without excess butter
- Baked banana

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='ganti-gorengan-dengan-camilan-ini';
update public.my20fit_recipe_article set title_en='🧬 Carbs Aren''t the Enemy: How to Choose the Right Ones', excerpt_en='Carbs often get scapegoated, when really it''s the type and portion that matter.', category_en='Nutrition Tips', body_md_en='Carbs often get scapegoated, when really it''s the type and portion that matter.

![🧬 Carbs Aren''t the Enemy: How to Choose the Right Ones](https://images.unsplash.com/photo-1447279506476-3faec8071eee?auto=format&fit=crop&w=1000&q=70)

## Complex vs. simple carbs
Complex carbs (brown rice, oats, sweet potato) digest more slowly and keep energy steady, unlike sugar and refined flour.

## Adjust the portion
A high-activity day needs more carbs; a rest day can have less. There''s no need to cut them out entirely.

**Quick tips:**
- Choose whole grains
- Pair carbs with protein & fiber
- Cut back on refined flour & sugar
- Adjust the portion to your activity level
- Mind the amount, not just the type

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='karbohidrat-bukan-musuh-cara-memilih-karbo-yang-tepat';
update public.my20fit_recipe_article set title_en='🏃 Small Habits That Can Change Your Diet in 30 Days', excerpt_en='Big change starts with small habits done consistently.', category_en='Lifestyle', body_md_en='Big change starts with small habits done consistently.

![🏃 Small Habits That Can Change Your Diet in 30 Days](https://images.unsplash.com/photo-1502741224143-90386d7f8c82?auto=format&fit=crop&w=1000&q=70)

## Start with one habit
Focus on one change — like a protein breakfast — before adding another.

## Build momentum
A small habit that sticks gives you the confidence to take on the next one.

**Quick tips:**
- One glass of water when you wake up
- Add one serving of vegetables a day
- Swap out one sugary drink
- A short walk every day
- Keep a more regular sleep schedule

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='kebiasaan-kecil-yang-mengubah-pola-makan-dalam-30-hari';
update public.my20fit_recipe_article set title_en='🥗 Why a High-Protein Breakfast Keeps You Full Longer', excerpt_en='A sweet-bread or fried breakfast leaves you hungry again fast. Protein in the morning changes that pattern.', category_en='Healthy Eating', body_md_en='A sweet-bread or fried breakfast leaves you hungry again fast. Protein in the morning changes that pattern.

![🥗 Why a High-Protein Breakfast Keeps You Full Longer](https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1000&q=70)

## Protein and fullness
Protein slows down stomach emptying and affects your fullness hormones, so you''re less likely to snack before noon.

## Easy breakfast examples
Boiled eggs, Greek yogurt, scrambled tofu and tempeh, or oats with milk. All quick and filling.

**Quick tips:**
- Aim for 20-30g of protein at breakfast
- Pair it with fiber (fruit/vegetables)
- Boil eggs the night before
- Cut back on high-sugar breakfasts
- Stay hydrated

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='kenapa-sarapan-tinggi-protein-bikin-kenyang-lebih-lama';
update public.my20fit_recipe_article set title_en='🧬 Good Fat vs. Bad Fat: A Practical Guide', excerpt_en='Not all fat is bad. Some of it is actually needed for your body to function well.', category_en='Nutrition Tips', body_md_en='Not all fat is bad. Some of it is actually needed for your body to function well.

![🧬 Good Fat vs. Bad Fat: A Practical Guide](https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=70)

## Know the good fats
Unsaturated fats from avocado, nuts, fish, and olive oil support heart health.

## Limit the less-good fats
Cut back on trans fat and repeatedly reused frying oil. Grilling/steaming is friendlier.

**Quick tips:**
- Add fatty fish 1-2 times a week
- A handful of nuts as a snack
- Cook with a moderate amount of healthy oil
- Limit fried food
- Read labels for “trans fat”

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='lemak-baik-vs-lemak-jahat-panduan-praktis';
update public.my20fit_recipe_article set title_en='⚖️ Clean Eating: What It Actually Means', excerpt_en='The term “clean eating” is often misunderstood. It''s not about being perfect, but about eating more whole foods.', category_en='Diet Guide', body_md_en='The term “clean eating” is often misunderstood. It''s not about being perfect, but about eating more whole foods.

![⚖️ Clean Eating: What It Actually Means](https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1000&q=70)

## The basic principle
Eat more minimally processed food, cut back on sugar and ultra-processed items, without having to go to extremes.

## Avoid perfectionism
You don''t need to be 100% “clean”. An 80/20 approach is more realistic and sustainable.

**Quick tips:**
- Favor fresh, whole ingredients
- Cook at home more often
- Cut back on ultra-processed food
- Stay flexible, not rigid
- Enjoy the process

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='makan-bersih-clean-eating-apa-artinya-sebenarnya';
update public.my20fit_recipe_article set title_en='🏃 Mindful Eating: Enjoying Food Without Overdoing It', excerpt_en='Mindful eating helps you enjoy your food more while recognizing when you''re actually full.', category_en='Lifestyle', body_md_en='Mindful eating helps you enjoy your food more while recognizing when you''re actually full.

![🏃 Mindful Eating: Enjoying Food Without Overdoing It](https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1000&q=70)

## Slow down
Chew slowly and savor the flavor; your body needs time to send the fullness signal to your brain.

## Cut the distractions
Eating without a screen makes you more aware of your portion and more satisfied.

**Quick tips:**
- Put your spoon down between bites
- Eat without your phone/TV
- Pay attention to taste & texture
- Stop once you start feeling full
- Appreciate your food

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='makan-mindful-menikmati-makanan-tanpa-berlebihan';
update public.my20fit_recipe_article set title_en='🏃 Healthy Eating & Exercise: A Combination That Reinforces Itself', excerpt_en='Diet and exercise work best when they go hand in hand.', category_en='Lifestyle', body_md_en='Diet and exercise work best when they go hand in hand.

![🏃 Healthy Eating & Exercise: A Combination That Reinforces Itself](https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1000&q=70)

## Eating supports training
Carbs provide energy, protein aids recovery. Together they make your training more effective.

## Exercise supports eating habits
Staying active boosts mood and helps you keep better eating habits.

**Quick tips:**
- Eat enough before training
- Protein for recovery
- Hydrate before & after
- Consistency matters more than intensity
- Get enough rest

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='makan-sehat-dan-olahraga-kombinasi-yang-saling-menguatkan';
update public.my20fit_recipe_article set title_en='🥗 Eating Healthy on a Tight Budget: It''s Possible', excerpt_en='Healthy doesn''t always mean expensive. With some planning, your wallet and your body can both stay healthy.', category_en='Healthy Eating', body_md_en='Healthy doesn''t always mean expensive. With some planning, your wallet and your body can both stay healthy.

![🥗 Eating Healthy on a Tight Budget: It''s Possible](https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1000&q=70)

## Choose affordable protein
Eggs, tofu, tempeh, and local fish are cheap and nutritious. You don''t always need imported meat or expensive supplements.

## Shop smart
Buy seasonal vegetables, cook at home, and use up leftover ingredients so nothing goes to waste.

**Quick tips:**
- Plan a weekly menu
- Cook in bulk (meal prep)
- Buy grains & nuts in larger quantities
- Cut back on eating out
- Use frozen vegetables when needed

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='makan-sehat-dengan-budget-terbatas-bisa-kok';
update public.my20fit_recipe_article set title_en='📍 Eating Healthy While Hanging Out at a Café: What to Pick', excerpt_en='Hanging out at a café can still be healthy, as long as you''re smart about the menu and your drink.', category_en='Healthy Places to Eat', body_md_en='Hanging out at a café can still be healthy, as long as you''re smart about the menu and your drink.

![📍 Eating Healthy While Hanging Out at a Café: What to Pick](https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1000&q=70)

## Start with the drink
A sweet milk coffee or frappe is high in sugar. Choose an americano, a less-sugar milk coffee, or unsweetened tea instead.

## Snack wisely
Swap a sweet pastry for whole wheat toast, eggs, or a salad if available.

**Quick tips:**
- Coffee with little or no sugar
- Keep drinking water too
- Choose grilled over fried options
- Share a dessert portion
- Watch out for added syrup

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='makan-sehat-saat-nongkrong-di-kafe-pilih-yang-mana';
update public.my20fit_recipe_article set title_en='👩‍🍳 Protein Meal Prep: Chicken, Eggs, Tofu & Tempeh', excerpt_en='Prepping your protein at the start of the week makes eating healthy automatic.', category_en='Recipes & Kitchen', body_md_en='Prepping your protein at the start of the week makes eating healthy automatic.

![👩‍🍳 Protein Meal Prep: Chicken, Eggs, Tofu & Tempeh](https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=1000&q=70)

## Cook it all at once
Boil eggs, grill chicken breast, and season tofu and tempeh to stock up for a few days.

## Vary the seasoning
Different seasonings each day (soy sauce glaze, grilled, a light curry) keep it interesting even with the same base ingredients.

**Quick tips:**
- Boil 6-8 eggs for your stock
- Grill chicken in a big batch
- Braise tofu & tempeh for 2-3 days'' worth
- Store in separate containers
- Pair with fresh vegetables

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='meal-prep-protein-ayam-telur-tahu-tempe';
update public.my20fit_recipe_article set title_en='📍 Finding a Healthy Catering Service That Fits Your Routine', excerpt_en='Healthy catering makes a busy life easier — as long as it fits your needs and taste.', category_en='Healthy Places to Eat', body_md_en='Healthy catering makes a busy life easier — as long as it fits your needs and taste.

![📍 Finding a Healthy Catering Service That Fits Your Routine](https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1000&q=70)

## Check for menu clarity
A good caterer lists the ingredients and estimated nutrition, and offers enough menu variety that you won''t get bored.

## Match it to your goal
Choose a package suited to your target: maintaining weight, a deficit, or high-protein for an active lifestyle.

**Quick tips:**
- Check the weekly menu variety
- Note the estimated calories/portion
- Check the delivery schedule & area
- Try a short package first
- Read customer reviews

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='menemukan-katering-sehat-yang-cocok-untuk-rutinitasmu';
update public.my20fit_recipe_article set title_en='⚖️ Managing Portions Without Weighing Every Meal', excerpt_en='Not everyone wants to weigh their food. Luckily, there are practical ways to control portions.', category_en='Diet Guide', body_md_en='Not everyone wants to weigh their food. Luckily, there are practical ways to control portions.

![⚖️ Managing Portions Without Weighing Every Meal](https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=70)

## Use your hand as a measure
Palm for protein, fist for vegetables, cupped hand for carbs, thumb for fat — practical anywhere you go.

## Eat mindfully
Eating slowly and stopping once you start feeling full helps your body recognize its own signals.

**Quick tips:**
- Use a smaller plate
- Vegetables first, before the carbs
- Stop at about 80% full
- Avoid eating in front of a screen
- Drink water before your meal

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='mengelola-porsi-tanpa-menimbang-setiap-makanan';
update public.my20fit_recipe_article set title_en='👩‍🍳 Steaming vs. Frying: The Effect on Nutrition', excerpt_en='The same ingredient can have a very different nutritional outcome depending on how it''s cooked.', category_en='Recipes & Kitchen', body_md_en='The same ingredient can have a very different nutritional outcome depending on how it''s cooked.

![👩‍🍳 Steaming vs. Frying: The Effect on Nutrition](https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1000&q=70)

## Why steaming wins
Steaming preserves more nutrients and doesn''t add oil, so calories stay more in check.

## If you do want to fry
Use a moderate amount of healthy oil, don''t reuse it repeatedly, and drain well afterward.

**Quick tips:**
- Steam for vegetables & fish
- Grilling as a crispy alternative
- Avoid reused frying oil
- Drain off excess oil
- Mix up the methods so it doesn''t get boring

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='mengukus-vs-menggoreng-pengaruhnya-ke-gizi';
update public.my20fit_recipe_article set title_en='🥗 Cutting Back on Sugar Without Torturing Yourself: A Gradual Approach', excerpt_en='Quitting sugar cold turkey often fails. A gradual approach is much easier to stick with.', category_en='Healthy Eating', body_md_en='Quitting sugar cold turkey often fails. A gradual approach is much easier to stick with.

![🥗 Cutting Back on Sugar Without Torturing Yourself: A Gradual Approach](https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=70)

## Cut back little by little
Halve the sugar in your coffee/tea first, then keep going from there. Your tastebuds need time to adjust, and that''s normal.

## Watch for hidden sugar
Bottled drinks, sauces, and snacks often hide a lot of sugar. Reading labels helps you see your real intake.

**Quick tips:**
- Swap sweet drinks for water/infused water
- Choose whole fruit over juice
- Read the “total sugar” on labels
- Keep sweet snacks out of easy reach
- Give yourself 2-3 weeks to adjust

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='mengurangi-gula-tanpa-menyiksa-diri-langkah-bertahap';
update public.my20fit_recipe_article set title_en='🏃 Staying Consistent With a Healthy Lifestyle When You''re Busy', excerpt_en='Being busy is often the excuse for a messy diet. With a simple system, healthy habits can still hold up.', category_en='Lifestyle', body_md_en='Being busy is often the excuse for a messy diet. With a simple system, healthy habits can still hold up.

![🏃 Staying Consistent With a Healthy Lifestyle When You''re Busy](https://images.unsplash.com/photo-1502741224143-90386d7f8c82?auto=format&fit=crop&w=1000&q=70)

## Set up a system
Meal prep, a stash of healthy snacks, and a few go-to dishes cut down on tough decisions when you''re tired.

## Be flexible & realistic
It doesn''t have to be perfect. An 80/20 pattern makes a healthy lifestyle stick for longer.

**Quick tips:**
- Prepare a go-to weekly menu
- Stash healthy snacks in your bag/at your desk
- Choose restaurants with healthy options
- Apply the 80/20 pattern
- Celebrate small progress

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='menjaga-konsistensi-hidup-sehat-saat-sibuk';
update public.my20fit_recipe_article set title_en='🍱 Healthy Fast-Breaking Meals That Won''t Leave You Sluggish', excerpt_en='Breaking a fast with fried food and super-sweet drinks often leaves you feeling sluggish. There''s a friendlier way.', category_en='Menu Recommendations', body_md_en='Breaking a fast with fried food and super-sweet drinks often leaves you feeling sluggish. There''s a friendlier way.

![🍱 Healthy Fast-Breaking Meals That Won''t Leave You Sluggish](https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1000&q=70)

## Start light
Start with water and dates or fruit, pause for a moment, then move to the main meal so your digestion isn''t shocked.

## A balanced main meal
Choose protein, a reasonable amount of carbs, and vegetables. Limit fried food and high-sugar drinks.

**Quick tips:**
- Dates + water to break the fast
- Warm soup as a starter
- Protein + a reasonable amount of rice + vegetables
- Limit fried food
- Avoid excess sweet drinks

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='menu-buka-puasa-sehat-yang-tidak-bikin-lemas';
update public.my20fit_recipe_article set title_en='🍱 Low-Calorie Dinners That Still Keep You Full', excerpt_en='A light dinner helps you sleep better and keeps your daily calories in check — without going hungry.', category_en='Menu Recommendations', body_md_en='A light dinner helps you sleep better and keeps your daily calories in check — without going hungry.

![🍱 Low-Calorie Dinners That Still Keep You Full](https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=70)

## Focus on protein & vegetables
Load up on vegetables and lean protein; cut back on simple carbs so you stay full with fewer calories.

## Menu ideas
Soup, stir-fried vegetables with tofu, or grilled fish with salad are light but satisfying choices.

**Quick tips:**
- Grilled fish + stir-fried vegetables
- Clear chicken & vegetable soup
- Stir-fried broccoli + tofu
- A big salad + boiled egg
- Low-oil mixed vegetable soup

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='menu-makan-malam-rendah-kalori-yang-tetap-mengenyangkan';
update public.my20fit_recipe_article set title_en='🍱 Healthy Meals for Students/Renters: Practical & Cheap', excerpt_en='Living with a limited kitchen isn''t a barrier to eating healthy.', category_en='Menu Recommendations', body_md_en='Living with a limited kitchen isn''t a barrier to eating healthy.

![🍱 Healthy Meals for Students/Renters: Practical & Cheap](https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=70)

## Cheap go-tos
Eggs, tofu, tempeh, instant noodles + vegetables + egg, and frozen vegetables can be your cheap, nutritious lifesavers.

## Minimalist kitchen tricks
A multi-purpose rice cooker can cook rice while steaming eggs and vegetables at the same time.

**Quick tips:**
- Boiled egg + boiled vegetables
- Simple stir-fried tempeh
- Instant noodles + egg + vegetables (less broth)
- Oats + banana for breakfast
- Keep a stock of cut fruit in the fridge

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='menu-sehat-untuk-anak-kos-praktis-dan-murah';
update public.my20fit_recipe_article set title_en='🧬 Micronutrients: Vitamins & Minerals You''re Probably Short On', excerpt_en='Beyond calories and macros, your body needs micronutrients that often get overlooked.', category_en='Nutrition Tips', body_md_en='Beyond calories and macros, your body needs micronutrients that often get overlooked.

![🧬 Micronutrients: Vitamins & Minerals You''re Probably Short On](https://images.unsplash.com/photo-1447279506476-3faec8071eee?auto=format&fit=crop&w=1000&q=70)

## What''s commonly lacking
Iron, calcium, vitamin D, and fiber are often lacking in a fast-paced modern diet.

## Get it from food
Leafy greens, dairy, fish, eggs, and morning sunlight help meet these needs naturally.

**Quick tips:**
- Leafy greens for iron & folate
- Dairy for calcium
- Fish & eggs for vitamin D
- Vary the colors of your fruit & vegetables
- Supplements only when actually needed

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='micronutrient-vitamin-dan-mineral-yang-sering-kurang';
update public.my20fit_recipe_article set title_en='🧬 Popular Nutrition Myths You Should Let Go Of', excerpt_en='A lot of nutrition myths are out there, and they only make things harder. Let''s set a few common ones straight.', category_en='Nutrition Tips', body_md_en='A lot of nutrition myths are out there, and they only make things harder. Let''s set a few common ones straight.

![🧬 Popular Nutrition Myths You Should Let Go Of](https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=70)

## Myth vs. fact
“Carbs make you fat”, “eating at night always makes you fat”, “you need a juice detox” — these are all oversimplified. What matters is the overall pattern and total intake.

## Focus on the big picture
Consistency in a balanced diet matters far more than any single magic rule.

**Quick tips:**
- No single food determines the outcome
- Total calories & pattern matter more
- There''s no “magic” fat-burning food
- Meal timing matters less than total intake
- Watch out for exaggerated claims

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='mitos-gizi-populer-yang-perlu-kamu-tinggalkan';
update public.my20fit_recipe_article set title_en='⚖️ A Beginner''s Guide to Weekly Meal Prep', excerpt_en='Meal prep saves time and money, and helps you stay consistent with healthy eating.', category_en='Diet Guide', body_md_en='Meal prep saves time and money, and helps you stay consistent with healthy eating.

![⚖️ A Beginner''s Guide to Weekly Meal Prep](https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=70)

## Start simple
Prep the components: cooked protein, carbs, and vegetables that can be mixed and matched into a few different meals.

## Store it properly
Use airtight containers and store them in the fridge; portion them out so you can just grab and go when you''re busy.

**Quick tips:**
- Pick 2-3 proteins for the week
- Cook the carbs & vegetables at the same time
- Vary the seasoning so it doesn''t get boring
- Label containers with the date
- Prep healthy snacks too

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='panduan-meal-prep-mingguan-untuk-pemula';
update public.my20fit_recipe_article set title_en='📍 A Guide to Choosing a Salad Bar: Filling Your Bowl the Right Way', excerpt_en='A salad can be healthy or surprisingly high in calories — depending on the toppings and the dressing.', category_en='Healthy Places to Eat', body_md_en='A salad can be healthy or surprisingly high in calories — depending on the toppings and the dressing.

![📍 A Guide to Choosing a Salad Bar: Filling Your Bowl the Right Way](https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1000&q=70)

## Build from the base
Start with leafy greens, add a lean protein, a small amount of complex carbs, and good fats like avocado or nuts.

## Watch the dressing
A creamy dressing and sweet toppings can multiply the calories. Choose a vinaigrette or ask for the dressing on the side.

**Quick tips:**
- Load up on colorful vegetables
- Choose a grilled protein
- Go easy on croutons & creamy sauces
- Dressing on the side, in moderation
- Add grains or seeds to stay full

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='panduan-memilih-salad-bar-isi-mangkuk-yang-benar';
update public.my20fit_recipe_article set title_en='🧬 Why Hydration Matters: How Many Glasses of Water a Day?', excerpt_en='Sometimes what feels like hunger is actually thirst. Hydration affects your energy and focus.', category_en='Nutrition Tips', body_md_en='Sometimes what feels like hunger is actually thirst. Hydration affects your energy and focus.

![🧬 Why Hydration Matters: How Many Glasses of Water a Day?](https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1000&q=70)

## Fluid needs
Water needs differ from person to person depending on activity level and weather. Pale-colored urine is a simple, good indicator.

## Easy ways to drink enough
Carry a water bottle, and start your day with a glass of water so the habit sticks.

**Quick tips:**
- Keep a water bottle nearby
- A glass of water when you wake up
- Water before meals helps with portion control
- Cut back on sugary drinks
- Pay attention to urine color

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='pentingnya-hidrasi-berapa-gelas-air-sehari';
update public.my20fit_recipe_article set title_en='🥗 The Balanced Plate: 20FIT''s Simple Portion Guide', excerpt_en='Counting calories at every bite is exhausting. The plate method helps you eat balanced just by looking at proportions.', category_en='Healthy Eating', body_md_en='Counting calories at every bite is exhausting. The plate method helps you eat balanced just by looking at proportions.

![🥗 The Balanced Plate: 20FIT''s Simple Portion Guide](https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1000&q=70)

## The half-quarter rule
Fill half the plate with colorful vegetables, a quarter with lean protein, and a quarter with complex carbohydrates. Add a little good fat, like olive oil or avocado.

## Adjust to your activity
A hard training day needs a slightly bigger carb portion; a rest day can have less. Listen to your hunger and fullness cues.

**Quick tips:**
- Use a medium-sized plate
- Vegetables first, then the rest
- Choose fiber-rich carbs: brown rice, sweet potato, oats
- Protein at every meal keeps you full
- Water before your meal

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='piring-gizi-seimbang-panduan-porsi-sederhana-ala-20fit';
update public.my20fit_recipe_article set title_en='🧬 Daily Protein: How Much Do You Actually Need?', excerpt_en='Protein matters, but that doesn''t mean more is always better without limit. Know your actual need.', category_en='Nutrition Tips', body_md_en='Protein matters, but that doesn''t mean more is always better without limit. Know your actual need.

![🧬 Daily Protein: How Much Do You Actually Need?](https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1000&q=70)

## Estimating your need
Protein needs vary by body weight and activity level. Active people generally need more than those who move less.

## Spread it through the day
Your body absorbs protein better when it''s spread across several meals, rather than eaten all at once.

**Quick tips:**
- Include protein at every meal
- Vary between animal & plant sources
- Favor whole food over supplements
- Balance it with vegetables & fiber
- Consult a doctor if you have kidney concerns

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='protein-harian-berapa-banyak-yang-sebenarnya-kamu-butuh';
update public.my20fit_recipe_article set title_en='🍱 Office Lunch Ideas That Stay Light', excerpt_en='A heavy lunch makes you sleepy. Choose a menu that''s filling enough without leaving you sluggish.', category_en='Menu Recommendations', body_md_en='A heavy lunch makes you sleepy. Choose a menu that''s filling enough without leaving you sluggish.

![🍱 Office Lunch Ideas That Stay Light](https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1000&q=70)

## A balanced lunch formula
Combine lean protein, a moderate amount of carbs, and plenty of vegetables. Avoid an oversized carb portion at midday.

## Easy to bring along
A chicken and vegetable rice bowl, a protein salad, or brown rice with fish can all be prepped at home.

**Quick tips:**
- Chicken rice bowl + broccoli
- Tuna salad + egg
- Brown rice + steamed fish
- Chicken & vegetable soup
- Whole wheat wrap with vegetables + chicken

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='rekomendasi-menu-makan-siang-kantor-yang-tetap-ringan';
update public.my20fit_recipe_article set title_en='🍱 High-Protein Menu Ideas for Regular Gym-Goers', excerpt_en='Training without enough protein makes your results less than optimal. These dishes support muscle recovery.', category_en='Menu Recommendations', body_md_en='Training without enough protein makes your results less than optimal. These dishes support muscle recovery.

![🍱 High-Protein Menu Ideas for Regular Gym-Goers](https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1000&q=70)

## Protein needs
Active people generally need more protein. Spread your intake evenly across several meals.

## Training-friendly dishes
Chicken breast, eggs, fish, Greek yogurt, and tofu-tempeh are easy-to-find go-tos.

**Quick tips:**
- Chicken breast + brown rice + broccoli
- Eggs + oats before training
- Greek yogurt + fruit post-workout
- Fish + sweet potato + vegetables
- Scrambled tempeh + rice

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='rekomendasi-menu-tinggi-protein-untuk-yang-rutin-nge-gym';
update public.my20fit_recipe_article set title_en='📍 Types of Restaurants Worth Trying for Healthier Eating in the City', excerpt_en='A big city offers plenty of choices. Know which types of restaurants usually offer healthier options.', category_en='Healthy Places to Eat', body_md_en='A big city offers plenty of choices. Know which types of restaurants usually offer healthier options.

![📍 Types of Restaurants Worth Trying for Healthier Eating in the City](https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1000&q=70)

## Nutrition-friendly types
Grill houses, salad/poke bowl spots, and home-style eateries often have well-balanced options.

## How to choose
Look for a dish with clear protein, enough vegetables, and a low-oil cooking method.

**Quick tips:**
- Poke/rice bowls with vegetables
- Grilled chicken or fish
- Home-style dishes with a clear broth
- Well-balanced vegetarian options
- Avoid overdoing an all-you-can-eat spread

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='rekomendasi-tipe-restoran-sehat-di-kota-besar';
update public.my20fit_recipe_article set title_en='🥗 Fiber: The Overlooked but Important Nutrient', excerpt_en='A lot of people focus on protein and calories, but forget fiber — even though it plays a big role in digestion and fullness.', category_en='Healthy Eating', body_md_en='A lot of people focus on protein and calories, but forget fiber — even though it plays a big role in digestion and fullness.

![🥗 Fiber: The Overlooked but Important Nutrient](https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1000&q=70)

## Benefits of fiber
Fiber supports digestion, helps control blood sugar, and keeps you full longer with fewer calories.

## Easy sources of fiber
Vegetables, fruit with the skin on, oats, legumes, and whole grains are among the best sources.

**Quick tips:**
- Aim for 25-30g of fiber a day
- Add vegetables to every meal
- Choose whole fruit over juice
- Swap in brown rice for white rice sometimes
- Increase intake gradually + drink enough water

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='serat-zat-gizi-yang-sering-terlupakan-tapi-penting';
update public.my20fit_recipe_article set title_en='👩‍🍳 Healthy Ingredient Swaps for Your Favorite Recipes', excerpt_en='You don''t have to give up your favorite recipes — just swap a few ingredients for healthier versions.', category_en='Recipes & Kitchen', body_md_en='You don''t have to give up your favorite recipes — just swap a few ingredients for healthier versions.

![👩‍🍳 Healthy Ingredient Swaps for Your Favorite Recipes](https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1000&q=70)

## Example swaps
Swap white rice for brown rice, thick coconut milk for diluted coconut milk or low-fat milk, or sugar for fruit.

## Gradual is easier
Make the swaps little by little so the taste stays familiar and the family still accepts it.

**Quick tips:**
- Brown rice replacing part of the white rice
- Yogurt as a cream substitute
- Grilling instead of frying
- Cut back on sugar, add spices/fruit
- Whole wheat flour for part of the recipe

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='substitusi-bahan-sehat-untuk-resep-favorit';
update public.my20fit_recipe_article set title_en='👩‍🍳 Low-Oil Cooking Techniques That Still Taste Great', excerpt_en='Cutting back on oil doesn''t mean sacrificing flavor. A few techniques keep your food just as tasty.', category_en='Recipes & Kitchen', body_md_en='Cutting back on oil doesn''t mean sacrificing flavor. A few techniques keep your food just as tasty.

![👩‍🍳 Low-Oil Cooking Techniques That Still Taste Great](https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1000&q=70)

## Rely on heat & seasoning
Grilling, steaming, boiling, and quick stir-frying with a little oil plus rich seasoning keep the flavor intact.

## Helpful tools
A non-stick pan or an air fryer helps cut down oil significantly.

**Quick tips:**
- Heat the pan before adding oil
- Use stock for stir-frying
- Season generously (spices, lime)
- An air fryer for a crispy texture
- Steam for vegetables & fish

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='teknik-memasak-rendah-minyak-yang-tetap-enak';
update public.my20fit_recipe_article set title_en='🏃 Sleep, Stress, and How They''re Linked to Your Diet', excerpt_en='Lack of sleep and high stress quietly affect your appetite and your food choices.', category_en='Lifestyle', body_md_en='Lack of sleep and high stress quietly affect your appetite and your food choices.

![🏃 Sleep, Stress, and How They''re Linked to Your Diet](https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1000&q=70)

## The effect of poor sleep
Not getting enough sleep can increase cravings for snacks and sugary food the next day.

## Manage your stress
Chronic stress drives “emotional eating”. Relaxing activities help keep it in check.

**Quick tips:**
- Aim for a regular 7-8 hours of sleep
- Cut screen time before bed
- Manage stress (walking, breathing, hobbies)
- Recognize emotional hunger vs. physical hunger
- Limit afternoon caffeine

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='tidur-stres-dan-hubungannya-dengan-pola-makan';
update public.my20fit_recipe_article set title_en='📍 Tips for Eating Healthy at Padang Restaurants & Warteg', excerpt_en='Indonesian food can be healthy too, as long as you know how to choose your side dish and portion.', category_en='Healthy Places to Eat', body_md_en='Indonesian food can be healthy too, as long as you know how to choose your side dish and portion.

![📍 Tips for Eating Healthy at Padang Restaurants & Warteg](https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1000&q=70)

## Choose a healthier side
Favor grilled chicken/fish, boiled egg, tofu-tempeh, and vegetables. Limit rich coconut-milk curries and fried items.

## Manage your rice portion
Ask for less rice and add more vegetables, like cassava leaves or urap, for extra fiber.

**Quick tips:**
- Grilled chicken/fish over fried
- Leafy greens & fresh vegetables
- Cut back on thick coconut-milk broth
- A smaller rice portion
- A moderate amount of sambal

## Try it on 20FIT
Want to put this into practice? Check out our [healthy recipe collection](https://recepie.20fit.id/resep) or see [Eat Now](https://recepie.20fit.id/eat-now) to order quickly.

*Note: calorie & nutrition figures are estimates; adjust them to your own needs and health condition.*', updated_at=now() where slug='tips-makan-sehat-di-warung-padang-dan-warteg';