// Turns content/duas-wyn/catalog.json (the reviewed Wa Iyyaka Nastaeen mapping) into
// idempotent D1 SQL. Safety rules, enforced here and tested in sync.test.mjs:
//   - a `published` Dua is never modified, except by an explicit, value-guarded
//     correction (opt-in: withCorrections) or by the owner's approved-slugs list (publish);
//   - new Duas are inserted as status 'review' (never published) and are never overwritten
//     on a re-run, so an admin's edits in the review queue survive;
//   - WYN stub drafts are filled only while still 'draft', then move to 'review';
//   - every change also writes a dua_audit_log row (changed_by = AUDIT_ACTOR), like the Worker hooks.
// No BEGIN/COMMIT: `wrangler d1 execute --file` runs the file as one batch.
import { createHash } from "node:crypto";
import { normalizeArabic, validateDua } from "../../src/lib/duas/validate.ts";

export const AUDIT_ACTOR = "script:duas-wyn-sync";
/** Categories not in the WYN set keep their relative order, shifted after it. */
export const OTHER_CATEGORY_OFFSET = 1000;
/** Pre-existing Duas in a WYN category that WYN does not list are kept, after WYN's sequence. */
export const EXTRA_MAPPING_OFFSET = 1000;

const DUA_TEXT_COLS = [
  "title", "title_ur", "arabic", "transliteration_latin", "transliteration_telugu", "transliteration_urdu",
  "translation_en", "translation_ur", "description", "repeat_count", "source_type", "source_collection",
  "source_reference", "hadith_number", "hadith_grade", "quran_refs", "verification_status", "review_notes", "wyn_ids",
];
const CORRECTABLE = new Set(DUA_TEXT_COLS.filter((c) => !["verification_status", "review_notes", "wyn_ids"].includes(c)));

/** Deterministic UUID (v5-style) so local and remote D1 get the same id for the same slug. */
export function stableId(kind, slug) {
  const h = createHash("sha1").update(`iqraspace:${kind}:${slug}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${((parseInt(h[16], 16) & 3) | 8).toString(16)}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

export const lit = (v) => {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NULL";
  if (typeof v === "boolean") return v ? "1" : "0";
  return `'${String(v).replace(/'/g, "''")}'`;
};

/** D1 rejects a statement over 100 KB; text values longer than this many UTF-8 bytes are appended in pieces. */
export const CHUNK_BYTES = 12_000;
export const D1_MAX_STATEMENT_BYTES = 100_000;

function chunkText(s) {
  const parts = [];
  let cur = "";
  let bytes = 0;
  for (const ch of s) {
    const b = Buffer.byteLength(ch);
    if (bytes + b > CHUNK_BYTES) {
      parts.push(cur);
      cur = "";
      bytes = 0;
    }
    cur += ch;
    bytes += b;
  }
  parts.push(cur);
  return parts;
}

const encode = (col, v) => (col === "quran_refs" || col === "wyn_ids" ? JSON.stringify(v ?? []) : v ?? null);
const jsonObj = (cols) => `json_object(${cols.map((c) => `'${c}', ${c}`).join(", ")})`;
const AUDIT = "INSERT INTO dua_audit_log (entity, entity_id, action, old_data, new_data, changed_fields, changed_by)";

/** Validate the catalog; returns { errors, warnings } (errors block SQL generation). */
export function checkCatalog(cat) {
  const errors = [];
  const warnings = [];
  const slugs = new Set();
  const norm = new Map();
  for (const d of cat.duas) {
    if (slugs.has(d.slug)) errors.push(`duplicate dua slug ${d.slug}`);
    slugs.add(d.slug);
    if (d.mode === "reuse") continue;
    const v = validateDua(d, { status: "review" });
    for (const e of v.errors) errors.push(`${d.slug}: ${e}`);
    for (const w of v.warnings) warnings.push(`${d.slug}: ${w}`);
    const n = normalizeArabic(d.arabic);
    if (norm.has(n)) errors.push(`${d.slug}: same Arabic as ${norm.get(n)}`);
    norm.set(n, d.slug);
  }
  const catSlugs = new Set(cat.categories.map((c) => c.slug));
  const seen = new Set();
  for (const p of cat.placements) {
    if (!catSlugs.has(p.category)) errors.push(`placement → unknown category ${p.category}`);
    if (!slugs.has(p.dua)) errors.push(`placement → dua ${p.dua} not in catalog`);
    const k = `${p.category}/${p.dua}`;
    if (seen.has(k)) errors.push(`dua ${p.dua} placed twice in ${p.category}`);
    seen.add(k);
  }
  for (const c of cat.corrections ?? []) {
    if (!CORRECTABLE.has(c.field)) errors.push(`correction ${c.dua}.${c.field}: field not correctable`);
    if (!slugs.has(c.dua)) errors.push(`correction → dua ${c.dua} not in catalog`);
  }
  return { errors, warnings };
}

/**
 * @param {object} cat parsed catalog.json
 * @param {{ now?: string, withCorrections?: boolean, publish?: string[] }} opts
 * @returns {string[]} SQL statements
 */
export function buildSql(cat, opts = {}) {
  const { errors } = checkCatalog(cat);
  if (errors.length) throw new Error(`catalog has ${errors.length} error(s):\n` + errors.slice(0, 20).join("\n"));
  const now = opts.now ?? new Date().toISOString();
  const out = [];
  const actor = lit(AUDIT_ACTOR);

  // 1. WYN categories: upsert by slug (WYN name/order; keep an existing description unless ours is empty).
  const catCols = ["slug", "name", "name_ur", "name_te", "description", "description_ur", "description_te", "sort_order", "is_active"];
  for (const c of cat.categories) {
    const id = stableId("dua_category", c.slug);
    out.push(
      `${AUDIT} SELECT 'category', id, 'update', ${jsonObj(catCols)}, json_object('name', ${lit(c.name)}, 'name_ur', ${lit(c.name_ur)}, 'name_te', ${lit(c.name_te)}, 'sort_order', ${c.sort_order}), '["name","name_te","name_ur","sort_order"]', ${actor} FROM dua_categories WHERE slug = ${lit(c.slug)} AND (name IS NOT ${lit(c.name)} OR name_ur IS NOT ${lit(c.name_ur)} OR name_te IS NOT ${lit(c.name_te)} OR sort_order <> ${c.sort_order});`,
      `${AUDIT} SELECT 'category', ${lit(id)}, 'insert', NULL, json_object('slug', ${lit(c.slug)}, 'name', ${lit(c.name)}, 'sort_order', ${c.sort_order}), '[]', ${actor} WHERE NOT EXISTS (SELECT 1 FROM dua_categories WHERE slug = ${lit(c.slug)});`,
      `INSERT INTO dua_categories (id, slug, name, name_ur, name_te, description, description_ur, description_te, sort_order, is_active, created_at, updated_at)
VALUES (${lit(id)}, ${lit(c.slug)}, ${lit(c.name)}, ${lit(c.name_ur)}, ${lit(c.name_te)}, ${lit(c.description ?? "")}, ${lit(c.description_ur)}, ${lit(c.description_te)}, ${c.sort_order}, 1, ${lit(now)}, ${lit(now)})
ON CONFLICT(slug) DO UPDATE SET name = excluded.name, name_ur = excluded.name_ur, name_te = excluded.name_te,
  description = CASE WHEN trim(dua_categories.description) = '' THEN excluded.description ELSE dua_categories.description END,
  description_ur = coalesce(dua_categories.description_ur, excluded.description_ur),
  description_te = coalesce(dua_categories.description_te, excluded.description_te),
  sort_order = excluded.sort_order, is_active = 1, updated_at = excluded.updated_at
WHERE dua_categories.name IS NOT excluded.name OR dua_categories.name_ur IS NOT excluded.name_ur OR dua_categories.name_te IS NOT excluded.name_te
   OR dua_categories.sort_order <> excluded.sort_order OR dua_categories.is_active <> 1;`
    );
  }
  // 2. Every other category keeps its relative order, after the WYN set.
  const wynCats = cat.categories.map((c) => lit(c.slug)).join(", ");
  out.push(
    `UPDATE dua_categories SET sort_order = sort_order + ${OTHER_CATEGORY_OFFSET}, updated_at = ${lit(now)} WHERE slug NOT IN (${wynCats}) AND sort_order < ${OTHER_CATEGORY_OFFSET};`
  );

  // 3. Duas. Long texts (whole Surahs) are written in chunks: D1 rejects statements over 100 KB.
  // Follow-up appends only touch a row this run just wrote (updated_at = this run's timestamp).
  const rowJson = jsonObj(["id", "slug", ...DUA_TEXT_COLS, "status", "origin"]);
  for (const d of cat.duas) {
    if (d.mode === "reuse") continue;
    const vals = Object.fromEntries(DUA_TEXT_COLS.map((c) => [c, encode(c, d[c])]));
    vals.arabic_normalized = normalizeArabic(d.arabic);
    const first = {};
    const rest = [];
    for (const [c, v] of Object.entries(vals)) {
      const parts = typeof v === "string" ? chunkText(v) : [v];
      first[c] = parts[0];
      for (const p of parts.slice(1)) rest.push([c, p]);
    }
    const justWritten = `slug = ${lit(d.slug)} AND status = 'review' AND updated_at = ${lit(now)}`;
    const appends = rest.map(([c, p]) => `UPDATE duas SET ${c} = ${c} || ${lit(p)} WHERE ${justWritten};`);
    if (d.mode === "insert") {
      const id = stableId("dua", d.slug);
      const cols = ["id", "slug", ...Object.keys(first), "status", "origin", "sort_order", "created_at", "updated_at"];
      const v = [id, d.slug, ...Object.values(first), "review", d.origin ?? "wyn_public_pdf", d.sort_order ?? 0, now, now];
      out.push(
        `INSERT INTO duas (${cols.join(", ")}) VALUES (${v.map(lit).join(", ")}) ON CONFLICT(slug) DO NOTHING;`,
        ...appends,
        `${AUDIT} SELECT 'dua', id, 'insert', NULL, ${rowJson}, '[]', ${actor} FROM duas WHERE ${justWritten} AND created_at = ${lit(now)}
  AND NOT EXISTS (SELECT 1 FROM dua_audit_log a WHERE a.entity = 'dua' AND a.entity_id = duas.id AND a.action = 'insert');`
      );
    } else if (d.mode === "fill") {
      // Only a still-untouched WYN stub (status 'draft') is filled; it then enters the review queue.
      const guard = `slug = ${lit(d.slug)} AND status = 'draft'`;
      const set = Object.entries(first).map(([c, v]) => `${c} = ${lit(v)}`);
      out.push(
        `${AUDIT} SELECT 'dua', id, 'update', ${jsonObj([...DUA_TEXT_COLS, "status"])}, NULL, ${lit(JSON.stringify([...DUA_TEXT_COLS, "status"].sort()))}, ${actor} FROM duas WHERE ${guard};`,
        `UPDATE duas SET ${set.join(", ")}, status = 'review', updated_at = ${lit(now)}, updated_by = NULL WHERE ${guard};`,
        ...appends,
        `UPDATE dua_audit_log SET new_data = (SELECT ${rowJson} FROM duas WHERE duas.id = dua_audit_log.entity_id)
WHERE entity = 'dua' AND action = 'update' AND new_data IS NULL AND changed_by = ${actor} AND entity_id = (SELECT id FROM duas WHERE ${justWritten});`
      );
    }
  }

  // 4. Category placements (WYN order and per-category counts).
  const byCat = new Map();
  for (const p of cat.placements) {
    if (!byCat.has(p.category)) byCat.set(p.category, []);
    byCat.get(p.category).push(p.dua);
    const sel = `FROM duas d, dua_categories c WHERE d.slug = ${lit(p.dua)} AND c.slug = ${lit(p.category)}`;
    const rc = p.context_repeat_count ?? null;
    out.push(
      `${AUDIT} SELECT 'mapping', d.id || ':' || c.id, 'insert', NULL, json_object('dua_id', d.id, 'category_id', c.id, 'sort_order', ${p.sort_order}, 'context_repeat_count', ${lit(rc)}), '[]', ${actor} ${sel} AND NOT EXISTS (SELECT 1 FROM dua_category_map m WHERE m.dua_id = d.id AND m.category_id = c.id);`,
      `${AUDIT} SELECT 'mapping', m.dua_id || ':' || m.category_id, 'update', json_object('sort_order', m.sort_order, 'context_repeat_count', m.context_repeat_count), json_object('sort_order', ${p.sort_order}, 'context_repeat_count', ${lit(rc)}), '["context_repeat_count","sort_order"]', ${actor} FROM dua_category_map m JOIN duas d ON d.id = m.dua_id JOIN dua_categories c ON c.id = m.category_id WHERE d.slug = ${lit(p.dua)} AND c.slug = ${lit(p.category)} AND (m.sort_order <> ${p.sort_order} OR m.context_repeat_count IS NOT ${lit(rc)});`,
      `INSERT INTO dua_category_map (dua_id, category_id, sort_order, context_repeat_count, updated_at) SELECT d.id, c.id, ${p.sort_order}, ${lit(rc)}, ${lit(now)} ${sel}
ON CONFLICT(dua_id, category_id) DO UPDATE SET sort_order = excluded.sort_order, context_repeat_count = excluded.context_repeat_count, updated_at = excluded.updated_at
WHERE dua_category_map.sort_order <> excluded.sort_order OR dua_category_map.context_repeat_count IS NOT excluded.context_repeat_count;`
    );
  }
  // 5. Duas already in a WYN category that WYN does not list: kept, moved after WYN's sequence.
  for (const [category, duas] of byCat) {
    out.push(
      `UPDATE dua_category_map SET sort_order = sort_order + ${EXTRA_MAPPING_OFFSET}, updated_at = ${lit(now)}
WHERE category_id = (SELECT id FROM dua_categories WHERE slug = ${lit(category)}) AND sort_order < ${EXTRA_MAPPING_OFFSET}
  AND dua_id NOT IN (SELECT id FROM duas WHERE slug IN (${duas.map(lit).join(", ")}));`
    );
  }

  // 6. Opt-in: corrections to existing (incl. published) rows, applied only if the field still holds the audited value.
  if (opts.withCorrections) {
    for (const c of cat.corrections ?? []) {
      const to = encode(c.field, c.proposed);
      const from = encode(c.field, c.current);
      const guard = `slug = ${lit(c.dua)} AND ${c.field} IS ${lit(from)}`;
      const extra = c.field === "arabic" ? `, arabic_normalized = ${lit(normalizeArabic(c.proposed))}` : "";
      out.push(
        `${AUDIT} SELECT 'dua', id, 'update', json_object(${lit(c.field)}, ${c.field}), json_object(${lit(c.field)}, ${lit(to)}), ${lit(JSON.stringify([c.field]))}, ${actor} FROM duas WHERE ${guard};`,
        `UPDATE duas SET ${c.field} = ${lit(to)}${extra}, updated_at = ${lit(now)}, updated_by = NULL WHERE ${guard};`
      );
    }
  }

  // 7. Opt-in: publish Duas the owner approved (by slug). Only 'review' rows that meet the publish rules.
  if (opts.publish?.length) {
    const guard = `slug IN (${opts.publish.map(lit).join(", ")}) AND status = 'review' AND length(trim(arabic)) > 0
  AND length(trim(coalesce(translation_en, ''))) > 0 AND length(trim(coalesce(source_reference, ''))) > 0`;
    out.push(
      `${AUDIT} SELECT 'dua', id, 'update', json_object('status', status), json_object('status', 'published'), '["published_at","status"]', ${actor} FROM duas WHERE ${guard};`,
      `UPDATE duas SET status = 'published', published_at = ${lit(now)}, updated_at = ${lit(now)} WHERE ${guard};`
    );
  }
  const tooBig = out.find((s) => Buffer.byteLength(s) > D1_MAX_STATEMENT_BYTES);
  if (tooBig) throw new Error(`generated statement exceeds D1's limit: ${tooBig.slice(0, 80)}…`);
  return out;
}
