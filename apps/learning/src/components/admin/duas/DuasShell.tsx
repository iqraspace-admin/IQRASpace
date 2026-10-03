"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/authContext";
import { isAdminRole } from "@/lib/roles";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { cx } from "@/components/ui/classNames";
import { DuasUiProvider } from "./DuasUi";
import { Loading } from "./bits";

const LINKS = [
  { href: "/admin/duas", label: "Dashboard", exact: true },
  { href: "/admin/duas/list", label: "All Duas" },
  { href: "/admin/duas/new", label: "New Dua" },
  { href: "/admin/duas/categories", label: "Categories" },
  { href: "/admin/duas/activity", label: "Activity" },
];

/**
 * Gate + chrome for every /admin/duas/* route. Only admin / super_admin may see
 * the Duas admin. This is a UX gate; the real enforcement is RLS on the duas*
 * tables (0025_duas_schema.sql), which returns nothing / 42501 to anyone else.
 */
export function DuasShell({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth();
  const pathname = usePathname();

  if (loading) return <Loading />;

  if (!isAdminRole(profile?.role)) {
    return (
      <Card role="alert" className="mx-auto max-w-lg text-center">
        <h1 className="mb-2 font-display text-xl font-semibold">Duas admin is for admins only</h1>
        <p className="mb-4 text-sm text-ink-soft">
          Managing Duas needs an <b>admin</b> or <b>super admin</b> account. Your account type does not have access.
        </p>
        <LinkButton href="/dashboard" variant="outline">
          Back to dashboard
        </LinkButton>
      </Card>
    );
  }

  return (
    <DuasUiProvider>
      <nav aria-label="Duas admin" className="mb-5 flex flex-wrap gap-1.5 border-b border-line pb-3">
        {LINKS.map((l) => {
          const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={cx(
                "rounded-full px-3.5 py-1.5 text-[0.82rem] font-semibold transition-colors",
                active ? "bg-primary text-white" : "bg-paper-alt text-ink-soft hover:text-primary"
              )}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </DuasUiProvider>
  );
}
