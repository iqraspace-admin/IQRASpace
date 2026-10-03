// Boots an in-process Postgres (PGlite) with just enough of Supabase's
// environment (auth.users, auth.uid(), anon/authenticated roles and
// Supabase's permissive default table grants — the worst case our own
// REVOKEs must override) to run the real migration files.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
export const migrationsDir = join(here, '..', 'sql');

export const learningMigrationsDir = join(here, '..', '..', '..', '..', '..', 'supabase', 'migrations');

export async function bootDb({ migrations = ['0002_duas_schema.sql'], dir = migrationsDir, pre = '' } = {}) {
  const db = new PGlite();
  await db.exec(`
    create role anon nologin; create role authenticated nologin;
    create schema auth;
    create table auth.users (id uuid primary key default gen_random_uuid(), email text);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema public, auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    alter default privileges in schema public grant all on tables to anon, authenticated;
    alter default privileges in schema public grant all on functions to anon, authenticated;
  `);
  if (pre) await db.exec(pre);
  for (const m of migrations) await db.exec(readFileSync(join(dir, m), 'utf8'));
  return db;
}

export async function addUser(db, email) {
  const r = await db.query('insert into auth.users(email) values ($1) returning id', [email]);
  return r.rows[0].id;
}

/** Run fn with the connection acting as the given Supabase role / user. */
export async function as(db, role, uid, fn) {
  await db.exec(`set role ${role}`);
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [uid ?? '']);
  try {
    return await fn();
  } finally {
    await db.exec('reset role');
    await db.query(`select set_config('request.jwt.claim.sub', '', false)`);
  }
}

export async function rejects(promise, pattern) {
  try {
    await promise;
  } catch (e) {
    if (pattern && !pattern.test(String(e.message))) {
      throw new Error(`rejected with unexpected message: ${e.message}`);
    }
    return e;
  }
  throw new Error('expected the statement to be rejected, but it succeeded');
}
