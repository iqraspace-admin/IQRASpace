// Cloudflare Worker for apps/learning (Workers Static Assets + the app's API).
//
// Everything in the UI is static (the Next.js export in dist/learning). The
// Worker only runs for the URL patterns listed in wrangler.jsonc
// `assets.run_worker_first`:
//   - /learning/api/*  -> the Learning API (worker/api: D1, R2, realtime)
//   - dynamic routes   -> internally rewritten to the placeholder HTML shell
//                         (no redirect, the browser keeps the real URL)
// Anything else falls straight through to ASSETS.
import { matchDynamicRoute, DEFAULT_BASE_PATH } from "./routes.js";
import { handleApi } from "./api/index.js";

export { LessonRoom } from "./api/realtime.js";

const API_PREFIX = `${DEFAULT_BASE_PATH}/api`;

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === API_PREFIX || url.pathname.startsWith(`${API_PREFIX}/`)) {
      return handleApi(request, env, url.pathname.slice(API_PREFIX.length) || "/");
    }

    if (request.method === "GET" || request.method === "HEAD") {
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
