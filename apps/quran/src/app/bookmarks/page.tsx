import type { Metadata } from "next";
import { getAllChapters } from "@/lib/content/quran";
import { canonicalUrl } from "@/lib/site";
import { BookmarksHeader, BookmarksList } from "@/components/bookmarks/BookmarksList";

export const metadata: Metadata = {
  title: "Bookmarks — IqraSpace Quran",
  description: "Every Ayah you've bookmarked, in one place.",
  alternates: { canonical: canonicalUrl("/bookmarks") },
};

/**
 * Bookmarks list (Readme.md §15's "view bookmarks", previously only a
 * per-ayah star toggle with no aggregate view). Server Component for the
 * chapters lookup — bookmark IDs themselves live in localStorage, so the
 * actual list rendering is client-side (BookmarksList).
 */
export default function BookmarksPage() {
  const chapters = getAllChapters();
  return (
    <div style={{ maxWidth: "var(--content-max-width)", margin: "0 auto", padding: "2rem 1rem" }}>
      <BookmarksHeader />
      <BookmarksList chapters={chapters} />
    </div>
  );
}
