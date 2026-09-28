#!/usr/bin/env node
/**
 * One-off migration: copies every object out of the `lesson-materials`
 * Supabase Storage bucket into the new, private Cloudflare R2 bucket that
 * supabase/functions/lesson-materials-r2 now serves from (see
 * src/lib/storage.ts's header comment for the full migration rationale).
 *
 * Downloads via the service_role key (bypasses RLS — this needs to read
 * every tutor's folder, not just one), uploads via the R2 S3-compatible
 * API under the same `learning/{tutorId}/{filename}` key convention the
 * Edge Function expects. Safe to re-run: lists what's already in R2 first
 * and skips those objects, so an interrupted run just resumes.
 *
 * Does NOT delete anything from Supabase Storage or touch the
 * `lesson_materials` Postgres table — `storage_path` values are unchanged
 * (still bare `{tutorId}/{filename}`), so nothing there needs migrating.
 *
 * Usage (from apps/learning):
 *   node --env-file=.env.local scripts/migrate-storage-to-r2.mjs
 *
 * Required env vars (apps/learning/.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL       (already set for the app itself)
 *   SUPABASE_SERVICE_ROLE_KEY      (already set, used by seed:admins too)
 *   LESSON_MATERIALS_R2_ACCOUNT_ID
 *   LESSON_MATERIALS_R2_ACCESS_KEY_ID
 *   LESSON_MATERIALS_R2_SECRET_ACCESS_KEY
 *   LESSON_MATERIALS_R2_BUCKET
 * (the last 4 are also what supabase/functions/lesson-materials-r2 needs
 * set as Function secrets — see DEPLOYMENT.md — this script reads them
 * from the same local .env.local purely for convenience, it doesn't set
 * the Function secrets itself.)
 */

import { createClient } from "@supabase/supabase-js";
import { S3Client, ListObjectsV2Command, PutObjectCommand, HeadBucketCommand } from "@aws-sdk/client-s3";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const R2_ACCOUNT_ID = process.env.LESSON_MATERIALS_R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.LESSON_MATERIALS_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.LESSON_MATERIALS_R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.LESSON_MATERIALS_R2_BUCKET;
const R2_PREFIX = "learning/";
const BUCKET_ID = "lesson-materials";
const MAX_ATTEMPTS = 3;

function fail(message) {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}
if (!SUPABASE_URL) fail("Missing NEXT_PUBLIC_SUPABASE_URL.");
if (!SERVICE_ROLE_KEY) fail("Missing SUPABASE_SERVICE_ROLE_KEY.");
if (!R2_ACCOUNT_ID) fail("Missing LESSON_MATERIALS_R2_ACCOUNT_ID.");
if (!R2_ACCESS_KEY_ID) fail("Missing LESSON_MATERIALS_R2_ACCESS_KEY_ID.");
if (!R2_SECRET_ACCESS_KEY) fail("Missing LESSON_MATERIALS_R2_SECRET_ACCESS_KEY.");
if (!R2_BUCKET) fail("Missing LESSON_MATERIALS_R2_BUCKET.");

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

async function verifyBucket() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: R2_BUCKET }));
  } catch (err) {
    throw new Error(`R2 bucket "${R2_BUCKET}" not reachable (${err.message}). Create it in the Cloudflare dashboard first.`);
  }
}

async function listExistingR2Keys() {
  const keys = new Set();
  let ContinuationToken;
  do {
    const res = await s3.send(new ListObjectsV2Command({ Bucket: R2_BUCKET, Prefix: R2_PREFIX, ContinuationToken }));
    for (const obj of res.Contents ?? []) keys.add(obj.Key.slice(R2_PREFIX.length));
    ContinuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (ContinuationToken);
  return keys;
}

/** Every tutor folder under the bucket root — Storage's `list("")` returns one folder-placeholder entry (no `id`) per tutor who's uploaded something, same pattern storage.ts's old listAllLessonMaterials() used. */
async function listTutorFolders() {
  const { data, error } = await supabase.storage.from(BUCKET_ID).list("");
  if (error) throw new Error(`Listing bucket root failed: ${error.message}`);
  return (data ?? []).filter((f) => !f.id).map((f) => f.name);
}

async function listFilesInFolder(tutorId) {
  const { data, error } = await supabase.storage.from(BUCKET_ID).list(tutorId);
  if (error) throw new Error(`Listing ${tutorId}/ failed: ${error.message}`);
  return (data ?? []).filter((f) => f.id).map((f) => f.name);
}

async function migrateOne(path) {
  const { data: blob, error: downloadError } = await supabase.storage.from(BUCKET_ID).download(path);
  if (downloadError) throw new Error(`download ${path} failed: ${downloadError.message}`);
  const body = Buffer.from(await blob.arrayBuffer());

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: `${R2_PREFIX}${path}`,
          Body: body,
          ContentType: blob.type || "application/pdf",
        })
      );
      return body.length;
    } catch (err) {
      if (attempt === MAX_ATTEMPTS) throw new Error(`upload ${path} failed: ${err.message}`);
      console.warn(`  retrying ${path} (attempt ${attempt} failed: ${err.message})`);
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
}

async function main() {
  await verifyBucket();
  const existingR2Keys = await listExistingR2Keys();
  const tutorFolders = await listTutorFolders();
  console.log(`Found ${tutorFolders.length} tutor folder(s) in Supabase Storage bucket "${BUCKET_ID}".`);

  let migrated = 0;
  let skipped = 0;
  let totalBytes = 0;
  const failures = [];

  for (const tutorId of tutorFolders) {
    const files = await listFilesInFolder(tutorId);
    console.log(`\n${tutorId}/: ${files.length} file(s)`);
    for (const filename of files) {
      const path = `${tutorId}/${filename}`;
      if (existingR2Keys.has(path)) {
        skipped++;
        continue;
      }
      try {
        const bytes = await migrateOne(path);
        totalBytes += bytes;
        migrated++;
        console.log(`  [${filename}] migrated (${(bytes / 1024).toFixed(0)} KB)`);
      } catch (err) {
        failures.push({ path, error: err.message });
        console.error(`  [${filename}] FAILED: ${err.message}`);
      }
    }
  }

  console.log(`\nDone: ${migrated} migrated (${(totalBytes / 1024 / 1024).toFixed(1)} MB), ${skipped} already present, ${failures.length} failed.`);
  if (failures.length > 0) {
    console.error("\nFailures:");
    for (const f of failures) console.error(`  ${f.path}: ${f.error}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("migrate-storage-to-r2.mjs failed:", err);
  process.exit(1);
});
