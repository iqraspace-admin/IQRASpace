"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/useT";

type Crumb = { href: string; label: string };

/**
 * Breadcrumb trail for every list/section page (Surah list, Bookmarks,
 * Search) — matching apps/site's .crumbs exactly (design
 * spec §3.9). Always starts at Home; the current page is the last,
 * non-linked item with aria-current="page". Not shown on the home page
 * itself or the Surah/Page reader (those aren't "list pages" and the
 * reader already has its own Prev/Next nav landmark). Client component
 * (not the plain server-renderable markup this could otherwise be) only
 * because "Home" needs to go through useT() like every other UI string
 * in this app — Telugu/Urdu readers shouldn't see one hardcoded English
 * word in an otherwise fully translated interface.
 */
export function Breadcrumbs({ trail }: { trail: Crumb[] }) {
  const { t } = useT();
  return (
    <nav aria-label="Breadcrumb">
      <ol className="qr-crumbs">
        <li>
          <Link href="/">{t("navHome")}</Link>
        </li>
        {trail.map((crumb, i) =>
          i === trail.length - 1 ? (
            <li key={crumb.href}>
              <span aria-current="page">{crumb.label}</span>
            </li>
          ) : (
            <li key={crumb.href}>
              <Link href={crumb.href}>{crumb.label}</Link>
            </li>
          ),
        )}
      </ol>
    </nav>
  );
}
