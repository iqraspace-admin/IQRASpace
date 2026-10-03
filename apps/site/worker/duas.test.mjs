import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleDuas } from './duas.js';

const env = { DUAS_SUPABASE_URL: 'https://x.supabase.co/', DUAS_SUPABASE_ANON_KEY: 'anon' };
const snap = { version: 'v1', categories: [{ slug: 'c', name: 'C', duas: [{ slug: 'd', title: 'T', arabic: 'ا' }] }] };
const okFetch = (body = snap, calls = []) => async (url, init) => { calls.push({ url, init }); return { ok: true, json: async () => body }; };
function memCache() {
  const m = new Map();
  return { match: async (k) => m.get(k.url)?.clone(), put: async (k, v) => { m.set(k.url, v); } };
}

test('calls the get_dua_content RPC with the anon key and returns the snapshot', async () => {
  const calls = [];
  const r = await handleDuas({ method: 'GET', env, fetchImpl: okFetch(snap, calls), now: () => 0 });
  assert.equal(r.status, 200);
  assert.equal(calls[0].url, 'https://x.supabase.co/rest/v1/rpc/get_dua_content');
  assert.equal(calls[0].init.headers.apikey, 'anon');
  assert.equal(r.body.categories[0].duas[0].title, 'T');
});

test('serves from cache within the window, so upstream is hit once', async () => {
  const calls = []; const cache = memCache();
  await handleDuas({ method: 'GET', env, fetchImpl: okFetch(snap, calls), cache });
  const r = await handleDuas({ method: 'GET', env, fetchImpl: okFetch(snap, calls), cache });
  assert.equal(calls.length, 1);
  assert.equal(r.headers['X-Duas-Cache'], 'HIT');
});

test('misconfiguration, upstream failure and bad payload are explicit errors', async () => {
  assert.equal((await handleDuas({ method: 'GET', env: {} })).status, 503);
  assert.equal((await handleDuas({ method: 'GET', env, fetchImpl: async () => ({ ok: false, status: 500 }) })).status, 502);
  assert.equal((await handleDuas({ method: 'GET', env, fetchImpl: async () => { throw new Error('net'); } })).status, 502);
  assert.equal((await handleDuas({ method: 'GET', env, fetchImpl: okFetch({ nope: 1 }) })).status, 502);
  assert.equal((await handleDuas({ method: 'POST', env })).status, 405);
});
