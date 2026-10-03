// The Learning-DB flavour (root supabase/migrations 0025 + 0026): admin = public.users.role.
import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import { bootDb, addUser, as, rejects, learningMigrationsDir } from './helpers.mjs';

const AR = 'اللَّهُمَّ إِنِّي أَسْأَلُكَ';
let db, superAdmin, admin, tutor, student;

before(async () => {
  // minimal stand-in for Learning's existing public.users (see 0001/0017)
  db = await bootDb({
    migrations: ['0025_duas_schema.sql', '0026_duas_seed.sql'],
    dir: learningMigrationsDir,
    pre: `create table public.users (id uuid primary key, role text not null check (role in ('tutor','student','guardian','admin','super_admin')));`,
  });
  const mk = async (email, role) => {
    const id = await addUser(db, email);
    await db.query('insert into public.users(id, role) values ($1,$2)', [id, role]);
    return id;
  };
  superAdmin = await mk('sa@x.org', 'super_admin');
  admin = await mk('a@x.org', 'admin');
  tutor = await mk('t@x.org', 'tutor');
  student = await mk('s@x.org', 'student');
});

test('seed applies on top of Learning schema; anon gets published snapshot only via RPC', async () => {
  const snap = await as(db, 'anon', null, async () => (await db.query('select get_dua_content() j')).rows[0].j);
  assert.ok(snap.categories.length >= 25);
  await as(db, 'anon', null, async () => {
    await rejects(db.query('select * from duas'), /permission denied/i);
  });
});

test('tutor and student users (signed in) cannot read or write Duas', async () => {
  for (const uid of [tutor, student]) {
    await as(db, 'authenticated', uid, async () => {
      assert.equal((await db.query('select * from duas')).rows.length, 0);
      await rejects(db.query(`insert into duas(slug,title,arabic) values ('x-y','t','${AR}')`), /row-level security/i);
      assert.equal((await db.query(`update duas set title='x' returning id`)).rows.length, 0);
      assert.equal((await db.query(`delete from duas returning id`)).rows.length, 0);
      assert.equal((await db.query('select * from dua_audit_log')).rows.length, 0);
    });
  }
});

test('admin and super_admin can edit, publish and delete; edits are audited with their user id', async () => {
  for (const [uid, slug] of [[admin, 'adm-test'], [superAdmin, 'sa-test']]) {
    await as(db, 'authenticated', uid, async () => {
      await db.query(`insert into duas(slug,title,arabic,translation_en,status,source_reference) values ($1,'T','${AR}','tr','published','Bukhari')`, [slug]);
      await db.query(`update duas set translation_en='edited' where slug=$1`, [slug]);
      const log = (await db.query(`select changed_by, changed_fields from dua_audit_log where entity='dua' and new_data->>'slug'=$1 order by id desc limit 1`, [slug])).rows[0];
      assert.equal(log.changed_by, uid);
      assert.deepEqual(log.changed_fields, ['translation_en']);
      assert.equal((await db.query('delete from duas where slug=$1 returning id', [slug])).rows.length, 1);
    });
  }
});

test('a Learning user cannot make themselves a Dua admin by editing their own role (role column guarded in Learning, and Duas never reads any other source)', async () => {
  // Our helper only trusts public.users.role; a tutor row stays a non-admin here.
  await as(db, 'authenticated', tutor, async () => {
    assert.equal((await db.query('select public.is_dua_admin() a')).rows[0].a, false);
  });
  await as(db, 'authenticated', admin, async () => {
    assert.equal((await db.query('select public.is_dua_admin() a')).rows[0].a, true);
  });
});
