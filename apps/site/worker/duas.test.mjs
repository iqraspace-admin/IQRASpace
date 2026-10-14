import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleDuas } from './duas.js';

const env = { DUAS_SOURCE_URL: 'https://x.example/learning/api/duas/content' };
const snap = { version: 'v1', categories: [{ slug: 'c', name: 'C', duas: [{ slug: 'd', title: 'T', arabic: 'ا' }] }] };
const okFetch = (body = snap, calls = []) => async (url, init) => { calls.push({ url, init }); return { ok: true, json: async () => body }; };
function memCache() {
  const m = new Map();
  return { match: async (k) => m.get(k.url)?.clone(), put: async (k, v) => { m.set(k.url, v); } };
}

test('fetches the Learning feed and returns the snapshot', async () => {
  const calls = [];
  const r = await handleDuas({ method: 'GET', env, fetchImpl: okFetch(snap, calls), now: () => 0 });
  assert.equal(r.status, 200);
  assert.equal(calls[0].url, 'https://x.example/learning/api/duas/content');
  assert.equal(calls[0].init.method, 'GET');
  assert.equal(r.body.categories[0].duas[0].title, 'T');
});

test('prefers the LEARNING service binding when present', async () => {
  const calls = [];
  const LEARNING = { fetch: async (url, init) => { calls.push(url); return { ok: true, json: async () => snap }; } };
  const r = await handleDuas({ method: 'GET', env: { LEARNING } });
  assert.equal(r.status, 200);
  assert.equal(calls[0], 'https://iqraspace.org/learning/api/duas/content');
});

test('serves from cache within the window, so upstream is hit once', async () => {
  const calls = []; const cache = memCache();
  await handleDuas({ method: 'GET', env, fetchImpl: okFetch(snap, calls), cache });
  const r = await handleDuas({ method: 'GET', env, fetchImpl: okFetch(snap, calls), cache });
  assert.equal(calls.length, 1);
  assert.equal(r.headers['X-Duas-Cache'], 'HIT');
});

test('misconfiguration, upstream failure and bad payload are explicit errors', async () => {
  assert.equal((await handleDuas({ method: 'GET', env: { DUAS_SOURCE_URL: 'not a url' } })).status, 503);
  assert.equal((await handleDuas({ method: 'GET', env, fetchImpl: async () => ({ ok: false, status: 500 }) })).status, 502);
  assert.equal((await handleDuas({ method: 'GET', env, fetchImpl: async () => { throw new Error('net'); } })).status, 502);
  assert.equal((await handleDuas({ method: 'GET', env, fetchImpl: okFetch({ nope: 1 }) })).status, 502);
  assert.equal((await handleDuas({ method: 'POST', env })).status, 405);
});
