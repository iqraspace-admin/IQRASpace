// Test helper: an in-memory SQLite (node:sqlite) with the real D1 migrations
// applied, behind the same executor interface as d1Executor() in http.js.
import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";

const MIGRATIONS = new URL("../../d1/migrations/", import.meta.url);

export function createTestDb() {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON");
  for (const f of readdirSync(MIGRATIONS).filter((n) => n.endsWith(".sql")).sort()) {
    db.exec(readFileSync(new URL(f, MIGRATIONS), "utf8"));
  }
  const norm = (params) => params.map((p) => (p === undefined ? null : p));
  const exec = {
    async all(sql, params = []) {
      return db.prepare(sql).all(...norm(params)).map((r) => ({ ...r }));
    },
    async batch(stmts) {
      db.exec("BEGIN");
      try {
        const out = stmts.map((s) => db.prepare(s.sql).all(...norm(s.params)).map((r) => ({ ...r })));
        db.exec("COMMIT");
        return out;
      } catch (e) {
        db.exec("ROLLBACK");
        throw e;
      }
    },
  };
  return { db, exec };
}

export const ids = {
  admin: "00000000-0000-4000-8000-000000000001",
  tutorA: "00000000-0000-4000-8000-00000000000a",
  tutorB: "00000000-0000-4000-8000-00000000000b",
  student1: "00000000-0000-4000-8000-000000000101",
  student2: "00000000-0000-4000-8000-000000000102",
  classA: "00000000-0000-4000-8000-0000000c000a",
  classB: "00000000-0000-4000-8000-0000000c000b",
  lessonA: "00000000-0000-4000-8000-00000001000a",
  lessonB: "00000000-0000-4000-8000-00000001000b",
};

export const ctxFor = (uid, role) => ({ uid, role, isAdmin: role === "admin" || role === "super_admin" });

/** Two tutors, each with one class and one student; one lesson per class. */
export function seed(db) {
  const u = (id, username, role) =>
    db.prepare("INSERT INTO users (id, username, full_name, role) VALUES (?, ?, ?, ?)").run(id, username, username, role);
  u(ids.admin, "admin", "admin");
  u(ids.tutorA, "tutora", "tutor");
  u(ids.tutorB, "tutorb", "tutor");
  u(ids.student1, "student1", "student");
  u(ids.student2, "student2", "student");
  for (const t of [ids.tutorA, ids.tutorB]) db.prepare("INSERT INTO tutors (id) VALUES (?)").run(t);
  for (const s of [ids.student1, ids.student2]) db.prepare("INSERT INTO students (id) VALUES (?)").run(s);
  db.prepare("INSERT INTO classes (id, tutor_id, name) VALUES (?, ?, ?)").run(ids.classA, ids.tutorA, "Class A");
  db.prepare("INSERT INTO classes (id, tutor_id, name) VALUES (?, ?, ?)").run(ids.classB, ids.tutorB, "Class B");
  db.prepare("INSERT INTO class_members (id, class_id, student_id) VALUES (?, ?, ?)").run(crypto.randomUUID(), ids.classA, ids.student1);
  db.prepare("INSERT INTO class_members (id, class_id, student_id) VALUES (?, ?, ?)").run(crypto.randomUUID(), ids.classB, ids.student2);
  const l = (id, cls, tutor, student) =>
    db
      .prepare("INSERT INTO lessons (id, class_id, tutor_id, student_id, title, lesson_date) VALUES (?, ?, ?, ?, ?, '2026-10-14')")
      .run(id, cls, tutor, student, `Lesson ${id.slice(-1)}`);
  l(ids.lessonA, ids.classA, ids.tutorA, ids.student1);
  l(ids.lessonB, ids.classB, ids.tutorB, ids.student2);
}
