// POST /learning/api/admin/users — account management for admin/super_admin.
// Actions: create | status | reset_password | deactivate | reactivate | delete.
// Response shape: { ok, data?, error? }.

import { createAccount, hashPassword, validatePassword, revokeSessions } from "./auth.js";
import { toApiError } from "./http.js";

// admin/super_admin accounts are never created here — see scripts/seed-admin-accounts.mjs.
const CREATABLE_ROLES = ["tutor", "student", "guardian"];

/** @returns {Promise<{status:number, body:any}>} */
export async function adminUsers(body, ctx, exec) {
  const ok = (data) => ({ status: 200, body: data === undefined ? { ok: true } : { ok: true, data } });
  const fail = (error, status = 400) => ({ status, body: { ok: false, error } });

  if (!ctx) return fail("Invalid session.", 401);
  if (!ctx.isAdmin) return fail("Not authorized — admin access required.", 403);

  const action = body?.action;
  const userId = typeof body?.userId === "string" ? body.userId : undefined;
  try {
    switch (action) {
      case "create": {
        const { username, password, role } = body;
        if (!username || !password || !role) return fail("username, password and role are required.");
        if (!CREATABLE_ROLES.includes(role)) {
          return fail("role must be one of: tutor, student, guardian (admin/super_admin are provisioned via npm run seed:admins).");
        }
        const id = await createAccount(exec, {
          username: String(username).trim(),
          password,
          fullName: body.fullName || username,
          role,
          email: body.email?.trim() || null,
          phone: body.phone?.trim() || null,
        });
        return ok({ id });
      }
      case "status": {
        if (!userId) return fail("userId is required.");
        const [r] = await exec.all(`SELECT banned FROM user_credentials WHERE user_id = ?`, [userId]);
        return ok({ banned: Number(r?.banned ?? 0) === 1 });
      }
      case "reset_password": {
        if (!userId || !body.newPassword) return fail("userId and newPassword are required.");
        validatePassword(body.newPassword);
        const rows = await exec.all(
          `UPDATE user_credentials SET password_hash = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE user_id = ? RETURNING user_id`,
          [await hashPassword(body.newPassword), userId]
        );
        if (!rows.length) return fail("User not found.", 404);
        if (userId !== ctx.uid) await revokeSessions(exec, userId);
        return ok();
      }
      case "deactivate":
      case "reactivate": {
        if (!userId) return fail("userId is required.");
        if (userId === ctx.uid) return fail("Cannot deactivate your own account.");
        const rows = await exec.all(`UPDATE user_credentials SET banned = ? WHERE user_id = ? RETURNING user_id`, [
          action === "deactivate" ? 1 : 0,
          userId,
        ]);
        if (!rows.length) return fail("User not found.", 404);
        if (action === "deactivate") await revokeSessions(exec, userId);
        return ok();
      }
      case "delete": {
        if (!userId) return fail("userId is required.");
        if (userId === ctx.uid) return fail("Cannot delete your own account.");
        // credentials, sessions, tutors/students rows cascade from users
        await exec.all(`DELETE FROM users WHERE id = ?`, [userId]);
        return ok();
      }
      default:
        return fail(`Unknown action: ${action}`);
    }
  } catch (e) {
    const err = toApiError(e, "users");
    return fail(err.message, err.status && err.status >= 400 && err.status < 500 ? err.status : 400);
  }
}
