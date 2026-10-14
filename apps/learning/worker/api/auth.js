// Username + password auth for the Learning app.
//
// - Passwords: PBKDF2-SHA256 via WebCrypto (100k iterations is the Workers
//   runtime maximum), per-user random salt, stored in user_credentials.
// - Sessions: a random 256-bit bearer token handed to the browser; only its
//   SHA-256 is stored (sessions.token_hash), so a database leak doesn't leak
//   live sessions. 30-day sliding expiry.
// - Deactivated accounts (user_credentials.banned) are refused at login and
//   their existing sessions stop working immediately.

import { QueryError } from "./query.js";
import { toApiError } from "./http.js";
import { LIMITS, assertAllowed, hit, clear } from "./throttle.js";

export const PBKDF2_ITERATIONS = 100_000;
export const SESSION_DAYS = 30;
export const MIN_PASSWORD_LENGTH = 6;
const SIGNUP_ROLES = ["tutor", "student", "guardian"];
export const USERNAME_RE = /^[A-Za-z0-9_.-]{1,64}$/;

const enc = new TextEncoder();

function b64(bytes) {
  let s = "";
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s);
}
function unb64(str) {
  const s = atob(str);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}
const b64url = (bytes) => b64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function pbkdf2(password, salt, iterations) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256));
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2-sha256$${PBKDF2_ITERATIONS}$${b64(salt)}$${b64(hash)}`;
}

export async function verifyPassword(password, stored) {
  const parts = String(stored ?? "").split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2-sha256") return false;
  const iterations = Number(parts[1]);
  if (!Number.isInteger(iterations) || iterations < 1 || iterations > PBKDF2_ITERATIONS) return false;
  const expected = unb64(parts[3]);
  const actual = await pbkdf2(password, unb64(parts[2]), iterations);
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}

export async function sha256Hex(text) {
  const d = new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(text)));
  return [...d].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const randomToken = () => b64url(crypto.getRandomValues(new Uint8Array(32)));

const addDays = (days) => new Date(Date.now() + days * 86400_000).toISOString();

export function validatePassword(password) {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    throw new QueryError(`Password should be at least ${MIN_PASSWORD_LENGTH} characters.`, "weak_password");
  }
}

export function validateUsername(username) {
  if (typeof username !== "string" || !USERNAME_RE.test(username)) {
    throw new QueryError("Username may only contain letters, numbers, dots, dashes and underscores.", "invalid_username");
  }
}

/** Create a session for userId; returns the bearer token (only time it exists in clear). */
export async function createSession(exec, userId) {
  const token = randomToken();
  await exec.all(`INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)`, [
    await sha256Hex(token),
    userId,
    addDays(SESSION_DAYS),
  ]);
  return token;
}

export function bearerToken(request) {
  const h = request.headers.get("Authorization") ?? "";
  return h.startsWith("Bearer ") ? h.slice(7).trim() : null;
}

/**
 * Resolve the caller from their bearer token.
 * @returns {Promise<null | {uid:string, role:string, isAdmin:boolean, isSuperAdmin:boolean, tokenHash:string}>}
 */
export async function sessionContext(request, exec) {
  const token = bearerToken(request);
  if (!token || token.length > 200) return null;
  const tokenHash = await sha256Hex(token);
  const [row] = await exec.all(
    `SELECT u.id AS id, u.role AS role, s.expires_at AS expires_at, coalesce(c.banned, 0) AS banned
       FROM sessions s JOIN users u ON u.id = s.user_id
       LEFT JOIN user_credentials c ON c.user_id = u.id
      WHERE s.token_hash = ?`,
    [tokenHash]
  );
  if (!row || Number(row.banned) === 1) return null;
  const expires = Date.parse(row.expires_at);
  if (!(expires > Date.now())) {
    await exec.all(`DELETE FROM sessions WHERE token_hash = ?`, [tokenHash]);
    return null;
  }
  // Sliding expiry, written at most about once every 15 days per session.
  if (expires - Date.now() < (SESSION_DAYS / 2) * 86400_000) {
    await exec.all(`UPDATE sessions SET expires_at = ? WHERE token_hash = ?`, [addDays(SESSION_DAYS), tokenHash]);
  }
  const isAdmin = row.role === "admin" || row.role === "super_admin";
  return { uid: row.id, role: row.role, isAdmin, isSuperAdmin: row.role === "super_admin", tokenHash };
}

async function loadProfile(exec, userId) {
  const [u] = await exec.all(
    `SELECT id, username, email, phone, full_name, role, created_at FROM users WHERE id = ?`,
    [userId]
  );
  return u ?? null;
}

const INVALID_LOGIN = () => new QueryError("Invalid login credentials", "invalid_credentials", 400);

/** POST /auth/login { username, password } */
export async function login(body, exec, ip = "local") {
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!username || !password) throw INVALID_LOGIN();
  const checks = [
    [`login-user:${username.toLowerCase()}`, LIMITS.loginUser],
    [`login-ip:${ip}`, LIMITS.loginIp],
  ];
  await assertAllowed(exec, checks);
  const [row] = await exec.all(
    `SELECT u.id AS id, c.password_hash AS password_hash, c.banned AS banned
       FROM users u JOIN user_credentials c ON c.user_id = u.id WHERE u.username = ?`,
    [username]
  );
  // Always run one PBKDF2 so response time doesn't reveal whether the username exists.
  const ok = await verifyPassword(password, row?.password_hash ?? "pbkdf2-sha256$100000$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=");
  if (!row || !ok) {
    await hit(exec, checks);
    throw INVALID_LOGIN();
  }
  await clear(exec, [checks[0][0]]);
  if (Number(row.banned) === 1) throw new QueryError("User is banned", "user_banned", 403);
  const token = await createSession(exec, row.id);
  return { token, user: await loadProfile(exec, row.id) };
}

/**
 * Create a user + role row + credentials. Shared by public signup and admin
 * user creation.
 */
export async function createAccount(exec, { username, password, fullName, role, email = null, phone = null }) {
  validateUsername(username);
  validatePassword(password);
  const id = crypto.randomUUID();
  const stmts = [
    {
      sql: `INSERT INTO users (id, username, email, phone, full_name, role) VALUES (?, ?, ?, ?, ?, ?)`,
      params: [id, username, email || null, phone || null, fullName || username, role],
    },
    { sql: `INSERT INTO user_credentials (user_id, password_hash) VALUES (?, ?)`, params: [id, await hashPassword(password)] },
  ];
  if (role === "tutor") stmts.push({ sql: `INSERT INTO tutors (id) VALUES (?)`, params: [id] });
  if (role === "student") stmts.push({ sql: `INSERT INTO students (id) VALUES (?)`, params: [id] });
  try {
    await exec.batch(stmts);
  } catch (e) {
    throw toApiError(e, "users"); // e.g. duplicate key ... "users_username_key"
  }
  return id;
}

/** POST /auth/signup { username, password, full_name, role, email } */
export async function signup(body, exec, ip = "local") {
  const checks = [[`signup-ip:${ip}`, LIMITS.signupIp]];
  await assertAllowed(exec, checks);
  await hit(exec, checks);
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  // admin/super_admin can never come from public signup (was handle_new_user's whitelist).
  const role = SIGNUP_ROLES.includes(body?.role) ? body.role : "student";
  const email = typeof body?.email === "string" && body.email.trim() ? body.email.trim() : null;
  const id = await createAccount(exec, {
    username,
    password: body?.password,
    fullName: typeof body?.full_name === "string" && body.full_name.trim() ? body.full_name.trim() : username,
    role,
    email,
  });
  const token = await createSession(exec, id);
  return { token, user: await loadProfile(exec, id) };
}

/** POST /auth/logout */
export async function logout(ctx, exec) {
  if (ctx) await exec.all(`DELETE FROM sessions WHERE token_hash = ?`, [ctx.tokenHash]);
  return { ok: true };
}

/** GET /auth/session */
export async function currentUser(ctx, exec) {
  return { user: ctx ? await loadProfile(exec, ctx.uid) : null };
}

/** Sign out every session of a user (password reset, deactivation). */
export async function revokeSessions(exec, userId) {
  await exec.all(`DELETE FROM sessions WHERE user_id = ?`, [userId]);
}
