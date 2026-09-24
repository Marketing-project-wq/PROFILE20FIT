// recipe-article-ai — Edge Function: generate SEO article draft (bilingual ID+EN) untuk CMS
// recipe.20fit.id. DIPANGGIL LANGSUNG DARI BROWSER admin (supabase.functions.invoke), jadi
// gerbangnya = JWT user + cek dia benar admin recipe (tabel recipe_admin_role) via service key.
// Bukan pakai AI_EDGE_SECRET (itu untuk fungsi server-only). OpenRouter key = OPENROUTER_API_KEY
// (secret project, sama seperti my20fit-ai). Hasil = DRAFT untuk direview admin (situs memoderasi
// klaim kesehatan), jadi prompt melarang klaim medis/penyembuhan.

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

// Parse JSON walau model membungkus dengan code fence / teks.
function pj(t: string): any {
  try { return JSON.parse(t); } catch (_e) { /* ignore */ }
  const a = t.indexOf("{"), z = t.lastIndexOf("}");
  if (a >= 0 && z > a) { try { return JSON.parse(t.slice(a, z + 1)); } catch (_e) { /* ignore */ } }
  return null;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const ANON = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const MODEL = Deno.env.get("AI_MODEL_ARTICLE") || "google/gemini-2.5-flash";

const SYS =
  "You are a senior content writer and SEO specialist for 20FIT, an Indonesian health & fitness brand " +
  "(recipe.20fit.id — healthy recipes & nutrition education). Write a complete, original, SEO-optimized " +
  "article from the given topic, for a general Indonesian audience: friendly, practical, trustworthy, " +
  "specific (real tips, examples, safe numbers) — not fluff.\n" +
  "SAFETY (the site moderates health claims): this is general nutrition/lifestyle education, NOT medical " +
  "advice. Do NOT claim any food/diet/supplement cures, treats, prevents or reverses disease. No unverified " +
  "medical or therapeutic promises, no absolute guarantees. Where a reader might need it, gently suggest " +
  "consulting a doctor or the 20FIT team. Keep every claim general and responsible.\n" +
  "Respond with ONE valid JSON object ONLY (no markdown, no code fences) with EXACTLY these keys:\n" +
  "slug (URL slug: lowercase ASCII, kebab-case, 3-8 words from the English title, no stopword clutter), " +
  "title_id (Indonesian title, compelling & SEO-friendly, <= 65 characters), " +
  "title_en (English title, <= 65 characters), " +
  "excerpt_id (Indonesian meta description, 120-155 characters, one enticing sentence containing the main keyword), " +
  "excerpt_en (English meta description, 120-155 characters), " +
  "category_id (one short Indonesian category e.g. \"Tips Gizi\", \"Resep Sehat\", \"Gaya Hidup\", \"Panduan Diet\", \"Makan Sehat\"), " +
  "category_en (English equivalent), " +
  "body_md_id (the FULL article in Bahasa Indonesia as Markdown, 600-1000 words: start with an intro paragraph — do NOT repeat the title as a heading; use 3-6 \"## \" section headings, short paragraphs, at least one \"- \" bullet list, and one \"> \" blockquote tip; end with a short practical takeaway; weave in the main keyword naturally; DO NOT embed images), " +
  "body_md_en (the FULL article in English Markdown, same structure and meaning), " +
  "image_query (2-4 ENGLISH words describing an ideal cover PHOTO for stock-photo search, concrete and photographable, food/fitness related, e.g. \"healthy salad bowl\", \"meal prep containers\"), " +
  "tags (array of 3-6 short lowercase keyword strings).";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  try {
    // ---- GERBANG: user login + benar admin recipe ----
    const authz = req.headers.get("Authorization") || "";
    const jwt = authz.replace(/^Bearer\s+/i, "").trim();
    if (!jwt || !SUPABASE_URL || !SERVICE) return json({ error: "unauthorized" }, 401);

    const ures = await fetch(SUPABASE_URL + "/auth/v1/user", {
      headers: { Authorization: "Bearer " + jwt, apikey: ANON || SERVICE },
    });
    if (!ures.ok) return json({ error: "unauthorized" }, 401);
    const user = await ures.json();
    const uid = user && user.id;
    if (!uid) return json({ error: "unauthorized" }, 401);

    const ares = await fetch(
      SUPABASE_URL + "/rest/v1/recipe_admin_role?select=role&user_id=eq." + encodeURIComponent(uid),
      { headers: { apikey: SERVICE, Authorization: "Bearer " + SERVICE } }
    );
    const arows = ares.ok ? await ares.json() : [];
    if (!Array.isArray(arows) || arows.length === 0) return json({ error: "forbidden: bukan admin recipe" }, 403);

    // ---- Input ----
    const b = await req.json().catch(() => ({}));
    const topic = String(b.topic || "").trim().slice(0, 300);
    if (!topic) return json({ error: "topic wajib diisi" }, 400);
    const notes = String(b.notes || "").trim().slice(0, 600);
    const category = String(b.category || "").trim().slice(0, 60);

    const key = Deno.env.get("OPENROUTER_API_KEY");
    if (!key) return json({ error: "OPENROUTER_API_KEY belum di-set." }, 500);

    let userMsg = "Topic / judul ide: " + topic;
    if (notes) userMsg += "\nCatatan tambahan / sudut pandang: " + notes;
    userMsg += category ? "\nKategori yang diinginkan: " + category : "\nKategori: tentukan yang paling pas.";
    userMsg += "\n\nTulis artikelnya sekarang sebagai JSON sesuai instruksi.";

    const payload = {
      model: MODEL,
      messages: [
        { role: "system", content: SYS },
        { role: "user", content: userMsg },
      ],
      max_tokens: 8000,
      temperature: 0.5,
      response_format: { type: "json_object" },
      reasoning: { enabled: false },
    } as Record<string, unknown>;

    const callOR = (p: unknown) =>
      fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + key,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://recipe.20fit.id",
          "X-Title": "20fit Recipe CMS",
        },
        body: JSON.stringify(p),
      });

    let r = await callOR(payload);
    if (!r.ok && (payload as any).response_format) { delete (payload as any).response_format; r = await callOR(payload); }
    if (!r.ok) { const t = await r.text(); return json({ error: "AI error " + r.status, detail: t.slice(0, 400) }, 502); }
    const data = await r.json();
    const content = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "";
    const parsed = pj(String(content));
    if (!parsed) return json({ error: "Gagal membaca hasil AI.", raw: String(content).slice(0, 500) }, 502);

    // Normalisasi ringan slug (jaga-jaga).
    if (parsed.slug) {
      parsed.slug = String(parsed.slug).toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "")
        .trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
    }
    return json({ ok: true, result: parsed });
  } catch (e) {
    return json({ error: String((e && (e as Error).message) || e) }, 500);
  }
});
