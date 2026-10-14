// Brute-force / abuse limits for the public auth endpoints, stored in D1
// (table auth_throttle). Fixed windows; only failures count for login.

import { QueryError } from "./query.js";

export const LIMITS = {
  loginUser: { max: 10, windowSeconds: 15 * 60 }, // failed logins per username
  loginIp: { max: 50, windowSeconds: 15 * 60 }, // failed logins per client IP
  signupIp: { max: 10, windowSeconds: 60 * 60 }, // signups per client IP
};

export const clientIp = (request) => request.headers.get("CF-Connecting-IP") ?? "local";

const tooMany = () => new QueryError("Too many attempts. Please wait a few minutes and try again.", "over_request_rate_limit", 429);

async function current(exec, key, { windowSeconds }) {
  const [row] = await exec.all(`SELECT window_start, count FROM auth_throttle WHERE key = ?`, [key]);
  if (!row || Date.parse(row.window_start) + windowSeconds * 1000 < Date.now()) return 0;
  return Number(row.count);
}

/** Throw 429 if any key is already at its limit. */
export async function assertAllowed(exec, checks) {
  for (const [key, limit] of checks) {
    if ((await current(exec, key, limit)) >= limit.max) throw tooMany();
  }
}

/** Count one event against each key (starting a new window when the old one expired). */
export async function hit(exec, checks) {
  const now = new Date().toISOString();
  for (const [key, { windowSeconds }] of checks) {
    const cutoff = new Date(Date.now() - windowSeconds * 1000).toISOString();
    await exec.all(
      `INSERT INTO auth_throttle (key, window_start, count) VALUES (?, ?, 1)
       ON CONFLICT (key) DO UPDATE SET
         count = CASE WHEN auth_throttle.window_start < ? THEN 1 ELSE auth_throttle.count + 1 END,
         window_start = CASE WHEN auth_throttle.window_start < ? THEN excluded.window_start ELSE auth_throttle.window_start END`,
      [key, now, cutoff, cutoff]
    );
  }
}

export async function clear(exec, keys) {
  for (const key of keys) await exec.all(`DELETE FROM auth_throttle WHERE key = ?`, [key]);
}
