import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleContact, validate, verifyTurnstile } from './contact.js';

const NOW = 1_800_000_000_000;
const good = () => ({ name: ' Ali ', email: 'ali@example.com', subject: 'Hi', message: 'Hello there', startedAt: NOW - 10000 });

function fakeDB({ fail = false } = {}) {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      return { bind: (...params) => ({ run: async () => { if (fail) throw new Error('boom'); calls.push({ sql, params }); return {}; } }) };
    },
  };
}
const okFetch = (success = true) => async () => ({ ok: true, json: async () => ({ success }) });
const run = (over = {}) => handleContact({ method: 'POST', body: good(), remoteIp: '1.2.3.4', now: NOW, uuid: () => 'uuid-1', env: { DB: fakeDB() }, fetchImpl: okFetch(), ...over });

test('valid submission stores trimmed row in D1', async () => {
  const db = fakeDB();
  const r = await run({ env: { DB: db } });
  assert.equal(r.status, 200);
  assert.deepEqual(r.json, { ok: true });
  assert.equal(db.calls.length, 1);
  assert.deepEqual(db.calls[0].params, ['uuid-1', 'Ali', 'ali@example.com', 'Hi', 'Hello there', new Date(NOW).toISOString()]);
});

test('each validation failure', async () => {
  const cases = { name: { name: '' }, email: { email: 'nope' }, subject: { subject: '' }, message: { message: 'x'.repeat(5001) } };
  for (const [key, patch] of Object.entries(cases)) {
    const r = await run({ body: { ...good(), ...patch } });
    assert.equal(r.status, 400, key);
    assert.deepEqual(Object.keys(r.json.errors), [key]);
  }
  assert.equal(validate({ name: 5 }).errors.name, 'Please enter your name.');
});

test('non-object body gives validation errors', async () => {
  const r = await run({ body: null });
  assert.equal(r.status, 400);
  assert.equal(Object.keys(r.json.errors).length, 4);
});

test('honeypot returns fake success without storing', async () => {
  const db = fakeDB();
  const r = await run({ env: { DB: db }, body: { ...good(), company: 'bot' } });
  assert.deepEqual(r, { status: 200, json: { ok: true } });
  assert.equal(db.calls.length, 0);
});

test('too-fast submission returns fake success without storing', async () => {
  const db = fakeDB();
  const r = await run({ env: { DB: db }, body: { ...good(), startedAt: NOW - 500 } });
  assert.equal(r.status, 200);
  assert.equal(db.calls.length, 0);
});

test('turnstile unset: skipped', async () => {
  let called = false;
  const r = await run({ fetchImpl: async () => { called = true; return okFetch()(); } });
  assert.equal(r.status, 200);
  assert.equal(called, false);
});

test('turnstile ok / fail / missing token / unreachable', async () => {
  const env = () => ({ DB: fakeDB(), TURNSTILE_SECRET_KEY: 's' });
  const t = { ...good(), turnstileToken: 'tok' };
  assert.equal((await run({ env: env(), body: t })).status, 200);
  const bad = await run({ env: env(), body: t, fetchImpl: okFetch(false) });
  assert.equal(bad.status, 400);
  assert.ok(bad.json.errors.captcha);
  assert.equal((await run({ env: env(), body: good() })).status, 400);
  const db = fakeDB();
  const down = await run({ env: { DB: db, TURNSTILE_SECRET_KEY: 's' }, body: t, fetchImpl: async () => { throw new Error('net'); } });
  assert.equal(down.status, 400);
  assert.equal(db.calls.length, 0);
});

test('verifyTurnstile sends secret, response and ip', async () => {
  let sent;
  await verifyTurnstile('tok', '9.9.9.9', 'sec', async (u, o) => { sent = { u, b: o.body.toString() }; return { json: async () => ({ success: true }) }; });
  assert.match(sent.u, /siteverify$/);
  assert.equal(sent.b, 'secret=sec&response=tok&remoteip=9.9.9.9');
});

test('D1 failure returns generic 500', async () => {
  const r = await run({ env: { DB: fakeDB({ fail: true }) } });
  assert.equal(r.status, 500);
  assert.equal(r.json.ok, false);
  assert.ok(!JSON.stringify(r.json).includes('boom'));
});

test('missing DB binding returns 500', async () => {
  assert.equal((await run({ env: {} })).status, 500);
});

test('alert sent via Resend when configured; failure ignored', async () => {
  const sent = [];
  const env = { DB: fakeDB(), RESEND_API_KEY: 'k', CONTACT_FROM_EMAIL: 'from@x.org' };
  const r = await run({ env, fetchImpl: async (u, o) => { sent.push({ u, o }); return { ok: true }; } });
  assert.equal(r.status, 200);
  assert.equal(sent.length, 1);
  assert.equal(JSON.parse(sent[0].o.body).to[0], 'iqraspaceorg@gmail.com');
  const waits = [];
  const r2 = await run({ env, fetchImpl: async () => ({ ok: false, status: 500 }), waitUntil: (p) => waits.push(p) });
  await Promise.all(waits);
  assert.equal(r2.status, 200);
  const r3 = await run({ env, fetchImpl: async () => { throw new Error('down'); } });
  assert.equal(r3.status, 200);
});

test('alert skipped silently when unconfigured', async () => {
  let calls = 0;
  await run({ fetchImpl: async () => { calls++; return okFetch()(); } });
  assert.equal(calls, 0);
});

test('non-POST methods get 405 with Allow', async () => {
  for (const m of ['GET', 'PUT', 'DELETE', 'OPTIONS']) {
    const r = await handleContact({ method: m, env: {} });
    assert.equal(r.status, 405);
    assert.equal(r.headers.Allow, 'POST');
  }
});
