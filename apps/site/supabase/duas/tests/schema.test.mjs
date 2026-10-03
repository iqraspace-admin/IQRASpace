import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import { bootDb, addUser, as, rejects } from './helpers.mjs';

const AR = 'اللَّهُمَّ إِنِّي أَسْأَلُكَ';
let db, admin, editor, stranger;

before(async () => {
  db = await bootDb();
  admin = await addUser(db, 'admin@example.org');
  editor = await addUser(db, 'editor@example.org');
  stranger = await addUser(db, 'stranger@example.org');
  await db.query(`insert into dua_admins(user_id, role) values ($1,'admin'), ($2,'editor')`, [admin, editor]);
  // seed (as owner/dashboard): one category, one published dua, one draft dua
  await db.exec(`
    insert into dua_categories(slug, name) values ('morning', 'Morning'), ('empty', 'Empty');
    insert into duas(slug, title, arabic, translation_en, status, source_reference)
      values ('pub-one', 'Published one', '${AR}', 'O Allah', 'published', 'Bukhari'),
             ('draft-one', 'Draft one', '${AR}', 'secret draft', 'draft', 'Muslim');
    insert into dua_category_map(dua_id, category_id, sort_order)
      select d.id, c.id, 1 from duas d, dua_categories c where d.slug in ('pub-one','draft-one') and c.slug = 'morning';
  `);
});

test('anon has no direct table access at all', async () => {
  await as(db, 'anon', null, async () => {
    for (const t of ['duas', 'dua_categories', 'dua_category_map', 'dua_audit_log', 'dua_admins']) {
      await rejects(db.query(`select * from ${t}`), /permission denied/i);
      await rejects(db.query(`delete from ${t}`), /permission denied/i);
    }
    await rejects(db.query(`insert into duas(slug,title) values ('x','x')`), /permission denied/i);
    await rejects(db.query(`update duas set title='hacked'`), /permission denied/i);
  });
});

test('anon RPC returns only published content, never drafts/archived', async () => {
  await db.exec(`insert into duas(slug,title,arabic,translation_en,status) values ('arch','Archived','${AR}','x','archived')`);
  await db.exec(`insert into dua_category_map select d.id, c.id, 9 from duas d, dua_categories c where d.slug='arch' and c.slug='morning'`);
  const snap = await as(db, 'anon', null, async () => (await db.query('select get_dua_content() as j')).rows[0].j);
  assert.equal(snap.categories.length, 1, 'empty category omitted');
  assert.equal(snap.categories[0].slug, 'morning');
  const slugs = snap.categories[0].duas.map((d) => d.slug);
  assert.deepEqual(slugs, ['pub-one']);
  assert.ok(!JSON.stringify(snap).includes('secret draft'));
  assert.ok(typeof snap.version === 'string' && snap.version.length === 32);
  await db.exec(`delete from duas where slug='arch'`);
});

test('signed-in non-staff user cannot read or write', async () => {
  await as(db, 'authenticated', stranger, async () => {
    assert.equal((await db.query('select * from duas')).rows.length, 0);
    assert.equal((await db.query('select * from dua_audit_log')).rows.length, 0);
    await rejects(db.query(`insert into duas(slug,title) values ('mine','mine')`), /row-level security/i);
    const u = await db.query(`update duas set title='x' returning id`);
    assert.equal(u.rows.length, 0);
    const d = await db.query(`delete from duas returning id`);
    assert.equal(d.rows.length, 0);
    await rejects(db.query(`insert into dua_admins(user_id, role) values ('${stranger}','admin')`), /permission denied/i);
  });
  const left = await db.query('select count(*)::int n from duas');
  assert.equal(left.rows[0].n, 2);
});

test('editor: drafts/review only, cannot publish, edit live rows, delete or touch categories', async () => {
  await as(db, 'authenticated', editor, async () => {
    await db.query(`insert into duas(slug,title,arabic) values ('ed-1','Editor draft','${AR}')`);
    await db.query(`update duas set status='review' where slug='ed-1'`);
    await rejects(db.query(`update duas set status='published', translation_en='x' where slug='ed-1'`), /Only an admin/);
    await rejects(
      db.query(`insert into duas(slug,title,arabic,translation_en,status) values ('ed-2','t','${AR}','x','published')`),
      /Only an admin/,
    );
    await rejects(db.query(`update duas set title='tamper' where slug='pub-one'`), /Only an admin/);
    assert.equal((await db.query(`delete from duas where slug='ed-1' returning id`)).rows.length, 0, 'RLS: editors cannot delete');
    await rejects(db.query(`insert into dua_categories(slug,name) values ('new','New')`), /row-level security/i);
    // mapping of a published dua is locked for editors, a draft's is not
    await rejects(
      db.query(`delete from dua_category_map where dua_id=(select id from duas where slug='pub-one')`),
      /Only an admin/,
    );
    await db.query(
      `insert into dua_category_map(dua_id,category_id,sort_order) select d.id,c.id,5 from duas d,dua_categories c where d.slug='ed-1' and c.slug='morning'`,
    );
  });
});

test('admin can publish; published_at + created_by/updated_by are stamped; audit trail records it', async () => {
  await as(db, 'authenticated', admin, async () => {
    await db.query(`update duas set status='published', translation_en='Editor translation' where slug='ed-1'`);
    const r = (await db.query(`select published_at, created_by, updated_by from duas where slug='ed-1'`)).rows[0];
    assert.ok(r.published_at);
    assert.equal(r.created_by, editor);
    assert.equal(r.updated_by, admin);
    const log = (
      await db.query(`select action, changed_fields, changed_by from dua_audit_log
       where entity='dua' and entity_id=(select id::text from duas where slug='ed-1') order by id`)
    ).rows;
    assert.deepEqual(log.map((l) => l.action), ['insert', 'update', 'update']);
    assert.ok(log[2].changed_fields.includes('status') && log[2].changed_fields.includes('translation_en'));
    assert.equal(log[2].changed_by, admin);
    assert.equal(log[0].changed_by, editor);
  });
});

test('audit log keeps old and new row and is append-only', async () => {
  await as(db, 'authenticated', admin, async () => {
    await db.query(`update duas set arabic='${AR} الْعَظِيمِ' where slug='pub-one'`);
    const e = (
      await db.query(`select old_data->>'arabic' o, new_data->>'arabic' n from dua_audit_log
      where entity='dua' and changed_fields @> '{arabic}' order by id desc limit 1`)
    ).rows[0];
    assert.equal(e.o, AR);
    assert.equal(e.n, `${AR} الْعَظِيمِ`);
    await rejects(
      db.query(`insert into dua_audit_log(entity,entity_id,action) values ('dua','x','insert')`),
      /row-level security|permission denied/i,
    );
    await rejects(db.query('delete from dua_audit_log'), /permission denied/i);
    await rejects(db.query("update dua_audit_log set action='delete'"), /permission denied/i);
  });
});

test('data constraints: arabic required to publish, arabic must be arabic, unique slug, repeat range', async () => {
  await as(db, 'authenticated', admin, async () => {
    await rejects(
      db.query(`insert into duas(slug,title,arabic,translation_en,status) values ('c1','t','','x','published')`),
      /duas_arabic_required/,
    );
    await rejects(
      db.query(`insert into duas(slug,title,arabic,translation_en,status) values ('c2','t','All praise is for Allah','x','review')`),
      /duas_arabic_is_arabic/,
    );
    await rejects(
      db.query(`insert into duas(slug,title,arabic,status) values ('c3','t','${AR}','published')`),
      /duas_published_needs_translation/,
    );
    await rejects(db.query(`insert into duas(slug,title,arabic) values ('pub-one','dup','${AR}')`), /duplicate key/);
    await rejects(db.query(`insert into duas(slug,title,repeat_count) values ('c4','t',0)`), /repeat_count/);
    await rejects(db.query(`insert into duas(slug,title) values ('Bad Slug','t')`), /slug/);
    await rejects(db.query(`insert into duas(slug,title,audio_url) values ('c5','t','http://insecure')`), /audio_url/);
    await db.query(`insert into duas(slug,title,arabic) values ('stub','Stub awaiting text','')`); // empty draft stub is allowed
  });
});

test('normalize_arabic strips diacritics so duplicates are detectable', async () => {
  const r = await db.query(`select normalize_arabic('اللَّهُمَّ إِنِّي، أَسْأَلُكَ') a, normalize_arabic('اللهم اني اسالك') b`);
  assert.equal(r.rows[0].a, r.rows[0].b);
});

test('content version changes on edit and on unpublish, not on draft-only edits', async () => {
  const v = async () => (await db.query('select dua_content_version() v')).rows[0].v;
  const v0 = await v();
  await as(db, 'authenticated', admin, async () => {
    await db.query(`update duas set title='Renamed' where slug='pub-one'`);
  });
  const v1 = await v();
  assert.notEqual(v0, v1);
  await as(db, 'authenticated', admin, async () => {
    await db.query(`update duas set status='draft' where slug='ed-1'`);
  });
  const v2 = await v();
  assert.notEqual(v1, v2);
  await as(db, 'authenticated', admin, async () => {
    await db.query(`update duas set title='draft edit' where slug='ed-1'`);
  });
  assert.equal(v2, await v());
});

test('category deletion is blocked while Duas are mapped; per-category overrides surface in the snapshot', async () => {
  await as(db, 'authenticated', admin, async () => {
    await rejects(db.query(`delete from dua_categories where slug='morning'`), /foreign key|violates/i);
    await db.query(`update dua_category_map set context_title='In the morning', context_repeat_count=3
      where dua_id=(select id from duas where slug='pub-one')`);
  });
  const snap = (await db.query('select get_dua_content() j')).rows[0].j;
  const d = snap.categories[0].duas[0];
  assert.equal(d.title, 'In the morning');
  assert.equal(d.repeat_count, 3);
});

test('admin may delete a Dua; the final copy stays in the audit log', async () => {
  await as(db, 'authenticated', admin, async () => {
    await db.query(`delete from duas where slug='stub'`);
    const e = (
      await db.query(`select action, old_data->>'slug' s from dua_audit_log where action='delete' order by id desc limit 1`)
    ).rows[0];
    assert.equal(e.s, 'stub');
  });
});
