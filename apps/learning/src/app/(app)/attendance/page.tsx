"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/authContext";
import { supabase } from "@/lib/supabaseClient";
import type { AttendanceRecord } from "@/lib/types";
import { getLessonAttendanceForRange, markAttendance, type LessonAttendance } from "@/lib/attendance";
import { isAdminRole } from "@/lib/roles";
import { formatDate, formatDateLong, formatTime, todayISO, weekDates } from "@/lib/format";
import { Card, Eyebrow } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { BadgeTone } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ViewToggle } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { AttendanceControl } from "@/components/attendance/AttendanceControl";
import { AttendanceStatusBadge } from "@/components/attendance/AttendanceStatusBadge";

type ViewMode = "daily" | "weekly" | "monthly";
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TONE_DOT: Record<BadgeTone, string> = {
  green: "bg-success",
  red: "bg-danger",
  amber: "bg-warning",
  teal: "bg-primary",
  muted: "bg-muted",
};

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function firstOfMonth(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function lastOfMonth(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
}

function monthLabel(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

/** 42 cells (6 weeks) covering the month containing `iso`, `null` where the
 * grid is padding out to a full week — kept simple, no "spill into adjacent
 * month" cells, per the "not over-engineered" brief. */
function monthGridDates(iso: string): (string | null)[] {
  const d = new Date(`${iso}T00:00:00`);
  const year = d.getFullYear();
  const month = d.getMonth();
  const startOffset = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array.from({ length: startOffset }, () => null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day).toISOString().slice(0, 10));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** A day's overall attendance color for the Weekly/Monthly at-a-glance dot:
 * any absence wins (needs attention), then any still-unmarked lesson,
 * then any late, else everyone present/excused. */
function daySummaryTone(dayItems: LessonAttendance[]): BadgeTone | null {
  if (dayItems.length === 0) return null;
  if (dayItems.some((it) => it.record?.status === "absent")) return "red";
  if (dayItems.some((it) => !it.record)) return "muted";
  if (dayItems.some((it) => it.record?.status === "late")) return "amber";
  return "green";
}

export default function AttendancePage() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const isTutor = profile?.role === "tutor";
  const canManage = isTutor || isAdminRole(profile?.role);

  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [items, setItems] = useState<LessonAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekPct, setWeekPct] = useState<number | null>(null);

  const today = todayISO();
  const dates = weekDates(new Date(`${selectedDate}T00:00:00`));
  const rangeStart = viewMode === "daily" ? selectedDate : viewMode === "weekly" ? dates[0] : firstOfMonth(selectedDate);
  const rangeEnd = viewMode === "daily" ? selectedDate : viewMode === "weekly" ? dates[6] : lastOfMonth(selectedDate);

  useEffect(() => {
    if (!profile) return;
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    (async () => {
      const rows = await getLessonAttendanceForRange(rangeStart, rangeEnd);
      if (active) {
        setItems(rows);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [profile, rangeStart, rangeEnd]);

  // Overall attendance this week — unchanged from the original page, and
  // independent of whichever browsing view is active.
  useEffect(() => {
    if (!profile || !canManage) return;
    (async () => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { data: lessonRows } = await supabase.from("lessons").select("id");
      const lessonIds = (lessonRows ?? []).map((l) => (l as { id: string }).id);
      if (lessonIds.length === 0) return;
      const { data: attRows } = await supabase
        .from("attendance")
        .select("*")
        .in("lesson_id", lessonIds)
        .gte("marked_at", weekAgo.toISOString());
      const all = (attRows ?? []) as AttendanceRecord[];
      if (all.length > 0) {
        const present = all.filter((a) => a.status === "present" || a.status === "late").length;
        setWeekPct(Math.round((present / all.length) * 100));
      }
    })();
  }, [profile, canManage]);

  async function handleMark(item: LessonAttendance, status: AttendanceRecord["status"]) {
    if (!item.student) return;
    const { record, error } = await markAttendance({
      lessonId: item.lesson.id,
      studentId: item.student.id,
      status,
      lessonTitle: item.lesson.title,
    });
    if (error) {
      showToast(error);
      return;
    }
    setItems((prev) => prev.map((it) => (it.lesson.id === item.lesson.id ? { ...it, record } : it)));
    showToast("Attendance updated");
  }

  function goToDay(date: string) {
    setSelectedDate(date);
    setViewMode("daily");
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Eyebrow>Attendance</Eyebrow>
          <h1 className="text-2xl font-semibold">Mark it once, see it everywhere</h1>
        </div>
        <div className="flex items-center gap-3">
          {weekPct !== null && <StatCard value={`${weekPct}%`} label="Overall attendance this week" />}
          <ViewToggle
            options={[
              { value: "daily", label: "Daily" },
              { value: "weekly", label: "Weekly" },
              { value: "monthly", label: "Monthly" },
            ]}
            active={viewMode}
            onChange={setViewMode}
          />
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : viewMode === "daily" ? (
        <Card>
          <div className="mb-4 flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, -1))}>
              ◀
            </Button>
            <div className="text-center">
              <b className="block text-sm">{formatDateLong(selectedDate)}</b>
              {selectedDate !== today && (
                <button className="text-xs font-semibold text-primary hover:underline" onClick={() => setSelectedDate(today)}>
                  Jump to today
                </button>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
              ▶
            </Button>
          </div>

          {items.length === 0 ? (
            <EmptyState icon="✅">No lessons scheduled for this day.</EmptyState>
          ) : (
            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <div key={item.lesson.id} className="rounded-[var(--radius-m)] border border-line p-3.5">
                  <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <b className="text-sm">{item.student?.full_name ?? item.lesson.title}</b>
                      <div className="text-xs text-muted">{formatTime(item.lesson.start_time) ?? "—"}</div>
                    </div>
                    <AttendanceStatusBadge status={item.record?.status ?? null} />
                  </div>
                  {canManage && item.student && (
                    <AttendanceControl
                      status={item.record?.status ?? null}
                      onChange={(status) => handleMark(item, status)}
                      density="full"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : viewMode === "weekly" ? (
        <Card>
          <div className="mb-4 flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, -7))}>
              ◀ Prev week
            </Button>
            <b className="text-sm">
              {formatDate(dates[0])} – {formatDate(dates[6])}
            </b>
            <Button variant="ghost" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, 7))}>
              Next week ▶
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
            {dates.map((date, i) => {
              const dayItems = items.filter((it) => it.lesson.lesson_date === date);
              const isToday = date === today;
              return (
                <div key={date} className={`min-h-[150px] rounded-[var(--radius-m)] p-2.5 ${isToday ? "bg-primary-tint" : "bg-paper-alt"}`}>
                  <b className="mb-2 block text-[0.78rem] text-ink-soft">
                    {DAY_LABELS[i]} <span className="text-muted">{date.slice(5)}</span>
                  </b>
                  {dayItems.length === 0 ? (
                    <p className="text-[0.68rem] text-muted">No lessons</p>
                  ) : (
                    dayItems.map((item) => (
                      <button
                        key={item.lesson.id}
                        onClick={() => goToDay(date)}
                        className="mb-1.5 flex w-full items-center justify-between gap-1.5 rounded-[8px] border border-l-[3px] border-line border-l-primary bg-surface p-2 text-left text-[0.7rem]"
                      >
                        <span className="truncate text-ink-soft">{item.student?.full_name ?? item.lesson.title}</span>
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${
                            item.record ? TONE_DOT[daySummaryTone([item]) ?? "muted"] : "border border-line"
                          }`}
                        />
                      </button>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        <Card>
          <div className="mb-4 flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedDate(addDays(firstOfMonth(selectedDate), -1))}>
              ◀ Prev month
            </Button>
            <b className="text-sm">{monthLabel(selectedDate)}</b>
            <Button variant="ghost" size="sm" onClick={() => setSelectedDate(addDays(lastOfMonth(selectedDate), 1))}>
              Next month ▶
            </Button>
          </div>
          <div className="mb-2 grid grid-cols-7 gap-1.5 text-center text-[0.68rem] font-bold text-muted">
            {DAY_LABELS.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {monthGridDates(selectedDate).map((date, i) => {
              if (!date) return <div key={`blank-${i}`} />;
              const dayItems = items.filter((it) => it.lesson.lesson_date === date);
              const tone = daySummaryTone(dayItems);
              const isToday = date === today;
              return (
                <button
                  key={date}
                  onClick={() => goToDay(date)}
                  className={`flex min-h-11 flex-col items-center justify-center gap-1 rounded-[var(--radius-m)] p-1.5 text-center transition-colors ${
                    isToday ? "bg-primary-tint" : "bg-paper-alt hover:brightness-95"
                  }`}
                >
                  <span className="text-[0.78rem] font-semibold">{Number(date.slice(-2))}</span>
                  {dayItems.length > 0 && (
                    <span className="flex items-center gap-1">
                      <span className={`h-1.5 w-1.5 rounded-full ${tone ? TONE_DOT[tone] : "bg-line"}`} />
                      <span className="text-[0.62rem] text-muted">{dayItems.length}</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
