import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSupplicationCategories, getSupplicationCategory, getSupplicationsMeta } from "@/lib/content/supplications";
import { canonicalUrl } from "@/lib/site";
import { ScriptSwitch } from "@/components/supplications/ScriptSwitch";
import { DuaCard } from "@/components/supplications/DuaCard";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

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

  const supplicationsTitle = getSupplicationsMeta().title;

  return (
    <div style={{ maxWidth: "var(--reader-max-width)", margin: "0 auto", padding: "0 1rem 3rem" }}>
      <Breadcrumbs
        trail={[
          { href: "/supplications", label: supplicationsTitle },
          { href: `/supplications/${categoryId}`, label: category.label },
        ]}
      />
      <div className="qr-page-hero" style={{ padding: "1.25rem 0 1.75rem" }}>
        <h1>{category.label}</h1>
        <p className="qr-lead">{category.description}</p>
      </div>

      <ScriptSwitch />

      <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.85rem" }}>
        {category.duas.map((dua, i) => (
          <DuaCard key={i} dua={dua} />
        ))}
      </ol>
    </div>
  );
}
