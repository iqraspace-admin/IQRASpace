// GET /api/duas — the website's Duas feed.
//
// Proxies the Learning app's public, published-only Duas feed
// (apps/learning worker/api/duas.js, GET /learning/api/duas/content), which
// returns ONLY published Duas in active categories (the same snapshot the
// mobile app downloads). There is no copy of Dua content in this repo's
// website: an admin publishing/editing in Learning (/learning/admin/duas) is
// all it takes; this feed picks it up within CACHE_SECONDS.
//
// Config (wrangler.jsonc):
//   LEARNING          service binding to the iqraspace-learning Worker (preferred:
//                     a direct Worker-to-Worker call, no public round trip)
//   DUAS_SOURCE_URL   fallback URL of the feed, used when the binding is absent

const CACHE_SECONDS = 60;
const DEFAULT_SOURCE = 'https://iqraspace.org/learning/api/duas/content';

const json = (status, body, extra = {}) => ({ status, body, headers: extra });

export async function handleDuas({ method, env, fetchImpl, cache = null, now = Date.now }) {
  if (method !== 'GET' && method !== 'HEAD') return json(405, { ok: false, error: 'Method not allowed' }, { Allow: 'GET, HEAD' });

  const source = String(env.DUAS_SOURCE_URL || DEFAULT_SOURCE).trim();
  let src;
  try {
    src = new URL(source);
  } catch {
    return json(503, { ok: false, error: 'Duas source is not configured' });
  }
  const doFetch = fetchImpl ?? (env.LEARNING ? (u, i) => env.LEARNING.fetch(u, i) : fetch);

  const cacheKey = new Request(src.href);
  if (cache) {
    const hit = await cache.match(cacheKey);
    if (hit) return json(200, await hit.json(), { 'X-Duas-Cache': 'HIT' });
  }

  let snapshot;
  try {
    const res = await doFetch(src.href, { method: 'GET', headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`upstream ${res.status}`);
    snapshot = await res.json();
  } catch {
    return json(502, { ok: false, error: 'Duas are temporarily unavailable' });
  }
  if (!snapshot || !Array.isArray(snapshot.categories)) return json(502, { ok: false, error: 'Unexpected Duas payload' });

  const payload = { ok: true, fetchedAt: new Date(now()).toISOString(), ...snapshot };
  if (cache) {
    await cache.put(
      cacheKey,
      new Response(JSON.stringify(payload), { headers: { 'Content-Type': 'application/json', 'Cache-Control': `max-age=${CACHE_SECONDS}` } }),
    );
  }
  return json(200, payload, { 'X-Duas-Cache': 'MISS' });
}
