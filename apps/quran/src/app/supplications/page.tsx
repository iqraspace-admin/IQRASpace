import Link from "next/link";
import type { Metadata } from "next";
import { getSupplicationCategories, getSupplicationsMeta } from "@/lib/content/supplications";
import { canonicalUrl } from "@/lib/site";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ArrowIcon } from "@/components/ui/ArrowIcon";

export const metadata: Metadata = {
  title: "Supplications — IqraSpace Quran",
  description: "Duas and Athkar for daily life, from the Quran and authentic Hadith.",
  alternates: { canonical: canonicalUrl("/supplications") },
};

/**
 * Supplications (Duas & Athkar) — an additional feature alongside Learning
 * (not a replacement for it), reusing the IqraSpace Flutter app's own
 * "Hisn al-Qalb" dataset (see lib/content/supplications.ts). Category list
 * mirrors the Flutter app's supplications_categories_screen.dart.
 *
 * Structurally rebuilt around the same page-hero + card-grid shell as the
 * Surah list (design spec §3.2/§4.4) — categories are now `.qr-card`
 * tiles with a link-arrow CTA, not a flat bordered list.
 */
export default function SupplicationsPage() {
  const meta = getSupplicationsMeta();
  const categories = getSupplicationCategories();

  return (
    <div className="qr-pattern" style={{ maxWidth: "var(--content-max-width)", margin: "0 auto", padding: "0 1rem 3rem" }}>
      <Breadcrumbs trail={[{ href: "/supplications", label: meta.title }]} />
      <div className="qr-page-hero">
        <div className="qr-eyebrow">Duas &amp; Athkar</div>
        <h1>{meta.title}</h1>
        <p className="qr-lead">{meta.description}</p>
        <details style={{ margin: "1rem 0 0", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
          <summary style={{ cursor: "pointer" }}>About this collection&apos;s sources</summary>
          <p style={{ marginTop: "0.5rem" }}>{meta.sources_note}</p>
          <p>{meta.coverage_note}</p>
        </details>
      </div>

      <div className="qr-card-grid cols-3">
        {categories.map((category) => (
          <Link key={category.id} href={`/supplications/${category.id}`} className="qr-card">
            <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 0.3rem", color: "var(--color-text)" }}>
              {category.label}
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", margin: "0 0 0.4rem" }}>
              {category.description}
            </p>
            <span className="qr-link-arrow">
              {category.duas.length} dua{category.duas.length === 1 ? "" : "s"}
              <ArrowIcon />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
