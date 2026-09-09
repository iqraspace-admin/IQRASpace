"use client";

import { useState } from "react";
import { STATUSES } from "@/lib/attendance";
import type { AttendanceStatus } from "@/lib/types";
import { Chip } from "@/components/ui/Badge";
import { cx } from "@/components/ui/classNames";
import { AttendanceStatusBadge } from "./AttendanceStatusBadge";

const LABEL: Record<AttendanceStatus, string> = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  excused: "Excused",
};

/** The one attendance-marking control, reused by the Student Card, the
 * Teach screen, and the /attendance page. Presentational only — the caller
 * owns the actual mutation (via `lib/attendance.ts`'s markAttendance) and
 * any optimistic state update; this just renders the interaction and calls
 * `onChange` with whichever status was picked. */
export function AttendanceControl({
  status,
  onChange,
  density = "full",
  disabled,
}: {
  status: AttendanceStatus | null;
  onChange: (status: AttendanceStatus) => void | Promise<void>;
  density?: "full" | "compact";
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  function pick(next: AttendanceStatus) {
    setOpen(false);
    onChange(next);
  }

  if (density === "full") {
    // Large, touch-sized targets (min ~44px tall) that wrap to 2 columns on
    // a phone width instead of a cramped single row.
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STATUSES.map((st) => (
          <button
            key={st}
            disabled={disabled}
            onClick={() => pick(st)}
            className={cx(
              "rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45",
              status === st
                ? "border-primary bg-primary-tint text-primary-deep"
                : "border-line bg-paper-alt text-ink-soft hover:border-primary hover:text-primary"
            )}
          >
            {LABEL[st]}
          </button>
        ))}
      </div>
    );
  }

  // Compact: a small trigger (an explicit "Mark Attendance" CTA when unmarked,
  // otherwise the current status badge) that opens a one-tap popover of all
  // 4 statuses — reaches any status in one tap while staying compact when
  // closed, for tight spaces like the Student Card and the Teach side panel.
  return (
    <div className="relative inline-block">
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="disabled:cursor-not-allowed disabled:opacity-45"
      >
        {status ? (
          <AttendanceStatusBadge status={status} />
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary-tint px-2.5 py-1 text-[0.72rem] font-bold text-primary-deep">
            ✅ Mark Attendance
          </span>
        )}
      </button>
      {open && (
        <>
          {/* Transparent backdrop closes the popover on outside tap, same
              pattern as Modal.tsx's backdrop-click-to-close. */}
          <button
            type="button"
            aria-label="Close"
            className="fixed inset-0 z-40 cursor-default"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
          />
          <div
            className="absolute left-0 top-full z-50 mt-2 flex max-w-[240px] flex-wrap gap-1.5 rounded-[var(--radius-m)] border border-line bg-surface p-2 shadow-[var(--shadow-m)]"
            onClick={(e) => e.stopPropagation()}
          >
            {STATUSES.map((st) => (
              <Chip key={st} active={status === st} onClick={() => pick(st)}>
                {LABEL[st]}
              </Chip>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
