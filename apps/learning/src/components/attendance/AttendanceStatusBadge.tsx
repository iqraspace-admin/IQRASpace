import { STATUS_TONE } from "@/lib/attendance";
import type { AttendanceStatus } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";

/** The one read-only attendance status display, reused by the Student
 * Card, the Teach screen, and every density of the /attendance page —
 * so "present"/"absent"/"late"/"excused" always render identically. */
export function AttendanceStatusBadge({ status }: { status: AttendanceStatus | null }) {
  return <Badge tone={status ? STATUS_TONE[status] : "muted"}>{status ?? "Not marked"}</Badge>;
}
