// Compiles a query description sent by the browser client (src/lib/db.ts,
// .from().select().eq()... with PostgREST-style select/or() strings) into
// parameterised SQLite, with the table's access policy (policies.js) ANDed
// into every statement.
//
// Pure functions, no D1 / Worker APIs, so it is unit-testable under plain
// node against node:sqlite (query.test.mjs).
//
// Safety model: values are always bound parameters; identifiers (tables,
// columns, relations) are only ever taken from schema.js after an exact
// lookup, never interpolated from the request.

import { TABLES, tableDef, encodeValue } from "./schema.js";
import { policyFor, TRUE, FALSE } from "./policies.js";

export class QueryError extends Error {
  /** @param {string} message @param {string} [code] @param {number} [status] */
  constructor(message, code = "PGRST100", status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export const MAX_IN_VALUES = 1000;
const MAX_LOGIC_DEPTH = 8;
const MAX_LOGIC_LENGTH = 4000;
export const MAX_ROWS = 1000; // per request; callers page with range()

const q = (ident) => `"${ident}"`;

function requireTable(name) {
  const def = typeof name === "string" ? tableDef(name) : null;
  if (!def) throw new QueryError(`relation "${name}" does not exist`, "42P01", 404);
  return def;
}

function requireColumn(table, col) {
  const def = TABLES[table];
  if (typeof col !== "string" || !Object.prototype.hasOwnProperty.call(def.columns, col)) {
    throw new QueryError(`column ${table}.${col} does not exist`, "42703");
  }
  return def.columns[col];
}

// ------------------------------------------------------------------ select string

/**
 * Parse a PostgREST select string: `*`, `a,b`, `rel(a,b)`, `rel!inner(*)`.
 * @returns {Array<{kind:"star"}|{kind:"col",name:string}|{kind:"embed",rel:string,inner:boolean,children:any[]}>}
 */
export function parseSelect(str) {
  const src = String(str ?? "*").replace(/\s+/g, "");
  let i = 0;
  let depth = 0;
  function list() {
    if (++depth > 4) throw new QueryError("select embeds are nested too deeply");
    const items = [];
    while (i < src.length && src[i] !== ")") {
      let name = "";
      while (i < src.length && /[A-Za-z0-9_*!]/.test(src[i])) name += src[i++];
      if (!name) throw new QueryError(`invalid select near "${src.slice(i, i + 10)}"`);
      if (src[i] === "(") {
        i++;
        const children = list();
        if (src[i] !== ")") throw new QueryError("unbalanced parentheses in select");
        i++;
        depth--;
        const [rel, hint] = name.split("!");
        if (hint && hint !== "inner" && hint !== "left") throw new QueryError(`unsupported embed hint !${hint}`);
        items.push({ kind: "embed", rel, inner: hint === "inner", children });
      } else if (name === "*") {
        items.push({ kind: "star" });
      } else {
        if (name.includes("!") || name.includes("*")) throw new QueryError(`invalid column "${name}"`);
        items.push({ kind: "col", name });
      }
      if (src[i] === ",") i++;
    }
    return items;
  }
  const items = list();
  if (i !== src.length) throw new QueryError("invalid select string");
  return items.length ? items : [{ kind: "star" }];
}

/** Resolve an embedded relation from `parent` to `rel` via schema.js foreign keys. */
export function resolveRelation(parent, rel) {
  requireTable(rel);
  const pdef = TABLES[parent];
  const rdef = TABLES[rel];
  // to-one: parent has an FK column pointing at rel
  const toOne = Object.entries(pdef.fks ?? {}).filter(([, target]) => target.split(".")[0] === rel);
  if (toOne.length === 1) {
    const [col, target] = toOne[0];
    return { many: false, parentCol: col, relCol: target.split(".")[1] };
  }
  // to-many: rel has an FK column pointing at parent
  const toMany = Object.entries(rdef.fks ?? {}).filter(([, target]) => target.split(".")[0] === parent);
  if (toMany.length === 1) {
    const [col, target] = toMany[0];
    return { many: true, parentCol: target.split(".")[1], relCol: col };
  }
  throw new QueryError(`could not find a unique relationship between ${parent} and ${rel}`, "PGRST200");
}

// ------------------------------------------------------------------ or() strings

function splitTopLevel(s) {
  const parts = [];
  let depth = 0;
  let inQuote = false;
  let cur = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inQuote) {
      cur += ch;
      if (ch === "\\" && i + 1 < s.length) cur += s[++i];
      else if (ch === '"') inQuote = false;
      continue;
    }
    if (ch === '"') inQuote = true;
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      parts.push(cur);
      cur = "";
    } else cur += ch;
  }
  if (inQuote || depth !== 0) throw new QueryError("unbalanced or() filter");
  if (cur) parts.push(cur);
  return parts;
}

function unquote(v) {
  if (v.length >= 2 && v.startsWith('"') && v.endsWith('"')) {
    return v.slice(1, -1).replace(/\\(.)/g, "$1");
  }
  return v;
}

/**
 * Parse a PostgREST logic-tree string such as
 * `title.ilike."%x%",and(entity.eq.dua,entity_id.like.abc:*)`.
 * @returns {{op:"or"|"and", items:any[]}}
 */
export function parseLogic(str, op = "or", depth = 0) {
  if (depth > MAX_LOGIC_DEPTH) throw new QueryError("or() filter is nested too deeply");
  if (String(str).length > MAX_LOGIC_LENGTH) throw new QueryError("or() filter is too long");
  const items = splitTopLevel(String(str)).map((part) => {
    const m = /^(not\.)?(and|or)\((.*)\)$/s.exec(part);
    if (m) {
      const node = parseLogic(m[3], m[2], depth + 1);
      return m[1] ? { not: node } : node;
    }
    const firstDot = part.indexOf(".");
    if (firstDot < 0) throw new QueryError(`invalid filter "${part}"`);
    const column = part.slice(0, firstDot);
    let rest = part.slice(firstDot + 1);
    let negate = false;
    if (rest.startsWith("not.")) {
      negate = true;
      rest = rest.slice(4);
    }
    const dot = rest.indexOf(".");
    if (dot < 0) throw new QueryError(`invalid filter "${part}"`);
    const fop = rest.slice(0, dot);
    const raw = rest.slice(dot + 1);
    let value;
    if (fop === "in") {
      const inner = raw.replace(/^\(/, "").replace(/\)$/, "");
      value = inner === "" ? [] : splitTopLevel(inner).map(unquote);
    } else if (fop === "is") {
      value = raw === "null" ? null : raw === "true" ? true : raw === "false" ? false : raw;
    } else {
      value = unquote(raw);
      if (fop === "like" || fop === "ilike") value = value.replace(/\*/g, "%");
    }
    return { column, op: fop, value, negate };
  });
  return { op, items };
}

// ------------------------------------------------------------------ filters

const COMPARE = { eq: "=", neq: "<>", gt: ">", gte: ">=", lt: "<", lte: "<=" };

/**
 * Compile one leaf filter to SQL. `colExpr` is the qualified column; `type`
 * its schema type (for value encoding).
 */
function leafSql(colExpr, type, op, value, params) {
  if (op in COMPARE) {
    if (value === null || value === undefined) {
      if (op === "eq") return `${colExpr} IS NULL`;
      if (op === "neq") return `${colExpr} IS NOT NULL`;
    }
    params.push(encodeValue(type, value));
    return `${colExpr} ${COMPARE[op]} ?`;
  }
  if (op === "like" || op === "ilike") {
    params.push(String(value));
    // SQLite LIKE is case-insensitive for ASCII, like Postgres ILIKE.
    return `${colExpr} LIKE ? ESCAPE '\\'`;
  }
  if (op === "in") {
    const arr = Array.isArray(value) ? value : [value];
    if (!arr.length) return FALSE;
    if (arr.length > MAX_IN_VALUES) throw new QueryError(`in() accepts at most ${MAX_IN_VALUES} values`);
    // One JSON parameter instead of one per value: D1 caps bound parameters
    // per statement (100), and UI lists can be longer than that.
    params.push(JSON.stringify(arr.map((v) => encodeValue(type, v))));
    return `${colExpr} IN (SELECT value FROM json_each(?))`;
  }
  if (op === "is") {
    if (value === null || value === "null") return `${colExpr} IS NULL`;
    if (value === true || value === "true") return `${colExpr} = 1`;
    if (value === false || value === "false") return `${colExpr} = 0`;
    throw new QueryError(`invalid value for is: ${value}`);
  }
  throw new QueryError(`unsupported filter operator "${op}"`);
}

/**
 * Split filters into main-table filters and per-embed filters (`rel.col`).
 * Returns SQL for the main table plus a map rel -> [filters].
 */
function compileFilters(table, filters, params, colRef) {
  const where = [];
  const embedFilters = new Map();
  for (const f of filters ?? []) {
    if (f.type === "or") {
      if (f.foreignTable) throw new QueryError("or() on a foreign table is not supported");
      where.push(logicSql(table, parseLogic(f.expr), params, colRef));
      continue;
    }
    if (f.type !== "filter" && f.type !== "not") throw new QueryError("invalid filter");
    const column = String(f.column);
    if (column.includes(".")) {
      const [rel, col] = column.split(".");
      if (!embedFilters.has(rel)) embedFilters.set(rel, []);
      embedFilters.get(rel).push({ ...f, column: col });
      continue;
    }
    const type = requireColumn(table, column);
    const sql = leafSql(colRef(column), type, f.op, f.value, params);
    where.push(f.type === "not" ? `NOT (${sql})` : sql);
  }
  return { where, embedFilters };
}

function logicSql(table, node, params, colRef) {
  if (node.not) return `NOT (${logicSql(table, node.not, params, colRef)})`;
  if (node.op === "or" || node.op === "and") {
    const parts = node.items.map((it) => logicSql(table, it, params, colRef));
    return `(${parts.join(node.op === "or" ? " OR " : " AND ")})`;
  }
  const type = requireColumn(table, node.column);
  const sql = leafSql(colRef(node.column), type, node.op, node.value, params);
  return node.negate ? `NOT (${sql})` : sql;
}

// ------------------------------------------------------------------ policy helpers

function policy(table, kind) {
  const p = policyFor(table);
  if (!p) throw new QueryError(`permission denied for table ${table}`, "42501", 403);
  return kind === "update.using" ? p.update.using : kind === "update.check" ? p.update.check : p[kind];
}

/** A column resolver that validates names and qualifies them with `alias`. */
export function columnRef(table, alias) {
  return (col) => {
    requireColumn(table, col);
    return `${q(alias)}.${q(col)}`;
  };
}

/**
 * AND together SQL fragments. Never drops a fragment other than the literal
 * TRUE: fragments may hold bound parameters, and dropping one (e.g. short-
 * circuiting on a FALSE policy) would misalign the parameter list.
 */
function and(parts) {
  const p = parts.filter((x) => x && x !== TRUE);
  return p.length ? p.map((x) => `(${x})`).join(" AND ") : TRUE;
}

// ------------------------------------------------------------------ SELECT

let aliasCounter = 0;
const nextAlias = () => `t${++aliasCounter}`;

/** json_object(...) expression for an embedded row, recursing into nested embeds. */
function embedObjectSql(rel, alias, children, params, ctx) {
  const parts = [];
  for (const item of children) {
    if (item.kind === "star") {
      for (const col of Object.keys(TABLES[rel].columns)) parts.push(`'${col}', ${q(alias)}.${q(col)}`);
    } else if (item.kind === "col") {
      requireColumn(rel, item.name);
      parts.push(`'${item.name}', ${q(alias)}.${q(item.name)}`);
    } else {
      const sub = embedSql(rel, alias, item, [], params, ctx);
      parts.push(`'${item.rel}', json(${sub})`);
    }
  }
  return `json_object(${parts.join(", ")})`;
}

/** Scalar subquery producing a JSON object (to-one) or JSON array (to-many) for an embed. */
function embedSql(parent, parentAlias, item, filters, params, ctx) {
  const relInfo = resolveRelation(parent, item.rel);
  const alias = nextAlias();
  const ref = columnRef(item.rel, alias);
  // Params must be pushed in SQL text order: the json_object(...) (which may
  // hold nested embeds with filters) comes before this subquery's WHERE.
  const objParams = [];
  const obj = embedObjectSql(item.rel, alias, item.children, objParams, ctx);
  const whereParams = [];
  const where = [
    `${q(alias)}.${q(relInfo.relCol)} = ${q(parentAlias)}.${q(relInfo.parentCol)}`,
    policy(item.rel, "select")(ref, ctx),
  ];
  for (const f of filters) {
    const type = requireColumn(item.rel, f.column);
    const sql = leafSql(ref(f.column), type, f.op, f.value, whereParams);
    where.push(f.type === "not" ? `NOT (${sql})` : sql);
  }
  params.push(...objParams, ...whereParams);
  const from = `FROM ${q(item.rel)} ${q(alias)} WHERE ${and(where)}`;
  return relInfo.many
    ? `(SELECT coalesce(json_group_array(json(${obj})), '[]') ${from})`
    : `(SELECT ${obj} ${from} LIMIT 1)`;
}

/** EXISTS(...) for a `rel!inner(...)` embed, carrying its filters. */
function innerExistsSql(parent, item, filters, params, ctx) {
  const relInfo = resolveRelation(parent, item.rel);
  const alias = nextAlias();
  const ref = columnRef(item.rel, alias);
  const where = [
    `${q(alias)}.${q(relInfo.relCol)} = ${q(parent)}.${q(relInfo.parentCol)}`,
    policy(item.rel, "select")(ref, ctx),
  ];
  for (const f of filters) {
    const type = requireColumn(item.rel, f.column);
    const sql = leafSql(ref(f.column), type, f.op, f.value, params);
    where.push(f.type === "not" ? `NOT (${sql})` : sql);
  }
  return `EXISTS (SELECT 1 FROM ${q(item.rel)} ${q(alias)} WHERE ${and(where)})`;
}

/**
 * @returns {{ sql: string, params: any[], countSql: string|null, countParams: any[], embeds: Array<{name:string, rel:string, many:boolean}> }}
 */
export function compileSelect(req, ctx) {
  const table = req.table;
  requireTable(table);
  aliasCounter = 0;
  const items = parseSelect(req.select ?? "*");
  const ref = columnRef(table, table);

  // WHERE (filters + policy) — params for it are collected separately so
  // the same WHERE can be reused for the count query.
  const whereParams = [];
  const { where, embedFilters } = compileFilters(table, req.filters, whereParams, ref);
  where.push(policy(table, "select")(ref, ctx));

  const embedItems = items.filter((i) => i.kind === "embed");
  for (const rel of embedFilters.keys()) {
    if (!embedItems.some((e) => e.rel === rel)) {
      throw new QueryError(`filter on "${rel}" needs "${rel}" in the select list`);
    }
  }
  for (const e of embedItems) {
    if (e.inner) where.push(innerExistsSql(table, e, embedFilters.get(e.rel) ?? [], whereParams, ctx));
  }
  const whereSql = and(where);

  // SELECT list
  const selectParams = [];
  const cols = [];
  const embeds = [];
  for (const item of items) {
    if (item.kind === "star") cols.push(`${q(table)}.*`);
    else if (item.kind === "col") cols.push(ref(item.name));
    else {
      cols.push(`${embedSql(table, table, item, embedFilters.get(item.rel) ?? [], selectParams, ctx)} AS ${q(item.rel)}`);
      embeds.push({ name: item.rel, rel: item.rel, many: resolveRelation(table, item.rel).many, children: item.children });
    }
  }

  // ORDER BY — Postgres defaults: ASC NULLS LAST, DESC NULLS FIRST
  const order = [];
  for (const o of req.order ?? []) {
    if (o.foreignTable) throw new QueryError("ordering by a foreign table is not supported");
    const asc = o.ascending !== false;
    const nullsFirst = o.nullsFirst ?? !asc;
    order.push(`${ref(o.column)} ${asc ? "ASC" : "DESC"} NULLS ${nullsFirst ? "FIRST" : "LAST"}`);
  }

  let limit = MAX_ROWS;
  if (req.limit !== undefined && req.limit !== null) {
    if (!Number.isInteger(req.limit) || req.limit < 0) throw new QueryError("invalid limit");
    limit = Math.min(req.limit, MAX_ROWS);
  }
  let offset = 0;
  if (req.offset !== undefined && req.offset !== null) {
    if (!Number.isInteger(req.offset) || req.offset < 0) throw new QueryError("invalid offset");
    offset = req.offset;
  }

  const sql =
    `SELECT ${cols.join(", ")} FROM ${q(table)} WHERE ${whereSql}` +
    (order.length ? ` ORDER BY ${order.join(", ")}` : "") +
    ` LIMIT ${limit} OFFSET ${offset}`;

  return {
    sql,
    params: [...selectParams, ...whereParams],
    countSql: req.count ? `SELECT count(*) AS n FROM ${q(table)} WHERE ${whereSql}` : null,
    countParams: whereParams,
    embeds,
  };
}

/** Decode a selected row, including JSON embeds, into API values. */
export function decodeSelected(table, row, embeds) {
  const def = TABLES[table];
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    const embed = embeds.find((e) => e.name === k);
    if (embed) {
      const parsed = v === null || v === undefined ? (embed.many ? [] : null) : typeof v === "string" ? JSON.parse(v) : v;
      out[k] = decodeEmbedded(embed.rel, parsed, embed.children);
    } else {
      const type = def.columns[k];
      out[k] = type ? decodeTyped(type, v) : v;
    }
  }
  return out;
}

function decodeTyped(type, v) {
  if (v === null || v === undefined) return null;
  if (type === "bool") return v === 1 || v === true;
  if (type === "json") {
    if (typeof v !== "string") return v;
    try {
      return JSON.parse(v);
    } catch {
      return v;
    }
  }
  return v;
}

function decodeEmbedded(rel, value, children) {
  if (value === null) return null;
  if (Array.isArray(value)) return value.map((r) => decodeEmbedded(rel, r, children));
  const def = TABLES[rel];
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    const child = children.find((c) => c.kind === "embed" && c.rel === k);
    if (child) out[k] = decodeEmbedded(child.rel, v, child.children);
    else out[k] = def.columns[k] ? decodeTyped(def.columns[k], v) : v;
  }
  return out;
}

/** Project full rows (RETURNING *) to the columns a write's .select() asked for. */
export function projectRows(table, rows, selectStr) {
  const items = parseSelect(selectStr ?? "*");
  if (items.some((i) => i.kind === "embed")) throw new QueryError("embedding is not supported in a write's select()");
  if (items.some((i) => i.kind === "star")) return rows;
  const cols = items.map((i) => {
    requireColumn(table, i.name);
    return i.name;
  });
  return rows.map((r) => Object.fromEntries(cols.map((c) => [c, r[c] ?? null])));
}

// ------------------------------------------------------------------ writes

/**
 * Normalise write values: validate column names, drop derived/insert-only
 * columns, reject read-only ones, encode by type.
 * @param {"insert"|"update"} mode
 * @returns {Record<string, any>} column -> encoded value
 */
export function cleanValues(table, values, mode) {
  if (!values || typeof values !== "object" || Array.isArray(values)) throw new QueryError("invalid row values");
  const def = TABLES[table];
  const out = {};
  for (const [col, v] of Object.entries(values)) {
    if (v === undefined) continue;
    const type = requireColumn(table, col);
    if (def.derived?.includes(col)) continue;
    if (mode === "update" && def.insertOnly?.includes(col)) continue;
    if (mode === "update" && def.readOnly?.includes(col)) {
      throw new QueryError(`column "${col}" of "${table}" cannot be changed`, "42501", 403);
    }
    out[col] = encodeValue(type, v);
  }
  return out;
}

/**
 * The NEW row as a one-row derived table `_new`, so policy predicates only
 * ever reference columns (never bound parameters of their own) — a policy
 * that short-circuits can then drop fragments without misaligning params.
 * @returns {{ from: string, params: any[], ref: (col: string) => string }}
 */
function newRowTable(table, row, colsFor = Object.keys(row)) {
  const cols = colsFor.filter((c) => Object.prototype.hasOwnProperty.call(row, c));
  return {
    from: cols.length ? `(SELECT ${cols.map((c) => `? AS ${q(c)}`).join(", ")}) AS _new` : "(SELECT 1) AS _new",
    params: cols.map((c) => row[c]),
    has: (col) => cols.includes(col),
  };
}

/** SQL + params that evaluate the insert policy against one new row (1 = allowed). */
export function compileInsertCheck(table, row, ctx) {
  requireTable(table);
  const n = newRowTable(table, row);
  const pred = policy(table, "insert")((col) => {
    requireColumn(table, col);
    return n.has(col) ? `_new.${q(col)}` : "NULL";
  }, ctx);
  return { sql: `SELECT (${pred}) AS ok FROM ${n.from}`, params: n.params };
}

/**
 * One INSERT per row (run as one D1 batch). `row` is already cleaned and
 * includes any generated id / hook-derived columns.
 */
export function compileInsert(table, row, { onConflict, ignoreDuplicates } = {}, ctx) {
  const def = requireTable(table);
  const cols = Object.keys(row);
  if (!cols.length) throw new QueryError("empty insert");
  const params = cols.map((c) => row[c]);
  let sql = `INSERT INTO ${q(table)} (${cols.map(q).join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`;
  if (onConflict !== undefined) {
    const conflictCols = (onConflict ? String(onConflict).split(",").map((s) => s.trim()) : def.pk).filter(Boolean);
    conflictCols.forEach((c) => requireColumn(table, c));
    const setCols = cols.filter((c) => !conflictCols.includes(c) && !def.pk.includes(c) && !def.insertOnly?.includes(c));
    if (ignoreDuplicates || !setCols.length) {
      sql += ` ON CONFLICT (${conflictCols.map(q).join(", ")}) DO NOTHING`;
    } else {
      const ref = columnRef(table, table);
      const using = policy(table, "update.using")(ref, ctx);
      sql +=
        ` ON CONFLICT (${conflictCols.map(q).join(", ")}) DO UPDATE SET ` +
        setCols.map((c) => `${q(c)} = excluded.${q(c)}`).join(", ") +
        ` WHERE ${using}`;
    }
  }
  return { sql: `${sql} RETURNING *`, params };
}

/** WHERE for UPDATE/DELETE (filters only on the table itself) + params. */
function writeWhere(table, filters, extra) {
  const params = [];
  const ref = columnRef(table, table);
  const { where, embedFilters } = compileFilters(table, filters, params, ref);
  if (embedFilters.size) throw new QueryError("filters on embedded tables are not allowed in writes");
  return { where: and([...where, ...extra.map((fn) => fn(ref))]), params };
}

/**
 * @param {Record<string, any>} values cleaned values
 * @param {Array<{col:string, sql:string, params:any[]}>} extraSets hook-derived SET expressions
 */
export function compileUpdate(table, values, extraSets, filters, ctx) {
  requireTable(table);
  const setCols = Object.keys(values);
  if (!setCols.length && !extraSets.length) throw new QueryError("empty update");
  const using = policy(table, "update.using");
  const check = policy(table, "update.check");

  // Violations: rows this update would touch whose post-update state fails
  // WITH CHECK. New values come from the derived table _new (see newRowTable).
  const n = newRowTable(table, values);
  const vWhere = writeWhere(table, filters, [(ref) => using(ref, ctx)]);
  const checkSql = check((col) => {
    requireColumn(table, col);
    return n.has(col) ? `_new.${q(col)}` : `${q(table)}.${q(col)}`;
  }, ctx);
  const violation = {
    sql: `SELECT count(*) AS n FROM ${q(table)}, ${n.from} WHERE ${vWhere.where} AND NOT (${checkSql})`,
    params: [...n.params, ...vWhere.params],
  };

  const w = writeWhere(table, filters, [(ref) => using(ref, ctx)]);
  const sets = [...setCols.map((c) => `${q(c)} = ?`), ...extraSets.map((s) => `${q(s.col)} = ${s.sql}`)];
  const setParams = [...setCols.map((c) => values[c]), ...extraSets.flatMap((s) => s.params)];
  return {
    violation,
    sql: `UPDATE ${q(table)} SET ${sets.join(", ")} WHERE ${w.where} RETURNING *`,
    params: [...setParams, ...w.params],
  };
}

export function compileDelete(table, filters, ctx) {
  requireTable(table);
  const del = policy(table, "delete");
  const w = writeWhere(table, filters, [(ref) => del(ref, ctx)]);
  return { sql: `DELETE FROM ${q(table)} WHERE ${w.where} RETURNING *`, params: w.params };
}

/** Rows an UPDATE/DELETE is about to touch (for the audit log's old_data). */
export function compileAffectedRows(table, filters, kind, ctx) {
  const pred = policy(table, kind === "update" ? "update.using" : "delete");
  const w = writeWhere(table, filters, [(ref) => pred(ref, ctx)]);
  return { sql: `SELECT * FROM ${q(table)} WHERE ${w.where}`, params: w.params };
}
