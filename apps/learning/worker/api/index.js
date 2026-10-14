// Learning API router — everything under /learning/api/*: auth, the query
// endpoint, RPCs, admin user management, lesson files, realtime and the
// public Duas feed. D1 + R2 + a Durable Object, all in the iqraspace-learning Worker.

import { CORS_HEADERS, json, errorResponse, d1Executor, readJson } from "./http.js";
import { sessionContext, login, signup, logout, currentUser } from "./auth.js";
import { runQuery } from "./db.js";
import { clientIp } from "./throttle.js";
import { runRpc } from "./rpc.js";
import { adminUsers } from "./adminUsers.js";
import { storageAction, storageUpload, storageDownload } from "./storage.js";
import { realtimeUpgrade } from "./realtime.js";
import { getDuaContent, duaContentVersion } from "./duas.js";

const DUAS_CACHE_SECONDS = 60;

/** @param {string} path the part after /learning/api, e.g. "/db" */
export async function handleApi(request, env, path) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (!env.DB) return json({ error: "Database binding missing" }, 503);
  const exec = d1Executor(env.DB);
  const url = new URL(request.url);
  const method = request.method;

  try {
    // ---------------------------------------------------------- public
    if (path === "/auth/login" && method === "POST") return json(await login(await readJson(request), exec, clientIp(request)));
    if (path === "/auth/signup" && method === "POST") return json(await signup(await readJson(request), exec, clientIp(request)));
    if (path === "/storage/file" && method === "GET") return storageDownload(request, url, env, exec);

    if (path === "/duas/content") {
      if (method !== "GET") return json({ error: "Method not allowed" }, 405);
      return json(await getDuaContent(exec), 200, { "Cache-Control": `public, max-age=${DUAS_CACHE_SECONDS}` });
    }
    if (path === "/duas/version") {
      if (method !== "GET") return json({ error: "Method not allowed" }, 405);
      return json(await duaContentVersion(exec), 200, { "Cache-Control": `public, max-age=${DUAS_CACHE_SECONDS}` });
    }

    const rt = /^\/realtime\/([^/]+)$/.exec(path);
    if (rt && method === "GET") return realtimeUpgrade(request, url, rt[1], env, exec);

    // ---------------------------------------------------------- signed in
    const ctx = await sessionContext(request, exec);

    if (path === "/auth/session" && method === "GET") return json(await currentUser(ctx, exec));
    if (path === "/auth/logout" && method === "POST") return json(await logout(ctx, exec));

    if (path === "/admin/users" && method === "POST") {
      const r = await adminUsers(await readJson(request), ctx, exec);
      return json(r.body, r.status);
    }
    if (path === "/storage" && method === "POST") {
      const r = await storageAction(await readJson(request), ctx, env, exec);
      return json(r.body, r.status);
    }
    if (path === "/storage/upload" && method === "PUT") {
      const r = await storageUpload(request, url, ctx, env);
      return json(r.body, r.status);
    }

    if (!ctx) return json({ data: null, error: { code: "PGRST301", message: "JWT expired or invalid session" } }, 401);

    if (path === "/db" && method === "POST") {
      const result = await runQuery(await readJson(request), ctx, exec);
      return json({ data: result.data, count: result.count, error: null });
    }
    const rpc = /^\/rpc\/([a-z_]+)$/.exec(path);
    if (rpc && method === "POST") {
      return json({ data: await runRpc(rpc[1], await readJson(request), ctx, exec), error: null });
    }

    return json({ error: "Not found" }, 404);
  } catch (e) {
    return errorResponse(e);
  }
}
