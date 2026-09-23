// my20fit-ai — Edge Function gateway ke OpenRouter untuk: food scan (foto/teks),
// MCU explainer, translate, rencana harian (plan), dan baca screenshot health tracker
// (workout, BISA BEBERAPA GAMBAR). Dipanggil server, bukan frontend.
//
// KEAMANAN: TIDAK ADA API key di-hardcode. Wajib env OPENROUTER_API_KEY.
// (Key lama yang pernah hardcode HARUS di-revoke di OpenRouter.)
// GERBANG SERVER-ONLY (LANGKAH 5): wajib header x-ai-edge-secret == env AI_EDGE_SECRET (fail-closed).
// Menolak browser/pihak luar. Set AI_EDGE_SECRET di Supabase edge secrets SEBELUM deploy versi ini.
//
// Sumber kebenaran versi function ini = file ini (ver-control). Deploy manual/approval.

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
function pj(t: string) {
  try { return JSON.parse(t); } catch (e) { /* ignore */ }
  const a = t.indexOf("{"), z = t.lastIndexOf("}");
  if (a >= 0 && z > a) { try { return JSON.parse(t.slice(a, z + 1)); } catch (e) { /* ignore */ } }
  return null;
}

const MODEL_FOOD = Deno.env.get("AI_MODEL_FOOD") || "google/gemini-2.5-flash";
const MODEL_MCU = Deno.env.get("AI_MODEL_MCU") || "google/gemini-3-flash-preview";

// ---- Prompt food scan (FOTO). Fokus akurasi: porsi, cara masak, kalori tersembunyi, confidence. ----
const FOOD_SYS =
  'You are an expert nutritionist estimating calories and macros from a food photo for the 20fit fitness app. ' +
  'The photo can be from ANY cuisine (Indonesian, Western, Japanese, Korean, Chinese, Indian, Middle Eastern, Thai, and more). ' +
  'ACCURACY RULES — follow all of them:\n' +
  '1. PORTION: estimate the portion in GRAMS. Use visible reference objects to scale — a standard plate is ~26 cm, a dinner spoon ~15 ml, a fork, a hand, a takeaway box compartment, a cup. State the portion for every item.\n' +
  '2. DO NOT OVER-ESTIMATE. Calorie counts from photos are commonly inflated. When the portion is unclear, assume a TYPICAL / MODEST restaurant or home serving, NOT a large one. Only include hidden calories (oil, butter, dressing, mayo, cheese, sugar, sauce) in REALISTIC amounts implied by the dish — do not pile them on. It is better to land near the true value than to guess high.\n' +
  '3. COOKING METHOD: account for how it was cooked — fried/sauteed absorbs some oil, grilled/steamed is leaner — but keep the added fat realistic, not exaggerated.\n' +
  '4. INDONESIAN & SE-ASIAN DISHES: reflect real calorie density of santan (coconut milk), kecap manis, palm sugar, peanut sauce, fried shallots, gorengan — without inflating a plain grilled/steamed dish.\n' +
  '5. If a REFERENCE list of known foods (nutrition per gram) is provided, PREFER those values for any item whose name matches.\n' +
  '6. RANGE: give a plausible calorie RANGE (kcal_min to kcal_max) and set total_kcal to your best single estimate NEAR THE MIDDLE of that range. Keep the range realistic (not wildly wide).\n' +
  '7. CONFIDENCE: give an honest confidence (0-100). Lower it when portion is ambiguous, oil/sauce/hidden ingredients are unclear, or the item is partly hidden. This flags items the user should confirm.\n' +
  'Respond ONLY with a valid JSON object (no markdown, no code fences) with these keys: ' +
  'items (array of objects each with: name, portion (short string like "150g" or "1 mangkuk"), grams (numeric grams estimate), kcal, protein_g, carbs_g, fat_g, fiber_g, confidence (integer 0-100 for THIS item)), ' +
  'total_kcal (number = best single estimate), kcal_min (number = low end of plausible range), kcal_max (number = high end of plausible range), ' +
  'protein_g (TOTAL grams number), carbs_g (total grams), fat_g (total grams), fiber_g (total grams), ' +
  'confidence (integer 0-100 = overall confidence of the whole estimate), ' +
  'assumptions (array of 1-4 short strings naming key assumptions that most affect the number, e.g. "assumed ~150g rice", "assumed fried in oil", "sauce calories estimated"), ' +
  'description (2-3 sentences on what the food is, how it looks prepared, and its main ingredients), ' +
  'satiety_score (integer 1-10 = how filling/mengenyangkan), satiety_note (one short sentence), ' +
  'health_score (integer 1-10 = how healthy overall), ' +
  'overall (2-4 sentences OVERALL assessment: nutritional quality, balance, and fit for a healthy diet), ' +
  'tags (array of 3 to 6 objects each {label: short nutrient assessment 1-3 words like "Tinggi protein", "Tinggi serat", "Lemak tinggi", "Rendah sayur", "Tinggi gula"; positive: boolean}), ' +
  'recommendation (2-4 sentences practical advice: which nutrients this meal is high or low in, and what to ADD or ADJUST for a more balanced intake), ' +
  'needs_more (array of 1-3 short strings naming nutrients to add, e.g. "protein","serat","sayur"), ' +
  'insights (array of 2 to 4 short helpful bullet strings), note (one short note). ' +
  'If the photo is not food, return items as an empty array and explain in note.';

// ---- Prompt food dari TEKS (nama + gram). ----
const FOODTEXT_SYS =
  'You are an expert nutritionist for the 20fit fitness app. The user types a food/drink name (ANY cuisine, including Indonesian, Western, Japanese, Korean, Chinese, Indian, Middle Eastern) and an amount in grams. ' +
  'Estimate calories and macros ACCURATELY for THAT exact amount. Account for typical cooking method and hidden calories (oil, santan, sugar, sauce) for that dish. Indonesian/SE-Asian dishes are often under-estimated — be careful. ' +
  'If the app provides a REFERENCE value for this food (nutrition per gram), PREFER it. ' +
  'Respond ONLY with a valid JSON object (no markdown, no code fences) with these keys: ' +
  'items (array with ONE object: name, portion (the amount, e.g. "100g"), grams (numeric), kcal, protein_g, carbs_g, fat_g, fiber_g, confidence (integer 0-100)), ' +
  'total_kcal (number = best estimate, do NOT over-estimate), kcal_min (number), kcal_max (number), protein_g (total grams), carbs_g (total grams), fat_g (total grams), fiber_g (total grams), ' +
  'confidence (integer 0-100 overall), assumptions (array of 1-3 short strings of key assumptions), ' +
  'description (2-3 sentences about the food and its main nutrients), ' +
  'satiety_score (integer 1-10), satiety_note (one short sentence), health_score (integer 1-10), ' +
  'overall (2-4 sentences overall assessment of nutritional quality and balance), ' +
  'tags (array of 3 to 5 objects each {label: short nutrient assessment 1-3 words; positive: boolean}), ' +
  'recommendation (2-4 sentences: what nutrients it is high/low in and what to add or adjust), ' +
  'needs_more (array of 1-3 short nutrient strings), insights (array of 2 to 3 short bullet strings), note (short note). ' +
  'If it is not a real food, return items as empty array and explain in note.';

const MCU_SYS =
  'You are a medical document explainer for the 20fit health app. The user uploads a medical check-up document or lab result. OCR and explain the data in plain language for a layperson. RESPOND AS FAST AND CONCISE AS POSSIBLE: summary max 2 sentences, and EACH explanation/why_it_matters/what_to_do must be ONE short sentence; plans are short bullet phrases. STRICT RULES: (1) ALWAYS include a clear reminder that this interpretation is NOT a substitute for consulting a doctor. (2) Do NOT make any diagnosis or name any disease; only explain factually what each value means, how it compares to its normal reference range, and in general terms why an out-of-range value matters for health. (3) If any part of the document is unreadable or unclear, list which parts in the unreadable field. (4) Maintain patient data confidentiality and never invent data that is not present. (5) For every parameter outside its normal range, set status to "attention" and add an entry to abnormal_findings. Respond ONLY with a valid JSON object (no markdown, no code fences) with these keys: document_type (string), patient_name (string or null), date (string or null), summary (2 sentences max, no diagnosis), parameters (array, each object: label, value, normal_range, status one of "normal"|"attention"|"unknown", direction one of "high"|"low"|"normal"|"unknown", explanation one short sentence without diagnosis), abnormal_findings (array, each object: label, value, severity one of "ringan"|"sedang"|"tinggi", why_it_matters one short factual sentence on why being out of range can be risky WITHOUT diagnosing, what_to_do one short action tip), eating_plan (array of 3-5 short bullet phrases), exercise_plan (array of 3-4 short bullet phrases; advise consulting the 20fit trainer/doctor before intense exercise if findings are concerning), lifestyle_plan (array of 2-3 short bullet phrases), unreadable (array of strings), disclaimer (one sentence reminding this is not a substitute for a doctor and to consult the 20fit doctor).';

// Perbandingan konstan-waktu (hindari timing attack) untuk secret.
function safeEq(a: string, b: string): boolean {
  const ae = new TextEncoder().encode(a), be = new TextEncoder().encode(b);
  if (ae.length !== be.length) return false;
  let d = 0;
  for (let i = 0; i < ae.length; i++) d |= ae[i] ^ be[i];
  return d === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  // GERBANG: hanya server yang tahu AI_EDGE_SECRET boleh memanggil. GAGAL-TERTUTUP:
  // secret belum di-set di edge -> tolak SEMUA. Header hilang/salah -> tolak. 401 generik.
  {
    const want = Deno.env.get("AI_EDGE_SECRET") || "";
    const got = req.headers.get("x-ai-edge-secret") || "";
    if (!want || !got || !safeEq(want, got)) return json({ error: "unauthorized" }, 401);
  }
  try {
    const key = Deno.env.get("OPENROUTER_API_KEY");
    if (!key) return json({ error: "OPENROUTER_API_KEY belum di-set di environment." }, 500);
    const b = await req.json();
    const langMsg = {
      role: "system",
      content: b.lang === "en"
        ? "Write every text field in the JSON output in ENGLISH."
        : "Tulis semua teks pada output JSON dalam BAHASA INDONESIA.",
    };
    // Halaman Activity: rencana coaching harian. Output JSON KETAT supaya server bisa
    // menyimpannya apa adanya ke my20fit_daily_plan tanpa menebak bentuk.
    const PLAN_SYS =
      'You are a fitness coach for 20FIT, a gym and sport ecosystem in Jakarta. You receive ONE member\'s data for a single day plus a 7-day history. '+
      'Write a short daily coaching plan. STRICT RULES: (1) You are NOT a doctor — never diagnose, never name a disease, never give medical advice; for anything health-related, advise consulting the 20FIT doctor. '+
      '(2) Base every statement ONLY on the numbers given. If a number is missing, say it is missing — NEVER invent a value. '+
      '(3) overall_score is 0-100 and must reflect the data given, not optimism. '+
      '(4) analysis_text is 2-3 sentences, conversational, mentioning the single most important thing to fix today. '+
      '(5) gaps: 3-5 items, each {area, status one of "good"|"warning"|"critical", value a SHORT string like "5.5 / 7.5h"}. '+
      '(6) goals: 6-8 items, each {id short slug, title max 8 words, desc one short sentence, category one of "exercise"|"nutrition"|"habit"|"recovery", time short string like "07:00" or "Sepanjang hari", done false}. '+
      '(7) nutrition_targets: {kcal, p, c, f, water_glasses} integers, realistic for this member. '+
      'Respond ONLY with a valid JSON object (no markdown, no code fences) with keys: overall_score, analysis_text, gaps, goals, nutrition_targets.';

    // Halaman Activity: BACA screenshot/foto dari health tracker (Strava, Garmin, Apple
    // Health, Google Fit, treadmill, jam tangan). Bisa BEBERAPA gambar sekaligus untuk SATU
    // sesi latihan — mis. layar ringkasan + layar zona detak jantung + layar split.
    // Aturan terpenting: JANGAN MENGARANG. Angka yang tidak terbaca harus null.
    const WORKOUT_SYS =
      'You read screenshots and photos from fitness trackers (Strava, Garmin, Apple Health, Google Fit, Fitbit, Polar, treadmill consoles, smartwatches) for the 20FIT app. '+
      'The images you receive all belong to ONE SINGLE workout session — for example a summary screen, a heart-rate zone screen, and a splits screen. Merge them into ONE result. '+
      'STRICT RULES: (1) NEVER invent a number. If a value is not clearly readable in the images, set it to null. A null is correct; a guess is not. '+
      '(2) Do not convert or compute a value you cannot see, EXCEPT unit conversion of a value that IS shown (miles to km, mm:ss pace to seconds). '+
      '(3) If two images disagree on the same field, use the one from the summary/detail screen and lower confidence. '+
      '(4) If the images are clearly NOT a workout (a meal, a document, a selfie), set readable=false and leave every field null. '+
      '(5) duration_min is total moving/elapsed time in MINUTES (may be fractional). hr_zone_data is SECONDS per zone. pace_data.avg_sec_per_km is seconds per kilometre. '+
      '(6) type must be EXACTLY one of these app values: run, cycling, gym, hyrox, swimming, other. '+
      'Map what you see onto them: cycling covers bike/ride/spin, gym covers strength/weights/HIIT/rowing/elliptical, swimming covers pool and open water, other covers walking, yoga, and anything else. '+
      '(7) confidence is 0-100 and must be honest — lower it for blurry, cropped, or partly hidden numbers. '+
      '(8) fields_read lists ONLY the field names you actually read off the images. '+
      'Respond ONLY with a valid JSON object (no markdown, no code fences) with keys: readable (boolean), title, type, duration_min, distance_km, calories_burned, avg_heart_rate, max_heart_rate, elevation_gain_m, hr_zone_data (object z1..z5 in seconds or null), pace_data (object with avg_sec_per_km or null), source_guess (tracker name or null), confidence, fields_read (array of strings), note (one short sentence, or null).';

    // AI Coach: susun WORKOUT PLAN mingguan terstruktur dari jawaban quiz. Output JSON KETAT
    // supaya server bisa memvalidasi & menyimpannya ke my20fit_workout_plan tanpa menebak.
    const PROGRAM_SYS =
      'You are a certified fitness coach for 20FIT, a gym and sport ecosystem in Jakarta. You receive ONE member\'s quiz answers, safety screening flags, and profile. Build a WEEKLY workout plan they can follow. '+
      'STRICT RULES: (1) You are NOT a doctor — never diagnose, never name a disease, never give medical advice. If safety_flags show injury, current pain, or a medical condition, output a CONSERVATIVE plan (low impact, lower volume), set needs_specialist=true, and in disclaimer advise consulting a 20FIT specialist BEFORE starting. '+
      '(2) Respect availability: days_per_week, minutes_per_session, and location/equipment (home no-equipment = bodyweight only; gym = machines/weights allowed; 20FIT Arena = functional). Never prescribe equipment the member does not have. '+
      '(3) Match difficulty to their level and self-test. Use progressive overload with a clear, simple progression per exercise. '+
      '(4) Keep it realistic and safe; do not exceed the minutes per session. (5) NEVER invent medical claims or physiological numbers. '+
      'Write name/note/progression in the member\'s language (id = Bahasa Indonesia). '+
      'Respond ONLY with a valid JSON object (no markdown, no code fences) with keys: plan_name (string), level ("beginner"|"intermediate"|"advanced"), goal (string), location (string), days_per_week (int), minutes_per_session (int), needs_specialist (boolean), weekly_note (one short sentence), days (array; each {key, label, focus, exercises: array of {key, name, sets int, reps string like "8-10" or a number, unit one of "reps"|"sec"|"min", rest_sec int, note short, progression short}}), disclaimer (one sentence reminding this is not medical advice).';

    let messages: unknown, maxTok: number, plugins: unknown = null;
    if (b.action === "food") {
      if (b.image) {
        maxTok = 2000;
        const uc: unknown[] = [
          { type: "text", text: "Analyse the food/drinks in this photo. Estimate grams per item using visible references and a MODEST/typical portion (do NOT over-estimate). Give a calorie RANGE (kcal_min-kcal_max) with total_kcal near the middle, per-item and overall confidence, macros, description, scores, overall assessment, tags, and a helpful recommendation." },
          { type: "image_url", image_url: { url: b.image } },
        ];
        if (b.reference) uc.unshift({ type: "text", text: "REFERENCE known foods (nutrition per gram) — PREFER these for matching items:\n" + String(b.reference).slice(0, 1500) });
        messages = [{ role: "system", content: FOOD_SYS }, langMsg, { role: "user", content: uc }];
      } else if (b.text) {
        maxTok = 1300;
        let u = "Estimate calories, macros, grams, confidence, description, scores, overall assessment, tags & a recommendation for: " + String(b.text).slice(0, 200);
        if (b.reference) u += "\n\nREFERENCE (prefer if it matches): " + String(b.reference).slice(0, 800);
        messages = [{ role: "system", content: FOODTEXT_SYS }, langMsg, { role: "user", content: u }];
      } else return json({ error: "image atau text wajib diisi" }, 400);
    } else if (b.action === "mcu") {
      if (!b.file) return json({ error: "file wajib diisi" }, 400);
      maxTok = 8000;
      const isPdf = String(b.mime || "").includes("pdf") || String(b.file).startsWith("data:application/pdf");
      if (isPdf) {
        plugins = [{ id: "file-parser", pdf: { engine: "native" } }];
        messages = [{ role: "system", content: MCU_SYS }, langMsg, { role: "user", content: [{ type: "text", text: "OCR and explain this medical check-up per the rules. Answer fast and concise." }, { type: "file", file: { filename: "mcu.pdf", file_data: b.file } }] }];
      } else {
        messages = [{ role: "system", content: MCU_SYS }, langMsg, { role: "user", content: [{ type: "text", text: "OCR and explain this medical check-up per the rules. Answer fast and concise." }, { type: "image_url", image_url: { url: b.file } }] }];
      }
    } else if (b.action === "translate") {
      maxTok = 6000;
      const target = b.lang === "en" ? "English" : "Bahasa Indonesia";
      messages = [{ role: "system", content: "You are a translator. Translate ALL human-readable string VALUES in the given JSON into " + target + ". Keep the JSON structure and keys identical. DO NOT translate or change these code values: status (normal/attention/unknown), direction (high/low/normal/unknown), severity (ringan/sedang/tinggi), positive (true/false), and any numeric value or measurement. Respond ONLY with the translated JSON object, no markdown." }, { role: "user", content: JSON.stringify(b.data || {}).slice(0, 9000) }];
    } else if (b.action === "workout") {
      // Gambar dikirim sebagai ARRAY supaya satu sesi latihan bisa dibaca dari beberapa
      // layar sekaligus. Batas 5 dijaga juga di server; di sini fail-closed kalau kosong.
      const imgs = Array.isArray(b.images) ? b.images.filter((x: unknown) => typeof x === "string" && x) : [];
      if (!imgs.length) return json({ error: "images wajib diisi" }, 400);
      maxTok = 1500;
      const wc: unknown[] = [{ type: "text", text: "Read this ONE workout from " + imgs.length + " image(s) and return the JSON. Any number you cannot clearly read must be null." }];
      for (const im of imgs.slice(0, 5)) wc.push({ type: "image_url", image_url: { url: im } });
      messages = [{ role: "system", content: WORKOUT_SYS }, langMsg, { role: "user", content: wc }];
    } else if (b.action === "plan") {
      if (!b.data) return json({ error: "data wajib diisi" }, 400);
      maxTok = 2500;
      messages = [{ role: "system", content: PLAN_SYS }, langMsg,
        { role: "user", content: "Member data for the day + 7-day history:\n" + JSON.stringify(b.data).slice(0, 6000) }];
    } else if (b.action === "program") {
      if (!b.data) return json({ error: "data wajib diisi" }, 400);
      maxTok = 3000;
      messages = [{ role: "system", content: PROGRAM_SYS }, langMsg,
        { role: "user", content: "Member quiz answers + safety_flags + profile. Build the weekly workout plan JSON:\n" + JSON.stringify(b.data).slice(0, 6000) }];
    } else return json({ error: "action tidak dikenal" }, 400);

    const model = (b.action === "mcu" || b.action === "translate" || b.action === "plan" || b.action === "workout" || b.action === "program") ? MODEL_MCU : MODEL_FOOD;
    const payload: Record<string, unknown> = { model, messages, max_tokens: maxTok, temperature: 0.2, reasoning: { enabled: false } };
    if (plugins) payload.plugins = plugins;
    if (b.action === "mcu" || b.action === "translate" || b.action === "plan" || b.action === "workout" || b.action === "program") payload.response_format = { type: "json_object" };
    const callOR = (p: unknown) => fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": "Bearer " + key, "Content-Type": "application/json", "HTTP-Referer": "https://my.20fit.id", "X-Title": "20fit Health Profile" },
      body: JSON.stringify(p),
    });
    let r = await callOR(payload);
    if (!r.ok && payload.response_format) { delete payload.response_format; r = await callOR(payload); }
    if (!r.ok) { const t = await r.text(); return json({ error: "AI error " + r.status, detail: t.slice(0, 400) }, 500); }
    const data = await r.json();
    const content = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "";
    const parsed = pj(content);
    if (!parsed) return json({ error: "Gagal membaca hasil AI.", raw: String(content).slice(0, 500) }, 502);
    return json({ ok: true, result: parsed });
  } catch (e) {
    return json({ error: String((e && (e as Error).message) || e) }, 500);
  }
});
