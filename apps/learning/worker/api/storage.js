// Lesson material files in the private R2 bucket (binding MATERIALS).
// The Worker talks to R2 through its binding: no S3 keys, no presigned URLs.
//
//   POST /learning/api/storage          { action: list | list-all | delete | sign-download }
//   PUT  /learning/api/storage/upload?filename=...   (body = the file)
//   GET  /learning/api/storage/file?t=<ticket>       (short-lived download link)
//
// Object keys are `learning/{tutorId}/{timestamp}-{filename}`; the API and
// lesson_materials.storage_path use the part after `learning/`.

import { randomToken, sha256Hex } from "./auth.js";
import { CORS_HEADERS } from "./http.js";

const R2_PREFIX = "learning/";
const MAX_FILE_SIZE_BYTES = 52428800; // 50 MiB
const TICKET_TTL_SECONDS = 3600;

// Files are served from the app's own origin, so anything that could execute
// in a browser (HTML, SVG, JS...) must never be stored or rendered inline.
// Lesson materials are PDFs; a few image types are allowed as well.
const ALLOWED_TYPES = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

/** Security headers for every file response (no sniffing, no script execution). */
function fileHeaders(contentType) {
  const h = new Headers(CORS_HEADERS);
  h.set("Content-Type", ALLOWED_TYPES[contentType] ? contentType : "application/octet-stream");
  h.set("X-Content-Type-Options", "nosniff");
  h.set("Content-Security-Policy", "default-src 'none'; sandbox");
  h.set("Cross-Origin-Resource-Policy", "same-origin");
  if (!ALLOWED_TYPES[contentType]) h.set("Content-Disposition", "attachment");
  return h;
}

/**
 * May this caller open the file at `path`? Its owner (own folder), admins,
 * any tutor (the lesson library is shared by all tutors), or a student whose
 * lesson / assigned lesson plan references the file.
 */
async function canRead(ctx, path, exec) {
  if (ctx.isAdmin || ctx.role === "tutor" || path.startsWith(`${ctx.uid}/`)) return true;
  const [row] = await exec.all(
    `SELECT 1 AS ok WHERE EXISTS (
         SELECT 1 FROM lesson_materials lm
           JOIN lessons l ON l.id = lm.lesson_id
           JOIN class_members m ON m.class_id = l.class_id
          WHERE lm.storage_path = ? AND m.student_id = ?)
       OR EXISTS (
         SELECT 1 FROM lesson_plan_items i
           JOIN class_lesson_plans p ON p.lesson_plan_id = i.lesson_plan_id
           JOIN class_members m ON m.class_id = p.class_id
          WHERE i.material_storage_path = ? AND m.student_id = ?)`,
    [path, ctx.uid, path, ctx.uid]
  );
  return !!row;
}

const r2Key = (path) => `${R2_PREFIX}${path}`;

function validPath(path) {
  return typeof path === "string" && path.length > 0 && path.length < 1024 && !path.includes("..") && !path.startsWith("/");
}

async function listPrefix(bucket, prefix) {
  const files = [];
  let cursor;
  do {
    const page = await bucket.list({ prefix, cursor, limit: 1000 });
    for (const obj of page.objects) {
      const path = obj.key.slice(R2_PREFIX.length);
      files.push({ name: path.slice(path.indexOf("/") + 1), path, size: obj.size ?? 0, updatedAt: obj.uploaded?.toISOString?.() ?? "" });
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  files.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return files;
}

/** POST /storage — returns {status, body} with body { ok, data?, error? } (the old broker's shape). */
export async function storageAction(body, ctx, env, exec) {
  const ok = (data) => ({ status: 200, body: { ok: true, data } });
  const fail = (error, status = 400) => ({ status, body: { ok: false, error } });
  if (!ctx) return fail("Invalid session.", 401);
  const bucket = env.MATERIALS;
  if (!bucket) return fail("Lesson file storage is not configured.", 503);

  switch (body?.action) {
    case "list": {
      const tutorId = body.tutorId || ctx.uid;
      if (tutorId !== ctx.uid && !ctx.isAdmin) return fail("Not authorized to list another tutor's materials.", 403);
      if (!validPath(tutorId)) return fail("Invalid tutorId.");
      return ok(await listPrefix(bucket, r2Key(`${tutorId}/`)));
    }
    case "list-all": {
      if (!ctx.isAdmin) return fail("Not authorized — admin access required.", 403);
      return ok(await listPrefix(bucket, R2_PREFIX));
    }
    case "delete": {
      const path = body.path;
      if (!validPath(path)) return fail("path is required.");
      if (!path.startsWith(`${ctx.uid}/`) && !ctx.isAdmin) return fail("Not authorized to delete this file.", 403);
      await bucket.delete(r2Key(path));
      return ok(null);
    }
    case "sign-download": {
      const path = body.path;
      if (!validPath(path)) return fail("path is required.");
      if (!(await canRead(ctx, path, exec))) return fail("Not authorized to open this file.", 403);
      const ticket = randomToken();
      const expires = new Date(Date.now() + TICKET_TTL_SECONDS * 1000).toISOString();
      await exec.batch([
        { sql: `DELETE FROM file_tickets WHERE expires_at < ?`, params: [new Date().toISOString()] },
        { sql: `INSERT INTO file_tickets (token_hash, path, expires_at) VALUES (?, ?, ?)`, params: [await sha256Hex(ticket), path, expires] },
      ]);
      // Relative to the API base; the browser resolves it against its own
      // API URL (production, or wrangler dev on localhost).
      return ok({ downloadPath: `/storage/file?t=${encodeURIComponent(ticket)}` });
    }
    default:
      return fail(`Unknown action: ${body?.action}`);
  }
}

/** PUT /storage/upload?filename=... */
export async function storageUpload(request, url, ctx, env) {
  const fail = (error, status = 400) => ({ status, body: { ok: false, error } });
  if (!ctx) return fail("Invalid session.", 401);
  if (!env.MATERIALS) return fail("Lesson file storage is not configured.", 503);
  const filename = (url.searchParams.get("filename") ?? "").replace(/[/\\]/g, "_").trim();
  if (!filename || filename.length > 200) return fail("filename is required.");
  const size = Number(request.headers.get("Content-Length") ?? "0");
  if (size > MAX_FILE_SIZE_BYTES) return fail("File is larger than 50 MB.", 413);
  if (!request.body) return fail("Empty upload.");
  const contentType = (request.headers.get("Content-Type") || "application/pdf").split(";")[0].trim().toLowerCase();
  if (!ALLOWED_TYPES[contentType]) return fail("Only PDF, PNG, JPEG or WebP files can be uploaded.", 415);
  const path = `${ctx.uid}/${Date.now()}-${filename}`;
  const obj = await env.MATERIALS.put(r2Key(path), request.body, { httpMetadata: { contentType } });
  if (obj && obj.size > MAX_FILE_SIZE_BYTES) {
    await env.MATERIALS.delete(r2Key(path));
    return fail("File is larger than 50 MB.", 413);
  }
  return { status: 200, body: { ok: true, data: { path } } };
}

/** GET /storage/file?t=... — streams the object; the ticket is reusable until it expires (TICKET_TTL_SECONDS). */
export async function storageDownload(request, url, env, exec) {
  const t = url.searchParams.get("t");
  if (!t || t.length > 200 || !env.MATERIALS) return new Response("Not found", { status: 404, headers: CORS_HEADERS });
  const [row] = await exec.all(`SELECT path, expires_at FROM file_tickets WHERE token_hash = ?`, [await sha256Hex(t)]);
  if (!row || !(Date.parse(row.expires_at) > Date.now())) {
    return new Response("Link expired", { status: 410, headers: CORS_HEADERS });
  }
  const range = request.headers.get("Range");
  const obj = await env.MATERIALS.get(r2Key(row.path), range ? { range: request.headers } : undefined);
  if (!obj) return new Response("Not found", { status: 404, headers: CORS_HEADERS });
  // Never replay the stored Content-Type blindly — see fileHeaders().
  const headers = fileHeaders(obj.httpMetadata?.contentType ?? "");
  headers.set("ETag", obj.httpEtag);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", "private, max-age=3600");
  if (range && obj.range) {
    const start = obj.range.offset ?? 0;
    const length = obj.range.length ?? obj.size - start;
    headers.set("Content-Range", `bytes ${start}-${start + length - 1}/${obj.size}`);
    headers.set("Content-Length", String(length));
    return new Response(obj.body, { status: 206, headers });
  }
  headers.set("Content-Length", String(obj.size));
  return new Response(obj.body, { status: 200, headers });
}
