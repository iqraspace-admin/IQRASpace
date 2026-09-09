import { supabase } from "./supabaseClient";
import { notifyUser } from "./notifications";
import { todayISO } from "./format";
import type { AppUser, AttendanceRecord, AttendanceStatus, Lesson } from "./types";
import type { BadgeTone } from "@/components/ui/Badge";

// Single source of truth for attendance queries/mutations — the Student
// Card, the Teach screen, and the /attendance page all import from here
// rather than each issuing their own `supabase.from("attendance")` calls,
// so there is exactly one attendance workflow, not three.

export const STATUS_TONE: Record<AttendanceStatus, BadgeTone> = {
  present: "green",
  absent: "red",
  late: "amber",
  excused: "muted",
};
export const STATUSES: AttendanceStatus[] = ["present", "absent", "late", "excused"];

export type LessonAttendance = {
  lesson: Lesson;
  student: AppUser | null;
  record: AttendanceRecord | null; // null = not yet marked
};

async function zipLessonsWithAttendance(lessons: Lesson[]): Promise<LessonAttendance[]> {
  if (lessons.length === 0) return [];
  const lessonIds = lessons.map((l) => l.id);
  const studentIds = Array.from(new Set(lessons.map((l) => l.student_id)));
  const [{ data: attRows }, { data: userRows }] = await Promise.all([
    supabase.from("attendance").select("*").in("lesson_id", lessonIds),
    supabase.from("users").select("*").in("id", studentIds),
  ]);
  const recordByLesson = new Map(((attRows ?? []) as AttendanceRecord[]).map((r) => [r.lesson_id, r]));
  const studentById = new Map(((userRows ?? []) as AppUser[]).map((u) => [u.id, u]));
  return lessons.map((lesson) => ({
    lesson,
    student: studentById.get(lesson.student_id) ?? null,
    record: recordByLesson.get(lesson.id) ?? null,
  }));
}

/** Every lesson (RLS-scoped to the caller, same as schedule/page.tsx — no
 * explicit tutor_id filter needed) whose `lesson_date` falls in the inclusive
 * range [startISO, endISO], each paired with its attendance record (if any)
 * and student. Powers Daily (start=end=one date), Weekly (a week's 7 dates),
 * and Monthly (a month's first/last date) views alike. */
export async function getLessonAttendanceForRange(startISO: string, endISO: string): Promise<LessonAttendance[]> {
  const { data } = await supabase
    .from("lessons")
    .select("*")
    .gte("lesson_date", startISO)
    .lte("lesson_date", endISO)
    .order("lesson_date", { ascending: true })
    .order("start_time", { ascending: true });
  return zipLessonsWithAttendance((data ?? []) as Lesson[]);
}

/** Today's lesson (if any) for each given student id, batched — one round
 * trip, not one per student, for the Student Card grid. Filters
 * `lessons.student_id` directly (the one-to-one FK from
 * 0023_student_based_scheduling.sql) rather than via class membership. */
export async function getBulkTodayAttendance(studentIds: string[]): Promise<Map<string, LessonAttendance>> {
  const result = new Map<string, LessonAttendance>();
  if (studentIds.length === 0) return result;
  const { data } = await supabase
    .from("lessons")
    .select("*")
    .in("student_id", studentIds)
    .eq("lesson_date", todayISO());
  const lessons = (data ?? []) as Lesson[];
  const zipped = await zipLessonsWithAttendance(lessons);
  for (const la of zipped) result.set(la.lesson.student_id, la);
  return result;
}

/** A single lesson's attendance record — for the Teach screen, which
 * already has its one lesson + student loaded and just needs the record. */
export async function getLessonAttendance(lessonId: string): Promise<AttendanceRecord | null> {
  const { data } = await supabase.from("attendance").select("*").eq("lesson_id", lessonId).maybeSingle();
  return (data as AttendanceRecord | null) ?? null;
}

/** Creates today's lesson for a student on the spot, with no Scheduler
 * involvement — the ad-hoc "Start" path on the Student Card. Checks for an
 * existing lesson for this student today first (defensive against a
 * double-click race, or a lesson that already exists via the Scheduler)
 * and reuses it instead of inserting a duplicate. `classId`/`tutorId` must
 * be resolved by the caller from data it already has (students/page.tsx
 * already loads `classes`/`class_members`). `lessonPlanItemId`/
 * `quranSurahKey` — the student's *current* curriculum item, if any (same
 * value `getBulkCurrentLessonItems` computes for the "▶ Launch Lesson"
 * button) — are threaded through so Teach has something to open instead of
 * landing on the "no teaching content attached yet" empty state; mirrors
 * what `recurringSessions.ts`'s generator already does for scheduled
 * sessions. */
export async function startAdHocLesson(params: {
  studentId: string;
  classId: string;
  tutorId: string;
  lessonPlanItemId?: string | null;
  quranSurahKey?: string | null;
}): Promise<{ lesson: Lesson | null; error: string | null }> {
  const today = todayISO();
  const { data: existing } = await supabase
    .from("lessons")
    .select("*")
    .eq("student_id", params.studentId)
    .eq("lesson_date", today)
    .maybeSingle();
  if (existing) return { lesson: existing as Lesson, error: null };

  const { data, error } = await supabase
    .from("lessons")
    .insert({
      student_id: params.studentId,
      class_id: params.classId,
      lesson_plan_item_id: params.lessonPlanItemId ?? null,
      quran_surah_key: params.quranSurahKey ?? null,
      tutor_id: params.tutorId,
      title: "Session",
      lesson_date: today,
      // Started right now, not pre-scheduled — distinct from the
      // Scheduler's default 'scheduled'. Nothing else in the app branches
      // on `status`, so this is free to use without a migration.
      status: "active",
    })
    .select()
    .single();
  if (error) return { lesson: null, error: error.message };
  return { lesson: data as Lesson, error: null };
}

/** The one write path to `attendance`, shared by every surface. Upserts on
 * (lesson_id, student_id) and, on "absent", notifies the student — identical
 * behavior to the attendance page's original setStatus(). */
export async function markAttendance(params: {
  lessonId: string;
  studentId: string;
  status: AttendanceStatus;
  lessonTitle?: string;
}): Promise<{ record: AttendanceRecord | null; error: string | null }> {
  const { lessonId, studentId, status, lessonTitle } = params;
  const { data, error } = await supabase
    .from("attendance")
    .upsert({ lesson_id: lessonId, student_id: studentId, status }, { onConflict: "lesson_id,student_id" })
    .select()
    .single();
  if (error) return { record: null, error: error.message };
  if (status === "absent") {
    await notifyUser({
      userId: studentId,
      type: "attendance_marked",
      title: "Marked absent",
      body: lessonTitle,
      relatedLessonId: lessonId,
    });
  }
  return { record: data as AttendanceRecord, error: null };
}
