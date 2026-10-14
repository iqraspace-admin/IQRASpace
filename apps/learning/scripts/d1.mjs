// Shared helper for the local maintenance scripts: run generated SQL against
// the Learning D1 database through wrangler.
//
//   default     the local dev database (.wrangler/state, what `wrangler dev` uses)
//   --remote    the production D1 database (needs `npx wrangler login` or
//               CLOUDFLARE_API_TOKEN/CLOUDFLARE_ACCOUNT_ID in the environment)

import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { pbkdf2Sync, randomBytes } from "node:crypto";

export const DB_NAME = "iqraspace-learning";
export const isRemote = process.argv.includes("--remote");

export const sqlString = (s) => (s === null || s === undefined ? "NULL" : `'${String(s).replace(/'/g, "''")}'`);

/** Same format worker/api/auth.js verifies: pbkdf2-sha256$<iterations>$<salt b64>$<hash b64>. */
export function hashPassword(pw) {
  const salt = randomBytes(16);
  const hash = pbkdf2Sync(pw, salt, 100_000, 32, "sha256");
  return `pbkdf2-sha256$100000$${salt.toString("base64")}$${hash.toString("base64")}`;
}

/** Execute SQL statements (one string) with wrangler d1 execute. Exits on failure. */
export function executeSql(sql) {
  const dir = mkdtempSync(join(tmpdir(), "iqs-d1-"));
  const file = join(dir, "run.sql");
  writeFileSync(file, sql);
  console.log(`Applying to ${isRemote ? "REMOTE (production)" : "local"} D1 "${DB_NAME}"…`);
  const wrangler = fileURLToPath(new URL("../node_modules/wrangler/bin/wrangler.js", import.meta.url));
  const r = spawnSync(
    process.execPath,
    [wrangler, "d1", "execute", DB_NAME, isRemote ? "--remote" : "--local", "--file", file, "--yes"],
    { stdio: "inherit" }
  );
  rmSync(dir, { recursive: true, force: true });
  if (r.status !== 0) {
    console.error("\n✗ wrangler d1 execute failed.\n");
    process.exit(r.status ?? 1);
  }
}
