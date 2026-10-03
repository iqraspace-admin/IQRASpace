import { test } from "node:test";
import assert from "node:assert/strict";
import { matchDynamicRoute as m } from "./routes.js";

test("share / teach", () => {
  assert.equal(m("/learning/share/abc-123"), "/learning/share/_");
  assert.equal(m("/learning/teach/0b9f4c1e-1111-2222-3333-444455556666"), "/learning/teach/_");
});

test("admin duas [id] and categories [slug]", () => {
  assert.equal(m("/learning/admin/duas/3f2a"), "/learning/admin/duas/_");
  assert.equal(m("/learning/admin/duas/categories/morning-athkar"), "/learning/admin/duas/categories/_");
});

test("static exceptions are not rewritten", () => {
  for (const p of ["new", "list", "activity", "categories", "categories/new"]) {
    assert.equal(m(`/learning/admin/duas/${p}`), null, p);
    assert.equal(m(`/learning/admin/duas/${p}/`), null, p + "/");
  }
  assert.equal(m("/learning/admin/duas"), null);
});

test("trailing slash", () => {
  assert.equal(m("/learning/share/abc/"), "/learning/share/_");
  assert.equal(m("/learning/admin/duas/categories/x/"), "/learning/admin/duas/categories/_");
});

test("placeholder itself and odd characters", () => {
  assert.equal(m("/learning/share/_"), "/learning/share/_");
  assert.equal(m("/learning/admin/duas/categories/%D8%A7%D9%84%D8%B5%D8%A8%D8%A7%D8%AD"), "/learning/admin/duas/categories/_");
  assert.equal(m("/learning/share/a%20b.c~d"), "/learning/share/_");
  assert.equal(m("/learning/teach/id_with-odd.chars"), "/learning/teach/_");
});

test("base path handling", () => {
  assert.equal(m("/share/abc"), null);
  assert.equal(m("/learningx/share/abc"), null);
  assert.equal(m("/share/abc", ""), "/share/_");
  assert.equal(m("/x/share/abc", "/x"), "/x/share/_");
});

test("non-matching paths fall through", () => {
  for (const p of [
    "/learning", "/learning/", "/learning/login", "/learning/share", "/learning/share/",
    "/learning/teach", "/learning/share/a/b", "/learning/share/abc/__next.share.txt",
    "/learning/admin/duas/abc/extra", "/learning/admin/duas/categories/a/b",
    "/learning/_next/static/chunk.js", "/learning//share/abc", "/learning/dashboard",
  ]) {
    assert.equal(m(p), null, p);
  }
  assert.equal(m(undefined), null);
});

test("worker falls through to ASSETS.fetch(request) for non-matches", async () => {
  const { default: worker } = await import("./index.js");
  const seen = [];
  const env = { ASSETS: { fetch: async (r) => (seen.push(r), new Response("ok")) } };
  const req = new Request("https://iqraspace.org/learning/login");
  await worker.fetch(req, env);
  assert.equal(seen[0], req);
  await worker.fetch(new Request("https://iqraspace.org/learning/share/xyz?a=1"), env);
  assert.equal(new URL(seen[1].url).pathname, "/learning/share/_");
  await worker.fetch(new Request("https://iqraspace.org/learning/share/xyz", { method: "POST", body: "x" }), env);
  assert.equal(new URL(seen[2].url).pathname, "/learning/share/xyz");
});
