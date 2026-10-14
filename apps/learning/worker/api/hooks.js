// Per-table write hooks (D1 has no triggers we use, so they live here):
//   duas / dua_categories / dua_category_map -> bookkeeping columns,
//        arabic_normalized, published_at, and the regex CHECKs SQLite can't express
//   the same three tables                    -> dua_audit_log rows (auditStatements)
//   class_lesson_plans / class_members insert -> student progress seeding
//   users.role is never writable here         -> schema.js readOnly; rpc.js set_user_role

import { normalizeArabic, hasArabic } from "../../src/lib/duas/validate.ts";
import { QueryError } from "./query.js";
import { decodeRow } from "./schema.js";
import { USERNAME_RE } from "./auth.js";

export const nowIso = () => new Date().toISOString();

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function checkFailed(table, constraint) {
  return new QueryError(`new row for relation "${table}" violates check constraint "${constraint}"`, "23514");
}

function validateDua(row) {
  if ("slug" in row && (typeof row.slug !== "string" || !SLUG_RE.test(row.slug))) throw checkFailed("duas", "duas_slug_check");
  if ("arabic" in row && row.arabic && !hasArabic(row.arabic)) throw checkFailed("duas", "duas_arabic_is_arabic");
  if ("audio_url" in row && row.audio_url !== null && !/^https:\/\//.test(String(row.audio_url))) {
    throw checkFailed("duas", "duas_audio_url_check");
  }
  if ("quran_refs" in row) {
    let refs = row.quran_refs;
    try {
      refs = typeof refs === "string" ? JSON.parse(refs) : refs;
    } catch {
      refs = null;
    }
    if (!Array.isArray(refs)) throw checkFailed("duas", "duas_quran_refs_check");
  }
}

/**
 * Mutates and returns the (cleaned, encoded) insert row.
 * @param {{uid:string}} ctx
 */
export function beforeInsert(table, row, ctx) {
  const now = nowIso();
  if (table === "duas") {
    validateDua(row);
    row.updated_at = now;
    row.updated_by = ctx.uid;
    row.created_by = row.created_by ?? ctx.uid;
    row.arabic_normalized = normalizeArabic(row.arabic ?? "");
    row.published_at = row.status === "published" ? now : null;
  } else if (table === "dua_categories") {
    if ("slug" in row && (typeof row.slug !== "string" || !SLUG_RE.test(row.slug))) {
      throw checkFailed("dua_categories", "dua_categories_slug_check");
    }
    row.updated_at = now;
    row.updated_by = ctx.uid;
    row.created_by = row.created_by ?? ctx.uid;
  } else if (table === "dua_category_map") {
    row.updated_at = now;
  }
  return row;
}

/**
 * @returns {Array<{col:string, sql:string, params:any[]}>} extra SET expressions
 */
export function beforeUpdate(table, values, ctx) {
  const now = nowIso();
  const extra = [];
  if (table === "users") {
    if ("username" in values && (typeof values.username !== "string" || !USERNAME_RE.test(values.username))) {
      throw new QueryError("Username may only contain letters, numbers, dots, dashes and underscores.", "23514");
    }
    if ("full_name" in values && (typeof values.full_name !== "string" || !values.full_name.trim() || values.full_name.length > 200)) {
      throw new QueryError("Name is required (at most 200 characters).", "23514");
    }
  }
  if (table === "duas") {
    validateDua(values);
    extra.push({ col: "updated_at", sql: "?", params: [now] });
    extra.push({ col: "updated_by", sql: "?", params: [ctx.uid] });
    if ("arabic" in values) extra.push({ col: "arabic_normalized", sql: "?", params: [normalizeArabic(values.arabic ?? "")] });
    if (values.status === "published") {
      // published_at := now() only on the transition into 'published'
      extra.push({ col: "published_at", sql: `CASE WHEN "duas"."status" <> 'published' THEN ? ELSE "duas"."published_at" END`, params: [now] });
    }
  } else if (table === "dua_categories") {
    if ("slug" in values && (typeof values.slug !== "string" || !SLUG_RE.test(values.slug))) {
      throw checkFailed("dua_categories", "dua_categories_slug_check");
    }
    extra.push({ col: "updated_at", sql: "?", params: [now] });
    extra.push({ col: "updated_by", sql: "?", params: [ctx.uid] });
  } else if (table === "dua_category_map") {
    extra.push({ col: "updated_at", sql: "?", params: [now] });
  }
  return extra;
}

// ------------------------------------------------------------------ audit (was public.dua_audit())

const AUDITED = { duas: "dua", dua_categories: "category", dua_category_map: "mapping" };
const AUDIT_IGNORED = new Set(["updated_at", "updated_by", "arabic_normalized"]);

export const isAudited = (table) => Object.prototype.hasOwnProperty.call(AUDITED, table);

const entityId = (table, row) => (table === "dua_category_map" ? `${row.dua_id}:${row.category_id}` : row.id);
const pkKey = (table, row) => entityId(table, row);

/**
 * Audit statements for one write. Rows are raw SQLite rows (RETURNING * / SELECT *).
 * @param {"insert"|"update"|"delete"} action
 */
export function auditStatements(table, action, oldRows, newRows, ctx) {
  if (!isAudited(table)) return [];
  const entity = AUDITED[table];
  const stmts = [];
  const insert = (eid, act, oldJ, newJ, changed) =>
    stmts.push({
      sql: `INSERT INTO dua_audit_log (entity, entity_id, action, old_data, new_data, changed_fields, changed_by) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      params: [entity, eid, act, oldJ ? JSON.stringify(oldJ) : null, newJ ? JSON.stringify(newJ) : null, JSON.stringify(changed), ctx.uid],
    });

  if (action === "insert") {
    for (const r of newRows) insert(entityId(table, r), "insert", null, decodeRow(table, r), []);
  } else if (action === "delete") {
    for (const r of oldRows) insert(entityId(table, r), "delete", decodeRow(table, r), null, []);
  } else {
    const before = new Map(oldRows.map((r) => [pkKey(table, r), decodeRow(table, r)]));
    for (const raw of newRows) {
      const n = decodeRow(table, raw);
      const o = before.get(pkKey(table, raw));
      if (!o) continue;
      const changed = Object.keys(n)
        .filter((k) => !AUDIT_IGNORED.has(k) && JSON.stringify(n[k]) !== JSON.stringify(o[k]))
        .sort();
      if (!changed.length) continue; // nothing but bookkeeping columns changed
      insert(entityId(table, raw), "update", o, n, changed);
    }
  }
  return stmts;
}

// ------------------------------------------------------------------ progress seeding

/**
 * Seeds student_lesson_progress at the plan's first active item for the
 * class's students (one student when studentId is given). Was
 * public.seed_student_lesson_progress(); idempotent. A two-step statement:
 * the SELECT's rows feed `then`, which returns the INSERTs.
 */
export function seedProgressStatement(classId, lessonPlanId, studentId = null) {
  return {
    sql: `SELECT cm.student_id AS student_id,
                 (SELECT i.id FROM lesson_plan_items i WHERE i.lesson_plan_id = ? AND i.active = 1 ORDER BY i.sequence LIMIT 1) AS item_id
          FROM class_members cm
          WHERE cm.class_id = ? AND (? IS NULL OR cm.student_id = ?)`,
    params: [lessonPlanId, classId, studentId, studentId],
    then: (rows) =>
      rows
        .filter((r) => r.item_id)
        .map((r) => ({
          sql: `INSERT INTO student_lesson_progress (id, student_id, lesson_plan_id, current_item_id, status)
                VALUES (?, ?, ?, ?, 'not_started') ON CONFLICT (student_id, lesson_plan_id) DO NOTHING`,
          params: [crypto.randomUUID(), r.student_id, lessonPlanId, r.item_id],
        })),
  };
}

/** Follow-up statements after a successful insert (was AFTER INSERT triggers). */
export function afterInsertStatements(table, newRows) {
  const stmts = [];
  if (table === "class_lesson_plans") {
    for (const r of newRows) stmts.push(seedProgressStatement(r.class_id, r.lesson_plan_id));
  } else if (table === "class_members") {
    for (const r of newRows) {
      stmts.push({
        sql: `SELECT lesson_plan_id FROM class_lesson_plans WHERE class_id = ?`,
        params: [r.class_id],
        then: (rows) => (rows[0] ? [seedProgressStatement(r.class_id, rows[0].lesson_plan_id, r.student_id)] : []),
      });
    }
  }
  return stmts;
}
