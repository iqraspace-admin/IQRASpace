import Link from "next/link";
import type { Metadata } from "next";
import { getAllChapters } from "@/lib/content/quran";
import { canonicalUrl } from "@/lib/site";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export const metadata: Metadata = {
  title: "Surahs — IqraSpace Quran",
  description: "Browse every Surah of the Quran.",
  alternates: { canonical: canonicalUrl("/surah") },
};

/**
 * Surah list (Readme.md §10). Server Component: reads the synced content
 * directly, no client fetch. Renders however many Surahs are actually
 * synced (see lib/content/quran.ts's header note) — all 114 as of
 * production API access (QURAN-CONTENT.md §4b); the count below stays
 * driven by `chapters.length` rather than a hardcoded 114 so this page
 * degrades gracefully if that ever isn't the case again (e.g. testing
 * against pre-live).
 *
 * Structurally rebuilt around apps/site's page-hero + card-grid shell
 * (design spec §3.2/§4.4) — a breadcrumb, eyebrow, real H1 and lead, then
 * each Surah as a `.qr-card.row` instead of the old flat bordered-row
 * list with a bare <h1>.
 */
export default function SurahListPage() {
  const chapters = getAllChapters();

  return (
    <div className="qr-pattern" style={{ maxWidth: "var(--content-max-width)", margin: "0 auto", padding: "0 1rem 3rem" }}>
      <Breadcrumbs trail={[{ href: "/surah", label: "Surahs" }]} />
      <div className="qr-page-hero">
        <div className="qr-eyebrow">Browse</div>
        <h1>Surahs</h1>
        <p className="qr-lead">{chapters.length} of 114 Surahs available right now — tap any to start reading.</p>
      </div>

      <ol aria-label="List of Surahs" className="qr-card-list" style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {chapters.map((chapter) => (
          <li key={chapter.id}>
            <Link href={`/surah/${chapter.id}`} className="qr-card row">
              <span
                aria-hidden="true"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "2.25rem",
                  height: "2.25rem",
                  borderRadius: "var(--radius-pill)",
                  background: "var(--color-tint-strong)",
                  color: "var(--color-primary)",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {chapter.id}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ display: "block", fontSize: "1rem" }}>{chapter.name_simple}</strong>
                <span style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                  {chapter.translated_name.name}
                </span>
              </span>
              <span dir="rtl" lang="ar" style={{ fontFamily: "var(--font-arabic)", fontSize: "1.3rem", color: "var(--color-primary)", flexShrink: 0 }}>
                {chapter.name_arabic}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
