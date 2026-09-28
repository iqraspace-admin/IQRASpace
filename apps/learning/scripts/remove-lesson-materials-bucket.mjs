#!/usr/bin/env node
/**
 * One-off cleanup: removes the now-unused `lesson-materials` Supabase
 * Storage bucket and its remaining objects, run once after
 * supabase/migrations/0024_drop_lesson_materials_storage_bucket.sql
 * (which drops the bucket's RLS policies but can't touch
 * storage.objects/storage.buckets directly — Supabase blocks raw SQL
 * DELETE on those tables, "Use the Storage API instead").
 *
 * Safe to run only after confirming every object was already copied to R2
 * (see migrate-storage-to-r2.mjs) — this permanently deletes the Supabase
 * Storage copies.
 *
 * Usage (from apps/learning): node --env-file=.env.local scripts/remove-lesson-materials-bucket.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_ID = "lesson-materials";

function fail(message) {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}
if (!SUPABASE_URL) fail("Missing NEXT_PUBLIC_SUPABASE_URL.");
if (!SERVICE_ROLE_KEY) fail("Missing SUPABASE_SERVICE_ROLE_KEY.");

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  const { data: folders, error: listError } = await supabase.storage.from(BUCKET_ID).list("");
  if (listError) throw new Error(`list bucket root failed: ${listError.message}`);
  const tutorFolders = (folders ?? []).filter((f) => !f.id).map((f) => f.name);

  let removed = 0;
  for (const tutorId of tutorFolders) {
    const { data: files, error: listFilesError } = await supabase.storage.from(BUCKET_ID).list(tutorId);
    if (listFilesError) throw new Error(`list ${tutorId}/ failed: ${listFilesError.message}`);
    const paths = (files ?? []).filter((f) => f.id).map((f) => `${tutorId}/${f.name}`);
    if (paths.length === 0) continue;
    const { error: removeError } = await supabase.storage.from(BUCKET_ID).remove(paths);
    if (removeError) throw new Error(`remove ${tutorId}/* failed: ${removeError.message}`);
    console.log(`  removed ${paths.length} object(s) from ${tutorId}/`);
    removed += paths.length;
  }
  console.log(`\nRemoved ${removed} object(s) total.`);

  const { error: deleteBucketError } = await supabase.storage.deleteBucket(BUCKET_ID);
  if (deleteBucketError) throw new Error(`delete bucket "${BUCKET_ID}" failed: ${deleteBucketError.message}`);
  console.log(`Bucket "${BUCKET_ID}" deleted.`);
}

main().catch((err) => {
  console.error("remove-lesson-materials-bucket.mjs failed:", err);
  process.exit(1);
});
