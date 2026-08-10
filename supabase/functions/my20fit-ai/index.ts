// my20fit-ai — Edge Function gateway ke OpenRouter untuk: food scan (foto/teks),
// MCU explainer, dan translate. Dipanggil server (server.js /api/scan/ai), bukan frontend.
//
// KEAMANAN: TIDAK ADA API key di-hardcode. Wajib env OPENROUTER_API_KEY.
// (Key lama yang pernah hardcode HARUS di-revoke di OpenRouter.)
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
  '2. COOKING METHOD & HIDDEN CALORIES: account for how it was cooked. Fried/sauteed food absorbs oil (add fat & calories). Grilled/steamed is leaner. Include hidden calories from oil, butter, dressing, mayo, cheese, and sugar even if not directly visible but implied by the dish.\n' +
  '3. INDONESIAN & SE-ASIAN DISHES are commonly UNDER-estimated — be careful with santan (coconut milk), kecap manis (sweet soy), palm sugar, peanut sauce, fried shallots, krupuk, and deep-fried items (gorengan, ayam goreng, nasi goreng). Reflect their real calorie density.\n' +
  '4. If a REFERENCE list of known foods (nutrition per gram) is provided, PREFER those values for any item whose name matches.\n' +
  '5. CONFIDENCE: give an honest confidence (0-100) for the estimate. Lower it when portion is ambiguous, oil/sauce/hidden ingredients are unclear, or the item is partly hidden. This flags items the user should confirm.\n' +
  'Respond ONLY with a valid JSON object (no markdown, no code fences) with these keys: ' +
  'items (array of objects each with: name, portion (short string like "150g" or "1 mangkuk"), grams (numeric grams estimate), kcal, protein_g, carbs_g, fat_g, fiber_g, confidence (integer 0-100 for THIS item)), ' +
  'total_kcal (number), protein_g (TOTAL grams number), carbs_g (total grams), fat_g (total grams), fiber_g (total grams), ' +
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
  'total_kcal (number), protein_g (total grams), carbs_g (total grams), fat_g (total grams), fiber_g (total grams), ' +
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
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
    let messages: unknown, maxTok: number, plugins: unknown = null;
    if (b.action === "food") {
      if (b.image) {
        maxTok = 2000;
        const uc: unknown[] = [
          { type: "text", text: "Analyse the food/drinks in this photo. Estimate grams per item using visible references, account for cooking method & hidden calories, give per-item and overall confidence, macros, description, scores, overall assessment, tags, and a helpful recommendation." },
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
    } else return json({ error: "action tidak dikenal" }, 400);

    const model = b.action === "mcu" || b.action === "translate" ? MODEL_MCU : MODEL_FOOD;
    const payload: Record<string, unknown> = { model, messages, max_tokens: maxTok, temperature: 0.2, reasoning: { enabled: false } };
    if (plugins) payload.plugins = plugins;
    if (b.action === "mcu" || b.action === "translate") payload.response_format = { type: "json_object" };
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
