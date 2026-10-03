// Row shapes for the Duas tables (supabase/migrations/0025_duas_schema.sql).
// Erasable TypeScript only — this file is imported by node-test-run modules.

export const STATUSES = ["draft", "review", "published", "archived"] as const;
export const VERIFICATION = ["verified", "unchecked", "needs_review"] as const;
export const ORIGINS = ["iqs", "wyn_public_pdf", "wyn_revised_edition", "independent"] as const;
export const SOURCE_TYPES = ["quran", "hadith", "mixed", "other"] as const;

export type DuaStatus = (typeof STATUSES)[number];
export type Verification = (typeof VERIFICATION)[number];
export type Origin = (typeof ORIGINS)[number];
export type SourceType = (typeof SOURCE_TYPES)[number];

export type QuranRef = { surah: number; ayah_from: number; ayah_to: number };

export type DuaRow = {
  id: string;
  slug: string;
  title: string;
  title_ur: string | null;
  arabic: string;
  arabic_normalized: string;
  transliteration_latin: string | null;
  transliteration_telugu: string | null;
  transliteration_urdu: string | null;
  translation_en: string | null;
  translation_ur: string | null;
  description: string | null;
  repeat_count: number | null;
  source_type: SourceType;
  source_collection: string | null;
  source_reference: string | null;
  hadith_number: string | null;
  hadith_grade: string | null;
  quran_refs: QuranRef[];
  audio_url: string | null;
  status: DuaStatus;
  verification_status: Verification;
  review_notes: string | null;
  origin: Origin;
  wyn_ids: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  created_by: string | null;
  updated_by: string | null;
};

/** Columns shown in list/dashboard views. */
export type DuaListRow = Pick<
  DuaRow,
  "id" | "slug" | "title" | "status" | "verification_status" | "origin" | "source_reference" | "sort_order" | "updated_at" | "created_at" | "arabic"
>;

export type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  name_ur: string | null;
  name_te: string | null;
  description: string;
  description_ur: string | null;
  description_te: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

export type MappingRow = {
  dua_id: string;
  category_id: string;
  sort_order: number;
  context_title: string | null;
  context_title_ur: string | null;
  context_note: string | null;
  context_reference: string | null;
  context_repeat_count: number | null;
  updated_at: string;
};

export type AuditEntity = "dua" | "category" | "mapping";
export type AuditAction = "insert" | "update" | "delete";

export type AuditRow = {
  id: number;
  entity: AuditEntity;
  entity_id: string;
  action: AuditAction;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changed_fields: string[];
  changed_by: string | null;
  changed_at: string;
};
