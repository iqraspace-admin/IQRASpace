// Safety tests for the WYN Duas sync (scripts/duas-wyn-sync.mjs) against real SQLite with the
// D1 migrations applied, plus invariants of the committed catalog. Run: npm run test:duas
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createTestDb } from "../../worker/api/testdb.mjs";
import { getDuaContent } from "../../worker/api/duas.js";
import { buildSql, checkCatalog, stableId, AUDIT_ACTOR, OTHER_CATEGORY_OFFSET, EXTRA_MAPPING_OFFSET, CHUNK_BYTES, D1_MAX_STATEMENT_BYTES } from "./sync-lib.mjs";

const NOW = "2026-10-17T00:00:00.000Z";
const AR = {
  pub: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ",
  stub: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",
  fresh: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ عَدَدَ خَلْقِهِ",
};
const base = { title_ur: null, transliteration_latin: "x", transliteration_telugu: null, transliteration_urdu: null, translation_ur: "اردو", description: null,
  repeat_count: null, source_type: "hadith", source_collection: "Sahih Muslim", hadith_number: null, hadith_grade: null, quran_refs: [], verification_status: "unchecked", review_notes: "n", wyn_ids: [] };

function fixtureDb() {
  const t = createTestDb();
  const q = (sql, ...p) => t.db.prepare(sql).run(...p);
  q(`INSERT INTO dua_categories (id, slug, name, description, sort_order) VALUES ('c-m', 'morning', 'Morning athkar', 'Said after Fajr', 10), ('c-f', 'food', 'Food', 'Meals', 90)`);
  q(`INSERT INTO duas (id, slug, title, arabic, arabic_normalized, translation_en, status, source_reference) VALUES ('d-pub', 'morning-protection', 'Protection', ?, '', 'In the name of Allah', 'published', 'Abu Dawud 5088')`, AR.pub);
  q(`INSERT INTO duas (id, slug, title, arabic, status, origin, wyn_ids) VALUES ('d-stub', 'wyn-0012-audhu', 'stub', '', 'draft', 'wyn_public_pdf', '["WYN-0012"]')`);
  q(`INSERT INTO duas (id, slug, title, arabic, arabic_normalized, translation_en, status, source_reference) VALUES ('d-old', 'morning-extra', 'Not in WYN', 'اللَّهُمَّ', '', 'x', 'published', 'r')`);
  q(`INSERT INTO dua_category_map (dua_id, category_id, sort_order) VALUES ('d-pub', 'c-m', 0), ('d-old', 'c-m', 1)`);
  return t;
}

const catalog = () => ({
  categories: [
    { slug: "morning", name: "Morning Supplications", name_ur: "صبح کے اذکار", name_te: "ఉదయపు దుఆలు", description: "", sort_order: 10 },
    { slug: "sakeenah", name: "Ayaat of Tranquility", name_ur: "آیات سکینہ", name_te: "సకీనా ఆయతులు", description: "Verses of tranquility", sort_order: 20 },
  ],
  duas: [
    { mode: "reuse", slug: "morning-protection" },
    { ...base, mode: "fill", slug: "wyn-0012-audhu", title: "Refuge in Allah's perfect words", arabic: AR.stub, translation_en: "I seek refuge…", source_reference: "Sahih Muslim 6880" },
    { ...base, mode: "insert", slug: "wyn-subhanallah-adada", title: "Glorification", arabic: AR.fresh, translation_en: "Glory be to Allah…", source_reference: "Sahih Muslim 6913", repeat_count: 3 },
  ],
  placements: [
    { category: "morning", dua: "wyn-subhanallah-adada", sort_order: 1 },
    { category: "morning", dua: "morning-protection", sort_order: 2, context_repeat_count: 3 },
    { category: "morning", dua: "wyn-0012-audhu", sort_order: 3 },
    { category: "sakeenah", dua: "wyn-subhanallah-adada", sort_order: 1 },
  ],
  corrections: [{ dua: "morning-protection", field: "translation_en", current: "In the name of Allah", proposed: "In the name of Allah, with whose name nothing harms", reason: "truncated" }],
});

const run = (db, stmts) => stmts.forEach((s) => db.exec(s));
const row = (db, slug) => ({ ...db.prepare("SELECT * FROM duas WHERE slug = ?").get(slug) });

test("published Duas are untouched by default; new and stub Duas land in review", () => {
  const { db } = fixtureDb();
  const pubBefore = row(db, "morning-protection");
  run(db, buildSql(catalog(), { now: NOW }));
  assert.deepEqual(row(db, "morning-protection"), pubBefore);
  assert.equal(row(db, "wyn-subhanallah-adada").status, "review");
  assert.equal(row(db, "wyn-subhanallah-adada").id, stableId("dua", "wyn-subhanallah-adada"));
  const filled = row(db, "wyn-0012-audhu");
  assert.equal(filled.status, "review");
  assert.equal(filled.arabic, AR.stub);
  assert.ok(filled.arabic_normalized.length > 10);
  assert.equal(db.prepare("SELECT count(*) n FROM duas WHERE status = 'published'").get().n, 2);
});

test("categories are renamed/ordered like WYN; other categories move after; non-WYN Duas stay, after WYN's", () => {
  const { db } = fixtureDb();
  run(db, buildSql(catalog(), { now: NOW }));
  const cat = (s) => db.prepare("SELECT * FROM dua_categories WHERE slug = ?").get(s);
  assert.equal(cat("morning").name, "Morning Supplications");
  assert.equal(cat("morning").description, "Said after Fajr", "an existing description is kept");
  assert.equal(cat("sakeenah").sort_order, 20);
  assert.equal(cat("food").sort_order, 90 + OTHER_CATEGORY_OFFSET);
  const order = db.prepare(`SELECT d.slug, m.sort_order, m.context_repeat_count rc FROM dua_category_map m JOIN duas d ON d.id = m.dua_id
    WHERE m.category_id = 'c-m' ORDER BY m.sort_order`).all().map((r) => ({ ...r }));
  assert.deepEqual(order.map((r) => r.slug), ["wyn-subhanallah-adada", "morning-protection", "wyn-0012-audhu", "morning-extra"]);
  assert.equal(order[1].rc, 3);
  assert.equal(order[3].sort_order, 1 + EXTRA_MAPPING_OFFSET);
});

test("re-running is a no-op and keeps an admin's review edits", () => {
  const { db } = fixtureDb();
  const stmts = buildSql(catalog(), { now: NOW });
  run(db, stmts);
  db.prepare("UPDATE duas SET translation_en = 'edited by admin' WHERE slug = 'wyn-subhanallah-adada'").run();
  const snap = () => JSON.stringify([
    db.prepare("SELECT * FROM duas ORDER BY slug").all(),
    db.prepare("SELECT * FROM dua_categories ORDER BY slug").all(),
    db.prepare("SELECT * FROM dua_category_map ORDER BY dua_id, category_id").all(),
    db.prepare("SELECT count(*) n FROM dua_audit_log").get(),
  ]);
  const before = snap();
  run(db, buildSql(catalog(), { now: "2026-10-18T00:00:00.000Z" }));
  assert.equal(snap(), before);
  assert.equal(row(db, "wyn-subhanallah-adada").translation_en, "edited by admin");
});

test("every change is audited as the sync script", () => {
  const { db } = fixtureDb();
  run(db, buildSql(catalog(), { now: NOW }));
  const log = db.prepare("SELECT entity, action, changed_by FROM dua_audit_log").all();
  assert.ok(log.length >= 6);
  assert.ok(log.every((r) => r.changed_by === AUDIT_ACTOR));
  assert.ok(log.some((r) => r.entity === "dua" && r.action === "insert"));
  assert.ok(log.some((r) => r.entity === "dua" && r.action === "update"));
  assert.ok(log.some((r) => r.entity === "category" && r.action === "insert"));
  assert.ok(log.some((r) => r.entity === "mapping" && r.action === "insert"));
});

test("corrections are opt-in and guarded by the audited current value", () => {
  const { db } = fixtureDb();
  run(db, buildSql(catalog(), { now: NOW, withCorrections: true }));
  assert.equal(row(db, "morning-protection").translation_en, "In the name of Allah, with whose name nothing harms");
  assert.equal(row(db, "morning-protection").status, "published");

  const t2 = fixtureDb();
  t2.db.prepare("UPDATE duas SET translation_en = 'changed meanwhile' WHERE slug = 'morning-protection'").run();
  run(t2.db, buildSql(catalog(), { now: NOW, withCorrections: true }));
  assert.equal(row(t2.db, "morning-protection").translation_en, "changed meanwhile");
});

test("publishing needs the owner's explicit slug list, and the feed then follows WYN order", async () => {
  const { db, exec } = fixtureDb();
  run(db, buildSql(catalog(), { now: NOW }));
  let feed = await getDuaContent(exec);
  assert.deepEqual(feed.categories.find((c) => c.slug === "morning").duas.map((d) => d.slug), ["morning-protection", "morning-extra"]);
  run(db, buildSql(catalog(), { now: NOW, publish: ["wyn-subhanallah-adada", "wyn-0012-audhu", "morning-extra"] }));
  assert.equal(row(db, "wyn-0012-audhu").status, "published");
  feed = await getDuaContent(exec);
  const morning = feed.categories.find((c) => c.slug === "morning");
  assert.equal(morning.name, "Morning Supplications");
  assert.deepEqual(morning.duas.map((d) => d.slug), ["wyn-subhanallah-adada", "morning-protection", "wyn-0012-audhu", "morning-extra"]);
  assert.equal(morning.duas[1].repeat_count, 3);
  assert.deepEqual(feed.categories.map((c) => c.slug), ["morning", "sakeenah"]);
});

test("whole-Surah texts are chunked under D1's statement limit and stored complete", () => {
  const { db } = fixtureDb();
  const c = catalog();
  const long = (unit) => Array.from({ length: 4000 }, (_, i) => `${unit}${i}`).join(" ");
  c.duas.push({ ...base, mode: "insert", slug: "wyn-long-surah", title: "Long", arabic: long("بِسْمِ اللَّهِ "), translation_en: long("In the name of Allah "),
    translation_ur: long("اللہ کے نام سے "), transliteration_telugu: long("బిస్మిల్లాహ్ "), source_reference: "Qur'an 17", source_type: "quran", quran_refs: [{ surah: 17, ayah_from: 1, ayah_to: 111 }] });
  c.duas[3].transliteration_latin = long("x ");
  c.placements.push({ category: "sakeenah", dua: "wyn-long-surah", sort_order: 2 });
  const stmts = buildSql(c, { now: NOW });
  assert.ok(stmts.every((s) => Buffer.byteLength(s) < D1_MAX_STATEMENT_BYTES));
  run(db, stmts);
  const r = row(db, "wyn-long-surah");
  for (const k of ["arabic", "translation_en", "translation_ur", "transliteration_telugu"]) assert.equal(r[k], c.duas[3][k], k);
  assert.ok(Buffer.byteLength(r.arabic) > 3 * CHUNK_BYTES);
  const log = db.prepare("SELECT new_data FROM dua_audit_log WHERE entity = 'dua' AND entity_id = ?").get(r.id);
  assert.equal(JSON.parse(log.new_data).arabic, r.arabic);
  const before = JSON.stringify(db.prepare("SELECT * FROM duas ORDER BY slug").all());
  run(db, buildSql(c, { now: "2026-10-18T00:00:00.000Z" }));
  assert.equal(JSON.stringify(db.prepare("SELECT * FROM duas ORDER BY slug").all()), before);
});

test("catalog validation rejects unsafe input", () => {
  const c = catalog();
  c.duas.push({ ...c.duas[2], slug: "wyn-dup" });
  c.placements.push({ category: "morning", dua: "morning-protection", sort_order: 9 });
  c.corrections.push({ dua: "morning-protection", field: "status", current: "published", proposed: "draft" });
  const { errors } = checkCatalog(c);
  assert.ok(errors.some((e) => e.includes("same Arabic")));
  assert.ok(errors.some((e) => e.includes("placed twice")));
  assert.ok(errors.some((e) => e.includes("not correctable")));
  assert.throws(() => buildSql(c));
});

test("committed WYN catalog: valid, review-only, mirrors the WYN app's categories and sequence", () => {
  const cat = JSON.parse(readFileSync(new URL("../../content/duas-wyn/catalog.json", import.meta.url), "utf8"));
  const { errors } = checkCatalog(cat);
  assert.deepEqual(errors, []);
  assert.equal(cat.categories.length, 23);
  assert.deepEqual(cat.categories.map((c) => c.sort_order), [...cat.categories.map((c) => c.sort_order)].sort((a, b) => a - b));
  for (const c of cat.categories) {
    const placed = cat.placements.filter((p) => p.category === c.slug).length;
    const skipped = (cat.exclusions ?? []).filter((x) => x.category === c.slug).length;
    assert.equal(placed + skipped, c.wyn.count, `${c.slug}: placements + documented exclusions = WYN count`);
    const orders = cat.placements.filter((p) => p.category === c.slug).map((p) => p.sort_order);
    assert.deepEqual(orders, [...orders].sort((a, b) => a - b), `${c.slug}: placements in WYN order`);
  }
  assert.ok(cat.duas.filter((d) => d.mode !== "reuse").every((d) => !("status" in d)), "the catalog never sets a status (inserts are 'review')");
});
