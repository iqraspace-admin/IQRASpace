import { getAllChapters } from "@/lib/content/quran";
import { ContinueReadingCard } from "@/components/home/ContinueReadingCard";
import { EntryTiles } from "@/components/home/EntryTiles";
import { QuickLinks } from "@/components/home/QuickLinks";
import { LastReadsRow } from "@/components/home/LastReadsRow";
import { BookmarksPreview } from "@/components/home/BookmarksPreview";

/**
 * Home page. Reading requires no account (Readme.md §9) — the primary
 * action is always reachable in one click, whether that's "start reading"
 * (first visit) or "continue reading" (returning visitor, tracked
 * locally — see ContinueReadingCard).
 *
 * Structure mirrors the IqraSpace Flutter app's own Home screen: the big
 * Continue-Reading CTA, an entry-tile row (Read Quran / Learning), Quick
 * Links, Last Reads, then a Bookmarks preview. No separate big logo/
 * tagline hero above all this any more — SiteHeader now carries the
 * wordmark + tagline persistently on every page, so repeating a full
 * logo image here was pure duplication that pushed real content down
 * the page for no reason.
 */
export default function Home() {
  const chapters = getAllChapters();

  return (
    <div
      style={{
        maxWidth: "var(--content-max-width)",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
        padding: "2rem 1rem 3rem",
      }}
    >
      <ContinueReadingCard chapters={chapters} />
      <EntryTiles />
      <QuickLinks chapters={chapters} />
      <LastReadsRow chapters={chapters} />
      <BookmarksPreview chapters={chapters} />
    </div>
  );
}
