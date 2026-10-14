// POST /learning/api/rpc/<name> — server-side operations the browser calls
// through db.rpc(). Each one does its own authorization check and then runs
// with full database access.

import { QueryError } from "./query.js";
import { seedProgressStatement } from "./hooks.js";
import { runSequential } from "./http.js";

const ROLES = ["tutor", "student", "guardian", "admin", "super_admin"];
const raise = (message, status = 400) => new QueryError(message, "P0001", status);

async function isTutorOfClass(exec, ctx, classId) {
  const [r] = await exec.all(`SELECT 1 AS ok FROM classes WHERE id = ? AND tutor_id = ?`, [classId, ctx.uid]);
  return !!r;
}

async function isTutorOfStudent(exec, ctx, studentId) {
  const [r] = await exec.all(
    `SELECT 1 AS ok FROM class_members cm JOIN classes c ON c.id = cm.class_id WHERE cm.student_id = ? AND c.tutor_id = ? LIMIT 1`,
    [studentId, ctx.uid]
  );
  return !!r;
}

const RPCS = {
  // admin/super_admin may change any role; nobody may drop their own admin access.
  async set_user_role(args, ctx, exec) {
    if (!ctx.isAdmin) throw raise("Not authorized — only admin/super_admin can change roles", 403);
    const { p_user_id, p_new_role } = args;
    if (!ROLES.includes(p_new_role)) throw raise(`Invalid role: ${p_new_role}`);
    if (p_user_id === ctx.uid && !["admin", "super_admin"].includes(p_new_role)) {
      throw raise("Cannot remove your own admin access");
    }
    const rows = await exec.all(`UPDATE users SET role = ? WHERE id = ? RETURNING id`, [p_new_role, p_user_id]);
    if (!rows.length) throw raise("No such user", 404);
    // Give a newly-tutor/student account the role row the rest of the app expects.
    if (p_new_role === "tutor") await exec.all(`INSERT INTO tutors (id) VALUES (?) ON CONFLICT (id) DO NOTHING`, [p_user_id]);
    if (p_new_role === "student") await exec.all(`INSERT INTO students (id) VALUES (?) ON CONFLICT (id) DO NOTHING`, [p_user_id]);
    return null;
  },

  // Tutor of the class (or admin) adds a student by username.
  async add_student_to_class(args, ctx, exec) {
    const { p_class_id, p_student_username } = args;
    if (!(await isTutorOfClass(exec, ctx, p_class_id)) && !ctx.isAdmin) throw raise("Not authorized for this class", 403);
    const [s] = await exec.all(`SELECT id FROM users WHERE username = ? AND role = 'student'`, [p_student_username]);
    if (!s) throw raise("No student account found for that username", 404);
    await exec.all(`INSERT INTO students (id) VALUES (?) ON CONFLICT (id) DO NOTHING`, [s.id]);
    const inserted = await exec.all(
      `INSERT INTO class_members (id, class_id, student_id) VALUES (?, ?, ?) ON CONFLICT (class_id, student_id) DO NOTHING RETURNING id`,
      [crypto.randomUUID(), p_class_id, s.id]
    );
    if (inserted.length) {
      // was the seed_progress_on_member_added trigger
      const [plan] = await exec.all(`SELECT lesson_plan_id FROM class_lesson_plans WHERE class_id = ?`, [p_class_id]);
      if (plan) await runSequential(exec, [seedProgressStatement(p_class_id, plan.lesson_plan_id, s.id)]);
    }
    return null;
  },

  // Notify yourself, a student you tutor, or anyone if admin.
  async notify_user(args, ctx, exec) {
    const { p_user_id, p_type, p_title, p_body = null, p_related_lesson_id = null } = args;
    if (typeof p_type !== "string" || typeof p_title !== "string") throw raise("type and title are required");
    if (p_user_id !== ctx.uid && !ctx.isAdmin && !(await isTutorOfStudent(exec, ctx, p_user_id))) {
      throw raise("Not authorized to notify this user", 403);
    }
    const id = crypto.randomUUID();
    await exec.all(
      `INSERT INTO notifications (id, user_id, type, title, body, related_lesson_id) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, p_user_id, p_type, p_title, p_body, p_related_lesson_id]
    );
    return id;
  },

  // Limited to the class's tutor or an admin.
  async seed_student_lesson_progress(args, ctx, exec) {
    const { p_class_id, p_lesson_plan_id, p_student_id = null } = args;
    if (!(await isTutorOfClass(exec, ctx, p_class_id)) && !ctx.isAdmin) throw raise("Not authorized for this class", 403);
    await runSequential(exec, [seedProgressStatement(p_class_id, p_lesson_plan_id, p_student_id)]);
    return null;
  },
};

export async function runRpc(name, args, ctx, exec) {
  if (!Object.prototype.hasOwnProperty.call(RPCS, name)) {
    throw new QueryError(`function ${name} does not exist`, "PGRST202", 404);
  }
  return RPCS[name](args && typeof args === "object" ? args : {}, ctx, exec);
}
