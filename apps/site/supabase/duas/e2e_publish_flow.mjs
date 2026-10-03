// Runs the admin-edit -> Flutter-app end-to-end check against the local dev backend.
//   node e2e_publish_flow.mjs
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { startDevBackend } from './dev_backend.mjs';
import { repoRoot } from './lib.mjs';

const backend = await startDevBackend({ port: 0 });
console.log(`dev backend (real migrations in PGlite) at ${backend.url}`);
const cwd = join(repoRoot, 'apps', 'mobile', 'android');
const code = await new Promise((resolve) => {
  const p = spawn('flutter', ['test', 'test/e2e/remote_publish_flow_test.dart'], {
    cwd, shell: true, stdio: 'inherit', env: { ...process.env, DUAS_E2E_URL: backend.url },
  });
  p.on('exit', resolve);
});
const audit = (await backend.db.query(`select action, changed_fields from dua_audit_log where changed_by is not null order by id`)).rows;
console.log('audit entries written by the admin edits:', JSON.stringify(audit));
await backend.close();
process.exit(code ?? 1);
