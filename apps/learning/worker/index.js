// Cloudflare Worker for apps/learning (Workers Static Assets).
//
// Everything is static (the Next.js export in dist/learning). The Worker only
// runs for the dynamic-route URL patterns listed in wrangler.jsonc
// `assets.run_worker_first`; it internally rewrites those to the placeholder
// HTML shell (no redirect, the browser keeps the real URL) and delegates to
// the assets binding. Anything else falls straight through to ASSETS.
import { matchDynamicRoute } from "./routes.js";

const worker = {
  async fetch(request, env) {
    if (request.method === "GET" || request.method === "HEAD") {
      const url = new URL(request.url);
      const shell = matchDynamicRoute(url.pathname);
      if (shell) {
        url.pathname = shell;
        url.search = "";
        const res = await env.ASSETS.fetch(new Request(url, request));
        // Don't let a stale shell outlive a deploy under an arbitrary URL.
        if (res.ok) {
          const out = new Response(res.body, res);
          out.headers.set("Cache-Control", "public, max-age=0, must-revalidate");
          return out;
        }
        return res;
      }
    }
    return env.ASSETS.fetch(request);
  },
};

export default worker;
