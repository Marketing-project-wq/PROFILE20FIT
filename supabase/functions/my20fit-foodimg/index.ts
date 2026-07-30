// my20fit-foodimg — generate a realistic food photo for a diet menu via OpenRouter
// (google/gemini-2.5-flash-image). ISOLATED from my20fit-ai on purpose: if this fails,
// only diet photos are affected and the client falls back to TheMealDB → emoji.
//
// SECURITY: OpenRouter key ONLY from env (OPENROUTER_API_KEY). Never hardcode a key here.
// CACHE: generated data-URL disimpan sekali di tabel public.my20fit_foodimg (via service
// role REST) supaya generate cukup SEKALI per menu (hemat biaya), user berikutnya baca cache.
//
// Request  (POST JSON): { id: string, name: string, desc?: string }
// Response (JSON):      { ok:true, url:"data:image/...;base64,..." }  |  { error }

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

    const desc = String(b.desc || '').slice(0, 300);
    const prompt =
      `A professional, appetizing food photograph of "${name}"` +
      (desc ? ` — ${desc}` : '') +
      `. Realistic restaurant-quality dish plated on a clean plate or bowl, natural soft lighting, ` +
      `top-down or 45-degree angle, shallow depth of field, neutral background. No text, no watermark, no hands, no packaging.`;

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
    const url = (imgs[0] && imgs[0].image_url && imgs[0].image_url.url) || (imgs[0] && imgs[0].url) || '';
    if (!url || !String(url).startsWith('data:image')) return json({ error: 'no image returned' }, 502);

    await cachePut(id, url);
    return json({ ok: true, url });
  } catch (e) { return json({ error: String((e && (e as Error).message) || e) }, 500); }
});
