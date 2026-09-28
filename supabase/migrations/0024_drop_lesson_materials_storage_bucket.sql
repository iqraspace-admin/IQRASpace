-- Lesson material files moved from Supabase Storage to a dedicated
-- Cloudflare R2 bucket (see supabase/functions/lesson-materials-r2,
-- apps/learning/src/lib/storage.ts, apps/learning/scripts/migrate-storage-to-r2.mjs).
-- All existing objects were copied to R2 and verified before this migration
-- was written — this is cleanup of the now-unused Supabase Storage side,
-- not a live data migration itself.
--
-- The public.lesson_materials TABLE (metadata rows: id, tutor_id,
-- storage_path, lesson_id, ...) is untouched — only the Storage product's
-- bucket/objects/policies go away. `storage_path` values keep meaning
-- exactly what they did before (bare `{tutorId}/{filename}`); the R2
-- broker Edge Function is what now resolves them.

-- ── Policies from 0011_storage_lesson_materials_bucket.sql ─────────────────
drop policy if exists "lesson_materials_bucket_tutor_write" on storage.objects;
drop policy if exists "lesson_materials_bucket_tutor_update" on storage.objects;
drop policy if exists "lesson_materials_bucket_tutor_delete" on storage.objects;
drop policy if exists "lesson_materials_bucket_authenticated_read" on storage.objects;

-- ── Policies from 0018_admin_full_access.sql ────────────────────────────────
drop policy if exists "lesson_materials_bucket_admin_insert" on storage.objects;
drop policy if exists "lesson_materials_bucket_admin_update" on storage.objects;
drop policy if exists "lesson_materials_bucket_admin_delete" on storage.objects;

-- Deleting the bucket's remaining objects and the bucket row itself is
-- deliberately NOT done here as plain SQL: Supabase blocks direct DELETE on
-- storage.objects/storage.buckets ("Direct deletion from storage tables is
-- not allowed. Use the Storage API instead.", SQLSTATE 42501) — it manages
-- its own S3-backend bookkeeping through that API, not raw table writes.
-- See scripts/remove-lesson-materials-bucket.mjs (run once, after this
-- migration) for that part.
