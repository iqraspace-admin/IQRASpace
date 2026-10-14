// Shared HTTP + database-execution helpers for the Learning API.

import { QueryError } from "./query.js";
import { TABLES } from "./schema.js";

// Auth is a bearer token (not a cookie), so a permissive CORS policy exposes
// nothing on its own. It lets `next dev`
// on localhost:3000 talk to `wrangler dev` on localhost:8787.
export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

export function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json", "Cache-Control": "no-store", ...extra },
  });
}

/** `{ error: { code, message } }` — the shape src/lib/db.ts expects. */
export function errorResponse(err, status) {
  const e = err instanceof QueryError ? err : toApiError(err);
  return json({ data: null, error: { code: e.code, message: e.message } }, status ?? e.status ?? 400);
}

/** Map SQLite / D1 errors onto the Postgres error codes the UI already understands. */
export function toApiError(err, table) {
  if (err instanceof QueryError) return err;
  const raw = String(err?.message ?? err);
  let m = /UNIQUE constraint failed: ([\w.]+(?:, [\w.]+)*)/.exec(raw);
  if (m) {
    const cols = m[1].split(", ").map((c) => c.split("."));
    const tbl = cols[0][0];
    const name = `${tbl}_${cols.map((c) => c[1]).join("_")}_key`;
    return new QueryError(`duplicate key value violates unique constraint "${name}"`, "23505", 409);
  }
  if (/FOREIGN KEY constraint failed/.test(raw)) {
    const referencing = table
      ? Object.entries(TABLES)
          .flatMap(([t, d]) => Object.entries(d.fks ?? {}).filter(([, tgt]) => tgt.startsWith(`${table}.`)).map(([c]) => `${t}.${c}`))
          .join(", ")
      : "";
    return new QueryError(
      `insert, update or delete on table "${table ?? "?"}" violates a foreign key constraint${referencing ? ` (referenced by ${referencing})` : ""}`,
      "23503",
      409
    );
  }
  m = /CHECK constraint failed: (.+?)(?::\s*SQLITE_CONSTRAINT.*)?$/.exec(raw);
  if (m) return new QueryError(`new row for relation "${table ?? "?"}" violates check constraint "${m[1].trim()}"`, "23514");
  m = /NOT NULL constraint failed: ([\w.]+)/.exec(raw);
  if (m) return new QueryError(`null value in column "${m[1].split(".")[1]}" violates not-null constraint`, "23502");
  console.error("Learning API error:", raw);
  return new QueryError("Internal error", "XX000", 500);
}

/** Executor over a D1 binding. `batch` is atomic (one transaction). */
export function d1Executor(db) {
  return {
    async all(sql, params = []) {
      const r = await db.prepare(sql).bind(...params).all();
      return r.results ?? [];
    },
    async batch(stmts) {
      if (!stmts.length) return [];
      const res = await db.batch(stmts.map((s) => db.prepare(s.sql).bind(...s.params)));
      return res.map((r) => r.results ?? []);
    },
  };
}

/** Run statements in order; a statement with `then(rows)` yields follow-up statements. */
export async function runSequential(exec, stmts) {
  for (const s of stmts) {
    const rows = await exec.all(s.sql, s.params);
    if (s.then) await runSequential(exec, s.then(rows));
  }
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw new QueryError("Invalid JSON body.", "PGRST102");
  }
}
