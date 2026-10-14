// Live lesson sync (Teach -> Share screens): broadcast + presence on the
// per-lesson `lesson:{id}` channel.
//
//   GET /learning/api/realtime/<lessonId>?token=<session token>   (WebSocket)
//
// One Durable Object per lesson. The Worker authenticates the caller and
// checks they may see the lesson (its tutor, a student in its class, or an
// admin) before handing the socket to the room. Uses the WebSocket
// Hibernation API, so an idle room costs nothing.
//
// Wire protocol (JSON text frames):
//   client -> room  { type: "broadcast", event, payload }   relay to everyone else
//                   { type: "track", payload }              set this socket's presence
//   room -> client  { type: "broadcast", event, payload }
//                   { type: "presence", state: { [key]: [payload, ...] } }

import { sessionContext } from "./auth.js";
import { json } from "./http.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_FRAME = 16 * 1024;

/** Worker side: authenticate, authorise, then forward the upgrade to the lesson's room. */
export async function realtimeUpgrade(request, url, lessonId, env, exec) {
  if (request.headers.get("Upgrade") !== "websocket") return json({ error: "Expected a WebSocket upgrade" }, 426);
  if (!UUID_RE.test(lessonId)) return json({ error: "Invalid lesson id" }, 400);
  if (!env.LESSON_ROOMS) return json({ error: "Realtime is not configured" }, 503);

  // Browsers can't set headers on a WebSocket, so the token rides in the query string.
  const token = url.searchParams.get("token");
  const authReq = new Request(url, { headers: { Authorization: `Bearer ${token ?? ""}` } });
  const ctx = await sessionContext(authReq, exec);
  if (!ctx) return json({ error: "Invalid session" }, 401);

  const [lesson] = await exec.all(
    `SELECT l.tutor_id = ? AS is_tutor,
            EXISTS (SELECT 1 FROM class_members m WHERE m.class_id = l.class_id AND m.student_id = ?) AS is_member
       FROM lessons l WHERE l.id = ?`,
    [ctx.uid, ctx.uid, lessonId]
  );
  const isTutor = !!lesson && Number(lesson.is_tutor) === 1;
  if (!ctx.isAdmin && !isTutor && !(lesson && Number(lesson.is_member) === 1)) {
    return json({ error: "Not allowed to join this lesson" }, 403);
  }

  const stub = env.LESSON_ROOMS.get(env.LESSON_ROOMS.idFromName(lessonId));
  // Identity, role and broadcast rights come from the session, never the client:
  // only the lesson's tutor (or an admin) drives what students see.
  const fwd = new Request("https://room/connect", {
    headers: {
      Upgrade: "websocket",
      "X-User-Id": ctx.uid,
      "X-User-Role": ctx.role,
      "X-Can-Broadcast": isTutor || ctx.isAdmin ? "1" : "0",
    },
  });
  return stub.fetch(fwd);
}

// Plain class (no `cloudflare:workers` import) so worker/index.js stays
// importable under plain node for worker/routes.test.mjs.
export class LessonRoom {
  constructor(state, env) {
    this.ctx = state;
    this.env = env;
  }

  async fetch(request) {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    const userId = request.headers.get("X-User-Id") ?? "";
    const role = request.headers.get("X-User-Role") ?? "";
    const canBroadcast = request.headers.get("X-Can-Broadcast") === "1";
    // key = per-connection presence key
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ key: crypto.randomUUID(), userId, role, canBroadcast, presence: null });
    return new Response(null, { status: 101, webSocket: client });
  }

  presenceState(exclude) {
    const state = {};
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === exclude) continue;
      const a = ws.deserializeAttachment();
      if (a?.presence) state[a.key] = [a.presence];
    }
    return state;
  }

  broadcastPresence(exclude) {
    const msg = JSON.stringify({ type: "presence", state: this.presenceState(exclude) });
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === exclude) continue;
      try {
        ws.send(msg);
      } catch {
        /* closing socket */
      }
    }
  }

  async webSocketMessage(ws, message) {
    if (typeof message !== "string" || message.length > MAX_FRAME) return;
    let msg;
    try {
      msg = JSON.parse(message);
    } catch {
      return;
    }
    if (msg?.type === "broadcast" && typeof msg.event === "string") {
      if (!ws.deserializeAttachment()?.canBroadcast) return;
      const out = JSON.stringify({ type: "broadcast", event: msg.event, payload: msg.payload ?? null });
      for (const other of this.ctx.getWebSockets()) {
        if (other === ws) continue; // don't echo to the sender
        try {
          other.send(out);
        } catch {
          /* closing socket */
        }
      }
    } else if (msg?.type === "track") {
      const a = ws.deserializeAttachment() ?? {};
      // userId always comes from the authenticated session, never the client payload
      ws.serializeAttachment({ ...a, presence: { ...(msg.payload ?? {}), userId: a.userId, role: a.role } });
      this.broadcastPresence();
    } else if (msg?.type === "ping") {
      ws.send(JSON.stringify({ type: "pong" }));
    }
  }

  async webSocketClose(ws, code) {
    try {
      ws.close(code === 1005 ? 1000 : code, "closed");
    } catch {
      /* already closed */
    }
    this.broadcastPresence(ws);
  }

  async webSocketError(ws) {
    this.broadcastPresence(ws);
  }
}
