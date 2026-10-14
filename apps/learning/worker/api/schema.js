// Table metadata for the generic query API (worker/api/query.js).
//
// Only tables listed here are reachable from the browser, and only the
// columns listed here can be named in a select/filter/order/write — every
// identifier is checked against this map before it goes anywhere near SQL.
// Must match d1/migrations (worker/api/schema.test.mjs checks that).
//
// Column types drive value conversion between JSON and SQLite:
//   text | int  stored as-is
//   bool        INTEGER 0/1 in SQLite, true/false over the API
//   json        TEXT in SQLite, parsed JSON over the API (jsonb, text[], int[])

const T = "text";
const I = "int";
const B = "bool";
const J = "json";

/**
 * @typedef {{
 *   columns: Record<string, "text"|"int"|"bool"|"json">,
 *   pk: string[],
 *   fks?: Record<string, string>,      // column -> "table.column"
 *   readOnly?: string[],               // writing it is an error (security-relevant)
 *   derived?: string[],                // silently ignored on write; worker/api/hooks.js sets it
 *   insertOnly?: string[],             // settable on insert, silently ignored on update
 *   generatedId?: boolean,             // Worker generates a uuid `id` on insert
 * }} TableDef
 */

/** @type {Record<string, TableDef>} */
export const TABLES = {
  users: {
    columns: { id: T, username: T, email: T, phone: T, full_name: T, role: T, created_at: T },
    pk: ["id"],
    // role only changes through the set_user_role RPC (was the
    // prevent_role_self_escalation trigger); accounts are created by the
    // auth/admin endpoints, which write users directly.
    readOnly: ["id", "role", "created_at"],
  },
  tutors: {
    columns: {
      id: T,
      bio: T,
      default_lesson_duration_minutes: I,
      default_reminder_minutes: I,
      email_reminders_enabled: B,
      lesson_start_reminders_enabled: B,
    },
    pk: ["id"],
    fks: { id: "users.id" },
    readOnly: ["id"],
    // google_refresh_token_enc exists in D1 but is deliberately not listed:
    // server-side only, never readable or writable from the browser.
    serverOnly: ["google_refresh_token_enc"],
  },
  students: {
    columns: { id: T, guardian_id: T, date_of_birth: T },
    pk: ["id"],
    fks: { id: "users.id", guardian_id: "users.id" },
    readOnly: ["id"],
  },
  classes: {
    columns: { id: T, tutor_id: T, name: T, created_at: T },
    pk: ["id"],
    fks: { tutor_id: "tutors.id" },
    generatedId: true,
  },
  class_members: {
    columns: { id: T, class_id: T, student_id: T, joined_at: T },
    pk: ["id"],
    fks: { class_id: "classes.id", student_id: "students.id" },
    generatedId: true,
  },
  google_drive_files: {
    columns: { id: T, tutor_id: T, drive_file_id: T, file_name: T, web_view_link: T, linked_at: T },
    pk: ["id"],
    fks: { tutor_id: "tutors.id" },
    generatedId: true,
  },
  lesson_plans: {
    columns: { id: T, name: T, description: T, active: B, created_at: T },
    pk: ["id"],
    generatedId: true,
  },
  lesson_plan_items: {
    columns: {
      id: T,
      lesson_plan_id: T,
      sequence: I,
      title: T,
      objective: T,
      quran_surah_key: T,
      material_drive_file_id: T,
      material_storage_path: T,
      material_type: T,
      material_page_start: I,
      material_page_end: I,
      prerequisite_item_id: T,
      active: B,
      created_at: T,
    },
    pk: ["id"],
    fks: { lesson_plan_id: "lesson_plans.id", prerequisite_item_id: "lesson_plan_items.id" },
    generatedId: true,
  },
  class_lesson_plans: {
    columns: { id: T, class_id: T, lesson_plan_id: T, assigned_at: T },
    pk: ["id"],
    fks: { class_id: "classes.id", lesson_plan_id: "lesson_plans.id" },
    generatedId: true,
  },
  recurring_session_rules: {
    columns: {
      id: T,
      tutor_id: T,
      student_id: T,
      class_id: T,
      days_of_week: J,
      start_time: T,
      duration_minutes: I,
      active: B,
      starts_on: T,
      ends_on: T,
      created_at: T,
    },
    pk: ["id"],
    fks: { tutor_id: "tutors.id", student_id: "students.id", class_id: "classes.id" },
    generatedId: true,
  },
  lessons: {
    columns: {
      id: T,
      class_id: T,
      tutor_id: T,
      student_id: T,
      title: T,
      lesson_date: T,
      status: T,
      start_time: T,
      duration_minutes: I,
      quran_surah_key: T,
      lesson_plan_item_id: T,
      recurring_rule_id: T,
    },
    pk: ["id"],
    fks: {
      class_id: "classes.id",
      tutor_id: "tutors.id",
      student_id: "students.id",
      lesson_plan_item_id: "lesson_plan_items.id",
      recurring_rule_id: "recurring_session_rules.id",
    },
    generatedId: true,
  },
  lesson_materials: {
    columns: { id: T, lesson_id: T, drive_file_id: T, storage_path: T, material_type: T, page_start: I, page_end: I },
    pk: ["id"],
    fks: { lesson_id: "lessons.id", drive_file_id: "google_drive_files.id" },
    generatedId: true,
  },
  meetings: {
    columns: { id: T, lesson_id: T, meet_url: T, scheduled_start: T, scheduled_end: T, calendar_event_id: T },
    pk: ["id"],
    fks: { lesson_id: "lessons.id" },
    generatedId: true,
  },
  attendance: {
    columns: { id: T, lesson_id: T, student_id: T, status: T, marked_at: T },
    pk: ["id"],
    fks: { lesson_id: "lessons.id", student_id: "students.id" },
    generatedId: true,
  },
  lesson_progress: {
    columns: {
      id: T,
      lesson_id: T,
      student_id: T,
      progress_note: T,
      surah_ayah_range: T,
      recitation_score: I,
      tajweed_score: I,
      memorization_score: I,
      created_at: T,
    },
    pk: ["id"],
    fks: { lesson_id: "lessons.id", student_id: "students.id" },
    generatedId: true,
  },
  lesson_notes: {
    columns: { id: T, lesson_id: T, note: T, covered: T, performance_note: T, next_lesson_plan: T, created_at: T },
    pk: ["id"],
    fks: { lesson_id: "lessons.id" },
    generatedId: true,
  },
  sharing_sessions: {
    columns: { id: T, lesson_id: T, status: T, started_at: T, ended_at: T },
    pk: ["id"],
    fks: { lesson_id: "lessons.id" },
    generatedId: true,
  },
  highlighted_content: {
    columns: {
      id: T,
      sharing_session_id: T,
      page_number: I,
      highlight_type: T,
      coordinates: J,
      selected_text: T,
      created_at: T,
    },
    pk: ["id"],
    fks: { sharing_session_id: "sharing_sessions.id" },
    generatedId: true,
  },
  student_lesson_progress: {
    columns: {
      id: T,
      student_id: T,
      lesson_plan_id: T,
      current_item_id: T,
      status: T,
      tutor_confirmed: B,
      completed_at: T,
      notes: T,
      updated_at: T,
    },
    pk: ["id"],
    fks: { student_id: "students.id", lesson_plan_id: "lesson_plans.id", current_item_id: "lesson_plan_items.id" },
    generatedId: true,
  },
  student_lesson_completions: {
    columns: { id: T, student_id: T, lesson_plan_item_id: T, lesson_id: T, confirmed_by: T, completed_at: T },
    pk: ["id"],
    fks: {
      student_id: "students.id",
      lesson_plan_item_id: "lesson_plan_items.id",
      lesson_id: "lessons.id",
      confirmed_by: "users.id",
    },
    generatedId: true,
  },
  notifications: {
    columns: { id: T, user_id: T, type: T, title: T, body: T, related_lesson_id: T, read: B, created_at: T },
    pk: ["id"],
    fks: { user_id: "users.id", related_lesson_id: "lessons.id" },
    // Rows are created only by the notify_user RPC; owners may only flip `read`.
    readOnly: ["id", "user_id", "type", "title", "body", "related_lesson_id", "created_at"],
    generatedId: true,
  },
  dua_categories: {
    columns: {
      id: T,
      slug: T,
      name: T,
      name_ur: T,
      name_te: T,
      description: T,
      description_ur: T,
      description_te: T,
      sort_order: I,
      is_active: B,
      created_at: T,
      updated_at: T,
      created_by: T,
      updated_by: T,
    },
    pk: ["id"],
    // bookkeeping is set by worker/api/hooks.js (was dua_categories_before_write)
    derived: ["updated_at", "updated_by"],
    insertOnly: ["id", "created_at", "created_by"],
    generatedId: true,
  },
  duas: {
    columns: {
      id: T,
      slug: T,
      title: T,
      title_ur: T,
      arabic: T,
      arabic_normalized: T,
      transliteration_latin: T,
      transliteration_telugu: T,
      transliteration_urdu: T,
      translation_en: T,
      translation_ur: T,
      description: T,
      repeat_count: I,
      source_type: T,
      source_collection: T,
      source_reference: T,
      hadith_number: T,
      hadith_grade: T,
      quran_refs: J,
      audio_url: T,
      status: T,
      verification_status: T,
      review_notes: T,
      origin: T,
      wyn_ids: J,
      sort_order: I,
      created_at: T,
      updated_at: T,
      published_at: T,
      created_by: T,
      updated_by: T,
    },
    pk: ["id"],
    // arabic_normalized/published_at/updated_* are derived by hooks.js (was duas_before_write)
    derived: ["arabic_normalized", "updated_at", "updated_by", "published_at"],
    insertOnly: ["id", "created_at", "created_by"],
    generatedId: true,
  },
  dua_category_map: {
    columns: {
      dua_id: T,
      category_id: T,
      sort_order: I,
      context_title: T,
      context_title_ur: T,
      context_note: T,
      context_reference: T,
      context_repeat_count: I,
      updated_at: T,
    },
    pk: ["dua_id", "category_id"],
    fks: { dua_id: "duas.id", category_id: "dua_categories.id" },
    derived: ["updated_at"],
  },
  dua_audit_log: {
    columns: {
      id: I,
      entity: T,
      entity_id: T,
      action: T,
      old_data: J,
      new_data: J,
      changed_fields: J,
      changed_by: T,
      changed_at: T,
    },
    pk: ["id"],
  },
};

export function tableDef(name) {
  return Object.prototype.hasOwnProperty.call(TABLES, name) ? TABLES[name] : null;
}

/** SQLite value -> API value. */
export function decodeValue(type, v) {
  if (v === null || v === undefined) return null;
  if (type === "bool") return v === 1 || v === true || v === "1" || v === "true";
  if (type === "json") {
    if (typeof v !== "string") return v;
    try {
      return JSON.parse(v);
    } catch {
      return v;
    }
  }
  return v;
}

/** API value -> SQLite bind value. */
export function encodeValue(type, v) {
  if (v === null || v === undefined) return null;
  if (type === "bool") {
    if (v === true || v === "true" || v === 1 || v === "1" || v === "t") return 1;
    if (v === false || v === "false" || v === 0 || v === "0" || v === "f") return 0;
    return v;
  }
  if (type === "json") return typeof v === "string" ? v : JSON.stringify(v);
  if (type === "int" && typeof v === "string" && /^-?\d+$/.test(v)) return Number(v);
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "object") return JSON.stringify(v);
  return v;
}

export function decodeRow(table, row) {
  const def = TABLES[table];
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    const type = def.columns[k];
    out[k] = type ? decodeValue(type, v) : v;
  }
  return out;
}
