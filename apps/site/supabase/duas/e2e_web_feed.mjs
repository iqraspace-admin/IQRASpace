// Verifies "Learning admin publishes/edits -> website feed reflects it" with NO website change.
// Runs the real Duas migrations in PGlite (dev_backend.mjs), points the website Worker's
// /api/duas handler (apps/site/worker/duas.js) at it, edits as an admin, and re-reads the feed.
//   node e2e_web_feed.mjs
import assert from 'node:assert/strict';
import { startDevBackend } from './dev_backend.mjs';
import { as } from './tests/helpers.mjs';
import { handleDuas } from '../../worker/duas.js';

const b = await startDevBackend({ port: 0 });
const env = { DUAS_SUPABASE_URL: b.url, DUAS_SUPABASE_ANON_KEY: 'anon' };
const feed = async () => (await handleDuas({ method: 'GET', env })).body;
const admin = (fn) => as(b.db, 'authenticated', b.adminId, fn);
const find = (f, slug, cat) => f.categories.filter((c) => !cat || c.slug === cat).flatMap((c) => c.duas.map((d) => ({ ...d, cat: c.slug }))).filter((d) => d.slug === slug);
let n = 0; const ok = (m) => console.log(`ok ${++n} - ${m}`);

const f0 = await feed();
assert.ok(f0.ok && f0.categories.length > 0); ok(`feed serves ${f0.categories.length} categories from the published snapshot`);
const catA = f0.categories[0], catB = f0.categories[1];
const catId = async (slug) => (await b.db.query('select id from dua_categories where slug=$1', [slug])).rows[0].id;

// 1. new Dua: draft is invisible, published is visible
let id;
await admin(async () => { id = (await b.db.query(`insert into duas(slug,title,arabic,translation_en,status) values ('e2e-new','E2E draft','اللَّهُمَّ','Draft text','draft') returning id`)).rows[0].id; });
await admin(async () => { await b.db.query('delete from dua_category_map where dua_id=$1', [id]); await b.db.query(`insert into dua_category_map(dua_id,category_id,sort_order) values ($1,$2,999)`, [id, await catId(catA.slug)]); });
assert.equal(find(await feed(), 'e2e-new').length, 0); ok('draft Dua is NOT on the website');
await admin(() => b.db.query(`update duas set status='published' where id=$1`, [id]));
let f = await feed();
assert.equal(find(f, 'e2e-new', catA.slug)[0].title, 'E2E draft'); ok('publishing makes a new Dua appear in its category');

// 2. edits: title, Arabic, English, Urdu
await admin(() => b.db.query(`update duas set title='E2E renamed', arabic='سُبْحَانَ اللَّهِ', translation_en='Glory be to Allah', translation_ur='اللہ پاک ہے' where id=$1`, [id]));
const d = find(await feed(), 'e2e-new')[0];
assert.deepEqual([d.title, d.arabic, d.translation_en, d.translation_ur], ['E2E renamed', 'سُبْحَانَ اللَّهِ', 'Glory be to Allah', 'اللہ پاک ہے']); ok('title, Arabic, English and Urdu edits are reflected');

// 3. category changes: move Dua A -> B, rename a category
await admin(async () => {
  await b.db.query('delete from dua_category_map where dua_id=$1', [id]);
  await b.db.query(`insert into dua_category_map(dua_id,category_id,sort_order) values ($1,$2,999)`, [id, await catId(catB.slug)]);
  await b.db.query(`update dua_categories set name='E2E Renamed Category' where slug=$1`, [catB.slug]);
});
f = await feed();
assert.equal(find(f, 'e2e-new', catA.slug).length, 0); assert.equal(find(f, 'e2e-new', catB.slug).length, 1);
assert.equal(f.categories.find((c) => c.slug === catB.slug).name, 'E2E Renamed Category'); ok('moving a Dua between categories and renaming a category are reflected');

// 4. unpublish removes it; version hash changes along the way
const v1 = (await feed()).version;
await admin(() => b.db.query(`update duas set status='draft' where id=$1`, [id]));
f = await feed();
assert.equal(find(f, 'e2e-new').length, 0); assert.notEqual(f.version, v1); ok('unpublishing removes the Dua (and the content version changes)');

await b.close();
console.log(`\nall ${n} checks passed`);
process.exit(0);
