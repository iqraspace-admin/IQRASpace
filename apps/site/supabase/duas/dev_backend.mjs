// Local stand-in for the Supabase backend, used ONLY for end-to-end tests of the
// "admin edit -> app shows it" flow when no real Supabase project is available.
//
// It runs the REAL migrations (0002 schema + 0003 seed) in an in-process Postgres
// (PGlite) and serves the two public RPC endpoints the Flutter app calls:
//   POST /rest/v1/rpc/dua_content_version   POST /rest/v1/rpc/get_dua_content
// executed as the `anon` role — i.e. exactly what a mobile user can reach.
// Edits are applied through /__dev/admin-update as an authenticated *admin* user, so
// the real triggers/RLS/audit log run (an editor-role or anonymous call is rejected).
//
//   node dev_backend.mjs [--port 54399]
import http from 'node:http';
import { bootDb, addUser, as } from './tests/helpers.mjs';

const EDITABLE = new Set([
  'title', 'arabic', 'translation_en', 'translation_ur', 'transliteration_latin', 'repeat_count', 'description', 'status',
]);

export async function startDevBackend({ port = 0 } = {}) {
  const db = await bootDb({ migrations: ['0002_duas_schema.sql', '0003_duas_seed.sql'] });
  const adminId = await addUser(db, 'dev-admin@example.org');
  await db.query(`insert into dua_admins(user_id, role) values ($1, 'admin')`, [adminId]);

  const json = (res, code, body) => {
    res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' });
    res.end(JSON.stringify(body));
  };
  const readBody = (req) => new Promise((resolve) => {
    let s = '';
    req.on('data', (d) => (s += d)).on('end', () => resolve(s ? JSON.parse(s) : {}));
  });

  const server = http.createServer(async (req, res) => {
    try {
      if (req.method === 'OPTIONS') return json(res, 204, {});
      const path = req.url.split('?')[0];
      if (path.startsWith('/rest/v1/rpc/')) {
        if (!req.headers.apikey) return json(res, 401, { message: 'No API key found in request' });
        const fn = path.slice('/rest/v1/rpc/'.length);
        if (fn !== 'dua_content_version' && fn !== 'get_dua_content') return json(res, 404, { message: 'not found' });
        const row = await as(db, 'anon', null, async () => (await db.query(`select ${fn}() as r`)).rows[0]);
        return json(res, 200, row.r);
      }
      if (path === '/__dev/admin-update' && req.method === 'POST') {
        const { slug, ...fields } = await readBody(req);
        const keys = Object.keys(fields);
        if (!keys.length || keys.some((k) => !EDITABLE.has(k))) return json(res, 400, { message: 'bad fields' });
        const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
        const r = await as(db, 'authenticated', adminId, async () =>
          db.query(`update duas set ${sets} where slug = $1 returning slug, status, translation_en`, [slug, ...keys.map((k) => fields[k])]));
        return json(res, 200, r.rows[0] ?? null);
      }
      if (path === '/__dev/audit') {
        const r = await db.query(`select action, changed_fields, changed_by from dua_audit_log order by id desc limit 5`);
        return json(res, 200, r.rows);
      }
      return json(res, 404, { message: 'not found' });
    } catch (e) {
      return json(res, 500, { message: String(e.message) });
    }
  });
  await new Promise((r) => server.listen(port, '127.0.0.1', r));
  const url = `http://127.0.0.1:${server.address().port}`;
  return { url, db, adminId, close: () => new Promise((r) => { server.close(r); }) };
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  const i = process.argv.indexOf('--port');
  const b = await startDevBackend({ port: i > 0 ? +process.argv[i + 1] : 54399 });
  console.log(`dev backend listening on ${b.url}`);
}
