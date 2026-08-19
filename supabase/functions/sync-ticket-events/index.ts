import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ============================================================
// sync-ticket-events — SATU sumber sinkronisasi katalog event my.20fit.
// Menarik SEMUA event dari embed API ticket.20fit.id (kunci: secret TICKET_EMBED_KEY),
// lalu upsert ke my20fit_ticket_events (service role): insert baru, update berubah
// (harga, tanggal, sold_count, status), dan ARCHIVE event yang hilang dari upstream
// (tidak dihapus). Cover diunduh & diunggah ke bucket publik event-covers (bukan hotlink).
// Idempoten by slug (unique my20fit_ticket_events_slug_key). Mengisi synced_at.
//
// Endpoint upstream (dari edge function ticket-embed): GET {EMBED_BASE}/events,
// Authorization: Bearer <TICKET_EMBED_KEY>. Bentuk item:
//   { slug, title:{en,id}, startsAt, endsAt, salesEndsAt, venue, city, organizer,
//     bannerUrl, priceFromSen, ticketTypes:[{ sold, quota }] }
// ============================================================

const EMBED_BASE = "https://ticket.20fit.id/api/embed/v1";
const APP_KEY = Deno.env.get("TICKET_EMBED_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const BUCKET = "event-covers";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function pickName(t: unknown): string {
  if (t && typeof t === "object") {
    const o = t as Record<string, string>;
    return o.en || o.id || "Event 20FIT";
  }
  return typeof t === "string" ? t : "Event 20FIT";
}
function extFromContentType(ct: string, url: string): string {
  const t = (ct || "").toLowerCase();
  if (t.includes("png")) return "png";
  if (t.includes("webp")) return "webp";
  if (t.includes("jpeg") || t.includes("jpg")) return "jpg";
  const m = (url || "").split("?")[0].match(/\.(png|webp|jpe?g)$/i);
  return m ? m[1].toLowerCase().replace("jpeg", "jpg") : "jpg";
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!APP_KEY) return json({ error: "server_misconfig", detail: "TICKET_EMBED_KEY belum di-set" }, 500);
  if (!SUPABASE_URL || !SERVICE_KEY) return json({ error: "server_misconfig", detail: "service key tidak tersedia" }, 500);

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const nowIso = new Date().toISOString();

  // Opsi: ?debug=1 → hanya kembalikan event mentah dari upstream (tanpa menulis apa pun).
  const url = new URL(req.url);
  const debug = url.searchParams.get("debug") === "1";

  // 1) Tarik daftar event upstream.
  let events: Record<string, unknown>[] = [];
  try {
    const r = await fetch(`${EMBED_BASE}/events`, {
      headers: { Authorization: `Bearer ${APP_KEY}`, "Content-Type": "application/json" },
    });
    const text = await r.text();
    let data: unknown; try { data = JSON.parse(text); } catch { data = null; }
    if (!r.ok) return json({ ok: false, error: `upstream_http_${r.status}`, body: text.slice(0, 500) }, 502);
    const d = data as Record<string, unknown> | null;
    events = Array.isArray(d?.data) ? (d!.data as Record<string, unknown>[])
      : Array.isArray(d?.events) ? (d!.events as Record<string, unknown>[])
      : Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
  } catch (e) {
    return json({ ok: false, error: "fetch_failed", detail: String(e) }, 502);
  }
  if (debug) return json({ ok: true, debug: true, count: events.length, sample: events[0] ?? null });

  // 2) Cover: unduh bannerUrl → unggah ke Storage → URL publik. Gagal → null (jaga cover lama).
  async function syncCover(slug: string, bannerUrl: unknown): Promise<string | null> {
    if (typeof bannerUrl !== "string" || !/^https?:\/\//i.test(bannerUrl)) return null;
    try {
      const res = await fetch(bannerUrl);
      if (!res.ok) return null;
      const ct = res.headers.get("content-type") || "";
      const bytes = new Uint8Array(await res.arrayBuffer());
      const path = `${slug}.${extFromContentType(ct, bannerUrl)}`;
      const up = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: ct || "image/jpeg", upsert: true });
      if (up.error) return null;
      const pub = supabase.storage.from(BUCKET).getPublicUrl(path);
      return pub.data?.publicUrl ?? null;
    } catch { return null; }
  }

  // 3) Slug yang sudah ada di katalog kita (untuk update vs insert, dan deteksi yang hilang).
  const { data: existingRows, error: exErr } = await supabase.from("my20fit_ticket_events").select("slug,status");
  if (exErr) return json({ ok: false, error: "db_select", detail: exErr.message }, 500);
  const existing = new Map<string, string>((existingRows ?? []).map((r) => [String(r.slug), String(r.status)]));

  const upserted: { slug: string; status: string; sold_count: number; cover: boolean }[] = [];
  const errors: { slug: string; error: string }[] = [];
  const upstreamSlugs = new Set<string>();

  for (const ev of events) {
    const slug = String((ev.slug ?? "") as string).trim().toLowerCase();
    if (!slug) continue;
    upstreamSlugs.add(slug);

    const types = Array.isArray(ev.ticketTypes) ? (ev.ticketTypes as Record<string, unknown>[]) : [];
    const sold = types.reduce((s, t) => s + (Number(t.sold) || 0), 0);
    const quota = types.reduce((s, t) => s + (Number(t.quota) || 0), 0);
    const priceFrom = ev.priceFromSen != null ? Math.round(Number(ev.priceFromSen) / 100) : null;

    // Derivasi status: sales/acara sudah lewat → ended; kuota penuh → sold_out; selain itu on_sale.
    const endRef = (ev.salesEndsAt as string) || (ev.endsAt as string) || null;
    let status = "on_sale";
    if (endRef && new Date(endRef).getTime() < Date.now()) status = "ended";
    else if (quota > 0 && sold >= quota) status = "sold_out";

    const cover = await syncCover(slug, ev.bannerUrl);

    const fields: Record<string, unknown> = {
      name: pickName(ev.title),
      organizer: (ev.organizer as string) || null,
      venue: (ev.venue as string) || null,
      city: (ev.city as string) || null,
      starts_at: (ev.startsAt as string) || null,
      price_from: priceFrom,
      currency: "IDR",
      sold_count: sold,
      status,
      synced_at: nowIso,
      updated_at: nowIso,
    };
    if (cover) fields.cover_url = cover; // hanya timpa cover kalau unggah sukses

    try {
      if (existing.has(slug)) {
        const { error } = await supabase.from("my20fit_ticket_events").update(fields).eq("slug", slug);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("my20fit_ticket_events")
          .insert({ ...fields, slug, published_at: nowIso });
        if (error) throw error;
      }
      upserted.push({ slug, status, sold_count: sold, cover: !!cover });
    } catch (e) {
      errors.push({ slug, error: (e as Error).message || String(e) });
    }
  }

  // 4) Event yang hilang dari upstream → archived (jangan hapus). Lewati yang sudah archived.
  const archived: string[] = [];
  for (const [slug, st] of existing) {
    if (!upstreamSlugs.has(slug) && st !== "archived") {
      const { error } = await supabase.from("my20fit_ticket_events")
        .update({ status: "archived", synced_at: nowIso, updated_at: nowIso }).eq("slug", slug);
      if (!error) archived.push(slug); else errors.push({ slug, error: error.message });
    }
  }

  return json({ ok: true, source_events: events.length, upserted_count: upserted.length, upserted, archived, errors });
});
