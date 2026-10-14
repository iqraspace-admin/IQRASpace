// End-to-end tests for the Learning API against real SQLite (node:sqlite)
// with the D1 migrations applied: query compiler, access policies, write
// hooks/audit, RPCs, auth. Run: npm run test:worker
import { test } from "node:test";
import assert from "node:assert/strict";
import { createTestDb, seed, ids, ctxFor } from "./testdb.mjs";
import { runQuery } from "./db.js";
import { runRpc } from "./rpc.js";
import { parseLogic, parseSelect } from "./query.js";
import { TABLES } from "./schema.js";
import { hashPassword, verifyPassword, login, signup, sessionContext, createAccount } from "./auth.js";
import { adminUsers } from "./adminUsers.js";
import { getDuaContent, duaContentVersion } from "./duas.js";
import { storageAction, storageUpload } from "./storage.js";

const admin = ctxFor(ids.admin, "admin");
const tutorA = ctxFor(ids.tutorA, "tutor");
const tutorB = ctxFor(ids.tutorB, "tutor");
const student1 = ctxFor(ids.student1, "student");

function setup() {
  const t = createTestDb();
  seed(t.db);
  return t;
}

const sel = (table, extra = {}) => ({ table, action: "select", select: "*", ...extra });
const eq = (column, value) => ({ type: "filter", column, op: "eq", value });

test("schema.js matches the D1 migration", () => {
  const { db } = createTestDb();
  for (const [table, def] of Object.entries(TABLES)) {
    const cols = db
      .prepare(`PRAGMA table_info(${table})`)
      .all()
      .map((c) => c.name)
      .filter((c) => !def.serverOnly?.includes(c));
    assert.deepEqual([...cols].sort(), Object.keys(def.columns).sort(), `columns of ${table}`);
  }
});

test("parsers", () => {
  assert.deepEqual(parseSelect("id, duas(status)"), [
    { kind: "col", name: "id" },
    { kind: "embed", rel: "duas", inner: false, children: [{ kind: "col", name: "status" }] },
  ]);
  const tree = parseLogic('title.ilike."%a,b%",and(entity.eq.dua,entity_id.like.x:*)');
  assert.equal(tree.items[0].value, "%a,b%");
  assert.equal(tree.items[1].op, "and");
  assert.equal(tree.items[1].items[1].value, "x:%");
  assert.throws(() => parseSelect("id;drop"), /invalid/);
});

test("identifiers are validated, never interpolated", async () => {
  const { exec } = setup();
  await assert.rejects(runQuery(sel("users", { select: 'id,"x"' }), admin, exec));
  await assert.rejects(runQuery(sel("user_credentials"), admin, exec), /does not exist/);
  await assert.rejects(runQuery(sel("sessions"), admin, exec), /does not exist/);
  await assert.rejects(runQuery(sel("users", { filters: [eq("password", "x")] }), admin, exec), /does not exist/);
  await assert.rejects(runQuery(sel("users", { order: [{ column: "id; DROP TABLE users" }] }), admin, exec), /does not exist/);
});

test("select policies: tutors see their own classes, students their memberships, admin all", async () => {
  const { exec } = setup();
  const names = async (ctx) => (await runQuery(sel("classes"), ctx, exec)).data.map((r) => r.name).sort();
  assert.deepEqual(await names(admin), ["Class A", "Class B"]);
  assert.deepEqual(await names(tutorA), ["Class A"]);
  assert.deepEqual(await names(tutorB), ["Class B"]);
  assert.deepEqual(await names(student1), ["Class A"]);

  // users: own row + students of my classes
  const visible = (await runQuery(sel("users"), tutorA, exec)).data.map((r) => r.username).sort();
  assert.deepEqual(visible, ["student1", "tutora"]);
  const forStudent = (await runQuery(sel("users"), student1, exec)).data.map((r) => r.username);
  assert.deepEqual(forStudent, ["student1"]);
});

test("count + head, order, range, booleans", async () => {
  const { exec } = setup();
  const r = await runQuery({ table: "users", action: "select", select: "id", count: "exact", head: true }, admin, exec);
  assert.equal(r.count, 5);
  assert.equal(r.data, null);
  const page = await runQuery(sel("users", { order: [{ column: "username", ascending: false }], limit: 2, offset: 1 }), admin, exec);
  assert.deepEqual(page.data.map((u) => u.username), ["tutora", "student2"]);
  const tutors = await runQuery(sel("tutors", { filters: [eq("email_reminders_enabled", true)] }), admin, exec);
  assert.equal(tutors.data.length, 2);
  assert.equal(tutors.data[0].email_reminders_enabled, true);
});

test("insert WITH CHECK: a tutor cannot create a class for another tutor", async () => {
  const { exec } = setup();
  await assert.rejects(
    runQuery({ table: "classes", action: "insert", values: { tutor_id: ids.tutorB, name: "Sneaky" } }, tutorA, exec),
    (e) => e.code === "42501"
  );
  const ok = await runQuery({ table: "classes", action: "insert", values: { tutor_id: ids.tutorA, name: "Mine" }, select: "id,name" }, tutorA, exec);
  assert.equal(ok.data[0].name, "Mine");
  assert.match(ok.data[0].id, /^[0-9a-f-]{36}$/);
});

test("update USING + CHECK", async () => {
  const { exec } = setup();
  // tutorA cannot touch tutorB's lesson: 0 rows
  const none = await runQuery(
    { table: "lessons", action: "update", values: { title: "x" }, filters: [eq("id", ids.lessonB)], select: "id" },
    tutorA,
    exec
  );
  assert.deepEqual(none.data, []);
  // nor hand their own lesson to tutorB
  await assert.rejects(
    runQuery({ table: "lessons", action: "update", values: { tutor_id: ids.tutorB }, filters: [eq("id", ids.lessonA)] }, tutorA, exec),
    (e) => e.code === "42501"
  );
  const ok = await runQuery(
    { table: "lessons", action: "update", values: { title: "Renamed" }, filters: [eq("id", ids.lessonA)], select: "title" },
    tutorA,
    exec
  );
  assert.deepEqual(ok.data, [{ title: "Renamed" }]);
});

test("users.role is only changed through set_user_role", async () => {
  const { exec } = setup();
  await assert.rejects(
    runQuery({ table: "users", action: "update", values: { role: "admin" }, filters: [eq("id", ids.tutorA)] }, tutorA, exec),
    (e) => e.code === "42501"
  );
  await assert.rejects(runRpc("set_user_role", { p_user_id: ids.tutorA, p_new_role: "admin" }, tutorA, exec), /Not authorized/);
  await assert.rejects(runRpc("set_user_role", { p_user_id: ids.admin, p_new_role: "tutor" }, admin, exec), /own admin/);
  await runRpc("set_user_role", { p_user_id: ids.student2, p_new_role: "tutor" }, admin, exec);
  const [row] = (await runQuery(sel("users", { filters: [eq("id", ids.student2)] }), admin, exec)).data;
  assert.equal(row.role, "tutor");
});

test("upsert with onConflict (attendance)", async () => {
  const { exec } = setup();
  const up = (status) =>
    runQuery(
      { table: "attendance", action: "upsert", values: { lesson_id: ids.lessonA, student_id: ids.student1, status }, onConflict: "lesson_id,student_id" },
      tutorA,
      exec
    );
  await up("present");
  await up("late");
  const rows = (await runQuery(sel("attendance"), tutorA, exec)).data;
  assert.equal(rows.length, 1);
  assert.equal(rows[0].status, "late");
  // tutorB may not mark attendance on tutorA's lesson
  await assert.rejects(
    runQuery({ table: "attendance", action: "upsert", values: { lesson_id: ids.lessonA, student_id: ids.student1, status: "absent" }, onConflict: "lesson_id,student_id" }, tutorB, exec),
    (e) => e.code === "42501"
  );
});

test("add_student_to_class + progress seeding trigger", async () => {
  const { db, exec } = setup();
  const plan = crypto.randomUUID();
  db.prepare("INSERT INTO lesson_plans (id, name) VALUES (?, 'Qaida')").run(plan);
  db.prepare("INSERT INTO lesson_plan_items (id, lesson_plan_id, sequence, title) VALUES (?, ?, 1, 'L1')").run(crypto.randomUUID(), plan);
  await runQuery({ table: "class_lesson_plans", action: "insert", values: { class_id: ids.classA, lesson_plan_id: plan } }, tutorA, exec);
  await assert.rejects(runRpc("add_student_to_class", { p_class_id: ids.classA, p_student_username: "student2" }, tutorB, exec), /Not authorized/);
  await runRpc("add_student_to_class", { p_class_id: ids.classA, p_student_username: "student2" }, tutorA, exec);
  const progress = db.prepare("SELECT student_id FROM student_lesson_progress ORDER BY student_id").all().map((r) => r.student_id);
  assert.deepEqual(progress, [ids.student1, ids.student2]);
});

test("notifications: only via notify_user; owners read their own", async () => {
  const { exec } = setup();
  await assert.rejects(
    runQuery({ table: "notifications", action: "insert", values: { user_id: ids.student1, type: "system", title: "x" } }, tutorA, exec),
    (e) => e.code === "42501"
  );
  await runRpc("notify_user", { p_user_id: ids.student1, p_type: "system", p_title: "Hi" }, tutorA, exec);
  await assert.rejects(runRpc("notify_user", { p_user_id: ids.student2, p_type: "system", p_title: "Hi" }, tutorA, exec), /Not authorized/);
  const mine = (await runQuery(sel("notifications"), student1, exec)).data;
  assert.equal(mine.length, 1);
  assert.equal(mine[0].read, false);
  assert.equal((await runQuery(sel("notifications"), tutorA, exec)).data.length, 0);
});

test("duas: admin-only, hooks, embeds, or() search, audit log, public feed", async () => {
  const { exec } = setup();
  const cat = await runQuery({ table: "dua_categories", action: "insert", values: { slug: "morning", name: "Morning" }, select: "id" }, admin, exec);
  const catId = cat.data[0].id;
  await assert.rejects(runQuery({ table: "dua_categories", action: "insert", values: { slug: "x", name: "X" } }, tutorA, exec), (e) => e.code === "42501");
  await assert.rejects(runQuery({ table: "duas", action: "insert", values: { slug: "Bad Slug", title: "t" } }, admin, exec), (e) => e.code === "23514");

  const dua = await runQuery(
    { table: "duas", action: "insert", values: { slug: "ayat-al-kursi", title: "Ayat al-Kursi", arabic: "اللَّهُ لَا إِلَٰهَ", quran_refs: [{ surah: 2, ayah_from: 255, ayah_to: 255 }] }, select: "id" },
    admin,
    exec
  );
  const duaId = dua.data[0].id;
  const [row] = (await runQuery(sel("duas", { filters: [eq("id", duaId)] }), admin, exec)).data;
  assert.equal(row.created_by, ids.admin);
  assert.equal(row.arabic_normalized, "اللهلااله");
  assert.deepEqual(row.quran_refs, [{ surah: 2, ayah_from: 255, ayah_to: 255 }]);
  assert.deepEqual(row.wyn_ids, []);

  // publishing needs a translation (CHECK) and then stamps published_at
  await assert.rejects(
    runQuery({ table: "duas", action: "update", values: { status: "published" }, filters: [eq("id", duaId)] }, admin, exec),
    (e) => e.code === "23514" && /published_needs_translation/.test(e.message)
  );
  await runQuery({ table: "duas", action: "update", values: { status: "published", translation_en: "Allah" }, filters: [eq("id", duaId)] }, admin, exec);
  const [pub] = (await runQuery(sel("duas", { filters: [eq("id", duaId)] }), admin, exec)).data;
  assert.ok(pub.published_at);

  // optimistic concurrency on updated_at
  const stale = await runQuery(
    { table: "duas", action: "update", values: { title: "x" }, filters: [eq("id", duaId), eq("updated_at", "2000-01-01T00:00:00.000Z")], select: "id" },
    admin,
    exec
  );
  assert.deepEqual(stale.data, []);

  await runQuery({ table: "dua_category_map", action: "insert", values: { dua_id: duaId, category_id: catId, sort_order: 10 } }, admin, exec);
  const embedded = await runQuery(
    { table: "dua_category_map", action: "select", select: "dua_id,category_id,duas(id,slug,status)", filters: [eq("category_id", catId)] },
    admin,
    exec
  );
  assert.deepEqual(embedded.data[0].duas, { id: duaId, slug: "ayat-al-kursi", status: "published" });

  const inner = await runQuery(
    { table: "duas", action: "select", select: "id,slug,dua_category_map!inner(category_id)", count: "exact", filters: [eq("dua_category_map.category_id", catId)] },
    admin,
    exec
  );
  assert.equal(inner.count, 1);
  assert.deepEqual(inner.data[0].dua_category_map, [{ category_id: catId }]);

  const search = await runQuery(
    { table: "duas", action: "select", select: "id", filters: [{ type: "or", expr: 'title.ilike."%kursi%",slug.ilike."%zzz%"' }] },
    admin,
    exec
  );
  assert.equal(search.data.length, 1);

  // deleting a category that still has Duas -> 23503 naming dua_category_map
  await assert.rejects(
    runQuery({ table: "dua_categories", action: "delete", filters: [eq("id", catId)] }, admin, exec),
    (e) => e.code === "23503" && /dua_category_map/.test(e.message)
  );

  const history = await runQuery(
    { table: "dua_audit_log", action: "select", select: "*", filters: [{ type: "or", expr: `and(entity.eq.dua,entity_id.eq.${duaId}),and(entity.eq.mapping,entity_id.like.${duaId}:*)` }], order: [{ column: "id", ascending: true }] },
    admin,
    exec
  );
  assert.deepEqual(history.data.map((h) => `${h.entity}:${h.action}`), ["dua:insert", "dua:update", "mapping:insert"]);
  assert.ok(history.data[1].changed_fields.includes("status"));
  assert.ok(!history.data[1].changed_fields.includes("updated_at"));
  assert.equal(history.data[1].changed_by, ids.admin);

  const feed = await getDuaContent(exec);
  assert.equal(feed.categories.length, 1);
  assert.equal(feed.categories[0].duas[0].slug, "ayat-al-kursi");
  assert.deepEqual(feed.categories[0].duas[0].quran_refs, [{ surah: 2, ayah_from: 255, ayah_to: 255 }]);
  assert.equal(feed.version, await duaContentVersion(exec));
  assert.equal((await runQuery(sel("dua_audit_log"), tutorA, exec)).data.length, 0);
});

test("auth: hashing, login, signup, sessions, deactivation", async () => {
  const { exec } = setup();
  const h = await hashPassword("secret123");
  assert.ok(await verifyPassword("secret123", h));
  assert.ok(!(await verifyPassword("wrong", h)));

  await createAccount(exec, { username: "newtutor", password: "secret123", fullName: "New Tutor", role: "tutor" });
  await assert.rejects(login({ username: "newtutor", password: "nope" }, exec), /Invalid login/);
  await assert.rejects(login({ username: "ghost", password: "secret123" }, exec), /Invalid login/);
  const { token, user } = await login({ username: "newtutor", password: "secret123" }, exec);
  assert.equal(user.role, "tutor");

  const req = (t) => new Request("https://x/learning/api/db", { headers: { Authorization: `Bearer ${t}` } });
  const ctx = await sessionContext(req(token), exec);
  assert.equal(ctx.uid, user.id);
  assert.equal(await sessionContext(req("bogus"), exec), null);

  // public signup can never create an admin
  const s = await signup({ username: "sneaky", password: "secret123", role: "super_admin" }, exec);
  assert.equal(s.user.role, "student");
  await assert.rejects(signup({ username: "sneaky", password: "secret123" }, exec), /users_username_key/);

  // deactivation kills the session and blocks login
  const r = await adminUsers({ action: "deactivate", userId: user.id }, admin, exec);
  assert.equal(r.body.ok, true);
  assert.equal(await sessionContext(req(token), exec), null);
  await assert.rejects(login({ username: "newtutor", password: "secret123" }, exec), /banned/);
  assert.equal((await adminUsers({ action: "status", userId: user.id }, admin, exec)).body.data.banned, true);
  assert.equal((await adminUsers({ action: "create", username: "x", password: "secret123", role: "admin" }, admin, exec)).body.ok, false);
  assert.equal((await adminUsers({ action: "status", userId: user.id }, tutorA, exec)).status, 403);
});

// ---------------------------------------------------------------- security review regressions

test("admin writes and FALSE-policy filtered reads don't misalign bound parameters", async () => {
  const { exec } = setup();
  const cls = await runQuery({ table: "classes", action: "insert", values: { tutor_id: ids.tutorA, name: "By admin" }, select: "id" }, admin, exec);
  assert.equal(cls.data.length, 1);
  await runQuery({ table: "lessons", action: "update", values: { tutor_id: ids.tutorA, title: "x" }, filters: [eq("id", ids.lessonA)] }, admin, exec);
  await runQuery(
    { table: "attendance", action: "upsert", values: { lesson_id: ids.lessonA, student_id: ids.student1, status: "present" }, onConflict: "lesson_id,student_id" },
    admin,
    exec
  );
  const r = await runQuery(sel("duas", { filters: [eq("slug", "x")] }), student1, exec);
  assert.deepEqual(r.data, []);
});

test("tutors can't point rows at another tutor's class or students", async () => {
  const { exec } = setup();
  const lesson = (values) => runQuery({ table: "lessons", action: "insert", values: { title: "t", lesson_date: "2026-10-14", ...values } }, tutorA, exec);
  await assert.rejects(lesson({ class_id: ids.classB, tutor_id: ids.tutorA, student_id: ids.student2 }), (e) => e.code === "42501");
  await assert.rejects(lesson({ class_id: ids.classA, tutor_id: ids.tutorA, student_id: ids.student2 }), (e) => e.code === "42501");
  await lesson({ class_id: ids.classA, tutor_id: ids.tutorA, student_id: ids.student1 });
  await assert.rejects(
    runQuery({ table: "attendance", action: "insert", values: { lesson_id: ids.lessonA, student_id: ids.student2, status: "present" } }, tutorA, exec),
    (e) => e.code === "42501"
  );
  await assert.rejects(
    runQuery(
      { table: "student_lesson_completions", action: "insert", values: { student_id: ids.student1, lesson_plan_item_id: crypto.randomUUID(), confirmed_by: ids.admin } },
      tutorA,
      exec
    ),
    (e) => e.code === "42501"
  );
});

test("input limits: in() lists, or() depth, odd table names", async () => {
  const { exec } = setup();
  const many = Array.from({ length: 300 }, () => crypto.randomUUID()).concat([ids.tutorA]);
  const r = await runQuery(sel("users", { select: "username", filters: [{ type: "filter", column: "id", op: "in", value: many }] }), admin, exec);
  assert.deepEqual(r.data.map((u) => u.username), ["tutora"]);
  let deep = "id.eq.x";
  for (let i = 0; i < 20; i++) deep = `and(${deep},id.eq.y)`;
  await assert.rejects(runQuery(sel("users", { filters: [{ type: "or", expr: deep }] }), admin, exec), /too deeply/);
  await assert.rejects(runQuery(sel("__proto__"), admin, exec), /does not exist/);
  await assert.rejects(runQuery({ ...sel("constructor"), action: "insert", values: {} }, admin, exec), /does not exist/);
});

test("profile edits validate username and name", async () => {
  const { exec } = setup();
  const upd = (values) => runQuery({ table: "users", action: "update", values, filters: [eq("id", ids.student1)] }, student1, exec);
  await assert.rejects(upd({ username: "Admin  <script>" }), /Username may only contain/);
  await assert.rejects(upd({ full_name: "   " }), /Name is required/);
  await upd({ username: "student_one", full_name: "Student One" });
});

test("login is throttled after repeated failures", async () => {
  const { exec } = setup();
  await createAccount(exec, { username: "victim", password: "secret123", fullName: "V", role: "student" });
  for (let i = 0; i < 10; i++) await assert.rejects(login({ username: "victim", password: "wrong" + i }, exec, "1.2.3.4"), /Invalid login/);
  await assert.rejects(login({ username: "victim", password: "secret123" }, exec, "5.6.7.8"), (e) => e.code === "over_request_rate_limit");
});

test("storage: download links need a reason to see the file; only safe types upload", async () => {
  const { db, exec } = setup();
  const env = { MATERIALS: { put: async () => ({ size: 10 }) } };
  const path = `${ids.tutorA}/1-qaida.pdf`;
  const sign = (ctx) => storageAction({ action: "sign-download", path }, ctx, env, exec);
  assert.equal((await sign(tutorA)).status, 200);
  assert.equal((await sign(admin)).status, 200);
  assert.equal((await sign(student1)).status, 403); // not attached to any of their lessons yet
  db.prepare("INSERT INTO lesson_materials (id, lesson_id, storage_path) VALUES (?, ?, ?)").run(crypto.randomUUID(), ids.lessonA, path);
  assert.equal((await sign(student1)).status, 200);
  assert.equal((await sign(ctxFor(ids.student2, "student"))).status, 403);

  const upload = (type) =>
    storageUpload(
      new Request("https://x/learning/api/storage/upload?filename=a", { method: "PUT", body: "x", headers: { "Content-Type": type } }),
      new URL("https://x/learning/api/storage/upload?filename=a"),
      student1,
      env
    );
  assert.equal((await upload("text/html")).status, 415);
  assert.equal((await upload("image/svg+xml")).status, 415);
  assert.equal((await upload("application/pdf")).status, 200);
});
