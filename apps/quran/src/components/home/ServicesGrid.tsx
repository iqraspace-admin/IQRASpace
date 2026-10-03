"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/useT";
import { ArrowIcon } from "@/components/ui/ArrowIcon";

/**
 * Structural replacement for EntryTiles.tsx (3 compact icon tiles) — now
 * a 3-up services grid matching apps/site's home services section exactly
 * (design spec §4.1: icon-tile top-left, H3 title, body copy, a trailing
 * link-arrow CTA pinned to the card's bottom, `.card.service`). Adds a
 * dedicated Listen/Audio card (Listening Mode + per-Ayah recitation) that
 * had no entry point on Home before, only inside Settings.
 *
 * "Learning" and "Duas" are plain <a>s, not next/link's <Link>: both
 * apps/learning and apps/site (which now owns the Duas feature) are
 * separate deployments, routed under the same
 * iqraspace.org domain only by apps/site's Multi-Zones rewrite (root
 * CLAUDE.md), so these are real cross-zone navigations (a full page
 * load), not an in-app route <Link> would try to resolve within this
 * app's own basePath and 404 on.
 */
export function ServicesGrid() {
  const { t } = useT();

  return (
    <section aria-labelledby="services-heading">
      <div className="qr-section-head">
        <div className="qr-eyebrow">{t("homeExploreEyebrow")}</div>
        <h2 id="services-heading">{t("homeServicesHeading")}</h2>
      </div>
      <div className="qr-card-grid cols-4">
        <Link href="/surah" className="qr-card">
          <span className="qr-icon-tile">
            <BookIcon />
          </span>
          <h3 style={titleStyle}>{t("entryReadQuranTitle")}</h3>
          <p style={bodyStyle}>{t("entryReadQuranSubtitle")}</p>
          <span className="qr-link-arrow">
            {t("browseSurahs")}
            <ArrowIcon />
          </span>
        </Link>

        <Link href="/surah" className="qr-card">
          <span className="qr-icon-tile">
            <HeadphonesIcon />
          </span>
          <h3 style={titleStyle}>{t("entryAudioTitle")}</h3>
          <p style={bodyStyle}>{t("entryAudioSubtitle")}</p>
          <span className="qr-link-arrow">
            {t("browseSurahs")}
            <ArrowIcon />
          </span>
        </Link>

        <a href="/duas" className="qr-card">
          <span className="qr-icon-tile">
            <HandsIcon />
          </span>
          <h3 style={titleStyle}>{t("entryDuasTitle")}</h3>
          <p style={bodyStyle}>{t("entryDuasSubtitle")}</p>
          <span className="qr-link-arrow">
            {t("entryDuasTitle")}
            <ArrowIcon />
          </span>
        </a>

        <a href="/learning" className="qr-card">
          <span className="qr-icon-tile">
            <CapIcon />
          </span>
          <h3 style={titleStyle}>{t("entryLearningTitle")}</h3>
          <p style={bodyStyle}>{t("entryLearningSubtitle")}</p>
          <span className="qr-link-arrow">
            {t("entryLearningTitle")}
            <ArrowIcon />
          </span>
        </a>

      </div>
    </section>
  );
}

const titleStyle = { fontSize: "1.05rem", fontWeight: 700, margin: "0 0 0.3rem", color: "var(--color-text)" } as const;
const bodyStyle = { fontSize: "0.85rem", color: "var(--color-text-muted)", margin: 0 } as const;

function BookIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" />
      <path d="M4 5.5v16" />
    </svg>
  );
}

function HeadphonesIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
      <rect x="3" y="14" width="4" height="7" rx="1.5" />
      <rect x="17" y="14" width="4" height="7" rx="1.5" />
    </svg>
  );
}

function HandsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 11V8a5 5 0 0 1 10 0v3" />
      <path d="M4 11h16l-1.5 9a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2z" />
    </svg>
  );
}

function CapIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 10 12 5 2 10l10 5 10-5Z" />
      <path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" />
    </svg>
  );
}
