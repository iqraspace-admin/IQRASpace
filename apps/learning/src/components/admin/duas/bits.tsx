import type { ReactNode } from "react";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { cx } from "@/components/ui/classNames";

const STATUS_TONE: Record<string, BadgeTone> = { draft: "muted", review: "amber", published: "green", archived: "red" };

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status] ?? "muted"}>{status}</Badge>;
}

export function Notice({
  kind,
  children,
}: {
  kind: "error" | "warn" | "info" | "success";
  children: ReactNode;
}) {
  const tone = {
    error: "border-danger/40 bg-danger-tint text-danger",
    warn: "border-warning/40 bg-warning-tint text-warning",
    info: "border-line bg-paper-alt text-ink-soft",
    success: "border-success/40 bg-success-tint text-success",
  }[kind];
  return (
    <div role={kind === "error" ? "alert" : undefined} className={cx("mb-3 rounded-[10px] border px-3.5 py-2.5 text-sm", tone)}>
      {children}
    </div>
  );
}

export function MsgList({ items }: { items: string[] }) {
  return (
    <ul className="mt-1 list-disc space-y-0.5 pl-5">
      {items.map((m, i) => (
        <li key={i}>{m}</li>
      ))}
    </ul>
  );
}

export const shortId = (id: string | null | undefined): string => (id ? String(id).slice(0, 8) : "system");

export function fmtDate(s: string | null | undefined): string {
  if (!s) return "";
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? String(s) : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function PageTitle({ title, sub, action }: { title: string; sub?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-semibold">{title}</h1>
        {sub && <div className="mt-0.5 text-sm text-ink-soft">{sub}</div>}
      </div>
      {action}
    </div>
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <p role="status" className="py-6 text-sm text-muted">
      {label}
    </p>
  );
}


export const subtle = "text-xs text-muted";
export const linkCls = "font-semibold text-primary hover:underline";
export const th = "px-3 py-2 text-left text-[0.72rem] font-bold uppercase tracking-[0.05em] text-muted";
export const td = "px-3 py-2.5 align-top text-sm";
