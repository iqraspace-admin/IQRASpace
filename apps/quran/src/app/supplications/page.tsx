import Link from "next/link";
import type { Metadata } from "next";
import { getSupplicationCategories, getSupplicationsMeta } from "@/lib/content/supplications";
import { canonicalUrl } from "@/lib/site";

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
 */
export default function SupplicationsPage() {
  const meta = getSupplicationsMeta();
  const categories = getSupplicationCategories();

  return (
    <div style={{ maxWidth: "var(--content-max-width)", margin: "0 auto", padding: "1.5rem 1rem 3rem" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1.5rem", margin: "0 0 0.5rem" }}>
        {meta.title}
      </h1>
      <p style={{ margin: "0 0 0.5rem", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>{meta.description}</p>
      <details style={{ margin: "0 0 1.5rem", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
        <summary style={{ cursor: "pointer" }}>About this collection&apos;s sources</summary>
        <p style={{ marginTop: "0.5rem" }}>{meta.sources_note}</p>
        <p>{meta.coverage_note}</p>
      </details>

      <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.65rem" }}>
        {categories.map((category) => (
          <li key={category.id}>
            <Link
              href={`/supplications/${category.id}`}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.2rem",
                padding: "0.9rem 1rem",
                borderRadius: "0.75rem",
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                color: "var(--color-text)",
                textDecoration: "none",
              }}
            >
              <span style={{ fontWeight: 600 }}>{category.label}</span>
              <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>{category.description}</span>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                {category.duas.length} dua{category.duas.length === 1 ? "" : "s"}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
