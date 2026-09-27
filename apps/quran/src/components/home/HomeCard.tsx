import Link from "next/link";
import { cardStyle } from "./homeRowStyles";

type Props = {
  href: string;
  title: string;
  subtitle: string;
};

/** One card in a home page scroll row (BookmarksPreview, LastReadsRow) — Surah name + Ayah label, linking to that verse in the reader. */
export function HomeCard({ href, title, subtitle }: Props) {
  return (
    <Link href={href} style={cardStyle}>
      <span style={{ fontWeight: 600, color: "var(--color-text)" }}>{title}</span>
      <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>{subtitle}</span>
    </Link>
  );
}
