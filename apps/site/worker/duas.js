// GET /api/duas — the website's Duas feed.
//
// Proxies the Learning project's public `get_dua_content()` RPC, which returns
// ONLY published Duas in active categories (the same snapshot the mobile app
// downloads). There is no copy of Dua content in this repo's website: an admin
// publishing/editing in Learning (/learning/admin/duas) is all it takes; this
// feed picks it up within CACHE_SECONDS.
//
// Config (Worker vars/secrets; the anon key is public by design — it can only
// call the two published-only RPCs):
//   DUAS_SUPABASE_URL       https://<learning-project-ref>.supabase.co
//   DUAS_SUPABASE_ANON_KEY  the Learning project's anon/publishable key

const CACHE_SECONDS = 60;

const json = (status, body, extra = {}) => ({ status, body, headers: extra });

export async function handleDuas({ method, env, fetchImpl = fetch, cache = null, now = Date.now }) {
  if (method !== 'GET' && method !== 'HEAD') return json(405, { ok: false, error: 'Method not allowed' }, { Allow: 'GET, HEAD' });

  const base = String(env.DUAS_SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const key = String(env.DUAS_SUPABASE_ANON_KEY || '').trim();
  if (!base || !key) return json(503, { ok: false, error: 'Duas source is not configured' });

  const cacheKey = new Request(`${base}/rest/v1/rpc/get_dua_content`);
  if (cache) {
    const hit = await cache.match(cacheKey);
    if (hit) return json(200, await hit.json(), { 'X-Duas-Cache': 'HIT' });
  }

  let snapshot;
  try {
    const res = await fetchImpl(`${base}/rest/v1/rpc/get_dua_content`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: '{}',
    });
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
