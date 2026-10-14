// One-time data migration: Supabase (Postgres + Auth) -> Cloudflare D1.
//
//   npm run migrate:check    read-only: can we reach Supabase, and how many rows per table?
//   npm run migrate:export   read-only: dump every table to .migration/supabase-export.json
//   npm run migrate:sql      build .migration/d1-import.sql from that export
//   npx wrangler d1 execute iqraspace-learning --remote --file .migration/d1-import.sql
//
// Reads with the service_role key through the Supabase REST + Auth admin APIs
// (GET requests only — nothing in Supabase is modified). Needs, in .env.local:
//   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// Passwords cannot be carried over: Supabase stores bcrypt hashes inside its
// own auth schema, and the Worker uses PBKDF2. `migrate:sql` therefore sets:
//   - admin / superadmin  -> ADMIN_PASSWORD / SUPER_ADMIN_PASSWORD from .env.local
//   - every other account -> a random temporary password, written to
//     .migration/temp-passwords.txt (hand them out, or reset them in
//     /learning/admin/users after go-live)
// .migration/ is gitignored — it contains personal data; delete it when done.

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { pbkdf2Sync, randomBytes } from "node:crypto";
import { TABLES } from "../worker/api/schema.js";

const OUT_DIR = new URL("../.migration/", import.meta.url);
const EXPORT_FILE = new URL("supabase-export.json", OUT_DIR);
const SQL_FILE = new URL("d1-import.sql", OUT_DIR);
const PW_FILE = new URL("temp-passwords.txt", OUT_DIR);

// Parent tables before children (foreign keys).
const TABLE_ORDER = [
  "users",
  "tutors",
  "students",
  "classes",
  "class_members",
  "google_drive_files",
  "lesson_plans",
  "lesson_plan_items",
  "class_lesson_plans",
  "recurring_session_rules",
  "lessons",
  "lesson_materials",
  "meetings",
  "attendance",
  "lesson_progress",
  "lesson_notes",
  "sharing_sessions",
  "highlighted_content",
  "student_lesson_progress",
  "student_lesson_completions",
  "notifications",
  "dua_categories",
  "duas",
  "dua_category_map",
  "dua_audit_log",
];

const mode = process.argv[2];

function fail(msg) {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) fail("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local.");
  return { url, headers: { apikey: key, Authorization: `Bearer ${key}` } };
}

async function getJson(url, headers) {
  const res = await fetch(url, { headers });
  const text = await res.text();
  if (!res.ok) throw new Error(`GET ${url.replace(/\?.*/, "")} -> HTTP ${res.status}: ${text.slice(0, 300)}`);
  return { body: JSON.parse(text), res };
}

async function countRows(cfg, table) {
  const res = await fetch(`${cfg.url}/rest/v1/${table}?select=*&limit=1`, {
    headers: { ...cfg.headers, Prefer: "count=exact", Range: "0-0" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const range = res.headers.get("content-range") ?? "";
  return Number(range.split("/")[1] ?? NaN);
}

async function fetchTable(cfg, table) {
  const rows = [];
  const pageSize = 1000;
  const order = TABLES[table].pk.join(",");
  for (let from = 0; ; from += pageSize) {
    const { body } = await getJson(`${cfg.url}/rest/v1/${table}?select=*&order=${order}&limit=${pageSize}&offset=${from}`, cfg.headers);
    rows.push(...body);
    if (body.length < pageSize) return rows;
  }
}

async function fetchAuthUsers(cfg) {
  const users = [];
  for (let page = 1; page <= 100; page++) {
    const { body } = await getJson(`${cfg.url}/auth/v1/admin/users?page=${page}&per_page=200`, cfg.headers);
    const list = body.users ?? [];
    users.push(...list.map((u) => ({ id: u.id, email: u.email, banned_until: u.banned_until ?? null })));
    if (list.length < 200) break;
  }
  return users;
}

async function check() {
  const cfg = supabaseConfig();
  console.log(`\nSupabase: ${cfg.url}  (read-only check)\n`);
  let problems = 0;
  for (const table of TABLE_ORDER) {
    try {
      const n = await countRows(cfg, table);
      console.log(`  ✓ ${table.padEnd(28)} ${n} rows`);
    } catch (e) {
      problems++;
      console.log(`  ✗ ${table.padEnd(28)} ${e.message}`);
    }
  }
  try {
    const auth = await fetchAuthUsers(cfg);
    const banned = auth.filter((u) => u.banned_until && Date.parse(u.banned_until) > Date.now()).length;
    console.log(`  ✓ ${"auth.users".padEnd(28)} ${auth.length} accounts (${banned} deactivated)`);
  } catch (e) {
    problems++;
    console.log(`  ✗ ${"auth.users".padEnd(28)} ${e.message}`);
  }
  console.log(problems ? `\n✗ ${problems} problem(s) — fix before exporting.\n` : "\n✓ Connection OK — every table is readable. Next: npm run migrate:export\n");
  process.exit(problems ? 1 : 0);
}

async function exportAll() {
  const cfg = supabaseConfig();
  const data = { exportedAt: new Date().toISOString(), source: cfg.url, tables: {}, authUsers: [] };
  for (const table of TABLE_ORDER) {
    data.tables[table] = await fetchTable(cfg, table);
    console.log(`  ${table.padEnd(28)} ${data.tables[table].length} rows`);
  }
  data.authUsers = await fetchAuthUsers(cfg);
  console.log(`  ${"auth.users".padEnd(28)} ${data.authUsers.length} accounts`);
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(EXPORT_FILE, JSON.stringify(data, null, 1));
  console.log(`\n✓ Wrote ${EXPORT_FILE.pathname}. Next: npm run migrate:sql\n`);
}

// ------------------------------------------------------------------ SQL generation

const TS_RE = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(\.\d+)?([+-]\d{2}(:?\d{2})?|Z)$/;

function sqlValue(type, v) {
  if (v === null || v === undefined) return "NULL";
  if (type === "bool") return v ? "1" : "0";
  if (type === "int") return String(Number(v));
  if (type === "json") return sqlString(typeof v === "string" ? v : JSON.stringify(v));
  if (typeof v === "string" && TS_RE.test(v)) return sqlString(new Date(v).toISOString()); // timestamptz -> ISO Z
  return sqlString(String(v));
}
const sqlString = (s) => `'${s.replace(/'/g, "''")}'`;

function hashPassword(pw) {
  const salt = randomBytes(16);
  const hash = pbkdf2Sync(pw, salt, 100_000, 32, "sha256");
  return `pbkdf2-sha256$100000$${salt.toString("base64")}$${hash.toString("base64")}`;
}

function tempPassword() {
  return randomBytes(9).toString("base64").replace(/[+/=]/g, "x");
}

function buildSql() {
  if (!existsSync(EXPORT_FILE)) fail("No export found — run npm run migrate:export first.");
  const data = JSON.parse(readFileSync(EXPORT_FILE, "utf8"));
  const lines = [
    "-- Generated by scripts/migrate-from-supabase.mjs — contains personal data, never commit.",
    `-- Source: ${data.source}, exported ${data.exportedAt}`,
    "PRAGMA defer_foreign_keys = true;",
  ];
  // Clear in reverse dependency order so the import is repeatable.
  for (const t of [...TABLE_ORDER].reverse()) lines.push(`DELETE FROM ${t};`);
  lines.push("DELETE FROM sessions;", "DELETE FROM user_credentials;");

  for (const table of TABLE_ORDER) {
    const def = TABLES[table];
    const cols = [...Object.keys(def.columns), ...(def.serverOnly ?? [])];
    const types = { ...def.columns };
    for (const row of data.tables[table] ?? []) {
      const present = cols.filter((c) => c in row);
      const values = present.map((c) => sqlValue(types[c] ?? "text", row[c]));
      lines.push(`INSERT INTO ${table} (${present.join(", ")}) VALUES (${values.join(", ")});`);
    }
  }

  // Duas: arabic_normalized was a generated column; it came across in the export as-is.
  // Credentials
  const banned = new Map(data.authUsers.map((u) => [u.id, !!(u.banned_until && Date.parse(u.banned_until) > Date.now())]));
  const known = {
    admin: process.env.ADMIN_PASSWORD,
    superadmin: process.env.SUPER_ADMIN_PASSWORD,
  };
  const temp = [];
  for (const u of data.tables.users ?? []) {
    let pw = known[u.username];
    if (!pw) {
      pw = tempPassword();
      temp.push(`${u.username}\t${u.role}\t${pw}`);
    }
    lines.push(
      `INSERT INTO user_credentials (user_id, password_hash, banned) VALUES (${sqlString(u.id)}, ${sqlString(hashPassword(pw))}, ${banned.get(u.id) ? 1 : 0});`
    );
  }
  writeFileSync(SQL_FILE, lines.join("\n") + "\n");
  writeFileSync(PW_FILE, ["# username\trole\ttemporary password — share privately, then delete this file", ...temp].join("\n") + "\n");
  console.log(`✓ Wrote ${SQL_FILE.pathname} (${lines.length} statements)`);
  console.log(`✓ ${temp.length} temporary password(s) in ${PW_FILE.pathname}`);
  if (!known.admin || !known.superadmin) console.log("  note: ADMIN_PASSWORD / SUPER_ADMIN_PASSWORD not set — admins got temporary passwords too.");
  console.log("\nApply with: npx wrangler d1 execute iqraspace-learning --remote --file .migration/d1-import.sql\n");
}

if (mode === "check") await check();
else if (mode === "export") await exportAll();
else if (mode === "sql") buildSql();
else fail("usage: node --env-file=.env.local scripts/migrate-from-supabase.mjs <check|export|sql>");
