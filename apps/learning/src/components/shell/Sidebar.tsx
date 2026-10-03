"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { Avatar } from "@/components/ui/Avatar";
import { PLATFORM } from "@/lib/platformLinks";
import { Icon } from "./icons";
import type { NavItem } from "./navConfig";

/**
 * The workspace nav — desktop (≥1024px) only; phones get the same links in
 * SiteHeader's sheet. Restyled from the old dark-green drawer to the
 * website's light language: a white panel with a hairline border, sage pill
 * hover, and the site's gold marker on the current page. It sits *under* the
 * shared header (sticky at --header-h), so the brand and platform links stay
 * in one place instead of being duplicated here.
 */
export function Sidebar({ navItems, onLogout }: { navItems: NavItem[]; onLogout: () => void }) {
  const pathname = usePathname();
  const { profile } = useAuth();

  return (
    <aside
      aria-label="Workspace"
      className="sticky top-[var(--header-h)] hidden h-[calc(100dvh-var(--header-h))] w-[264px] shrink-0 flex-col overflow-y-auto border-r border-line bg-surface lg:flex"
    >
      <nav className="flex-1 px-3 py-5">
        <p className="mb-3 flex items-center gap-2.5 px-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-accent-deep">
          <span className="h-px w-6 bg-accent" />
          Workspace
        </p>
        {navItems.map((item) => {
          // "/admin" is a prefix of its sibling admin routes (users, duas), so match it exactly.
          const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative mb-0.5 flex items-center gap-3 rounded-[var(--radius-m)] px-3 py-2.5 text-[15px] no-underline transition-colors ${
                active
                  ? "bg-primary-tint font-semibold text-heading"
                  : "font-medium text-ink hover:bg-primary-tint hover:text-heading"
              }`}
            >
              {active && <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-accent" />}
              <Icon name={item.icon} className={`h-5 w-5 ${active ? "text-primary" : "text-ink-soft"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line px-4 py-4">
        <div className="mb-3 flex items-center gap-3">
          <Avatar name={profile?.full_name ?? "?"} size={38} />
          <div className="min-w-0">
            <b className="block truncate text-sm font-semibold text-ink">{profile?.full_name ?? "…"}</b>
            <small className="block text-xs capitalize text-ink-soft">{profile?.role}</small>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-2 rounded-[var(--radius-s)] px-2 py-2 text-sm font-medium text-ink-soft hover:bg-primary-tint hover:text-heading"
        >
          <Icon name="logout" className="h-[18px] w-[18px]" />
          Log out
        </button>
        <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 px-2 text-xs text-muted">
          <a href={PLATFORM.privacy} className="hover:text-heading hover:underline">
            Privacy
          </a>
          <a href={PLATFORM.terms} className="hover:text-heading hover:underline">
            Terms
          </a>
          <a href={PLATFORM.contact} className="hover:text-heading hover:underline">
            Contact
          </a>
        </p>
      </div>
    </aside>
  );
}
