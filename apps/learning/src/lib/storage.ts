import { supabase } from "./supabaseClient";
import type { LessonMaterial } from "./types";

/**
 * Lesson material storage — migrated from Supabase Storage to Cloudflare R2
 * (see supabase/functions/lesson-materials-r2 for the presigned-URL broker
 * this now goes through; R2 has no RLS equivalent, so every access-control
 * rule that used to live in supabase/migrations/0011_storage_lesson_materials_bucket.sql
 * and 0018_admin_full_access.sql is re-enforced server-side in that
 * function instead). Path convention unchanged: `{tutorId}/{filename}` —
 * the Edge Function is the only place that knows this now lives under a
 * `learning/` prefix in R2, so no existing `lesson_materials.storage_path`
 * row needed rewriting as part of this migration.
 */
const BROKER_FUNCTION = "lesson-materials-r2";

export type StoredFile = {
  name: string;
  path: string;
  size: number;
  updatedAt: string;
};

type BrokerResponse<T> = { ok: true; data: T } | { ok: false; error: string };

async function invokeBroker<T>(body: Record<string, unknown>): Promise<{ data: T | null; error: { message: string } | null }> {
  const { data, error } = await supabase.functions.invoke<BrokerResponse<T>>(BROKER_FUNCTION, { body });
  if (error) return { data: null, error: { message: error.message } };
  if (!data?.ok) return { data: null, error: { message: (data as { error?: string })?.error ?? "Unknown storage error." } };
  return { data: data.data, error: null };
}

export async function uploadLessonMaterial(_tutorId: string, file: File) {
  // _tutorId kept for call-site compatibility; the broker derives the
  // authoritative tutor id from the caller's own session, never a
  // client-supplied value.
  const { data, error } = await invokeBroker<{ path: string; uploadUrl: string }>({
    action: "sign-upload",
    filename: file.name,
    contentType: file.type || "application/pdf",
  });
  if (error || !data) return { path: "", error: error ?? { message: "Could not get an upload URL." } };

  const putRes = await fetch(data.uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type || "application/pdf" },
  });
  if (!putRes.ok) {
    return { path: data.path, error: { message: `Upload to storage failed (HTTP ${putRes.status}).` } };
  }
  return { path: data.path, error: null };
}

export async function listLessonMaterials(tutorId: string): Promise<StoredFile[]> {
  const { data, error } = await invokeBroker<StoredFile[]>({ action: "list", tutorId });
  if (error || !data) return [];
  return data;
}

/**
 * All lesson materials across every tutor's folder — for admin/super_admin.
 * Authorization (admin-only) is enforced inside the Edge Function itself,
 * not just by which UI screens call this.
 */
export async function listAllLessonMaterials(): Promise<StoredFile[]> {
  const { data, error } = await invokeBroker<StoredFile[]>({ action: "list-all" });
  if (error || !data) return [];
  return data;
}

/**
 * A lesson's attached PDF material (if any), used by the Teach/Share screens
 * to render the real material instead of the bundled-ayah view when a
 * lesson has no `quran_surah_key` — e.g. the Qaida – Beginners curriculum
 * (docs/qaida-beginners-curriculum.md), where every lesson points at a
 * specific page range of the same uploaded Noorani Qaida PDF.
 */
export async function getLessonMaterial(lessonId: string): Promise<LessonMaterial | null> {
  const { data } = await supabase
    .from("lesson_materials")
    .select("*")
    .eq("lesson_id", lessonId)
    .not("storage_path", "is", null)
    .order("id")
    .limit(1)
    .maybeSingle();
  return (data as LessonMaterial) ?? null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- expiresInSeconds kept for call-site compatibility; the broker sets a fixed, server-controlled TTL rather than trusting a client-passed value.
export async function getSignedMaterialUrl(path: string, expiresInSeconds = 3600) {
  const { data, error } = await invokeBroker<{ url: string }>({ action: "sign-download", path });
  return { url: data?.url ?? null, error };
}

export async function deleteLessonMaterial(path: string) {
  return invokeBroker<null>({ action: "delete", path });
}

export function formatFileSize(bytes: number) {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}
