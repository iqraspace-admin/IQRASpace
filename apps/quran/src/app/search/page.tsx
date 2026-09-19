import { SearchClient } from "@/components/search/SearchClient";
import { canonicalUrl } from "@/lib/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search — IqraSpace Quran",
  description: "Search the English translation across all 114 Surahs.",
  alternates: { canonical: canonicalUrl("/search") },
};

/**
 * Full-text search across the English (Sahih International) translation —
 * matching the IqraSpace Flutter app's own search scope. The index itself
 * is a build-time-generated static JSON file (public/search-index.json,
 * scripts/generate-search-index.mjs), fetched client-side only when this
 * page is visited — no server-side search infra, consistent with this
 * app's static-generation/no-paid-infra architecture (COST.md).
 */
export default function SearchPage() {
  return (
    <div style={{ maxWidth: "var(--content-max-width)", margin: "0 auto", padding: "1.5rem 1rem 3rem" }}>
      <SearchClient />
    </div>
  );
}
