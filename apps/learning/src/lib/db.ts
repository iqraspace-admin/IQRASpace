// Browser client for the Learning API (worker/api, served at /learning/api;
// Cloudflare D1 + R2 + Durable Objects). Query-builder call shapes —
// db.from("t").select().eq().order()..., db.rpc(), db.channel() — compiled
// server-side by worker/api/query.js; it implements the subset this app uses.
//
// Access control lives entirely in the Worker (worker/api/policies.js).
// Nothing here is trusted: the browser just describes a query.
//
// Rows are untyped (`any`); call sites cast to the hand-written types in
// ./types.ts.
/* eslint-disable @typescript-eslint/no-explicit-any */

// A basePath build (build:cf -> /learning) always uses the same-origin API,
// so a dev-only NEXT_PUBLIC_API_URL in .env.local can never leak into a
// production bundle. `next dev` (no basePath) uses NEXT_PUBLIC_API_URL —
// normally `wrangler dev` at http://localhost:8787/learning/api.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const API_BASE = (BASE_PATH ? `${BASE_PATH}/api` : process.env.NEXT_PUBLIC_API_URL || "/learning/api").replace(/\/+$/, "");
const TOKEN_KEY = "iqraspace.learning.session";

// ------------------------------------------------------------------ session token

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // private mode / storage blocked: the session just won't survive a reload
  }
}

/** API error with Postgres-style codes (42501 permission, 23505 duplicate, 23503 still referenced, 23514 check). */
export class DbError extends Error {
  code?: string;
  details: string | null;
  hint: string | null;
  constructor(e: { message: string; code?: string; details?: string | null; hint?: string | null }) {
    super(e.message);
    this.name = "DbError";
    this.code = e.code;
    this.details = e.details ?? null;
    this.hint = e.hint ?? null;
  }
}
export type DbResponse<T = any> = { data: T; error: DbError | null; count: number | null; status: number };

export const apiUrl = (path: string) => `${API_BASE}${path}`;

/** fetch() against the API with the session token attached. */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = readToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && typeof init.body === "string" && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const res = await fetch(apiUrl(path), { ...init, headers });
  if (res.status === 401 && token) {
    // Session expired, revoked or account deactivated.
    writeToken(null);
    emit("SIGNED_OUT", null);
  }
  return res;
}

async function postJson<T>(path: string, body: unknown): Promise<{ status: number; body: T | null; error: DbError | null }> {
  try {
    const res = await apiFetch(path, { method: "POST", body: JSON.stringify(body ?? {}) });
    let parsed: any = null;
    try {
      parsed = await res.json();
    } catch {
      parsed = null;
    }
    const error: DbError | null =
      parsed?.error && typeof parsed.error === "object"
        ? new DbError(parsed.error)
        : !res.ok
          ? new DbError({ message: typeof parsed?.error === "string" ? parsed.error : `Request failed (HTTP ${res.status})` })
          : null;
    return { status: res.status, body: parsed, error };
  } catch (e) {
    return { status: 0, body: null, error: new DbError({ message: e instanceof Error ? e.message : "Failed to fetch" }) };
  }
}

// ------------------------------------------------------------------ auth

export type AuthUser = {
  id: string;
  username: string;
  email: string | null;
  phone: string | null;
  full_name: string;
  role: "tutor" | "student" | "guardian" | "admin" | "super_admin";
  created_at: string;
};
export type Session = { access_token: string; user: AuthUser };
type AuthEvent = "SIGNED_IN" | "SIGNED_OUT";
type AuthListener = (event: AuthEvent, session: Session | null) => void;

const listeners = new Set<AuthListener>();
function emit(event: AuthEvent, session: Session | null) {
  for (const l of listeners) l(event, session);
}

const auth = {
  /** The stored session validated against the server (null if none / expired / deactivated). */
  async getSession(): Promise<Session | null> {
    const token = readToken();
    if (!token) return null;
    try {
      const res = await apiFetch("/auth/session");
      if (!res.ok) return null;
      const body = (await res.json()) as { user: AuthUser | null };
      if (!body.user) {
        writeToken(null);
        return null;
      }
      return { access_token: token, user: body.user };
    } catch {
      return null;
    }
  },

  async signIn(username: string, password: string): Promise<{ session: Session | null; error: DbError | null }> {
    const r = await postJson<{ token: string; user: AuthUser }>("/auth/login", { username, password });
    if (r.error || !r.body?.token) return { session: null, error: r.error ?? new DbError({ message: "Login failed" }) };
    writeToken(r.body.token);
    const session = { access_token: r.body.token, user: r.body.user };
    emit("SIGNED_IN", session);
    return { session, error: null };
  },

  async signUp(input: {
    username: string;
    password: string;
    full_name: string;
    role: string;
    email?: string | null;
  }): Promise<{ session: Session | null; error: DbError | null }> {
    const r = await postJson<{ token: string; user: AuthUser }>("/auth/signup", input);
    if (r.error || !r.body?.token) return { session: null, error: r.error ?? new DbError({ message: "Sign-up failed" }) };
    writeToken(r.body.token);
    const session = { access_token: r.body.token, user: r.body.user };
    emit("SIGNED_IN", session);
    return { session, error: null };
  },

  async signOut(): Promise<void> {
    if (readToken()) await postJson("/auth/logout", {});
    writeToken(null);
    emit("SIGNED_OUT", null);
  },

  onAuthStateChange(cb: AuthListener) {
    listeners.add(cb);
    return { data: { subscription: { unsubscribe: () => listeners.delete(cb) } } };
  },
};

// ------------------------------------------------------------------ query builder

type Filter =
  | { type: "filter" | "not"; column: string; op: string; value: unknown }
  | { type: "or"; expr: string; foreignTable?: string };

type QueryState = {
  table: string;
  action: "select" | "insert" | "upsert" | "update" | "delete";
  select?: string | null;
  filters: Filter[];
  order: { column: string; ascending?: boolean; nullsFirst?: boolean; foreignTable?: string }[];
  limit?: number;
  offset?: number;
  count?: "exact" | null;
  head?: boolean;
  values?: unknown;
  onConflict?: string;
  ignoreDuplicates?: boolean;
};

/** Thenable query builder; resolves to { data, error, count, status }. */
export class QueryBuilder<T = any[]> implements PromiseLike<DbResponse<T>> {
  private q: QueryState;
  private mode: "many" | "single" | "maybeSingle" = "many";

  constructor(table: string) {
    this.q = { table, action: "select", select: "*", filters: [], order: [] };
  }

  select(columns = "*", opts: { count?: "exact" | "planned" | "estimated"; head?: boolean } = {}): QueryBuilder<T> {
    // On a write, select() means "return the written rows" (RETURNING).
    this.q.select = columns;
    if (opts.count) this.q.count = "exact";
    if (opts.head) this.q.head = true;
    return this;
  }
  insert(values: unknown): QueryBuilder<T> {
    this.q = { ...this.q, action: "insert", values, select: null };
    return this;
  }
  upsert(values: unknown, opts: { onConflict?: string; ignoreDuplicates?: boolean } = {}): QueryBuilder<T> {
    this.q = { ...this.q, action: "upsert", values, select: null, onConflict: opts.onConflict ?? "", ignoreDuplicates: opts.ignoreDuplicates };
    return this;
  }
  update(values: unknown): QueryBuilder<T> {
    this.q = { ...this.q, action: "update", values, select: null };
    return this;
  }
  delete(): QueryBuilder<T> {
    this.q = { ...this.q, action: "delete", select: null };
    return this;
  }

  private f(column: string, op: string, value: unknown, type: "filter" | "not" = "filter") {
    this.q.filters.push({ type, column, op, value });
    return this;
  }
  eq(column: string, value: unknown) {
    return this.f(column, "eq", value);
  }
  neq(column: string, value: unknown) {
    return this.f(column, "neq", value);
  }
  gt(column: string, value: unknown) {
    return this.f(column, "gt", value);
  }
  gte(column: string, value: unknown) {
    return this.f(column, "gte", value);
  }
  lt(column: string, value: unknown) {
    return this.f(column, "lt", value);
  }
  lte(column: string, value: unknown) {
    return this.f(column, "lte", value);
  }
  like(column: string, pattern: string) {
    return this.f(column, "like", pattern);
  }
  ilike(column: string, pattern: string) {
    return this.f(column, "ilike", pattern);
  }
  in(column: string, values: readonly unknown[]) {
    return this.f(column, "in", [...values]);
  }
  is(column: string, value: null | boolean) {
    return this.f(column, "is", value);
  }
  not(column: string, op: string, value: unknown) {
    return this.f(column, op, value, "not");
  }
  filter(column: string, op: string, value: unknown) {
    return this.f(column, op, value);
  }
  match(query: Record<string, unknown>) {
    for (const [k, v] of Object.entries(query)) this.f(k, "eq", v);
    return this;
  }
  or(expr: string, opts: { foreignTable?: string } = {}) {
    this.q.filters.push({ type: "or", expr, foreignTable: opts.foreignTable });
    return this;
  }
  order(column: string, opts: { ascending?: boolean; nullsFirst?: boolean; foreignTable?: string } = {}) {
    this.q.order.push({ column, ...opts });
    return this;
  }
  limit(n: number) {
    this.q.limit = n;
    return this;
  }
  range(from: number, to: number) {
    this.q.offset = from;
    this.q.limit = to - from + 1;
    return this;
  }
  single<R = any>(): QueryBuilder<R> {
    this.mode = "single";
    return this as unknown as QueryBuilder<R>;
  }
  maybeSingle<R = any>(): QueryBuilder<R> {
    this.mode = "maybeSingle";
    return this as unknown as QueryBuilder<R>;
  }

  private async execute(): Promise<DbResponse<T>> {
    const r = await postJson<{ data: any; count: number | null }>("/db", this.q);
    if (r.error) return { data: null as T, error: r.error, count: null, status: r.status };
    let data = r.body?.data ?? null;
    const count = r.body?.count ?? null;
    if (this.mode !== "many" && Array.isArray(data)) {
      if (data.length > 1 || (data.length === 0 && this.mode === "single")) {
        return {
          data: null as T,
          error: new DbError({ code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned" }),
          count,
          status: 406,
        };
      }
      data = data[0] ?? null;
    }
    return { data: data as T, error: null, count, status: r.status };
  }

  then<R1 = DbResponse<T>, R2 = never>(
    onfulfilled?: ((value: DbResponse<T>) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null
  ): PromiseLike<R1 | R2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

// ------------------------------------------------------------------ realtime

type PresenceState<P> = Record<string, P[]>;
type ChannelStatus = "SUBSCRIBED" | "CLOSED" | "CHANNEL_ERROR";

/** One lesson's live channel (Teach -> Share), over the LessonRoom Durable Object. */
export class LessonChannel {
  private ws: WebSocket | null = null;
  private closedByUs = false;
  private retry = 0;
  private ping: ReturnType<typeof setInterval> | null = null;
  private trackPayload: unknown = null;
  private state: PresenceState<any> = {};
  private handlers: { type: "broadcast" | "presence"; event: string; cb: (msg: any) => void }[] = [];
  private statusCb: ((status: ChannelStatus) => void) | null = null;

  constructor(private lessonId: string) {}

  on(type: "broadcast" | "presence", filter: { event: string }, cb: (msg: any) => void) {
    this.handlers.push({ type, event: filter.event, cb });
    return this;
  }

  subscribe(cb?: (status: ChannelStatus) => void) {
    this.statusCb = cb ?? null;
    this.connect();
    return this;
  }

  private url() {
    const token = readToken() ?? "";
    const base = /^https?:\/\//.test(API_BASE) ? API_BASE : `${location.origin}${API_BASE}`;
    return `${base.replace(/^http/, "ws")}/realtime/${encodeURIComponent(this.lessonId)}?token=${encodeURIComponent(token)}`;
  }

  private connect() {
    if (this.closedByUs) return;
    const ws = new WebSocket(this.url());
    this.ws = ws;
    ws.onopen = () => {
      this.retry = 0;
      if (this.trackPayload) ws.send(JSON.stringify({ type: "track", payload: this.trackPayload }));
      this.ping = setInterval(() => ws.readyState === WebSocket.OPEN && ws.send('{"type":"ping"}'), 30_000);
      this.statusCb?.("SUBSCRIBED");
    };
    ws.onmessage = (ev) => {
      let msg: any;
      try {
        msg = JSON.parse(String(ev.data));
      } catch {
        return;
      }
      if (msg.type === "broadcast") {
        for (const h of this.handlers) if (h.type === "broadcast" && h.event === msg.event) h.cb({ event: msg.event, payload: msg.payload });
      } else if (msg.type === "presence") {
        this.state = msg.state ?? {};
        for (const h of this.handlers) if (h.type === "presence" && h.event === "sync") h.cb({});
      }
    };
    ws.onclose = () => {
      if (this.ping) clearInterval(this.ping);
      this.ping = null;
      if (this.closedByUs) {
        this.statusCb?.("CLOSED");
        return;
      }
      this.statusCb?.("CHANNEL_ERROR");
      const delay = Math.min(10_000, 1000 * 2 ** this.retry++);
      setTimeout(() => this.connect(), delay);
    };
  }

  async send(msg: { type: "broadcast"; event: string; payload: unknown }): Promise<"ok" | "error"> {
    if (this.ws?.readyState !== WebSocket.OPEN) return "error";
    this.ws.send(JSON.stringify(msg));
    return "ok";
  }

  async track(payload: unknown): Promise<"ok" | "error"> {
    this.trackPayload = payload;
    return this.send({ type: "track", payload } as never);
  }

  presenceState<P = unknown>(): PresenceState<P> {
    return this.state as PresenceState<P>;
  }

  unsubscribe() {
    this.closedByUs = true;
    if (this.ping) clearInterval(this.ping);
    this.ws?.close(1000);
    this.ws = null;
  }
}

// ------------------------------------------------------------------ public client

export const db = {
  from<T = any[]>(table: string) {
    return new QueryBuilder<T>(table);
  },
  async rpc<T = any>(name: string, args: Record<string, unknown> = {}): Promise<DbResponse<T>> {
    const r = await postJson<{ data: T }>(`/rpc/${name}`, args);
    return { data: (r.body?.data ?? null) as T, error: r.error, count: null, status: r.status };
  },
  auth,
  /** `lesson:<id>` -> that lesson's live channel. */
  channel(name: string) {
    return new LessonChannel(name.replace(/^lesson:/, ""));
  },
  removeChannel(channel: LessonChannel) {
    channel.unsubscribe();
  },
};
