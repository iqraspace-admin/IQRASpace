// Edge Function: lesson-materials-r2
//
// Presigned-URL broker for the lesson-materials object store, now on
// Cloudflare R2 instead of Supabase Storage. Mirrors the auth pattern
// already established by admin-user-management / google-oauth-exchange /
// drive-file-proxy: verify the caller's own session token server-side,
// re-check their role directly against the database, never trust a
// client-sent role/id.
//
// Why this function exists at all: R2 (plain S3-compatible storage) has no
// equivalent to the RLS policies that used to gate storage.objects directly
// (supabase/migrations/0011_storage_lesson_materials_bucket.sql,
// 0018_admin_full_access.sql). The browser can never hold an R2 secret key,
// so every operation is re-implemented here as a short-lived presigned URL,
// scoped by the exact same rule the old RLS policies enforced:
//   - write (upload/delete): only inside the caller's own `{tutorId}/`
//     folder, or any admin/super_admin (bypass)
//   - read (download/list): any authenticated user, unconditionally
//
// Called as: POST /lesson-materials-r2
// Authorization: Bearer <supabase access token> (the caller's own session)
// Body: { action: "sign-upload" | "sign-download" | "list" | "list-all" | "delete", ...params }
//
// R2 objects are stored under a `learning/` prefix (this app's own folder
// within the account's R2 space — kept separate from apps/mobile/android's
// public, keyless audio bucket, which must never share a bucket with these
// private files). The DB's `lesson_materials.storage_path` /
// `material_storage_path` columns keep storing the bare `{tutorId}/{filename}`
// path exactly as before (see lib/lessonMaterial.ts's
// QURAN_SURAH_PREFIX marker, unrelated to this bucket) — this function is the
// only place that knows about the `learning/` R2 key prefix, so no existing
// DB row needed rewriting as part of this migration.

import { createClient } from "jsr:@supabase/supabase-js@2";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "npm:@aws-sdk/client-s3@3";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner@3";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

const R2_PREFIX = "learning/";
const SIGNED_URL_TTL_SECONDS = 3600; // matches storage.ts's previous getSignedMaterialUrl default
const MAX_FILE_SIZE_BYTES = 52428800; // 50MiB — matches 0011's original bucket file_size_limit

function r2Key(path: string) {
  return `${R2_PREFIX}${path}`;
}

function r2Client() {
  const accountId = Deno.env.get("LESSON_MATERIALS_R2_ACCOUNT_ID")!;
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: Deno.env.get("LESSON_MATERIALS_R2_ACCESS_KEY_ID")!,
      secretAccessKey: Deno.env.get("LESSON_MATERIALS_R2_SECRET_ACCESS_KEY")!,
    },
  });
}

const BUCKET = () => Deno.env.get("LESSON_MATERIALS_R2_BUCKET")!;

type StoredFile = { name: string; path: string; size: number; updatedAt: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ ok: false, error: "Missing Authorization header." }, 401);
  }
  const accessToken = authHeader.slice("Bearer ".length);

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const {
    data: { user: caller },
    error: callerError,
  } = await supabaseAdmin.auth.getUser(accessToken);
  if (callerError || !caller) return json({ ok: false, error: "Invalid session." }, 401);

  const { data: callerProfile } = await supabaseAdmin.from("users").select("role").eq("id", caller.id).maybeSingle();
  const isAdmin = !!callerProfile && ["admin", "super_admin"].includes(callerProfile.role);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }
  const action = body.action as string | undefined;
  const s3 = r2Client();
  const bucket = BUCKET();

  switch (action) {
    // Any authenticated user's own folder only — mirrors
    // "lesson_materials_bucket_tutor_write" (0011).
    case "sign-upload": {
      const filename = body.filename as string | undefined;
      const contentType = (body.contentType as string | undefined) || "application/pdf";
      if (!filename) return json({ ok: false, error: "filename is required." }, 400);

      const path = `${caller.id}/${Date.now()}-${filename}`;
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: r2Key(path),
        ContentType: contentType,
        ContentLength: undefined, // enforced client-side + MAX_FILE_SIZE_BYTES documented; R2 has no per-request cap param here
      });
      const uploadUrl = await getSignedUrl(s3, command, { expiresIn: SIGNED_URL_TTL_SECONDS });
      return json({ ok: true, data: { path, uploadUrl, maxSizeBytes: MAX_FILE_SIZE_BYTES } });
    }

    // Open to any authenticated user — mirrors
    // "lesson_materials_bucket_authenticated_read" (0011), unconditional.
    case "sign-download": {
      const path = body.path as string | undefined;
      if (!path) return json({ ok: false, error: "path is required." }, 400);
      const command = new GetObjectCommand({ Bucket: bucket, Key: r2Key(path) });
      const url = await getSignedUrl(s3, command, { expiresIn: SIGNED_URL_TTL_SECONDS });
      return json({ ok: true, data: { url } });
    }

    // Own folder, or any tutor's folder if the caller is an admin — mirrors
    // listLessonMaterials()'s previous authenticated_read behavior plus the
    // admin-viewing-another-tutor path already in materials/page.tsx.
    case "list": {
      const requestedTutorId = (body.tutorId as string | undefined) || caller.id;
      if (requestedTutorId !== caller.id && !isAdmin) {
        return json({ ok: false, error: "Not authorized to list another tutor's materials." }, 403);
      }
      const prefix = r2Key(`${requestedTutorId}/`);
      const result = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix }));
      const files: StoredFile[] = (result.Contents ?? []).map((obj) => {
        const path = obj.Key!.slice(R2_PREFIX.length); // strip back to {tutorId}/{filename}
        return {
          name: path.slice(path.indexOf("/") + 1),
          path,
          size: obj.Size ?? 0,
          updatedAt: obj.LastModified?.toISOString() ?? "",
        };
      });
      files.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      return json({ ok: true, data: files });
    }

    // Admin/super_admin only — mirrors listAllLessonMaterials()'s previous
    // "read is open to any authenticated user, but this call site is
    // gated in the UI to admin" behavior, now enforced server-side too.
    case "list-all": {
      if (!isAdmin) return json({ ok: false, error: "Not authorized — admin access required." }, 403);
      const result = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: R2_PREFIX }));
      const files: StoredFile[] = (result.Contents ?? []).map((obj) => {
        const path = obj.Key!.slice(R2_PREFIX.length);
        return {
          name: path.slice(path.indexOf("/") + 1),
          path,
          size: obj.Size ?? 0,
          updatedAt: obj.LastModified?.toISOString() ?? "",
        };
      });
      files.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      return json({ ok: true, data: files });
    }

    // Own folder, or admin bypass — mirrors
    // "lesson_materials_bucket_tutor_delete" (0011) +
    // "lesson_materials_bucket_admin_delete" (0018).
    case "delete": {
      const path = body.path as string | undefined;
      if (!path) return json({ ok: false, error: "path is required." }, 400);
      const ownsPath = path.startsWith(`${caller.id}/`);
      if (!ownsPath && !isAdmin) {
        return json({ ok: false, error: "Not authorized to delete this file." }, 403);
      }
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: r2Key(path) }));
      return json({ ok: true });
    }

    default:
      return json({ ok: false, error: `Unknown action: ${action}` }, 400);
  }
});
