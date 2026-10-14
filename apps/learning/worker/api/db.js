// POST /learning/api/db — executes one query description from src/lib/db.ts.
// Pipeline: compile (query.js) + access policy (policies.js) + write hooks (hooks.js).

import {
  QueryError,
  compileSelect,
  decodeSelected,
  projectRows,
  cleanValues,
  compileInsertCheck,
  compileInsert,
  compileUpdate,
  compileDelete,
  compileAffectedRows,
} from "./query.js";
import { TABLES, tableDef, decodeRow } from "./schema.js";
import { beforeInsert, beforeUpdate, auditStatements, afterInsertStatements, isAudited } from "./hooks.js";
import { runSequential, toApiError } from "./http.js";

const rlsError = (table) =>
  new QueryError(`new row violates row-level security policy for table "${table}"`, "42501", 403);

/**
 * @param {any} req   query description
 * @param {{uid:string, role:string, isAdmin:boolean}} ctx
 * @param {ReturnType<import("./http.js").d1Executor>} exec
 * @returns {Promise<{data:any, count:number|null}>}
 */
export async function runQuery(req, ctx, exec) {
  if (!req || typeof req !== "object") throw new QueryError("invalid query");
  const table = req.table;
  if (!tableDef(table)) throw new QueryError(`relation "${table}" does not exist`, "42P01", 404);
  try {
    switch (req.action) {
      case "select":
        return await runSelect(req, ctx, exec);
      case "insert":
      case "upsert":
        return await runInsert(req, ctx, exec);
      case "update":
        return await runUpdate(req, ctx, exec);
      case "delete":
        return await runDelete(req, ctx, exec);
      default:
        throw new QueryError(`unknown action "${req.action}"`);
    }
  } catch (e) {
    throw toApiError(e, table);
  }
}

async function runSelect(req, ctx, exec) {
  const c = compileSelect(req, ctx);
  const count = c.countSql ? Number((await exec.all(c.countSql, c.countParams))[0]?.n ?? 0) : null;
  if (req.head) return { data: null, count };
  const rows = await exec.all(c.sql, c.params);
  return { data: rows.map((r) => decodeSelected(req.table, r, c.embeds)), count };
}

const wantsReturn = (req) => req.select !== undefined && req.select !== null;

async function runInsert(req, ctx, exec) {
  const { table } = req;
  const def = TABLES[table];
  const list = Array.isArray(req.values) ? req.values : [req.values];
  if (!list.length) return { data: wantsReturn(req) ? [] : null, count: null };

  const rows = list.map((v) => {
    const row = cleanValues(table, v, "insert");
    if (def.generatedId && row.id === undefined) row.id = crypto.randomUUID();
    return beforeInsert(table, row, ctx);
  });

  // WITH CHECK, evaluated against each new row before anything is written.
  for (const row of rows) {
    const chk = compileInsertCheck(table, row, ctx);
    const [r] = await exec.all(chk.sql, chk.params);
    if (!r || Number(r.ok) !== 1) throw rlsError(table);
  }

  const opts = req.action === "upsert" ? { onConflict: req.onConflict ?? "", ignoreDuplicates: !!req.ignoreDuplicates } : {};
  const results = await exec.batch(rows.map((row) => compileInsert(table, row, opts, ctx)));
  const written = results.flat();

  await runSequential(exec, [...auditStatements(table, "insert", [], written, ctx), ...afterInsertStatements(table, written)]);
  return { data: wantsReturn(req) ? projectRows(table, written.map((r) => decodeRow(table, r)), req.select) : null, count: null };
}

async function runUpdate(req, ctx, exec) {
  const { table } = req;
  const values = cleanValues(table, req.values, "update");
  const extra = beforeUpdate(table, values, ctx);
  const c = compileUpdate(table, values, extra, req.filters, ctx);

  const [v] = await exec.all(c.violation.sql, c.violation.params);
  if (Number(v?.n ?? 0) > 0) throw rlsError(table);

  let before = [];
  if (isAudited(table)) {
    const a = compileAffectedRows(table, req.filters, "update", ctx);
    before = await exec.all(a.sql, a.params);
  }
  const written = await exec.all(c.sql, c.params);
  await runSequential(exec, auditStatements(table, "update", before, written, ctx));
  return { data: wantsReturn(req) ? projectRows(table, written.map((r) => decodeRow(table, r)), req.select) : null, count: null };
}

async function runDelete(req, ctx, exec) {
  const { table } = req;
  const c = compileDelete(table, req.filters, ctx);
  const deleted = await exec.all(c.sql, c.params);
  await runSequential(exec, auditStatements(table, "delete", deleted, [], ctx));
  return { data: wantsReturn(req) ? projectRows(table, deleted.map((r) => decodeRow(table, r)), req.select) : null, count: null };
}
