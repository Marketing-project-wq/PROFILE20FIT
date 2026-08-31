// my20fit-foodimg — generate a realistic food photo for a diet menu via OpenRouter
// (google/gemini-2.5-flash-image), then STORE it as a file in Supabase Storage and
// return a short PUBLIC URL (not a ~2 MB base64 data-URL). ISOLATED from my20fit-ai:
// if this fails, only diet photos are affected and the client falls back to TheMealDB → emoji.
//
// SECURITY: OpenRouter key ONLY from env (OPENROUTER_API_KEY). Never hardcode a key here.
// PERSISTENCE (fix "foto hilang pas reload"): the generated image is uploaded to the PUBLIC
// bucket `my20fit-foodimg` (service role) and only the SMALL public URL is cached in table
// public.my20fit_foodimg. So a menu is generated ONCE, the file lives permanently in Storage,
// and the browser caches it → the photo STAYS on reload (no re-fetch of huge base64).
//
// Request  (POST JSON): { id: string, name: string, desc?: string }
// Response (JSON):      { ok:true, url:"https://.../storage/v1/object/public/my20fit-foodimg/<id>.png" } | { error }

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (o: unknown, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

const SB_URL = Deno.env.get('SUPABASE_URL') || '';
const SB_SVC = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const MODEL = Deno.env.get('AI_MODEL_FOODIMG') || 'google/gemini-2.5-flash-image';
const TABLE = 'my20fit_foodimg';
const BUCKET = 'my20fit-foodimg';

// --- best-effort cache via PostgREST (service role bypasses RLS). Never throws. ---
async function cacheGet(id: string): Promise<string | null> {
  if (!SB_URL || !SB_SVC) return null;
  try {
    const r = await fetch(`${SB_URL}/rest/v1/${TABLE}?id=eq.${encodeURIComponent(id)}&select=url`, {
      headers: { apikey: SB_SVC, Authorization: 'Bearer ' + SB_SVC },
    });
    if (!r.ok) return null;
    const rows = await r.json();
    return (Array.isArray(rows) && rows[0] && rows[0].url) || null;
  } catch (_e) { return null; }
}
async function cachePut(id: string, url: string): Promise<void> {
  if (!SB_URL || !SB_SVC) return;
  try {
    await fetch(`${SB_URL}/rest/v1/${TABLE}?on_conflict=id`, {
      method: 'POST',
      headers: {
        apikey: SB_SVC, Authorization: 'Bearer ' + SB_SVC,
        'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({ id, url }),
    });
  } catch (_e) { /* ignore — cache is best-effort */ }
}

// Decode a data:image/*;base64,... URL and upload it to the public bucket. Returns the public
// URL, or null on any failure (caller then falls back to the raw data-URL). Never throws.
async function uploadToStorage(id: string, dataUrl: string): Promise<string | null> {
  if (!SB_URL || !SB_SVC) return null;
  const m = String(dataUrl).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!m) return null;
  const mime = m[1];
  const sub = mime.split('/')[1] || 'png';
  const ext = sub === 'jpeg' ? 'jpg' : sub;
  const safe = id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 90);
  const path = `${safe}.${ext}`;
  try {
    const bin = atob(m[2]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const up = await fetch(`${SB_URL}/storage/v1/object/${BUCKET}/${path}`, {
      method: 'POST',
      headers: {
        apikey: SB_SVC, Authorization: 'Bearer ' + SB_SVC,
        'Content-Type': mime, 'x-upsert': 'true', 'Cache-Control': 'public, max-age=31536000',
      },
      body: bytes,
    });
    if (!up.ok) return null;
    return `${SB_URL}/storage/v1/object/public/${BUCKET}/${path}`;
  } catch (_e) { return null; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const key = Deno.env.get('OPENROUTER_API_KEY');
    if (!key) return json({ error: 'OPENROUTER_API_KEY belum di-set di Supabase secrets' }, 500);
    const b = await req.json().catch(() => ({}));
    const id = String(b.id || '').slice(0, 80);
    const name = String(b.name || '').slice(0, 120);
    if (!id || !name) return json({ error: 'id & name wajib diisi' }, 400);

    const hit = await cacheGet(id);
    if (hit) return json({ ok: true, url: hit, cached: true });

    // Prompt: SATU piring/mangkuk, SATU dish, tajam, warna hidup. Tegaskan BUKAN kolase/grid/
    // gambar berulang — dulu "fills entire frame edge to edge" bikin model malah menge-tile jadi
    // beberapa piring (double). desc (bahan) bikin AI tahu persis dish-nya. `indo` (opsional,
    // default true) menambah styling ala food photography Indonesia (piring keramik sederhana/
    // alas tikar anyaman/daun pisang, cahaya hangat tropis) — TANPA memaksa elemen semisal
    // sambal/kerupuk ke dish yang bukan masakan Indonesia (mis. burger/pizza/pasta di katalog ini).
    const desc = String(b.desc || '').slice(0, 400);
    const indoStyle = b.indo !== false;
    const prompt =
      `ONE single wide landscape (4:3) photorealistic food photograph of the dish "${name}"` +
      (desc ? `, made of ${desc}` : '') +
      `. Frame contains exactly ONE plate or bowl of this one dish, centered and filling the frame. ` +
      `It is a SINGLE photo — absolutely NOT a collage, NOT a grid, NOT a strip, NOT multiple plates ` +
      `side by side, NOT the dish repeated or tiled. Just one plate. Shot from a 45-degree angle, ` +
      `bright even lighting, sharp focus, vivid appetizing natural colors, crisp fine detail, ` +
      `professional food-magazine style. No blur, no text, no watermark, no hands, no packaging.` +
      (indoStyle
        ? ` Styled the way Indonesian food blogs and warung/restaurant menus photograph dishes: ` +
          `simple ceramic or enamel plate (or banana-leaf lining if it suits the dish), warm ` +
          `natural tropical daylight, a woven rattan placemat or rustic wood table. The dish ` +
          `itself must stay exactly what "${name}" is — do not add sambal, kerupuk, or other ` +
          `Indonesian side dishes unless they are already part of the description above.`
        : '');

    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + key, 'Content-Type': 'application/json',
        'HTTP-Referer': 'https://my.20fit.id', 'X-Title': '20fit Diet Images',
      },
      body: JSON.stringify({ model: MODEL, messages: [{ role: 'user', content: prompt }], modalities: ['image', 'text'] }),
    });
    if (!r.ok) { const t = await r.text(); return json({ error: 'image error ' + r.status, detail: t.slice(0, 300) }, 502); }
    const data = await r.json();
    const msg = data && data.choices && data.choices[0] && data.choices[0].message;
    const imgs = (msg && msg.images) || [];
    const dataUrl = (imgs[0] && imgs[0].image_url && imgs[0].image_url.url) || (imgs[0] && imgs[0].url) || '';
    if (!dataUrl || !String(dataUrl).startsWith('data:image')) return json({ error: 'no image returned' }, 502);

    // Persist as a real file → short public URL (browser-cacheable, stays on reload).
    // Fallback to the raw data-URL only if the upload fails (degrades to old behavior, never worse).
    const publicUrl = await uploadToStorage(id, dataUrl);
    const finalUrl = publicUrl || dataUrl;
    await cachePut(id, finalUrl);
    return json({ ok: true, url: finalUrl, stored: !!publicUrl });
  } catch (e) { return json({ error: String((e && (e as Error).message) || e) }, 500); }
});
