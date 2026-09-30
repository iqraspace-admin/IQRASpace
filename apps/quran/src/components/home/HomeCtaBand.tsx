"use client";

import { useT } from "@/lib/i18n/useT";
import { ArrowIcon } from "@/components/ui/ArrowIcon";

/**
 * Closing CTA band, matching apps/site's dark-green .cta-band exactly
 * (design spec §3.15) — new section, not present in the old home page at
 * all. Deliberately links back out to the main IqraSpace site rather
 * than anywhere inside this app: it's the one place on this page whose
 * whole point is reinforcing "this Quran Reader is part of the wider
 * IqraSpace platform", echoing apps/site's own closing CTA band, which
 * does the same thing in the opposite direction (linking in).
 */
export function HomeCtaBand() {
  const { t } = useT();

  return (
    <div className="qr-cta-band qr-pattern">
      <h2>{t("homeCtaTitle")}</h2>
      <p>{t("homeCtaBody")}</p>
      <a
        href="https://iqraspace.org"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.75rem 1.5rem",
          borderRadius: "var(--radius-pill)",
          background: "#ffffff",
          color: "var(--color-primary-active)",
          textDecoration: "none",
          fontWeight: 700,
          fontSize: "0.95rem",
        }}
      >
        iqraspace.org
        <ArrowIcon />
      </a>
    </div>
  );
}
