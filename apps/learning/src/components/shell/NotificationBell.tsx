"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { fetchNotifications, markAllNotificationsRead } from "@/lib/notifications";
import { relativeTime } from "@/lib/format";
import type { AppNotification } from "@/lib/types";
import { Icon } from "./icons";

const POLL_MS = 45_000;

export function NotificationBell() {
  const { profile } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!profile) return;
    let active = true;
    async function load() {
      const rows = await fetchNotifications(profile!.id, 8);
      if (active) setItems(rows);
    }
    load();
    const interval = setInterval(load, POLL_MS);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [profile]);

  const unread = items.filter((n) => !n.read).length;

  async function handleMarkAllRead() {
    if (!profile) return;
    await markAllNotificationsRead(profile.id);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        className="relative flex h-11 w-11 items-center justify-center rounded-[var(--radius-m)] border-[1.5px] border-line-strong bg-surface text-heading hover:border-primary"
      >
        <Icon name="bell" className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 min-w-[20px] rounded-full bg-danger px-1.5 py-1 text-center text-[0.65rem] font-bold leading-none text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="fixed inset-x-4 top-[calc(var(--header-h)+8px)] z-50 rounded-[var(--radius-l)] border border-line bg-surface p-4 shadow-[var(--shadow-m)] sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="font-display text-lg text-heading">Notifications</span>
              {unread > 0 && (
                <button onClick={handleMarkAllRead} className="text-sm font-semibold text-primary hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            {items.length === 0 ? (
              <p className="px-1 py-5 text-center text-sm text-muted">Nothing yet.</p>
            ) : (
              <ul className="flex max-h-80 flex-col gap-1 overflow-y-auto">
                {items.map((n) => (
                  <li key={n.id} className={`rounded-[var(--radius-m)] px-3 py-2.5 ${n.read ? "" : "bg-primary-tint"}`}>
                    <b className="block text-sm font-semibold text-ink">{n.title}</b>
                    {n.body && <span className="block text-[0.82rem] text-ink-soft">{n.body}</span>}
                    <span className="text-xs text-muted">{relativeTime(n.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="mt-2 block rounded-[var(--radius-m)] py-2.5 text-center text-sm font-semibold text-primary hover:bg-primary-tint"
            >
              See all notifications
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
