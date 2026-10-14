// Provisions the Admin / Super Admin accounts from .env.local into D1.
//
// Why a script and not the signup form: public signup can never create an
// admin/super_admin account (worker/api/auth.js only accepts tutor, student
// and guardian) — deliberately, so the only way in is this trusted path run
// by a developer with wrangler access, never from the browser.
//
// Usage (from apps/learning):
//   npm run seed:admins             local dev database
//   npm run seed:admins -- --remote production database
// Requires ADMIN_PASSWORD and SUPER_ADMIN_PASSWORD in .env.local
// (ADMIN_EMAIL / SUPER_ADMIN_EMAIL are optional contact emails).
//
// Idempotent: re-running it resets the password, re-asserts the role and
// reactivates each account, so it's safe to run again after editing .env.local.
// Usernames are fixed: `admin` and `superadmin`.

import { readFileSync } from "node:fs";
import { executeSql, hashPassword, sqlString } from "./d1.mjs";

// Guards against a real gotcha this project hit twice: this script runs via
// `node --env-file=.env.local`, and Node's --env-file parser truncates a
// value at an unquoted `#` mid-line (ADMIN_PASSWORD=Foo#123 silently becomes
// "Foo") — so the account ends up with a different password than what's
// visibly in the file. Fail loudly instead.
function checkForSilentTruncation(varName) {
  let raw;
  try {
    raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  } catch {
    return;
  }
  const line = raw.split("\n").find((l) => l.trim().startsWith(`${varName}=`));
  if (!line) return;
  const rawValue = line.slice(line.indexOf("=") + 1).trim();
  const isQuoted = /^"(.*)"$/.test(rawValue) || /^'(.*)'$/.test(rawValue);
  if (!isQuoted && rawValue.includes("#")) {
    fail(
      `${varName} in .env.local contains a '#' that got truncated when read ` +
        `(Node's --env-file treats an unquoted '#' as a comment start, mid-line).\n` +
        `  Either remove the '#' from the password, or wrap the whole value in double quotes:\n` +
        `  ${varName}="...#..."`
    );
  }
}

function fail(message) {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

const ACCOUNTS = [
  { role: "admin", username: "admin", fullName: "Admin", email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD },
  {
    role: "super_admin",
    username: "superadmin",
    fullName: "Super Admin",
    email: process.env.SUPER_ADMIN_EMAIL,
    password: process.env.SUPER_ADMIN_PASSWORD,
  },
];

for (const acct of ACCOUNTS) {
  const v = acct.role === "admin" ? "ADMIN_PASSWORD" : "SUPER_ADMIN_PASSWORD";
  if (!acct.password) fail(`Missing ${v} in .env.local.`);
  if (acct.password.length < 6) fail(`${acct.role} password must be at least 6 characters.`);
}
checkForSilentTruncation("ADMIN_PASSWORD");
checkForSilentTruncation("SUPER_ADMIN_PASSWORD");

const statements = [];
for (const a of ACCOUNTS) {
  const u = sqlString(a.username);
  statements.push(
    // email is contact-only and unique; only set it on first creation to avoid clashing with an edited profile
    `INSERT INTO users (id, username, email, full_name, role) VALUES (${sqlString(crypto.randomUUID())}, ${u}, ${sqlString(a.email || null)}, ${sqlString(a.fullName)}, ${sqlString(a.role)})
       ON CONFLICT (username) DO UPDATE SET role = excluded.role;`,
    `INSERT INTO user_credentials (user_id, password_hash, banned) SELECT id, ${sqlString(hashPassword(a.password))}, 0 FROM users WHERE username = ${u}
       ON CONFLICT (user_id) DO UPDATE SET password_hash = excluded.password_hash, banned = 0;`,
    // admins have neither a tutors nor a students row
    `DELETE FROM tutors WHERE id = (SELECT id FROM users WHERE username = ${u});`,
    `DELETE FROM students WHERE id = (SELECT id FROM users WHERE username = ${u});`
  );
}
executeSql(statements.join("\n"));
for (const a of ACCOUNTS) console.log(`  ✓ @${a.username} -> role: ${a.role}`);
console.log("\nDone. Log in at /learning/login with username + the password from .env.local.\n");
