import { db, apiFetch, apiUrl } from "@/lib/db";
import type { LessonMaterial } from "./types";

/**
 * Lesson material storage — a private Cloudflare R2 bucket reached through
 * the Learning API (worker/api/storage.js, R2 binding MATERIALS). R2 has no
 * row-level security, so every access rule (own folder, or admin) is
 * enforced in the Worker. Path convention: `{tutorId}/{timestamp}-{filename}`
 * (what lesson_materials.storage_path holds); the Worker keeps objects under
 * a `learning/` key prefix.
 */
export type StoredFile = {
  name: string;
  path: string;
  size: number;
  updatedAt: string;
};

type BrokerResponse<T> = { ok: true; data: T } | { ok: false; error: string };

async function invokeBroker<T>(body: Record<string, unknown>): Promise<{ data: T | null; error: { message: string } | null }> {
  try {
    const res = await apiFetch("/storage", { method: "POST", body: JSON.stringify(body) });
    const out = (await res.json()) as BrokerResponse<T>;
    if (!out.ok) return { data: null, error: { message: out.error ?? "Unknown storage error." } };
    return { data: out.data, error: null };
  } catch (e) {
    return { data: null, error: { message: e instanceof Error ? e.message : "Unknown storage error." } };
  }
}

export async function uploadLessonMaterial(_tutorId: string, file: File) {
  // _tutorId kept for call-site compatibility; the Worker derives the
  // authoritative tutor id from the caller's own session, never a
  // client-supplied value.
  try {
    const res = await apiFetch(`/storage/upload?filename=${encodeURIComponent(file.name)}`, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type || "application/pdf" },
    });
    const out = (await res.json()) as BrokerResponse<{ path: string }>;
    if (!out.ok) return { path: "", error: { message: out.error ?? `Upload failed (HTTP ${res.status}).` } };
    return { path: out.data.path, error: null };
  } catch (e) {
    return { path: "", error: { message: e instanceof Error ? e.message : "Upload failed." } };
  }
}

export async function listLessonMaterials(tutorId: string): Promise<StoredFile[]> {
  const { data, error } = await invokeBroker<StoredFile[]>({ action: "list", tutorId });
  if (error || !data) return [];
  return data;
}

/**
 * All lesson materials across every tutor's folder — for admin/super_admin.
 * Authorization (admin-only) is enforced inside the Worker itself,
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
  const { data } = await db
    .from("lesson_materials")
    .select("*")
    .eq("lesson_id", lessonId)
    .not("storage_path", "is", null)
    .order("id")
    .limit(1)
    .maybeSingle();
  return (data as LessonMaterial) ?? null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- expiresInSeconds kept for call-site compatibility; the Worker issues a fixed, server-controlled one-hour download link.
export async function getSignedMaterialUrl(path: string, expiresInSeconds = 3600) {
  const { data, error } = await invokeBroker<{ downloadPath: string }>({ action: "sign-download", path });
  // One-hour ticket link served by the Worker; absolute so pdf.js / new tabs can open it.
  const url = data?.downloadPath ? new URL(apiUrl(data.downloadPath), window.location.href).href : null;
  return { url, error };
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
