// IqraSpace site Worker. Static pages are served by Workers Static Assets
// without invoking this code (wrangler.jsonc run_worker_first: ["/api/*"]).
// This only handles /api/contact; the www -> apex redirect is a Cloudflare
// Redirect Rule (see ADMIN.md).
import { handleContact } from './contact.js';
import { handleDuas } from './duas.js';

const JSON_HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/duas') {
      const r = await handleDuas({ method: request.method, env, cache: caches.default });
      return new Response(request.method === 'HEAD' ? null : JSON.stringify(r.body), {
        status: r.status,
        headers: {
          'Content-Type': 'application/json',
          // Short browser cache; the Worker caches upstream for 60s, so a published change shows up within ~1.5 min.
          'Cache-Control': r.status === 200 ? 'public, max-age=30' : 'no-store',
          ...r.headers,
        },
      });
    }

    if (url.pathname !== '/api/contact') return env.ASSETS.fetch(request);

    let body = {};
    if (request.method === 'POST') {
      try {
        body = await request.json();
      } catch {
        body = {}; // same as before: unparseable body -> validation errors
      }
    }

    const result = await handleContact({
      method: request.method,
      body,
      remoteIp: request.headers.get('CF-Connecting-IP') || '',
      env,
      waitUntil: (p) => ctx.waitUntil(p),
    });

    return new Response(JSON.stringify(result.json), {
      status: result.status,
      headers: { ...JSON_HEADERS, ...(result.headers || {}) },
    });
  },
};
