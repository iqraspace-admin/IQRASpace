// Pure form <-> row conversion for the Dua / category / mapping editors.
// Form state keeps everything as strings (what inputs hold); the *ToData
// helpers produce the typed payloads sent to Supabase.

import type { CategoryRow, DuaRow, MappingRow, DuaStatus } from "./types";
import { parseList } from "./validate";

export const TEXT_KEYS = [
  "slug", "title", "title_ur", "arabic", "transliteration_latin", "transliteration_telugu", "transliteration_urdu",
  "translation_en", "translation_ur", "description", "source_collection", "source_reference", "hadith_number",
  "hadith_grade", "audio_url", "review_notes",
] as const;
type TextKey = (typeof TEXT_KEYS)[number];

export type DuaForm = Record<TextKey, string> & {
  repeat_count: string;
  source_type: string;
  verification_status: string;
  origin: string;
  wyn_ids: string;
  sort_order: string;
};

export type RefForm = { surah: string; ayah_from: string; ayah_to: string };

export const MAP_FIELDS = [
  "sort_order", "context_title", "context_title_ur", "context_note", "context_reference", "context_repeat_count",
] as const;
export type MapForm = Record<(typeof MAP_FIELDS)[number], string>;

/** DuaForm values as a plain string for nullable column. */
const s = (v: unknown): string => (v == null ? "" : String(v));
/** Trimmed string or null when empty. */
export const nz = (v: unknown): string | null => {
  const t = s(v).trim();
  return t === "" ? null : t;
};
const numOrNull = (v: unknown): number | null => (nz(v) === null ? null : Number(v));
const numOr0 = (v: unknown): number => (nz(v) === null ? 0 : Number(v));

export function blankForm(): DuaForm {
  const f = {} as DuaForm;
  for (const k of TEXT_KEYS) f[k] = "";
  return Object.assign(f, {
    repeat_count: "", source_type: "hadith", verification_status: "unchecked", origin: "iqs", wyn_ids: "", sort_order: "0",
  });
}

export function formFromRow(r: DuaRow): DuaForm {
  const f = blankForm();
  for (const k of TEXT_KEYS) f[k] = s(r[k]);
  f.repeat_count = s(r.repeat_count);
  f.source_type = r.source_type;
  f.verification_status = r.verification_status;
  f.origin = r.origin;
  f.wyn_ids = (r.wyn_ids || []).join(", ");
  f.sort_order = s(r.sort_order);
  return f;
}

export const refsFromRow = (r: DuaRow): RefForm[] =>
  (r.quran_refs || []).map((x) => ({ surah: s(x.surah), ayah_from: s(x.ayah_from), ayah_to: s(x.ayah_to) }));

export const mapFromRow = (m: MappingRow): MapForm => ({
  sort_order: s(m.sort_order),
  context_title: s(m.context_title),
  context_title_ur: s(m.context_title_ur),
  context_note: s(m.context_note),
  context_reference: s(m.context_reference),
  context_repeat_count: s(m.context_repeat_count),
});

export const blankMap = (): MapForm => ({
  sort_order: "0", context_title: "", context_title_ur: "", context_note: "", context_reference: "", context_repeat_count: "",
});

/** The writable columns of a Dua, typed for Supabase. */
export function formToData(form: DuaForm, refs: RefForm[], status: DuaStatus | string): Record<string, unknown> {
  const d: Record<string, unknown> = {};
  for (const k of TEXT_KEYS) d[k] = nz(form[k]);
  d.slug = form.slug.trim();
  d.title = form.title.trim();
  d.arabic = form.arabic.trim();
  d.repeat_count = numOrNull(form.repeat_count);
  d.source_type = form.source_type;
  d.verification_status = form.verification_status;
  d.origin = form.origin;
  d.wyn_ids = parseList(form.wyn_ids);
  d.sort_order = numOr0(form.sort_order);
  d.quran_refs = refs
    .filter((r) => [r.surah, r.ayah_from, r.ayah_to].some((x) => s(x).trim() !== ""))
    .map((r) => ({ surah: Number(r.surah), ayah_from: Number(r.ayah_from), ayah_to: Number(r.ayah_to) }));
  d.status = status;
  return d;
}

/** The writable override columns of a dua_category_map row. */
export const mapToRow = (m: MapForm) => ({
  sort_order: numOr0(m.sort_order),
  context_title: nz(m.context_title),
  context_title_ur: nz(m.context_title_ur),
  context_note: nz(m.context_note),
  context_reference: nz(m.context_reference),
  context_repeat_count: numOrNull(m.context_repeat_count),
});

export const CAT_FIELDS = [
  "slug", "name", "name_ur", "name_te", "description", "description_ur", "description_te", "sort_order",
] as const;
export type CategoryForm = Record<(typeof CAT_FIELDS)[number], string> & { is_active: boolean };

export function categoryFormFromRow(c: CategoryRow | null): CategoryForm {
  const f = {} as CategoryForm;
  for (const k of CAT_FIELDS) f[k] = s(c?.[k]);
  if (!c) f.sort_order = "0";
  f.is_active = c ? c.is_active : true;
  return f;
}

export function categoryToData(f: CategoryForm): Record<string, unknown> {
  const d: Record<string, unknown> = {};
  for (const k of CAT_FIELDS) d[k] = nz(f[k]);
  d.slug = f.slug.trim();
  d.name = f.name.trim();
  d.description = f.description.trim();
  d.sort_order = numOr0(f.sort_order);
  d.is_active = f.is_active;
  return d;
}
