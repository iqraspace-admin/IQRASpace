import { getAllChapters } from "@/lib/content/quran";
import { HomeHero } from "@/components/home/HomeHero";
import { ServicesGrid } from "@/components/home/ServicesGrid";
import { QuickLinks } from "@/components/home/QuickLinks";
import { LastReadsRow } from "@/components/home/LastReadsRow";
import { BookmarksPreview } from "@/components/home/BookmarksPreview";
import { HomeCtaBand } from "@/components/home/HomeCtaBand";

/**
 * Home page — structurally rebuilt (not the earlier token/color-only
 * pass) around apps/site's own home page shape (design spec §4.1): a
 * full hero band, a primary "services" card grid, then secondary
 * sections, then a closing CTA band — replacing the old flat stack of
 * same-weight tile grids (a big CTA pill + 3 disconnected grids) with a
 * real visual hierarchy. Reading requires no account (Readme.md §9) — the
 * primary action is always reachable in one click via the hero, whether
 * that's "start reading" (first visit) or "continue reading" (returning
 * visitor, tracked locally — see HomeHero).
 */
export default function Home() {
  const chapters = getAllChapters();

  return (
    <div>
      <HomeHero chapters={chapters} />

      <div
        style={{
          maxWidth: "var(--content-max-width)",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "2.5rem",
          padding: "0 1rem 3rem",
        }}
      >
        <ServicesGrid />
        <QuickLinks chapters={chapters} />
        <LastReadsRow chapters={chapters} />
        <BookmarksPreview chapters={chapters} />
        <HomeCtaBand />
      </div>
    </div>
  );
}
