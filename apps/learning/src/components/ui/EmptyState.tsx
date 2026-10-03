import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/shell/icons";

// Callers still pass the emoji they always did; map each to the matching line
// icon so empty states match the rest of the platform (the website uses no emoji).
const ICON_FOR: Record<string, IconName> = {
  "📖": "lessons",
  "🎓": "students",
  "📈": "chart",
  "🗓️": "calendar",
  "📅": "calendar",
  "🎥": "video",
  "📝": "note",
  "📄": "file",
  "🌙": "calendar",
  "🔔": "bell",
  "✅": "check",
  "📚": "classes",
  "🗂️": "users",
};

export function EmptyState({ children, icon }: { children: ReactNode; icon?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center text-[15px] text-ink-soft">
      <span className="grid h-12 w-12 place-items-center rounded-[var(--radius-m)] bg-primary-tint text-primary">
        <Icon name={(icon && ICON_FOR[icon]) || "note"} className="h-6 w-6" />
      </span>
      <p className="max-w-xs">{children}</p>
    </div>
  );
}
