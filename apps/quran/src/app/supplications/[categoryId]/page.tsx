import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSupplicationCategories, getSupplicationCategory } from "@/lib/content/supplications";
import { canonicalUrl } from "@/lib/site";
import { ScriptSwitch, SupplicationsBackLink } from "@/components/supplications/ScriptSwitch";
import { DuaCard } from "@/components/supplications/DuaCard";

export function generateStaticParams() {
  return getSupplicationCategories().map((c) => ({ categoryId: c.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}): Promise<Metadata> {
  const { categoryId } = await params;
  const category = getSupplicationCategory(categoryId);
  if (!category) return {};
  return {
    title: `${category.label} — Supplications — IqraSpace Quran`,
    description: category.description,
    alternates: { canonical: canonicalUrl(`/supplications/${categoryId}`) },
  };
}

export default async function SupplicationCategoryPage({ params }: { params: Promise<{ categoryId: string }> }) {
  const { categoryId } = await params;
  const category = getSupplicationCategory(categoryId);
  if (!category) notFound();

  return (
    <div style={{ maxWidth: "var(--reader-max-width)", margin: "0 auto", padding: "1.5rem 1rem 3rem" }}>
      <SupplicationsBackLink />
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1.4rem", margin: "0.5rem 0 0.25rem" }}>
        {category.label}
      </h1>
      <p style={{ margin: "0 0 1.25rem", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
        {category.description}
      </p>

      <ScriptSwitch />

      <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.85rem" }}>
        {category.duas.map((dua, i) => (
          <DuaCard key={i} dua={dua} />
        ))}
      </ol>
    </div>
  );
}
