// Row-level access rules. D1 has no row-level security, so
// worker/api/query.js ANDs these predicates into every statement it builds —
// this file IS the app's access control.
//
// Each table has up to four rules, mirroring Postgres semantics:
//   select  USING for SELECT (and for the rows an UPDATE/DELETE may touch is
//           `update` / `delete` below — Postgres uses the same USING clause)
//   insert  WITH CHECK, evaluated against the NEW row's values
//   update  { using, check }: which existing rows may change, and what the
//           row must look like afterwards
//   delete  USING for DELETE
// A rule is (c, ctx) => SQL predicate string. `c(col)` returns the SQL
// expression for a column of the row being checked (an existing row, or a
// bound parameter holding the new value). ctx = { uid, role, isAdmin }.
// Several permissive rules on one table are OR-ed. Admins (ctx.isAdmin) get
// full access to every table except notifications.

export const TRUE = "1";
export const FALSE = "0";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The caller's id as a SQL literal. Only ever a validated uuid (it comes from our own sessions table). */
export function uidLiteral(ctx) {
  if (!ctx?.uid || !UUID_RE.test(ctx.uid)) throw new Error("invalid session user id");
  return `'${ctx.uid}'`;
}

const or = (...parts) => {
  const p = parts.filter((x) => x && x !== FALSE);
  if (p.includes(TRUE)) return TRUE;
  return p.length ? `(${p.join(" OR ")})` : FALSE;
};

// --- helper predicates
const isTutorOfClass = (x, u) => `EXISTS (SELECT 1 FROM classes _c WHERE _c.id = ${x} AND _c.tutor_id = ${u})`;
const isMemberOfClass = (x, u) =>
  `EXISTS (SELECT 1 FROM class_members _m WHERE _m.class_id = ${x} AND _m.student_id = ${u})`;
const isTutorOfStudent = (x, u) =>
  `EXISTS (SELECT 1 FROM class_members _m JOIN classes _c ON _c.id = _m.class_id WHERE _m.student_id = ${x} AND _c.tutor_id = ${u})`;
const isTutorOfLesson = (x, u) => `EXISTS (SELECT 1 FROM lessons _l WHERE _l.id = ${x} AND _l.tutor_id = ${u})`;
const isMemberOfLesson = (x, u) =>
  `EXISTS (SELECT 1 FROM lessons _l JOIN class_members _m ON _m.class_id = _l.class_id WHERE _l.id = ${x} AND _m.student_id = ${u})`;
const isPlanVisibleToStudent = (x, u) =>
  `EXISTS (SELECT 1 FROM class_lesson_plans _p JOIN class_members _m ON _m.class_id = _p.class_id WHERE _p.lesson_plan_id = ${x} AND _m.student_id = ${u})`;
const isStudentInClass = (s, cls) =>
  `EXISTS (SELECT 1 FROM class_members _w WHERE _w.class_id = ${cls} AND _w.student_id = ${s})`;
const isStudentInLessonClass = (s, lesson) =>
  `EXISTS (SELECT 1 FROM lessons _wl JOIN class_members _w ON _w.class_id = _wl.class_id WHERE _wl.id = ${lesson} AND _w.student_id = ${s})`;
const isTutorOfSharingSession = (x, u) =>
  `EXISTS (SELECT 1 FROM sharing_sessions _s WHERE _s.id = ${x} AND ${isTutorOfLesson("_s.lesson_id", u)})`;
const isMemberOfSharingSession = (x, u) =>
  `EXISTS (SELECT 1 FROM sharing_sessions _s WHERE _s.id = ${x} AND ${isMemberOfLesson("_s.lesson_id", u)})`;

/** Same predicate for USING and WITH CHECK (Postgres `FOR ALL USING (p) WITH CHECK (p)`). */
const all = (p) => ({ select: p, insert: p, update: { using: p, check: p }, delete: p });

/**
 * Build a table's rules from: `own` (owner predicate for every operation,
 * may be null), `read` (extra SELECT-only predicate, may be null), `write`
 * (extra predicate the NEW row must also satisfy on insert/update — keeps a
 * tutor from pointing their row at another tutor's class or student), and
 * whether admins get full access.
 */
function rules({ own = null, read = null, write = null, admin = true }) {
  const a = (ctx) => (admin && ctx.isAdmin ? TRUE : FALSE);
  const ownWrite = (c, ctx) => (own ? (write ? `(${own(c, ctx)} AND ${write(c, ctx)})` : own(c, ctx)) : null);
  return {
    select: (c, ctx) => or(a(ctx), own && own(c, ctx), read && read(c, ctx)),
    insert: (c, ctx) => or(a(ctx), ownWrite(c, ctx)),
    update: {
      using: (c, ctx) => or(a(ctx), own && own(c, ctx)),
      check: (c, ctx) => or(a(ctx), ownWrite(c, ctx)),
    },
    delete: (c, ctx) => or(a(ctx), own && own(c, ctx)),
  };
}

const u = uidLiteral;

/** @type {Record<string, any>} */
export const POLICIES = {
  // Own row; students of my classes; admins everything.
  // Inserting users only happens in the auth/admin endpoints (it was the handle_new_user trigger).
  users: {
    select: (c, ctx) =>
      or(
        ctx.isAdmin ? TRUE : FALSE,
        `${c("id")} = ${u(ctx)}`,
        `(${c("role")} = 'student' AND ${isTutorOfStudent(c("id"), u(ctx))})`
      ),
    insert: () => FALSE,
    update: {
      using: (c, ctx) => or(ctx.isAdmin ? TRUE : FALSE, `${c("id")} = ${u(ctx)}`),
      check: (c, ctx) => or(ctx.isAdmin ? TRUE : FALSE, `${c("id")} = ${u(ctx)}`),
    },
    delete: (c, ctx) => (ctx.isAdmin ? TRUE : FALSE),
  },
  // Own row; admins everything.
  tutors: {
    select: (c, ctx) => or(ctx.isAdmin ? TRUE : FALSE, `${c("id")} = ${u(ctx)}`),
    insert: (c, ctx) => (ctx.isAdmin ? TRUE : FALSE),
    update: {
      using: (c, ctx) => or(ctx.isAdmin ? TRUE : FALSE, `${c("id")} = ${u(ctx)}`),
      check: (c, ctx) => or(ctx.isAdmin ? TRUE : FALSE, `${c("id")} = ${u(ctx)}`),
    },
    delete: (c, ctx) => (ctx.isAdmin ? TRUE : FALSE),
  },
  // Own row; their tutors read; admins everything.
  students: {
    select: (c, ctx) =>
      or(ctx.isAdmin ? TRUE : FALSE, `${c("id")} = ${u(ctx)}`, isTutorOfStudent(c("id"), u(ctx))),
    insert: (c, ctx) => (ctx.isAdmin ? TRUE : FALSE),
    update: {
      using: (c, ctx) => or(ctx.isAdmin ? TRUE : FALSE, `${c("id")} = ${u(ctx)}`),
      check: (c, ctx) => or(ctx.isAdmin ? TRUE : FALSE, `${c("id")} = ${u(ctx)}`),
    },
    delete: (c, ctx) => (ctx.isAdmin ? TRUE : FALSE),
  },
  classes: rules({
    own: (c, ctx) => `${c("tutor_id")} = ${u(ctx)}`,
    read: (c, ctx) => isMemberOfClass(c("id"), u(ctx)),
  }),
  class_members: rules({
    own: (c, ctx) => isTutorOfClass(c("class_id"), u(ctx)),
    read: (c, ctx) => `${c("student_id")} = ${u(ctx)}`,
  }),
  lessons: rules({
    own: (c, ctx) => `${c("tutor_id")} = ${u(ctx)}`,
    read: (c, ctx) => isMemberOfClass(c("class_id"), u(ctx)),
    write: (c, ctx) => `(${isTutorOfClass(c("class_id"), u(ctx))} AND ${isStudentInClass(c("student_id"), c("class_id"))})`,
  }),
  google_drive_files: rules({ own: (c, ctx) => `${c("tutor_id")} = ${u(ctx)}` }),
  lesson_materials: rules({
    own: (c, ctx) => isTutorOfLesson(c("lesson_id"), u(ctx)),
    read: (c, ctx) => isMemberOfLesson(c("lesson_id"), u(ctx)),
  }),
  meetings: rules({
    own: (c, ctx) => isTutorOfLesson(c("lesson_id"), u(ctx)),
    read: (c, ctx) => isMemberOfLesson(c("lesson_id"), u(ctx)),
  }),
  attendance: rules({
    own: (c, ctx) => isTutorOfLesson(c("lesson_id"), u(ctx)),
    read: (c, ctx) => `${c("student_id")} = ${u(ctx)}`,
    write: (c) => isStudentInLessonClass(c("student_id"), c("lesson_id")),
  }),
  lesson_progress: rules({
    own: (c, ctx) => isTutorOfLesson(c("lesson_id"), u(ctx)),
    read: (c, ctx) => `${c("student_id")} = ${u(ctx)}`,
    write: (c) => isStudentInLessonClass(c("student_id"), c("lesson_id")),
  }),
  lesson_notes: rules({
    own: (c, ctx) => isTutorOfLesson(c("lesson_id"), u(ctx)),
    read: (c, ctx) => isMemberOfLesson(c("lesson_id"), u(ctx)),
  }),
  sharing_sessions: rules({
    own: (c, ctx) => isTutorOfLesson(c("lesson_id"), u(ctx)),
    read: (c, ctx) => isMemberOfLesson(c("lesson_id"), u(ctx)),
  }),
  highlighted_content: rules({
    own: (c, ctx) => isTutorOfSharingSession(c("sharing_session_id"), u(ctx)),
    read: (c, ctx) => isMemberOfSharingSession(c("sharing_session_id"), u(ctx)),
  }),
  // The lesson library is universal — every tutor reads it, only admins write it;
  // Students read plans assigned to one of their classes.
  lesson_plans: rules({
    read: (c, ctx) => or(ctx.role === "tutor" ? TRUE : FALSE, isPlanVisibleToStudent(c("id"), u(ctx))),
  }),
  lesson_plan_items: rules({
    read: (c, ctx) =>
      or(ctx.role === "tutor" ? TRUE : FALSE, isPlanVisibleToStudent(c("lesson_plan_id"), u(ctx))),
  }),
  class_lesson_plans: rules({
    own: (c, ctx) => isTutorOfClass(c("class_id"), u(ctx)),
    read: (c, ctx) => isMemberOfClass(c("class_id"), u(ctx)),
  }),
  student_lesson_progress: rules({
    own: (c, ctx) => isTutorOfStudent(c("student_id"), u(ctx)),
    read: (c, ctx) => `${c("student_id")} = ${u(ctx)}`,
  }),
  student_lesson_completions: rules({
    own: (c, ctx) => isTutorOfStudent(c("student_id"), u(ctx)),
    read: (c, ctx) => `${c("student_id")} = ${u(ctx)}`,
    write: (c, ctx) => `${c("confirmed_by")} = ${u(ctx)}`,
  }),
  recurring_session_rules: rules({
    own: (c, ctx) => isTutorOfClass(c("class_id"), u(ctx)),
    read: (c, ctx) => isMemberOfClass(c("class_id"), u(ctx)),
    write: (c, ctx) => `(${c("tutor_id")} = ${u(ctx)} AND ${isStudentInClass(c("student_id"), c("class_id"))})`,
  }),
  // Owners read and update their own; inserts only via the notify_user RPC; no admin policy.
  notifications: {
    select: (c, ctx) => `${c("user_id")} = ${u(ctx)}`,
    insert: () => FALSE,
    update: {
      using: (c, ctx) => `${c("user_id")} = ${u(ctx)}`,
      check: (c, ctx) => `${c("user_id")} = ${u(ctx)}`,
    },
    delete: () => FALSE,
  },
  // Duas: admin/super_admin only, for every operation.
  duas: all((c, ctx) => (ctx.isAdmin ? TRUE : FALSE)),
  dua_categories: all((c, ctx) => (ctx.isAdmin ? TRUE : FALSE)),
  dua_category_map: all((c, ctx) => (ctx.isAdmin ? TRUE : FALSE)),
  dua_audit_log: {
    select: (c, ctx) => (ctx.isAdmin ? TRUE : FALSE),
    insert: () => FALSE,
    update: { using: () => FALSE, check: () => FALSE },
    delete: () => FALSE,
  },
};

export function policyFor(table) {
  return Object.prototype.hasOwnProperty.call(POLICIES, table) ? POLICIES[table] : null;
}
